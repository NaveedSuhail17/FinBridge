import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  HttpException,
  HttpStatus,
  Inject,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import Redis from 'ioredis';
import { PlatformUser } from '../database/entities/platform-user.entity';
import { Tenant } from '../database/entities/tenant.entity';
import { Role } from '../database/entities/role.entity';
import { UserTenant } from '../database/entities/user-tenant.entity';
import { TenantType } from '../database/entities/enums';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AcceptInviteDto } from './dto/accept-invite.dto';
import { REDIS_CLIENT } from '../redis/redis.constants';

const BCRYPT_ROUNDS = 10;
const REFRESH_TTL_SECONDS = 7 * 24 * 60 * 60;
const LOCKOUT_TTL_SECONDS = 15 * 60;
const MAX_FAILED_ATTEMPTS = 5;

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(PlatformUser)
    private readonly userRepo: Repository<PlatformUser>,
    @InjectRepository(Tenant)
    private readonly tenantRepo: Repository<Tenant>,
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
    @InjectRepository(UserTenant)
    private readonly userTenantRepo: Repository<UserTenant>,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async validateUser(email: string, password: string): Promise<PlatformUser | null> {
    const lockKey = `auth:lock:${email.toLowerCase()}`;
    const isLocked = await this.redis.exists(lockKey);
    if (isLocked) {
      throw new HttpException(
        'Account temporarily locked due to too many failed attempts. Try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const user = await this.userRepo.findOneBy({ email: email.toLowerCase(), isActive: true });
    if (!user) {
      await this.incrementFailedAttempts(email);
      return null;
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      await this.incrementFailedAttempts(email);
      return null;
    }

    await this.redis.del(`auth:fail:${email.toLowerCase()}`);
    return user;
  }

  async register(dto: RegisterDto) {
    const existing = await this.userRepo.findOneBy({ email: dto.email.toLowerCase() });
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = await this.userRepo.save(
      this.userRepo.create({
        email: dto.email.toLowerCase(),
        passwordHash,
        name: dto.name,
      }),
    );

    let tenant: Tenant;
    let role: Role;

    if (dto.tenantId) {
      const found = await this.tenantRepo.findOneBy({ id: dto.tenantId, isActive: true });
      if (!found) throw new NotFoundException('Tenant not found');
      tenant = found;
    } else {
      const platform = await this.tenantRepo.findOneBy({ type: TenantType.PLATFORM });
      if (!platform) throw new NotFoundException('Platform tenant not configured');
      tenant = platform;
    }

    const roleName = dto.roleName ?? 'COMPANY_USER';
    const foundRole = await this.roleRepo.findOneBy({ name: roleName });
    if (!foundRole) throw new NotFoundException(`Role ${roleName} not found`);
    role = foundRole;

    await this.userTenantRepo.save(
      this.userTenantRepo.create({ userId: user.id, tenantId: tenant.id, roleId: role.id }),
    );

    return this.buildTokens(user, tenant, role);
  }

  async login(dto: LoginDto) {
    const user = await this.validateUser(dto.email, dto.password);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const membership = await this.resolveUserTenant(user.id, dto.tenantId);
    if (!membership) throw new UnauthorizedException('No tenant membership found');

    const role = await this.roleRepo.findOneBy({ id: membership.roleId });
    if (!role) throw new UnauthorizedException('Role not found');

    const tenant = await this.tenantRepo.findOneBy({ id: membership.tenantId });
    if (!tenant) throw new UnauthorizedException('Tenant not found');

    return this.buildTokens(user, tenant, role);
  }

  async refresh(refreshToken: string) {
    const userId = await this.redis.get(`refresh:${refreshToken}`);
    if (!userId) throw new UnauthorizedException('Invalid or expired refresh token');

    const user = await this.userRepo.findOneBy({ id: userId, isActive: true });
    if (!user) throw new UnauthorizedException('User not found');

    const membership = await this.resolveUserTenant(user.id, undefined);
    if (!membership) throw new UnauthorizedException('No tenant membership found');

    const role = await this.roleRepo.findOneBy({ id: membership.roleId });
    const tenant = await this.tenantRepo.findOneBy({ id: membership.tenantId });
    if (!role || !tenant) throw new UnauthorizedException('Tenant or role not found');

    await this.redis.del(`refresh:${refreshToken}`);
    return this.buildTokens(user, tenant, role);
  }

  async logout(refreshToken: string): Promise<void> {
    await this.redis.del(`refresh:${refreshToken}`);
  }

  async acceptInvite(dto: AcceptInviteDto) {
    const inviteData = await this.redis.get(`invite:${dto.token}`);
    if (!inviteData) throw new BadRequestException('Invalid or expired invite token');

    const invite = JSON.parse(inviteData) as {
      email: string;
      tenantId: string;
      roleName: string;
    };

    const existing = await this.userRepo.findOneBy({ email: invite.email.toLowerCase() });
    if (existing) throw new ConflictException('User account already exists for this email');

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = await this.userRepo.save(
      this.userRepo.create({
        email: invite.email.toLowerCase(),
        passwordHash,
        name: dto.name,
      }),
    );

    const tenant = await this.tenantRepo.findOneBy({ id: invite.tenantId, isActive: true });
    if (!tenant) throw new NotFoundException('Tenant not found');

    const role = await this.roleRepo.findOneBy({ name: invite.roleName });
    if (!role) throw new NotFoundException(`Role ${invite.roleName} not found`);

    await this.userTenantRepo.save(
      this.userTenantRepo.create({ userId: user.id, tenantId: tenant.id, roleId: role.id }),
    );

    await this.redis.del(`invite:${dto.token}`);
    return this.buildTokens(user, tenant, role);
  }

  private async resolveUserTenant(
    userId: string,
    preferredTenantId: string | undefined,
  ): Promise<UserTenant | null> {
    if (preferredTenantId) {
      return this.userTenantRepo.findOneBy({ userId, tenantId: preferredTenantId });
    }
    const memberships = await this.userTenantRepo.find({
      where: { userId },
      order: { createdAt: 'ASC' },
    });
    return memberships[0] ?? null;
  }

  private async buildTokens(user: PlatformUser, tenant: Tenant, role: Role) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      tenantId: tenant.id,
      roleId: role.id,
      roleName: role.name,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = uuidv4();

    await this.redis.setex(`refresh:${refreshToken}`, REFRESH_TTL_SECONDS, user.id);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        tenantId: tenant.id,
        tenantName: tenant.name,
        roleId: role.id,
        roleName: role.name,
      },
    };
  }

  private async incrementFailedAttempts(email: string): Promise<void> {
    const failKey = `auth:fail:${email.toLowerCase()}`;
    const lockKey = `auth:lock:${email.toLowerCase()}`;

    const attempts = await this.redis.incr(failKey);
    await this.redis.expire(failKey, LOCKOUT_TTL_SECONDS);

    if (attempts >= MAX_FAILED_ATTEMPTS) {
      await this.redis.setex(lockKey, LOCKOUT_TTL_SECONDS, '1');
      await this.redis.del(failKey);
    }
  }
}

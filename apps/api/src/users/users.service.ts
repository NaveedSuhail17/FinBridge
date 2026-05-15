import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { PlatformUser } from '../database/entities/platform-user.entity';
import { UserTenant } from '../database/entities/user-tenant.entity';
import { Tenant } from '../database/entities/tenant.entity';
import { Role } from '../database/entities/role.entity';
import { UpdateUserDto } from './dto/update-user.dto';

const BCRYPT_ROUNDS = 10;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(PlatformUser)
    private readonly userRepo: Repository<PlatformUser>,
    @InjectRepository(UserTenant)
    private readonly userTenantRepo: Repository<UserTenant>,
    @InjectRepository(Tenant)
    private readonly tenantRepo: Repository<Tenant>,
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
  ) {}

  async findById(id: string): Promise<PlatformUser> {
    const user = await this.userRepo.findOneBy({ id, isActive: true });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findByEmail(email: string): Promise<PlatformUser | null> {
    return this.userRepo.findOneBy({ email: email.toLowerCase(), isActive: true });
  }

  async getProfile(userId: string, tenantId: string) {
    const user = await this.findById(userId);
    const membership = await this.userTenantRepo.findOne({
      where: { userId, tenantId },
      relations: ['role'],
    });

    const tenant = await this.tenantRepo.findOneBy({ id: tenantId });

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      isActive: user.isActive,
      createdAt: user.createdAt,
      tenant: tenant ? { id: tenant.id, name: tenant.name, type: tenant.type } : null,
      role: membership?.role ? { id: membership.role.id, name: membership.role.name } : null,
    };
  }

  async update(userId: string, dto: UpdateUserDto): Promise<PlatformUser> {
    const user = await this.findById(userId);

    if (dto.newPassword) {
      if (!dto.currentPassword) {
        throw new BadRequestException('Current password required to set a new password');
      }
      const valid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
      if (!valid) throw new UnauthorizedException('Current password is incorrect');
      user.passwordHash = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);
    }

    if (dto.name) user.name = dto.name;

    return this.userRepo.save(user);
  }
}

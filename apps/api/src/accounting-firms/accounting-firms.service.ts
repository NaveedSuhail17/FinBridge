import { Injectable, NotFoundException, ConflictException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import Redis from 'ioredis';
import { AccountingFirm } from '../database/entities/accounting-firm.entity';
import { Tenant } from '../database/entities/tenant.entity';
import { TenantType, AuditAction } from '../database/entities/enums';
import { CreateAccountingFirmDto } from './dto/create-accounting-firm.dto';
import { UpdateAccountingFirmDto } from './dto/update-accounting-firm.dto';
import { InviteAccountantDto } from './dto/invite-accountant.dto';
import { AuditLogService } from '../audit/audit.service';
import { REDIS_CLIENT } from '../redis/redis.constants';

const INVITE_TTL_SECONDS = 7 * 24 * 60 * 60;

@Injectable()
export class AccountingFirmsService {
  constructor(
    @InjectRepository(AccountingFirm)
    private readonly firmRepo: Repository<AccountingFirm>,
    @InjectRepository(Tenant)
    private readonly tenantRepo: Repository<Tenant>,
    private readonly auditService: AuditLogService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async findAll(tenantId: string | null): Promise<AccountingFirm[]> {
    if (!tenantId) return this.firmRepo.find({ order: { createdAt: 'DESC' } });
    return this.firmRepo.findBy({ tenantId });
  }

  async findOne(id: string): Promise<AccountingFirm> {
    const firm = await this.firmRepo.findOneBy({ id });
    if (!firm) throw new NotFoundException('Accounting firm not found');
    return firm;
  }

  async create(
    dto: CreateAccountingFirmDto,
    parentTenantId: string,
    actorId: string,
    actorTenantId: string,
  ): Promise<AccountingFirm> {
    const tenant = await this.tenantRepo.save(
      this.tenantRepo.create({
        type: TenantType.ACCOUNTING_FIRM,
        name: dto.name,
        parentTenantId,
      }),
    );

    const existing = await this.firmRepo.findOneBy({ tenantId: tenant.id });
    if (existing) throw new ConflictException('Firm already exists for this tenant');

    const firm = await this.firmRepo.save(
      this.firmRepo.create({
        tenantId: tenant.id,
        name: dto.name,
        contactEmail: dto.contactEmail,
        gstNumber: dto.gstNumber ?? null,
        contactPhone: dto.contactPhone ?? null,
        address: dto.address ?? null,
      }),
    );

    await this.auditService.log({
      tenantId: actorTenantId,
      userId: actorId,
      entityType: 'AccountingFirm',
      entityId: firm.id,
      action: AuditAction.CREATE,
    });

    return firm;
  }

  async update(
    id: string,
    dto: UpdateAccountingFirmDto,
    actorId: string,
    actorTenantId: string,
  ): Promise<AccountingFirm> {
    const firm = await this.findOne(id);
    Object.assign(firm, dto);
    const saved = await this.firmRepo.save(firm);

    await this.auditService.log({
      tenantId: actorTenantId,
      userId: actorId,
      entityType: 'AccountingFirm',
      entityId: id,
      action: AuditAction.UPDATE,
      changes: dto as Record<string, unknown>,
    });

    return saved;
  }

  async inviteAccountant(
    firmId: string,
    dto: InviteAccountantDto,
    actorId: string,
    actorTenantId: string,
  ): Promise<{ inviteToken: string }> {
    const firm = await this.findOne(firmId);

    const token = uuidv4();
    const payload = JSON.stringify({
      email: dto.email,
      tenantId: firm.tenantId,
      roleName: 'ACCOUNTANT',
    });

    await this.redis.setex(`invite:${token}`, INVITE_TTL_SECONDS, payload);

    await this.auditService.log({
      tenantId: actorTenantId,
      userId: actorId,
      entityType: 'AccountingFirm',
      entityId: firmId,
      action: AuditAction.CREATE,
      changes: { invitedEmail: dto.email } as Record<string, unknown>,
    });

    return { inviteToken: token };
  }
}

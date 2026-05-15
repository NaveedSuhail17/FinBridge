import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from '../database/entities/tenant.entity';
import { TenantType } from '../database/entities/enums';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { AuditLogService } from '../audit/audit.service';
import { AuditAction } from '../database/entities/enums';

@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepo: Repository<Tenant>,
    private readonly auditService: AuditLogService,
  ) {}

  async findAll(requestingTenantId: string | null): Promise<Tenant[]> {
    if (!requestingTenantId) return this.tenantRepo.find({ order: { createdAt: 'DESC' } });
    return this.tenantRepo.find({
      where: [{ id: requestingTenantId }, { parentTenantId: requestingTenantId }],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Tenant> {
    const tenant = await this.tenantRepo.findOneBy({ id });
    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }

  async create(dto: CreateTenantDto, actorId: string, actorTenantId: string): Promise<Tenant> {
    if (dto.parentTenantId) {
      const parent = await this.tenantRepo.findOneBy({ id: dto.parentTenantId });
      if (!parent) throw new NotFoundException('Parent tenant not found');
      this.validateHierarchy(parent.type, dto.type);
    } else if (dto.type !== TenantType.PLATFORM) {
      throw new BadRequestException('Non-PLATFORM tenants must have a parent tenant');
    }

    const tenant = await this.tenantRepo.save(
      this.tenantRepo.create({
        type: dto.type,
        name: dto.name,
        parentTenantId: dto.parentTenantId ?? null,
      }),
    );

    await this.auditService.log({
      tenantId: actorTenantId,
      userId: actorId,
      entityType: 'Tenant',
      entityId: tenant.id,
      action: AuditAction.CREATE,
    });

    return tenant;
  }

  async update(
    id: string,
    dto: UpdateTenantDto,
    actorId: string,
    actorTenantId: string,
  ): Promise<Tenant> {
    const tenant = await this.findOne(id);
    Object.assign(tenant, dto);
    const saved = await this.tenantRepo.save(tenant);

    await this.auditService.log({
      tenantId: actorTenantId,
      userId: actorId,
      entityType: 'Tenant',
      entityId: id,
      action: AuditAction.UPDATE,
      changes: dto as Record<string, unknown>,
    });

    return saved;
  }

  async deactivate(id: string, actorId: string, actorTenantId: string): Promise<void> {
    const tenant = await this.findOne(id);
    if (tenant.type === TenantType.PLATFORM) {
      throw new ForbiddenException('Cannot deactivate the platform tenant');
    }
    tenant.isActive = false;
    await this.tenantRepo.save(tenant);

    await this.auditService.log({
      tenantId: actorTenantId,
      userId: actorId,
      entityType: 'Tenant',
      entityId: id,
      action: AuditAction.DELETE,
    });
  }

  private validateHierarchy(parentType: TenantType, childType: TenantType): void {
    const allowed: Record<TenantType, TenantType[]> = {
      [TenantType.PLATFORM]: [TenantType.ACCOUNTING_FIRM],
      [TenantType.ACCOUNTING_FIRM]: [TenantType.COMPANY],
      [TenantType.COMPANY]: [],
    };
    if (!allowed[parentType].includes(childType)) {
      throw new BadRequestException(`Cannot create ${childType} tenant under ${parentType} tenant`);
    }
  }
}

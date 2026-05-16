import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, FindOptionsWhere } from 'typeorm';
import { AuditLog } from '../database/entities/audit-log.entity';
import { LogAuditEventDto } from './dto/log-audit-event.dto';
import { QueryAuditLogsDto } from './dto/query-audit-logs.dto';

@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
  ) {}

  async log(event: LogAuditEventDto): Promise<void> {
    try {
      await this.auditRepo.save(
        this.auditRepo.create({
          tenantId: event.tenantId,
          userId: event.userId,
          entityType: event.entityType,
          entityId: event.entityId,
          action: event.action,
          changes: event.changes ?? null,
          ipAddress: event.ipAddress ?? null,
        }),
      );
    } catch {
      // Audit log failures must not break the calling flow
    }
  }

  async query(
    tenantId: string | null,
    filters: QueryAuditLogsDto,
  ): Promise<{ data: AuditLog[]; total: number }> {
    const where: FindOptionsWhere<AuditLog> = {};

    if (tenantId) where.tenantId = tenantId;
    if (filters.userId) where.userId = filters.userId;
    if (filters.entityType) where.entityType = filters.entityType;
    if (filters.action) where.action = filters.action;
    if (filters.dateFrom && filters.dateTo) {
      where.createdAt = Between(new Date(filters.dateFrom), new Date(filters.dateTo));
    }

    const page = filters.page ?? 1;
    const limit = filters.limit ?? 50;

    const [data, total] = await this.auditRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total };
  }

  async exportCsv(tenantId: string | null, filters: QueryAuditLogsDto): Promise<string> {
    const { data } = await this.query(tenantId, { ...filters, limit: 10000, page: 1 });

    const csv = (v: unknown) => '"' + String(v ?? '').replace(/"/g, '""') + '"';
    const header = 'id,tenant_id,user_id,entity_type,entity_id,action,ip_address,created_at\n';
    const rows = data
      .map((r) =>
        [
          csv(r.id),
          csv(r.tenantId),
          csv(r.userId),
          csv(r.entityType),
          csv(r.entityId),
          csv(r.action),
          csv(r.ipAddress),
          csv(r.createdAt.toISOString()),
        ].join(','),
      )
      .join('\n');

    return header + rows;
  }
}

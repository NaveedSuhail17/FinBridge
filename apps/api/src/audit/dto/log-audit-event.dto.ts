import { AuditAction } from '../../database/entities/enums';

export interface LogAuditEventDto {
  tenantId: string;
  userId: string;
  entityType: string;
  entityId: string;
  action: AuditAction;
  changes?: Record<string, unknown> | null;
  ipAddress?: string | null;
}

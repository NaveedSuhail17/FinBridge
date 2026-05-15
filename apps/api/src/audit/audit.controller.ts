import { Controller, Get, Query, Res, UseGuards, ForbiddenException } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { AuditLogService } from './audit.service';
import { QueryAuditLogsDto } from './dto/query-audit-logs.dto';

@ApiTags('Audit Logs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('audit-logs')
export class AuditController {
  constructor(private readonly auditService: AuditLogService) {}

  @Get()
  @ApiOperation({ summary: 'Query audit logs (PLATFORM_ADMIN sees all tenants)' })
  async findAll(@Query() filters: QueryAuditLogsDto, @CurrentUser() user: AuthenticatedUser) {
    const tenantId = user.roleName === 'PLATFORM_ADMIN' ? null : user.tenantId;
    const { data, total } = await this.auditService.query(tenantId, filters);
    return {
      success: true,
      data,
      meta: { total, page: filters.page ?? 1, limit: filters.limit ?? 50 },
    };
  }

  @Get('export')
  @ApiOperation({ summary: 'Export audit logs as CSV (PLATFORM_ADMIN only)' })
  async exportCsv(
    @Query() filters: QueryAuditLogsDto,
    @CurrentUser() user: AuthenticatedUser,
    @Res() res: Response,
  ) {
    if (user.roleName !== 'PLATFORM_ADMIN') {
      throw new ForbiddenException('Only platform admins can export audit logs');
    }
    const csv = await this.auditService.exportCsv(null, filters);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="audit-logs.csv"');
    res.send(csv);
  }
}

import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { BankStatementsService } from './bank-statements.service';

@ApiTags('Bank Statements')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('bank-statements')
export class BankStatementsController {
  constructor(private readonly service: BankStatementsService) {}

  @Get()
  @ApiOperation({ summary: 'List bank statement records for current tenant' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'period_start', required: false })
  @ApiQuery({ name: 'period_end', required: false })
  async findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('period_start') periodStart?: string,
    @Query('period_end') periodEnd?: string,
  ) {
    const { data, total } = await this.service.findAll(
      user.tenantId,
      { periodStart, periodEnd },
      Number(page ?? 1),
      Number(limit ?? 20),
    );
    return {
      success: true,
      data,
      meta: { total, page: Number(page ?? 1), limit: Number(limit ?? 20) },
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single bank statement record with transaction rows' })
  async findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return { success: true, data: await this.service.findOne(id, user.tenantId) };
  }

  @Get(':id/categorized')
  @ApiOperation({
    summary: 'Get bank statement record with AI-suggested categories per transaction row',
  })
  async findOneCategorized(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return { success: true, data: await this.service.findOne(id, user.tenantId) };
  }
}

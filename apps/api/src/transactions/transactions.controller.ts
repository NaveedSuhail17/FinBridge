import { Controller, Get, Patch, Body, Param, Query, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { TransactionsService } from './transactions.service';
import { QueryTransactionsDto } from './dto/query-transactions.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

@ApiTags('Transactions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  @ApiOperation({ summary: 'List transactions with filters, pagination and sort' })
  async findAll(@Query() filters: QueryTransactionsDto, @CurrentUser() user: AuthenticatedUser) {
    const { data, total } = await this.transactionsService.findAll(user.tenantId, filters);
    return { success: true, data, meta: { total, page: filters.page, limit: filters.limit } };
  }

  @Get('export')
  @ApiOperation({ summary: 'Export transactions as CSV' })
  async exportCsv(
    @Query() filters: QueryTransactionsDto,
    @CurrentUser() user: AuthenticatedUser,
    @Res() res: Response,
  ) {
    const csv = await this.transactionsService.exportCsv(user.tenantId, filters);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="transactions.csv"');
    res.send(csv);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get transaction by ID' })
  async findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return { success: true, data: await this.transactionsService.findOne(id, user.tenantId) };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Post-approval edit of transaction (payment head, notes)' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTransactionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.transactionsService.update(id, dto, user.tenantId, user.id);
    return { success: true, data };
  }
}

import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { PaymentRecordsService } from './payment-records.service';

@ApiTags('Payment Records')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('payment-records')
export class PaymentRecordsController {
  constructor(private readonly service: PaymentRecordsService) {}

  @Get()
  @ApiOperation({ summary: 'List payment records for current tenant' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'date_from', required: false })
  @ApiQuery({ name: 'date_to', required: false })
  @ApiQuery({ name: 'payment_mode', required: false })
  async findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('date_from') dateFrom?: string,
    @Query('date_to') dateTo?: string,
    @Query('payment_mode') paymentMode?: string,
  ) {
    const { data, total } = await this.service.findAll(
      user.tenantId,
      { dateFrom, dateTo, paymentMode },
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
  @ApiOperation({ summary: 'Get a single payment record' })
  async findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return { success: true, data: await this.service.findOne(id, user.tenantId) };
  }
}

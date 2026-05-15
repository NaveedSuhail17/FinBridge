import { Controller, Get, Post, Patch, Delete, Body, Param, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { PaymentHeadsService } from './payment-heads.service';
import { CreatePaymentHeadDto } from './dto/create-payment-head.dto';
import { UpdatePaymentHeadDto } from './dto/update-payment-head.dto';
import { BusinessType } from '../database/entities/enums';

@ApiTags('Payment Heads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('payment-heads')
export class PaymentHeadsController {
  constructor(private readonly service: PaymentHeadsService) {}

  @Get()
  @ApiOperation({ summary: 'List payment heads for current tenant' })
  async findAll(@CurrentUser() user: AuthenticatedUser) {
    return { success: true, data: await this.service.findAll(user.tenantId) };
  }

  @Get('with-subheads')
  @ApiOperation({ summary: 'Payment heads with nested sub-heads' })
  async findWithSubHeads(@CurrentUser() user: AuthenticatedUser) {
    return { success: true, data: await this.service.findWithSubHeads(user.tenantId) };
  }

  @Get('export')
  @ApiOperation({ summary: 'Export payment head hierarchy as CSV' })
  async exportCsv(@CurrentUser() user: AuthenticatedUser, @Res() res: Response) {
    const csv = await this.service.exportCsv(user.tenantId);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="payment-heads.csv"');
    res.send(csv);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payment head by ID' })
  async findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return { success: true, data: await this.service.findOne(id, user.tenantId) };
  }

  @Post()
  @ApiOperation({ summary: 'Create a payment head' })
  async create(@Body() dto: CreatePaymentHeadDto, @CurrentUser() user: AuthenticatedUser) {
    return { success: true, data: await this.service.create(dto, user.tenantId, user.id) };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a payment head' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePaymentHeadDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return { success: true, data: await this.service.update(id, dto, user.tenantId, user.id) };
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a payment head (fails if sub-heads or transactions reference it)',
  })
  async remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    await this.service.remove(id, user.tenantId, user.id);
    return { success: true, message: 'Payment head deleted' };
  }
}

@ApiTags('Templates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('templates/business-types')
export class BusinessTypeTemplateController {
  constructor(private readonly service: PaymentHeadsService) {}

  @Get(':type')
  @ApiOperation({ summary: 'Get default payment head tree for a business type' })
  async getTemplate(@Param('type') type: BusinessType) {
    return { success: true, data: await this.service.getTemplate(type) };
  }
}

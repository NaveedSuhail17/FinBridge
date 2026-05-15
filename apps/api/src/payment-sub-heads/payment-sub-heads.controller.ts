import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { PaymentSubHeadsService } from './payment-sub-heads.service';
import { CreatePaymentSubHeadDto } from './dto/create-payment-sub-head.dto';
import { UpdatePaymentSubHeadDto } from './dto/update-payment-sub-head.dto';

@ApiTags('Payment Sub-Heads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('payment-sub-heads')
export class PaymentSubHeadsController {
  constructor(private readonly service: PaymentSubHeadsService) {}

  @Get()
  @ApiOperation({ summary: 'List payment sub-heads (optional filter by paymentHeadId)' })
  @ApiQuery({ name: 'paymentHeadId', required: false })
  async findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('paymentHeadId') paymentHeadId?: string,
  ) {
    return { success: true, data: await this.service.findAll(user.tenantId, paymentHeadId) };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payment sub-head by ID' })
  async findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return { success: true, data: await this.service.findOne(id, user.tenantId) };
  }

  @Post()
  @ApiOperation({ summary: 'Create a payment sub-head' })
  async create(@Body() dto: CreatePaymentSubHeadDto, @CurrentUser() user: AuthenticatedUser) {
    return { success: true, data: await this.service.create(dto, user.tenantId, user.id) };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a payment sub-head' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePaymentSubHeadDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return { success: true, data: await this.service.update(id, dto, user.tenantId, user.id) };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a payment sub-head' })
  async remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    await this.service.remove(id, user.tenantId, user.id);
    return { success: true, message: 'Payment sub-head deleted' };
  }
}

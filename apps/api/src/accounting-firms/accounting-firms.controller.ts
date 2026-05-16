import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/authorization/roles.guard';
import { Roles } from '../common/authorization/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { AccountingFirmsService } from './accounting-firms.service';
import { CreateAccountingFirmDto } from './dto/create-accounting-firm.dto';
import { UpdateAccountingFirmDto } from './dto/update-accounting-firm.dto';
import { InviteAccountantDto } from './dto/invite-accountant.dto';

@ApiTags('Accounting Firms')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('accounting-firms')
export class AccountingFirmsController {
  constructor(private readonly firmsService: AccountingFirmsService) {}

  @Get()
  @ApiOperation({ summary: 'List accounting firms' })
  async findAll(@CurrentUser() user: AuthenticatedUser) {
    const tenantId = user.roleName === 'PLATFORM_ADMIN' ? null : user.tenantId;
    return { success: true, data: await this.firmsService.findAll(tenantId) };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get accounting firm by ID' })
  async findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    const actorTenantId = user.roleName === 'PLATFORM_ADMIN' ? null : user.tenantId;
    return { success: true, data: await this.firmsService.findOne(id, actorTenantId) };
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('PLATFORM_ADMIN')
  @ApiOperation({ summary: 'Create accounting firm (PLATFORM_ADMIN only)' })
  async create(@Body() dto: CreateAccountingFirmDto, @CurrentUser() user: AuthenticatedUser) {
    const data = await this.firmsService.create(dto, user.tenantId, user.id, user.tenantId);
    return { success: true, data };
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('PLATFORM_ADMIN', 'ACCOUNTING_FIRM_ADMIN')
  @ApiOperation({ summary: 'Update accounting firm (PLATFORM_ADMIN or ACCOUNTING_FIRM_ADMIN)' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateAccountingFirmDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.firmsService.update(id, dto, user.id, user.tenantId);
    return { success: true, data };
  }

  @Post(':id/invite-accountant')
  @UseGuards(RolesGuard)
  @Roles('PLATFORM_ADMIN', 'ACCOUNTING_FIRM_ADMIN')
  @ApiOperation({ summary: 'Generate invite token for an accountant' })
  async inviteAccountant(
    @Param('id') id: string,
    @Body() dto: InviteAccountantDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.firmsService.inviteAccountant(id, dto, user.id, user.tenantId);
    return { success: true, data };
  }
}

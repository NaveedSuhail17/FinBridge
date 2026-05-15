import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/authorization/roles.guard';
import { Roles } from '../common/authorization/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';

@ApiTags('Tenants')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get()
  @ApiOperation({ summary: 'List tenants (PLATFORM_ADMIN sees all)' })
  async findAll(@CurrentUser() user: AuthenticatedUser) {
    const tenantId = user.roleName === 'PLATFORM_ADMIN' ? null : user.tenantId;
    const data = await this.tenantsService.findAll(tenantId);
    return { success: true, data };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a tenant by ID' })
  async findOne(@Param('id') id: string) {
    return { success: true, data: await this.tenantsService.findOne(id) };
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('PLATFORM_ADMIN')
  @ApiOperation({ summary: 'Create a tenant (PLATFORM_ADMIN only)' })
  async create(@Body() dto: CreateTenantDto, @CurrentUser() user: AuthenticatedUser) {
    const data = await this.tenantsService.create(dto, user.id, user.tenantId);
    return { success: true, data };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a tenant' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTenantDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.tenantsService.update(id, dto, user.id, user.tenantId);
    return { success: true, data };
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('PLATFORM_ADMIN')
  @ApiOperation({ summary: 'Deactivate a tenant (soft delete)' })
  async deactivate(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    await this.tenantsService.deactivate(id, user.id, user.tenantId);
    return { success: true, message: 'Tenant deactivated' };
  }
}

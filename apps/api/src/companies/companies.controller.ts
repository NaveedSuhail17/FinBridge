import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/authorization/roles.guard';
import { Roles } from '../common/authorization/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

@ApiTags('Companies')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get()
  @ApiOperation({ summary: 'List companies' })
  async findAll(@CurrentUser() user: AuthenticatedUser) {
    const tenantId = user.roleName === 'PLATFORM_ADMIN' ? null : user.tenantId;
    return { success: true, data: await this.companiesService.findAll(tenantId) };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get company by ID' })
  async findOne(@Param('id') id: string) {
    return { success: true, data: await this.companiesService.findOne(id) };
  }

  @Get(':id/details')
  @ApiOperation({ summary: 'Get company details with invoice/review/transaction stats' })
  async getDetails(@Param('id') id: string) {
    return { success: true, data: await this.companiesService.getDetails(id) };
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('PLATFORM_ADMIN', 'ACCOUNTING_FIRM_ADMIN')
  @ApiOperation({
    summary: 'Create a company (auto-creates tenant + assigns payment head template)',
  })
  async create(@Body() dto: CreateCompanyDto, @CurrentUser() user: AuthenticatedUser) {
    const data = await this.companiesService.create(dto, user.id, user.tenantId);
    return { success: true, data };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update company' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCompanyDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.companiesService.update(id, dto, user.id, user.tenantId);
    return { success: true, data };
  }
}

import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { SalaryRegistersService } from './salary-registers.service';

@ApiTags('Salary Registers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('salary-registers')
export class SalaryRegistersController {
  constructor(private readonly service: SalaryRegistersService) {}

  @Get()
  @ApiOperation({ summary: 'List salary register records for current tenant' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'month', required: false })
  @ApiQuery({ name: 'year', required: false })
  async findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('month') month?: string,
    @Query('year') year?: string,
  ) {
    const { data, total } = await this.service.findAll(
      user.tenantId,
      { month: month ? Number(month) : undefined, year: year ? Number(year) : undefined },
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
  @ApiOperation({ summary: 'Get a single salary register record with employee rows' })
  async findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return { success: true, data: await this.service.findOne(id, user.tenantId) };
  }
}

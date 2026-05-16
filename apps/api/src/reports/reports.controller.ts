import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Res,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Response } from 'express';
import { memoryStorage } from 'multer';
import * as fs from 'fs';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { ReportsService } from './reports.service';
import { GenerateReportDto } from './dto/generate-report.dto';
import { ShareReportDto } from './dto/share-report.dto';

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('insights/cash-flow')
  @ApiOperation({ summary: 'Monthly cash-flow totals for the given year (approved transactions)' })
  @ApiQuery({
    name: 'year',
    required: false,
    description: 'Four-digit year, defaults to current year',
  })
  async cashFlow(@CurrentUser() user: AuthenticatedUser, @Query('year') year?: string) {
    const data = await this.reportsService.getCashFlow(
      user.tenantId,
      year ? Number(year) : undefined,
    );
    return { success: true, data };
  }

  @Get('insights/top-expense-heads')
  @ApiOperation({ summary: 'Top 5 payment heads by total approved transaction amount' })
  @ApiQuery({
    name: 'period',
    required: false,
    description: 'Number of days: 30, 90, or 365 (default 30)',
  })
  async topExpenseHeads(@CurrentUser() user: AuthenticatedUser, @Query('period') period?: string) {
    const data = await this.reportsService.getTopExpenseHeads(
      user.tenantId,
      period ? Number(period) : undefined,
    );
    return { success: true, data };
  }

  @Get('insights/upload-funnel')
  @ApiOperation({
    summary: 'Upload pipeline conversion counts: uploaded → extracted → reviewed → approved',
  })
  async uploadFunnel(@CurrentUser() user: AuthenticatedUser) {
    const data = await this.reportsService.getUploadFunnel(user.tenantId);
    return { success: true, data };
  }

  @Get('insights/vendor-summary')
  @ApiOperation({ summary: 'Top 10 vendors by approved transaction total' })
  @ApiQuery({
    name: 'period',
    required: false,
    description: 'Number of days: 30, 90, or 365 (default 30)',
  })
  async vendorSummary(@CurrentUser() user: AuthenticatedUser, @Query('period') period?: string) {
    const data = await this.reportsService.getVendorSummary(
      user.tenantId,
      period ? Number(period) : undefined,
    );
    return { success: true, data };
  }

  @Get()
  @ApiOperation({ summary: 'List MIS reports for current tenant' })
  async findAll(@CurrentUser() user: AuthenticatedUser) {
    return { success: true, data: await this.reportsService.findAll(user.tenantId) };
  }

  @Post('upload')
  @ApiOperation({ summary: 'Upload a MIS report file (Excel, PDF, CSV)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } },
  })
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  async uploadMis(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return {
      success: true,
      data: await this.reportsService.uploadMisReport(file, user.tenantId, user.id),
    };
  }

  @Post('generate')
  @ApiOperation({
    summary: 'Generate a report (Expense Summary, Vendor Summary, Category Breakdown, Cash Flow)',
  })
  async generate(
    @Body() dto: GenerateReportDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<object> {
    return { success: true, data: await this.reportsService.generate(dto, user.tenantId, user.id) };
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Download a MIS or generated report' })
  async download(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Res() res: Response,
  ) {
    // Try uploaded MIS report first
    try {
      const misReport = await this.reportsService.findById(id, user.tenantId);
      if (!fs.existsSync(misReport.filePath)) {
        res.status(404).json({ success: false, message: 'File not found on disk' });
        return;
      }
      res.download(misReport.filePath, misReport.fileName);
      return;
    } catch {
      // Not a MIS report — fall through to generated report
    }

    // Try in-memory generated report
    try {
      const generated = this.reportsService.getGeneratedReport(id, user.tenantId);
      const filename = `report-${generated.type.toLowerCase()}-${generated.id.slice(0, 8)}.json`;
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(JSON.stringify(generated.data, null, 2));
    } catch {
      res.status(404).json({ success: false, message: 'Report not found' });
    }
  }

  @Post(':id/share')
  @ApiOperation({ summary: 'Generate a share link for a generated report' })
  async share(
    @Param('id') id: string,
    @Body() dto: ShareReportDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return { success: true, data: this.reportsService.generateShareToken(id, user.tenantId, dto) };
  }
}

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Res,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
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
  @ApiOperation({ summary: 'Download a MIS report file' })
  async download(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Res() res: Response,
  ) {
    const report = await this.reportsService.findById(id, user.tenantId);
    if (!fs.existsSync(report.filePath)) {
      res.status(404).json({ success: false, message: 'File not found on disk' });
      return;
    }
    res.download(report.filePath, report.fileName);
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

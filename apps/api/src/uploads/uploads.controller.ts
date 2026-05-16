import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Res,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
  NotFoundException,
} from '@nestjs/common';
import type { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { UploadsService } from './uploads.service';

@ApiTags('Uploads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post()
  @ApiOperation({
    summary:
      'Upload a single financial document (PDF/PNG/JPEG, max 10 MB). Auto-triggers AI extraction.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } },
  })
  @ApiQuery({
    name: 'document_type',
    required: false,
    description: 'INVOICE | PAYMENT | BANK_STATEMENT | SALARY_REGISTER',
  })
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: AuthenticatedUser,
    @Query('document_type') documentType?: string,
  ) {
    const data = await this.uploadsService.create(file, user.tenantId, user.id, documentType);
    return { success: true, data };
  }

  @Post('bulk')
  @ApiOperation({
    summary: 'Bulk upload up to 20 files. One ExtractionJob queued per file.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { files: { type: 'array', items: { type: 'string', format: 'binary' } } },
    },
  })
  @ApiQuery({ name: 'document_type', required: false, description: 'Default: BANK_STATEMENT' })
  @UseInterceptors(FilesInterceptor('files', 20, { storage: memoryStorage() }))
  async uploadBulk(
    @UploadedFiles() files: Express.Multer.File[],
    @CurrentUser() user: AuthenticatedUser,
    @Query('document_type') documentType?: string,
  ) {
    const data = await this.uploadsService.createBulk(
      files,
      user.tenantId,
      user.id,
      documentType ?? 'BANK_STATEMENT',
    );
    return { success: true, data };
  }

  @Get()
  @ApiOperation({ summary: 'List uploads for current tenant' })
  async findAll(@CurrentUser() user: AuthenticatedUser) {
    return { success: true, data: await this.uploadsService.findAll(user.tenantId) };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get upload by ID' })
  async findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return { success: true, data: await this.uploadsService.findOne(id, user.tenantId) };
  }

  @Get(':id/file')
  @ApiOperation({ summary: 'Stream the raw file bytes for inline preview' })
  async streamFile(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Res() res: Response,
  ) {
    const upload = await this.uploadsService.findOne(id, user.tenantId);
    if (!fs.existsSync(upload.filePath)) throw new NotFoundException('File not found on disk');
    res.setHeader('Content-Type', upload.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${path.basename(upload.filePath)}"`);
    fs.createReadStream(upload.filePath).pipe(res);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Download the file as an attachment' })
  async downloadFile(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Res() res: Response,
  ) {
    const upload = await this.uploadsService.findOne(id, user.tenantId);
    if (!fs.existsSync(upload.filePath)) throw new NotFoundException('File not found on disk');
    res.setHeader('Content-Type', upload.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${upload.fileName}"`);
    fs.createReadStream(upload.filePath).pipe(res);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete upload and its stored file' })
  async remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    await this.uploadsService.remove(id, user.tenantId, user.id);
    return { success: true, message: 'Upload deleted' };
  }
}

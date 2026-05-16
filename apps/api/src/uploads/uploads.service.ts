import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { v4 as uuidv4 } from 'uuid';
import { Upload } from '../database/entities/upload.entity';
import { ExtractionJob } from '../database/entities/extraction-job.entity';
import {
  FileType,
  AuditAction,
  ExtractionStatus,
  NotificationType,
} from '../database/entities/enums';
import { StorageService } from './storage/storage.service';
import { AuditLogService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';

const ALLOWED_MIME_TYPES = ['application/pdf', 'image/png', 'image/jpeg'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const PROMPT_VERSION = 'invoice.extraction.v1';
const EXTRACTION_QUEUE = 'extraction';

@Injectable()
export class UploadsService {
  constructor(
    @InjectRepository(Upload)
    private readonly uploadRepo: Repository<Upload>,
    @InjectRepository(ExtractionJob)
    private readonly jobRepo: Repository<ExtractionJob>,
    @InjectQueue(EXTRACTION_QUEUE)
    private readonly extractionQueue: Queue,
    private readonly storageService: StorageService,
    private readonly auditService: AuditLogService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(
    file: Express.Multer.File,
    tenantId: string,
    userId: string,
    documentType?: string,
  ): Promise<{ upload: Upload; extractionJobId: string }> {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException('Only PDF, PNG, and JPEG files are allowed');
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException('File size must not exceed 10 MB');
    }

    const uploadId = uuidv4();
    const { filePath, fileName } = await this.storageService.store(tenantId, uploadId, file);

    const upload = await this.uploadRepo.save(
      this.uploadRepo.create({
        id: uploadId,
        tenantId,
        filePath,
        fileName,
        fileSize: file.size,
        mimeType: file.mimetype,
        fileType: (documentType as FileType) ?? FileType.INVOICE,
        uploadedBy: userId,
      }),
    );

    const job = await this.jobRepo.save(
      this.jobRepo.create({
        tenantId,
        uploadId: upload.id,
        status: ExtractionStatus.QUEUED,
        promptVersion: PROMPT_VERSION,
      }),
    );

    await this.extractionQueue.add(
      'extract',
      { uploadId: upload.id, jobId: job.id, tenantId },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        timeout: 60000,
      },
    );

    await this.auditService.log({
      tenantId,
      userId,
      entityType: 'Upload',
      entityId: upload.id,
      action: AuditAction.CREATE,
    });

    // Notify accountants that a new document is queued for review.
    // Using tenantId as a proxy userId until per-role user lookup is wired.
    void this.notificationsService.notify(
      tenantId,
      tenantId,
      NotificationType.EXTRACTION_COMPLETED,
      `A new document "${fileName}" has been uploaded and is queued for extraction.`,
    );

    return { upload, extractionJobId: job.id };
  }

  async createBulk(
    files: Express.Multer.File[],
    tenantId: string,
    userId: string,
    documentType?: string,
  ): Promise<Array<{ uploadId: string; extractionJobId: string; fileName: string }>> {
    const results: Array<{ uploadId: string; extractionJobId: string; fileName: string }> = [];
    for (const file of files) {
      const { upload, extractionJobId } = await this.create(file, tenantId, userId, documentType);
      results.push({ uploadId: upload.id, extractionJobId, fileName: upload.fileName });
    }
    return results;
  }

  async findAll(tenantId: string): Promise<Upload[]> {
    return this.uploadRepo.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, tenantId: string): Promise<Upload> {
    const upload = await this.uploadRepo.findOne({
      where: { id, tenantId },
      relations: ['extractionJob'],
    });
    if (!upload) throw new NotFoundException('Upload not found');
    return upload;
  }

  async remove(id: string, tenantId: string, userId: string): Promise<void> {
    const upload = await this.findOne(id, tenantId);
    await this.storageService.delete(upload.filePath);
    await this.uploadRepo.delete(id);

    await this.auditService.log({
      tenantId,
      userId,
      entityType: 'Upload',
      entityId: id,
      action: AuditAction.DELETE,
    });
  }
}

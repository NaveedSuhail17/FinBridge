import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExtractionJob } from '../../database/entities/extraction-job.entity';
import { ExtractionResult } from '../../database/entities/extraction-result.entity';
import { Invoice } from '../../database/entities/invoice.entity';
import { Review } from '../../database/entities/review.entity';
import { Upload } from '../../database/entities/upload.entity';
import { ExtractionStatus, ReviewStatus } from '../../database/entities/enums';
import { ClaudeVisionService } from './claude-vision.service';
import { FinancialValidatorService } from './financial-validator.service';
import { ConfidenceScoreService } from './confidence-score.service';
import { InvoiceExtractionSchema, InvoiceExtraction } from '../validators/extraction-schemas';
import { INVOICE_EXTRACTION_PROMPT, DOCUMENT_CLASSIFICATION_PROMPT } from '@finbridge/prompts';
import { ClassificationSchema } from '../validators/extraction-schemas';
import { StorageService } from '../../uploads/storage/storage.service';

@Injectable()
export class ExtractionService {
  private readonly logger = new Logger(ExtractionService.name);

  constructor(
    @InjectRepository(ExtractionJob)
    private readonly jobRepo: Repository<ExtractionJob>,
    @InjectRepository(ExtractionResult)
    private readonly resultRepo: Repository<ExtractionResult>,
    @InjectRepository(Invoice)
    private readonly invoiceRepo: Repository<Invoice>,
    @InjectRepository(Review)
    private readonly reviewRepo: Repository<Review>,
    @InjectRepository(Upload)
    private readonly uploadRepo: Repository<Upload>,
    private readonly claudeVision: ClaudeVisionService,
    private readonly financialValidator: FinancialValidatorService,
    private readonly confidenceScorer: ConfidenceScoreService,
    private readonly storageService: StorageService,
  ) {}

  async processJob(jobId: string, uploadId: string, tenantId: string): Promise<void> {
    const job = await this.jobRepo.findOneBy({ id: jobId });
    if (!job) {
      this.logger.error(`Job ${jobId} not found`);
      return;
    }

    await this.jobRepo.update(jobId, { status: ExtractionStatus.PROCESSING });

    try {
      const upload = await this.uploadRepo.findOneBy({ id: uploadId });
      if (!upload) throw new Error(`Upload ${uploadId} not found`);

      // Classify document first
      const classificationRaw = await this.claudeVision.analyzeImage(
        upload.filePath,
        DOCUMENT_CLASSIFICATION_PROMPT,
      );
      const classificationJson = JSON.parse(classificationRaw);
      const classification = ClassificationSchema.parse(classificationJson);

      if (classification.document_type !== 'INVOICE') {
        throw new Error(`Document classified as ${classification.document_type}, not INVOICE`);
      }

      // Extract invoice data
      const rawResponse = await this.claudeVision.analyzeImage(
        upload.filePath,
        INVOICE_EXTRACTION_PROMPT,
      );
      let parsed: InvoiceExtraction;

      try {
        const json = JSON.parse(rawResponse);
        parsed = InvoiceExtractionSchema.parse(json);
      } catch {
        throw new Error(`Failed to parse extraction response: ${rawResponse.slice(0, 200)}`);
      }

      const validationErrors = this.financialValidator.validate(parsed);
      const overallConfidence = this.confidenceScorer.computeOverall(parsed);

      if (!this.confidenceScorer.meetsThreshold(parsed)) {
        await this.jobRepo.update(jobId, {
          status: ExtractionStatus.COMPLETED_WITH_ERRORS,
          errorMessage: `Confidence too low: ${overallConfidence}%. Requires manual review.`,
        });
      }

      const result = await this.resultRepo.save(
        this.resultRepo.create({
          extractionJobId: jobId,
          rawResponse,
          parsedResponse: parsed as unknown as Record<string, unknown>,
          confidenceScore: overallConfidence,
          validationErrors,
        }),
      );

      // Create invoice record
      await this.invoiceRepo.save(
        this.invoiceRepo.create({
          tenantId,
          uploadId,
          vendorName: parsed.vendor_name,
          invoiceNumber: parsed.invoice_number,
          invoiceDate: parsed.invoice_date ? new Date(parsed.invoice_date) : null,
          amount: parsed.total_amount,
          subtotal: parsed.subtotal,
          taxAmount: parsed.tax_amount,
          currency: parsed.currency ?? 'INR',
        }),
      );

      // Create review entry for accountant
      await this.reviewRepo.save(
        this.reviewRepo.create({
          tenantId,
          extractionResultId: result.id,
          status: ReviewStatus.PENDING,
        }),
      );

      await this.jobRepo.update(jobId, { status: ExtractionStatus.COMPLETED });
      this.logger.log(`Extraction job ${jobId} completed. Confidence: ${overallConfidence}%`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Extraction job ${jobId} failed: ${message}`);
      await this.jobRepo.update(jobId, { status: ExtractionStatus.FAILED, errorMessage: message });
    }
  }

  async getJobStatus(
    jobId: string,
    tenantId: string,
  ): Promise<ExtractionJob & { result?: ExtractionResult }> {
    const job = await this.jobRepo.findOne({
      where: { id: jobId, tenantId },
      relations: ['extractionResult'],
    });
    if (!job) throw new Error('Extraction job not found');
    return job as ExtractionJob & { result?: ExtractionResult };
  }
}

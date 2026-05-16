import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExtractionJob } from '../../database/entities/extraction-job.entity';
import { ExtractionResult } from '../../database/entities/extraction-result.entity';
import { Invoice } from '../../database/entities/invoice.entity';
import { PaymentRecord } from '../../database/entities/payment-record.entity';
import { SalaryRegisterRecord } from '../../database/entities/salary-register-record.entity';
import { BankStatementRecord } from '../../database/entities/bank-statement-record.entity';
import { Review } from '../../database/entities/review.entity';
import { Upload } from '../../database/entities/upload.entity';
import {
  ExtractionStatus,
  ReviewStatus,
  FileType,
  TransactionStatus,
} from '../../database/entities/enums';
import { ClaudeVisionService } from './claude-vision.service';
import { FinancialValidatorService } from './financial-validator.service';
import { ConfidenceScoreService } from './confidence-score.service';
import { DocumentTypeRouterService } from './document-type-router.service';
import { BankStatementCategorizationService } from './bank-statement-categorization.service';
import {
  InvoiceExtractionSchema,
  InvoiceExtraction,
  ClassificationSchema,
} from '../validators/extraction-schemas';
import { INVOICE_EXTRACTION_PROMPT, DOCUMENT_CLASSIFICATION_PROMPT } from '@finbridge/prompts';
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
    @InjectRepository(PaymentRecord)
    private readonly paymentRecordRepo: Repository<PaymentRecord>,
    @InjectRepository(SalaryRegisterRecord)
    private readonly salaryRegisterRepo: Repository<SalaryRegisterRecord>,
    @InjectRepository(BankStatementRecord)
    private readonly bankStatementRepo: Repository<BankStatementRecord>,
    @InjectRepository(Review)
    private readonly reviewRepo: Repository<Review>,
    @InjectRepository(Upload)
    private readonly uploadRepo: Repository<Upload>,
    private readonly claudeVision: ClaudeVisionService,
    private readonly financialValidator: FinancialValidatorService,
    private readonly confidenceScorer: ConfidenceScoreService,
    private readonly documentTypeRouter: DocumentTypeRouterService,
    private readonly storageService: StorageService,
    private readonly categorizationService: BankStatementCategorizationService,
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

      // Step 1: Classify document
      const classificationRaw = await this.claudeVision.analyzeImage(
        upload.filePath,
        DOCUMENT_CLASSIFICATION_PROMPT,
      );
      const classificationJson = JSON.parse(
        classificationRaw
          .replace(/^```(?:json)?\s*/i, '')
          .replace(/\s*```$/i, '')
          .trim(),
      );
      const classification = ClassificationSchema.parse(classificationJson);

      // Update Upload.fileType from classifier result (classifier wins over user hint)
      const classifiedFileType = this.mapDocTypeToFileType(classification.document_type);
      if (classifiedFileType) {
        await this.uploadRepo.update(uploadId, { fileType: classifiedFileType });
      }

      // Step 2: Extract based on document type
      let rawResponse: string;
      let parsedResponse: Record<string, unknown>;
      let validationErrors: string[];
      let confidenceScore: number;

      if (classification.document_type === 'INVOICE') {
        // Existing invoice path
        rawResponse = await this.claudeVision.analyzeImage(
          upload.filePath,
          INVOICE_EXTRACTION_PROMPT,
        );
        let parsed: InvoiceExtraction;
        try {
          const json = JSON.parse(
            rawResponse
              .replace(/^```(?:json)?\s*/i, '')
              .replace(/\s*```$/i, '')
              .trim(),
          );
          parsed = InvoiceExtractionSchema.parse(json);
        } catch {
          throw new Error(`Failed to parse invoice extraction: ${rawResponse.slice(0, 200)}`);
        }
        validationErrors = this.financialValidator.validate(parsed);
        confidenceScore = this.confidenceScorer.computeOverall(parsed);
        parsedResponse = parsed as unknown as Record<string, unknown>;

        // Set job documentType
        await this.jobRepo.update(jobId, { documentType: FileType.INVOICE });

        const result = await this.saveExtractionResult(
          jobId,
          rawResponse,
          parsedResponse,
          confidenceScore,
          validationErrors,
        );

        // Create Invoice record
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

        await this.createReview(tenantId, result.id, confidenceScore);
      } else {
        // Guard: reject unsupported/unknown doc types before routing
        const UNSUPPORTED_TYPES = ['UNKNOWN', 'LEDGER', 'MIS_REPORT'];
        if (UNSUPPORTED_TYPES.includes(classification.document_type)) {
          await this.jobRepo.update(jobId, {
            status: ExtractionStatus.FAILED,
            errorMessage: `Unsupported document type: ${classification.document_type}`,
          });
          return;
        }

        // Non-invoice path via DocumentTypeRouter
        const routeResult = await this.documentTypeRouter.route(classification, upload.filePath);
        rawResponse = routeResult.result.rawResponse;
        parsedResponse = routeResult.result.parsed as unknown as Record<string, unknown>;
        validationErrors = routeResult.result.validationErrors;
        confidenceScore = routeResult.result.confidenceScore;

        await this.jobRepo.update(jobId, { documentType: routeResult.documentType });

        const result = await this.saveExtractionResult(
          jobId,
          rawResponse,
          parsedResponse,
          confidenceScore,
          validationErrors,
        );

        // Create the appropriate record entity
        if (routeResult.documentType === FileType.PAYMENT) {
          const p = routeResult.result.parsed;
          await this.paymentRecordRepo.save(
            this.paymentRecordRepo.create({
              tenantId,
              uploadId,
              extractionResultId: result.id,
              payer: p.payer,
              payee: p.payee,
              amount: p.amount,
              currency: p.currency ?? 'INR',
              paymentDate: p.payment_date ? new Date(p.payment_date) : null,
              referenceNumber: p.reference_number,
              paymentMode: p.payment_mode,
              bankName: p.bank_name,
              status: TransactionStatus.PENDING,
            }),
          );
        } else if (routeResult.documentType === FileType.SALARY_REGISTER) {
          const s = routeResult.result.parsed;
          await this.salaryRegisterRepo.save(
            this.salaryRegisterRepo.create({
              tenantId,
              uploadId,
              extractionResultId: result.id,
              companyName: s.company_name,
              month: s.month,
              year: s.year,
              currency: s.currency ?? 'INR',
              employeeCount: s.employee_rows.length,
              totalGross: s.total_gross,
              totalDeductions: s.total_deductions,
              totalNet: s.total_net,
              employeeRows: s.employee_rows as unknown as Record<string, unknown>[],
              status: TransactionStatus.PENDING,
            }),
          );
        } else if (routeResult.documentType === FileType.BANK_STATEMENT) {
          const b = routeResult.result.parsed;
          const bankRecord = await this.bankStatementRepo.save(
            this.bankStatementRepo.create({
              tenantId,
              uploadId,
              extractionResultId: result.id,
              bankName: b.bank_name,
              accountNumberMasked: b.account_number_masked,
              accountHolder: b.account_holder,
              currency: b.currency ?? 'INR',
              periodStart: b.period_start ? new Date(b.period_start) : null,
              periodEnd: b.period_end ? new Date(b.period_end) : null,
              openingBalance: b.opening_balance,
              closingBalance: b.closing_balance,
              transactionRows: b.transaction_rows as unknown as Record<string, unknown>[],
              status: TransactionStatus.PENDING,
            }),
          );
          // Enrich rows with suggested payment head/sub-head via keyword matching
          await this.categorizationService.categorize(bankRecord.id, tenantId);
        }

        await this.createReview(tenantId, result.id, confidenceScore);
      }

      const finalStatus =
        confidenceScore < 70 ? ExtractionStatus.COMPLETED_WITH_ERRORS : ExtractionStatus.COMPLETED;
      await this.jobRepo.update(jobId, { status: finalStatus });
      this.logger.log(
        `Extraction job ${jobId} completed (${classification.document_type}). Confidence: ${confidenceScore}%`,
      );
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
    if (!job) throw new NotFoundException('Extraction job not found');
    return job as ExtractionJob & { result?: ExtractionResult };
  }

  private async saveExtractionResult(
    jobId: string,
    rawResponse: string,
    parsedResponse: Record<string, unknown>,
    confidenceScore: number,
    validationErrors: string[],
  ): Promise<ExtractionResult> {
    return this.resultRepo.save(
      this.resultRepo.create({
        extractionJobId: jobId,
        rawResponse,
        parsedResponse,
        confidenceScore,
        validationErrors,
      }),
    );
  }

  private async createReview(
    tenantId: string,
    extractionResultId: string,
    confidenceScore: number,
  ): Promise<void> {
    await this.reviewRepo.save(
      this.reviewRepo.create({
        tenantId,
        extractionResultId,
        status: ReviewStatus.PENDING,
      }),
    );
    this.logger.debug(
      `Review created for result ${extractionResultId} (confidence: ${confidenceScore}%)`,
    );
  }

  private mapDocTypeToFileType(docType: string): FileType | null {
    const map: Record<string, FileType> = {
      INVOICE: FileType.INVOICE,
      PAYMENT: FileType.PAYMENT,
      SALARY_REGISTER: FileType.SALARY_REGISTER,
      BANK_STATEMENT: FileType.BANK_STATEMENT,
      LEDGER: FileType.LEDGER,
      MIS_REPORT: FileType.MIS_REPORT,
    };
    return map[docType] ?? null;
  }
}

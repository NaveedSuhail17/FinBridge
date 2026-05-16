import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, IsNull, In, DataSource, DeepPartial } from 'typeorm';
import { Tenant } from '../database/entities/tenant.entity';
import { Review } from '../database/entities/review.entity';
import { ReviewHistory } from '../database/entities/review-history.entity';
import { ExtractionResult } from '../database/entities/extraction-result.entity';
import { ExtractionJob } from '../database/entities/extraction-job.entity';
import { Invoice } from '../database/entities/invoice.entity';
import { PaymentRecord } from '../database/entities/payment-record.entity';
import { SalaryRegisterRecord } from '../database/entities/salary-register-record.entity';
import { BankStatementRecord } from '../database/entities/bank-statement-record.entity';
import { Transaction } from '../database/entities/transaction.entity';
import { Notification } from '../database/entities/notification.entity';
import {
  ReviewStatus,
  TransactionStatus,
  ExtractionStatus,
  FileType,
  AuditAction,
  NotificationType,
} from '../database/entities/enums';
import { ApproveReviewDto } from './dto/approve-review.dto';
import { RejectReviewDto } from './dto/reject-review.dto';
import { EditReviewDto } from './dto/edit-review.dto';
import { AuditLogService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';

const ESCALATION_HOURS = 48;

@Injectable()
export class ReviewsService {
  private readonly logger = new Logger(ReviewsService.name);

  constructor(
    @InjectRepository(Review)
    private readonly reviewRepo: Repository<Review>,
    @InjectRepository(ReviewHistory)
    private readonly historyRepo: Repository<ReviewHistory>,
    @InjectRepository(ExtractionResult)
    private readonly resultRepo: Repository<ExtractionResult>,
    @InjectRepository(ExtractionJob)
    private readonly jobRepo: Repository<ExtractionJob>,
    @InjectRepository(Invoice)
    private readonly invoiceRepo: Repository<Invoice>,
    @InjectRepository(PaymentRecord)
    private readonly paymentRecordRepo: Repository<PaymentRecord>,
    @InjectRepository(SalaryRegisterRecord)
    private readonly salaryRegisterRepo: Repository<SalaryRegisterRecord>,
    @InjectRepository(BankStatementRecord)
    private readonly bankStatementRepo: Repository<BankStatementRecord>,
    @InjectRepository(Transaction)
    private readonly txRepo: Repository<Transaction>,
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
    @InjectRepository(Tenant)
    private readonly tenantRepo: Repository<Tenant>,
    private readonly auditService: AuditLogService,
    private readonly notificationsService: NotificationsService,
    private readonly dataSource: DataSource,
  ) {}

  private async resolveTenantIds(tenantId: string): Promise<string[]> {
    const children = await this.tenantRepo.findBy({ parentTenantId: tenantId });
    return [tenantId, ...children.map((c) => c.id)];
  }

  async findPending(
    tenantId: string,
    page = 1,
    limit = 20,
  ): Promise<{ data: Review[]; total: number }> {
    const tenantIds = await this.resolveTenantIds(tenantId);
    const [data, total] = await this.reviewRepo.findAndCount({
      where: { tenantId: In(tenantIds), status: ReviewStatus.PENDING },
      relations: ['extractionResult'],
      order: { createdAt: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total };
  }

  async findOne(id: string, tenantId: string): Promise<Review> {
    const review = await this.reviewRepo.findOne({
      where: { id, tenantId },
      relations: [
        'extractionResult',
        'extractionResult.extractionJob',
        'extractionResult.extractionJob.upload',
        'history',
      ],
    });
    if (!review) throw new NotFoundException('Review not found');
    return review;
  }

  async approve(
    id: string,
    tenantId: string,
    userId: string,
    dto: ApproveReviewDto,
  ): Promise<Transaction | Record<string, unknown>> {
    const review = await this.findOne(id, tenantId);
    if (review.status !== ReviewStatus.PENDING) {
      throw new ConflictException('Review is not in PENDING state');
    }

    const result = await this.resultRepo.findOne({
      where: { id: review.extractionResultId },
      relations: ['extractionJob', 'extractionJob.upload'],
    });
    if (!result) throw new NotFoundException('Extraction result not found');

    const documentType = result.extractionJob?.documentType ?? FileType.INVOICE;

    // Validate invoice-specific requirements BEFORE mutating any state to
    // prevent a partial-approve (review marked APPROVED but no Transaction created).
    if (documentType === FileType.INVOICE) {
      const parsed = result.parsedResponse as {
        vendor_name?: string | null;
        total_amount?: number | null;
      };
      if (!parsed.vendor_name || !parsed.total_amount) {
        throw new BadRequestException(
          'Required fields (vendor_name, total_amount) missing in extraction',
        );
      }
      if (!dto.paymentHeadId || !dto.paymentSubHeadId) {
        throw new BadRequestException('paymentHeadId and paymentSubHeadId are required to approve');
      }
    }

    // Wrap all state mutations in a DB transaction so partial failures can't leave corrupt state
    const txResult = await this.dataSource.transaction(async (em) => {
      await em.update(Review, id, {
        status: ReviewStatus.APPROVED,
        reviewedBy: userId,
        completedAt: new Date(),
      });

      if (documentType === FileType.INVOICE) {
        return this.approveInvoice(id, tenantId, result, dto, em);
      }
      if (documentType === FileType.PAYMENT) {
        await em.update(
          PaymentRecord,
          { extractionResultId: result.id, tenantId },
          { status: TransactionStatus.APPROVED },
        );
        return { documentType: FileType.PAYMENT, approved: true };
      }
      if (documentType === FileType.SALARY_REGISTER) {
        await em.update(
          SalaryRegisterRecord,
          { extractionResultId: result.id, tenantId },
          { status: TransactionStatus.APPROVED },
        );
        return { documentType: FileType.SALARY_REGISTER, approved: true };
      }
      if (documentType === FileType.BANK_STATEMENT) {
        await em.update(
          BankStatementRecord,
          { extractionResultId: result.id, tenantId },
          { status: TransactionStatus.APPROVED },
        );
        return { documentType: FileType.BANK_STATEMENT, approved: true };
      }
      return { documentType, approved: true };
    });

    void this.auditService.log({
      tenantId,
      userId,
      entityType: 'Review',
      entityId: id,
      action: AuditAction.APPROVE,
    });

    const uploadOwnerId = result.extractionJob?.upload?.uploadedBy;
    if (uploadOwnerId) {
      void this.notificationsService
        .notify(
          tenantId,
          uploadOwnerId,
          NotificationType.REVIEW_APPROVED,
          'Your uploaded document has been approved by the accountant.',
        )
        .catch((err: unknown) =>
          this.logger.error(
            `Failed to send approval notification to ${uploadOwnerId}: ${String(err)}`,
          ),
        );
    }

    return txResult;
  }

  private async approveInvoice(
    reviewId: string,
    tenantId: string,
    result: ExtractionResult,
    dto: ApproveReviewDto,
    em?: import('typeorm').EntityManager,
  ): Promise<Transaction> {
    const parsed = result.parsedResponse as {
      vendor_name: string | null;
      total_amount: number | null;
      invoice_date: string | null;
      currency: string | null;
    };

    const invoiceRepo = em ? em.getRepository(Invoice) : this.invoiceRepo;
    const txRepo = em ? em.getRepository(Transaction) : this.txRepo;

    const invoice = await invoiceRepo.findOneBy({
      uploadId: result.extractionJob?.uploadId,
      tenantId,
    });

    if (!invoice) {
      throw new NotFoundException('Invoice record not found for this upload');
    }

    const newTx = txRepo.create({
      tenantId,
      invoiceId: invoice.id,
      vendorName: parsed.vendor_name,
      amount: parsed.total_amount,
      currency: parsed.currency ?? 'INR',
      transactionDate: parsed.invoice_date ? new Date(parsed.invoice_date) : new Date(),
      paymentHeadId: dto.paymentHeadId,
      paymentSubHeadId: dto.paymentSubHeadId,
      status: TransactionStatus.APPROVED,
      notes: dto.notes ?? null,
    } as DeepPartial<Transaction>);
    const tx = await txRepo.save(newTx);

    await invoiceRepo.update(invoice.id, { status: TransactionStatus.APPROVED });

    return tx;
  }

  async reject(id: string, tenantId: string, userId: string, dto: RejectReviewDto): Promise<void> {
    const review = await this.findOne(id, tenantId);
    if (review.status !== ReviewStatus.PENDING) {
      throw new ConflictException('Review is not in PENDING state');
    }

    const result = await this.resultRepo.findOne({
      where: { id: review.extractionResultId },
      relations: ['extractionJob', 'extractionJob.upload'],
    });

    await this.reviewRepo.update(id, {
      status: ReviewStatus.REJECTED,
      reviewedBy: userId,
      rejectionReason: dto.rejectionReason,
      notes: dto.notes ?? null,
      completedAt: new Date(),
    });

    if (result?.extractionJob?.id) {
      await this.jobRepo.update(result.extractionJob.id, { status: ExtractionStatus.FAILED });
    }

    const uploadOwnerId = result?.extractionJob?.upload?.uploadedBy;
    if (uploadOwnerId) {
      void this.notificationsService
        .notify(
          tenantId,
          uploadOwnerId,
          NotificationType.REVIEW_REJECTED,
          `Your uploaded document was rejected. Reason: ${dto.rejectionReason}`,
        )
        .catch((err: unknown) =>
          this.logger.error(
            `Failed to send rejection notification to ${uploadOwnerId}: ${String(err)}`,
          ),
        );
    }

    await this.auditService.log({
      tenantId,
      userId,
      entityType: 'Review',
      entityId: id,
      action: AuditAction.REJECT,
      changes: { reason: dto.rejectionReason } as Record<string, unknown>,
    });
  }

  async edit(id: string, tenantId: string, userId: string, dto: EditReviewDto): Promise<void> {
    const review = await this.findOne(id, tenantId);
    if (review.status !== ReviewStatus.PENDING) {
      throw new ConflictException('Can only edit PENDING reviews');
    }

    const result = await this.resultRepo.findOneBy({ id: review.extractionResultId });
    if (!result) throw new NotFoundException('Extraction result not found');

    const parsed = result.parsedResponse as Record<string, unknown>;
    const fieldMap: Record<string, string> = {
      vendorName: 'vendor_name',
      invoiceNumber: 'invoice_number',
      invoiceDate: 'invoice_date',
      totalAmount: 'total_amount',
      currency: 'currency',
    };

    const historyEntries: ReviewHistory[] = [];
    const updatedParsed = { ...parsed };

    for (const [dtoKey, jsonKey] of Object.entries(fieldMap)) {
      const newValue = (dto as Record<string, unknown>)[dtoKey];
      if (newValue !== undefined) {
        const originalValue = parsed[jsonKey];
        updatedParsed[jsonKey] = newValue;
        historyEntries.push(
          this.historyRepo.create({
            reviewId: id,
            fieldName: jsonKey,
            originalValue:
              originalValue !== null && originalValue !== undefined ? String(originalValue) : null,
            newValue: String(newValue),
            changedBy: userId,
          }),
        );
      }
    }

    if (historyEntries.length > 0) {
      await this.resultRepo
        .createQueryBuilder()
        .update()
        .set({ parsedResponse: () => `:data::jsonb` })
        .setParameter('data', JSON.stringify(updatedParsed))
        .where('id = :id', { id: result.id })
        .execute();
      await this.historyRepo.save(historyEntries);
    }

    await this.auditService.log({
      tenantId,
      userId,
      entityType: 'Review',
      entityId: id,
      action: AuditAction.UPDATE,
      changes: dto as unknown as Record<string, unknown>,
    });
  }

  async escalateStale(): Promise<number> {
    const cutoff = new Date(Date.now() - ESCALATION_HOURS * 60 * 60 * 1000);
    const stale = await this.reviewRepo.find({
      where: {
        status: ReviewStatus.PENDING,
        escalatedAt: IsNull(),
        createdAt: LessThan(cutoff),
      },
    });

    for (const review of stale) {
      await this.reviewRepo.update(review.id, { escalatedAt: new Date() });
      await this.notificationRepo.save(
        this.notificationRepo.create({
          tenantId: review.tenantId,
          userId: review.tenantId, // notify firm — use tenantId as proxy; real impl would look up firm admin
          type: NotificationType.REVIEW_ESCALATED,
          message: `Review ${review.id} has been pending for over ${ESCALATION_HOURS} hours`,
          read: false,
        }),
      );
    }
    return stale.length;
  }
}

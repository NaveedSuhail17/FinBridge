import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Review } from '../database/entities/review.entity';
import { ReviewHistory } from '../database/entities/review-history.entity';
import { ExtractionResult } from '../database/entities/extraction-result.entity';
import { ExtractionJob } from '../database/entities/extraction-job.entity';
import { Invoice } from '../database/entities/invoice.entity';
import { Transaction } from '../database/entities/transaction.entity';
import { Notification } from '../database/entities/notification.entity';
import {
  ReviewStatus,
  TransactionStatus,
  ExtractionStatus,
  AuditAction,
  NotificationType,
} from '../database/entities/enums';
import { ApproveReviewDto } from './dto/approve-review.dto';
import { RejectReviewDto } from './dto/reject-review.dto';
import { EditReviewDto } from './dto/edit-review.dto';
import { AuditLogService } from '../audit/audit.service';

const ESCALATION_HOURS = 48;

@Injectable()
export class ReviewsService {
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
    @InjectRepository(Transaction)
    private readonly txRepo: Repository<Transaction>,
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
    private readonly auditService: AuditLogService,
  ) {}

  async findPending(
    tenantId: string,
    page = 1,
    limit = 20,
  ): Promise<{ data: Review[]; total: number }> {
    const [data, total] = await this.reviewRepo.findAndCount({
      where: { tenantId, status: ReviewStatus.PENDING },
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
  ): Promise<Transaction> {
    const review = await this.findOne(id, tenantId);
    if (review.status !== ReviewStatus.PENDING) {
      throw new ConflictException('Review is not in PENDING state');
    }

    const result = await this.resultRepo.findOneBy({ id: review.extractionResultId });
    if (!result) throw new NotFoundException('Extraction result not found');

    const parsed = result.parsedResponse as {
      vendor_name: string | null;
      total_amount: number | null;
      invoice_date: string | null;
      currency: string | null;
    };

    if (!parsed.vendor_name || !parsed.total_amount) {
      throw new BadRequestException(
        'Required fields (vendor_name, total_amount) missing in extraction',
      );
    }

    if (!dto.paymentHeadId || !dto.paymentSubHeadId) {
      throw new BadRequestException('paymentHeadId and paymentSubHeadId are required to approve');
    }

    const invoice = await this.invoiceRepo.findOneBy({
      uploadId: (result as { extractionJob?: { uploadId?: string } }).extractionJob?.uploadId,
    });

    const tx = await this.txRepo.save(
      this.txRepo.create({
        tenantId,
        invoiceId: invoice?.id ?? id,
        vendorName: parsed.vendor_name,
        amount: parsed.total_amount,
        currency: parsed.currency ?? 'INR',
        transactionDate: parsed.invoice_date ? new Date(parsed.invoice_date) : new Date(),
        paymentHeadId: dto.paymentHeadId,
        paymentSubHeadId: dto.paymentSubHeadId,
        status: TransactionStatus.APPROVED,
        notes: dto.notes ?? null,
      }),
    );

    await this.reviewRepo.update(id, {
      status: ReviewStatus.APPROVED,
      reviewedBy: userId,
      completedAt: new Date(),
    });

    if (invoice) {
      await this.invoiceRepo.update(invoice.id, { status: TransactionStatus.APPROVED });
    }

    await this.auditService.log({
      tenantId,
      userId,
      entityType: 'Review',
      entityId: id,
      action: AuditAction.APPROVE,
    });

    return tx;
  }

  async reject(id: string, tenantId: string, userId: string, dto: RejectReviewDto): Promise<void> {
    const review = await this.findOne(id, tenantId);
    if (review.status !== ReviewStatus.PENDING) {
      throw new ConflictException('Review is not in PENDING state');
    }

    const result = await this.resultRepo.findOne({
      where: { id: review.extractionResultId },
      relations: ['extractionJob'],
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
        escalatedAt: undefined,
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

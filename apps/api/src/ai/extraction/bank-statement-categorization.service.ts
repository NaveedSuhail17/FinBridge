import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BankStatementRecord } from '../../database/entities/bank-statement-record.entity';
import { PaymentHead } from '../../database/entities/payment-head.entity';
import { PaymentSubHead } from '../../database/entities/payment-sub-head.entity';

interface CategorizedRow extends Record<string, unknown> {
  suggested_head_id: string | null;
  suggested_head_name: string | null;
  suggested_sub_head_id: string | null;
  suggested_sub_head_name: string | null;
}

@Injectable()
export class BankStatementCategorizationService {
  private readonly logger = new Logger(BankStatementCategorizationService.name);

  constructor(
    @InjectRepository(BankStatementRecord)
    private readonly recordRepo: Repository<BankStatementRecord>,
    @InjectRepository(PaymentHead)
    private readonly headRepo: Repository<PaymentHead>,
    @InjectRepository(PaymentSubHead)
    private readonly subHeadRepo: Repository<PaymentSubHead>,
  ) {}

  async categorize(recordId: string, tenantId: string): Promise<void> {
    const record = await this.recordRepo.findOneBy({ id: recordId, tenantId });
    if (!record || !record.transactionRows.length) return;

    const [heads, subHeads] = await Promise.all([
      this.headRepo.find({ where: { tenantId } }),
      this.subHeadRepo.find({ where: { tenantId } }),
    ]);

    // Build keyword → entity maps (lower-cased names)
    const headMap = new Map(heads.map((h) => [h.name.toLowerCase(), h]));
    const subHeadMap = new Map(subHeads.map((s) => [s.name.toLowerCase(), s]));

    const categorized: CategorizedRow[] = record.transactionRows.map((row) => {
      const desc = ((row['description'] as string | undefined) ?? '').toLowerCase();

      let matchedHead: PaymentHead | undefined;
      for (const [keyword, head] of headMap) {
        if (desc.includes(keyword)) {
          matchedHead = head;
          break;
        }
      }

      let matchedSubHead: PaymentSubHead | undefined;
      if (matchedHead) {
        for (const [keyword, sub] of subHeadMap) {
          if (sub.paymentHeadId === matchedHead.id && desc.includes(keyword)) {
            matchedSubHead = sub;
            break;
          }
        }
      }

      return {
        ...row,
        suggested_head_id: matchedHead?.id ?? null,
        suggested_head_name: matchedHead?.name ?? null,
        suggested_sub_head_id: matchedSubHead?.id ?? null,
        suggested_sub_head_name: matchedSubHead?.name ?? null,
      };
    });

    await this.recordRepo
      .createQueryBuilder()
      .update()
      .set({ transactionRows: () => ':rows::jsonb' })
      .setParameter('rows', JSON.stringify(categorized))
      .where('id = :id', { id: recordId })
      .execute();

    this.logger.log(`Categorized ${categorized.length} rows for BankStatementRecord ${recordId}`);
  }
}

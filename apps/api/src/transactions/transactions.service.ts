import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

const ALLOWED_SORT_COLS = ['transactionDate', 'amount', 'vendorName', 'createdAt'] as const;
type AllowedSortCol = (typeof ALLOWED_SORT_COLS)[number];
import { Transaction } from '../database/entities/transaction.entity';
import { AuditAction } from '../database/entities/enums';
import { QueryTransactionsDto } from './dto/query-transactions.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { AuditLogService } from '../audit/audit.service';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly txRepo: Repository<Transaction>,
    private readonly auditService: AuditLogService,
  ) {}

  async findAll(
    tenantId: string,
    filters: QueryTransactionsDto,
  ): Promise<{ data: Transaction[]; total: number }> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const rawSortBy = filters.sortBy ?? 'transactionDate';
    if (filters.sortBy && !ALLOWED_SORT_COLS.includes(filters.sortBy as AllowedSortCol)) {
      throw new BadRequestException(`Invalid sortBy value: ${filters.sortBy}`);
    }
    const sortBy = rawSortBy as AllowedSortCol;
    const sortOrder: 'ASC' | 'DESC' = filters.sortOrder === 'ASC' ? 'ASC' : 'DESC';

    let query = this.txRepo
      .createQueryBuilder('tx')
      .where('tx.tenant_id = :tenantId', { tenantId });

    if (filters.paymentHeadId)
      query = query.andWhere('tx.payment_head_id = :pid', { pid: filters.paymentHeadId });
    if (filters.vendorName)
      query = query.andWhere('tx.vendor_name ILIKE :vn', { vn: `%${filters.vendorName}%` });
    if (filters.dateFrom)
      query = query.andWhere('tx.transaction_date >= :from', { from: filters.dateFrom });
    if (filters.dateTo)
      query = query.andWhere('tx.transaction_date <= :to', { to: filters.dateTo });
    if (filters.amountMin !== undefined)
      query = query.andWhere('tx.amount >= :amin', { amin: filters.amountMin });
    if (filters.amountMax !== undefined)
      query = query.andWhere('tx.amount <= :amax', { amax: filters.amountMax });

    query = query
      .orderBy(`tx.${String(sortBy)}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await query.getManyAndCount();
    return { data, total };
  }

  async findOne(id: string, tenantId: string): Promise<Transaction> {
    const tx = await this.txRepo.findOne({
      where: { id, tenantId },
      relations: ['paymentHead', 'paymentSubHead', 'invoice'],
    });
    if (!tx) throw new NotFoundException('Transaction not found');
    return tx;
  }

  async update(
    id: string,
    dto: UpdateTransactionDto,
    tenantId: string,
    userId: string,
  ): Promise<Transaction> {
    const tx = await this.findOne(id, tenantId);
    Object.assign(tx, dto);
    const saved = await this.txRepo.save(tx);

    await this.auditService.log({
      tenantId,
      userId,
      entityType: 'Transaction',
      entityId: id,
      action: AuditAction.UPDATE,
      changes: dto as Record<string, unknown>,
    });

    return saved;
  }

  async exportCsv(tenantId: string, filters: QueryTransactionsDto): Promise<string> {
    const { data } = await this.findAll(tenantId, { ...filters, limit: 10000, page: 1 });
    const csv = (v: unknown): string => '"' + String(v ?? '').replace(/"/g, '""') + '"';
    const header =
      'id,vendor_name,amount,currency,transaction_date,payment_head_id,payment_sub_head_id,status\n';
    const rows = data
      .map((t) =>
        [
          csv(t.id),
          csv(t.vendorName),
          csv(t.amount),
          csv(t.currency),
          csv(t.transactionDate.toISOString()),
          csv(t.paymentHeadId),
          csv(t.paymentSubHeadId),
          csv(t.status),
        ].join(','),
      )
      .join('\n');
    return header + rows;
  }
}

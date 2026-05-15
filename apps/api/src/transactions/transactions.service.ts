import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, FindOptionsWhere, Like } from 'typeorm';
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
    const where: FindOptionsWhere<Transaction> = { tenantId };

    if (filters.paymentHeadId) where.paymentHeadId = filters.paymentHeadId;
    if (filters.vendorName) where.vendorName = Like(`%${filters.vendorName}%`);
    if (filters.dateFrom && filters.dateTo) {
      where.transactionDate = Between(new Date(filters.dateFrom), new Date(filters.dateTo));
    }

    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const sortBy = (filters.sortBy ?? 'transactionDate') as keyof Transaction;
    const sortOrder = filters.sortOrder ?? 'DESC';

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
    const header =
      'id,vendor_name,amount,currency,transaction_date,payment_head_id,payment_sub_head_id,status\n';
    const rows = data
      .map(
        (t) =>
          `${t.id},${t.vendorName},${t.amount},${t.currency},${t.transactionDate.toISOString()},${t.paymentHeadId},${t.paymentSubHeadId},${t.status}`,
      )
      .join('\n');
    return header + rows;
  }
}

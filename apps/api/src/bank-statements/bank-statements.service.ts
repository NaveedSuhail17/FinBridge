import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Between } from 'typeorm';
import { BankStatementRecord } from '../database/entities/bank-statement-record.entity';

export interface BankStatementFilters {
  periodStart?: string;
  periodEnd?: string;
  bankName?: string;
}

@Injectable()
export class BankStatementsService {
  constructor(
    @InjectRepository(BankStatementRecord)
    private readonly repo: Repository<BankStatementRecord>,
  ) {}

  async findAll(
    tenantId: string,
    filters: BankStatementFilters,
    page = 1,
    limit = 20,
  ): Promise<{ data: BankStatementRecord[]; total: number }> {
    const where: FindOptionsWhere<BankStatementRecord> = { tenantId };

    if (filters.periodStart && filters.periodEnd) {
      where.periodStart = Between(new Date(filters.periodStart), new Date(filters.periodEnd));
    }

    const [data, total] = await this.repo.findAndCount({
      where,
      order: { periodStart: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total };
  }

  async findOne(id: string, tenantId: string): Promise<BankStatementRecord> {
    const record = await this.repo.findOne({ where: { id, tenantId } });
    if (!record) throw new NotFoundException('Bank statement record not found');
    return record;
  }
}

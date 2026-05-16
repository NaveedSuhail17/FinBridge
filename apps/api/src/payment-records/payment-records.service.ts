import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Between } from 'typeorm';
import { PaymentRecord } from '../database/entities/payment-record.entity';

export interface PaymentRecordFilters {
  dateFrom?: string;
  dateTo?: string;
  paymentMode?: string;
}

@Injectable()
export class PaymentRecordsService {
  constructor(
    @InjectRepository(PaymentRecord)
    private readonly repo: Repository<PaymentRecord>,
  ) {}

  async findAll(
    tenantId: string,
    filters: PaymentRecordFilters,
    page = 1,
    limit = 20,
  ): Promise<{ data: PaymentRecord[]; total: number }> {
    const where: FindOptionsWhere<PaymentRecord> = { tenantId };

    if (filters.paymentMode) {
      where.paymentMode = filters.paymentMode;
    }

    if (filters.dateFrom && filters.dateTo) {
      where.paymentDate = Between(new Date(filters.dateFrom), new Date(filters.dateTo));
    }

    const [data, total] = await this.repo.findAndCount({
      where,
      order: { paymentDate: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total };
  }

  async findOne(id: string, tenantId: string): Promise<PaymentRecord> {
    const record = await this.repo.findOne({ where: { id, tenantId } });
    if (!record) throw new NotFoundException('Payment record not found');
    return record;
  }
}

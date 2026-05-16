import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { SalaryRegisterRecord } from '../database/entities/salary-register-record.entity';

export interface SalaryRegisterFilters {
  month?: number;
  year?: number;
}

@Injectable()
export class SalaryRegistersService {
  constructor(
    @InjectRepository(SalaryRegisterRecord)
    private readonly repo: Repository<SalaryRegisterRecord>,
  ) {}

  async findAll(
    tenantId: string,
    filters: SalaryRegisterFilters,
    page = 1,
    limit = 20,
  ): Promise<{ data: SalaryRegisterRecord[]; total: number }> {
    const where: FindOptionsWhere<SalaryRegisterRecord> = { tenantId };

    if (filters.month) where.month = filters.month;
    if (filters.year) where.year = filters.year;

    const [data, total] = await this.repo.findAndCount({
      where,
      order: { year: 'DESC', month: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total };
  }

  async findOne(id: string, tenantId: string): Promise<SalaryRegisterRecord> {
    const record = await this.repo.findOne({ where: { id, tenantId } });
    if (!record) throw new NotFoundException('Salary register record not found');
    return record;
  }
}

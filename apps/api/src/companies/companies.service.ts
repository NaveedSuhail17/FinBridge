import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from '../database/entities/company.entity';
import { Tenant } from '../database/entities/tenant.entity';
import { AccountingFirm } from '../database/entities/accounting-firm.entity';
import { BusinessTypeTemplate } from '../database/entities/business-type-template.entity';
import { PaymentHead } from '../database/entities/payment-head.entity';
import { PaymentSubHead } from '../database/entities/payment-sub-head.entity';
import { Invoice } from '../database/entities/invoice.entity';
import { Review } from '../database/entities/review.entity';
import { Transaction } from '../database/entities/transaction.entity';
import { TenantType, ReviewStatus, AuditAction } from '../database/entities/enums';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { AuditLogService } from '../audit/audit.service';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>,
    @InjectRepository(Tenant)
    private readonly tenantRepo: Repository<Tenant>,
    @InjectRepository(AccountingFirm)
    private readonly firmRepo: Repository<AccountingFirm>,
    @InjectRepository(BusinessTypeTemplate)
    private readonly templateRepo: Repository<BusinessTypeTemplate>,
    @InjectRepository(PaymentHead)
    private readonly headRepo: Repository<PaymentHead>,
    @InjectRepository(PaymentSubHead)
    private readonly subHeadRepo: Repository<PaymentSubHead>,
    @InjectRepository(Invoice)
    private readonly invoiceRepo: Repository<Invoice>,
    @InjectRepository(Review)
    private readonly reviewRepo: Repository<Review>,
    @InjectRepository(Transaction)
    private readonly txRepo: Repository<Transaction>,
    private readonly auditService: AuditLogService,
  ) {}

  async findAll(tenantId: string | null): Promise<Company[]> {
    if (!tenantId) return this.companyRepo.find({ order: { createdAt: 'DESC' } });
    return this.companyRepo.findBy({ tenantId });
  }

  async findOne(id: string): Promise<Company> {
    const company = await this.companyRepo.findOneBy({ id });
    if (!company) throw new NotFoundException('Company not found');
    return company;
  }

  async create(dto: CreateCompanyDto, actorId: string, actorTenantId: string): Promise<Company> {
    const firm = await this.firmRepo.findOneBy({ id: dto.accountingFirmId });
    if (!firm) throw new NotFoundException('Accounting firm not found');

    const tenant = await this.tenantRepo.save(
      this.tenantRepo.create({
        type: TenantType.COMPANY,
        name: dto.name,
        parentTenantId: firm.tenantId,
      }),
    );

    const company = await this.companyRepo.save(
      this.companyRepo.create({
        tenantId: tenant.id,
        accountingFirmId: dto.accountingFirmId,
        name: dto.name,
        businessType: dto.businessType,
        contactEmail: dto.contactEmail,
        gstNumber: dto.gstNumber ?? null,
        contactPhone: dto.contactPhone ?? null,
        address: dto.address ?? null,
      }),
    );

    await this.applyDefaultPaymentHeads(tenant.id, dto.businessType);

    await this.auditService.log({
      tenantId: actorTenantId,
      userId: actorId,
      entityType: 'Company',
      entityId: company.id,
      action: AuditAction.CREATE,
    });

    return company;
  }

  async update(
    id: string,
    dto: UpdateCompanyDto,
    actorId: string,
    actorTenantId: string,
  ): Promise<Company> {
    const company = await this.findOne(id);
    Object.assign(company, dto);
    const saved = await this.companyRepo.save(company);

    await this.auditService.log({
      tenantId: actorTenantId,
      userId: actorId,
      entityType: 'Company',
      entityId: id,
      action: AuditAction.UPDATE,
      changes: dto as Record<string, unknown>,
    });

    return saved;
  }

  async getDetails(id: string): Promise<{
    company: Company;
    invoiceCount: number;
    pendingReviewCount: number;
    transactionTotal: number;
  }> {
    const company = await this.findOne(id);

    const [invoiceCount, pendingReviewCount, transactions] = await Promise.all([
      this.invoiceRepo.countBy({ tenantId: company.tenantId }),
      this.reviewRepo.countBy({ tenantId: company.tenantId, status: ReviewStatus.PENDING }),
      this.txRepo.findBy({ tenantId: company.tenantId }),
    ]);

    const transactionTotal = transactions.reduce((sum, t) => sum + Number(t.amount), 0);

    return { company, invoiceCount, pendingReviewCount, transactionTotal };
  }

  private async applyDefaultPaymentHeads(
    tenantId: string,
    businessType: import('../database/entities/enums').BusinessType,
  ): Promise<void> {
    const template = await this.templateRepo.findOneBy({ businessType });
    if (!template) return;

    const tree = template.defaultTree as {
      heads: Array<{
        code: string;
        name: string;
        description?: string;
        subHeads: Array<{ code: string; name: string }>;
      }>;
    };

    for (const h of tree.heads ?? []) {
      const head = await this.headRepo.save(
        this.headRepo.create({
          tenantId,
          code: h.code,
          name: h.name,
          description: h.description ?? null,
        }),
      );
      for (const sh of h.subHeads ?? []) {
        await this.subHeadRepo.save(
          this.subHeadRepo.create({
            tenantId,
            paymentHeadId: head.id,
            code: sh.code,
            name: sh.name,
          }),
        );
      }
    }
  }
}

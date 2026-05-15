import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Company } from '../database/entities/company.entity';
import { Tenant } from '../database/entities/tenant.entity';
import { AccountingFirm } from '../database/entities/accounting-firm.entity';
import { BusinessTypeTemplate } from '../database/entities/business-type-template.entity';
import { PaymentHead } from '../database/entities/payment-head.entity';
import { PaymentSubHead } from '../database/entities/payment-sub-head.entity';
import { Invoice } from '../database/entities/invoice.entity';
import { Review } from '../database/entities/review.entity';
import { Transaction } from '../database/entities/transaction.entity';
import { CompaniesService } from './companies.service';
import { CompaniesController } from './companies.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Company,
      Tenant,
      AccountingFirm,
      BusinessTypeTemplate,
      PaymentHead,
      PaymentSubHead,
      Invoice,
      Review,
      Transaction,
    ]),
    AuditModule,
  ],
  providers: [CompaniesService],
  controllers: [CompaniesController],
  exports: [CompaniesService],
})
export class CompaniesModule {}

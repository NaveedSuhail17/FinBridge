import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentHead } from '../database/entities/payment-head.entity';
import { PaymentSubHead } from '../database/entities/payment-sub-head.entity';
import { Transaction } from '../database/entities/transaction.entity';
import { BusinessTypeTemplate } from '../database/entities/business-type-template.entity';
import { PaymentHeadsService } from './payment-heads.service';
import { PaymentHeadsController, BusinessTypeTemplateController } from './payment-heads.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PaymentHead, PaymentSubHead, Transaction, BusinessTypeTemplate]),
    AuditModule,
  ],
  providers: [PaymentHeadsService],
  controllers: [PaymentHeadsController, BusinessTypeTemplateController],
  exports: [PaymentHeadsService],
})
export class PaymentHeadsModule {}

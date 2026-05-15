import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentSubHead } from '../database/entities/payment-sub-head.entity';
import { PaymentHead } from '../database/entities/payment-head.entity';
import { Transaction } from '../database/entities/transaction.entity';
import { PaymentSubHeadsService } from './payment-sub-heads.service';
import { PaymentSubHeadsController } from './payment-sub-heads.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [TypeOrmModule.forFeature([PaymentSubHead, PaymentHead, Transaction]), AuditModule],
  providers: [PaymentSubHeadsService],
  controllers: [PaymentSubHeadsController],
  exports: [PaymentSubHeadsService],
})
export class PaymentSubHeadsModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentRecord } from '../database/entities/payment-record.entity';
import { PaymentRecordsService } from './payment-records.service';
import { PaymentRecordsController } from './payment-records.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PaymentRecord])],
  providers: [PaymentRecordsService],
  controllers: [PaymentRecordsController],
  exports: [PaymentRecordsService],
})
export class PaymentRecordsModule {}

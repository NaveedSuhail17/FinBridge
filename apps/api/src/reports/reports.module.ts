import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MISReport } from '../database/entities/mis-report.entity';
import { Transaction } from '../database/entities/transaction.entity';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { UploadsModule } from '../uploads/uploads.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [TypeOrmModule.forFeature([MISReport, Transaction]), UploadsModule, AuditModule],
  providers: [ReportsService],
  controllers: [ReportsController],
  exports: [ReportsService],
})
export class ReportsModule {}

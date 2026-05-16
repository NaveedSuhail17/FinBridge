import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { ExtractionJob } from '../database/entities/extraction-job.entity';
import { ExtractionResult } from '../database/entities/extraction-result.entity';
import { Invoice } from '../database/entities/invoice.entity';
import { PaymentRecord } from '../database/entities/payment-record.entity';
import { SalaryRegisterRecord } from '../database/entities/salary-register-record.entity';
import { BankStatementRecord } from '../database/entities/bank-statement-record.entity';
import { Review } from '../database/entities/review.entity';
import { Upload } from '../database/entities/upload.entity';
import { PaymentHead } from '../database/entities/payment-head.entity';
import { PaymentSubHead } from '../database/entities/payment-sub-head.entity';
import { ClaudeVisionService } from './extraction/claude-vision.service';
import { FinancialValidatorService } from './extraction/financial-validator.service';
import { ConfidenceScoreService } from './extraction/confidence-score.service';
import { PaymentValidatorService } from './validators/payment-validator.service';
import { SalaryRegisterValidatorService } from './validators/salary-register-validator.service';
import { BankStatementValidatorService } from './validators/bank-statement-validator.service';
import { PaymentExtractionService } from './extraction/payment-extraction.service';
import { SalaryRegisterExtractionService } from './extraction/salary-register-extraction.service';
import { BankStatementExtractionService } from './extraction/bank-statement-extraction.service';
import { DocumentTypeRouterService } from './extraction/document-type-router.service';
import { BankStatementCategorizationService } from './extraction/bank-statement-categorization.service';
import { ExtractionService } from './extraction/extraction.service';
import { ExtractionProcessor } from './extraction/extraction.processor';
import { AiController } from './ai.controller';
import { UploadsModule } from '../uploads/uploads.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ExtractionJob,
      ExtractionResult,
      Invoice,
      PaymentRecord,
      SalaryRegisterRecord,
      BankStatementRecord,
      Review,
      Upload,
      PaymentHead,
      PaymentSubHead,
    ]),
    BullModule.registerQueue({ name: 'extraction' }),
    UploadsModule,
  ],
  providers: [
    ClaudeVisionService,
    FinancialValidatorService,
    ConfidenceScoreService,
    PaymentValidatorService,
    SalaryRegisterValidatorService,
    BankStatementValidatorService,
    PaymentExtractionService,
    SalaryRegisterExtractionService,
    BankStatementExtractionService,
    DocumentTypeRouterService,
    ExtractionService,
    ExtractionProcessor,
    BankStatementCategorizationService,
  ],
  controllers: [AiController],
  exports: [ExtractionService],
})
export class AiModule {}

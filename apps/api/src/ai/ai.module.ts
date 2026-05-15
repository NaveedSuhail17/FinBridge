import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { ExtractionJob } from '../database/entities/extraction-job.entity';
import { ExtractionResult } from '../database/entities/extraction-result.entity';
import { Invoice } from '../database/entities/invoice.entity';
import { Review } from '../database/entities/review.entity';
import { Upload } from '../database/entities/upload.entity';
import { ClaudeVisionService } from './extraction/claude-vision.service';
import { FinancialValidatorService } from './extraction/financial-validator.service';
import { ConfidenceScoreService } from './extraction/confidence-score.service';
import { ExtractionService } from './extraction/extraction.service';
import { ExtractionProcessor } from './extraction/extraction.processor';
import { AiController } from './ai.controller';
import { UploadsModule } from '../uploads/uploads.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ExtractionJob, ExtractionResult, Invoice, Review, Upload]),
    BullModule.registerQueue({ name: 'extraction' }),
    UploadsModule,
  ],
  providers: [
    ClaudeVisionService,
    FinancialValidatorService,
    ConfidenceScoreService,
    ExtractionService,
    ExtractionProcessor,
  ],
  controllers: [AiController],
  exports: [ExtractionService],
})
export class AiModule {}

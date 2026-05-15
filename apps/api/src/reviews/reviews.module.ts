import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Review } from '../database/entities/review.entity';
import { ReviewHistory } from '../database/entities/review-history.entity';
import { ExtractionResult } from '../database/entities/extraction-result.entity';
import { ExtractionJob } from '../database/entities/extraction-job.entity';
import { Invoice } from '../database/entities/invoice.entity';
import { Transaction } from '../database/entities/transaction.entity';
import { Notification } from '../database/entities/notification.entity';
import { ReviewsService } from './reviews.service';
import { ReviewsController } from './reviews.controller';
import { ReviewEscalationScheduler } from './review-escalation.scheduler';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Review,
      ReviewHistory,
      ExtractionResult,
      ExtractionJob,
      Invoice,
      Transaction,
      Notification,
    ]),
    AuditModule,
  ],
  providers: [ReviewsService, ReviewEscalationScheduler],
  controllers: [ReviewsController],
  exports: [ReviewsService],
})
export class ReviewsModule {}

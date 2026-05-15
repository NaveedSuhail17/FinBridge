import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ReviewsService } from './reviews.service';

@Injectable()
export class ReviewEscalationScheduler {
  private readonly logger = new Logger(ReviewEscalationScheduler.name);

  constructor(private readonly reviewsService: ReviewsService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async escalateStaleReviews(): Promise<void> {
    const count = await this.reviewsService.escalateStale();
    if (count > 0) {
      this.logger.warn(`Escalated ${count} stale review(s) pending over 48 hours`);
    }
  }
}

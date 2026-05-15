import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { ExtractionService } from './extraction.service';

interface ExtractionJobData {
  jobId: string;
  uploadId: string;
  tenantId: string;
}

@Processor('extraction')
export class ExtractionProcessor {
  private readonly logger = new Logger(ExtractionProcessor.name);

  constructor(private readonly extractionService: ExtractionService) {}

  @Process({ name: 'extract', concurrency: 5 })
  async handle(job: Job<ExtractionJobData>): Promise<void> {
    this.logger.log(`Processing extraction job ${job.data.jobId}`);
    await this.extractionService.processJob(job.data.jobId, job.data.uploadId, job.data.tenantId);
  }
}

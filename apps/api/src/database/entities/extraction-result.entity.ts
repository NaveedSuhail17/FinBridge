import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { ExtractionJob } from './extraction-job.entity';
import { Review } from './review.entity';
import { ExtractionRevision } from './extraction-revision.entity';

@Entity('extraction_results')
export class ExtractionResult {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'extraction_job_id', unique: true })
  extractionJobId: string;

  @Column({ name: 'raw_response', type: 'text' })
  rawResponse: string;

  @Column({ name: 'parsed_response', type: 'jsonb' })
  parsedResponse: Record<string, unknown>;

  @Column({ name: 'confidence_score', type: 'decimal', precision: 5, scale: 2 })
  confidenceScore: number;

  @Column({ name: 'validation_errors', type: 'text', array: true, default: [] })
  validationErrors: string[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToOne(() => ExtractionJob, (ej) => ej.extractionResult)
  @JoinColumn({ name: 'extraction_job_id' })
  extractionJob: ExtractionJob;

  @OneToOne(() => Review, (r) => r.extractionResult)
  review: Review;

  @OneToMany(() => ExtractionRevision, (er) => er.extractionResult)
  revisions: ExtractionRevision[];
}

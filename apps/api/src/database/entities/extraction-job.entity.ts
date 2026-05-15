import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ExtractionStatus } from './enums';
import { Tenant } from './tenant.entity';
import { Upload } from './upload.entity';
import { ExtractionResult } from './extraction-result.entity';

@Entity('extraction_jobs')
@Index(['tenantId', 'status'])
export class ExtractionJob {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column({ name: 'upload_id', unique: true })
  uploadId: string;

  @Column({ type: 'enum', enum: ExtractionStatus, default: ExtractionStatus.QUEUED })
  status: ExtractionStatus;

  @Column({ name: 'prompt_version' })
  promptVersion: string;

  @Column({ name: 'error_message', nullable: true, type: 'text' })
  errorMessage: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Tenant, (t) => t.extractionJobs)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @OneToOne(() => Upload, (u) => u.extractionJob)
  @JoinColumn({ name: 'upload_id' })
  upload: Upload;

  @OneToOne(() => ExtractionResult, (er) => er.extractionJob)
  extractionResult: ExtractionResult;
}

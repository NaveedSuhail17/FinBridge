import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { ReviewStatus } from './enums';
import { Tenant } from './tenant.entity';
import { ExtractionResult } from './extraction-result.entity';
import { PlatformUser } from './platform-user.entity';
import { ReviewHistory } from './review-history.entity';

@Entity('reviews')
@Index(['tenantId', 'status'])
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column({ name: 'extraction_result_id', unique: true })
  extractionResultId: string;

  @Column({ name: 'reviewed_by', nullable: true, type: 'varchar' })
  reviewedBy: string | null;

  @Column({ type: 'enum', enum: ReviewStatus, default: ReviewStatus.PENDING })
  status: ReviewStatus;

  @Column({ name: 'rejection_reason', nullable: true, type: 'text' })
  rejectionReason: string | null;

  @Column({ nullable: true, type: 'text' })
  notes: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'completed_at', nullable: true, type: 'timestamptz' })
  completedAt: Date | null;

  @Column({ name: 'escalated_at', nullable: true, type: 'timestamptz' })
  escalatedAt: Date | null;

  @ManyToOne(() => Tenant, (t) => t.reviews)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @OneToOne(() => ExtractionResult, (er) => er.review)
  @JoinColumn({ name: 'extraction_result_id' })
  extractionResult: ExtractionResult;

  @ManyToOne(() => PlatformUser, (u) => u.reviews, { nullable: true })
  @JoinColumn({ name: 'reviewed_by' })
  reviewer: PlatformUser | null;

  @OneToMany(() => ReviewHistory, (rh) => rh.review)
  history: ReviewHistory[];
}

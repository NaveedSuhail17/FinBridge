import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ExtractionResult } from './extraction-result.entity';
import { PlatformUser } from './platform-user.entity';

@Entity('extraction_revisions')
@Index(['extractionResultId'])
export class ExtractionRevision {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'extraction_result_id' })
  extractionResultId: string;

  @Column({ name: 'revision_number' })
  revisionNumber: number;

  @Column({ name: 'corrected_data', type: 'jsonb' })
  correctedData: Record<string, unknown>;

  @Column({ name: 'corrected_by' })
  correctedBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => ExtractionResult, (er) => er.revisions)
  @JoinColumn({ name: 'extraction_result_id' })
  extractionResult: ExtractionResult;

  @ManyToOne(() => PlatformUser, (u) => u.extractionRevisions)
  @JoinColumn({ name: 'corrected_by' })
  corrector: PlatformUser;
}

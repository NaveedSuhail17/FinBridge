import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Review } from './review.entity';

@Entity('review_history')
@Index(['reviewId'])
export class ReviewHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'review_id' })
  reviewId: string;

  @Column({ name: 'field_name' })
  fieldName: string;

  @Column({ name: 'original_value', nullable: true, type: 'text' })
  originalValue: string | null;

  @Column({ name: 'new_value', nullable: true, type: 'text' })
  newValue: string | null;

  @Column({ name: 'changed_by' })
  changedBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Review, (r) => r.history)
  @JoinColumn({ name: 'review_id' })
  review: Review;
}

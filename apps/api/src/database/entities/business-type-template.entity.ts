import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { BusinessType } from './enums';

@Entity('business_type_templates')
export class BusinessTypeTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'business_type', type: 'enum', enum: BusinessType, unique: true })
  businessType: BusinessType;

  @Column({ name: 'default_tree', type: 'jsonb' })
  defaultTree: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

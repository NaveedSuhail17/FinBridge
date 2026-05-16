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
import { TransactionStatus } from './enums';
import { Tenant } from './tenant.entity';
import { Upload } from './upload.entity';
import { ExtractionResult } from './extraction-result.entity';

@Entity('payment_records')
@Index(['tenantId', 'status'])
@Index(['tenantId', 'paymentDate'])
export class PaymentRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column({ name: 'upload_id', unique: true })
  uploadId: string;

  @Column({ name: 'extraction_result_id', unique: true })
  extractionResultId: string;

  @Column({ nullable: true, type: 'varchar' })
  payer: string | null;

  @Column({ nullable: true, type: 'varchar' })
  payee: string | null;

  @Column({ nullable: true, type: 'decimal', precision: 12, scale: 2 })
  amount: number | null;

  @Column({ nullable: true, default: 'INR', type: 'varchar' })
  currency: string | null;

  @Column({ name: 'payment_date', nullable: true, type: 'timestamptz' })
  paymentDate: Date | null;

  @Column({ name: 'reference_number', nullable: true, type: 'varchar' })
  referenceNumber: string | null;

  @Column({ name: 'payment_mode', nullable: true, type: 'varchar' })
  paymentMode: string | null;

  @Column({ name: 'bank_name', nullable: true, type: 'varchar' })
  bankName: string | null;

  @Column({ type: 'enum', enum: TransactionStatus, default: TransactionStatus.PENDING })
  status: TransactionStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @OneToOne(() => Upload)
  @JoinColumn({ name: 'upload_id' })
  upload: Upload;

  @OneToOne(() => ExtractionResult)
  @JoinColumn({ name: 'extraction_result_id' })
  extractionResult: ExtractionResult;
}

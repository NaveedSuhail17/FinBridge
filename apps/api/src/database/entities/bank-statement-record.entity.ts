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
import { decimalTransformer } from '../transformers/decimal.transformer';

@Entity('bank_statement_records')
@Index(['tenantId', 'status'])
@Index(['tenantId', 'periodStart'])
export class BankStatementRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column({ name: 'upload_id', unique: true })
  uploadId: string;

  @Column({ name: 'extraction_result_id', unique: true })
  extractionResultId: string;

  @Column({ name: 'bank_name', nullable: true, type: 'varchar' })
  bankName: string | null;

  @Column({ name: 'account_number_masked', nullable: true, type: 'varchar' })
  accountNumberMasked: string | null;

  @Column({ name: 'account_holder', nullable: true, type: 'varchar' })
  accountHolder: string | null;

  @Column({ nullable: true, default: 'INR', type: 'varchar' })
  currency: string | null;

  @Column({ name: 'period_start', nullable: true, type: 'date' })
  periodStart: Date | null;

  @Column({ name: 'period_end', nullable: true, type: 'date' })
  periodEnd: Date | null;

  @Column({
    name: 'opening_balance',
    nullable: true,
    type: 'decimal',
    precision: 14,
    scale: 2,
    transformer: decimalTransformer,
  })
  openingBalance: number | null;

  @Column({
    name: 'closing_balance',
    nullable: true,
    type: 'decimal',
    precision: 14,
    scale: 2,
    transformer: decimalTransformer,
  })
  closingBalance: number | null;

  @Column({ name: 'transaction_rows', type: 'jsonb', default: '[]' })
  transactionRows: Record<string, unknown>[];

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

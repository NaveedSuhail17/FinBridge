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

@Entity('salary_register_records')
@Index(['tenantId', 'status'])
@Index(['tenantId', 'year', 'month'])
export class SalaryRegisterRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column({ name: 'upload_id', unique: true })
  uploadId: string;

  @Column({ name: 'extraction_result_id', unique: true })
  extractionResultId: string;

  @Column({ name: 'company_name', nullable: true, type: 'varchar' })
  companyName: string | null;

  @Column({ nullable: true, type: 'int' })
  month: number | null;

  @Column({ nullable: true, type: 'int' })
  year: number | null;

  @Column({ nullable: true, default: 'INR', type: 'varchar' })
  currency: string | null;

  @Column({ name: 'employee_count', nullable: true, type: 'int' })
  employeeCount: number | null;

  @Column({
    name: 'total_gross',
    nullable: true,
    type: 'decimal',
    precision: 14,
    scale: 2,
    transformer: decimalTransformer,
  })
  totalGross: number | null;

  @Column({
    name: 'total_deductions',
    nullable: true,
    type: 'decimal',
    precision: 14,
    scale: 2,
    transformer: decimalTransformer,
  })
  totalDeductions: number | null;

  @Column({
    name: 'total_net',
    nullable: true,
    type: 'decimal',
    precision: 14,
    scale: 2,
    transformer: decimalTransformer,
  })
  totalNet: number | null;

  @Column({ name: 'employee_rows', type: 'jsonb', default: '[]' })
  employeeRows: Record<string, unknown>[];

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

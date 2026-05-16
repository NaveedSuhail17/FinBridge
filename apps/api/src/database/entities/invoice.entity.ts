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
import { decimalTransformer } from '../transformers/decimal.transformer';
import { Tenant } from './tenant.entity';
import { Upload } from './upload.entity';
import { Transaction } from './transaction.entity';

@Entity('invoices')
@Index(['tenantId', 'status'])
@Index(['tenantId', 'vendorName'])
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column({ name: 'upload_id', unique: true })
  uploadId: string;

  @Column({ name: 'vendor_name', nullable: true, type: 'varchar' })
  vendorName: string | null;

  @Column({ name: 'invoice_number', nullable: true, type: 'varchar' })
  invoiceNumber: string | null;

  @Column({ name: 'invoice_date', nullable: true, type: 'timestamptz' })
  invoiceDate: Date | null;

  @Column({
    nullable: true,
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: decimalTransformer,
  })
  amount: number | null;

  @Column({
    nullable: true,
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: decimalTransformer,
  })
  subtotal: number | null;

  @Column({
    name: 'tax_amount',
    nullable: true,
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: decimalTransformer,
  })
  taxAmount: number | null;

  @Column({ nullable: true, default: 'INR', type: 'varchar' })
  currency: string | null;

  @Column({ type: 'enum', enum: TransactionStatus, default: TransactionStatus.PENDING })
  status: TransactionStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Tenant, (t) => t.invoices)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @OneToOne(() => Upload, (u) => u.invoice)
  @JoinColumn({ name: 'upload_id' })
  upload: Upload;

  @OneToOne(() => Transaction, (t) => t.invoice)
  transaction: Transaction;
}

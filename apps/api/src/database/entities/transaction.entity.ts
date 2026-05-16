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
import { Invoice } from './invoice.entity';
import { PaymentHead } from './payment-head.entity';
import { PaymentSubHead } from './payment-sub-head.entity';
import { decimalTransformer } from '../transformers/decimal.transformer';

@Entity('transactions')
@Index(['tenantId', 'transactionDate'])
@Index(['tenantId', 'paymentHeadId'])
@Index(['tenantId', 'vendorName'])
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column({ name: 'invoice_id', unique: true })
  invoiceId: string;

  @Column({ name: 'vendor_name' })
  vendorName: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, transformer: decimalTransformer })
  amount: number;

  @Column({ default: 'INR' })
  currency: string;

  @Column({ name: 'transaction_date', type: 'timestamptz' })
  transactionDate: Date;

  @Column({ name: 'payment_head_id' })
  paymentHeadId: string;

  @Column({ name: 'payment_sub_head_id' })
  paymentSubHeadId: string;

  @Column({ type: 'enum', enum: TransactionStatus, default: TransactionStatus.APPROVED })
  status: TransactionStatus;

  @Column({ nullable: true, type: 'text' })
  notes: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Tenant, (t) => t.transactions)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @OneToOne(() => Invoice, (i) => i.transaction)
  @JoinColumn({ name: 'invoice_id' })
  invoice: Invoice;

  @ManyToOne(() => PaymentHead, (ph) => ph.transactions)
  @JoinColumn({ name: 'payment_head_id' })
  paymentHead: PaymentHead;

  @ManyToOne(() => PaymentSubHead, (ps) => ps.transactions)
  @JoinColumn({ name: 'payment_sub_head_id' })
  paymentSubHead: PaymentSubHead;
}

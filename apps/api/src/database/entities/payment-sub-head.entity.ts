import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Unique,
  Index,
} from 'typeorm';
import { Tenant } from './tenant.entity';
import { PaymentHead } from './payment-head.entity';
import { Transaction } from './transaction.entity';

@Entity('payment_sub_heads')
@Unique(['tenantId', 'code'])
@Index(['tenantId', 'paymentHeadId'])
export class PaymentSubHead {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column({ name: 'payment_head_id' })
  paymentHeadId: string;

  @Column()
  code: string;

  @Column()
  name: string;

  @Column({ nullable: true, type: 'text' })
  description: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Tenant, (t) => t.paymentSubHeads)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @ManyToOne(() => PaymentHead, (ph) => ph.subHeads)
  @JoinColumn({ name: 'payment_head_id' })
  paymentHead: PaymentHead;

  @OneToMany(() => Transaction, (t) => t.paymentSubHead)
  transactions: Transaction[];
}

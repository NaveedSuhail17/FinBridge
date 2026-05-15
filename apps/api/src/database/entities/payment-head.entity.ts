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
import { PaymentSubHead } from './payment-sub-head.entity';
import { Transaction } from './transaction.entity';

@Entity('payment_heads')
@Unique(['tenantId', 'code'])
@Index(['tenantId'])
export class PaymentHead {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

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

  @ManyToOne(() => Tenant, (t) => t.paymentHeads)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @OneToMany(() => PaymentSubHead, (ps) => ps.paymentHead)
  subHeads: PaymentSubHead[];

  @OneToMany(() => Transaction, (t) => t.paymentHead)
  transactions: Transaction[];
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { BusinessType } from './enums';
import { Tenant } from './tenant.entity';
import { AccountingFirm } from './accounting-firm.entity';

@Entity('companies')
@Index(['accountingFirmId'])
export class Company {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', unique: true })
  tenantId: string;

  @Column({ name: 'accounting_firm_id' })
  accountingFirmId: string;

  @Column()
  name: string;

  @Column({ name: 'gst_number', nullable: true, type: 'varchar' })
  gstNumber: string | null;

  @Column({ name: 'business_type', type: 'enum', enum: BusinessType })
  businessType: BusinessType;

  @Column({ name: 'contact_email' })
  contactEmail: string;

  @Column({ name: 'contact_phone', nullable: true, type: 'varchar' })
  contactPhone: string | null;

  @Column({ nullable: true, type: 'text' })
  address: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToOne(() => Tenant, (t) => t.company)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @ManyToOne(() => AccountingFirm, (af) => af.companies)
  @JoinColumn({ name: 'accounting_firm_id' })
  accountingFirm: AccountingFirm;
}

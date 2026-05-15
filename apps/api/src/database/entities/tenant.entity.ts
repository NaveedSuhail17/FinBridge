import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { TenantType } from './enums';
import { UserTenant } from './user-tenant.entity';
import { AccountingFirm } from './accounting-firm.entity';
import { Company } from './company.entity';
import { Upload } from './upload.entity';
import { ExtractionJob } from './extraction-job.entity';
import { Invoice } from './invoice.entity';
import { Review } from './review.entity';
import { Transaction } from './transaction.entity';
import { PaymentHead } from './payment-head.entity';
import { PaymentSubHead } from './payment-sub-head.entity';
import { MISReport } from './mis-report.entity';
import { AuditLog } from './audit-log.entity';
import { Notification } from './notification.entity';

@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: TenantType })
  type: TenantType;

  @Column()
  name: string;

  @Column({ name: 'parent_tenant_id', nullable: true, type: 'varchar' })
  parentTenantId: string | null;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Tenant, (t) => t.childTenants, { nullable: true })
  @JoinColumn({ name: 'parent_tenant_id' })
  parentTenant: Tenant | null;

  @OneToMany(() => Tenant, (t) => t.parentTenant)
  childTenants: Tenant[];

  @OneToMany(() => UserTenant, (ut) => ut.tenant)
  userTenants: UserTenant[];

  @OneToOne(() => AccountingFirm, (af) => af.tenant)
  accountingFirm: AccountingFirm;

  @OneToOne(() => Company, (c) => c.tenant)
  company: Company;

  @OneToMany(() => Upload, (u) => u.tenant)
  uploads: Upload[];

  @OneToMany(() => ExtractionJob, (ej) => ej.tenant)
  extractionJobs: ExtractionJob[];

  @OneToMany(() => Invoice, (i) => i.tenant)
  invoices: Invoice[];

  @OneToMany(() => Review, (r) => r.tenant)
  reviews: Review[];

  @OneToMany(() => Transaction, (t) => t.tenant)
  transactions: Transaction[];

  @OneToMany(() => PaymentHead, (ph) => ph.tenant)
  paymentHeads: PaymentHead[];

  @OneToMany(() => PaymentSubHead, (ps) => ps.tenant)
  paymentSubHeads: PaymentSubHead[];

  @OneToMany(() => MISReport, (mr) => mr.tenant)
  misReports: MISReport[];

  @OneToMany(() => AuditLog, (al) => al.tenant)
  auditLogs: AuditLog[];

  @OneToMany(() => Notification, (n) => n.tenant)
  notifications: Notification[];
}

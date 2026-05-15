import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { UserTenant } from './user-tenant.entity';
import { AuditLog } from './audit-log.entity';
import { Notification } from './notification.entity';
import { Review } from './review.entity';
import { Upload } from './upload.entity';
import { MISReport } from './mis-report.entity';
import { ExtractionRevision } from './extraction-revision.entity';

@Entity('platform_users')
export class PlatformUser {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'password_hash' })
  passwordHash: string;

  @Column()
  name: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => UserTenant, (ut) => ut.user)
  userTenants: UserTenant[];

  @OneToMany(() => AuditLog, (al) => al.user)
  auditLogs: AuditLog[];

  @OneToMany(() => Notification, (n) => n.user)
  notifications: Notification[];

  @OneToMany(() => Review, (r) => r.reviewer)
  reviews: Review[];

  @OneToMany(() => Upload, (u) => u.uploader)
  uploads: Upload[];

  @OneToMany(() => MISReport, (r) => r.uploader)
  misReports: MISReport[];

  @OneToMany(() => ExtractionRevision, (er) => er.corrector)
  extractionRevisions: ExtractionRevision[];
}

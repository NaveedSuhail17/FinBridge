import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { FileType } from './enums';
import { Tenant } from './tenant.entity';
import { PlatformUser } from './platform-user.entity';
import { ExtractionJob } from './extraction-job.entity';
import { Invoice } from './invoice.entity';

@Entity('uploads')
@Index(['tenantId'])
@Index(['tenantId', 'fileType'])
export class Upload {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column({ name: 'file_path' })
  filePath: string;

  @Column({ name: 'file_name' })
  fileName: string;

  @Column({ name: 'file_size' })
  fileSize: number;

  @Column({ name: 'mime_type' })
  mimeType: string;

  @Column({ name: 'file_type', type: 'enum', enum: FileType })
  fileType: FileType;

  @Column({ name: 'uploaded_by' })
  uploadedBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Tenant, (t) => t.uploads)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @ManyToOne(() => PlatformUser, (u) => u.uploads)
  @JoinColumn({ name: 'uploaded_by' })
  uploader: PlatformUser;

  @OneToOne(() => ExtractionJob, (ej) => ej.upload)
  extractionJob: ExtractionJob;

  @OneToOne(() => Invoice, (i) => i.upload)
  invoice: Invoice;
}

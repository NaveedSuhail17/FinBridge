import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
  Index,
} from 'typeorm';
import { PlatformUser } from './platform-user.entity';
import { Tenant } from './tenant.entity';
import { Role } from './role.entity';

@Entity('user_tenants')
@Unique(['userId', 'tenantId'])
@Index(['tenantId'])
export class UserTenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column({ name: 'role_id' })
  roleId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => PlatformUser, (u) => u.userTenants, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: PlatformUser;

  @ManyToOne(() => Tenant, (t) => t.userTenants, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @ManyToOne(() => Role, (r) => r.userTenants)
  @JoinColumn({ name: 'role_id' })
  role: Role;
}

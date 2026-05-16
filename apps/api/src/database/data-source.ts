import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { PlatformUser } from './entities/platform-user.entity';
import { Tenant } from './entities/tenant.entity';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { RolePermission } from './entities/role-permission.entity';
import { UserTenant } from './entities/user-tenant.entity';
import { AccountingFirm } from './entities/accounting-firm.entity';
import { Company } from './entities/company.entity';
import { Upload } from './entities/upload.entity';
import { ExtractionJob } from './entities/extraction-job.entity';
import { ExtractionResult } from './entities/extraction-result.entity';
import { ExtractionRevision } from './entities/extraction-revision.entity';
import { Invoice } from './entities/invoice.entity';
import { Review } from './entities/review.entity';
import { ReviewHistory } from './entities/review-history.entity';
import { Transaction } from './entities/transaction.entity';
import { PaymentHead } from './entities/payment-head.entity';
import { PaymentSubHead } from './entities/payment-sub-head.entity';
import { BusinessTypeTemplate } from './entities/business-type-template.entity';
import { MISReport } from './entities/mis-report.entity';
import { AuditLog } from './entities/audit-log.entity';
import { Notification } from './entities/notification.entity';
import { PaymentRecord } from './entities/payment-record.entity';
import { SalaryRegisterRecord } from './entities/salary-register-record.entity';
import { BankStatementRecord } from './entities/bank-statement-record.entity';

dotenv.config({ path: '../../.env' });

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
  entities: [
    PlatformUser,
    Tenant,
    Role,
    Permission,
    RolePermission,
    UserTenant,
    AccountingFirm,
    Company,
    Upload,
    ExtractionJob,
    ExtractionResult,
    ExtractionRevision,
    Invoice,
    Review,
    ReviewHistory,
    Transaction,
    PaymentHead,
    PaymentSubHead,
    BusinessTypeTemplate,
    MISReport,
    AuditLog,
    Notification,
    PaymentRecord,
    SalaryRegisterRecord,
    BankStatementRecord,
  ],
  migrations: ['src/database/migrations/*.ts'],
  migrationsTableName: 'migrations',
});

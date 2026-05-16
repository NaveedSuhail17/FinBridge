import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CommonModule } from './common/common.module';
import { AuditModule } from './audit/audit.module';
import { TenantsModule } from './tenants/tenants.module';
import { AccountingFirmsModule } from './accounting-firms/accounting-firms.module';
import { CompaniesModule } from './companies/companies.module';
import { PaymentHeadsModule } from './payment-heads/payment-heads.module';
import { PaymentSubHeadsModule } from './payment-sub-heads/payment-sub-heads.module';
import { UploadsModule } from './uploads/uploads.module';
import { AiModule } from './ai/ai.module';
import { ReviewsModule } from './reviews/reviews.module';
import { TransactionsModule } from './transactions/transactions.module';
import { ReportsModule } from './reports/reports.module';
import { PaymentRecordsModule } from './payment-records/payment-records.module';
import { SalaryRegistersModule } from './salary-registers/salary-registers.module';
import { BankStatementsModule } from './bank-statements/bank-statements.module';
import { NotificationsModule } from './notifications/notifications.module';
import {
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
} from './database/entities';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('DATABASE_URL'),
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
        synchronize: false,
        logging: config.get<string>('NODE_ENV') === 'development',
      }),
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: () => ({
        throttlers: [{ ttl: 60000, limit: 30 }],
      }),
    }),
    ScheduleModule.forRoot(),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        redis: {
          host: config.get<string>('REDIS_HOST') ?? 'localhost',
          port: config.get<number>('REDIS_PORT') ?? 6379,
        },
      }),
    }),
    RedisModule,
    AuthModule,
    CommonModule,
    UsersModule,
    AuditModule,
    TenantsModule,
    AccountingFirmsModule,
    CompaniesModule,
    PaymentHeadsModule,
    PaymentSubHeadsModule,
    UploadsModule,
    AiModule,
    ReviewsModule,
    TransactionsModule,
    ReportsModule,
    PaymentRecordsModule,
    SalaryRegistersModule,
    BankStatementsModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CommonModule } from './common/common.module';
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
    RedisModule,
    AuthModule,
    CommonModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}

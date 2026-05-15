import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountingFirm } from '../database/entities/accounting-firm.entity';
import { Tenant } from '../database/entities/tenant.entity';
import { AccountingFirmsService } from './accounting-firms.service';
import { AccountingFirmsController } from './accounting-firms.controller';
import { AuditModule } from '../audit/audit.module';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [TypeOrmModule.forFeature([AccountingFirm, Tenant]), AuditModule, RedisModule],
  providers: [AccountingFirmsService],
  controllers: [AccountingFirmsController],
  exports: [AccountingFirmsService],
})
export class AccountingFirmsModule {}

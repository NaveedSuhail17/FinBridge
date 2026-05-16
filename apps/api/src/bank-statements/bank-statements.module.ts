import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BankStatementRecord } from '../database/entities/bank-statement-record.entity';
import { BankStatementsService } from './bank-statements.service';
import { BankStatementsController } from './bank-statements.controller';

@Module({
  imports: [TypeOrmModule.forFeature([BankStatementRecord])],
  providers: [BankStatementsService],
  controllers: [BankStatementsController],
  exports: [BankStatementsService],
})
export class BankStatementsModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalaryRegisterRecord } from '../database/entities/salary-register-record.entity';
import { SalaryRegistersService } from './salary-registers.service';
import { SalaryRegistersController } from './salary-registers.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SalaryRegisterRecord])],
  providers: [SalaryRegistersService],
  controllers: [SalaryRegistersController],
  exports: [SalaryRegistersService],
})
export class SalaryRegistersModule {}

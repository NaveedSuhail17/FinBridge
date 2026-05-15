import { IsEnum, IsOptional, IsDateString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ReportType {
  EXPENSE_SUMMARY = 'EXPENSE_SUMMARY',
  VENDOR_SUMMARY = 'VENDOR_SUMMARY',
  CATEGORY_BREAKDOWN = 'CATEGORY_BREAKDOWN',
  CASH_FLOW = 'CASH_FLOW',
}

export class GenerateReportDto {
  @ApiProperty({ enum: ReportType })
  @IsEnum(ReportType)
  type: ReportType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  companyId?: string;
}

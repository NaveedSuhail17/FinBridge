import { IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateTransactionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  paymentHeadId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  paymentSubHeadId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

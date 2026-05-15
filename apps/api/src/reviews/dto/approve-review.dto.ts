import { IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ApproveReviewDto {
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

import { IsString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TenantType } from '../../database/entities/enums';

export class CreateTenantDto {
  @ApiProperty({ enum: TenantType })
  @IsEnum(TenantType)
  type: TenantType;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  parentTenantId?: string;
}

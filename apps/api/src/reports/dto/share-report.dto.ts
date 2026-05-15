import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum ShareExpiry {
  SEVEN_DAYS = '7d',
  THIRTY_DAYS = '30d',
  NO_EXPIRY = 'none',
}

export class ShareReportDto {
  @ApiProperty({ enum: ShareExpiry })
  @IsEnum(ShareExpiry)
  expiry: ShareExpiry;
}

import { IsEmail, IsString, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'admin@finbridge.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Password@123' })
  @IsString()
  password: string;

  @ApiPropertyOptional({
    description: 'Tenant to authenticate into (uses first membership if omitted)',
  })
  @IsOptional()
  @IsUUID()
  tenantId?: string;
}

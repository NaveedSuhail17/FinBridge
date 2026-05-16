import { IsEmail, IsString, MinLength, Matches, IsOptional, IsUUID } from 'class-validator';
// roleName intentionally removed — self-registration always assigns COMPANY_USER role
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'Jane Doe' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'jane@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Password@123' })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/, {
    message: 'Password must contain uppercase, lowercase, number and special character',
  })
  password: string;

  @ApiPropertyOptional({
    description: 'Tenant to join on registration (defaults to platform tenant)',
  })
  @IsOptional()
  @IsUUID()
  tenantId?: string;
}

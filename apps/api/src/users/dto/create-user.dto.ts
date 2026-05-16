import { IsString, IsEmail, MinLength, IsUUID, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ description: 'Tenant the user will belong to' })
  @IsUUID()
  tenantId: string;

  @ApiProperty({ enum: ['PLATFORM_ADMIN', 'ACCOUNTING_FIRM_ADMIN', 'ACCOUNTANT', 'COMPANY_USER'] })
  @IsIn(['PLATFORM_ADMIN', 'ACCOUNTING_FIRM_ADMIN', 'ACCOUNTANT', 'COMPANY_USER'])
  roleName: string;
}

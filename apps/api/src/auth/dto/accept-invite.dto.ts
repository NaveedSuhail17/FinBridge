import { IsString, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AcceptInviteDto {
  @ApiProperty({ description: 'Invite token from query string' })
  @IsString()
  token: string;

  @ApiProperty({ example: 'Jane Doe' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Password@123' })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/, {
    message: 'Password must contain uppercase, lowercase, number and special character',
  })
  password: string;
}

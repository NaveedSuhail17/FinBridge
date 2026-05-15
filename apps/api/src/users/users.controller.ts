import { Controller, Get, Patch, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile with tenant and role' })
  async getMe(@CurrentUser() user: AuthenticatedUser) {
    const profile = await this.usersService.getProfile(user.id, user.tenantId);
    return { success: true, data: profile };
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user name or password' })
  @ApiResponse({ status: 200, description: 'Profile updated' })
  async updateMe(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateUserDto) {
    const updated = await this.usersService.update(user.id, dto);
    return {
      success: true,
      data: {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        updatedAt: updated.updatedAt,
      },
    };
  }
}

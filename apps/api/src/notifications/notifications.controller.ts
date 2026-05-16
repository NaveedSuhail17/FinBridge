import { Controller, Get, Patch, Param, Query, Sse, UseGuards } from '@nestjs/common';
import { map } from 'rxjs/operators';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'List notifications for current user (unread first)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const { data, total } = await this.service.findAll(
      user.id,
      user.tenantId,
      Number(page ?? 1),
      Number(limit ?? 20),
    );
    return {
      success: true,
      data,
      meta: { total, page: Number(page ?? 1), limit: Number(limit ?? 20) },
    };
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  async markRead(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    await this.service.markRead(id, user.id, user.tenantId);
    return { success: true };
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllRead(@CurrentUser() user: AuthenticatedUser) {
    await this.service.markAllRead(user.id, user.tenantId);
    return { success: true };
  }

  @Sse('stream')
  @ApiOperation({ summary: 'SSE stream of new notifications for current user' })
  stream(@CurrentUser() user: AuthenticatedUser) {
    return this.service
      .stream(user.id)
      .pipe(map((notification) => ({ data: JSON.stringify(notification) })));
  }
}

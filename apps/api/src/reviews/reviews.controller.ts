import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { ReviewsService } from './reviews.service';
import { ApproveReviewDto } from './dto/approve-review.dto';
import { RejectReviewDto } from './dto/reject-review.dto';
import { EditReviewDto } from './dto/edit-review.dto';

@ApiTags('Reviews')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get('pending')
  @ApiOperation({ summary: 'Get pending reviews for current tenant (paginated)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getPending(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const { data, total } = await this.reviewsService.findPending(
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

  @Get(':id')
  @ApiOperation({ summary: 'Get review with extraction data, file path, and per-field confidence' })
  async findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return { success: true, data: await this.reviewsService.findOne(id, user.tenantId) };
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve a review — creates Transaction and AuditLog' })
  async approve(
    @Param('id') id: string,
    @Body() dto: ApproveReviewDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.reviewsService.approve(id, user.tenantId, user.id, dto);
    return { success: true, data };
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject a review with reason' })
  async reject(
    @Param('id') id: string,
    @Body() dto: RejectReviewDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.reviewsService.reject(id, user.tenantId, user.id, dto);
    return { success: true, message: 'Review rejected' };
  }

  @Patch(':id/edit')
  @ApiOperation({ summary: 'Edit extracted fields — stores ReviewHistory per changed field' })
  async edit(
    @Param('id') id: string,
    @Body() dto: EditReviewDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.reviewsService.edit(id, user.tenantId, user.id, dto);
    return { success: true, message: 'Review updated' };
  }
}

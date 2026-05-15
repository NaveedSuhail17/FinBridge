import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { ExtractionService } from './extraction/extraction.service';

@ApiTags('AI Extraction')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai/extract')
export class AiController {
  constructor(private readonly extractionService: ExtractionService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Poll AI extraction job status' })
  async getStatus(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    const data = await this.extractionService.getJobStatus(id, user.tenantId);
    return { success: true, data };
  }
}

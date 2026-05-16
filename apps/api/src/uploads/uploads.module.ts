import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { Upload } from '../database/entities/upload.entity';
import { ExtractionJob } from '../database/entities/extraction-job.entity';
import { UploadsService } from './uploads.service';
import { UploadsController } from './uploads.controller';
import { StorageService } from './storage/storage.service';
import { AuditModule } from '../audit/audit.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Upload, ExtractionJob]),
    BullModule.registerQueue({ name: 'extraction' }),
    AuditModule,
    NotificationsModule,
  ],
  providers: [UploadsService, StorageService],
  controllers: [UploadsController],
  exports: [UploadsService, StorageService],
})
export class UploadsModule {}

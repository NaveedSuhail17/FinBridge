import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from './authorization/roles.guard';
import { PermissionsGuard } from './authorization/permissions.guard';
import { TenantContextService } from './tenant/tenant-context.service';
import { RolePermission } from '../database/entities/role-permission.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RolePermission])],
  providers: [
    TenantContextService,
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
  ],
  exports: [TenantContextService],
})
export class CommonModule {}

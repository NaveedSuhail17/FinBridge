import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PlatformUser } from '../database/entities/platform-user.entity';
import { UserTenant } from '../database/entities/user-tenant.entity';
import { Tenant } from '../database/entities/tenant.entity';
import { Role } from '../database/entities/role.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PlatformUser, UserTenant, Tenant, Role])],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}

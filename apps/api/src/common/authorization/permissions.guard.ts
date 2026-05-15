import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PERMISSIONS_KEY } from './permissions.decorator';
import { RolePermission } from '../../database/entities/role-permission.entity';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @InjectRepository(RolePermission)
    private readonly rolePermissionRepo: Repository<RolePermission>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions || requiredPermissions.length === 0) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user) return false;

    const rolePermissions = await this.rolePermissionRepo.find({
      where: { roleId: user.roleId },
      relations: ['permission'],
    });

    const granted = new Set(rolePermissions.map((rp) => rp.permission?.name).filter(Boolean));
    const hasAll = requiredPermissions.every((p) => granted.has(p));
    if (!hasAll) throw new ForbiddenException('Insufficient permissions');
    return true;
  }
}

import { Injectable, Scope, Inject, InternalServerErrorException } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { AuthenticatedUser } from '../decorators/current-user.decorator';

@Injectable({ scope: Scope.REQUEST })
export class TenantContextService {
  constructor(@Inject(REQUEST) private readonly request: Request) {}

  getUser(): AuthenticatedUser {
    const user = this.request['user'] as AuthenticatedUser | undefined;
    if (!user)
      throw new InternalServerErrorException(
        'Tenant context not available — user not authenticated',
      );
    return user;
  }

  getTenantId(): string {
    return this.getUser().tenantId;
  }

  getRoleName(): string {
    return this.getUser()?.roleName;
  }

  isPlatformAdmin(): boolean {
    return this.getRoleName() === 'PLATFORM_ADMIN';
  }

  isTenantScopingRequired(): boolean {
    return !this.isPlatformAdmin();
  }

  getTenantFilter(): { tenantId: string } | Record<string, never> {
    if (!this.isTenantScopingRequired()) return {};
    return { tenantId: this.getTenantId() };
  }
}

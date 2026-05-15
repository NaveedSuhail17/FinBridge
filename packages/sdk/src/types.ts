import type { UserRole, TenantType } from '@finbridge/types';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  tenantId: string;
  tenantType: TenantType;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

/** Raw envelope shape returned by every API endpoint. */
export interface ApiEnvelope<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedMeta {
  total: number;
  page: number;
  limit: number;
}

export interface PaginatedEnvelope<T = unknown> extends ApiEnvelope<T[]> {
  meta: PaginatedMeta;
}

export interface UploadProgressEvent {
  loaded: number;
  total: number;
  percent: number;
}

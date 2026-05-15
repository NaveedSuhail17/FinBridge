export interface JwtPayload {
  sub: string;
  email: string;
  tenantId: string;
  roleId: string;
  roleName: string;
}

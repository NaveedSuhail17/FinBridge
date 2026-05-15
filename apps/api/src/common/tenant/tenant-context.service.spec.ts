import { TenantContextService } from './tenant-context.service';

function makeService(user: object | null): TenantContextService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new TenantContextService({ user } as any);
}

describe('TenantContextService', () => {
  describe('getTenantFilter', () => {
    it('returns empty object for PLATFORM_ADMIN', () => {
      const svc = makeService({
        id: '1',
        email: 'admin@test.com',
        tenantId: 't1',
        roleId: 'r1',
        roleName: 'PLATFORM_ADMIN',
      });
      expect(svc.getTenantFilter()).toEqual({});
    });

    it('returns { tenantId } for non-admin roles', () => {
      const svc = makeService({
        id: '2',
        email: 'user@test.com',
        tenantId: 'tenant-abc',
        roleId: 'r2',
        roleName: 'COMPANY_USER',
      });
      expect(svc.getTenantFilter()).toEqual({ tenantId: 'tenant-abc' });
    });

    it('returns { tenantId } for ACCOUNTANT role', () => {
      const svc = makeService({
        id: '3',
        email: 'acc@test.com',
        tenantId: 'tenant-xyz',
        roleId: 'r3',
        roleName: 'ACCOUNTANT',
      });
      expect(svc.getTenantFilter()).toEqual({ tenantId: 'tenant-xyz' });
    });
  });

  describe('isTenantScopingRequired', () => {
    it('returns false for PLATFORM_ADMIN', () => {
      const svc = makeService({ roleName: 'PLATFORM_ADMIN', tenantId: 't1' });
      expect(svc.isTenantScopingRequired()).toBe(false);
    });

    it('returns true for all other roles', () => {
      const svc = makeService({ roleName: 'FIRM_ADMIN', tenantId: 't2' });
      expect(svc.isTenantScopingRequired()).toBe(true);
    });
  });
});

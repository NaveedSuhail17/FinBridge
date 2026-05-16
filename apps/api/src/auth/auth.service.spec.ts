import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PlatformUser } from '../database/entities/platform-user.entity';
import { Tenant } from '../database/entities/tenant.entity';
import { Role } from '../database/entities/role.entity';
import { UserTenant } from '../database/entities/user-tenant.entity';
import { REDIS_CLIENT } from '../redis/redis.constants';
import { TenantType } from '../database/entities/enums';

const mockUserRepo = {
  findOneBy: jest.fn(),
  save: jest.fn(),
  create: jest.fn((dto) => dto),
};

const mockTenantRepo = {
  findOneBy: jest.fn(),
};

const mockRoleRepo = {
  findOneBy: jest.fn(),
};

const mockUserTenantRepo = {
  findOneBy: jest.fn(),
  find: jest.fn(),
  save: jest.fn(),
  create: jest.fn((dto) => dto),
};

const mockJwtService = {
  sign: jest.fn().mockReturnValue('mock-access-token'),
};

const mockConfigService = {
  get: jest.fn().mockReturnValue('15m'),
  getOrThrow: jest.fn().mockReturnValue('test-secret'),
};

const mockRedis = {
  exists: jest.fn().mockResolvedValue(0),
  get: jest.fn(),
  set: jest.fn(),
  setex: jest.fn(),
  del: jest.fn(),
  incr: jest.fn().mockResolvedValue(1),
  expire: jest.fn(),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(PlatformUser), useValue: mockUserRepo },
        { provide: getRepositoryToken(Tenant), useValue: mockTenantRepo },
        { provide: getRepositoryToken(Role), useValue: mockRoleRepo },
        { provide: getRepositoryToken(UserTenant), useValue: mockUserTenantRepo },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: REDIS_CLIENT, useValue: mockRedis },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('validateUser', () => {
    it('returns null and increments fail counter for non-existent user', async () => {
      mockRedis.exists.mockResolvedValue(0);
      mockUserRepo.findOneBy.mockResolvedValue(null);
      const result = await service.validateUser('nobody@test.com', 'pass');
      expect(result).toBeNull();
      expect(mockRedis.incr).toHaveBeenCalled();
    });

    it('returns null for wrong password', async () => {
      mockRedis.exists.mockResolvedValue(0);
      const hash = await bcrypt.hash('correct', 10);
      mockUserRepo.findOneBy.mockResolvedValue({ id: '1', email: 'u@t.com', passwordHash: hash });
      const result = await service.validateUser('u@t.com', 'wrong');
      expect(result).toBeNull();
    });

    it('returns user for correct credentials', async () => {
      mockRedis.exists.mockResolvedValue(0);
      const hash = await bcrypt.hash('Password@123', 10);
      const user = { id: '1', email: 'u@t.com', passwordHash: hash };
      mockUserRepo.findOneBy.mockResolvedValue(user);
      mockRedis.del.mockResolvedValue(1);
      const result = await service.validateUser('u@t.com', 'Password@123');
      expect(result).toEqual(user);
    });

    it('throws when account is locked', async () => {
      mockRedis.exists.mockResolvedValue(1);
      await expect(service.validateUser('locked@t.com', 'pass')).rejects.toThrow();
    });
  });

  describe('register', () => {
    it('throws ConflictException if email already exists', async () => {
      mockUserRepo.findOneBy.mockResolvedValue({ id: '1' });
      await expect(
        service.register({ email: 'a@b.com', password: 'P@ss1234', name: 'A' }),
      ).rejects.toThrow(ConflictException);
    });

    it('registers successfully with platform tenant', async () => {
      mockUserRepo.findOneBy.mockResolvedValue(null);
      mockUserRepo.save.mockResolvedValue({ id: 'new-id', email: 'new@test.com', name: 'New' });
      mockTenantRepo.findOneBy.mockResolvedValue({
        id: 'tenant-1',
        name: 'Platform',
        type: TenantType.PLATFORM,
      });
      mockRoleRepo.findOneBy.mockResolvedValue({ id: 'role-1', name: 'COMPANY_USER' });
      mockUserTenantRepo.save.mockResolvedValue({});
      mockRedis.setex.mockResolvedValue('OK');

      const result = await service.register({
        email: 'new@test.com',
        password: 'P@ssword@1',
        name: 'New',
      });
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });
  });

  describe('logout', () => {
    it('deletes the refresh token from redis', async () => {
      await service.logout('some-token', 'user-id-123');
      expect(mockRedis.del).toHaveBeenCalledWith('refresh:some-token');
    });
  });
});

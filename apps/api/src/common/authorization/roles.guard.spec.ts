import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { RolesGuard } from './roles.guard';

const mockReflector = { getAllAndOverride: jest.fn() };

function buildContext(roleName: string): ExecutionContext {
  return {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({ getRequest: () => ({ user: { roleName } }) }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  let guard: RolesGuard;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [RolesGuard, { provide: Reflector, useValue: mockReflector }],
    }).compile();
    guard = module.get<RolesGuard>(RolesGuard);
  });

  it('allows access when no roles are required', () => {
    mockReflector.getAllAndOverride.mockReturnValue([]);
    expect(guard.canActivate(buildContext('COMPANY_USER'))).toBe(true);
  });

  it('allows access for matching role', () => {
    mockReflector.getAllAndOverride.mockReturnValue(['PLATFORM_ADMIN']);
    expect(guard.canActivate(buildContext('PLATFORM_ADMIN'))).toBe(true);
  });

  it('throws ForbiddenException for non-matching role', () => {
    mockReflector.getAllAndOverride.mockReturnValue(['PLATFORM_ADMIN']);
    expect(() => guard.canActivate(buildContext('COMPANY_USER'))).toThrow(ForbiddenException);
  });
});

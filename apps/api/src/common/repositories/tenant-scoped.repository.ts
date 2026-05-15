import { Repository, FindManyOptions, FindOneOptions, ObjectLiteral } from 'typeorm';

export abstract class TenantScopedRepository<T extends ObjectLiteral> {
  protected abstract get repository(): Repository<T>;

  protected scopedFind(
    tenantId: string | null,
    options: FindManyOptions<T> = {},
  ): FindManyOptions<T> {
    if (!tenantId) return options;
    return {
      ...options,
      where: options.where
        ? Array.isArray(options.where)
          ? options.where.map((w) => ({ ...w, tenantId }))
          : { ...options.where, tenantId }
        : ({ tenantId } as unknown as FindManyOptions<T>['where']),
    };
  }

  protected scopedFindOne(
    tenantId: string | null,
    options: FindOneOptions<T> = {},
  ): FindOneOptions<T> {
    if (!tenantId) return options;
    return {
      ...options,
      where: options.where
        ? Array.isArray(options.where)
          ? options.where.map((w) => ({ ...w, tenantId }))
          : { ...options.where, tenantId }
        : ({ tenantId } as unknown as FindOneOptions<T>['where']),
    };
  }

  async findAllForTenant(tenantId: string | null, options: FindManyOptions<T> = {}): Promise<T[]> {
    return this.repository.find(this.scopedFind(tenantId, options));
  }

  async findOneForTenant(tenantId: string | null, options: FindOneOptions<T>): Promise<T | null> {
    return this.repository.findOne(this.scopedFindOne(tenantId, options));
  }
}

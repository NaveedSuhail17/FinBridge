import type { ValueTransformer } from 'typeorm';

/** TypeORM returns DECIMAL/NUMERIC columns as strings. This transformer coerces them to numbers. */
export const decimalTransformer: ValueTransformer = {
  to: (value: number | null): string | null => (value == null ? null : String(value)),
  from: (value: string | null): number | null => (value == null ? null : parseFloat(value)),
};

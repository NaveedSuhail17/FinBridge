import { Injectable } from '@nestjs/common';
import { SalaryRegisterExtraction } from '../validators/extraction-schemas';

const TOLERANCE = 0.05;

@Injectable()
export class SalaryRegisterValidatorService {
  validate(data: SalaryRegisterExtraction): string[] {
    const errors: string[] = [];

    if (!data.company_name) errors.push('company_name is required');

    if (data.month !== null) {
      if (data.month < 1 || data.month > 12) errors.push(`Invalid month: ${data.month}`);
    } else {
      errors.push('month is required');
    }

    if (data.year !== null) {
      const currentYear = new Date().getFullYear();
      if (data.year < 2000 || data.year > currentYear + 1) {
        errors.push(`Year out of expected range: ${data.year}`);
      }
    } else {
      errors.push('year is required');
    }

    if (data.employee_rows.length === 0) {
      errors.push('No employee rows extracted');
    }

    if (data.total_net !== null && data.employee_rows.length > 0) {
      const rowSum = data.employee_rows.reduce((sum, r) => sum + (r.net_salary ?? 0), 0);
      if (Math.abs(rowSum - Number(data.total_net)) > TOLERANCE * Number(data.total_net)) {
        errors.push(
          `total_net (${data.total_net}) does not match sum of employee net salaries (${rowSum.toFixed(2)})`,
        );
      }
    }

    return errors;
  }
}

import { Injectable } from '@nestjs/common';
import { BankStatementExtraction } from '../validators/extraction-schemas';

const BALANCE_TOLERANCE = 1.0;

@Injectable()
export class BankStatementValidatorService {
  validate(data: BankStatementExtraction): string[] {
    const errors: string[] = [];

    if (!data.bank_name) errors.push('bank_name is required');

    if (data.period_start && data.period_end) {
      const start = new Date(data.period_start);
      const end = new Date(data.period_end);
      if (isNaN(start.getTime())) errors.push(`Invalid period_start: ${data.period_start}`);
      if (isNaN(end.getTime())) errors.push(`Invalid period_end: ${data.period_end}`);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && start > end) {
        errors.push('period_start is after period_end');
      }
    }

    if (
      data.opening_balance !== null &&
      data.closing_balance !== null &&
      data.transaction_rows.length > 0
    ) {
      const totalCredits = data.transaction_rows.reduce((s, r) => s + (r.credit ?? 0), 0);
      const totalDebits = data.transaction_rows.reduce((s, r) => s + (r.debit ?? 0), 0);
      const expected = Number(data.opening_balance) + totalCredits - totalDebits;
      const actual = Number(data.closing_balance);
      if (Math.abs(expected - actual) > BALANCE_TOLERANCE) {
        errors.push(
          `Balance mismatch: opening(${data.opening_balance}) + credits(${totalCredits.toFixed(2)}) - debits(${totalDebits.toFixed(2)}) = ${expected.toFixed(2)}, but closing is ${actual}`,
        );
      }
    }

    return errors;
  }
}

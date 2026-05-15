import { Injectable } from '@nestjs/common';
import { InvoiceExtraction } from '../validators/extraction-schemas';

const RECOGNIZED_CURRENCIES = new Set([
  'INR',
  'USD',
  'EUR',
  'GBP',
  'AED',
  'SGD',
  'AUD',
  'CAD',
  'JPY',
]);

@Injectable()
export class FinancialValidatorService {
  validate(data: InvoiceExtraction): string[] {
    const errors: string[] = [];

    if (data.total_amount !== null && data.subtotal !== null && data.tax_amount !== null) {
      const expected = Number(data.subtotal) + Number(data.tax_amount);
      const actual = Number(data.total_amount);
      if (Math.abs(expected - actual) > 0.02) {
        errors.push(
          `Total mismatch: subtotal(${data.subtotal}) + tax(${data.tax_amount}) = ${expected}, but total is ${actual}`,
        );
      }
    }

    if (data.invoice_date) {
      const date = new Date(data.invoice_date);
      if (isNaN(date.getTime())) {
        errors.push(`Invalid invoice_date: ${data.invoice_date}`);
      } else if (date > new Date()) {
        errors.push('invoice_date is in the future');
      }
    }

    if (data.currency && !RECOGNIZED_CURRENCIES.has(data.currency.toUpperCase())) {
      errors.push(`Unrecognized currency: ${data.currency}`);
    }

    if (!data.vendor_name) errors.push('vendor_name is required');
    if (!data.total_amount) errors.push('total_amount is required');

    return errors;
  }
}

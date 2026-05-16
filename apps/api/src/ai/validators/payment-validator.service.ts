import { Injectable } from '@nestjs/common';
import { PaymentExtraction } from '../validators/extraction-schemas';

@Injectable()
export class PaymentValidatorService {
  validate(data: PaymentExtraction): string[] {
    const errors: string[] = [];

    if (!data.payer) errors.push('payer is required');
    if (!data.payee) errors.push('payee is required');

    if (data.amount !== null) {
      if (data.amount <= 0) errors.push('amount must be greater than zero');
    } else {
      errors.push('amount is required');
    }

    if (data.payment_date) {
      const date = new Date(data.payment_date);
      if (isNaN(date.getTime())) {
        errors.push(`Invalid payment_date: ${data.payment_date}`);
      } else if (date > new Date()) {
        errors.push('payment_date is in the future');
      }
    }

    return errors;
  }
}

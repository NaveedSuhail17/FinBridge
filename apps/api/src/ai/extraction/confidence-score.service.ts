import { Injectable } from '@nestjs/common';
import { InvoiceExtraction } from '../validators/extraction-schemas';

const CONFIDENCE_THRESHOLD = 70;

@Injectable()
export class ConfidenceScoreService {
  computeOverall(data: InvoiceExtraction): number {
    return data.confidence.overall;
  }

  meetsThreshold(data: InvoiceExtraction): boolean {
    return data.confidence.overall >= CONFIDENCE_THRESHOLD;
  }

  getFieldConfidences(data: InvoiceExtraction): Record<string, number> {
    return {
      vendor_name: data.confidence.vendor_name,
      invoice_number: data.confidence.invoice_number,
      invoice_date: data.confidence.invoice_date,
      total_amount: data.confidence.total_amount,
      line_items: data.confidence.line_items,
      overall: data.confidence.overall,
    };
  }
}

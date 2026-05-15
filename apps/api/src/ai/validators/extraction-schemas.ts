import { z } from 'zod';

export const LineItemSchema = z.object({
  description: z.string(),
  quantity: z.number().nullable(),
  unit_price: z.number().nullable(),
  total: z.number().nullable(),
});

export const ConfidenceSchema = z.object({
  vendor_name: z.number().int().min(0).max(100),
  invoice_number: z.number().int().min(0).max(100),
  invoice_date: z.number().int().min(0).max(100),
  total_amount: z.number().int().min(0).max(100),
  line_items: z.number().int().min(0).max(100),
  overall: z.number().int().min(0).max(100),
});

export const InvoiceExtractionSchema = z.object({
  vendor_name: z.string().nullable(),
  vendor_address: z.string().nullable(),
  invoice_number: z.string().nullable(),
  invoice_date: z.string().nullable(),
  due_date: z.string().nullable(),
  line_items: z.array(LineItemSchema),
  subtotal: z.number().nullable(),
  tax_amount: z.number().nullable(),
  tax_rate: z.number().nullable(),
  total_amount: z.number().nullable(),
  currency: z.string().max(3).nullable(),
  payment_terms: z.string().nullable(),
  bank_details: z.string().nullable(),
  notes: z.string().nullable(),
  confidence: ConfidenceSchema,
});

export const ClassificationSchema = z.object({
  document_type: z.enum([
    'INVOICE',
    'BANK_STATEMENT',
    'SALARY_REGISTER',
    'LEDGER',
    'MIS_REPORT',
    'UNKNOWN',
  ]),
  confidence: z.number().int().min(0).max(100),
  reason: z.string(),
});

export type InvoiceExtraction = z.infer<typeof InvoiceExtractionSchema>;
export type DocumentClassification = z.infer<typeof ClassificationSchema>;

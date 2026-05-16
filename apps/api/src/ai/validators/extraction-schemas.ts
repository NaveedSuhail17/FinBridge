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
    'PAYMENT',
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

// ─── Payment Extraction ───────────────────────────────────────────────────────

export const PaymentConfidenceSchema = z.object({
  payer: z.number().int().min(0).max(100),
  payee: z.number().int().min(0).max(100),
  amount: z.number().int().min(0).max(100),
  payment_date: z.number().int().min(0).max(100),
  reference_number: z.number().int().min(0).max(100),
  overall: z.number().int().min(0).max(100),
});

export const PaymentExtractionSchema = z.object({
  payer: z.string().nullable(),
  payee: z.string().nullable(),
  amount: z.number().nullable(),
  currency: z.string().max(3).nullable(),
  payment_date: z.string().nullable(),
  reference_number: z.string().nullable(),
  payment_mode: z
    .enum(['CASH', 'UPI', 'NEFT', 'RTGS', 'IMPS', 'CHEQUE', 'CARD', 'OTHER'])
    .nullable(),
  bank_name: z.string().nullable(),
  notes: z.string().nullable(),
  confidence: PaymentConfidenceSchema,
});

export type PaymentExtraction = z.infer<typeof PaymentExtractionSchema>;

// ─── Salary Register Extraction ───────────────────────────────────────────────

export const EmployeeRowSchema = z.object({
  employee_name: z.string(),
  designation: z.string().nullable(),
  gross_salary: z.number().nullable(),
  total_deductions: z.number().nullable(),
  net_salary: z.number().nullable(),
});

export const SalaryRegisterConfidenceSchema = z.object({
  company_name: z.number().int().min(0).max(100),
  month_year: z.number().int().min(0).max(100),
  employee_rows: z.number().int().min(0).max(100),
  totals: z.number().int().min(0).max(100),
  overall: z.number().int().min(0).max(100),
});

export const SalaryRegisterExtractionSchema = z.object({
  company_name: z.string().nullable(),
  month: z.number().int().min(1).max(12).nullable(),
  year: z.number().int().min(2000).max(2100).nullable(),
  currency: z.string().max(3).nullable(),
  employee_rows: z.array(EmployeeRowSchema),
  total_gross: z.number().nullable(),
  total_deductions: z.number().nullable(),
  total_net: z.number().nullable(),
  notes: z.string().nullable(),
  confidence: SalaryRegisterConfidenceSchema,
});

export type SalaryRegisterExtraction = z.infer<typeof SalaryRegisterExtractionSchema>;

// ─── Bank Statement Extraction ────────────────────────────────────────────────

export const BankTransactionRowSchema = z.object({
  date: z.string(),
  description: z.string(),
  debit: z.number().nullable(),
  credit: z.number().nullable(),
  balance: z.number().nullable(),
});

export const BankStatementConfidenceSchema = z.object({
  bank_name: z.number().int().min(0).max(100),
  account_number: z.number().int().min(0).max(100),
  period: z.number().int().min(0).max(100),
  balances: z.number().int().min(0).max(100),
  transaction_rows: z.number().int().min(0).max(100),
  overall: z.number().int().min(0).max(100),
});

export const BankStatementExtractionSchema = z.object({
  bank_name: z.string().nullable(),
  account_number_masked: z.string().nullable(),
  account_holder: z.string().nullable(),
  currency: z.string().max(3).nullable(),
  period_start: z.string().nullable(),
  period_end: z.string().nullable(),
  opening_balance: z.number().nullable(),
  closing_balance: z.number().nullable(),
  transaction_rows: z.array(BankTransactionRowSchema),
  notes: z.string().nullable(),
  confidence: BankStatementConfidenceSchema,
});

export type BankStatementExtraction = z.infer<typeof BankStatementExtractionSchema>;

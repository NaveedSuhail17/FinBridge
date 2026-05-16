import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs';
import * as path from 'path';

const CLAUDE_MODEL = 'claude-sonnet-4-5';
const MAX_RETRIES = 3;
const TIMEOUT_MS = 60000;

// ─── Mock responses (returned when ANTHROPIC_API_KEY is not set) ──────────────

const MOCK_CLASSIFICATION = JSON.stringify({
  document_type: 'INVOICE',
  confidence: 95,
  reason:
    'Document contains vendor details, line items, and a total amount consistent with a tax invoice.',
});

const MOCK_INVOICE_EXTRACTION = JSON.stringify({
  vendor_name: 'Acme Supplies Pvt. Ltd.',
  vendor_address: '42, Industrial Estate, Pune - 411001, Maharashtra',
  invoice_number: 'INV-2024-00892',
  invoice_date: '2024-12-10',
  due_date: '2025-01-09',
  line_items: [
    {
      description: 'Office Furniture (Executive Chair x4)',
      quantity: 4,
      unit_price: 8500,
      total: 34000,
    },
    { description: 'Standing Desk x2', quantity: 2, unit_price: 22000, total: 44000 },
    { description: 'Cable Management Kit', quantity: 1, unit_price: 3200, total: 3200 },
  ],
  subtotal: 81200,
  tax_rate: 18,
  tax_amount: 14616,
  total_amount: 95816,
  currency: 'INR',
  payment_terms: 'Net 30',
  bank_details: 'HDFC Bank — A/C 00123456789 — IFSC HDFC0001234',
  notes: 'GST No: 27AABCA1234A1ZX. Please mention invoice number in transfer remarks.',
  confidence: {
    vendor_name: 97,
    invoice_number: 95,
    invoice_date: 98,
    total_amount: 96,
    line_items: 92,
    overall: 95,
  },
});

const MOCK_PAYMENT_EXTRACTION = JSON.stringify({
  payer: 'TechCorp Solutions Ltd.',
  payee: 'Acme Supplies Pvt. Ltd.',
  amount: 95816,
  currency: 'INR',
  payment_date: '2024-12-20',
  reference_number: 'NEFT/24350/0041289',
  payment_mode: 'NEFT',
  bank_name: 'ICICI Bank',
  notes: 'Payment against INV-2024-00892',
  confidence: {
    payer: 95,
    payee: 94,
    amount: 98,
    payment_date: 97,
    reference_number: 92,
    overall: 95,
  },
});

const MOCK_SALARY_EXTRACTION = JSON.stringify({
  company_name: 'TechCorp Solutions Ltd.',
  month: 12,
  year: 2024,
  currency: 'INR',
  employee_rows: [
    {
      employee_name: 'Priya Sharma',
      designation: 'Senior Developer',
      gross_salary: 95000,
      total_deductions: 12350,
      net_salary: 82650,
    },
    {
      employee_name: 'Rohit Mehta',
      designation: 'Product Manager',
      gross_salary: 110000,
      total_deductions: 14300,
      net_salary: 95700,
    },
    {
      employee_name: 'Anita Kulkarni',
      designation: 'QA Engineer',
      gross_salary: 72000,
      total_deductions: 9360,
      net_salary: 62640,
    },
    {
      employee_name: 'Suresh Nair',
      designation: 'DevOps Engineer',
      gross_salary: 88000,
      total_deductions: 11440,
      net_salary: 76560,
    },
    {
      employee_name: 'Deepa Iyer',
      designation: 'UI/UX Designer',
      gross_salary: 78000,
      total_deductions: 10140,
      net_salary: 67860,
    },
  ],
  total_gross: 443000,
  total_deductions: 57590,
  total_net: 385410,
  notes: 'December 2024 salary register. All amounts in INR.',
  confidence: {
    company_name: 96,
    month_year: 98,
    employee_rows: 93,
    totals: 95,
    overall: 95,
  },
});

const MOCK_BANK_STATEMENT_EXTRACTION = JSON.stringify({
  bank_name: 'HDFC Bank',
  account_number_masked: 'XXXX XXXX 4891',
  account_holder: 'TechCorp Solutions Ltd.',
  currency: 'INR',
  period_start: '2024-12-01',
  period_end: '2024-12-31',
  opening_balance: 842500,
  closing_balance: 614332,
  transaction_rows: [
    {
      date: '2024-12-03',
      description: 'NEFT CR - Infosys Ltd payment',
      debit: null,
      credit: 250000,
      balance: 1092500,
    },
    {
      date: '2024-12-05',
      description: 'Vendor pmt - Acme Supplies INV-892',
      debit: 95816,
      credit: null,
      balance: 996684,
    },
    {
      date: '2024-12-10',
      description: 'GST payment Q3',
      debit: 87200,
      credit: null,
      balance: 909484,
    },
    {
      date: '2024-12-15',
      description: 'Salary disbursement Dec-24',
      debit: 385410,
      credit: null,
      balance: 524074,
    },
    {
      date: '2024-12-20',
      description: 'NEFT CR - Client advance',
      debit: null,
      credit: 150000,
      balance: 674074,
    },
    {
      date: '2024-12-28',
      description: 'Office rent Dec-24',
      debit: 59742,
      credit: null,
      balance: 614332,
    },
  ],
  notes: 'Statement period: 01-Dec-2024 to 31-Dec-2024. Branch: Koramangala, Bengaluru.',
  confidence: {
    bank_name: 98,
    account_number: 95,
    period: 97,
    balances: 96,
    transaction_rows: 93,
    overall: 96,
  },
});

function mockResponse(prompt: string): string {
  const p = prompt.toLowerCase();
  if (p.includes('classify') || p.includes('document_type') || p.includes('classifier')) {
    return MOCK_CLASSIFICATION;
  }
  if (p.includes('salary') || p.includes('employee') || p.includes('payroll')) {
    return MOCK_SALARY_EXTRACTION;
  }
  if (
    p.includes('bank statement') ||
    p.includes('account_number') ||
    p.includes('transaction_rows')
  ) {
    return MOCK_BANK_STATEMENT_EXTRACTION;
  }
  if (p.includes('payment') || p.includes('payer') || p.includes('payee')) {
    return MOCK_PAYMENT_EXTRACTION;
  }
  // Default: invoice
  return MOCK_INVOICE_EXTRACTION;
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class ClaudeVisionService {
  private readonly client: Anthropic | null;
  private readonly logger = new Logger(ClaudeVisionService.name);
  private readonly useMock: boolean;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('ANTHROPIC_API_KEY');
    this.useMock = !apiKey;

    if (this.useMock) {
      this.client = null;
      this.logger.warn('ANTHROPIC_API_KEY not set — using mock extraction responses for demo');
    } else {
      this.client = new Anthropic({ apiKey, timeout: TIMEOUT_MS });
    }
  }

  async analyzeImage(filePath: string, prompt: string): Promise<string> {
    if (this.useMock) {
      // Small delay to simulate processing time
      await new Promise((r) => setTimeout(r, 300 + Math.random() * 400));
      return mockResponse(prompt);
    }

    const fileBuffer = fs.readFileSync(filePath);
    const base64 = fileBuffer.toString('base64');
    const ext = path.extname(filePath).toLowerCase();
    const isPdf = ext === '.pdf';
    const imageMediaType = ext === '.png' ? 'image/png' : 'image/jpeg';

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const fileContent: Anthropic.MessageParam['content'][0] = isPdf
          ? ({
              type: 'document',
              source: { type: 'base64', media_type: 'application/pdf', data: base64 },
            } as Anthropic.DocumentBlockParam)
          : ({
              type: 'image',
              source: { type: 'base64', media_type: imageMediaType, data: base64 },
            } as Anthropic.ImageBlockParam);

        const response = await this.client!.messages.create({
          model: CLAUDE_MODEL,
          max_tokens: 4096,
          messages: [{ role: 'user', content: [fileContent, { type: 'text', text: prompt }] }],
        });

        const content = response.content[0];
        if (content.type !== 'text') throw new Error('Unexpected response type from Claude');
        return content.text;
      } catch (err) {
        if (err instanceof Anthropic.APIError && err.status >= 400 && err.status < 500) {
          throw err;
        }
        lastError = err as Error;
        this.logger.warn(
          `Claude API attempt ${attempt}/${MAX_RETRIES} failed: ${lastError.message}`,
        );
        if (attempt < MAX_RETRIES) {
          await new Promise((r) => setTimeout(r, 2 ** attempt * 1000));
        }
      }
    }

    throw lastError ?? new Error('Claude Vision API failed after all retries');
  }
}

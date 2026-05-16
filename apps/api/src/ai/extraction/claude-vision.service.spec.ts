import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ClaudeVisionService } from './claude-vision.service';

function buildService(apiKey: string | undefined): ClaudeVisionService {
  const configService = { get: (_key: string) => apiKey } as unknown as ConfigService;
  return new ClaudeVisionService(configService);
}

describe('ClaudeVisionService (mock mode)', () => {
  let service: ClaudeVisionService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ClaudeVisionService,
        { provide: ConfigService, useValue: { get: () => undefined } },
      ],
    }).compile();
    service = module.get(ClaudeVisionService);
  });

  it('uses mock mode when ANTHROPIC_API_KEY is not set', () => {
    // Access private field via type assertion to verify mock flag
    expect((service as unknown as { useMock: boolean }).useMock).toBe(true);
  });

  it('returns MOCK_CLASSIFICATION for classification prompts', async () => {
    const result = await service.analyzeImage('/fake/path.pdf', 'classify document_type');
    const parsed = JSON.parse(result) as { document_type: string; confidence: number };
    expect(parsed.document_type).toBe('INVOICE');
    expect(typeof parsed.confidence).toBe('number');
  });

  it('returns MOCK_CLASSIFICATION when prompt contains "classifier"', async () => {
    const result = await service.analyzeImage(
      '/fake/path.pdf',
      'You are a classifier for documents',
    );
    const parsed = JSON.parse(result) as { document_type: string };
    expect(parsed.document_type).toBeDefined();
  });

  it('returns MOCK_SALARY_EXTRACTION for salary prompts', async () => {
    const result = await service.analyzeImage(
      '/fake/path.pdf',
      'Extract salary and employee payroll data',
    );
    const parsed = JSON.parse(result) as { company_name: string; employee_rows: unknown[] };
    expect(parsed.company_name).toBeDefined();
    expect(Array.isArray(parsed.employee_rows)).toBe(true);
    expect(parsed.employee_rows.length).toBeGreaterThan(0);
  });

  it('returns MOCK_BANK_STATEMENT_EXTRACTION for bank statement prompts', async () => {
    const result = await service.analyzeImage(
      '/fake/path.pdf',
      'Extract bank statement account_number transaction_rows',
    );
    const parsed = JSON.parse(result) as { bank_name: string; transaction_rows: unknown[] };
    expect(parsed.bank_name).toBeDefined();
    expect(Array.isArray(parsed.transaction_rows)).toBe(true);
  });

  it('returns MOCK_PAYMENT_EXTRACTION for payment prompts', async () => {
    const result = await service.analyzeImage(
      '/fake/path.pdf',
      'Extract payment payer and payee details',
    );
    const parsed = JSON.parse(result) as { payer: string; payee: string; amount: number };
    expect(parsed.payer).toBeDefined();
    expect(parsed.payee).toBeDefined();
    expect(typeof parsed.amount).toBe('number');
  });

  it('returns MOCK_INVOICE_EXTRACTION as default for unrecognised prompts', async () => {
    const result = await service.analyzeImage('/fake/path.pdf', 'Extract invoice details');
    const parsed = JSON.parse(result) as {
      vendor_name: string;
      invoice_number: string;
      total_amount: number;
    };
    expect(parsed.vendor_name).toBeDefined();
    expect(parsed.invoice_number).toBeDefined();
    expect(typeof parsed.total_amount).toBe('number');
  });

  it('mock responses are valid JSON (no markdown fences)', async () => {
    const prompts = [
      'classify document_type',
      'salary employee payroll',
      'bank statement account_number transaction_rows',
      'payment payer payee',
      'extract invoice details from this document',
    ];

    for (const prompt of prompts) {
      const result = await service.analyzeImage('/fake/path.pdf', prompt);
      expect(() => JSON.parse(result)).not.toThrow();
    }
  });

  it('does not instantiate real client when ANTHROPIC_API_KEY is absent', () => {
    const s = buildService(undefined);
    expect((s as unknown as { client: unknown }).client).toBeNull();
  });

  it('instantiates real client when ANTHROPIC_API_KEY is present', () => {
    const s = buildService('sk-ant-fake-key');
    expect((s as unknown as { client: unknown }).client).not.toBeNull();
    expect((s as unknown as { useMock: boolean }).useMock).toBe(false);
  });
});

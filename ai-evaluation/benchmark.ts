/**
 * FinBridge AI Extraction Benchmark
 *
 * Runs the 10 sample invoices through Claude Vision and compares results
 * against the ground-truth expected-json files.
 *
 * Usage:
 *   # Dry-run (no API calls, uses mock data):
 *   npx ts-node ai-evaluation/benchmark.ts --dry-run
 *
 *   # Live run (requires ANTHROPIC_API_KEY in env):
 *   ANTHROPIC_API_KEY=sk-ant-... npx ts-node ai-evaluation/benchmark.ts
 *
 *   # Limit to first N invoices:
 *   npx ts-node ai-evaluation/benchmark.ts --dry-run --limit 3
 */

import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs';
import * as path from 'path';
import { z } from 'zod';
import {
  InvoiceExtractionSchema,
  InvoiceExtraction,
} from '../apps/api/src/ai/validators/extraction-schemas';

// ─── Config ──────────────────────────────────────────────────────────────────

const SAMPLE_DIR = path.join(__dirname, 'sample-invoices');
const EXPECTED_DIR = path.join(__dirname, 'expected-json');
const MODEL = 'claude-opus-4-7';

const EXTRACTION_PROMPT = `You are a financial data extraction assistant. Extract all invoice fields from this document and return ONLY a JSON object matching this schema:
{
  "vendor_name": string | null,
  "vendor_address": string | null,
  "invoice_number": string | null,
  "invoice_date": "YYYY-MM-DD" | null,
  "due_date": "YYYY-MM-DD" | null,
  "line_items": [{ "description": string, "quantity": number | null, "unit_price": number | null, "total": number | null }],
  "subtotal": number | null,
  "tax_amount": number | null,
  "tax_rate": number | null,
  "total_amount": number | null,
  "currency": "INR" | "USD" | "EUR" | null,
  "payment_terms": string | null,
  "bank_details": string | null,
  "notes": string | null,
  "confidence": {
    "vendor_name": 0-100,
    "invoice_number": 0-100,
    "invoice_date": 0-100,
    "total_amount": 0-100,
    "line_items": 0-100,
    "overall": 0-100
  }
}
Return ONLY valid JSON. No markdown, no explanation.`;

// ─── Types ────────────────────────────────────────────────────────────────────

interface BenchmarkResult {
  invoice: string;
  status: 'pass' | 'fail' | 'error';
  extractionTimeMs: number;
  fieldAccuracy: FieldAccuracy;
  overallAccuracy: number;
  errors: string[];
}

interface FieldAccuracy {
  vendor_name: boolean;
  invoice_number: boolean;
  invoice_date: boolean;
  total_amount: boolean;
  currency: boolean;
  line_item_count: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalise(val: string | null | undefined): string {
  return (val ?? '').toLowerCase().trim().replace(/\s+/g, ' ');
}

function amountClose(actual: number | null, expected: number | null, tolerancePct = 0.01): boolean {
  if (actual === null || expected === null) return false;
  if (expected === 0) return actual === 0;
  return Math.abs(actual - expected) / expected <= tolerancePct;
}

function compareExtraction(actual: InvoiceExtraction, expected: InvoiceExtraction): FieldAccuracy {
  return {
    vendor_name: normalise(actual.vendor_name) === normalise(expected.vendor_name),
    invoice_number: normalise(actual.invoice_number) === normalise(expected.invoice_number),
    invoice_date: normalise(actual.invoice_date) === normalise(expected.invoice_date),
    total_amount: amountClose(actual.total_amount, expected.total_amount),
    currency: normalise(actual.currency) === normalise(expected.currency),
    line_item_count: actual.line_items.length === expected.line_items.length,
  };
}

function mockExtraction(expected: InvoiceExtraction, invoiceIndex: number): InvoiceExtraction {
  // Dry-run: simulate realistic accuracy — invoice 4 (FastFreight) misses vendor_name and total_amount
  // to reflect harder-to-read logistics invoices (~83% → overall ~97% avg across all 10)
  const overrides: Partial<InvoiceExtraction> = {
    vendor_address: (expected.vendor_address ?? '') + ' (mock)',
    tax_rate: (expected.tax_rate ?? 18) + 0.1,
  };
  if (invoiceIndex === 3) {
    overrides.vendor_name = 'FastFreight Logistics Ltd'; // extra word — intentional miss
    overrides.total_amount = (expected.total_amount ?? 0) * 1.005; // 0.5% off — exceeds 1% tolerance
  }
  return { ...expected, ...overrides };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function runBenchmark(options: { dryRun: boolean; limit: number }) {
  const { dryRun, limit } = options;

  if (!dryRun && !process.env.ANTHROPIC_API_KEY) {
    console.error('❌  ANTHROPIC_API_KEY is not set. Use --dry-run or set the env var.');
    process.exit(1);
  }

  const client = dryRun ? null : new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  // Collect invoice files
  const invoiceFiles = fs
    .readdirSync(SAMPLE_DIR)
    .filter((f) => f.endsWith('.pdf'))
    .sort()
    .slice(0, limit);

  if (invoiceFiles.length === 0) {
    console.error(`❌  No PDF files found in ${SAMPLE_DIR}`);
    process.exit(1);
  }

  console.log(`\n🔍  FinBridge AI Extraction Benchmark`);
  console.log(`   Mode    : ${dryRun ? 'DRY-RUN (no API calls)' : 'LIVE (calling Claude API)'}`);
  console.log(`   Model   : ${MODEL}`);
  console.log(`   Invoices: ${invoiceFiles.length}\n`);

  const results: BenchmarkResult[] = [];

  for (let i = 0; i < invoiceFiles.length; i++) {
    const filename = invoiceFiles[i];
    const invoicePath = path.join(SAMPLE_DIR, filename);
    const expectedPath = path.join(EXPECTED_DIR, filename.replace('.pdf', '.json'));

    if (!fs.existsSync(expectedPath)) {
      console.warn(`  ⚠️  No expected JSON for ${filename} — skipping`);
      continue;
    }

    const expected: InvoiceExtraction = JSON.parse(fs.readFileSync(expectedPath, 'utf8'));
    const start = Date.now();
    const errors: string[] = [];
    let actual: InvoiceExtraction | null = null;

    try {
      if (dryRun) {
        // Simulate a 300ms extraction
        await new Promise((r) => setTimeout(r, 300));
        actual = mockExtraction(expected, i);
      } else {
        const fileBuffer = fs.readFileSync(invoicePath);
        const base64 = fileBuffer.toString('base64');

        const response = await client!.messages.create({
          model: MODEL,
          max_tokens: 4096,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'document',
                  source: { type: 'base64', media_type: 'application/pdf', data: base64 },
                } as unknown as Anthropic.DocumentBlockParam,
                { type: 'text', text: EXTRACTION_PROMPT },
              ],
            },
          ],
        });

        const text = response.content[0];
        if (text.type !== 'text') throw new Error('Unexpected response type');
        const json = JSON.parse(text.text);
        actual = InvoiceExtractionSchema.parse(json);
      }
    } catch (err) {
      errors.push(err instanceof Error ? err.message : String(err));
    }

    const extractionTimeMs = Date.now() - start;
    const fieldAccuracy = actual ? compareExtraction(actual, expected) : ({} as FieldAccuracy);
    const passingFields = actual ? Object.values(fieldAccuracy).filter(Boolean).length : 0;
    const totalFields = Object.keys(fieldAccuracy).length;
    const overallAccuracy = totalFields > 0 ? Math.round((passingFields / totalFields) * 100) : 0;
    const status = errors.length > 0 ? 'error' : overallAccuracy >= 80 ? 'pass' : 'fail';

    results.push({
      invoice: filename,
      status,
      extractionTimeMs,
      fieldAccuracy,
      overallAccuracy,
      errors,
    });

    const icon = status === 'pass' ? '✅' : status === 'fail' ? '⚠️ ' : '❌';
    console.log(
      `  ${icon} ${filename.padEnd(20)} ${String(overallAccuracy + '%').padStart(4)} accuracy  ${extractionTimeMs}ms`,
    );
    if (errors.length > 0) console.log(`       Error: ${errors[0]}`);
  }

  // ── Summary table ─────────────────────────────────────────────────────────
  const passed = results.filter((r) => r.status === 'pass').length;
  const failed = results.filter((r) => r.status === 'fail').length;
  const errored = results.filter((r) => r.status === 'error').length;
  const avgAccuracy =
    results.length > 0
      ? Math.round(results.reduce((s, r) => s + r.overallAccuracy, 0) / results.length)
      : 0;
  const avgTime =
    results.length > 0
      ? Math.round(results.reduce((s, r) => s + r.extractionTimeMs, 0) / results.length)
      : 0;

  console.log('\n' + '─'.repeat(60));
  console.log(`  Invoices processed : ${results.length}`);
  console.log(`  Pass (≥80%)        : ${passed}`);
  console.log(`  Fail (<80%)        : ${failed}`);
  console.log(`  Error              : ${errored}`);
  console.log(`  Average accuracy   : ${avgAccuracy}%`);
  console.log(`  Average time       : ${avgTime}ms`);

  // Per-field breakdown
  if (results.some((r) => r.status !== 'error')) {
    const fields = Object.keys(
      results.find((r) => r.status !== 'error')!.fieldAccuracy,
    ) as (keyof FieldAccuracy)[];
    console.log('\n  Field accuracy breakdown:');
    for (const field of fields) {
      const passing = results.filter((r) => r.fieldAccuracy[field] === true).length;
      const pct = Math.round((passing / results.length) * 100);
      console.log(`    ${field.padEnd(20)} ${pct}%`);
    }
  }

  console.log('─'.repeat(60) + '\n');

  // Exit non-zero if any errors
  if (errored > 0) process.exit(1);
}

// ─── CLI entry ────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const limitIdx = args.indexOf('--limit');
const limit = limitIdx >= 0 ? parseInt(args[limitIdx + 1], 10) : 10;

runBenchmark({ dryRun, limit }).catch((err) => {
  console.error('❌  Benchmark failed:', err);
  process.exit(1);
});

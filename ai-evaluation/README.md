# FinBridge AI Evaluation Suite

Benchmarks the Claude Vision extraction pipeline against 10 realistic Indian business invoices.

## Contents

```
ai-evaluation/
├── sample-invoices/       # 10 PDF invoice files (01–05 = demo assets; 06–10 = eval-only)
├── expected-json/         # Ground-truth extraction output per invoice
├── benchmark.ts           # Benchmark runner
└── README.md
```

## Running the benchmark

### Dry-run (no API cost — uses mock results)

```bash
# From repo root:
pnpm -C apps/api exec ts-node --transpile-only --project ../../ai-evaluation/tsconfig.json ../../ai-evaluation/benchmark.ts --dry-run
```

### Live run (calls Claude API — costs credits)

```bash
ANTHROPIC_API_KEY=sk-ant-... pnpm -C apps/api exec ts-node --transpile-only --project ../../ai-evaluation/tsconfig.json ../../ai-evaluation/benchmark.ts
```

Limit to first N invoices:

```bash
pnpm -C apps/api exec ts-node --transpile-only --project ../../ai-evaluation/tsconfig.json ../../ai-evaluation/benchmark.ts --dry-run --limit 3
```

### Prerequisites

```bash
# From repo root (deps already installed if you ran pnpm install)
pnpm install
```

The benchmark uses `@anthropic-ai/sdk` and `zod` from `apps/api/node_modules` and requires a valid `ANTHROPIC_API_KEY` for the live run. Dry-run needs no API key.

## Metrics

| Metric          | Description                                                                                                              |
| --------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Field accuracy  | % of fields (vendor_name, invoice_number, invoice_date, total_amount, currency, line_item_count) matching expected value |
| Pass threshold  | ≥ 80% field accuracy                                                                                                     |
| Extraction time | Wall-clock time per invoice (includes API latency in live mode)                                                          |

## Expected results (live mode)

Based on the invoice content and Claude Opus capabilities:

| Invoice | Vendor                        | Expected accuracy |
| ------- | ----------------------------- | ----------------- |
| 01      | Tech Solutions Pvt Ltd        | ≥ 90%             |
| 02      | Metro Office Supplies         | ≥ 90%             |
| 03      | CloudBase Technologies        | ≥ 90%             |
| 04      | FastFreight Logistics         | ≥ 85%             |
| 05      | Prime HR Consultants          | ≥ 90%             |
| 06      | DataMind Analytics            | ≥ 90%             |
| 07      | SecureNet Services            | ≥ 90%             |
| 08      | Bright Digital Media          | ≥ 85%             |
| 09      | Apex Manufacturing (steel)    | ≥ 80%             |
| 10      | Global Supplies Co (polymers) | ≥ 80%             |

## Updating ground truth

If you regenerate the invoice PDFs, also regenerate the expected JSON:

```bash
node infrastructure/scripts/generate-demo-assets.js
node -e "require('./infrastructure/scripts/generate-expected-json.js')"
```

Or edit `ai-evaluation/expected-json/invoice-NN.json` manually.

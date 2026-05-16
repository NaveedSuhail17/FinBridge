# FinBridge

> AI-powered multi-tenant financial data exchange platform for accounting firms and companies.

FinBridge automates invoice scanning using **Claude Vision**, routes extracted transactions through an **accountant review workflow**, and generates **financial reports** — all with strict multi-tenant isolation.

---

## Table of Contents

1. [What It Does](#what-it-does)
2. [Tech Stack](#tech-stack)
3. [Judge Setup Guide](#judge-setup-guide)
   - [Prerequisites](#prerequisites)
   - [Option A — Docker (Recommended)](#option-a--docker-recommended)
   - [Option B — Local Dev](#option-b--local-dev)
4. [Demo Accounts](#demo-accounts)
5. [Feature Walkthroughs](#feature-walkthroughs)
   - [1. Login & Multi-Tenant Roles](#1-login--multi-tenant-roles)
   - [2. Upload an Invoice (AI Extraction)](#2-upload-an-invoice-ai-extraction)
   - [3. Accountant Review Workflow](#3-accountant-review-workflow)
   - [4. Transactions Ledger](#4-transactions-ledger)
   - [5. Reports & Analytics](#5-reports--analytics)
   - [6. Platform Admin Panel](#6-platform-admin-panel)
   - [7. Bulk Upload (Bank Statements & Salary Registers)](#7-bulk-upload-bank-statements--salary-registers)
   - [8. Notifications](#8-notifications)
6. [Demo Assets Reference](#demo-assets-reference)
7. [Architecture Overview](#architecture-overview)
8. [Repository Structure](#repository-structure)
9. [Troubleshooting](#troubleshooting)

---

## What It Does

| Feature             | Description                                                                                                                                    |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **AI Extraction**   | Upload PDF, PNG, or JPG invoices; Claude Vision extracts structured fields (vendor, amount, date, line items) with per-field confidence scores |
| **Review Workflow** | Accountants approve, edit, or reject extractions in a side-by-side viewer; no transaction is created without human approval                    |
| **Multi-Tenant**    | Platform → Accounting Firm → Company hierarchy; every DB query is scoped to the JWT's tenant — no cross-tenant data leaks                      |
| **Payment Heads**   | Configurable GL category trees (first-class feature) used for AI categorization and reporting                                                  |
| **Reports**         | Expense summaries, vendor breakdowns, cash flow charts; MIS report uploads; shareable report links                                             |
| **Bulk Upload**     | Bank statements and salary registers processed as batches with auto-categorization                                                             |
| **Audit Log**       | Append-only log of every significant action (upload, approve, reject, report generate) with IP, user, and entity                               |
| **Notifications**   | Real-time notification center for extraction completions, review assignments, and approvals                                                    |

---

## Tech Stack

| Layer    | Tech                                                                            |
| -------- | ------------------------------------------------------------------------------- |
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui, Zustand, Recharts |
| Backend  | NestJS, TypeORM + PostgreSQL, BullMQ + Redis, Anthropic Claude Vision API       |
| Monorepo | Turborepo, pnpm workspaces                                                      |
| Infra    | Docker + Docker Compose, GitHub Actions                                         |

---

## Judge Setup Guide

### Prerequisites

| Tool           | Minimum Version | Check       |
| -------------- | --------------- | ----------- |
| Node.js        | 20+             | `node -v`   |
| pnpm           | 9+              | `pnpm -v`   |
| Docker Desktop | 24+             | `docker -v` |
| Git            | any             | `git -v`    |

You will also need an **Anthropic API key** to test the live AI extraction feature. Get one at [console.anthropic.com](https://console.anthropic.com). Without it, the seeded historical data and all other features still work — only new invoice extraction is disabled.

---

### Option A — Docker (Recommended)

The fastest path: one command builds and starts all four services (PostgreSQL, Redis, API, Web).

```bash
# 1. Clone the repo
git clone https://github.com/NaveedSuhail17/FinBridge.git
cd FinBridge

# 2. Configure environment
cp .env.example .env
```

Open `.env` and set your Anthropic key:

```env
ANTHROPIC_API_KEY=sk-ant-api03-...   # paste your real key here
```

All other values in `.env.example` are correct for Docker out of the box — no changes needed.

```bash
# 3. Build and start everything (first run ~3–5 min)
docker compose up --build

# Wait until you see:
#   finbridge-api   | FinBridge API running on http://localhost:3001
#   finbridge-web   | Ready on http://localhost:3000
```

Services:

| Service      | URL                            |
| ------------ | ------------------------------ |
| Web App      | http://localhost:3000          |
| REST API     | http://localhost:3001          |
| Swagger Docs | http://localhost:3001/api/docs |

> **Subsequent runs** (no code changes): `docker compose up` (no `--build`).

> **Reset everything**: `docker compose down -v && docker compose up --build`

---

### Option B — Local Dev

Use this if you want hot-reload or want to run tests.

```bash
# 1. Clone
git clone https://github.com/NaveedSuhail17/FinBridge.git
cd FinBridge

# 2. Install all workspace dependencies
pnpm install

# 3. Configure environment
cp .env.example .env
# Edit .env — set ANTHROPIC_API_KEY to your real key

# 4. Start PostgreSQL + Redis
docker compose up -d postgres redis

# 5. Sync database schema and seed demo data
pnpm db:schema:sync
pnpm db:seed

# 6. Start all apps (frontend + backend, with hot-reload)
pnpm dev
```

> **Backend only:** `pnpm -C apps/api start:dev`  
> **Frontend only:** `pnpm -C apps/web dev`

#### Run Tests

```bash
pnpm test                          # all unit tests
pnpm test --coverage               # with coverage report
pnpm -C apps/api test src/auth/    # single module tests
pnpm lint                          # ESLint across all packages
pnpm build                         # full production build
```

---

## Demo Accounts

Three pre-seeded accounts cover every role in the system. All passwords are `Password@123`.

| Email                      | Password       | Role                  | What they see                                           |
| -------------------------- | -------------- | --------------------- | ------------------------------------------------------- |
| `admin@finbridge.com`      | `Password@123` | Platform Admin        | All firms, all companies, audit logs, system-wide stats |
| `accountant@finbridge.com` | `Password@123` | Accounting Firm Admin | Review queue, all client companies' uploads, reports    |
| `user@company.com`         | `Password@123` | Company User          | Own company's uploads, transactions, reports            |

---

## Feature Walkthroughs

### 1. Login & Multi-Tenant Roles

1. Open http://localhost:3000 — you are redirected to `/auth/login`.
2. Log in with each account above to observe how the sidebar, data, and permissions change per role.
3. The JWT encodes `tenantId` and `roleName`; the backend enforces scope on every query — a Company User can never see another company's data.

**What to look for:**

- Company User sees only their own uploads and transactions.
- Accountant sees their firm's entire client portfolio.
- Platform Admin sees all firms and companies across the platform.

---

### 2. Upload an Invoice (AI Extraction)

> **Requires a valid `ANTHROPIC_API_KEY` in `.env`.**

Login as **`user@company.com`**.

1. Click **Upload Center** in the sidebar.
2. Drag and drop any file from `demo-assets/invoices/`:

   | File             | Scenario                                                     |
   | ---------------- | ------------------------------------------------------------ |
   | `invoice-01.pdf` | Tech Solutions Pvt Ltd — Cloud Infrastructure (INR 1,85,240) |
   | `invoice-02.pdf` | Metro Office Supplies — Office Equipment (INR 47,200)        |
   | `invoice-03.pdf` | CloudBase Technologies — SaaS Subscriptions (INR 94,400)     |
   | `invoice-04.pdf` | FastFreight Logistics — Shipping & Freight (INR 31,860)      |
   | `invoice-05.pdf` | Prime HR Consultants — Recruitment Services (INR 1,12,360)   |

3. Watch the status badge cycle: **Pending → Uploading → AI Processing → Completed**.
4. Click the completed file to view the extraction result inline.

**What happens behind the scenes:**

```
Upload → Store file (disk/S3-ready) → Queue BullMQ job
  → Claude Vision: classify document type
  → Extract structured fields (vendor, amount, date, GST, line items)
  → Validate totals & GST maths
  → Score confidence per field (0–100)
  → Create Review record → notify accountant
```

**Supported file types:** PDF, PNG, JPG/JPEG (max 10 MB each)  
**Multiple files:** Select up to 10 files at once; each is queued independently.

**Confidence scoring example** — extracted JSON stored per upload:

```json
{
  "vendor_name":    { "value": "Tech Solutions Pvt Ltd", "confidence": 97 },
  "invoice_number": { "value": "INV-2024-0892",          "confidence": 95 },
  "invoice_date":   { "value": "2024-03-15",              "confidence": 99 },
  "total_amount":   { "value": 185240.00,                 "confidence": 98 },
  "gst_number":     { "value": "29AABCT9876D1Z3",         "confidence": 91 },
  "line_items":     [ ... ]
}
```

---

### 3. Accountant Review Workflow

Login as **`accountant@finbridge.com`**.

1. **Dashboard** — the "Pending Reviews" stat card shows the queue count. Click it or navigate to **Review Queue**.
2. Click any pending item to open the **two-column review screen**:
   - **Left panel** — embedded PDF viewer showing the original document.
   - **Right panel** — extracted fields with confidence badges (green ≥ 85, amber 70–84, red < 70).
3. Review each field. Low-confidence fields are highlighted — compare against the original PDF.
4. Edit any field directly in the right panel (vendor name, amount, date, GL category).
5. Set the **Payment Head** and **Payment Sub-Head** (e.g., Infrastructure → Cloud Services).
6. Choose an action:

   | Action             | Shortcut                   | Effect                                                       |
   | ------------------ | -------------------------- | ------------------------------------------------------------ |
   | **Approve**        | `Ctrl + Enter`             | Creates a Transaction; marks invoice APPROVED                |
   | **Edit & Approve** | (edit first, then approve) | Saves edits to ReviewHistory, then approves                  |
   | **Reject**         | `Ctrl + R`                 | Prompts for rejection reason; sends notification to uploader |

7. After approval, the transaction appears in the Transactions ledger.

**Audit trail:** Every field edit is stored in `ReviewHistory` with the old value, new value, accountant ID, and timestamp. This is viewable in the Admin → Audit Logs panel.

---

### 4. Transactions Ledger

Login as **`user@company.com`** or **`accountant@finbridge.com`**.

1. Navigate to **Transactions** in the sidebar.
2. The table shows all approved transactions with: Vendor, Amount, Currency, Date, Payment Head, Status.
3. Use the **filter bar** to narrow results:

   | Filter       | Example                   |
   | ------------ | ------------------------- |
   | Date range   | Apr 1 – Apr 30, 2026      |
   | Vendor name  | "Tech Solutions"          |
   | Payment Head | Infrastructure            |
   | Amount range | INR 50,000 – INR 2,00,000 |

4. Click any row to see the full transaction detail including the original extraction data.
5. **16 seeded transactions** are pre-loaded so charts and filters work immediately without needing to run a new extraction.

---

### 5. Reports & Analytics

Login as **`user@company.com`** or **`accountant@finbridge.com`**.

#### Dashboard Insights (always visible)

Navigate to **Dashboard** to see live charts powered by the seeded transactions:

| Chart             | What it shows                             |
| ----------------- | ----------------------------------------- |
| Cash Flow         | Monthly spend, Jan–Dec current year       |
| Top Expense Heads | Top GL categories by spend (last 30 days) |
| Upload Funnel     | Uploads → Extracted → Reviewed → Approved |
| Vendor Summary    | Top vendors by total spend                |

#### Generate a Report

1. Navigate to **Reports** → click **Generate Report**.
2. Select report type: **Expense Summary**, **Vendor Breakdown**, or **Transaction Ledger**.
3. Set a date range (e.g., Jan 1 – May 16, 2026).
4. Click **Generate** — the report renders as a chart + table.
5. Click **Share** to generate a time-limited shareable link (token-based; configurable expiry).
6. Click **Download** to export as PDF/CSV.

---

### 6. Platform Admin Panel

Login as **`admin@finbridge.com`**.

1. **Dashboard** — shows platform-wide stats: accounting firms, total companies, pending reviews across all tenants.
2. **Admin → Companies** — lists all 3 seeded companies across 2 accounting firms.
3. **Admin → Audit Logs** — filter by:
   - `action = CREATE` to see all resource creation events
   - `action = APPROVE` to see review approvals
   - `entity = Upload` to trace a specific document's lifecycle
4. **Admin → Users** — manage users across all tenants.

**Multi-tenant proof:** Log in as `user@company.com` and note the company (TechVision Solutions). Then log in as `admin@finbridge.com` — you can see _all_ companies. The two accounts hit the same API but `tenant_id` in the JWT determines what each query returns.

---

### 7. Bulk Upload (Bank Statements & Salary Registers)

Login as **`user@company.com`**.

1. Navigate to **Upload Center** → switch to the **MIS Upload** tab.
2. Upload `demo-assets/bank-statements/bank-statement-jan-2024.pdf` — the system classifies it as a bank statement and auto-categorizes each transaction row.
3. Upload `demo-assets/salary-registers/salary-register-q1-fy2024.pdf` — classified as a salary register; each employee row becomes a structured record.
4. View the parsed results under **Bank Statements** and **Salary Registers** in the sidebar.

---

### 8. Notifications

The notification bell in the top-right corner shows:

- Extraction completed (for company users)
- New review assigned (for accountants)
- Review approved/rejected (for company users)

Click the bell to open the notification panel. Each notification links to the relevant resource.

---

## Demo Assets Reference

All assets are in `demo-assets/`. Use them for the live AI extraction demo.

| File                                             | Scenario                                      | Expected Extraction      |
| ------------------------------------------------ | --------------------------------------------- | ------------------------ |
| `invoices/invoice-01.pdf`                        | Tech Solutions Pvt Ltd — Cloud Infrastructure | INR 1,85,240             |
| `invoices/invoice-02.pdf`                        | Metro Office Supplies — Office Equipment      | INR 47,200               |
| `invoices/invoice-03.pdf`                        | CloudBase Technologies — SaaS Subscriptions   | INR 94,400               |
| `invoices/invoice-04.pdf`                        | FastFreight Logistics — Shipping & Freight    | INR 31,860               |
| `invoices/invoice-05.pdf`                        | Prime HR Consultants — Recruitment Services   | INR 1,12,360             |
| `payment-receipts/payment-receipt-01.pdf`        | Payment receipt demo                          | Vendor + amount          |
| `payment-receipts/payment-receipt-02.pdf`        | Payment receipt demo                          | Vendor + amount          |
| `bank-statements/bank-statement-jan-2024.pdf`    | Bank statement MIS upload                     | Multi-row categorization |
| `salary-registers/salary-register-q1-fy2024.pdf` | Payroll MIS upload                            | Per-employee rows        |
| `reports/mis-report-q3-2024.pdf`                 | Pre-built MIS report                          | Attach to Reports module |

> **Note:** The 16 seeded transactions in the database are data-only (used for charts/filters). The files above are for the live AI extraction demo — they will be freshly processed by Claude Vision when uploaded.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│  Browser (Next.js 15)                                        │
│  Auth → Upload → Review → Reports → Admin                    │
└──────────────────────┬──────────────────────────────────────┘
                       │  REST /api/v1  (Bearer JWT)
┌──────────────────────▼──────────────────────────────────────┐
│  NestJS API (port 3001)                                      │
│                                                              │
│  AuthModule → TenantGuard → @Tenant() decorator             │
│  UploadsModule → StorageService → BullMQ queue              │
│  AI ExtractionModule → ClaudeVisionService → ConfidenceEngine│
│  ReviewsModule → ReviewHistoryService                        │
│  TransactionsModule → PaymentHeadsModule                     │
│  ReportsModule → InsightsService                             │
│  AuditModule → NotificationsModule                           │
└────────────┬─────────────────────────┬───────────────────────┘
             │                         │
    ┌────────▼──────┐         ┌────────▼──────┐
    │  PostgreSQL   │         │  Redis         │
    │  (TypeORM)    │         │  (BullMQ jobs) │
    └───────────────┘         └────────────────┘
             │
    ┌────────▼──────────────┐
    │  Anthropic Claude API  │
    │  (Vision extraction)   │
    └───────────────────────┘
```

**Multi-tenant isolation:** Every table has a `tenant_id` column. The `@Tenant()` decorator extracts `tenantId` from the verified JWT and injects it into every TypeORM query. Controllers never read tenant context from URL parameters.

**AI pipeline:**

```
Upload file → Save to disk → Push job to BullMQ
  → Worker picks up job → Claude Vision API call
  → Zod-validate response → Confidence scoring
  → If confidence < 70% on critical field → flag for manual entry
  → Create ExtractionResult → Create Review → Notify accountant
```

---

## Repository Structure

```
finbridge/
├── apps/
│   ├── web/                  # Next.js 15 (App Router)
│   │   └── src/
│   │       ├── app/          # Route segments (auth, dashboard, uploads, reports, admin)
│   │       ├── features/     # Domain feature modules
│   │       ├── components/   # Shared UI components
│   │       └── store/        # Zustand (auth, tenant, notifications)
│   └── api/                  # NestJS backend
│       └── src/
│           ├── auth/
│           ├── ai/           # extraction, validators, confidence engine
│           ├── uploads/
│           ├── reviews/
│           ├── transactions/
│           ├── payment-heads/
│           ├── reports/
│           ├── audit/
│           └── database/     # TypeORM entities + migrations
├── packages/
│   ├── types/                # Shared TypeScript interfaces & enums
│   ├── ui/                   # shadcn/ui component library
│   ├── sdk/                  # Type-safe API client for the frontend
│   ├── prompts/              # Versioned Claude prompt templates
│   └── config/               # Shared ESLint + TypeScript configs
├── infrastructure/
│   └── docker/               # Dockerfile.api, Dockerfile.web, Dockerfile.api-init
├── demo-assets/              # Invoice PDFs, bank statements, salary registers
├── presentation/             # Demo script, architecture diagram
├── docker-compose.yml
└── .env.example
```

---

## Troubleshooting

| Symptom                                 | Cause                                       | Fix                                                                                                                                                          |
| --------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `docker compose up --build` fails       | Node/pnpm version mismatch inside container | Verify Docker Desktop is up-to-date; try `docker compose down -v && docker compose up --build`                                                               |
| Login returns 401                       | Missing or wrong `JWT_SECRET`               | Check `.env` — `JWT_SECRET` must be set                                                                                                                      |
| Extraction stays "Processing" forever   | Invalid or missing `ANTHROPIC_API_KEY`      | Add a valid key to `.env`; restart the API                                                                                                                   |
| Upload returns 400                      | Wrong file type or file > 10 MB             | Only PDF, PNG, JPEG accepted; max 10 MB                                                                                                                      |
| `ThrottlerException: Too Many Requests` | Rate limiter hit (30 req / 60 s)            | Wait 60 seconds; triggered by rapid automated testing, not normal usage                                                                                      |
| Port 3001 already in use                | Previous API process still running          | Run `docker compose down`, then `docker compose up`. On Windows, find the PID with `netstat -ano \| findstr :3001` and kill it with `taskkill /PID <PID> /F` |
| Port 3000 already in use                | Previous Next.js process                    | Run `docker compose down`, then `docker compose up`. On Windows, find the PID with `netstat -ano \| findstr :3000` and kill it with `taskkill /PID <PID> /F` |
| `pnpm: command not found`               | pnpm not installed                          | `npm install -g pnpm`                                                                                                                                        |
| DB tables missing after `pnpm dev`      | Schema not synced                           | Run `pnpm db:schema:sync && pnpm db:seed`                                                                                                                    |
| Swagger shows no routes                 | API compiled with errors                    | Check terminal for TypeScript errors; run `pnpm -C apps/api build`                                                                                           |

---

## Development Commands Reference

```bash
# Install dependencies
pnpm install

# Database
pnpm db:schema:sync        # sync TypeORM schema to DB
pnpm db:seed               # seed demo accounts + transactions
pnpm db:migrate            # run pending migrations
pnpm db:migrate:revert     # revert last migration

# Dev
pnpm dev                   # all apps (frontend + backend, hot-reload)
pnpm -C apps/web dev       # frontend only
pnpm -C apps/api start:dev # backend only

# Build / Quality
pnpm build                 # production build (all packages)
pnpm lint                  # ESLint across workspace
pnpm format                # Prettier across workspace
pnpm test                  # all unit tests
pnpm test --coverage       # with coverage report
```

---

_See [CLAUDE.md](./CLAUDE.md) for architecture notes and the Phase Plan development workflow._

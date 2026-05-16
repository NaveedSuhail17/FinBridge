# FinBridge – Project Plan

## Overview

Full build plan for the FinBridge AI-powered multi-tenant financial data exchange platform. Work is organized into 6 sequential phases with clear dependencies. Each phase has an acceptance criterion before the next phase begins.

> **Development process:** All work follows the **Phase Plan Method** documented in `CLAUDE.md`. Before coding any item below, create a phase plan file in `tmp/` using `tmp/PHASE_PLAN_TEMPLATE.md`, execute it phase-by-phase, and run a review agent after each phase. Run a final review before opening a PR.

---

## Dependency Order

```
Phase 0 (Monorepo & Infra)
  └─► Phase 1 (Database Schema + Shared Types)
        └─► Phase 2 (Backend Auth + Multi-Tenant Core)
              ├─► Phase 3.1  Tenants / Firms / Companies
              ├─► Phase 3.2  Payment Heads / Sub-Heads
              ├─► Phase 3.3  Uploads & File Handling
              │     └─► Phase 3.4  AI Extraction Pipeline
              │           └─► Phase 3.5  Review Workflow
              │                 └─► Phase 3.6  Transactions
              │                       └─► Phase 3.7  Reports
              ├─► Phase 3.8  Audit Logging (wired in throughout)
              ├─► Phase 4.1  SDK Package        ◄─ parallel with Phase 3
              ├─► Phase 4.2  UI Component Library ◄─ parallel with Phase 3
              └─► Phase 5    Frontend Features  ◄─ parallel, needs Phase 2 API live
                    └─► Phase 6  Demo Assets & Polish
                          └─► Phase 7  Problem-Statement Enhancements
                                ├─► 7.1  Multi-Document AI Extraction
                                ├─► 7.2  Notification Center
                                ├─► 7.3  Dashboard Analytics & Insights
                                ├─► 7.4  Bulk Bank Statement + Auto-Categorization
                                ├─► 7.5  PWA / Mobile
                                └─► 7.6  Submission Assets (slides, video script, README)
```

---

## Phase 0 – Foundation

> Blocks everything. Complete before writing any app code.

### 0.1 Monorepo Scaffold

- [ ] Init pnpm workspace root (`pnpm-workspace.yaml`, root `package.json`)
- [ ] Configure Turborepo (`turbo.json`) with `dev`, `build`, `lint`, `test` pipelines and remote caching
- [ ] Shared TypeScript base config (`packages/config/tsconfig.base.json`)
- [ ] Shared ESLint config (`packages/config/eslint.config.js`)
- [ ] `.prettierrc`, `.gitignore`, `.env.example`
- [ ] Husky + lint-staged pre-commit hooks (lint + format check)

### 0.2 Docker / Infra

- [ ] `docker-compose.yml` – PostgreSQL 16 + Redis 7 with named volumes and health checks
- [ ] `infrastructure/docker/Dockerfile.web` – multi-stage Next.js build
- [ ] `infrastructure/docker/Dockerfile.api` – multi-stage NestJS build
- [ ] `infrastructure/nginx/default.conf` – reverse proxy (web :3000, api :3001)
- [ ] `infrastructure/scripts/setup.sh` – bootstrap: install → migrate → seed → dev
- [ ] Root `package.json` scripts: `setup`, `dev`, `build`, `docker:up`, `db:setup`

### 0.3 App Scaffolding

- [ ] `apps/web` – Next.js 15 (App Router, TypeScript strict, Tailwind CSS, shadcn/ui)
- [ ] `apps/api` – NestJS (TypeScript strict, Swagger/OpenAPI, class-validator, TypeORM)
- [ ] `packages/types/` – shared TypeScript interfaces package
- [ ] `packages/ui/` – shared UI components package
- [ ] `packages/sdk/` – API SDK package
- [ ] `packages/prompts/` – versioned AI prompt templates package
- [ ] `packages/config/` – shared ESLint + TS configs package

### 0.4 CI/CD

- [ ] `.github/workflows/ci.yml` – lint → test → build on every PR
- [ ] `.github/PULL_REQUEST_TEMPLATE.md` – review checklist
- [ ] `.github/ISSUE_TEMPLATE/` – bug and feature templates
- [ ] `CODEOWNERS` – code review assignments
- [ ] `README.md` badges (build status, license, coverage, Docker)

**Acceptance:** `docker compose up --build` starts all services; `pnpm dev` runs both apps; CI passes on empty branch.

---

## Phase 1 – Database Schema + Shared Types ✅ Complete

> Blocks all backend modules.  
> **ORM:** TypeORM (`@nestjs/typeorm`, `typeorm@^0.3.29`). Entities in `apps/api/src/database/entities/`.

### 1.1 TypeORM Schema (`apps/api/src/database/entities/`)

All tables carry a `tenant_id` FK for multi-tenant isolation.

| Entity                                   | Key Fields                                                                                |
| ---------------------------------------- | ----------------------------------------------------------------------------------------- |
| `PlatformUser`                           | email, password_hash, name                                                                |
| `Tenant`                                 | type (`PLATFORM\|ACCOUNTING_FIRM\|COMPANY`), name, parent_tenant_id                       |
| `Role` / `Permission` / `RolePermission` | RBAC definitions                                                                          |
| `UserTenant`                             | user_id, tenant_id, role_id                                                               |
| `AccountingFirm`                         | tenant_id, name, gst_number, contact info                                                 |
| `Company`                                | tenant_id, accounting_firm_id, name, gst_number, business_type                            |
| `Upload`                                 | tenant_id, file_path, file_name, mime_type, uploaded_by                                   |
| `ExtractionJob`                          | upload_id, status, prompt_version                                                         |
| `ExtractionResult`                       | job_id, raw_response, parsed_response, confidence_score                                   |
| `ExtractionRevision`                     | result_id, revision_number, corrected_data, corrected_by                                  |
| `Invoice`                                | tenant_id, upload_id, vendor_name, invoice_number, invoice_date, amount, currency, status |
| `Review`                                 | tenant_id, result_id, reviewed_by, status (`PENDING\|APPROVED\|REJECTED`)                 |
| `ReviewHistory`                          | review_id, field_name, original_value, new_value, changed_by                              |
| `Transaction`                            | tenant_id, invoice_id, amount, currency, payment_head_id, sub_head_id, status             |
| `PaymentHead`                            | tenant_id, code, name, description                                                        |
| `PaymentSubHead`                         | tenant_id, payment_head_id, code, name                                                    |
| `BusinessTypeTemplate`                   | type, default head/sub-head tree (JSON)                                                   |
| `MISReport`                              | tenant_id, file_path, uploaded_by                                                         |
| `AuditLog`                               | tenant_id, user_id, entity_type, entity_id, action, changes (JSON), ip_address            |
| `Notification`                           | tenant_id, user_id, type, message, read                                                   |

### 1.2 Schema Sync & Seed (`apps/api/src/database/seed.ts`)

- [x] Schema synced via `pnpm db:schema:sync`
- [x] Seed: 1 Platform Admin (`admin@finbridge.com / Password@123`)
- [x] Seed: 2 Accounting Firms, 3 Companies, 5 Accountants (`accountant@finbridge.com / Password@123`)
- [x] Seed: 1 Company User (`user@company.com / Password@123`)
- [x] Seed: Default PaymentHead trees for Manufacturing, IT Services, Consulting, Retail
- [x] Seed: 20 sample invoices in mixed states (PENDING, APPROVED, REJECTED) with extracted data

### 1.3 Shared Types Package (`packages/types/`)

- [x] `entities.ts` – TS interfaces mirroring all 22 TypeORM entities
- [x] `api-responses.ts` – `ApiResponse<T>`, `PaginatedResponse<T>`, `ErrorResponse`
- [x] `domain.ts` – enums: `TenantType`, `BusinessType`, `TransactionStatus`, `ReviewStatus`, `FileType`, `ExtractionStatus`, `AuditAction`, `NotificationType`

**Acceptance:** ✅ `pnpm db:seed` completes; all 22 tables in DB; `pnpm lint` passes; `tsc --noEmit` clean.

---

## Phase 2 – Backend Auth & Multi-Tenant Core ✅ Complete

> Blocks all backend feature modules.

### 2.1 Auth Module (`apps/api/src/auth/`)

- [x] `POST /auth/register` – bcrypt password (10 rounds), create user + tenant mapping
- [x] `POST /auth/login` – validate credentials, issue JWT (15 min) + refresh token (Redis TTL 7 days)
- [x] `POST /auth/refresh` – rotate refresh token, issue new JWT
- [x] `POST /auth/logout` – revoke refresh token from Redis
- [x] `POST /auth/accept-invite?token=` – create user account from invite token
- [x] Rate limiting on `/auth/login`: 5 req / 5 min per IP
- [x] Account lockout: lock after 5 failed attempts for 15 min

### 2.2 RBAC (`apps/api/src/common/authorization/`)

- [x] Role matrix defined: `PLATFORM_ADMIN`, `ACCOUNTING_FIRM_ADMIN`, `ACCOUNTANT`, `COMPANY_USER`
- [x] `@Roles()` + `@Permissions()` method decorators
- [x] `RolesGuard`, `PermissionsGuard`
- [x] `@Tenant()` parameter decorator – extracts tenant context from JWT (never from request params)

### 2.3 Multi-Tenant Middleware

- [x] `TenantContextService` – REQUEST-scoped service exposing current user, tenant, and role throughout request lifecycle
- [x] `TenantScopedRepository<T>` – abstract base class for explicit tenant-scoped queries (PLATFORM_ADMIN bypass)
- [x] `@CurrentUser()` + `@Tenant()` parameter decorators for controller injection

### 2.4 Users Module (`apps/api/src/users/`)

- [x] `GET /users/me` – current user profile
- [x] `PATCH /users/me` – update name, password
- [x] `UsersService` – findById, findByEmail, getProfile, update

**Acceptance:** ✅ Login returns JWT; protected routes return 401 without token; TenantContextService scopes queries by tenant_id; PLATFORM_ADMIN bypass verified by unit tests.

---

## Phase 3 – Backend Feature Modules ✅ Complete

> Modules 3.1–3.3 can start in parallel after Phase 2. 3.4 needs 3.3. 3.5 needs 3.4. 3.6 needs 3.5. 3.7 needs 3.6. 3.8 runs throughout.

### 3.1 Tenants / Firms / Companies

- [x] `src/tenants/` – full CRUD, tenant hierarchy validation (PLATFORM→FIRM→COMPANY enforced)
- [x] `src/accounting-firms/` – CRUD, `POST /accounting-firms/:id/invite-accountant` (Redis token, 7-day TTL)
- [x] `src/companies/` – CRUD, `POST /companies` auto-creates company tenant + assigns default PaymentHead template by `business_type`
- [x] `GET /companies/:id/details` – invoice count, pending review count, transaction total

### 3.2 Payment Heads / Sub-Heads

- [x] `src/payment-heads/` – full CRUD with tenant isolation
- [x] `src/payment-sub-heads/` – full CRUD, parent head validation
- [x] `GET /payment-heads/with-subheads` – nested hierarchy response
- [x] `GET /templates/business-types/:type` – default tree for Manufacturing / IT / Consulting / Retail
- [x] Validation: cannot delete head if sub-heads or transactions reference it
- [x] CSV export of full hierarchy

### 3.3 Uploads & File Handling

- [x] `src/uploads/` – `POST /uploads` (multipart), MIME whitelist (PDF, PNG, JPG, JPEG), max 10 MB
- [x] `StorageService` abstract interface with `LocalStorageProvider` (path: `/uploads/{tenant_id}/{upload_id}/`)
- [x] Auto-trigger `ExtractionJob` immediately after successful upload
- [x] `GET /uploads`, `GET /uploads/:id`, `DELETE /uploads/:id`

### 3.4 AI Extraction Pipeline

#### Prompt Templates (`packages/prompts/`)

- [x] `invoices/invoice.extraction.v1.ts` – JSON extraction schema, 2 few-shot examples, per-field confidence
- [x] `classification/document-classifier.v1.ts` – classify doc type before extraction
- [x] `validators/extraction-schemas.ts` – Zod schemas for all extraction output types

#### Services (`src/ai/`)

- [x] `ClaudeVisionService` – Anthropic SDK wrapper: file → base64 → Claude Vision, 3 retries w/ exp backoff, 60 s timeout
- [x] `ExtractionService` – orchestrate: classify → extract → validate → score → store
- [x] `FinancialValidator` – total = subtotal + tax; valid non-future dates; recognized currency; required fields present
- [x] `ConfidenceScoreService` – per-field + document-level scores; reject < 70%
- [ ] `VendorNormalizationService` – fuzzy-match extracted vendor against known vendors (Levenshtein) _(deferred — not on critical path)_
- [ ] `CategoryService` – suggest PaymentHead/SubHead from vendor + line item keywords _(deferred — not on critical path)_

#### Queue

- [x] BullMQ `ExtractionQueue` – max 5 concurrent, DLQ after 3 retries, 60 s job timeout
- [x] `GET /ai/extract/:id` – poll status
- [x] Store per extraction: `prompt_version`, `raw_response`, `parsed_response`, `confidence_score`, `validation_errors`

### 3.5 Review Workflow

- [x] `GET /reviews/pending` – paginated, scoped to accountant's tenant
- [x] `GET /reviews/:id` – extraction data + original file path + per-field confidence
- [x] `POST /reviews/:id/approve` – validates paymentHeadId/paymentSubHeadId, creates Transaction, writes AuditLog
- [x] `POST /reviews/:id/reject` – stores rejection reason, marks ExtractionJob FAILED
- [x] `PATCH /reviews/:id/edit` – field corrections → `ReviewHistory` entries per changed field
- [x] Auto-escalate reviews pending > 48 h – `ReviewEscalationScheduler` runs hourly via `@nestjs/schedule`

### 3.6 Transactions

- [x] Auto-created on review approval (populated from ExtractionResult)
- [x] `GET /transactions` – filters: date_range, payment_head_id, vendor_name, amount_range; pagination + sort
- [x] `PATCH /transactions/:id` – post-approval edits with full audit trail
- [x] CSV / JSON export endpoint

### 3.7 Reports

- [x] `POST /reports/upload` – MIS report file upload (Excel, PDF, CSV)
- [x] `POST /reports/generate` – types: Expense Summary, Vendor Summary, Category Breakdown, Cash Flow
- [x] `GET /reports`, `GET /reports/:id/download`
- [x] Token-based share links with configurable expiry (7 days, 30 days, no expiry)

### 3.8 Audit Logging (cross-cutting)

- [x] `AuditLogService.log(event)` integrated into every service for significant actions
- [x] Logged events: auth, all entity CRUD, extraction lifecycle, review actions, report access
- [x] `GET /audit-logs` – filters: date_range, user_id, entity_type, action; CSV export
- [x] Append-only (no delete, archive flag only)

**Acceptance:** ✅ All endpoints visible and testable in Swagger at `http://localhost:3001/api/docs`. `nest build` passes clean.

---

## Phase 4 – Shared Frontend Packages ✅ Complete

> Run in parallel with Phase 3.

### 4.1 SDK Package (`packages/sdk/`) ✅

- [x] `api-client.ts` – Axios instance: base URL `/api/v1`, JWT `Authorization` header interceptor, 401 → auto-refresh, `X-Request-Id` header
- [x] Domain services: `auth`, `companies`, `uploads`, `reviews`, `transactions`, `payment-heads`, `reports`, `audit`, `users`, `extraction`
- [x] React hooks: `useUpload` (progress tracking), `useExtraction` (status polling), `useReview`, `useTransactionList`
- [x] Zustand auth store (`useAuthStore`) + `useAuth`, `useTenant` hooks colocated in SDK

### 4.2 UI Component Package (`packages/ui/`) ✅

- [x] shadcn/ui re-exports: Button, Input, Label, Form, Dialog, Table, Badge, Card, Tooltip, Select, DatePicker
- [x] Custom components: `ConfidenceBadge`, `UploadZone`, `FilePreview`, `TransactionTable`, `ExtractionForm`, `DashboardCard`, `ActivityFeed`, `NavigationSidebar`, `UserMenu`
- [x] Layouts: `MainLayout` (sidebar + top nav), `AuthLayout` (centered), `AdminLayout`
- [x] Shared hooks: `useDebounce`, `useLocalStorage` (auth/tenant hooks live in SDK)
- [x] Tailwind preset + CSS design token variables in `src/styles/globals.css`

---

## Phase 5 – Frontend Features ✅ COMPLETE

> Run in parallel with Phase 3/4 once Phase 2 API endpoints are live.

### 5.1 Auth Pages (`apps/web/src/app/auth/`)

- [x] `/auth/login` – email/password, error display, redirect preserving return URL
- [x] `/auth/register` – name, email, password with strength indicator
- [x] `/auth/accept-invite` – pre-filled email/role from token, set-password form
- [x] Zustand auth store: `currentUser`, `token`, `refreshToken`, `login`, `logout`, `refresh`
- [x] `ProtectedRoute` wrapper – redirect to login; preserve requested path

### 5.2 Dashboard (`apps/web/src/app/dashboard/`)

- [x] Role-based sidebar nav (items filtered by role)
- [x] **Platform Admin:** firm count, user count, system health card, activity feed
- [x] **Firm Admin:** accountant team card, pending reviews card, transaction volume, payment head health
- [x] **Accountant:** pending review count, recent reviews list, extraction success stats
- [x] **Company User:** upload status, recent transactions, available reports, payment summary
- [x] Shared components: `StatCard`, `ChartCard`, `TableCard`, `EmptyState`

### 5.3 Upload Center (`apps/web/src/app/uploads/`)

- [x] React Dropzone – accept PDF/images, reject with message, multiple files
- [x] Per-file: thumbnail preview + progress bar + status label
- [x] Upload queue: pending → uploading → AI processing (polling `/ai/extract/:id`) → completed/failed
- [x] Upload history table: file_name, date, size, actions

### 5.4 Accountant Review UI (`apps/web/src/app/reviews/[id]/`)

- [x] **Two-column layout (40 / 60):** document viewer left, extraction form right
- [x] Extracted fields form – confidence score per field, inline editable
- [x] **Approve** – confirmation dialog with payment head/sub-head selection → `POST /reviews/:id/approve`
- [x] **Reject** – modal with reason dropdown + notes → `POST /reviews/:id/reject`
- [x] Keyboard shortcuts: `Ctrl+Enter` approve, `Ctrl+R` reject
- [x] Document URL via `uploadsService.fileUrl(id)` pointing to API file endpoint

### 5.5 Reports (`apps/web/src/app/reports/`)

- [x] Available reports table – download, delete, share actions
- [x] Generate report form: date range, report type
- [x] Report preview with Recharts (bar chart, pie chart)
- [x] MIS report upload section
- [x] Share modal: expiry selector + copy-to-clipboard link

### 5.6 Admin Panels

- [x] **Platform Admin** (`/admin/`): Companies table, Audit Logs table with filters, Overview stats
- [x] **Firm Admin** (`/firm-admin/`): Payment Heads tree editor (add/delete/expand), Settings tab

---

## Phase 6 – Demo Assets & Polish ✅ COMPLETE

### 6.1 Demo Assets

- [x] `demo-assets/invoices/` – 5 realistic sample invoice PDFs for live demo (generated via `infrastructure/scripts/generate-demo-assets.js`)
- [x] `demo-assets/salary-registers/`, `bank-statements/`, `reports/` – supporting demo files
- [x] `presentation/demo-script.md` – step-by-step demo walkthrough for judges
- [x] `presentation/architecture.md` – system architecture diagram (Mermaid flowcharts)

### 6.1a Bug Fix: Claude Vision PDF Handling

- [x] Fixed `apps/api/src/ai/extraction/claude-vision.service.ts` — PDFs now use `type: 'document'` (Anthropic API requirement); images use `type: 'image'`

### 6.2 AI Evaluation Dataset

- [x] `ai-evaluation/sample-invoices/` – 10 test invoice PDFs (5 from demo-assets + 5 additional)
- [x] `ai-evaluation/expected-json/` – ground-truth extraction output per invoice (matches `InvoiceExtractionSchema`)
- [x] `ai-evaluation/benchmark.ts` – benchmark runner with `--dry-run` and `--limit` flags; see `ai-evaluation/README.md`

### 6.3 One-Command Setup Verification

- [x] `docker compose up --build` – `api-init` service runs schema:sync + seed before `api` starts
- [x] `infrastructure/docker/Dockerfile.api-init` – dedicated init container (ts-node + source)
- [x] Frontend: `http://localhost:3000`
- [x] Backend: `http://localhost:3001`
- [x] Swagger: `http://localhost:3001/api/docs`
- [x] TypeORM entities at `apps/api/src/database/entities/`

---

## Phase 7 – Enhancements from Problem Statement

> Enhancements derived from `FinBridge_Hackathon_Problem_Statement.pdf`. Items are grouped by judging weight so high-impact work is done first. All items follow the Phase Plan Method — create a `tmp/phase-7-<slug>.md` before coding each sub-phase.

---

### 7.1 Multi-Document Type AI Extraction _(AI capability — 25% judging weight)_

The problem statement explicitly requires support for **payments, salary registers, and bank statements** alongside invoices. Current pipeline is invoice-only.

#### 7.1.1 Prompt Templates (`packages/prompts/`)

- [ ] `payments/payment.extraction.v1.ts` – extract: payer, payee, amount, payment_date, reference_number, payment_mode (cash/UPI/NEFT/cheque), bank_name
- [ ] `salary-registers/salary-register.extraction.v1.ts` – extract: month/year, employee rows (name, designation, gross, deductions, net), employer name
- [ ] `bank-statements/bank-statement.extraction.v1.ts` – extract: account_number (masked), bank_name, statement_period, transaction rows (date, description, debit, credit, balance)
- [ ] `validators/payment-extraction-schema.ts` – Zod schema for payment extraction output
- [ ] `validators/salary-register-extraction-schema.ts` – Zod schema for salary register extraction output
- [ ] `validators/bank-statement-extraction-schema.ts` – Zod schema for bank statement extraction output

#### 7.1.2 Backend Services (`apps/api/src/ai/`)

- [ ] `DocumentTypeRouter` – extend `document-classifier.v1.ts` to route to the correct extraction service based on classified doc type (`INVOICE | PAYMENT | SALARY_REGISTER | BANK_STATEMENT`)
- [ ] `PaymentExtractionService` – orchestrate: classify → extract payment → validate → score → store
- [ ] `SalaryRegisterExtractionService` – orchestrate: classify → extract salary rows → validate totals → score → store
- [ ] `BankStatementExtractionService` – orchestrate: classify → extract rows → validate running balance → score → store
- [ ] `FinancialValidator` additions: validate payment reference formats, salary deduction totals, bank statement running balance continuity

#### 7.1.3 Database Entities (new)

- [ ] `PaymentRecord` entity – tenant_id, upload_id, payer, payee, amount, payment_date, reference_number, payment_mode, status
- [ ] `SalaryRegisterRecord` entity – tenant_id, upload_id, month, year, employee_count, total_gross, total_net, raw_rows (JSON), status
- [ ] `BankStatementRecord` entity – tenant_id, upload_id, account_number_masked, bank_name, period_start, period_end, opening_balance, closing_balance, transaction_rows (JSON), status

#### 7.1.4 API Endpoints

- [ ] `GET /ai/extract/:id` – extend polling response to include `document_type` field
- [ ] `GET /payments` – list payment records with filters (date_range, payment_mode, amount_range)
- [ ] `GET /salary-registers` – list salary register records with filters (month, year)
- [ ] `GET /bank-statements` – list bank statement records with filters (period, bank_name)
- [ ] Extend review workflow: `GET /reviews/pending` and `GET /reviews/:id` to serve all document types, not just invoices

#### 7.1.5 Frontend Upload Center

- [ ] Upload zone: document type selector (Invoice / Payment / Salary Register / Bank Statement) shown before/during upload
- [ ] Per document type: appropriate extraction result display in the review UI (replace invoice-only form fields with dynamic field renderer keyed on `document_type`)

**Acceptance:** Upload a salary register PDF → AI extracts employee rows → review shows structured table → accountant approves → `SalaryRegisterRecord` persisted.

---

### 7.2 In-App Notification Center _(stretch goal — contributes to UX 15% + creativity 10%)_

The `Notification` entity exists in Phase 1 but no delivery mechanism or UI was built.

#### 7.2.1 Backend (`apps/api/src/notifications/`)

- [ ] `NotificationsService.notify(userId, type, message, entityId)` – persist to `Notification` table
- [ ] Wire notification calls into `ReviewService.approve()` and `ReviewService.reject()` – notify company user when their uploaded transaction is accepted or rejected
- [ ] Wire into `UploadService` – notify accountants when a new document arrives in their queue
- [ ] `GET /notifications` – paginated, unread-first; `PATCH /notifications/:id/read`; `PATCH /notifications/read-all`
- [ ] SSE endpoint `GET /notifications/stream` – Server-Sent Events for real-time push (no WebSocket infra needed)

#### 7.2.2 Frontend (`apps/web/src/app/`)

- [ ] `NotificationBell` component in `NavigationSidebar` top-bar – unread badge count
- [ ] Dropdown notification list: icon + message + relative timestamp + mark-read on click
- [ ] `useNotifications` hook in SDK – polls `/notifications` every 30 s (fallback if SSE unavailable); connects to SSE stream when available
- [ ] Toast pop-up on new notification arrival (use shadcn/ui `toast`)

**Acceptance:** Accountant approves a review → company user sees a toast and bell badge update within 30 s without page refresh.

---

### 7.3 Dashboard Analytics & Insights _(stretch goal — contributes to UX 15% + creativity 10%)_

Current dashboard shows count cards only. Problem statement calls for cash flow trends and top expense heads.

#### 7.3.1 Backend Reports API (`apps/api/src/reports/`)

- [ ] `GET /reports/insights/cash-flow` – monthly income vs expense totals for last 12 months (from approved transactions); query params: `tenant_id`, `year`
- [ ] `GET /reports/insights/top-expense-heads` – top 5 payment heads by total amount for a given period
- [ ] `GET /reports/insights/upload-funnel` – uploads → extracted → reviewed → approved (pipeline conversion counts)
- [ ] `GET /reports/insights/vendor-summary` – top 10 vendors by invoice total

#### 7.3.2 Frontend Dashboard (`apps/web/src/app/dashboard/`)

- [ ] **Company User:** `CashFlowChart` – Recharts `AreaChart` showing monthly inflow/outflow (12 months)
- [ ] **Company User:** `TopExpenseHeadsChart` – Recharts `PieChart` of top 5 payment heads
- [ ] **Firm Admin:** `UploadFunnelChart` – Recharts `FunnelChart` or stacked bar showing pipeline conversion
- [ ] **Firm Admin / Accountant:** `VendorSummaryTable` – sortable top-vendors table with sparkline amounts
- [ ] All charts: loading skeleton, empty state, date-range picker (last 30 / 90 / 365 days)

**Acceptance:** Company User dashboard shows populated cash flow chart and expense pie using seeded transaction data.

---

### 7.4 Bulk Bank Statement Upload with Auto-Categorization _(stretch goal — creativity 10%)_

#### 7.4.1 Backend

- [ ] `POST /uploads/bulk` – accept multiple files (up to 20), queue one `ExtractionJob` per file, return job IDs array
- [ ] `BankStatementCategorizationService` – after bank statement extraction, attempt to match each transaction row description against known `PaymentHead`/`SubHead` names using keyword matching; attach `suggested_head_id` and `suggested_sub_head_id` to each row
- [ ] `GET /bank-statements/:id/categorized` – return rows with AI-suggested categories and confidence

#### 7.4.2 Frontend

- [ ] Upload zone: "Bulk Upload" tab – multi-file drop area with per-file progress bars
- [ ] Bank statement review UI: spreadsheet-style table (read-only rows); each row shows extracted data + suggested category dropdown; accountant can override per-row and bulk-approve all

**Acceptance:** Upload 3 bank statement PDFs at once → all 3 extraction jobs queued → review UI shows categorized rows with suggested heads.

---

### 7.5 PWA – Mobile Bill Upload _(stretch goal — creativity 10%)_

- [ ] Add `apps/web/public/manifest.json` – `name`, `short_name`, `icons` (192×192, 512×512), `display: standalone`, `theme_color`
- [ ] Add `next-pwa` package; configure `withPWA` in `next.config.js` – service worker with cache-first for static assets, network-first for API calls
- [ ] `apps/web/public/sw.js` generated by next-pwa; register in `apps/web/src/app/layout.tsx`
- [ ] Mobile-optimised upload page (`/uploads/mobile`) – large tap target camera/gallery button; calls same `POST /uploads` endpoint
- [ ] Add `<meta name="viewport">` and responsive breakpoints to `MainLayout` for sub-480 px screens
- [ ] Add "Install App" banner on mobile browsers (beforeinstallprompt handler)

**Acceptance:** Chrome on Android shows "Add to Home Screen" prompt; installed PWA opens upload page; uploading a photo triggers extraction flow.

---

### 7.6 Submission Assets _(required for judging)_

#### 7.6.1 Presentation Deck (`presentation/`)

- [ ] `presentation/slides.md` – 5–8 slide outline:
  1. Problem (the email/WhatsApp chaos)
  2. Solution overview + tenant hierarchy diagram
  3. Architecture (reuse Mermaid from `architecture.md`)
  4. AI extraction demo screenshots (invoice + salary register)
  5. Review workflow demo screenshots
  6. What we'd build next (Tally/QuickBooks integration, mobile native, real-time collab)
  7. Team slide
- [ ] Export-ready slide content with key stats from seed data (e.g., "20 sample invoices, 4 business types, 95%+ extraction accuracy on test set")

#### 7.6.2 Demo Video Script (`presentation/demo-video-script.md`)

- [ ] 2–3 minute script covering: login as company user → upload invoice → switch to accountant → review & approve → check transaction + notification → show reports section
- [ ] Include voice-over cues and screen-recording checkpoints
- [ ] Note: record against `docker compose up` with seeded data for reproducibility

#### 7.6.3 README Polish (`README.md`)

- [ ] Add judging-criteria section explaining which features address each criterion
- [ ] Add "What's next" roadmap callout (Tally/Zoho integration, payment gateway — explicitly out of scope per problem statement)
- [ ] Verify one-command setup works end-to-end (`docker compose up --build`) and update any stale instructions

**Acceptance:** Presentation deck covers all 7 required slide topics; README setup instructions verified clean on a fresh Docker environment.

---

### Phase 7 Dependency Order

```
Phase 6 (Complete)
  └─► 7.1  Multi-Document AI Extraction  ← highest judging impact (AI 25%)
        └─► 7.2  Notification Center      ← wires into review approval events
  └─► 7.3  Dashboard Analytics           ← needs approved transactions from seed
  └─► 7.4  Bulk Bank Statement Upload    ← builds on 7.1 bank statement extractor
  └─► 7.5  PWA                           ← independent; needs working upload flow
  └─► 7.6  Submission Assets             ← last; screenshots from completed features
```

---

## Critical Files Reference

| File                                                                 | Phase | Purpose                                   |
| -------------------------------------------------------------------- | ----- | ----------------------------------------- |
| `pnpm-workspace.yaml`                                                | 0     | Workspace package roots                   |
| `turbo.json`                                                         | 0     | Turborepo pipeline config                 |
| `docker-compose.yml`                                                 | 0     | Local PostgreSQL + Redis                  |
| `apps/api/src/database/entities/`                                    | 1     | TypeORM entities (22 total)               |
| `apps/api/src/database/seed.ts`                                      | 1     | Demo seed data                            |
| `apps/api/src/auth/`                                                 | 2     | JWT auth module                           |
| `apps/api/src/common/authorization/`                                 | 2     | RBAC guards + decorators                  |
| `apps/api/src/ai/`                                                   | 3.4   | AI extraction pipeline                    |
| `packages/prompts/invoices/invoice.extraction.v1.ts`                 | 3.4   | Versioned invoice prompt                  |
| `packages/types/index.ts`                                            | 1     | Shared TS interfaces + enums              |
| `packages/sdk/api-client.ts`                                         | 4     | Axios SDK with interceptors               |
| `apps/web/src/app/reviews/[id]/page.tsx`                             | 5     | Review UI (highest-impact page)           |
| `packages/prompts/payments/payment.extraction.v1.ts`                 | 7.1   | Payment document prompt                   |
| `packages/prompts/salary-registers/salary-register.extraction.v1.ts` | 7.1   | Salary register prompt                    |
| `packages/prompts/bank-statements/bank-statement.extraction.v1.ts`   | 7.1   | Bank statement prompt                     |
| `apps/api/src/ai/extraction/document-type-router.ts`                 | 7.1   | Route to correct extractor by doc type    |
| `apps/api/src/notifications/notifications.service.ts`                | 7.2   | Notification delivery + SSE stream        |
| `apps/web/src/app/dashboard/`                                        | 7.3   | Insight charts (cash flow, expense heads) |
| `apps/web/public/manifest.json`                                      | 7.5   | PWA manifest                              |
| `presentation/slides.md`                                             | 7.6   | Judging submission deck                   |

---

## End-to-End Verification Checklist

- [ ] `docker compose up --build` → all 4 services start (postgres, redis, api, web)
- [ ] Login as `admin@finbridge.com` → Platform Admin dashboard visible
- [ ] Login as `accountant@finbridge.com` → Review queue shows seeded pending reviews
- [ ] Login as `user@company.com` → Upload an invoice → AI extracts data → review appears in accountant queue
- [ ] Accountant approves review → Transaction created → visible in Transactions + Reports
- [ ] Upload a salary register PDF → extraction routes to salary pipeline → review shows employee row table
- [ ] Upload a bank statement PDF → extraction routes to bank statement pipeline → categorized rows shown
- [ ] Accountant approves → company user receives in-app notification (bell badge + toast) within 30 s
- [ ] Company User dashboard shows cash flow area chart and top-expense-heads pie chart
- [ ] Bulk upload: drop 3 bank statement files → 3 jobs queued → all complete
- [ ] Chrome mobile: "Add to Home Screen" prompt appears; PWA upload flow works
- [ ] Swagger at `/api/docs` shows all endpoints with JWT auth
- [ ] CI pipeline (lint + test + build) passes on GitHub
- [ ] `presentation/slides.md` covers all 7 slide topics; README setup verified clean

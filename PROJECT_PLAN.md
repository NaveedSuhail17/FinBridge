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

## Phase 5 – Frontend Features

> Run in parallel with Phase 3/4 once Phase 2 API endpoints are live.

### 5.1 Auth Pages (`apps/web/src/app/auth/`)

- [ ] `/auth/login` – email/password, error display, redirect preserving return URL
- [ ] `/auth/register` – name, email, password with strength indicator
- [ ] `/auth/accept-invite` – pre-filled email/role from token, set-password form
- [ ] Zustand auth store: `currentUser`, `token`, `refreshToken`, `login`, `logout`, `refresh`
- [ ] `ProtectedRoute` wrapper – redirect to login; preserve requested path

### 5.2 Dashboard (`apps/web/src/app/dashboard/`)

- [ ] Role-based sidebar nav (items filtered by role)
- [ ] **Platform Admin:** firm count, user count, system health card, activity feed
- [ ] **Firm Admin:** accountant team card, pending reviews card, transaction volume, payment head health
- [ ] **Accountant:** pending review count, recent reviews list, extraction success stats
- [ ] **Company User:** upload status, recent transactions, available reports, payment summary
- [ ] Shared components: `StatCard`, `ChartCard`, `TableCard`, `EmptyState`

### 5.3 Upload Center (`apps/web/src/app/uploads/`)

- [ ] React Dropzone – accept PDF/images, reject with message, multiple files
- [ ] Per-file: thumbnail preview + progress bar + status label
- [ ] Upload queue: pending → uploading → AI processing (polling `/ai/extract/:id`) → completed/failed
- [ ] Upload history table: file_name, date, status, size, actions (view, download, retry)

### 5.4 Accountant Review UI (`apps/web/src/app/reviews/[id]/`)

- [ ] **Two-column layout (40 / 60):**
  - Left: `react-pdf` viewer – zoom controls, page navigation
  - Right: extracted fields form – `ConfidenceBadge` per field, inline editable
- [ ] Field diff: show original extracted value alongside edited value
- [ ] **Approve** – confirmation dialog → `POST /reviews/:id/approve`
- [ ] **Reject** – modal with reason dropdown (predefined + custom) + notes → `POST /reviews/:id/reject`
- [ ] Keyboard shortcuts: `Ctrl+Enter` approve, `Ctrl+R` reject
- [ ] Navigation: prev / next review, "Review N of M pending" indicator

### 5.5 Reports (`apps/web/src/app/reports/`)

- [ ] Available reports table – download, delete, share actions
- [ ] Generate report form: date range, report type, company filter
- [ ] Report preview with Recharts (bar chart, pie chart, line chart)
- [ ] MIS report upload section
- [ ] Share modal: expiry selector + copy-to-clipboard link

### 5.6 Admin Panels

- [ ] **Platform Admin** (`/admin/`): Users, Firms, Companies CRUD tables + modals; Audit Logs table with filters; System health
- [ ] **Firm Admin** (`/firm-admin/`): Accountants invite + manage; Companies manage; Payment Heads tree editor (add / edit / delete, bulk import template); Settings page

---

## Phase 6 – Demo Assets & Polish

### 6.1 Demo Assets

- [ ] `demo-assets/invoices/` – 5 realistic sample invoice PDFs/PNGs for live demo
- [ ] `demo-assets/salary-registers/`, `bank-statements/`, `reports/` – files used by seeder
- [ ] `presentation/demo-script.md` – step-by-step demo walkthrough for judges
- [ ] `presentation/architecture-diagrams/` – system architecture diagram (SVG/PNG)

### 6.2 AI Evaluation Dataset

- [ ] `ai-evaluation/sample-invoices/` – 10 test invoice files
- [ ] `ai-evaluation/expected-json/` – expected extraction output per invoice
- [ ] Benchmark script – run all 10, log accuracy, field completeness, confidence averages

### 6.3 One-Command Setup Verification

- [ ] `docker compose up --build` – migrations + seed run automatically on first start
- [ ] Frontend: `http://localhost:3000`
- [ ] Backend: `http://localhost:3001`
- [ ] Swagger: `http://localhost:3001/api/docs`
- [ ] TypeORM entities at `apps/api/src/database/entities/`

---

## Critical Files Reference

| File                                                 | Phase | Purpose                         |
| ---------------------------------------------------- | ----- | ------------------------------- |
| `pnpm-workspace.yaml`                                | 0     | Workspace package roots         |
| `turbo.json`                                         | 0     | Turborepo pipeline config       |
| `docker-compose.yml`                                 | 0     | Local PostgreSQL + Redis        |
| `apps/api/src/database/entities/`                    | 1     | TypeORM entities (22 total)     |
| `apps/api/src/database/seed.ts`                      | 1     | Demo seed data                  |
| `apps/api/src/auth/`                                 | 2     | JWT auth module                 |
| `apps/api/src/common/authorization/`                 | 2     | RBAC guards + decorators        |
| `apps/api/src/ai/`                                   | 3.4   | AI extraction pipeline          |
| `packages/prompts/invoices/invoice.extraction.v1.ts` | 3.4   | Versioned invoice prompt        |
| `packages/types/index.ts`                            | 1     | Shared TS interfaces + enums    |
| `packages/sdk/api-client.ts`                         | 4     | Axios SDK with interceptors     |
| `apps/web/src/app/reviews/[id]/page.tsx`             | 5     | Review UI (highest-impact page) |

---

## End-to-End Verification Checklist

- [ ] `docker compose up --build` → all 4 services start (postgres, redis, api, web)
- [ ] Login as `admin@finbridge.com` → Platform Admin dashboard visible
- [ ] Login as `accountant@finbridge.com` → Review queue shows seeded pending reviews
- [ ] Login as `user@company.com` → Upload an invoice → AI extracts data → review appears in accountant queue
- [ ] Accountant approves review → Transaction created → visible in Transactions + Reports
- [ ] Swagger at `/api/docs` shows all endpoints with JWT auth
- [ ] CI pipeline (lint + test + build) passes on GitHub

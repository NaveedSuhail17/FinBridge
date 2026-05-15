# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FinBridge is an AI-powered multi-tenant financial data exchange platform for accounting firms and companies. It automates invoice scanning with Claude Vision extraction, routes extracted transactions through an accountant review workflow, and generates financial reports.

**Status:** Codebase is being built from `finbridge_hackathon_repository_blueprint.md`. No code exists yet — use the blueprint as the source of truth for planned structure and decisions.

## Tech Stack

| Layer    | Tech                                                                                                                    |
| -------- | ----------------------------------------------------------------------------------------------------------------------- |
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind CSS + shadcn/ui, Zustand, React Hook Form + Zod, TanStack Table, Recharts |
| Backend  | NestJS, TypeScript, Prisma + PostgreSQL, BullMQ + Redis, Anthropic Claude Vision API, Swagger/OpenAPI                   |
| Monorepo | Turborepo, pnpm workspaces                                                                                              |
| Infra    | Docker + Docker Compose, GitHub Actions, Husky + lint-staged                                                            |

## Repository Structure

```
finbridge/
├── apps/
│   ├── web/              # Next.js frontend (App Router)
│   └── api/              # NestJS backend
├── packages/
│   ├── ui/               # Shared shadcn/ui components
│   ├── types/            # Shared TypeScript interfaces
│   ├── config/           # ESLint & TypeScript configs
│   ├── prompts/          # Versioned AI prompt templates
│   └── sdk/              # API SDK for frontend consumption
├── prisma/               # schema.prisma, seed.ts, migrations/
├── infrastructure/       # docker/, nginx/, scripts/
├── docs/                 # Architecture & domain docs
├── tmp/                  # Phase plan files (gitignored) — see Phase Plan Method below
│   ├── PHASE_PLAN_TEMPLATE.md
│   └── archive/          # Completed phase plans
└── docker-compose.yml    # PostgreSQL + Redis services
```

## Commands

### Setup

```bash
pnpm install
cp .env.example .env
docker-compose up -d          # start postgres + redis
pnpm db:migrate               # run prisma migrations
pnpm db:seed                  # seed demo accounts
```

### Development

```bash
pnpm dev                      # all apps via turborepo
pnpm -C apps/web dev          # frontend only
pnpm -C apps/api start:dev    # backend only (watch mode)
```

### Build / Lint / Test

```bash
pnpm build
pnpm lint
pnpm format
pnpm test
pnpm -C apps/api test src/auth/auth.service.spec.ts   # single test file
pnpm test --coverage
```

### Database

```bash
pnpm db:studio                # Prisma Studio GUI
pnpm db:reset                 # dev only — destroys data
```

### Env variables

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/finbridge
REDIS_HOST=localhost
REDIS_PORT=6379
ANTHROPIC_API_KEY=sk-ant-...
JWT_SECRET=
JWT_REFRESH_SECRET=
PORT=3001
```

## Architecture

### Multi-Tenant Isolation

Three tenant levels: `PLATFORM` > `ACCOUNTING_FIRM` > `COMPANY`. Every database table carries `tenant_id`. **Critical rule:** never read tenant context from request parameters — always extract from the JWT in middleware, then inject via a `@Tenant()` decorator so every Prisma query is automatically scoped.

### AI Extraction Pipeline

```
Upload → Store File → Queue Job (BullMQ) → Claude Vision OCR
  → Structured JSON Extraction → Financial Validation
  → Confidence Scoring → Human Review Queue
  → Accountant Approve/Edit/Reject → Persist Transaction
```

- All prompts live in `packages/prompts/` and must carry a version tag
- Use Zod to validate every AI response against the extraction schema
- Store `prompt_version`, `raw_response`, `parsed_response`, `confidence_score` per extraction for audit
- Reject extractions with confidence < 70%; never auto-publish financial records without human approval

### Backend Modules (NestJS)

```
src/
├── auth/              # JWT + refresh tokens
├── users/
├── tenants/
├── companies/
├── accounting-firms/
├── invoices/
├── uploads/           # file storage abstraction (local, S3-ready)
├── ai/
│   ├── extraction/
│   ├── classification/
│   ├── validators/
│   └── confidence-engine/
├── transactions/
├── review-workflow/   # accountant approve/reject queue
├── payment-heads/     # GL category structure (first-class feature)
├── payment-sub-heads/
├── reports/
├── audit/
└── common/
    ├── decorators/    # @Tenant, @Auth
    ├── guards/
    ├── filters/       # global exception filter
    └── pipes/
```

Controllers handle HTTP transport only. Services own all business logic. DTOs validate with class-validator + Zod.

### Frontend Structure (Next.js App Router)

```
src/
├── app/               # routes
│   ├── auth/
│   ├── dashboard/
│   ├── uploads/       # drag-and-drop invoice upload
│   ├── reviews/       # side-by-side invoice preview + editable extracted fields
│   ├── reports/
│   └── admin/
├── features/          # domain feature modules
├── components/
├── store/             # Zustand global state (auth, tenant context)
└── lib/
```

Default to server components; use client components only for interactive UI (forms, modals, file upload). Forms use React Hook Form + Zod. API calls go through `packages/sdk`.

### API Response Format

```json
{ "success": true, "requestId": "req_123", "message": "...", "data": {} }
```

Base URL: `/api/v1`. Auth: Bearer JWT.

## Key Design Decisions

- **Modular monolith** (not microservices): faster for hackathon, NestJS module boundaries allow future extraction
- **Shared DB + tenant filters** (not separate schemas): simpler ops for hackathon scale
- **BullMQ for AI jobs**: invoice extraction is async; frontend polls `/ai/extract/:id` for status
- **Payment Heads/Sub-Heads** are a first-class module (not secondary) — required for AI categorization and reporting
- **Domain events internally** (`invoice.uploaded`, `ai.extraction.completed`, `review.approved`) even in monolith: cleaner async flow and better presentation story

## Demo Accounts (Seeded)

| Email                    | Role           | Password     |
| ------------------------ | -------------- | ------------ |
| admin@finbridge.com      | Platform Admin | Password@123 |
| accountant@finbridge.com | Accountant     | Password@123 |
| user@company.com         | Company User   | Password@123 |

## Scope

**Out of scope (do not build):** Tally/Zoho/QuickBooks integrations, payment gateway, complex multi-dimensional reporting, advanced permission matrix. Prioritize depth and polish of the core AI extraction + review workflow over breadth.

## Development Workflow — Phase Plan Method

**All development work in this repository follows the Phase Plan Method.** Before writing any code for a task, create a phase plan file in `tmp/` and execute it step by step.

### Rules

1. **Break every task into phases.** Each phase is a self-contained, reviewable unit of work (e.g., "schema only", "service layer", "controller + DTOs", "frontend component").
2. **Create a phase plan file before starting.** Write it to `tmp/phase-<feature-name>.md` using the template at `tmp/PHASE_PLAN_TEMPLATE.md`.
3. **Complete one phase at a time.** Do not start the next phase until the current phase passes its review.
4. **Run a review agent after every phase.** Use the `/review` skill (or spawn a `claude` advisor agent) to review the completed phase against its acceptance criteria before moving on.
5. **Run a final review before opening a PR.** The final review covers the complete feature end-to-end: tests, lint, type-check, and functional correctness.
6. **Keep phase plan files in `tmp/`.** The `tmp/` directory is gitignored — it is working scratch space only. Archive completed plans to `tmp/archive/` rather than deleting them.

### Phase Plan File Naming

```
tmp/phase-<feature-slug>.md          # active plan
tmp/archive/phase-<feature-slug>.md  # completed plan
```

### When to Create a New Phase Plan

- Starting any task from `PROJECT_PLAN.md`
- Any bug fix that touches more than one file
- Any refactor
- Any new API endpoint or frontend page

### Phase Review Checklist (run after each phase)

- [ ] Code compiles / type-checks without errors
- [ ] Lint passes (`pnpm lint`)
- [ ] Unit tests written and passing for the phase scope
- [ ] Phase acceptance criteria met (as written in the phase plan)
- [ ] No regressions in adjacent modules
- [ ] Tenant isolation preserved (backend phases)
- [ ] No hardcoded secrets or tenant IDs

### Final Pre-PR Review Checklist

- [ ] All phases complete and reviewed
- [ ] `pnpm build` succeeds
- [ ] `pnpm test --coverage` passes
- [ ] Swagger docs up to date (backend changes)
- [ ] End-to-end demo flow works (login → upload → extract → review → transaction)
- [ ] `tmp/phase-<feature>.md` archived to `tmp/archive/`

---

## Project Plan

See [`PROJECT_PLAN.md`](./PROJECT_PLAN.md) for the full agile build plan — 6 phases with task checklists, dependency order, acceptance criteria, and an end-to-end verification checklist. Use this as the primary reference for what to build next and in what order.

## Useful Docs

- `docs/architecture.md` — system design rationale
- `docs/ai-instructions.md` — prompt engineering guidelines
- `docs/api-design.md` — REST endpoint reference
- `docs/domain-context.md` — business domain and user types
- `docs/security-guidelines.md` — security practices
- `finbridge_hackathon_repository_blueprint.md` — original full blueprint

# FinBridge

> AI-powered multi-tenant financial data exchange platform for accounting firms and companies.

FinBridge automates invoice scanning using Claude Vision, routes extracted transactions through an accountant review workflow, and generates financial reports — all with strict multi-tenant isolation.

## What it does

- **AI Extraction** — Upload invoices (PDF, PNG, JPG); Claude Vision extracts structured data with per-field confidence scores
- **Review Workflow** — Accountants approve, edit, or reject extractions in a side-by-side PDF viewer before any transaction is persisted
- **Multi-Tenant** — Platform → Accounting Firms → Companies hierarchy; every query is scoped to the tenant extracted from the JWT
- **Payment Heads** — Configurable GL category trees (first-class feature) used for AI categorization and reporting
- **Reports** — Expense summaries, vendor breakdowns, cash flow; MIS report uploads; shareable links

## Tech Stack

| Layer    | Tech                                                                     |
| -------- | ------------------------------------------------------------------------ |
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui, Zustand    |
| Backend  | NestJS, Prisma + PostgreSQL, BullMQ + Redis, Anthropic Claude Vision API |
| Monorepo | Turborepo, pnpm workspaces                                               |
| Infra    | Docker + Docker Compose, GitHub Actions                                  |

## Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Copy env file and fill in secrets
cp .env.example .env

# 3. Start infrastructure (PostgreSQL + Redis)
docker compose up -d postgres redis

# 4. Run migrations and seed demo data
pnpm db:setup

# 5. Start dev servers (frontend + backend)
pnpm dev
```

Frontend: http://localhost:3000  
Backend API: http://localhost:3001  
Swagger docs: http://localhost:3001/api/docs  
Prisma Studio: `pnpm db:studio`

## Demo Accounts

| Email                    | Role           | Password     |
| ------------------------ | -------------- | ------------ |
| admin@finbridge.com      | Platform Admin | Password@123 |
| accountant@finbridge.com | Accountant     | Password@123 |
| user@company.com         | Company User   | Password@123 |

## Repository Structure

```
finbridge/
├── apps/
│   ├── web/          # Next.js 15 frontend
│   └── api/          # NestJS backend
├── packages/
│   ├── types/        # Shared TypeScript interfaces & enums
│   ├── ui/           # Shared component library (shadcn/ui)
│   ├── sdk/          # API client SDK
│   ├── prompts/      # Versioned AI prompt templates
│   └── config/       # Shared ESLint + TypeScript configs
├── prisma/           # Schema, migrations, seed
├── infrastructure/   # Dockerfiles, nginx, scripts
└── docker-compose.yml
```

## Development

```bash
pnpm build          # Build all packages
pnpm lint           # Lint all packages
pnpm test           # Run all tests
pnpm format         # Format with Prettier
```

See [CLAUDE.md](./CLAUDE.md) for detailed architecture notes and the Phase Plan development workflow.

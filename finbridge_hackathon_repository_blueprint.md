# FinBridge – AI-Powered Multi-Tenant Financial Data Exchange Platform

## GitHub Repository Description

AI-powered multi-tenant financial data exchange platform for accounting firms and companies. Supports invoice scanning with LLM vision extraction, accountant review workflows, financial uploads, reporting, RBAC, and audit-ready transaction management.

---

# Recommended Tech Stack

## Frontend

- Framework: Next.js 15 (App Router)
- Language: TypeScript
- UI: Tailwind CSS + shadcn/ui
- State Management: Zustand
- Forms: React Hook Form + Zod
- API Client: Axios
- Tables: TanStack Table
- Charts: Recharts
- Authentication: JWT + Refresh Tokens
- File Upload: React Dropzone
- PWA Support: next-pwa (stretch goal)

## Backend

- Runtime: Node.js
- Framework: NestJS
- Language: TypeScript
- ORM: Prisma
- Database: PostgreSQL
- Queue System: BullMQ + Redis
- File Storage: Local Storage (hackathon) with S3-ready abstraction
- Authentication: JWT + RBAC
- Validation: class-validator + Zod
- API Docs: Swagger/OpenAPI
- AI Layer: Anthropic Claude Vision API

## AI Stack

- OCR + Vision Extraction: Claude Vision
- Structured Extraction: JSON schema-based prompting
- Confidence Scoring: Rule-based validation
- Prompt Templates: Versioned prompt registry
- AI Logging: Prompt + response audit storage

## DevOps

- Docker + Docker Compose
- Monorepo: Turborepo
- Package Manager: pnpm
- Environment Management: dotenv
- CI/CD: GitHub Actions
- Linting: ESLint
- Formatting: Prettier
- Git Hooks: Husky + lint-staged

---

# Recommended Repository Structure

```txt
finbridge/
│
├── apps/
│   ├── web/                         # Next.js frontend
│   └── api/                         # NestJS backend
│
├── packages/
│   ├── ui/                          # Shared UI components
│   ├── types/                       # Shared TypeScript types
│   ├── config/                      # Shared ESLint/TS configs
│   ├── prompts/                     # AI prompts and templates
│   └── sdk/                         # Shared API SDK
│
├── infrastructure/
│   ├── docker/
│   ├── nginx/
│   └── scripts/
│
├── docs/
│   ├── architecture.md
│   ├── coding-guidelines.md
│   ├── domain-context.md
│   ├── ai-instructions.md
│   ├── api-design.md
│   ├── deployment-guide.md
│   ├── security-guidelines.md
│   └── contribution-guidelines.md
│
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
│
├── .github/
│   └── workflows/
│
├── docker-compose.yml
├── turbo.json
├── pnpm-workspace.yaml
├── README.md
└── .env.example
```

---

# Initial Project Setup

## 1. Create Monorepo

```bash
mkdir finbridge
cd finbridge
pnpm init
```

## 2. Setup Turborepo

```bash
pnpm dlx create-turbo@latest
```

## 3. Setup Applications

### Frontend

```bash
pnpm create next-app apps/web --typescript --tailwind --eslint
```

### Backend

```bash
pnpm add -D @nestjs/cli
nest new apps/api
```

---

# Docker Compose

```yaml
version: '3.9'

services:
  postgres:
    image: postgres:16
    container_name: finbridge-postgres
    restart: always
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: finbridge
    ports:
      - '5432:5432'

  redis:
    image: redis:7
    container_name: finbridge-redis
    restart: always
    ports:
      - '6379:6379'
```

---

# Environment Variables

## .env.example

```env
# Database
DATABASE_URL=

# JWT
JWT_SECRET=
JWT_REFRESH_SECRET=

# Redis
REDIS_HOST=
REDIS_PORT=

# AI
ANTHROPIC_API_KEY=

# Uploads
UPLOAD_DIR=

# App
NODE_ENV=
PORT=
```

---

# Recommended Core Modules

## Backend Modules

```txt
src/
├── auth/
├── users/
├── tenants/
├── companies/
├── accounting-firms/
├── invoices/
├── uploads/
├── ai/
├── reports/
├── audit/
├── notifications/
├── transactions/
├── review-workflow/
└── common/
```

---

# Suggested Database Design

## Core Entities

- PlatformUser
- Tenant
- AccountingFirm
- Company
- Role
- Permission
- Invoice
- Transaction
- Upload
- MISReport
- AuditLog
- PaymentHead
- PaymentSubHead

## Multi-Tenant Strategy

Use shared database + tenant isolation using:

```txt
tenant_id
company_id
accounting_firm_id
```

Apply tenant filters globally in backend services.

---

# AI Extraction Workflow

## Upload Flow

```txt
Upload Invoice
      ↓
Store File
      ↓
Queue Extraction Job
      ↓
Claude Vision OCR
      ↓
Structured JSON Extraction
      ↓
Validation Layer
      ↓
Human Review Queue
      ↓
Accountant Approval
      ↓
Persist Final Transaction
```

---

# architecture.md

```md
# System Architecture

## Overview

FinBridge is a multi-tenant SaaS platform that enables secure financial data exchange between companies and accounting firms.

The architecture follows a modular monolith approach for hackathon speed while preserving future microservice scalability.

## Architectural Principles

- Domain-driven modular structure
- Multi-tenant isolation
- AI-first ingestion pipeline
- Queue-based background processing
- Clear separation of frontend and backend
- Shared type-safe contracts

## High-Level Components

### Frontend

- Dashboard
- Upload Center
- Review Workflow
- Reports Module
- Admin Panel

### Backend

- Authentication Service
- Tenant Management
- AI Extraction Engine
- Review Workflow Engine
- Reporting Module
- Audit Service

### Infrastructure

- PostgreSQL
- Redis
- Docker
- Claude API

## Request Lifecycle

User Upload → API → Queue → AI Extraction → Validation → Review → Approval → Reporting

## Scalability Plan

Future migration path:

- AI Service extraction worker
- Dedicated notification service
- Event-driven architecture
- S3 storage
- Kubernetes deployment
```

---

# coding-guidelines.md

```md
# Coding Guidelines

## General Principles

- Prefer readability over cleverness.
- Keep functions small and focused.
- Avoid deep nesting.
- Use strict TypeScript everywhere.
- Never use any unless unavoidable.

## Naming Conventions

### Variables

camelCase

### Components

PascalCase

### Constants

UPPER_SNAKE_CASE

### File Names

kebab-case

## Backend Standards

- Controllers handle transport only.
- Services contain business logic.
- DTOs validate requests.
- Repositories handle persistence.
- Use transactions for critical operations.

## Frontend Standards

- Use server components where possible.
- Keep client components minimal.
- Prefer composition over prop drilling.
- Use feature-based folder structure.

## AI Standards

- All prompts must be versioned.
- AI outputs must be validated.
- Never trust model responses blindly.
- Log prompts and outputs for debugging.

## Git Standards

Commit format:

feat: add invoice upload flow
fix: resolve tenant filtering issue
refactor: simplify extraction pipeline
```

---

# domain-context.md

```md
# Domain Context

## Problem Statement

Businesses exchange financial data manually through fragmented channels like email and WhatsApp.

Accounting firms manually re-enter data into accounting systems.

FinBridge centralizes uploads and uses AI to automate structured extraction.

## User Types

### Platform Admin

- Manages accounting firms
- Controls global platform

### Accounting Firm Admin

- Manages accountants
- Onboards companies
- Configures financial categories

### Accountant

- Reviews extracted transactions
- Approves/rejects entries
- Uploads MIS reports

### Company Admin/User

- Uploads invoices and statements
- Views reports

## Financial Documents

- Purchase invoices
- Sales invoices
- Payment receipts
- Salary registers
- Bank statements
- Transaction ledgers

## Core Workflow

Upload → AI Extraction → Human Review → Approval → Reporting
```

---

# ai-instructions.md

````md
# AI Development Instructions

## AI Goals

Use Claude Vision to:

- Extract invoice fields
- Detect totals and taxes
- Identify vendors
- Categorize transactions
- Reduce manual data entry

## Prompt Engineering Principles

- Use structured JSON responses.
- Provide explicit extraction schema.
- Include examples.
- Reject hallucinated values.
- Require confidence scores.

## Example Extraction Schema

```json
{
  "invoice_number": "",
  "vendor_name": "",
  "invoice_date": "",
  "currency": "",
  "subtotal": 0,
  "tax": 0,
  "total": 0,
  "confidence": 0
}
```
````

## Validation Rules

- Total must equal subtotal + tax.
- Dates must be valid.
- Currency must exist.
- Reject low-confidence extractions.

## AI Logging

Store:

- prompt_version
- raw_response
- parsed_response
- confidence_score
- review_changes

## Human-in-the-Loop

AI assists accountants.
AI never auto-publishes financial records.

````

---

# README.md

```md
# FinBridge

AI-powered multi-tenant financial data exchange platform.

## Features

- Multi-tenant SaaS architecture
- Invoice upload and AI extraction
- Accountant review workflow
- MIS report uploads
- Role-based access control
- Audit logs

## Tech Stack

### Frontend
- Next.js
- Tailwind
- TypeScript

### Backend
- NestJS
- PostgreSQL
- Prisma
- Redis

### AI
- Claude Vision API

## Local Setup

### 1. Clone Repository

```bash
git clone <repo-url>
cd finbridge
````

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Configure Environment

```bash
cp .env.example .env
```

### 4. Start Infrastructure

```bash
docker-compose up -d
```

### 5. Run Database Migrations

```bash
pnpm prisma migrate dev
```

### 6. Seed Database

```bash
pnpm prisma db seed
```

### 7. Start Applications

```bash
pnpm dev
```

## Demo Accounts

### Platform Admin

admin@finbridge.com

### Accountant

accountant@finbridge.com

### Company User

user@company.com

Password for all accounts:

```txt
Password@123
```

## Demo Flow

1. Login
2. Upload invoice
3. AI extracts transaction
4. Accountant reviews
5. Approve transaction
6. View reports

## Architecture

See docs/architecture.md

````

---

# contribution-guidelines.md

```md
# Contribution Guidelines

## Branch Strategy

- main
- develop
- feature/*
- fix/*

## Pull Requests

Every PR must:
- Pass linting
- Pass tests
- Include screenshots if UI changes
- Include migration notes if schema changes

## Code Reviews

Review checklist:
- Readability
- Security
- Tenant isolation
- Validation
- Error handling
- AI safety

## Testing

Required:
- Unit tests
- Integration tests
- Manual review for AI extraction
````

---

# api-design.md

````md
# API Design

## API Style

REST API with OpenAPI documentation.

## Base URL

/api/v1

## Authentication

Bearer JWT tokens.

## Core Endpoints

### Auth

POST /auth/login
POST /auth/register
POST /auth/refresh

### Companies

GET /companies
POST /companies
GET /companies/:id

### Uploads

POST /uploads
GET /uploads/:id

### AI Extraction

POST /ai/extract
GET /ai/extract/:id

### Transactions

GET /transactions
POST /transactions
PATCH /transactions/:id

### Review Workflow

POST /reviews/:id/approve
POST /reviews/:id/reject

### Reports

POST /reports
GET /reports

## Response Format

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {}
}
```
````

````

---

# deployment-guide.md

```md
# Deployment Guide

## Local Development

Use Docker Compose.

## Production Recommendation

### Frontend
- Vercel

### Backend
- Railway / Render / AWS ECS

### Database
- Supabase PostgreSQL / Neon

### Redis
- Upstash Redis

## Deployment Steps

1. Configure environment variables.
2. Run migrations.
3. Seed optional demo data.
4. Build frontend.
5. Start backend.

## Recommended CI/CD

GitHub Actions:
- lint
- test
- build
- deploy

## Future Improvements

- Kubernetes
- Dedicated AI workers
- Object storage
- CDN
````

---

# security-guidelines.md

```md
# Security Guidelines

## Multi-Tenant Security

- Every query must enforce tenant isolation.
- Never trust tenant IDs from frontend.
- Extract tenant context from JWT.

## Authentication

- Use hashed passwords.
- Rotate JWT secrets.
- Use refresh tokens.

## File Upload Security

- Validate MIME types.
- Scan uploads.
- Limit upload size.
- Prevent executable uploads.

## AI Security

- Sanitize prompts.
- Validate model outputs.
- Avoid prompt injection.
- Log extraction failures.

## API Security

- Rate limiting
- Request validation
- Helmet middleware
- CORS configuration

## Database Security

- Parameterized queries
- Prisma ORM validation
- Principle of least privilege
```

---

# Seed Data Strategy

Provide:

- 1 Platform Admin
- 2 Accounting Firms
- 3 Companies
- 5 Accountants
- 20 Demo Invoices
- Sample MIS reports
- Sample extracted transactions

Store sample files under:

```txt
seed-data/
├── invoices/
├── bank-statements/
├── salary-registers/
└── reports/
```

---

# Recommended Demo Features for Judges

## Must Demonstrate

- Multi-tenant onboarding
- Invoice upload
- AI extraction
- Accountant review workflow
- Reports visibility

## High Impact UX Features

- Upload drag-and-drop
- Confidence indicators
- Side-by-side invoice preview
- Extraction edit history
- Dashboard analytics

---

# Recommended Hackathon Scope

## Build First

1. Authentication + RBAC
2. Tenant onboarding
3. Invoice upload
4. Claude extraction
5. Accountant review flow
6. Reporting upload/download

## Build If Time Allows

- Notifications
- Dashboard analytics
- Audit timeline
- Mobile PWA
- Bulk upload

---

# Additional Improvements After Reviewing Hackathon PDF

## Important Gaps Identified from Problem Statement

The official FinBridge hackathon brief emphasizes several judging and workflow requirements that should be reflected more explicitly in the repository structure and implementation strategy. fileciteturn0file0L1-L3

## Recommended Upgrades

### 1. Explicit Three-Level Tenancy Architecture

The problem statement clearly defines:

- Platform Admin
- Accounting Firm Admin
- Company Admin/User

This hierarchy should be reflected directly in:

- RBAC design
- Database schema
- Middleware authorization
- Route guards
- Seed data
- UI navigation

Recommended additions:

```txt
TenantType
- PLATFORM
- ACCOUNTING_FIRM
- COMPANY
```

Add a dedicated authorization layer:

```txt
src/common/authorization/
├── policies/
├── guards/
├── decorators/
└── role-matrix/
```

---

### 2. Payment Head & Sub-Head Configuration Module

This is a core mandatory requirement in the PDF and should be treated as a first-class module instead of a secondary feature. fileciteturn0file0L8-L12

Add backend modules:

```txt
payment-heads/
payment-sub-heads/
transaction-categories/
```

Add database entities:

- PaymentHead
- PaymentSubHead
- BusinessTypeTemplate

This becomes extremely important for:

- AI categorization
- Financial reporting
- Bank statement mapping
- Expense analytics

Recommended default templates:

- Manufacturing
- IT Services
- Consulting
- Retail

---

### 3. Stronger AI Extraction Pipeline

The judging weight for AI capability is 25%, making this one of the most critical system components. fileciteturn0file0L28-L31

Current recommendation should be upgraded with:

## AI Processing Stages

```txt
Upload
  ↓
Document Classification
  ↓
OCR + Vision Extraction
  ↓
Schema Validation
  ↓
Financial Consistency Validation
  ↓
Auto Categorization
  ↓
Confidence Scoring
  ↓
Human Review Queue
```

## Add AI-Specific Modules

```txt
src/ai/
├── prompts/
├── extraction/
├── classification/
├── validators/
├── confidence-engine/
├── normalization/
└── audit/
```

## Add AI Features

- Vendor normalization
- Duplicate invoice detection
- GST/tax extraction
- Auto payment-head suggestion
- Confidence heatmap UI
- Extraction diff viewer

These features create strong demo impact.

---

### 4. Side-by-Side Accountant Review UX

The accountant workflow is a mandatory feature and should be visually polished because UX carries 15% judging weight. fileciteturn0file0L14-L15

Recommended UI:

```txt
┌────────────────────┬─────────────────────┐
│ Uploaded Invoice   │ Extracted Fields    │
│ PDF/Image Preview  │ Editable Form       │
└────────────────────┴─────────────────────┘
```

Add features:

- Highlight extracted fields
- Inline edit corrections
- Confidence badges
- Accept/reject workflow
- Activity timeline
- Version history

This should become a dedicated frontend feature module.

---

### 5. Stronger Demo Readiness Strategy

The PDF heavily emphasizes working demo quality and seed data. fileciteturn0file0L28-L31

Add:

```txt
/demo-assets/
├── invoices/
├── salary-registers/
├── ledgers/
├── bank-statements/
├── reports/
└── screenshots/
```

Add:

- Pre-generated demo screenshots
- Demo walkthrough script
- Sample extracted JSON
- Demo accounts by role
- Ready-to-test invoices

---

### 6. One-Command Local Setup

Judges should be able to run the project in under 5 minutes.

Upgrade recommendation:

```bash
docker compose up --build
```

This should:

- Start PostgreSQL
- Start Redis
- Start backend
- Start frontend
- Run migrations automatically
- Seed demo data automatically

Add scripts:

```json
{
  "scripts": {
    "setup": "pnpm install && pnpm db:setup",
    "db:setup": "prisma migrate deploy && prisma db seed",
    "dev": "turbo run dev",
    "docker:up": "docker compose up --build"
  }
}
```

This dramatically improves judging experience.

---

### 7. Add OpenAPI + Postman Collection

This is important for architecture quality.

Add:

```txt
/docs/postman/
/docs/swagger/
```

Generate:

- OpenAPI spec
- Postman collection
- Environment templates

---

### 8. Add Event-Based Internal Architecture

Even if implemented as a modular monolith, internally use domain events.

Example:

```txt
invoice.uploaded
ai.extraction.completed
review.approved
report.uploaded
```

Benefits:

- Cleaner architecture
- Better scalability story during presentation
- Easier async processing

---

### 9. Add Audit Timeline Feature

The PDF explicitly mentions audit trail as a stretch goal. fileciteturn0file0L18-L21

Add audit entities:

```txt
AuditLog
ReviewHistory
ExtractionRevision
```

Recommended UI:

```txt
Transaction Timeline
- Uploaded by
- AI extracted
- Reviewed by
- Modified by
- Approved by
```

This is a high-impact demo feature.

---

### 10. Add Dashboard Analytics

The PDF mentions dashboard insights as a stretch goal. fileciteturn0file0L18-L19

Recommended analytics:

- Monthly expenses
- Expense category breakdown
- Top vendors
- Cash flow trend
- Pending reviews
- Extraction confidence trends

These visuals improve product polish significantly.

---

### 11. Add Presentation-Focused Architecture Decisions

Since architecture quality has 20% judging weight, prepare explicit architecture rationale.

Add to architecture.md:

## Why Modular Monolith?

- Faster hackathon development
- Easier debugging
- Lower deployment complexity
- Future microservice migration path

## Why NestJS?

- Enterprise-grade structure
- Strong module boundaries
- Built-in validation
- Swagger support

## Why Claude Vision?

- Strong OCR understanding
- Better invoice comprehension
- Structured extraction capability

This improves presentation quality substantially.

---

### 12. Add Explicit Out-of-Scope Documentation

The PDF clearly warns against wasting time on accounting integrations and payment gateways. fileciteturn0file0L22-L25

Add section in README:

```md
## Out of Scope

The following are intentionally excluded for hackathon focus:

- Tally integration
- Zoho integration
- QuickBooks integration
- Payment gateway integration
- Complex reporting engine
```

This shows product discipline.

---

### 13. Add Hackathon Presentation Folder

Recommended:

```txt
/presentation/
├── architecture-diagrams/
├── demo-script/
├── screenshots/
├── pitch-deck/
└── judges-notes/
```

This makes the repository feel highly professional.

---

### 14. Add Production-Ready API Standards

Upgrade API recommendations with:

- Request IDs
- Structured logging
- Global exception filters
- API versioning
- Pagination
- Rate limiting
- Validation pipes

Example response:

```json
{
  "success": true,
  "requestId": "req_123",
  "message": "Invoice extracted successfully",
  "data": {}
}
```

---

### 15. Add Better Frontend Feature Organization

Recommended frontend structure:

```txt
src/
├── app/
├── features/
│   ├── auth/
│   ├── dashboard/
│   ├── invoices/
│   ├── uploads/
│   ├── reviews/
│   ├── reports/
│   ├── analytics/
│   └── audit/
├── components/
├── services/
├── hooks/
├── store/
└── lib/
```

This improves maintainability.

---

### 16. Add AI Evaluation Dataset

Since AI quality is heavily judged, create evaluation samples.

Add:

```txt
/ai-evaluation/
├── expected-json/
├── sample-invoices/
└── benchmark-results/
```

Track:

- Extraction accuracy
- Field completeness
- Confidence averages
- Review correction rates

This creates strong engineering credibility.

---

### 17. Add Notification Architecture

Stretch goal from PDF. fileciteturn0file0L18-L20

Recommended implementation:

- In-app notifications
- Email abstraction layer
- Queue-based delivery

Events:

- Invoice accepted
- Invoice rejected
- Report uploaded
- Review assigned

---

### 18. Add Better Security Practices

Enhance security docs with:

- Signed upload URLs
- Virus scanning abstraction
- File encryption at rest
- Prompt injection prevention
- AI abuse protection
- Secure audit logs

---

### 19. Add Repository Quality Improvements

Recommended additions:

```txt
.github/
├── ISSUE_TEMPLATE/
├── PULL_REQUEST_TEMPLATE.md
├── CODEOWNERS
└── workflows/
```

Add badges:

- Build status
- License
- Coverage
- Docker support

---

### 20. Most Important Strategic Improvement

The best hackathon strategy based on the judging criteria is:

## Build fewer features with exceptional polish.

Prioritize:

1. AI invoice extraction
2. Accountant review workflow
3. Multi-tenant onboarding
4. Clean UX
5. Demo reliability

Avoid spending time on:

- Complex integrations
- Overengineered microservices
- Advanced analytics engines
- Excessive authentication complexity

A polished vertical slice will score better than broad incomplete functionality.

---

# Final Recommendation

For hackathon success:

- Prioritize polished core workflows.
- Make AI extraction reliable.
- Keep setup extremely simple.
- Use Docker for one-command startup.
- Include realistic seed data.
- Optimize demo experience.
- Keep architecture modular but practical.

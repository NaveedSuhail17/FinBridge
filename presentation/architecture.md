# FinBridge — System Architecture

## High-Level Overview

```mermaid
flowchart TB
    subgraph Client["Browser (Next.js 15)"]
        UP[Upload Center]
        RV[Review UI]
        RP[Reports]
        AD[Admin Panel]
    end

    subgraph API["NestJS API — Port 3001"]
        AUTH[Auth Module\nJWT + Refresh Tokens]
        UPLOADS[Uploads Module\nMultipart / MIME Check]
        QUEUE[BullMQ\nExtraction Queue]
        AI[AI Pipeline\nClaude Vision\nValidator + Scorer]
        REVIEW[Review Workflow\nApprove / Reject / Edit]
        TXN[Transactions Module]
        RPT[Reports Module]
        AUDIT[Audit Log\nAppend-only]
    end

    subgraph Infra["Infrastructure"]
        PG[(PostgreSQL 16\ntenant-scoped tables)]
        REDIS[(Redis 7\nQueues + Token Store)]
        FS[File Storage\nLocal / S3-ready]
        CLAUDE[Anthropic\nClaude Vision API]
    end

    UP -->|POST /uploads| UPLOADS
    UPLOADS -->|store file| FS
    UPLOADS -->|enqueue job| QUEUE
    QUEUE -->|extract| AI
    AI -->|read file| FS
    AI -->|classify + extract| CLAUDE
    AI -->|save result| PG
    AI -->|create Review| PG

    RV -->|GET /reviews/pending| REVIEW
    REVIEW -->|approve → Transaction| TXN
    REVIEW -->|field edits| PG
    TXN -->|POST /transactions| PG
    RPT -->|generate / download| RPT
    AD -->|audit logs| AUDIT

    API --- PG
    API --- REDIS
    AUDIT -->|log every mutation| PG
```

## Tenant Hierarchy

```mermaid
flowchart LR
    PLATFORM[🏛️ Platform\nFinBridge] --> FIRM1[🏢 Accounting Firm\nSharma & Associates]
    PLATFORM --> FIRM2[🏢 Accounting Firm\nMehta Financial]
    FIRM1 --> C1[🏭 Company\nTechVision Solutions]
    FIRM1 --> C2[🏬 Company\nSunrise Retail]
    FIRM2 --> C3[🏗️ Company\nApex Manufacturing]
```

Every database table carries `tenant_id`. The `TenantContextService` (REQUEST-scoped) extracts the current tenant from the JWT and injects it into all TypeORM queries — tenant data never leaks across boundaries. `PLATFORM_ADMIN` users bypass tenant filters.

## AI Extraction Pipeline

```mermaid
sequenceDiagram
    actor User
    participant Web
    participant API
    participant BullMQ
    participant ClaudeVision as Claude Vision API
    participant DB

    User->>Web: Upload invoice PDF/PNG
    Web->>API: POST /api/v1/uploads
    API->>DB: Save Upload record
    API->>BullMQ: Enqueue extraction job
    API-->>Web: 201 { uploadId, extractionJobId }

    loop Poll every 2s
        Web->>API: GET /api/v1/ai/extract/:id
    end

    BullMQ->>API: Process job
    API->>ClaudeVision: classify document (document block)
    ClaudeVision-->>API: { document_type: "INVOICE", confidence }
    API->>ClaudeVision: extract invoice fields (document block)
    ClaudeVision-->>API: structured JSON (vendor, amounts, dates, line items)
    API->>API: FinancialValidator (totals, dates, currency)
    API->>API: ConfidenceScorer (per-field + document-level)
    API->>DB: Save ExtractionResult
    API->>DB: Create Review (PENDING)
    API->>BullMQ: job complete

    Web->>API: GET /api/v1/ai/extract/:id
    API-->>Web: { status: COMPLETED }
```

## Tech Stack

| Layer    | Technology                                                                      |
| -------- | ------------------------------------------------------------------------------- |
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui, Zustand, Recharts |
| Backend  | NestJS, TypeScript, TypeORM, BullMQ, Anthropic Claude Vision API                |
| Database | PostgreSQL 16 (multi-tenant, shared schema)                                     |
| Queue    | Redis 7 + BullMQ (async extraction, DLQ after 3 retries)                        |
| Monorepo | Turborepo + pnpm workspaces                                                     |
| Infra    | Docker Compose, GitHub Actions CI                                               |

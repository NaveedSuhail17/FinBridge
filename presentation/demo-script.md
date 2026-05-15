# FinBridge — Live Demo Script

**Target audience:** Hackathon judges  
**Duration:** 8–10 minutes  
**Pre-requisites:** `docker compose up --build` completed, all 4 services healthy

---

## 0. Setup (before judges arrive)

1. Confirm all services are running:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - Swagger: http://localhost:3001/api/docs
2. Open the browser at http://localhost:3000 in a clean tab.
3. Have `demo-assets/invoices/` open in a file manager.

---

## 1. Platform Overview (1 min)

> "FinBridge is an AI-powered financial data exchange platform. Accounting firms connect their client companies, and FinBridge automates invoice ingestion — scanning documents with Claude Vision, routing extracted transactions through an accountant review workflow, and generating financial reports."

**Actions:**

- Show the login page at http://localhost:3000/auth/login
- Point out the three demo roles

---

## 2. Company User — Upload an Invoice (2 min)

Login: `user@company.com` / `Password@123`

**Actions:**

1. Navigate to **Upload Center**
2. Drag and drop `demo-assets/invoices/invoice-01.pdf` (Tech Solutions cloud services invoice)
3. Watch the per-file status: pending → uploading → **AI processing**
4. While the spinner runs, explain:
   > "BullMQ queues the extraction job. Claude Vision classifies the document, extracts all structured fields, validates totals, and scores confidence per field."
5. Status changes to **Completed** — click the file to see extraction results appear in the upload history.

**Talking points:**

- Multiple files can be queued simultaneously
- Progress bar shows real-time upload state
- AI processing is async — frontend polls `/ai/extract/:id`

---

## 3. Accountant Review Workflow (3 min)

Login: `accountant@finbridge.com` / `Password@123`

**Actions:**

1. Navigate to **Dashboard** — show the "5 Pending Reviews" stat card and the review queue
2. Click the newly uploaded invoice in the queue
3. Show the **two-column review UI**:
   - Left: embedded document viewer (the original PDF)
   - Right: extracted fields with per-field confidence badges
4. Point out confidence scores:
   > "Each field has a confidence score. Low-confidence fields are highlighted in amber so the accountant knows where to double-check."
5. Edit the Payment Head / Sub-Head dropdown (e.g., set to Infrastructure → Cloud Services)
6. Click **Approve** (`Ctrl+Enter`) → confirmation dialog
7. Confirm — transaction is created automatically

**Talking points:**

- Full audit trail: every field edit is logged in `ReviewHistory`
- Keyboard shortcuts for fast review throughput
- Reject flow available with structured rejection reasons

---

## 4. Transactions & Reports (1.5 min)

Still as accountant:

**Actions:**

1. Navigate to **Transactions** — show the newly created transaction and existing seeded data
2. Point out filters: date range, vendor, payment head, amount range
3. Navigate to **Reports** → click **Generate**
4. Select "Expense Summary" with a 90-day date range → Generate
5. Show the Recharts bar/pie preview
6. Click **Share** → copy the shareable link (token-based, configurable expiry)

---

## 5. Platform Admin — Multi-Tenant Overview (1.5 min)

Login: `admin@finbridge.com` / `Password@123`

**Actions:**

1. Dashboard → show firm count (2), company count (3), pending reviews across all tenants
2. Navigate to **Admin → Companies** — show the three seeded companies
3. Navigate to **Admin → Audit Logs** — filter by `action=CREATE` to show the review approval that just happened
4. Briefly open Swagger at http://localhost:3001/api/docs — show full API surface with JWT auth

**Talking points:**

- Platform → Accounting Firm → Company — strict three-level tenant hierarchy
- Every DB query is scoped by `tenant_id` — no cross-tenant data leaks
- Audit log is append-only; every significant action is recorded with IP, user, entity

---

## 6. Architecture Highlight (1 min)

Open `presentation/architecture.md` or share screen on the Mermaid diagram.

> "The monolith has clean module boundaries: uploads trigger BullMQ extraction jobs, AI results flow into the review queue, approvals create transactions, and all mutations emit domain events captured in the audit log."

---

## Demo Assets Reference

| File                                                         | Scenario                                                     |
| ------------------------------------------------------------ | ------------------------------------------------------------ |
| `demo-assets/invoices/invoice-01.pdf`                        | Tech Solutions Pvt Ltd — Cloud Infrastructure (INR 1,85,240) |
| `demo-assets/invoices/invoice-02.pdf`                        | Metro Office Supplies — Office Equipment (INR 47,200)        |
| `demo-assets/invoices/invoice-03.pdf`                        | CloudBase Technologies — SaaS Subscriptions (INR 94,400)     |
| `demo-assets/invoices/invoice-04.pdf`                        | FastFreight Logistics — Shipping & Freight (INR 31,860)      |
| `demo-assets/invoices/invoice-05.pdf`                        | Prime HR Consultants — Recruitment Services (INR 1,12,360)   |
| `demo-assets/salary-registers/salary-register-q1-fy2024.pdf` | Payroll register Q1 FY2024 (MIS upload demo)                 |
| `demo-assets/bank-statements/bank-statement-jan-2024.pdf`    | Bank statement Jan 2024 (MIS upload demo)                    |

**Note:** Seeded invoices in the database are _data-only_ (stats/charts). Use the files above for the live AI extraction demo.

---

## Troubleshooting

| Symptom                       | Fix                                                         |
| ----------------------------- | ----------------------------------------------------------- |
| Login fails                   | Check `JWT_SECRET` is set in `.env`                         |
| Extraction stays "Processing" | Check `ANTHROPIC_API_KEY` in `.env`; check Redis is running |
| Upload fails with 400         | Only PDF, PNG, JPEG ≤ 10 MB accepted                        |
| Docker build fails            | Run `docker compose down -v && docker compose up --build`   |

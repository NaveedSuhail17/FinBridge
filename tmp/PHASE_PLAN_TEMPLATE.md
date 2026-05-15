# Phase Plan: <Feature Name>

**Project Plan Reference:** [Link to section in PROJECT_PLAN.md]  
**Date Started:** YYYY-MM-DD  
**Status:** [ ] In Progress / [ ] Complete

---

## Context

<!-- Why is this work being done? What problem does it solve? What PROJECT_PLAN.md phase does it belong to? -->

---

## Scope

<!-- What is included in this task. What is explicitly excluded. -->

**In scope:**

-

**Out of scope:**

-

---

## Phases

> Complete one phase fully before starting the next. Run a review agent after each phase.

---

### Phase 1 — <Name> (e.g., "Database schema + types")

**Goal:** <!-- One sentence describing what this phase delivers -->

**Files to create / modify:**

- `path/to/file.ts` — description of change

**Tasks:**

- [ ] Task 1
- [ ] Task 2
- [ ] Task 3

**Acceptance Criteria:**

- [ ] Criterion 1 (verifiable, e.g., "migration runs without error")
- [ ] Criterion 2

**Review:** [ ] Passed  
**Notes from review:**

---

### Phase 2 — <Name> (e.g., "Service layer + business logic")

**Goal:**

**Files to create / modify:**

-

**Tasks:**

- [ ]
- [ ]

**Acceptance Criteria:**

- [ ]
- [ ]

**Review:** [ ] Passed  
**Notes from review:**

---

### Phase 3 — <Name> (e.g., "Controller + DTOs + Swagger docs")

**Goal:**

**Files to create / modify:**

-

**Tasks:**

- [ ]
- [ ]

**Acceptance Criteria:**

- [ ]
- [ ]

**Review:** [ ] Passed  
**Notes from review:**

---

### Phase 4 — <Name> (e.g., "Unit + integration tests")

**Goal:**

**Files to create / modify:**

-

**Tasks:**

- [ ]
- [ ]

**Acceptance Criteria:**

- [ ] All tests pass (`pnpm test`)
- [ ] Coverage ≥ 80% for new code

**Review:** [ ] Passed  
**Notes from review:**

---

## Final Pre-PR Review

- [ ] All phases above marked complete and reviewed
- [ ] `pnpm build` succeeds
- [ ] `pnpm lint` passes
- [ ] `pnpm test --coverage` passes
- [ ] Swagger docs updated (if backend)
- [ ] Tenant isolation verified (if backend)
- [ ] End-to-end demo flow confirmed working
- [ ] This file archived to `tmp/archive/`

**Final review outcome:** [ ] Approved for PR / [ ] Needs rework  
**PR link:**

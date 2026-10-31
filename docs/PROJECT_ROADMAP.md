# Project Roadmap

## Delivery approach

Work in vertical slices with security and accessibility present from the first usable workflow. Each phase has a demonstrable artifact and acceptance criteria; later phases must not bypass ownership, observability, or test foundations.

## Phase 0 — Product requirements and architecture

**Objectives:** Establish scope, personas, technical decisions, privacy posture, data model, risks, and release boundaries.  
**Tasks:** Create and review the eight planning documents; identify unresolved decisions.  
**Dependencies:** None.  
**Deliverables:** Approved Phase 0 documentation.  
**Acceptance criteria:** All product modules, MVP boundaries, data flow, isolation, testing, risks, and open questions are documented; no application code is created.

## Phase 1 — Development environment and repository setup

**Objectives:** Make local and CI development reproducible.  
**Tasks:** Define project layout, formatting/linting/type checks, environment templates without secrets, CI, contribution guidance, and synthetic seed strategy.  
**Dependencies:** Phase 0 approval.  
**Deliverables:** Working empty frontend/backend shells only when approved, CI checks, local run instructions.  
**Acceptance criteria:** A new contributor can run checks with documented commands; secrets and production data are absent.

## Phase 2 — System architecture and database foundation

**Objectives:** Implement secure persistence and ownership boundaries.  
**Tasks:** Configure PostgreSQL, model entities, constraints, migrations, repository ownership scopes, session foundation, health checks, and job table.  
**Dependencies:** Phase 1; approved data model/security requirements.  
**Deliverables:** Tested database foundation and authenticated API skeleton.  
**Acceptance criteria:** Two synthetic users cannot read or relate one another's records; migrations and backup/restore procedure are tested.

## Phase 3 — UI/UX and design system

**Objectives:** Establish the celestial visual language without sacrificing usability.  
**Tasks:** Tokens, typography, responsive shell, navigation, focus states, reduced motion, error/loading/empty states, graph interaction patterns.  
**Dependencies:** Phase 0; can proceed in parallel with Phase 2 after contracts are agreed.  
**Deliverables:** Accessible design system and clickable screen flows.  
**Acceptance criteria:** Core flows work at mobile/desktop sizes with keyboard navigation and no dependence on color/hover alone.

## Phase 4 — Journal functionality

**Objectives:** Deliver trustworthy writing and archive basics.  
**Tasks:** Entry CRUD, autosave/drafts, revision conflicts, tags, archive search/filter/sort, deletion states, timeline shell.  
**Dependencies:** Phase 2 API contracts; Phase 3 UI foundation.  
**Deliverables:** End-to-end private journal workflow.  
**Acceptance criteria:** Save failures are explicit, edits do not silently overwrite, unauthorized IDs fail, and user can find/delete/export-ready entries.

## Phase 5 — Backend and database integration

**Objectives:** Harden API behavior and operational boundaries.  
**Tasks:** Complete pagination, validation, error envelopes, authorization matrix, rate limits, audit events, API integration tests, and observability.  
**Dependencies:** Phases 2 and 4.  
**Deliverables:** Stable versioned API used by frontend.  
**Acceptance criteria:** Contract and authorization tests cover every P0 endpoint; logs contain no journal content or secrets.

## Phase 6 — NLP and semantic embeddings

**Objectives:** Generate versioned infrastructure-local embeddings safely and measurably.  
**Tasks:** Select/evaluate model, worker lifecycle, idempotency, retries, memory limits, status UI, model metadata, pgvector indexes.  
**Dependencies:** Phase 2 jobs/database; Phase 5 ownership.  
**Deliverables:** New/edit processing pipeline and evaluation report.  
**Acceptance criteria:** Processing is asynchronous, retryable, owner-scoped, revision-aware, and does not call external AI services by default.

## Phase 7 — Graph construction

**Objectives:** Turn embeddings into explainable, bounded relationships.  
**Tasks:** Candidate retrieval, threshold/top-k policy, edge versioning, manual connections, clusters, rebuild tools, graph API.  
**Dependencies:** Phase 6 embeddings; Phase 5 API/security.  
**Deliverables:** Deterministic per-user graph projection.  
**Acceptance criteria:** Scores/policy/model are traceable; stale edges are handled; cross-user and self-edge tests pass.

## Phase 8 — Interactive constellation visualization

**Objectives:** Make the signature graph useful and accessible.  
**Tasks:** D3 adapter, node/edge selection, previews, filters, threshold controls, keyboard graph controls, stable layouts, large-graph modes.  
**Dependencies:** Phase 3 design system; Phase 7 graph API.  
**Deliverables:** Responsive constellation experience.  
**Acceptance criteria:** 10/100/1,000-entry test datasets meet agreed interaction budgets; reduced-motion and keyboard paths work.

## Phase 9 — Timeline and discovery

**Objectives:** Connect chronological and semantic exploration.  
**Tasks:** Daily/monthly/yearly views, date navigation, related-entry links, search state preservation, empty/sparse archive UX.  
**Dependencies:** Phases 4 and 8.  
**Deliverables:** Integrated timeline/archive/graph navigation.  
**Acceptance criteria:** Users can move between chronological and related views without losing context or violating ownership.

## Phase 10 — Observatory and insights

**Objectives:** Provide descriptive, evidence-linked discovery.  
**Tasks:** Activity summaries, recurring terms, clusters, distant connections, minimum evidence rules, qualified copy, source references, dismiss/hide controls.  
**Dependencies:** Phase 7 graph; Phase 9 timeline; privacy review.  
**Deliverables:** Basic observatory module.  
**Acceptance criteria:** Every insight identifies scope/method/evidence and abstains when data is insufficient; no diagnostic language passes review.

## Phase 11 — Testing, security, and optimization

**Objectives:** Prepare for a trustworthy public beta.  
**Tasks:** E2E, performance/load, threat modeling, dependency scanning, accessibility audit, backup restore, deletion verification, query tuning, incident runbook.  
**Dependencies:** All functional phases.  
**Deliverables:** Release candidate and risk register update.  
**Acceptance criteria:** P0 acceptance suite passes; measured thresholds and known limitations are documented; no unresolved critical/high security issue.

## Phase 12 — Deployment and documentation

**Objectives:** Operate the product safely.  
**Tasks:** Staging/production deployment, secrets, domains/HTTPS, monitoring/alerts, migrations, backups, privacy/terms, support and rollback docs.  
**Dependencies:** Phase 11 approval.  
**Deliverables:** Production MVP and operator documentation.  
**Acceptance criteria:** Deployment, rollback, restore, deletion, and incident procedures are tested; synthetic staging is isolated from production.

## Milestone gates

- **Architecture gate:** Phase 0 approved before implementation.
- **Private-alpha gate:** Phases 1–5 complete with two-user isolation tests.
- **Semantic-alpha gate:** Phases 6–8 complete with model/graph evaluation.
- **Feature-complete gate:** Phases 9–10 complete with privacy/content review.
- **Public-beta gate:** Phases 11–12 complete with security, accessibility, performance, backup, and deletion evidence.

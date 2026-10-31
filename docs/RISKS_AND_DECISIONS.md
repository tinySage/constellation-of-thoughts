# Risks, Mitigations, and Open Decisions

## 1. Risk register

| # | Risk | Likelihood | Impact | Mitigation |
|---:|---|---|---|---|
| 1 | Semantic similarity creates misleading or trivial connections. | Medium | High | Evaluate a representative corpus, expose score/model/threshold, use top-k and minimum thresholds, allow filtering, never describe results psychologically. |
| 2 | Chosen embedding model performs poorly on journaling language or multilingual text. | Medium | High | Benchmark candidate models, record model versions, abstain when evidence is weak, defer multilingual claims until evaluated. |
| 3 | Graph rendering becomes unusable at 1,000–10,000 entries. | High | High | Bound edges, use canvas/hybrid rendering, server-side neighborhoods/clusters, search-to-focus, performance budgets and dataset tests. |
| 4 | New users have too little data for meaningful patterns. | High | Medium | Design excellent writing/archive/timeline empty states, explain minimum evidence, avoid fabricated insights, offer starter guidance without sample-data contamination. |
| 5 | PyTorch inference consumes excessive memory or slows the API. | Medium | High | Run inference in a separate worker, bound concurrency, use a compact evaluated model, batch safely, monitor queue age and memory, retry with backoff. |
| 6 | Cross-user access exposes private entries or derived data. | Medium | Critical | Enforce ownership at route/service/repository/database layers, immutable job scopes, two-user authorization tests, threat modeling, consider row-level security. |
| 7 | Data loss occurs during autosave, conflicts, deletion, or provider failure. | Medium | Critical | Version checks, durable save states, draft recovery, transactional writes, backups, restore drills, idempotent deletion and clear failure UI. |
| 8 | Vector/full-text queries become expensive as archives grow. | Medium | High | Owner/model-aware indexes, ANN only after measurement, pagination, bounded candidates, query plans, archive-size load tests. |
| 9 | Graph edges become inconsistent after edits or model changes. | Medium | High | Revision/model metadata, stale status, idempotent targeted/full rebuilds, deterministic policy, visible processing state. |
| 10 | Hosting and inference costs exceed a student-led budget. | Medium | High | Use a modular monolith, pgvector initially, infrastructure-local inference, quotas, bounded processing, cost dashboards, explicit scale triggers before adding services. |
| 11 | Insights are interpreted as diagnoses or definitive personal claims. | Medium | Critical | Qualified language, evidence/source links, minimum sample sizes, product review, prohibit emotional/medical/personality conclusions, user dismissal controls. |
| 12 | OAuth, sharing, or exports introduce accidental disclosure. | Medium | High | Defer sharing/OAuth, re-authenticate sensitive actions, use scoped expiring exports, threat-model each new trust boundary. |
| 13 | Model or dependency license/availability changes. | Low/Medium | High | Record licenses, pin versions, maintain a model abstraction, keep a fallback evaluated model, review supply chain before releases. |
| 14 | Background jobs are duplicated, stuck, or execute after deletion. | Medium | High | Idempotency keys, leases, retries/dead-letter status, execution-time ownership/existence checks, cancellation and monitoring. |
| 15 | Accessibility suffers because graph interactions depend on pointer/animation. | Medium | High | Keyboard graph commands, focusable node list/preview, reduced motion, non-color cues, automated and manual accessibility testing. |

## 2. Important architectural decisions

### ADR-001: Modular monolith first

**Decision:** Keep API, domain logic, and worker in one repository and deployment family, while separating web request and inference processes.  
**Reason:** The product has one tightly coupled data domain; a modular monolith reduces operational overhead and preserves the option to split measured bottlenecks later.

### ADR-002: PostgreSQL + pgvector first

**Decision:** Store relational, full-text, and vector data in PostgreSQL initially.  
**Reason:** Ownership, transactions, deletion, and derived-data consistency matter more than premature vector-service specialization. A dedicated vector service is a measured scaling option.

### ADR-003: Infrastructure-local embeddings by default

**Decision:** Run Sentence Transformer inference in the application's controlled infrastructure and do not send journal text to third-party AI providers by default. “Local” does not mean running the model in the user's browser or device.  
**Reason:** Journal privacy is a core product promise. External providers require explicit consent, vendor review, retention controls, and a new threat model.

### ADR-004: Eventual semantic processing

**Decision:** Save entries synchronously and process embeddings/edges asynchronously.  
**Reason:** Writing must not wait on model inference. Processing status and retry behavior make eventual consistency understandable.

### ADR-005: Explainable graph policy

**Decision:** Use thresholded, top-k, versioned cosine similarity edges with visible score/method metadata.  
**Reason:** A bounded graph is more useful and performant than all-pairs similarity, and explanation is necessary for user trust.

### ADR-006: No diagnostic insight product

**Decision:** Observatory language remains descriptive and evidence-linked.  
**Reason:** Semantic patterns cannot establish psychological conditions or causes, and overclaiming would create safety and trust risks.

## 3. Decisions requiring approval

1. **Authentication provider:** The current MVP recommendation is first-party email/password with server-managed sessions; a managed identity provider remains a P1 alternative if security staffing or operational needs justify it.
2. **Email verification:** Require verification before journal access, or launch with password recovery plus later verification?
3. **Exact embedding model:** Which model, license, dimension, language coverage, and hardware budget meet the initial evaluation set?
4. **Graph policy:** What default threshold, top-k, reciprocal-neighbor rule, and minimum cluster size perform acceptably on representative data?
5. **Deletion retention:** Approve the preliminary retention schedule in `PHASE_0_ARCHITECTURE_REVIEW.md` for recoverable trash, backups, audit events, and export artifacts.
6. **Hosting and region:** Which provider/region offers adequate database backups, private networking, worker resources, and cost predictability?
7. **Full-text/semantic search scope:** Keep keyword search P0 and semantic archive search P1 until embedding quality and query cost are measured.
8. **Rich text:** Is plain text/Markdown sufficient for MVP, or is sanitized rich text required?
9. **Graph history:** Should users see historical graph snapshots, or only the current projection?
10. **Privacy/legal readiness:** Which jurisdictions and data-subject obligations apply before public launch, and who approves privacy copy?

## 4. Review checklist before Phase 1

- Product owner approves MVP boundary and non-diagnostic language.
- Engineering approves model evaluation plan, graph policy, and scale assumptions.
- Security/privacy reviewer approves ownership invariant, export/deletion behavior, logging, and external-provider stance.
- UX/accessibility reviewer approves empty states, graph keyboard model, reduced-motion behavior, and conflict/deletion flows.
- Operations owner approves provider, backups, restoration, monitoring, cost ceilings, and incident response.

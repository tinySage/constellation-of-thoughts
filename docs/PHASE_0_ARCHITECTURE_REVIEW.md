# Phase 0 Architecture Review

## Review scope and conclusion

This second-pass review compares the Phase 0 PRD, technical architecture, data model, security/privacy requirements, prioritization, roadmap, and risk register. The architecture is viable for a student-led modular monolith, but the following review decisions should be approved before implementation:

- Use first-party email/password authentication with server-managed sessions for MVP, while keeping a provider boundary for a possible managed identity service.
- Treat “local inference” as inference in controlled application infrastructure, not inference on the user's device.
- Select an embedding model only after a reproducible relevance evaluation; do not make a model winner part of Phase 0.
- Use a preliminary mutual top-k, thresholded, canonical undirected graph policy with no cross-model edges.
- Define deletion and retention periods before production data is accepted.

## 1. Inconsistencies found and resolved

| Area | Earlier inconsistency or ambiguity | Resolution |
|---|---|---|
| Authentication | PRD required secure cookies but architecture left “server sessions or rotating refresh tokens” open; Risks & Decisions presented both as equal MVP choices. | MVP now recommends first-party server-managed sessions in secure, httpOnly, same-site cookies. Managed identity is a P1 option behind the same application session and ownership boundary. |
| Local inference | “Locally hosted/local embeddings” could mean the backend host, a private worker, or the user's device. | Documents now use **infrastructure-local** for the controlled API/worker environment. User-device/browser inference is explicitly not required for MVP. |
| Deletion recovery | Earlier wording allowed recoverable trash in MVP “if feasible,” while prioritization placed trash/recovery in P1. | MVP requires explicit permanent deletion with no undo or recoverable-trash state. Recoverable trash remains a P1 feature and is not part of MVP deletion semantics. |
| Graph relationships | The ER diagram showed one generic `source_or_target` relation and did not express directed storage semantics or manual connection endpoints. | `GraphEdge` and `ManualConnection` now have explicit source and target relationships, canonical ordering, same-owner constraints, and distinct semantic/manual lifecycles. |
| Semantic search | PRD called it optional while prioritization made it P1. | Keyword search is P0; semantic archive search is P1 pending quality and cost evidence. |

Modified documents are limited to `PRD.md`, `TECHNICAL_ARCHITECTURE.md`, `SECURITY_AND_PRIVACY.md`, `DATA_MODEL.md`, and `RISKS_AND_DECISIONS.md`, and only the inconsistencies above were changed.

## 2. Authentication comparison

### Options

| Dimension | First-party email/password | Managed identity provider |
|---|---|---|
| Implementation complexity | The team owns registration, password hashing, reset, sessions, CSRF, email delivery, rate limits, abuse controls, and security UX. A narrow email/password scope is implementable but security-sensitive. | Provider supplies hosted or SDK-backed registration, password storage, reset, MFA options, abuse controls, and often email delivery. Application still maps provider identities to local users and enforces all journal authorization. |
| Cost | No per-user identity fee; costs are engineering time, email delivery, monitoring, incident response, and security maintenance. | Usually usage-based or tiered cost, plus email/enterprise features and vendor lock-in. Free tiers may be adequate for a small beta but must be verified against current terms. |
| Security responsibility | Highest responsibility: patch password/session code, tune Argon2id, protect reset flows, handle enumeration, CSRF, session theft, and incidents. | Reduces password-handling responsibility, but the team remains responsible for callback validation, session binding, account linking, authorization, provider configuration, recovery policy, and vendor outage/privacy risk. |
| Privacy/data boundary | Credentials and identity data remain under the project's control; email delivery still involves a provider. | Identity data and often authentication events are processed by a third party; contract, region, retention, and subprocessor review are required. Journal content should remain outside the identity provider. |
| Availability | The application controls the full path but must operate email and recovery dependencies. | Login depends on provider availability, quotas, SDK behavior, and configuration. |
| Portability | Direct database ownership and standard password/session model are portable. | Export and migration need provider-specific identity mapping; password hashes may not be portable. |
| Suitability | Good MVP fit only with vetted libraries, a narrow scope, security review, and operational discipline. | Good fit if the team lacks security expertise or needs MFA/social login quickly; potentially excessive for the initial email/password-only scope. |

### Recommendation

Use first-party email/password authentication for MVP with a dedicated authentication module, a vetted Argon2id library, server-managed opaque sessions, hashed reset/session tokens, generic account responses, rate limits, CSRF protection, and security tests. Do not write cryptography or password storage from scratch. Keep a provider-neutral internal user identity and session boundary so a managed provider can be added in P1 without changing journal ownership.

This recommendation minimizes external identity data and recurring identity cost while matching the narrow MVP requirement. It is conditional: if the team cannot obtain a security review or operate reset/email/session controls, choose a managed provider instead. The product owner must approve this tradeoff.

## 3. Candidate Sentence Transformer models

The figures below are planning estimates for common public checkpoints, generally assuming fp32 weights and excluding tokenizer/runtime overhead. Exact artifact size, license, and memory use must be verified from the selected model release before adoption. All candidates require a license and supply-chain review.

| Candidate | Dimensions | License to verify | Approx. fp32 weight memory | Inference considerations | Suitability |
|---|---:|---|---:|---|---|
| `sentence-transformers/all-MiniLM-L6-v2` | 384 | Apache-2.0 | ~90 MB | Fast and compact; good CPU baseline; may lose nuance on long or subtle entries. | Strong low-cost baseline for MVP and worker capacity tests. |
| `sentence-transformers/all-mpnet-base-v2` | 768 | Apache-2.0 | ~420 MB | Higher quality/cost tradeoff; slower and more memory-intensive; likely needs bounded worker concurrency. | Strong quality candidate for richer journal semantics. |
| `BAAI/bge-small-en-v1.5` | 384 | MIT | ~130 MB | Compact and capable; follow the model's recommended encoding/pooling instructions; evaluate symmetric entry-to-entry use. | Strong efficiency candidate. |
| `BAAI/bge-base-en-v1.5` | 768 | MIT | ~440 MB | More capacity than BGE-small with higher latency/memory; suitable for batch worker inference. | Quality candidate if evaluation justifies cost. |
| `intfloat/e5-base-v2` | 768 | MIT | ~440 MB | Retrieval-oriented; expected input prefixes/instruction conventions must be followed; direct symmetric similarity needs explicit evaluation. | Candidate for semantic search and graph comparison, but less straightforward than general-purpose sentence models. |

These are candidates, not a selection. The evaluation must include short and long entries, paraphrases, shared entities without shared wording, generic diary language, hard negatives, and topic drift. A model that wins on average but produces unacceptable hubness, trivial date-based matches, or poor explanations should not be selected.

## 4. Reproducible embedding evaluation methodology

### Dataset construction

Create a versioned synthetic corpus of at least 300 entries across 15–20 ordinary personal-journal themes, such as commuting, cooking, learning, family plans, exercise, creative work, travel, finances, sleep routines, and home projects. Avoid clinical or highly identifying content. Generate:

- **Positive pairs:** paraphrases, same-event rewrites, same-theme entries with different wording, and entries with a meaningful shared subtopic.
- **Negative pairs:** unrelated themes, same-day unrelated entries, shared generic words but different subjects, and hard negatives that share named entities or vocabulary without being meaningfully related.
- **Controlled variants:** short/long entries, title-only signals, body-only signals, spelling noise, and temporal references.

Use deterministic templates and a fixed random seed. Keep topic templates separated between development and held-out test sets to reduce lexical leakage. Store corpus version, generation seed, model revision, tokenizer revision, pooling/normalization settings, hardware, batch size, and runtime.

### Human judgments

Have at least three independent reviewers label a stratified sample of pairs on a 0–3 relevance scale:

- `0`: unrelated
- `1`: weak incidental overlap
- `2`: meaningfully related but not interchangeable
- `3`: strongly related or near-paraphrase

Reviewers should see only the two synthetic entries and the labeling rubric. Measure inter-rater agreement and adjudicate disagreements through a documented rule. Do not use model scores as human labels.

### Metrics and selection

For each model, encode entries with the same documented input construction, normalize vectors, and compute cosine similarity. Report:

- Spearman correlation between cosine score and mean human relevance.
- Pairwise ranking accuracy and ROC/PR curves for related vs unrelated pairs.
- Precision@k and Recall@k for nearest neighbors.
- Precision at candidate thresholds, including the false-positive rate on hard negatives.
- Latency, throughput, peak memory, and cold-start time on the intended worker hardware.
- Hubness and degree distribution when constructing graphs.

Select a threshold on the development set subject to a product-approved minimum precision, then report performance once on the held-out test set. Repeat across at least three random seeds or corpus slices. Preserve the evaluation artifact and model metadata so future model changes can be compared. Product owner approval is required for the relevance tradeoff; engineering approval is required for resource budgets.

## 5. Preliminary graph construction policy

This is a starting policy for evaluation, not a final product promise.

1. **Eligible nodes:** One stable node per active entry. Entries without a ready, current embedding remain visible as disconnected/pending nodes; entry revisions affect embeddings and edges, not node identity.
2. **Vector preparation:** Normalize vectors at storage or query time and calculate cosine similarity. Do not compare embeddings from different model versions.
3. **Candidate scope:** Retrieve candidates only for the same user, active entries, same model version, and compatible policy version. Exclude self-matches.
4. **Threshold:** Evaluate a grid such as `0.60` through `0.90` in small increments on the development corpus. Choose the lowest threshold that meets the approved precision/false-positive target while retaining useful recall. Do not hard-code a value before evaluation.
5. **Top-k:** Start with `k = 8` candidate neighbors per node, then measure degree distribution and visual density. Apply deterministic tie-breaking by score, then entry ID.
6. **Reciprocity:** Create a semantic edge only when the pair is in each other's top-k sets and meets the threshold. This reduces generic-entry hubs; a later policy may add a separately labeled “bridge” edge if recall is too low.
7. **Storage uniqueness:** Treat the graph as undirected for display. Canonicalize endpoint ordering (`min(node_id)` as source, `max(node_id)` as target) and allow one edge per projection generation and canonical pair. Generation-scoped uniqueness allows a staging replacement and its predecessor to coexist safely.
8. **Edge metadata:** Store `projection_generation_id`, score, model/version, threshold, top-k/reciprocity policy version, status, and generated timestamp.
9. **Disconnected nodes:** Keep them visible with a distinct status and accessible list; disconnected means no pair met the current policy, not that processing failed.
10. **Projection replacement:** A logical projection is identified by `(user_id, model_version, graph_policy_version)`; each build receives a distinct `projection_generation_id`. Build and validate the replacement as `staging`, keep the current generation readable, then atomically activate the replacement and retire the predecessor. Failed or interrupted builds never become current or partially modify the current generation. Ordinary graph reads expose only the current projection generation.
11. **Model-version changes:** Build a new logical/versioned projection without cross-version edges. Recompute affected edges, atomically activate the validated generation, then retire or retain old generations according to policy. Do not mix models in one active constellation.
12. **Clusters:** Derive clusters only from current active semantic edges; minimum cluster size and method must be versioned. Manual connections do not silently change semantic clusters.

## 6. ER and derived-data review

### GraphNode and GraphEdge

`GraphNode` is the stable, one-per-active-entry graph identity, with uniqueness `(user_id, entry_id)`. It is not versioned by embedding model or graph policy, and model upgrades do not create replacement nodes. A graph projection has logical identity `(user_id, model_version, graph_policy_version)` and each build has a distinct `projection_generation_id`. Versioning belongs to the projection and `GraphEdge` records, which reference the same stable nodes plus one projection generation.

`GraphEdge.source_node_id` and `target_node_id` both reference `GraphNode`. The user-facing relationship is undirected, but deterministic source/target ordering makes uniqueness, upserts, and traversal reproducible. Both nodes must reference active entries owned by the same user. A self-edge is invalid. The uniqueness key is `(projection_generation_id, canonical source, canonical target)`, so staging and predecessor generations can coexist safely.

### ManualConnection

`ManualConnection.source_entry_id` and `target_entry_id` both reference `JournalEntry`. It is also undirected in the UX and canonicalized for uniqueness. Both entries must belong to the same user, be distinct, and be active when the connection is current. Manual connections are independent from `GraphEdge` records, have no shared uniqueness constraint with semantic edges, and may coexist for the same entry pair. The UI displays both relationship types distinctly; semantic recomputation never modifies or deletes manual connections. Authorized permanent entry or account deletion may remove the affected manual connections.

### Ownership constraints

The explicit `user_id` on derived tables is useful for query scoping and defense in depth, but it must agree with the owner reached through every foreign-key path. Enforce same-owner relationships with a database-supported design (for example, composite owner/resource keys or carefully tested constraints) plus application checks. Row-level security remains defense in depth, not a substitute for application authorization.

### Derived-data lifecycle

Entry save is authoritative and transactional. Each active entry has one stable `GraphNode`, uniquely identified by `(user_id, entry_id)`. Embedding jobs are keyed by entry revision and model version. Embedding changes and model or policy upgrades create a new staging projection generation over the same nodes rather than mutating current `GraphEdge` records. Existing current edges remain readable until the replacement passes validation and is atomically activated; failed or interrupted builds never become current or partially modify the current generation. For individual permanent entry deletion, immediately exclude the deleted entry, its stable node, and every semantic edge referencing that node from ordinary reads; then cancel jobs and remove the entry's embeddings, affected semantic edges across current, staging, retired, and historical generations, manual connections, insights, search projections, and related derived data. Do not delete a projection or its generation metadata solely because one deleted entry no longer participates if that projection still serves other entries. This affected-entry cleanup must be idempotent, retryable, and targeted for completion within 24 hours. Account deletion removes all associated entries, nodes, embeddings, manual connections, graph edges, graph projection records, generation metadata, insights, search projections, jobs, and exports. Failed or interrupted cleanup never restores or exposes deleted content. Rebuilds must be safe after worker interruption.

### Additional integrity constraints

- An embedding's dimension must match its model registry record.
- A graph node must reference exactly one active entry and have one stable identity per `(user_id, entry_id)`; model and graph-policy versions belong to graph projections and edges, not nodes.
- An edge must reference stable nodes owned by the projection's user, include exactly one projection generation, and cannot cross users. Ordinary graph reads exclude deleted entries and semantic edges referencing deleted nodes immediately, and return only edges in the current projection.
- A manual connection may coexist with a semantic edge for the same entry pair because they are independent relationship types; each has its own uniqueness constraint and lifecycle, semantic recomputation never modifies or deletes the manual record, and authorized permanent deletion may clean up affected manual connections.
- Insight source references must point only to entries owned by the insight user and must be invalidated when those entries are deleted.
- Processing jobs and exports must contain an immutable owner scope and no journal body.
- Caches must include user scope and policy/model version in their keys.

## 7. Infrastructure-local versus user-device-local inference

**Infrastructure-local inference** runs the model in a worker or service controlled by the application operator, usually near PostgreSQL. Journal text crosses the user's encrypted connection to the service, but it is not sent to a third-party AI provider by default. This is the MVP recommendation because model availability, versioning, batching, memory limits, observability, and reprocessing are centrally controllable.

**User-device-local inference** downloads or bundles the model into a browser, desktop, or mobile client and computes embeddings on the user's hardware. It can reduce server exposure and recurring inference cost, but introduces model download size, device performance variance, browser/runtime support, update integrity, battery use, offline synchronization, and a larger client attack surface. It is a P2 exploration, not an MVP assumption. Either mode still requires careful handling of embeddings and graph data because embeddings can reveal sensitive topics.

## 8. Preliminary retention and deletion policy

These periods are engineering defaults for approval, not legal advice. The product owner and applicable privacy/legal reviewer must approve them before production.

| Data | Proposed retention and deletion behavior |
|---|---|
| Active entries | Retain until the user deletes them or the account is deleted. Keep original content unchanged through ordinary embedding retries. |
| Deleted entries / future trash | MVP permanent deletion is explicit with no recovery or undo. If P1 trash is approved later, retain recoverable content for 30 days, then permanently delete; that future feature must not change the MVP contract retroactively. |
| Embeddings | Delete or cryptographically render inaccessible within 24 hours of permanent source deletion; never retain an orphan vector for analytics. |
| Graph projections, nodes, and edges | For individual entry deletion, exclude the deleted entry, its stable node, and referencing semantic edges from active reads immediately; delete the affected node, edges, and related derived records within 24 hours. This 24-hour requirement applies to the deleted entry's affected records and derived data, not to entire projection generations that still serve other entries. Retain projection records, generation metadata, and unrelated edges when the generation still serves other entries. For account deletion, remove all associated graph projection records, generation metadata, nodes, and edges. Retain unrelated historical generations according to the graph-history retention policy once approved. |
| Insights/search projections | Invalidate immediately and rebuild/delete within 24 hours after source deletion. |
| Processing jobs | Cancel on deletion; remove payloads within 24 hours. Retain only minimal failure metadata for the audit period. |
| Audit/security events | Retain minimal pseudonymous security events for 12 months, then delete or aggregate, subject to legal/security review. Never retain journal bodies or embeddings. |
| Exports | Store encrypted, private, time-limited artifacts for 24 hours after completion or one successful download, whichever comes first; then securely delete. |
| Backups | Use encrypted rolling backups with a proposed maximum 35-day retention. Deleted content may persist in backups until expiry; document this clearly and test restore/deletion procedures. |
| Account deletion | Disable access and revoke sessions immediately; queue primary and derived deletion; target completion within 7 days; expire exports and jobs; allow only the approved minimal audit record to remain. |

Deletion jobs must be idempotent, observable, retryable, and tested against embeddings, graph data, caches, exports, backups, and search indexes. Legal holds, fraud/security investigations, and statutory records require an explicit exception process rather than silent retention.

## 9. P0/P1 prioritization review

### Consistent P0 dependencies

1. Authentication and ownership are prerequisites for every private resource.
2. Database constraints and scoped repositories must exist before journal CRUD, search, graph, export, or jobs.
3. Journal CRUD and revision handling precede embeddings because jobs need an authoritative revision.
4. Embeddings precede semantic edges; graph policy and edge storage precede constellation rendering.
5. Accessibility/design-system primitives should begin before feature UI, not after it.
6. Export and account deletion depend on the complete source/derived-data inventory and job lifecycle.

### P0/P1 boundary confirmation

- Keyword search remains P0; semantic archive search is P1 until evaluation proves quality and cost.
- Basic descriptive observatory output is P0; advanced cluster labeling and time-window comparisons are P1.
- Permanent deletion is P0; recoverable trash is P1.
- Infrastructure-local inference is P0; user-device inference is P2.
- First-party authentication is P0; managed identity integration is P1 unless the owner rejects the security responsibility.
- Large-graph aggregation is part of the P0 safety/performance boundary, while saved layouts and advanced graph algorithms are P1/P2.

No P0 item should be implemented before its ownership, deletion, and failure behavior is represented in the API/data model. This dependency is the main reason not to treat the constellation as an isolated visualization feature.

## 10. Decision register

| Decision | Available options | Recommendation | Rationale | Risks | Product-owner approval |
|---|---|---|---|---|---|
| Authentication | First-party email/password; managed identity provider; hybrid migration | First-party server-managed sessions for MVP; provider-neutral user identity | Narrow scope, lower external identity exposure/cost, direct control; preserve provider boundary | Password/reset/session security burden; email dependency | Approve MVP responsibility or choose managed provider |
| Embedding model | MiniLM, MPNet, BGE-small, BGE-base, E5-base, later model | No winner in Phase 0; select via held-out relevance/resource evaluation | Avoid optimizing for dimensions or benchmark reputation alone | Evaluation bias, license/resource changes, poor journal fit | Approve relevance/cost thresholds and final model |
| Inference location | Controlled infrastructure; user device; third-party API | Controlled infrastructure for MVP | Central versioning, batching, observability, and no default third-party content transfer | Server cost and infrastructure exposure | Approve privacy/cost tradeoff |
| Similarity policy | All-pairs; threshold only; top-k; mutual top-k; hybrid bridge edges | Threshold + mutual top-k=8 starting policy; tune threshold empirically | Controls graph density and generic hubs while retaining explainability | False negatives, disconnected graphs, hubness | Approve acceptable precision/recall and density |
| Model upgrades | Mix versions; replace in place; versioned projection | Approved: versioned semantic edge projection with no cross-version edges and atomic cutover over stable one-per-entry `GraphNode` identities | Reproducibility and consistent active graph without duplicating node identity | Recompute cost and temporary stale state | Historical-generation retention remains subject to product-owner approval |
| Deletion | Immediate hard delete; short trash; indefinite soft delete | Approved: explicit permanent delete in MVP; recoverable trash is deferred to P1 | Avoids unreviewed retention complexity while preserving a possible later feature | User regret; backup persistence | Backup retention/disclosure and any future P1 trash window require approval |
| Backups | No backups; short rolling backups; long retention | Encrypted rolling backups, proposed 35-day maximum | Recovery is required, but retention must be bounded and disclosed | Deleted data remains in backups; provider access | Approve provider, region, RPO/RTO, retention |
| Semantic archive search | P0; P1; never | P1 | Graph embeddings need evaluation first; keyword search validates archive utility | Delayed discovery feature; duplicate indexing work | Approve scope after evaluation |

## 11. Unresolved decisions requiring explicit approval

1. Approve first-party MVP authentication, or select a managed provider before implementation.
2. Approve the evaluation relevance target and acceptable graph false-positive/disconnected-node tradeoff.
3. Approve the exact model after the evaluation artifact is reviewed.
4. Approve 30-day future trash, the 24-hour cleanup target for an individual entry's affected records and derived data without requiring deletion of projection generations that still serve other entries, 12-month audit retention, 24-hour export expiry, and 35-day backup maximum, subject to legal review.
5. Approve hosting region/provider and the operational budget for infrastructure-local inference.
6. Approve whether historical graph projections are ever user-visible; the MVP recommendation is current projection only.
7. Approve plain text/Markdown versus sanitized rich text for the MVP editor.

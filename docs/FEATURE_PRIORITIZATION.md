# Feature Prioritization and Release Boundaries

## Prioritization framework

**P0** is required to validate the private write → connect → rediscover loop and meet a safe public beta bar. **P1** improves usefulness and scale after the foundation is proven. **P2** is intentionally deferred because it adds privacy, moderation, cost, or product-complexity risk.

## P0 — MVP

| Feature | Boundary and rationale |
|---|---|
| Email/password authentication | Secure registration, login/logout, session revocation, reset flow, ownership checks. |
| Private journal CRUD | Title, body, date, tags, previews, validation, reliable save states, revision conflict handling. |
| Archive | Keyword search, date/tag filters, sorting, entry management, empty/error states. |
| Timeline | Daily/monthly/yearly navigation linked to entries. |
| Infrastructure-local embeddings | Versioned asynchronous Sentence Transformer processing in controlled application infrastructure, with visible status. |
| Personal constellation | Exactly one stable `GraphNode` per active `(user_id, entry_id)`, thresholded semantic edges in versioned projection generations, pan/zoom/select, preview, filter, disconnected nodes, and staging/validation/atomic activation with ordinary reads limited to the current generation. |
| Manual connections | User-created links remain independent from generated semantic links, may coexist for the same entries, remain unchanged by semantic recomputation, and are clearly distinct in the UI. |
| Basic observatory | Activity counts, recurring terms, and simple topic/connection descriptions with evidence. |
| Export and deletion | Scoped export, explicit permanent and irreversible entry/account deletion with no trash, restore, or undo, dependent-data cleanup across affected records for entry deletion, and removal of all account-owned graph projection data for account deletion. |
| Security/accessibility baseline | HTTPS deployment, secure cookies, rate limiting, validation, audit events without journal bodies, keyboard and reduced-motion support. |

### Explicit MVP limits

- No public profiles or shared constellations.
- No third-party LLM calls or generated journal prose.
- No psychological, emotional, medical, or personality conclusions.
- No real-time collaborative editing.
- No native mobile applications.
- No multilingual model switching, though the data model must be versionable for it later.
- No unbounded full-archive force simulation; large graphs use aggregation/focus views.

## P1 — Important after MVP

- Semantic archive search with query explanation.
- Trash/recovery workflow and richer revision history.
- Better cluster labeling and representative-entry explanations.
- User-selectable graph layouts and saved views.
- Improved observatory comparisons across time windows.
- OAuth providers behind the same account/session abstraction.
- Background-job dashboard, model evaluation set, and reprocessing controls.
- Read-only sharing of explicitly selected entries or graphs after a privacy review.
- Import tools with preview, deduplication, and size limits.

## P2 — Future enhancements

- Multilingual and cross-language embeddings.
- Native mobile clients and offline-first synchronization.
- Collaborative/private shared constellations.
- Opt-in integrations with note-taking or calendar services.
- Advanced graph algorithms such as community evolution and path exploration.
- User-defined embedding models or on-device inference.
- Rich export formats including graph interchange formats.
- Optional research/analytics participation with separate, explicit consent.

## Recommended release strategy

### MVP

Ship only after the complete private data lifecycle works: account, entry save/edit/delete, search/timeline, asynchronous processing, graph exploration, export, account deletion, authorization tests, accessibility baseline, monitoring, and documented backup/restore procedures.

### Version 1.1

Focus on observed friction: faster large graphs, better explanations, semantic search, recovery, imports, and operational tooling. Do not expand into social features until ownership and sharing consent models are reviewed.

### Version 2.0

Add capabilities that require new trust boundaries or significant UX research, such as multilingual support, sharing, native clients, and richer graph analytics. Each must have an explicit privacy threat model and opt-in language.

## Deferred-feature rationale

Social sharing and collaboration are not merely UI features; they introduce authorization states, accidental disclosure, moderation, and revocation complexity. Generative AI and psychological interpretation can undermine trust and create safety concerns. Multilingual and advanced graph features should wait for evaluation data, cost measurements, and evidence that the core experience is useful.

## MVP exit criteria

- All P0 workflows have automated unit/integration/end-to-end coverage for happy, failure, and unauthorized paths.
- No known cross-user data leak in API, search, graph, export, or background processing.
- Graph remains usable and measurable at agreed archive-size thresholds.
- A new user receives a useful empty state and a clear path to first value.
- Product language has passed privacy and non-diagnostic review.

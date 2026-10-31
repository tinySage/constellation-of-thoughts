# Technical Architecture

## 1. Recommendation

Use a modular monolith: a React/TypeScript/Vite frontend, a Python/FastAPI backend, PostgreSQL with pgvector, and a worker process using Sentence Transformers/PyTorch. Deploy the frontend to Vercel or equivalent and the API/worker/database to a provider with private networking, persistent storage, managed backups, and job observability.

This stack matches the product: PostgreSQL provides transactional ownership and relational integrity; pgvector avoids an early separate vector service; FastAPI supports typed HTTP APIs and Python ML tooling; D3 supports the bespoke graph; a modular monolith keeps deployment and debugging appropriate for a student-led project.

## 2. Technology evaluation

| Technology | Decision | Notes and alternatives |
|---|---|---|
| React + TypeScript | Adopt | Strong component ecosystem and type-safe UI contracts. |
| Vite | Adopt | Fast development/build; keep deployment-independent. |
| Tailwind CSS | Adopt with design tokens | Use semantic tokens and reusable primitives; avoid utility sprawl and generic dashboard styling. |
| Python + FastAPI | Adopt | Good validation, async I/O, and direct access to Sentence Transformers. Django is a valid alternative but heavier for this API-first scope. |
| PostgreSQL | Adopt | Transactions, full-text search, constraints, and mature operational tooling. |
| pgvector | Adopt initially | Keeps vectors close to ownership data. A dedicated vector service is a later option only if measured scale requires it. |
| Sentence Transformers + PyTorch | Adopt in controlled infrastructure | Pin model/version and evaluate quality, memory, and licensing; user-device inference is not an MVP dependency. |
| D3.js | Adopt behind a graph adapter | Provides control over accessibility and interaction. Cytoscape.js or Sigma.js may be evaluated if graph scale outgrows a custom D3 renderer. |
| Pytest | Adopt | API, domain, graph, and worker testing. |
| Vitest + React Testing Library | Adopt | Fast component and interaction tests. |
| Playwright | Recommended addition | End-to-end browser and accessibility smoke tests. |
| Vercel + Render/managed PostgreSQL | Suitable for MVP | Confirm worker, private networking, backups, region, and cost limits before launch. Fly.io, Railway, or a cloud provider are alternatives. |

## 3. Logical components

1. **Web client:** Authentication state, editor, archive, timeline, graph rendering, settings, and API client.
2. **API application:** Authentication, authorization, journal, search, graph, insights, export, and account modules.
3. **Domain services:** Entry revision rules, ownership scope, similarity policy, graph construction, insight generation.
4. **PostgreSQL:** Users, entries, tags, embeddings, graph data, jobs, audit events, and full-text/vector indexes.
5. **Worker:** Idempotent embedding, candidate retrieval, edge recomputation, insight refresh, export, and deletion jobs.
6. **Object storage (optional):** Temporary encrypted exports and backups; never a source of authorization truth.
7. **Observability:** Metrics, structured operational logs, traces/error reports scrubbed of journal content.

## 4. API and communication

Use versioned REST endpoints with a consistent envelope for errors and cursor pagination for lists. Example resource groups:

- `/api/v1/auth/*`
- `/api/v1/me`
- `/api/v1/entries`, `/api/v1/entries/{entry_id}`
- `/api/v1/tags`
- `/api/v1/search`
- `/api/v1/timeline`
- `/api/v1/constellation`
- `/api/v1/insights`
- `/api/v1/exports`
- `/api/v1/settings`

The server derives `current_user_id` from the authenticated session. Client-supplied owner IDs are ignored or rejected. All handlers call shared authorization/query-scope helpers, and repository methods require an ownership scope rather than accepting unrestricted IDs.

Use JSON for ordinary requests and responses. Return `202 Accepted` for queued processing, expose explicit processing state, and use stable error codes for validation, conflict, rate limit, authentication, authorization, and dependency failure. Do not return stack traces or sensitive fields.

## 5. Authentication and authorization

Use first-party server-managed sessions in httpOnly, secure, same-site cookies for MVP. Store only hashed session/reset tokens, rotate and revoke sessions, and expire inactive sessions. A managed identity provider remains a P1 option behind the same application session/authorization boundary; it is not required for MVP. Add CSRF protection for cookie-authenticated state-changing requests, either with same-site controls plus a CSRF token or a carefully implemented double-submit strategy.

Authorization is deny-by-default and enforced at the route, service, repository, and database layers. Every entry, tag, embedding, node, edge, manual connection, insight, export, and job has a user ownership path. Prefer database foreign keys and row-level security as defense in depth; application authorization remains mandatory for readable errors and background work.

## 6. Entry lifecycle and data flow

1. The editor validates basic shape and sends a request with the last known revision.
2. API authenticates the session, validates limits, checks ownership/version, and stores the entry transactionally.
3. The API emits an idempotent processing job keyed by entry revision and model version.
4. Worker loads only the authorized entry revision, normalizes model input in memory, and generates a vector in the application's controlled infrastructure. This is infrastructure-local inference; it is not inference in the user's browser or device.
5. Worker stores the embedding with model metadata and marks it ready.
6. Worker retrieves nearest candidates constrained to the same user and compatible model/version, applies threshold/top-k rules, and writes edges into a versioned graph projection over the entries' stable `GraphNode` identities.
7. Worker atomically marks the new model/policy projection current, then retires the prior semantic edge projection according to retention policy and refreshes affected insights. `GraphNode` rows are not duplicated for model upgrades.
8. Client polls or receives a status update and requests a scoped constellation snapshot/neighborhood.
9. D3 renders nodes and edges through an adapter that can switch to aggregation or focus mode.

**New entries:** searchable immediately; graph processing is eventual and visible.

**Edits:** create a new revision or increment a revision number; old vector/edges remain marked stale until replacement succeeds, preventing accidental disappearance.

**Deletes:** an explicit permanent-delete request removes the entry from live reads in the initiating transaction, enqueues idempotent cleanup of its stable node, embeddings, semantic edges, manual connections, insights, search projections, jobs, and export references, and provides no MVP undo or recovery path.

**Failures:** retain the source entry, expose processing failure and retry, log a job ID/error class without body content, and alert on repeated failures.

**Repeated processing:** unique job keys and revision/model metadata make retries safe.

**Recalculation:** support targeted recomputation for an edited entry and a controlled full-user/model-version rebuild operation.

## 7. Embedding and graph construction

Start with a compact, well-supported Sentence Transformer suitable for English MVP text. Candidate models and a reproducible selection method are documented in `PHASE_0_ARCHITECTURE_REVIEW.md`; no model is selected until that evaluation is complete. Record dimensions, verified license, memory footprint, latency, and known limitations. Normalize vectors and use cosine distance/similarity. Do not combine title/body without documenting the weighting; a simple title-plus-body input with a separator is a reasonable starting point.

For each ready embedding, use pgvector nearest-neighbor search within the same user and compatible model version. Apply the preliminary threshold, top-k, reciprocal-neighbor, uniqueness, and version policy in `PHASE_0_ARCHITECTURE_REVIEW.md`; tune it only against the evaluation set and graph usability measurements. Store score, method, model version, graph-policy version, and status on semantic edges. Manual connections are separate records and may coexist with a semantic edge for the same pair; automated recomputation never creates, updates, or deletes a manual connection. The graph API returns relationship type explicitly so the UI can render semantic and manual indicators, explanations, and removal actions independently.

Clusters should be derived from the active semantic subgraph only after edge policy is applied. Use a simple connected-component or community method for MVP, with minimum-size rules and stable labels based on representative terms. “Cluster” means graph grouping, not a psychological category.

## 8. Database and background processing

Keep the API and worker in one repository and domain model initially, but run workers separately so infrastructure-local inference cannot block web requests. A database-backed job table is sufficient for MVP if it supports leases, retries, backoff, dead-letter status, and observability. Redis/Celery or a managed queue is a later option when throughput or scheduling needs justify it.

Transactions should cover entry state changes and job creation. Avoid long transactions around model inference. Use connection pooling, bounded worker concurrency, and resource limits because PyTorch can consume substantial memory.

## 9. Frontend and visualization architecture

Use feature modules (`auth`, `journal`, `archive`, `timeline`, `constellation`, `observatory`, `settings`) with shared API, accessibility, error, and design-token layers. Keep D3 imperative rendering isolated behind a typed graph adapter; React owns lifecycle and controls, while D3 owns the SVG/canvas scene.

At 10–100 entries, render the full graph. At 1,000, use canvas or hybrid rendering, filtered views, and bounded edges. At 10,000, default to server-side aggregation, clusters, search-to-focus, neighborhood queries, and a timeline; do not send or simulate the full graph by default.

## 10. Error handling and observability

Classify errors as client validation, authentication/authorization, conflict, rate limit, dependency, processing, or unexpected server failure. Return actionable messages without sensitive data. Use correlation/request IDs and job IDs. Metrics should include latency, error rates, queue age, embedding duration, retry counts, graph size, and database query timing. Logs must not contain journal bodies, search queries where they reveal content, embeddings, reset tokens, or export URLs.

## 11. Deployment and operations

Build the static frontend separately from the API. Run API and worker in managed services with environment-injected secrets, HTTPS, health checks, bounded resources, and controlled migrations. Use managed PostgreSQL with encrypted connections, automated backups, tested restoration, and a documented region/retention policy. Keep staging data synthetic; never copy production journal content into development.

Before public release, establish CI for type checks, linting, tests, dependency scanning, image scanning, and migration checks. Use feature flags/configuration for model and graph policy changes so recalculation is deliberate.

## 12. Performance assumptions

| Archive size | Strategy |
|---|---|
| 10 entries | Full graph, ordinary SQL, immediate visual feedback after processing. |
| 100 entries | Full graph with top-k edge cap and stable layout. |
| 1,000 entries | pgvector ANN, filtered/paginated graph payloads, canvas/hybrid rendering, bounded simulation. |
| 10,000 entries | Neighborhood/cluster endpoints, server aggregation, search-driven focus, no full client graph by default. |

Primary bottlenecks are inference memory/time, pairwise similarity if ANN is not used, graph payload size, force simulation, full-text/vector indexing, and deletion/export jobs. Measure before introducing separate services.

## 13. Testing architecture

- Unit: validators, ownership scopes, similarity policies, graph algorithms, insight wording rules.
- Integration: API + database + worker jobs, transactions, retries, revisions, deletion.
- Frontend: editor save states, filters, graph controls, keyboard behavior, error states.
- End-to-end: registration, write, process, explore, edit conflict, export, delete.
- Performance: API p95, queue throughput, graph payload/render thresholds at each archive size.
- Security: authorization matrix, session/reset handling, injection/XSS/CSRF, rate limits, dependency and secret scanning.

# Security and Privacy Requirements

## 1. Data classification and principles

Journal text is highly sensitive personal content. Embeddings, tags, graph edges, search indexes, exports, and insights are derived sensitive data because they can reveal themes even without the original text. Account identifiers, session tokens, reset tokens, operational logs, backups, and support artifacts require separate handling.

Principles:

- Collect only what is needed for the product.
- Keep content private by default and never use it for model training without explicit separate consent.
- Process embeddings in the application's controlled infrastructure by default; this infrastructure-local mode is distinct from user-device/browser inference, which is not required for MVP.
- Make automated relationships explainable and user-controllable.
- Give users export and deletion controls.
- Treat derived data as subject to the same ownership boundary as source entries.

## 2. Authentication and sessions

- Hash passwords with Argon2id using an approved library and current parameters; never log or recover passwords.
- Use secure, httpOnly, same-site cookies for sessions/refresh tokens, short expiration, rotation, revocation, and server-side invalidation.
- Hash stored session and password-reset tokens; make reset tokens single-use and short-lived.
- Require re-authentication for password changes, export, and account deletion as risk warrants.
- Rate-limit credential, reset, and session endpoints; use generic responses that avoid account enumeration.
- Enforce password length and breached-password policy without requiring arbitrary composition rules.
- Provide logout-all-sessions and notify users of security-sensitive changes when an email channel exists.

## 3. Authorization and tenant isolation

Every request derives the user identity from the authenticated session. The API must not trust a `user_id` in a URL/body/query as an ownership grant. Queries for entries, tags, embeddings, nodes, edges, manual connections, insights, jobs, exports, and settings must include the authenticated ownership predicate.

Use defense in depth:

1. Route dependencies reject unauthenticated requests.
2. Domain services enforce resource ownership and action policy.
3. Repository queries require an ownership scope.
4. Foreign keys and database constraints prevent orphan/cross-owner relationships.
5. Consider PostgreSQL row-level security for sensitive tables after operational testing.
6. Background jobs carry an immutable owner/resource scope and re-check existence/ownership at execution time.

Test guessed IDs, altered filters, pagination cursors, search snippets, graph endpoints, exports, deleted resources, and worker payloads across two users.

## 4. Application security

- Use parameterized ORM/query APIs; prohibit string-built SQL from user input.
- Validate and bound title, body, tags, dates, filters, thresholds, pagination, and import/export sizes.
- Escape journal content in HTML contexts and sanitize only when rich text is intentionally supported.
- Apply a restrictive Content Security Policy, secure headers, HTTPS, HSTS after rollout, and dependency updates.
- Protect cookie-authenticated mutations with CSRF defenses.
- Configure CORS to known frontend origins; do not use wildcard credentials.
- Rate-limit expensive search, graph, export, and processing requests.
- Use safe file handling for exports/imports, time-limited URLs, content-disposition, and malware scanning where uploads are introduced.
- Avoid exposing stack traces, SQL, model paths, internal IDs, reset tokens, or secrets in responses.

## 5. ML and insight safety

Sentence Transformer inference should run in the application's controlled infrastructure unless the user explicitly opts into a reviewed external service. Do not send journal text to third-party AI APIs by default, and do not assume user-device inference is available or secure. Pin and evaluate model versions, record model metadata, and plan reprocessing when a model changes.

Similarity is not emotion, intent, diagnosis, truth, or causation. UI and documentation must use qualified terms (“semantically related,” “appears frequently”) and show representative source entries, date ranges, thresholds, and methods. Insights need minimum sample sizes and should abstain when evidence is weak. Never generate medical, psychological, or personality conclusions.

## 6. Logging, monitoring, and support

Operational logs may include request/job IDs, route names, status, timing, error classes, and resource counts. They must not include journal bodies, full search strings, embeddings, export content, authentication secrets, or reset URLs. Error reporting must scrub request bodies and headers.

Support tooling should use least privilege, time-limited access, explicit audit records, and user consent where content access is unavoidable. Prefer metadata and reproducible synthetic cases over production content.

## 7. Backups, retention, and deletion

- Encrypt data in transit and at rest, including managed database backups and temporary exports.
- Define backup retention, region, provider access, and restoration testing before public launch. The preliminary retention schedule is specified in `PHASE_0_ARCHITECTURE_REVIEW.md` and remains subject to product/legal approval.
- Explain that deletion from live systems may be followed by a limited backup retention window; do not promise instantaneous erasure if technically false.
- Entry and account deletion should be explicit and permanent in MVP: remove source content from live reads immediately, revoke relevant access, remove primary and derived records through idempotent jobs, expire exports, and track completion status without retaining content. MVP provides no recoverable trash or undo.
- Remove stale embeddings, graph edges, insight caches, search indexes, and job payloads when their source is deleted.
- Set explicit retention for audit/security events and minimize identifiers.

## 8. Privacy controls and user rights

Provide account settings for export, deletion, session management, and optional analytics/model consent. Keep product analytics event-based and content-free. Document what is stored, why, where it is processed, retention periods, and how to contact the operator. Review applicable privacy law and data-subject obligations before public launch; legal advice may be required.

## 9. Threat model highlights

| Threat | Control |
|---|---|
| Guessed entry/graph IDs | Ownership-scoped queries, deny-by-default authorization, cross-user tests. |
| Stolen session | Secure cookies, rotation, expiration, revocation, HTTPS, CSRF controls. |
| Account takeover | Strong hashing, rate limits, reset token hygiene, security notifications. |
| Cross-tenant background job | Owner/resource scope in job, execution-time recheck, constrained repository APIs. |
| XSS through journal text | Contextual escaping, CSP, safe rendering, rich-text restrictions. |
| SQL injection | Parameterized queries, validation, code review, integration tests. |
| Export leakage | Re-authentication, encrypted/time-limited storage, single-use links, no logs. |
| Model/provider leakage | Local inference by default, explicit consent for alternatives, vendor review. |
| DoS via graph/inference | Size limits, quotas, rate limits, bounded worker concurrency, pagination. |
| Insider/support misuse | Least privilege, audit, content minimization, time-limited access. |

## 10. Security acceptance criteria

- Authorization tests cover every resource and endpoint with two isolated users.
- Secrets are injected at runtime and absent from repository, logs, images, and client bundles.
- Dependency, container, and static security checks run in CI.
- Backup restore is tested and deletion behavior is documented.
- A privacy review approves copy for export, deletion, model processing, and insights.
- Incident response includes credential revocation, containment, notification assessment, and evidence preservation without copying journal content unnecessarily.

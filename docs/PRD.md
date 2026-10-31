# Constellation of Thoughts — Product Requirements Document

## 1. Product summary

Constellation of Thoughts is a private, multi-user visual journaling application. Each journal entry is represented as a star; semantically related entries form weighted connections and clusters. Users can write, search, revisit, and explore their archive as an intimate digital observatory rather than only as a chronological list.

The product must be intelligent but non-diagnostic, visually immersive but calm, and useful with a small archive while becoming more valuable as the archive grows. Journal text, embeddings, graph data, and derived insights are sensitive personal data and must be isolated per user.

## 2. Vision and objectives

**Vision:** Help people rediscover relationships in their own writing while preserving privacy, authorship, and interpretive agency.

**Product objectives**

1. Make private journaling fast, reliable, and pleasant.
2. Make semantic relationships understandable and navigable.
3. Offer descriptive, evidence-linked observations without claiming psychological truth.
4. Provide trustworthy search, export, deletion, and account controls.
5. Establish a modular foundation that a student-led team can operate and evolve.

**Success indicators for the first public release**

| Area | Initial target |
|---|---|
| Writing | A user can create and reopen a saved entry in under three primary actions. |
| Reliability | Saved content is not lost during ordinary network or browser interruptions. |
| Discovery | A user with at least 20 entries can find related entries and understand why a connection exists. |
| Privacy | Automated tests demonstrate cross-user denial for entries, embeddings, edges, search, exports, and insights. |
| Accessibility | Core writing, archive, and graph actions work with keyboard navigation and a screen reader. |
| Trust | Every generated insight is descriptive, qualified, and traceable to visible data. |

## 3. Audience and product principles

### Primary audiences

- Daily journalers who want a calm writing habit and a richer way to revisit it.
- Irregular journalers who want to recover older thoughts without remembering exact dates or words.
- Reflective researchers, writers, and knowledge workers interested in recurring subjects and connections.

### Principles

1. **Private by default:** Entries are private; no social feed or public sharing is required for MVP.
2. **User remains the author:** AI-generated relationships are suggestions, not edits or conclusions.
3. **Explain before impress:** A connection should expose its score, threshold, and the two entries involved.
4. **Calm intelligence:** Avoid gamification, emotional diagnosis, and excessive notifications.
5. **Graceful emptiness:** New users receive useful writing and timeline experiences before enough data exists for clusters.
6. **Progressive complexity:** Basic archive and entry workflows remain usable without opening the constellation.

## 4. Functional requirements

### A. Authentication and accounts

- Register with email and password; validate email format and password policy.
- Log in, log out, and revoke active sessions.
- Store passwords with Argon2id or an equivalent modern adaptive password hash; never store plaintext.
- Use first-party server-managed sessions in secure, httpOnly, same-site cookies for MVP; use short session lifetimes, rotation, revocation, and CSRF protection.
- Support password recovery with single-use, expiring, hashed reset tokens.
- Authorize every resource by authenticated user ownership, not by client-supplied IDs alone.
- Provide account settings for email, password, display preferences, and data controls.
- Provide an explicit export request and account deletion flow with confirmation and re-authentication.
- Keep OAuth as a later provider abstraction; it is not required for MVP.
- Rate-limit login, registration, password reset, and session endpoints.

### B. Journal

- Create, edit, view, and delete entries with title, body, timestamps, tags, and processing status.
- Provide a distraction-free editor with autosave or durable draft persistence.
- Show saved, saving, offline/failed, and processing states; never imply persistence when a save failed.
- Use optimistic UI only where rollback is clear. Use revision/version checks to prevent silent last-write-wins conflicts.
- Support deletion confirmation and explicit permanent deletion in MVP; defer recoverable trash to P1 so retention and restoration behavior can be designed and tested properly.
- Offer entry previews, full entry views, manual connections, and related-entry navigation.
- Validate body size, title size, tag count, and tag length server-side.
- Preserve `created_at`, `updated_at`, and a user-visible entry date separately where appropriate.

### C. Constellation

- Represent each eligible journal entry as one user-owned node.
- Draw weighted semantic edges only between entries owned by the same user and passing the configured similarity policy.
- Support pan, zoom, fit-to-view, node selection, hover/focus preview, keyboard selection, and navigation to the full entry.
- Offer date and tag filters, similarity threshold controls, cluster highlighting, and a disconnected-node mode.
- Distinguish semantic edges from user-created manual connections visually and accessibly. Both relationship types may coexist for the same two entries: the UI shows separate relationship indicators and explanations rather than merging or hiding either one.
- Show an explanation panel containing the related entries, score, model/version, and threshold; do not present similarity as fact about the author.
- Use progressive loading, aggregation, or focus neighborhoods for large graphs. Never render an unbounded 10,000-node force simulation in the browser.
- Default to a stable, deterministic layout where possible so the same archive does not move unpredictably on each visit.

### D. Semantic intelligence

- Normalize only for model input; retain original user text unchanged for display and export.
- Generate one versioned embedding per entry revision using a Sentence Transformer running in the application's controlled infrastructure; “local” means infrastructure-local, not browser/device-local.
- Store model name, model version, dimensions, source revision, status, and generated timestamp.
- Use cosine similarity on normalized vectors; choose a default threshold through evaluation, not intuition alone.
- Generate candidate neighbors with pgvector approximate nearest-neighbor search, then apply threshold, per-entry/user bounds, and deterministic tie-breaking.
- Reprocess edited entries asynchronously and replace stale relationships only after the new embedding succeeds.
- Make processing idempotent using an entry revision and model version key.
- Support future multilingual models behind a model registry and embedding dimension/version boundary.
- Never infer depression, trauma, personality, intent, or emotional state; similarity is topical/semantic proximity only.

### E. Timeline

- Provide chronological daily, monthly, and yearly views.
- Filter by date range and tags, open entries, and move to previous/next entry.
- Link timeline entries to constellation nodes and related entries.
- Handle empty dates and sparse archives without suggesting missing data.
- Respect the user's preferred timezone for display while storing unambiguous timestamps.

### F. Observatory

- Describe writing activity, recurring terms, topic clusters, emerging/disappearing subjects, distant connections, and highly connected entries.
- Require minimum sample sizes and label insufficient evidence.
- Display the underlying date range, entry count, method, and representative entries for every insight.
- Use qualified language such as “appears frequently in this archive,” never “you are” or “this means.”
- Allow users to dismiss or hide an insight; do not silently make it a permanent profile.

### G. Archive and search

- Full-text search over title and body with safe parameterization and ranking.
- Optional semantic search over the user's own embeddings, clearly labeled as semantic.
- Filter by date and tag; sort by relevance, newest, oldest, or recently updated.
- Show snippets without leaking entries outside the current user's scope.
- Provide bulk-safe export in a documented format, including original content and relevant metadata.
- Support entry management from result lists without breaking search state.

## 5. MVP boundary

The MVP includes email/password authentication, private CRUD journaling, tags, reliable save states, archive keyword search and date filtering, a timeline, asynchronous infrastructure-local embeddings, per-user semantic edges, a responsive D3 constellation for small and medium archives, basic manual connections, export, account deletion, and essential accessibility/security controls.

The MVP excludes public sharing, social features, OAuth, real-time collaboration, mobile-native apps, autonomous writing generation, psychological analysis, multilingual model switching, and advanced observatory narratives. These omissions reduce privacy, moderation, inference, and operational risk while validating the core loop: write → connect → rediscover.

## 6. Non-functional product requirements

- Responsive from 320 px mobile width through desktop layouts.
- Keyboard-accessible controls, visible focus, semantic labels, reduced-motion support, and color-independent graph cues.
- Core API p95 under 500 ms for ordinary CRUD/search requests at target load, excluding asynchronous embedding work.
- New entries become searchable immediately after save; semantic status is visible while processing.
- A failed background task is retryable, observable, and never deletes the source entry.
- All user data operations are auditable without logging journal bodies or embeddings.

## 7. Release strategy

**MVP:** Private writing, archive, timeline, initial constellation, basic insights, export/deletion, and trustworthy foundations.

**Version 1.1:** Better graph performance, semantic archive search, richer filters, trash recovery, model evaluation tooling, improved observatory explanations, and optional OAuth.

**Version 2.0:** Multilingual models, user-controlled sharing with explicit scopes, collaborative or curated collections, mobile clients, advanced graph exploration, and opt-in integrations. These require stronger moderation, consent, cost controls, and privacy review.

## 8. Acceptance criteria

- A new account can create and retrieve only its own entry.
- Editing an entry produces a new processing revision and removes stale semantic relationships.
- Deleting an entry permanently removes its live source and dependent graph/embedding data through idempotent cleanup; MVP provides no trash or undo.
- A graph request cannot return another user's nodes, edges, tags, or entry previews even when IDs are guessed.
- Empty, failed, and large-archive states are usable and explained.
- Documentation, API behavior, and UI language consistently distinguish semantic similarity from emotional or psychological interpretation.

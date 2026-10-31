# Conceptual Data Model

## 1. Modeling principles

The relational model makes user ownership explicit on every sensitive aggregate. Source entries remain authoritative; embeddings, graph structures, and insights are derived and rebuildable. No SQL or migrations are specified in Phase 0.

Use UUIDs or another non-sequential opaque identifier for externally exposed resources. Store timestamps in UTC and render in the user's preferred timezone. MVP deletion is explicit and permanent: remove source content from live reads immediately and do not provide recovery or undo. A short-lived internal deletion marker may support idempotent cleanup, but it is not recoverable user data.

## 2. Entities

### User

**Purpose:** Account identity and authentication root.  
**Important fields:** opaque ID, normalized email, password hash, status, created/updated timestamps, deletion state.  
**Relationships:** owns entries, tags, connections, settings, jobs, exports, and insights.  
**Constraints:** unique normalized email; no plaintext credentials; status controls access.  
**Deletion:** revoke sessions immediately, then cascade/queue deletion of all account-owned primary and derived data, including graph projection records, generation metadata, nodes, edges, embeddings, manual connections, and related derived data.

### UserSettings

**Purpose:** Preferences and consent/configuration.  
**Fields:** user ID, timezone, locale, theme, reduced-motion preference, graph defaults, consent/version timestamps.  
**Constraints:** one row per user; settings cannot grant access to another user.  
**Deletion:** delete with user; retain only legally necessary consent/audit metadata.

### JournalEntry

**Purpose:** Original user-authored title/body and temporal metadata.  
**Fields:** ID, user ID, title, body, entry date, created/updated timestamps, revision, processing status, deleted timestamp.  
**Relationships:** has tags, embedding revisions, graph node, manual connections, and generated edges.  
**Constraints:** owner required; bounded text; revision increments atomically; date valid.  
**Deletion:** an explicit permanent-delete request removes the entry from live reads and initiates idempotent cleanup of all dependent data. No MVP trash, restore, or undo state exists.

### Tag

**Purpose:** User-defined classification.  
**Fields:** ID, user ID, normalized name, display name, timestamps.  
**Constraints:** unique normalized name per user; bounded length.  
**Deletion:** remove association rows; optionally retain tag only while referenced.

### EntryTag

**Purpose:** Many-to-many entry/tag association.  
**Fields:** entry ID, tag ID, created timestamp.  
**Constraints:** composite uniqueness; entry and tag must share the same user through constraints/application checks.  
**Deletion:** cascade with entry or tag.

### Embedding

**Purpose:** Versioned vector representation of an entry revision.  
**Fields:** ID, user ID, entry ID, source revision, model name/version, dimensions, vector, status, error class, timestamps.  
**Constraints:** unique entry/revision/model combination; vector dimensions match model; owner matches entry.  
**Deletion:** remove when source revision/account is deleted; stale rows may be retained briefly only if policy requires.

### GraphNode

**Purpose:** Stable graph identity for an entry across embedding, model, and graph-policy changes.  
**Fields:** ID, user ID, entry ID, visibility/status, layout metadata if persisted, timestamps.  
**Constraints:** exactly one active graph node for each `(user_id, entry_id)` pair; owner matches entry. `GraphNode` does not carry an embedding model, graph-policy version, projection identity, or projection generation. Those versions belong to the derived graph projection and its edges. Model upgrades and policy changes reuse this node and never create duplicate `GraphNode` records.
**Deletion:** remove with the entry during permanent deletion; it is not recreated merely because a model or graph policy changes.

### GraphProjection

**Purpose:** Logical and operational identity for a complete semantic graph build over a user's stable graph nodes.
**Fields:** ID, user ID, model version, graph-policy version, logical projection key, `projection_generation_id`, status (`staging`, `current`, `retired`, or `failed`), validation metadata, created/activated/retired timestamps.
**Relationships:** owns one generation of `GraphEdge` records and represents the graph returned by ordinary constellation reads when its status is `current`.
**Constraints:** the logical projection key is `(user_id, model_version, graph_policy_version)` and may have multiple historical generations. Each generation has a distinct `projection_generation_id`; this generation identity, not the logical key alone, scopes its edges. At most one projection generation may be `current` per user. A replacement is staged and validated before atomic activation.
**Deletion:** failed staging generations may be discarded; retired generations may be deleted or retained according to graph-history policy without affecting the current generation.

### GraphEdge

**Purpose:** Derived semantic relationship between two entries.  
**Fields:** ID, user ID, `projection_generation_id`, `source_node_id`, `target_node_id`, similarity score, method, model version, threshold/policy version, status, timestamps.
**Relationships:** `source_node_id` and `target_node_id` each reference `GraphNode`; the application treats the pair as undirected for constellation display, while source/target provide deterministic storage and traversal direction.  
**Constraints:** endpoints share owner and belong to the referenced projection's user; no self-edge; source and target are canonicalized so the lower opaque identifier is stored as source; one edge exists per `(projection_generation_id, canonical source_node_id, canonical target_node_id)`; score is in the valid cosine range; deleted/stale nodes cannot have current edges. Generation-scoped uniqueness permits a staging replacement and its predecessor to coexist safely.
**Deletion:** when an embedding changes, recomputation creates a new `GraphProjection` generation rather than mutating individual current `GraphEdge` records. Existing current edges remain readable while the replacement is staged. Successful atomic activation retires the previous generation. Failed or interrupted builds never replace or partially modify the current generation. Remove all generations with the account.

### ManualConnection

**Purpose:** Explicit relationship chosen by the user.  
**Fields:** ID, user ID, `source_entry_id`, `target_entry_id`, optional label/note, timestamps.  
**Relationships:** both entry references point to `JournalEntry`; the connection is undirected in the user experience, with canonical source/target ordering for storage.  
**Constraints:** same owner; no self-link; one manual connection per canonical entry pair per user; both entries must be active for a current connection; a manual connection may coexist with a `GraphEdge` for the same pair because they are independent relationship types; there is no shared uniqueness constraint with `GraphEdge`; semantic recomputation cannot modify or delete it.
**Deletion:** remove with either entry or account; never overwrite through semantic recomputation.

### Insight

**Purpose:** Versioned, descriptive aggregate derived from a user's archive.  
**Fields:** ID, user ID, type, text/structured payload, date range, source entry IDs or references, method/version, status, generated timestamp.  
**Constraints:** owner required; minimum evidence policy; payload excludes unsupported psychological conclusions.  
**Deletion:** remove/rebuild with source data; never expose cross-user aggregate data.

### ProcessingJob

**Purpose:** Idempotent asynchronous work tracking.  
**Fields:** ID, user ID, resource ID/type, job kind, source revision/model version, status, attempts, lease/retry timestamps, safe error class.  
**Constraints:** unique idempotency key; bounded attempts; owner scope immutable.  
**Deletion:** cancel/remove with account; no body content in payload.

### ExportRequest

**Purpose:** Track scoped data export.  
**Fields:** ID, user ID, status, requested/completed/expiry timestamps, storage key, download count.  
**Constraints:** storage key is private and time-limited; no content in ordinary database logs.  
**Deletion:** expire and securely remove artifact according to policy.

### Session / AuditEvent

**Purpose:** Session revocation and security accountability.  
**Fields:** hashed session token, user ID, expiry/revocation; audit actor/action/resource type/request ID/timestamp.  
**Constraints:** never store raw tokens or journal content.  
**Deletion:** revoke with account; retain minimal security events for documented duration.

## 3. Indexing and integrity

- Unique normalized email on User.
- Composite owner/time indexes for entry archive and timeline queries.
- Owner-scoped tag and EntryTag indexes.
- Full-text index over title/body with owner filtering.
- pgvector index chosen after measuring dataset and query distribution; always combine with owner/model compatibility filtering.
- Owner and endpoint indexes for nodes, edges, and manual connections.
- Job indexes on status, retry time, and idempotency key.
- Foreign keys with intentional cascade/restrict behavior; application checks for same-owner relationships.
- Avoid exposing internal database error details when constraints reject malformed relationships.

## 4. Ownership invariant

Every read path begins with the authenticated user scope. A relationship is valid only when all referenced sensitive records belong to that same user. Background jobs, exports, insights, and caches carry the owner scope and re-check it at execution/read time. This invariant must be enforced in code, tested across users, and preferably reinforced with database row-level security.

## 5. Mermaid ER diagram

```mermaid
erDiagram
    GRAPH_PROJECTION {
        uuid id PK
        uuid user_id FK
        string model_version
        string graph_policy_version
        uuid projection_generation_id UK
        string status
        datetime created_at
        datetime activated_at
        datetime retired_at
    }
    USER ||--|| USER_SETTINGS : has
    USER ||--o{ JOURNAL_ENTRY : owns
    USER ||--o{ TAG : owns
    JOURNAL_ENTRY ||--o{ ENTRY_TAG : classified_by
    TAG ||--o{ ENTRY_TAG : labels
    JOURNAL_ENTRY ||--o{ EMBEDDING : versions
    JOURNAL_ENTRY ||--|| GRAPH_NODE : projects
    GRAPH_PROJECTION ||--o{ GRAPH_EDGE : contains
    GRAPH_NODE ||--o{ GRAPH_EDGE : source
    GRAPH_NODE ||--o{ GRAPH_EDGE : target
    JOURNAL_ENTRY ||--o{ MANUAL_CONNECTION : source
    JOURNAL_ENTRY ||--o{ MANUAL_CONNECTION : target
    USER ||--o{ GRAPH_EDGE : owns
    USER ||--o{ MANUAL_CONNECTION : owns
    USER ||--o{ INSIGHT : receives
    USER ||--o{ PROCESSING_JOB : schedules
    USER ||--o{ EXPORT_REQUEST : requests
    USER ||--o{ SESSION : authenticates
    USER ||--o{ AUDIT_EVENT : generates
```

## 6. Derived-data lifecycle

Source entry save is transactional. Each active entry has exactly one stable `GraphNode`, uniquely identified by `(user_id, entry_id)`. Embeddings and graph projections are asynchronous and versioned. A projection's logical identity is `(user_id, model_version, graph_policy_version)`, while each build of that logical projection receives a distinct `projection_generation_id`; multiple historical generations may exist for the same logical key. Embedding changes and model or policy upgrades create a new staging generation rather than mutating individual current `GraphEdge` records. Existing current edges remain readable until the replacement is validated for ownership, endpoint compatibility, completeness, and edge uniqueness, then atomically activated. At most one projection generation may be current per user; successful activation retires the previous generation. Failed or interrupted staging builds never become current or partially modify the current generation. Retired generations may be deleted or retained according to policy. Model upgrades reuse the same stable nodes and never create duplicate `GraphNode` records. Ordinary graph reads return only the current projection, and rebuilds must be deterministic enough to compare results and safe to retry.

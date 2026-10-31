# User Journeys and Personas

## 1. Personas

### Maya — Daily journaler

Maya writes five to seven short entries each week. She values low friction, privacy, and a calm ritual. She wants to notice recurring subjects without being told what she feels. Her main success metric is “I can write and later find the thread.”

### Leon — Irregular archivist

Leon writes in bursts and may go months between entries. He remembers fragments and approximate dates rather than titles. He needs robust full-text search, date navigation, previews, export confidence, and a useful experience before the graph has enough data.

### Priya — Pattern explorer

Priya has a large archive and is interested in recurring topics, distant connections, and changes over time. She wants filters, explanations, stable layouts, and controls over thresholds. She will challenge unsupported claims and needs representative evidence for every insight.

## 2. Cross-cutting journey principles

- Always show whether content is saved, processing, failed, or unavailable.
- Preserve the user's place when moving between archive, timeline, graph, and entry.
- Explain generated results with visible source entries and methods.
- Provide keyboard equivalents for graph hover-only interactions.
- Avoid empty-state language that implies the user has a problem; explain what data is needed.
- Offer recovery paths for recoverable failures, such as failed saves, processing retries, and canceled non-destructive actions. Do not imply recovery or undo after the user confirms an MVP permanent deletion.

## 3. Registration and first login

**Goal:** Establish a secure account and a clear privacy expectation.

1. User opens the landing page and sees the purpose, privacy posture, and a clear registration action.
2. User submits email and password; validation is immediate but not revealing whether an email already exists.
3. Server creates the account, starts a secure session, and shows a concise privacy/data-control explanation.
4. User lands in an empty observatory with a primary “Write your first entry” action.

**Friction and mitigation:** Password requirements should be visible before submission; rate limits must not create confusing generic failures; email verification can be staged if deliverability is not ready, but the account must remain protected.

## 4. Creating the first entry

1. User selects “New entry.”
2. Editor opens with title optional, body focused, and date set to now with an explicit editable date control.
3. User writes and sees a non-blocking save state.
4. Server persists the entry and queues embedding work.
5. User sees the entry in the archive immediately, with semantic processing status.

**Friction and mitigation:** Do not block saving on model inference. Warn before leaving only when local changes are unsaved. On network failure, retain a local draft and provide retry/discard actions without silently overwriting a newer server revision.

## 5. Generating and exploring the first constellation

1. User opens Constellation from the navigation.
2. With one entry, the UI explains that connections need more writing and offers a return-to-journal action.
3. After additional entries process, the graph shows nodes and any qualifying edges.
4. User selects a node; a preview panel shows title/date, related entries, score, and explanation.
5. User opens the full entry or adjusts filters/threshold.

**Friction and mitigation:** A graph with no edges is not an error. Avoid animation that moves nodes while a user is reading. Explain that similarity is semantic proximity, not emotional analysis. For large archives, default to a filtered or neighborhood view.

## 6. Searching the archive

1. User enters a phrase or selects a date/tag filter.
2. Results show title, date, matched snippet, and processing status.
3. User opens an entry and can return with search state preserved.
4. User optionally switches to semantic search and receives a clear method label.

**Friction and mitigation:** Empty results should suggest changing filters, not invent content. Search snippets must be escaped and must never cross user scope. Semantic search should disclose that related wording may match.

## 7. Editing an entry

1. User opens an existing entry and edits title/body/tags.
2. The client sends the last known revision.
3. If unchanged, the server saves a new revision and queues re-embedding.
4. If changed elsewhere, the user sees a conflict with server/local versions and chooses which content to keep or manually merge.

**Friction and mitigation:** Avoid silent last-write-wins. Keep the prior saved version until the new save succeeds. Show that graph relationships may temporarily be based on the previous revision.

## 8. Deleting an entry

1. User chooses delete from the entry or archive.
2. Dialog identifies the entry and explains that semantic edges, manual connections, and derived insights may change.
3. User confirms; server authorizes by ownership and performs an explicit permanent deletion.
4. UI removes the entry immediately and shows cleanup status if dependent deletion continues asynchronously; MVP provides no undo or recoverable-trash state.

**Friction and mitigation:** Do not make deletion easy to trigger accidentally. The confirmation must state that MVP deletion is irreversible. A failed cleanup is an operational failure that must be visible and retryable, but it does not restore or expose the deleted entry; source content must be inaccessible immediately while dependent cleanup continues.

## 9. Exporting journal data

1. User opens Settings → Data controls and requests an export.
2. Server authenticates/re-authenticates, creates a scoped export job, and reports status.
3. User downloads a time-limited, single-use link or receives an in-app download.
4. Export includes original entries, tags, dates, manual connections, and documented derived metadata; embeddings may be included only if the product explicitly supports and explains that format.

**Friction and mitigation:** Do not place export content in ordinary logs or permanent public URLs. Expire files and record the request without recording the journal body.

## 10. Deleting an account

1. User opens account deletion, reads the consequences and retention window.
2. User re-authenticates and types a confirmation phrase.
3. Server disables access, invalidates sessions, and queues deletion of all account-owned primary and derived data, including graph projection records, generation metadata, nodes, edges, embeddings, manual connections, and related derived data.
4. UI shows completion or a clearly stated pending deletion status.

**Friction and mitigation:** Explain backups and legal/operational retention. Ensure account-deletion jobs are idempotent and do not leave searchable embeddings, graph data, exports, or insight caches. Individual entry deletion cleans up affected records without removing projection generations that still serve other entries.

## 11. Usability and accessibility checklist

- Mobile editor supports comfortable typing and does not hide save status.
- Graph controls have buttons and keyboard commands in addition to pointer gestures.
- Focus moves predictably into dialogs and back to the triggering control.
- Color is not the sole distinction between semantic and manual connections.
- Reduced-motion mode disables force simulation and decorative transitions.
- Date, tag, and threshold filters have accessible names and reset controls.
- Errors identify the action, consequence, and recovery path when recovery is possible; destructive confirmation errors instead explain that permanent deletion must be retried or escalated, not undone.
- User can complete all critical journeys without drag, hover, or precise pointer input.

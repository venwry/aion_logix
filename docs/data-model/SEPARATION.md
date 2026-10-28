# Foundation and storytelling separation — version 0.3.0

The author approved separating fictional-world content from authorization and editorial history, merging pending confirmation/speculation into Unauthorized, and saving authorizations directly through an authenticated service.

## Foundation

The 11 foundation datasets contain 439 records. Their envelopes contain just the named record list. Existing IDs, story relationships, date precision, agreement states, ownership and occurrence/completion assertions are retained.

Removed fields: `status`, `confirmation`, `source_refs`, and date `basis`/`qualifier` annotations. Dataset metadata is stored in `data_storytelling/manifest.json`. Money basis is retained because actual expenditure versus a commitment describes a story quantity, not its source reliability. Historical prose remains available for further editorial revision; this separation does not silently rewrite narrative statements.

## Storytelling

| File | Purpose |
| --- | --- |
| `authorization.json` | Current authorization state and exact foundation-content hash for each record |
| `authorization_decision.json` | New decisions, author label, UTC time, target snapshots and hashes; approved change payload for revisions |
| `change.json` | Active before/after proposals; authorization is separate from the fictional-world data |
| `record_context.json` | Complete pre-separation record snapshots, preserving original sources, review status, confirmation evidence and editorial date annotations |
| `manifest.json` | Schema version 0.3.0, foundation dataset list and former dataset metadata |
| `source.json` | Existing source records, moved intact |
| `migration_map.json` | Existing migration mappings, moved intact |
| `reconciliation_issue.json` | Existing editorial questions and resolutions, moved intact |
| `review_decision.json` | Historical decisions under the old model, moved intact |

All 58 previously confirmed foundation records retain authorization after recomputing their hashes for the clean content. The other 381 records are Unauthorized. Original content and old hashes are preserved in `record_context`, historical decision datasets and archived logs. Historical hashes apply to their original versions, not the cleaned foundation JSON.

## Saving

The backend reads the latest GitHub branch, verifies the client's record/proposal hash, checks all before snapshots and validates the complete proposed graph. It updates foundation content only for a content change; plain authorization changes only storytelling JSON. Every save records a new decision. One Git tree and commit contain all affected files; a non-forced ref update protects against concurrent branch changes. Repeated successful requests are idempotent.

Approval of a group applies and authorizes every explicitly listed resulting record. The application labels successful saves only after GitHub accepts the ref update. The browser never receives the GitHub token. Changes to authorized content made outside this service become Unauthorized automatically because their hashes differ.

Schema proposals require a separately reviewed schema deployment; arbitrary schema mutation is not exposed by the authorization API. The old log-writing CLI is retired so it cannot reinsert status or provenance into foundation records.

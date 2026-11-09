# Storytelling data — current file reference

Contract **0.13.0**. `data_storytelling/` contains eight active JSON files at its root. Consult those files and the application for live counts and review state. Supporting evidence can be stored in subdirectories; it is not another foundation collection or authorization target.

| File | Current responsibility |
| --- | --- |
| [authorization.json](../../data_storytelling/authorization.json) | Whole-record state and exact content hashes. |
| [authorization_decision.json](../../data_storytelling/authorization_decision.json) | Immutable before/after decisions and reviewed proposal snapshots. |
| [change.json](../../data_storytelling/change.json) | Current concrete proposals, discussion entries and transport metadata. |
| [manifest.json](../../data_storytelling/manifest.json) | Schema version, foundation types and filename exceptions. |
| [annotation.json](../../data_storytelling/annotation.json) | Append-only revisions of record annotations. |
| [change_review.json](../../data_storytelling/change_review.json) | Append-only feedback on exact proposal revisions. |
| [source.json](../../data_storytelling/source.json) | Source bibliography and evidence catalogue. |
| [reconciliation_issue.json](../../data_storytelling/reconciliation_issue.json) | Inherited editorial questions with current target reconciliation; the live Changes confirm queue holds actionable proposals and discussions. |

## Authorization and decisions

Authorization entries contain `id`, `record_id`, `state` (`authorized` or `unauthorized`), `content_sha256` and optional `decision_id`. The hash covers the whole record with recursively sorted object keys and preserved array order. Missing or mismatching authorization is Pending authorization. References never authorize their targets. Older entries can lack a direct-save decision ID; preserved evidence remains historical.

Decisions contain `id`, `action`, reviewer `actor`, `decided_at` and `target[]`. Actions include `authorize_record`, `authorize_records`, `approve_change` and `remove_change`. Targets preserve whole before/after snapshots and hashes; null represents creation/removal. Proposal approvals retain `change_id`, `proposal_sha256` and the complete proposal. Removed records lose their current authorization entry only in the approved transaction; their historical decisions remain unchanged.

A `remove_change` decision requires the complete proposal, `change_id` and `proposal_sha256`, with an empty `target` array. It audits withdrawal of a proposal, never authorization or removal of foundation records. Other actions require at least one target. Withdrawal preserves annotations and review history and never satisfies an approval prerequisite.

The review actor is the application reviewer, not a fictional-world actor. Whole-record authorization includes nested values and agreement clauses. Changing one nested value changes the reviewed content hash.

## Proposed changes

`change.json` has `change[]` and `metadata`. A proposal contains `id`, `category`, `title`, `reason`, `elements[]`, and optional `annotation_ids[]` and `depends_on_change_ids[]`. Each element identifies its type/ID and complete before/after snapshots. The server checks the current before snapshot and proposal hash, applies the selected set in memory, validates the final graph, and saves one atomic Git commit. Overlapping whole-record edits are rejected. Additions and removals can share a proposal with all inseparable reference changes.

`POST /api/authorize` accepts `save_review` with `approvals[]`, `removals[]` (both `{change_id, proposal_sha256}`) and `feedback[]` (the same entries as `save_review_feedback`). One proposal can have only one decision in the batch. All checks finish before a single persistence operation; identical retries are idempotent. Removal checks the exact proposal revision even when its foundation before-snapshot is stale. Surviving dependents prevent prerequisite withdrawal.

The API also accepts `approve_changes` with `{change_id, proposal_sha256}` selections; the legacy singular action remains supported. Prerequisites must be selected or previously approved. Retry protection uses the exact proposal hash. Schema proposals require separate deployment. A revised proposal has a new hash and needs fresh review; old feedback does not silently reject or approve that revision.

Metadata and supporting evidence describe the editorial workflow and do not become story facts. Concrete proposal envelopes continue to use runtime checks and proposal tests, alongside schema validation of their resulting foundation records. Discussion records have a dedicated schema and runtime checks; the complete mixed transport envelope still has no standalone JSON Schema.

### Problem-only discussion entries

The `review-transport-2` metadata version permits `category: discussion`. These entries require `id`, `title`, `reason`, empty `elements`, `affected_record_ids` and nonempty `findings`. Each finding has a `description` and optional `record_id` and `path`; a finding’s record must be in the affected-record list, and listed IDs must exist in the current foundation. Model-wide questions may have no affected IDs. See [discussion.schema.json](../../schemas/storytelling/discussion.schema.json).

Discussion entries cannot be authorized, including through direct API calls. They can receive the same hash-bound feedback or be removed through `save_review`. Removing one saves a `remove_change` decision with no foundation targets. Converting a discussion into a concrete proposal preserves its ID and earlier feedback but changes its hash; remove discussion-only fields and supply complete review elements. The editorial transport version is independent of the foundation schema contract.

## Manifest and paths

The manifest record declares `schema_version`, `foundation_datasets[]` and `foundation_files` exceptions. Registry and manifest must match. `external_product` has a singular envelope and schema name but the filename `external_products.json`. Consumers use `code/model-contract.js`, not ad hoc filename concatenation. Updating a manifest alone does not install runtime/schema support.

## Sources, issues and supporting evidence

Sources retain their inherited bibliography format. A source citation or an old status is not current authorization. Source paths/pointers refer to the pinned source repository/snapshot, not necessarily a current file in this repository. Foundation schemas do not accept embedded provenance or old confirmation fields.

Open issues record editorial questions and affected IDs. Later migrations can retire those IDs; verify an issue's current applicability rather than treating a historical backlog as canonical. Archiving a report does not resolve an issue or authorize its suggested answer.

`review_evidence/` holds machine-readable audit material for current work, such as proposal hashes, reference dispositions, temporary subject exceptions and validation results. It is read by specific review tools, not merged into the foundation registry. The live pending queue remains authoritative. Completed/superseded narrative reports belong in [docs/archived](../archived/README.md); older model/source evidence remains in the [legacy archive](../../archived_no_longer_valid/README.md).

## Annotations and refinement feedback

`annotation.json` contains revisions with `id`, `record_id`, `content_sha256`, `text`, `state` (`open`, `resolved`, `dismissed`), nullable `supersedes_id`, reviewer `actor` and `created_at`. All revisions include `change_ids`; a resolving revision records the responsible proposal ID in that array. A revision identifies the current tip for that record; old text remains immutable. Deleted foundation records do not erase annotation history.

`change_review.json` contains revisions with `id`, `change_id`, `proposal_sha256`, `text`, `state: needs_refinement`, nullable `supersedes_id`, `actor` and `created_at`. Chains are scoped to the change ID and exact proposal hash. This deployment uses the shared author identity, not per-user attribution.

`POST /api/feedback` accepts `save_annotations` or `save_review_feedback` with `entries[]`. Each entry carries a client-generated immutable revision ID and expected `supersedes_id`. Text must be nonempty and at most 20,000 characters; the request body limit is 256,000 bytes. Entries save atomically and retries are idempotent. Feedback changes neither foundation content nor authorization.

Proposals link exact source annotation revisions through `annotation_ids`. Approval resolves a linked annotation only if that revision is still current and open. A newer edit stays open. Merely preparing a proposal never resolves it. See [schemas/storytelling](../../schemas/storytelling/) and the [application guide](../APPLICATION_GUIDE.md) for validation and UI behavior.

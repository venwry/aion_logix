# Author review round 1

Open `../changes-confirm.html` through the repository HTTP server. This round contains 28 story proposals and four schema proposals. Canonical datasets and schemas are unchanged. Before/after views hide `source_refs`; exports retain complete snapshots so subsequent import can detect changes.

The proposal manifest is an application review artifact, not an adopted domain dataset or extension to the phase-one model. Its `change` list uses stable IDs, pending status and a metadata envelope. No proposal or checkbox is itself evidence that an edit has already been applied.

## Two independent decisions

- **Data browser:** checking “I agree to set this record to confirmed” approves the exact current record as baseline story content. An existing planned event remains a confirmed plan; checking the box does not change occurrence or completion. Confirming speculation adopts that content as baseline. Download the confirmation log and send it back in chat.
- **Changes confirm:** checking a proposal authorizes its listed edits. A grouped proposal approves all its elements together. A schema checkbox authorizes only that structural extension. These approvals do not also confirm the resulting story records. Download the approval log and send it back in chat.

Selections are saved locally and can be revoked before exporting by clearing the checkbox. The latest export is a snapshot of the current selection, not an incremental merge with earlier exports. Exported files cannot be recalled: when returning multiple files, identify the latest one and any revoked decisions. Files are not automatically sent anywhere. HTTPS or localhost is required for the browser's SHA-256 API.

## Applying a returned log

1. Check the format version, repository, decision action and timestamp. Treat it as a user-submitted decision artifact, not a cryptographic signature or authenticated identity.
2. Recompute the stated SHA-256 using recursively sorted object keys; array order is preserved. Record confirmation hashes include the entire original record. Proposal hashes include the complete proposal. These transport hashes differ from the model validator's confirmation hash, which excludes `confirmation`.
3. Compare every record snapshot or schema fragment with the current repository. Reject stale approvals, unexpected targets, unsupported actions and edited payloads; request renewed review of affected content. Do not apply the embedded JSON blindly.
4. Apply each approved group atomically. A record confirmation and an edit approval for the same record refer to different content: do not carry the old record's confirmation to the revised content automatically. Resolve that overlap with the author.
5. For schema approvals, install only the individually approved definitions, version the affected schema contract and regenerate the field reference. Validate the whole model before migrating corresponding data. Samples in schema proposals are illustrative; they are not separately approved story records.
6. For record confirmations, create author-decision evidence and `review_decision` records using the existing model, then calculate the validator's hash for the final confirmed record. Check existing confirmation requirements before writing.
7. Record resolved editorial questions in review records, reconcile affected issue records, validate references and schemas, and reassess speculation whenever baseline content changes. A confirmation log does not approve a forecast reassessment result.

The pages remove local selections when content changes. Story proposals are blocked if any before snapshot differs from the current record. New records require their IDs to remain absent. Schema proposals verify the current field definition before allowing approval.

## Schema assessment

The following require **no extension**: narrative rewrites; existing status/occurrence/completion values; event periods; audience, objective and message corrections; new events; existing structured equity; programme membership; current relationship and clause fields.

Four independent extensions are proposed, without modifying `schemas/`:

1. `campaign.presentation`: one owned presentation with ordered stage value objects, durations and actor references.
2. `campaign.booth`: owned booth-area value objects with name, description and call to action.
3. `assumption.equipment`: owned equipment value objects and component lists for the secret-facility premise.
4. `process.step[].event_id`: an explicit typed reference to an independently reviewable milestone.

Each new object rejects additional properties. Parent-owned values inherit the parent's status; actors and events retain independent identities and review status. Optional fields preserve existing records. Adopting an extension also requires reference-validation and documentation updates. No catch-all object or unconstrained JSON field is proposed.

## Remaining work after this round

The current proposals resolve the key BPI contradiction, date windows, several completed-process narratives, optional certification wording, Autodesk delivery language, selected actor/agreement descriptions and campaign objectives. They do not rewrite all 427 story records in a single batch.

Full campaign-stage/booth reconstruction and equipment extraction follow only after their schema extensions are approved. Further review includes duplicated policy identity and incoming references, ownership of the three companies, Gary's equity tranches, specific SMC chip scope, Autodesk founder signatories, and Cambridge. Editorial instructions displaced by approved rewrites should be retained as review history rather than reinserted into story prose.

Run `node --test tests/review/proposals.test.js` for snapshot and schema checks, and `CHROMIUM_PATH=/usr/bin/chromium npx playwright test tests/application.spec.cjs tests/review.spec.cjs` for browser interaction and export tests.

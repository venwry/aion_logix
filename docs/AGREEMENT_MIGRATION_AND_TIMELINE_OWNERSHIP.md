# Agreement migration and timeline ownership review

30 October 2026. Baseline: `533d0ff94614977c6f81e85f8c9cdd20d2a29f8f`. Contract: **0.5.0**.

## Applied structural migration

- All **109 clauses** are embedded in their **20 owning agreements** as `clauses[]`. Clause IDs, order and all substantive values are retained; only the redundant owning `agreement_id` is removed from each clause.
- The standalone clause dataset/schema is retired. Its data, schema and current authorization entries are preserved under `archived_no_longer_valid/model_0.4.0_agreement_migration/`. Relevant pre-migration agreement/event/process/common schemas are also retained there. This directory is additional migration evidence; it does not alter the earlier archive inventory.
- There are **559 whole foundation records in 12 datasets**. Embedded clause IDs support traceability and `supersedes_clause_id`; they are not generic foundation reference targets or independently authorized records.
- Event/process `agreement_ids` is replaced by optional `agreement_id: string`. Empty lists become an omitted field. Nonempty lists retain their first entry as the direct agreement. Additional agreements remain contextual references in `subject_ids`; no agreement or term is deleted.
- The timeline shows a small Agreement button immediately before the start date. It opens the direct agreement, including its clauses. Campaign/process combined boxes use the process association. Older loaded data using `agreement_ids` uses its first entry.
- **98 modified whole records** are pending renewed authorization. Current hashes are updated with state `unauthorized`; historical decisions are untouched. The migration does not fabricate author approval. Authorizing an agreement now covers all of its nested clauses.

### Multiple-agreement conversions

| Record | Direct agreement | Retained contextual agreements |
| --- | --- | --- |
| `event.logix_share_transfer_1978` | `agreement.logix_share_transfer_1978` | `agreement.aionix` |
| `process.open_compatibility` | `agreement.dri_cpm` | `agreement.apple_cooperation` |
| `process.clone_partnerships` | `agreement.clone_agreement_northstar` | `agreement.clone_agreement_vector`, `agreement.clone_agreement_sks`, `agreement.clone_agreement_goupil`, `agreement.clone_agreement_eina` |
| `process.computer_business_incorporation` | `agreement.dri_founding` | `agreement.dri_cpm`, `agreement.bpi_cooperation` |

The first-entry rule preserves existing list order without asserting that other contracts ceased to exist. In particular, Northstar remains the first direct association for the umbrella clone process; this does not make its agreement govern other manufacturers.

## Proposed single-parent membership

The following **eight events** have occurrences assigned to different parent processes by the current timeline tree. Combined campaign/process boxes count as one parent. No subprocess has multiple displayed parents or multiple explicit parent/step-owner references. Physical descendant containment through a nested subprocess is not a duplicate occurrence.

| Event | Current parent processes | Proposed sole parent | Proposed change |
| --- | --- | --- | --- |
| `event.bpi_pilot` | `process.bpi_qualification`; `process.ncc1978_campaign` | `process.bpi_qualification` | Keep the pilot with qualification. Replace the campaign start event anchor with the existing event date/precision. |
| `event.aurelia_campaign_advert` | `process.ncc1978_campaign`; `process.aurelia_campaign_preparation` | `process.aurelia_campaign_preparation` | Keep it as preparation start. Remove the campaign step's event link; retain its description. |
| `event.aurelia_launch` | `process.ncc1978_campaign`; `process.ncc78_sessions_media` | `process.ncc1978_campaign` | Keep the platform launch in the main campaign. Use the same calendar start for sessions/media. |
| `event.team_launch` | `process.comdex1981_campaign`; `process.team_development` | `process.team_development` | Keep the development end milestone; remove the campaign step's event link. |
| `event.autodesk_comdex` | `process.comdex1982_campaign`; `process.autodesk_development` | `process.autodesk_development` | Keep the development end milestone; remove the campaign step's event link. |
| `event.ncc83_athena_premiere` | `process.athena_1983`; `process.ncc1983_campaign` | `process.ncc1983_campaign` | Remove links from `process.athena_1983` and `process.athena_integration`, retaining descriptions. The latter is an additional stored candidate currently hidden by parent selection. |
| `event.team_engineering` | `process.team_development`; `process.comdex1981_campaign` | `process.team_development` | Keep the engineering start with development. Use the same calendar campaign start. |
| `event.frankfurt_move` | `process.birmingham_estate`; `process.frankfurt_stay` | `process.frankfurt_stay` | Keep arrival as Frankfurt's start. Use the same calendar end for Birmingham. |

**Unknown-date caveat:** `process.athena_1983` is undated. Its event is assigned to that parent in the tree but displayed separately in the dated layout; it still creates an extra event occurrence. The proposal removes that ambiguity and the fallback integration candidate.

These proposals intentionally replace some shared event anchors with literal dates. All dates and precision are preserved. Boundary precedence still applies within the chosen owning process; a calendar boundary is used in the non-owning process to prevent duplicate membership. Inputs are not used to disguise simultaneous events as earlier causes. No new causal claims are introduced.

### Seven independent approvals

Each proposal changes exactly one process record and can be authorized independently through Changes confirm:

1. `change.single_parent_process_ncc1978_campaign` — BPI pilot start and Aurelia advert step.
2. `change.single_parent_process_ncc78_sessions_media` — Aurelia launch start.
3. `change.single_parent_process_comdex1981_campaign` — Team engineering start and Team launch step.
4. `change.single_parent_process_comdex1982_campaign` — Autodesk presentation step.
5. `change.single_parent_process_athena_integration` — hidden duplicate Athena premiere step.
6. `change.single_parent_process_athena_1983` — duplicate Athena premiere step.
7. `change.single_parent_process_birmingham_estate` — Frankfurt move end.

The two Athena proposals should both be accepted to remove all alternative parent candidates. Each is independently valid; approving only one may leave a duplicate under the other process.

`event.software32` and `event.network_launch` already serve as both Start and End in one parent. `event.ncc83_athena_premiere` will retain those two roles in its sole parent after approval. These are two role markers for one parent, not multiple-parent membership, and are unchanged.

## Deployment

Deploy the updated backend and static application together with contract 0.5.0. The old backend expects the retired clause dataset and cannot read the migrated foundation. On Render, wait for this commit's deployment to become Live, or deploy the latest commit manually; then reconnect and refresh the application. Schema migration is published directly as requested; timeline ownership changes remain pending in Changes confirm.

## Verification

- Foundation schemas and external authorization validate for all 559 whole records.
- All 109 embedded clauses match their previous substantive content and owning agreement exactly.
- Tests cover singular agreement fields, invalid references, duplicate clause IDs, nested equity constraints, clause supersession, and whole-agreement authorization.
- All 34 browser tests pass after updating navigation tests for repeated actor links within embedded clauses. Build succeeds.
- Seven ownership proposals validate independently and in one batch; the complete batch removes all cross-parent event occurrences without altering process dates.
- Three existing broad-suite failures remain: the historical phase-1B migration tests expect an earlier identity inventory and fingerprints, and the partial-date test mutates an event now used as Birmingham's start. These predate this migration; current-data validation and the new migration tests pass.

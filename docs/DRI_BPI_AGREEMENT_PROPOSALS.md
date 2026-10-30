# DRI and BPI agreement changes — approval pack

Baseline: `ad6b642ce009e1e74460021d66fe54ee15827ee5`. These changes are proposed, not applied to foundation data.

## DRI founding roles

Add three separate responsibility clauses to `agreement.dri_founding`, preserving Gary Kildall’s engineering role, Dorothy McEwen’s operations role, and Adam’s capital/strategy/OEM role. Each clause keeps its establishing event reference. Retire the three corresponding `actor_relationship` records after the agreement update. Existing equity percentages, the joint 60% allocation and capital commitments are unchanged.

## Agreement reference cleanup

Twenty-two events currently have agreement references in top-level `subject_ids`. All already have an associated `agreement_id`; the redundant subject references are removed. No current process needs this cleanup.

The share-transfer event also references `agreement.aionix`. Its direct agreement remains `agreement.logix_share_transfer_1978`; the earlier AIONix obligation is retained through `inputs[].event_id: event.aionix_agreement`. This avoids selecting a second direct agreement or losing the prior promise.

## CP/M collaboration

`agreement.dri_cpm` becomes an explicit Logix–DRI development agreement covering:

- DRI’s full ownership of the resulting CP/M version and non-exclusive availability to any other vendor.
- Logix platform knowledge/integration and DRI operating-system development responsibilities.
- TUI pseudo-window interaction in text mode.
- Plug and Execute support for smart devices/cards using FlexiBUS.
- XIP cartridges.
- Names for CP/M User Numbers, providing directory-like naming without inventing a hierarchical filesystem.

The existing DRI reuse-right clause is retained. No new fees, deadlines or hardware-ownership transfers are introduced.

`event.dri_cpm` retains its current **1 October 1976** date. Its founding-event subject becomes a descriptive causal input; CP/M Aurelia, the TUI standard and FlexiBUS become separately described outcomes. These outcomes record agreed development deliverables and integration scope, not completed software delivery on signing day. `event.dri_founding` loses the requested CP/M product and C API subjects.

## Accepted BPI agreement

Retain the stable IDs `event.bpi_offer` and `agreement.bpi_offer` to avoid an unnecessary identity migration, but change their titles and wording to an accepted, executed agreement. Existing clause IDs are likewise retained even where their names contain “offer”.

- Adam’s $150,000 subscription purchases an agreed 33% fully diluted interest; the agreement is accepted by BPI rather than left as a proposal.
- AION Software is an obligated party providing knowledge and resources for refactoring existing BPI code into C with a competitive TUI.
- Further investment and engineering support future-system/platform ports. Amounts, allocation among contributors, platforms and schedules are unspecified.
- Following the agreed redevelopment and subsequent porting work, BPI may buy back Adam’s shares. No price, valuation formula, exercise date or payment schedule is invented. The right is not an automatic transfer or compulsory repurchase.
- BPI retains its application ownership, brand and operating independence. Agreement execution does not invent a separate bank-transfer date.

Align the later BPI operational agreement/event, Aurelia Foundation’s outcome and milestone label, and the NCC 1978 presentation with the accepted investment. Remove their contradictory claims that it remained unaccepted or uncompleted.

## Approval and validation

There are **31 proposals**, each affecting exactly one foundation record. Review independently; selecting the complete pack applies the consistent result in one commit. If approving separately, update the DRI founding agreement before deleting its three relationship records. Each deletion declares that dependency; the application does not automatically select dependencies.

All individual proposals and the full batch pass foundation and authorization validation. The full result has no agreement IDs in event/process top-level subjects, no dangling relationship references, and no remaining obsolete unaccepted-investment claims. Historical authorization decisions and foundation records remain unchanged until approval.

## Proposal inventory

| Record | Operation |
| --- | --- |
| `event.dri_founding` | Update |
| `event.dri_cpm` | Update |
| `event.bpi_offer` | Update |
| `event.bpi_cooperation` | Update |
| `event.mpi` | Update |
| `event.retail` | Update |
| `event.bpi_training` | Update |
| `event.smc_agreement` | Update |
| `event.aionix_agreement` | Update |
| `event.tandy_agreement` | Update |
| `event.apple_peachtree` | Update |
| `event.apple_cooperation` | Update |
| `event.apple_extensions` | Update |
| `event.clone_agreement_northstar` | Update |
| `event.clone_agreement_vector` | Update |
| `event.clone_agreement_sks` | Update |
| `event.clone_agreement_goupil` | Update |
| `event.clone_agreement_eina` | Update |
| `event.sgs_transfer_agreement` | Update |
| `event.autodesk_agreement` | Update |
| `event.autodesk_incorporation` | Update |
| `event.logix_share_transfer_1978` | Update |
| `agreement.dri_founding` | Update |
| `actor_relationship.kildall_dri` | Delete after clause consolidation |
| `actor_relationship.dorothy_dri` | Delete after clause consolidation |
| `actor_relationship.adam_dri` | Delete after clause consolidation |
| `agreement.dri_cpm` | Update |
| `agreement.bpi_offer` | Update |
| `agreement.bpi_cooperation` | Update |
| `process.aurelia_foundation` | Update |
| `campaign.ncc1978` | Update |

# Agreement associations through child events

Baseline: `438492dc61eea5f20b64eec8ddf0aa8794523eb5`, 30 October 2026. These are proposals, not applied foundation changes.

## Proposed convention

For a process coordinating several agreements, omit its direct `agreement_id` and put each association on the specific signing/founding/cooperation event using that event's `agreement_id`. Reuse an existing event at the process start, in its steps, or at its end. Remove redundant agreement references from the umbrella process once the event links provide the connection. Preserve substantive descriptions and outcomes.

If no corresponding event exists, create one dedicated to the specific agreement, with its parties, supported date and precision, meaningful inputs and outcome, and the singular `agreement_id`. Add it as a numbered process step unless it is the known start/end boundary. If it precedes the process and enables it, use an input instead of fabricating an interior step. Do not invent a signing date: events require a calendar date under the current schema. New events and process updates must be separate single-record proposals; approve the event first or select both in one atomic batch.

An agreement already supported by a signing event must not acquire another artificial signing event simply to satisfy display ownership. Preserve the single-parent convention or explicitly review a reparenting change.

## Existing matches

| Process | Agreement | Existing event | Proposed placement |
| --- | --- | --- | --- |
| `process.computer_business_incorporation` | `agreement.dri_founding` | `event.dri_founding` | Existing start |
| `process.computer_business_incorporation` | `agreement.dri_cpm` | `event.dri_cpm` | Existing step 3 |
| `process.computer_business_incorporation` | `agreement.bpi_cooperation` | `event.bpi_cooperation` | Existing step 4 |
| `process.clone_partnerships` | `agreement.clone_agreement_northstar` | `event.clone_agreement_northstar` | Add step 1; 1981-03-02 |
| `process.clone_partnerships` | `agreement.clone_agreement_vector` | `event.clone_agreement_vector` | Add step 2; 1981-03-03 |
| `process.clone_partnerships` | `agreement.clone_agreement_sks` | `event.clone_agreement_sks` | Add step 3; 1981-03-04 |
| `process.clone_partnerships` | `agreement.clone_agreement_goupil` | `event.clone_agreement_goupil` | Add step 4; 1981-03-05 |
| `process.clone_partnerships` | `agreement.clone_agreement_eina` | `event.clone_agreement_eina` | Add step 5; 1981-03-06 |
| `process.open_compatibility` | `agreement.dri_cpm` | `event.dri_cpm` | Context reference; retain incorporation as parent |
| `process.open_compatibility` | `agreement.apple_cooperation` | `event.apple_cooperation` | Context reference; retain Apple compatibility as parent |

Every agreement association already has a corresponding event carrying the correct singular agreement_id. **No new signing event is needed.** The ten associations above correspond to nine distinct events because the CP/M agreement is shared by two umbrella processes.

## Ready for Changes confirm

- `change.child_agreements_process_computer_business_incorporation`: remove its direct agreement and redundant agreement subject/outcome references; preserve descriptions and all existing child events.
- `change.child_agreements_process_clone_partnerships`: remove the umbrella agreement references and add the five existing signing events as numbered steps. Their dates are retained. Both process boundaries remain unknown, so the process remains in the undated section until its duration is supplied.

Each proposal changes exactly one process and is independently valid. Neither overlaps the seven pending single-parent cleanup proposals. The full ten-proposal batch also validates.

- `change.child_agreements_process_open_compatibility`: replace the direct/contextual agreement references with `subject_ids` references to the existing CP/M and Apple cooperation events, preserving their current parents.

## Open compatibility decision

The author selected retaining the current parents and referencing the events as context. Open compatibility therefore uses `subject_ids: ["technology.flexibus", "technology.logix_c_api", "event.dri_cpm", "event.apple_cooperation"]` and omits its direct `agreement_id`. It introduces neither duplicate child membership nor a claim that the events precede or cause the undated process. This is an explicit exception to the child-only pattern.

The incorporation event membership and Apple's existing process association stay unchanged. Unknown process duration remains unknown.

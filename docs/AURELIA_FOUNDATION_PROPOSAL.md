# Aurelia Foundation and Partnerships — proposed replacement

Baseline: `09a807654db0c4f3dad82ea920f985a2e831a1b9`. Foundation changes await Changes confirm approval.

Replace `process.bpi_qualification` with `process.aurelia_foundation`, titled **Aurelia Foundation and Partnerships**. Start: `event.dri_cpm` (1 September 1976). End: retain **June 1978**, month precision. No exact completion day or new end event is inferred.

The new process contains:

- Start: the existing Aurelia CP/M implementation agreement event.
- Steps: BPI offer (15 February 1977), MPI agreement (1 September 1977), ComputerLand agreement (5 February 1978), BPI pilot (20 March 1978), Academy establishment (25 March 1978), all three existing descriptive BPI qualification actions, BPI qualification milestone (15 May 1978), and BPI application launch (5 June 1978).
- Inputs: the preceding DRI founding partnership and establishment of the Logix/AION companies.
- Outcomes: the product's operating-system, printer, retail and training partnership foundation, plus BPI pilot/qualification/launch work. BPI remains independent; its proposed equity investment is not described as accepted, and measured qualification results are not invented.
- The existing `related_process_ids` link to `process.bpi_launch` is preserved. Signing events retain their own agreement associations; the umbrella process does not select one primary agreement.

## Six independently reviewable proposals

| Proposal suffix | Record | Change |
| --- | --- | --- |
| `create` | `process.aurelia_foundation` | Create the expanded replacement process. |
| `incorporation` | `process.computer_business_incorporation` | Remove the CP/M step, now the new process's start, and renumber remaining steps. |
| `campaign` | `process.ncc1978_campaign` | Remove the duplicate BPI qualification event link while retaining the descriptive campaign step. |
| `bpi_pilot` | `event.bpi_pilot` | Remove the legacy old-process membership; the new process owns the event via its steps. |
| `bpi_launch` | `event.bpi_launch` | Remove the legacy old-process membership; the new process owns the event via its steps. |
| `retire` | `process.bpi_qualification` | Delete the replaced record after its steps and references have been migrated. |

Proposal IDs begin with `change.aurelia_foundation_`. Each proposal contains exactly one record. The approval API does not allow changing a record's stable ID in place, so the requested rename is represented as creation plus retirement and reference updates.

**Recommended:** review the six records separately, then select all six and use Authorize and save for one atomic commit. If approving sequentially, create first, apply the four membership edits next, and retire last. Intermediate states may temporarily show both processes; deletion is rejected while the old event references remain. `depends_on` documents the order; the application does not automatically select dependencies.

The open editorial issue `reconciliation_issue.bpi_qualification_interval` now references the three enduring BPI events instead of the ID scheduled for retirement. Its description preserves the earlier planning-window uncertainty and flags the inherited month-precision end for review. Historical approval decisions remain unchanged.

Validation confirms sequential and batch approvals produce identical foundation data, preserve all former BPI step descriptions and the end boundary, leave no references to the retired process, and give all eight milestone events exactly one parent: `process.aurelia_foundation`.

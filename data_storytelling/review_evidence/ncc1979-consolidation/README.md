# NCC 1979 campaign consolidation

Baseline: main `97a5253`, fetched after approval of the AION C 2.0 and video-ROM proposals. One atomic Changes confirm proposal revises the development process and campaign and removes the redundant execution process. Live foundation and authorization records remain unchanged until approval.

## Scope and ownership

- Set `process.ncc1979_development.period.start` to **1979-01-09**, updating its description accordingly. Preserve its end date, technical work, inputs and outcomes.
- Remove `process.ncc1979_campaign`. Its inputs and outcomes are deliberately discarded, as instructed; they are not relocated into event outcomes or campaign content.
- Replace the parent’s execution-process step with its already-existing direct campaign ownership. Remove the redundant campaign subject reference.
- Move five step-owned events and both boundary-owned events directly into `campaign.ncc1979.marketing_steps[].reference_id`: briefings, profiles, workshop, NCC launch, roadshows, adoption review and closing review. Their records and dates remain unchanged. The campaign keeps its existing February 1979–January 1980 period and inherited category.
- All six product launch links remain valid through the campaign’s direct ownership of `event.ncc79_campaign`. Existing product, external-product and technical definitions are unchanged.

## Content consolidation

The seven campaign steps are chronological. Supplier outreach, compatibility guidance, workshop preparation, the presentation, roadshows, adoption review and closing review each have one purpose. The former disclosure and demonstration-preparation material is consolidated; migration explanations are retained in the presentation and guidance rather than another full repeated script. Reference-only standard placeholders are folded into substantive explanatory blocks.

`summary.json` maps every old execution-process step and every old campaign step to its destination. The exact old process/campaign snapshots remain in the proposal. The original queue and protected-file digests are in `baseline.json`.

The revised 54-minute presentation allocates:

| Segment | Minutes |
| --- | ---: |
| Independent customer choice | 3 |
| DRI and the Model II prototype | 6 |
| Independent C/TUI application pioneers | 8 |
| FlexiBUS and expansion choices | 4 |
| Apple II/S-100 ROM-backed video and TUI | 7 |
| AION C 2.0 build/write/move/run demonstration | 10 |
| Independent peripheral and display roadmap | 8 |
| Future source migration | 5 |
| Customer/developer follow-up | 3 |

The script explicitly includes the approved native Apple output workflow, dated standard profiles, full contemporary Aurelia presentation semantics on qualified Logix video, separate Apple-native graphics/speaker functions, S-100 CP/M/TUI prerequisites and the distinction between native execution and binary compatibility. It does not backdate ERA, pointer or later professional graphics support.

## Pioneer selection and chronology

The external-product audit covers **106 records** with FlexiBUS, digital-video, TUI or C-standard impacts. `external-offering-audit.json` records each ID, release and impact relationship/date. An impact assessment date is not a release date; a compatibility flag is not evidence of a June shipment or agreement.

| Example | Current record evidence | Campaign treatment |
| --- | --- | --- |
| SSG General Ledger | Native Z80 AION C and ROM TUI, released 1978-06-06 | Established independent C/TUI application pioneer; no expanded accounting suite or invented Apple/Model II port |
| Microsoft BASIC for Aurelia | Shared TUI integration; no assertion that implementation is C | Separate illustration of TUI reuse, not a C-application claim |
| DRI portable extensions | Existing May 1979 release event | Independent software/interface programme |
| Tandy Model II CP/M/FlexiBUS | Release 1979-10-15 | NCC prototype; later roadshow directory update |
| Centronics FlexiBUS bridge | Estimated release 1979-11 | Prospective June path; bridge owns FlexiBUS, downstream printers retain Centronics interfaces |
| Epson TX-80 FlexiBUS variant | Estimated release 1980-01 | Prospective vendor-owned variant; month precision does not prove shipment by the January 14 review |
| Leedex digital-input monitor variant | Estimated release 1980-03 | Later roadmap, qualified rasters and separate 80-column readability |
| Sanyo digital-input monitor variant | Estimated release 1980-05 | Later roadmap; no universal 80-column claim or passive-cable conversion |

These examples give the presentation substantial independent-supplier focus without inventing attendance, signed commitments or early availability. The new variants are distinct from the historical native-interface products. Other 1980 peripherals remain potential recruitment categories, not a long keynote inventory or products claimed to ship in June 1979. The source records are current repository data; no historical internet claim is substituted for the accepted alternative-history release chronology.

## Discussions

Two pending discussions are adjusted, preserving their originals in the baseline:

- The execution-process outcome finding is dropped because the author rejects those outcomes. Its still-open reference-access/support-terms question follows the campaign at `/marketing_steps`, which exists before and after approval; no obsolete process reference can block deletion.
- The parent’s loose campaign-subject finding is now handled by the concrete proposal. Other ecosystem subject findings remain, with the stated count reduced to 17.

No historical feedback or authorization decision is rewritten. Preparing these edits does not resolve any author annotation.

## Verification

Run `node tools/verify-ncc1979-consolidation.js` while the proposal is pending. It verifies exact before snapshots, real in-memory approval and retry, strict catalogue and launch validity, unique ownership of all seven milestones, the new start date, no surviving process reference, complete step coverage, presentation arithmetic, unchanged external dates and product records, and protected live-file hashes. `verification.json` records the result.

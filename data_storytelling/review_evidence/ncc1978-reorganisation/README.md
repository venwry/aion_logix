# NCC 1978 campaign reorganisation

This is a pending complete-record proposal, not an authorization. The source commit is recorded in `audit.json`; the generator reads current foundation records and preserves complete before snapshots. The author clarified that `process.aurelia_campaign_preparation` is to be retired, not `event.aurelia_campaign_teaser`. Both the April teaser and the separate May advertising event are retained.

## Proposed programme

| Step | Activity | Direct event reference |
| --- | --- | --- |
| 1 | Newspaper/business-press teasers, explanatory print and press invitations | `event.aurelia_campaign_teaser` (7 April) |
| 2 | Cinematic TV commercial | `event.aurelia_campaign_advert` (May) |
| 3 | Aurelia NCC premiere | `event.aurelia_launch` (5 June) |
| 4 | AION C IDE and Software Developer Package, incorporating architecture/interface content | New `event.aurelia_developer_presentation` (6 June morning) |
| 5 | Independent BPI application presentation | `event.bpi_launch` (6 June afternoon) |
| 6 | Official sales premiere at a ComputerLand shop | New `event.aurelia_sales_premiere` (14 June) |
| 7 | Official Academy launch including BPI training/distribution | New `event.academy_launch` (16 June) |
| 8 | NCC recording and subsequent television distribution | No event reference; includes preparatory rights/outreach and recording throughout 5–8 June |

The readiness step and its nine editorial blocks are removed, not relocated. Preparation and session content is consolidated, with duplicates absorbed into existing blocks. The architecture overview becomes part of the morning developer presentation. Recording deliverables are scoped to each of the three NCC presentation events. Neither retired process has populated inputs; the preparation process also has no outcomes to relocate.

## Atomic scope

One proposal is necessary because independently approving deletions, event rewiring or a replacement launch link would create broken references or duplicate ownership.

- Update the campaign, Aurelia launch, BPI launch, remaining campaign execution process and BPI training product.
- Add the developer presentation, ComputerLand sales premiere and Academy launch events.
- Remove `process.aurelia_campaign_preparation`, `process.ncc78_sessions_media` and `event.bpi_dealer_program`.

The retained execution process loses its preparation child and redundant advertising/broadcast steps. Its former BPI event boundary becomes the same calendar date, so it does not acquire ownership of the new Academy event. The campaign and remaining execution envelope still end on 17 July for support/follow-up work; the obsolete July launch wording is removed. The parent foundation process retains both the campaign and execution process as parallel children.

Existing June 5 product announcements remain distinct from the June 14 shop sales premiere and June 16 Academy operational launch. Only BPI Products training changes its product-owned launch event, because the old event is removed. The March 25 Academy company formation is unchanged. Named course-city schedules and the particular ComputerLand shop remain unspecified. Morning/afternoon are recorded in prose without inventing clock times or changing the date schema.

Run `node tools/verify-ncc1978-reorganisation.js` to simulate actual approval, validate current before snapshots, check direct ownership and single timeline occurrences, confirm dates and recording deliverables, validate all product launch relationships without the NCC 1978 compatibility bridge, and verify that all untouched foundation records and authorization inputs remain unchanged. No live approval endpoint is used.

Before publication, fetch current `main`, incorporate independent repository changes, regenerate against the resulting foundation baseline if needed, and rerun the verifier. Never overwrite unrelated foundation records or author decisions.

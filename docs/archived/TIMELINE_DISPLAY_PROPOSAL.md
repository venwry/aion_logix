# Timeline display proposal

> **Historical documentation — not current rules, instructions or queue status.** Preserved from main at `606e3f1`; consult the [current documentation index](../README.md) and live storytelling JSON.

Status: implemented in the application. The approved design decisions and original audit are retained below; the three separate end-association proposals were authorized before implementation.

## Scope and evidence

Describe a consistent display for every event, process and campaign currently shown on the Timeline page, using the supplied Stock market investment / Harvard education sketch as the visual reference.

Reviewed GitHub `main` at [6169738ef41a7eba604b1d66941fb3ca582f3714](https://github.com/venwry/aion_logix/tree/6169738ef41a7eba604b1d66941fb3ca582f3714), on 6 November 2026:

- [Timeline renderer](../../code/timeline.js), [layout and hierarchy](../../code/timeline-layout.js), [page](../../code/timeline.html) and [styles](../../code/app.css).
- [Shared data, timing and authorization handling](../../code/shared.js), [date precision](../../code/temporal.js), and [application guide](../APPLICATION_GUIDE.md).
- Foundation [events](../../data_foundation/event.json), [processes](../../data_foundation/process.json) and [campaigns](../../data_foundation/campaign.json).
- Existing model and browser timeline tests.

The data audit executed the current hierarchy and layout code against that snapshot. Counts below describe repository data, not a live browser session. The application can load backend state instead of repository JSON, so its visible records and authorization statuses may differ.

## Reading the sketch

A process has a compact pale-blue heading and a separate vertical duration track in a narrow date gutter on its left. Its body is white; a filled rectangle no longer occupies the entire process duration. The heading contains a bold title and the record type and authorization status.

Events use compact light-grey cards, with a regular-weight title and the type and authorization status underneath. Each card is placed beside its date or milestone. Long titles can truncate with an ellipsis, while the full title remains available through accessible text and details.

Green dots mark process starts, red dots mark ends, and black dots mark intermediate milestones on the enclosing process track. Grey track segments connect these positions. Start and End labels or equivalent accessible text must supplement colour. The proposed marker meanings are inferred from the sketch and should be checked during visual review.

Combine all child levels into a compact vertical track panel for the root group, with as many duration tracks as needed. Avoid adding a separate wide gutter or enclosing box for every nesting level. Each process retains its own identifiable track and blue heading; logical ancestry remains intact even though the display is flattened into the shared panel. Their duration is carried by the tracks rather than tall filled cards. A gap between child processes remains visible while the enclosing process continues. The second sketch clarifies that overlapping children use adjacent duration tracks in the same panel while their cards share a common left edge. A later child may start before the preceding child's track ends; its track uses another free horizontal slot.

An event referenced by `period.start` appears immediately below its process heading, before step cards. An event referenced by `period.end` appears after its step cards. Literal date boundaries produce markers and date labels, not invented event cards. An event ending a nested process can share a row with an enclosing process's end marker without being copied into that enclosing process's data.

The user clarified that the sketch contains two independent examples, not two columns positioned on the final page. On the actual page, **all process tracks, event anchors and boundaries must align with the global timeline on the left**. The examples illustrate card and track structure only; their relative vertical positions are not a spacing specification.

## Proposed display contract

| Element | Proposed display |
| --- | --- |
| Root process | A group with a compact blue heading, date gutter, duration track and recursively displayed children. |
| Child process | A compact blue heading and a distinct track in the group's shared vertical panel, preserving logical parentage without repeated wide nesting gutters. |
| Ordinary event | One grey card at its date, beside the relevant process track, or as a standalone item when it has no parent. |
| Start event | A grey card directly beneath the process heading, linked visually to the green start marker. |
| End event | A grey card following the process's step cards, linked visually to the red end marker. |
| Literal start or end | A labelled marker only. No placeholder event is created. |
| Campaign and execution process | Retain their existing single visual group, with distinct campaign and process labels that open the appropriate details. Use the same process-track structure. |
| Description-only step | Remains in details; no date or separate event card is invented. |
| Input or contextual reference | Remains a reference in details; it does not become a child merely because it names an event or process. |

Within a group, dates determine chronological placement. Equal-date items retain stable ordering, with start roles before steps and end roles after steps. If a date has several cards, use enough space to avoid collisions and indicate that they share a date; vertical offsets must not imply invented times of day. Preserve declared step order as a tie-breaker, followed by record ID where necessary.

Spacing should be compact and content-aware, preserving the existing shared, non-proportional calendar approach. Always display boundary dates and milestone dates. Every group uses the same date-to-position mapping as the global timeline on the left. Space added to accommodate cards at a date must be reflected globally, never by shifting one group's date anchors independently. Cards may use a short connector when collision avoidance offsets them from their exact date anchor.

Pack root groups into lanes against the shared calendar, reusing horizontal space where groups do not overlap. Standalone events use the same global date anchors. Deep nesting adds narrow tracks to the shared panel rather than multiplying full-width parent containers. Retain horizontal scrolling when necessary on narrow screens; do not stack independent mini-timelines that break global alignment. Reuse a track slot once its previous duration has ended. Keep distinct tracks for simultaneously active processes. Cards at different dates share the common card area; cards at the same date must remain readable through side-by-side placement or offsets connected to the same global anchor.

Retain existing selection, URL fragments, detail panels, filtering and authorization information. Inside each event or process card, put the small white clickable Agreement block immediately to the right of the Authorized/status flag. Apply the same compact indication to an associated campaign, using a light-red block that opens campaign details. This supplements the existing paired campaign/process representation rather than duplicating it. Campaign and process authorization can differ and must remain independently understandable. Keep these controls independently keyboard accessible rather than nesting buttons inside another button.

## The supplied examples using actual data

### Stock market investment

| Date | Display |
| --- | --- |
| 1972-03-01 | `process.stock_market_investment` heading and green start marker; `event.us_nyse_start` grey card directly below the heading. |
| 1973-01-01 | Black milestone marker and `event.office` grey card. |
| 1977-12-31 | Red end marker and date; no end-event card because the period ends with a literal date. |

The investing, speculation and geographic-expansion descriptions remain in process details. The USD 251,600,000 outcome is not a separate dated event.

### Harvard education

| Process | Start | End | Display consequence |
| --- | --- | --- | --- |
| `process.harvard_education` | 1972-09-25 | 1976-06-17 | Outer heading and continuous parent track. |
| `process.harvard_year_1` | 1972-09-25 | 1973-06-14 | Blue child heading; parent and child green markers share the start date. |
| `process.harvard_year_2` | 1973-09-24 | 1974-06-13 | Blue child heading and its own duration segment. |
| `process.harvard_year_3` | 1974-09-23 | 1975-06-12 | Blue child heading and its own duration segment. |
| `process.harvard_year_4` | 1975-09-22 | 1976-06-17 | Blue child heading; ends through `event.harvard_graduation`. |

Show graduation once as the Year 4 end-event card. Place the education and Year 4 red end markers beside the same date. The parent has a literal end date, so coincident markers do not create a second event membership. Preserve the summer gaps between the years.

## Current implementation and implications

| Current behaviour | Consequence for the redesign |
| --- | --- |
| All dated columns share one content-spaced calendar. | Preserve this global alignment while changing card and track geometry. |
| Process boxes occupy their full displayed duration. | Separate header-card geometry, track geometry and descendant bounds. |
| Layout packs sibling rectangles using their complete duration. | Use adjacent tracks in the shared panel and a common card edge, as clarified by the second sketch. |
| Boundary events have separate start/end occurrence identities. | Preserve record selection while deciding when two boundary occurrences can share one card. |
| Campaigns alias their execution processes into one visual node. | Do not duplicate the campaign and its execution process when rebuilding the hierarchy. |
| Unknown process timing requires both bounds; dated children can be promoted past an undated parent. | Keep all undated processes in their separate section and retain access to their relationships in details. |
| Filters preserve relevant ancestors and sometimes descendants as context. | Keep context visibly distinguishable and counts based on records, not markers or repeated occurrences. |

The current parent-selection rules consider explicit parent fields, process steps and event process membership, with deterministic priorities. Generic references and inputs do not establish containment. This proposal changes presentation, not those foundation relationships.

## Audit findings and edge cases

There are 143 events, 62 processes and 11 campaigns: 216 underlying records. Of these, 205 have resolvable timing and 11 processes are undated. The current full-range layout covers 1972–1983 and produces 56 dated roots. There are 29 standalone event nodes, 39 event-backed boundary roles and 142 process steps without an event or process link.

| Case found | Evidence | Proposed treatment or decision needed |
| --- | --- | --- |
| Deep nesting | Five visual levels: `process.aurelia_foundation` → `campaign.ncc1978` → `process.aurelia_campaign_preparation` → `process.ncc78_sessions_media` → `event.aurelia_launch`. | Combine all levels in one compact vertical track panel, adding narrow duration tracks as required while retaining identifiable parent/child relationships. |
| Overlapping children | Under `process.stepper_install`: 2.75 µm development overlaps DRAM repair and 2.0 µm development; 2.0 µm overlaps 1.5 µm development. Other examples include SMC/Tandy under `process.open_compatibility` and SGS/localisation under `process.clone_second_source_development`. | Use adjacent duration tracks during overlaps; reuse vacant slots after an end. Keep cards aligned to the common right-hand area, as in the second sketch. |
| Same event starts and ends a process | `event.software32` in `process.comdex1980_campaign`; `event.network_launch` in `process.ncc1981_campaign`; `event.ncc83_athena_premiere` in `process.ncc1983_campaign`. | The user clarified that a process must not use the same event for both start and end. Three independent proposals retain the start-event association and replace the end association with its resolved literal date. No event copies are created. |
| Same date ends parent and child | Harvard education and Year 4 both end on graduation day. | Share the date row and show both end markers; retain one event card owned by Year 4. |
| Month-only dates | 25 events have month precision; 118 have day precision. | Show the supplied month, never an invented day. Use an uncertainty/range treatment where needed; do not claim a precise order between overlapping month ranges. |
| Several events share a date | `event.basic_launch`, `event.tandy_ncc_demo` and `event.ncc79_campaign` are all dated 1979-06-04, in different groups. | Give cards enough room. Align their date anchors with the global timeline across all groups. |
| Unknown process dates | 11 processes, including `process.clone_partnerships`, have unknown start and end. Some have dated children. | Keep all undated processes in a separate section. Preserve current dated-child placement and relationship access; do not infer official bounds from children. |
| Multiple parent claims | `event.clone_january_launch` is a step in `process.sgs_transfer`, `process.clone_channel_readiness`, `process.clone_launch_campaign` and `process.clone_january1982_campaign`. | The current renderer resolves the conflict by priority. Flag it for a separate data decision; the display redesign must not silently rewrite membership or duplicate the event into four ordinary child cards. |
| Campaign/process pairing | All 11 campaigns have execution-process representation in the current tree. | Preserve one group with access to both records and their statuses. The sketch does not cover campaigns explicitly. |
| Standalone events | 29 event nodes have no parent in the current tree. | Render them with the same grey event component; do not fabricate a process wrapper or duration. |
| Description-only actions | 142 process steps lack a linked event/process. | Keep these in details. Turning them into timeline cards would require additional date and identity decisions outside this display task. |
| Children outside parent dates | No explicit dated step edge in this snapshot falls outside its parent period. | Still validate future data. Do not stretch dates to hide an inconsistent relationship; make the inconsistency discoverable. |

Also cover these regression cases even where the snapshot does not contain an example:

- A shared boundary event referenced by different processes: preserve explicit roles and record identity; never mistake it for an ordinary duplicate step.
- Missing boundary-event IDs, partial periods, reversed periods or hierarchy cycles: no invented dates or infinite recursion; expose the reason an item cannot be placed.
- A process crossing a selected year range: use continuation markers at clipping edges rather than false start/end dots. Preserve access to its real dates.
- Filtering away siblings or selecting only events: retain enough ancestor context to explain tracks and membership. Search results must not count contextual ancestors as matches.
- A long title, multiple statuses or an Agreement control: measure card height and maintain accessible controls without overlapping date labels.
- A root with many simultaneous descendants: use parallel tracks and cards with scrolling as needed, without hiding cards behind tracks.

## User decisions

| ID | Topic | Decision |
| --- | --- | --- |
| Q1 | Calendar alignment | Resolved: both parts of the sketch are independent examples. All displayed groups must align with the global timeline on the left. |
| Q2 | Deep nesting | Resolved: combine all child levels in one vertical panel with as many narrow duration tracks as needed. Compactness is the goal. |
| Q3 | Card interactions | Resolved: Agreement remains a small white clickable block inside the event/process card, immediately right of its Authorized flag. Apply the same treatment to campaign indications with a light-red block. Retain details access. |
| Q4 | Overlapping children | Resolved by the second sketch: adjacent duration tracks in a common panel; cards share a common edge. Allocate another track while durations overlap and reuse slots after they end. |
| Q5 | One event used for both boundaries | Resolved by clarification: remove the event from its end association. Retain it as the start event; no event copies. Three one-record approval proposals preserve the current end dates as literal dates. |
| Q6 | Undated processes | Resolved: keep all undated processes in a separate section. |

The second sketch illustrates geometry, not revised Harvard dates. In particular, its altered Year 2/Year 3 overlap does not authorize changing the education records. All tracks remain aligned to the global calendar despite the two original examples having independent illustration coordinates.

## Implementation

Update the layout model in `code/timeline-layout.js`, rendering in `code/timeline.js`, and timeline styles in `code/app.css`. Adjust `code/timeline.html` if the shared track panel or legend requires it. Preserve the timing-resolution and data-loading contracts. The display design does not require a schema change. Separately, the user's correction to duplicate start/end associations is proposed in `data_storytelling/change.json`, one process per approval; foundation records remain unchanged until approval.

Validate the new model and browser rendering against both supplied examples and each material edge case above. Replace tests that assume full-height filled process boxes; retain hierarchy, selection, filtering and boundary-order tests. Check campaign/process paired status, Agreement links, deep links, narrow screens, fullscreen, keyboard access, clipping and card/label collisions. Confirm that displayed date precision and record counts remain correct.

Acceptance requires every date anchor to align with the global timeline, all child levels to use a compact shared track panel, every displayed child to retain its proper membership, start and end events to remain ordered around steps, Agreement/campaign blocks to remain accessible, and all cards and tracks to remain readable. The design decisions are now recorded. The application now implements this display contract. Same-date cards use vertical offsets and connectors to shared global date anchors; all nesting levels share the root track panel.

## Separate data proposals

Each proposal removes only the end-event reference, preserving the previously resolved calendar date and precision. This does not invent a longer campaign period; the author may revise those dates later.

| Process | Start association retained | Proposed literal end |
| --- | --- | --- |
| `process.comdex1980_campaign` | `event.software32` | 1980-11-19 (day) |
| `process.ncc1981_campaign` | `event.network_launch` | 1981-05-04 (day) |
| `process.ncc1983_campaign` | `event.ncc83_athena_premiere` | 1983-05-16 (day) |

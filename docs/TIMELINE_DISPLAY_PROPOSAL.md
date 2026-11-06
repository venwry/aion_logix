# Timeline display proposal

Status: design proposal; no application or foundation-data changes applied. Layout choices in the decision table await user review.

## Scope and evidence

Describe a consistent display for every event, process and campaign currently shown on the Timeline page, using the supplied Stock market investment / Harvard education sketch as the visual reference.

Reviewed GitHub `main` at [6169738ef41a7eba604b1d66941fb3ca582f3714](https://github.com/venwry/aion_logix/tree/6169738ef41a7eba604b1d66941fb3ca582f3714), on 6 November 2026:

- [Timeline renderer](../code/timeline.js), [layout and hierarchy](../code/timeline-layout.js), [page](../code/timeline.html) and [styles](../code/app.css).
- [Shared data, timing and authorization handling](../code/shared.js), [date precision](../code/temporal.js), and [application guide](APPLICATION_GUIDE.md).
- Foundation [events](../data_foundation/event.json), [processes](../data_foundation/process.json) and [campaigns](../data_foundation/campaign.json).
- Existing model and browser timeline tests.

The data audit executed the current hierarchy and layout code against that snapshot. Counts below describe repository data, not a live browser session. The application can load backend state instead of repository JSON, so its visible records and authorization statuses may differ.

## Reading the sketch

A process has a compact pale-blue heading and a separate vertical duration track in a narrow date gutter on its left. Its body is white; a filled rectangle no longer occupies the entire process duration. The heading contains a bold title and the record type and authorization status.

Events use compact light-grey cards, with a regular-weight title and the type and authorization status underneath. Each card is placed beside its date or milestone. Long titles can truncate with an ellipsis, while the full title remains available through accessible text and details.

Green dots mark process starts, red dots mark ends, and black dots mark intermediate milestones on the enclosing process track. Grey track segments connect these positions. Start and End labels or equivalent accessible text must supplement colour. The proposed marker meanings are inferred from the sketch and should be checked during visual review.

Nested processes use the same component recursively: a blue heading, their own track beside the parent's track, and their own children. Their duration is carried by the track rather than by a tall filled card. A gap between child processes remains visible while the enclosing process continues.

An event referenced by `period.start` appears immediately below its process heading, before step cards. An event referenced by `period.end` appears after its step cards. Literal date boundaries produce markers and date labels, not invented event cards. An event ending a nested process can share a row with an enclosing process's end marker without being copied into that enclosing process's data.

The two columns in the sketch do **not** share calendar alignment: the investment begins in March 1972 beside Harvard's September 1972 start, and its December 1977 end appears above Harvard's June 1976 end. The closest interpretation is an independent, compact timeline for each root group. This is a significant change from the current page and remains a decision, not an approved assumption.

## Proposed display contract

| Element | Proposed display |
| --- | --- |
| Root process | A group with a compact blue heading, date gutter, duration track and recursively displayed children. |
| Child process | The same component within its parent's group; an additional track makes its own start and end visible. |
| Ordinary event | One grey card at its date, beside the relevant process track, or as a standalone item when it has no parent. |
| Start event | A grey card directly beneath the process heading, linked visually to the green start marker. |
| End event | A grey card following the process's step cards, linked visually to the red end marker. |
| Literal start or end | A labelled marker only. No placeholder event is created. |
| Campaign and execution process | Retain their existing single visual group, with distinct campaign and process labels that open the appropriate details. Use the same process-track structure. |
| Description-only step | Remains in details; no date or separate event card is invented. |
| Input or contextual reference | Remains a reference in details; it does not become a child merely because it names an event or process. |

Within a group, dates determine chronological placement. Equal-date items retain stable ordering, with start roles before steps and end roles after steps. If a date has several cards, use enough space to avoid collisions and indicate that they share a date; vertical offsets must not imply invented times of day. Preserve declared step order as a tie-breaker, followed by record ID where necessary.

Spacing should be compact and content-aware, not proportional to elapsed time. Always display boundary dates and milestone dates. If independent root timelines are selected, explain in the UI that columns have independent time scales and remove any global horizontal year grid that implies shared alignment. Children within the same root still share that root's date mapping so that parallel durations can be compared.

For an independent layout, the proposed root arrangement is a responsive grid of groups ordered by start date, with stable record-ID ties; standalone events use compact cards in the same ordered flow. Do not allocate a permanent screen-wide column to every root. On a narrow screen, groups stack; a deeply nested group may scroll horizontally if the all-levels option is selected. This arrangement is a recommendation rather than a detail established by the sketch.

Retain existing selection, URL fragments, detail panels, filtering and authorization information. Retain a small clickable Agreement indicator beside the start-date label for a record with `agreement_id`, unless the user selects the simplified-card option below. Campaign and process authorization can differ and must remain independently understandable. Keep agreement controls independently keyboard accessible rather than nesting buttons inside another button.

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
| All dated columns share one content-spaced calendar. | Independent timelines require a new date mapping per root, not just CSS changes. |
| Process boxes occupy their full displayed duration. | Separate header-card geometry, track geometry and descendant bounds. |
| Layout packs sibling rectangles using their complete duration. | Compact cards need an explicit policy for overlapping child processes. |
| Boundary events have separate start/end occurrence identities. | Preserve record selection while deciding when two boundary occurrences can share one card. |
| Campaigns alias their execution processes into one visual node. | Do not duplicate the campaign and its execution process when rebuilding the hierarchy. |
| Unknown process timing requires both bounds; dated children can be promoted past an undated parent. | Showing undated groups in place would change grouping as well as appearance. |
| Filters preserve relevant ancestors and sometimes descendants as context. | Keep context visibly distinguishable and counts based on records, not markers or repeated occurrences. |

The current parent-selection rules consider explicit parent fields, process steps and event process membership, with deterministic priorities. Generic references and inputs do not establish containment. This proposal changes presentation, not those foundation relationships.

## Audit findings and edge cases

There are 143 events, 62 processes and 11 campaigns: 216 underlying records. Of these, 205 have resolvable timing and 11 processes are undated. The current full-range layout covers 1972–1983 and produces 56 dated roots. There are 29 standalone event nodes, 39 event-backed boundary roles and 142 process steps without an event or process link.

| Case found | Evidence | Proposed treatment or decision needed |
| --- | --- | --- |
| Deep nesting | Five visual levels: `process.aurelia_foundation` → `campaign.ncc1978` → `process.aurelia_campaign_preparation` → `process.ncc78_sessions_media` → `event.aurelia_launch`. | Recursively apply the component. Decide between all tracks visible and expandable levels; the two-level sketch alone does not settle this. |
| Overlapping children | Under `process.stepper_install`: 2.75 µm development overlaps DRAM repair and 2.0 µm development; 2.0 µm overlaps 1.5 µm development. Other examples include SMC/Tandy under `process.open_compatibility` and SGS/localisation under `process.clone_second_source_development`. | Decide whether cards occupy parallel lanes or a shared chronological stack with parallel tracks. Avoid drawing sequential-looking child blocks that conceal overlap. |
| Same event starts and ends a process | `event.software32` in `process.comdex1980_campaign`; `event.network_launch` in `process.ncc1981_campaign`; `event.ncc83_athena_premiere` in `process.ncc1983_campaign`. | Recommend one event card with both Start and End roles, adjacent distinguishable markers and sufficient minimum height. Await the decision below. |
| Same date ends parent and child | Harvard education and Year 4 both end on graduation day. | Share the date row and show both end markers; retain one event card owned by Year 4. |
| Month-only dates | 25 events have month precision; 118 have day precision. | Show the supplied month, never an invented day. Use an uncertainty/range treatment where needed; do not claim a precise order between overlapping month ranges. |
| Several events share a date | `event.basic_launch`, `event.tandy_ncc_demo` and `event.ncc79_campaign` are all dated 1979-06-04, in different groups. | Give cards enough room. Shared-calendar mode aligns their date anchors; independent mode guarantees alignment only within a root. |
| Unknown process dates | 11 processes, including `process.clone_partnerships`, have unknown start and end. Some have dated children. | Decide whether undated parents stay visible around their children, without a duration track, or remain in a separate section. Do not infer official bounds from children. |
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
- A root with many simultaneous descendants: allow scrolling or expansion according to the selected nesting policy, without hiding cards behind tracks.

## Decisions awaiting user answers

These choices have been asked in chat. Recommendations are provisional and are not approval to implement them.

| ID | Question | Options and consequence | Provisional recommendation |
| --- | --- | --- | --- |
| Q1 | Do different root columns share a calendar? | Independent compact timelines match the sketch but cannot be compared by height. Shared calendar alignment preserves cross-column comparison but changes the sketch's spacing. | Independent compact timelines, with an explicit scale explanation. |
| Q2 | How should deep nesting work? | Show a new track at every level and allow horizontal scrolling, or show one child level at a time using expand/collapse. | All levels visible initially, matching the illustrated hierarchy. |
| Q3 | Which interactions stay on cards? | Keep Agreement links, authorization status and details selection, or move agreement access into details. | Retain current interactions and status. |
| Q4 | How should overlapping children be arranged? | Parallel tracks and cards, or a chronological stack of cards with overlap visible through the tracks. | Parallel tracks and cards where needed. |
| Q5 | What if one event is both start and end? | One event card with both roles, or two separate boundary cards. | One card with both roles. |
| Q6 | Where do undated processes belong? | Keep undated groups within known parents, with separate undated roots; or keep all undated processes in a separate section. | In-place groups without duration tracks; a separate section for undated roots. |

## Implementation after review

Update the layout model in `code/timeline-layout.js`, rendering in `code/timeline.js`, and timeline styles in `code/app.css`. Adjust `code/timeline.html` if the selected scale, nesting or legend controls require it. Preserve the timing-resolution and data-loading contracts. This design does not require foundation-data, schema or approval-record edits.

Validate the new model and browser rendering against both supplied examples and each material edge case above. Replace tests that assume full-height filled process boxes; retain hierarchy, selection, filtering and boundary-order tests. Check campaign/process paired status, Agreement links, deep links, narrow screens, fullscreen, keyboard access, clipping and card/label collisions. Confirm that displayed date precision and record counts remain correct.

Acceptance requires the chosen date-scale policy to be clear, every displayed child to retain its proper membership, start and end events to remain ordered around steps, and all cards and tracks to remain readable. Implementation should begin only after the pending layout choices are resolved.

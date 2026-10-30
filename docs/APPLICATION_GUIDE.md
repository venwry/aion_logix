# Application guide

The application explores and reviews the alternative history stored in JSON. Display settings do not change the story model or authorize records. For editing rules see the [editing guide](EDITING_GUIDE.md); for fields and relationships see the [model guide](data-model/MODEL_GUIDE.md) and [foundation specification](data-model/FOUNDATION_SPECIFICATION.md).

## Pages and navigation

| Page | Purpose |
| --- | --- |
| [Timeline](../code/timeline.html) | Chronological exploration of events, processes and campaigns, with details on the left. |
| [Data browser](../code/browser.html) | All foundation datasets, with a sortable record list on the left and details on the right. |
| [Changes confirm](../code/changes-confirm.html) | Review proposed before/after changes and authorize their resulting records. |
| [Documentation](viewer.html) | Read current guides, dataset files and clearly labelled historical evidence. |

The header switches between pages. The original Logix/AION logo links to the timeline; the AION A emblem is the browser/favorites icon. Record URLs carry the selected ID after `#`, allowing direct links to details.

## Timeline

### Dates and the fixed rail

Events appear as point-in-time boxes. Processes occupy boxes from their start to end, with parallel work beside them. Start dates appear near the top of process boxes and end dates at the bottom. Year lines pass behind boxes that cross year boundaries.

The narrow date rail remains at the left edge during horizontal scrolling. Dates are left of the vertical line; small bold dark-red years are immediately to its right. Spacing is chronological but **not proportional to elapsed time**: it expands only enough to fit labels, headings and nested boxes. Box height therefore is not a quantitative duration scale.

Year/month/day precision is retained in details and date labels. A year-only fact is not silently given a known day. Event-referenced process boundaries resolve through the referenced event. Unknown boundaries are not invented; undated work appears in a separate section. Selecting a year range can clip the visible duration of a process, while its label retains the underlying start/end values.

Events and processes with an associated agreement show a small **Agreement** button immediately before their start date. Clicking it opens the agreement, including its embedded clauses, in the details pane. Combined campaign/process boxes use the execution process’s agreement. Current data uses `agreement_id`; when viewing older data with `agreement_ids`, the first entry is used.

### Nested work and campaign boxes

Events referenced by `period.start` and `period.end` appear inside the process as light grey **Start** and **End** cards, respectively before and after step events and sub-processes. Same-day boundaries reserve room for the steps between them. A shared boundary appears in each owning process; selecting any occurrence opens the same event record and highlights its other visible occurrences. An event used for both boundaries appears once in each role. These visual occurrences do not duplicate foundation records or increase the matching-record count.

Explicit parent-process links and process-step references place events and sub-processes inside their owner where their dates fit. Membership selection prioritizes explicit parent links, then campaign execution steps, other process steps, and event process references; equal-priority ties use stable IDs. Other relationships remain available in details. A child outside its parent's stated dates stays separate; rendering does not change either record's dates. Undated children remain in the undated section.

A campaign shares one visual box with its execution process. **Campaign** and **Process** labels select the respective records. These remain two distinct records with separate content hashes and authorizations. “Mixed authorization” means only one of the pair is authorized; it is a display summary, not a stored status or group approval.

### Filters and space

Use text, record type, authorization, actor and year-range filters. Matching records retain their linked hierarchy as context; dashed borders mark context records that do not themselves match. The match count counts matching records, not visual boxes or added context. Reset filters restores the full range.

Scroll horizontally for parallel work. Drag the divider between details and timeline to adjust their widths, or focus the divider and use the arrow keys. Normal narrow-screen layout stacks the panes.

**Full screen**, immediately left of the colour key, hides the header, saving-service bar, title and filters. Details and timeline use the available page area. **Exit full screen** or Escape restores those sections without clearing filter values. This is an application layout mode, not the browser's native full-screen mode; entering it does not disconnect an existing saving-service session.

## Data browser

Select a dataset and use the dropdown/text filters to narrow the list. Column-heading buttons sort it; pagination handles larger results. Select a record to inspect it. The divider adjusts the relative widths of list and details.

Authorized records display their state. Pending records have a checkbox in the left list. Select records, then use **Authorize and save** above Reset filters. Selections survive filtering and pagination; the button is enabled when there are selections. Each batch is saved atomically in one Git commit. Review the entire selected records first, including any currently truncated text. See the saving section below.

## Shared details on both pages

Nested fields appear as dotted names and values; lists of objects appear as compact tables. There are no collapsed data sections. The record's dataset link remains at the bottom.

### Tables

- Autofit distributes available width using the **average displayed content length** of each column, while respecting header-width minimums. Numeric/short fields generally stay narrow; descriptive fields receive more space.
- Automatic widths adapt when the details pane is resized. If minimum widths exceed the pane, the table scrolls horizontally.
- Drag any column-header edge to resize it. Keyboard users can focus the edge and use Left/Right arrows; Home reduces it to its header minimum.
- The **↔** button at the right end of the last header recalculates autofit for the whole table. Manual widths stay in effect until reset or the details are rendered again.

### Reference lists

Reference entries show `id - Name`: the ID is plain text and only the name is a hyperlink. Following the name selects that record in the current page's details.

Each list of recognized reference IDs, including “Referenced by” and lists inside detail tables, always displays in one column. There are no column selectors. Long names use ellipsis; hover exposes the full name.

Timeline details offer **Open in Data browser** for the same record. Browser details offer **Open in timeline** for events, processes and campaigns. **Open dataset** opens the underlying foundation JSON file. These links do not authorize anything.

## Saving and authorization

Connect through the Saving service bar using the **backend access key**, not the GitHub token. Changes confirm uses the fixed service URL `https://aion-review-zu1t.onrender.com`; its address is displayed but cannot be edited. The timeline and data browser retain their service URL field. See [Render setup](RENDER_SETUP.md) for configuration. Connected browsing reads current repository state through the backend; disconnected browsing uses the published static snapshot and cannot save.

Authorization accepts the exact content of a whole record, including its nested values. References do not authorize their targets. An absent or mismatching authorization hash is pending. Neither nesting, a combined campaign box nor elapsed dates establish author acceptance.

Changes confirm displays a visible **Subject / Before / After** table. Check each proposal you authorize, then use **Authorize and save** immediately to the right of Search. The selection count includes checked proposals hidden by search/category filters. All selected proposals are sent in one request and committed atomically in one Git commit; unchecked proposals remain pending. Selections survive filtering and a failed save. A stale proposal, overlapping record edits or an invalid resulting graph rejects the entire batch. Each applied proposal retains its own audit decision and complete snapshots. Schema changes require separate review and deployment. A successful save reports the GitHub commit; stale or failed requests do not report success. Old downloadable approval logs are historical evidence, not the current workflow.

For exact authorization file structures see the [storytelling reference](data-model/STORYTELLING_FILE_REFERENCE.md). For pending issues and later migration work see the [review backlog](REVIEW_BACKLOG.md).

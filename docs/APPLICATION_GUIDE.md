# Application guide

The application explores and reviews the alternative history stored in JSON. Display settings do not change the story model or authorize records. For editing rules see the [editing guide](EDITING_GUIDE.md); for fields and relationships see the [model guide](data_model/MODEL_GUIDE.md) and [foundation specification](data_model/FOUNDATION_SPECIFICATION.md).

## Pages and navigation

| Page | Purpose |
| --- | --- |
| [Timeline](../code/timeline.html) | Chronological exploration of events, processes and campaigns, with details on the left. |
| [Manufacturing costs](../code/manufacturing-costs.html) | All internal products against semiannual 1978–1983 nominal-USD cost estimates, with blank pre-launch cells and inspectable breakdowns. |
| [Product Catalog](../code/product-catalog.html) | Products grouped chronologically by launch campaign and event, with configuration and BOM tabs. |
| [Data browser](../code/browser.html) | All foundation datasets, with a sortable record list on the left and details on the right. |
| [Changes confirm](../code/changes-confirm.html) | Review proposed before/after changes, or provide remarks on problem-only discussions. |
| [Documentation](viewer.html) | Read current guides, dataset files and clearly labelled historical evidence. |

The header switches between pages. On Timeline, Product Catalog, Manufacturing costs, Data browser and Changes confirm, **Saving service** in the top navigator hides or reveals the connection section. Its visibility is remembered across pages and reloads in this browser; hiding it frees the space for the content below and keeps the connection active. The original Logix/AION logo links to the timeline; the AION A emblem is the browser/favorites icon. Record URLs carry the selected ID after `#`, allowing direct links to details.

## Timeline

### Dates and the fixed rail

Events appear as compact light-grey cards, or green when referenced as an internal product launch. Processes have compact pale-blue headings and campaigns independent light-red headings. Grey duration tracks in a shared vertical panel carry process start/end dates; filled cards no longer stretch over their entire duration. All groups align with the global timeline on the left. Green dots mark starts, red dots ends, and black dots milestones. Marker tooltips also state their roles.

The narrow date rail remains at the left edge during horizontal scrolling. Dates are left of the vertical line; small bold dark-red years are immediately to its right. Spacing is chronological but **not proportional to elapsed time**: it expands only enough to fit labels, headings and cards. Track height therefore is not a quantitative duration scale. Same-date cards may be offset to remain readable, with connectors to their unchanged date anchor.

Year/month/day precision is retained in details and date labels. A year-only fact is not silently given a known day. Event-referenced process boundaries resolve through the referenced event. Unknown boundaries are not invented; undated work appears in a separate section. Selecting a year range can clip the visible duration of a process; arrow markers distinguish continuation from a true start/end, and tooltips retain the underlying dates.

Events with an `agreement_id` show an **Agreement** button beside the authorization flag. It opens the agreement and its clauses. Current authoring uses this link only on signing or contractual-acceptance events. Compatibility rendering of older process/campaign agreement links does not permit creating new operational links.

### Nested work and campaign cards

Events referenced by `period.start` and `period.end` appear inside the process as **Start** and **End** cards (light grey, or green for product launches), respectively before and after step events and sub-processes. Same-day boundaries reserve room for the steps between them. A shared boundary appears in each owning process; selecting any occurrence opens the same event record and highlights its other visible occurrences. Legacy records using one event for both boundaries retain explicit roles until corrected through review. These visual occurrences do not duplicate foundation records or increase the matching-record count.

Process steps and campaign marketing-step references place children inside their structural owner where dates fit; process boundaries supply their own start/end occurrences. Other references remain available in details but do not establish ownership. Historical fallback membership rules are renderer compatibility, not current authoring fields. A child outside its parent's dates remains separate in the view; rendering does not change stored dates or resolve invalid ownership. Undated children appear in the undated section.

All child levels share a compact track panel. Overlapping children use adjacent tracks; a slot is reused after its previous process ends. Child cards share a common left edge. Parentage remains available in card descriptions and details. Undated processes stay in their separate section.

All current campaigns have their own light-red duration block, independent of any remaining execution process. The heading opens campaign details. Historical legacy campaign/process snapshots may still use the combined renderer; it is not the current campaign schema.

Events referenced by a product’s `launch_event_id` are green, including every boundary occurrence. This display follows product references, independently of the event’s `kind`. In Timeline details, **Launched products** appears immediately after the event description and links to all products naming that event. The list is derived at display time; it is not stored on the event. Events without product launch references have no such list and retain their normal colour.

### Filters and space

Use text, record type, authorization, actor and year-range filters. Matching records retain their linked hierarchy as context; dashed borders mark context records that do not themselves match. The match count counts matching records, not visual boxes or added context. Reset filters restores the full range.

Scroll horizontally for parallel work. Drag the divider between details and timeline to adjust their widths, or focus the divider and use the arrow keys. Normal narrow-screen layout stacks the panes.

**Full screen**, immediately left of the colour key, hides the header, saving-service bar, title and filters. Details and timeline use the available page area. **Exit full screen** or Escape restores those sections without clearing filter values. This is an application layout mode, not the browser's native full-screen mode; entering it does not disconnect an existing saving-service session.

## Product Catalog

The left browser groups internal products by their recorded launch campaign, then launch event, in chronological order. Group dates appear beside campaign/event names, and compact product rows include colored kind flags. Undated groups follow dated groups. Search matches product names, IDs, descriptions, campaign names and event names. Selecting a product updates its shareable URL. Products without launch links remain browsable in separate groups.

The right pane switches between **Configuration contents** and **Bill of materials**. The composition selector starts with the earliest numbered revision; each child uses its explicitly pinned revision, never an inferred latest version. Configuration contents uses six display groups: Mainboard core, Memory and cartridges, Disk drives, Expansion cards, Flexibus & Video peripherals, and Software & services. Empty groups are hidden. Compact, non-expandable bullet lists show quantity, a bold linked name, and the description (or the first technical-specification line when the description is missing or only repeats the name), with parameter values substituted in bold. The selected product has one large title with a Data browser link icon. These groups are derived from existing record kinds and technical parameters; they are not new foundation fields. Use the BOM for the component hierarchy and the linked record for full technical chapters and graphics modes. Links open the original records in Data browser.

The BOM preserves the composition hierarchy and shows quantities per parent and per complete product. Unknown quantities remain unknown and propagate through descendants. Assemblies and their constituent parts overlap and must not be added together. Services have no physical BOM. No prices or manufacturing cost estimates are invented.

Processor summaries use base-computer processor references checked against fitted composition parts. System RAM sums declared memory-module, memory-subsystem and RAM-expansion capacities multiplied by their installed quantities, counting each memory assembly once. It excludes video buffers, ROM, storage and maximum-capacity limits. Unknown capacity or quantity prevents a claimed total; the known subtotal is labelled separately. This derives declared installed system memory, not OS-available memory or a hardware qualification result. Hover over RAM for its contributing assemblies. All views are read-only and add no duplicated product specifications or data structures.

## Data browser

Select a dataset and use the dropdown/text filters to narrow the list. Column-heading buttons sort it; pagination handles larger results. Select a record to inspect it. The divider adjusts the relative widths of list and details.

Authorized records display their state. Pending records have a checkbox in the left list. Select records, then use **Authorize and save** above Reset filters. Selections survive filtering and pagination; the button is enabled when there are selections. Each batch is saved atomically in one Git commit. Review the entire selected records first, including any currently truncated text. See the saving section below.

## Shared details on both pages

Nested fields appear as dotted names and values; lists of objects appear as compact tables. Composition histories use a version selector instead of a nested history table. Each option reads `version_number - description (effective_from - effective_until)`. The first stored version is selected initially; unknown boundaries remain `unknown`, open ends remain `open`, and event boundaries show their date (at its recorded precision) and referenced name. Below the selector, the chosen version shows its populated composition and assembly-requirement sections. Root technical specifications take precedence over legacy technical-definition display. Historical process boundaries remain readable but are not valid for new composition versions. Empty sections state that no entries are specified. Selecting a version changes only the view. The record's dataset link remains at the bottom.

### Tables

- Autofit distributes available width using the **average displayed content length** of each column, while respecting header-width minimums. Numeric/short fields generally stay narrow; descriptive fields receive more space.
- Automatic widths adapt when the details pane is resized. If minimum widths exceed the pane, the table scrolls horizontally.
- Drag any column-header edge to resize it. Keyboard users can focus the edge and use Left/Right arrows; Home reduces it to its header minimum.
- The **↔** button at the right end of the last header recalculates autofit for the whole table. Manual widths stay in effect until reset or the details are rendered again.

### Reference lists

Reference entries show `id - Name`: the ID is plain text and only the name is a hyperlink. Following the name selects that record in the current page's details.

Each list of recognized reference IDs, including “Referenced by” and lists inside detail tables, always displays in one column. There are no column selectors. Standalone lists keep their field heading (for example, `subject_ids:`); lists inside table cells omit that heading because the column header already names the field. Long names use ellipsis; hover exposes the full name.

Timeline details offer **Open in Data browser** for the same record. Browser details offer **Open in timeline** for events, processes and campaigns. **Open dataset** opens the underlying foundation JSON file. These links do not authorize anything.

## Saving and authorization

Connect through the Saving service bar using the **backend access key**, not the GitHub token. Changes confirm uses the fixed service URL `https://aion-review-zu1t.onrender.com`; its address is displayed but cannot be edited. The timeline and data browser retain their service URL field. See [Render setup](RENDER_SETUP.md) for configuration. Connected browsing reads current repository state through the backend; disconnected browsing uses the published static snapshot and cannot save.

Authorization accepts the exact content of a whole record, including its nested values. References do not authorize their targets. An absent or mismatching authorization hash is pending. Neither nesting, a combined campaign box nor elapsed dates establish author acceptance.

Changes confirm has a resizable proposal navigator and a comparison pane, without a page-introduction banner. A compact header above the independently scrolling comparison contains **Authorize**, **Request changes**, **Remove**, and the comparison selector. JSON mode adds **Show full records**; Details mode adds an affected-record dropdown with names and previous/next arrows. Each newly selected proposal starts at its first affected record. Search, category and review-state filters narrow the navigator without clearing authorization selections or local feedback drafts. Choose **JSON comparison** (changed fields, or full records) or **Details comparison**. Details mode selects an affected record and shows complete Before/After views with changed fields highlighted. Composition versions synchronize by version number; a missing version is explicitly identified. Following a reference compares that record using the current repository snapshot overlaid with every proposal element on the corresponding side. These are proposal comparisons, not historical snapshots of unchanged dependencies.

Keyboard shortcuts follow the filtered navigator: **Up/Down** select the previous/next proposal, and **Left/Right** select the previous/next affected record in Details mode. Navigation stops at the ends of each list. **Alt+A** toggles authorization selection; **Alt+C** opens Request changes (or Add remarks for discussions) and focuses the feedback field. These shortcuts use the same eligibility checks as the buttons and never save automatically. They are inactive while saving, composing text, editing a field, using a dropdown or resizing a pane/table; modified arrow keys retain their native behavior. Empty filter results show no active proposal.

**Authorize** selects the whole proposal. **Request changes** clears that proposal's authorization selection and opens refinement feedback. **Remove** marks the proposal for removal; **Undo removal** restores it before saving. Save or cancel unsaved feedback before marking that proposal for removal. Selections and removals last for this page session; feedback drafts also survive reloads.

**Save** commits all staged authorizations, feedback and removals together in one atomic Git commit. No individual element can be approved separately. Feedback requires a non-empty explanation and marks that exact proposal revision **Needs refinement**. Removal withdraws the proposal without applying any of its foundation changes or altering existing authorizations. Its snapshot remains in the decision audit, saved feedback is retained, and linked annotations stay open. Required proposals cannot be removed while surviving proposals depend on them; remove dependents together or revise their dependencies first.

A failed save retains staged decisions and drafts. Exact proposal hashes, stale-before checks for approvals, graph validation and non-forced GitHub saves protect the transaction. A revised proposal returns to pending review; earlier feedback remains available. Schema proposals can be withdrawn here, but authorization requires a separate reviewed deployment.

**Discussion** entries have a problem statement, expandable findings and links to affected records, with no Before/After edits. Their **Authorize** button is disabled and the API rejects attempts to authorize them. **Add remarks** opens the same saved feedback workflow; **Save** commits the remarks without changing foundation records. **Remove** can withdraw a discussion and preserves its audit snapshot. The comparison controls return when a concrete proposal is selected. Use the category filter to distinguish Foundation changes, legacy Story changes, Discussion and Schema extensions. A discussion can later be revised under the same ID into a concrete proposal, with a new hash and the earlier remarks retained.

### Timeline annotations and selection history

**Add annotation** beside the authorization badge opens a multiline field above the title. Drafts survive selection changes, filtering and full-screen changes. They are stored locally in this browser, scoped to this repository and main branch, and are explicitly labelled as uncommitted. Local storage can be unavailable or cleared; the page reports storage failures and warns on leaving with drafts. Committing requires a saving-service connection. If a record or proposal disappears, its local draft remains available in a recovery panel for copying or explicit discard.

The uncommitted count counts changed annotations, not keystrokes. **Save annotations** writes all drafts atomically to GitHub. Failure retains drafts. Saved annotations are read-only and copyable; **Edit Annotation** unlocks one. **Cancel edit** restores its saved text. Clearing text cannot silently delete a note: use **Dismiss annotation**, then save, to retain its history with an explicit dismissed state. Feedback never changes foundation authorization. Concurrent changes to the note or reviewed record reject stale saves; compare the retained draft with the saved content before starting a fresh edit.

**Go Back**, left of Save annotations, returns to the previous selection, including reference navigation. It restores the composition version and detail scroll position. Repeated selection and filter redraws do not add history entries. Filters do not prevent opening a previous record's details. Selection history lasts for the page session; drafts also survive reloads.

For exact authorization file structures see the [storytelling reference](data_model/STORYTELLING_FILE_REFERENCE.md). Current pending proposals, feedback and open questions live in the storytelling JSON; archived backlog reports are historical only.

Agreement details show simplified clause columns: id, kind, statement, value and unit. Non-quantitative clauses use null values; quantities and ranges summarize the full statement. All current agreement records use these simplified clauses. The renderer can still display legacy historical clauses, but the active schema rejects that representation. Review each whole agreement independently in Changes confirm. Frontend, saving backend and manifest must use the matching current schema contract.


## Timeline categories and swim lanes

Processes and campaigns support an optional `category` string; the unused event category declaration is retired in contract 0.16.0. The permitted non-empty values are `Adam's personal`, `Logix/AION investment`, `Product dev & launch`, `Ecosystem & Partners`, and `Competition`. An omitted field or `""` is empty; `null` and other spellings are invalid.

Assign a category only to a top-level process or campaign. Children must leave it empty and inherit their root's category. Ownership comes from process steps, campaign marketing-step references and event-based process boundaries. The former event membership field is retired. Inputs, outcomes, subjects and related-process references do not establish ownership. The model validator rejects a non-empty category on an owned child. When reparenting a root, clear its category in the same approval batch. Campaigns inherit from their parent or use their own root category. Marketing-step details use narrative presentation blocks with expandable parameter tables. Each step header shows number, type and description; a second line shows the referenced event/process name and date/start date when reference_id is present.

The timeline displays five lightly colored vertical lanes, with an additional grey Uncategorised lane when matching records have no category. Each lane has a labeled collapse/expand button above the workspace. Collapse hides the lane and its cards, including undated entries, while leaving its button available. Controls work by keyboard and remain available in full screen. Lane visibility lasts until page reload; filter reset does not change it.

All visible lanes share one calendar. Actor and other record filters, as well as category collapse/expand controls, recalculate date anchors and vertical spacing from the visible content. Hidden categories reserve no calendar space or date labels. Expanding a category restores its content and recalculates the scale; the selected From/To year bounds remain unchanged. Overlapping root groups occupy parallel columns within their lane; nested work retains compact duration tracks. Horizontal scrolling accommodates wider lanes. Filtering retains inherited categories from the complete ownership tree even when an ancestor falls outside the selected date range. Unknown dates remain in the separate undated section and follow the same lane visibility controls.

Categories describe the root programme's primary purpose. Semiconductor work under stepper installation remains Investment, and competitor events inside ecosystem programmes remain Ecosystem & Partners. Moving individual children into a different lane requires changing ownership, not assigning an override.

Category assignments are story changes. Group reparenting and category changes when they are inseparable; records inherit their current root assignment.

## External products and product launches

Data browser includes External Product alongside the existing datasets. Its specification uses technology-style numbered chapters, highlighted text parameters and expandable Key/Value tables. Offering kind and providers are required; release is an optional direct date. Its dated standard-impact sections show Base assumptions, Relation to standard and Commercial consequences. Timeline details and Changes confirm use the same rendering and navigation. Product details show explicit launch campaign and event links; all current internal products supply them; external products do not require them and several products may share them. External records appear with their current exact-content authorization status; their relationships do not authorize referenced technical definitions.

## Reference interpretation

Inputs and outcomes explain dependency, delivery, decision or qualification roles. Top-level subjects remain in some records and need individual role review. Their presence is not blanket approval of a loose reference; documented external participation and later promotion can be valid exceptions. Read the [reference rules](data_model/REFERENCE_RULES.md); the presence of a link alone does not establish ownership, readiness or an initial launch. The “Referenced by” section derives incoming links without storing a second copy.

Assumption detail headings use `topic` when present; their `statements` are displayed separately in order. Historical legacy assumptions remain readable; the active schema requires topic and statements. Composition selectors display the `simulation_end` boundary as `1995-01-01 · simulation end`, alongside event/process dates, including their original precision.

Technology specifications render as separate chapters in Timeline, Data browser and the Details comparison. Each chapter starts on one flowing line: a bold numbered heading, a small [+] button when parameters exist, then regular-weight description text with substituted parameter values highlighted in red. Text wraps naturally, and later authored paragraphs remain separate. The two-column Key/Value table is hidden by default; the button expands it and changes to [−] to collapse it again. Each chapter toggles independently, and its description remains visible. Chapters without parameters show neither a toggle nor a table. Each substitution is resolved only from its own chapter. Referenced records appear as inline clickable names, with raw IDs hidden in prose and retained in expanded parameter tables. Unresolved keys remain visible in older snapshots; new records with unresolved keys fail validation. Narrow screens wrap long values and allow table scrolling. The same flowing heading/description and inline-reference presentation applies to technical specifications, graphics modes, external-product specifications, impacted standards and campaign presentation blocks on all three detail views.

Composition details display the sections present in the selected version. After approved empty-field cleanup, product versions omit the unused technical-definition section and software versions omit unused assembly requirements. Historical comparison snapshots can still display retired fields and process-boundary labels; this does not make those fields valid for new records.

### Device, software and base-part technical specifications

Root technical specifications use numbered, bold chapter headings and prose with red `{key}` substitutions. One `[+]` button beside “Technical specification” toggles the single global parameter table, hidden by default. It includes reference roles and clickable referenced records. In prose, references show the linked record name; the highlighted value’s tooltip and the table retain its full ID and role. Empty parameter lists have no toggle. Graphics modes use the same presentation, with an independent collapsed table of fixed fields and parameters for each mode. Unknown numeric values display as “unknown”.

These sections appear consistently in Timeline, Data browser and Changes confirm comparisons. When a record has the new root specification, the legacy technical-definition section is hidden in details; old records and before snapshots remain readable. Relocated expansion sockets appear under the selected composition version alongside the BOM and assembly requirements. View toggles do not edit data or authorization.

## Market responses and calculations

Market-response `impacted_standards` and `impacted_products` sections show the linked target name and direction, a description with highlighted substitutions, and an expandable parameter table. Standard targets must have one of the two standard kinds; product targets may be internal or external. Existing response subjects/descriptions are still shown because their content migration is deferred.

Annual sales is a separate directly editable calculation dataset, not a foundation collection. The documentation viewer can show its guide and JSON, but Data browser, Timeline and Changes confirm do not provide a sales editor, forecast engine, aggregation report or authorization flow. Validate edits with `npm run validate:calculation`.

### External-product impact details

External products can show both **Impacted standards** and **Impacted products**. Each entry links its target, preserves the assessment date, displays the directed relationship, and presents Base assumptions, Relation to standard/product, and Commercial consequences. Key/value substitutions and expandable parameter tables work identically in both sections and in Changes confirm before/after details. Empty top-level descriptions are omitted; unique narrative belongs in specification chapters. Historical standard impacts without a relationship remain readable pending review. Market-response impact sections retain their separate direction/description model.

External-product impact headers show the relationship flag beside the parameter toggle: competes with (red), incompatible with (orange), extends (yellow), supports (blue), requires (green), implements (gray). Labels remain visible independently of color; entries without parameters show the flag without a toggle.

Manufacturing production-line details include a dated configuration selector. Each selection shows its technical chapters, a collapsed parameter table, equipment groups and operating constraints. The same renderer is used in Timeline, Data browser and the Details comparison in Changes confirm. Recipe records link to the shared line; selecting a configuration does not assert that its equipment has qualified every recipe or achieved its planned output.

## Manufacturing costs

The cost page reads calculation files directly and remains outside authorization. It uses nominal dollars for each June 15/December 15 snapshot, preserves dated compositions and shows software/service delivery costs with explicit units. Source fingerprints flag stale estimates. Search, offering filters, CSV export and cell breakdowns support review. See the [calculation guide](../data_calculation/MANUFACTURING_COSTS.md) for yield, inflation, scope and regeneration.

On Manufacturing costs, **RAM comparisons** opens a dated comparison of commercial and AION chip sources, complete modules and host-listed RAM populations. A cost cell also links to comparisons for its date. Alternatives preserve capacity and socket rules but still require electrical qualification; they do not replace the recorded BOM grid. AION chip manufacturing cost and its 15% markup appear as separate breakdown categories.

# Campaign timelines — contract 0.20.0

All live campaigns use the timeline schema. The old `process_id`, `presentation` and `marketing_content` variant is retired from the active schema; historical snapshots remain readable. Schema conversion is complete, while some campaigns still await structural rewiring from their old execution processes.

## Campaign structure

A campaign requires `id`, `title`, `objective`, `lead_actor_ids`, `period` and `marketing_steps`. `message`, `audience` and root `category` are optional. A child inherits its parent's category.

`period.start` and `period.end` are calendar values with year/month/day precision, or explicit `{value: null, precision: "unknown"}` boundaries. Event-valued boundaries are not accepted. Campaign dates do not move automatically when an associated process changes.

Each marketing step has:

- `id`: stable local identifier, unchanged when reordered.
- `number`: positive display number, unique within the campaign.
- `type`: nonempty activity label; there is no closed enum.
- `description`: activity and purpose.
- Optional `reference_id`: one event or process structurally owned by the step.
- `marketing_presentation`: blocks containing unique positive `number`, `description` and `parameters`.

A presentation block has no event ID. Parameters are exactly `{key, value}` (text or number) or `{key, ref_id}`. Keys are unique within a block, every key must be used and every `{key}` placeholder must resolve. No `ref_role` is stored. Parameter references are contextual, not structural ownership. Substitution is plain text and nonrecursive.

## Ownership and launch validation

Process steps can reference at most one event, process or campaign. Campaign marketing-step references own their children; process event-valued boundaries can also establish ownership. Inputs, outcomes, related-process links and specification parameters do not establish ownership. The retired event `process_ids` field is not available for new records.

Internal products' `launch_campaign_id` and `launch_event_id` are authoritative. Launch events must be reachable through the campaign's ownership and fit its period. `code/campaign-transition.js` explicitly permits the remaining campaigns' launches to stay under their existing execution process during rewiring. This is validation metadata, not visual ownership or a legacy campaign record. NCC 1978 already owns its launches directly and has no map entry. Arbitrary new campaigns must establish their own ownership.

Rewire atomically: set the marketing-step reference, remove prior structural ownership, update affected process steps/boundaries, and keep child category empty. A campaign must not directly own an event already owned by its subprocess. Remove a transition-map entry only when all relevant product launches are reachable through campaign ownership. Delete an obsolete execution process only after useful steps/outcomes are preserved and every incoming reference is addressed.

## Display

Campaigns have independent light-red timeline blocks and tracks. A marketing-step header has number, type and description on its first line; a referenced event/process name and date/start date appear on a second line when present. Presentation blocks read `parent-number.block-number [+] description` on one flowing line, with a bold number prefix and regular description text. The toggle appears only when parameters exist. References display as inline names without raw IDs in prose; expanded tables retain full values. Authored paragraph breaks remain meaningful, while embedded references do not create their own paragraphs.

Product-launch colouring and the derived Launched products list follow internal `product.launch_event_id` references, not event kind. Campaigns, processes and events remain independently authorized whole records.

## Historical conversion evidence

The original proposals and source coverage are in `data_storytelling/review_evidence/campaign-timelines/`. Later approved campaign reorganisations supersede their content and ownership. Do not treat original NCC durations, old session arrangements or deliberately absent step references as current instructions.

`tools/prepare-campaign-timelines.py` and `tools/verify-campaign-timelines.js` target that original baseline/cohort. Use current schema/graph validation and simulations of the actual new proposals for ongoing edits. Historical snapshots remain unchanged.

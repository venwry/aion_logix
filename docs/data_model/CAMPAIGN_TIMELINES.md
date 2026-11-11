# Campaign timelines — contract 0.17.0

Campaigns become independent dated marketing activities through twelve individual Changes confirm proposals. The deployed schema accepts either the legacy campaign or the new timeline campaign, never a hybrid. Approval converts one campaign and, where applicable, adds it beside its existing execution process in that process's parent. This deployment does not approve foundation content.

## New structure

A timeline campaign contains `id`, `title`, `objective`, `lead_actor_ids`, `period` and `marketing_steps`. Nonempty `message` and `audience` lists remain optional. A root campaign can have `category`; a child inherits its parent's category.

`period.start` and `period.end` are calendar values with day/month/year precision, or explicit `{value: null, precision: "unknown"}` boundaries. Event-valued boundaries are not accepted. Conversion resolves the old process's event anchors to their recorded dates without inventing precision. Subsequent changes to the old process do not silently move the campaign.

Each marketing step has:

- `id`: stable local identifier, unchanged when reordered.
- `number`: positive display-order number, unique within the campaign.
- `type`: meaningful activity label, such as preparation, presentation, demonstration, advertising, workshop, follow_up or review. The schema permits other nonempty labels.
- `description`: explanation of the activity and its purpose.
- Optional `reference_id`: one event or process structurally owned by this step.
- `marketing_presentation`: numbered presentation blocks, each with `description` and `parameters`.

A block describes part of the activity: an opening, an introduction, a live demonstration or a specific follow-up explanation. It has no event reference of its own. Parameters are exactly `{key, value}` (text or number) or `{key, ref_id}`. Narrative `{key}` placeholders explain each parameter's role; there is no `ref_role`. Keys are unique within a block, every key must be used, and every placeholder must resolve. Reference parameters are contextual relationships, not ownership. Text is substituted safely without interpreting HTML or recursively evaluating templates.

The renderer shows each step as a narrative section, using expandable parameter tables like technical specifications. Its first header line contains number, type and description. When `reference_id` exists, the second line identifies the referenced event/process and its date/start date. Each presentation block has no separate heading: it reads `parent-number.block-number [+] description` in the description font. The toggle appears only for blocks with parameters. Campaigns occupy independent light-red timeline blocks and duration tracks. Legacy campaigns remain combined with their execution process until converted.

## Transition and ownership

The current proposals deliberately omit every marketing-step `reference_id`. Existing events, subprocesses, boundaries and event memberships remain owned by the old execution processes. Parent processes receive a separate `steps[].campaign_id` entry; their original process step stays unchanged. A process step can identify at most one event, process or campaign.

Product-owned `launch_campaign_id` and `launch_event_id` remain authoritative. The temporary mapping in `code/campaign-transition.js` allows campaigns still undergoing conversion to keep launch events under their original execution processes while validating against the new campaign period. It creates no timeline nesting or foundation relationship. NCC 1978 now owns its launch events directly and has no compatibility-map entry. Arbitrary new campaigns must establish their own launch ownership. Missing ownership, multiple parents, cycles and out-of-period launch dates still fail validation.

Later rewiring must be atomic: set the marketing-step reference, remove the child's previous ownership links (including relevant event membership/boundaries), and preserve the child's inherited category. Do not directly own an event already owned by a campaign subprocess. Remove each compatibility-map entry only after all of that campaign's product launches are reachable through campaign ownership. Delete obsolete execution processes in a later reviewed change after checking every remaining reference.

## Conversion evidence

`data_storytelling/review_evidence/campaign-timelines/` contains the exact proposals and a source-item coverage audit. The proposals preserve useful claim-policy restrictions, embargoes, licensing distinctions and qualification requirements in marketing narratives. Historical acceptance labels, duplicate booth fragments and redundant timing imports are removed. This does not establish that a demonstration succeeded, a contract was signed or a future commitment was fulfilled.

The NCC 1978 source's 44-minute duration comprises nine timed Aurelia blocks totalling 37 minutes and the separate seven-minute BPI presentation; untimed technical sessions and questions receive no invented durations. Both existing BPI leadership appearances remain reviewable. Tandy's campaign retains an empty marketing programme, respecting the earlier request not to invent its presentation details.

Run `node tools/verify-campaign-timelines.js` before publication. It simulates each approval independently, all approvals together, reverse batch order and reverse sequential order using the real transaction code. It checks dates, unchanged ownership, parent additions, launch validation and all untouched foundation records. It writes no live data or authorizations. `tools/prepare-campaign-timelines.py --apply` prepares the queue only against the legacy baseline and refuses regeneration after conversion; retain evidence after approval.

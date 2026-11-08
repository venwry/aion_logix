# Product catalogue cleanup — phase 2

> **Historical documentation — not current rules, instructions or queue status.** Preserved from main at `606e3f1`; consult the [current documentation index](../README.md) and live storytelling JSON.

Contract **0.9.0** implements compatible schema, validation and application support for the [phase-1 migration map](product-catalogue-phase1/README.md), including the [CP/M cartridge clarification](product-catalogue-phase1/cpm-cartridge-clarification.md). This catalogue-cleanup phase is distinct from the wider project phases in `MULTI_PHASE_PROCESS.md`.

## Scope

The deployment introduces an empty `data_foundation/external_products.json`, extends the registry and consumers, and permits explicit paired product launch links. Existing product definitions, technical BOMs, events, campaigns, processes, authorization records and proposal contents are unchanged. No external identity is imported or authorized here.

Legacy product kinds, families and technical aliases remain accepted while their individual migrations are reviewed. Mandatory launch links for every product and global launch ownership cleanup are deferred until phases 5–7. A product that supplies launch links now must already satisfy their contract; migration compatibility is not permission to save inconsistent new links.

## Attribute contract

| Entity / field | Shape and validation |
| --- | --- |
| `external_product.id` | Required stable `external_product.*` ID. |
| `external_product.name` | Required nonempty display name. |
| `external_product.description` | Required nonempty descriptive commercial definition. |
| `external_product.specification` | Required array; may be empty. Each entry describes one direct relationship. |
| `specification[].no` | Required positive integer, unique within the record. |
| `specification[].description` | Required nonempty explanation of the specification. |
| `specification[].ref_id` | Required single, resolved foundation ID. Arrays and empty IDs are rejected. |
| `specification[].ref_role` | Required nonempty description of what the referenced object means here. |
| `product.launch_campaign_id` | Optional campaign reference; requires `launch_event_id`. |
| `product.launch_event_id` | Optional event reference; requires `launch_campaign_id`. |
| `product.offering_category` | Adds `peripheral` and `software_cartridge` to existing categories. Legacy values remain valid. |

External records deliberately have no embedded dates, authorization status, generic reference list or duplicate technical composition. Narrative facts without a direct reference belong in the description. Software implementation, hardware manufacturing, ownership and licensing can be described through separate role-labelled references. This permits the DRI software identity, existing CP/M software edition, existing agreement and Logix cartridge offering to remain distinct.

The validator checks reference existence, allowed types and numbering. Whether a relationship is semantically direct, and whether wording correctly represents a licence, remain author-review responsibilities. Schema validity does not establish those facts.

## Dataset registration and application

The filename is **`external_products.json`**; its envelope key, schema name, ID prefix and Changes confirm `record_type` are singular **`external_product`**. `code/model-contract.js` exports the shared filename mapping and path helper. The storytelling manifest records the filename exception in `foundation_files`.

The browser loader, data viewer, raw dataset links, server snapshot, GitHub reader/saver, validation tooling and generated schema documentation use that mapping. External records appear as a dataset in Data browser, support filtering and incoming references, and use the shared detail renderer for their four-column specification table. Timeline details can follow external subjects; the external record itself does not become a dated timeline event. Changes confirm can compare, add, revise and remove these records using the existing JSON/detail modes and whole-record authorization mechanism.

Generic foundation subject/scope references and campaign subjects accept external products. Technical composition targets remain base parts, devices, software editions and the existing permitted product/service references; a descriptive external identity does not replace an executable technical definition or physical BOM.

## Launch relationship validation

A product may share its campaign and event with other products. Its event does not have to equal the campaign's optional headline `launch_event_id`: a campaign may own several launches, including a conference side event.

When both product launch links are supplied:

1. Both references must resolve to the correct types. The campaign must reference an execution process, as before.
2. Ownership follows process steps, process `parent_process_id`, event `process_ids` and event-based process boundaries. Subjects, inputs and outcomes do not establish ownership.
3. The event must reach the campaign execution process through a single-parent chain. Conflicting owners and cycles on that chain fail validation; repeating the same owner through different fields is not a conflict.
4. Event time and campaign process boundaries must be known, and the event's entire precision interval must fit within the process envelope. Month/year precision is preserved; the envelope uses the earliest possible start and latest possible end, so it does not assert a more precise historical day.
5. The existing rule remains: an owned child has no category value and inherits its root category.

These checks run during normal model validation and before authorization commits. They apply to products that opt into the new links. Phase 2 does not invalidate existing unlinked products or silently reparent the Autodesk launch; that reconciliation remains recorded for a later phase.

## Review and rollout

Deploy frontend, schemas and saving backend from the same main revision. Contract 0.9.0 and the manifest must match; Render's existing build filter includes the changed runtime/schema paths. The application can browse the empty external dataset immediately. Later imports start Pending authorization, and revisions to existing records go through Changes confirm.

Grouped proposals must contain all inseparable reference changes. The backend applies the whole selected set before validating, allowing a new external identity and references to it in one atomic commit. Creating an external identity does not authorize the linked software edition, provider or agreement.

Phase 3 can now introduce reviewed external identities; subsequent phases can clean the catalogue, define launch links and reconcile ownership before enforcing the final strict model. No phase-1 classification decision is silently resolved by this schema deployment.

## Validation

Targeted tests cover strict external specifications, unresolved references, paired launch links, shared launches and side events, direct/nested/boundary ownership, conflicting parents, cycles, unknown dates and partial date precision. Backend tests exercise external additions with dependent event updates, atomic rollback, idempotent authorization, snapshots and the actual plural GitHub storage path. Browser tests cover external navigation, the role-labelled table, raw links, timeline Go Back, Changes confirm modes and product launch links.

Three pre-existing historical migration checks also fail against the unchanged baseline: one open issue still references retired `process.apple_compatibility`, and two phase-1B checks compare old migration dispositions/fingerprints with subsequently edited live data. They are outside this schema deployment; their historical evidence and current story records are preserved.

Release checks: model/review/server suites **64 passed**; browser suite **47 passed, two baseline failures**. The two viewer failures expect the retired `unallocated_reserve` clause field and the older “six active JSON files” description. Both were reproduced on unchanged commit `a0cf5b8`, as were the three historical migration failures above. Data validation, schema documentation generation and the application build pass.

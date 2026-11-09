# References: current authoring rules

A reference must explain a direct relationship. An ID appearing in prose, occurring earlier in time, sharing a campaign or belonging to the same product family is insufficient by itself. These are authoring and review rules; compatibility schemas still accept some legacy structures while existing records are migrated through Changes confirm.

## Events and processes

Prefer the narrowest meaningful field:

| Meaning | Representation |
| --- | --- |
| A directly required existing resource or implementation | `inputs[]`, usually `resource`, with an explanation. |
| A prerequisite constraint, interface or acceptance requirement | `inputs[]`, with `requirement` or `acceptance_criterion`. |
| A directly enabling predecessor event/process | An explained input using `event_id` or `process_id`. Use the nearest actual dependency. |
| An agreement governs the activity | The singular `agreement_id`; an input may explain a distinct enabling milestone without repeating the same agreement relation. |
| The activity delivers an object or implementation | `outcomes[]` with `deliverable` and a description of what is supplied. |
| It qualifies, improves or changes an existing object | An explained outcome such as `qualification`, `maturity_transition`, `decision` or `result`. |
| It decides or commits future work | A `decision` outcome identifying the scope where useful; do not call the promised product a finished deliverable. |
| An actor participates, or a place hosts activity | `participant[]` or `location_ids`, rather than general subject lists. |
| An event/process belongs to another process | Process steps/boundaries or the established ownership fields; inputs and outcomes do not establish ownership. |
| A loosely connected topic or background fact | Preserve useful prose; remove the reference. |

Top-level `subject_ids` is exceptional. Each retained reference needs a specific reason that cannot be represented more accurately above. Record that reason in proposal evidence or review rationale, not in a new foundation metadata field. References inside `inputs[].subject_ids` and `outcomes[].subject_ids` are useful because their enclosing type and description explain the relationship. Action-step references may remain when the step directly states what is done to or with the object and that reference is not already represented in the containing process’s inputs or outcomes. Remove redundant step subjects while retaining the action description. If a genuine delivery relationship is missing, add an explained outcome in the same reviewed proposal before removing its step reference. Avoid unexplained lists there too.

Do not convert every old subject into an input. Temporal precedence is not proof of necessity. Do not copy a predecessor's own dependencies into every later activity. Dependencies must not become circular.

Inputs can become available during a long process. Locate them at the appropriate stage or qualify the input's scope in its description. A later hardware handover is not a prerequisite for starting earlier software work. A future implementation under discussion is a decision target, not an already available resource. Preserve date precision and do not add dates to timeless technical definitions to force ordering.

Qualification concerns an existing object; it does not claim that the activity invented the technology. A pilot, acceptance criterion, demonstration or announced plan must not be rewritten as a successful qualification or unrestricted shipment. Authorization accepts the recorded account; it does not supply missing engineering evidence.

## Product, campaign and process relationships

| Relationship | Authoritative location |
| --- | --- |
| A Logix/AION product's initial launch campaign | `product.launch_campaign_id`. |
| Its launch event | `product.launch_event_id`. Multiple products can share it. |
| Campaign execution and timing | `campaign.process_id` and that process's dates/steps. |
| A process is responsible for delivering an offering | An explained outcome on that delivery process pointing to the product. |
| Work delivers a technical implementation | An explained outcome pointing to the device, software edition, base part, technology or capability actually delivered. |
| Later promotion, demonstration or third-party participation | A separately explained relationship; initial-launch links cannot replace it. |

Do not maintain reverse campaign/launch-event lists merely to repeat the product's authoritative launch links. Do not copy campaign product lists onto its execution process and each subprocess/event. A marketing execution process delivers marketing work; it does not create every product it promotes.

When public introduction is a distinct result of campaign execution, one explained `result` outcome may identify the offerings introduced. It must describe introduction, not design, manufacture or unconditional shipment. Keep this scope at the responsible process; preparation, press, developer and follow-up events describe their own work and immediate dependencies without repeating the catalogue. Product-owned launch links remain authoritative.

Story descriptions describe activities and their consequences. Repository filenames, import paths, authorization commentary and comparisons with the real historical timeline belong in editorial evidence, not event prose. Non-price entitlements belong in product specifications. Pricing information has no supported location in the current model: exclude it from specifications and all other product, event, process and campaign fields, including narrative mentions and placeholders. Do not move it into another dataset as a workaround. Regular Support’s existing 10% depot-repair discount is a specific retained author decision, not permission to introduce other pricing terms. Technical detail belongs in the canonical device or software edition, with activity references only where the detail is necessary to explain a dependency or result.

Place deliverables at the process accountable for supplying them. Parent summaries should not repeat each child's product list. A parent may reference a distinct integrated output. A milestone can record a separate qualification, acceptance or decision without claiming the same product was created twice. Product inputs are appropriate only for commercial packages that are actually required; engineering work normally needs the canonical device or software edition instead.

The same ID may legitimately occur in an input and an outcome when the meanings differ: an existing implementation is tested and its qualification result is recorded. Avoid a blanket uniqueness rule that would remove this distinction.

## Compatibility and migration

All current products have explicit launch pairs. The authoring rule requires them, but the active 0.11.0 schema still permits both fields to be absent for compatibility; the optional catalogue profile requires both. When present, the event must resolve through a single-parent ownership chain to the campaign execution process and fit its known period. A side launch can differ from the campaign's headline event. Current validation preserves source date precision.

Before removing a launch association, verify that its replacement is present and equivalent. If not, propose the new product links and deletion atomically, or retain a documented temporary exception. Never infer a launch solely from campaign inclusion. An announcement or conference demo may precede the actual release.

External products currently have no dedicated launch fields. Their releases, partner presentations and later promotions must not disappear because internal products have a launch contract. Retain an explained relationship, or propose a separately reviewed model extension when necessary. Do not invent launch dates or turn all external participation into a Logix product launch.

Campaign `subject_ids` remains available for meaningful later promotion and external participation. The accepted internal catalogue no longer needs it as a substitute for missing product launch pairs. Its existing schema is not permission to add loose links. Describe distinct promotion roles in the campaign content and review rationale; remove duplication when an equivalent canonical relationship exists. Historical decision snapshots keep their original references unchanged.

The UI's generic “Referenced by” section already derives reverse navigation. A dedicated derived “Products launched here” list is a possible presentation improvement, not a stored field or an implemented control to rely on today.

## Review checklist

For each reference, identify its exact role, the required input or changed output, its directness, and whether an existing field already records the same relationship. Review nested outcomes as well as top-level subjects. Document intentional removals and temporary exceptions in editorial evidence. Validate both the current graph and each proposed atomic result. A schema can check types and existence; semantic necessity still requires author review.

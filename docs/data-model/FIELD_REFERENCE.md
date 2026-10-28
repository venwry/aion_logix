# Schema field reference

Generated from foundation schema version 0.3.0. Authorization and provenance are external; historical schemas are archived separately. Objects reject undeclared fields; consult schemas for exact constraints.

## actor

| Field | Required | Type / allowed values |
| --- | --- | --- |
| `id` | yes | string |
| `kind` | yes | person, organisation, group |
| `name` | yes | string |
| `aliases` | no | array |
| `description` | no | string |

## actor_relationship

| Field | Required | Type / allowed values |
| --- | --- | --- |
| `id` | yes | string |
| `kind` | yes | employment, operating_role, affiliation, control, identity_assumption |
| `subject_actor_ids` | yes | array |
| `object_actor_id` | yes | string → actor |
| `period` | no | period |
| `established_by_event_id` | no | string → event |
| `description` | yes | string |

## agreement

| Field | Required | Type / allowed values |
| --- | --- | --- |
| `id` | yes | string |
| `title` | yes | string |
| `kind` | yes | founding, employment, licence, supply, distribution, development, cooperation, other |
| `party` | yes | array |
| `party[].actor_id` | yes | string → actor |
| `party[].role` | yes | string |
| `state` | yes | offer, negotiating, executed, terminated, unknown |
| `valid_time` | no | period |
| `supersedes_agreement_id` | no | string → agreement |
| `description` | no | string |

## assumption

| Field | Required | Type / allowed values |
| --- | --- | --- |
| `id` | yes | string |
| `kind` | yes | world_premise, policy, constraint, target, baseline_condition |
| `statement` | yes | string |
| `scope_ids` | no | array |
| `valid_time` | no | period |
| `exception_ids` | no | array |
| `equipment` | no | array |
| `equipment[].name` | yes | string |
| `equipment[].components` | no | array |

## campaign

| Field | Required | Type / allowed values |
| --- | --- | --- |
| `id` | yes | string |
| `title` | yes | string |
| `objective` | yes | string |
| `lead_actor_ids` | yes | array |
| `audience` | no | array |
| `message` | no | array |
| `activity` | no | array |
| `activity[].description` | yes | string |
| `activity[].event_id` | no | string → event |
| `activity[].process_id` | no | string → process |
| `claim_policy` | no | array |
| `launch_event_id` | no | string → event |
| `programme_id` | no | string → programme |
| `subject_ids` | no | array |
| `presentation` | no | object |
| `presentation.duration_minutes` | no | integer |
| `presentation.stage` | yes | array |
| `presentation.stage[].label` | yes | string |
| `presentation.stage[].duration_minutes` | no | integer |
| `presentation.stage[].description` | yes | string |
| `presentation.stage[].actor_ids` | no | array |
| `booth` | no | array |
| `booth[].name` | yes | string |
| `booth[].description` | yes | string |
| `booth[].call_to_action` | no | string |

## clause

| Field | Required | Type / allowed values |
| --- | --- | --- |
| `id` | yes | string |
| `agreement_id` | yes | string → agreement |
| `kind` | yes | equity, funding, rights, responsibility, qualification, term, other |
| `statement` | yes | string |
| `assertion_mode` | yes | commitment, proposal, target, established_fact |
| `actor_ids` | no | array |
| `conditions` | no | array |
| `effective_time` | no | date |
| `supersedes_clause_id` | no | string → clause |
| `equity` | no | object |
| `equity.company_actor_id` | yes | string → actor |
| `equity.beneficiary_actor_ids` | yes | array |
| `equity.percentage` | yes | number |
| `equity.basis` | yes | fully_diluted, issued, voting |
| `equity.allocation` | yes | individual, joint_unsplit, unallocated_reserve |
| `commitment_amount` | no | money |

## event

| Field | Required | Type / allowed values |
| --- | --- | --- |
| `id` | yes | string |
| `kind` | yes | founding, agreement_milestone, recruitment, launch, qualification, decision, arrival, activity, other |
| `title` | yes | string |
| `occurrence` | yes | planned, occurred, cancelled, unknown |
| `time` | no | date |
| `period` | no | period |
| `participant` | yes | array |
| `action` | no | array |
| `action[].description` | yes | string |
| `action[].actor_ids` | no | array |
| `outcome` | no | array |
| `outcome[].description` | yes | string |
| `agreement_ids` | no | array |
| `process_ids` | no | array |
| `narrative_period_ids` | no | array |
| `location_ids` | no | array |
| `subject_ids` | no | array |
| `conditions` | no | array |

## location

| Field | Required | Type / allowed values |
| --- | --- | --- |
| `id` | yes | string |
| `name` | yes | string |
| `kind` | yes | country, region, city, venue, facility |
| `parent_location_id` | no | string → location |
| `description` | no | string |

## narrative_period

| Field | Required | Type / allowed values |
| --- | --- | --- |
| `id` | yes | string |
| `title` | yes | string |
| `period` | yes | period |
| `display_order` | yes | integer |

## process

| Field | Required | Type / allowed values |
| --- | --- | --- |
| `id` | yes | string |
| `title` | yes | string |
| `kind` | yes | study, development, recruitment, transfer, qualification, preparation, other |
| `period` | no | period |
| `participant` | yes | array |
| `parent_process_id` | no | string → process |
| `programme_id` | no | string → programme |
| `step` | no | array |
| `step[].label` | yes | string |
| `step[].description` | yes | string |
| `step[].event_id` | no | string → event |
| `completion_state` | yes | planned, in_progress, completed, cancelled, unknown |
| `acceptance_gate` | no | array |
| `acceptance_gate[].description` | yes | string |
| `acceptance_gate[].evidence_event_id` | no | string → event |

## programme

| Field | Required | Type / allowed values |
| --- | --- | --- |
| `id` | yes | string |
| `title` | yes | string |
| `objective` | yes | string |
| `sponsor_actor_ids` | yes | array |
| `agreement_ids` | no | array |
| `deliverable` | no | array |
| `deliverable[].description` | yes | string |
| `deliverable[].subject_ids` | no | array |
| `acceptance_gate` | no | array |
| `acceptance_gate[].description` | yes | string |
| `acceptance_gate[].evidence_event_id` | no | string → event |

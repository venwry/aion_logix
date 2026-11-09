# Aion Logix — data model principles

These principles describe the current contract, version **0.9.2**, and the accepted authoring rules. Consult the [model guide](docs/data_model/MODEL_GUIDE.md), [reference rules](docs/data_model/REFERENCE_RULES.md) and [editing guide](docs/EDITING_GUIDE.md) for details.

1. Foundation JSON describes the fictional world and its technical definitions. Storytelling JSON describes author review, evidence and proposals. Calculation data is a separate layer. Never import old statuses, financial projections or storytelling chronology into a technical definition without the appropriate reviewed model.
2. Entities have stable typed IDs. Owned value objects remain nested; independently maintained or independently authorized entities have their own records. Dataset type and filename are mapped by the shared registry, including singular `external_product` in plural `external_products.json`.
3. Authorization covers the entire exact-content record, including nested objects. Missing or mismatched authorization is Pending authorization. References, elapsed time and visual nesting never confer authorization. Do not fabricate intended/achieved flags or approval hashes.
4. Proposed revisions preserve complete before/after snapshots. Inseparable reference changes and removals are one atomic review group. Existing foundation records change only through the authorized review workflow; newly imported records remain pending. Historical decisions and source snapshots are immutable.
5. Only events and processes own structured story dates. Preserve year/month/day precision and explicit unknowns. Technical version boundaries refer to dated carriers or remain unknown/open as allowed; do not invent dates to make a relationship fit.
6. References represent direct explained relationships. Use inputs for genuine prerequisites and outcomes for deliveries, decisions, improvement or qualification. Earlier chronology alone is not dependency. Avoid transitive predecessor lists and loose context links. Top-level event/process subjects are justified exceptions.
7. A promised future implementation is a decision target, not an existing resource or completed deliverable. A later-stage input need not exist at the whole process's start. A pilot, demonstration or qualification activity does not by itself establish a successful result or unrestricted shipment.
8. Products are Logix/AION customer-facing offerings. Devices, base parts and software editions are canonical technical definitions; external products are descriptive third-party commercial identities. Keep a licensed software implementation separate from the physical cartridge and commercial package that carry it. Do not infer OEM sales structures from parts.
9. Product launch campaign/event links are authoritative when populated. Remove redundant reverse launch lists only when equivalent replacements exist. Later promotion and external participation are different relationships. Marketing execution does not create every promoted product; delivery outcomes belong to the responsible process and should not be copied through the hierarchy.
10. Process ownership comes from explicit steps, boundaries and parent/membership fields, never from inputs or subject links. Maintain a single owner. Owned children leave category empty and inherit their root's category; reparenting and category cleanup form one coherent change.
11. Agreements own their clauses and govern rights and commitments. Financial commitments, budgets, ownership and expenditure remain distinct. An implementation responsibility label does not transfer software or hardware ownership.
12. Schemas reject undeclared fields and validate structural constraints. Semantic directness and evidence still require author review. Obtain approval for schema extensions not already authorized, and deploy registry, consumers, tests and documentation together. Compatibility is not permission to create new ambiguous references.
13. Annotations and refinement feedback preserve immutable revision chains. A revised proposal has a new hash and requires fresh review. Preparing a proposal does not resolve its annotation; approval resolves only the unchanged current open revision.
14. `docs/` and `docs/data_model/` document current organization, behavior, rules and schemas. Historical storytelling activities and superseded guidance belong in `docs/archived/`. The existing legacy evidence archive remains immutable. Archived statuses and instructions are not current authority.
15. The current model does not support pricing information. Do not put prices, fees, discounts, price histories or pricing placeholders in specifications or any other field of products, events, processes or campaigns. Do not relocate them into another record type as a workaround; pricing requires a separately designed model.

```mermaid
flowchart LR
  Foundation[Foundation records] --> Join[Join by ID and content hash]
  Review[Storytelling authorization] --> Join
  Join --> UI[Timeline and browser]
  Proposal[Pending complete proposals] --> Compare[Changes confirm]
  Compare --> Validate[Atomic validation]
  Validate --> Commit[Author-approved GitHub commit]
  Commit --> Foundation
  Commit --> Review
```

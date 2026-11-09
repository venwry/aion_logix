# Catalogue validation

The current foundation contract is **0.9.2**. The accepted catalogue consists of customer-facing offerings with explicit launch campaign/event links, commercial categories and providers. Chips, technical aliases and artificial families are not internal products; technical definitions live in base parts, devices and software editions. A commercial launch does not establish shipment readiness or date every technical revision.

## Checks and their limits

| Command | What it establishes |
| --- | --- |
| `npm run validate:data` | Active schema, typed references, composition and launch relationships, current authorization structure and feedback history. |
| `npm run validate:catalogue` | The additional strict product profile against the live foundation. |
| `node tools/validate-foundation.js --complete` | Whether every current foundation record has exact-content authorization; it can fail while referenced definitions remain pending. |

The [strict product profile](../../schemas/profiles/catalogue-product.schema.json) requires offering category, nonempty providers and both launch links; limits product kinds to computer, hardware, software, bundle and service; rejects family links and product-level technology lists; requires delivery compositions for non-services; and checks semantic specification labels and nonblank descriptions. The accepted catalogue passes this check.

The profile is still **opt-in**, not a saving-service or deployment gate. The active product schema retains compatibility with older record shapes. Do not confuse an accepted authoring rule or an optional check with mandatory runtime enforcement. Promotion requires a coordinated schema, registry, consumer, test and generated-documentation change; the review queue records that remaining implementation decision.

Graph checks resolve product launches through single-parent ownership to a campaign execution process and check its period. Shared launches and side events remain valid. Ordinary validation is not an exhaustive global chronology or physical-engineering proof. The closeout audit additionally inspected all current parent/child date bounds and raw legacy identifier strings. Unknown technical dates, quantities and resource limits remain allowed where explicitly modeled.

## Review evidence

Technical-fact migration needs a corresponding canonical field, not merely an equal scalar elsewhere. Preserve qualifications, explicit unknowns, conditional supply, pinned child versions and commercial entitlements. Any proposed composition-version renumbering must check live version references and retain the old snapshot.

The live queue is `data_storytelling/change.json`. Concrete proposals contain complete before/after records; Discussion entries contain problems and findings without edits. The latter accept remarks and cannot be authorized. Audit inventories under `data_storytelling/review_evidence/` identify their source commit and check scope; their counts are historical snapshots, not permanent catalogue-size rules.

Phase-specific verifiers are historical regression tools with pinned expectations. Use the ordinary validators for ongoing work and the verifier associated with the active proposal set for approval simulations. The superseded phase-7 walkthrough is [archived](../archived/CATALOGUE_PHASE7_VALIDATION.md).

Authorization accepts exact content; it does not approve referenced records, prove a qualification result, certify historical sourcing or make forecasts reproducible. Non-quantitative agreement values may intentionally be null. An internal assembly may have no manufacturer ordering code. Commercial pricing has no general model; Regular Support’s existing 10% depot-repair discount is an explicit retained author exception. Manufacturing costs, investments and observed stock-market data have separate meanings.

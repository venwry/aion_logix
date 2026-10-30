# Phase-1 migration audit

Source: `venwry/vs_edu1` at `dac733770d8e622d5619bd84bc9d21db6c7ec7ab`. All 21 authoritative JSON files were recursively inspected. The source repository was not modified.

**Migration draft, not confirmed canon.** Every scalar or empty-container leaf has an explicit mapped, merged, split, deferred or excluded disposition. More-specific JSON Pointers override ancestor rules. This coverage check prevents silent unclassified input; it does not prove every semantic ambiguity has been resolved.

Validated 3491 provenance pointers against the pinned source. The approved phase-1 schemas are unchanged.

## Output records

| Dataset | Records | Pending | Speculation |
| --- | ---: | ---: | ---: |
| `actor.json` | 45 | 45 | 0 |
| `actor_relationship.json` | 7 | 7 | 0 |
| `agreement.json` | 19 | 18 | 1 |
| `assumption.json` | 32 | 27 | 5 |
| `campaign.json` | 11 | 11 | 0 |
| `clause.json` | 103 | 102 | 1 |
| `event.json` | 145 | 115 | 30 |
| `location.json` | 11 | 11 | 0 |
| `migration_map.json` | 2273 | 2273 | 0 |
| `narrative_period.json` | 9 | 9 | 0 |
| `process.json` | 32 | 32 | 0 |
| `programme.json` | 13 | 13 | 0 |
| `reconciliation_issue.json` | 22 | 22 | 0 |
| `review_decision.json` | 0 | 0 | 0 |
| `source.json` | 34 | 34 | 0 |

## Source coverage

Counts below are scalar/empty-container leaves, not entity counts. Financial/technical source data remains in the pinned repository for later phases; it is not copied into artificial phase-1 entities.

| File | Mapped / merged / split | Deferred | Excluded | SHA-256 of source file |
| --- | ---: | ---: | ---: | --- |
| `assemblies.json` | 0 | 0 | 3 | `d7e3fe3bffd0d2df4852ca885352d6d57800562a90afe8f27787907a93a6f367` |
| `campaigns.json` | 674 | 111 | 14 | `8d77bee84987c949dad043d5fca46156ce9af3be6d5a6a2fd7f2cb6834f714fd` |
| `components.json` | 1682 | 4305 | 2 | `b32f224ca6dff246cf70ffcc2eec237bcf9c9c609d48854a5ffa927c1ba04328` |
| `contracts.json` | 591 | 0 | 2 | `9603b2aa547237fac3ca3abc6e4afa8d09f719ff8c6ab14f4f4570d64e3a0514` |
| `cost-inputs.json` | 0 | 846 | 2 | `4c0135dd65fafe2b913400e2a945a8a1475b8806dcd0086a7e33107dfd05d066` |
| `demand-inputs.json` | 1 | 942 | 2 | `e4d32ffbe95b65c8098731861d5c9ebed8f6ae55f59160ff343599d6d4cf056a` |
| `devices.json` | 217 | 6243 | 2 | `3ed51d23e6cb1485a86e21aeaa117d35e7090e354ae4637337585913467051b5` |
| `ecosystem-inputs.json` | 5 | 292 | 2 | `18546d45335b473003eb85b498cde332a0ed8cf0342d64de8df914cf5acb88b3` |
| `events.json` | 2784 | 266 | 2 | `ffd7bdc5ad9a383926e28fd70ef51f4e1315ed4c54e34dfa61a78552d752ebd9` |
| `investment-inputs.json` | 0 | 107 | 2 | `db909dfeb08fdff6e227dd5d2b460b931b7543fcd241ae6010e5f8a67c41d4fc` |
| `manufacturing-processes.json` | 0 | 283 | 2 | `be1af43c466180d36096a21557c4e669b496b87bcfd3d8e9241aefd14e1fc202` |
| `product-catalog.json` | 126 | 5122 | 2 | `7c7c58656e6c2145acc6fb507af896e05f5985eb77a86cdbe0d3776ebb16add6` |
| `programmes.json` | 56 | 229 | 6 | `197328c952efc9800a178517587f58d7df930f51d96d0142bc2777a1c09a1949` |
| `retired_assemblies.json` | 0 | 0 | 917 | `0072ff4dfdef46f025bbda29b034e2da3284149ce1488a52335e28fb4d3b3fb8` |
| `services.json` | 76 | 124 | 2 | `fa823b884f17ca3888c2496e0704a56919adb95b670ea5e43e16946eddbe6b93` |
| `site.json` | 0 | 0 | 1076 | `f4b1b338e9633fb8e8a541003ea1e767e0a7873dd996d657b6cc18c91a2e28e6` |
| `software-editions.json` | 130 | 2656 | 2 | `5036fcd025ff6eb54754442a839d4ce0d6b23f309110991118be0a02b054d298` |
| `sourcing.json` | 15 | 8 | 2 | `e72f94a029e3e8901991b5a1b143c52776739f8973dfda91a9b626c484d707a9` |
| `standards.json` | 56 | 1609 | 2 | `afacc1ea1abf05bde22a2c2ca38e04b493f0b7280e4bfb95875e86f1524a88b9` |
| `timeline-structure.json` | 614 | 54 | 20 | `476169cd8be623d980bca208e1c3dba56e806ab0b25ff0252f09846f31445dce` |
| `world.json` | 292 | 14 | 23 | `5e955866e9d04d59af0f2359d2e1eb2bcb2d5733c6e7c6bdae39890371622fd2` |

## Reconstruction outcomes

- All 145 legacy events have explicit dispositions: 144 remain timeline events; the 2025 origin is retained as an assumption. One January 1982 Autodesk organising meeting was recovered from an indirect mention, giving 145 target events.
- Existing actor identities are preserved except the market segment `actor.customers`, which is deferred to phase 4. Named vendors, a proposed performer, Mike Riddle and Harvard are recovered without inventing contracts or unnamed people.
- All 16 legacy contract sections are assessed. IBM project targets become speculative assumptions rather than a fictional contract; Apple extension responsibilities join the existing Apple cooperation agreement. Additional BPI, MPI, Autodesk, casting-proposal and Apple–Peachtree arrangements are reconstructed with appropriate state/status.
- All 15 top-level processes and four Harvard subprocesses are retained. Additional sustained activities are extracted from campaign schedules and programme descriptions. Inferred windows are explicitly marked for review.
- All ten campaign identities are preserved; the international January 1982 campaign is recovered from its promotional process. Product definitions, budgets and demand multipliers remain deferred.
- Actor descriptions no longer duplicate equity or dated history: their source fragments corroborate canonical agreements, events and premises.
- Phase-1 narrative is extracted from technical-side collections using precise source fields. Shared product introduction windows corroborate existing milestones, not hundreds of invented shipment events.
- Historical URLs are indexed as unverified source citations. Missing sources and uncertain dates remain review issues. No financial model or frozen baseline was recalculated.

## Open reconciliation issues

| ID | Subject |
| --- | --- |
| `reconciliation_issue.bpi_offer_equity_offer_2_basis` | Equity semantics require clarification |
| `reconciliation_issue.aionix_agreement_equity_4_basis` | Equity semantics require clarification |
| `reconciliation_issue.autodesk_signatories` | Autodesk January signatory capacity |
| `reconciliation_issue.apple_compatibility_timing` | Process timing is relative or unspecified |
| `reconciliation_issue.artemis_engineering_timing` | Process timing is relative or unspecified |
| `reconciliation_issue.harvard_source` | Missing Harvard date citation |
| `reconciliation_issue.campaign_comdex1980_scope` | Campaign detail is minimal |
| `reconciliation_issue.campaign_ncc1981_scope` | Campaign detail is minimal |
| `reconciliation_issue.campaign_ncc1983_scope` | Campaign detail is minimal |
| `reconciliation_issue.autodesk_development_interval` | Reconstructed programme interval |
| `reconciliation_issue.bpi_qualification_interval` | Reconstructed programme interval |
| `reconciliation_issue.team_development_interval` | Reconstructed programme interval |
| `reconciliation_issue.bpi_offer_not_closing` | BPI proposed ownership is not a closed investment |
| `reconciliation_issue.academy_service_start` | Academy formation versus service availability |
| `reconciliation_issue.dri_paid_in` | DRI capital commitment versus payment evidence |
| `reconciliation_issue.aion_tech_ownership` | Aion Tech ownership and financing unspecified |
| `reconciliation_issue.sgs_terms` | SGS targets and negotiable economics |
| `reconciliation_issue.bpi_investment_wording` | BPI investment wording versus unclosed proposal |
| `reconciliation_issue.capacity_reserve` | Different capacity headroom assumptions |
| `reconciliation_issue.forecast_adoption` | Legacy forecast narrative needs explicit adoption |
| `reconciliation_issue.campaign_prep_dates` | Aurelia preview window exceeds event month |
| `reconciliation_issue.aionix_relocation_date` | Department relocation date unspecified |

## Deferred scope and limits

- Phases 2–5 retain product definitions, BOMs, fabrication parameters/yields, investments, prices and forecast coefficients. Legacy prose may mention these quantities as context; it does not establish a new numeric financial model.
- Missing equity basis is not guessed. The DRI allocations are structured; Gary’s 8% Logix grant and BPI’s proposed 33% remain explicit clause statements plus review issues until the basis/beneficiary can be resolved.
- A confirmed schema design is not author approval of the extracted story. All baseline candidates remain pending, while identified legacy market-response/financial forecasts remain speculation.
- Completeness is intentionally blocked pending author review and issue resolution. Exhaustive semantic correctness cannot be established merely by JSON validation or leaf-disposition coverage.
- Ancillary JSON under schemas, tests, generated models and baselines is not an additional authoritative source layer. It is retained unchanged and classified as contracts/fixtures/calculated output/archive, rather than migrated as story facts.

## Reproduce and verify

```sh
python migration/migrate_phase1.py --source /path/to/vs_edu1 --output /tmp/phase1-reproduction
node tools/validate-model.js /tmp/phase1-reproduction
python migration/audit_phase1.py --source /path/to/vs_edu1 --data /tmp/phase1-reproduction --report /tmp/phase1-audit.md
npm run test:model
npm run test:migration
```

The migrator refuses an existing output directory to protect future author edits. It also rejects a different source commit or modified source data. A reproduction is a migration snapshot, not an instruction to overwrite subsequently reviewed canonical data.

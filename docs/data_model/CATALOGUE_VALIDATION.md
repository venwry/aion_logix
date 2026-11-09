# Catalogue validation

The active foundation contract remains **0.9.2**. `npm run validate:data` validates the live graph and storytelling layer. It permits transitional catalogue records so that pending Changes confirm proposals can be reviewed and saved independently.

`npm run validate:catalogue` applies the additional, opt-in [product profile](../../schemas/profiles/catalogue-product.schema.json) to the current foundation. It does not read proposals as accepted data or modify any file. A failure can therefore identify a pending migration rather than a broken application. This profile is not wired into the saving service or the normal deployment gate.

The profile requires every product to have a commercial category, at least one provider, and both launch references. Product kinds are limited to computer, hardware, software, bundle and service. Family references and product-level technology lists are disallowed. Non-service offerings need a delivery composition; a technical identity link alone does not define what the customer receives. Service offerings have the service category and can describe their scope through the existing specification or service-definition fields.

Specification types are semantic lower-case names, such as `package_scope` or `support_entitlement`, rather than imported paths such as `features[1]`. Descriptions must contain explanatory text. The lexical check cannot decide whether an entry is commercial or technical: review must still put implementation facts in devices or software editions and preserve meaningful package information in products.

The check also runs the ordinary graph validator. This verifies reference resolution, composition versions, campaign process ownership, temporal containment and child-category inheritance. Shared launch events and campaigns remain valid. An explained later promotion may reference an existing product even when its original campaign is different.

Technical-fact migration requires evidence linking each removed field to the corresponding canonical field, not merely to an equal scalar elsewhere. Qualification conditions, unknown quantities and boundaries must survive. Composition version numbers must increase; a migration that renumbers a revision must first check that no live reference pins that revision and retain its prior snapshot.

## Review and activation

The catalogue closeout verifier, `node tools/verify-catalogue-phase7.js`, reads its immutable audit and the current queue or saved decisions. It checks individual, batch and sequential approvals in memory, tests the proposed result against the strict profile, and verifies preserved technical facts and source fingerprints. It never writes authorizations. Its expected counts describe that migration baseline, not a permanent constraint on catalogue growth.

After the data proposals are authorized and saved, run `npm run validate:catalogue` on the resulting main branch. Only after it passes should the profile be promoted into the runtime contract, with the registry version, consumers and generated documentation updated together. A pending proposal is not a reason to activate a stricter live schema early.

This is structural and reference validation, not proof of shipment readiness, complete technical qualification, a complete price model or exhaustive narrative consistency. Commercial pricing is outside the current offering model. The author explicitly retained Regular Support’s existing 10% depot-repair discount; treat that as a specific author decision, not permission to introduce other price fields or terms. Manufacturing costs, investment budgets and observed market data have different meanings and are not removed by a retail-pricing text rule.

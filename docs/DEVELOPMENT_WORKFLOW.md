# Development and review workflow

The repository develops a reviewed story and its technical definitions before relying on derived economic assessments. This workflow describes responsibilities and prerequisites, not completion of a historical migration plan.

1. Inspect current foundation, schemas, pending proposals and the latest annotation/review revisions. Use historical material as evidence, never as current instructions or a source of authorization.
2. Establish the intended model and direct relationships. Separate story changes, technical definitions, schema/application work and calculation work. Follow the [reference rules](data_model/REFERENCE_RULES.md).
3. Obtain schema-extension approval when it is not already covered by the user's instructions. Deploy schemas, registry, consumers, documentation and checks together. Compatibility support may precede reviewed data migrations.
4. Prepare complete before/after proposals for existing records. Group inseparable changes and removals; use dependencies for genuinely separable prerequisites. Import new records as pending only when authorized to do so. Never refresh authorized hashes merely to make validation pass.
5. Validate the unchanged current graph and the proposed results, including independent approval order where supported. Publish authorized implementation work and pending proposals to the agreed main branch. The author reviews and saves content authorization in the application.
6. Preserve decisions and source snapshots. An amended proposal is a new hash and must be reviewed again. A proposal is not approval and does not resolve an annotation merely by existing.

Story history, actors, agreements and activity establish context. Offerings, technical specifications, BOMs, manufacturing capabilities, ecosystem responses and economic inputs provide distinct modelling layers. Iterate between them when evidence requires; an older phase number is not a barrier to correcting earlier work.

Annual sales records are implemented in `data_calculation/annual_sales.json`; edit them directly without Changes confirm and run `npm run validate:calculation`. They record product, year, geography, segment, units, basis and optional ranges/scenarios. No forecast engine or sales-report UI is implied. Other calculation models for market coverage, costs and ROI still require separate design. Accepted story changes can invalidate dependent assessments. Versioned results and automated invalidation are design goals unless explicitly implemented; do not present them as existing application behavior. Partial exploratory estimates must remain identified as provisional.

Current editorial tasks live in `data_storytelling/change.json`, feedback files and `reconciliation_issue.json`. Use non-authorizable Discussion entries for unresolved decisions and complete proposals for supported edits. Archived task descriptions can contain retired IDs or obsolete assumptions; archiving does not resolve those issues. Follow the [editing guide](EDITING_GUIDE.md) for concrete commands and publication checks.

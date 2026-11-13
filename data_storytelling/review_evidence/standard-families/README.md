# Standard-family proposal revision

The author accepted the distinction between core standards, optional extensions, platform profiles and implementations, and asked to update the existing proposals.

`queue-before.json` preserves the preceding proposal queue. `proposals.json` contains the revised three actionable proposals and one discussion. `coverage.json` maps source chapters and retired IDs to their canonical destination. The before snapshot for the affected qualification discussion is preserved separately.

No foundation record or authorization history is modified. An editorial discussion's child-ID references are redirected so that it stays valid when the consolidation is approved. The eight absorbed classification proposals are removed from the current queue; the existing root IDs are retained for the revised proposals.

The proposal uses the existing chapter schema and narrative chronology. No temporal schema, new version numbers or unsupported release claims are introduced. Full technical content is retained with scoped interpretation; implementation-specific requirements remain examples or qualification targets, not universal claims about the standard.

Run `node tools/verify-standard-families.js`. The design and review grouping are in `docs/proposals/STANDARD_FAMILY_CONSOLIDATION.md`.

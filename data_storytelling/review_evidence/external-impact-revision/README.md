# External product impact revision

Baseline: `f78df4f0e893c5b5a34785cbfcf60646bff10b6f`, refreshed after independent peripheral approvals. This review updates 17 pending proposals (198 external products) and adds 14 proposals for already approved peripherals. Together they cover 212 records, with 107 product impacts and 75 standard impacts. Foundation records, authorization decisions, review feedback and previous evidence remain unchanged.

## Model and display

External products gain `impacted_products`, with the same dated three-part narrative and local key/value parameters as `impacted_standards`. `product_id` targets either an internal or external offering; `standard_id` continues to require a software/hardware standard. Each proposed impact specifies `relationship` from the six requested enum values. The direction runs from the external product to the target. Product impacts require the enum; approved legacy standard impacts temporarily remain valid without it, so publishing schema support does not bypass author review. New/revised standard entries must supply it.

Both sections display target name/date, relationship, base assumptions, relation to the target and commercial consequences. Specification rendering remains unchanged. Unique description content moves into specification; repeated identity/host summaries are removed and the top-level description becomes empty.

## Evidence and limits

`assessment.json` records the proposed after-state, relocated chapters, omitted relationships, canonical comparison IDs, accepted source findings and limitations. `search-log.json` records individual searches for all 200 historical peripherals. Its candidate URLs are discovery pointers, not assertions that every result verifies the product. `baseline.json` preserves the original pending queue and protected-file hashes. Earlier evidence under `../external-peripherals-1979/` is retained as history, not rewritten.

Manufacturer manuals, period advertisements and Autodesk's founder correspondence inform the comparisons. Historical product lineage is separated from fictional AION/Logix ports and cooperation. Important corrections include:

- Disk II can support an incremental Apple II upgrade through the Logix adapter's separate Disk II path; it does not become a FlexiBUS device.
- Native disk controllers compete only as part of complete drive/controller/firmware configurations. S-100 membership does not establish disk-format compatibility.
- Serial terminals and ASCII keyboards do not implement the TUI application contract. Console competition is scoped to complete configurations.
- Modems, instrumentation interfaces and expansion backplanes do not automatically substitute for the recorded FlexiBUS device classes.
- Autodesk's historical 8086 C and Z80 PL/I work does not establish the fictional ERA/AIONix port. Historical SSG CP/M material does not establish fictional native AION editions.

Some obscure models have only period catalogue pointers, inconclusive identity searches or later manual revisions. Such uncertainty is retained in the evidence. No later capability is backdated, no absent compatibility is invented, and no market-share or sales result is claimed. These proposals reassess scoped product/standard effects; they do not certify every inherited historical specification. Annual sales remain unchanged.

## Verification and reproduction

Run `python tools/prepare-external-impact-revision.py` only against the recorded baseline. It preserves pending proposal identities and before snapshots and refuses stale snapshots. The script is a review migration, not a general-purpose synchronizer.

Run `node tools/verify-external-impact-revision.js` to simulate each proposal independently and all together, reverse approval order and retry approved requests. It also validates the resulting catalogue and checks protected foundation/authorization/feedback hashes. Model/server and browser tests cover both target types, invalid references, enum values, dates, parameters, rendering and Changes confirm previews.

Before publishing, fetch main and reconcile new author decisions rather than restoring an outdated queue. All actual record conversions require approval in Changes confirm.

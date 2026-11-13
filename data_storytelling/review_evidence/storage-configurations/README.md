# Artemis and Athena storage proposals

Baseline: `f77bc0f` on main, fetched before preparation. Foundation records and authorization history remain unchanged. Four Changes confirm proposals cover 36 complete records; dependent proposals declare the shared MiniScribe definition prerequisite.

- **Remove Budget Colour Office:** delete `product.artemis_budget_128` and its specific launch claims in the 1980 event/process. Preserve Budget Hard-Disk Office. Its redundant-description discussion finding is removed from the queue because the concrete removal now handles it; the original discussion is preserved in `baseline.json`.
- **Define MiniScribe 4010:** supplier actor, purchased mechanism, reusable drive/cabling/mounting assembly, and host compatibility. Retain the Seagate ST506 for historical use. Remove the controller's timeless commercial statement that standard Artemis does not bundle an HDD; product composition owns that fact.
- **Revise Artemis:** 18 retained offerings, including every computer in multi-computer packages. New storage revisions start at `event.ncc82_graphics_mouse`, 1982-06-07; Office Professional begins there already. Each host has one FDD and one MiniScribe 4010 HDD. Preserve older versions except the explicit Accounts revision-2 correction to the standard AIONix cartridge, inherited by revision 3. No retroactive HDD replacement at the 1980 or 1981 launches.
- **Revise Athena:** author confirms Athena PRO means Athena Server. Regular Athena uses MiniScribe 4010; Server uses Quantum Q540. Existing products already supply one FDD and one HDD, so their product compositions remain untouched. Update canonical drive assemblies, host sourcing requirements, engineering assumptions and premiere prose. Retain the unused Rodime part; no deletion was requested.

The author explicitly accepts lower effective capacity: MiniScribe 4010 is recorded as **10 MB unformatted**, Quantum Q540 as **approximately 43 MB unformatted**. Do not infer usable capacity from the model name. Controller geometry, defect handling, timing, power/spin-up, mounting, cabling and complete-system qualification remain open. Compatible socket lists do not certify successful integration.

## Procurement assumptions

The supplied prices are nominal USD OEM benchmarks, not retail prices or foundation attributes:

- MiniScribe 4010: **$625 at 1,000 units**. The earlier research identified this in the October 1982 Digital Design survey. Applying it from NCC 1982 is an explicit scenario assumption, not evidence of June 1982 contracts or volume supply.
- Quantum Q540: **$1,485**, identified in earlier research as 1983 DISK/TREND OEM pricing at **100 units**, reproduced in the 1984 Quantum guide. Do not silently call it a 1,000-unit price or verified May delivery.

The quoted benchmark is held constant in nominal dollars after the proposed introduction until reassessment. No CPI duplication or additional volume discount is applied. The cost patch uses the existing `market_series` model and its existing source, part and operation formats. It adds no schema structure. Sources and limitations accompany each assumption.

`cost-assumption-patch.json` stages these calculation-only entries because live calculation validation rejects references to unapproved new parts. After approving all four proposals, apply the patch and regenerate current costs with:

```sh
node tools/apply-storage-cost-assumptions.js --apply
```

The helper requires the exact proposal approvals, removes the deleted product's operation, preflights the projected costs, updates calculation assumptions, regenerates both manufacturing costs and RAM scenarios, and validates calculation data. It never authorizes foundation data. The standard generator will report missing allowances if run after approval but before this patch is applied.

## Verification

```sh
node tools/verify-storage-configurations.js
```

Checks exact before snapshots; independent approvals with prerequisites; combined and reverse-order approvals; idempotent retries; strict catalogue validity; unchanged pre-NCC compositions except the requested cartridge correction; per-host drive counts in every revised Artemis offering; unchanged Athena product compositions; projected manufacturing calculation validity; and unchanged live foundation, authorization and cost assumptions. Existing calculation outputs were stale at the fetched baseline; regeneration changed only their source revision/hash and generation timestamp, not the estimates. It uses the real transaction code entirely in memory.

`baseline.json` retains the original discussions and protected-file digests. `summary.json` identifies the scope and proposal hashes. `verification.json` records the successful focused check.

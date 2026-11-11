# CAP and AION Software in London — review evidence

Prepared against main `86b5547` for the author's request to propose all relevant scenario changes. These are fictional-world proposals, not assertions that the historical CAP transaction occurred. Foundation and authorization history remain untouched.

## Review order

1. **CAP / London 1:** 17 record operations covering continuing company identity, London locations, Alex and the shareholder group, the acquisition agreement and signing/closing milestones, the 1974 company/DRI chronology, the incorporation process and Letwin's revised equity agreement. This atomically replaces the obsolete Rovsing records and reconciles the ownership terms.
2. **CAP / London 2:** five records aligning Letwin's recruitment/home base and the later AIONix department relocation. Requires 1.
3. **CAP / London 3:** five records protecting product-programme capacity in the CP/M and BPI agreements, associated milestones and Aurelia partnership process. Requires 1.

The three proposals have no overlapping record snapshots. They can be selected together or saved in this order. Each dependent group was tested with its prerequisite and following its prior approval. Compact JSON sizes are approximately 40 KB, 16 KB and 44 KB respectively; these are proposal sizes, not total server memory estimates.

## Story choices requiring review

- `actor.aion` represents the continuing CAP legal entity, renamed AION Software. CAP is an alias, not a second acquired subsidiary or a newly incorporated Danish company. Existing downstream product ownership references therefore retain their IDs.
- The 23 November 1974 event establishes Logix and Labs and a UK software-business plan. It no longer asserts three incorporated companies or nine vacant leadership positions. December's DRI founding remains unchanged in date and ownership.
- The replacement signing event keeps January 1975 month precision. A new January closing, explicitly before the existing 12 January CP/M agreement, is proposed to make the operating company and CEO available for that agreement. Neither the precise day nor completion is inferred from the former Rovsing signing. This added completion is an explicit new story decision.
- Adam receives 70% at closing; existing CAP holders collectively retain 30%. Alex's individual holding remains unresolved within that block. The share register, permissions and corporate commitments must be settled as closing conditions. No unsupported historical CAP valuation or personal shareholding has been inserted.
- The prior chat's £1 million valuation illustration and cash multiples are not canonical acquisition figures. The agreement distinguishes company subscription proceeds from seller consideration and requires a negotiated financing schedule. Funding amounts remain unspecified.
- Letwin's previously proposed transfer of existing Adam shares is replaced by an option over newly issued shares, preserving four annual service vesting instalments. A fixed award of one nineteenth of pre-award capital produces 5% after full exercise. In the absence of other capital changes the conditional split is 66.5% Adam, 28.5% former CAP holders, 5% Letwin. Vesting is not exercise or issuance. The old Rovsing 5% award disappears.
- Alex's continuing initiatives are subject to a protected product budget, named technical leads and milestone reviews. The 15–25-person range is a staffing planning assumption, not an assertion of CAP's historical available capacity. No compiler qualification or completed delivery is inferred from hiring or acquisition.
- Existing DRI ownership of the accepted CP/M TUI implementation and AION's perpetual reuse rights are preserved verbatim. The earlier suggested alternative of AION retaining all TUI ownership is not silently substituted for the repository's accepted agreement.
- The 1975 agreement commits AION to providing capacity for later BPI cooperation; BPI becomes bound only under its existing 1977 agreement. Alex allocates staff, and Letwin coordinates systems interfaces only after joining in June 1977.
- AION Labs remains in Cambridge. No group CEO, new holding company, Tech ownership settlement or Logix share change is introduced. London headquarters does not imply changing manufacturing locations or sales geography.

## Coverage and preservation

Searched all foundation records for Rovsing, Copenhagen, Denmark, Letwin and AION Software, and inspected references to the company-founding event. After simulation, no non-location foundation record retains the abandoned Danish acquisition or home-base claims. The now-unused Denmark and Copenhagen geographic records remain: they contain no acquisition or company-location assertion and do not need deletion.

Two stale leadership findings in the existing qualification discussion were updated to refer to the pending scenario and remaining unnamed appointments. No discussion was marked resolved. Existing reviews, annotations and decision snapshots remain immutable. The unrelated pending NCC 1980 proposal was tested together with the CAP packages and has no overlapping targets.

No actor-relationship records are added or edited. The existing Letwin recruitment relationship only records Adam's recruitment and is compatible with the new event. Technical editions, commercial packages, Logix ownership, other customer contracts, historic archives and calculation inputs are unchanged.

## Verification

Run `node tools/verify-cap-london.js` and `npm run validate:data`. The verifier uses the real transaction code in memory with the compact historical-decision index. It checks exact before snapshots, nonoverlap, prerequisite enforcement, individual-plus-prerequisite, batch, reverse-batch and sequential application, compatibility with existing concrete proposals, complete resulting graph validity, ownership arithmetic, preserved dates/DRI clauses and an obsolete-scenario scan. It neither calls an authorization endpoint nor writes simulated foundation records.

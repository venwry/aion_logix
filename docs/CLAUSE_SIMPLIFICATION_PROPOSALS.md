# Estate, company formation and clause simplification proposals

Prepared 2 November 2026. There are **24 independent whole-record proposals** in Changes confirm: 20 agreements, two events and two processes. Foundation records remain unchanged until authorized. Schema/model 0.6.0 supports the new format and legacy clauses so any agreement can be approved independently.

## Proposal inventory

| Records | Proposed change |
| --- | --- |
| All 20 agreements | Exactly `id`, `kind`, `statement`, `value`, `unit` per retained clause; meaningful party roles; prose preserves equity basis, beneficiaries, conditions and dates. |
| agreement.dri_founding | Independent management by Gary and Dorothy; Adam’s strategic minority stake supports CP/M-compatible personal computing; founders can buy back Adam’s shares at any time at an independently assessed price. |
| event.companies | Move to 23 November 1974; investment activity supplies funding; prepared recruitment for CEO, CFO and CTO in each of the three countries. No named appointments are assumed. |
| event.dri_founding | Remove the claim that Logix does not yet exist; company formation becomes an input; describe DRI’s independent funded operating outcome. |
| process.computer_business_incorporation | Start with event.companies, move event.dri_founding into steps and include leadership recruitment. End remains event.paterson. |
| process.birmingham_estate | Approximately GBP 6,000 net, including the single crashed car’s insurance proceeds; no intact car sale or second car. |

Review the company event and incorporation process together for a coherent timeline. They remain separate selectable records, and either can be saved independently. DRI’s funding event remains 7 December 1974.

## Clause treatment

The 121 existing clauses become 119: three unaccepted proposal clauses are removed and one DRI founder-buyback clause is added. Twelve targets retain uncertainty through `target_` kinds. Five completed share-transfer clauses retain their past-tense statements; they do not become new transfers. Stable IDs remain for retained clauses.

Removed clauses:

- `clause.sgs_transfer_agreement_funding_6`: the unaccepted 3–5% royalty proposal. No agreed royalty rate or zero-royalty promise replaces it.
- `clause.aurelia_casting_proposal_casting`: casting availability, fees and acceptance are not established. The offer record remains with no agreed clauses.
- `clause.apple_peachtree_scope`: negotiations do not establish acceptance. The negotiating agreement remains with no agreed clauses.

`value` is a number for a single quantity, a string for a range or staged allocation, or null when no quantity is established. `unit` states what the quantity measures and must also be null when value is null. For example, DRI capital has value 250000 and unit USD, while the statement retains the two-year schedule and 150000/100000 split. A non-quantitative right uses null/null, not zero. These summaries do not replace the statement.

The new clause schema rejects extra fields and unknown kinds. The legacy branch remains solely to keep awaiting-approval foundation records valid. Both representations retain duplicate-ID checks; legacy reference and equity checks remain active. The model version, manifest, validator and generated reference are updated together. Deploy the matching backend before authorizing new-format proposals. Once migration is complete, retiring the legacy branch can be a separate schema change.

## Estate valuation basis

Approximately GBP 6,000 is plausible as a **net story estimate**, assuming a modest house with little or no outstanding mortgage. It is not an observed Birmingham transaction price or a claim about the typical wealth of every family.

| Item | Evidence or modeling range | Treatment |
| --- | --- | --- |
| House | Nationwide’s reproduced Q1 1972 UK series is GBP 6,008; Hansard reports GBP 6,425 for new private dwellings mortgaged through building societies. | Illustrative Birmingham resale range GBP 5,500–6,500; location, condition and mortgage remain unspecified. |
| Family car | Contemporary advertised new prices include Mini 850 GBP 695 and Ford Cortina GBP 1,022. | A modest used car might have been worth roughly GBP 300–600, an estimate rather than a sourced valuation. It was destroyed, so no intact resale proceeds are counted. Insurance proceeds are included in the net total; policy terms and payout amount remain unspecified. |
| Other possessions | No household inventory exists. | Illustrative resale estimate GBP 200–400, excluding retained belongings. |
| Expenses and liabilities | Funeral, estate and sale costs; any outstanding mortgage or debts. | Deduct before the net total. The rapid settlement within the existing month remains a narrative assumption. |

The foundation proposal records only the approximately GBP 6,000 net amount, including insurance. The ranges above are plausibility checks, not an itemized ledger and not extra money to add to that amount.

Sources: [Nationwide series reproduction](https://www.propertyinvestmentproject.co.uk/property-statistics/nationwide-average-house-price/), [Hansard, 28 June 1972](https://api.parliament.uk/historic-hansard/written-answers/1972/jun/28/house-prices), [1972 advertised prices](https://www.retrowow.co.uk/social_history/70s/cost_1972.php).

## Leadership candidates for discussion

These are alternate-history recruitment suggestions, not claims that the people were unemployed, willing to join or actually appointed. Their historical commitments would require a deliberate story change. Funded engineering, operating autonomy and a suitable compensation package could motivate recruitment; that is an inference, not biographical evidence. No new named actor or appointment is included in this batch.

| Company and location | Role | Suggested candidate or search profile | Fit and limitation |
| --- | --- | --- | --- |
| Logix Tech, San Jose | CEO | Harry Garland | Local Stanford electronics background and entrepreneurial partnership with Roger Melen. Recruiting him would divert his Cromemco venture; he is a technical founder candidate, not an established large-company executive. |
| Logix Tech, San Jose | CTO | Roger Melen | Local electronics designer and Garland’s entrepreneurial partner. A joint approach is more plausible than treating either as freely available. |
| Logix Tech, San Jose | CFO | An experienced Bay Area electronics controller/CPA | Prefer accounting, inventory, financing and multi-company controls over an invented famous appointment. No sufficiently supported individual identified. |
| AION Labs, Cambridge, England | CEO | Chris Curry | Cambridge/Sinclair engineering and commercial experience. A plausible hands-on startup leader; would need to leave Sinclair. He is not a semiconductor fabrication specialist. |
| AION Labs, Cambridge, England | CTO | David Milne | Directed Edinburgh’s Wolfson Microelectronics Institute from 1973. Strong semiconductor-design candidate, but requires relocation from Edinburgh and departure from an established role. Separate process/manufacturing expertise would still be needed. |
| AION Labs, Cambridge, England | CFO | A UK chartered accountant with electronics R&D experience | Cambridge or wider eastern-England recruitment; no supported named candidate identified. |
| AION Software, Copenhagen | CEO | An experienced Danish software business or delivery manager | Search the local Regnecentralen/Brown Boveri ecosystem; prioritize customers, contracts and engineering delivery. No sufficiently supported named CEO candidate identified. |
| AION Software, Copenhagen | CTO | Søren Lauesen | Industrial software background including compilers and operating systems makes him a plausible technical candidate. His exact late-1974 availability needs further verification before appointment. |
| AION Software, Copenhagen | CFO | A Danish accountant/controller experienced in software contracts | Local accounting and payroll expertise; no supported named candidate identified. |

Sources: [Smithsonian Cromemco collection](https://www.americanhistory.si.edu/ne/collections/object/nmah_1881881), [Centre for Computing History: Chris Curry](https://www.computinghistory.org.uk/det/934/chris-curry/), [Scottish Engineering Hall of Fame: David Milne](https://engineeringhalloffame.org/profile/david-milne), [IT University: Søren Lauesen](https://researcher.itu.dk/en/persons/s%C3%B8ren-lauesen/). The Cromemco partnership began in 1974; formal incorporation followed later. Later career achievements do not establish willingness to join Adam in 1974.

## Validation

Validate current foundation and schema fixtures, legacy reference resolution, new-format rejection of extra fields, whole-record authorization hashes, and dry-run all 24 proposals separately and together. No authorization decision or foundation file is modified by those dry runs.

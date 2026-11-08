# Product catalogue cleanup — phase 1 migration map

> **Historical documentation — not current rules, instructions or queue status.** Preserved from main at `606e3f1`; consult the [current documentation index](../../README.md) and live storytelling JSON.

Assessment against `venwry/aion_logix` main at [`a0cf5b8`](https://github.com/venwry/aion_logix/commit/a0cf5b82238b3919aee4b5802be6913f12ff05c7), 8 November 2026. **Planning evidence only: no schema, foundation, authorization or Changes confirm edits.** Proposed IDs, classifications and examples below are not approved story content.

## Scope and rules

Every one of the 145 current product records is classified below. The machine-readable [migration map](migration-map.json) includes every exact incoming foundation reference with its source record and JSON pointer, technical-definition usage, active editorial references, historical-decision mention counts, and active code/test/tool/documentation occurrences. [Decisions and gaps](decisions-and-gaps.json) supplies the structured decision register, missing-offering checks and provisional external specification examples.

Products represent Logix/AION customer-facing offerings. Many products may share one launch event and campaign; a campaign may contain multiple owned launch events. OEM sales structures are explicitly deferred. RAM chips/other internal parts keep technical identities rather than catalogue identities; their removal is not evidence of any OEM channel or commercial terms. External products use descriptive content with direct, role-labelled specification references (`no`, `description`, one `ref_id`, `ref_role`). Artificial families are removed only after their meaning is preserved in direct subjects or narrative scope.

Classification distinguishes evidence from inference. An existing composition establishes a configured offering candidate, not confirmed shipment or separate retail availability. A campaign subject is not automatically a product launch. A populated technical_identity, product-like name, provider actor or BOM occurrence alone is not proof of standalone sale.

## Inventory summary

| Proposed action | Current records |
| --- | ---: |
| Retain configured Logix/AION offering | 59 |
| Retain peripheral/expansion/cartridge identity; define offering | 9 |
| Retain concrete service/course; define scope | 9 |
| Move to descriptive external identity | 11 |
| Retire product alias; preserve technical definition | 16 |
| Consolidate Team Edition commercial alias | 3 |
| Review standalone device offering | 18 |
| Review standalone OS offering | 4 |
| Review standalone entertainment offering | 2 |
| Review service/licence offering | 6 |
| Consolidate Academy programme label | 2 |
| Relocate operational concept | 1 |
| Remove catalogue placeholder; defer OEM modelling | 1 |
| Remove artificial family after reference rewrite | 4 |
| **Total** | **145** |

59 of the 63 existing composed offerings have Logix/AION providers; four have independent BPI/Autodesk providers. Eight more existing peripheral/expansion identities have direct launch or separate-sale evidence but need commercial compositions. Nine concrete services/courses merit retention with service definitions. The clarified Logix CP/M ROM-cartridge offering adds one retained identity. These 77 retention recommendations are not a final catalogue size: the reference-hardware and RAM-kit qualifications still require review, 30 other records have explicit offering-status questions, and new offerings may be needed.

11 third-party source records map to **eight provisional external identities**, subject to the BPI consolidation decision. A **ninth external identity** separates DRI’s licensed CP/M software from the retained Logix cartridge offering; that product is not moved or deleted. 16 product aliases have existing part/internal-device destinations. Four families have **37 exact foundation reference occurrences** to reconcile. Across all products there are **590 exact incoming foundation reference occurrences**; 30 products have none. Lack of an incoming reference is not a deletion criterion.

All 63 currently composed offerings occur in campaign subject lists, but none of the 145 products has a dedicated launch_campaign_id or launch_event_id populated. This phase inventories associations; launch assignment is phase 5. All source authorizations, decisions and annotations are preserved. No active annotations, review-feedback entries or pending change proposals exist in the audited snapshot.

## CP/M clarification — 8 November 2026

The [CP/M assessment correction](cpm-cartridge-clarification.md) supersedes the original whole-record external move. Retain `product.software_cpm_aurelia` for the Logix physical cartridge offering, preserve `device.rom_cartridge.cpm_aurelia` and `software_edition.cpm_aurelia`, and create a separate descriptive external identity for DRI’s software. Software ownership/licensing remains governed by `agreement.dri_cpm`. The existing source record still describes software; its proposed commercial definition and all reference rewrites require later Changes confirm approval.

## Findings requiring attention before migration

- **Aurelia 16 KB expansion:** device.aurelia_ram_16kb_card and its socket/compatibility relationships exist; no customer product references it. This is the strongest missing-offering candidate.
- **Business Tools cartridge:** both CP/M and AIONix offerings already supply their cartridge device directly. Do not duplicate them.
- **Team Edition:** one existing product already supplies the server and both client editions. Three extra product identities duplicate the commercial package while their technical edition identities remain useful.
- **BPI:** preserve independent commercial ownership and distinct implementations. A Logix bundle containing independently licensed BPI remains a Logix bundle.
- **64 KB RAM:** the current offering supplies one 64 KB module, while the device specifies paired installation. Clarify upgrade versus spare; do not silently double the quantity.
- **AION C IDE:** the current AIONix edition is referenced by both 1978 and 1980 launches. This requires an identity review rather than earliest-date inference.
- **Reference hardware:** the COMDEX reference system has a BOM but independent customer orderability is unclear.
- **Services:** regular support is directly included in 34 composition lines. Before-you-buy training may duplicate Fundamentals; broad course labels are not additional courses.
- **Chip references in campaigns:** removing a product alias is insufficient if a marketing subject is blindly redirected to a base part. Remove the commercial chip-promotion implication; retain only appropriate engineering context.

## Full record-by-record migration map

The source ID remains the preferred ID for retained offerings, even when its historical suffix contains `device_` or `proposed_`. Names do not decide status. A provisional external ID is not yet a foundation record. “Contextual rewrite” means no universal one-to-one replacement can preserve every reference role. Exact pointers and the full rationale for every row are in migration-map.json.

### Retain configured Logix/AION offering

| Source product | Proposed destination / action | Incoming foundation references | Decisions |
| --- | --- | ---: | --- |
| `product.athena`<br>Logix Athena | `product.athena` | 6 | — |
| `product.athena_server`<br>Logix Athena Server | `product.athena_server` | 4 | — |
| `product.aurelia_mono`<br>Logix Aurelia — Monochrome system | `product.aurelia_mono` | 2 | — |
| `product.aurelia_color`<br>Logix Aurelia — Color system | `product.aurelia_color` | 2 | — |
| `product.aurelia_plus_mono`<br>Logix Aurelia+ — Monochrome system | `product.aurelia_plus_mono` | 2 | — |
| `product.aurelia_plus_color`<br>Logix Aurelia+ — Color system | `product.aurelia_plus_color` | 2 | — |
| `product.artemis_128_mono`<br>Logix Artemis 128 KB — Monochrome system | `product.artemis_128_mono` | 3 | — |
| `product.artemis_128_color`<br>Logix Artemis 128 KB — Color system | `product.artemis_128_color` | 2 | — |
| `product.artemis_256_color`<br>Logix Artemis 256 KB — Color system | `product.artemis_256_color` | 2 | — |
| `product.aurelia_network_upgrade`<br>Aurelia networking upgrade | `product.aurelia_network_upgrade` | 3 | — |
| `product.artemis_network_upgrade`<br>Existing Artemis networking upgrade | `product.artemis_network_upgrade` | 3 | — |
| `product.artemis_pro_512_server`<br>Artemis PRO 512 KB server | `product.artemis_pro_512_server` | 2 | — |
| `product.artemis_pro_1mb_server`<br>Artemis PRO 1 MB server | `product.artemis_pro_1mb_server` | 2 | — |
| `product.artemis_256_mono_pro`<br>Logix Artemis 256 KB — Mono Pro system | `product.artemis_256_mono_pro` | 3 | — |
| `product.artemis_pro_512_mono_pro`<br>Artemis PRO 512 KB server with Mono Pro console | `product.artemis_pro_512_mono_pro` | 2 | — |
| `product.artemis_pro_1mb_mono_pro`<br>Artemis PRO 1 MB server with Mono Pro console | `product.artemis_pro_1mb_mono_pro` | 2 | — |
| `product.artemis_budget_128`<br>Artemis 128 — Budget Colour Office | `product.artemis_budget_128` | 4 | — |
| `product.artemis_budget_128_hdd`<br>Artemis 128 — Budget Hard-Disk Office | `product.artemis_budget_128_hdd` | 6 | — |
| `product.proposed_aurelia_office`<br>Aurelia — Office productivity | `product.proposed_aurelia_office` | 2 | — |
| `product.proposed_aurelia_accounts`<br>Aurelia — Small-business accounting | `product.proposed_aurelia_accounts` | 2 | — |
| `product.proposed_aurelia_developer`<br>Aurelia — C development | `product.proposed_aurelia_developer` | 2 | — |
| `product.proposed_aurelia_plus_office`<br>Aurelia+ — Office productivity | `product.proposed_aurelia_plus_office` | 2 | — |
| `product.proposed_aurelia_plus_accounts`<br>Aurelia+ — Small-business accounting | `product.proposed_aurelia_plus_accounts` | 2 | — |
| `product.proposed_aurelia_plus_developer`<br>Aurelia+ — C development | `product.proposed_aurelia_plus_developer` | 2 | — |
| `product.proposed_aurelia_plus_analysis`<br>Aurelia+ — Interactive analysis | `product.proposed_aurelia_plus_analysis` | 2 | — |
| `product.comdex82_artemis_autocad`<br>Logix Artemis PRO Professional CAD — Autodesk AutoCAD 1.0 | `product.comdex82_artemis_autocad` | 8 | — |
| `product.ncc82_colour_upgrade`<br>Artemis Colour Upgrade | `product.ncc82_colour_upgrade` | 2 | — |
| `product.comdex82_reference_hardware`<br>Artemis PRO 1 MiB dual-display reference hardware | `product.comdex82_reference_hardware` | 2 | D09 |
| `product.ncc82_professional_graphics`<br>Artemis Professional Graphics extension | `product.ncc82_professional_graphics` | 2 | — |
| `product.ncc82_mouse_learning`<br>Logix Mouse Learning Pack | `product.ncc82_mouse_learning` | 2 | — |
| `product.comdex82_professional_hardware`<br>November professional graphics upgrade with mouse | `product.comdex82_professional_hardware` | 2 | — |
| `product.comdex82_upgrade_autocad`<br>Professional graphics upgrade and AutoCAD | `product.comdex82_upgrade_autocad` | 2 | — |
| `product.ram_64kb_module`<br>Logix 64 KB RAM module | `product.ram_64kb_module` | 2 | D11 |
| `product.ram_256kb_bank`<br>Logix 256 KB RAM bank (two modules) | `product.ram_256kb_bank` | 2 | — |
| `product.retail.office_professional`<br>Logix Office Professional | `product.retail.office_professional` | 2 | — |
| `product.retail.business_accounts`<br>Logix Business Accounts | `product.retail.business_accounts` | 2 | — |
| `product.retail.developer_workstation`<br>Logix Developer Workstation | `product.retail.developer_workstation` | 2 | — |
| `product.retail.connect_office`<br>Connect My Office | `product.retail.connect_office` | 2 | — |
| `product.retail.cpm_migration`<br>Move from CP/M to Artemis | `product.retail.cpm_migration` | 2 | — |
| `product.proposed_artemis_accounts`<br>Artemis Accounts | `product.proposed_artemis_accounts` | 2 | — |
| `product.proposed_artemis_developer`<br>Artemis Developer | `product.proposed_artemis_developer` | 2 | — |
| `product.computer_system_retail_connected_office`<br>Logix Connected Office | `product.computer_system_retail_connected_office` | 2 | — |
| `product.computer_system_retail_development_team`<br>Logix Development Team | `product.computer_system_retail_development_team` | 2 | — |
| `product.computer_system_proposed_artemis_pro_small_office`<br>Artemis Pro Small Office | `product.computer_system_proposed_artemis_pro_small_office` | 2 | — |
| `product.abacus_1`<br>Abacus 1.x (CP/M edition) | `product.abacus_1` | 4 | — |
| `product.abacus_1.model_ii`<br>Abacus 1.x (CP/M / Tandy Model II edition) | `product.abacus_1.model_ii` | 16 | — |
| `product.abacus_2`<br>Abacus 2.0 (CP/M edition) | `product.abacus_2` | 4 | — |
| `product.abacus_2.era`<br>Abacus 2.0 (AIONix edition) | `product.abacus_2.era` | 2 | — |
| `product.abacus_3`<br>Abacus 3.0 (AIONix edition) | `product.abacus_3` | 5 | — |
| `product.pulse_1`<br>Pulse (CP/M edition) | `product.pulse_1` | 4 | — |
| `product.pulse_3`<br>Pulse 3.0 (AIONix edition) | `product.pulse_3` | 5 | — |
| `product.business_tools_aurelia`<br>Business Tools (CP/M edition) | `product.business_tools_aurelia` | 3 | — |
| `product.business_tools_artemis`<br>Business Tools (AIONix edition) | `product.business_tools_artemis` | 3 | — |
| `product.simple_c_z80`<br>Logix Simple C (CP/M edition) | `product.simple_c_z80` | 2 | — |
| `product.aurelia_sdk`<br>Logix Developer Package SDK (CP/M edition) | `product.aurelia_sdk` | 13 | — |
| `product.aion_c_ide`<br>AION C IDE (AIONix edition) | `product.aion_c_ide` | 6 | D10 |
| `product.artemis_sdk`<br>Logix Developer Package SDK (AIONix edition) | `product.artemis_sdk` | 2 | — |
| `product.aurelia_compatibility_kit`<br>Aurelia Software Compatibility Kit (CP/M edition) | `product.aurelia_compatibility_kit` | 3 | — |
| `product.aion_development_team`<br>AION Development Team | `product.aion_development_team` | 5 | — |

### Retain peripheral/expansion/cartridge identity; define offering

| Source product | Proposed destination / action | Incoming foundation references | Decisions |
| --- | --- | ---: | --- |
| `product.software_cpm_aurelia`<br>Logix CP/M ROM cartridge (proposed commercial interpretation) | Retain ID; compose around `device.rom_cartridge.cpm_aurelia`; split DRI software identity | 12 | D15 |
| `product.device_apple2_expansion_card`<br>Logix Apple II Expansion Card | `product.device_apple2_expansion_card` | 6 | — |
| `product.device_apple2_video_card`<br>Logix Video Card for Apple II | `product.device_apple2_video_card` | 6 | — |
| `product.device_artemis_cpm80_module`<br>Artemis CP/M-80 backward-compatibility expansion module | `product.device_artemis_cpm80_module` | 0 | — |
| `product.device_flexidisk_ii`<br>Logix FlexiDisk II | `product.device_flexidisk_ii` | 6 | — |
| `product.device_flexiprint40`<br>Logix FlexiPrint40 | `product.device_flexiprint40` | 6 | — |
| `product.device_logix_mouse`<br>Logix Mouse — two buttons and two rollers | `product.device_logix_mouse` | 14 | — |
| `product.device_s100_flexibus_card`<br>Logix FlexiBUS Interface for S-100 | `product.device_s100_flexibus_card` | 5 | — |
| `product.device_s100_video_card`<br>Logix Video Card for S-100 | `product.device_s100_video_card` | 5 | — |

### Retain concrete service/course; define scope

| Source product | Proposed destination / action | Incoming foundation references | Decisions |
| --- | --- | ---: | --- |
| `product.service_regular_support`<br>Logix Regular Support Service | `product.service_regular_support` | 34 | — |
| `product.service_pulse_training`<br>AION Pulse training | `product.service_pulse_training` | 4 | — |
| `product.service_bpi_training`<br>BPI Products training | `product.service_bpi_training` | 5 | — |
| `product.service_aurelia_compatibility_support`<br>Aurelia compatibility engineering support | `product.service_aurelia_compatibility_support` | 3 | — |
| `product.service_aurelia_compatibility_certification`<br>Aurelia application compatibility certification | `product.service_aurelia_compatibility_certification` | 3 | — |
| `product.academy_course_1`<br>Aurelia Fundamentals | `product.academy_course_1` | 2 | — |
| `product.academy_course_2`<br>Aurelia Fundamentals + Abacus | `product.academy_course_2` | 2 | — |
| `product.academy_course_3`<br>Aurelia Fundamentals + Abacus + Business Tools | `product.academy_course_3` | 2 | — |
| `product.academy_course_4`<br>Aurelia + C (IDE + TUI library) | `product.academy_course_4` | 2 | — |

### Move to descriptive external identity

| Source product | Proposed destination / action | Incoming foundation references | Decisions |
| --- | --- | ---: | --- |
| `product.bpi_suite`<br>BPI (CP/M edition) | `external_product.bpi_suite` (provisional) | 17 | — |
| `product.bpi_suite.era`<br>BPI (AIONix edition) | `external_product.bpi_suite.era` (provisional) | 2 | — |
| `product.autocad_1_artemis`<br>Autodesk AutoCAD 1.0 (AIONix edition) | `external_product.autocad_1_artemis` (provisional) | 10 | — |
| `product.bpi_client_server`<br>BPI client-server package | `external_product.bpi_client_server` (provisional) | 2 | D02 |
| `product.software_cpm_model_ii`<br>CP/M (Tandy Model II edition) | `external_product.cpm_model_ii` (provisional) | 15 | — |
| `product.software_bpi_client_server`<br>BPI client-server (CP/M Client edition) | `external_product.bpi_client_server` (provisional) | 5 | D02 |
| `product.edition_bpi_client_server_era_client`<br>BPI client-server (AIONix Client edition) | `external_product.bpi_client_server` (provisional) | 0 | D02 |
| `product.edition_bpi_client_server_era_server`<br>BPI client-server (AIONix Server edition) | `external_product.bpi_client_server` (provisional) | 0 | D02 |
| `product.software_microsoft_basic_aurelia`<br>Microsoft BASIC (CP/M edition) | `external_product.microsoft_basic_aurelia` (provisional) | 2 | — |
| `product.computer_trs80_model_ii`<br>Tandy TRS-80 Model II — CP/M partner configuration | `external_product.trs80_model_ii` (provisional) | 18 | — |
| `product.device_model_ii_flexibus`<br>Tandy Model II FlexiBUS option | `external_product.model_ii_flexibus` (provisional) | 17 | — |

### Retire product alias; preserve technical definition

| Source product | Proposed destination / action | Incoming foundation references | Decisions |
| --- | --- | ---: | --- |
| `product.device_base_computer_artemis`<br>Logix Artemis — base computer | `device.base_computer.artemis` | 0 | — |
| `product.device_base_computer_artemis_pro`<br>Logix Artemis PRO — base computer | `device.base_computer.artemis_pro` | 0 | — |
| `product.device_subsystem_aurelia_video`<br>Logix Aurelia integrated video subsystem | `device.subsystem.aurelia.video` | 0 | — |
| `product.device_subsystem_aurelia_plus_video`<br>Logix Aurelia+ integrated video subsystem | `device.subsystem.aurelia_plus.video` | 0 | — |
| `product.part_aion_4116`<br>AION 4116-equivalent 16Kx1 NMOS DRAM | `base_part.aion_4116` | 3 | — |
| `product.part_aion_4164`<br>AION 64 Kbit DRAM (4164-equivalent) | `base_part.aion_4164` | 18 | D14 |
| `product.part_artemis_graphics_chip_64kb`<br>AION 64 KiB Artemis graphics controller with palette sequencer | `base_part.artemis_graphics_chip_64kb` | 0 | — |
| `product.part_aurelia_system_controller`<br>AION Aurelia system controller (DMA, banking and refresh) | `base_part.aurelia_system_controller` | 0 | — |
| `product.part_aurelia_video_chip`<br>Aurelia / Aurelia+ shared video controller | `base_part.aurelia_video_chip` | 2 | — |
| `product.part_color_pro_monitor_controller`<br>AION Color Pro digital-to-RGB monitor controller | `base_part.color_pro_monitor_controller` | 0 | — |
| `product.part_era2_12mhz`<br>ERA^2 12MHz | `base_part.era2_12mhz` | 6 | D14 |
| `product.part_erav1_6mhz`<br>ERAv1 6MHz (initial) | `base_part.erav1_6mhz` | 1 | — |
| `product.part_erav1_8mhz`<br>ERAv1 8MHz (upgraded) | `base_part.erav1_8mhz` | 1 | — |
| `product.part_flexibus_device_controller`<br>FlexiBUS peripheral/device controller | `base_part.flexibus_device_controller` | 2 | — |
| `product.part_flexibus_host_controller`<br>FlexiBUS computer/host controller | `base_part.flexibus_host_controller` | 2 | — |
| `product.part_mpi_mp40_mechanism`<br>Micro Peripherals MP-40 bare printer mechanism | `base_part.mpi_mp40_mechanism` | 1 | — |

### Consolidate Team Edition commercial alias

| Source product | Proposed destination / action | Incoming foundation references | Decisions |
| --- | --- | ---: | --- |
| `product.software_aion_development_team`<br>AION Development System (Team / AIONix Server edition) | `product.aion_development_team` | 16 | D01 |
| `product.edition_aion_development_team_era_client`<br>AION Development System (Team / AIONix Client edition) | `product.aion_development_team` | 0 | D01 |
| `product.edition_aion_development_team_z80_client`<br>AION Development System (Team / CP/M Client edition) | `product.aion_development_team` | 0 | D01 |

### Review standalone device offering

| Source product | Proposed destination / action | Incoming foundation references | Decisions |
| --- | --- | ---: | --- |
| `product.device_artemis_professional_video_128kb`<br>Logix Artemis Professional 128 KiB video card | Retain if separately offered; otherwise contextual/technical rewrite | 14 | D04 |
| `product.device_artemis_video_card`<br>Logix Artemis 32 KiB professional video card | Retain if separately offered; otherwise contextual/technical rewrite | 3 | D04 |
| `product.device_artemis_video_card_16kb`<br>Logix Artemis 16 KiB economy video card | Retain if separately offered; otherwise contextual/technical rewrite | 3 | D04 |
| `product.device_artemis_video_card_64kb`<br>Logix Artemis 64 KiB video controller card | Retain if separately offered; otherwise contextual/technical rewrite | 10 | D04 |
| `product.device_color_monitor_1`<br>Logix Color Monitor I 12-inch | Retain if separately offered; otherwise contextual/technical rewrite | 0 | D04 |
| `product.device_color_monitor_2`<br>Logix Color Monitor II 12-inch | Retain if separately offered; otherwise contextual/technical rewrite | 0 | D04 |
| `product.device_color_pro_14`<br>Logix Color Pro 14 | Retain if separately offered; otherwise contextual/technical rewrite | 10 | D04 |
| `product.device_flexibus_keyboard`<br>Logix FlexiBUS keyboard | Retain if separately offered; otherwise contextual/technical rewrite | 0 | D04 |
| `product.device_flexidisk`<br>Logix FlexiDisk | Retain if separately offered; otherwise contextual/technical rewrite | 0 | D04 |
| `product.device_mono_monitor_1`<br>Logix Monochrome Monitor I 9-inch | Retain if separately offered; otherwise contextual/technical rewrite | 0 | D04 |
| `product.device_mono_monitor_2`<br>Logix Mono Monitor II 12-inch | Retain if separately offered; otherwise contextual/technical rewrite | 0 | D04 |
| `product.device_mono_pro`<br>Logix Mono Pro 14-inch | Retain if separately offered; otherwise contextual/technical rewrite | 3 | D04 |
| `product.device_mono_pro_17`<br>Logix Mono Pro 17 | Retain if separately offered; otherwise contextual/technical rewrite | 14 | D04 |
| `product.device_network_card_artemis`<br>Logix Artemis network interface | Retain if separately offered; otherwise contextual/technical rewrite | 0 | D04 |
| `product.device_network_card_aurelia`<br>Logix Aurelia network card | Retain if separately offered; otherwise contextual/technical rewrite | 0 | D04 |
| `product.device_network_hub_16_port`<br>Logix 16-port network hub/repeater | Retain if separately offered; otherwise contextual/technical rewrite | 0 | D04 |
| `product.device_network_hub_4_port`<br>Logix 4-port network hub/repeater | Retain if separately offered; otherwise contextual/technical rewrite | 0 | D04 |
| `product.device_network_hub_8_port`<br>Logix 8-port network hub/repeater | Retain if separately offered; otherwise contextual/technical rewrite | 0 | D04 |

### Review standalone OS offering

| Source product | Proposed destination / action | Incoming foundation references | Decisions |
| --- | --- | ---: | --- |
| `product.software_aionix`<br>AIONix (ERA edition) | Technical default: `software_edition.aionix`; confirm standalone package | 19 | D03 |
| `product.software_aionix_server`<br>AIONix (Server edition) | Technical default: `software_edition.aionix_server`; confirm standalone package | 5 | D03 |
| `product.software_aionix2`<br>AIONix 2 (ERA² edition) | Technical default: `software_edition.aionix2`; confirm standalone package | 5 | D03 |
| `product.software_cpm_aurelia_networking`<br>CP/M (Aurelia networking edition) | Technical default: `software_edition.cpm_aurelia_networking`; confirm standalone package | 4 | D03 |

### Review standalone entertainment offering

| Source product | Proposed destination / action | Incoming foundation references | Decisions |
| --- | --- | ---: | --- |
| `product.software_entertainment_suite`<br>AION Entertainment Suite (CP/M edition) | Retain if separately offered; otherwise contextual/technical rewrite | 7 | D05 |
| `product.edition_entertainment_suite_era`<br>AION Entertainment Suite (AIONix edition) | Retain if separately offered; otherwise contextual/technical rewrite | 0 | D05 |

### Review service/licence offering

| Source product | Proposed destination / action | Incoming foundation references | Decisions |
| --- | --- | ---: | --- |
| `product.service_customer_care`<br>Logix Customer Care | Retain if separately offered; otherwise contextual/technical rewrite | 0 | D07 |
| `product.service_professional_support`<br>Logix Professional Support Service | Retain if separately offered; otherwise contextual/technical rewrite | 0 | D07 |
| `product.service_professional_business_onsite`<br>Logix Professional Business On-site | Retain if separately offered; otherwise contextual/technical rewrite | 0 | D07 |
| `product.service_academy_customer_site`<br>Logix Computer Academy - customer-site courses | Retain if separately offered; otherwise contextual/technical rewrite | 1 | D07 |
| `product.service_aurelia_commercial_developer_license`<br>Logix Aurelia Commercial Developer License | Retain if separately offered; otherwise contextual/technical rewrite | 0 | D07 |
| `product.service_artemis_commercial_developer_license`<br>Logix Artemis Commercial Developer License | Retain if separately offered; otherwise contextual/technical rewrite | 0 | D07 |

### Consolidate Academy programme label

| Source product | Proposed destination / action | Incoming foundation references | Decisions |
| --- | --- | ---: | --- |
| `product.service_academy_before_you_buy`<br>Logix Computer Academy - before-you-buy training | `product.academy_course_1` | 5 | D06 |
| `product.service_academy_regular_courses`<br>Logix Computer Academy - regular courses | Contextual rewrite / no new entity | 1 | D06 |

### Relocate operational concept

| Source product | Proposed destination / action | Incoming foundation references | Decisions |
| --- | --- | ---: | --- |
| `product.service_academy_direct_sales`<br>Logix Computer Academy direct product sales | `process.academy` | 5 | — |

### Remove catalogue placeholder; defer OEM modelling

| Source product | Proposed destination / action | Incoming foundation references | Decisions |
| --- | --- | ---: | --- |
| `product.service_component_licensing`<br>Logix custom-chip licensing / supply to other manufacturers | Contextual rewrite / no new entity | 0 | D08 |

### Remove artificial family after reference rewrite

| Source product | Proposed destination / action | Incoming foundation references | Decisions |
| --- | --- | ---: | --- |
| `product.family_aurelia`<br>Aurelia platform | Contextual rewrite / no new entity | 9 | D12 |
| `product.family_artemis`<br>Artemis platform | Contextual rewrite / no new entity | 21 | D12 |
| `product.family_athena`<br>Athena platform | Contextual rewrite / no new entity | 3 | D12 |
| `product.family_team_edition`<br>AION Development System — Team Edition | `product.aion_development_team` | 4 | D12 |

## Decision register

### D01 — One Team Edition commercial package

product.aion_development_team already supplies the server and both client editions. Consolidate three product aliases into that package for commercial statements; retain separate software_edition references for implementation facts. Do not create three more customer offerings.

**Recommended next decision:** Accept the package as the canonical commercial identity and review each alias reference by role.

### D02 — BPI external identity and package membership

Eleven third-party source records map to eight suggested external identities if the three BPI client/server technical aliases join external_product.bpi_client_server. Preserve the client/server edition distinctions and direct package membership; independent licences/receipts remain independent. A ninth external identity describes DRI CP/M separately from the retained Logix cartridge offering (D15).

**Recommended next decision:** Confirm consolidation of the BPI client/server commercial identity; retain its three implementation editions.

### D03 — OS editions versus independent offerings

AIONix, AIONix Server, AIONix2 and the CP/M networking edition have technical definitions and bundled use but no independently specified customer package. The baseline CP/M cartridge is now retained separately under D15. The networking cartridge also exists as device.rom_cartridge.cpm_aurelia_networking and is included in product.aurelia_network_upgrade; this alone does not establish a separately sold cartridge.

**Recommended next decision:** Review the four remaining OS/package candidates. Apply the same separation of DRI software rights, technical edition and Logix physical medium; do not infer a standalone networking cartridge or transfer software ownership from engineering responsibility labels.

### D04 — Standalone peripherals versus parts of kits

Eighteen device-linked product aliases have incomplete standalone-offer evidence. This includes monitor variants, video cards, keyboard, FlexiDisk, network cards and hubs. Inclusion in a computer or upgrade BOM is not itself proof of a separate orderable product.

**Recommended next decision:** Identify which are separately offered; retain those IDs and specify their contents. Redirect the remaining aliases to their existing devices.

### D05 — Entertainment Suite packaging

CP/M and AIONix editions exist, the suite is released in event.ncc82_graphics_mouse, and Mouse Learning Pack already supplies it. An additional standalone edition/product entitlement is not explicit.

**Recommended next decision:** Confirm standalone editions, one selectable-edition package, or software included only in the existing Mouse Learning Pack.

### D06 — Academy programme labels versus courses

service_academy_before_you_buy likely overlaps the concrete two-day academy_course_1. service_academy_regular_courses is a broad label beside four concrete courses. The other courses retain distinct durations and must not inherit Fundamentals purchase credit by accident.

**Recommended next decision:** Reconcile the before-you-buy service with Fundamentals, and replace the regular-course umbrella with concrete course references or process scope.

### D07 — Six service/licence placeholders

Customer Care, Professional Support, Professional Business On-site, Academy customer-site courses and two commercial-developer licences lack enough evidence to settle independent offering versus included entitlement or policy.

**Recommended next decision:** Confirm their offering scope and provider before retaining them as products. No prices, new entitlements or launches are inferred.

### D08 — OEM licensing placeholder is deferred

service_component_licensing is an unreferenced name with an empty specification. OEM sales structures are explicitly outside this change.

**Recommended next decision:** Retire this catalogue placeholder in a later reviewed proposal while preserving its original description in migration evidence; create no replacement OEM model now.

### D09 — Reference hardware configuration

comdex82_reference_hardware has a full product composition but its description calls it reference hardware and leaves shipment/qualification pending.

**Recommended next decision:** Confirm whether it is independently offered or only a demonstration/reference configuration before final catalogue enforcement.

### D10 — AION C IDE identity and first launch

The current product is AIONix-specific but is referenced by the 1978 Aurelia and 1980 Artemis campaigns/events. Other CP/M developer products already exist.

**Recommended next decision:** Review the 1978 references against Simple C/SDK evidence; do not mechanically choose the earliest campaign or invent a missing historical edition.

### D11 — 64 KB module versus installable memory kit

product.ram_64kb_module supplies one device.ram_64kb_x32. That device describes matched-pair installation, while product.ram_256kb_bank supplies two 128 KB modules. A single module could be a spare rather than a complete upgrade.

**Recommended next decision:** Clarify the 64 KB offering role and population. Do not automatically change quantity or confuse it with the old eight-chip device.artemis_ram_module_64kb.

### D12 — Family scope must survive removal

Four family products have 37 active foundation reference occurrences. Some references express broad compatibility or ecosystem scope rather than a list of current SKUs.

**Recommended next decision:** Use concrete offerings only where they express the intended scope; otherwise use direct technical subjects or retain the scope in the owning record text. Never create a replacement artificial family entity.

### D13 — Launch ownership is later-phase work

All ten designated campaign launch events fall inside their process periods, but event.autodesk_comdex is currently owned by process.autodesk_development. NCC 1978 correctly owns two launches through a sessions subprocess.

**Recommended next decision:** Reconcile public launch ownership in phase 6 without duplicating ownership or inventing dates. No ownership changes belong to phase 1.

### D14 — Remove chip promotion from catalogue cleanup

campaign.ncc1980 and its execution process include product.part_aion_4164; campaign.ncc1983 includes product.part_era2_12mhz. These are technical parts, not customer offerings.

**Recommended next decision:** Do not simply replace marketing subject IDs with base_part IDs and preserve chip promotion. Keep necessary engineering facts in technical context; do not infer OEM campaigns or sales.

### D15 — CP/M software rights versus Logix physical cartridge

**Interpretation resolved by the user; migration pending.** The user identifies the physical CP/M ROM cartridge as a Logix/AION offering produced under DRI licence. device.rom_cartridge.cpm_aurelia already names Logix as provider and contains software_edition.cpm_aurelia plus ROM, PCB/connector and shell/label parts. agreement.dri_cpm assigns ownership of the resulting CP/M and its enhancements to DRI; technical responsibility labels are not ownership grants.

**Migration guidance:** Retain product.software_cpm_aurelia and redefine it as the Logix cartridge offering. Introduce a separate descriptive external DRI software identity, preserve the software edition and existing cartridge BOM, and allocate all 12 incoming product references by meaning. Confirm packaging and replacement/upgrade availability later without inventing separate sale or dates.

## Missing and incomplete offering checks

### G01 — Missing commercial identity

Define a customer-facing Aurelia 16 KB expansion if separately offered, preserving the existing board and compatible socket. No current product targets this device. Its launch can share Aurelia campaign/event after review; no new launch is implied.

Evidence: `device.base_computer.aurelia`.

### G02 — Already present; do not duplicate

Both existing offering compositions already supply one Business Tools cartridge. Retain and enrich those records; do not create another cartridge SKU just because the device also exists.

Evidence: `product.business_tools_aurelia`, `product.business_tools_artemis`.

### G03 — Eight existing commercial identities need compositions

Keep the eight current product IDs, define their supplied contents and direct links, and preserve their device BOMs. For the CP/M-80 module, explicit separate-sale evidence is in event.artemis_launch prose even though the event has no exact reference to its product ID.

Evidence: `event.ncc79_campaign`, `event.artemis_launch`, `event.aurelia_launch`, `event.ncc82_graphics_mouse`.

### G04 — Conditional additional memory upgrades

The 128 KB module is already in the two-module 256 KB offering. Larger 256 KB modules occur in complete systems; create additional upgrade/spare offerings only when their customer-facing package is explicitly chosen. Do not manufacture a SKU for every process-node revision.

Evidence: `device.base_computer.artemis`, `device.base_computer.artemis_pro`, `device.base_computer.athena`, `device.base_computer.athena_server`.

### G05 — Packaging decisions, not automatic new products

Resolve D03/D05 before creating standalone OS or entertainment packages; included software remains a technical definition even without a separate product.

Evidence: `product.ncc82_mouse_learning`, `product.aurelia_network_upgrade`, `product.artemis_network_upgrade`.

### G06 — Direct external host identity is absent

Add a simple Apple II external identity when migrating direct host/ecosystem relationships. Logix Apple II cards remain Logix products; do not classify them as external.

Evidence: `event.apple_cooperation`, `event.apple_business_promotions`, `event.ncc79_campaign`.

### G07 — Further external identities may be needed for explicit existing story subjects

Consider Disk II, the Apple–Peachtree business package and the scenario-specific IBM business PC as separate descriptive external subjects where direct references are needed. Keep IBM supplier/OS unspecified as the story does. Do not replace it with historical MS-DOS/5150 assumptions.

Evidence: `event.apple_business_promotions`, `event.apple_peachtree`, `event.apple_business`, `event.ibm_alternative_launch`, `market_response.ibm_alternative_launch`.

### G08 — Do not turn vague market classes or every supplier part into products

Osborne-class/Multiplan-class observations do not establish exact offered configurations. A purchased Seagate mechanism does not automatically need a second external commercial record. Add external identities only for directly modelled commercial/partner/competition subjects.

Evidence: `event.portable_cpm_pressure`, `event.application_competition`.

### G09 — Retained CP/M cartridge offering needs commercial definition, not a duplicate technical BOM

Define the retained product around one cartridge device at an explicit composition version; retain the existing device-to-software and base-part links. Keep DRI rights in the agreement and external description. Do not count the licensed software a second time as another physical cartridge or invent royalty amounts, licence counts, exact ROM technology/capacity, separate-sale terms or launch dates.

Evidence: `device.rom_cartridge.cpm_aurelia`, `software_edition.cpm_aurelia`, `agreement.dri_cpm`, `product.aurelia_mono`, `product.aurelia_color`.

## Provisional external identities

Keep commercial product identity separate from technical implementation and Logix bundle identity. The nine candidates below comprise eight move/consolidation destinations and one separate DRI software identity; they are not newly imported records. New external records must later enter Pending authorization. Example specification entries in decisions-and-gaps.json use your exact requested four fields. References there are direct provider, host or implementation relationships; they do not include arbitrary technology chains.

| Proposed external ID | Existing source products | Direct role-labelled references |
| --- | --- | --- |
| `external_product.autocad_1_artemis` | `product.autocad_1_artemis` | `actor.autodesk`: publisher; `software_edition.autocad_1_artemis`: technical implementation edition |
| `external_product.bpi_client_server` | `product.bpi_client_server`, `product.software_bpi_client_server`, `product.edition_bpi_client_server_era_client`, `product.edition_bpi_client_server_era_server` | `actor.bpi`: publisher; `software_edition.bpi_client_server`: CP/M client implementation; `software_edition.bpi_client_server.era_client`: AIONix client implementation; `software_edition.bpi_client_server.era_server`: AIONix server implementation |
| `external_product.bpi_suite` | `product.bpi_suite` | `actor.bpi`: publisher; `software_edition.bpi_suite`: technical implementation edition |
| `external_product.bpi_suite.era` | `product.bpi_suite.era` | `actor.bpi`: publisher; `software_edition.bpi_suite.era`: technical implementation edition |
| `external_product.cpm_aurelia` | Software identity split from `product.software_cpm_aurelia`; retain product as Logix cartridge | `actor.dri`: software owner/licensor; `software_edition.cpm_aurelia`: implementation edition; `agreement.dri_cpm`: development/licensing agreement |
| `external_product.cpm_model_ii` | `product.software_cpm_model_ii` | `actor.dri`: operating-system licensor; `actor.tandy`: hardware/configuration provider; `software_edition.cpm_model_ii`: technical implementation edition; `external_product.trs80_model_ii`: supported host |
| `external_product.microsoft_basic_aurelia` | `product.software_microsoft_basic_aurelia` | `actor.microsoft`: publisher; `software_edition.microsoft_basic_aurelia`: technical implementation edition |
| `external_product.model_ii_flexibus` | `product.device_model_ii_flexibus` | `actor.tandy`: hardware/configuration provider; `external_product.trs80_model_ii`: supported host |
| `external_product.trs80_model_ii` | `product.computer_trs80_model_ii` | `actor.tandy`: hardware/configuration provider |

For BPI client-server, retain the direct server/client edition membership and preserve the old commercial composition snapshot in migration evidence. No internal Logix BOM currently targets the external product wrapper; internal packages already refer to technical editions. Do not discard those technical BOMs when simplifying external commercial descriptions.

Apple II has no existing product record to move; its two Logix cards are retained. Add the external Apple II host deliberately when direct partner/ecosystem relationships are migrated. Further external identities should be drawn from explicit story subjects, not assumed historical releases or every purchased component.

## Reference and review strategy

1. Read each exact pointer in migration-map.json. Campaign, engineering, compatibility, BOM and provider relationships can require different destinations even when they currently use the same product ID.
2. For retained products, preserve IDs and enrich their commercial composition/service definition. Shared launch links are assigned later; do not duplicate events per configuration.
3. For the CP/M split, retain the Logix cartridge product and allocate software/licensing references separately (D15). For external moves and aliases, update current references in the same inseparable Changes confirm proposal as the move/removal. Keep devices, base parts and software editions used by internal compositions.
4. For manufacturing-capability product_ids that really denote silicon, use existing base_part_ids and deduplicate already present references. Do not create an OEM sales model.
5. For families, campaign subject lists often already contain specific offerings. Remove redundant family entries where scope survives. Broad ecosystem/compatibility statements need direct technical subjects or preserved wording rather than arbitrary SKU expansion.
6. For operational concepts, retain ordering and purchase-credit meaning in Academy records; do not invent a customer service product or new sales structure.
7. Historical authorization decisions, archived files and source evidence are immutable. Old IDs inside historical snapshots remain valid evidence. Current authorization entries for removed records are removed only by the approved transaction. Preserve annotation/review lineage if such feedback is added after this snapshot.
8. Code/test/tool occurrences in the map are a separate impact inventory, not automatic replacements. Live fixtures may need migration; frozen source-import evidence must retain historical identifiers.

## Suggested migration cohorts after schema support

| Cohort | Scope | Main dependencies |
| --- | --- | --- |
| Technical aliases and chip references | 12 base-part aliases, four internal-device aliases; chip marketing/context cleanup | Generic typed references and manufacturing-capability fields; D14 |
| External commercial identities | 11 moved source records to eight identities, plus separate DRI CP/M software identity | external_products registry/schema; D02/D03; preserve package editions |
| Team Edition | Three technical-commercial aliases plus its family and overlapping campaign references | D01; keep canonical product.aion_development_team |
| Academy/services | Nine retained services/courses, six service decisions, two grouping decisions, ordering-channel cleanup | D06/D07 and provider attribution; preserve support entitlements in BOMs |
| Customer peripherals/software | Eight supported peripheral products and one retained CP/M cartridge offering, 18 standalone-device decisions, OS/suite decisions and missing RAM expansion | D03/D04/D05/D11/D15; offering categories may need a peripheral category |
| Remaining family scope | Aurelia/Artemis/Athena references | D12; migrate after the surviving catalogue is known |
| Launch relationships and ownership | Explicit product campaign/event fields and contained ownership | Phases 5/6; D09/D10/D13; not part of phase 1 |

These are logical cohorts, not independent ready-to-approve proposals. Campaigns and processes appear in multiple cohorts. Refresh snapshots after earlier approvals, or group overlapping edits into one proposal; never queue conflicting whole-record snapshots. The final strict product schema is enforced only after these migrations are accepted.

## Verification and limits

The [verification results](verification.json) confirm the audit passed. The audit checks one classification per source product, exact pointer resolution, destination existence (except explicitly provisional external IDs), direct external-specification references, source file fingerprints and count reconciliation. JSON pointers identify the complete document path. Source record hashes use the repository canonical object-key sorting and JSON serialization.

Coverage is the active foundation and storytelling files at the pinned commit, plus lexical product-ID occurrences in active code/server/schema/tools/tests/docs. Historical decision matches are counted separately and never proposed for rewriting. Archived trees and dynamic/generated IDs are not exhaustively lexical-scanned; their preserved historical meaning is outside the mutable graph. Embedded literal current product-ID mentions were also scanned in foundation text; none were found outside exact string references.

No standalone-sale inference is treated as settled merely because a device appears in a BOM. No OEM structure, commercial term, price, launch date, shipment state or authorization was invented. This is a phase-1 review artifact; subsequent schema/data changes still require the agreed phased workflow.

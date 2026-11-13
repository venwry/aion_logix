# Foundation dataset specification

This document describes the current foundation schema contract (version 0.18.0). It is generated from `schemas/*.schema.json` for every JSON dataset in `data_foundation/`. Shared schema definitions are expanded inside their owning entities. Current authorization, sources and proposed changes belong to `data_storytelling/`; historical documentation is preserved in `docs/archived/` and earlier immutable evidence in `archived_no_longer_valid/`. Both are deliberately outside this diagram.

The [reference rules](REFERENCE_RULES.md) govern semantic directness, inputs/outcomes and launch relationships. Legacy schema compatibility does not authorize new unexplained subject lists.

## Reading the diagram

- Each entity represents one dataset file, whose envelope is `{ "dataset_name": [record, ...] }`. The entity contains the hierarchical structure of one record, not a sample record.
- `*` means required within its immediate parent object; `?` means optional there. A required child does not make its optional parent required. Conditional requirements are specified below.
- Indentation shows owned objects and array items. `array<T>` contains zero or more values unless the schema says otherwise. Nested objects are not independent datasets.
- A solid arrow runs from the referencing dataset to the dataset containing the referenced `id`; labels give exact paths, with `[]` denoting array items. Several fields between the same pair share one line.
- Dashed arrows through `Any foundation record` represent polymorphic references: each value chooses one of the 16 target datasets by its ID prefix. They do not require a value from every target dataset. Self-references are included.
- Process boundary `value` references an event only when `precision` is `event`; calendar and unknown variants are not references.
- Clauses use exactly id, kind, statement, value and unit. Target kinds begin with target_. No quantity is represented by null value and null unit. The active schema accepts only this shape; historical snapshots remain unchanged.
- Assumptions require topic plus non-empty statements[]. The legacy statement field is retired.
- Composition boundaries are event, unknown, open, or simulation_end. The last resolves to 1995-01-01 and is valid only as the final version end. Adjacent resolved revisions share a boundary; authoring defaults and first-use rules are in MODEL_GUIDE.md.
- Technology specification chapters contain number, chapter_name, description and parameters[] of key/value text pairs. Numbers and chapter-local keys are unique. Description placeholders {key} resolve locally; model validation rejects missing keys. Devices, software editions and base parts instead have root technical_specification chapters with one global parameter table. Each parameter is exactly key/value OR key/ref_id/ref_role; optional-looking union members in the diagram must satisfy one complete variant. Graphics modes have local parameters and typed fixed fields. See MODEL_GUIDE.md for canonical numeric keys, buffer units and transitional legacy support.
- Campaigns use the timeline shape shown here. The legacy process_id/presentation/marketing_content shape remains accepted solely during individual conversion; mixing the two shapes is rejected. Campaign dates accept calendar precision or explicit unknowns, never event anchors. Marketing presentation parameters are exactly key/value or key/ref_id, with no ref_role. Process steps select at most one event_id, process_id or campaign_id. See CAMPAIGN_TIMELINES.md for the staged ownership contract.
- These arrows describe permitted references, not SQL ownership or reverse cardinality. No inverse uniqueness is implied.

## Entity and reference diagram

The diagram is intentionally comprehensive. Use the per-entity trees and reference catalogue below when reading on a narrow screen.

```mermaid
%%{init: {"flowchart": {"htmlLabels": true, "wrappingWidth": 1200}}}%%
flowchart LR
  classDef schemaEntity font-family:monospace,text-align:left,white-space:pre;
  actor["<pre style='text-align:left;font-family:monospace;white-space:pre;margin:0'>actor.json<br/>id*: string<br/>kind*: string<br/>name*: string<br/>aliases?: array&lt;string&gt;<br/>description?: string</pre>"]:::schemaEntity
  actor_relationship["<pre style='text-align:left;font-family:monospace;white-space:pre;margin:0'>actor_relationship.json<br/>id*: string<br/>kind*: string<br/>subject_actor_ids*: array&lt;string&gt; → actor<br/>object_actor_id*: string → actor<br/>established_by_event_id?: string → event<br/>description*: string</pre>"]:::schemaEntity
  agreement["<pre style='text-align:left;font-family:monospace;white-space:pre;margin:0'>agreement.json<br/>id*: string<br/>title*: string<br/>kind*: string<br/>party*: array&lt;object&gt;<br/>│  └─ actor_id*: string → actor<br/>│  └─ role*: string<br/>state*: string<br/>description?: string<br/>clauses*: array&lt;object&gt;<br/>│  └─ id*: string<br/>│  └─ kind*: string<br/>│  └─ statement*: string<br/>│  └─ value*: number | string | null<br/>│  └─ unit*: string | null</pre>"]:::schemaEntity
  assumption["<pre style='text-align:left;font-family:monospace;white-space:pre;margin:0'>assumption.json<br/>id*: string<br/>kind*: string<br/>scope_ids?: array&lt;string&gt; → any foundation ID<br/>topic*: string<br/>statements*: array&lt;string&gt;</pre>"]:::schemaEntity
  base_part["<pre style='text-align:left;font-family:monospace;white-space:pre;margin:0'>base_part.json<br/>id*: string<br/>name*: string<br/>kind*: string<br/>description*: string<br/>supply_form*: string<br/>manufacturer_actor_id*: string | null → actor<br/>manufacturer_name?: string | null<br/>supplier_actor_ids*: array&lt;string&gt; → actor<br/>manufacturer_part_number*: string | null<br/>technology_ids*: array&lt;string&gt; → technology<br/>manufacturing_capability_ids?: array&lt;schema-defined&gt;<br/>technical_definition*: object<br/>│  └─ athena_qualification?: string<br/>│  └─ capacity_kb?: number<br/>│  └─ compatibility_note?: string<br/>│  └─ compatible_computers?: array&lt;string&gt; → device<br/>│  └─ compatible_with?: array&lt;string&gt; → device<br/>│  └─ configuration_requirements?: object<br/>│  │  └─ external_application_cartridges_supported?: boolean<br/>│  │  └─ rules?: array&lt;string&gt;<br/>│  │  └─ scope?: string<br/>│  └─ connection?: string<br/>│  └─ firmware_contents?: array&lt;string&gt;<br/>│  └─ form_factor?: string<br/>│  └─ host_qualification?: object<br/>│  │  └─ device.base_computer.artemis?: object<br/>│  │  │  └─ computer_id?: string → device<br/>│  │  │  └─ implementation?: string<br/>│  │  │  └─ qualified_max_rate_kbps?: number<br/>│  │  │  └─ rate_policy?: string<br/>│  │  │  └─ supported_rates_kbps?: array&lt;number&gt;<br/>│  │  │  └─ technology_ids?: array&lt;string&gt; → technology<br/>│  │  └─ device.base_computer.artemis_pro?: object<br/>│  │  │  └─ computer_id?: string → device<br/>│  │  │  └─ implementation?: string<br/>│  │  │  └─ qualified_max_rate_kbps?: number<br/>│  │  │  └─ rate_policy?: string<br/>│  │  │  └─ server_role?: boolean<br/>│  │  │  └─ supported_rates_kbps?: array&lt;number&gt;<br/>│  │  │  └─ technology_ids?: array&lt;string&gt; → technology<br/>│  │  └─ device.base_computer.athena?: object<br/>│  │  │  └─ computer_id?: string → device<br/>│  │  └─ device.base_computer.athena_server?: object<br/>│  │  │  └─ computer_id?: string → device<br/>│  │  └─ device.base_computer.aurelia?: object<br/>│  │  │  └─ computer_id?: string → device<br/>│  │  │  └─ qualified_max_rate_kbps?: number<br/>│  │  │  └─ rate_policy?: string<br/>│  │  │  └─ supported_rates_kbps?: array&lt;number&gt;<br/>│  │  │  └─ technology_ids?: array&lt;string&gt; → technology<br/>│  │  └─ device.base_computer.aurelia_plus?: object<br/>│  │  │  └─ computer_id?: string → device<br/>│  │  │  └─ qualified_max_rate_kbps?: number<br/>│  │  │  └─ rate_policy?: string<br/>│  │  │  └─ supported_rates_kbps?: array&lt;number&gt;<br/>│  │  │  └─ technology_ids?: array&lt;string&gt; → technology<br/>│  └─ integration_requirements?: object<br/>│  │  └─ sourcing_policy?: string<br/>│  └─ io_and_expansion?: object<br/>│  │  └─ application_rom_cards_supported?: boolean<br/>│  │  └─ dedicated_video_slot?: object<br/>│  │  │  └─ general_purpose_slots_consumed?: number<br/>│  │  │  └─ hot_swap?: boolean<br/>│  │  │  └─ interface?: string<br/>│  │  │  └─ replaceable?: boolean<br/>│  │  └─ eeprom_bios?: object<br/>│  │  │  └─ capacity_kb?: null<br/>│  │  │  └─ included?: boolean<br/>│  │  │  └─ purpose?: string<br/>│  │  └─ expansion_slots?: object<br/>│  │  │  └─ future_pin_area_reserved_for_bits?: number<br/>│  │  │  └─ plug_and_execute?: boolean<br/>│  │  │  └─ width_bits?: number<br/>│  │  └─ rom_eeprom_cartridge_slots?: object<br/>│  │  │  └─ front?: string<br/>│  │  │  └─ rear?: string<br/>│  └─ manufacturing_planning?: object<br/>│  │  └─ die_area_mm2?: number<br/>│  │  └─ die_area_mm2_target?: number<br/>│  │  └─ initial_manufacturer?: string<br/>│  │  └─ node_um?: number<br/>│  │  └─ policy?: string<br/>│  │  └─ transistor_budget_target?: number<br/>│  │  └─ wafer_diameter_mm?: number<br/>│  └─ memory_constraints?: object<br/>│  │  └─ max_ram_kib?: number | null<br/>│  │  └─ mixed_module_types_allowed?: boolean<br/>│  └─ memory_interface?: object<br/>│  │  └─ expansion_id?: string → device<br/>│  │  └─ organization_id?: string → technology<br/>│  │  └─ system_controller_id?: string → base_part<br/>│  └─ memory_mapping?: object<br/>│  │  └─ application_memory?: string<br/>│  │  └─ configuration?: string<br/>│  │  └─ installation?: string<br/>│  │  └─ normal_cpu_range?: string<br/>│  │  └─ page_count?: number<br/>│  │  └─ page_size_kb?: number<br/>│  │  └─ service_calls?: string<br/>│  │  └─ slot_count?: number<br/>│  │  └─ system_workspace?: string<br/>│  └─ packaging?: string<br/>│  └─ physical_population?: object<br/>│  │  └─ capacity_kb?: number<br/>│  │  └─ chip_id?: string → base_part<br/>│  │  └─ data_chip_count?: number<br/>│  │  └─ data_width_bits?: number<br/>│  │  └─ refresh_owner?: string<br/>│  └─ planned_compatible_with?: array&lt;string&gt; → device<br/>│  └─ processor?: object<br/>│  │  └─ part_id?: string → base_part<br/>│  └─ recommended_software_id?: string → software_edition<br/>│  └─ role?: string<br/>│  └─ slot_count?: number<br/>│  └─ specification?: object<br/>│  │  └─ acceleration?: array&lt;string&gt;<br/>│  │  └─ adaptation?: string<br/>│  │  └─ adapter_requirements?: object<br/>│  │  │  └─ buffer_policy?: string<br/>│  │  │  └─ flow_control?: string<br/>│  │  │  └─ hardware_services?: array&lt;string&gt;<br/>│  │  │  └─ host_service?: string<br/>│  │  │  └─ local_packet_ram_target_bytes?: number<br/>│  │  └─ additions?: array&lt;string&gt;<br/>│  │  └─ analog_chain?: string<br/>│  │  └─ api_id?: string → technology<br/>│  │  └─ arbitration?: string<br/>│  │  └─ array_columns?: number<br/>│  │  └─ array_rows?: number<br/>│  │  └─ bandwidth?: string<br/>│  │  └─ bank_capacity_kb?: number<br/>│  │  └─ bank_control?: string<br/>│  │  └─ bank_data_width_bits?: number<br/>│  │  └─ bank_organization?: string<br/>│  │  └─ base_controller_id?: string → base_part<br/>│  │  └─ base_product_id?: string → base_part<br/>│  │  └─ beam_voltage_levels?: number<br/>│  │  └─ bitmap_modes?: array&lt;object&gt;<br/>│  │  │  └─ bits_per_pixel?: number<br/>│  │  │  └─ bytes_per_framebuffer?: number<br/>│  │  │  └─ compatibility_mode?: boolean<br/>│  │  │  └─ configurations?: array&lt;object&gt;<br/>│  │  │  │  └─ allocated_bytes?: number<br/>│  │  │  │  └─ framebuffer_bytes?: number<br/>│  │  │  │  └─ framebuffer_count?: number<br/>│  │  │  │  └─ palette_list_bytes?: number<br/>│  │  │  │  └─ remaining_video_ram_bytes?: number<br/>│  │  │  │  └─ sprite_count?: number<br/>│  │  │  └─ double_buffering?: boolean<br/>│  │  │  └─ framebuffer_bytes?: number<br/>│  │  │  └─ framebuffer_count?: number<br/>│  │  │  └─ height?: number<br/>│  │  │  └─ id?: string<br/>│  │  │  └─ palette_list_bytes?: number<br/>│  │  │  └─ remaining_bytes?: number<br/>│  │  │  └─ required_raster_ids?: array&lt;string&gt;<br/>│  │  │  └─ simultaneous_values?: number<br/>│  │  │  └─ sprites_available?: number<br/>│  │  │  └─ stride_bytes?: number<br/>│  │  │  └─ width?: number<br/>│  │  └─ boot?: string<br/>│  │  └─ bridge_design_id?: string → technology<br/>│  │  └─ buttons?: number<br/>│  │  └─ capabilities?: object<br/>│  │  │  └─ color_model?: string<br/>│  │  │  └─ maximum_pixel_clock_mhz?: number<br/>│  │  │  └─ palette_precision_bits?: number<br/>│  │  │  └─ preferred_raster_id?: string<br/>│  │  │  └─ programmable_palette?: boolean<br/>│  │  │  └─ protocol_version?: number<br/>│  │  │  └─ raster_ids?: array&lt;string&gt;<br/>│  │  └─ capacity_bytes?: number<br/>│  │  └─ capacity_kb?: number | null<br/>│  │  └─ capacity_kbit?: number<br/>│  │  └─ capacity_mb?: number<br/>│  │  └─ card_id?: string → device<br/>│  │  └─ character_row_cache?: object<br/>│  │  │  └─ banks?: number<br/>│  │  │  └─ bytes_per_bank?: number<br/>│  │  │  └─ purpose?: string<br/>│  │  │  └─ total_bytes?: number<br/>│  │  └─ chip_organization?: string<br/>│  │  └─ chip_type_id?: string → base_part<br/>│  │  └─ chips?: number<br/>│  │  └─ chips_per_rank?: number<br/>│  │  └─ class_protocol_id?: string → technology<br/>│  │  └─ clock_mhz?: number<br/>│  │  └─ compatibility?: string<br/>│  │  └─ connection?: string<br/>│  │  └─ continuity?: string<br/>│  │  └─ controller_die_count?: null<br/>│  │  └─ controller_id?: string → base_part<br/>│  │  └─ conversion?: string<br/>│  │  └─ cpu_address_bits?: number<br/>│  │  └─ cpu_id?: string → base_part<br/>│  │  └─ crt_id?: string → base_part<br/>│  │  └─ cursor_keys?: string<br/>│  │  └─ data_width_bits?: number<br/>│  │  └─ density?: string<br/>│  │  └─ diagonal_inch?: number<br/>│  │  └─ diagonal_inches?: number<br/>│  │  └─ die_area_mm2?: number<br/>│  │  └─ die_area_planning_mm2?: number<br/>│  │  └─ digital_output_bits?: number<br/>│  │  └─ disk_formats?: array&lt;string&gt;<br/>│  │  └─ disk_ii_interface?: boolean<br/>│  │  └─ disk_interface?: string<br/>│  │  └─ display_controller_id?: string → base_part<br/>│  │  └─ display_memory?: object<br/>│  │  │  └─ bank_data_width_bits?: number<br/>│  │  │  └─ capacity_bytes?: number<br/>│  │  │  └─ chip_count?: number<br/>│  │  │  └─ chip_id?: string → base_part<br/>│  │  │  └─ organization?: string<br/>│  │  └─ display_modes?: string<br/>│  │  └─ display_subassembly_id?: string → base_part<br/>│  │  └─ displayed_color_registers?: number<br/>│  │  └─ displayed_registers?: number<br/>│  │  └─ dma?: object<br/>│  │  │  └─ active_transfer_engines?: number<br/>│  │  │  └─ address_steps?: array&lt;string&gt;<br/>│  │  │  └─ arbitration?: string<br/>│  │  │  └─ bank_selection?: string<br/>│  │  │  └─ completion?: string<br/>│  │  │  └─ destination_address_bits?: number<br/>│  │  │  └─ length_bits?: number<br/>│  │  │  └─ operations?: array&lt;string&gt;<br/>│  │  │  └─ peripheral_scope?: string<br/>│  │  │  └─ transfer_contexts?: number<br/>│  │  │  └─ video_endpoint?: string<br/>│  │  └─ dot_pitch_mm?: number<br/>│  │  └─ electrical_contract?: string<br/>│  │  └─ electrical_interface?: string<br/>│  │  └─ ergonomics?: string<br/>│  │  └─ execution?: string<br/>│  │  └─ expansion_role?: string<br/>│  │  └─ fdd_density?: string<br/>│  │  └─ fdd_size_inch?: number<br/>│  │  └─ feature_continuity_id?: string → device<br/>│  │  └─ flexibus_ports?: number<br/>│  │  └─ format?: string<br/>│  │  └─ formatted_capacity_kb?: null<br/>│  │  └─ function_keys?: string<br/>│  │  └─ grayscale_levels?: number<br/>│  │  └─ hdd_bundled_with_standard_artemis?: boolean<br/>│  │  └─ hdd_interface_supported?: boolean<br/>│  │  └─ historical_raster?: string<br/>│  │  └─ host?: string<br/>│  │  └─ host_access?: string<br/>│  │  └─ host_clock_mhz?: array&lt;number&gt;<br/>│  │  └─ host_integration?: string<br/>│  │  └─ host_interface?: schema-defined<br/>│  │  └─ implementation?: string<br/>│  │  └─ implementation_design?: object<br/>│  │  │  └─ arbitration?: string<br/>│  │  │  └─ clock_targets?: object<br/>│  │  │  │  └─ high_resolution_pixel_mhz?: number<br/>│  │  │  │  └─ low_resolution_pixel_mhz?: number<br/>│  │  │  │  └─ master_mhz?: number<br/>│  │  │  │  └─ maximum_pixel_fifo_output_mbytes_per_second?: number<br/>│  │  │  │  └─ scope?: string<br/>│  │  │  └─ engines?: object<br/>│  │  │  │  └─ fifo?: string<br/>│  │  │  │  └─ renderer?: string<br/>│  │  │  │  └─ scanout?: string<br/>│  │  │  │  └─ underrun?: string<br/>│  │  │  └─ internal_buffers?: object<br/>│  │  │  │  └─ character_attribute_row_cache_bytes?: number<br/>│  │  │  │  └─ included_in_die_estimates?: boolean<br/>│  │  │  │  └─ next_character_attribute_row_cache_bytes?: number<br/>│  │  │  │  └─ pixel_bits?: number<br/>│  │  │  │  └─ pixel_fifo_bytes?: number<br/>│  │  │  │  └─ pixel_fifo_page_bytes?: number<br/>│  │  │  │  └─ pixel_fifo_page_count?: number<br/>│  │  │  │  └─ sprite_row_shifters_bytes?: number<br/>│  │  │  │  └─ sprite_staging_bytes?: number<br/>│  │  │  │  └─ total_storage_bytes?: number<br/>│  │  │  └─ line_repeat?: string<br/>│  │  │  └─ manufacturing_planning?: object<br/>│  │  │  │  └─ die_area_mm2_at_3_5um_range?: array&lt;number&gt;<br/>│  │  │  │  └─ die_area_mm2_at_3um_range?: array&lt;number&gt;<br/>│  │  │  │  └─ die_area_mm2_central_at_3_5um?: number<br/>│  │  │  │  └─ die_area_mm2_central_at_3um?: number<br/>│  │  │  │  └─ external_functions?: array&lt;string&gt;<br/>│  │  │  │  └─ process?: string<br/>│  │  │  │  └─ transistors_central?: number<br/>│  │  │  │  └─ transistors_range?: array&lt;number&gt;<br/>│  │  │  └─ sprite_access?: string<br/>│  │  │  └─ text_fetch?: string<br/>│  │  │  └─ timing_budget?: object<br/>│  │  │  │  └─ dram_random_cycle_target_ns?: number<br/>│  │  │  │  └─ fifo_total_drain_time_us_at_high_resolution?: number<br/>│  │  │  │  └─ fifo_total_pixels?: number<br/>│  │  │  │  └─ illustrative_read_time_us?: number<br/>│  │  │  │  └─ illustrative_total_reads_per_scanline?: number<br/>│  │  │  │  └─ maximum_sprite_row_bytes_per_scanline?: number<br/>│  │  │  │  └─ next_row_prefetch_average_bytes_per_scanline?: number<br/>│  │  │  │  └─ qualification?: string<br/>│  │  │  │  └─ sprite_pattern_fetch_time_us?: number<br/>│  │  │  │  └─ sprite_sram_cycle_target_ns?: number<br/>│  │  │  │  └─ text_glyph_reads_per_scanline?: number<br/>│  │  │  │  └─ two_ready_pages_drain_time_us?: number<br/>│  │  └─ included_monitor?: boolean<br/>│  │  └─ input?: string<br/>│  │  └─ input_bits?: number<br/>│  │  └─ installation?: string<br/>│  │  └─ intensity_levels?: number<br/>│  │  └─ interface?: string<br/>│  │  └─ interface_id?: string → technology<br/>│  │  └─ key_count?: number<br/>│  │  └─ keyboard_standard_id?: string → technology<br/>│  │  └─ legacy_card_id?: string → device<br/>│  │  └─ link_layer_id?: string → technology<br/>│  │  └─ local_packet_ram_target_bytes?: number<br/>│  │  └─ local_ram_kb?: number<br/>│  │  └─ manufacturer?: string<br/>│  │  └─ manufacturing_planning?: object<br/>│  │  │  └─ die_area_mm2?: number<br/>│  │  │  └─ die_area_mm2_central?: number<br/>│  │  │  └─ die_area_mm2_range?: array&lt;number&gt;<br/>│  │  │  └─ package_allowance_usd?: number<br/>│  │  │  └─ recipe_variants?: array&lt;object&gt;<br/>│  │  │  │  └─ defect_density_cm2?: number<br/>│  │  │  │  └─ die_area_mm2?: number<br/>│  │  │  │  └─ id?: string<br/>│  │  │  │  └─ manufacturing_capability_id?: string → manufacturing_capability<br/>│  │  │  │  └─ node_um?: string<br/>│  │  │  │  └─ processed_wafer_usd?: number<br/>│  │  │  └─ revision_policy?: string<br/>│  │  │  └─ wafer_mm?: number<br/>│  │  └─ manufacturing_recipe?: string<br/>│  │  └─ maximum_shared_raw_rate_kbps?: number<br/>│  │  └─ mechanism_id?: string → base_part<br/>│  │  └─ media?: string<br/>│  │  └─ media_access_control?: string<br/>│  │  └─ memory_addressing_bytes?: number<br/>│  │  └─ memory_layout?: object<br/>│  │  │  └─ font_policy?: string<br/>│  │  │  └─ mode_exclusivity?: string<br/>│  │  │  └─ page_flip?: string<br/>│  │  │  └─ policy_id?: string → technology<br/>│  │  └─ mode_discovery?: string<br/>│  │  └─ mode_limit?: string<br/>│  │  └─ mode_policy?: string<br/>│  │  └─ model?: string<br/>│  │  └─ modules_per_bank?: number<br/>│  │  └─ monitor_id?: string → device<br/>│  │  └─ monitor_modes?: string<br/>│  │  └─ monitor_policy?: string<br/>│  │  └─ native_raster?: object<br/>│  │  │  └─ height?: number<br/>│  │  │  └─ horizontal_khz?: number<br/>│  │  │  └─ pixel_clock_mhz?: number<br/>│  │  │  └─ progressive?: boolean<br/>│  │  │  └─ refresh_hz_target?: number<br/>│  │  │  └─ total_lines?: number<br/>│  │  │  └─ total_pixels?: number<br/>│  │  │  └─ width?: number<br/>│  │  └─ navigation_section?: array&lt;string&gt;<br/>│  │  └─ negotiation_id?: string → technology<br/>│  │  └─ node_um?: number<br/>│  │  └─ numeric_keypad?: boolean<br/>│  │  └─ oem?: string<br/>│  │  └─ oem_basis?: string<br/>│  │  └─ organization?: string<br/>│  │  └─ organization_words?: number<br/>│  │  └─ output?: string<br/>│  │  └─ package?: string | null<br/>│  │  └─ page_size_kb?: number<br/>│  │  └─ palette?: string<br/>│  │  └─ palette_entries?: number<br/>│  │  └─ palette_entry_bits?: number<br/>│  │  └─ palette_grayscale_levels?: number<br/>│  │  └─ palette_list?: object<br/>│  │  │  └─ base_address?: string<br/>│  │  │  └─ cad_policy?: string<br/>│  │  │  └─ command_bytes?: number<br/>│  │  │  └─ encoding?: string<br/>│  │  │  └─ end_address?: string<br/>│  │  │  └─ execution?: string<br/>│  │  │  └─ frame_state?: string<br/>│  │  │  └─ long_gaps?: string<br/>│  │  │  └─ maximum_commands?: number<br/>│  │  │  └─ register_count?: number<br/>│  │  │  └─ reserved_bytes?: number<br/>│  │  │  └─ write_limit?: string<br/>│  │  └─ palette_list_id?: string → technology<br/>│  │  └─ palette_registers?: number<br/>│  │  └─ parity_bits?: number<br/>│  │  └─ physical_arrangement?: string<br/>│  │  └─ physical_population?: object<br/>│  │  │  └─ bank_count?: number<br/>│  │  │  └─ bank_data_width_bits?: number<br/>│  │  │  └─ common_ram_included?: boolean<br/>│  │  │  └─ mapping_note?: string<br/>│  │  │  └─ parity_bits?: number<br/>│  │  │  └─ video_ram_separate?: boolean<br/>│  │  └─ pixel_buffer?: object<br/>│  │  │  └─ bits_per_pixel?: number<br/>│  │  │  └─ bytes_per_page?: number<br/>│  │  │  └─ location?: string<br/>│  │  │  └─ page_states?: array&lt;string&gt;<br/>│  │  │  └─ pages?: number<br/>│  │  │  └─ physical_organization?: string<br/>│  │  │  └─ pixels_per_page?: number<br/>│  │  │  └─ policy?: string<br/>│  │  │  └─ total_bytes?: number<br/>│  │  └─ pixel_clock_mhz?: number<br/>│  │  └─ platform_rate_profiles?: array&lt;object&gt;<br/>│  │  │  └─ computer_id?: string → device<br/>│  │  │  └─ implementation?: string<br/>│  │  │  └─ qualified_max_rate_kbps?: number<br/>│  │  │  └─ rate_policy?: string<br/>│  │  │  └─ server_role?: boolean<br/>│  │  │  └─ supported_rates_kbps?: array&lt;number&gt;<br/>│  │  │  └─ technology_ids?: array&lt;string&gt; → technology<br/>│  │  └─ port_count?: number<br/>│  │  └─ ports?: array&lt;string&gt;<br/>│  │  └─ power?: string<br/>│  │  └─ purchase_boundary?: string<br/>│  │  └─ qualification?: string<br/>│  │  └─ random_cycle_target_ns?: number<br/>│  │  └─ rank_capacity_kb?: number<br/>│  │  └─ ranks?: number<br/>│  │  └─ rate_scope?: string<br/>│  │  └─ redraw?: string<br/>│  │  └─ refresh?: schema-defined<br/>│  │  └─ refresh_required?: boolean<br/>│  │  └─ register_width_bits?: number<br/>│  │  └─ reused_elements?: array&lt;string&gt;<br/>│  │  └─ rgb_palette_mapping?: string<br/>│  │  └─ role?: string<br/>│  │  └─ rollers?: array&lt;object&gt;<br/>│  │  │  └─ default_action?: string<br/>│  │  │  └─ position?: string<br/>│  │  └─ scan?: string<br/>│  │  └─ separate_sprite_sram_bytes?: number<br/>│  │  └─ serial_register_bits?: number<br/>│  │  └─ sides?: number<br/>│  │  └─ signal_path?: string<br/>│  │  └─ simultaneous_shades_at_640_200_4bpp?: number<br/>│  │  └─ simultaneous_shades_at_800_600_2bpp?: number<br/>│  │  └─ simultaneous_shades_with_128kb_card?: number<br/>│  │  └─ size_inch?: number<br/>│  │  └─ slot?: string<br/>│  │  └─ software?: string<br/>│  │  └─ speed_qualification_targets?: object<br/>│  │  │  └─ basis?: string<br/>│  │  │  └─ conditions?: string<br/>│  │  │  └─ fallback_random_cycle_ns_range?: array&lt;number&gt;<br/>│  │  │  └─ fallback_row_access_ns?: number<br/>│  │  │  └─ preferred_random_cycle_ns?: number<br/>│  │  │  └─ preferred_row_access_ns?: number<br/>│  │  │  └─ stretch_row_access_ns?: number<br/>│  │  └─ sprite_memory?: object<br/>│  │  │  └─ bank_data_width_bits?: number<br/>│  │  │  └─ capacity_bytes?: number<br/>│  │  │  └─ chip_count?: number<br/>│  │  │  └─ chip_id?: string → base_part<br/>│  │  │  └─ separate_bus?: boolean<br/>│  │  │  └─ separate_from_system_and_display_ram?: boolean<br/>│  │  └─ sprite_physical_population?: object<br/>│  │  │  └─ bank_data_width_bits?: number<br/>│  │  │  └─ separate_bus?: boolean<br/>│  │  │  └─ separate_from_system_and_display_ram?: boolean<br/>│  │  └─ sprite_policy?: string<br/>│  │  └─ sprite_profile_ref?: object<br/>│  │  │  └─ profile?: string<br/>│  │  │  └─ technology_id?: string → technology<br/>│  │  └─ sprites?: schema-defined<br/>│  │  └─ startup_rate_kbps?: number<br/>│  │  └─ supply_rails_v?: array | null<br/>│  │  └─ supported_fdd_count?: number<br/>│  │  └─ supported_rates_kbps?: array&lt;number&gt;<br/>│  │  └─ technology_id?: string → technology<br/>│  │  └─ text_modes?: array&lt;object&gt;<br/>│  │  │  └─ attribute_format?: string<br/>│  │  │  └─ attribute_map_bytes_per_buffer?: number<br/>│  │  │  └─ character_count?: number<br/>│  │  │  └─ character_map_bytes_per_buffer?: number<br/>│  │  │  └─ columns?: number<br/>│  │  │  └─ configurations?: array&lt;object&gt;<br/>│  │  │  │  └─ allocated_bytes?: number<br/>│  │  │  │  └─ palette_list_bytes?: number<br/>│  │  │  │  └─ remaining_video_ram_bytes?: number<br/>│  │  │  │  └─ sprite_count?: number<br/>│  │  │  │  └─ text_buffer_count?: number<br/>│  │  │  └─ double_buffering?: boolean<br/>│  │  │  └─ font_bytes?: number<br/>│  │  │  └─ glyph_height?: number<br/>│  │  │  └─ glyph_width?: number<br/>│  │  │  └─ height?: number<br/>│  │  │  └─ id?: string<br/>│  │  │  └─ ram_bytes_per_page?: number<br/>│  │  │  └─ required_raster_ids?: array&lt;string&gt;<br/>│  │  │  └─ rows?: number<br/>│  │  │  └─ sprites_available?: number<br/>│  │  │  └─ width?: number<br/>│  │  └─ timing_budget?: object<br/>│  │  │  └─ page_drain_microseconds?: number<br/>│  │  │  └─ pixel_clock_mhz?: number<br/>│  │  │  └─ qualification?: string<br/>│  │  │  └─ renderer_pixels_per_step?: number<br/>│  │  │  └─ renderer_step_mhz?: number<br/>│  │  └─ timing_target?: object<br/>│  │  │  └─ horizontal_khz?: number<br/>│  │  │  └─ horizontal_total_pixels?: number<br/>│  │  │  └─ pixel_clock_mhz?: number<br/>│  │  │  └─ refresh_hz?: number<br/>│  │  │  └─ vertical_total_lines?: number<br/>│  │  └─ tracking?: string<br/>│  │  └─ transport_id?: string → technology<br/>│  │  └─ usable_from?: array&lt;string&gt;<br/>│  │  └─ video_link_id?: string → technology<br/>│  │  └─ video_physical_population?: object<br/>│  │  │  └─ bank_data_width_bits?: number<br/>│  │  │  └─ separate_from_system_ram?: boolean<br/>│  │  └─ video_ram_bytes?: number<br/>│  │  └─ video_ram_chip_count?: number<br/>│  │  └─ video_ram_chip_id?: string → base_part<br/>│  │  └─ video_ram_kb?: number<br/>│  └─ specification_id?: string → technology<br/>│  └─ technical_profile?: object<br/>│  │  └─ memory?: object<br/>│  │  │  └─ bank_data_width_bits?: number<br/>│  │  │  └─ capacity_policy?: string<br/>│  │  │  └─ expanded_organization?: object<br/>│  │  │  │  └─ application_memory_profile?: string<br/>│  │  │  │  └─ common_system_ram_kb?: number<br/>│  │  │  │  └─ contiguous_lower_ram_kb?: number<br/>│  │  │  │  └─ controller_id?: string → base_part<br/>│  │  │  │  └─ dma_addressing?: string<br/>│  │  │  │  └─ normal_view?: array&lt;object&gt;<br/>│  │  │  │  │  └─ description?: string<br/>│  │  │  │  │  └─ end?: string<br/>│  │  │  │  │  └─ role?: string<br/>│  │  │  │  │  └─ start?: string<br/>│  │  │  │  └─ note?: string<br/>│  │  │  │  └─ ram_kb?: number<br/>│  │  │  │  └─ refresh?: string<br/>│  │  │  └─ expansion_ref?: string → device<br/>│  │  │  └─ organization?: object<br/>│  │  │  │  └─ application_memory_profile?: string<br/>│  │  │  │  └─ common_system_ram_kb?: number<br/>│  │  │  │  └─ contiguous_lower_ram_kb?: number<br/>│  │  │  │  └─ controller_id?: string → base_part<br/>│  │  │  │  └─ dma_addressing?: string<br/>│  │  │  │  └─ normal_view?: array&lt;object&gt;<br/>│  │  │  │  │  └─ description?: string<br/>│  │  │  │  │  └─ end?: string<br/>│  │  │  │  │  └─ role?: string<br/>│  │  │  │  │  └─ start?: string<br/>│  │  │  │  └─ note?: string<br/>│  │  │  │  └─ refresh?: string<br/>│  │  │  └─ organization_ref?: string → technology<br/>│  │  │  └─ os_rom?: object<br/>│  │  │  │  └─ capacity_bytes?: number<br/>│  │  │  │  └─ execution?: string<br/>│  │  │  │  └─ implementation?: string<br/>│  │  │  └─ parity_bits?: number<br/>│  │  │  └─ physical_population?: object<br/>│  │  │  │  └─ bank_count?: number<br/>│  │  │  │  └─ bank_data_width_bits?: number<br/>│  │  │  │  └─ common_ram_included?: boolean<br/>│  │  │  │  └─ mapping_note?: string<br/>│  │  │  │  └─ parity_bits?: number<br/>│  │  │  │  └─ video_ram_separate?: boolean<br/>│  │  │  └─ population_policy?: string<br/>│  │  │  └─ reliability_policy?: string<br/>│  │  │  └─ sourcing_policy?: string<br/>│  │  │  └─ sprite_physical_population?: object<br/>│  │  │  │  └─ bank_data_width_bits?: number<br/>│  │  │  │  └─ separate_bus?: boolean<br/>│  │  │  │  └─ separate_from_system_and_display_ram?: boolean<br/>│  │  │  └─ system_controller_ref?: string → base_part<br/>│  │  │  └─ upgrade_policy?: string<br/>│  │  │  └─ video_physical_population?: object<br/>│  │  │  │  └─ bank_data_width_bits?: number<br/>│  │  │  │  └─ separate_from_system_ram?: boolean<br/>│  │  └─ network?: object<br/>│  │  │  └─ computer_id?: string → device<br/>│  │  └─ networking?: object<br/>│  │  │  └─ computer_id?: string → device<br/>│  │  │  └─ implementation?: string<br/>│  │  │  └─ qualified_max_rate_kbps?: number<br/>│  │  │  └─ rate_policy?: string<br/>│  │  │  └─ server_role?: boolean<br/>│  │  │  └─ supported_rates_kbps?: array&lt;number&gt;<br/>│  │  │  └─ technology_ids?: array&lt;string&gt; → technology<br/>│  │  └─ rom_and_cartridges?: object<br/>│  │  │  └─ mainboard_rom?: array&lt;string&gt;<br/>│  │  └─ software_compatibility?: object<br/>│  │  │  └─ adaptive_text?: string<br/>│  │  │  └─ api_id?: string → technology<br/>│  │  │  └─ native_40_column_mode?: string<br/>│  │  │  └─ native_target?: string<br/>│  │  └─ software_policy?: string<br/>│  │  └─ video?: object<br/>│  │  │  └─ controller_id?: string → base_part<br/>│  │  │  └─ sprite_memory?: object<br/>│  │  │  │  └─ bank_data_width_bits?: number<br/>│  │  │  │  └─ separate_bus?: boolean<br/>│  │  │  │  └─ separate_from_system_and_display_ram?: boolean<br/>│  │  │  └─ sprite_physical_population?: object<br/>│  │  │  │  └─ bank_data_width_bits?: number<br/>│  │  │  │  └─ separate_bus?: boolean<br/>│  │  │  │  └─ separate_from_system_and_display_ram?: boolean<br/>│  │  │  └─ video_physical_population?: object<br/>│  │  │  │  └─ bank_data_width_bits?: number<br/>│  │  │  │  └─ separate_from_system_ram?: boolean<br/>specification*: array&lt;object&gt;<br/>│  └─ number*: integer<br/>│  └─ type*: string<br/>│  └─ description*: string<br/>│  └─ value?: string | number | boolean | null<br/>requirements*: array&lt;object&gt;<br/>│  └─ number*: integer<br/>│  └─ kind*: string<br/>│  └─ description*: string<br/>│  └─ subject_ids?: array&lt;string&gt; → any foundation ID<br/>technical_specification?: object<br/>│  └─ chapters*: array&lt;object&gt;<br/>│  │  └─ number*: integer<br/>│  │  └─ chapter_name*: string<br/>│  │  └─ description*: string<br/>│  └─ parameters*: array&lt;object&gt;<br/>│  │  └─ key*: string<br/>│  │  └─ value?: string | number | null<br/>│  │  └─ ref_id?: string → actor / technology / base_part / device / software_edition / product / external_product / manufacturing_capability<br/>│  │  └─ ref_role?: string<br/>graphic_modes_specification?: array&lt;object&gt;<br/>│  └─ id*: string<br/>│  └─ description*: string<br/>│  └─ type*: string<br/>│  └─ width*: integer | null<br/>│  └─ height*: integer | null<br/>│  └─ framebuffer_size*: integer | null<br/>│  └─ double_buffering*: boolean | null<br/>│  └─ sprites_available*: integer | null<br/>│  └─ parameters*: array&lt;object&gt;<br/>│  │  └─ key*: string<br/>│  │  └─ value?: string | number | null<br/>│  │  └─ ref_id?: string → actor / technology / base_part / device / software_edition / product / external_product / manufacturing_capability<br/>│  │  └─ ref_role?: string</pre>"]:::schemaEntity
  campaign["<pre style='text-align:left;font-family:monospace;white-space:pre;margin:0'>campaign.json<br/>id*: string<br/>title*: string<br/>objective*: string<br/>lead_actor_ids*: array&lt;string&gt; → actor<br/>message?: array&lt;string&gt;<br/>audience?: array&lt;string&gt;<br/>period*: object<br/>│  └─ start*: object<br/>│  │  └─ value*: string | null<br/>│  │  └─ precision*: string<br/>│  └─ end*: object<br/>│  │  └─ value*: string | null<br/>│  │  └─ precision*: string<br/>category?: string<br/>marketing_steps*: array&lt;object&gt;<br/>│  └─ id*: string<br/>│  └─ number*: integer<br/>│  └─ type*: string<br/>│  └─ description*: string<br/>│  └─ reference_id?: string → event / process<br/>│  └─ marketing_presentation*: array&lt;object&gt;<br/>│  │  └─ number*: integer<br/>│  │  └─ description*: string<br/>│  │  └─ parameters*: array&lt;object&gt;<br/>│  │  │  └─ key*: string<br/>│  │  │  └─ value?: string | number<br/>│  │  │  └─ ref_id?: string → actor / product / external_product / technology / device / software_edition / agreement / manufacturing_capability / market_response / location / base_part</pre>"]:::schemaEntity
  device["<pre style='text-align:left;font-family:monospace;white-space:pre;margin:0'>device.json<br/>id*: string<br/>name*: string<br/>description*: string<br/>provider_actor_ids*: array&lt;string&gt; → actor<br/>technology_ids*: array&lt;string&gt; → technology<br/>kind*: string<br/>composition_history*: array&lt;object&gt;<br/>│  └─ version_number*: integer<br/>│  └─ description*: string<br/>│  └─ effective_from*: schema-defined<br/>│  └─ effective_until*: schema-defined<br/>│  └─ technical_definition*: object<br/>│  │  └─ athena_qualification?: string<br/>│  │  └─ capacity_kb?: number<br/>│  │  └─ compatibility_note?: string<br/>│  │  └─ compatible_computers?: array&lt;string&gt; → device<br/>│  │  └─ compatible_with?: array&lt;string&gt; → device<br/>│  │  └─ configuration_requirements?: object<br/>│  │  │  └─ external_application_cartridges_supported?: boolean<br/>│  │  │  └─ rules?: array&lt;string&gt;<br/>│  │  │  └─ scope?: string<br/>│  │  └─ connection?: string<br/>│  │  └─ firmware_contents?: array&lt;string&gt;<br/>│  │  └─ form_factor?: string<br/>│  │  └─ host_qualification?: object<br/>│  │  │  └─ device.base_computer.artemis?: object<br/>│  │  │  │  └─ computer_id?: string → device<br/>│  │  │  │  └─ implementation?: string<br/>│  │  │  │  └─ qualified_max_rate_kbps?: number<br/>│  │  │  │  └─ rate_policy?: string<br/>│  │  │  │  └─ supported_rates_kbps?: array&lt;number&gt;<br/>│  │  │  │  └─ technology_ids?: array&lt;string&gt; → technology<br/>│  │  │  └─ device.base_computer.artemis_pro?: object<br/>│  │  │  │  └─ computer_id?: string → device<br/>│  │  │  │  └─ implementation?: string<br/>│  │  │  │  └─ qualified_max_rate_kbps?: number<br/>│  │  │  │  └─ rate_policy?: string<br/>│  │  │  │  └─ server_role?: boolean<br/>│  │  │  │  └─ supported_rates_kbps?: array&lt;number&gt;<br/>│  │  │  │  └─ technology_ids?: array&lt;string&gt; → technology<br/>│  │  │  └─ device.base_computer.athena?: object<br/>│  │  │  │  └─ computer_id?: string → device<br/>│  │  │  └─ device.base_computer.athena_server?: object<br/>│  │  │  │  └─ computer_id?: string → device<br/>│  │  │  └─ device.base_computer.aurelia?: object<br/>│  │  │  │  └─ computer_id?: string → device<br/>│  │  │  │  └─ qualified_max_rate_kbps?: number<br/>│  │  │  │  └─ rate_policy?: string<br/>│  │  │  │  └─ supported_rates_kbps?: array&lt;number&gt;<br/>│  │  │  │  └─ technology_ids?: array&lt;string&gt; → technology<br/>│  │  │  └─ device.base_computer.aurelia_plus?: object<br/>│  │  │  │  └─ computer_id?: string → device<br/>│  │  │  │  └─ qualified_max_rate_kbps?: number<br/>│  │  │  │  └─ rate_policy?: string<br/>│  │  │  │  └─ supported_rates_kbps?: array&lt;number&gt;<br/>│  │  │  │  └─ technology_ids?: array&lt;string&gt; → technology<br/>│  │  └─ integration_requirements?: object<br/>│  │  │  └─ sourcing_policy?: string<br/>│  │  └─ io_and_expansion?: object<br/>│  │  │  └─ application_rom_cards_supported?: boolean<br/>│  │  │  └─ dedicated_video_slot?: object<br/>│  │  │  │  └─ general_purpose_slots_consumed?: number<br/>│  │  │  │  └─ hot_swap?: boolean<br/>│  │  │  │  └─ interface?: string<br/>│  │  │  │  └─ replaceable?: boolean<br/>│  │  │  └─ eeprom_bios?: object<br/>│  │  │  │  └─ capacity_kb?: null<br/>│  │  │  │  └─ included?: boolean<br/>│  │  │  │  └─ purpose?: string<br/>│  │  │  └─ expansion_slots?: object<br/>│  │  │  │  └─ future_pin_area_reserved_for_bits?: number<br/>│  │  │  │  └─ plug_and_execute?: boolean<br/>│  │  │  │  └─ width_bits?: number<br/>│  │  │  └─ rom_eeprom_cartridge_slots?: object<br/>│  │  │  │  └─ front?: string<br/>│  │  │  │  └─ rear?: string<br/>│  │  └─ manufacturing_planning?: object<br/>│  │  │  └─ die_area_mm2?: number<br/>│  │  │  └─ die_area_mm2_target?: number<br/>│  │  │  └─ initial_manufacturer?: string<br/>│  │  │  └─ node_um?: number<br/>│  │  │  └─ policy?: string<br/>│  │  │  └─ transistor_budget_target?: number<br/>│  │  │  └─ wafer_diameter_mm?: number<br/>│  │  └─ memory_constraints?: object<br/>│  │  │  └─ max_ram_kib?: number | null<br/>│  │  │  └─ mixed_module_types_allowed?: boolean<br/>│  │  └─ memory_interface?: object<br/>│  │  │  └─ expansion_id?: string → device<br/>│  │  │  └─ organization_id?: string → technology<br/>│  │  │  └─ system_controller_id?: string → base_part<br/>│  │  └─ memory_mapping?: object<br/>│  │  │  └─ application_memory?: string<br/>│  │  │  └─ configuration?: string<br/>│  │  │  └─ installation?: string<br/>│  │  │  └─ normal_cpu_range?: string<br/>│  │  │  └─ page_count?: number<br/>│  │  │  └─ page_size_kb?: number<br/>│  │  │  └─ service_calls?: string<br/>│  │  │  └─ slot_count?: number<br/>│  │  │  └─ system_workspace?: string<br/>│  │  └─ packaging?: string<br/>│  │  └─ physical_population?: object<br/>│  │  │  └─ capacity_kb?: number<br/>│  │  │  └─ chip_id?: string → base_part<br/>│  │  │  └─ data_chip_count?: number<br/>│  │  │  └─ data_width_bits?: number<br/>│  │  │  └─ refresh_owner?: string<br/>│  │  └─ planned_compatible_with?: array&lt;string&gt; → device<br/>│  │  └─ processor?: object<br/>│  │  │  └─ part_id?: string → base_part<br/>│  │  └─ recommended_software_id?: string → software_edition<br/>│  │  └─ role?: string<br/>│  │  └─ slot_count?: number<br/>│  │  └─ specification?: object<br/>│  │  │  └─ acceleration?: array&lt;string&gt;<br/>│  │  │  └─ adaptation?: string<br/>│  │  │  └─ adapter_requirements?: object<br/>│  │  │  │  └─ buffer_policy?: string<br/>│  │  │  │  └─ flow_control?: string<br/>│  │  │  │  └─ hardware_services?: array&lt;string&gt;<br/>│  │  │  │  └─ host_service?: string<br/>│  │  │  │  └─ local_packet_ram_target_bytes?: number<br/>│  │  │  └─ additions?: array&lt;string&gt;<br/>│  │  │  └─ analog_chain?: string<br/>│  │  │  └─ api_id?: string → technology<br/>│  │  │  └─ arbitration?: string<br/>│  │  │  └─ array_columns?: number<br/>│  │  │  └─ array_rows?: number<br/>│  │  │  └─ bandwidth?: string<br/>│  │  │  └─ bank_capacity_kb?: number<br/>│  │  │  └─ bank_control?: string<br/>│  │  │  └─ bank_data_width_bits?: number<br/>│  │  │  └─ bank_organization?: string<br/>│  │  │  └─ base_controller_id?: string → base_part<br/>│  │  │  └─ base_product_id?: string → base_part<br/>│  │  │  └─ beam_voltage_levels?: number<br/>│  │  │  └─ bitmap_modes?: array&lt;object&gt;<br/>│  │  │  │  └─ bits_per_pixel?: number<br/>│  │  │  │  └─ bytes_per_framebuffer?: number<br/>│  │  │  │  └─ compatibility_mode?: boolean<br/>│  │  │  │  └─ configurations?: array&lt;object&gt;<br/>│  │  │  │  │  └─ allocated_bytes?: number<br/>│  │  │  │  │  └─ framebuffer_bytes?: number<br/>│  │  │  │  │  └─ framebuffer_count?: number<br/>│  │  │  │  │  └─ palette_list_bytes?: number<br/>│  │  │  │  │  └─ remaining_video_ram_bytes?: number<br/>│  │  │  │  │  └─ sprite_count?: number<br/>│  │  │  │  └─ double_buffering?: boolean<br/>│  │  │  │  └─ framebuffer_bytes?: number<br/>│  │  │  │  └─ framebuffer_count?: number<br/>│  │  │  │  └─ height?: number<br/>│  │  │  │  └─ id?: string<br/>│  │  │  │  └─ palette_list_bytes?: number<br/>│  │  │  │  └─ remaining_bytes?: number<br/>│  │  │  │  └─ required_raster_ids?: array&lt;string&gt;<br/>│  │  │  │  └─ simultaneous_values?: number<br/>│  │  │  │  └─ sprites_available?: number<br/>│  │  │  │  └─ stride_bytes?: number<br/>│  │  │  │  └─ width?: number<br/>│  │  │  └─ boot?: string<br/>│  │  │  └─ bridge_design_id?: string → technology<br/>│  │  │  └─ buttons?: number<br/>│  │  │  └─ capabilities?: object<br/>│  │  │  │  └─ color_model?: string<br/>│  │  │  │  └─ maximum_pixel_clock_mhz?: number<br/>│  │  │  │  └─ palette_precision_bits?: number<br/>│  │  │  │  └─ preferred_raster_id?: string<br/>│  │  │  │  └─ programmable_palette?: boolean<br/>│  │  │  │  └─ protocol_version?: number<br/>│  │  │  │  └─ raster_ids?: array&lt;string&gt;<br/>│  │  │  └─ capacity_bytes?: number<br/>│  │  │  └─ capacity_kb?: number | null<br/>│  │  │  └─ capacity_kbit?: number<br/>│  │  │  └─ capacity_mb?: number<br/>│  │  │  └─ card_id?: string → device<br/>│  │  │  └─ character_row_cache?: object<br/>│  │  │  │  └─ banks?: number<br/>│  │  │  │  └─ bytes_per_bank?: number<br/>│  │  │  │  └─ purpose?: string<br/>│  │  │  │  └─ total_bytes?: number<br/>│  │  │  └─ chip_organization?: string<br/>│  │  │  └─ chip_type_id?: string → base_part<br/>│  │  │  └─ chips?: number<br/>│  │  │  └─ chips_per_rank?: number<br/>│  │  │  └─ class_protocol_id?: string → technology<br/>│  │  │  └─ clock_mhz?: number<br/>│  │  │  └─ compatibility?: string<br/>│  │  │  └─ connection?: string<br/>│  │  │  └─ continuity?: string<br/>│  │  │  └─ controller_die_count?: null<br/>│  │  │  └─ controller_id?: string → base_part<br/>│  │  │  └─ conversion?: string<br/>│  │  │  └─ cpu_address_bits?: number<br/>│  │  │  └─ cpu_id?: string → base_part<br/>│  │  │  └─ crt_id?: string → base_part<br/>│  │  │  └─ cursor_keys?: string<br/>│  │  │  └─ data_width_bits?: number<br/>│  │  │  └─ density?: string<br/>│  │  │  └─ diagonal_inch?: number<br/>│  │  │  └─ diagonal_inches?: number<br/>│  │  │  └─ die_area_mm2?: number<br/>│  │  │  └─ die_area_planning_mm2?: number<br/>│  │  │  └─ digital_output_bits?: number<br/>│  │  │  └─ disk_formats?: array&lt;string&gt;<br/>│  │  │  └─ disk_ii_interface?: boolean<br/>│  │  │  └─ disk_interface?: string<br/>│  │  │  └─ display_controller_id?: string → base_part<br/>│  │  │  └─ display_memory?: object<br/>│  │  │  │  └─ bank_data_width_bits?: number<br/>│  │  │  │  └─ capacity_bytes?: number<br/>│  │  │  │  └─ chip_count?: number<br/>│  │  │  │  └─ chip_id?: string → base_part<br/>│  │  │  │  └─ organization?: string<br/>│  │  │  └─ display_modes?: string<br/>│  │  │  └─ display_subassembly_id?: string → base_part<br/>│  │  │  └─ displayed_color_registers?: number<br/>│  │  │  └─ displayed_registers?: number<br/>│  │  │  └─ dma?: object<br/>│  │  │  │  └─ active_transfer_engines?: number<br/>│  │  │  │  └─ address_steps?: array&lt;string&gt;<br/>│  │  │  │  └─ arbitration?: string<br/>│  │  │  │  └─ bank_selection?: string<br/>│  │  │  │  └─ completion?: string<br/>│  │  │  │  └─ destination_address_bits?: number<br/>│  │  │  │  └─ length_bits?: number<br/>│  │  │  │  └─ operations?: array&lt;string&gt;<br/>│  │  │  │  └─ peripheral_scope?: string<br/>│  │  │  │  └─ transfer_contexts?: number<br/>│  │  │  │  └─ video_endpoint?: string<br/>│  │  │  └─ dot_pitch_mm?: number<br/>│  │  │  └─ electrical_contract?: string<br/>│  │  │  └─ electrical_interface?: string<br/>│  │  │  └─ ergonomics?: string<br/>│  │  │  └─ execution?: string<br/>│  │  │  └─ expansion_role?: string<br/>│  │  │  └─ fdd_density?: string<br/>│  │  │  └─ fdd_size_inch?: number<br/>│  │  │  └─ feature_continuity_id?: string → device<br/>│  │  │  └─ flexibus_ports?: number<br/>│  │  │  └─ format?: string<br/>│  │  │  └─ formatted_capacity_kb?: null<br/>│  │  │  └─ function_keys?: string<br/>│  │  │  └─ grayscale_levels?: number<br/>│  │  │  └─ hdd_bundled_with_standard_artemis?: boolean<br/>│  │  │  └─ hdd_interface_supported?: boolean<br/>│  │  │  └─ historical_raster?: string<br/>│  │  │  └─ host?: string<br/>│  │  │  └─ host_access?: string<br/>│  │  │  └─ host_clock_mhz?: array&lt;number&gt;<br/>│  │  │  └─ host_integration?: string<br/>│  │  │  └─ host_interface?: schema-defined<br/>│  │  │  └─ implementation?: string<br/>│  │  │  └─ implementation_design?: object<br/>│  │  │  │  └─ arbitration?: string<br/>│  │  │  │  └─ clock_targets?: object<br/>│  │  │  │  │  └─ high_resolution_pixel_mhz?: number<br/>│  │  │  │  │  └─ low_resolution_pixel_mhz?: number<br/>│  │  │  │  │  └─ master_mhz?: number<br/>│  │  │  │  │  └─ maximum_pixel_fifo_output_mbytes_per_second?: number<br/>│  │  │  │  │  └─ scope?: string<br/>│  │  │  │  └─ engines?: object<br/>│  │  │  │  │  └─ fifo?: string<br/>│  │  │  │  │  └─ renderer?: string<br/>│  │  │  │  │  └─ scanout?: string<br/>│  │  │  │  │  └─ underrun?: string<br/>│  │  │  │  └─ internal_buffers?: object<br/>│  │  │  │  │  └─ character_attribute_row_cache_bytes?: number<br/>│  │  │  │  │  └─ included_in_die_estimates?: boolean<br/>│  │  │  │  │  └─ next_character_attribute_row_cache_bytes?: number<br/>│  │  │  │  │  └─ pixel_bits?: number<br/>│  │  │  │  │  └─ pixel_fifo_bytes?: number<br/>│  │  │  │  │  └─ pixel_fifo_page_bytes?: number<br/>│  │  │  │  │  └─ pixel_fifo_page_count?: number<br/>│  │  │  │  │  └─ sprite_row_shifters_bytes?: number<br/>│  │  │  │  │  └─ sprite_staging_bytes?: number<br/>│  │  │  │  │  └─ total_storage_bytes?: number<br/>│  │  │  │  └─ line_repeat?: string<br/>│  │  │  │  └─ manufacturing_planning?: object<br/>│  │  │  │  │  └─ die_area_mm2_at_3_5um_range?: array&lt;number&gt;<br/>│  │  │  │  │  └─ die_area_mm2_at_3um_range?: array&lt;number&gt;<br/>│  │  │  │  │  └─ die_area_mm2_central_at_3_5um?: number<br/>│  │  │  │  │  └─ die_area_mm2_central_at_3um?: number<br/>│  │  │  │  │  └─ external_functions?: array&lt;string&gt;<br/>│  │  │  │  │  └─ process?: string<br/>│  │  │  │  │  └─ transistors_central?: number<br/>│  │  │  │  │  └─ transistors_range?: array&lt;number&gt;<br/>│  │  │  │  └─ sprite_access?: string<br/>│  │  │  │  └─ text_fetch?: string<br/>│  │  │  │  └─ timing_budget?: object<br/>│  │  │  │  │  └─ dram_random_cycle_target_ns?: number<br/>│  │  │  │  │  └─ fifo_total_drain_time_us_at_high_resolution?: number<br/>│  │  │  │  │  └─ fifo_total_pixels?: number<br/>│  │  │  │  │  └─ illustrative_read_time_us?: number<br/>│  │  │  │  │  └─ illustrative_total_reads_per_scanline?: number<br/>│  │  │  │  │  └─ maximum_sprite_row_bytes_per_scanline?: number<br/>│  │  │  │  │  └─ next_row_prefetch_average_bytes_per_scanline?: number<br/>│  │  │  │  │  └─ qualification?: string<br/>│  │  │  │  │  └─ sprite_pattern_fetch_time_us?: number<br/>│  │  │  │  │  └─ sprite_sram_cycle_target_ns?: number<br/>│  │  │  │  │  └─ text_glyph_reads_per_scanline?: number<br/>│  │  │  │  │  └─ two_ready_pages_drain_time_us?: number<br/>│  │  │  └─ included_monitor?: boolean<br/>│  │  │  └─ input?: string<br/>│  │  │  └─ input_bits?: number<br/>│  │  │  └─ installation?: string<br/>│  │  │  └─ intensity_levels?: number<br/>│  │  │  └─ interface?: string<br/>│  │  │  └─ interface_id?: string → technology<br/>│  │  │  └─ key_count?: number<br/>│  │  │  └─ keyboard_standard_id?: string → technology<br/>│  │  │  └─ legacy_card_id?: string → device<br/>│  │  │  └─ link_layer_id?: string → technology<br/>│  │  │  └─ local_packet_ram_target_bytes?: number<br/>│  │  │  └─ local_ram_kb?: number<br/>│  │  │  └─ manufacturer?: string<br/>│  │  │  └─ manufacturing_planning?: object<br/>│  │  │  │  └─ die_area_mm2?: number<br/>│  │  │  │  └─ die_area_mm2_central?: number<br/>│  │  │  │  └─ die_area_mm2_range?: array&lt;number&gt;<br/>│  │  │  │  └─ package_allowance_usd?: number<br/>│  │  │  │  └─ recipe_variants?: array&lt;object&gt;<br/>│  │  │  │  │  └─ defect_density_cm2?: number<br/>│  │  │  │  │  └─ die_area_mm2?: number<br/>│  │  │  │  │  └─ id?: string<br/>│  │  │  │  │  └─ manufacturing_capability_id?: string → manufacturing_capability<br/>│  │  │  │  │  └─ node_um?: string<br/>│  │  │  │  │  └─ processed_wafer_usd?: number<br/>│  │  │  │  └─ revision_policy?: string<br/>│  │  │  │  └─ wafer_mm?: number<br/>│  │  │  └─ manufacturing_recipe?: string<br/>│  │  │  └─ maximum_shared_raw_rate_kbps?: number<br/>│  │  │  └─ mechanism_id?: string → base_part<br/>│  │  │  └─ media?: string<br/>│  │  │  └─ media_access_control?: string<br/>│  │  │  └─ memory_addressing_bytes?: number<br/>│  │  │  └─ memory_layout?: object<br/>│  │  │  │  └─ font_policy?: string<br/>│  │  │  │  └─ mode_exclusivity?: string<br/>│  │  │  │  └─ page_flip?: string<br/>│  │  │  │  └─ policy_id?: string → technology<br/>│  │  │  └─ mode_discovery?: string<br/>│  │  │  └─ mode_limit?: string<br/>│  │  │  └─ mode_policy?: string<br/>│  │  │  └─ model?: string<br/>│  │  │  └─ modules_per_bank?: number<br/>│  │  │  └─ monitor_id?: string → device<br/>│  │  │  └─ monitor_modes?: string<br/>│  │  │  └─ monitor_policy?: string<br/>│  │  │  └─ native_raster?: object<br/>│  │  │  │  └─ height?: number<br/>│  │  │  │  └─ horizontal_khz?: number<br/>│  │  │  │  └─ pixel_clock_mhz?: number<br/>│  │  │  │  └─ progressive?: boolean<br/>│  │  │  │  └─ refresh_hz_target?: number<br/>│  │  │  │  └─ total_lines?: number<br/>│  │  │  │  └─ total_pixels?: number<br/>│  │  │  │  └─ width?: number<br/>│  │  │  └─ navigation_section?: array&lt;string&gt;<br/>│  │  │  └─ negotiation_id?: string → technology<br/>│  │  │  └─ node_um?: number<br/>│  │  │  └─ numeric_keypad?: boolean<br/>│  │  │  └─ oem?: string<br/>│  │  │  └─ oem_basis?: string<br/>│  │  │  └─ organization?: string<br/>│  │  │  └─ organization_words?: number<br/>│  │  │  └─ output?: string<br/>│  │  │  └─ package?: string | null<br/>│  │  │  └─ page_size_kb?: number<br/>│  │  │  └─ palette?: string<br/>│  │  │  └─ palette_entries?: number<br/>│  │  │  └─ palette_entry_bits?: number<br/>│  │  │  └─ palette_grayscale_levels?: number<br/>│  │  │  └─ palette_list?: object<br/>│  │  │  │  └─ base_address?: string<br/>│  │  │  │  └─ cad_policy?: string<br/>│  │  │  │  └─ command_bytes?: number<br/>│  │  │  │  └─ encoding?: string<br/>│  │  │  │  └─ end_address?: string<br/>│  │  │  │  └─ execution?: string<br/>│  │  │  │  └─ frame_state?: string<br/>│  │  │  │  └─ long_gaps?: string<br/>│  │  │  │  └─ maximum_commands?: number<br/>│  │  │  │  └─ register_count?: number<br/>│  │  │  │  └─ reserved_bytes?: number<br/>│  │  │  │  └─ write_limit?: string<br/>│  │  │  └─ palette_list_id?: string → technology<br/>│  │  │  └─ palette_registers?: number<br/>│  │  │  └─ parity_bits?: number<br/>│  │  │  └─ physical_arrangement?: string<br/>│  │  │  └─ physical_population?: object<br/>│  │  │  │  └─ bank_count?: number<br/>│  │  │  │  └─ bank_data_width_bits?: number<br/>│  │  │  │  └─ common_ram_included?: boolean<br/>│  │  │  │  └─ mapping_note?: string<br/>│  │  │  │  └─ parity_bits?: number<br/>│  │  │  │  └─ video_ram_separate?: boolean<br/>│  │  │  └─ pixel_buffer?: object<br/>│  │  │  │  └─ bits_per_pixel?: number<br/>│  │  │  │  └─ bytes_per_page?: number<br/>│  │  │  │  └─ location?: string<br/>│  │  │  │  └─ page_states?: array&lt;string&gt;<br/>│  │  │  │  └─ pages?: number<br/>│  │  │  │  └─ physical_organization?: string<br/>│  │  │  │  └─ pixels_per_page?: number<br/>│  │  │  │  └─ policy?: string<br/>│  │  │  │  └─ total_bytes?: number<br/>│  │  │  └─ pixel_clock_mhz?: number<br/>│  │  │  └─ platform_rate_profiles?: array&lt;object&gt;<br/>│  │  │  │  └─ computer_id?: string → device<br/>│  │  │  │  └─ implementation?: string<br/>│  │  │  │  └─ qualified_max_rate_kbps?: number<br/>│  │  │  │  └─ rate_policy?: string<br/>│  │  │  │  └─ server_role?: boolean<br/>│  │  │  │  └─ supported_rates_kbps?: array&lt;number&gt;<br/>│  │  │  │  └─ technology_ids?: array&lt;string&gt; → technology<br/>│  │  │  └─ port_count?: number<br/>│  │  │  └─ ports?: array&lt;string&gt;<br/>│  │  │  └─ power?: string<br/>│  │  │  └─ purchase_boundary?: string<br/>│  │  │  └─ qualification?: string<br/>│  │  │  └─ random_cycle_target_ns?: number<br/>│  │  │  └─ rank_capacity_kb?: number<br/>│  │  │  └─ ranks?: number<br/>│  │  │  └─ rate_scope?: string<br/>│  │  │  └─ redraw?: string<br/>│  │  │  └─ refresh?: schema-defined<br/>│  │  │  └─ refresh_required?: boolean<br/>│  │  │  └─ register_width_bits?: number<br/>│  │  │  └─ reused_elements?: array&lt;string&gt;<br/>│  │  │  └─ rgb_palette_mapping?: string<br/>│  │  │  └─ role?: string<br/>│  │  │  └─ rollers?: array&lt;object&gt;<br/>│  │  │  │  └─ default_action?: string<br/>│  │  │  │  └─ position?: string<br/>│  │  │  └─ scan?: string<br/>│  │  │  └─ separate_sprite_sram_bytes?: number<br/>│  │  │  └─ serial_register_bits?: number<br/>│  │  │  └─ sides?: number<br/>│  │  │  └─ signal_path?: string<br/>│  │  │  └─ simultaneous_shades_at_640_200_4bpp?: number<br/>│  │  │  └─ simultaneous_shades_at_800_600_2bpp?: number<br/>│  │  │  └─ simultaneous_shades_with_128kb_card?: number<br/>│  │  │  └─ size_inch?: number<br/>│  │  │  └─ slot?: string<br/>│  │  │  └─ software?: string<br/>│  │  │  └─ speed_qualification_targets?: object<br/>│  │  │  │  └─ basis?: string<br/>│  │  │  │  └─ conditions?: string<br/>│  │  │  │  └─ fallback_random_cycle_ns_range?: array&lt;number&gt;<br/>│  │  │  │  └─ fallback_row_access_ns?: number<br/>│  │  │  │  └─ preferred_random_cycle_ns?: number<br/>│  │  │  │  └─ preferred_row_access_ns?: number<br/>│  │  │  │  └─ stretch_row_access_ns?: number<br/>│  │  │  └─ sprite_memory?: object<br/>│  │  │  │  └─ bank_data_width_bits?: number<br/>│  │  │  │  └─ capacity_bytes?: number<br/>│  │  │  │  └─ chip_count?: number<br/>│  │  │  │  └─ chip_id?: string → base_part<br/>│  │  │  │  └─ separate_bus?: boolean<br/>│  │  │  │  └─ separate_from_system_and_display_ram?: boolean<br/>│  │  │  └─ sprite_physical_population?: object<br/>│  │  │  │  └─ bank_data_width_bits?: number<br/>│  │  │  │  └─ separate_bus?: boolean<br/>│  │  │  │  └─ separate_from_system_and_display_ram?: boolean<br/>│  │  │  └─ sprite_policy?: string<br/>│  │  │  └─ sprite_profile_ref?: object<br/>│  │  │  │  └─ profile?: string<br/>│  │  │  │  └─ technology_id?: string → technology<br/>│  │  │  └─ sprites?: schema-defined<br/>│  │  │  └─ startup_rate_kbps?: number<br/>│  │  │  └─ supply_rails_v?: array | null<br/>│  │  │  └─ supported_fdd_count?: number<br/>│  │  │  └─ supported_rates_kbps?: array&lt;number&gt;<br/>│  │  │  └─ technology_id?: string → technology<br/>│  │  │  └─ text_modes?: array&lt;object&gt;<br/>│  │  │  │  └─ attribute_format?: string<br/>│  │  │  │  └─ attribute_map_bytes_per_buffer?: number<br/>│  │  │  │  └─ character_count?: number<br/>│  │  │  │  └─ character_map_bytes_per_buffer?: number<br/>│  │  │  │  └─ columns?: number<br/>│  │  │  │  └─ configurations?: array&lt;object&gt;<br/>│  │  │  │  │  └─ allocated_bytes?: number<br/>│  │  │  │  │  └─ palette_list_bytes?: number<br/>│  │  │  │  │  └─ remaining_video_ram_bytes?: number<br/>│  │  │  │  │  └─ sprite_count?: number<br/>│  │  │  │  │  └─ text_buffer_count?: number<br/>│  │  │  │  └─ double_buffering?: boolean<br/>│  │  │  │  └─ font_bytes?: number<br/>│  │  │  │  └─ glyph_height?: number<br/>│  │  │  │  └─ glyph_width?: number<br/>│  │  │  │  └─ height?: number<br/>│  │  │  │  └─ id?: string<br/>│  │  │  │  └─ ram_bytes_per_page?: number<br/>│  │  │  │  └─ required_raster_ids?: array&lt;string&gt;<br/>│  │  │  │  └─ rows?: number<br/>│  │  │  │  └─ sprites_available?: number<br/>│  │  │  │  └─ width?: number<br/>│  │  │  └─ timing_budget?: object<br/>│  │  │  │  └─ page_drain_microseconds?: number<br/>│  │  │  │  └─ pixel_clock_mhz?: number<br/>│  │  │  │  └─ qualification?: string<br/>│  │  │  │  └─ renderer_pixels_per_step?: number<br/>│  │  │  │  └─ renderer_step_mhz?: number<br/>│  │  │  └─ timing_target?: object<br/>│  │  │  │  └─ horizontal_khz?: number<br/>│  │  │  │  └─ horizontal_total_pixels?: number<br/>│  │  │  │  └─ pixel_clock_mhz?: number<br/>│  │  │  │  └─ refresh_hz?: number<br/>│  │  │  │  └─ vertical_total_lines?: number<br/>│  │  │  └─ tracking?: string<br/>│  │  │  └─ transport_id?: string → technology<br/>│  │  │  └─ usable_from?: array&lt;string&gt;<br/>│  │  │  └─ video_link_id?: string → technology<br/>│  │  │  └─ video_physical_population?: object<br/>│  │  │  │  └─ bank_data_width_bits?: number<br/>│  │  │  │  └─ separate_from_system_ram?: boolean<br/>│  │  │  └─ video_ram_bytes?: number<br/>│  │  │  └─ video_ram_chip_count?: number<br/>│  │  │  └─ video_ram_chip_id?: string → base_part<br/>│  │  │  └─ video_ram_kb?: number<br/>│  │  └─ specification_id?: string → technology<br/>│  │  └─ technical_profile?: object<br/>│  │  │  └─ memory?: object<br/>│  │  │  │  └─ bank_data_width_bits?: number<br/>│  │  │  │  └─ capacity_policy?: string<br/>│  │  │  │  └─ expanded_organization?: object<br/>│  │  │  │  │  └─ application_memory_profile?: string<br/>│  │  │  │  │  └─ common_system_ram_kb?: number<br/>│  │  │  │  │  └─ contiguous_lower_ram_kb?: number<br/>│  │  │  │  │  └─ controller_id?: string → base_part<br/>│  │  │  │  │  └─ dma_addressing?: string<br/>│  │  │  │  │  └─ normal_view?: array&lt;object&gt;<br/>│  │  │  │  │  │  └─ description?: string<br/>│  │  │  │  │  │  └─ end?: string<br/>│  │  │  │  │  │  └─ role?: string<br/>│  │  │  │  │  │  └─ start?: string<br/>│  │  │  │  │  └─ note?: string<br/>│  │  │  │  │  └─ ram_kb?: number<br/>│  │  │  │  │  └─ refresh?: string<br/>│  │  │  │  └─ expansion_ref?: string → device<br/>│  │  │  │  └─ organization?: object<br/>│  │  │  │  │  └─ application_memory_profile?: string<br/>│  │  │  │  │  └─ common_system_ram_kb?: number<br/>│  │  │  │  │  └─ contiguous_lower_ram_kb?: number<br/>│  │  │  │  │  └─ controller_id?: string → base_part<br/>│  │  │  │  │  └─ dma_addressing?: string<br/>│  │  │  │  │  └─ normal_view?: array&lt;object&gt;<br/>│  │  │  │  │  │  └─ description?: string<br/>│  │  │  │  │  │  └─ end?: string<br/>│  │  │  │  │  │  └─ role?: string<br/>│  │  │  │  │  │  └─ start?: string<br/>│  │  │  │  │  └─ note?: string<br/>│  │  │  │  │  └─ refresh?: string<br/>│  │  │  │  └─ organization_ref?: string → technology<br/>│  │  │  │  └─ os_rom?: object<br/>│  │  │  │  │  └─ capacity_bytes?: number<br/>│  │  │  │  │  └─ execution?: string<br/>│  │  │  │  │  └─ implementation?: string<br/>│  │  │  │  └─ parity_bits?: number<br/>│  │  │  │  └─ physical_population?: object<br/>│  │  │  │  │  └─ bank_count?: number<br/>│  │  │  │  │  └─ bank_data_width_bits?: number<br/>│  │  │  │  │  └─ common_ram_included?: boolean<br/>│  │  │  │  │  └─ mapping_note?: string<br/>│  │  │  │  │  └─ parity_bits?: number<br/>│  │  │  │  │  └─ video_ram_separate?: boolean<br/>│  │  │  │  └─ population_policy?: string<br/>│  │  │  │  └─ reliability_policy?: string<br/>│  │  │  │  └─ sourcing_policy?: string<br/>│  │  │  │  └─ sprite_physical_population?: object<br/>│  │  │  │  │  └─ bank_data_width_bits?: number<br/>│  │  │  │  │  └─ separate_bus?: boolean<br/>│  │  │  │  │  └─ separate_from_system_and_display_ram?: boolean<br/>│  │  │  │  └─ system_controller_ref?: string → base_part<br/>│  │  │  │  └─ upgrade_policy?: string<br/>│  │  │  │  └─ video_physical_population?: object<br/>│  │  │  │  │  └─ bank_data_width_bits?: number<br/>│  │  │  │  │  └─ separate_from_system_ram?: boolean<br/>│  │  │  └─ network?: object<br/>│  │  │  │  └─ computer_id?: string → device<br/>│  │  │  └─ networking?: object<br/>│  │  │  │  └─ computer_id?: string → device<br/>│  │  │  │  └─ implementation?: string<br/>│  │  │  │  └─ qualified_max_rate_kbps?: number<br/>│  │  │  │  └─ rate_policy?: string<br/>│  │  │  │  └─ server_role?: boolean<br/>│  │  │  │  └─ supported_rates_kbps?: array&lt;number&gt;<br/>│  │  │  │  └─ technology_ids?: array&lt;string&gt; → technology<br/>│  │  │  └─ rom_and_cartridges?: object<br/>│  │  │  │  └─ mainboard_rom?: array&lt;string&gt;<br/>│  │  │  └─ software_compatibility?: object<br/>│  │  │  │  └─ adaptive_text?: string<br/>│  │  │  │  └─ api_id?: string → technology<br/>│  │  │  │  └─ native_40_column_mode?: string<br/>│  │  │  │  └─ native_target?: string<br/>│  │  │  └─ software_policy?: string<br/>│  │  │  └─ video?: object<br/>│  │  │  │  └─ controller_id?: string → base_part<br/>│  │  │  │  └─ sprite_memory?: object<br/>│  │  │  │  │  └─ bank_data_width_bits?: number<br/>│  │  │  │  │  └─ separate_bus?: boolean<br/>│  │  │  │  │  └─ separate_from_system_and_display_ram?: boolean<br/>│  │  │  │  └─ sprite_physical_population?: object<br/>│  │  │  │  │  └─ bank_data_width_bits?: number<br/>│  │  │  │  │  └─ separate_bus?: boolean<br/>│  │  │  │  │  └─ separate_from_system_and_display_ram?: boolean<br/>│  │  │  │  └─ video_physical_population?: object<br/>│  │  │  │  │  └─ bank_data_width_bits?: number<br/>│  │  │  │  │  └─ separate_from_system_ram?: boolean<br/>│  └─ composition_definition*: array&lt;object&gt;<br/>│  │  └─ id*: string<br/>│  │  └─ target*: schema-defined<br/>│  │  └─ quantity*: number | null<br/>│  │  └─ connection?: schema-defined<br/>│  │  └─ placements?: array&lt;object&gt;<br/>│  │  │  └─ host_line_id*: string<br/>│  │  │  └─ host_instance*: integer<br/>│  │  │  └─ socket_id*: string<br/>│  │  │  └─ quantity*: number<br/>│  │  └─ element_type?: string<br/>│  └─ assembly_requirements*: array&lt;object&gt;<br/>│  │  └─ number*: integer<br/>│  │  └─ kind*: string<br/>│  │  └─ description*: string<br/>│  │  └─ subject_ids?: array&lt;string&gt; → any foundation ID<br/>│  └─ expansion_socket_groups?: array&lt;object&gt;<br/>│  │  └─ id?: string<br/>│  │  └─ name?: string<br/>│  │  └─ sockets?: array&lt;object&gt;<br/>│  │  │  └─ capacity?: number | null<br/>│  │  │  └─ compatible_device_ids?: array&lt;string&gt; → device<br/>│  │  │  └─ connection?: string<br/>│  │  │  └─ device_quantity_limits?: object<br/>│  │  │  │  └─ device.aurelia_ram_16kb_card?: number<br/>│  │  │  └─ id?: string<br/>│  │  │  └─ installation_multiple?: number<br/>│  │  │  └─ matched_modules?: boolean<br/>│  │  │  └─ name?: string<br/>│  │  │  └─ population_order?: string<br/>│  │  │  └─ requirements?: array&lt;string&gt;<br/>requirements*: array&lt;object&gt;<br/>│  └─ number*: integer<br/>│  └─ kind*: string<br/>│  └─ description*: string<br/>│  └─ subject_ids?: array&lt;string&gt; → any foundation ID<br/>technical_specification?: object<br/>│  └─ chapters*: array&lt;object&gt;<br/>│  │  └─ number*: integer<br/>│  │  └─ chapter_name*: string<br/>│  │  └─ description*: string<br/>│  └─ parameters*: array&lt;object&gt;<br/>│  │  └─ key*: string<br/>│  │  └─ value?: string | number | null<br/>│  │  └─ ref_id?: string → actor / technology / base_part / device / software_edition / product / external_product / manufacturing_capability<br/>│  │  └─ ref_role?: string<br/>graphic_modes_specification?: array&lt;object&gt;<br/>│  └─ id*: string<br/>│  └─ description*: string<br/>│  └─ type*: string<br/>│  └─ width*: integer | null<br/>│  └─ height*: integer | null<br/>│  └─ framebuffer_size*: integer | null<br/>│  └─ double_buffering*: boolean | null<br/>│  └─ sprites_available*: integer | null<br/>│  └─ parameters*: array&lt;object&gt;<br/>│  │  └─ key*: string<br/>│  │  └─ value?: string | number | null<br/>│  │  └─ ref_id?: string → actor / technology / base_part / device / software_edition / product / external_product / manufacturing_capability<br/>│  │  └─ ref_role?: string</pre>"]:::schemaEntity
  event["<pre style='text-align:left;font-family:monospace;white-space:pre;margin:0'>event.json<br/>id*: string<br/>title*: string<br/>kind*: string<br/>description*: string<br/>participant*: array&lt;object&gt;<br/>│  └─ actor_id*: string → actor<br/>│  └─ role*: string<br/>subject_ids?: array&lt;string&gt; → any foundation ID<br/>inputs*: array&lt;object&gt;<br/>│  └─ number*: integer<br/>│  └─ type*: string<br/>│  └─ description*: string<br/>│  └─ subject_ids?: array&lt;string&gt; → any foundation ID<br/>│  └─ event_id?: string → event<br/>│  └─ process_id?: string → process<br/>outcomes*: array&lt;object&gt;<br/>│  └─ number*: integer<br/>│  └─ type*: string<br/>│  └─ description*: string<br/>│  └─ subject_ids?: array&lt;string&gt; → any foundation ID<br/>│  └─ event_id?: string → event<br/>│  └─ process_id?: string → process<br/>time*: object<br/>│  └─ value*: string<br/>│  └─ precision*: string<br/>process_ids?: array&lt;schema-defined&gt;<br/>location_ids?: array&lt;string&gt; → location<br/>agreement_id?: string → agreement</pre>"]:::schemaEntity
  external_product["<pre style='text-align:left;font-family:monospace;white-space:pre;margin:0'>external_products.json<br/>id*: string<br/>name*: string<br/>description*: string<br/>specification*: array&lt;object&gt;<br/>│  └─ number*: integer<br/>│  └─ chapter_name*: string<br/>│  └─ description*: string<br/>│  └─ parameters*: array&lt;object&gt;<br/>│  │  └─ key*: string<br/>│  │  └─ value*: string<br/>kind?: string<br/>provider_actor_ids?: array&lt;string&gt; → actor<br/>release?: string<br/>impacted_standards?: array&lt;object&gt;<br/>│  └─ standard_id*: string → technology<br/>│  └─ date*: string<br/>│  └─ assumption_description*: string<br/>│  └─ comparison_description*: string<br/>│  └─ outcomes_description*: string<br/>│  └─ parameters*: array&lt;object&gt;<br/>│  │  └─ key*: string<br/>│  │  └─ value*: string</pre>"]:::schemaEntity
  location["<pre style='text-align:left;font-family:monospace;white-space:pre;margin:0'>location.json<br/>id*: string<br/>name*: string<br/>kind*: string<br/>parent_location_id?: string → location<br/>description?: string</pre>"]:::schemaEntity
  manufacturing_capability["<pre style='text-align:left;font-family:monospace;white-space:pre;margin:0'>manufacturing_capability.json<br/>id*: string<br/>name*: string<br/>actor_id*: string → actor<br/>location_id?: string → location<br/>technology_id*: string → technology<br/>recipe_kind*: string<br/>product_ids?: array&lt;schema-defined&gt;<br/>description*: string<br/>qualification_requirements*: array&lt;object&gt;<br/>│  └─ number*: integer<br/>│  └─ type*: string<br/>│  └─ description*: string<br/>│  └─ subject_ids?: array&lt;string&gt; → any foundation ID<br/>│  └─ event_id?: string → event<br/>│  └─ process_id?: string → process<br/>base_part_ids?: array&lt;string&gt; → base_part</pre>"]:::schemaEntity
  market_response["<pre style='text-align:left;font-family:monospace;white-space:pre;margin:0'>market_response.json<br/>id*: string<br/>title*: string<br/>kind*: string<br/>respondent_actor_ids*: array&lt;string&gt; → actor<br/>subject_ids*: array&lt;string&gt; → any foundation ID<br/>trigger_ids*: array&lt;string&gt; → event / process / campaign / agreement<br/>description*: string</pre>"]:::schemaEntity
  process["<pre style='text-align:left;font-family:monospace;white-space:pre;margin:0'>process.json<br/>id*: string<br/>title*: string<br/>kind*: string<br/>description*: string<br/>participant*: array&lt;object&gt;<br/>│  └─ actor_id*: string → actor<br/>│  └─ role*: string<br/>subject_ids?: array&lt;string&gt; → any foundation ID<br/>inputs*: array&lt;object&gt;<br/>│  └─ number*: integer<br/>│  └─ type*: string<br/>│  └─ description*: string<br/>│  └─ subject_ids?: array&lt;string&gt; → any foundation ID<br/>│  └─ event_id?: string → event<br/>│  └─ process_id?: string → process<br/>outcomes*: array&lt;object&gt;<br/>│  └─ number*: integer<br/>│  └─ type*: string<br/>│  └─ description*: string<br/>│  └─ subject_ids?: array&lt;string&gt; → any foundation ID<br/>period*: object<br/>│  └─ start*: object<br/>│  │  └─ value*: string | null → event<br/>│  │  └─ precision*: string<br/>│  └─ end*: object<br/>│  │  └─ value*: string | null → event<br/>│  │  └─ precision*: string<br/>steps*: array&lt;object&gt;<br/>│  └─ number*: integer<br/>│  └─ type*: string<br/>│  └─ description*: string<br/>│  └─ event_id?: string → event<br/>│  └─ process_id?: string → process<br/>│  └─ campaign_id?: string → campaign<br/>related_process_ids?: array&lt;string&gt; → process<br/>agreement_id?: string → agreement<br/>category?: string</pre>"]:::schemaEntity
  product["<pre style='text-align:left;font-family:monospace;white-space:pre;margin:0'>product.json<br/>id*: string<br/>name*: string<br/>kind*: string<br/>description*: string<br/>provider_actor_ids*: array&lt;string&gt; → actor<br/>version?: string<br/>specification*: array&lt;object&gt;<br/>│  └─ number*: integer<br/>│  └─ type*: string<br/>│  └─ description*: string<br/>│  └─ value?: string | number | boolean<br/>offering_category?: string<br/>technical_identity?: object<br/>│  └─ record_id*: string → base_part / device / software_edition<br/>launch_campaign_id?: string → campaign<br/>composition_history?: array&lt;object&gt;<br/>│  └─ version_number*: integer<br/>│  └─ description*: string<br/>│  └─ effective_from*: schema-defined<br/>│  └─ effective_until*: schema-defined<br/>│  └─ composition_definition*: array&lt;object&gt;<br/>│  │  └─ id*: string<br/>│  │  └─ target*: schema-defined<br/>│  │  └─ quantity*: number | null<br/>│  │  └─ connection?: schema-defined<br/>│  │  └─ placements?: array&lt;object&gt;<br/>│  │  │  └─ host_line_id*: string<br/>│  │  │  └─ host_instance*: integer<br/>│  │  │  └─ socket_id*: string<br/>│  │  │  └─ quantity*: number<br/>│  │  └─ element_type?: string<br/>│  └─ assembly_requirements*: array&lt;object&gt;<br/>│  │  └─ number*: integer<br/>│  │  └─ kind*: string<br/>│  │  └─ description*: string<br/>│  │  └─ subject_ids?: array&lt;string&gt; → any foundation ID<br/>requirements?: array&lt;object&gt;<br/>│  └─ number*: integer<br/>│  └─ kind*: string<br/>│  └─ description*: string<br/>│  └─ subject_ids?: array&lt;string&gt; → any foundation ID<br/>launch_event_id?: string → event</pre>"]:::schemaEntity
  software_edition["<pre style='text-align:left;font-family:monospace;white-space:pre;margin:0'>software_edition.json<br/>id*: string<br/>name*: string<br/>description*: string<br/>provider_actor_ids*: array&lt;string&gt; → actor<br/>technology_ids*: array&lt;string&gt; → technology<br/>family_name*: string<br/>version*: string<br/>edition*: string<br/>composition_history*: array&lt;object&gt;<br/>│  └─ version_number*: integer<br/>│  └─ description*: string<br/>│  └─ effective_from*: schema-defined<br/>│  └─ effective_until*: schema-defined<br/>│  └─ technical_definition*: object<br/>│  │  └─ abacus_file_integration?: object<br/>│  │  │  └─ concurrency?: string<br/>│  │  │  └─ cross_version_policy?: string<br/>│  │  │  └─ format_policy?: string<br/>│  │  │  └─ formula_policy?: string<br/>│  │  │  └─ memory_policy?: string<br/>│  │  │  └─ model?: string<br/>│  │  │  └─ save_policy?: string<br/>│  │  └─ adds?: array&lt;string&gt;<br/>│  │  └─ api_compatibility?: string<br/>│  │  └─ architecture?: object<br/>│  │  │  └─ client_server?: boolean<br/>│  │  │  └─ database?: string<br/>│  │  │  └─ network_id?: string → technology<br/>│  │  │  └─ resource_planning?: object<br/>│  │  │  │  └─ basis?: string<br/>│  │  │  │  └─ illustrative_dram_budget_bytes?: object<br/>│  │  │  │  │  └─ applications?: number<br/>│  │  │  │  │  └─ filesystem_buffers?: number<br/>│  │  │  │  │  └─ kernel_state_tables_stacks?: number<br/>│  │  │  │  │  └─ process_translation_metadata?: number<br/>│  │  │  │  │  └─ services_patches_reserve?: number<br/>│  │  │  │  │  └─ terminal_ui_input?: number<br/>│  │  │  │  └─ minimum_dram_bytes?: number<br/>│  │  │  │  └─ minimum_os_rom_bytes?: number<br/>│  │  │  │  └─ preferred_dram_bytes?: number<br/>│  │  │  └─ server?: string → device<br/>│  │  │  └─ server_edition_id?: string → software_edition<br/>│  │  └─ artemis_native_extensions?: array&lt;string&gt;<br/>│  │  └─ base_version?: string<br/>│  │  └─ compatibility_notes?: array&lt;string&gt;<br/>│  │  └─ compatibility_policy?: object<br/>│  │  │  └─ applications?: string<br/>│  │  │  └─ binary?: string<br/>│  │  │  └─ certification?: string<br/>│  │  │  └─ delivery?: string<br/>│  │  │  └─ eligibility?: string<br/>│  │  │  └─ hardware?: string<br/>│  │  │  └─ scope?: string<br/>│  │  └─ components?: object<br/>│  │  │  └─ mainboard_rom?: array&lt;string&gt;<br/>│  │  │  └─ system_cartridge?: array&lt;string&gt;<br/>│  │  └─ contents?: array&lt;string&gt;<br/>│  │  └─ data_interchange?: object<br/>│  │  │  └─ bpi_continuity?: string<br/>│  │  │  └─ contract?: string<br/>│  │  │  └─ csv?: string<br/>│  │  │  └─ export_definition_id?: string → software_edition<br/>│  │  │  └─ migration?: string<br/>│  │  │  └─ partner?: string<br/>│  │  │  └─ vsam?: string<br/>│  │  │  └─ vsam_conversion?: string<br/>│  │  └─ dependency_ids?: array&lt;string&gt; → device / software_edition / technology<br/>│  │  └─ distribution?: object<br/>│  │  │  └─ channel?: string<br/>│  │  │  └─ data_access?: string<br/>│  │  │  └─ disk_format?: string<br/>│  │  │  └─ execution?: schema-defined<br/>│  │  │  └─ fulfillment?: string<br/>│  │  │  └─ installation?: string<br/>│  │  │  └─ medium?: string<br/>│  │  │  └─ network_operation?: string<br/>│  │  │  └─ toolchain?: string<br/>│  │  └─ embedded_abacus_integration_id?: string → technology<br/>│  │  └─ execution_target?: string<br/>│  │  └─ explicitly_not_assumed?: array&lt;string&gt;<br/>│  │  └─ extensions?: array&lt;string&gt;<br/>│  │  └─ features?: array&lt;string&gt;<br/>│  │  └─ features_id?: string → technology<br/>│  │  └─ forward_compatibility_commitment?: object<br/>│  │  │  └─ delivery_requirements?: string<br/>│  │  │  └─ exclusions?: string<br/>│  │  │  └─ scope?: string<br/>│  │  └─ implementation?: schema-defined<br/>│  │  └─ internal_organization?: array&lt;object&gt;<br/>│  │  │  └─ description?: string<br/>│  │  │  └─ diagram_label?: string<br/>│  │  │  └─ id?: string<br/>│  │  │  └─ name?: string<br/>│  │  │  └─ residence?: string<br/>│  │  │  └─ responsibility?: string<br/>│  │  └─ internal_relationships?: array&lt;array&gt;<br/>│  │  └─ logix_requirements?: array&lt;string&gt;<br/>│  │  └─ memory_discovery_id?: string → technology<br/>│  │  └─ minimum_resources?: object<br/>│  │  │  └─ application_ram_bytes?: null<br/>│  │  │  └─ installed_ram_kb?: number | null<br/>│  │  │  └─ rom_bytes?: number | null<br/>│  │  └─ modules?: array&lt;object&gt;<br/>│  │  │  └─ features?: array&lt;string&gt;<br/>│  │  │  └─ name?: string<br/>│  │  └─ network_link_policy?: object<br/>│  │  │  └─ driver_contract?: string<br/>│  │  │  └─ link_layer_id?: string → technology<br/>│  │  └─ platform_policy?: string<br/>│  │  └─ platform_support?: array&lt;object&gt;<br/>│  │  │  └─ computer_id?: string → device / product / external_product<br/>│  │  └─ portability_contract?: object<br/>│  │  │  └─ api_id?: string → technology<br/>│  │  │  └─ display?: string<br/>│  │  │  └─ memory?: string<br/>│  │  │  └─ migration?: string<br/>│  │  │  └─ shared_logic?: string<br/>│  │  │  └─ storage?: string<br/>│  │  └─ portable_runtime?: object<br/>│  │  │  └─ abi_policy?: string<br/>│  │  │  └─ api_id?: string → technology<br/>│  │  │  └─ capability_discovery?: string<br/>│  │  │  └─ display_id?: string → technology<br/>│  │  │  └─ implementation_target?: string<br/>│  │  │  └─ ownership?: string<br/>│  │  └─ programmatic_file_access?: string<br/>│  │  └─ relationship?: string<br/>│  │  └─ release_scope?: object<br/>│  │  │  └─ acceptance_requirements?: array&lt;string&gt;<br/>│  │  │  └─ acceptance_workflow?: string<br/>│  │  │  └─ initial?: string<br/>│  │  │  └─ later?: string<br/>│  │  │  └─ later_milestones?: array&lt;string&gt;<br/>│  │  │  └─ launch?: string<br/>│  │  │  └─ resource_policy?: string<br/>│  │  └─ reporting?: object<br/>│  │  │  └─ chart_types?: array&lt;string&gt;<br/>│  │  │  └─ continuity?: string<br/>│  │  │  └─ output?: string<br/>│  │  │  └─ presentation?: string<br/>│  │  └─ role?: string<br/>│  │  └─ runtime_notes?: array&lt;string&gt;<br/>│  │  └─ specification?: schema-defined<br/>│  │  └─ subcomponents?: array&lt;object&gt;<br/>│  │  │  └─ description?: string<br/>│  │  │  └─ id?: string<br/>│  │  │  └─ name?: string<br/>│  │  └─ system_dependencies?: array&lt;object&gt;<br/>│  │  │  └─ component_id?: string<br/>│  │  │  └─ description?: string<br/>│  │  │  └─ name?: string<br/>│  │  │  └─ software_id?: string → software_edition<br/>│  │  └─ technology_id?: string → technology<br/>│  │  └─ toolchain?: object<br/>│  │  │  └─ components?: array&lt;string&gt;<br/>│  │  │  └─ development_workflow?: array&lt;string&gt;<br/>│  │  │  └─ host?: array&lt;string&gt; → device<br/>│  │  │  └─ language_contract_id?: string → technology<br/>│  │  │  └─ layout_tests?: array&lt;string&gt;<br/>│  │  │  └─ optional_development_features?: array&lt;string&gt;<br/>│  │  │  └─ profiles?: array&lt;string&gt;<br/>│  │  │  └─ resource_tests?: array&lt;string&gt;<br/>│  │  │  └─ runtime_contract_id?: string → technology<br/>│  │  │  └─ target_isolation?: string<br/>│  │  │  └─ targets?: array&lt;string&gt;<br/>│  │  └─ tui_features?: array&lt;object&gt;<br/>│  │  │  └─ description?: string<br/>│  │  │  └─ name?: string<br/>│  │  └─ tui_integration?: string<br/>│  │  └─ tui_ownership?: object<br/>│  │  │  └─ boundary?: string<br/>│  │  │  └─ consumers?: array&lt;string&gt; → software_edition<br/>│  │  │  └─ interface_id?: string → technology<br/>│  │  │  └─ owner?: string<br/>│  │  └─ validation?: string<br/>│  │  └─ vanilla_architecture?: object<br/>│  │  │  └─ application_entry?: string<br/>│  │  │  └─ changes_from_1_3?: array&lt;string&gt;<br/>│  │  │  └─ components?: array&lt;object&gt;<br/>│  │  │  │  └─ description?: string<br/>│  │  │  │  └─ id?: string<br/>│  │  │  │  └─ name?: string<br/>│  │  │  └─ execution_model?: string<br/>│  │  │  └─ limits?: array&lt;string&gt;<br/>│  │  │  └─ memory_layout?: array&lt;object&gt;<br/>│  │  │  │  └─ purpose?: string<br/>│  │  │  │  └─ region?: string<br/>│  │  │  └─ program_load_address?: string<br/>│  └─ composition_definition*: array&lt;object&gt;<br/>│  │  └─ id*: string<br/>│  │  └─ target*: schema-defined<br/>│  │  └─ quantity*: number | null<br/>│  │  └─ connection?: schema-defined<br/>│  │  └─ placements?: array&lt;object&gt;<br/>│  │  │  └─ host_line_id*: string<br/>│  │  │  └─ host_instance*: integer<br/>│  │  │  └─ socket_id*: string<br/>│  │  │  └─ quantity*: number<br/>│  │  └─ element_type?: string<br/>technical_specification?: object<br/>│  └─ chapters*: array&lt;object&gt;<br/>│  │  └─ number*: integer<br/>│  │  └─ chapter_name*: string<br/>│  │  └─ description*: string<br/>│  └─ parameters*: array&lt;object&gt;<br/>│  │  └─ key*: string<br/>│  │  └─ value?: string | number | null<br/>│  │  └─ ref_id?: string → actor / technology / base_part / device / software_edition / product / external_product / manufacturing_capability<br/>│  │  └─ ref_role?: string</pre>"]:::schemaEntity
  technology["<pre style='text-align:left;font-family:monospace;white-space:pre;margin:0'>technology.json<br/>id*: string<br/>name*: string<br/>kind*: string<br/>description*: string<br/>owner_actor_ids*: array&lt;string&gt; → actor<br/>related_technology_ids*: array&lt;string&gt; → technology<br/>specification*: array&lt;object&gt;<br/>│  └─ number*: integer<br/>│  └─ chapter_name*: string<br/>│  └─ description*: string<br/>│  └─ parameters*: array&lt;object&gt;<br/>│  │  └─ key*: string<br/>│  │  └─ value*: string<br/>fabrication?: object<br/>│  └─ feature_size_um*: number<br/>│  └─ wafer_diameter_mm?: number<br/>│  └─ lithography_method*: string</pre>"]:::schemaEntity
  any_foundation{{"Any foundation record<br/>ID prefix selects one target"}}
  actor_relationship -- "subject_actor_ids[]<br/>object_actor_id" --> actor
  actor_relationship -- "established_by_event_id" --> event
  agreement -- "party[].actor_id" --> actor
  assumption -. "scope_ids[]" .-> any_foundation
  base_part -- "manufacturer_actor_id<br/>supplier_actor_ids[]<br/>technical_specification.parameters[].ref_id<br/>graphic_modes_specification[].parameters[].ref_id" --> actor
  base_part -- "technology_ids[]<br/>technical_definition.host_qualification.device.base_computer.artemis.technology_ids[]<br/>technical_definition.host_qualification.device.base_computer.artemis_pro.technology_ids[]<br/>technical_definition.host_qualification.device.base_computer.aurelia.technology_ids[]<br/>technical_definition.host_qualification.device.base_computer.aurelia_plus.technology_ids[]<br/>technical_definition.memory_interface.organization_id<br/>technical_definition.specification.api_id<br/>technical_definition.specification.bridge_design_id<br/>technical_definition.specification.class_protocol_id<br/>technical_definition.specification.interface_id<br/>technical_definition.specification.keyboard_standard_id<br/>technical_definition.specification.link_layer_id<br/>technical_definition.specification.memory_layout.policy_id<br/>technical_definition.specification.negotiation_id<br/>technical_definition.specification.palette_list_id<br/>technical_definition.specification.platform_rate_profiles[].technology_ids[]<br/>technical_definition.specification.sprite_profile_ref.technology_id<br/>technical_definition.specification.technology_id<br/>technical_definition.specification.transport_id<br/>technical_definition.specification.video_link_id<br/>technical_definition.specification_id<br/>technical_definition.technical_profile.memory.organization_ref<br/>technical_definition.technical_profile.networking.technology_ids[]<br/>technical_definition.technical_profile.software_compatibility.api_id<br/>technical_specification.parameters[].ref_id<br/>graphic_modes_specification[].parameters[].ref_id" --> technology
  base_part -- "technical_definition.compatible_computers[]<br/>technical_definition.compatible_with[]<br/>technical_definition.host_qualification.device.base_computer.artemis.computer_id<br/>technical_definition.host_qualification.device.base_computer.artemis_pro.computer_id<br/>technical_definition.host_qualification.device.base_computer.athena.computer_id<br/>technical_definition.host_qualification.device.base_computer.athena_server.computer_id<br/>technical_definition.host_qualification.device.base_computer.aurelia.computer_id<br/>technical_definition.host_qualification.device.base_computer.aurelia_plus.computer_id<br/>technical_definition.memory_interface.expansion_id<br/>technical_definition.planned_compatible_with[]<br/>technical_definition.specification.card_id<br/>technical_definition.specification.feature_continuity_id<br/>technical_definition.specification.legacy_card_id<br/>technical_definition.specification.monitor_id<br/>technical_definition.specification.platform_rate_profiles[].computer_id<br/>technical_definition.technical_profile.memory.expansion_ref<br/>technical_definition.technical_profile.network.computer_id<br/>technical_definition.technical_profile.networking.computer_id<br/>technical_specification.parameters[].ref_id<br/>graphic_modes_specification[].parameters[].ref_id" --> device
  base_part -- "technical_definition.memory_interface.system_controller_id<br/>technical_definition.physical_population.chip_id<br/>technical_definition.processor.part_id<br/>technical_definition.specification.base_controller_id<br/>technical_definition.specification.base_product_id<br/>technical_definition.specification.chip_type_id<br/>technical_definition.specification.controller_id<br/>technical_definition.specification.cpu_id<br/>technical_definition.specification.crt_id<br/>technical_definition.specification.display_controller_id<br/>technical_definition.specification.display_memory.chip_id<br/>technical_definition.specification.display_subassembly_id<br/>technical_definition.specification.mechanism_id<br/>technical_definition.specification.sprite_memory.chip_id<br/>technical_definition.specification.video_ram_chip_id<br/>technical_definition.technical_profile.memory.expanded_organization.controller_id<br/>technical_definition.technical_profile.memory.organization.controller_id<br/>technical_definition.technical_profile.memory.system_controller_ref<br/>technical_definition.technical_profile.video.controller_id<br/>technical_specification.parameters[].ref_id<br/>graphic_modes_specification[].parameters[].ref_id" --> base_part
  base_part -- "technical_definition.recommended_software_id<br/>technical_specification.parameters[].ref_id<br/>graphic_modes_specification[].parameters[].ref_id" --> software_edition
  base_part -- "technical_definition.specification.manufacturing_planning.recipe_variants[].manufacturing_capability_id<br/>technical_specification.parameters[].ref_id<br/>graphic_modes_specification[].parameters[].ref_id" --> manufacturing_capability
  base_part -. "requirements[].subject_ids[]" .-> any_foundation
  base_part -- "technical_specification.parameters[].ref_id<br/>graphic_modes_specification[].parameters[].ref_id" --> product
  base_part -- "technical_specification.parameters[].ref_id<br/>graphic_modes_specification[].parameters[].ref_id" --> external_product
  campaign -- "lead_actor_ids[]<br/>marketing_steps[].marketing_presentation[].parameters[].ref_id" --> actor
  campaign -- "marketing_steps[].reference_id" --> event
  campaign -- "marketing_steps[].reference_id" --> process
  campaign -- "marketing_steps[].marketing_presentation[].parameters[].ref_id" --> product
  campaign -- "marketing_steps[].marketing_presentation[].parameters[].ref_id" --> external_product
  campaign -- "marketing_steps[].marketing_presentation[].parameters[].ref_id" --> technology
  campaign -- "marketing_steps[].marketing_presentation[].parameters[].ref_id" --> device
  campaign -- "marketing_steps[].marketing_presentation[].parameters[].ref_id" --> software_edition
  campaign -- "marketing_steps[].marketing_presentation[].parameters[].ref_id" --> agreement
  campaign -- "marketing_steps[].marketing_presentation[].parameters[].ref_id" --> manufacturing_capability
  campaign -- "marketing_steps[].marketing_presentation[].parameters[].ref_id" --> market_response
  campaign -- "marketing_steps[].marketing_presentation[].parameters[].ref_id" --> location
  campaign -- "marketing_steps[].marketing_presentation[].parameters[].ref_id" --> base_part
  device -- "provider_actor_ids[]<br/>technical_specification.parameters[].ref_id<br/>graphic_modes_specification[].parameters[].ref_id" --> actor
  device -- "technology_ids[]<br/>composition_history[].technical_definition.host_qualification.device.base_computer.artemis.technology_ids[]<br/>composition_history[].technical_definition.host_qualification.device.base_computer.artemis_pro.technology_ids[]<br/>composition_history[].technical_definition.host_qualification.device.base_computer.aurelia.technology_ids[]<br/>composition_history[].technical_definition.host_qualification.device.base_computer.aurelia_plus.technology_ids[]<br/>composition_history[].technical_definition.memory_interface.organization_id<br/>composition_history[].technical_definition.specification.api_id<br/>composition_history[].technical_definition.specification.bridge_design_id<br/>composition_history[].technical_definition.specification.class_protocol_id<br/>composition_history[].technical_definition.specification.interface_id<br/>composition_history[].technical_definition.specification.keyboard_standard_id<br/>composition_history[].technical_definition.specification.link_layer_id<br/>composition_history[].technical_definition.specification.memory_layout.policy_id<br/>composition_history[].technical_definition.specification.negotiation_id<br/>composition_history[].technical_definition.specification.palette_list_id<br/>composition_history[].technical_definition.specification.platform_rate_profiles[].technology_ids[]<br/>composition_history[].technical_definition.specification.sprite_profile_ref.technology_id<br/>composition_history[].technical_definition.specification.technology_id<br/>composition_history[].technical_definition.specification.transport_id<br/>composition_history[].technical_definition.specification.video_link_id<br/>composition_history[].technical_definition.specification_id<br/>composition_history[].technical_definition.technical_profile.memory.organization_ref<br/>composition_history[].technical_definition.technical_profile.networking.technology_ids[]<br/>composition_history[].technical_definition.technical_profile.software_compatibility.api_id<br/>technical_specification.parameters[].ref_id<br/>graphic_modes_specification[].parameters[].ref_id" --> technology
  device -- "composition_history[].technical_definition.compatible_computers[]<br/>composition_history[].technical_definition.compatible_with[]<br/>composition_history[].technical_definition.host_qualification.device.base_computer.artemis.computer_id<br/>composition_history[].technical_definition.host_qualification.device.base_computer.artemis_pro.computer_id<br/>composition_history[].technical_definition.host_qualification.device.base_computer.athena.computer_id<br/>composition_history[].technical_definition.host_qualification.device.base_computer.athena_server.computer_id<br/>composition_history[].technical_definition.host_qualification.device.base_computer.aurelia.computer_id<br/>composition_history[].technical_definition.host_qualification.device.base_computer.aurelia_plus.computer_id<br/>composition_history[].technical_definition.memory_interface.expansion_id<br/>composition_history[].technical_definition.planned_compatible_with[]<br/>composition_history[].technical_definition.specification.card_id<br/>composition_history[].technical_definition.specification.feature_continuity_id<br/>composition_history[].technical_definition.specification.legacy_card_id<br/>composition_history[].technical_definition.specification.monitor_id<br/>composition_history[].technical_definition.specification.platform_rate_profiles[].computer_id<br/>composition_history[].technical_definition.technical_profile.memory.expansion_ref<br/>composition_history[].technical_definition.technical_profile.network.computer_id<br/>composition_history[].technical_definition.technical_profile.networking.computer_id<br/>composition_history[].expansion_socket_groups[].sockets[].compatible_device_ids[]<br/>technical_specification.parameters[].ref_id<br/>graphic_modes_specification[].parameters[].ref_id" --> device
  device -- "composition_history[].technical_definition.memory_interface.system_controller_id<br/>composition_history[].technical_definition.physical_population.chip_id<br/>composition_history[].technical_definition.processor.part_id<br/>composition_history[].technical_definition.specification.base_controller_id<br/>composition_history[].technical_definition.specification.base_product_id<br/>composition_history[].technical_definition.specification.chip_type_id<br/>composition_history[].technical_definition.specification.controller_id<br/>composition_history[].technical_definition.specification.cpu_id<br/>composition_history[].technical_definition.specification.crt_id<br/>composition_history[].technical_definition.specification.display_controller_id<br/>composition_history[].technical_definition.specification.display_memory.chip_id<br/>composition_history[].technical_definition.specification.display_subassembly_id<br/>composition_history[].technical_definition.specification.mechanism_id<br/>composition_history[].technical_definition.specification.sprite_memory.chip_id<br/>composition_history[].technical_definition.specification.video_ram_chip_id<br/>composition_history[].technical_definition.technical_profile.memory.expanded_organization.controller_id<br/>composition_history[].technical_definition.technical_profile.memory.organization.controller_id<br/>composition_history[].technical_definition.technical_profile.memory.system_controller_ref<br/>composition_history[].technical_definition.technical_profile.video.controller_id<br/>technical_specification.parameters[].ref_id<br/>graphic_modes_specification[].parameters[].ref_id" --> base_part
  device -- "composition_history[].technical_definition.recommended_software_id<br/>technical_specification.parameters[].ref_id<br/>graphic_modes_specification[].parameters[].ref_id" --> software_edition
  device -- "composition_history[].technical_definition.specification.manufacturing_planning.recipe_variants[].manufacturing_capability_id<br/>technical_specification.parameters[].ref_id<br/>graphic_modes_specification[].parameters[].ref_id" --> manufacturing_capability
  device -. "composition_history[].assembly_requirements[].subject_ids[]<br/>requirements[].subject_ids[]" .-> any_foundation
  device -- "technical_specification.parameters[].ref_id<br/>graphic_modes_specification[].parameters[].ref_id" --> product
  device -- "technical_specification.parameters[].ref_id<br/>graphic_modes_specification[].parameters[].ref_id" --> external_product
  event -- "participant[].actor_id" --> actor
  event -. "subject_ids[]<br/>inputs[].subject_ids[]<br/>outcomes[].subject_ids[]" .-> any_foundation
  event -- "inputs[].event_id<br/>outcomes[].event_id" --> event
  event -- "inputs[].process_id<br/>outcomes[].process_id" --> process
  event -- "location_ids[]" --> location
  event -- "agreement_id" --> agreement
  external_product -- "provider_actor_ids[]" --> actor
  external_product -- "impacted_standards[].standard_id" --> technology
  location -- "parent_location_id" --> location
  manufacturing_capability -- "actor_id" --> actor
  manufacturing_capability -- "location_id" --> location
  manufacturing_capability -- "technology_id" --> technology
  manufacturing_capability -. "qualification_requirements[].subject_ids[]" .-> any_foundation
  manufacturing_capability -- "qualification_requirements[].event_id" --> event
  manufacturing_capability -- "qualification_requirements[].process_id" --> process
  manufacturing_capability -- "base_part_ids[]" --> base_part
  market_response -- "respondent_actor_ids[]" --> actor
  market_response -. "subject_ids[]" .-> any_foundation
  market_response -- "trigger_ids[]" --> event
  market_response -- "trigger_ids[]" --> process
  market_response -- "trigger_ids[]" --> campaign
  market_response -- "trigger_ids[]" --> agreement
  process -- "participant[].actor_id" --> actor
  process -. "subject_ids[]<br/>inputs[].subject_ids[]<br/>outcomes[].subject_ids[]" .-> any_foundation
  process -- "inputs[].event_id<br/>period.start.value<br/>period.end.value<br/>steps[].event_id" --> event
  process -- "inputs[].process_id<br/>steps[].process_id<br/>related_process_ids[]" --> process
  process -- "steps[].campaign_id" --> campaign
  process -- "agreement_id" --> agreement
  product -- "provider_actor_ids[]" --> actor
  product -- "technical_identity.record_id" --> base_part
  product -- "technical_identity.record_id" --> device
  product -- "technical_identity.record_id" --> software_edition
  product -- "launch_campaign_id" --> campaign
  product -. "composition_history[].assembly_requirements[].subject_ids[]<br/>requirements[].subject_ids[]" .-> any_foundation
  product -- "launch_event_id" --> event
  software_edition -- "provider_actor_ids[]<br/>technical_specification.parameters[].ref_id" --> actor
  software_edition -- "technology_ids[]<br/>composition_history[].technical_definition.architecture.network_id<br/>composition_history[].technical_definition.dependency_ids[]<br/>composition_history[].technical_definition.embedded_abacus_integration_id<br/>composition_history[].technical_definition.features_id<br/>composition_history[].technical_definition.memory_discovery_id<br/>composition_history[].technical_definition.network_link_policy.link_layer_id<br/>composition_history[].technical_definition.portability_contract.api_id<br/>composition_history[].technical_definition.portable_runtime.api_id<br/>composition_history[].technical_definition.portable_runtime.display_id<br/>composition_history[].technical_definition.technology_id<br/>composition_history[].technical_definition.toolchain.language_contract_id<br/>composition_history[].technical_definition.toolchain.runtime_contract_id<br/>composition_history[].technical_definition.tui_ownership.interface_id<br/>technical_specification.parameters[].ref_id" --> technology
  software_edition -- "composition_history[].technical_definition.architecture.server<br/>composition_history[].technical_definition.dependency_ids[]<br/>composition_history[].technical_definition.platform_support[].computer_id<br/>composition_history[].technical_definition.toolchain.host[]<br/>technical_specification.parameters[].ref_id" --> device
  software_edition -- "composition_history[].technical_definition.architecture.server_edition_id<br/>composition_history[].technical_definition.data_interchange.export_definition_id<br/>composition_history[].technical_definition.dependency_ids[]<br/>composition_history[].technical_definition.system_dependencies[].software_id<br/>composition_history[].technical_definition.tui_ownership.consumers[]<br/>technical_specification.parameters[].ref_id" --> software_edition
  software_edition -- "composition_history[].technical_definition.platform_support[].computer_id<br/>technical_specification.parameters[].ref_id" --> product
  software_edition -- "composition_history[].technical_definition.platform_support[].computer_id<br/>technical_specification.parameters[].ref_id" --> external_product
  software_edition -- "technical_specification.parameters[].ref_id" --> base_part
  software_edition -- "technical_specification.parameters[].ref_id" --> manufacturing_capability
  technology -- "owner_actor_ids[]" --> actor
  technology -- "related_technology_ids[]" --> technology
  any_foundation -.-> actor
  any_foundation -.-> actor_relationship
  any_foundation -.-> agreement
  any_foundation -.-> assumption
  any_foundation -.-> base_part
  any_foundation -.-> campaign
  any_foundation -.-> device
  any_foundation -.-> event
  any_foundation -.-> external_product
  any_foundation -.-> location
  any_foundation -.-> manufacturing_capability
  any_foundation -.-> market_response
  any_foundation -.-> process
  any_foundation -.-> product
  any_foundation -.-> software_edition
  any_foundation -.-> technology
```

## Dataset specifications

### actor

People and organizations participating in the story.

File: [actor.json](../../data_foundation/actor.json) · Schema: [actor.schema.json](../../schemas/actor.schema.json)

```text
actor[]
id*: string
kind*: string
name*: string
aliases?: array<string>
description?: string
```

| Field path | Required in parent | Type | Constraints / allowed values |
| --- | --- | --- | --- |
| `id` | yes | `string` | pattern: "^actor\\.[a-z0-9][a-z0-9_.-]*$" |
| `kind` | yes | `string` | enum: ["person","organisation","group"] |
| `name` | yes | `string` | minLength: 1 |
| `aliases[]` | no | `array<string>` | minLength: 1; minItems: 0; uniqueItems: true |
| `description` | no | `string` | minLength: 1 |

### actor_relationship

Relationships between actors, including dated roles and links to agreements.

File: [actor_relationship.json](../../data_foundation/actor_relationship.json) · Schema: [actor_relationship.schema.json](../../schemas/actor_relationship.schema.json)

```text
actor_relationship[]
id*: string
kind*: string
subject_actor_ids*: array<string> → actor
object_actor_id*: string → actor
established_by_event_id?: string → event
description*: string
```

| Field path | Required in parent | Type | Constraints / allowed values |
| --- | --- | --- | --- |
| `id` | yes | `string` | pattern: "^actor_relationship\\.[a-z0-9][a-z0-9_.-]*$" |
| `kind` | yes | `string` | enum: ["employment","operating_role","affiliation","control","identity_assumption"] |
| `subject_actor_ids[]` | yes | `array<string>` | pattern: "^(actor)\\.[a-z0-9][a-z0-9_.-]*$"; minItems: 1; uniqueItems: true |
| `object_actor_id` | yes | `string` | pattern: "^(actor)\\.[a-z0-9][a-z0-9_.-]*$" |
| `established_by_event_id` | no | `string` | pattern: "^(event)\\.[a-z0-9][a-z0-9_.-]*$" |
| `description` | yes | `string` | minLength: 1 |

### agreement

An arrangement with its own identity, parties and lifecycle. Terms are owned in clauses[] and authorized with the whole agreement.

File: [agreement.json](../../data_foundation/agreement.json) · Schema: [agreement.schema.json](../../schemas/agreement.schema.json)

```text
agreement[]
id*: string
title*: string
kind*: string
party*: array<object>
│  └─ actor_id*: string → actor
│  └─ role*: string
state*: string
description?: string
clauses*: array<object>
│  └─ id*: string
│  └─ kind*: string
│  └─ statement*: string
│  └─ value*: number | string | null
│  └─ unit*: string | null
```

| Field path | Required in parent | Type | Constraints / allowed values |
| --- | --- | --- | --- |
| `id` | yes | `string` | pattern: "^agreement\\.[a-z0-9][a-z0-9_.-]*$" |
| `title` | yes | `string` | minLength: 1 |
| `kind` | yes | `string` | enum: ["founding","employment","licence","supply","distribution","development","cooperation","other"] |
| `party[]` | yes | `array<object>` | minItems: 1 |
| `party[].actor_id` | yes | `string` | pattern: "^(actor)\\.[a-z0-9][a-z0-9_.-]*$" |
| `party[].role` | yes | `string` | minLength: 1 |
| `state` | yes | `string` | enum: ["offer","negotiating","executed","terminated","unknown"] |
| `description` | no | `string` | minLength: 1 |
| `clauses[]` | yes | `array<object>` | — |
| `clauses[].id` | yes | `string` | pattern: "^clause\\.[a-z0-9][a-z0-9_.-]*$" |
| `clauses[].kind` | yes | `string` | enum: ["equity","funding","rights","responsibility","qualification","term","other","target_equity","target_funding","target_rights","target_responsibility","target_qualification","target_term","target_other"] |
| `clauses[].statement` | yes | `string` | minLength: 1 |
| `clauses[].value` | yes | `number | string | null` | — |
| `clauses[].unit` | yes | `string | null` | minLength: 1 |

**Clause contract:** clauses require the exact five-field shape shown here. Legacy fields and hybrids fail validation. A null value requires a null unit; a quantified value requires a nonempty unit. Equity basis, beneficiary and allocation belong in the statement.

### assumption

Explicit premises of the alternative world and their scope.

File: [assumption.json](../../data_foundation/assumption.json) · Schema: [assumption.schema.json](../../schemas/assumption.schema.json)

```text
assumption[]
id*: string
kind*: string
scope_ids?: array<string> → any foundation ID
topic*: string
statements*: array<string>
```

| Field path | Required in parent | Type | Constraints / allowed values |
| --- | --- | --- | --- |
| `id` | yes | `string` | pattern: "^assumption\\.[a-z0-9][a-z0-9_.-]*$" |
| `kind` | yes | `string` | enum: ["world_premise","policy","constraint","target","baseline_condition"] |
| `scope_ids[]` | no | `array<string>` | pattern: "^(actor\|actor_relationship\|agreement\|assumption\|campaign\|event\|location\|manufacturing_capability\|market_response\|process\|product\|technology\|base_part\|device\|software_edition\|external_product)\\.[a-z0-9][a-z0-9_.-]*$"; minItems: 0; uniqueItems: true |
| `topic` | yes | `string` | minLength: 1 |
| `statements[]` | yes | `array<string>` | minLength: 1; minItems: 1 |

### base_part

Canonical physical base part and manufacturing definition.

File: [base_part.json](../../data_foundation/base_part.json) · Schema: [base_part.schema.json](../../schemas/base_part.schema.json)

```text
base_part[]
id*: string
name*: string
kind*: string
description*: string
supply_form*: string
manufacturer_actor_id*: string | null → actor
manufacturer_name?: string | null
supplier_actor_ids*: array<string> → actor
manufacturer_part_number*: string | null
technology_ids*: array<string> → technology
manufacturing_capability_ids?: array<schema-defined>
technical_definition*: object
│  └─ athena_qualification?: string
│  └─ capacity_kb?: number
│  └─ compatibility_note?: string
│  └─ compatible_computers?: array<string> → device
│  └─ compatible_with?: array<string> → device
│  └─ configuration_requirements?: object
│  │  └─ external_application_cartridges_supported?: boolean
│  │  └─ rules?: array<string>
│  │  └─ scope?: string
│  └─ connection?: string
│  └─ firmware_contents?: array<string>
│  └─ form_factor?: string
│  └─ host_qualification?: object
│  │  └─ device.base_computer.artemis?: object
│  │  │  └─ computer_id?: string → device
│  │  │  └─ implementation?: string
│  │  │  └─ qualified_max_rate_kbps?: number
│  │  │  └─ rate_policy?: string
│  │  │  └─ supported_rates_kbps?: array<number>
│  │  │  └─ technology_ids?: array<string> → technology
│  │  └─ device.base_computer.artemis_pro?: object
│  │  │  └─ computer_id?: string → device
│  │  │  └─ implementation?: string
│  │  │  └─ qualified_max_rate_kbps?: number
│  │  │  └─ rate_policy?: string
│  │  │  └─ server_role?: boolean
│  │  │  └─ supported_rates_kbps?: array<number>
│  │  │  └─ technology_ids?: array<string> → technology
│  │  └─ device.base_computer.athena?: object
│  │  │  └─ computer_id?: string → device
│  │  └─ device.base_computer.athena_server?: object
│  │  │  └─ computer_id?: string → device
│  │  └─ device.base_computer.aurelia?: object
│  │  │  └─ computer_id?: string → device
│  │  │  └─ qualified_max_rate_kbps?: number
│  │  │  └─ rate_policy?: string
│  │  │  └─ supported_rates_kbps?: array<number>
│  │  │  └─ technology_ids?: array<string> → technology
│  │  └─ device.base_computer.aurelia_plus?: object
│  │  │  └─ computer_id?: string → device
│  │  │  └─ qualified_max_rate_kbps?: number
│  │  │  └─ rate_policy?: string
│  │  │  └─ supported_rates_kbps?: array<number>
│  │  │  └─ technology_ids?: array<string> → technology
│  └─ integration_requirements?: object
│  │  └─ sourcing_policy?: string
│  └─ io_and_expansion?: object
│  │  └─ application_rom_cards_supported?: boolean
│  │  └─ dedicated_video_slot?: object
│  │  │  └─ general_purpose_slots_consumed?: number
│  │  │  └─ hot_swap?: boolean
│  │  │  └─ interface?: string
│  │  │  └─ replaceable?: boolean
│  │  └─ eeprom_bios?: object
│  │  │  └─ capacity_kb?: null
│  │  │  └─ included?: boolean
│  │  │  └─ purpose?: string
│  │  └─ expansion_slots?: object
│  │  │  └─ future_pin_area_reserved_for_bits?: number
│  │  │  └─ plug_and_execute?: boolean
│  │  │  └─ width_bits?: number
│  │  └─ rom_eeprom_cartridge_slots?: object
│  │  │  └─ front?: string
│  │  │  └─ rear?: string
│  └─ manufacturing_planning?: object
│  │  └─ die_area_mm2?: number
│  │  └─ die_area_mm2_target?: number
│  │  └─ initial_manufacturer?: string
│  │  └─ node_um?: number
│  │  └─ policy?: string
│  │  └─ transistor_budget_target?: number
│  │  └─ wafer_diameter_mm?: number
│  └─ memory_constraints?: object
│  │  └─ max_ram_kib?: number | null
│  │  └─ mixed_module_types_allowed?: boolean
│  └─ memory_interface?: object
│  │  └─ expansion_id?: string → device
│  │  └─ organization_id?: string → technology
│  │  └─ system_controller_id?: string → base_part
│  └─ memory_mapping?: object
│  │  └─ application_memory?: string
│  │  └─ configuration?: string
│  │  └─ installation?: string
│  │  └─ normal_cpu_range?: string
│  │  └─ page_count?: number
│  │  └─ page_size_kb?: number
│  │  └─ service_calls?: string
│  │  └─ slot_count?: number
│  │  └─ system_workspace?: string
│  └─ packaging?: string
│  └─ physical_population?: object
│  │  └─ capacity_kb?: number
│  │  └─ chip_id?: string → base_part
│  │  └─ data_chip_count?: number
│  │  └─ data_width_bits?: number
│  │  └─ refresh_owner?: string
│  └─ planned_compatible_with?: array<string> → device
│  └─ processor?: object
│  │  └─ part_id?: string → base_part
│  └─ recommended_software_id?: string → software_edition
│  └─ role?: string
│  └─ slot_count?: number
│  └─ specification?: object
│  │  └─ acceleration?: array<string>
│  │  └─ adaptation?: string
│  │  └─ adapter_requirements?: object
│  │  │  └─ buffer_policy?: string
│  │  │  └─ flow_control?: string
│  │  │  └─ hardware_services?: array<string>
│  │  │  └─ host_service?: string
│  │  │  └─ local_packet_ram_target_bytes?: number
│  │  └─ additions?: array<string>
│  │  └─ analog_chain?: string
│  │  └─ api_id?: string → technology
│  │  └─ arbitration?: string
│  │  └─ array_columns?: number
│  │  └─ array_rows?: number
│  │  └─ bandwidth?: string
│  │  └─ bank_capacity_kb?: number
│  │  └─ bank_control?: string
│  │  └─ bank_data_width_bits?: number
│  │  └─ bank_organization?: string
│  │  └─ base_controller_id?: string → base_part
│  │  └─ base_product_id?: string → base_part
│  │  └─ beam_voltage_levels?: number
│  │  └─ bitmap_modes?: array<object>
│  │  │  └─ bits_per_pixel?: number
│  │  │  └─ bytes_per_framebuffer?: number
│  │  │  └─ compatibility_mode?: boolean
│  │  │  └─ configurations?: array<object>
│  │  │  │  └─ allocated_bytes?: number
│  │  │  │  └─ framebuffer_bytes?: number
│  │  │  │  └─ framebuffer_count?: number
│  │  │  │  └─ palette_list_bytes?: number
│  │  │  │  └─ remaining_video_ram_bytes?: number
│  │  │  │  └─ sprite_count?: number
│  │  │  └─ double_buffering?: boolean
│  │  │  └─ framebuffer_bytes?: number
│  │  │  └─ framebuffer_count?: number
│  │  │  └─ height?: number
│  │  │  └─ id?: string
│  │  │  └─ palette_list_bytes?: number
│  │  │  └─ remaining_bytes?: number
│  │  │  └─ required_raster_ids?: array<string>
│  │  │  └─ simultaneous_values?: number
│  │  │  └─ sprites_available?: number
│  │  │  └─ stride_bytes?: number
│  │  │  └─ width?: number
│  │  └─ boot?: string
│  │  └─ bridge_design_id?: string → technology
│  │  └─ buttons?: number
│  │  └─ capabilities?: object
│  │  │  └─ color_model?: string
│  │  │  └─ maximum_pixel_clock_mhz?: number
│  │  │  └─ palette_precision_bits?: number
│  │  │  └─ preferred_raster_id?: string
│  │  │  └─ programmable_palette?: boolean
│  │  │  └─ protocol_version?: number
│  │  │  └─ raster_ids?: array<string>
│  │  └─ capacity_bytes?: number
│  │  └─ capacity_kb?: number | null
│  │  └─ capacity_kbit?: number
│  │  └─ capacity_mb?: number
│  │  └─ card_id?: string → device
│  │  └─ character_row_cache?: object
│  │  │  └─ banks?: number
│  │  │  └─ bytes_per_bank?: number
│  │  │  └─ purpose?: string
│  │  │  └─ total_bytes?: number
│  │  └─ chip_organization?: string
│  │  └─ chip_type_id?: string → base_part
│  │  └─ chips?: number
│  │  └─ chips_per_rank?: number
│  │  └─ class_protocol_id?: string → technology
│  │  └─ clock_mhz?: number
│  │  └─ compatibility?: string
│  │  └─ connection?: string
│  │  └─ continuity?: string
│  │  └─ controller_die_count?: null
│  │  └─ controller_id?: string → base_part
│  │  └─ conversion?: string
│  │  └─ cpu_address_bits?: number
│  │  └─ cpu_id?: string → base_part
│  │  └─ crt_id?: string → base_part
│  │  └─ cursor_keys?: string
│  │  └─ data_width_bits?: number
│  │  └─ density?: string
│  │  └─ diagonal_inch?: number
│  │  └─ diagonal_inches?: number
│  │  └─ die_area_mm2?: number
│  │  └─ die_area_planning_mm2?: number
│  │  └─ digital_output_bits?: number
│  │  └─ disk_formats?: array<string>
│  │  └─ disk_ii_interface?: boolean
│  │  └─ disk_interface?: string
│  │  └─ display_controller_id?: string → base_part
│  │  └─ display_memory?: object
│  │  │  └─ bank_data_width_bits?: number
│  │  │  └─ capacity_bytes?: number
│  │  │  └─ chip_count?: number
│  │  │  └─ chip_id?: string → base_part
│  │  │  └─ organization?: string
│  │  └─ display_modes?: string
│  │  └─ display_subassembly_id?: string → base_part
│  │  └─ displayed_color_registers?: number
│  │  └─ displayed_registers?: number
│  │  └─ dma?: object
│  │  │  └─ active_transfer_engines?: number
│  │  │  └─ address_steps?: array<string>
│  │  │  └─ arbitration?: string
│  │  │  └─ bank_selection?: string
│  │  │  └─ completion?: string
│  │  │  └─ destination_address_bits?: number
│  │  │  └─ length_bits?: number
│  │  │  └─ operations?: array<string>
│  │  │  └─ peripheral_scope?: string
│  │  │  └─ transfer_contexts?: number
│  │  │  └─ video_endpoint?: string
│  │  └─ dot_pitch_mm?: number
│  │  └─ electrical_contract?: string
│  │  └─ electrical_interface?: string
│  │  └─ ergonomics?: string
│  │  └─ execution?: string
│  │  └─ expansion_role?: string
│  │  └─ fdd_density?: string
│  │  └─ fdd_size_inch?: number
│  │  └─ feature_continuity_id?: string → device
│  │  └─ flexibus_ports?: number
│  │  └─ format?: string
│  │  └─ formatted_capacity_kb?: null
│  │  └─ function_keys?: string
│  │  └─ grayscale_levels?: number
│  │  └─ hdd_bundled_with_standard_artemis?: boolean
│  │  └─ hdd_interface_supported?: boolean
│  │  └─ historical_raster?: string
│  │  └─ host?: string
│  │  └─ host_access?: string
│  │  └─ host_clock_mhz?: array<number>
│  │  └─ host_integration?: string
│  │  └─ host_interface?: schema-defined
│  │  └─ implementation?: string
│  │  └─ implementation_design?: object
│  │  │  └─ arbitration?: string
│  │  │  └─ clock_targets?: object
│  │  │  │  └─ high_resolution_pixel_mhz?: number
│  │  │  │  └─ low_resolution_pixel_mhz?: number
│  │  │  │  └─ master_mhz?: number
│  │  │  │  └─ maximum_pixel_fifo_output_mbytes_per_second?: number
│  │  │  │  └─ scope?: string
│  │  │  └─ engines?: object
│  │  │  │  └─ fifo?: string
│  │  │  │  └─ renderer?: string
│  │  │  │  └─ scanout?: string
│  │  │  │  └─ underrun?: string
│  │  │  └─ internal_buffers?: object
│  │  │  │  └─ character_attribute_row_cache_bytes?: number
│  │  │  │  └─ included_in_die_estimates?: boolean
│  │  │  │  └─ next_character_attribute_row_cache_bytes?: number
│  │  │  │  └─ pixel_bits?: number
│  │  │  │  └─ pixel_fifo_bytes?: number
│  │  │  │  └─ pixel_fifo_page_bytes?: number
│  │  │  │  └─ pixel_fifo_page_count?: number
│  │  │  │  └─ sprite_row_shifters_bytes?: number
│  │  │  │  └─ sprite_staging_bytes?: number
│  │  │  │  └─ total_storage_bytes?: number
│  │  │  └─ line_repeat?: string
│  │  │  └─ manufacturing_planning?: object
│  │  │  │  └─ die_area_mm2_at_3_5um_range?: array<number>
│  │  │  │  └─ die_area_mm2_at_3um_range?: array<number>
│  │  │  │  └─ die_area_mm2_central_at_3_5um?: number
│  │  │  │  └─ die_area_mm2_central_at_3um?: number
│  │  │  │  └─ external_functions?: array<string>
│  │  │  │  └─ process?: string
│  │  │  │  └─ transistors_central?: number
│  │  │  │  └─ transistors_range?: array<number>
│  │  │  └─ sprite_access?: string
│  │  │  └─ text_fetch?: string
│  │  │  └─ timing_budget?: object
│  │  │  │  └─ dram_random_cycle_target_ns?: number
│  │  │  │  └─ fifo_total_drain_time_us_at_high_resolution?: number
│  │  │  │  └─ fifo_total_pixels?: number
│  │  │  │  └─ illustrative_read_time_us?: number
│  │  │  │  └─ illustrative_total_reads_per_scanline?: number
│  │  │  │  └─ maximum_sprite_row_bytes_per_scanline?: number
│  │  │  │  └─ next_row_prefetch_average_bytes_per_scanline?: number
│  │  │  │  └─ qualification?: string
│  │  │  │  └─ sprite_pattern_fetch_time_us?: number
│  │  │  │  └─ sprite_sram_cycle_target_ns?: number
│  │  │  │  └─ text_glyph_reads_per_scanline?: number
│  │  │  │  └─ two_ready_pages_drain_time_us?: number
│  │  └─ included_monitor?: boolean
│  │  └─ input?: string
│  │  └─ input_bits?: number
│  │  └─ installation?: string
│  │  └─ intensity_levels?: number
│  │  └─ interface?: string
│  │  └─ interface_id?: string → technology
│  │  └─ key_count?: number
│  │  └─ keyboard_standard_id?: string → technology
│  │  └─ legacy_card_id?: string → device
│  │  └─ link_layer_id?: string → technology
│  │  └─ local_packet_ram_target_bytes?: number
│  │  └─ local_ram_kb?: number
│  │  └─ manufacturer?: string
│  │  └─ manufacturing_planning?: object
│  │  │  └─ die_area_mm2?: number
│  │  │  └─ die_area_mm2_central?: number
│  │  │  └─ die_area_mm2_range?: array<number>
│  │  │  └─ package_allowance_usd?: number
│  │  │  └─ recipe_variants?: array<object>
│  │  │  │  └─ defect_density_cm2?: number
│  │  │  │  └─ die_area_mm2?: number
│  │  │  │  └─ id?: string
│  │  │  │  └─ manufacturing_capability_id?: string → manufacturing_capability
│  │  │  │  └─ node_um?: string
│  │  │  │  └─ processed_wafer_usd?: number
│  │  │  └─ revision_policy?: string
│  │  │  └─ wafer_mm?: number
│  │  └─ manufacturing_recipe?: string
│  │  └─ maximum_shared_raw_rate_kbps?: number
│  │  └─ mechanism_id?: string → base_part
│  │  └─ media?: string
│  │  └─ media_access_control?: string
│  │  └─ memory_addressing_bytes?: number
│  │  └─ memory_layout?: object
│  │  │  └─ font_policy?: string
│  │  │  └─ mode_exclusivity?: string
│  │  │  └─ page_flip?: string
│  │  │  └─ policy_id?: string → technology
│  │  └─ mode_discovery?: string
│  │  └─ mode_limit?: string
│  │  └─ mode_policy?: string
│  │  └─ model?: string
│  │  └─ modules_per_bank?: number
│  │  └─ monitor_id?: string → device
│  │  └─ monitor_modes?: string
│  │  └─ monitor_policy?: string
│  │  └─ native_raster?: object
│  │  │  └─ height?: number
│  │  │  └─ horizontal_khz?: number
│  │  │  └─ pixel_clock_mhz?: number
│  │  │  └─ progressive?: boolean
│  │  │  └─ refresh_hz_target?: number
│  │  │  └─ total_lines?: number
│  │  │  └─ total_pixels?: number
│  │  │  └─ width?: number
│  │  └─ navigation_section?: array<string>
│  │  └─ negotiation_id?: string → technology
│  │  └─ node_um?: number
│  │  └─ numeric_keypad?: boolean
│  │  └─ oem?: string
│  │  └─ oem_basis?: string
│  │  └─ organization?: string
│  │  └─ organization_words?: number
│  │  └─ output?: string
│  │  └─ package?: string | null
│  │  └─ page_size_kb?: number
│  │  └─ palette?: string
│  │  └─ palette_entries?: number
│  │  └─ palette_entry_bits?: number
│  │  └─ palette_grayscale_levels?: number
│  │  └─ palette_list?: object
│  │  │  └─ base_address?: string
│  │  │  └─ cad_policy?: string
│  │  │  └─ command_bytes?: number
│  │  │  └─ encoding?: string
│  │  │  └─ end_address?: string
│  │  │  └─ execution?: string
│  │  │  └─ frame_state?: string
│  │  │  └─ long_gaps?: string
│  │  │  └─ maximum_commands?: number
│  │  │  └─ register_count?: number
│  │  │  └─ reserved_bytes?: number
│  │  │  └─ write_limit?: string
│  │  └─ palette_list_id?: string → technology
│  │  └─ palette_registers?: number
│  │  └─ parity_bits?: number
│  │  └─ physical_arrangement?: string
│  │  └─ physical_population?: object
│  │  │  └─ bank_count?: number
│  │  │  └─ bank_data_width_bits?: number
│  │  │  └─ common_ram_included?: boolean
│  │  │  └─ mapping_note?: string
│  │  │  └─ parity_bits?: number
│  │  │  └─ video_ram_separate?: boolean
│  │  └─ pixel_buffer?: object
│  │  │  └─ bits_per_pixel?: number
│  │  │  └─ bytes_per_page?: number
│  │  │  └─ location?: string
│  │  │  └─ page_states?: array<string>
│  │  │  └─ pages?: number
│  │  │  └─ physical_organization?: string
│  │  │  └─ pixels_per_page?: number
│  │  │  └─ policy?: string
│  │  │  └─ total_bytes?: number
│  │  └─ pixel_clock_mhz?: number
│  │  └─ platform_rate_profiles?: array<object>
│  │  │  └─ computer_id?: string → device
│  │  │  └─ implementation?: string
│  │  │  └─ qualified_max_rate_kbps?: number
│  │  │  └─ rate_policy?: string
│  │  │  └─ server_role?: boolean
│  │  │  └─ supported_rates_kbps?: array<number>
│  │  │  └─ technology_ids?: array<string> → technology
│  │  └─ port_count?: number
│  │  └─ ports?: array<string>
│  │  └─ power?: string
│  │  └─ purchase_boundary?: string
│  │  └─ qualification?: string
│  │  └─ random_cycle_target_ns?: number
│  │  └─ rank_capacity_kb?: number
│  │  └─ ranks?: number
│  │  └─ rate_scope?: string
│  │  └─ redraw?: string
│  │  └─ refresh?: schema-defined
│  │  └─ refresh_required?: boolean
│  │  └─ register_width_bits?: number
│  │  └─ reused_elements?: array<string>
│  │  └─ rgb_palette_mapping?: string
│  │  └─ role?: string
│  │  └─ rollers?: array<object>
│  │  │  └─ default_action?: string
│  │  │  └─ position?: string
│  │  └─ scan?: string
│  │  └─ separate_sprite_sram_bytes?: number
│  │  └─ serial_register_bits?: number
│  │  └─ sides?: number
│  │  └─ signal_path?: string
│  │  └─ simultaneous_shades_at_640_200_4bpp?: number
│  │  └─ simultaneous_shades_at_800_600_2bpp?: number
│  │  └─ simultaneous_shades_with_128kb_card?: number
│  │  └─ size_inch?: number
│  │  └─ slot?: string
│  │  └─ software?: string
│  │  └─ speed_qualification_targets?: object
│  │  │  └─ basis?: string
│  │  │  └─ conditions?: string
│  │  │  └─ fallback_random_cycle_ns_range?: array<number>
│  │  │  └─ fallback_row_access_ns?: number
│  │  │  └─ preferred_random_cycle_ns?: number
│  │  │  └─ preferred_row_access_ns?: number
│  │  │  └─ stretch_row_access_ns?: number
│  │  └─ sprite_memory?: object
│  │  │  └─ bank_data_width_bits?: number
│  │  │  └─ capacity_bytes?: number
│  │  │  └─ chip_count?: number
│  │  │  └─ chip_id?: string → base_part
│  │  │  └─ separate_bus?: boolean
│  │  │  └─ separate_from_system_and_display_ram?: boolean
│  │  └─ sprite_physical_population?: object
│  │  │  └─ bank_data_width_bits?: number
│  │  │  └─ separate_bus?: boolean
│  │  │  └─ separate_from_system_and_display_ram?: boolean
│  │  └─ sprite_policy?: string
│  │  └─ sprite_profile_ref?: object
│  │  │  └─ profile?: string
│  │  │  └─ technology_id?: string → technology
│  │  └─ sprites?: schema-defined
│  │  └─ startup_rate_kbps?: number
│  │  └─ supply_rails_v?: array | null
│  │  └─ supported_fdd_count?: number
│  │  └─ supported_rates_kbps?: array<number>
│  │  └─ technology_id?: string → technology
│  │  └─ text_modes?: array<object>
│  │  │  └─ attribute_format?: string
│  │  │  └─ attribute_map_bytes_per_buffer?: number
│  │  │  └─ character_count?: number
│  │  │  └─ character_map_bytes_per_buffer?: number
│  │  │  └─ columns?: number
│  │  │  └─ configurations?: array<object>
│  │  │  │  └─ allocated_bytes?: number
│  │  │  │  └─ palette_list_bytes?: number
│  │  │  │  └─ remaining_video_ram_bytes?: number
│  │  │  │  └─ sprite_count?: number
│  │  │  │  └─ text_buffer_count?: number
│  │  │  └─ double_buffering?: boolean
│  │  │  └─ font_bytes?: number
│  │  │  └─ glyph_height?: number
│  │  │  └─ glyph_width?: number
│  │  │  └─ height?: number
│  │  │  └─ id?: string
│  │  │  └─ ram_bytes_per_page?: number
│  │  │  └─ required_raster_ids?: array<string>
│  │  │  └─ rows?: number
│  │  │  └─ sprites_available?: number
│  │  │  └─ width?: number
│  │  └─ timing_budget?: object
│  │  │  └─ page_drain_microseconds?: number
│  │  │  └─ pixel_clock_mhz?: number
│  │  │  └─ qualification?: string
│  │  │  └─ renderer_pixels_per_step?: number
│  │  │  └─ renderer_step_mhz?: number
│  │  └─ timing_target?: object
│  │  │  └─ horizontal_khz?: number
│  │  │  └─ horizontal_total_pixels?: number
│  │  │  └─ pixel_clock_mhz?: number
│  │  │  └─ refresh_hz?: number
│  │  │  └─ vertical_total_lines?: number
│  │  └─ tracking?: string
│  │  └─ transport_id?: string → technology
│  │  └─ usable_from?: array<string>
│  │  └─ video_link_id?: string → technology
│  │  └─ video_physical_population?: object
│  │  │  └─ bank_data_width_bits?: number
│  │  │  └─ separate_from_system_ram?: boolean
│  │  └─ video_ram_bytes?: number
│  │  └─ video_ram_chip_count?: number
│  │  └─ video_ram_chip_id?: string → base_part
│  │  └─ video_ram_kb?: number
│  └─ specification_id?: string → technology
│  └─ technical_profile?: object
│  │  └─ memory?: object
│  │  │  └─ bank_data_width_bits?: number
│  │  │  └─ capacity_policy?: string
│  │  │  └─ expanded_organization?: object
│  │  │  │  └─ application_memory_profile?: string
│  │  │  │  └─ common_system_ram_kb?: number
│  │  │  │  └─ contiguous_lower_ram_kb?: number
│  │  │  │  └─ controller_id?: string → base_part
│  │  │  │  └─ dma_addressing?: string
│  │  │  │  └─ normal_view?: array<object>
│  │  │  │  │  └─ description?: string
│  │  │  │  │  └─ end?: string
│  │  │  │  │  └─ role?: string
│  │  │  │  │  └─ start?: string
│  │  │  │  └─ note?: string
│  │  │  │  └─ ram_kb?: number
│  │  │  │  └─ refresh?: string
│  │  │  └─ expansion_ref?: string → device
│  │  │  └─ organization?: object
│  │  │  │  └─ application_memory_profile?: string
│  │  │  │  └─ common_system_ram_kb?: number
│  │  │  │  └─ contiguous_lower_ram_kb?: number
│  │  │  │  └─ controller_id?: string → base_part
│  │  │  │  └─ dma_addressing?: string
│  │  │  │  └─ normal_view?: array<object>
│  │  │  │  │  └─ description?: string
│  │  │  │  │  └─ end?: string
│  │  │  │  │  └─ role?: string
│  │  │  │  │  └─ start?: string
│  │  │  │  └─ note?: string
│  │  │  │  └─ refresh?: string
│  │  │  └─ organization_ref?: string → technology
│  │  │  └─ os_rom?: object
│  │  │  │  └─ capacity_bytes?: number
│  │  │  │  └─ execution?: string
│  │  │  │  └─ implementation?: string
│  │  │  └─ parity_bits?: number
│  │  │  └─ physical_population?: object
│  │  │  │  └─ bank_count?: number
│  │  │  │  └─ bank_data_width_bits?: number
│  │  │  │  └─ common_ram_included?: boolean
│  │  │  │  └─ mapping_note?: string
│  │  │  │  └─ parity_bits?: number
│  │  │  │  └─ video_ram_separate?: boolean
│  │  │  └─ population_policy?: string
│  │  │  └─ reliability_policy?: string
│  │  │  └─ sourcing_policy?: string
│  │  │  └─ sprite_physical_population?: object
│  │  │  │  └─ bank_data_width_bits?: number
│  │  │  │  └─ separate_bus?: boolean
│  │  │  │  └─ separate_from_system_and_display_ram?: boolean
│  │  │  └─ system_controller_ref?: string → base_part
│  │  │  └─ upgrade_policy?: string
│  │  │  └─ video_physical_population?: object
│  │  │  │  └─ bank_data_width_bits?: number
│  │  │  │  └─ separate_from_system_ram?: boolean
│  │  └─ network?: object
│  │  │  └─ computer_id?: string → device
│  │  └─ networking?: object
│  │  │  └─ computer_id?: string → device
│  │  │  └─ implementation?: string
│  │  │  └─ qualified_max_rate_kbps?: number
│  │  │  └─ rate_policy?: string
│  │  │  └─ server_role?: boolean
│  │  │  └─ supported_rates_kbps?: array<number>
│  │  │  └─ technology_ids?: array<string> → technology
│  │  └─ rom_and_cartridges?: object
│  │  │  └─ mainboard_rom?: array<string>
│  │  └─ software_compatibility?: object
│  │  │  └─ adaptive_text?: string
│  │  │  └─ api_id?: string → technology
│  │  │  └─ native_40_column_mode?: string
│  │  │  └─ native_target?: string
│  │  └─ software_policy?: string
│  │  └─ video?: object
│  │  │  └─ controller_id?: string → base_part
│  │  │  └─ sprite_memory?: object
│  │  │  │  └─ bank_data_width_bits?: number
│  │  │  │  └─ separate_bus?: boolean
│  │  │  │  └─ separate_from_system_and_display_ram?: boolean
│  │  │  └─ sprite_physical_population?: object
│  │  │  │  └─ bank_data_width_bits?: number
│  │  │  │  └─ separate_bus?: boolean
│  │  │  │  └─ separate_from_system_and_display_ram?: boolean
│  │  │  └─ video_physical_population?: object
│  │  │  │  └─ bank_data_width_bits?: number
│  │  │  │  └─ separate_from_system_ram?: boolean
specification*: array<object>
│  └─ number*: integer
│  └─ type*: string
│  └─ description*: string
│  └─ value?: string | number | boolean | null
requirements*: array<object>
│  └─ number*: integer
│  └─ kind*: string
│  └─ description*: string
│  └─ subject_ids?: array<string> → any foundation ID
technical_specification?: object
│  └─ chapters*: array<object>
│  │  └─ number*: integer
│  │  └─ chapter_name*: string
│  │  └─ description*: string
│  └─ parameters*: array<object>
│  │  └─ key*: string
│  │  └─ value?: string | number | null
│  │  └─ ref_id?: string → actor / technology / base_part / device / software_edition / product / external_product / manufacturing_capability
│  │  └─ ref_role?: string
graphic_modes_specification?: array<object>
│  └─ id*: string
│  └─ description*: string
│  └─ type*: string
│  └─ width*: integer | null
│  └─ height*: integer | null
│  └─ framebuffer_size*: integer | null
│  └─ double_buffering*: boolean | null
│  └─ sprites_available*: integer | null
│  └─ parameters*: array<object>
│  │  └─ key*: string
│  │  └─ value?: string | number | null
│  │  └─ ref_id?: string → actor / technology / base_part / device / software_edition / product / external_product / manufacturing_capability
│  │  └─ ref_role?: string
```

| Field path | Required in parent | Type | Constraints / allowed values |
| --- | --- | --- | --- |
| `id` | yes | `string` | pattern: "^(base_part)\\.[a-z0-9][a-z0-9_.-]*$" |
| `name` | yes | `string` | minLength: 1 |
| `kind` | yes | `string` | enum: ["integrated_circuit","discrete_semiconductor","passive","connector","cable","pcb","mechanical_part","power_supply","display_part","storage_mechanism","physical_media","documentation","packaging","supplied_assembly","material"] |
| `description` | yes | `string` | minLength: 1 |
| `supply_form` | yes | `string` | enum: ["individual_part","supplied_set","bulk_material"] |
| `manufacturer_actor_id` | yes | `string | null` | pattern: "^(actor)\\.[a-z0-9][a-z0-9_.-]*$" |
| `manufacturer_name` | no | `string | null` | — |
| `supplier_actor_ids[]` | yes | `array<string>` | pattern: "^(actor)\\.[a-z0-9][a-z0-9_.-]*$" |
| `manufacturer_part_number` | yes | `string | null` | — |
| `technology_ids[]` | yes | `array<string>` | pattern: "^(technology)\\.[a-z0-9][a-z0-9_.-]*$" |
| `manufacturing_capability_ids[]` | no | `array<schema-defined>` | — |
| `technical_definition` | yes | `object` | — |
| `technical_definition.athena_qualification` | no | `string` | — |
| `technical_definition.capacity_kb` | no | `number` | — |
| `technical_definition.compatibility_note` | no | `string` | — |
| `technical_definition.compatible_computers[]` | no | `array<string>` | pattern: "^(device)\\.[a-z0-9][a-z0-9_.-]*$" |
| `technical_definition.compatible_with[]` | no | `array<string>` | pattern: "^(device)\\.[a-z0-9][a-z0-9_.-]*$" |
| `technical_definition.configuration_requirements` | no | `object` | — |
| `technical_definition.configuration_requirements.external_application_cartridges_supported` | no | `boolean` | — |
| `technical_definition.configuration_requirements.rules[]` | no | `array<string>` | — |
| `technical_definition.configuration_requirements.scope` | no | `string` | — |
| `technical_definition.connection` | no | `string` | — |
| `technical_definition.firmware_contents[]` | no | `array<string>` | — |
| `technical_definition.form_factor` | no | `string` | — |
| `technical_definition.host_qualification` | no | `object` | — |
| `technical_definition.host_qualification.device.base_computer.artemis` | no | `object` | — |
| `technical_definition.host_qualification.device.base_computer.artemis.computer_id` | no | `string` | pattern: "^(device)\\.[a-z0-9][a-z0-9_.-]*$" |
| `technical_definition.host_qualification.device.base_computer.artemis.implementation` | no | `string` | — |
| `technical_definition.host_qualification.device.base_computer.artemis.qualified_max_rate_kbps` | no | `number` | — |
| `technical_definition.host_qualification.device.base_computer.artemis.rate_policy` | no | `string` | — |
| `technical_definition.host_qualification.device.base_computer.artemis.supported_rates_kbps[]` | no | `array<number>` | — |
| `technical_definition.host_qualification.device.base_computer.artemis.technology_ids[]` | no | `array<string>` | pattern: "^(technology)\\.[a-z0-9][a-z0-9_.-]*$" |
| `technical_definition.host_qualification.device.base_computer.artemis_pro` | no | `object` | — |
| `technical_definition.host_qualification.device.base_computer.artemis_pro.computer_id` | no | `string` | pattern: "^(device)\\.[a-z0-9][a-z0-9_.-]*$" |
| `technical_definition.host_qualification.device.base_computer.artemis_pro.implementation` | no | `string` | — |
| `technical_definition.host_qualification.device.base_computer.artemis_pro.qualified_max_rate_kbps` | no | `number` | — |
| `technical_definition.host_qualification.device.base_computer.artemis_pro.rate_policy` | no | `string` | — |
| `technical_definition.host_qualification.device.base_computer.artemis_pro.server_role` | no | `boolean` | — |
| `technical_definition.host_qualification.device.base_computer.artemis_pro.supported_rates_kbps[]` | no | `array<number>` | — |
| `technical_definition.host_qualification.device.base_computer.artemis_pro.technology_ids[]` | no | `array<string>` | pattern: "^(technology)\\.[a-z0-9][a-z0-9_.-]*$" |
| `technical_definition.host_qualification.device.base_computer.athena` | no | `object` | — |
| `technical_definition.host_qualification.device.base_computer.athena.computer_id` | no | `string` | pattern: "^(device)\\.[a-z0-9][a-z0-9_.-]*$" |
| `technical_definition.host_qualification.device.base_computer.athena_server` | no | `object` | — |
| `technical_definition.host_qualification.device.base_computer.athena_server.computer_id` | no | `string` | pattern: "^(device)\\.[a-z0-9][a-z0-9_.-]*$" |
| `technical_definition.host_qualification.device.base_computer.aurelia` | no | `object` | — |
| `technical_definition.host_qualification.device.base_computer.aurelia.computer_id` | no | `string` | pattern: "^(device)\\.[a-z0-9][a-z0-9_.-]*$" |
| `technical_definition.host_qualification.device.base_computer.aurelia.qualified_max_rate_kbps` | no | `number` | — |
| `technical_definition.host_qualification.device.base_computer.aurelia.rate_policy` | no | `string` | — |
| `technical_definition.host_qualification.device.base_computer.aurelia.supported_rates_kbps[]` | no | `array<number>` | — |
| `technical_definition.host_qualification.device.base_computer.aurelia.technology_ids[]` | no | `array<string>` | pattern: "^(technology)\\.[a-z0-9][a-z0-9_.-]*$" |
| `technical_definition.host_qualification.device.base_computer.aurelia_plus` | no | `object` | — |
| `technical_definition.host_qualification.device.base_computer.aurelia_plus.computer_id` | no | `string` | pattern: "^(device)\\.[a-z0-9][a-z0-9_.-]*$" |
| `technical_definition.host_qualification.device.base_computer.aurelia_plus.qualified_max_rate_kbps` | no | `number` | — |
| `technical_definition.host_qualification.device.base_computer.aurelia_plus.rate_policy` | no | `string` | — |
| `technical_definition.host_qualification.device.base_computer.aurelia_plus.supported_rates_kbps[]` | no | `array<number>` | — |
| `technical_definition.host_qualification.device.base_computer.aurelia_plus.technology_ids[]` | no | `array<string>` | pattern: "^(technology)\\.[a-z0-9][a-z0-9_.-]*$" |
| `technical_definition.integration_requirements` | no | `object` | — |
| `technical_definition.integration_requirements.sourcing_policy` | no | `string` | — |
| `technical_definition.io_and_expansion` | no | `object` | — |
| `technical_definition.io_and_expansion.application_rom_cards_supported` | no | `boolean` | — |
| `technical_definition.io_and_expansion.dedicated_video_slot` | no | `object` | — |
| `technical_definition.io_and_expansion.dedicated_video_slot.general_purpose_slots_consumed` | no | `number` | — |
| `technical_definition.io_and_expansion.dedicated_video_slot.hot_swap` | no | `boolean` | — |
| `technical_definition.io_and_expansion.dedicated_video_slot.interface` | no | `string` | — |
| `technical_definition.io_and_expansion.dedicated_video_slot.replaceable` | no | `boolean` | — |
| `technical_definition.io_and_expansion.eeprom_bios` | no | `object` | — |
| `technical_definition.io_and_expansion.eeprom_bios.capacity_kb` | no | `null` | — |
| `technical_definition.io_and_expansion.eeprom_bios.included` | no | `boolean` | — |
| `technical_definition.io_and_expansion.eeprom_bios.purpose` | no | `string` | — |
| `technical_definition.io_and_expansion.expansion_slots` | no | `object` | — |
| `technical_definition.io_and_expansion.expansion_slots.future_pin_area_reserved_for_bits` | no | `number` | — |
| `technical_definition.io_and_expansion.expansion_slots.plug_and_execute` | no | `boolean` | — |
| `technical_definition.io_and_expansion.expansion_slots.width_bits` | no | `number` | — |
| `technical_definition.io_and_expansion.rom_eeprom_cartridge_slots` | no | `object` | — |
| `technical_definition.io_and_expansion.rom_eeprom_cartridge_slots.front` | no | `string` | — |
| `technical_definition.io_and_expansion.rom_eeprom_cartridge_slots.rear` | no | `string` | — |
| `technical_definition.manufacturing_planning` | no | `object` | — |
| `technical_definition.manufacturing_planning.die_area_mm2` | no | `number` | — |
| `technical_definition.manufacturing_planning.die_area_mm2_target` | no | `number` | — |
| `technical_definition.manufacturing_planning.initial_manufacturer` | no | `string` | — |
| `technical_definition.manufacturing_planning.node_um` | no | `number` | — |
| `technical_definition.manufacturing_planning.policy` | no | `string` | — |
| `technical_definition.manufacturing_planning.transistor_budget_target` | no | `number` | — |
| `technical_definition.manufacturing_planning.wafer_diameter_mm` | no | `number` | — |
| `technical_definition.memory_constraints` | no | `object` | — |
| `technical_definition.memory_constraints.max_ram_kib` | no | `number | null` | — |
| `technical_definition.memory_constraints.mixed_module_types_allowed` | no | `boolean` | — |
| `technical_definition.memory_interface` | no | `object` | — |
| `technical_definition.memory_interface.expansion_id` | no | `string` | pattern: "^(device)\\.[a-z0-9][a-z0-9_.-]*$" |
| `technical_definition.memory_interface.organization_id` | no | `string` | pattern: "^(technology)\\.[a-z0-9][a-z0-9_.-]*$" |
| `technical_definition.memory_interface.system_controller_id` | no | `string` | pattern: "^(base_part)\\.[a-z0-9][a-z0-9_.-]*$" |
| `technical_definition.memory_mapping` | no | `object` | — |
| `technical_definition.memory_mapping.application_memory` | no | `string` | — |
| `technical_definition.memory_mapping.configuration` | no | `string` | — |
| `technical_definition.memory_mapping.installation` | no | `string` | — |
| `technical_definition.memory_mapping.normal_cpu_range` | no | `string` | — |
| `technical_definition.memory_mapping.page_count` | no | `number` | — |
| `technical_definition.memory_mapping.page_size_kb` | no | `number` | — |
| `technical_definition.memory_mapping.service_calls` | no | `string` | — |
| `technical_definition.memory_mapping.slot_count` | no | `number` | — |
| `technical_definition.memory_mapping.system_workspace` | no | `string` | — |
| `technical_definition.packaging` | no | `string` | — |
| `technical_definition.physical_population` | no | `object` | — |
| `technical_definition.physical_population.capacity_kb` | no | `number` | — |
| `technical_definition.physical_population.chip_id` | no | `string` | pattern: "^(base_part)\\.[a-z0-9][a-z0-9_.-]*$" |
| `technical_definition.physical_population.data_chip_count` | no | `number` | — |
| `technical_definition.physical_population.data_width_bits` | no | `number` | — |
| `technical_definition.physical_population.refresh_owner` | no | `string` | — |
| `technical_definition.planned_compatible_with[]` | no | `array<string>` | pattern: "^(device)\\.[a-z0-9][a-z0-9_.-]*$" |
| `technical_definition.processor` | no | `object` | — |
| `technical_definition.processor.part_id` | no | `string` | pattern: "^(base_part)\\.[a-z0-9][a-z0-9_.-]*$" |
| `technical_definition.recommended_software_id` | no | `string` | pattern: "^(software_edition)\\.[a-z0-9][a-z0-9_.-]*$" |
| `technical_definition.role` | no | `string` | — |
| `technical_definition.slot_count` | no | `number` | — |
| `technical_definition.specification` | no | `object` | — |
| `technical_definition.specification.acceleration[]` | no | `array<string>` | — |
| `technical_definition.specification.adaptation` | no | `string` | — |
| `technical_definition.specification.adapter_requirements` | no | `object` | — |
| `technical_definition.specification.adapter_requirements.buffer_policy` | no | `string` | — |
| `technical_definition.specification.adapter_requirements.flow_control` | no | `string` | — |
| `technical_definition.specification.adapter_requirements.hardware_services[]` | no | `array<string>` | — |
| `technical_definition.specification.adapter_requirements.host_service` | no | `string` | — |
| `technical_definition.specification.adapter_requirements.local_packet_ram_target_bytes` | no | `number` | — |
| `technical_definition.specification.additions[]` | no | `array<string>` | — |
| `technical_definition.specification.analog_chain` | no | `string` | — |
| `technical_definition.specification.api_id` | no | `string` | pattern: "^(technology)\\.[a-z0-9][a-z0-9_.-]*$" |
| `technical_definition.specification.arbitration` | no | `string` | — |
| `technical_definition.specification.array_columns` | no | `number` | — |
| `technical_definition.specification.array_rows` | no | `number` | — |
| `technical_definition.specification.bandwidth` | no | `string` | — |
| `technical_definition.specification.bank_capacity_kb` | no | `number` | — |
| `technical_definition.specification.bank_control` | no | `string` | — |
| `technical_definition.specification.bank_data_width_bits` | no | `number` | — |
| `technical_definition.specification.bank_organization` | no | `string` | — |
| `technical_definition.specification.base_controller_id` | no | `string` | pattern: "^(base_part)\\.[a-z0-9][a-z0-9_.-]*$" |
| `technical_definition.specification.base_product_id` | no | `string` | pattern: "^(base_part)\\.[a-z0-9][a-z0-9_.-]*$" |
| `technical_definition.specification.beam_voltage_levels` | no | `number` | — |
| `technical_definition.specification.bitmap_modes[]` | no | `array<object>` | — |
| `technical_definition.specification.bitmap_modes[].bits_per_pixel` | no | `number` | — |
| `technical_definition.specification.bitmap_modes[].bytes_per_framebuffer` | no | `number` | — |
| `technical_definition.specification.bitmap_modes[].compatibility_mode` | no | `boolean` | — |
| `technical_definition.specification.bitmap_modes[].configurations[]` | no | `array<object>` | — |
| `technical_definition.specification.bitmap_modes[].configurations[].allocated_bytes` | no | `number` | — |
| `technical_definition.specification.bitmap_modes[].configurations[].framebuffer_bytes` | no | `number` | — |
| `technical_definition.specification.bitmap_modes[].configurations[].framebuffer_count` | no | `number` | — |
| `technical_definition.specification.bitmap_modes[].configurations[].palette_list_bytes` | no | `number` | — |
| `technical_definition.specification.bitmap_modes[].configurations[].remaining_video_ram_bytes` | no | `number` | — |
| `technical_definition.specification.bitmap_modes[].configurations[].sprite_count` | no | `number` | — |
| `technical_definition.specification.bitmap_modes[].double_buffering` | no | `boolean` | — |
| `technical_definition.specification.bitmap_modes[].framebuffer_bytes` | no | `number` | — |
| `technical_definition.specification.bitmap_modes[].framebuffer_count` | no | `number` | — |
| `technical_definition.specification.bitmap_modes[].height` | no | `number` | — |
| `technical_definition.specification.bitmap_modes[].id` | no | `string` | — |
| `technical_definition.specification.bitmap_modes[].palette_list_bytes` | no | `number` | — |
| `technical_definition.specification.bitmap_modes[].remaining_bytes` | no | `number` | — |
| `technical_definition.specification.bitmap_modes[].required_raster_ids[]` | no | `array<string>` | — |
| `technical_definition.specification.bitmap_modes[].simultaneous_values` | no | `number` | — |
| `technical_definition.specification.bitmap_modes[].sprites_available` | no | `number` | — |
| `technical_definition.specification.bitmap_modes[].stride_bytes` | no | `number` | — |
| `technical_definition.specification.bitmap_modes[].width` | no | `number` | — |
| `technical_definition.specification.boot` | no | `string` | — |
| `technical_definition.specification.bridge_design_id` | no | `string` | pattern: "^(technology)\\.[a-z0-9][a-z0-9_.-]*$" |
| `technical_definition.specification.buttons` | no | `number` | — |
| `technical_definition.specification.capabilities` | no | `object` | — |
| `technical_definition.specification.capabilities.color_model` | no | `string` | — |
| `technical_definition.specification.capabilities.maximum_pixel_clock_mhz` | no | `number` | — |
| `technical_definition.specification.capabilities.palette_precision_bits` | no | `number` | — |
| `technical_definition.specification.capabilities.preferred_raster_id` | no | `string` | — |
| `technical_definition.specification.capabilities.programmable_palette` | no | `boolean` | — |
| `technical_definition.specification.capabilities.protocol_version` | no | `number` | — |
| `technical_definition.specification.capabilities.raster_ids[]` | no | `array<string>` | — |
| `technical_definition.specification.capacity_bytes` | no | `number` | — |
| `technical_definition.specification.capacity_kb` | no | `number | null` | — |
| `technical_definition.specification.capacity_kbit` | no | `number` | — |
| `technical_definition.specification.capacity_mb` | no | `number` | — |
| `technical_definition.specification.card_id` | no | `string` | pattern: "^(device)\\.[a-z0-9][a-z0-9_.-]*$" |
| `technical_definition.specification.character_row_cache` | no | `object` | — |
| `technical_definition.specification.character_row_cache.banks` | no | `number` | — |
| `technical_definition.specification.character_row_cache.bytes_per_bank` | no | `number` | — |
| `technical_definition.specification.character_row_cache.purpose` | no | `string` | — |
| `technical_definition.specification.character_row_cache.total_bytes` | no | `number` | — |
| `technical_definition.specification.chip_organization` | no | `string` | — |
| `technical_definition.specification.chip_type_id` | no | `string` | pattern: "^(base_part)\\.[a-z0-9][a-z0-9_.-]*$" |
| `technical_definition.specification.chips` | no | `number` | — |
| `technical_definition.specification.chips_per_rank` | no | `number` | — |
| `technical_definition.specification.class_protocol_id` | no | `string` | pattern: "^(technology)\\.[a-z0-9][a-z0-9_.-]*$" |
| `technical_definition.specification.clock_mhz` | no | `number` | — |
| `technical_definition.specification.compatibility` | no | `string` | — |
| `technical_definition.specification.connection` | no | `string` | — |
| `technical_definition.specification.continuity` | no | `string` | — |
| `technical_definition.specification.controller_die_count` | no | `null` | — |
| `technical_definition.specification.controller_id` | no | `string` | pattern: "^(base_part)\\.[a-z0-9][a-z0-9_.-]*$" |
| `technical_definition.specification.conversion` | no | `string` | — |
| `technical_definition.specification.cpu_address_bits` | no | `number` | — |
| `technical_definition.specification.cpu_id` | no | `string` | pattern: "^(base_part)\\.[a-z0-9][a-z0-9_.-]*$" |
| `technical_definition.specification.crt_id` | no | `string` | pattern: "^(base_part)\\.[a-z0-9][a-z0-9_.-]*$" |
| `technical_definition.specification.cursor_keys` | no | `string` | — |
| `technical_definition.specification.data_width_bits` | no | `number` | — |
| `technical_definition.specification.density` | no | `string` | — |
| `technical_definition.specification.diagonal_inch` | no | `number` | — |
| `technical_definition.specification.diagonal_inches` | no | `number` | — |
| `technical_definition.specification.die_area_mm2` | no | `number` | — |
| `technical_definition.specification.die_area_planning_mm2` | no | `number` | — |
| `technical_definition.specification.digital_output_bits` | no | `number` | — |
| `technical_definition.specification.disk_formats[]` | no | `array<string>` | — |
| `technical_definition.specification.disk_ii_interface` | no | `boolean` | — |
| `technical_definition.specification.disk_interface` | no | `string` | — |
| `technical_definition.specification.display_controller_id` | no | `string` | pattern: "^(base_part)\\.[a-z0-9][a-z0-9_.-]*$" |
| `technical_definition.specification.display_memory` | no | `object` | — |
| `technical_definition.specification.display_memory.bank_data_width_bits` | no | `number` | — |
| `technical_definition.specification.display_memory.capacity_bytes` | no | `number` | — |
| `technical_definition.specification.display_memory.chip_count` | no | `number` | — |
| `technical_definition.specification.display_memory.chip_id` | no | `string` | pattern: "^(base_part)\\.[a-z0-9][a-z0-9_.-]*$" |
| `technical_definition.specification.display_memory.organization` | no | `string` | — |
| `technical_definition.specification.display_modes` | no | `string` | — |
| `technical_definition.specification.display_subassembly_id` | no | `string` | pattern: "^(base_part)\\.[a-z0-9][a-z0-9_.-]*$" |
| `technical_definition.specification.displayed_color_registers` | no | `number` | — |
| `technical_definition.specification.displayed_registers` | no | `number` | — |
| `technical_definition.specification.dma` | no | `object` | — |
| `technical_definition.specification.dma.active_transfer_engines` | no | `number` | — |
| `technical_definition.specification.dma.address_steps[]` | no | `array<string>` | — |
| `technical_definition.specification.dma.arbitration` | no | `string` | — |
| `technical_definition.specification.dma.bank_selection` | no | `string` | — |
| `technical_definition.specification.dma.completion` | no | `string` | — |
| `technical_definition.specification.dma.destination_address_bits` | no | `number` | — |
| `technical_definition.specification.dma.length_bits` | no | `number` | — |
| `technical_definition.specification.dma.operations[]` | no | `array<string>` | — |
| `technical_definition.specification.dma.peripheral_scope` | no | `string` | — |
| `technical_definition.specification.dma.transfer_contexts` | no | `number` | — |
| `technical_definition.specification.dma.video_endpoint` | no | `string` | — |
| `technical_definition.specification.dot_pitch_mm` | no | `number` | — |
| `technical_definition.specification.electrical_contract` | no | `string` | — |
| `technical_definition.specification.electrical_interface` | no | `string` | — |
| `technical_definition.specification.ergonomics` | no | `string` | — |
| `technical_definition.specification.execution` | no | `string` | — |
| `technical_definition.specification.expansion_role` | no | `string` | — |
| `technical_definition.specification.fdd_density` | no | `string` | — |
| `technical_definition.specification.fdd_size_inch` | no | `number` | — |
| `technical_definition.specification.feature_continuity_id` | no | `string` | pattern: "^(device)\\.[a-z0-9][a-z0-9_.-]*$" |
| `technical_definition.specification.flexibus_ports` | no | `number` | — |
| `technical_definition.specification.format` | no | `string` | — |
| `technical_definition.specification.formatted_capacity_kb` | no | `null` | — |
| `technical_definition.specification.function_keys` | no | `string` | — |
| `technical_definition.specification.grayscale_levels` | no | `number` | — |
| `technical_definition.specification.hdd_bundled_with_standard_artemis` | no | `boolean` | — |
| `technical_definition.specification.hdd_interface_supported` | no | `boolean` | — |
| `technical_definition.specification.historical_raster` | no | `string` | — |
| `technical_definition.specification.host` | no | `string` | — |
| `technical_definition.specification.host_access` | no | `string` | — |
| `technical_definition.specification.host_clock_mhz[]` | no | `array<number>` | — |
| `technical_definition.specification.host_integration` | no | `string` | — |
| `technical_definition.specification.host_interface` | no | `schema-defined` | — |
| `technical_definition.specification.implementation` | no | `string` | — |
| `technical_definition.specification.implementation_design` | no | `object` | — |
| `technical_definition.specification.implementation_design.arbitration` | no | `string` | — |
| `technical_definition.specification.implementation_design.clock_targets` | no | `object` | — |
| `technical_definition.specification.implementation_design.clock_targets.high_resolution_pixel_mhz` | no | `number` | — |
| `technical_definition.specification.implementation_design.clock_targets.low_resolution_pixel_mhz` | no | `number` | — |
| `technical_definition.specification.implementation_design.clock_targets.master_mhz` | no | `number` | — |
| `technical_definition.specification.implementation_design.clock_targets.maximum_pixel_fifo_output_mbytes_per_second` | no | `number` | — |
| `technical_definition.specification.implementation_design.clock_targets.scope` | no | `string` | — |
| `technical_definition.specification.implementation_design.engines` | no | `object` | — |
| `technical_definition.specification.implementation_design.engines.fifo` | no | `string` | — |
| `technical_definition.specification.implementation_design.engines.renderer` | no | `string` | — |
| `technical_definition.specification.implementation_design.engines.scanout` | no | `string` | — |
| `technical_definition.specification.implementation_design.engines.underrun` | no | `string` | — |
| `technical_definition.specification.implementation_design.internal_buffers` | no | `object` | — |
| `technical_definition.specification.implementation_design.internal_buffers.character_attribute_row_cache_bytes` | no | `number` | — |
| `technical_definition.specification.implementation_design.internal_buffers.included_in_die_estimates` | no | `boolean` | — |
| `technical_definition.specification.implementation_design.internal_buffers.next_character_attribute_row_cache_bytes` | no | `number` | — |
| `technical_definition.specification.implementation_design.internal_buffers.pixel_bits` | no | `number` | — |
| `technical_definition.specification.implementation_design.internal_buffers.pixel_fifo_bytes` | no | `number` | — |
| `technical_definition.specification.implementation_design.internal_buffers.pixel_fifo_page_bytes` | no | `number` | — |
| `technical_definition.specification.implementation_design.internal_buffers.pixel_fifo_page_count` | no | `number` | — |
| `technical_definition.specification.implementation_design.internal_buffers.sprite_row_shifters_bytes` | no | `number` | — |
| `technical_definition.specification.implementation_design.internal_buffers.sprite_staging_bytes` | no | `number` | — |
| `technical_definition.specification.implementation_design.internal_buffers.total_storage_bytes` | no | `number` | — |
| `technical_definition.specification.implementation_design.line_repeat` | no | `string` | — |
| `technical_definition.specification.implementation_design.manufacturing_planning` | no | `object` | — |
| `technical_definition.specification.implementation_design.manufacturing_planning.die_area_mm2_at_3_5um_range[]` | no | `array<number>` | — |
| `technical_definition.specification.implementation_design.manufacturing_planning.die_area_mm2_at_3um_range[]` | no | `array<number>` | — |
| `technical_definition.specification.implementation_design.manufacturing_planning.die_area_mm2_central_at_3_5um` | no | `number` | — |
| `technical_definition.specification.implementation_design.manufacturing_planning.die_area_mm2_central_at_3um` | no | `number` | — |
| `technical_definition.specification.implementation_design.manufacturing_planning.external_functions[]` | no | `array<string>` | — |
| `technical_definition.specification.implementation_design.manufacturing_planning.process` | no | `string` | — |
| `technical_definition.specification.implementation_design.manufacturing_planning.transistors_central` | no | `number` | — |
| `technical_definition.specification.implementation_design.manufacturing_planning.transistors_range[]` | no | `array<number>` | — |
| `technical_definition.specification.implementation_design.sprite_access` | no | `string` | — |
| `technical_definition.specification.implementation_design.text_fetch` | no | `string` | — |
| `technical_definition.specification.implementation_design.timing_budget` | no | `object` | — |
| `technical_definition.specification.implementation_design.timing_budget.dram_random_cycle_target_ns` | no | `number` | — |
| `technical_definition.specification.implementation_design.timing_budget.fifo_total_drain_time_us_at_high_resolution` | no | `number` | — |
| `technical_definition.specification.implementation_design.timing_budget.fifo_total_pixels` | no | `number` | — |
| `technical_definition.specification.implementation_design.timing_budget.illustrative_read_time_us` | no | `number` | — |
| `technical_definition.specification.implementation_design.timing_budget.illustrative_total_reads_per_scanline` | no | `number` | — |
| `technical_definition.specification.implementation_design.timing_budget.maximum_sprite_row_bytes_per_scanline` | no | `number` | — |
| `technical_definition.specification.implementation_design.timing_budget.next_row_prefetch_average_bytes_per_scanline` | no | `number` | — |
| `technical_definition.specification.implementation_design.timing_budget.qualification` | no | `string` | — |
| `technical_definition.specification.implementation_design.timing_budget.sprite_pattern_fetch_time_us` | no | `number` | — |
| `technical_definition.specification.implementation_design.timing_budget.sprite_sram_cycle_target_ns` | no | `number` | — |
| `technical_definition.specification.implementation_design.timing_budget.text_glyph_reads_per_scanline` | no | `number` | — |
| `technical_definition.specification.implementation_design.timing_budget.two_ready_pages_drain_time_us` | no | `number` | — |
| `technical_definition.specification.included_monitor` | no | `boolean` | — |
| `technical_definition.specification.input` | no | `string` | — |
| `technical_definition.specification.input_bits` | no | `number` | — |
| `technical_definition.specification.installation` | no | `string` | — |
| `technical_definition.specification.intensity_levels` | no | `number` | — |
| `technical_definition.specification.interface` | no | `string` | — |
| `technical_definition.specification.interface_id` | no | `string` | pattern: "^(technology)\\.[a-z0-9][a-z0-9_.-]*$" |
| `technical_definition.specification.key_count` | no | `number` | — |
| `technical_definition.specification.keyboard_standard_id` | no | `string` | pattern: "^(technology)\\.[a-z0-9][a-z0-9_.-]*$" |
| `technical_definition.specification.legacy_card_id` | no | `string` | pattern: "^(device)\\.[a-z0-9][a-z0-9_.-]*$" |
| `technical_definition.specification.link_layer_id` | no | `string` | pattern: "^(technology)\\.[a-z0-9][a-z0-9_.-]*$" |
| `technical_definition.specification.local_packet_ram_target_bytes` | no | `number` | — |
| `technical_definition.specification.local_ram_kb` | no | `number` | — |
| `technical_definition.specification.manufacturer` | no | `string` | — |
| `technical_definition.specification.manufacturing_planning` | no | `object` | — |
| `technical_definition.specification.manufacturing_planning.die_area_mm2` | no | `number` | — |
| `technical_definition.specification.manufacturing_planning.die_area_mm2_central` | no | `number` | — |
| `technical_definition.specification.manufacturing_planning.die_area_mm2_range[]` | no | `array<number>` | — |
| `technical_definition.specification.manufacturing_planning.package_allowance_usd` | no | `number` | — |
| `technical_definition.specification.manufacturing_planning.recipe_variants[]` | no | `array<object>` | — |
| `technical_definition.specification.manufacturing_planning.recipe_variants[].defect_density_cm2` | no | `number` | — |
| `technical_definition.specification.manufacturing_planning.recipe_variants[].die_area_mm2` | no | `number` | — |
| `technical_definition.specification.manufacturing_planning.recipe_variants[].id` | no | `string` | — |
| `technical_definition.specification.manufacturing_planning.recipe_variants[].manufacturing_capability_id` | no | `string` | pattern: "^(manufacturing_capability)\\.[a-z0-9][a-z0-9_.-]*$" |
| `technical_definition.specification.manufacturing_planning.recipe_variants[].node_um` | no | `string` | — |
| `technical_definition.specification.manufacturing_planning.recipe_variants[].processed_wafer_usd` | no | `number` | — |
| `technical_definition.specification.manufacturing_planning.revision_policy` | no | `string` | — |
| `technical_definition.specification.manufacturing_planning.wafer_mm` | no | `number` | — |
| `technical_definition.specification.manufacturing_recipe` | no | `string` | — |
| `technical_definition.specification.maximum_shared_raw_rate_kbps` | no | `number` | — |
| `technical_definition.specification.mechanism_id` | no | `string` | pattern: "^(base_part)\\.[a-z0-9][a-z0-9_.-]*$" |
| `technical_definition.specification.media` | no | `string` | — |
| `technical_definition.specification.media_access_control` | no | `string` | — |
| `technical_definition.specification.memory_addressing_bytes` | no | `number` | — |
| `technical_definition.specification.memory_layout` | no | `object` | — |
| `technical_definition.specification.memory_layout.font_policy` | no | `string` | — |
| `technical_definition.specification.memory_layout.mode_exclusivity` | no | `string` | — |
| `technical_definition.specification.memory_layout.page_flip` | no | `string` | — |
| `technical_definition.specification.memory_layout.policy_id` | no | `string` | pattern: "^(technology)\\.[a-z0-9][a-z0-9_.-]*$" |
| `technical_definition.specification.mode_discovery` | no | `string` | — |
| `technical_definition.specification.mode_limit` | no | `string` | — |
| `technical_definition.specification.mode_policy` | no | `string` | — |
| `technical_definition.specification.model` | no | `string` | — |
| `technical_definition.specification.modules_per_bank` | no | `number` | — |
| `technical_definition.specification.monitor_id` | no | `string` | pattern: "^(device)\\.[a-z0-9][a-z0-9_.-]*$" |
| `technical_definition.specification.monitor_modes` | no | `string` | — |
| `technical_definition.specification.monitor_policy` | no | `string` | — |
| `technical_definition.specification.native_raster` | no | `object` | — |
| `technical_definition.specification.native_raster.height` | no | `number` | — |
| `technical_definition.specification.native_raster.horizontal_khz` | no | `number` | — |
| `technical_definition.specification.native_raster.pixel_clock_mhz` | no | `number` | — |
| `technical_definition.specification.native_raster.progressive` | no | `boolean` | — |
| `technical_definition.specification.native_raster.refresh_hz_target` | no | `number` | — |
| `technical_definition.specification.native_raster.total_lines` | no | `number` | — |
| `technical_definition.specification.native_raster.total_pixels` | no | `number` | — |
| `technical_definition.specification.native_raster.width` | no | `number` | — |
| `technical_definition.specification.navigation_section[]` | no | `array<string>` | — |
| `technical_definition.specification.negotiation_id` | no | `string` | pattern: "^(technology)\\.[a-z0-9][a-z0-9_.-]*$" |
| `technical_definition.specification.node_um` | no | `number` | — |
| `technical_definition.specification.numeric_keypad` | no | `boolean` | — |
| `technical_definition.specification.oem` | no | `string` | — |
| `technical_definition.specification.oem_basis` | no | `string` | — |
| `technical_definition.specification.organization` | no | `string` | — |
| `technical_definition.specification.organization_words` | no | `number` | — |
| `technical_definition.specification.output` | no | `string` | — |
| `technical_definition.specification.package` | no | `string | null` | — |
| `technical_definition.specification.page_size_kb` | no | `number` | — |
| `technical_definition.specification.palette` | no | `string` | — |
| `technical_definition.specification.palette_entries` | no | `number` | — |
| `technical_definition.specification.palette_entry_bits` | no | `number` | — |
| `technical_definition.specification.palette_grayscale_levels` | no | `number` | — |
| `technical_definition.specification.palette_list` | no | `object` | — |
| `technical_definition.specification.palette_list.base_address` | no | `string` | — |
| `technical_definition.specification.palette_list.cad_policy` | no | `string` | — |
| `technical_definition.specification.palette_list.command_bytes` | no | `number` | — |
| `technical_definition.specification.palette_list.encoding` | no | `string` | — |
| `technical_definition.specification.palette_list.end_address` | no | `string` | — |
| `technical_definition.specification.palette_list.execution` | no | `string` | — |
| `technical_definition.specification.palette_list.frame_state` | no | `string` | — |
| `technical_definition.specification.palette_list.long_gaps` | no | `string` | — |
| `technical_definition.specification.palette_list.maximum_commands` | no | `number` | — |
| `technical_definition.specification.palette_list.register_count` | no | `number` | — |
| `technical_definition.specification.palette_list.reserved_bytes` | no | `number` | — |
| `technical_definition.specification.palette_list.write_limit` | no | `string` | — |
| `technical_definition.specification.palette_list_id` | no | `string` | pattern: "^(technology)\\.[a-z0-9][a-z0-9_.-]*$" |
| `technical_definition.specification.palette_registers` | no | `number` | — |
| `technical_definition.specification.parity_bits` | no | `number` | — |
| `technical_definition.specification.physical_arrangement` | no | `string` | — |
| `technical_definition.specification.physical_population` | no | `object` | — |
| `technical_definition.specification.physical_population.bank_count` | no | `number` | — |
| `technical_definition.specification.physical_population.bank_data_width_bits` | no | `number` | — |
| `technical_definition.specification.physical_population.common_ram_included` | no | `boolean` | — |
| `technical_definition.specification.physical_population.mapping_note` | no | `string` | — |
| `technical_definition.specification.physical_population.parity_bits` | no | `number` | — |
| `technical_definition.specification.physical_population.video_ram_separate` | no | `boolean` | — |
| `technical_definition.specification.pixel_buffer` | no | `object` | — |
| `technical_definition.specification.pixel_buffer.bits_per_pixel` | no | `number` | — |
| `technical_definition.specification.pixel_buffer.bytes_per_page` | no | `number` | — |
| `technical_definition.specification.pixel_buffer.location` | no | `string` | — |
| `technical_definition.specification.pixel_buffer.page_states[]` | no | `array<string>` | — |
| `technical_definition.specification.pixel_buffer.pages` | no | `number` | — |
| `technical_definition.specification.pixel_buffer.physical_organization` | no | `string` | — |
| `technical_definition.specification.pixel_buffer.pixels_per_page` | no | `number` | — |
| `technical_definition.specification.pixel_buffer.policy` | no | `string` | — |
| `technical_definition.specification.pixel_buffer.total_bytes` | no | `number` | — |
| `technical_definition.specification.pixel_clock_mhz` | no | `number` | — |
| `technical_definition.specification.platform_rate_profiles[]` | no | `array<object>` | — |
| `technical_definition.specification.platform_rate_profiles[].computer_id` | no | `string` | pattern: "^(device)\\.[a-z0-9][a-z0-9_.-]*$" |
| `technical_definition.specification.platform_rate_profiles[].implementation` | no | `string` | — |
| `technical_definition.specification.platform_rate_profiles[].qualified_max_rate_kbps` | no | `number` | — |
| `technical_definition.specification.platform_rate_profiles[].rate_policy` | no | `string` | — |
| `technical_definition.specification.platform_rate_profiles[].server_role` | no | `boolean` | — |
| `technical_definition.specification.platform_rate_profiles[].supported_rates_kbps[]` | no | `array<number>` | — |
| `technical_definition.specification.platform_rate_profiles[].technology_ids[]` | no | `array<string>` | pattern: "^(technology)\\.[a-z0-9][a-z0-9_.-]*$" |
| `technical_definition.specification.port_count` | no | `number` | — |
| `technical_definition.specification.ports[]` | no | `array<string>` | — |
| `technical_definition.specification.power` | no | `string` | — |
| `technical_definition.specification.purchase_boundary` | no | `string` | — |
| `technical_definition.specification.qualification` | no | `string` | — |
| `technical_definition.specification.random_cycle_target_ns` | no | `number` | — |
| `technical_definition.specification.rank_capacity_kb` | no | `number` | — |
| `technical_definition.specification.ranks` | no | `number` | — |
| `technical_definition.specification.rate_scope` | no | `string` | — |
| `technical_definition.specification.redraw` | no | `string` | — |
| `technical_definition.specification.refresh` | no | `schema-defined` | — |
| `technical_definition.specification.refresh_required` | no | `boolean` | — |
| `technical_definition.specification.register_width_bits` | no | `number` | — |
| `technical_definition.specification.reused_elements[]` | no | `array<string>` | — |
| `technical_definition.specification.rgb_palette_mapping` | no | `string` | — |
| `technical_definition.specification.role` | no | `string` | — |
| `technical_definition.specification.rollers[]` | no | `array<object>` | — |
| `technical_definition.specification.rollers[].default_action` | no | `string` | — |
| `technical_definition.specification.rollers[].position` | no | `string` | — |
| `technical_definition.specification.scan` | no | `string` | — |
| `technical_definition.specification.separate_sprite_sram_bytes` | no | `number` | — |
| `technical_definition.specification.serial_register_bits` | no | `number` | — |
| `technical_definition.specification.sides` | no | `number` | — |
| `technical_definition.specification.signal_path` | no | `string` | — |
| `technical_definition.specification.simultaneous_shades_at_640_200_4bpp` | no | `number` | — |
| `technical_definition.specification.simultaneous_shades_at_800_600_2bpp` | no | `number` | — |
| `technical_definition.specification.simultaneous_shades_with_128kb_card` | no | `number` | — |
| `technical_definition.specification.size_inch` | no | `number` | — |
| `technical_definition.specification.slot` | no | `string` | — |
| `technical_definition.specification.software` | no | `string` | — |
| `technical_definition.specification.speed_qualification_targets` | no | `object` | — |
| `technical_definition.specification.speed_qualification_targets.basis` | no | `string` | — |
| `technical_definition.specification.speed_qualification_targets.conditions` | no | `string` | — |
| `technical_definition.specification.speed_qualification_targets.fallback_random_cycle_ns_range[]` | no | `array<number>` | — |
| `technical_definition.specification.speed_qualification_targets.fallback_row_access_ns` | no | `number` | — |
| `technical_definition.specification.speed_qualification_targets.preferred_random_cycle_ns` | no | `number` | — |
| `technical_definition.specification.speed_qualification_targets.preferred_row_access_ns` | no | `number` | — |
| `technical_definition.specification.speed_qualification_targets.stretch_row_access_ns` | no | `number` | — |
| `technical_definition.specification.sprite_memory` | no | `object` | — |
| `technical_definition.specification.sprite_memory.bank_data_width_bits` | no | `number` | — |
| `technical_definition.specification.sprite_memory.capacity_bytes` | no | `number` | — |
| `technical_definition.specification.sprite_memory.chip_count` | no | `number` | — |
| `technical_definition.specification.sprite_memory.chip_id` | no | `string` | pattern: "^(base_part)\\.[a-z0-9][a-z0-9_.-]*$" |
| `technical_definition.specification.sprite_memory.separate_bus` | no | `boolean` | — |
| `technical_definition.specification.sprite_memory.separate_from_system_and_display_ram` | no | `boolean` | — |
| `technical_definition.specification.sprite_physical_population` | no | `object` | — |
| `technical_definition.specification.sprite_physical_population.bank_data_width_bits` | no | `number` | — |
| `technical_definition.specification.sprite_physical_population.separate_bus` | no | `boolean` | — |
| `technical_definition.specification.sprite_physical_population.separate_from_system_and_display_ram` | no | `boolean` | — |
| `technical_definition.specification.sprite_policy` | no | `string` | — |
| `technical_definition.specification.sprite_profile_ref` | no | `object` | — |
| `technical_definition.specification.sprite_profile_ref.profile` | no | `string` | — |
| `technical_definition.specification.sprite_profile_ref.technology_id` | no | `string` | pattern: "^(technology)\\.[a-z0-9][a-z0-9_.-]*$" |
| `technical_definition.specification.sprites` | no | `schema-defined` | — |
| `technical_definition.specification.startup_rate_kbps` | no | `number` | — |
| `technical_definition.specification.supply_rails_v` | no | `array | null` | — |
| `technical_definition.specification.supported_fdd_count` | no | `number` | — |
| `technical_definition.specification.supported_rates_kbps[]` | no | `array<number>` | — |
| `technical_definition.specification.technology_id` | no | `string` | pattern: "^(technology)\\.[a-z0-9][a-z0-9_.-]*$" |
| `technical_definition.specification.text_modes[]` | no | `array<object>` | — |
| `technical_definition.specification.text_modes[].attribute_format` | no | `string` | — |
| `technical_definition.specification.text_modes[].attribute_map_bytes_per_buffer` | no | `number` | — |
| `technical_definition.specification.text_modes[].character_count` | no | `number` | — |
| `technical_definition.specification.text_modes[].character_map_bytes_per_buffer` | no | `number` | — |
| `technical_definition.specification.text_modes[].columns` | no | `number` | — |
| `technical_definition.specification.text_modes[].configurations[]` | no | `array<object>` | — |
| `technical_definition.specification.text_modes[].configurations[].allocated_bytes` | no | `number` | — |
| `technical_definition.specification.text_modes[].configurations[].palette_list_bytes` | no | `number` | — |
| `technical_definition.specification.text_modes[].configurations[].remaining_video_ram_bytes` | no | `number` | — |
| `technical_definition.specification.text_modes[].configurations[].sprite_count` | no | `number` | — |
| `technical_definition.specification.text_modes[].configurations[].text_buffer_count` | no | `number` | — |
| `technical_definition.specification.text_modes[].double_buffering` | no | `boolean` | — |
| `technical_definition.specification.text_modes[].font_bytes` | no | `number` | — |
| `technical_definition.specification.text_modes[].glyph_height` | no | `number` | — |
| `technical_definition.specification.text_modes[].glyph_width` | no | `number` | — |
| `technical_definition.specification.text_modes[].height` | no | `number` | — |
| `technical_definition.specification.text_modes[].id` | no | `string` | — |
| `technical_definition.specification.text_modes[].ram_bytes_per_page` | no | `number` | — |
| `technical_definition.specification.text_modes[].required_raster_ids[]` | no | `array<string>` | — |
| `technical_definition.specification.text_modes[].rows` | no | `number` | — |
| `technical_definition.specification.text_modes[].sprites_available` | no | `number` | — |
| `technical_definition.specification.text_modes[].width` | no | `number` | — |
| `technical_definition.specification.timing_budget` | no | `object` | — |
| `technical_definition.specification.timing_budget.page_drain_microseconds` | no | `number` | — |
| `technical_definition.specification.timing_budget.pixel_clock_mhz` | no | `number` | — |
| `technical_definition.specification.timing_budget.qualification` | no | `string` | — |
| `technical_definition.specification.timing_budget.renderer_pixels_per_step` | no | `number` | — |
| `technical_definition.specification.timing_budget.renderer_step_mhz` | no | `number` | — |
| `technical_definition.specification.timing_target` | no | `object` | — |
| `technical_definition.specification.timing_target.horizontal_khz` | no | `number` | — |
| `technical_definition.specification.timing_target.horizontal_total_pixels` | no | `number` | — |
| `technical_definition.specification.timing_target.pixel_clock_mhz` | no | `number` | — |
| `technical_definition.specification.timing_target.refresh_hz` | no | `number` | — |
| `technical_definition.specification.timing_target.vertical_total_lines` | no | `number` | — |
| `technical_definition.specification.tracking` | no | `string` | — |
| `technical_definition.specification.transport_id` | no | `string` | pattern: "^(technology)\\.[a-z0-9][a-z0-9_.-]*$" |
| `technical_definition.specification.usable_from[]` | no | `array<string>` | — |
| `technical_definition.specification.video_link_id` | no | `string` | pattern: "^(technology)\\.[a-z0-9][a-z0-9_.-]*$" |
| `technical_definition.specification.video_physical_population` | no | `object` | — |
| `technical_definition.specification.video_physical_population.bank_data_width_bits` | no | `number` | — |
| `technical_definition.specification.video_physical_population.separate_from_system_ram` | no | `boolean` | — |
| `technical_definition.specification.video_ram_bytes` | no | `number` | — |
| `technical_definition.specification.video_ram_chip_count` | no | `number` | — |
| `technical_definition.specification.video_ram_chip_id` | no | `string` | pattern: "^(base_part)\\.[a-z0-9][a-z0-9_.-]*$" |
| `technical_definition.specification.video_ram_kb` | no | `number` | — |
| `technical_definition.specification_id` | no | `string` | pattern: "^(technology)\\.[a-z0-9][a-z0-9_.-]*$" |
| `technical_definition.technical_profile` | no | `object` | — |
| `technical_definition.technical_profile.memory` | no | `object` | — |
| `technical_definition.technical_profile.memory.bank_data_width_bits` | no | `number` | — |
| `technical_definition.technical_profile.memory.capacity_policy` | no | `string` | — |
| `technical_definition.technical_profile.memory.expanded_organization` | no | `object` | — |
| `technical_definition.technical_profile.memory.expanded_organization.application_memory_profile` | no | `string` | — |
| `technical_definition.technical_profile.memory.expanded_organization.common_system_ram_kb` | no | `number` | — |
| `technical_definition.technical_profile.memory.expanded_organization.contiguous_lower_ram_kb` | no | `number` | — |
| `technical_definition.technical_profile.memory.expanded_organization.controller_id` | no | `string` | pattern: "^(base_part)\\.[a-z0-9][a-z0-9_.-]*$" |
| `technical_definition.technical_profile.memory.expanded_organization.dma_addressing` | no | `string` | — |
| `technical_definition.technical_profile.memory.expanded_organization.normal_view[]` | no | `array<object>` | — |
| `technical_definition.technical_profile.memory.expanded_organization.normal_view[].description` | no | `string` | — |
| `technical_definition.technical_profile.memory.expanded_organization.normal_view[].end` | no | `string` | — |
| `technical_definition.technical_profile.memory.expanded_organization.normal_view[].role` | no | `string` | — |
| `technical_definition.technical_profile.memory.expanded_organization.normal_view[].start` | no | `string` | — |
| `technical_definition.technical_profile.memory.expanded_organization.note` | no | `string` | — |
| `technical_definition.technical_profile.memory.expanded_organization.ram_kb` | no | `number` | — |
| `technical_definition.technical_profile.memory.expanded_organization.refresh` | no | `string` | — |
| `technical_definition.technical_profile.memory.expansion_ref` | no | `string` | pattern: "^(device)\\.[a-z0-9][a-z0-9_.-]*$" |
| `technical_definition.technical_profile.memory.organization` | no | `object` | — |
| `technical_definition.technical_profile.memory.organization.application_memory_profile` | no | `string` | — |
| `technical_definition.technical_profile.memory.organization.common_system_ram_kb` | no | `number` | — |
| `technical_definition.technical_profile.memory.organization.contiguous_lower_ram_kb` | no | `number` | — |
| `technical_definition.technical_profile.memory.organization.controller_id` | no | `string` | pattern: "^(base_part)\\.[a-z0-9][a-z0-9_.-]*$" |
| `technical_definition.technical_profile.memory.organization.dma_addressing` | no | `string` | — |
| `technical_definition.technical_profile.memory.organization.normal_view[]` | no | `array<object>` | — |
| `technical_definition.technical_profile.memory.organization.normal_view[].description` | no | `string` | — |
| `technical_definition.technical_profile.memory.organization.normal_view[].end` | no | `string` | — |
| `technical_definition.technical_profile.memory.organization.normal_view[].role` | no | `string` | — |
| `technical_definition.technical_profile.memory.organization.normal_view[].start` | no | `string` | — |
| `technical_definition.technical_profile.memory.organization.note` | no | `string` | — |
| `technical_definition.technical_profile.memory.organization.refresh` | no | `string` | — |
| `technical_definition.technical_profile.memory.organization_ref` | no | `string` | pattern: "^(technology)\\.[a-z0-9][a-z0-9_.-]*$" |
| `technical_definition.technical_profile.memory.os_rom` | no | `object` | — |
| `technical_definition.technical_profile.memory.os_rom.capacity_bytes` | no | `number` | — |
| `technical_definition.technical_profile.memory.os_rom.execution` | no | `string` | — |
| `technical_definition.technical_profile.memory.os_rom.implementation` | no | `string` | — |
| `technical_definition.technical_profile.memory.parity_bits` | no | `number` | — |
| `technical_definition.technical_profile.memory.physical_population` | no | `object` | — |
| `technical_definition.technical_profile.memory.physical_population.bank_count` | no | `number` | — |
| `technical_definition.technical_profile.memory.physical_population.bank_data_width_bits` | no | `number` | — |
| `technical_definition.technical_profile.memory.physical_population.common_ram_included` | no | `boolean` | — |
| `technical_definition.technical_profile.memory.physical_population.mapping_note` | no | `string` | — |
| `technical_definition.technical_profile.memory.physical_population.parity_bits` | no | `number` | — |
| `technical_definition.technical_profile.memory.physical_population.video_ram_separate` | no | `boolean` | — |
| `technical_definition.technical_profile.memory.population_policy` | no | `string` | — |
| `technical_definition.technical_profile.memory.reliability_policy` | no | `string` | — |
| `technical_definition.technical_profile.memory.sourcing_policy` | no | `string` | — |
| `technical_definition.technical_profile.memory.sprite_physical_population` | no | `object` | — |
| `technical_definition.technical_profile.memory.sprite_physical_population.bank_data_width_bits` | no | `number` | — |
| `technical_definition.technical_profile.memory.sprite_physical_population.separate_bus` | no | `boolean` | — |
| `technical_definition.technical_profile.memory.sprite_physical_population.separate_from_system_and_display_ram` | no | `boolean` | — |
| `technical_definition.technical_profile.memory.system_controller_ref` | no | `string` | pattern: "^(base_part)\\.[a-z0-9][a-z0-9_.-]*$" |
| `technical_definition.technical_profile.memory.upgrade_policy` | no | `string` | — |
| `technical_definition.technical_profile.memory.video_physical_population` | no | `object` | — |
| `technical_definition.technical_profile.memory.video_physical_population.bank_data_width_bits` | no | `number` | — |
| `technical_definition.technical_profile.memory.video_physical_population.separate_from_system_ram` | no | `boolean` | — |
| `technical_definition.technical_profile.network` | no | `object` | — |
| `technical_definition.technical_profile.network.computer_id` | no | `string` | pattern: "^(device)\\.[a-z0-9][a-z0-9_.-]*$" |
| `technical_definition.technical_profile.networking` | no | `object` | — |
| `technical_definition.technical_profile.networking.computer_id` | no | `string` | pattern: "^(device)\\.[a-z0-9][a-z0-9_.-]*$" |
| `technical_definition.technical_profile.networking.implementation` | no | `string` | — |
| `technical_definition.technical_profile.networking.qualified_max_rate_kbps` | no | `number` | — |
| `technical_definition.technical_profile.networking.rate_policy` | no | `string` | — |
| `technical_definition.technical_profile.networking.server_role` | no | `boolean` | — |
| `technical_definition.technical_profile.networking.supported_rates_kbps[]` | no | `array<number>` | — |
| `technical_definition.technical_profile.networking.technology_ids[]` | no | `array<string>` | pattern: "^(technology)\\.[a-z0-9][a-z0-9_.-]*$" |
| `technical_definition.technical_profile.rom_and_cartridges` | no | `object` | — |
| `technical_definition.technical_profile.rom_and_cartridges.mainboard_rom[]` | no | `array<string>` | — |
| `technical_definition.technical_profile.software_compatibility` | no | `object` | — |
| `technical_definition.technical_profile.software_compatibility.adaptive_text` | no | `string` | — |
| `technical_definition.technical_profile.software_compatibility.api_id` | no | `string` | pattern: "^(technology)\\.[a-z0-9][a-z0-9_.-]*$" |
| `technical_definition.technical_profile.software_compatibility.native_40_column_mode` | no | `string` | — |
| `technical_definition.technical_profile.software_compatibility.native_target` | no | `string` | — |
| `technical_definition.technical_profile.software_policy` | no | `string` | — |
| `technical_definition.technical_profile.video` | no | `object` | — |
| `technical_definition.technical_profile.video.controller_id` | no | `string` | pattern: "^(base_part)\\.[a-z0-9][a-z0-9_.-]*$" |
| `technical_definition.technical_profile.video.sprite_memory` | no | `object` | — |
| `technical_definition.technical_profile.video.sprite_memory.bank_data_width_bits` | no | `number` | — |
| `technical_definition.technical_profile.video.sprite_memory.separate_bus` | no | `boolean` | — |
| `technical_definition.technical_profile.video.sprite_memory.separate_from_system_and_display_ram` | no | `boolean` | — |
| `technical_definition.technical_profile.video.sprite_physical_population` | no | `object` | — |
| `technical_definition.technical_profile.video.sprite_physical_population.bank_data_width_bits` | no | `number` | — |
| `technical_definition.technical_profile.video.sprite_physical_population.separate_bus` | no | `boolean` | — |
| `technical_definition.technical_profile.video.sprite_physical_population.separate_from_system_and_display_ram` | no | `boolean` | — |
| `technical_definition.technical_profile.video.video_physical_population` | no | `object` | — |
| `technical_definition.technical_profile.video.video_physical_population.bank_data_width_bits` | no | `number` | — |
| `technical_definition.technical_profile.video.video_physical_population.separate_from_system_ram` | no | `boolean` | — |
| `specification[]` | yes | `array<object>` | — |
| `specification[].number` | yes | `integer` | minimum: 1 |
| `specification[].type` | yes | `string` | minLength: 1 |
| `specification[].description` | yes | `string` | — |
| `specification[].value` | no | `string | number | boolean | null` | — |
| `requirements[]` | yes | `array<object>` | — |
| `requirements[].number` | yes | `integer` | minimum: 1 |
| `requirements[].kind` | yes | `string` | enum: ["selection","interface","electrical","mechanical","software","assembly","testing","reliability"] |
| `requirements[].description` | yes | `string` | minLength: 1 |
| `requirements[].subject_ids[]` | no | `array<string>` | pattern: "^(actor\|actor_relationship\|agreement\|assumption\|campaign\|event\|location\|manufacturing_capability\|market_response\|process\|product\|technology\|base_part\|device\|software_edition\|external_product)\\.[a-z0-9][a-z0-9_.-]*$" |
| `technical_specification` | no | `object` | — |
| `technical_specification.chapters[]` | yes | `array<object>` | — |
| `technical_specification.chapters[].number` | yes | `integer` | minimum: 1 |
| `technical_specification.chapters[].chapter_name` | yes | `string` | minLength: 1 |
| `technical_specification.chapters[].description` | yes | `string` | minLength: 1 |
| `technical_specification.parameters[]` | yes | `array<object>` | — |
| `technical_specification.parameters[].key` | yes | `string` | pattern: "^[a-z][a-z0-9_]*$" |
| `technical_specification.parameters[].value` | no | `string | number | null` | — |
| `technical_specification.parameters[].ref_id` | no | `string` | pattern: "^[a-z_]+\\.[a-z0-9][a-z0-9_.-]*$" |
| `technical_specification.parameters[].ref_role` | no | `string` | minLength: 1 |
| `graphic_modes_specification[]` | no | `array<object>` | — |
| `graphic_modes_specification[].id` | yes | `string` | minLength: 1 |
| `graphic_modes_specification[].description` | yes | `string` | minLength: 1 |
| `graphic_modes_specification[].type` | yes | `string` | enum: ["text","bitmap"] |
| `graphic_modes_specification[].width` | yes | `integer | null` | minimum: 1 |
| `graphic_modes_specification[].height` | yes | `integer | null` | minimum: 1 |
| `graphic_modes_specification[].framebuffer_size` | yes | `integer | null` | minimum: 1 |
| `graphic_modes_specification[].double_buffering` | yes | `boolean | null` | — |
| `graphic_modes_specification[].sprites_available` | yes | `integer | null` | minimum: 0 |
| `graphic_modes_specification[].parameters[]` | yes | `array<object>` | — |
| `graphic_modes_specification[].parameters[].key` | yes | `string` | pattern: "^[a-z][a-z0-9_]*$" |
| `graphic_modes_specification[].parameters[].value` | no | `string | number | null` | — |
| `graphic_modes_specification[].parameters[].ref_id` | no | `string` | pattern: "^[a-z_]+\\.[a-z0-9][a-z0-9_.-]*$" |
| `graphic_modes_specification[].parameters[].ref_role` | no | `string` | minLength: 1 |

### campaign

Marketing activity with timing, participants, actions and intended or recorded effects.

File: [campaign.json](../../data_foundation/campaign.json) · Schema: [campaign.schema.json](../../schemas/campaign.schema.json)

```text
campaign[]
id*: string
title*: string
objective*: string
lead_actor_ids*: array<string> → actor
message?: array<string>
audience?: array<string>
period*: object
│  └─ start*: object
│  │  └─ value*: string | null
│  │  └─ precision*: string
│  └─ end*: object
│  │  └─ value*: string | null
│  │  └─ precision*: string
category?: string
marketing_steps*: array<object>
│  └─ id*: string
│  └─ number*: integer
│  └─ type*: string
│  └─ description*: string
│  └─ reference_id?: string → event / process
│  └─ marketing_presentation*: array<object>
│  │  └─ number*: integer
│  │  └─ description*: string
│  │  └─ parameters*: array<object>
│  │  │  └─ key*: string
│  │  │  └─ value?: string | number
│  │  │  └─ ref_id?: string → actor / product / external_product / technology / device / software_edition / agreement / manufacturing_capability / market_response / location / base_part
```

| Field path | Required in parent | Type | Constraints / allowed values |
| --- | --- | --- | --- |
| `id` | yes | `string` | pattern: "^campaign\\.[a-z0-9][a-z0-9_.-]*$" |
| `title` | yes | `string` | minLength: 1 |
| `objective` | yes | `string` | minLength: 1 |
| `lead_actor_ids[]` | yes | `array<string>` | pattern: "^(actor)\\.[a-z0-9][a-z0-9_.-]*$"; minItems: 1; uniqueItems: true |
| `message[]` | no | `array<string>` | minLength: 1; minItems: 0 |
| `audience[]` | no | `array<string>` | minLength: 1; minItems: 0 |
| `period` | yes | `object` | — |
| `period.start` | yes | `object` | — |
| `period.start.value` | yes | `string | null` | — |
| `period.start.precision` | yes | `string` | enum: ["year","month","day","unknown"] |
| `period.end` | yes | `object` | — |
| `period.end.value` | yes | `string | null` | — |
| `period.end.precision` | yes | `string` | enum: ["year","month","day","unknown"] |
| `category` | no | `string` | enum: ["","Adam's personal","Logix/AION investment","Product dev & launch","Ecosystem & Partners","Competition"] |
| `marketing_steps[]` | yes | `array<object>` | — |
| `marketing_steps[].id` | yes | `string` | pattern: "^[a-z][a-z0-9_-]*$" |
| `marketing_steps[].number` | yes | `integer` | minimum: 1 |
| `marketing_steps[].type` | yes | `string` | minLength: 1 |
| `marketing_steps[].description` | yes | `string` | minLength: 1 |
| `marketing_steps[].reference_id` | no | `string` | pattern: "^(event\|process)\\.[a-z0-9][a-z0-9_.-]*$" |
| `marketing_steps[].marketing_presentation[]` | yes | `array<object>` | — |
| `marketing_steps[].marketing_presentation[].number` | yes | `integer` | minimum: 1 |
| `marketing_steps[].marketing_presentation[].description` | yes | `string` | minLength: 1 |
| `marketing_steps[].marketing_presentation[].parameters[]` | yes | `array<object>` | — |
| `marketing_steps[].marketing_presentation[].parameters[].key` | yes | `string` | pattern: "^[a-z][a-z0-9_]*$" |
| `marketing_steps[].marketing_presentation[].parameters[].value` | no | `string | number` | minLength: 1 |
| `marketing_steps[].marketing_presentation[].parameters[].ref_id` | no | `string` | pattern: "^(actor\|product\|external_product\|technology\|device\|software_edition\|agreement\|manufacturing_capability\|market_response\|location\|base_part)\\.[a-z0-9][a-z0-9_.-]*$" |

### device

Canonical device and versioned physical composition.

File: [device.json](../../data_foundation/device.json) · Schema: [device.schema.json](../../schemas/device.schema.json)

```text
device[]
id*: string
name*: string
description*: string
provider_actor_ids*: array<string> → actor
technology_ids*: array<string> → technology
kind*: string
composition_history*: array<object>
│  └─ version_number*: integer
│  └─ description*: string
│  └─ effective_from*: schema-defined
│  └─ effective_until*: schema-defined
│  └─ technical_definition*: object
│  │  └─ athena_qualification?: string
│  │  └─ capacity_kb?: number
│  │  └─ compatibility_note?: string
│  │  └─ compatible_computers?: array<string> → device
│  │  └─ compatible_with?: array<string> → device
│  │  └─ configuration_requirements?: object
│  │  │  └─ external_application_cartridges_supported?: boolean
│  │  │  └─ rules?: array<string>
│  │  │  └─ scope?: string
│  │  └─ connection?: string
│  │  └─ firmware_contents?: array<string>
│  │  └─ form_factor?: string
│  │  └─ host_qualification?: object
│  │  │  └─ device.base_computer.artemis?: object
│  │  │  │  └─ computer_id?: string → device
│  │  │  │  └─ implementation?: string
│  │  │  │  └─ qualified_max_rate_kbps?: number
│  │  │  │  └─ rate_policy?: string
│  │  │  │  └─ supported_rates_kbps?: array<number>
│  │  │  │  └─ technology_ids?: array<string> → technology
│  │  │  └─ device.base_computer.artemis_pro?: object
│  │  │  │  └─ computer_id?: string → device
│  │  │  │  └─ implementation?: string
│  │  │  │  └─ qualified_max_rate_kbps?: number
│  │  │  │  └─ rate_policy?: string
│  │  │  │  └─ server_role?: boolean
│  │  │  │  └─ supported_rates_kbps?: array<number>
│  │  │  │  └─ technology_ids?: array<string> → technology
│  │  │  └─ device.base_computer.athena?: object
│  │  │  │  └─ computer_id?: string → device
│  │  │  └─ device.base_computer.athena_server?: object
│  │  │  │  └─ computer_id?: string → device
│  │  │  └─ device.base_computer.aurelia?: object
│  │  │  │  └─ computer_id?: string → device
│  │  │  │  └─ qualified_max_rate_kbps?: number
│  │  │  │  └─ rate_policy?: string
│  │  │  │  └─ supported_rates_kbps?: array<number>
│  │  │  │  └─ technology_ids?: array<string> → technology
│  │  │  └─ device.base_computer.aurelia_plus?: object
│  │  │  │  └─ computer_id?: string → device
│  │  │  │  └─ qualified_max_rate_kbps?: number
│  │  │  │  └─ rate_policy?: string
│  │  │  │  └─ supported_rates_kbps?: array<number>
│  │  │  │  └─ technology_ids?: array<string> → technology
│  │  └─ integration_requirements?: object
│  │  │  └─ sourcing_policy?: string
│  │  └─ io_and_expansion?: object
│  │  │  └─ application_rom_cards_supported?: boolean
│  │  │  └─ dedicated_video_slot?: object
│  │  │  │  └─ general_purpose_slots_consumed?: number
│  │  │  │  └─ hot_swap?: boolean
│  │  │  │  └─ interface?: string
│  │  │  │  └─ replaceable?: boolean
│  │  │  └─ eeprom_bios?: object
│  │  │  │  └─ capacity_kb?: null
│  │  │  │  └─ included?: boolean
│  │  │  │  └─ purpose?: string
│  │  │  └─ expansion_slots?: object
│  │  │  │  └─ future_pin_area_reserved_for_bits?: number
│  │  │  │  └─ plug_and_execute?: boolean
│  │  │  │  └─ width_bits?: number
│  │  │  └─ rom_eeprom_cartridge_slots?: object
│  │  │  │  └─ front?: string
│  │  │  │  └─ rear?: string
│  │  └─ manufacturing_planning?: object
│  │  │  └─ die_area_mm2?: number
│  │  │  └─ die_area_mm2_target?: number
│  │  │  └─ initial_manufacturer?: string
│  │  │  └─ node_um?: number
│  │  │  └─ policy?: string
│  │  │  └─ transistor_budget_target?: number
│  │  │  └─ wafer_diameter_mm?: number
│  │  └─ memory_constraints?: object
│  │  │  └─ max_ram_kib?: number | null
│  │  │  └─ mixed_module_types_allowed?: boolean
│  │  └─ memory_interface?: object
│  │  │  └─ expansion_id?: string → device
│  │  │  └─ organization_id?: string → technology
│  │  │  └─ system_controller_id?: string → base_part
│  │  └─ memory_mapping?: object
│  │  │  └─ application_memory?: string
│  │  │  └─ configuration?: string
│  │  │  └─ installation?: string
│  │  │  └─ normal_cpu_range?: string
│  │  │  └─ page_count?: number
│  │  │  └─ page_size_kb?: number
│  │  │  └─ service_calls?: string
│  │  │  └─ slot_count?: number
│  │  │  └─ system_workspace?: string
│  │  └─ packaging?: string
│  │  └─ physical_population?: object
│  │  │  └─ capacity_kb?: number
│  │  │  └─ chip_id?: string → base_part
│  │  │  └─ data_chip_count?: number
│  │  │  └─ data_width_bits?: number
│  │  │  └─ refresh_owner?: string
│  │  └─ planned_compatible_with?: array<string> → device
│  │  └─ processor?: object
│  │  │  └─ part_id?: string → base_part
│  │  └─ recommended_software_id?: string → software_edition
│  │  └─ role?: string
│  │  └─ slot_count?: number
│  │  └─ specification?: object
│  │  │  └─ acceleration?: array<string>
│  │  │  └─ adaptation?: string
│  │  │  └─ adapter_requirements?: object
│  │  │  │  └─ buffer_policy?: string
│  │  │  │  └─ flow_control?: string
│  │  │  │  └─ hardware_services?: array<string>
│  │  │  │  └─ host_service?: string
│  │  │  │  └─ local_packet_ram_target_bytes?: number
│  │  │  └─ additions?: array<string>
│  │  │  └─ analog_chain?: string
│  │  │  └─ api_id?: string → technology
│  │  │  └─ arbitration?: string
│  │  │  └─ array_columns?: number
│  │  │  └─ array_rows?: number
│  │  │  └─ bandwidth?: string
│  │  │  └─ bank_capacity_kb?: number
│  │  │  └─ bank_control?: string
│  │  │  └─ bank_data_width_bits?: number
│  │  │  └─ bank_organization?: string
│  │  │  └─ base_controller_id?: string → base_part
│  │  │  └─ base_product_id?: string → base_part
│  │  │  └─ beam_voltage_levels?: number
│  │  │  └─ bitmap_modes?: array<object>
│  │  │  │  └─ bits_per_pixel?: number
│  │  │  │  └─ bytes_per_framebuffer?: number
│  │  │  │  └─ compatibility_mode?: boolean
│  │  │  │  └─ configurations?: array<object>
│  │  │  │  │  └─ allocated_bytes?: number
│  │  │  │  │  └─ framebuffer_bytes?: number
│  │  │  │  │  └─ framebuffer_count?: number
│  │  │  │  │  └─ palette_list_bytes?: number
│  │  │  │  │  └─ remaining_video_ram_bytes?: number
│  │  │  │  │  └─ sprite_count?: number
│  │  │  │  └─ double_buffering?: boolean
│  │  │  │  └─ framebuffer_bytes?: number
│  │  │  │  └─ framebuffer_count?: number
│  │  │  │  └─ height?: number
│  │  │  │  └─ id?: string
│  │  │  │  └─ palette_list_bytes?: number
│  │  │  │  └─ remaining_bytes?: number
│  │  │  │  └─ required_raster_ids?: array<string>
│  │  │  │  └─ simultaneous_values?: number
│  │  │  │  └─ sprites_available?: number
│  │  │  │  └─ stride_bytes?: number
│  │  │  │  └─ width?: number
│  │  │  └─ boot?: string
│  │  │  └─ bridge_design_id?: string → technology
│  │  │  └─ buttons?: number
│  │  │  └─ capabilities?: object
│  │  │  │  └─ color_model?: string
│  │  │  │  └─ maximum_pixel_clock_mhz?: number
│  │  │  │  └─ palette_precision_bits?: number
│  │  │  │  └─ preferred_raster_id?: string
│  │  │  │  └─ programmable_palette?: boolean
│  │  │  │  └─ protocol_version?: number
│  │  │  │  └─ raster_ids?: array<string>
│  │  │  └─ capacity_bytes?: number
│  │  │  └─ capacity_kb?: number | null
│  │  │  └─ capacity_kbit?: number
│  │  │  └─ capacity_mb?: number
│  │  │  └─ card_id?: string → device
│  │  │  └─ character_row_cache?: object
│  │  │  │  └─ banks?: number
│  │  │  │  └─ bytes_per_bank?: number
│  │  │  │  └─ purpose?: string
│  │  │  │  └─ total_bytes?: number
│  │  │  └─ chip_organization?: string
│  │  │  └─ chip_type_id?: string → base_part
│  │  │  └─ chips?: number
│  │  │  └─ chips_per_rank?: number
│  │  │  └─ class_protocol_id?: string → technology
│  │  │  └─ clock_mhz?: number
│  │  │  └─ compatibility?: string
│  │  │  └─ connection?: string
│  │  │  └─ continuity?: string
│  │  │  └─ controller_die_count?: null
│  │  │  └─ controller_id?: string → base_part
│  │  │  └─ conversion?: string
│  │  │  └─ cpu_address_bits?: number
│  │  │  └─ cpu_id?: string → base_part
│  │  │  └─ crt_id?: string → base_part
│  │  │  └─ cursor_keys?: string
│  │  │  └─ data_width_bits?: number
│  │  │  └─ density?: string
│  │  │  └─ diagonal_inch?: number
│  │  │  └─ diagonal_inches?: number
│  │  │  └─ die_area_mm2?: number
│  │  │  └─ die_area_planning_mm2?: number
│  │  │  └─ digital_output_bits?: number
│  │  │  └─ disk_formats?: array<string>
│  │  │  └─ disk_ii_interface?: boolean
│  │  │  └─ disk_interface?: string
│  │  │  └─ display_controller_id?: string → base_part
│  │  │  └─ display_memory?: object
│  │  │  │  └─ bank_data_width_bits?: number
│  │  │  │  └─ capacity_bytes?: number
│  │  │  │  └─ chip_count?: number
│  │  │  │  └─ chip_id?: string → base_part
│  │  │  │  └─ organization?: string
│  │  │  └─ display_modes?: string
│  │  │  └─ display_subassembly_id?: string → base_part
│  │  │  └─ displayed_color_registers?: number
│  │  │  └─ displayed_registers?: number
│  │  │  └─ dma?: object
│  │  │  │  └─ active_transfer_engines?: number
│  │  │  │  └─ address_steps?: array<string>
│  │  │  │  └─ arbitration?: string
│  │  │  │  └─ bank_selection?: string
│  │  │  │  └─ completion?: string
│  │  │  │  └─ destination_address_bits?: number
│  │  │  │  └─ length_bits?: number
│  │  │  │  └─ operations?: array<string>
│  │  │  │  └─ peripheral_scope?: string
│  │  │  │  └─ transfer_contexts?: number
│  │  │  │  └─ video_endpoint?: string
│  │  │  └─ dot_pitch_mm?: number
│  │  │  └─ electrical_contract?: string
│  │  │  └─ electrical_interface?: string
│  │  │  └─ ergonomics?: string
│  │  │  └─ execution?: string
│  │  │  └─ expansion_role?: string
│  │  │  └─ fdd_density?: string
│  │  │  └─ fdd_size_inch?: number
│  │  │  └─ feature_continuity_id?: string → device
│  │  │  └─ flexibus_ports?: number
│  │  │  └─ format?: string
│  │  │  └─ formatted_capacity_kb?: null
│  │  │  └─ function_keys?: string
│  │  │  └─ grayscale_levels?: number
│  │  │  └─ hdd_bundled_with_standard_artemis?: boolean
│  │  │  └─ hdd_interface_supported?: boolean
│  │  │  └─ historical_raster?: string
│  │  │  └─ host?: string
│  │  │  └─ host_access?: string
│  │  │  └─ host_clock_mhz?: array<number>
│  │  │  └─ host_integration?: string
│  │  │  └─ host_interface?: schema-defined
│  │  │  └─ implementation?: string
│  │  │  └─ implementation_design?: object
│  │  │  │  └─ arbitration?: string
│  │  │  │  └─ clock_targets?: object
│  │  │  │  │  └─ high_resolution_pixel_mhz?: number
│  │  │  │  │  └─ low_resolution_pixel_mhz?: number
│  │  │  │  │  └─ master_mhz?: number
│  │  │  │  │  └─ maximum_pixel_fifo_output_mbytes_per_second?: number
│  │  │  │  │  └─ scope?: string
│  │  │  │  └─ engines?: object
│  │  │  │  │  └─ fifo?: string
│  │  │  │  │  └─ renderer?: string
│  │  │  │  │  └─ scanout?: string
│  │  │  │  │  └─ underrun?: string
│  │  │  │  └─ internal_buffers?: object
│  │  │  │  │  └─ character_attribute_row_cache_bytes?: number
│  │  │  │  │  └─ included_in_die_estimates?: boolean
│  │  │  │  │  └─ next_character_attribute_row_cache_bytes?: number
│  │  │  │  │  └─ pixel_bits?: number
│  │  │  │  │  └─ pixel_fifo_bytes?: number
│  │  │  │  │  └─ pixel_fifo_page_bytes?: number
│  │  │  │  │  └─ pixel_fifo_page_count?: number
│  │  │  │  │  └─ sprite_row_shifters_bytes?: number
│  │  │  │  │  └─ sprite_staging_bytes?: number
│  │  │  │  │  └─ total_storage_bytes?: number
│  │  │  │  └─ line_repeat?: string
│  │  │  │  └─ manufacturing_planning?: object
│  │  │  │  │  └─ die_area_mm2_at_3_5um_range?: array<number>
│  │  │  │  │  └─ die_area_mm2_at_3um_range?: array<number>
│  │  │  │  │  └─ die_area_mm2_central_at_3_5um?: number
│  │  │  │  │  └─ die_area_mm2_central_at_3um?: number
│  │  │  │  │  └─ external_functions?: array<string>
│  │  │  │  │  └─ process?: string
│  │  │  │  │  └─ transistors_central?: number
│  │  │  │  │  └─ transistors_range?: array<number>
│  │  │  │  └─ sprite_access?: string
│  │  │  │  └─ text_fetch?: string
│  │  │  │  └─ timing_budget?: object
│  │  │  │  │  └─ dram_random_cycle_target_ns?: number
│  │  │  │  │  └─ fifo_total_drain_time_us_at_high_resolution?: number
│  │  │  │  │  └─ fifo_total_pixels?: number
│  │  │  │  │  └─ illustrative_read_time_us?: number
│  │  │  │  │  └─ illustrative_total_reads_per_scanline?: number
│  │  │  │  │  └─ maximum_sprite_row_bytes_per_scanline?: number
│  │  │  │  │  └─ next_row_prefetch_average_bytes_per_scanline?: number
│  │  │  │  │  └─ qualification?: string
│  │  │  │  │  └─ sprite_pattern_fetch_time_us?: number
│  │  │  │  │  └─ sprite_sram_cycle_target_ns?: number
│  │  │  │  │  └─ text_glyph_reads_per_scanline?: number
│  │  │  │  │  └─ two_ready_pages_drain_time_us?: number
│  │  │  └─ included_monitor?: boolean
│  │  │  └─ input?: string
│  │  │  └─ input_bits?: number
│  │  │  └─ installation?: string
│  │  │  └─ intensity_levels?: number
│  │  │  └─ interface?: string
│  │  │  └─ interface_id?: string → technology
│  │  │  └─ key_count?: number
│  │  │  └─ keyboard_standard_id?: string → technology
│  │  │  └─ legacy_card_id?: string → device
│  │  │  └─ link_layer_id?: string → technology
│  │  │  └─ local_packet_ram_target_bytes?: number
│  │  │  └─ local_ram_kb?: number
│  │  │  └─ manufacturer?: string
│  │  │  └─ manufacturing_planning?: object
│  │  │  │  └─ die_area_mm2?: number
│  │  │  │  └─ die_area_mm2_central?: number
│  │  │  │  └─ die_area_mm2_range?: array<number>
│  │  │  │  └─ package_allowance_usd?: number
│  │  │  │  └─ recipe_variants?: array<object>
│  │  │  │  │  └─ defect_density_cm2?: number
│  │  │  │  │  └─ die_area_mm2?: number
│  │  │  │  │  └─ id?: string
│  │  │  │  │  └─ manufacturing_capability_id?: string → manufacturing_capability
│  │  │  │  │  └─ node_um?: string
│  │  │  │  │  └─ processed_wafer_usd?: number
│  │  │  │  └─ revision_policy?: string
│  │  │  │  └─ wafer_mm?: number
│  │  │  └─ manufacturing_recipe?: string
│  │  │  └─ maximum_shared_raw_rate_kbps?: number
│  │  │  └─ mechanism_id?: string → base_part
│  │  │  └─ media?: string
│  │  │  └─ media_access_control?: string
│  │  │  └─ memory_addressing_bytes?: number
│  │  │  └─ memory_layout?: object
│  │  │  │  └─ font_policy?: string
│  │  │  │  └─ mode_exclusivity?: string
│  │  │  │  └─ page_flip?: string
│  │  │  │  └─ policy_id?: string → technology
│  │  │  └─ mode_discovery?: string
│  │  │  └─ mode_limit?: string
│  │  │  └─ mode_policy?: string
│  │  │  └─ model?: string
│  │  │  └─ modules_per_bank?: number
│  │  │  └─ monitor_id?: string → device
│  │  │  └─ monitor_modes?: string
│  │  │  └─ monitor_policy?: string
│  │  │  └─ native_raster?: object
│  │  │  │  └─ height?: number
│  │  │  │  └─ horizontal_khz?: number
│  │  │  │  └─ pixel_clock_mhz?: number
│  │  │  │  └─ progressive?: boolean
│  │  │  │  └─ refresh_hz_target?: number
│  │  │  │  └─ total_lines?: number
│  │  │  │  └─ total_pixels?: number
│  │  │  │  └─ width?: number
│  │  │  └─ navigation_section?: array<string>
│  │  │  └─ negotiation_id?: string → technology
│  │  │  └─ node_um?: number
│  │  │  └─ numeric_keypad?: boolean
│  │  │  └─ oem?: string
│  │  │  └─ oem_basis?: string
│  │  │  └─ organization?: string
│  │  │  └─ organization_words?: number
│  │  │  └─ output?: string
│  │  │  └─ package?: string | null
│  │  │  └─ page_size_kb?: number
│  │  │  └─ palette?: string
│  │  │  └─ palette_entries?: number
│  │  │  └─ palette_entry_bits?: number
│  │  │  └─ palette_grayscale_levels?: number
│  │  │  └─ palette_list?: object
│  │  │  │  └─ base_address?: string
│  │  │  │  └─ cad_policy?: string
│  │  │  │  └─ command_bytes?: number
│  │  │  │  └─ encoding?: string
│  │  │  │  └─ end_address?: string
│  │  │  │  └─ execution?: string
│  │  │  │  └─ frame_state?: string
│  │  │  │  └─ long_gaps?: string
│  │  │  │  └─ maximum_commands?: number
│  │  │  │  └─ register_count?: number
│  │  │  │  └─ reserved_bytes?: number
│  │  │  │  └─ write_limit?: string
│  │  │  └─ palette_list_id?: string → technology
│  │  │  └─ palette_registers?: number
│  │  │  └─ parity_bits?: number
│  │  │  └─ physical_arrangement?: string
│  │  │  └─ physical_population?: object
│  │  │  │  └─ bank_count?: number
│  │  │  │  └─ bank_data_width_bits?: number
│  │  │  │  └─ common_ram_included?: boolean
│  │  │  │  └─ mapping_note?: string
│  │  │  │  └─ parity_bits?: number
│  │  │  │  └─ video_ram_separate?: boolean
│  │  │  └─ pixel_buffer?: object
│  │  │  │  └─ bits_per_pixel?: number
│  │  │  │  └─ bytes_per_page?: number
│  │  │  │  └─ location?: string
│  │  │  │  └─ page_states?: array<string>
│  │  │  │  └─ pages?: number
│  │  │  │  └─ physical_organization?: string
│  │  │  │  └─ pixels_per_page?: number
│  │  │  │  └─ policy?: string
│  │  │  │  └─ total_bytes?: number
│  │  │  └─ pixel_clock_mhz?: number
│  │  │  └─ platform_rate_profiles?: array<object>
│  │  │  │  └─ computer_id?: string → device
│  │  │  │  └─ implementation?: string
│  │  │  │  └─ qualified_max_rate_kbps?: number
│  │  │  │  └─ rate_policy?: string
│  │  │  │  └─ server_role?: boolean
│  │  │  │  └─ supported_rates_kbps?: array<number>
│  │  │  │  └─ technology_ids?: array<string> → technology
│  │  │  └─ port_count?: number
│  │  │  └─ ports?: array<string>
│  │  │  └─ power?: string
│  │  │  └─ purchase_boundary?: string
│  │  │  └─ qualification?: string
│  │  │  └─ random_cycle_target_ns?: number
│  │  │  └─ rank_capacity_kb?: number
│  │  │  └─ ranks?: number
│  │  │  └─ rate_scope?: string
│  │  │  └─ redraw?: string
│  │  │  └─ refresh?: schema-defined
│  │  │  └─ refresh_required?: boolean
│  │  │  └─ register_width_bits?: number
│  │  │  └─ reused_elements?: array<string>
│  │  │  └─ rgb_palette_mapping?: string
│  │  │  └─ role?: string
│  │  │  └─ rollers?: array<object>
│  │  │  │  └─ default_action?: string
│  │  │  │  └─ position?: string
│  │  │  └─ scan?: string
│  │  │  └─ separate_sprite_sram_bytes?: number
│  │  │  └─ serial_register_bits?: number
│  │  │  └─ sides?: number
│  │  │  └─ signal_path?: string
│  │  │  └─ simultaneous_shades_at_640_200_4bpp?: number
│  │  │  └─ simultaneous_shades_at_800_600_2bpp?: number
│  │  │  └─ simultaneous_shades_with_128kb_card?: number
│  │  │  └─ size_inch?: number
│  │  │  └─ slot?: string
│  │  │  └─ software?: string
│  │  │  └─ speed_qualification_targets?: object
│  │  │  │  └─ basis?: string
│  │  │  │  └─ conditions?: string
│  │  │  │  └─ fallback_random_cycle_ns_range?: array<number>
│  │  │  │  └─ fallback_row_access_ns?: number
│  │  │  │  └─ preferred_random_cycle_ns?: number
│  │  │  │  └─ preferred_row_access_ns?: number
│  │  │  │  └─ stretch_row_access_ns?: number
│  │  │  └─ sprite_memory?: object
│  │  │  │  └─ bank_data_width_bits?: number
│  │  │  │  └─ capacity_bytes?: number
│  │  │  │  └─ chip_count?: number
│  │  │  │  └─ chip_id?: string → base_part
│  │  │  │  └─ separate_bus?: boolean
│  │  │  │  └─ separate_from_system_and_display_ram?: boolean
│  │  │  └─ sprite_physical_population?: object
│  │  │  │  └─ bank_data_width_bits?: number
│  │  │  │  └─ separate_bus?: boolean
│  │  │  │  └─ separate_from_system_and_display_ram?: boolean
│  │  │  └─ sprite_policy?: string
│  │  │  └─ sprite_profile_ref?: object
│  │  │  │  └─ profile?: string
│  │  │  │  └─ technology_id?: string → technology
│  │  │  └─ sprites?: schema-defined
│  │  │  └─ startup_rate_kbps?: number
│  │  │  └─ supply_rails_v?: array | null
│  │  │  └─ supported_fdd_count?: number
│  │  │  └─ supported_rates_kbps?: array<number>
│  │  │  └─ technology_id?: string → technology
│  │  │  └─ text_modes?: array<object>
│  │  │  │  └─ attribute_format?: string
│  │  │  │  └─ attribute_map_bytes_per_buffer?: number
│  │  │  │  └─ character_count?: number
│  │  │  │  └─ character_map_bytes_per_buffer?: number
│  │  │  │  └─ columns?: number
│  │  │  │  └─ configurations?: array<object>
│  │  │  │  │  └─ allocated_bytes?: number
│  │  │  │  │  └─ palette_list_bytes?: number
│  │  │  │  │  └─ remaining_video_ram_bytes?: number
│  │  │  │  │  └─ sprite_count?: number
│  │  │  │  │  └─ text_buffer_count?: number
│  │  │  │  └─ double_buffering?: boolean
│  │  │  │  └─ font_bytes?: number
│  │  │  │  └─ glyph_height?: number
│  │  │  │  └─ glyph_width?: number
│  │  │  │  └─ height?: number
│  │  │  │  └─ id?: string
│  │  │  │  └─ ram_bytes_per_page?: number
│  │  │  │  └─ required_raster_ids?: array<string>
│  │  │  │  └─ rows?: number
│  │  │  │  └─ sprites_available?: number
│  │  │  │  └─ width?: number
│  │  │  └─ timing_budget?: object
│  │  │  │  └─ page_drain_microseconds?: number
│  │  │  │  └─ pixel_clock_mhz?: number
│  │  │  │  └─ qualification?: string
│  │  │  │  └─ renderer_pixels_per_step?: number
│  │  │  │  └─ renderer_step_mhz?: number
│  │  │  └─ timing_target?: object
│  │  │  │  └─ horizontal_khz?: number
│  │  │  │  └─ horizontal_total_pixels?: number
│  │  │  │  └─ pixel_clock_mhz?: number
│  │  │  │  └─ refresh_hz?: number
│  │  │  │  └─ vertical_total_lines?: number
│  │  │  └─ tracking?: string
│  │  │  └─ transport_id?: string → technology
│  │  │  └─ usable_from?: array<string>
│  │  │  └─ video_link_id?: string → technology
│  │  │  └─ video_physical_population?: object
│  │  │  │  └─ bank_data_width_bits?: number
│  │  │  │  └─ separate_from_system_ram?: boolean
│  │  │  └─ video_ram_bytes?: number
│  │  │  └─ video_ram_chip_count?: number
│  │  │  └─ video_ram_chip_id?: string → base_part
│  │  │  └─ video_ram_kb?: number
│  │  └─ specification_id?: string → technology
│  │  └─ technical_profile?: object
│  │  │  └─ memory?: object
│  │  │  │  └─ bank_data_width_bits?: number
│  │  │  │  └─ capacity_policy?: string
│  │  │  │  └─ expanded_organization?: object
│  │  │  │  │  └─ application_memory_profile?: string
│  │  │  │  │  └─ common_system_ram_kb?: number
│  │  │  │  │  └─ contiguous_lower_ram_kb?: number
│  │  │  │  │  └─ controller_id?: string → base_part
│  │  │  │  │  └─ dma_addressing?: string
│  │  │  │  │  └─ normal_view?: array<object>
│  │  │  │  │  │  └─ description?: string
│  │  │  │  │  │  └─ end?: string
│  │  │  │  │  │  └─ role?: string
│  │  │  │  │  │  └─ start?: string
│  │  │  │  │  └─ note?: string
│  │  │  │  │  └─ ram_kb?: number
│  │  │  │  │  └─ refresh?: string
│  │  │  │  └─ expansion_ref?: string → device
│  │  │  │  └─ organization?: object
│  │  │  │  │  └─ application_memory_profile?: string
│  │  │  │  │  └─ common_system_ram_kb?: number
│  │  │  │  │  └─ contiguous_lower_ram_kb?: number
│  │  │  │  │  └─ controller_id?: string → base_part
│  │  │  │  │  └─ dma_addressing?: string
│  │  │  │  │  └─ normal_view?: array<object>
│  │  │  │  │  │  └─ description?: string
│  │  │  │  │  │  └─ end?: string
│  │  │  │  │  │  └─ role?: string
│  │  │  │  │  │  └─ start?: string
│  │  │  │  │  └─ note?: string
│  │  │  │  │  └─ refresh?: string
│  │  │  │  └─ organization_ref?: string → technology
│  │  │  │  └─ os_rom?: object
│  │  │  │  │  └─ capacity_bytes?: number
│  │  │  │  │  └─ execution?: string
│  │  │  │  │  └─ implementation?: string
│  │  │  │  └─ parity_bits?: number
│  │  │  │  └─ physical_population?: object
│  │  │  │  │  └─ bank_count?: number
│  │  │  │  │  └─ bank_data_width_bits?: number
│  │  │  │  │  └─ common_ram_included?: boolean
│  │  │  │  │  └─ mapping_note?: string
│  │  │  │  │  └─ parity_bits?: number
│  │  │  │  │  └─ video_ram_separate?: boolean
│  │  │  │  └─ population_policy?: string
│  │  │  │  └─ reliability_policy?: string
│  │  │  │  └─ sourcing_policy?: string
│  │  │  │  └─ sprite_physical_population?: object
│  │  │  │  │  └─ bank_data_width_bits?: number
│  │  │  │  │  └─ separate_bus?: boolean
│  │  │  │  │  └─ separate_from_system_and_display_ram?: boolean
│  │  │  │  └─ system_controller_ref?: string → base_part
│  │  │  │  └─ upgrade_policy?: string
│  │  │  │  └─ video_physical_population?: object
│  │  │  │  │  └─ bank_data_width_bits?: number
│  │  │  │  │  └─ separate_from_system_ram?: boolean
│  │  │  └─ network?: object
│  │  │  │  └─ computer_id?: string → device
│  │  │  └─ networking?: object
│  │  │  │  └─ computer_id?: string → device
│  │  │  │  └─ implementation?: string
│  │  │  │  └─ qualified_max_rate_kbps?: number
│  │  │  │  └─ rate_policy?: string
│  │  │  │  └─ server_role?: boolean
│  │  │  │  └─ supported_rates_kbps?: array<number>
│  │  │  │  └─ technology_ids?: array<string> → technology
│  │  │  └─ rom_and_cartridges?: object
│  │  │  │  └─ mainboard_rom?: array<string>
│  │  │  └─ software_compatibility?: object
│  │  │  │  └─ adaptive_text?: string
│  │  │  │  └─ api_id?: string → technology
│  │  │  │  └─ native_40_column_mode?: string
│  │  │  │  └─ native_target?: string
│  │  │  └─ software_policy?: string
│  │  │  └─ video?: object
│  │  │  │  └─ controller_id?: string → base_part
│  │  │  │  └─ sprite_memory?: object
│  │  │  │  │  └─ bank_data_width_bits?: number
│  │  │  │  │  └─ separate_bus?: boolean
│  │  │  │  │  └─ separate_from_system_and_display_ram?: boolean
│  │  │  │  └─ sprite_physical_population?: object
│  │  │  │  │  └─ bank_data_width_bits?: number
│  │  │  │  │  └─ separate_bus?: boolean
│  │  │  │  │  └─ separate_from_system_and_display_ram?: boolean
│  │  │  │  └─ video_physical_population?: object
│  │  │  │  │  └─ bank_data_width_bits?: number
│  │  │  │  │  └─ separate_from_system_ram?: boolean
│  └─ composition_definition*: array<object>
│  │  └─ id*: string
│  │  └─ target*: schema-defined
│  │  └─ quantity*: number | null
│  │  └─ connection?: schema-defined
│  │  └─ placements?: array<object>
│  │  │  └─ host_line_id*: string
│  │  │  └─ host_instance*: integer
│  │  │  └─ socket_id*: string
│  │  │  └─ quantity*: number
│  │  └─ element_type?: string
│  └─ assembly_requirements*: array<object>
│  │  └─ number*: integer
│  │  └─ kind*: string
│  │  └─ description*: string
│  │  └─ subject_ids?: array<string> → any foundation ID
│  └─ expansion_socket_groups?: array<object>
│  │  └─ id?: string
│  │  └─ name?: string
│  │  └─ sockets?: array<object>
│  │  │  └─ capacity?: number | null
│  │  │  └─ compatible_device_ids?: array<string> → device
│  │  │  └─ connection?: string
│  │  │  └─ device_quantity_limits?: object
│  │  │  │  └─ device.aurelia_ram_16kb_card?: number
│  │  │  └─ id?: string
│  │  │  └─ installation_multiple?: number
│  │  │  └─ matched_modules?: boolean
│  │  │  └─ name?: string
│  │  │  └─ population_order?: string
│  │  │  └─ requirements?: array<string>
requirements*: array<object>
│  └─ number*: integer
│  └─ kind*: string
│  └─ description*: string
│  └─ subject_ids?: array<string> → any foundation ID
technical_specification?: object
│  └─ chapters*: array<object>
│  │  └─ number*: integer
│  │  └─ chapter_name*: string
│  │  └─ description*: string
│  └─ parameters*: array<object>
│  │  └─ key*: string
│  │  └─ value?: string | number | null
│  │  └─ ref_id?: string → actor / technology / base_part / device / software_edition / product / external_product / manufacturing_capability
│  │  └─ ref_role?: string
graphic_modes_specification?: array<object>
│  └─ id*: string
│  └─ description*: string
│  └─ type*: string
│  └─ width*: integer | null
│  └─ height*: integer | null
│  └─ framebuffer_size*: integer | null
│  └─ double_buffering*: boolean | null
│  └─ sprites_available*: integer | null
│  └─ parameters*: array<object>
│  │  └─ key*: string
│  │  └─ value?: string | number | null
│  │  └─ ref_id?: string → actor / technology / base_part / device / software_edition / product / external_product / manufacturing_capability
│  │  └─ ref_role?: string
```

| Field path | Required in parent | Type | Constraints / allowed values |
| --- | --- | --- | --- |
| `id` | yes | `string` | pattern: "^(device)\\.[a-z0-9][a-z0-9_.-]*$" |
| `name` | yes | `string` | minLength: 1 |
| `description` | yes | `string` | minLength: 1 |
| `provider_actor_ids[]` | yes | `array<string>` | pattern: "^(actor)\\.[a-z0-9][a-z0-9_.-]*$" |
| `technology_ids[]` | yes | `array<string>` | pattern: "^(technology)\\.[a-z0-9][a-z0-9_.-]*$" |
| `kind` | yes | `string` | enum: ["base_computer","memory_module","expansion_card","monitor","keyboard","printer","mouse","storage_device","network_device","rom_cartridge","firmware_bank","internal_subsystem"] |
| `composition_history[]` | yes | `array<object>` | — |
| `composition_history[].version_number` | yes | `integer` | minimum: 1 |
| `composition_history[].description` | yes | `string` | minLength: 1 |
| `composition_history[].effective_from` | yes | `schema-defined` | — |
| `composition_history[].effective_until` | yes | `schema-defined` | — |
| `composition_history[].technical_definition` | yes | `object` | — |
| `composition_history[].technical_definition.athena_qualification` | no | `string` | — |
| `composition_history[].technical_definition.capacity_kb` | no | `number` | — |
| `composition_history[].technical_definition.compatibility_note` | no | `string` | — |
| `composition_history[].technical_definition.compatible_computers[]` | no | `array<string>` | pattern: "^(device)\\.[a-z0-9][a-z0-9_.-]*$" |
| `composition_history[].technical_definition.compatible_with[]` | no | `array<string>` | pattern: "^(device)\\.[a-z0-9][a-z0-9_.-]*$" |
| `composition_history[].technical_definition.configuration_requirements` | no | `object` | — |
| `composition_history[].technical_definition.configuration_requirements.external_application_cartridges_supported` | no | `boolean` | — |
| `composition_history[].technical_definition.configuration_requirements.rules[]` | no | `array<string>` | — |
| `composition_history[].technical_definition.configuration_requirements.scope` | no | `string` | — |
| `composition_history[].technical_definition.connection` | no | `string` | — |
| `composition_history[].technical_definition.firmware_contents[]` | no | `array<string>` | — |
| `composition_history[].technical_definition.form_factor` | no | `string` | — |
| `composition_history[].technical_definition.host_qualification` | no | `object` | — |
| `composition_history[].technical_definition.host_qualification.device.base_computer.artemis` | no | `object` | — |
| `composition_history[].technical_definition.host_qualification.device.base_computer.artemis.computer_id` | no | `string` | pattern: "^(device)\\.[a-z0-9][a-z0-9_.-]*$" |
| `composition_history[].technical_definition.host_qualification.device.base_computer.artemis.implementation` | no | `string` | — |
| `composition_history[].technical_definition.host_qualification.device.base_computer.artemis.qualified_max_rate_kbps` | no | `number` | — |
| `composition_history[].technical_definition.host_qualification.device.base_computer.artemis.rate_policy` | no | `string` | — |
| `composition_history[].technical_definition.host_qualification.device.base_computer.artemis.supported_rates_kbps[]` | no | `array<number>` | — |
| `composition_history[].technical_definition.host_qualification.device.base_computer.artemis.technology_ids[]` | no | `array<string>` | pattern: "^(technology)\\.[a-z0-9][a-z0-9_.-]*$" |
| `composition_history[].technical_definition.host_qualification.device.base_computer.artemis_pro` | no | `object` | — |
| `composition_history[].technical_definition.host_qualification.device.base_computer.artemis_pro.computer_id` | no | `string` | pattern: "^(device)\\.[a-z0-9][a-z0-9_.-]*$" |
| `composition_history[].technical_definition.host_qualification.device.base_computer.artemis_pro.implementation` | no | `string` | — |
| `composition_history[].technical_definition.host_qualification.device.base_computer.artemis_pro.qualified_max_rate_kbps` | no | `number` | — |
| `composition_history[].technical_definition.host_qualification.device.base_computer.artemis_pro.rate_policy` | no | `string` | — |
| `composition_history[].technical_definition.host_qualification.device.base_computer.artemis_pro.server_role` | no | `boolean` | — |
| `composition_history[].technical_definition.host_qualification.device.base_computer.artemis_pro.supported_rates_kbps[]` | no | `array<number>` | — |
| `composition_history[].technical_definition.host_qualification.device.base_computer.artemis_pro.technology_ids[]` | no | `array<string>` | pattern: "^(technology)\\.[a-z0-9][a-z0-9_.-]*$" |
| `composition_history[].technical_definition.host_qualification.device.base_computer.athena` | no | `object` | — |
| `composition_history[].technical_definition.host_qualification.device.base_computer.athena.computer_id` | no | `string` | pattern: "^(device)\\.[a-z0-9][a-z0-9_.-]*$" |
| `composition_history[].technical_definition.host_qualification.device.base_computer.athena_server` | no | `object` | — |
| `composition_history[].technical_definition.host_qualification.device.base_computer.athena_server.computer_id` | no | `string` | pattern: "^(device)\\.[a-z0-9][a-z0-9_.-]*$" |
| `composition_history[].technical_definition.host_qualification.device.base_computer.aurelia` | no | `object` | — |
| `composition_history[].technical_definition.host_qualification.device.base_computer.aurelia.computer_id` | no | `string` | pattern: "^(device)\\.[a-z0-9][a-z0-9_.-]*$" |
| `composition_history[].technical_definition.host_qualification.device.base_computer.aurelia.qualified_max_rate_kbps` | no | `number` | — |
| `composition_history[].technical_definition.host_qualification.device.base_computer.aurelia.rate_policy` | no | `string` | — |
| `composition_history[].technical_definition.host_qualification.device.base_computer.aurelia.supported_rates_kbps[]` | no | `array<number>` | — |
| `composition_history[].technical_definition.host_qualification.device.base_computer.aurelia.technology_ids[]` | no | `array<string>` | pattern: "^(technology)\\.[a-z0-9][a-z0-9_.-]*$" |
| `composition_history[].technical_definition.host_qualification.device.base_computer.aurelia_plus` | no | `object` | — |
| `composition_history[].technical_definition.host_qualification.device.base_computer.aurelia_plus.computer_id` | no | `string` | pattern: "^(device)\\.[a-z0-9][a-z0-9_.-]*$" |
| `composition_history[].technical_definition.host_qualification.device.base_computer.aurelia_plus.qualified_max_rate_kbps` | no | `number` | — |
| `composition_history[].technical_definition.host_qualification.device.base_computer.aurelia_plus.rate_policy` | no | `string` | — |
| `composition_history[].technical_definition.host_qualification.device.base_computer.aurelia_plus.supported_rates_kbps[]` | no | `array<number>` | — |
| `composition_history[].technical_definition.host_qualification.device.base_computer.aurelia_plus.technology_ids[]` | no | `array<string>` | pattern: "^(technology)\\.[a-z0-9][a-z0-9_.-]*$" |
| `composition_history[].technical_definition.integration_requirements` | no | `object` | — |
| `composition_history[].technical_definition.integration_requirements.sourcing_policy` | no | `string` | — |
| `composition_history[].technical_definition.io_and_expansion` | no | `object` | — |
| `composition_history[].technical_definition.io_and_expansion.application_rom_cards_supported` | no | `boolean` | — |
| `composition_history[].technical_definition.io_and_expansion.dedicated_video_slot` | no | `object` | — |
| `composition_history[].technical_definition.io_and_expansion.dedicated_video_slot.general_purpose_slots_consumed` | no | `number` | — |
| `composition_history[].technical_definition.io_and_expansion.dedicated_video_slot.hot_swap` | no | `boolean` | — |
| `composition_history[].technical_definition.io_and_expansion.dedicated_video_slot.interface` | no | `string` | — |
| `composition_history[].technical_definition.io_and_expansion.dedicated_video_slot.replaceable` | no | `boolean` | — |
| `composition_history[].technical_definition.io_and_expansion.eeprom_bios` | no | `object` | — |
| `composition_history[].technical_definition.io_and_expansion.eeprom_bios.capacity_kb` | no | `null` | — |
| `composition_history[].technical_definition.io_and_expansion.eeprom_bios.included` | no | `boolean` | — |
| `composition_history[].technical_definition.io_and_expansion.eeprom_bios.purpose` | no | `string` | — |
| `composition_history[].technical_definition.io_and_expansion.expansion_slots` | no | `object` | — |
| `composition_history[].technical_definition.io_and_expansion.expansion_slots.future_pin_area_reserved_for_bits` | no | `number` | — |
| `composition_history[].technical_definition.io_and_expansion.expansion_slots.plug_and_execute` | no | `boolean` | — |
| `composition_history[].technical_definition.io_and_expansion.expansion_slots.width_bits` | no | `number` | — |
| `composition_history[].technical_definition.io_and_expansion.rom_eeprom_cartridge_slots` | no | `object` | — |
| `composition_history[].technical_definition.io_and_expansion.rom_eeprom_cartridge_slots.front` | no | `string` | — |
| `composition_history[].technical_definition.io_and_expansion.rom_eeprom_cartridge_slots.rear` | no | `string` | — |
| `composition_history[].technical_definition.manufacturing_planning` | no | `object` | — |
| `composition_history[].technical_definition.manufacturing_planning.die_area_mm2` | no | `number` | — |
| `composition_history[].technical_definition.manufacturing_planning.die_area_mm2_target` | no | `number` | — |
| `composition_history[].technical_definition.manufacturing_planning.initial_manufacturer` | no | `string` | — |
| `composition_history[].technical_definition.manufacturing_planning.node_um` | no | `number` | — |
| `composition_history[].technical_definition.manufacturing_planning.policy` | no | `string` | — |
| `composition_history[].technical_definition.manufacturing_planning.transistor_budget_target` | no | `number` | — |
| `composition_history[].technical_definition.manufacturing_planning.wafer_diameter_mm` | no | `number` | — |
| `composition_history[].technical_definition.memory_constraints` | no | `object` | — |
| `composition_history[].technical_definition.memory_constraints.max_ram_kib` | no | `number | null` | — |
| `composition_history[].technical_definition.memory_constraints.mixed_module_types_allowed` | no | `boolean` | — |
| `composition_history[].technical_definition.memory_interface` | no | `object` | — |
| `composition_history[].technical_definition.memory_interface.expansion_id` | no | `string` | pattern: "^(device)\\.[a-z0-9][a-z0-9_.-]*$" |
| `composition_history[].technical_definition.memory_interface.organization_id` | no | `string` | pattern: "^(technology)\\.[a-z0-9][a-z0-9_.-]*$" |
| `composition_history[].technical_definition.memory_interface.system_controller_id` | no | `string` | pattern: "^(base_part)\\.[a-z0-9][a-z0-9_.-]*$" |
| `composition_history[].technical_definition.memory_mapping` | no | `object` | — |
| `composition_history[].technical_definition.memory_mapping.application_memory` | no | `string` | — |
| `composition_history[].technical_definition.memory_mapping.configuration` | no | `string` | — |
| `composition_history[].technical_definition.memory_mapping.installation` | no | `string` | — |
| `composition_history[].technical_definition.memory_mapping.normal_cpu_range` | no | `string` | — |
| `composition_history[].technical_definition.memory_mapping.page_count` | no | `number` | — |
| `composition_history[].technical_definition.memory_mapping.page_size_kb` | no | `number` | — |
| `composition_history[].technical_definition.memory_mapping.service_calls` | no | `string` | — |
| `composition_history[].technical_definition.memory_mapping.slot_count` | no | `number` | — |
| `composition_history[].technical_definition.memory_mapping.system_workspace` | no | `string` | — |
| `composition_history[].technical_definition.packaging` | no | `string` | — |
| `composition_history[].technical_definition.physical_population` | no | `object` | — |
| `composition_history[].technical_definition.physical_population.capacity_kb` | no | `number` | — |
| `composition_history[].technical_definition.physical_population.chip_id` | no | `string` | pattern: "^(base_part)\\.[a-z0-9][a-z0-9_.-]*$" |
| `composition_history[].technical_definition.physical_population.data_chip_count` | no | `number` | — |
| `composition_history[].technical_definition.physical_population.data_width_bits` | no | `number` | — |
| `composition_history[].technical_definition.physical_population.refresh_owner` | no | `string` | — |
| `composition_history[].technical_definition.planned_compatible_with[]` | no | `array<string>` | pattern: "^(device)\\.[a-z0-9][a-z0-9_.-]*$" |
| `composition_history[].technical_definition.processor` | no | `object` | — |
| `composition_history[].technical_definition.processor.part_id` | no | `string` | pattern: "^(base_part)\\.[a-z0-9][a-z0-9_.-]*$" |
| `composition_history[].technical_definition.recommended_software_id` | no | `string` | pattern: "^(software_edition)\\.[a-z0-9][a-z0-9_.-]*$" |
| `composition_history[].technical_definition.role` | no | `string` | — |
| `composition_history[].technical_definition.slot_count` | no | `number` | — |
| `composition_history[].technical_definition.specification` | no | `object` | — |
| `composition_history[].technical_definition.specification.acceleration[]` | no | `array<string>` | — |
| `composition_history[].technical_definition.specification.adaptation` | no | `string` | — |
| `composition_history[].technical_definition.specification.adapter_requirements` | no | `object` | — |
| `composition_history[].technical_definition.specification.adapter_requirements.buffer_policy` | no | `string` | — |
| `composition_history[].technical_definition.specification.adapter_requirements.flow_control` | no | `string` | — |
| `composition_history[].technical_definition.specification.adapter_requirements.hardware_services[]` | no | `array<string>` | — |
| `composition_history[].technical_definition.specification.adapter_requirements.host_service` | no | `string` | — |
| `composition_history[].technical_definition.specification.adapter_requirements.local_packet_ram_target_bytes` | no | `number` | — |
| `composition_history[].technical_definition.specification.additions[]` | no | `array<string>` | — |
| `composition_history[].technical_definition.specification.analog_chain` | no | `string` | — |
| `composition_history[].technical_definition.specification.api_id` | no | `string` | pattern: "^(technology)\\.[a-z0-9][a-z0-9_.-]*$" |
| `composition_history[].technical_definition.specification.arbitration` | no | `string` | — |
| `composition_history[].technical_definition.specification.array_columns` | no | `number` | — |
| `composition_history[].technical_definition.specification.array_rows` | no | `number` | — |
| `composition_history[].technical_definition.specification.bandwidth` | no | `string` | — |
| `composition_history[].technical_definition.specification.bank_capacity_kb` | no | `number` | — |
| `composition_history[].technical_definition.specification.bank_control` | no | `string` | — |
| `composition_history[].technical_definition.specification.bank_data_width_bits` | no | `number` | — |
| `composition_history[].technical_definition.specification.bank_organization` | no | `string` | — |
| `composition_history[].technical_definition.specification.base_controller_id` | no | `string` | pattern: "^(base_part)\\.[a-z0-9][a-z0-9_.-]*$" |
| `composition_history[].technical_definition.specification.base_product_id` | no | `string` | pattern: "^(base_part)\\.[a-z0-9][a-z0-9_.-]*$" |
| `composition_history[].technical_definition.specification.beam_voltage_levels` | no | `number` | — |
| `composition_history[].technical_definition.specification.bitmap_modes[]` | no | `array<object>` | — |
| `composition_history[].technical_definition.specification.bitmap_modes[].bits_per_pixel` | no | `number` | — |
| `composition_history[].technical_definition.specification.bitmap_modes[].bytes_per_framebuffer` | no | `number` | — |
| `composition_history[].technical_definition.specification.bitmap_modes[].compatibility_mode` | no | `boolean` | — |
| `composition_history[].technical_definition.specification.bitmap_modes[].configurations[]` | no | `array<object>` | — |
| `composition_history[].technical_definition.specification.bitmap_modes[].configurations[].allocated_bytes` | no | `number` | — |
| `composition_history[].technical_definition.specification.bitmap_modes[].configurations[].framebuffer_bytes` | no | `number` | — |
| `composition_history[].technical_definition.specification.bitmap_modes[].configurations[].framebuffer_count` | no | `number` | — |
| `composition_history[].technical_definition.specification.bitmap_modes[].configurations[].palette_list_bytes` | no | `number` | — |
| `composition_history[].technical_definition.specification.bitmap_modes[].configurations[].remaining_video_ram_bytes` | no | `number` | — |
| `composition_history[].technical_definition.specification.bitmap_modes[].configurations[].sprite_count` | no | `number` | — |
| `composition_history[].technical_definition.specification.bitmap_modes[].double_buffering` | no | `boolean` | — |
| `composition_history[].technical_definition.specification.bitmap_modes[].framebuffer_bytes` | no | `number` | — |
| `composition_history[].technical_definition.specification.bitmap_modes[].framebuffer_count` | no | `number` | — |
| `composition_history[].technical_definition.specification.bitmap_modes[].height` | no | `number` | — |
| `composition_history[].technical_definition.specification.bitmap_modes[].id` | no | `string` | — |
| `composition_history[].technical_definition.specification.bitmap_modes[].palette_list_bytes` | no | `number` | — |
| `composition_history[].technical_definition.specification.bitmap_modes[].remaining_bytes` | no | `number` | — |
| `composition_history[].technical_definition.specification.bitmap_modes[].required_raster_ids[]` | no | `array<string>` | — |
| `composition_history[].technical_definition.specification.bitmap_modes[].simultaneous_values` | no | `number` | — |
| `composition_history[].technical_definition.specification.bitmap_modes[].sprites_available` | no | `number` | — |
| `composition_history[].technical_definition.specification.bitmap_modes[].stride_bytes` | no | `number` | — |
| `composition_history[].technical_definition.specification.bitmap_modes[].width` | no | `number` | — |
| `composition_history[].technical_definition.specification.boot` | no | `string` | — |
| `composition_history[].technical_definition.specification.bridge_design_id` | no | `string` | pattern: "^(technology)\\.[a-z0-9][a-z0-9_.-]*$" |
| `composition_history[].technical_definition.specification.buttons` | no | `number` | — |
| `composition_history[].technical_definition.specification.capabilities` | no | `object` | — |
| `composition_history[].technical_definition.specification.capabilities.color_model` | no | `string` | — |
| `composition_history[].technical_definition.specification.capabilities.maximum_pixel_clock_mhz` | no | `number` | — |
| `composition_history[].technical_definition.specification.capabilities.palette_precision_bits` | no | `number` | — |
| `composition_history[].technical_definition.specification.capabilities.preferred_raster_id` | no | `string` | — |
| `composition_history[].technical_definition.specification.capabilities.programmable_palette` | no | `boolean` | — |
| `composition_history[].technical_definition.specification.capabilities.protocol_version` | no | `number` | — |
| `composition_history[].technical_definition.specification.capabilities.raster_ids[]` | no | `array<string>` | — |
| `composition_history[].technical_definition.specification.capacity_bytes` | no | `number` | — |
| `composition_history[].technical_definition.specification.capacity_kb` | no | `number | null` | — |
| `composition_history[].technical_definition.specification.capacity_kbit` | no | `number` | — |
| `composition_history[].technical_definition.specification.capacity_mb` | no | `number` | — |
| `composition_history[].technical_definition.specification.card_id` | no | `string` | pattern: "^(device)\\.[a-z0-9][a-z0-9_.-]*$" |
| `composition_history[].technical_definition.specification.character_row_cache` | no | `object` | — |
| `composition_history[].technical_definition.specification.character_row_cache.banks` | no | `number` | — |
| `composition_history[].technical_definition.specification.character_row_cache.bytes_per_bank` | no | `number` | — |
| `composition_history[].technical_definition.specification.character_row_cache.purpose` | no | `string` | — |
| `composition_history[].technical_definition.specification.character_row_cache.total_bytes` | no | `number` | — |
| `composition_history[].technical_definition.specification.chip_organization` | no | `string` | — |
| `composition_history[].technical_definition.specification.chip_type_id` | no | `string` | pattern: "^(base_part)\\.[a-z0-9][a-z0-9_.-]*$" |
| `composition_history[].technical_definition.specification.chips` | no | `number` | — |
| `composition_history[].technical_definition.specification.chips_per_rank` | no | `number` | — |
| `composition_history[].technical_definition.specification.class_protocol_id` | no | `string` | pattern: "^(technology)\\.[a-z0-9][a-z0-9_.-]*$" |
| `composition_history[].technical_definition.specification.clock_mhz` | no | `number` | — |
| `composition_history[].technical_definition.specification.compatibility` | no | `string` | — |
| `composition_history[].technical_definition.specification.connection` | no | `string` | — |
| `composition_history[].technical_definition.specification.continuity` | no | `string` | — |
| `composition_history[].technical_definition.specification.controller_die_count` | no | `null` | — |
| `composition_history[].technical_definition.specification.controller_id` | no | `string` | pattern: "^(base_part)\\.[a-z0-9][a-z0-9_.-]*$" |
| `composition_history[].technical_definition.specification.conversion` | no | `string` | — |
| `composition_history[].technical_definition.specification.cpu_address_bits` | no | `number` | — |
| `composition_history[].technical_definition.specification.cpu_id` | no | `string` | pattern: "^(base_part)\\.[a-z0-9][a-z0-9_.-]*$" |
| `composition_history[].technical_definition.specification.crt_id` | no | `string` | pattern: "^(base_part)\\.[a-z0-9][a-z0-9_.-]*$" |
| `composition_history[].technical_definition.specification.cursor_keys` | no | `string` | — |
| `composition_history[].technical_definition.specification.data_width_bits` | no | `number` | — |
| `composition_history[].technical_definition.specification.density` | no | `string` | — |
| `composition_history[].technical_definition.specification.diagonal_inch` | no | `number` | — |
| `composition_history[].technical_definition.specification.diagonal_inches` | no | `number` | — |
| `composition_history[].technical_definition.specification.die_area_mm2` | no | `number` | — |
| `composition_history[].technical_definition.specification.die_area_planning_mm2` | no | `number` | — |
| `composition_history[].technical_definition.specification.digital_output_bits` | no | `number` | — |
| `composition_history[].technical_definition.specification.disk_formats[]` | no | `array<string>` | — |
| `composition_history[].technical_definition.specification.disk_ii_interface` | no | `boolean` | — |
| `composition_history[].technical_definition.specification.disk_interface` | no | `string` | — |
| `composition_history[].technical_definition.specification.display_controller_id` | no | `string` | pattern: "^(base_part)\\.[a-z0-9][a-z0-9_.-]*$" |
| `composition_history[].technical_definition.specification.display_memory` | no | `object` | — |
| `composition_history[].technical_definition.specification.display_memory.bank_data_width_bits` | no | `number` | — |
| `composition_history[].technical_definition.specification.display_memory.capacity_bytes` | no | `number` | — |
| `composition_history[].technical_definition.specification.display_memory.chip_count` | no | `number` | — |
| `composition_history[].technical_definition.specification.display_memory.chip_id` | no | `string` | pattern: "^(base_part)\\.[a-z0-9][a-z0-9_.-]*$" |
| `composition_history[].technical_definition.specification.display_memory.organization` | no | `string` | — |
| `composition_history[].technical_definition.specification.display_modes` | no | `string` | — |
| `composition_history[].technical_definition.specification.display_subassembly_id` | no | `string` | pattern: "^(base_part)\\.[a-z0-9][a-z0-9_.-]*$" |
| `composition_history[].technical_definition.specification.displayed_color_registers` | no | `number` | — |
| `composition_history[].technical_definition.specification.displayed_registers` | no | `number` | — |
| `composition_history[].technical_definition.specification.dma` | no | `object` | — |
| `composition_history[].technical_definition.specification.dma.active_transfer_engines` | no | `number` | — |
| `composition_history[].technical_definition.specification.dma.address_steps[]` | no | `array<string>` | — |
| `composition_history[].technical_definition.specification.dma.arbitration` | no | `string` | — |
| `composition_history[].technical_definition.specification.dma.bank_selection` | no | `string` | — |
| `composition_history[].technical_definition.specification.dma.completion` | no | `string` | — |
| `composition_history[].technical_definition.specification.dma.destination_address_bits` | no | `number` | — |
| `composition_history[].technical_definition.specification.dma.length_bits` | no | `number` | — |
| `composition_history[].technical_definition.specification.dma.operations[]` | no | `array<string>` | — |
| `composition_history[].technical_definition.specification.dma.peripheral_scope` | no | `string` | — |
| `composition_history[].technical_definition.specification.dma.transfer_contexts` | no | `number` | — |
| `composition_history[].technical_definition.specification.dma.video_endpoint` | no | `string` | — |
| `composition_history[].technical_definition.specification.dot_pitch_mm` | no | `number` | — |
| `composition_history[].technical_definition.specification.electrical_contract` | no | `string` | — |
| `composition_history[].technical_definition.specification.electrical_interface` | no | `string` | — |
| `composition_history[].technical_definition.specification.ergonomics` | no | `string` | — |
| `composition_history[].technical_definition.specification.execution` | no | `string` | — |
| `composition_history[].technical_definition.specification.expansion_role` | no | `string` | — |
| `composition_history[].technical_definition.specification.fdd_density` | no | `string` | — |
| `composition_history[].technical_definition.specification.fdd_size_inch` | no | `number` | — |
| `composition_history[].technical_definition.specification.feature_continuity_id` | no | `string` | pattern: "^(device)\\.[a-z0-9][a-z0-9_.-]*$" |
| `composition_history[].technical_definition.specification.flexibus_ports` | no | `number` | — |
| `composition_history[].technical_definition.specification.format` | no | `string` | — |
| `composition_history[].technical_definition.specification.formatted_capacity_kb` | no | `null` | — |
| `composition_history[].technical_definition.specification.function_keys` | no | `string` | — |
| `composition_history[].technical_definition.specification.grayscale_levels` | no | `number` | — |
| `composition_history[].technical_definition.specification.hdd_bundled_with_standard_artemis` | no | `boolean` | — |
| `composition_history[].technical_definition.specification.hdd_interface_supported` | no | `boolean` | — |
| `composition_history[].technical_definition.specification.historical_raster` | no | `string` | — |
| `composition_history[].technical_definition.specification.host` | no | `string` | — |
| `composition_history[].technical_definition.specification.host_access` | no | `string` | — |
| `composition_history[].technical_definition.specification.host_clock_mhz[]` | no | `array<number>` | — |
| `composition_history[].technical_definition.specification.host_integration` | no | `string` | — |
| `composition_history[].technical_definition.specification.host_interface` | no | `schema-defined` | — |
| `composition_history[].technical_definition.specification.implementation` | no | `string` | — |
| `composition_history[].technical_definition.specification.implementation_design` | no | `object` | — |
| `composition_history[].technical_definition.specification.implementation_design.arbitration` | no | `string` | — |
| `composition_history[].technical_definition.specification.implementation_design.clock_targets` | no | `object` | — |
| `composition_history[].technical_definition.specification.implementation_design.clock_targets.high_resolution_pixel_mhz` | no | `number` | — |
| `composition_history[].technical_definition.specification.implementation_design.clock_targets.low_resolution_pixel_mhz` | no | `number` | — |
| `composition_history[].technical_definition.specification.implementation_design.clock_targets.master_mhz` | no | `number` | — |
| `composition_history[].technical_definition.specification.implementation_design.clock_targets.maximum_pixel_fifo_output_mbytes_per_second` | no | `number` | — |
| `composition_history[].technical_definition.specification.implementation_design.clock_targets.scope` | no | `string` | — |
| `composition_history[].technical_definition.specification.implementation_design.engines` | no | `object` | — |
| `composition_history[].technical_definition.specification.implementation_design.engines.fifo` | no | `string` | — |
| `composition_history[].technical_definition.specification.implementation_design.engines.renderer` | no | `string` | — |
| `composition_history[].technical_definition.specification.implementation_design.engines.scanout` | no | `string` | — |
| `composition_history[].technical_definition.specification.implementation_design.engines.underrun` | no | `string` | — |
| `composition_history[].technical_definition.specification.implementation_design.internal_buffers` | no | `object` | — |
| `composition_history[].technical_definition.specification.implementation_design.internal_buffers.character_attribute_row_cache_bytes` | no | `number` | — |
| `composition_history[].technical_definition.specification.implementation_design.internal_buffers.included_in_die_estimates` | no | `boolean` | — |
| `composition_history[].technical_definition.specification.implementation_design.internal_buffers.next_character_attribute_row_cache_bytes` | no | `number` | — |
| `composition_history[].technical_definition.specification.implementation_design.internal_buffers.pixel_bits` | no | `number` | — |
| `composition_history[].technical_definition.specification.implementation_design.internal_buffers.pixel_fifo_bytes` | no | `number` | — |
| `composition_history[].technical_definition.specification.implementation_design.internal_buffers.pixel_fifo_page_bytes` | no | `number` | — |
| `composition_history[].technical_definition.specification.implementation_design.internal_buffers.pixel_fifo_page_count` | no | `number` | — |
| `composition_history[].technical_definition.specification.implementation_design.internal_buffers.sprite_row_shifters_bytes` | no | `number` | — |
| `composition_history[].technical_definition.specification.implementation_design.internal_buffers.sprite_staging_bytes` | no | `number` | — |
| `composition_history[].technical_definition.specification.implementation_design.internal_buffers.total_storage_bytes` | no | `number` | — |
| `composition_history[].technical_definition.specification.implementation_design.line_repeat` | no | `string` | — |
| `composition_history[].technical_definition.specification.implementation_design.manufacturing_planning` | no | `object` | — |
| `composition_history[].technical_definition.specification.implementation_design.manufacturing_planning.die_area_mm2_at_3_5um_range[]` | no | `array<number>` | — |
| `composition_history[].technical_definition.specification.implementation_design.manufacturing_planning.die_area_mm2_at_3um_range[]` | no | `array<number>` | — |
| `composition_history[].technical_definition.specification.implementation_design.manufacturing_planning.die_area_mm2_central_at_3_5um` | no | `number` | — |
| `composition_history[].technical_definition.specification.implementation_design.manufacturing_planning.die_area_mm2_central_at_3um` | no | `number` | — |
| `composition_history[].technical_definition.specification.implementation_design.manufacturing_planning.external_functions[]` | no | `array<string>` | — |
| `composition_history[].technical_definition.specification.implementation_design.manufacturing_planning.process` | no | `string` | — |
| `composition_history[].technical_definition.specification.implementation_design.manufacturing_planning.transistors_central` | no | `number` | — |
| `composition_history[].technical_definition.specification.implementation_design.manufacturing_planning.transistors_range[]` | no | `array<number>` | — |
| `composition_history[].technical_definition.specification.implementation_design.sprite_access` | no | `string` | — |
| `composition_history[].technical_definition.specification.implementation_design.text_fetch` | no | `string` | — |
| `composition_history[].technical_definition.specification.implementation_design.timing_budget` | no | `object` | — |
| `composition_history[].technical_definition.specification.implementation_design.timing_budget.dram_random_cycle_target_ns` | no | `number` | — |
| `composition_history[].technical_definition.specification.implementation_design.timing_budget.fifo_total_drain_time_us_at_high_resolution` | no | `number` | — |
| `composition_history[].technical_definition.specification.implementation_design.timing_budget.fifo_total_pixels` | no | `number` | — |
| `composition_history[].technical_definition.specification.implementation_design.timing_budget.illustrative_read_time_us` | no | `number` | — |
| `composition_history[].technical_definition.specification.implementation_design.timing_budget.illustrative_total_reads_per_scanline` | no | `number` | — |
| `composition_history[].technical_definition.specification.implementation_design.timing_budget.maximum_sprite_row_bytes_per_scanline` | no | `number` | — |
| `composition_history[].technical_definition.specification.implementation_design.timing_budget.next_row_prefetch_average_bytes_per_scanline` | no | `number` | — |
| `composition_history[].technical_definition.specification.implementation_design.timing_budget.qualification` | no | `string` | — |
| `composition_history[].technical_definition.specification.implementation_design.timing_budget.sprite_pattern_fetch_time_us` | no | `number` | — |
| `composition_history[].technical_definition.specification.implementation_design.timing_budget.sprite_sram_cycle_target_ns` | no | `number` | — |
| `composition_history[].technical_definition.specification.implementation_design.timing_budget.text_glyph_reads_per_scanline` | no | `number` | — |
| `composition_history[].technical_definition.specification.implementation_design.timing_budget.two_ready_pages_drain_time_us` | no | `number` | — |
| `composition_history[].technical_definition.specification.included_monitor` | no | `boolean` | — |
| `composition_history[].technical_definition.specification.input` | no | `string` | — |
| `composition_history[].technical_definition.specification.input_bits` | no | `number` | — |
| `composition_history[].technical_definition.specification.installation` | no | `string` | — |
| `composition_history[].technical_definition.specification.intensity_levels` | no | `number` | — |
| `composition_history[].technical_definition.specification.interface` | no | `string` | — |
| `composition_history[].technical_definition.specification.interface_id` | no | `string` | pattern: "^(technology)\\.[a-z0-9][a-z0-9_.-]*$" |
| `composition_history[].technical_definition.specification.key_count` | no | `number` | — |
| `composition_history[].technical_definition.specification.keyboard_standard_id` | no | `string` | pattern: "^(technology)\\.[a-z0-9][a-z0-9_.-]*$" |
| `composition_history[].technical_definition.specification.legacy_card_id` | no | `string` | pattern: "^(device)\\.[a-z0-9][a-z0-9_.-]*$" |
| `composition_history[].technical_definition.specification.link_layer_id` | no | `string` | pattern: "^(technology)\\.[a-z0-9][a-z0-9_.-]*$" |
| `composition_history[].technical_definition.specification.local_packet_ram_target_bytes` | no | `number` | — |
| `composition_history[].technical_definition.specification.local_ram_kb` | no | `number` | — |
| `composition_history[].technical_definition.specification.manufacturer` | no | `string` | — |
| `composition_history[].technical_definition.specification.manufacturing_planning` | no | `object` | — |
| `composition_history[].technical_definition.specification.manufacturing_planning.die_area_mm2` | no | `number` | — |
| `composition_history[].technical_definition.specification.manufacturing_planning.die_area_mm2_central` | no | `number` | — |
| `composition_history[].technical_definition.specification.manufacturing_planning.die_area_mm2_range[]` | no | `array<number>` | — |
| `composition_history[].technical_definition.specification.manufacturing_planning.package_allowance_usd` | no | `number` | — |
| `composition_history[].technical_definition.specification.manufacturing_planning.recipe_variants[]` | no | `array<object>` | — |
| `composition_history[].technical_definition.specification.manufacturing_planning.recipe_variants[].defect_density_cm2` | no | `number` | — |
| `composition_history[].technical_definition.specification.manufacturing_planning.recipe_variants[].die_area_mm2` | no | `number` | — |
| `composition_history[].technical_definition.specification.manufacturing_planning.recipe_variants[].id` | no | `string` | — |
| `composition_history[].technical_definition.specification.manufacturing_planning.recipe_variants[].manufacturing_capability_id` | no | `string` | pattern: "^(manufacturing_capability)\\.[a-z0-9][a-z0-9_.-]*$" |
| `composition_history[].technical_definition.specification.manufacturing_planning.recipe_variants[].node_um` | no | `string` | — |
| `composition_history[].technical_definition.specification.manufacturing_planning.recipe_variants[].processed_wafer_usd` | no | `number` | — |
| `composition_history[].technical_definition.specification.manufacturing_planning.revision_policy` | no | `string` | — |
| `composition_history[].technical_definition.specification.manufacturing_planning.wafer_mm` | no | `number` | — |
| `composition_history[].technical_definition.specification.manufacturing_recipe` | no | `string` | — |
| `composition_history[].technical_definition.specification.maximum_shared_raw_rate_kbps` | no | `number` | — |
| `composition_history[].technical_definition.specification.mechanism_id` | no | `string` | pattern: "^(base_part)\\.[a-z0-9][a-z0-9_.-]*$" |
| `composition_history[].technical_definition.specification.media` | no | `string` | — |
| `composition_history[].technical_definition.specification.media_access_control` | no | `string` | — |
| `composition_history[].technical_definition.specification.memory_addressing_bytes` | no | `number` | — |
| `composition_history[].technical_definition.specification.memory_layout` | no | `object` | — |
| `composition_history[].technical_definition.specification.memory_layout.font_policy` | no | `string` | — |
| `composition_history[].technical_definition.specification.memory_layout.mode_exclusivity` | no | `string` | — |
| `composition_history[].technical_definition.specification.memory_layout.page_flip` | no | `string` | — |
| `composition_history[].technical_definition.specification.memory_layout.policy_id` | no | `string` | pattern: "^(technology)\\.[a-z0-9][a-z0-9_.-]*$" |
| `composition_history[].technical_definition.specification.mode_discovery` | no | `string` | — |
| `composition_history[].technical_definition.specification.mode_limit` | no | `string` | — |
| `composition_history[].technical_definition.specification.mode_policy` | no | `string` | — |
| `composition_history[].technical_definition.specification.model` | no | `string` | — |
| `composition_history[].technical_definition.specification.modules_per_bank` | no | `number` | — |
| `composition_history[].technical_definition.specification.monitor_id` | no | `string` | pattern: "^(device)\\.[a-z0-9][a-z0-9_.-]*$" |
| `composition_history[].technical_definition.specification.monitor_modes` | no | `string` | — |
| `composition_history[].technical_definition.specification.monitor_policy` | no | `string` | — |
| `composition_history[].technical_definition.specification.native_raster` | no | `object` | — |
| `composition_history[].technical_definition.specification.native_raster.height` | no | `number` | — |
| `composition_history[].technical_definition.specification.native_raster.horizontal_khz` | no | `number` | — |
| `composition_history[].technical_definition.specification.native_raster.pixel_clock_mhz` | no | `number` | — |
| `composition_history[].technical_definition.specification.native_raster.progressive` | no | `boolean` | — |
| `composition_history[].technical_definition.specification.native_raster.refresh_hz_target` | no | `number` | — |
| `composition_history[].technical_definition.specification.native_raster.total_lines` | no | `number` | — |
| `composition_history[].technical_definition.specification.native_raster.total_pixels` | no | `number` | — |
| `composition_history[].technical_definition.specification.native_raster.width` | no | `number` | — |
| `composition_history[].technical_definition.specification.navigation_section[]` | no | `array<string>` | — |
| `composition_history[].technical_definition.specification.negotiation_id` | no | `string` | pattern: "^(technology)\\.[a-z0-9][a-z0-9_.-]*$" |
| `composition_history[].technical_definition.specification.node_um` | no | `number` | — |
| `composition_history[].technical_definition.specification.numeric_keypad` | no | `boolean` | — |
| `composition_history[].technical_definition.specification.oem` | no | `string` | — |
| `composition_history[].technical_definition.specification.oem_basis` | no | `string` | — |
| `composition_history[].technical_definition.specification.organization` | no | `string` | — |
| `composition_history[].technical_definition.specification.organization_words` | no | `number` | — |
| `composition_history[].technical_definition.specification.output` | no | `string` | — |
| `composition_history[].technical_definition.specification.package` | no | `string | null` | — |
| `composition_history[].technical_definition.specification.page_size_kb` | no | `number` | — |
| `composition_history[].technical_definition.specification.palette` | no | `string` | — |
| `composition_history[].technical_definition.specification.palette_entries` | no | `number` | — |
| `composition_history[].technical_definition.specification.palette_entry_bits` | no | `number` | — |
| `composition_history[].technical_definition.specification.palette_grayscale_levels` | no | `number` | — |
| `composition_history[].technical_definition.specification.palette_list` | no | `object` | — |
| `composition_history[].technical_definition.specification.palette_list.base_address` | no | `string` | — |
| `composition_history[].technical_definition.specification.palette_list.cad_policy` | no | `string` | — |
| `composition_history[].technical_definition.specification.palette_list.command_bytes` | no | `number` | — |
| `composition_history[].technical_definition.specification.palette_list.encoding` | no | `string` | — |
| `composition_history[].technical_definition.specification.palette_list.end_address` | no | `string` | — |
| `composition_history[].technical_definition.specification.palette_list.execution` | no | `string` | — |
| `composition_history[].technical_definition.specification.palette_list.frame_state` | no | `string` | — |
| `composition_history[].technical_definition.specification.palette_list.long_gaps` | no | `string` | — |
| `composition_history[].technical_definition.specification.palette_list.maximum_commands` | no | `number` | — |
| `composition_history[].technical_definition.specification.palette_list.register_count` | no | `number` | — |
| `composition_history[].technical_definition.specification.palette_list.reserved_bytes` | no | `number` | — |
| `composition_history[].technical_definition.specification.palette_list.write_limit` | no | `string` | — |
| `composition_history[].technical_definition.specification.palette_list_id` | no | `string` | pattern: "^(technology)\\.[a-z0-9][a-z0-9_.-]*$" |
| `composition_history[].technical_definition.specification.palette_registers` | no | `number` | — |
| `composition_history[].technical_definition.specification.parity_bits` | no | `number` | — |
| `composition_history[].technical_definition.specification.physical_arrangement` | no | `string` | — |
| `composition_history[].technical_definition.specification.physical_population` | no | `object` | — |
| `composition_history[].technical_definition.specification.physical_population.bank_count` | no | `number` | — |
| `composition_history[].technical_definition.specification.physical_population.bank_data_width_bits` | no | `number` | — |
| `composition_history[].technical_definition.specification.physical_population.common_ram_included` | no | `boolean` | — |
| `composition_history[].technical_definition.specification.physical_population.mapping_note` | no | `string` | — |
| `composition_history[].technical_definition.specification.physical_population.parity_bits` | no | `number` | — |
| `composition_history[].technical_definition.specification.physical_population.video_ram_separate` | no | `boolean` | — |
| `composition_history[].technical_definition.specification.pixel_buffer` | no | `object` | — |
| `composition_history[].technical_definition.specification.pixel_buffer.bits_per_pixel` | no | `number` | — |
| `composition_history[].technical_definition.specification.pixel_buffer.bytes_per_page` | no | `number` | — |
| `composition_history[].technical_definition.specification.pixel_buffer.location` | no | `string` | — |
| `composition_history[].technical_definition.specification.pixel_buffer.page_states[]` | no | `array<string>` | — |
| `composition_history[].technical_definition.specification.pixel_buffer.pages` | no | `number` | — |
| `composition_history[].technical_definition.specification.pixel_buffer.physical_organization` | no | `string` | — |
| `composition_history[].technical_definition.specification.pixel_buffer.pixels_per_page` | no | `number` | — |
| `composition_history[].technical_definition.specification.pixel_buffer.policy` | no | `string` | — |
| `composition_history[].technical_definition.specification.pixel_buffer.total_bytes` | no | `number` | — |
| `composition_history[].technical_definition.specification.pixel_clock_mhz` | no | `number` | — |
| `composition_history[].technical_definition.specification.platform_rate_profiles[]` | no | `array<object>` | — |
| `composition_history[].technical_definition.specification.platform_rate_profiles[].computer_id` | no | `string` | pattern: "^(device)\\.[a-z0-9][a-z0-9_.-]*$" |
| `composition_history[].technical_definition.specification.platform_rate_profiles[].implementation` | no | `string` | — |
| `composition_history[].technical_definition.specification.platform_rate_profiles[].qualified_max_rate_kbps` | no | `number` | — |
| `composition_history[].technical_definition.specification.platform_rate_profiles[].rate_policy` | no | `string` | — |
| `composition_history[].technical_definition.specification.platform_rate_profiles[].server_role` | no | `boolean` | — |
| `composition_history[].technical_definition.specification.platform_rate_profiles[].supported_rates_kbps[]` | no | `array<number>` | — |
| `composition_history[].technical_definition.specification.platform_rate_profiles[].technology_ids[]` | no | `array<string>` | pattern: "^(technology)\\.[a-z0-9][a-z0-9_.-]*$" |
| `composition_history[].technical_definition.specification.port_count` | no | `number` | — |
| `composition_history[].technical_definition.specification.ports[]` | no | `array<string>` | — |
| `composition_history[].technical_definition.specification.power` | no | `string` | — |
| `composition_history[].technical_definition.specification.purchase_boundary` | no | `string` | — |
| `composition_history[].technical_definition.specification.qualification` | no | `string` | — |
| `composition_history[].technical_definition.specification.random_cycle_target_ns` | no | `number` | — |
| `composition_history[].technical_definition.specification.rank_capacity_kb` | no | `number` | — |
| `composition_history[].technical_definition.specification.ranks` | no | `number` | — |
| `composition_history[].technical_definition.specification.rate_scope` | no | `string` | — |
| `composition_history[].technical_definition.specification.redraw` | no | `string` | — |
| `composition_history[].technical_definition.specification.refresh` | no | `schema-defined` | — |
| `composition_history[].technical_definition.specification.refresh_required` | no | `boolean` | — |
| `composition_history[].technical_definition.specification.register_width_bits` | no | `number` | — |
| `composition_history[].technical_definition.specification.reused_elements[]` | no | `array<string>` | — |
| `composition_history[].technical_definition.specification.rgb_palette_mapping` | no | `string` | — |
| `composition_history[].technical_definition.specification.role` | no | `string` | — |
| `composition_history[].technical_definition.specification.rollers[]` | no | `array<object>` | — |
| `composition_history[].technical_definition.specification.rollers[].default_action` | no | `string` | — |
| `composition_history[].technical_definition.specification.rollers[].position` | no | `string` | — |
| `composition_history[].technical_definition.specification.scan` | no | `string` | — |
| `composition_history[].technical_definition.specification.separate_sprite_sram_bytes` | no | `number` | — |
| `composition_history[].technical_definition.specification.serial_register_bits` | no | `number` | — |
| `composition_history[].technical_definition.specification.sides` | no | `number` | — |
| `composition_history[].technical_definition.specification.signal_path` | no | `string` | — |
| `composition_history[].technical_definition.specification.simultaneous_shades_at_640_200_4bpp` | no | `number` | — |
| `composition_history[].technical_definition.specification.simultaneous_shades_at_800_600_2bpp` | no | `number` | — |
| `composition_history[].technical_definition.specification.simultaneous_shades_with_128kb_card` | no | `number` | — |
| `composition_history[].technical_definition.specification.size_inch` | no | `number` | — |
| `composition_history[].technical_definition.specification.slot` | no | `string` | — |
| `composition_history[].technical_definition.specification.software` | no | `string` | — |
| `composition_history[].technical_definition.specification.speed_qualification_targets` | no | `object` | — |
| `composition_history[].technical_definition.specification.speed_qualification_targets.basis` | no | `string` | — |
| `composition_history[].technical_definition.specification.speed_qualification_targets.conditions` | no | `string` | — |
| `composition_history[].technical_definition.specification.speed_qualification_targets.fallback_random_cycle_ns_range[]` | no | `array<number>` | — |
| `composition_history[].technical_definition.specification.speed_qualification_targets.fallback_row_access_ns` | no | `number` | — |
| `composition_history[].technical_definition.specification.speed_qualification_targets.preferred_random_cycle_ns` | no | `number` | — |
| `composition_history[].technical_definition.specification.speed_qualification_targets.preferred_row_access_ns` | no | `number` | — |
| `composition_history[].technical_definition.specification.speed_qualification_targets.stretch_row_access_ns` | no | `number` | — |
| `composition_history[].technical_definition.specification.sprite_memory` | no | `object` | — |
| `composition_history[].technical_definition.specification.sprite_memory.bank_data_width_bits` | no | `number` | — |
| `composition_history[].technical_definition.specification.sprite_memory.capacity_bytes` | no | `number` | — |
| `composition_history[].technical_definition.specification.sprite_memory.chip_count` | no | `number` | — |
| `composition_history[].technical_definition.specification.sprite_memory.chip_id` | no | `string` | pattern: "^(base_part)\\.[a-z0-9][a-z0-9_.-]*$" |
| `composition_history[].technical_definition.specification.sprite_memory.separate_bus` | no | `boolean` | — |
| `composition_history[].technical_definition.specification.sprite_memory.separate_from_system_and_display_ram` | no | `boolean` | — |
| `composition_history[].technical_definition.specification.sprite_physical_population` | no | `object` | — |
| `composition_history[].technical_definition.specification.sprite_physical_population.bank_data_width_bits` | no | `number` | — |
| `composition_history[].technical_definition.specification.sprite_physical_population.separate_bus` | no | `boolean` | — |
| `composition_history[].technical_definition.specification.sprite_physical_population.separate_from_system_and_display_ram` | no | `boolean` | — |
| `composition_history[].technical_definition.specification.sprite_policy` | no | `string` | — |
| `composition_history[].technical_definition.specification.sprite_profile_ref` | no | `object` | — |
| `composition_history[].technical_definition.specification.sprite_profile_ref.profile` | no | `string` | — |
| `composition_history[].technical_definition.specification.sprite_profile_ref.technology_id` | no | `string` | pattern: "^(technology)\\.[a-z0-9][a-z0-9_.-]*$" |
| `composition_history[].technical_definition.specification.sprites` | no | `schema-defined` | — |
| `composition_history[].technical_definition.specification.startup_rate_kbps` | no | `number` | — |
| `composition_history[].technical_definition.specification.supply_rails_v` | no | `array | null` | — |
| `composition_history[].technical_definition.specification.supported_fdd_count` | no | `number` | — |
| `composition_history[].technical_definition.specification.supported_rates_kbps[]` | no | `array<number>` | — |
| `composition_history[].technical_definition.specification.technology_id` | no | `string` | pattern: "^(technology)\\.[a-z0-9][a-z0-9_.-]*$" |
| `composition_history[].technical_definition.specification.text_modes[]` | no | `array<object>` | — |
| `composition_history[].technical_definition.specification.text_modes[].attribute_format` | no | `string` | — |
| `composition_history[].technical_definition.specification.text_modes[].attribute_map_bytes_per_buffer` | no | `number` | — |
| `composition_history[].technical_definition.specification.text_modes[].character_count` | no | `number` | — |
| `composition_history[].technical_definition.specification.text_modes[].character_map_bytes_per_buffer` | no | `number` | — |
| `composition_history[].technical_definition.specification.text_modes[].columns` | no | `number` | — |
| `composition_history[].technical_definition.specification.text_modes[].configurations[]` | no | `array<object>` | — |
| `composition_history[].technical_definition.specification.text_modes[].configurations[].allocated_bytes` | no | `number` | — |
| `composition_history[].technical_definition.specification.text_modes[].configurations[].palette_list_bytes` | no | `number` | — |
| `composition_history[].technical_definition.specification.text_modes[].configurations[].remaining_video_ram_bytes` | no | `number` | — |
| `composition_history[].technical_definition.specification.text_modes[].configurations[].sprite_count` | no | `number` | — |
| `composition_history[].technical_definition.specification.text_modes[].configurations[].text_buffer_count` | no | `number` | — |
| `composition_history[].technical_definition.specification.text_modes[].double_buffering` | no | `boolean` | — |
| `composition_history[].technical_definition.specification.text_modes[].font_bytes` | no | `number` | — |
| `composition_history[].technical_definition.specification.text_modes[].glyph_height` | no | `number` | — |
| `composition_history[].technical_definition.specification.text_modes[].glyph_width` | no | `number` | — |
| `composition_history[].technical_definition.specification.text_modes[].height` | no | `number` | — |
| `composition_history[].technical_definition.specification.text_modes[].id` | no | `string` | — |
| `composition_history[].technical_definition.specification.text_modes[].ram_bytes_per_page` | no | `number` | — |
| `composition_history[].technical_definition.specification.text_modes[].required_raster_ids[]` | no | `array<string>` | — |
| `composition_history[].technical_definition.specification.text_modes[].rows` | no | `number` | — |
| `composition_history[].technical_definition.specification.text_modes[].sprites_available` | no | `number` | — |
| `composition_history[].technical_definition.specification.text_modes[].width` | no | `number` | — |
| `composition_history[].technical_definition.specification.timing_budget` | no | `object` | — |
| `composition_history[].technical_definition.specification.timing_budget.page_drain_microseconds` | no | `number` | — |
| `composition_history[].technical_definition.specification.timing_budget.pixel_clock_mhz` | no | `number` | — |
| `composition_history[].technical_definition.specification.timing_budget.qualification` | no | `string` | — |
| `composition_history[].technical_definition.specification.timing_budget.renderer_pixels_per_step` | no | `number` | — |
| `composition_history[].technical_definition.specification.timing_budget.renderer_step_mhz` | no | `number` | — |
| `composition_history[].technical_definition.specification.timing_target` | no | `object` | — |
| `composition_history[].technical_definition.specification.timing_target.horizontal_khz` | no | `number` | — |
| `composition_history[].technical_definition.specification.timing_target.horizontal_total_pixels` | no | `number` | — |
| `composition_history[].technical_definition.specification.timing_target.pixel_clock_mhz` | no | `number` | — |
| `composition_history[].technical_definition.specification.timing_target.refresh_hz` | no | `number` | — |
| `composition_history[].technical_definition.specification.timing_target.vertical_total_lines` | no | `number` | — |
| `composition_history[].technical_definition.specification.tracking` | no | `string` | — |
| `composition_history[].technical_definition.specification.transport_id` | no | `string` | pattern: "^(technology)\\.[a-z0-9][a-z0-9_.-]*$" |
| `composition_history[].technical_definition.specification.usable_from[]` | no | `array<string>` | — |
| `composition_history[].technical_definition.specification.video_link_id` | no | `string` | pattern: "^(technology)\\.[a-z0-9][a-z0-9_.-]*$" |
| `composition_history[].technical_definition.specification.video_physical_population` | no | `object` | — |
| `composition_history[].technical_definition.specification.video_physical_population.bank_data_width_bits` | no | `number` | — |
| `composition_history[].technical_definition.specification.video_physical_population.separate_from_system_ram` | no | `boolean` | — |
| `composition_history[].technical_definition.specification.video_ram_bytes` | no | `number` | — |
| `composition_history[].technical_definition.specification.video_ram_chip_count` | no | `number` | — |
| `composition_history[].technical_definition.specification.video_ram_chip_id` | no | `string` | pattern: "^(base_part)\\.[a-z0-9][a-z0-9_.-]*$" |
| `composition_history[].technical_definition.specification.video_ram_kb` | no | `number` | — |
| `composition_history[].technical_definition.specification_id` | no | `string` | pattern: "^(technology)\\.[a-z0-9][a-z0-9_.-]*$" |
| `composition_history[].technical_definition.technical_profile` | no | `object` | — |
| `composition_history[].technical_definition.technical_profile.memory` | no | `object` | — |
| `composition_history[].technical_definition.technical_profile.memory.bank_data_width_bits` | no | `number` | — |
| `composition_history[].technical_definition.technical_profile.memory.capacity_policy` | no | `string` | — |
| `composition_history[].technical_definition.technical_profile.memory.expanded_organization` | no | `object` | — |
| `composition_history[].technical_definition.technical_profile.memory.expanded_organization.application_memory_profile` | no | `string` | — |
| `composition_history[].technical_definition.technical_profile.memory.expanded_organization.common_system_ram_kb` | no | `number` | — |
| `composition_history[].technical_definition.technical_profile.memory.expanded_organization.contiguous_lower_ram_kb` | no | `number` | — |
| `composition_history[].technical_definition.technical_profile.memory.expanded_organization.controller_id` | no | `string` | pattern: "^(base_part)\\.[a-z0-9][a-z0-9_.-]*$" |
| `composition_history[].technical_definition.technical_profile.memory.expanded_organization.dma_addressing` | no | `string` | — |
| `composition_history[].technical_definition.technical_profile.memory.expanded_organization.normal_view[]` | no | `array<object>` | — |
| `composition_history[].technical_definition.technical_profile.memory.expanded_organization.normal_view[].description` | no | `string` | — |
| `composition_history[].technical_definition.technical_profile.memory.expanded_organization.normal_view[].end` | no | `string` | — |
| `composition_history[].technical_definition.technical_profile.memory.expanded_organization.normal_view[].role` | no | `string` | — |
| `composition_history[].technical_definition.technical_profile.memory.expanded_organization.normal_view[].start` | no | `string` | — |
| `composition_history[].technical_definition.technical_profile.memory.expanded_organization.note` | no | `string` | — |
| `composition_history[].technical_definition.technical_profile.memory.expanded_organization.ram_kb` | no | `number` | — |
| `composition_history[].technical_definition.technical_profile.memory.expanded_organization.refresh` | no | `string` | — |
| `composition_history[].technical_definition.technical_profile.memory.expansion_ref` | no | `string` | pattern: "^(device)\\.[a-z0-9][a-z0-9_.-]*$" |
| `composition_history[].technical_definition.technical_profile.memory.organization` | no | `object` | — |
| `composition_history[].technical_definition.technical_profile.memory.organization.application_memory_profile` | no | `string` | — |
| `composition_history[].technical_definition.technical_profile.memory.organization.common_system_ram_kb` | no | `number` | — |
| `composition_history[].technical_definition.technical_profile.memory.organization.contiguous_lower_ram_kb` | no | `number` | — |
| `composition_history[].technical_definition.technical_profile.memory.organization.controller_id` | no | `string` | pattern: "^(base_part)\\.[a-z0-9][a-z0-9_.-]*$" |
| `composition_history[].technical_definition.technical_profile.memory.organization.dma_addressing` | no | `string` | — |
| `composition_history[].technical_definition.technical_profile.memory.organization.normal_view[]` | no | `array<object>` | — |
| `composition_history[].technical_definition.technical_profile.memory.organization.normal_view[].description` | no | `string` | — |
| `composition_history[].technical_definition.technical_profile.memory.organization.normal_view[].end` | no | `string` | — |
| `composition_history[].technical_definition.technical_profile.memory.organization.normal_view[].role` | no | `string` | — |
| `composition_history[].technical_definition.technical_profile.memory.organization.normal_view[].start` | no | `string` | — |
| `composition_history[].technical_definition.technical_profile.memory.organization.note` | no | `string` | — |
| `composition_history[].technical_definition.technical_profile.memory.organization.refresh` | no | `string` | — |
| `composition_history[].technical_definition.technical_profile.memory.organization_ref` | no | `string` | pattern: "^(technology)\\.[a-z0-9][a-z0-9_.-]*$" |
| `composition_history[].technical_definition.technical_profile.memory.os_rom` | no | `object` | — |
| `composition_history[].technical_definition.technical_profile.memory.os_rom.capacity_bytes` | no | `number` | — |
| `composition_history[].technical_definition.technical_profile.memory.os_rom.execution` | no | `string` | — |
| `composition_history[].technical_definition.technical_profile.memory.os_rom.implementation` | no | `string` | — |
| `composition_history[].technical_definition.technical_profile.memory.parity_bits` | no | `number` | — |
| `composition_history[].technical_definition.technical_profile.memory.physical_population` | no | `object` | — |
| `composition_history[].technical_definition.technical_profile.memory.physical_population.bank_count` | no | `number` | — |
| `composition_history[].technical_definition.technical_profile.memory.physical_population.bank_data_width_bits` | no | `number` | — |
| `composition_history[].technical_definition.technical_profile.memory.physical_population.common_ram_included` | no | `boolean` | — |
| `composition_history[].technical_definition.technical_profile.memory.physical_population.mapping_note` | no | `string` | — |
| `composition_history[].technical_definition.technical_profile.memory.physical_population.parity_bits` | no | `number` | — |
| `composition_history[].technical_definition.technical_profile.memory.physical_population.video_ram_separate` | no | `boolean` | — |
| `composition_history[].technical_definition.technical_profile.memory.population_policy` | no | `string` | — |
| `composition_history[].technical_definition.technical_profile.memory.reliability_policy` | no | `string` | — |
| `composition_history[].technical_definition.technical_profile.memory.sourcing_policy` | no | `string` | — |
| `composition_history[].technical_definition.technical_profile.memory.sprite_physical_population` | no | `object` | — |
| `composition_history[].technical_definition.technical_profile.memory.sprite_physical_population.bank_data_width_bits` | no | `number` | — |
| `composition_history[].technical_definition.technical_profile.memory.sprite_physical_population.separate_bus` | no | `boolean` | — |
| `composition_history[].technical_definition.technical_profile.memory.sprite_physical_population.separate_from_system_and_display_ram` | no | `boolean` | — |
| `composition_history[].technical_definition.technical_profile.memory.system_controller_ref` | no | `string` | pattern: "^(base_part)\\.[a-z0-9][a-z0-9_.-]*$" |
| `composition_history[].technical_definition.technical_profile.memory.upgrade_policy` | no | `string` | — |
| `composition_history[].technical_definition.technical_profile.memory.video_physical_population` | no | `object` | — |
| `composition_history[].technical_definition.technical_profile.memory.video_physical_population.bank_data_width_bits` | no | `number` | — |
| `composition_history[].technical_definition.technical_profile.memory.video_physical_population.separate_from_system_ram` | no | `boolean` | — |
| `composition_history[].technical_definition.technical_profile.network` | no | `object` | — |
| `composition_history[].technical_definition.technical_profile.network.computer_id` | no | `string` | pattern: "^(device)\\.[a-z0-9][a-z0-9_.-]*$" |
| `composition_history[].technical_definition.technical_profile.networking` | no | `object` | — |
| `composition_history[].technical_definition.technical_profile.networking.computer_id` | no | `string` | pattern: "^(device)\\.[a-z0-9][a-z0-9_.-]*$" |
| `composition_history[].technical_definition.technical_profile.networking.implementation` | no | `string` | — |
| `composition_history[].technical_definition.technical_profile.networking.qualified_max_rate_kbps` | no | `number` | — |
| `composition_history[].technical_definition.technical_profile.networking.rate_policy` | no | `string` | — |
| `composition_history[].technical_definition.technical_profile.networking.server_role` | no | `boolean` | — |
| `composition_history[].technical_definition.technical_profile.networking.supported_rates_kbps[]` | no | `array<number>` | — |
| `composition_history[].technical_definition.technical_profile.networking.technology_ids[]` | no | `array<string>` | pattern: "^(technology)\\.[a-z0-9][a-z0-9_.-]*$" |
| `composition_history[].technical_definition.technical_profile.rom_and_cartridges` | no | `object` | — |
| `composition_history[].technical_definition.technical_profile.rom_and_cartridges.mainboard_rom[]` | no | `array<string>` | — |
| `composition_history[].technical_definition.technical_profile.software_compatibility` | no | `object` | — |
| `composition_history[].technical_definition.technical_profile.software_compatibility.adaptive_text` | no | `string` | — |
| `composition_history[].technical_definition.technical_profile.software_compatibility.api_id` | no | `string` | pattern: "^(technology)\\.[a-z0-9][a-z0-9_.-]*$" |
| `composition_history[].technical_definition.technical_profile.software_compatibility.native_40_column_mode` | no | `string` | — |
| `composition_history[].technical_definition.technical_profile.software_compatibility.native_target` | no | `string` | — |
| `composition_history[].technical_definition.technical_profile.software_policy` | no | `string` | — |
| `composition_history[].technical_definition.technical_profile.video` | no | `object` | — |
| `composition_history[].technical_definition.technical_profile.video.controller_id` | no | `string` | pattern: "^(base_part)\\.[a-z0-9][a-z0-9_.-]*$" |
| `composition_history[].technical_definition.technical_profile.video.sprite_memory` | no | `object` | — |
| `composition_history[].technical_definition.technical_profile.video.sprite_memory.bank_data_width_bits` | no | `number` | — |
| `composition_history[].technical_definition.technical_profile.video.sprite_memory.separate_bus` | no | `boolean` | — |
| `composition_history[].technical_definition.technical_profile.video.sprite_memory.separate_from_system_and_display_ram` | no | `boolean` | — |
| `composition_history[].technical_definition.technical_profile.video.sprite_physical_population` | no | `object` | — |
| `composition_history[].technical_definition.technical_profile.video.sprite_physical_population.bank_data_width_bits` | no | `number` | — |
| `composition_history[].technical_definition.technical_profile.video.sprite_physical_population.separate_bus` | no | `boolean` | — |
| `composition_history[].technical_definition.technical_profile.video.sprite_physical_population.separate_from_system_and_display_ram` | no | `boolean` | — |
| `composition_history[].technical_definition.technical_profile.video.video_physical_population` | no | `object` | — |
| `composition_history[].technical_definition.technical_profile.video.video_physical_population.bank_data_width_bits` | no | `number` | — |
| `composition_history[].technical_definition.technical_profile.video.video_physical_population.separate_from_system_ram` | no | `boolean` | — |
| `composition_history[].composition_definition[]` | yes | `array<object>` | — |
| `composition_history[].composition_definition[].id` | yes | `string` | minLength: 1 |
| `composition_history[].composition_definition[].target` | yes | `schema-defined` | — |
| `composition_history[].composition_definition[].quantity` | yes | `number | null` | — |
| `composition_history[].composition_definition[].connection` | no | `schema-defined` | — |
| `composition_history[].composition_definition[].placements[]` | no | `array<object>` | — |
| `composition_history[].composition_definition[].placements[].host_line_id` | yes | `string` | minLength: 1 |
| `composition_history[].composition_definition[].placements[].host_instance` | yes | `integer` | minimum: 1 |
| `composition_history[].composition_definition[].placements[].socket_id` | yes | `string` | minLength: 1 |
| `composition_history[].composition_definition[].placements[].quantity` | yes | `number` | — |
| `composition_history[].composition_definition[].element_type` | no | `string` | minLength: 1 |
| `composition_history[].assembly_requirements[]` | yes | `array<object>` | — |
| `composition_history[].assembly_requirements[].number` | yes | `integer` | minimum: 1 |
| `composition_history[].assembly_requirements[].kind` | yes | `string` | enum: ["selection","interface","electrical","mechanical","software","assembly","testing","reliability"] |
| `composition_history[].assembly_requirements[].description` | yes | `string` | minLength: 1 |
| `composition_history[].assembly_requirements[].subject_ids[]` | no | `array<string>` | pattern: "^(actor\|actor_relationship\|agreement\|assumption\|campaign\|event\|location\|manufacturing_capability\|market_response\|process\|product\|technology\|base_part\|device\|software_edition\|external_product)\\.[a-z0-9][a-z0-9_.-]*$" |
| `composition_history[].expansion_socket_groups[]` | no | `array<object>` | — |
| `composition_history[].expansion_socket_groups[].id` | no | `string` | — |
| `composition_history[].expansion_socket_groups[].name` | no | `string` | — |
| `composition_history[].expansion_socket_groups[].sockets[]` | no | `array<object>` | — |
| `composition_history[].expansion_socket_groups[].sockets[].capacity` | no | `number | null` | — |
| `composition_history[].expansion_socket_groups[].sockets[].compatible_device_ids[]` | no | `array<string>` | pattern: "^(device)\\.[a-z0-9][a-z0-9_.-]*$" |
| `composition_history[].expansion_socket_groups[].sockets[].connection` | no | `string` | — |
| `composition_history[].expansion_socket_groups[].sockets[].device_quantity_limits` | no | `object` | — |
| `composition_history[].expansion_socket_groups[].sockets[].device_quantity_limits.device.aurelia_ram_16kb_card` | no | `number` | — |
| `composition_history[].expansion_socket_groups[].sockets[].id` | no | `string` | — |
| `composition_history[].expansion_socket_groups[].sockets[].installation_multiple` | no | `number` | — |
| `composition_history[].expansion_socket_groups[].sockets[].matched_modules` | no | `boolean` | — |
| `composition_history[].expansion_socket_groups[].sockets[].name` | no | `string` | — |
| `composition_history[].expansion_socket_groups[].sockets[].population_order` | no | `string` | — |
| `composition_history[].expansion_socket_groups[].sockets[].requirements[]` | no | `array<string>` | — |
| `requirements[]` | yes | `array<object>` | — |
| `requirements[].number` | yes | `integer` | minimum: 1 |
| `requirements[].kind` | yes | `string` | enum: ["selection","interface","electrical","mechanical","software","assembly","testing","reliability"] |
| `requirements[].description` | yes | `string` | minLength: 1 |
| `requirements[].subject_ids[]` | no | `array<string>` | pattern: "^(actor\|actor_relationship\|agreement\|assumption\|campaign\|event\|location\|manufacturing_capability\|market_response\|process\|product\|technology\|base_part\|device\|software_edition\|external_product)\\.[a-z0-9][a-z0-9_.-]*$" |
| `technical_specification` | no | `object` | — |
| `technical_specification.chapters[]` | yes | `array<object>` | — |
| `technical_specification.chapters[].number` | yes | `integer` | minimum: 1 |
| `technical_specification.chapters[].chapter_name` | yes | `string` | minLength: 1 |
| `technical_specification.chapters[].description` | yes | `string` | minLength: 1 |
| `technical_specification.parameters[]` | yes | `array<object>` | — |
| `technical_specification.parameters[].key` | yes | `string` | pattern: "^[a-z][a-z0-9_]*$" |
| `technical_specification.parameters[].value` | no | `string | number | null` | — |
| `technical_specification.parameters[].ref_id` | no | `string` | pattern: "^[a-z_]+\\.[a-z0-9][a-z0-9_.-]*$" |
| `technical_specification.parameters[].ref_role` | no | `string` | minLength: 1 |
| `graphic_modes_specification[]` | no | `array<object>` | — |
| `graphic_modes_specification[].id` | yes | `string` | minLength: 1 |
| `graphic_modes_specification[].description` | yes | `string` | minLength: 1 |
| `graphic_modes_specification[].type` | yes | `string` | enum: ["text","bitmap"] |
| `graphic_modes_specification[].width` | yes | `integer | null` | minimum: 1 |
| `graphic_modes_specification[].height` | yes | `integer | null` | minimum: 1 |
| `graphic_modes_specification[].framebuffer_size` | yes | `integer | null` | minimum: 1 |
| `graphic_modes_specification[].double_buffering` | yes | `boolean | null` | — |
| `graphic_modes_specification[].sprites_available` | yes | `integer | null` | minimum: 0 |
| `graphic_modes_specification[].parameters[]` | yes | `array<object>` | — |
| `graphic_modes_specification[].parameters[].key` | yes | `string` | pattern: "^[a-z][a-z0-9_]*$" |
| `graphic_modes_specification[].parameters[].value` | no | `string | number | null` | — |
| `graphic_modes_specification[].parameters[].ref_id` | no | `string` | pattern: "^[a-z_]+\\.[a-z0-9][a-z0-9_.-]*$" |
| `graphic_modes_specification[].parameters[].ref_role` | no | `string` | minLength: 1 |

### event

An occurrence or planned occurrence at a date or over a period, with participants, actions and outcomes.

File: [event.json](../../data_foundation/event.json) · Schema: [event.schema.json](../../schemas/event.schema.json)

```text
event[]
id*: string
title*: string
kind*: string
description*: string
participant*: array<object>
│  └─ actor_id*: string → actor
│  └─ role*: string
subject_ids?: array<string> → any foundation ID
inputs*: array<object>
│  └─ number*: integer
│  └─ type*: string
│  └─ description*: string
│  └─ subject_ids?: array<string> → any foundation ID
│  └─ event_id?: string → event
│  └─ process_id?: string → process
outcomes*: array<object>
│  └─ number*: integer
│  └─ type*: string
│  └─ description*: string
│  └─ subject_ids?: array<string> → any foundation ID
│  └─ event_id?: string → event
│  └─ process_id?: string → process
time*: object
│  └─ value*: string
│  └─ precision*: string
process_ids?: array<schema-defined>
location_ids?: array<string> → location
agreement_id?: string → agreement
```

| Field path | Required in parent | Type | Constraints / allowed values |
| --- | --- | --- | --- |
| `id` | yes | `string` | pattern: "^event\\.[a-z0-9][a-z0-9_.-]*$" |
| `title` | yes | `string` | minLength: 1 |
| `kind` | yes | `string` | minLength: 1 |
| `description` | yes | `string` | minLength: 1 |
| `participant[]` | yes | `array<object>` | minItems: 0 |
| `participant[].actor_id` | yes | `string` | pattern: "^(actor)\\.[a-z0-9][a-z0-9_.-]*$" |
| `participant[].role` | yes | `string` | minLength: 1 |
| `subject_ids[]` | no | `array<string>` | pattern: "^(actor\|actor_relationship\|agreement\|assumption\|campaign\|event\|location\|manufacturing_capability\|market_response\|process\|product\|technology\|base_part\|device\|software_edition\|external_product)\\.[a-z0-9][a-z0-9_.-]*$"; minItems: 0; uniqueItems: true |
| `inputs[]` | yes | `array<object>` | minItems: 0 |
| `inputs[].number` | yes | `integer` | minimum: 1 |
| `inputs[].type` | yes | `string` | enum: ["action","milestone","resource","requirement","acceptance_criterion","deliverable","result","decision","qualification","maturity_transition","market_response","agreement_basis"] |
| `inputs[].description` | yes | `string` | minLength: 1 |
| `inputs[].subject_ids[]` | no | `array<string>` | pattern: "^(actor\|actor_relationship\|agreement\|assumption\|campaign\|event\|location\|manufacturing_capability\|market_response\|process\|product\|technology\|base_part\|device\|software_edition\|external_product)\\.[a-z0-9][a-z0-9_.-]*$"; minItems: 0; uniqueItems: true |
| `inputs[].event_id` | no | `string` | pattern: "^(event)\\.[a-z0-9][a-z0-9_.-]*$" |
| `inputs[].process_id` | no | `string` | pattern: "^(process)\\.[a-z0-9][a-z0-9_.-]*$" |
| `outcomes[]` | yes | `array<object>` | minItems: 0 |
| `outcomes[].number` | yes | `integer` | minimum: 1 |
| `outcomes[].type` | yes | `string` | enum: ["action","milestone","resource","requirement","acceptance_criterion","deliverable","result","decision","qualification","maturity_transition","market_response","agreement_basis"] |
| `outcomes[].description` | yes | `string` | minLength: 1 |
| `outcomes[].subject_ids[]` | no | `array<string>` | pattern: "^(actor\|actor_relationship\|agreement\|assumption\|campaign\|event\|location\|manufacturing_capability\|market_response\|process\|product\|technology\|base_part\|device\|software_edition\|external_product)\\.[a-z0-9][a-z0-9_.-]*$"; minItems: 0; uniqueItems: true |
| `outcomes[].event_id` | no | `string` | pattern: "^(event)\\.[a-z0-9][a-z0-9_.-]*$" |
| `outcomes[].process_id` | no | `string` | pattern: "^(process)\\.[a-z0-9][a-z0-9_.-]*$" |
| `time` | yes | `object` | — |
| `time.value` | yes | `string` | pattern: "^(19[7-9][0-9]\|[2-9][0-9]{3})(-(0[1-9]\|1[0-2])(-(0[1-9]\|[12][0-9]\|3[01]))?)?$" |
| `time.precision` | yes | `string` | enum: ["year","month","day"] |
| `process_ids[]` | no | `array<schema-defined>` | — |
| `location_ids[]` | no | `array<string>` | pattern: "^(location)\\.[a-z0-9][a-z0-9_.-]*$"; minItems: 0; uniqueItems: true |
| `agreement_id` | no | `string` | pattern: "^(agreement)\\.[a-z0-9][a-z0-9_.-]*$" |

### external_product

Descriptive third-party commercial offering with direct role-labelled specification references. Stored in external_products.json.

File: [external_products.json](../../data_foundation/external_products.json) · Schema: [external_product.schema.json](../../schemas/external_product.schema.json)

```text
external_product[]
id*: string
name*: string
description*: string
specification*: array<object>
│  └─ number*: integer
│  └─ chapter_name*: string
│  └─ description*: string
│  └─ parameters*: array<object>
│  │  └─ key*: string
│  │  └─ value*: string
kind?: string
provider_actor_ids?: array<string> → actor
release?: string
impacted_standards?: array<object>
│  └─ standard_id*: string → technology
│  └─ date*: string
│  └─ assumption_description*: string
│  └─ comparison_description*: string
│  └─ outcomes_description*: string
│  └─ parameters*: array<object>
│  │  └─ key*: string
│  │  └─ value*: string
```

| Field path | Required in parent | Type | Constraints / allowed values |
| --- | --- | --- | --- |
| `id` | yes | `string` | pattern: "^external_product\\.[a-z0-9][a-z0-9_.-]*$" |
| `name` | yes | `string` | minLength: 1 |
| `description` | yes | `string` | minLength: 1 |
| `specification[]` | yes | `array<object>` | — |
| `specification[].number` | yes | `integer` | minimum: 1 |
| `specification[].chapter_name` | yes | `string` | minLength: 1 |
| `specification[].description` | yes | `string` | — |
| `specification[].parameters[]` | yes | `array<object>` | — |
| `specification[].parameters[].key` | yes | `string` | pattern: "^[^{}]+$"; minLength: 1 |
| `specification[].parameters[].value` | yes | `string` | — |
| `kind` | no | `string` | enum: ["computer","peripheral","software","service","other"] |
| `provider_actor_ids[]` | no | `array<string>` | pattern: "^actor\\.[a-z0-9][a-z0-9_.-]*$"; minItems: 1; uniqueItems: true |
| `release` | no | `string` | pattern: "^[0-9]{4}(-[0-9]{2}(-[0-9]{2})?)?$" |
| `impacted_standards[]` | no | `array<object>` | minItems: 1 |
| `impacted_standards[].standard_id` | yes | `string` | pattern: "^technology\\.[a-z0-9][a-z0-9_.-]*$" |
| `impacted_standards[].date` | yes | `string` | pattern: "^[0-9]{4}(-[0-9]{2}(-[0-9]{2})?)?$" |
| `impacted_standards[].assumption_description` | yes | `string` | pattern: "\\S"; minLength: 1 |
| `impacted_standards[].comparison_description` | yes | `string` | pattern: "\\S"; minLength: 1 |
| `impacted_standards[].outcomes_description` | yes | `string` | pattern: "\\S"; minLength: 1 |
| `impacted_standards[].parameters[]` | yes | `array<object>` | — |
| `impacted_standards[].parameters[].key` | yes | `string` | pattern: "^[^{}]+$"; minLength: 1 |
| `impacted_standards[].parameters[].value` | yes | `string` | — |

**Direct relationships:** specification entries contain exactly `no`, `description`, one `ref_id` and `ref_role`; numbering is unique within the record. This descriptive identity does not own technical compositions, structured dates or editorial status.

### location

Named places, including hierarchical containment through a parent location.

File: [location.json](../../data_foundation/location.json) · Schema: [location.schema.json](../../schemas/location.schema.json)

```text
location[]
id*: string
name*: string
kind*: string
parent_location_id?: string → location
description?: string
```

| Field path | Required in parent | Type | Constraints / allowed values |
| --- | --- | --- | --- |
| `id` | yes | `string` | pattern: "^location\\.[a-z0-9][a-z0-9_.-]*$" |
| `name` | yes | `string` | minLength: 1 |
| `kind` | yes | `string` | enum: ["country","region","city","venue","facility"] |
| `parent_location_id` | no | `string` | pattern: "^(location)\\.[a-z0-9][a-z0-9_.-]*$" |
| `description` | no | `string` | minLength: 1 |

### manufacturing_capability

Manufacturer- and recipe-scoped capability; maturity transitions are event outcomes.

File: [manufacturing_capability.json](../../data_foundation/manufacturing_capability.json) · Schema: [manufacturing_capability.schema.json](../../schemas/manufacturing_capability.schema.json)

```text
manufacturing_capability[]
id*: string
name*: string
actor_id*: string → actor
location_id?: string → location
technology_id*: string → technology
recipe_kind*: string
product_ids?: array<schema-defined>
description*: string
qualification_requirements*: array<object>
│  └─ number*: integer
│  └─ type*: string
│  └─ description*: string
│  └─ subject_ids?: array<string> → any foundation ID
│  └─ event_id?: string → event
│  └─ process_id?: string → process
base_part_ids?: array<string> → base_part
```

| Field path | Required in parent | Type | Constraints / allowed values |
| --- | --- | --- | --- |
| `id` | yes | `string` | pattern: "^manufacturing_capability\\.[a-z0-9][a-z0-9_.-]*$" |
| `name` | yes | `string` | minLength: 1 |
| `actor_id` | yes | `string` | pattern: "^(actor)\\.[a-z0-9][a-z0-9_.-]*$" |
| `location_id` | no | `string` | pattern: "^(location)\\.[a-z0-9][a-z0-9_.-]*$" |
| `technology_id` | yes | `string` | pattern: "^(technology)\\.[a-z0-9][a-z0-9_.-]*$" |
| `recipe_kind` | yes | `string` | enum: ["logic","SRAM","DRAM","analogue"] |
| `product_ids[]` | no | `array<schema-defined>` | — |
| `description` | yes | `string` | minLength: 1 |
| `qualification_requirements[]` | yes | `array<object>` | minItems: 0 |
| `qualification_requirements[].number` | yes | `integer` | minimum: 1 |
| `qualification_requirements[].type` | yes | `string` | enum: ["action","milestone","resource","requirement","acceptance_criterion","deliverable","result","decision","qualification","maturity_transition","market_response","agreement_basis"] |
| `qualification_requirements[].description` | yes | `string` | minLength: 1 |
| `qualification_requirements[].subject_ids[]` | no | `array<string>` | pattern: "^(actor\|actor_relationship\|agreement\|assumption\|campaign\|event\|location\|manufacturing_capability\|market_response\|process\|product\|technology\|base_part\|device\|software_edition\|external_product)\\.[a-z0-9][a-z0-9_.-]*$"; minItems: 0; uniqueItems: true |
| `qualification_requirements[].event_id` | no | `string` | pattern: "^(event)\\.[a-z0-9][a-z0-9_.-]*$" |
| `qualification_requirements[].process_id` | no | `string` | pattern: "^(process)\\.[a-z0-9][a-z0-9_.-]*$" |
| `base_part_ids[]` | no | `array<string>` | pattern: "^(base_part)\\.[a-z0-9][a-z0-9_.-]*$" |

### market_response

Qualitative market reaction with timing supplied by its event/process carrier.

File: [market_response.json](../../data_foundation/market_response.json) · Schema: [market_response.schema.json](../../schemas/market_response.schema.json)

```text
market_response[]
id*: string
title*: string
kind*: string
respondent_actor_ids*: array<string> → actor
subject_ids*: array<string> → any foundation ID
trigger_ids*: array<string> → event / process / campaign / agreement
description*: string
```

| Field path | Required in parent | Type | Constraints / allowed values |
| --- | --- | --- | --- |
| `id` | yes | `string` | pattern: "^market_response\\.[a-z0-9][a-z0-9_.-]*$" |
| `title` | yes | `string` | minLength: 1 |
| `kind` | yes | `string` | enum: ["adoption","partnership","competing_offer","compatibility_response","purchasing_response","channel_response","market_response","other"] |
| `respondent_actor_ids[]` | yes | `array<string>` | pattern: "^(actor)\\.[a-z0-9][a-z0-9_.-]*$"; minItems: 0; uniqueItems: true |
| `subject_ids[]` | yes | `array<string>` | pattern: "^(actor\|actor_relationship\|agreement\|assumption\|campaign\|event\|location\|manufacturing_capability\|market_response\|process\|product\|technology\|base_part\|device\|software_edition\|external_product)\\.[a-z0-9][a-z0-9_.-]*$"; minItems: 0; uniqueItems: true |
| `trigger_ids[]` | yes | `array<string>` | pattern: "^(event\|process\|campaign\|agreement)\\.[a-z0-9][a-z0-9_.-]*$"; minItems: 0; uniqueItems: true |
| `description` | yes | `string` | minLength: 1 |

### process

An activity extending through time, with participants and milestones.

File: [process.json](../../data_foundation/process.json) · Schema: [process.schema.json](../../schemas/process.schema.json)

```text
process[]
id*: string
title*: string
kind*: string
description*: string
participant*: array<object>
│  └─ actor_id*: string → actor
│  └─ role*: string
subject_ids?: array<string> → any foundation ID
inputs*: array<object>
│  └─ number*: integer
│  └─ type*: string
│  └─ description*: string
│  └─ subject_ids?: array<string> → any foundation ID
│  └─ event_id?: string → event
│  └─ process_id?: string → process
outcomes*: array<object>
│  └─ number*: integer
│  └─ type*: string
│  └─ description*: string
│  └─ subject_ids?: array<string> → any foundation ID
period*: object
│  └─ start*: object
│  │  └─ value*: string | null → event
│  │  └─ precision*: string
│  └─ end*: object
│  │  └─ value*: string | null → event
│  │  └─ precision*: string
steps*: array<object>
│  └─ number*: integer
│  └─ type*: string
│  └─ description*: string
│  └─ event_id?: string → event
│  └─ process_id?: string → process
│  └─ campaign_id?: string → campaign
related_process_ids?: array<string> → process
agreement_id?: string → agreement
category?: string
```

| Field path | Required in parent | Type | Constraints / allowed values |
| --- | --- | --- | --- |
| `id` | yes | `string` | pattern: "^process\\.[a-z0-9][a-z0-9_.-]*$" |
| `title` | yes | `string` | minLength: 1 |
| `kind` | yes | `string` | minLength: 1 |
| `description` | yes | `string` | minLength: 1 |
| `participant[]` | yes | `array<object>` | minItems: 0 |
| `participant[].actor_id` | yes | `string` | pattern: "^(actor)\\.[a-z0-9][a-z0-9_.-]*$" |
| `participant[].role` | yes | `string` | minLength: 1 |
| `subject_ids[]` | no | `array<string>` | pattern: "^(actor\|actor_relationship\|agreement\|assumption\|campaign\|event\|location\|manufacturing_capability\|market_response\|process\|product\|technology\|base_part\|device\|software_edition\|external_product)\\.[a-z0-9][a-z0-9_.-]*$"; minItems: 0; uniqueItems: true |
| `inputs[]` | yes | `array<object>` | minItems: 0 |
| `inputs[].number` | yes | `integer` | minimum: 1 |
| `inputs[].type` | yes | `string` | enum: ["action","milestone","resource","requirement","acceptance_criterion","deliverable","result","decision","qualification","maturity_transition","market_response","agreement_basis"] |
| `inputs[].description` | yes | `string` | minLength: 1 |
| `inputs[].subject_ids[]` | no | `array<string>` | pattern: "^(actor\|actor_relationship\|agreement\|assumption\|campaign\|event\|location\|manufacturing_capability\|market_response\|process\|product\|technology\|base_part\|device\|software_edition\|external_product)\\.[a-z0-9][a-z0-9_.-]*$"; minItems: 0; uniqueItems: true |
| `inputs[].event_id` | no | `string` | pattern: "^(event)\\.[a-z0-9][a-z0-9_.-]*$" |
| `inputs[].process_id` | no | `string` | pattern: "^(process)\\.[a-z0-9][a-z0-9_.-]*$" |
| `outcomes[]` | yes | `array<object>` | minItems: 0 |
| `outcomes[].number` | yes | `integer` | minimum: 1 |
| `outcomes[].type` | yes | `string` | enum: ["action","milestone","resource","requirement","acceptance_criterion","deliverable","result","decision","qualification","maturity_transition","market_response","agreement_basis"] |
| `outcomes[].description` | yes | `string` | minLength: 1 |
| `outcomes[].subject_ids[]` | no | `array<string>` | pattern: "^(actor\|actor_relationship\|agreement\|assumption\|campaign\|event\|location\|manufacturing_capability\|market_response\|process\|product\|technology\|base_part\|device\|software_edition\|external_product)\\.[a-z0-9][a-z0-9_.-]*$"; minItems: 0; uniqueItems: true |
| `period` | yes | `object` | — |
| `period.start` | yes | `object` | — |
| `period.start.value` | yes | `string | null` | — |
| `period.start.precision` | yes | `string` | enum: ["year","month","day","event","unknown"] |
| `period.end` | yes | `object` | — |
| `period.end.value` | yes | `string | null` | — |
| `period.end.precision` | yes | `string` | enum: ["year","month","day","event","unknown"] |
| `steps[]` | yes | `array<object>` | minItems: 0 |
| `steps[].number` | yes | `integer` | minimum: 1 |
| `steps[].type` | yes | `string` | enum: ["action","milestone","resource","requirement","acceptance_criterion","deliverable","result","decision","qualification","maturity_transition","market_response","agreement_basis"] |
| `steps[].description` | yes | `string` | minLength: 1 |
| `steps[].event_id` | no | `string` | pattern: "^(event)\\.[a-z0-9][a-z0-9_.-]*$" |
| `steps[].process_id` | no | `string` | pattern: "^(process)\\.[a-z0-9][a-z0-9_.-]*$" |
| `steps[].campaign_id` | no | `string` | pattern: "^(campaign)\\.[a-z0-9][a-z0-9_.-]*$" |
| `related_process_ids[]` | no | `array<string>` | pattern: "^(process)\\.[a-z0-9][a-z0-9_.-]*$"; minItems: 0; uniqueItems: true |
| `agreement_id` | no | `string` | pattern: "^(agreement)\\.[a-z0-9][a-z0-9_.-]*$" |
| `category` | no | `string` | enum: ["","Adam's personal","Logix/AION investment","Product dev & launch","Ecosystem & Partners","Competition"] |

**Boundary union:** calendar value with year/month/day precision, event ID with `precision: event`, or null with `precision: unknown`. The diagram/catalogue value reference applies only to event anchors.

### product

Logix/AION customer-facing offering. All current offerings have launch pairs; the runtime schema retains optional paired links, checked for campaign ownership and temporal containment.

File: [product.json](../../data_foundation/product.json) · Schema: [product.schema.json](../../schemas/product.schema.json)

```text
product[]
id*: string
name*: string
kind*: string
description*: string
provider_actor_ids*: array<string> → actor
version?: string
specification*: array<object>
│  └─ number*: integer
│  └─ type*: string
│  └─ description*: string
│  └─ value?: string | number | boolean
offering_category?: string
technical_identity?: object
│  └─ record_id*: string → base_part / device / software_edition
launch_campaign_id?: string → campaign
composition_history?: array<object>
│  └─ version_number*: integer
│  └─ description*: string
│  └─ effective_from*: schema-defined
│  └─ effective_until*: schema-defined
│  └─ composition_definition*: array<object>
│  │  └─ id*: string
│  │  └─ target*: schema-defined
│  │  └─ quantity*: number | null
│  │  └─ connection?: schema-defined
│  │  └─ placements?: array<object>
│  │  │  └─ host_line_id*: string
│  │  │  └─ host_instance*: integer
│  │  │  └─ socket_id*: string
│  │  │  └─ quantity*: number
│  │  └─ element_type?: string
│  └─ assembly_requirements*: array<object>
│  │  └─ number*: integer
│  │  └─ kind*: string
│  │  └─ description*: string
│  │  └─ subject_ids?: array<string> → any foundation ID
requirements?: array<object>
│  └─ number*: integer
│  └─ kind*: string
│  └─ description*: string
│  └─ subject_ids?: array<string> → any foundation ID
launch_event_id?: string → event
```

| Field path | Required in parent | Type | Constraints / allowed values |
| --- | --- | --- | --- |
| `id` | yes | `string` | pattern: "^product\\.[a-z0-9][a-z0-9_.-]*$" |
| `name` | yes | `string` | minLength: 1 |
| `kind` | yes | `string` | enum: ["computer","hardware","software","software_edition","bundle","service","chip","family"] |
| `description` | yes | `string` | minLength: 1 |
| `provider_actor_ids[]` | yes | `array<string>` | pattern: "^(actor)\\.[a-z0-9][a-z0-9_.-]*$"; minItems: 0; uniqueItems: true |
| `version` | no | `string` | minLength: 1 |
| `specification[]` | yes | `array<object>` | minItems: 0 |
| `specification[].number` | yes | `integer` | minimum: 1 |
| `specification[].type` | yes | `string` | minLength: 1 |
| `specification[].description` | yes | `string` | — |
| `specification[].value` | no | `string | number | boolean` | — |
| `offering_category` | no | `string` | enum: ["computer","computer_software_bundle","expansion_kit","software","computer_system","service","peripheral","software_cartridge"] |
| `technical_identity` | no | `object` | — |
| `technical_identity.record_id` | yes | `string` | pattern: "^(base_part\|device\|software_edition)\\.[a-z0-9][a-z0-9_.-]*$" |
| `launch_campaign_id` | no | `string` | pattern: "^(campaign)\\.[a-z0-9][a-z0-9_.-]*$" |
| `composition_history[]` | no | `array<object>` | — |
| `composition_history[].version_number` | yes | `integer` | minimum: 1 |
| `composition_history[].description` | yes | `string` | minLength: 1 |
| `composition_history[].effective_from` | yes | `schema-defined` | — |
| `composition_history[].effective_until` | yes | `schema-defined` | — |
| `composition_history[].composition_definition[]` | yes | `array<object>` | — |
| `composition_history[].composition_definition[].id` | yes | `string` | minLength: 1 |
| `composition_history[].composition_definition[].target` | yes | `schema-defined` | — |
| `composition_history[].composition_definition[].quantity` | yes | `number | null` | — |
| `composition_history[].composition_definition[].connection` | no | `schema-defined` | — |
| `composition_history[].composition_definition[].placements[]` | no | `array<object>` | — |
| `composition_history[].composition_definition[].placements[].host_line_id` | yes | `string` | minLength: 1 |
| `composition_history[].composition_definition[].placements[].host_instance` | yes | `integer` | minimum: 1 |
| `composition_history[].composition_definition[].placements[].socket_id` | yes | `string` | minLength: 1 |
| `composition_history[].composition_definition[].placements[].quantity` | yes | `number` | — |
| `composition_history[].composition_definition[].element_type` | no | `string` | minLength: 1 |
| `composition_history[].assembly_requirements[]` | yes | `array<object>` | — |
| `composition_history[].assembly_requirements[].number` | yes | `integer` | minimum: 1 |
| `composition_history[].assembly_requirements[].kind` | yes | `string` | enum: ["selection","interface","electrical","mechanical","software","assembly","testing","reliability"] |
| `composition_history[].assembly_requirements[].description` | yes | `string` | minLength: 1 |
| `composition_history[].assembly_requirements[].subject_ids[]` | no | `array<string>` | pattern: "^(actor\|actor_relationship\|agreement\|assumption\|campaign\|event\|location\|manufacturing_capability\|market_response\|process\|product\|technology\|base_part\|device\|software_edition\|external_product)\\.[a-z0-9][a-z0-9_.-]*$" |
| `requirements[]` | no | `array<object>` | — |
| `requirements[].number` | yes | `integer` | minimum: 1 |
| `requirements[].kind` | yes | `string` | enum: ["selection","interface","electrical","mechanical","software","assembly","testing","reliability"] |
| `requirements[].description` | yes | `string` | minLength: 1 |
| `requirements[].subject_ids[]` | no | `array<string>` | pattern: "^(actor\|actor_relationship\|agreement\|assumption\|campaign\|event\|location\|manufacturing_capability\|market_response\|process\|product\|technology\|base_part\|device\|software_edition\|external_product)\\.[a-z0-9][a-z0-9_.-]*$" |
| `launch_event_id` | no | `string` | pattern: "^event\\.[a-z0-9][a-z0-9_.-]*$" |

**Runtime compatibility:** the schema permits both launch links to be absent and still accepts legacy product kinds. Current authoring rules and all accepted products use explicit pairs and customer-facing kinds. The optional catalogue profile requires these rules; it is not yet a saving-service gate. When supplied, a launch event must have single-parent ownership through the campaign execution process and fit its period.

### software_edition

Technical software implementation and versioned definition, separate from commercial rights and physical delivery.

File: [software_edition.json](../../data_foundation/software_edition.json) · Schema: [software_edition.schema.json](../../schemas/software_edition.schema.json)

```text
software_edition[]
id*: string
name*: string
description*: string
provider_actor_ids*: array<string> → actor
technology_ids*: array<string> → technology
family_name*: string
version*: string
edition*: string
composition_history*: array<object>
│  └─ version_number*: integer
│  └─ description*: string
│  └─ effective_from*: schema-defined
│  └─ effective_until*: schema-defined
│  └─ technical_definition*: object
│  │  └─ abacus_file_integration?: object
│  │  │  └─ concurrency?: string
│  │  │  └─ cross_version_policy?: string
│  │  │  └─ format_policy?: string
│  │  │  └─ formula_policy?: string
│  │  │  └─ memory_policy?: string
│  │  │  └─ model?: string
│  │  │  └─ save_policy?: string
│  │  └─ adds?: array<string>
│  │  └─ api_compatibility?: string
│  │  └─ architecture?: object
│  │  │  └─ client_server?: boolean
│  │  │  └─ database?: string
│  │  │  └─ network_id?: string → technology
│  │  │  └─ resource_planning?: object
│  │  │  │  └─ basis?: string
│  │  │  │  └─ illustrative_dram_budget_bytes?: object
│  │  │  │  │  └─ applications?: number
│  │  │  │  │  └─ filesystem_buffers?: number
│  │  │  │  │  └─ kernel_state_tables_stacks?: number
│  │  │  │  │  └─ process_translation_metadata?: number
│  │  │  │  │  └─ services_patches_reserve?: number
│  │  │  │  │  └─ terminal_ui_input?: number
│  │  │  │  └─ minimum_dram_bytes?: number
│  │  │  │  └─ minimum_os_rom_bytes?: number
│  │  │  │  └─ preferred_dram_bytes?: number
│  │  │  └─ server?: string → device
│  │  │  └─ server_edition_id?: string → software_edition
│  │  └─ artemis_native_extensions?: array<string>
│  │  └─ base_version?: string
│  │  └─ compatibility_notes?: array<string>
│  │  └─ compatibility_policy?: object
│  │  │  └─ applications?: string
│  │  │  └─ binary?: string
│  │  │  └─ certification?: string
│  │  │  └─ delivery?: string
│  │  │  └─ eligibility?: string
│  │  │  └─ hardware?: string
│  │  │  └─ scope?: string
│  │  └─ components?: object
│  │  │  └─ mainboard_rom?: array<string>
│  │  │  └─ system_cartridge?: array<string>
│  │  └─ contents?: array<string>
│  │  └─ data_interchange?: object
│  │  │  └─ bpi_continuity?: string
│  │  │  └─ contract?: string
│  │  │  └─ csv?: string
│  │  │  └─ export_definition_id?: string → software_edition
│  │  │  └─ migration?: string
│  │  │  └─ partner?: string
│  │  │  └─ vsam?: string
│  │  │  └─ vsam_conversion?: string
│  │  └─ dependency_ids?: array<string> → device / software_edition / technology
│  │  └─ distribution?: object
│  │  │  └─ channel?: string
│  │  │  └─ data_access?: string
│  │  │  └─ disk_format?: string
│  │  │  └─ execution?: schema-defined
│  │  │  └─ fulfillment?: string
│  │  │  └─ installation?: string
│  │  │  └─ medium?: string
│  │  │  └─ network_operation?: string
│  │  │  └─ toolchain?: string
│  │  └─ embedded_abacus_integration_id?: string → technology
│  │  └─ execution_target?: string
│  │  └─ explicitly_not_assumed?: array<string>
│  │  └─ extensions?: array<string>
│  │  └─ features?: array<string>
│  │  └─ features_id?: string → technology
│  │  └─ forward_compatibility_commitment?: object
│  │  │  └─ delivery_requirements?: string
│  │  │  └─ exclusions?: string
│  │  │  └─ scope?: string
│  │  └─ implementation?: schema-defined
│  │  └─ internal_organization?: array<object>
│  │  │  └─ description?: string
│  │  │  └─ diagram_label?: string
│  │  │  └─ id?: string
│  │  │  └─ name?: string
│  │  │  └─ residence?: string
│  │  │  └─ responsibility?: string
│  │  └─ internal_relationships?: array<array>
│  │  └─ logix_requirements?: array<string>
│  │  └─ memory_discovery_id?: string → technology
│  │  └─ minimum_resources?: object
│  │  │  └─ application_ram_bytes?: null
│  │  │  └─ installed_ram_kb?: number | null
│  │  │  └─ rom_bytes?: number | null
│  │  └─ modules?: array<object>
│  │  │  └─ features?: array<string>
│  │  │  └─ name?: string
│  │  └─ network_link_policy?: object
│  │  │  └─ driver_contract?: string
│  │  │  └─ link_layer_id?: string → technology
│  │  └─ platform_policy?: string
│  │  └─ platform_support?: array<object>
│  │  │  └─ computer_id?: string → device / product / external_product
│  │  └─ portability_contract?: object
│  │  │  └─ api_id?: string → technology
│  │  │  └─ display?: string
│  │  │  └─ memory?: string
│  │  │  └─ migration?: string
│  │  │  └─ shared_logic?: string
│  │  │  └─ storage?: string
│  │  └─ portable_runtime?: object
│  │  │  └─ abi_policy?: string
│  │  │  └─ api_id?: string → technology
│  │  │  └─ capability_discovery?: string
│  │  │  └─ display_id?: string → technology
│  │  │  └─ implementation_target?: string
│  │  │  └─ ownership?: string
│  │  └─ programmatic_file_access?: string
│  │  └─ relationship?: string
│  │  └─ release_scope?: object
│  │  │  └─ acceptance_requirements?: array<string>
│  │  │  └─ acceptance_workflow?: string
│  │  │  └─ initial?: string
│  │  │  └─ later?: string
│  │  │  └─ later_milestones?: array<string>
│  │  │  └─ launch?: string
│  │  │  └─ resource_policy?: string
│  │  └─ reporting?: object
│  │  │  └─ chart_types?: array<string>
│  │  │  └─ continuity?: string
│  │  │  └─ output?: string
│  │  │  └─ presentation?: string
│  │  └─ role?: string
│  │  └─ runtime_notes?: array<string>
│  │  └─ specification?: schema-defined
│  │  └─ subcomponents?: array<object>
│  │  │  └─ description?: string
│  │  │  └─ id?: string
│  │  │  └─ name?: string
│  │  └─ system_dependencies?: array<object>
│  │  │  └─ component_id?: string
│  │  │  └─ description?: string
│  │  │  └─ name?: string
│  │  │  └─ software_id?: string → software_edition
│  │  └─ technology_id?: string → technology
│  │  └─ toolchain?: object
│  │  │  └─ components?: array<string>
│  │  │  └─ development_workflow?: array<string>
│  │  │  └─ host?: array<string> → device
│  │  │  └─ language_contract_id?: string → technology
│  │  │  └─ layout_tests?: array<string>
│  │  │  └─ optional_development_features?: array<string>
│  │  │  └─ profiles?: array<string>
│  │  │  └─ resource_tests?: array<string>
│  │  │  └─ runtime_contract_id?: string → technology
│  │  │  └─ target_isolation?: string
│  │  │  └─ targets?: array<string>
│  │  └─ tui_features?: array<object>
│  │  │  └─ description?: string
│  │  │  └─ name?: string
│  │  └─ tui_integration?: string
│  │  └─ tui_ownership?: object
│  │  │  └─ boundary?: string
│  │  │  └─ consumers?: array<string> → software_edition
│  │  │  └─ interface_id?: string → technology
│  │  │  └─ owner?: string
│  │  └─ validation?: string
│  │  └─ vanilla_architecture?: object
│  │  │  └─ application_entry?: string
│  │  │  └─ changes_from_1_3?: array<string>
│  │  │  └─ components?: array<object>
│  │  │  │  └─ description?: string
│  │  │  │  └─ id?: string
│  │  │  │  └─ name?: string
│  │  │  └─ execution_model?: string
│  │  │  └─ limits?: array<string>
│  │  │  └─ memory_layout?: array<object>
│  │  │  │  └─ purpose?: string
│  │  │  │  └─ region?: string
│  │  │  └─ program_load_address?: string
│  └─ composition_definition*: array<object>
│  │  └─ id*: string
│  │  └─ target*: schema-defined
│  │  └─ quantity*: number | null
│  │  └─ connection?: schema-defined
│  │  └─ placements?: array<object>
│  │  │  └─ host_line_id*: string
│  │  │  └─ host_instance*: integer
│  │  │  └─ socket_id*: string
│  │  │  └─ quantity*: number
│  │  └─ element_type?: string
technical_specification?: object
│  └─ chapters*: array<object>
│  │  └─ number*: integer
│  │  └─ chapter_name*: string
│  │  └─ description*: string
│  └─ parameters*: array<object>
│  │  └─ key*: string
│  │  └─ value?: string | number | null
│  │  └─ ref_id?: string → actor / technology / base_part / device / software_edition / product / external_product / manufacturing_capability
│  │  └─ ref_role?: string
```

| Field path | Required in parent | Type | Constraints / allowed values |
| --- | --- | --- | --- |
| `id` | yes | `string` | pattern: "^(software_edition)\\.[a-z0-9][a-z0-9_.-]*$" |
| `name` | yes | `string` | minLength: 1 |
| `description` | yes | `string` | minLength: 1 |
| `provider_actor_ids[]` | yes | `array<string>` | pattern: "^(actor)\\.[a-z0-9][a-z0-9_.-]*$" |
| `technology_ids[]` | yes | `array<string>` | pattern: "^(technology)\\.[a-z0-9][a-z0-9_.-]*$" |
| `family_name` | yes | `string` | minLength: 1 |
| `version` | yes | `string` | minLength: 1 |
| `edition` | yes | `string` | minLength: 1 |
| `composition_history[]` | yes | `array<object>` | — |
| `composition_history[].version_number` | yes | `integer` | minimum: 1 |
| `composition_history[].description` | yes | `string` | minLength: 1 |
| `composition_history[].effective_from` | yes | `schema-defined` | — |
| `composition_history[].effective_until` | yes | `schema-defined` | — |
| `composition_history[].technical_definition` | yes | `object` | — |
| `composition_history[].technical_definition.abacus_file_integration` | no | `object` | — |
| `composition_history[].technical_definition.abacus_file_integration.concurrency` | no | `string` | — |
| `composition_history[].technical_definition.abacus_file_integration.cross_version_policy` | no | `string` | — |
| `composition_history[].technical_definition.abacus_file_integration.format_policy` | no | `string` | — |
| `composition_history[].technical_definition.abacus_file_integration.formula_policy` | no | `string` | — |
| `composition_history[].technical_definition.abacus_file_integration.memory_policy` | no | `string` | — |
| `composition_history[].technical_definition.abacus_file_integration.model` | no | `string` | — |
| `composition_history[].technical_definition.abacus_file_integration.save_policy` | no | `string` | — |
| `composition_history[].technical_definition.adds[]` | no | `array<string>` | — |
| `composition_history[].technical_definition.api_compatibility` | no | `string` | — |
| `composition_history[].technical_definition.architecture` | no | `object` | — |
| `composition_history[].technical_definition.architecture.client_server` | no | `boolean` | — |
| `composition_history[].technical_definition.architecture.database` | no | `string` | — |
| `composition_history[].technical_definition.architecture.network_id` | no | `string` | pattern: "^(technology)\\.[a-z0-9][a-z0-9_.-]*$" |
| `composition_history[].technical_definition.architecture.resource_planning` | no | `object` | — |
| `composition_history[].technical_definition.architecture.resource_planning.basis` | no | `string` | — |
| `composition_history[].technical_definition.architecture.resource_planning.illustrative_dram_budget_bytes` | no | `object` | — |
| `composition_history[].technical_definition.architecture.resource_planning.illustrative_dram_budget_bytes.applications` | no | `number` | — |
| `composition_history[].technical_definition.architecture.resource_planning.illustrative_dram_budget_bytes.filesystem_buffers` | no | `number` | — |
| `composition_history[].technical_definition.architecture.resource_planning.illustrative_dram_budget_bytes.kernel_state_tables_stacks` | no | `number` | — |
| `composition_history[].technical_definition.architecture.resource_planning.illustrative_dram_budget_bytes.process_translation_metadata` | no | `number` | — |
| `composition_history[].technical_definition.architecture.resource_planning.illustrative_dram_budget_bytes.services_patches_reserve` | no | `number` | — |
| `composition_history[].technical_definition.architecture.resource_planning.illustrative_dram_budget_bytes.terminal_ui_input` | no | `number` | — |
| `composition_history[].technical_definition.architecture.resource_planning.minimum_dram_bytes` | no | `number` | — |
| `composition_history[].technical_definition.architecture.resource_planning.minimum_os_rom_bytes` | no | `number` | — |
| `composition_history[].technical_definition.architecture.resource_planning.preferred_dram_bytes` | no | `number` | — |
| `composition_history[].technical_definition.architecture.server` | no | `string` | pattern: "^(device)\\.[a-z0-9][a-z0-9_.-]*$" |
| `composition_history[].technical_definition.architecture.server_edition_id` | no | `string` | pattern: "^(software_edition)\\.[a-z0-9][a-z0-9_.-]*$" |
| `composition_history[].technical_definition.artemis_native_extensions[]` | no | `array<string>` | — |
| `composition_history[].technical_definition.base_version` | no | `string` | — |
| `composition_history[].technical_definition.compatibility_notes[]` | no | `array<string>` | — |
| `composition_history[].technical_definition.compatibility_policy` | no | `object` | — |
| `composition_history[].technical_definition.compatibility_policy.applications` | no | `string` | — |
| `composition_history[].technical_definition.compatibility_policy.binary` | no | `string` | — |
| `composition_history[].technical_definition.compatibility_policy.certification` | no | `string` | — |
| `composition_history[].technical_definition.compatibility_policy.delivery` | no | `string` | — |
| `composition_history[].technical_definition.compatibility_policy.eligibility` | no | `string` | — |
| `composition_history[].technical_definition.compatibility_policy.hardware` | no | `string` | — |
| `composition_history[].technical_definition.compatibility_policy.scope` | no | `string` | — |
| `composition_history[].technical_definition.components` | no | `object` | — |
| `composition_history[].technical_definition.components.mainboard_rom[]` | no | `array<string>` | — |
| `composition_history[].technical_definition.components.system_cartridge[]` | no | `array<string>` | — |
| `composition_history[].technical_definition.contents[]` | no | `array<string>` | — |
| `composition_history[].technical_definition.data_interchange` | no | `object` | — |
| `composition_history[].technical_definition.data_interchange.bpi_continuity` | no | `string` | — |
| `composition_history[].technical_definition.data_interchange.contract` | no | `string` | — |
| `composition_history[].technical_definition.data_interchange.csv` | no | `string` | — |
| `composition_history[].technical_definition.data_interchange.export_definition_id` | no | `string` | pattern: "^(software_edition)\\.[a-z0-9][a-z0-9_.-]*$" |
| `composition_history[].technical_definition.data_interchange.migration` | no | `string` | — |
| `composition_history[].technical_definition.data_interchange.partner` | no | `string` | — |
| `composition_history[].technical_definition.data_interchange.vsam` | no | `string` | — |
| `composition_history[].technical_definition.data_interchange.vsam_conversion` | no | `string` | — |
| `composition_history[].technical_definition.dependency_ids[]` | no | `array<string>` | pattern: "^(device\|software_edition\|technology)\\.[a-z0-9][a-z0-9_.-]*$" |
| `composition_history[].technical_definition.distribution` | no | `object` | — |
| `composition_history[].technical_definition.distribution.channel` | no | `string` | — |
| `composition_history[].technical_definition.distribution.data_access` | no | `string` | — |
| `composition_history[].technical_definition.distribution.disk_format` | no | `string` | — |
| `composition_history[].technical_definition.distribution.execution` | no | `schema-defined` | — |
| `composition_history[].technical_definition.distribution.fulfillment` | no | `string` | — |
| `composition_history[].technical_definition.distribution.installation` | no | `string` | — |
| `composition_history[].technical_definition.distribution.medium` | no | `string` | — |
| `composition_history[].technical_definition.distribution.network_operation` | no | `string` | — |
| `composition_history[].technical_definition.distribution.toolchain` | no | `string` | — |
| `composition_history[].technical_definition.embedded_abacus_integration_id` | no | `string` | pattern: "^(technology)\\.[a-z0-9][a-z0-9_.-]*$" |
| `composition_history[].technical_definition.execution_target` | no | `string` | — |
| `composition_history[].technical_definition.explicitly_not_assumed[]` | no | `array<string>` | — |
| `composition_history[].technical_definition.extensions[]` | no | `array<string>` | — |
| `composition_history[].technical_definition.features[]` | no | `array<string>` | — |
| `composition_history[].technical_definition.features_id` | no | `string` | pattern: "^(technology)\\.[a-z0-9][a-z0-9_.-]*$" |
| `composition_history[].technical_definition.forward_compatibility_commitment` | no | `object` | — |
| `composition_history[].technical_definition.forward_compatibility_commitment.delivery_requirements` | no | `string` | — |
| `composition_history[].technical_definition.forward_compatibility_commitment.exclusions` | no | `string` | — |
| `composition_history[].technical_definition.forward_compatibility_commitment.scope` | no | `string` | — |
| `composition_history[].technical_definition.implementation` | no | `schema-defined` | — |
| `composition_history[].technical_definition.internal_organization[]` | no | `array<object>` | — |
| `composition_history[].technical_definition.internal_organization[].description` | no | `string` | — |
| `composition_history[].technical_definition.internal_organization[].diagram_label` | no | `string` | — |
| `composition_history[].technical_definition.internal_organization[].id` | no | `string` | — |
| `composition_history[].technical_definition.internal_organization[].name` | no | `string` | — |
| `composition_history[].technical_definition.internal_organization[].residence` | no | `string` | — |
| `composition_history[].technical_definition.internal_organization[].responsibility` | no | `string` | — |
| `composition_history[].technical_definition.internal_relationships[]` | no | `array<array>` | — |
| `composition_history[].technical_definition.logix_requirements[]` | no | `array<string>` | — |
| `composition_history[].technical_definition.memory_discovery_id` | no | `string` | pattern: "^(technology)\\.[a-z0-9][a-z0-9_.-]*$" |
| `composition_history[].technical_definition.minimum_resources` | no | `object` | — |
| `composition_history[].technical_definition.minimum_resources.application_ram_bytes` | no | `null` | — |
| `composition_history[].technical_definition.minimum_resources.installed_ram_kb` | no | `number | null` | — |
| `composition_history[].technical_definition.minimum_resources.rom_bytes` | no | `number | null` | — |
| `composition_history[].technical_definition.modules[]` | no | `array<object>` | — |
| `composition_history[].technical_definition.modules[].features[]` | no | `array<string>` | — |
| `composition_history[].technical_definition.modules[].name` | no | `string` | — |
| `composition_history[].technical_definition.network_link_policy` | no | `object` | — |
| `composition_history[].technical_definition.network_link_policy.driver_contract` | no | `string` | — |
| `composition_history[].technical_definition.network_link_policy.link_layer_id` | no | `string` | pattern: "^(technology)\\.[a-z0-9][a-z0-9_.-]*$" |
| `composition_history[].technical_definition.platform_policy` | no | `string` | — |
| `composition_history[].technical_definition.platform_support[]` | no | `array<object>` | — |
| `composition_history[].technical_definition.platform_support[].computer_id` | no | `string` | pattern: "^(device\|product\|external_product)\\.[a-z0-9][a-z0-9_.-]*$" |
| `composition_history[].technical_definition.portability_contract` | no | `object` | — |
| `composition_history[].technical_definition.portability_contract.api_id` | no | `string` | pattern: "^(technology)\\.[a-z0-9][a-z0-9_.-]*$" |
| `composition_history[].technical_definition.portability_contract.display` | no | `string` | — |
| `composition_history[].technical_definition.portability_contract.memory` | no | `string` | — |
| `composition_history[].technical_definition.portability_contract.migration` | no | `string` | — |
| `composition_history[].technical_definition.portability_contract.shared_logic` | no | `string` | — |
| `composition_history[].technical_definition.portability_contract.storage` | no | `string` | — |
| `composition_history[].technical_definition.portable_runtime` | no | `object` | — |
| `composition_history[].technical_definition.portable_runtime.abi_policy` | no | `string` | — |
| `composition_history[].technical_definition.portable_runtime.api_id` | no | `string` | pattern: "^(technology)\\.[a-z0-9][a-z0-9_.-]*$" |
| `composition_history[].technical_definition.portable_runtime.capability_discovery` | no | `string` | — |
| `composition_history[].technical_definition.portable_runtime.display_id` | no | `string` | pattern: "^(technology)\\.[a-z0-9][a-z0-9_.-]*$" |
| `composition_history[].technical_definition.portable_runtime.implementation_target` | no | `string` | — |
| `composition_history[].technical_definition.portable_runtime.ownership` | no | `string` | — |
| `composition_history[].technical_definition.programmatic_file_access` | no | `string` | — |
| `composition_history[].technical_definition.relationship` | no | `string` | — |
| `composition_history[].technical_definition.release_scope` | no | `object` | — |
| `composition_history[].technical_definition.release_scope.acceptance_requirements[]` | no | `array<string>` | — |
| `composition_history[].technical_definition.release_scope.acceptance_workflow` | no | `string` | — |
| `composition_history[].technical_definition.release_scope.initial` | no | `string` | — |
| `composition_history[].technical_definition.release_scope.later` | no | `string` | — |
| `composition_history[].technical_definition.release_scope.later_milestones[]` | no | `array<string>` | — |
| `composition_history[].technical_definition.release_scope.launch` | no | `string` | — |
| `composition_history[].technical_definition.release_scope.resource_policy` | no | `string` | — |
| `composition_history[].technical_definition.reporting` | no | `object` | — |
| `composition_history[].technical_definition.reporting.chart_types[]` | no | `array<string>` | — |
| `composition_history[].technical_definition.reporting.continuity` | no | `string` | — |
| `composition_history[].technical_definition.reporting.output` | no | `string` | — |
| `composition_history[].technical_definition.reporting.presentation` | no | `string` | — |
| `composition_history[].technical_definition.role` | no | `string` | — |
| `composition_history[].technical_definition.runtime_notes[]` | no | `array<string>` | — |
| `composition_history[].technical_definition.specification` | no | `schema-defined` | — |
| `composition_history[].technical_definition.subcomponents[]` | no | `array<object>` | — |
| `composition_history[].technical_definition.subcomponents[].description` | no | `string` | — |
| `composition_history[].technical_definition.subcomponents[].id` | no | `string` | — |
| `composition_history[].technical_definition.subcomponents[].name` | no | `string` | — |
| `composition_history[].technical_definition.system_dependencies[]` | no | `array<object>` | — |
| `composition_history[].technical_definition.system_dependencies[].component_id` | no | `string` | — |
| `composition_history[].technical_definition.system_dependencies[].description` | no | `string` | — |
| `composition_history[].technical_definition.system_dependencies[].name` | no | `string` | — |
| `composition_history[].technical_definition.system_dependencies[].software_id` | no | `string` | pattern: "^(software_edition)\\.[a-z0-9][a-z0-9_.-]*$" |
| `composition_history[].technical_definition.technology_id` | no | `string` | pattern: "^(technology)\\.[a-z0-9][a-z0-9_.-]*$" |
| `composition_history[].technical_definition.toolchain` | no | `object` | — |
| `composition_history[].technical_definition.toolchain.components[]` | no | `array<string>` | — |
| `composition_history[].technical_definition.toolchain.development_workflow[]` | no | `array<string>` | — |
| `composition_history[].technical_definition.toolchain.host[]` | no | `array<string>` | pattern: "^(device)\\.[a-z0-9][a-z0-9_.-]*$" |
| `composition_history[].technical_definition.toolchain.language_contract_id` | no | `string` | pattern: "^(technology)\\.[a-z0-9][a-z0-9_.-]*$" |
| `composition_history[].technical_definition.toolchain.layout_tests[]` | no | `array<string>` | — |
| `composition_history[].technical_definition.toolchain.optional_development_features[]` | no | `array<string>` | — |
| `composition_history[].technical_definition.toolchain.profiles[]` | no | `array<string>` | — |
| `composition_history[].technical_definition.toolchain.resource_tests[]` | no | `array<string>` | — |
| `composition_history[].technical_definition.toolchain.runtime_contract_id` | no | `string` | pattern: "^(technology)\\.[a-z0-9][a-z0-9_.-]*$" |
| `composition_history[].technical_definition.toolchain.target_isolation` | no | `string` | — |
| `composition_history[].technical_definition.toolchain.targets[]` | no | `array<string>` | — |
| `composition_history[].technical_definition.tui_features[]` | no | `array<object>` | — |
| `composition_history[].technical_definition.tui_features[].description` | no | `string` | — |
| `composition_history[].technical_definition.tui_features[].name` | no | `string` | — |
| `composition_history[].technical_definition.tui_integration` | no | `string` | — |
| `composition_history[].technical_definition.tui_ownership` | no | `object` | — |
| `composition_history[].technical_definition.tui_ownership.boundary` | no | `string` | — |
| `composition_history[].technical_definition.tui_ownership.consumers[]` | no | `array<string>` | pattern: "^(software_edition)\\.[a-z0-9][a-z0-9_.-]*$" |
| `composition_history[].technical_definition.tui_ownership.interface_id` | no | `string` | pattern: "^(technology)\\.[a-z0-9][a-z0-9_.-]*$" |
| `composition_history[].technical_definition.tui_ownership.owner` | no | `string` | — |
| `composition_history[].technical_definition.validation` | no | `string` | — |
| `composition_history[].technical_definition.vanilla_architecture` | no | `object` | — |
| `composition_history[].technical_definition.vanilla_architecture.application_entry` | no | `string` | — |
| `composition_history[].technical_definition.vanilla_architecture.changes_from_1_3[]` | no | `array<string>` | — |
| `composition_history[].technical_definition.vanilla_architecture.components[]` | no | `array<object>` | — |
| `composition_history[].technical_definition.vanilla_architecture.components[].description` | no | `string` | — |
| `composition_history[].technical_definition.vanilla_architecture.components[].id` | no | `string` | — |
| `composition_history[].technical_definition.vanilla_architecture.components[].name` | no | `string` | — |
| `composition_history[].technical_definition.vanilla_architecture.execution_model` | no | `string` | — |
| `composition_history[].technical_definition.vanilla_architecture.limits[]` | no | `array<string>` | — |
| `composition_history[].technical_definition.vanilla_architecture.memory_layout[]` | no | `array<object>` | — |
| `composition_history[].technical_definition.vanilla_architecture.memory_layout[].purpose` | no | `string` | — |
| `composition_history[].technical_definition.vanilla_architecture.memory_layout[].region` | no | `string` | — |
| `composition_history[].technical_definition.vanilla_architecture.program_load_address` | no | `string` | — |
| `composition_history[].composition_definition[]` | yes | `array<object>` | — |
| `composition_history[].composition_definition[].id` | yes | `string` | minLength: 1 |
| `composition_history[].composition_definition[].target` | yes | `schema-defined` | — |
| `composition_history[].composition_definition[].quantity` | yes | `number | null` | — |
| `composition_history[].composition_definition[].connection` | no | `schema-defined` | — |
| `composition_history[].composition_definition[].placements[]` | no | `array<object>` | — |
| `composition_history[].composition_definition[].placements[].host_line_id` | yes | `string` | minLength: 1 |
| `composition_history[].composition_definition[].placements[].host_instance` | yes | `integer` | minimum: 1 |
| `composition_history[].composition_definition[].placements[].socket_id` | yes | `string` | minLength: 1 |
| `composition_history[].composition_definition[].placements[].quantity` | yes | `number` | — |
| `composition_history[].composition_definition[].element_type` | no | `string` | minLength: 1 |
| `technical_specification` | no | `object` | — |
| `technical_specification.chapters[]` | yes | `array<object>` | — |
| `technical_specification.chapters[].number` | yes | `integer` | minimum: 1 |
| `technical_specification.chapters[].chapter_name` | yes | `string` | minLength: 1 |
| `technical_specification.chapters[].description` | yes | `string` | minLength: 1 |
| `technical_specification.parameters[]` | yes | `array<object>` | — |
| `technical_specification.parameters[].key` | yes | `string` | pattern: "^[a-z][a-z0-9_]*$" |
| `technical_specification.parameters[].value` | no | `string | number | null` | — |
| `technical_specification.parameters[].ref_id` | no | `string` | pattern: "^[a-z_]+\\.[a-z0-9][a-z0-9_.-]*$" |
| `technical_specification.parameters[].ref_role` | no | `string` | minLength: 1 |

### technology

Technical concept or fabrication technology; dated changes belong to events/processes.

File: [technology.json](../../data_foundation/technology.json) · Schema: [technology.schema.json](../../schemas/technology.schema.json)

```text
technology[]
id*: string
name*: string
kind*: string
description*: string
owner_actor_ids*: array<string> → actor
related_technology_ids*: array<string> → technology
specification*: array<object>
│  └─ number*: integer
│  └─ chapter_name*: string
│  └─ description*: string
│  └─ parameters*: array<object>
│  │  └─ key*: string
│  │  └─ value*: string
fabrication?: object
│  └─ feature_size_um*: number
│  └─ wafer_diameter_mm?: number
│  └─ lithography_method*: string
```

| Field path | Required in parent | Type | Constraints / allowed values |
| --- | --- | --- | --- |
| `id` | yes | `string` | pattern: "^technology\\.[a-z0-9][a-z0-9_.-]*$" |
| `name` | yes | `string` | minLength: 1 |
| `kind` | yes | `string` | enum: ["protocol","interface","architecture","software_method","fabrication","software_standard","hardware_standard"] |
| `description` | yes | `string` | minLength: 1 |
| `owner_actor_ids[]` | yes | `array<string>` | pattern: "^(actor)\\.[a-z0-9][a-z0-9_.-]*$"; minItems: 0; uniqueItems: true |
| `related_technology_ids[]` | yes | `array<string>` | pattern: "^(technology)\\.[a-z0-9][a-z0-9_.-]*$"; minItems: 0; uniqueItems: true |
| `specification[]` | yes | `array<object>` | minItems: 0 |
| `specification[].number` | yes | `integer` | minimum: 1 |
| `specification[].chapter_name` | yes | `string` | minLength: 1 |
| `specification[].description` | yes | `string` | — |
| `specification[].parameters[]` | yes | `array<object>` | — |
| `specification[].parameters[].key` | yes | `string` | pattern: "^[^{}]+$"; minLength: 1 |
| `specification[].parameters[].value` | yes | `string` | — |
| `fabrication` | no | `object` | — |
| `fabrication.feature_size_um` | yes | `number` | — |
| `fabrication.wafer_diameter_mm` | no | `number` | — |
| `fabrication.lithography_method` | yes | `string` | minLength: 1 |

## Reference catalogue

Every schema attribute marked `x-ref` appears here, including references inside shared and nested objects. Each target resolves to the target record’s `id`. Polymorphic alternatives are allowed targets, not simultaneous requirements.

| Source dataset | Attribute path | Permitted target datasets |
| --- | --- | --- |
| actor_relationship | `subject_actor_ids[]` | `actor` |
| actor_relationship | `object_actor_id` | `actor` |
| actor_relationship | `established_by_event_id` | `event` |
| agreement | `party[].actor_id` | `actor` |
| assumption | `scope_ids[]` | `actor`, `actor_relationship`, `agreement`, `assumption`, `campaign`, `event`, `location`, `manufacturing_capability`, `market_response`, `process`, `product`, `technology`, `base_part`, `device`, `software_edition`, `external_product` |
| base_part | `manufacturer_actor_id` | `actor` |
| base_part | `supplier_actor_ids[]` | `actor` |
| base_part | `technology_ids[]` | `technology` |
| base_part | `technical_definition.compatible_computers[]` | `device` |
| base_part | `technical_definition.compatible_with[]` | `device` |
| base_part | `technical_definition.host_qualification.device.base_computer.artemis.computer_id` | `device` |
| base_part | `technical_definition.host_qualification.device.base_computer.artemis.technology_ids[]` | `technology` |
| base_part | `technical_definition.host_qualification.device.base_computer.artemis_pro.computer_id` | `device` |
| base_part | `technical_definition.host_qualification.device.base_computer.artemis_pro.technology_ids[]` | `technology` |
| base_part | `technical_definition.host_qualification.device.base_computer.athena.computer_id` | `device` |
| base_part | `technical_definition.host_qualification.device.base_computer.athena_server.computer_id` | `device` |
| base_part | `technical_definition.host_qualification.device.base_computer.aurelia.computer_id` | `device` |
| base_part | `technical_definition.host_qualification.device.base_computer.aurelia.technology_ids[]` | `technology` |
| base_part | `technical_definition.host_qualification.device.base_computer.aurelia_plus.computer_id` | `device` |
| base_part | `technical_definition.host_qualification.device.base_computer.aurelia_plus.technology_ids[]` | `technology` |
| base_part | `technical_definition.memory_interface.expansion_id` | `device` |
| base_part | `technical_definition.memory_interface.organization_id` | `technology` |
| base_part | `technical_definition.memory_interface.system_controller_id` | `base_part` |
| base_part | `technical_definition.physical_population.chip_id` | `base_part` |
| base_part | `technical_definition.planned_compatible_with[]` | `device` |
| base_part | `technical_definition.processor.part_id` | `base_part` |
| base_part | `technical_definition.recommended_software_id` | `software_edition` |
| base_part | `technical_definition.specification.api_id` | `technology` |
| base_part | `technical_definition.specification.base_controller_id` | `base_part` |
| base_part | `technical_definition.specification.base_product_id` | `base_part` |
| base_part | `technical_definition.specification.bridge_design_id` | `technology` |
| base_part | `technical_definition.specification.card_id` | `device` |
| base_part | `technical_definition.specification.chip_type_id` | `base_part` |
| base_part | `technical_definition.specification.class_protocol_id` | `technology` |
| base_part | `technical_definition.specification.controller_id` | `base_part` |
| base_part | `technical_definition.specification.cpu_id` | `base_part` |
| base_part | `technical_definition.specification.crt_id` | `base_part` |
| base_part | `technical_definition.specification.display_controller_id` | `base_part` |
| base_part | `technical_definition.specification.display_memory.chip_id` | `base_part` |
| base_part | `technical_definition.specification.display_subassembly_id` | `base_part` |
| base_part | `technical_definition.specification.feature_continuity_id` | `device` |
| base_part | `technical_definition.specification.interface_id` | `technology` |
| base_part | `technical_definition.specification.keyboard_standard_id` | `technology` |
| base_part | `technical_definition.specification.legacy_card_id` | `device` |
| base_part | `technical_definition.specification.link_layer_id` | `technology` |
| base_part | `technical_definition.specification.manufacturing_planning.recipe_variants[].manufacturing_capability_id` | `manufacturing_capability` |
| base_part | `technical_definition.specification.mechanism_id` | `base_part` |
| base_part | `technical_definition.specification.memory_layout.policy_id` | `technology` |
| base_part | `technical_definition.specification.monitor_id` | `device` |
| base_part | `technical_definition.specification.negotiation_id` | `technology` |
| base_part | `technical_definition.specification.palette_list_id` | `technology` |
| base_part | `technical_definition.specification.platform_rate_profiles[].computer_id` | `device` |
| base_part | `technical_definition.specification.platform_rate_profiles[].technology_ids[]` | `technology` |
| base_part | `technical_definition.specification.sprite_memory.chip_id` | `base_part` |
| base_part | `technical_definition.specification.sprite_profile_ref.technology_id` | `technology` |
| base_part | `technical_definition.specification.technology_id` | `technology` |
| base_part | `technical_definition.specification.transport_id` | `technology` |
| base_part | `technical_definition.specification.video_link_id` | `technology` |
| base_part | `technical_definition.specification.video_ram_chip_id` | `base_part` |
| base_part | `technical_definition.specification_id` | `technology` |
| base_part | `technical_definition.technical_profile.memory.expanded_organization.controller_id` | `base_part` |
| base_part | `technical_definition.technical_profile.memory.expansion_ref` | `device` |
| base_part | `technical_definition.technical_profile.memory.organization.controller_id` | `base_part` |
| base_part | `technical_definition.technical_profile.memory.organization_ref` | `technology` |
| base_part | `technical_definition.technical_profile.memory.system_controller_ref` | `base_part` |
| base_part | `technical_definition.technical_profile.network.computer_id` | `device` |
| base_part | `technical_definition.technical_profile.networking.computer_id` | `device` |
| base_part | `technical_definition.technical_profile.networking.technology_ids[]` | `technology` |
| base_part | `technical_definition.technical_profile.software_compatibility.api_id` | `technology` |
| base_part | `technical_definition.technical_profile.video.controller_id` | `base_part` |
| base_part | `requirements[].subject_ids[]` | `actor`, `actor_relationship`, `agreement`, `assumption`, `campaign`, `event`, `location`, `manufacturing_capability`, `market_response`, `process`, `product`, `technology`, `base_part`, `device`, `software_edition`, `external_product` |
| base_part | `technical_specification.parameters[].ref_id` | `actor`, `technology`, `base_part`, `device`, `software_edition`, `product`, `external_product`, `manufacturing_capability` |
| base_part | `graphic_modes_specification[].parameters[].ref_id` | `actor`, `technology`, `base_part`, `device`, `software_edition`, `product`, `external_product`, `manufacturing_capability` |
| campaign | `lead_actor_ids[]` | `actor` |
| campaign | `marketing_steps[].reference_id` | `event`, `process` |
| campaign | `marketing_steps[].marketing_presentation[].parameters[].ref_id` | `actor`, `product`, `external_product`, `technology`, `device`, `software_edition`, `agreement`, `manufacturing_capability`, `market_response`, `location`, `base_part` |
| device | `provider_actor_ids[]` | `actor` |
| device | `technology_ids[]` | `technology` |
| device | `composition_history[].technical_definition.compatible_computers[]` | `device` |
| device | `composition_history[].technical_definition.compatible_with[]` | `device` |
| device | `composition_history[].technical_definition.host_qualification.device.base_computer.artemis.computer_id` | `device` |
| device | `composition_history[].technical_definition.host_qualification.device.base_computer.artemis.technology_ids[]` | `technology` |
| device | `composition_history[].technical_definition.host_qualification.device.base_computer.artemis_pro.computer_id` | `device` |
| device | `composition_history[].technical_definition.host_qualification.device.base_computer.artemis_pro.technology_ids[]` | `technology` |
| device | `composition_history[].technical_definition.host_qualification.device.base_computer.athena.computer_id` | `device` |
| device | `composition_history[].technical_definition.host_qualification.device.base_computer.athena_server.computer_id` | `device` |
| device | `composition_history[].technical_definition.host_qualification.device.base_computer.aurelia.computer_id` | `device` |
| device | `composition_history[].technical_definition.host_qualification.device.base_computer.aurelia.technology_ids[]` | `technology` |
| device | `composition_history[].technical_definition.host_qualification.device.base_computer.aurelia_plus.computer_id` | `device` |
| device | `composition_history[].technical_definition.host_qualification.device.base_computer.aurelia_plus.technology_ids[]` | `technology` |
| device | `composition_history[].technical_definition.memory_interface.expansion_id` | `device` |
| device | `composition_history[].technical_definition.memory_interface.organization_id` | `technology` |
| device | `composition_history[].technical_definition.memory_interface.system_controller_id` | `base_part` |
| device | `composition_history[].technical_definition.physical_population.chip_id` | `base_part` |
| device | `composition_history[].technical_definition.planned_compatible_with[]` | `device` |
| device | `composition_history[].technical_definition.processor.part_id` | `base_part` |
| device | `composition_history[].technical_definition.recommended_software_id` | `software_edition` |
| device | `composition_history[].technical_definition.specification.api_id` | `technology` |
| device | `composition_history[].technical_definition.specification.base_controller_id` | `base_part` |
| device | `composition_history[].technical_definition.specification.base_product_id` | `base_part` |
| device | `composition_history[].technical_definition.specification.bridge_design_id` | `technology` |
| device | `composition_history[].technical_definition.specification.card_id` | `device` |
| device | `composition_history[].technical_definition.specification.chip_type_id` | `base_part` |
| device | `composition_history[].technical_definition.specification.class_protocol_id` | `technology` |
| device | `composition_history[].technical_definition.specification.controller_id` | `base_part` |
| device | `composition_history[].technical_definition.specification.cpu_id` | `base_part` |
| device | `composition_history[].technical_definition.specification.crt_id` | `base_part` |
| device | `composition_history[].technical_definition.specification.display_controller_id` | `base_part` |
| device | `composition_history[].technical_definition.specification.display_memory.chip_id` | `base_part` |
| device | `composition_history[].technical_definition.specification.display_subassembly_id` | `base_part` |
| device | `composition_history[].technical_definition.specification.feature_continuity_id` | `device` |
| device | `composition_history[].technical_definition.specification.interface_id` | `technology` |
| device | `composition_history[].technical_definition.specification.keyboard_standard_id` | `technology` |
| device | `composition_history[].technical_definition.specification.legacy_card_id` | `device` |
| device | `composition_history[].technical_definition.specification.link_layer_id` | `technology` |
| device | `composition_history[].technical_definition.specification.manufacturing_planning.recipe_variants[].manufacturing_capability_id` | `manufacturing_capability` |
| device | `composition_history[].technical_definition.specification.mechanism_id` | `base_part` |
| device | `composition_history[].technical_definition.specification.memory_layout.policy_id` | `technology` |
| device | `composition_history[].technical_definition.specification.monitor_id` | `device` |
| device | `composition_history[].technical_definition.specification.negotiation_id` | `technology` |
| device | `composition_history[].technical_definition.specification.palette_list_id` | `technology` |
| device | `composition_history[].technical_definition.specification.platform_rate_profiles[].computer_id` | `device` |
| device | `composition_history[].technical_definition.specification.platform_rate_profiles[].technology_ids[]` | `technology` |
| device | `composition_history[].technical_definition.specification.sprite_memory.chip_id` | `base_part` |
| device | `composition_history[].technical_definition.specification.sprite_profile_ref.technology_id` | `technology` |
| device | `composition_history[].technical_definition.specification.technology_id` | `technology` |
| device | `composition_history[].technical_definition.specification.transport_id` | `technology` |
| device | `composition_history[].technical_definition.specification.video_link_id` | `technology` |
| device | `composition_history[].technical_definition.specification.video_ram_chip_id` | `base_part` |
| device | `composition_history[].technical_definition.specification_id` | `technology` |
| device | `composition_history[].technical_definition.technical_profile.memory.expanded_organization.controller_id` | `base_part` |
| device | `composition_history[].technical_definition.technical_profile.memory.expansion_ref` | `device` |
| device | `composition_history[].technical_definition.technical_profile.memory.organization.controller_id` | `base_part` |
| device | `composition_history[].technical_definition.technical_profile.memory.organization_ref` | `technology` |
| device | `composition_history[].technical_definition.technical_profile.memory.system_controller_ref` | `base_part` |
| device | `composition_history[].technical_definition.technical_profile.network.computer_id` | `device` |
| device | `composition_history[].technical_definition.technical_profile.networking.computer_id` | `device` |
| device | `composition_history[].technical_definition.technical_profile.networking.technology_ids[]` | `technology` |
| device | `composition_history[].technical_definition.technical_profile.software_compatibility.api_id` | `technology` |
| device | `composition_history[].technical_definition.technical_profile.video.controller_id` | `base_part` |
| device | `composition_history[].assembly_requirements[].subject_ids[]` | `actor`, `actor_relationship`, `agreement`, `assumption`, `campaign`, `event`, `location`, `manufacturing_capability`, `market_response`, `process`, `product`, `technology`, `base_part`, `device`, `software_edition`, `external_product` |
| device | `composition_history[].expansion_socket_groups[].sockets[].compatible_device_ids[]` | `device` |
| device | `requirements[].subject_ids[]` | `actor`, `actor_relationship`, `agreement`, `assumption`, `campaign`, `event`, `location`, `manufacturing_capability`, `market_response`, `process`, `product`, `technology`, `base_part`, `device`, `software_edition`, `external_product` |
| device | `technical_specification.parameters[].ref_id` | `actor`, `technology`, `base_part`, `device`, `software_edition`, `product`, `external_product`, `manufacturing_capability` |
| device | `graphic_modes_specification[].parameters[].ref_id` | `actor`, `technology`, `base_part`, `device`, `software_edition`, `product`, `external_product`, `manufacturing_capability` |
| event | `participant[].actor_id` | `actor` |
| event | `subject_ids[]` | `actor`, `actor_relationship`, `agreement`, `assumption`, `campaign`, `event`, `location`, `manufacturing_capability`, `market_response`, `process`, `product`, `technology`, `base_part`, `device`, `software_edition`, `external_product` |
| event | `inputs[].subject_ids[]` | `actor`, `actor_relationship`, `agreement`, `assumption`, `campaign`, `event`, `location`, `manufacturing_capability`, `market_response`, `process`, `product`, `technology`, `base_part`, `device`, `software_edition`, `external_product` |
| event | `inputs[].event_id` | `event` |
| event | `inputs[].process_id` | `process` |
| event | `outcomes[].subject_ids[]` | `actor`, `actor_relationship`, `agreement`, `assumption`, `campaign`, `event`, `location`, `manufacturing_capability`, `market_response`, `process`, `product`, `technology`, `base_part`, `device`, `software_edition`, `external_product` |
| event | `outcomes[].event_id` | `event` |
| event | `outcomes[].process_id` | `process` |
| event | `location_ids[]` | `location` |
| event | `agreement_id` | `agreement` |
| external_product | `provider_actor_ids[]` | `actor` |
| external_product | `impacted_standards[].standard_id` | `technology` |
| location | `parent_location_id` | `location` |
| manufacturing_capability | `actor_id` | `actor` |
| manufacturing_capability | `location_id` | `location` |
| manufacturing_capability | `technology_id` | `technology` |
| manufacturing_capability | `qualification_requirements[].subject_ids[]` | `actor`, `actor_relationship`, `agreement`, `assumption`, `campaign`, `event`, `location`, `manufacturing_capability`, `market_response`, `process`, `product`, `technology`, `base_part`, `device`, `software_edition`, `external_product` |
| manufacturing_capability | `qualification_requirements[].event_id` | `event` |
| manufacturing_capability | `qualification_requirements[].process_id` | `process` |
| manufacturing_capability | `base_part_ids[]` | `base_part` |
| market_response | `respondent_actor_ids[]` | `actor` |
| market_response | `subject_ids[]` | `actor`, `actor_relationship`, `agreement`, `assumption`, `campaign`, `event`, `location`, `manufacturing_capability`, `market_response`, `process`, `product`, `technology`, `base_part`, `device`, `software_edition`, `external_product` |
| market_response | `trigger_ids[]` | `event`, `process`, `campaign`, `agreement` |
| process | `participant[].actor_id` | `actor` |
| process | `subject_ids[]` | `actor`, `actor_relationship`, `agreement`, `assumption`, `campaign`, `event`, `location`, `manufacturing_capability`, `market_response`, `process`, `product`, `technology`, `base_part`, `device`, `software_edition`, `external_product` |
| process | `inputs[].subject_ids[]` | `actor`, `actor_relationship`, `agreement`, `assumption`, `campaign`, `event`, `location`, `manufacturing_capability`, `market_response`, `process`, `product`, `technology`, `base_part`, `device`, `software_edition`, `external_product` |
| process | `inputs[].event_id` | `event` |
| process | `inputs[].process_id` | `process` |
| process | `outcomes[].subject_ids[]` | `actor`, `actor_relationship`, `agreement`, `assumption`, `campaign`, `event`, `location`, `manufacturing_capability`, `market_response`, `process`, `product`, `technology`, `base_part`, `device`, `software_edition`, `external_product` |
| process | `period.start.value` | `event` |
| process | `period.end.value` | `event` |
| process | `steps[].event_id` | `event` |
| process | `steps[].process_id` | `process` |
| process | `steps[].campaign_id` | `campaign` |
| process | `related_process_ids[]` | `process` |
| process | `agreement_id` | `agreement` |
| product | `provider_actor_ids[]` | `actor` |
| product | `technical_identity.record_id` | `base_part`, `device`, `software_edition` |
| product | `launch_campaign_id` | `campaign` |
| product | `composition_history[].assembly_requirements[].subject_ids[]` | `actor`, `actor_relationship`, `agreement`, `assumption`, `campaign`, `event`, `location`, `manufacturing_capability`, `market_response`, `process`, `product`, `technology`, `base_part`, `device`, `software_edition`, `external_product` |
| product | `requirements[].subject_ids[]` | `actor`, `actor_relationship`, `agreement`, `assumption`, `campaign`, `event`, `location`, `manufacturing_capability`, `market_response`, `process`, `product`, `technology`, `base_part`, `device`, `software_edition`, `external_product` |
| product | `launch_event_id` | `event` |
| software_edition | `provider_actor_ids[]` | `actor` |
| software_edition | `technology_ids[]` | `technology` |
| software_edition | `composition_history[].technical_definition.architecture.network_id` | `technology` |
| software_edition | `composition_history[].technical_definition.architecture.server` | `device` |
| software_edition | `composition_history[].technical_definition.architecture.server_edition_id` | `software_edition` |
| software_edition | `composition_history[].technical_definition.data_interchange.export_definition_id` | `software_edition` |
| software_edition | `composition_history[].technical_definition.dependency_ids[]` | `device`, `software_edition`, `technology` |
| software_edition | `composition_history[].technical_definition.embedded_abacus_integration_id` | `technology` |
| software_edition | `composition_history[].technical_definition.features_id` | `technology` |
| software_edition | `composition_history[].technical_definition.memory_discovery_id` | `technology` |
| software_edition | `composition_history[].technical_definition.network_link_policy.link_layer_id` | `technology` |
| software_edition | `composition_history[].technical_definition.platform_support[].computer_id` | `device`, `product`, `external_product` |
| software_edition | `composition_history[].technical_definition.portability_contract.api_id` | `technology` |
| software_edition | `composition_history[].technical_definition.portable_runtime.api_id` | `technology` |
| software_edition | `composition_history[].technical_definition.portable_runtime.display_id` | `technology` |
| software_edition | `composition_history[].technical_definition.system_dependencies[].software_id` | `software_edition` |
| software_edition | `composition_history[].technical_definition.technology_id` | `technology` |
| software_edition | `composition_history[].technical_definition.toolchain.host[]` | `device` |
| software_edition | `composition_history[].technical_definition.toolchain.language_contract_id` | `technology` |
| software_edition | `composition_history[].technical_definition.toolchain.runtime_contract_id` | `technology` |
| software_edition | `composition_history[].technical_definition.tui_ownership.consumers[]` | `software_edition` |
| software_edition | `composition_history[].technical_definition.tui_ownership.interface_id` | `technology` |
| software_edition | `technical_specification.parameters[].ref_id` | `actor`, `technology`, `base_part`, `device`, `software_edition`, `product`, `external_product`, `manufacturing_capability` |
| technology | `owner_actor_ids[]` | `actor` |
| technology | `related_technology_ids[]` | `technology` |

## Contract notes

All foundation envelopes and record/value objects reject undeclared properties. IDs are prefixed by their dataset name. Shared dates preserve year, month or day precision; the validator also checks real dates, precision consistency, period ordering and reference existence. Money `basis` describes the story’s financial meaning and is not an editorial authorization status.

The schema files and `tools/validate-model.js` remain authoritative for machine validation. This specification documents existing structures; it does not introduce new fields, approve records or alter story content.

Regenerate this document after approved schema changes with `node tools/generate-foundation-spec.js` from the repository root.

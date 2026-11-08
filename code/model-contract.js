export const schemaVersion = "0.9.0";
export const datasets = ["actor", "actor_relationship", "agreement", "assumption", "campaign", "event", "location", "manufacturing_capability", "market_response", "process", "product", "technology", "base_part", "device", "software_edition", "external_product"];

// Record types and envelope keys stay singular; filenames may differ.
export const datasetFiles = Object.fromEntries(datasets.map(name => [name, name === "external_product" ? "external_products.json" : name + ".json"]));
export const datasetPath = name => "data_foundation/" + datasetFiles[name];
export const datasetForFile = filename => Object.keys(datasetFiles).find(name => datasetFiles[name] === filename);

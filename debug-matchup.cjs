const meta = require("./src/data/countryMetadata.json");
const borders = require("./src/data/borderGraph.json");

const metaKeys = new Set(Object.keys(meta).map(k => String(k).padStart(3, "0")));
const borderKeys = Object.keys(borders);
const missingInMeta = borderKeys.filter(k => !metaKeys.has(k));
console.log("Missing in meta:", missingInMeta.length, missingInMeta);

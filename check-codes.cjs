const meta = require("./src/data/countryMetadata.json");
const missingCode = Object.entries(meta).filter(([id, d]) => !d.code);
console.log("Missing code:", missingCode.length);
console.log("Sample codes:", Object.entries(meta).slice(0, 10).map(([id, d]) => ({ id, name: d.name, code: d.code })));

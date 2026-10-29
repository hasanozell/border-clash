const d3 = require('d3');
const topojson = require('topojson-client');
const atlasData = require('./node_modules/world-atlas/countries-50m.json');

const geo = topojson.feature(atlasData, atlasData.objects.countries);
const map = {};
geo.features.forEach(f => {
  const id = String(f.id).padStart(3, '0');
  map[id] = f;
});

// Test all 160 countries
const meta = require('./src/data/countryMetadata.json');
const borders = require('./src/data/borderGraph.json');

let errors = 0;
for (const [id, m] of Object.entries(meta)) {
  const normId = String(id).padStart(3, '0');
  const neighbors = borders[normId] || [];
  for (const nId of neighbors) {
    const f1 = map[normId];
    const f2 = map[nId];
    if (f1 && f2) {
      try {
        const fc = { type: 'FeatureCollection', features: [f1, f2] };
        const bounds = d3.geoBounds(fc);
        if (isNaN(bounds[0][0]) || isNaN(bounds[1][1])) {
          console.log('NaN bounds for', normId, nId);
          errors++;
        }
      } catch (e) {
        console.error('Error for', normId, nId, e.message);
        errors++;
      }
    }
  }
}
console.log('Bounds test finished with errors:', errors);

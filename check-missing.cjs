const atlas = require('./node_modules/world-atlas/countries-50m.json');
const meta = require('./src/data/countryMetadata.json');

const metaKeys = new Set(Object.keys(meta).map(k => String(k).padStart(3, '0')));
const missing = atlas.objects.countries.geometries
  .map(g => String(g.id).padStart(3, '0'))
  .filter(id => !metaKeys.has(id));

console.log('Total geometries in atlas:', atlas.objects.countries.geometries.length);
console.log('Missing IDs:', missing);

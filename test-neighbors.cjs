const topojson = require('topojson-client');
const atlas = require('./node_modules/world-atlas/countries-50m.json');

const geoms = atlas.objects.countries.geometries;
const neighbors = topojson.neighbors(geoms);

console.log('Geometries count:', geoms.length);
console.log('Sample geometry ID:', geoms[0].id);
console.log('Sample geometry neighbor indices:', neighbors[0]);
console.log('Sample neighbor IDs:', neighbors[0].map(idx => geoms[idx].id));

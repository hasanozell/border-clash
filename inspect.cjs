const fs = require('fs');
const topojson = require('topojson-client');
const atlas = require('./node_modules/world-atlas/countries-50m.json');

const countries = topojson.feature(atlas, atlas.objects.countries);
console.log('Total features:', countries.features.length);
console.log('Sample IDs:', countries.features.slice(0, 10).map(f => f.id));

const atlas = require('./node_modules/world-atlas/countries-50m.json');
const geoms = atlas.objects.countries.geometries;

geoms.forEach((g, idx) => {
  if (!g.id) {
    console.log('No ID at index', idx, 'properties:', g.properties);
  }
});

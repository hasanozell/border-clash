const d3 = require('d3');
const topojson = require('topojson-client');
const atlasData = require('./node_modules/world-atlas/countries-50m.json');

const geo = topojson.feature(atlasData, atlasData.objects.countries);
const featureMap = {};
geo.features.forEach((f, idx) => {
  const id = f.id ? String(f.id).padStart(3, '0') : `99${idx}`;
  featureMap[id] = f;
});

const width = 420;
const height = 280;
const proj = d3.geoMercator().scale(85).translate([width / 2, height / 2 + 35]);

['792', '591', '840', '643', '156', '276'].forEach(id => {
  const f = featureMap[id];
  const centroid = d3.geoCentroid(f);
  const [cx, cy] = proj(centroid);

  // Determine country size scale
  const area = f.area || 10000;
  let zoom = 5.0; // close up zoom
  if (['643', '124', '840', '156'].includes(id)) {
    zoom = 2.8; // big nations
  } else if (['076', '036', '356'].includes(id)) {
    zoom = 3.5;
  }

  const targetW = width / zoom;
  const targetH = height / zoom;
  const targetX = cx - targetW / 2;
  const targetY = cy - targetH / 2;

  console.log(`ID ${id}: centroid=(${centroid[0].toFixed(1)}, ${centroid[1].toFixed(1)}), screen=(${cx.toFixed(1)}, ${cy.toFixed(1)}), targetVB=[${targetX.toFixed(1)}, ${targetY.toFixed(1)}, ${targetW.toFixed(1)}, ${targetH.toFixed(1)}]`);
});

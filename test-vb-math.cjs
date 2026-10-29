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
const pathGen = d3.geoPath().projection(proj);

['792', '591', '840', '156'].forEach(id => {
  const f = featureMap[id];
  const b = pathGen.bounds(f);
  const cx = (b[0][0] + b[1][0]) / 2;
  const cy = (b[0][1] + b[1][1]) / 2;
  const bw = b[1][0] - b[0][0];
  const bh = b[1][1] - b[0][1];

  const targetW = Math.max(bw * 2.5, 70);
  const targetH = targetW * (height / width);
  const targetX = cx - targetW / 2;
  const targetY = cy - targetH / 2;

  console.log(`ID ${id}: bounds=[${b[0]}, ${b[1]}], center=(${cx.toFixed(1)}, ${cy.toFixed(1)}), targetVB=[${targetX.toFixed(1)}, ${targetY.toFixed(1)}, ${targetW.toFixed(1)}, ${targetH.toFixed(1)}]`);
});

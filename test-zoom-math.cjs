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

['792', '591', '276', '156'].forEach(attackerId => {
  const proj = d3.geoMercator().scale(85).translate([width / 2, height / 2 + 35]);
  const aFeat = featureMap[attackerId];
  const bounds = d3.geoBounds({ type: 'FeatureCollection', features: [aFeat] });
  let [minLng, minLat] = bounds[0];
  let [maxLng, maxLat] = bounds[1];
  let dLng = maxLng - minLng;
  if (dLng < 0) dLng += 360;
  dLng = Math.max(dLng, 5);
  const dLat = Math.max(Math.abs(maxLat - minLat), 5);
  const centerLng = (minLng + maxLng) / 2;
  const centerLat = (minLat + maxLat) / 2;
  const rawScale = Math.min(width / dLng, height / dLat) * 26;
  const zoomScale = Math.max(3.8, Math.min(rawScale, 11));
  const [cx, cy] = proj([centerLng, centerLat]);
  const tx = width / 2 - cx * zoomScale;
  const ty = height / 2 - cy * zoomScale;
  console.log(`Country ${attackerId}: zoomScale=${zoomScale.toFixed(2)}, cx=${cx.toFixed(1)}, cy=${cy.toFixed(1)}, tx=${tx.toFixed(1)}, ty=${ty.toFixed(1)}`);
});

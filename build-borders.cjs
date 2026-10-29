const fs = require('fs');
const topojson = require('topojson-client');
const atlas = require('./node_modules/world-atlas/countries-50m.json');
const metadata = require('./src/data/countryMetadata.json');

// Add the special territories to metadata if missing
metadata["901"] = { name: "Somaliland", tr: "Somaliland", code: "so", pop: 5700000, area: 176120, maritime: ["706", "231"] };
metadata["902"] = { name: "Kosovo", tr: "Kosova", code: "xk", pop: 1761985, area: 10887, maritime: ["688", "807", "008", "499"] };
metadata["903"] = { name: "Northern Cyprus", tr: "Kuzey Kıbrıs", code: "tr", pop: 382836, area: 3355, maritime: ["196", "792"] };
metadata["086"] = { name: "Indian Ocean Ter.", tr: "Hint Okyanusu", code: "io", pop: 3000, area: 60 };
metadata["905"] = { name: "Siachen Glacier", tr: "Siachen Buzulu", code: "in", pop: 100, area: 700 };

fs.writeFileSync('./src/data/countryMetadata.json', JSON.stringify(metadata, null, 2));

const geoms = atlas.objects.countries.geometries;

// Assign synthetic IDs for the 5 special geometries
const resolveId = (g, idx) => {
  if (g.id) return String(g.id).padStart(3, '0');
  if (idx === 58) return "901"; // Somaliland
  if (idx === 130) return "902"; // Kosovo
  if (idx === 185) return "903"; // N. Cyprus
  if (idx === 226) return "086"; // Indian Ocean
  if (idx === 238) return "905"; // Siachen
  return `99${idx}`;
};

const indexToId = geoms.map((g, idx) => resolveId(g, idx));
const neighborsList = topojson.neighbors(geoms);

const borderGraph = {};

indexToId.forEach((id, idx) => {
  if (!id || id === 'undefined') return;
  if (!borderGraph[id]) borderGraph[id] = new Set();
  const rawNeighbors = neighborsList[idx] || [];
  rawNeighbors.forEach(nIdx => {
    const nId = indexToId[nIdx];
    if (nId && nId !== 'undefined' && nId !== id) {
      borderGraph[id].add(nId);
      if (!borderGraph[nId]) borderGraph[nId] = new Set();
      borderGraph[nId].add(id);
    }
  });
});

// Add maritime / connectivity links from metadata
Object.entries(metadata).forEach(([id, data]) => {
  const normId = String(id).padStart(3, '0');
  if (data.maritime && Array.isArray(data.maritime)) {
    data.maritime.forEach(mId => {
      const normMId = String(mId).padStart(3, '0');
      if (!borderGraph[normId]) borderGraph[normId] = new Set();
      if (!borderGraph[normMId]) borderGraph[normMId] = new Set();
      borderGraph[normId].add(normMId);
      borderGraph[normMId].add(normId);
    });
  }
});

// Filter out any invalid / undefined entries
const finalGraph = {};
Object.entries(borderGraph).forEach(([id, neighbors]) => {
  if (id && id !== 'undefined' && metadata[id]) {
    finalGraph[id] = Array.from(neighbors).filter(nId => nId && nId !== 'undefined' && metadata[nId]);
  }
});

fs.writeFileSync('./src/data/borderGraph.json', JSON.stringify(finalGraph, null, 2));
console.log('Regenerated borderGraph.json cleanly for', Object.keys(finalGraph).length, 'countries');
console.log('Contains undefined?', Object.keys(finalGraph).includes('undefined'));

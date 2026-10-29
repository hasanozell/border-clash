import React, { useMemo, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import atlasData from 'world-atlas/countries-50m.json';

const resolveFeatureId = (f, idx) => {
  if (f.id) return String(f.id).padStart(3, '0');
  if (idx === 58) return "901"; // Somaliland
  if (idx === 130) return "902"; // Kosovo
  if (idx === 185) return "903"; // N. Cyprus
  if (idx === 226) return "086"; // Indian Ocean
  if (idx === 238) return "905"; // Siachen
  return `99${idx}`;
};

// Extracts the primary mainland polygon to avoid overseas distortion
function getMainlandFeature(feature, id) {
  if (feature.geometry.type === 'Polygon') return feature;
  let maxArea = -1;
  let best = null;
  feature.geometry.coordinates.forEach(coords => {
    const single = { type: 'Feature', geometry: { type: 'Polygon', coordinates: coords } };
    const a = d3.geoArea(single);
    if (a > maxArea) {
      maxArea = a;
      best = single;
    }
  });
  return best || feature;
}

// Computes precise flag image placements covering mainland + major territories
function getImagePlacements(feature, id, pathGenerator, projection, width) {
  const images = [];

  // Special handling for Russia across 180° antimeridian
  if (id === '643') {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    feature.geometry.coordinates.forEach(poly => {
      poly.forEach(ring => {
        ring.forEach(([lng, lat]) => {
          if (lng >= 20 && lng <= 180 && lat >= 40 && lat <= 78) {
            const [px, py] = projection([lng, lat]);
            if (px < minX) minX = px;
            if (px > maxX) maxX = px;
            if (py < minY) minY = py;
            if (py > maxY) maxY = py;
          }
        });
      });
    });
    if (minX !== Infinity) {
      const bw = maxX - minX;
      const bh = maxY - minY;
      const dim = Math.max(bw, bh) * 1.1;
      const cx = (minX + maxX) / 2;
      const cy = (minY + maxY) / 2;
      images.push({
        x: cx - dim / 2,
        y: cy - dim / 2,
        dim
      });
    }
    return images;
  }

  if (feature.geometry.type === 'Polygon') {
    const b = pathGenerator.bounds(feature);
    const bw = Math.max(b[1][0] - b[0][0], 1);
    const bh = Math.max(b[1][1] - b[0][1], 1);
    const dim = Math.max(bw, bh) * 1.15;
    const cx = (b[0][0] + b[1][0]) / 2;
    const cy = (b[0][1] + b[1][1]) / 2;
    images.push({ x: cx - dim / 2, y: cy - dim / 2, dim });
    return images;
  }

  // MultiPolygon: identify significant parts
  const polyInfos = [];
  feature.geometry.coordinates.forEach(c => {
    const singleFeat = { type: 'Feature', geometry: { type: 'Polygon', coordinates: c } };
    const area = d3.geoArea(singleFeat);
    polyInfos.push({ feat: singleFeat, area });
  });

  polyInfos.sort((a, b) => b.area - a.area);
  if (polyInfos.length === 0) return images;

  // Primary (largest) sub-polygon (e.g. Mainland USA, Mainland France, Great Britain)
  const primaryB = pathGenerator.bounds(polyInfos[0].feat);
  const pbw = Math.max(primaryB[1][0] - primaryB[0][0], 1);
  const pbh = Math.max(primaryB[1][1] - primaryB[0][1], 1);
  const pdim = Math.max(pbw, pbh) * 1.15;
  const pcx = (primaryB[0][0] + primaryB[1][0]) / 2;
  const pcy = (primaryB[0][1] + primaryB[1][1]) / 2;

  if (pbw < width * 0.7) {
    images.push({ x: pcx - pdim / 2, y: pcy - pdim / 2, dim: pdim });
  } else {
    // If wrapped across 180°, clamp points in Eastern hemisphere
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    polyInfos[0].feat.geometry.coordinates.forEach(ring => {
      ring.forEach(([lng, lat]) => {
        if (lng > 0) {
          const [px, py] = projection([lng, lat]);
          if (px < minX) minX = px;
          if (px > maxX) maxX = px;
          if (py < minY) minY = py;
          if (py > maxY) maxY = py;
        }
      });
    });
    if (minX !== Infinity) {
      const bw = maxX - minX;
      const bh = maxY - minY;
      const dim = Math.max(bw, bh) * 1.2;
      images.push({ x: (minX + maxX)/2 - dim/2, y: (minY + maxY)/2 - dim/2, dim });
    }
  }

  // Significant secondary territories (e.g. Alaska, French Guiana, Corsica, etc.)
  let extraCount = 0;
  for (let i = 1; i < polyInfos.length && extraCount < 4; i++) {
    const item = polyInfos[i];
    if (item.area > 0.00008 && item.area > polyInfos[0].area * 0.02) {
      const b = pathGenerator.bounds(item.feat);
      const bw = Math.max(b[1][0] - b[0][0], 1);
      const bh = Math.max(b[1][1] - b[0][1], 1);
      if (bw < width * 0.5) {
        const dim = Math.max(bw, bh) * 1.2;
        const cx = (b[0][0] + b[1][0]) / 2;
        const cy = (b[0][1] + b[1][1]) / 2;
        images.push({ x: cx - dim / 2, y: cy - dim / 2, dim });
        extraCount++;
      }
    }
  }

  return images;
}

export default function MapViewer({
  conquestMap,
  factions,
  attackerId,
  defenderId,
  highlightedNeighborId,
  candidateNeighbors = [],
  viewMode = 'zoom', // 'zoom' | 'world'
  width = 600,
  height = 420
}) {
  const svgRef = useRef(null);

  // Extract GeoJSON features once
  const { features, featureMap } = useMemo(() => {
    const geo = topojson.feature(atlasData, atlasData.objects.countries);
    const map = {};
    geo.features.forEach((f, idx) => {
      const id = resolveFeatureId(f, idx);
      f.resolvedId = id;
      map[id] = f;
    });
    return { features: geo.features, featureMap: map };
  }, []);

  const projection = useMemo(() => {
    return d3.geoMercator().scale(85).translate([width / 2, height / 2 + 35]);
  }, [width, height]);

  const pathGenerator = useMemo(() => {
    return d3.geoPath().projection(projection);
  }, [projection]);

  // Pre-calculate ALL static geometries, paths, centroids, and image bounds ONCE
  const staticFeatures = useMemo(() => {
    return features.map(feature => {
      const id = feature.resolvedId;
      const d = pathGenerator(feature);
      if (!d) return null;

      const mainland = getMainlandFeature(feature, id);
      const centroid = d3.geoCentroid(mainland);
      const [cx, cy] = projection(centroid) || [width / 2, height / 2];

      const images = getImagePlacements(feature, id, pathGenerator, projection, width);

      return {
        id,
        d,
        cx,
        cy,
        images
      };
    }).filter(Boolean);
  }, [features, pathGenerator, projection, width]);

  // Target Camera Box (viewBox)
  const targetViewBox = useMemo(() => {
    if (viewMode === 'world' || !attackerId) {
      return { x: 0, y: 0, w: width, h: height };
    }

    // Both attacker & defender: Frame both cleanly
    if (attackerId && defenderId) {
      const aFeat = featureMap[attackerId];
      const dFeat = featureMap[defenderId];
      if (aFeat && dFeat) {
        const c1 = d3.geoCentroid(getMainlandFeature(aFeat, attackerId));
        const c2 = d3.geoCentroid(getMainlandFeature(dFeat, defenderId));
        const p1 = projection(c1) || [width / 2, height / 2];
        const p2 = projection(c2) || [width / 2, height / 2];

        const midX = (p1[0] + p2[0]) / 2;
        const midY = (p1[1] + p2[1]) / 2;
        const dist = Math.hypot(p1[0] - p2[0], p1[1] - p2[1]);

        const targetW = Math.max(dist * 3.2, 95);
        const targetH = targetW * (height / width);

        return {
          x: midX - targetW / 2,
          y: midY - targetH / 2,
          w: targetW,
          h: targetH
        };
      }
    }

    // Only Attacker: ZOOM DIRECTLY INTO ATTACKER MAINLAND
    const aFeat = featureMap[attackerId];
    if (aFeat) {
      const centroid = d3.geoCentroid(getMainlandFeature(aFeat, attackerId));
      const [cx, cy] = projection(centroid) || [width / 2, height / 2];

      let zoom = 5.2;
      if (['643', '124', '840', '156'].includes(attackerId)) {
        zoom = 2.7;
      } else if (['076', '036', '356'].includes(attackerId)) {
        zoom = 3.5;
      }

      const targetW = width / zoom;
      const targetH = height / zoom;

      return {
        x: cx - targetW / 2,
        y: cy - targetH / 2,
        w: targetW,
        h: targetH
      };
    }

    return { x: 0, y: 0, w: width, h: height };
  }, [viewMode, attackerId, defenderId, featureMap, projection, width, height]);

  // Smooth, Zero-Lag ViewBox Animation (Direct DOM attribute mutation - No React re-renders)
  const vbRef = useRef({ x: 0, y: 0, w: width, h: height });

  useEffect(() => {
    const start = { ...vbRef.current };
    const target = targetViewBox;
    const startTime = performance.now();
    const duration = 850;

    let animId;
    const animate = (now) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);
      // Cubic ease out
      const ease = 1 - Math.pow(1 - t, 3);

      const next = {
        x: start.x + (target.x - start.x) * ease,
        y: start.y + (target.y - start.y) * ease,
        w: start.w + (target.w - start.w) * ease,
        h: start.h + (target.h - start.h) * ease,
      };

      vbRef.current = next;

      if (svgRef.current) {
        svgRef.current.setAttribute('viewBox', `${next.x} ${next.y} ${next.w} ${next.h}`);
      }

      if (t < 1) {
        animId = requestAnimationFrame(animate);
      }
    };

    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [targetViewBox]);

  const isFocusMode = viewMode === 'zoom' && Boolean(attackerId);

  // Dynamic properties during battle (extremely fast, zero heavy geometry math)
  const renderedFeatures = useMemo(() => {
    return staticFeatures.map(item => {
      const ownerId = conquestMap[item.id] || item.id;
      const owner = factions[ownerId];
      const flagCode = owner?.code?.toLowerCase() || 'un';

      const isAttacker = item.id === attackerId || ownerId === attackerId;
      const isDefender = item.id === defenderId || ownerId === defenderId;
      const isHighlighted = item.id === highlightedNeighborId || ownerId === highlightedNeighborId;

      return {
        ...item,
        ownerId,
        flagCode,
        isAttacker,
        isDefender,
        isHighlighted
      };
    });
  }, [staticFeatures, conquestMap, factions, attackerId, defenderId, highlightedNeighborId]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#070b19] select-none rounded-2xl border border-slate-800">
      <svg
        ref={svgRef}
        viewBox={`${vbRef.current.x} ${vbRef.current.y} ${vbRef.current.w} ${vbRef.current.h}`}
        className="w-full h-full"
      >
        <defs>
          <pattern id="ocean-grid" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="12" cy="12" r="0.8" fill="#1e293b" opacity="0.25" />
          </pattern>

          {staticFeatures.map(item => (
            <clipPath key={`clip-${item.id}`} id={`clip-${item.id}`}>
              <path d={item.d} />
            </clipPath>
          ))}
        </defs>

        {/* Global Ocean */}
        <rect x={-800} y={-800} width={width + 1600} height={height + 1600} fill="#060913" />
        <rect x={-800} y={-800} width={width + 1600} height={height + 1600} fill="url(#ocean-grid)" />

        {/* Flag-Filled Countries with Spotlight Brightness */}
        {renderedFeatures.map(item => {
          const flagUrl = `https://flagcdn.com/w320/${item.flagCode}.png`;

          // Dynamic brightness & contrast:
          // Active attacker / roulette-cycling neighbor shines bright like a spotlight!
          // Inactive background countries slightly dimmed to make active countries pop naturally
          const brightnessFilter = item.isHighlighted
            ? 'brightness(1.55) contrast(1.15) saturate(1.15)'
            : item.isAttacker
            ? 'brightness(1.3) contrast(1.1) saturate(1.05)'
            : item.isDefender
            ? 'brightness(1.22) contrast(1.08)'
            : isFocusMode
            ? 'brightness(0.68) saturate(0.85)'
            : 'brightness(1.0)';

          return (
            <g
              key={item.id}
              clipPath={`url(#clip-${item.id})`}
              style={{
                filter: brightnessFilter,
                transition: 'filter 180ms ease-out'
              }}
            >
              {/* Land background */}
              <path d={item.d} fill="#141a29" />

              {/* Crisp Flag Image(s) covering mainland & major islands */}
              {item.images.map((img, imgIdx) => (
                <image
                  key={imgIdx}
                  href={flagUrl}
                  x={img.x}
                  y={img.y}
                  width={img.dim}
                  height={img.dim}
                  preserveAspectRatio="xMidYMid slice"
                />
              ))}

              {/* Luminous soft light pulse on the neighbor currently visited during roulette */}
              {item.isHighlighted && (
                <path d={item.d} fill="#ffffff" fillOpacity="0.28" />
              )}

              {/* Gentle warm ambient glow on the attacking country */}
              {item.isAttacker && (
                <path d={item.d} fill="#fbbf24" fillOpacity="0.12" />
              )}

              {/* Gentle cool ambient glow on the locked defending country */}
              {item.isDefender && (
                <path d={item.d} fill="#38bdf8" fillOpacity="0.12" />
              )}
            </g>
          );
        })}

        {/* Clean, Non-Intrusive Borders */}
        {renderedFeatures.map(item => {
          let stroke = '#0a0f1d';
          let strokeWidth = 0.4;
          let strokeOpacity = 0.6;

          // Subtle hairline border only to delineate the attacker / defender once locked
          if (item.isAttacker) {
            stroke = '#fbbf24';
            strokeWidth = 0.8;
            strokeOpacity = 0.85;
          } else if (item.isDefender) {
            stroke = '#38bdf8';
            strokeWidth = 0.8;
            strokeOpacity = 0.85;
          }

          return (
            <path
              key={`border-${item.id}`}
              d={item.d}
              fill="none"
              stroke={stroke}
              strokeWidth={strokeWidth}
              strokeOpacity={strokeOpacity}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          );
        })}
      </svg>
    </div>
  );
}
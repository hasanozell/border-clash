import React, { useMemo, useState, useEffect, useRef } from 'react';
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
        const c1 = d3.geoCentroid(aFeat);
        const c2 = d3.geoCentroid(dFeat);
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

    // Only Attacker: ZOOM DIRECTLY INTO ATTACKER COUNTRY
    const aFeat = featureMap[attackerId];
    if (aFeat) {
      const centroid = d3.geoCentroid(aFeat);
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

  // Smooth ViewBox Animation with RequestAnimationFrame
  const [currentVb, setCurrentVb] = useState({ x: 0, y: 0, w: width, h: height });
  const vbRef = useRef({ x: 0, y: 0, w: width, h: height });

  useEffect(() => {
    const start = { ...vbRef.current };
    const target = targetViewBox;
    const startTime = performance.now();
    const duration = 900;

    let animId;
    const animate = (now) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);
      const ease = 1 - Math.pow(1 - t, 3);

      const next = {
        x: start.x + (target.x - start.x) * ease,
        y: start.y + (target.y - start.y) * ease,
        w: start.w + (target.w - start.w) * ease,
        h: start.h + (target.h - start.h) * ease,
      };

      vbRef.current = next;
      setCurrentVb(next);

      if (t < 1) {
        animId = requestAnimationFrame(animate);
      }
    };

    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [targetViewBox]);

  const isFocusMode = viewMode === 'zoom' && Boolean(attackerId);

  // Compute paths, bounding boxes, and flags
  const renderedFeatures = useMemo(() => {
    return features.map(feature => {
      const id = feature.resolvedId;
      const d = pathGenerator(feature);
      if (!d) return null;

      const bounds = pathGenerator.bounds(feature);
      const minX = bounds[0][0];
      const minY = bounds[0][1];
      const maxX = bounds[1][0];
      const maxY = bounds[1][1];

      const bw = Math.max(maxX - minX, 1);
      const bh = Math.max(maxY - minY, 1);
      const cx = (minX + maxX) / 2;
      const cy = (minY + maxY) / 2;

      const dim = Math.max(bw, bh) * 1.15;
      const imgX = cx - dim / 2;
      const imgY = cy - dim / 2;

      const ownerId = conquestMap[id] || id;
      const owner = factions[ownerId];
      const flagCode = owner?.code?.toLowerCase() || 'un';

      const isAttacker = id === attackerId || ownerId === attackerId;
      const isDefender = id === defenderId || ownerId === defenderId;
      const isHighlighted = id === highlightedNeighborId || ownerId === highlightedNeighborId;

      return {
        id,
        d,
        imgX,
        imgY,
        dim,
        ownerId,
        flagCode,
        isAttacker,
        isDefender,
        isHighlighted
      };
    }).filter(Boolean);
  }, [features, pathGenerator, conquestMap, factions, attackerId, defenderId, highlightedNeighborId]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#070b19] select-none rounded-2xl border border-slate-800">
      <svg
        viewBox={`${currentVb.x} ${currentVb.y} ${currentVb.w} ${currentVb.h}`}
        className="w-full h-full"
      >
        <defs>
          <pattern id="ocean-grid" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="12" cy="12" r="0.8" fill="#1e293b" opacity="0.25" />
          </pattern>

          {renderedFeatures.map(item => (
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
            ? 'brightness(1.5) contrast(1.15) saturate(1.1)'
            : item.isAttacker
            ? 'brightness(1.28) contrast(1.1) saturate(1.05)'
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

              {/* Crisp Flag Image */}
              <image
                href={flagUrl}
                x={item.imgX}
                y={item.imgY}
                width={item.dim}
                height={item.dim}
                preserveAspectRatio="xMidYMid slice"
              />

              {/* Luminous soft light pulse on the neighbor currently visited during roulette */}
              {item.isHighlighted && (
                <path d={item.d} fill="#ffffff" fillOpacity="0.25" />
              )}

              {/* Gentle warm ambient glow on the attacking country */}
              {item.isAttacker && (
                <path d={item.d} fill="#fbbf24" fillOpacity="0.1" />
              )}

              {/* Gentle cool ambient glow on the locked defending country */}
              {item.isDefender && (
                <path d={item.d} fill="#38bdf8" fillOpacity="0.1" />
              )}
            </g>
          );
        })}

        {/* Clean, Non-Intrusive Borders (No artificial thick lines during roulette) */}
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

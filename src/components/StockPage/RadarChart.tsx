"use client";

import type { ScoreDimension } from "@/lib/types";

interface Props {
  dimensions: ScoreDimension[];
}

export default function RadarChart({ dimensions }: Props) {
  const size = 220;
  const center = size / 2;
  const radius = 80;
  const levels = 4;

  const getPoint = (index: number, value: number) => {
    const angle = (Math.PI * 2 * index) / dimensions.length - Math.PI / 2;
    const r = (value / 100) * radius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  const getLevelPoint = (index: number, level: number) => {
    const angle = (Math.PI * 2 * index) / dimensions.length - Math.PI / 2;
    const r = (radius * level) / levels;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  // Grid levels
  const gridPolygons = Array.from({ length: levels }, (_, level) =>
    Array.from({ length: dimensions.length }, (_, i) => getLevelPoint(i, level + 1))
  );

  // Data polygon
  const dataPoints = dimensions.map((d, i) => getPoint(i, d.score));

  const dataPath = dataPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";

  const getScoreColor = (score: number) => {
    if (score >= 70) return "#dc2626";
    if (score >= 40) return "#d97706";
    return "#16a34a";
  };

  return (
    <div className="flex justify-center">
      <svg width={size} height={size} className="overflow-visible">
        {/* Grid levels */}
        {gridPolygons.map((polygon, level) => (
          <polygon
            key={level}
            points={polygon.map((p) => `${p.x},${p.y}`).join(" ")}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="1"
            strokeDasharray={level === levels - 1 ? "none" : "4 4"}
          />
        ))}

        {/* Axis lines */}
        {dimensions.map((_, i) => {
          const end = getLevelPoint(i, levels);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={end.x}
              y2={end.y}
              stroke="#e2e8f0"
              strokeWidth="1"
            />
          );
        })}

        {/* Data area */}
        <path d={dataPath} fill="rgba(59, 130, 246, 0.15)" stroke="#3b82f6" strokeWidth="2" />

        {/* Data points */}
        {dataPoints.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="4" fill="#3b82f6" stroke="white" strokeWidth="2" />
        ))}

        {/* Labels */}
        {dimensions.map((dim, i) => {
          const angle = (Math.PI * 2 * i) / dimensions.length - Math.PI / 2;
          const labelR = radius + 22;
          const x = center + labelR * Math.cos(angle);
          const y = center + labelR * Math.sin(angle);
          return (
            <g key={i}>
              <text
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-[10px] fill-muted"
                fontSize="10"
              >
                <tspan x={x} dy="-4">{dim.name}</tspan>
                <tspan x={x} dy="12" fill={getScoreColor(dim.score)} fontWeight="bold">{dim.score}</tspan>
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

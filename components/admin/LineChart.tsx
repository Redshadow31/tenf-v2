"use client";

interface DataPoint {
  label: string;
  value: number;
}

interface LineChartProps {
  data: DataPoint[];
  color?: string;
  height?: number;
  maxValue?: number;
}

export default function LineChart({
  data,
  color = "#9146ff",
  height = 200,
  maxValue,
}: LineChartProps) {
  const max = maxValue || Math.max(...data.map((d) => d.value));
  const min = Math.min(...data.map((d) => d.value));
  const range = max - min || 1;

  // Calculer les points pour le SVG
  const width = 100;
  const padding = 25;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const points = data.map((point, index) => {
    const x = padding + (index / (data.length - 1 || 1)) * chartWidth;
    const y = padding + chartHeight - ((point.value - min) / range) * chartHeight;
    return { x, y };
  });

  // Créer le path pour la ligne
  const pathData = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

  return (
    <div className="w-full" style={{ height: `${height}px` }}>
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
        {/* Grille horizontale */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = padding + chartHeight * (1 - ratio);
          const value = min + range * ratio;
          return (
            <g key={ratio}>
              <line
                x1={padding}
                y1={y}
                x2={width - padding}
                y2={y}
                stroke="#374151"
                strokeWidth="0.5"
                strokeDasharray="2,2"
              />
              <text
                x={padding - 5}
                y={y + 3}
                fill="#9CA3AF"
                fontSize="8"
                textAnchor="end"
              >
                {value >= 1000 ? `${(value / 1000).toFixed(1)}k` : Math.round(value)}
              </text>
            </g>
          );
        })}

        {/* Ligne principale */}
        <path
          d={pathData}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Points */}
        {points.map((point, index) => (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r="2"
            fill={color}
          />
        ))}

        {/* Labels X */}
        {data.map((point, index) => {
          const x = padding + (index / (data.length - 1 || 1)) * chartWidth;
          return (
            <text
              key={index}
              x={x}
              y={height - 5}
              fill="#9CA3AF"
              fontSize="8"
              textAnchor="middle"
            >
              {point.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}


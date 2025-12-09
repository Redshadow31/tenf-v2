"use client";

interface DataPoint {
  label: string;
  value: number;
}

interface BarChartProps {
  data: DataPoint[];
  color?: string;
  height?: number;
  maxValue?: number;
}

export default function BarChart({
  data,
  color = "#9146ff",
  height = 200,
  maxValue,
}: BarChartProps) {
  const max = maxValue || Math.max(...data.map((d) => d.value));
  const min = Math.min(...data.map((d) => d.value));
  const range = max - min || 1;

  const width = 100;
  const padding = 25;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  const barWidth = (chartWidth / data.length) * 0.7;
  const barSpacing = (chartWidth / data.length) * 0.3;

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

        {/* Barres */}
        {data.map((point, index) => {
          const barHeight = ((point.value - min) / range) * chartHeight;
          const x = padding + index * (barWidth + barSpacing) + barSpacing / 2;
          const y = padding + chartHeight - barHeight;

          return (
            <g key={index}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={color}
                rx="2"
              />
              <text
                x={x + barWidth / 2}
                y={y - 5}
                fill="#9CA3AF"
                fontSize="8"
                textAnchor="middle"
              >
                {point.value >= 1000 ? `${(point.value / 1000).toFixed(1)}k` : point.value}
              </text>
              <text
                x={x + barWidth / 2}
                y={height - 5}
                fill="#9CA3AF"
                fontSize="8"
                textAnchor="middle"
              >
                {point.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}


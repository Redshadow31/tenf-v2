"use client";

import { useMemo, useState } from "react";
import worldMap from "@svg-maps/world";

export interface CountryConnectionPoint {
  countryCode: string;
  countryName: string;
  continent?: string;
  count: number;
  members?: number;
  general?: number;
}

const COUNTRY_CENTROIDS: Record<string, { lat: number; lng: number }> = {
  FR: { lat: 46.22, lng: 2.21 },
  BE: { lat: 50.5, lng: 4.47 },
  CH: { lat: 46.82, lng: 8.23 },
  CA: { lat: 56.13, lng: -106.35 },
  US: { lat: 39.82, lng: -98.57 },
  MX: { lat: 23.63, lng: -102.55 },
  BR: { lat: -14.23, lng: -51.92 },
  AR: { lat: -38.42, lng: -63.62 },
  GB: { lat: 55.38, lng: -3.43 },
  IE: { lat: 53.14, lng: -8.24 },
  ES: { lat: 40.46, lng: -3.75 },
  PT: { lat: 39.4, lng: -8.22 },
  DE: { lat: 51.16, lng: 10.45 },
  IT: { lat: 41.87, lng: 12.57 },
  NL: { lat: 52.13, lng: 5.29 },
  AT: { lat: 47.52, lng: 14.55 },
  PL: { lat: 51.92, lng: 19.15 },
  SE: { lat: 60.13, lng: 18.64 },
  NO: { lat: 60.47, lng: 8.47 },
  FI: { lat: 61.92, lng: 25.75 },
  DZ: { lat: 28.03, lng: 1.66 },
  MA: { lat: 31.79, lng: -7.09 },
  TN: { lat: 33.89, lng: 9.54 },
  SN: { lat: 14.5, lng: -14.45 },
  CM: { lat: 7.37, lng: 12.35 },
  CI: { lat: 7.54, lng: -5.55 },
  JP: { lat: 36.2, lng: 138.25 },
  KR: { lat: 35.91, lng: 127.77 },
  CN: { lat: 35.86, lng: 104.2 },
  IN: { lat: 20.59, lng: 78.96 },
  AU: { lat: -25.27, lng: 133.77 },
  NZ: { lat: -40.9, lng: 174.89 },
};

function project(lat: number, lng: number, width: number, height: number) {
  const x = ((lng + 180) / 360) * width;
  const y = ((90 - lat) / 180) * height;
  return { x, y };
}

interface SvgMapLocation {
  id: string;
  name: string;
  path: string;
}

function parseViewBox(viewBox: string): { minX: number; minY: number; width: number; height: number } {
  const parts = viewBox
    .split(/\s+/)
    .map((value) => Number.parseFloat(value))
    .filter((value) => Number.isFinite(value));
  if (parts.length !== 4) return { minX: 0, minY: 0, width: 2000, height: 1001 };
  return { minX: parts[0], minY: parts[1], width: parts[2], height: parts[3] };
}

export default function WorldConnectionsMap({
  countries,
  onCountryClick,
  selectedCountry,
}: {
  countries: CountryConnectionPoint[];
  onCountryClick?: (countryCode: string) => void;
  selectedCountry?: string;
}) {
  const [hovered, setHovered] = useState<CountryConnectionPoint | null>(null);
  const mapData = worldMap as unknown as {
    viewBox: string;
    locations: SvgMapLocation[];
  };
  const worldViewBox = useMemo(() => parseViewBox(mapData.viewBox), [mapData.viewBox]);
  const countryIndex = useMemo(() => {
    const index = new Map<string, CountryConnectionPoint>();
    for (const country of countries) {
      index.set(country.countryCode.toLowerCase(), country);
    }
    return index;
  }, [countries]);

  const points = useMemo(
    () =>
      countries
        .map((country) => {
          const centroid = COUNTRY_CENTROIDS[country.countryCode];
          if (!centroid) return null;
          return {
            ...country,
            ...project(centroid.lat, centroid.lng, worldViewBox.width, worldViewBox.height),
          };
        })
        .filter(Boolean) as Array<CountryConnectionPoint & { x: number; y: number }>,
    [countries, worldViewBox.width, worldViewBox.height]
  );

  const maxCount = Math.max(1, ...countries.map((country) => country.count));

  return (
    <div className="rounded-lg border border-[#2a2a2d] bg-[#111114] p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Carte mondiale des connexions</h3>
        <p className="text-xs text-gray-400">Regroupement par pays</p>
      </div>
      <div className="relative overflow-hidden rounded-lg border border-[#26262a] bg-[#0b0b0e]">
        <svg viewBox={mapData.viewBox} className="h-[360px] w-full" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="worldGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#121220" />
              <stop offset="100%" stopColor="#0a0a12" />
            </linearGradient>
            <linearGradient id="countryFill" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#1c2438" />
              <stop offset="100%" stopColor="#161d2f" />
            </linearGradient>
          </defs>

          <rect
            x={worldViewBox.minX}
            y={worldViewBox.minY}
            width={worldViewBox.width}
            height={worldViewBox.height}
            fill="url(#worldGrad)"
          />

          {[1, 2, 3, 4, 5].map((line) => (
            <line
              key={`h-${line}`}
              x1={worldViewBox.minX}
              x2={worldViewBox.minX + worldViewBox.width}
              y1={worldViewBox.minY + (line * worldViewBox.height) / 6}
              y2={worldViewBox.minY + (line * worldViewBox.height) / 6}
              stroke="#1b1f31"
              strokeWidth={1}
            />
          ))}
          {[1, 2, 3, 4, 5, 6, 7].map((line) => (
            <line
              key={`v-${line}`}
              y1={worldViewBox.minY}
              y2={worldViewBox.minY + worldViewBox.height}
              x1={worldViewBox.minX + (line * worldViewBox.width) / 8}
              x2={worldViewBox.minX + (line * worldViewBox.width) / 8}
              stroke="#181c2a"
              strokeWidth={1}
            />
          ))}

          <g>
            {mapData.locations.map((location) => {
              const country = countryIndex.get(location.id.toLowerCase());
              const isSelected = selectedCountry?.toLowerCase() === location.id.toLowerCase();
              const hasConnections = Boolean(country && country.count > 0);
              return (
                <path
                  key={location.id}
                  d={location.path}
                  fill={isSelected ? "#2c3f7e" : hasConnections ? "#263a71" : "url(#countryFill)"}
                  stroke={isSelected ? "#8ea9ff" : hasConnections ? "#6f8ef7" : "#3b4866"}
                  strokeWidth={isSelected ? 1.4 : 0.85}
                  opacity={hasConnections ? 0.95 : 0.78}
                />
              );
            })}
          </g>

          {points.map((point) => {
            const ratio = point.count / maxCount;
            const radius = 4 + ratio * 12;
            const isSelected = selectedCountry === point.countryCode;
            return (
              <g
                key={point.countryCode}
                onMouseEnter={() => setHovered(point)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => onCountryClick?.(point.countryCode)}
                style={{ cursor: "pointer" }}
              >
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={radius + 4}
                  fill={isSelected ? "rgba(145,70,255,0.35)" : "rgba(88,101,242,0.28)"}
                />
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={radius}
                  fill={isSelected ? "#9146ff" : "#4f7cff"}
                  stroke="#ffffff"
                  strokeWidth="1.2"
                />
              </g>
            );
          })}
        </svg>

        {hovered && (
          <div className="pointer-events-none absolute left-3 top-3 rounded-md border border-[#3a3a42] bg-[#14141b]/95 px-3 py-2 text-xs text-gray-200">
            <p className="font-semibold text-white">{hovered.countryName}</p>
            <p>{hovered.count} connexion(s)</p>
            {typeof hovered.members === "number" && typeof hovered.general === "number" ? (
              <p className="text-[11px] text-gray-300">
                {hovered.members} membres · {hovered.general} visiteurs
              </p>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";

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
  const points = useMemo(
    () =>
      countries
        .map((country) => {
          const centroid = COUNTRY_CENTROIDS[country.countryCode];
          if (!centroid) return null;
          return { ...country, ...project(centroid.lat, centroid.lng, 920, 420) };
        })
        .filter(Boolean) as Array<CountryConnectionPoint & { x: number; y: number }>,
    [countries]
  );

  const maxCount = Math.max(1, ...countries.map((country) => country.count));

  return (
    <div className="rounded-lg border border-[#2a2a2d] bg-[#111114] p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Carte mondiale des connexions</h3>
        <p className="text-xs text-gray-400">Regroupement par pays</p>
      </div>
      <div className="relative overflow-hidden rounded-lg border border-[#26262a] bg-[#0b0b0e]">
        <svg viewBox="0 0 920 420" className="h-[360px] w-full">
          <defs>
            <linearGradient id="worldGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#121220" />
              <stop offset="100%" stopColor="#0a0a12" />
            </linearGradient>
          </defs>

          <rect x="0" y="0" width="920" height="420" fill="url(#worldGrad)" />

          {[1, 2, 3, 4, 5].map((line) => (
            <line
              key={`h-${line}`}
              x1="0"
              x2="920"
              y1={line * 70}
              y2={line * 70}
              stroke="#1d2033"
              strokeWidth="1"
            />
          ))}
          {[1, 2, 3, 4, 5, 6, 7].map((line) => (
            <line
              key={`v-${line}`}
              y1="0"
              y2="420"
              x1={line * 115}
              x2={line * 115}
              stroke="#1a1d2c"
              strokeWidth="1"
            />
          ))}

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

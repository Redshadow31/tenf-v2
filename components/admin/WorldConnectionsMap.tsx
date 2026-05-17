"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Globe2 } from "lucide-react";
import worldMap from "@svg-maps/world";
import { ALI } from "@/components/admin/audit-logs/auditLogsUi";

export interface CountryConnectionPoint {
  countryCode: string;
  countryName: string;
  continent?: string;
  count: number;
  members?: number;
  general?: number;
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
  const pathRefs = useRef<Record<string, SVGPathElement | null>>({});
  const [pathCenters, setPathCenters] = useState<Record<string, { x: number; y: number }>>({});
  const mapData = worldMap as unknown as { viewBox: string; locations: SvgMapLocation[] };
  const worldViewBox = useMemo(() => parseViewBox(mapData.viewBox), [mapData.viewBox]);

  const countryIndex = useMemo(() => {
    const index = new Map<string, CountryConnectionPoint>();
    for (const country of countries) {
      index.set(country.countryCode.toLowerCase(), country);
    }
    return index;
  }, [countries]);

  const topCountries = useMemo(
    () => [...countries].sort((a, b) => b.count - a.count).slice(0, 5),
    [countries],
  );

  const topCountriesSummary = useMemo(() => {
    if (topCountries.length === 0) return "Aucune connexion géolocalisée sur la période.";
    return topCountries.map((c) => `${c.countryName} (${c.count})`).join(" · ");
  }, [topCountries]);

  const totalOnMap = useMemo(
    () => countries.reduce((sum, c) => sum + c.count, 0),
    [countries],
  );

  useEffect(() => {
    const nextCenters: Record<string, { x: number; y: number }> = {};
    for (const country of countries) {
      const code = country.countryCode.toLowerCase();
      const path = pathRefs.current[code];
      if (!path) continue;
      const box = path.getBBox();
      if (!Number.isFinite(box.x) || !Number.isFinite(box.y) || box.width <= 0 || box.height <= 0) continue;
      nextCenters[code] = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    }
    setPathCenters(nextCenters);
  }, [countries]);

  const points = useMemo(
    () =>
      countries
        .map((country) => {
          const center = pathCenters[country.countryCode.toLowerCase()];
          if (!center) return null;
          return { ...country, ...center };
        })
        .filter(Boolean) as Array<CountryConnectionPoint & { x: number; y: number }>,
    [countries, pathCenters],
  );

  const maxCount = Math.max(1, ...countries.map((c) => c.count));

  return (
    <section
      className={`overflow-hidden ${ALI.card}`}
      aria-labelledby="world-map-title"
    >
      <header
        className={`flex flex-wrap items-center justify-between gap-3 ${ALI.panelHeader}`}
        style={{ padding: "clamp(0.75rem, 1vw, 1rem) clamp(0.85rem, 1vw, 1.1rem)" }}
      >
        <div className="flex items-center gap-3">
          <span className={`${ALI.iconBox} ${ALI.iconCyan}`} aria-hidden>
            <Globe2 className="h-4 w-4" />
          </span>
          <div>
            <p className={ALI.sectionLabel}>Géographie</p>
            <h3 id="world-map-title" className={`text-lg font-bold ${ALI.text}`}>
              Carte mondiale des connexions
            </h3>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {totalOnMap > 0 ? (
            <span className={ALI.badge}>{totalOnMap} connexion{totalOnMap > 1 ? "s" : ""}</span>
          ) : null}
          <span className={`text-xs ${ALI.textMuted}`}>Clic sur un pays pour filtrer</span>
        </div>
      </header>

      <div
        className="relative border-t border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-bg)_88%,var(--color-card))]"
        role="img"
        aria-label={`Carte des connexions. ${topCountriesSummary}`}
      >
        <svg
          viewBox={mapData.viewBox}
          className="h-[min(380px,52vh)] w-full md:h-[min(480px,48vh)]"
          preserveAspectRatio="xMidYMid meet"
          aria-hidden
        >
          <rect
            x={worldViewBox.minX}
            y={worldViewBox.minY}
            width={worldViewBox.width}
            height={worldViewBox.height}
            fill="color-mix(in srgb, var(--color-bg) 90%, var(--color-card))"
          />
          <g>
            {mapData.locations.map((location) => {
              const country = countryIndex.get(location.id.toLowerCase());
              const isSelected = selectedCountry?.toLowerCase() === location.id.toLowerCase();
              const hasConnections = Boolean(country && country.count > 0);
              return (
                <path
                  key={location.id}
                  ref={(node) => {
                    pathRefs.current[location.id.toLowerCase()] = node;
                  }}
                  d={location.path}
                  fill={
                    isSelected
                      ? "color-mix(in srgb, var(--color-primary) 50%, var(--color-card))"
                      : hasConnections
                        ? "color-mix(in srgb, var(--color-primary) 24%, var(--color-card))"
                        : "color-mix(in srgb, var(--color-text) 5%, var(--color-card))"
                  }
                  stroke={
                    isSelected
                      ? "color-mix(in srgb, var(--color-primary) 75%, transparent)"
                      : hasConnections
                        ? "color-mix(in srgb, var(--color-primary) 45%, var(--color-border))"
                        : "var(--color-border)"
                  }
                  strokeWidth={isSelected ? 1.5 : 0.85}
                />
              );
            })}
          </g>
          {points.map((point) => {
            const ratio = point.count / maxCount;
            const radius = 4 + ratio * 11;
            const isSelected = selectedCountry === point.countryCode;
            const label = `${point.countryName}, ${point.count} connexion${point.count > 1 ? "s" : ""}`;
            return (
              <g
                key={point.countryCode}
                onMouseEnter={() => setHovered(point)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => onCountryClick?.(point.countryCode)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onCountryClick?.(point.countryCode);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label={label}
                style={{ cursor: "pointer" }}
              >
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={radius + 5}
                  fill={isSelected ? "rgba(145,70,255,0.35)" : "rgba(88,101,242,0.25)"}
                />
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={radius}
                  fill={isSelected ? "#9146ff" : "#4f7cff"}
                  stroke="var(--color-card)"
                  strokeWidth="1.2"
                />
              </g>
            );
          })}
        </svg>

        {hovered ? (
          <div
            className="pointer-events-none absolute left-4 top-4 rounded-xl border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-card)_97%,var(--color-bg))] px-3 py-2 shadow-lg"
            aria-hidden
          >
            <p className={`font-bold ${ALI.text}`}>{hovered.countryName}</p>
            <p className={`text-sm ${ALI.textSecondary}`}>{hovered.count} connexion(s)</p>
          </div>
        ) : null}
      </div>

      <footer
        className="border-t border-[var(--color-border)] px-4 py-3"
        style={{ backgroundColor: "color-mix(in srgb, var(--color-text) 2%, var(--color-card))" }}
      >
        <p className={`text-sm ${ALI.textSecondary}`}>
          <span className="sr-only">Principaux pays : </span>
          <span className={`font-medium ${ALI.text}`}>Top pays — </span>
          {topCountriesSummary}
        </p>
      </footer>
    </section>
  );
}

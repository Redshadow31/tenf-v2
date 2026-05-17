"use client";

import { useId } from "react";

type DashboardScoreRingProps = {
  percent: number;
  accentHex: string;
  size?: number;
  /** Texte affiché sous l'anneau. */
  caption?: string;
};

export default function DashboardScoreRing({
  percent,
  accentHex,
  size = 132,
  caption = "Moyenne raids / présences / profil",
}: DashboardScoreRingProps) {
  const gradientId = useId();
  const stroke = 11;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = Math.min(100, Math.max(0, percent));
  const offset = c - (p / 100) * c;

  return (
    <div className="relative flex flex-col items-center">
      <div
        className="relative flex shrink-0 items-center justify-center"
        style={{ width: size + 10, height: size + 10 }}
        aria-label={`Progression du mois : ${p}%`}
        role="img"
      >
        <svg width={size} height={size} className="-rotate-90 drop-shadow-lg" aria-hidden>
          <defs>
            <linearGradient id={`${gradientId}-dash`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={accentHex} />
              <stop offset="100%" stopColor="#a78bfa" />
            </linearGradient>
          </defs>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={`url(#${gradientId}-dash)`}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
            className="transition-[stroke-dashoffset] duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-black text-white tabular-nums">{p}%</span>
          <span className="text-[10px] font-semibold uppercase tracking-wide text-white/55">
            mois
          </span>
        </div>
      </div>
      {caption ? (
        <p className="mt-2 max-w-[14rem] text-center text-[11px] text-white/45">{caption}</p>
      ) : null}
    </div>
  );
}

"use client";

import { useId } from "react";

type ProfileCompletionRingProps = {
  percent: number;
  /** Taille en em pour scaler au zoom et au contexte typographique. */
  sizeEm?: number;
  strokeRatio?: number;
};

/**
 * Anneau circulaire de complétion. Tailles en `em` pour que tout scale avec la font-size
 * du conteneur — utile pour le zoom navigateur et les changements de densité.
 */
export default function ProfileCompletionRing({ percent, sizeEm = 8, strokeRatio = 0.09 }: ProfileCompletionRingProps) {
  const gid = useId();
  const gradId = `profile-ring-${gid.replace(/:/g, "")}`;
  const p = Math.max(0, Math.min(100, percent));
  const viewBox = 100;
  const r = 44;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (p / 100) * circumference;
  const stroke = viewBox * strokeRatio;

  return (
    <div
      className="relative grid shrink-0 place-items-center"
      style={{ width: `${sizeEm}em`, height: `${sizeEm}em` }}
      aria-label={`Profil complété à ${p} pour cent`}
      role="img"
    >
      <svg className="absolute inset-0 -rotate-90" viewBox={`0 0 ${viewBox} ${viewBox}`} aria-hidden>
        <circle cx={viewBox / 2} cy={viewBox / 2} r={r} stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} fill="none" />
        <circle
          cx={viewBox / 2}
          cy={viewBox / 2}
          r={r}
          stroke={`url(#${gradId})`}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a78bfa" />
            <stop offset="100%" stopColor="#f472b6" />
          </linearGradient>
        </defs>
      </svg>
      <div className="relative text-center leading-tight">
        <p className="font-black tabular-nums text-white" style={{ fontSize: "1.55em" }}>
          {p}
        </p>
        <p className="font-bold uppercase tracking-[0.15em] text-zinc-500" style={{ fontSize: "0.55em" }}>
          % complété
        </p>
      </div>
    </div>
  );
}

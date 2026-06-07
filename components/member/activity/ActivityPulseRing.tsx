"use client";

import { useId } from "react";

type ActivityPulseRingProps = {
  value: number;
};

export default function ActivityPulseRing({ value }: ActivityPulseRingProps) {
  const gradientId = useId();
  const size = 124;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(100, Math.max(0, value)) / 100) * c;

  return (
    <div className="relative flex h-[132px] w-[132px] shrink-0 items-center justify-center">
      <svg width={size} height={size} className="-rotate-90 drop-shadow-lg" aria-hidden>
        <defs>
          <linearGradient id={`${gradientId}-act`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fb923c" />
            <stop offset="50%" stopColor="#f472b6" />
            <stop offset="100%" stopColor="#a78bfa" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${gradientId}-act)`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-black text-white">{value}%</span>
        <span className="text-[9px] font-semibold uppercase tracking-wide text-orange-200/80">intensité</span>
      </div>
    </div>
  );
}

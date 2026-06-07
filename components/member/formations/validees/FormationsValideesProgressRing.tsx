"use client";

import { useId } from "react";

type FormationsValideesProgressRingProps = {
  value: number;
};

export default function FormationsValideesProgressRing({ value }: FormationsValideesProgressRingProps) {
  const reactId = useId().replace(/:/g, "");
  const gradId = `formation-ring-gradient-${reactId}`;
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="relative h-36 w-36 shrink-0">
      <svg viewBox="0 0 140 140" className="h-36 w-36 -rotate-90" aria-hidden>
        <circle cx="70" cy="70" r={radius} stroke="rgba(255,255,255,0.14)" strokeWidth="12" fill="transparent" />
        <circle
          cx="70"
          cy="70"
          r={radius}
          stroke={`url(#${gradId})`}
          strokeWidth="12"
          strokeLinecap="round"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f0c96b" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-3xl font-bold tabular-nums text-white">{clamped}%</p>
        <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/45">Objectif</p>
      </div>
    </div>
  );
}

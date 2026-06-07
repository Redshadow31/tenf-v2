"use client";

import { hexToRgba } from "@/components/member/dashboard/memberDashboardModel";

type DashboardProgressRingProps = {
  percent: number;
  accentHex: string;
  size?: number;
  stroke?: number;
  label?: string;
};

export default function DashboardProgressRing({
  percent,
  accentHex,
  size = 52,
  stroke = 5,
  label,
}: DashboardProgressRingProps) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, percent));
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="relative inline-flex shrink-0 items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={hexToRgba(accentHex, 0.92)}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <span
        className="absolute text-[10px] font-bold tabular-nums"
        style={{ color: hexToRgba(accentHex, 0.95) }}
        aria-hidden
      >
        {label ?? `${clamped}%`}
      </span>
    </div>
  );
}

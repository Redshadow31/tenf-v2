"use client";

import type { ReactNode } from "react";
import { evalDKickerClass } from "@/lib/admin/evaluation-d/evaluationDStyles";

type Tone = "violet" | "emerald" | "amber" | "sky" | "pink" | "neutral";

const toneStyles: Record<Tone, { icon: string; bar: string }> = {
  violet: {
    icon: "border-violet-500/30 bg-violet-500/15 text-violet-200",
    bar: "from-violet-500/80 to-violet-700/40",
  },
  emerald: {
    icon: "border-emerald-500/30 bg-emerald-500/15 text-emerald-200",
    bar: "from-emerald-500/80 to-emerald-700/40",
  },
  amber: {
    icon: "border-amber-500/30 bg-amber-500/15 text-amber-200",
    bar: "from-amber-500/80 to-amber-700/40",
  },
  sky: {
    icon: "border-sky-500/30 bg-sky-500/15 text-sky-200",
    bar: "from-sky-500/80 to-sky-700/40",
  },
  pink: {
    icon: "border-pink-500/30 bg-pink-500/15 text-pink-200",
    bar: "from-pink-500/80 to-pink-700/40",
  },
  neutral: {
    icon: "border-white/10 bg-white/[0.04] text-zinc-300",
    bar: "from-zinc-500/60 to-zinc-700/30",
  },
};

type Props = {
  kicker: string;
  title: string;
  intro?: string;
  icon?: ReactNode;
  tone?: Tone;
  className?: string;
};

/** Séparateur organisationnel entre blocs d'un même onglet */
export default function EvaluationDSectionHeader({
  kicker,
  title,
  intro,
  icon,
  tone = "violet",
  className = "",
}: Props) {
  const t = toneStyles[tone];
  return (
    <div className={`relative mb-4 min-w-0 ${className}`}>
      <div className={`mb-3 h-0.5 w-12 rounded-full bg-gradient-to-r ${t.bar}`} aria-hidden />
      <div className="flex items-start gap-3">
        {icon ? (
          <span className={`inline-flex shrink-0 rounded-xl border p-2.5 ${t.icon}`} aria-hidden>
            {icon}
          </span>
        ) : null}
        <div className="min-w-0">
          <p className={evalDKickerClass}>{kicker}</p>
          <h3 className="mt-0.5 text-[clamp(0.95rem,1.2vw,1.1rem)] font-bold tracking-tight text-white">{title}</h3>
          {intro ? <p className="mt-1 max-w-2xl text-xs leading-relaxed text-zinc-500">{intro}</p> : null}
        </div>
      </div>
    </div>
  );
}

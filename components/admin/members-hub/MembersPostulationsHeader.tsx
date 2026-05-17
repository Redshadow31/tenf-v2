"use client";

import type { LucideIcon } from "lucide-react";
import { ChevronRight, HeartHandshake, RefreshCw, Sparkles } from "lucide-react";
import {
  hubCardClass,
  hubFocusRingClass,
  hubGhostButtonClass,
  hubSectionLabelClass,
} from "./membersHubStyles";

const PIPELINE_LABELS = ["Réception", "Contact", "Entretien", "Décision"] as const;

type KpiTone = "zinc" | "sky" | "emerald" | "rose";

export type PostulationsKpiCard = {
  label: string;
  value: number;
  sub: string;
  icon: LucideIcon;
  tone: KpiTone;
  onClick: () => void;
};

const kpiToneClass: Record<
  KpiTone,
  { border: string; bg: string; iconBox: string; valueText: string; halo: string }
> = {
  zinc: {
    border: "border-zinc-400/25 hover:border-zinc-300/40",
    bg: "bg-[linear-gradient(155deg,rgba(113,113,122,0.12),rgba(11,13,20,0.88))]",
    iconBox: "bg-zinc-500/15 text-zinc-200",
    valueText: "text-zinc-100",
    halo: "bg-zinc-500/10",
  },
  sky: {
    border: "border-sky-400/30 hover:border-sky-300/45",
    bg: "bg-[linear-gradient(155deg,rgba(14,165,233,0.12),rgba(11,13,20,0.88))]",
    iconBox: "bg-sky-500/15 text-sky-200",
    valueText: "text-sky-100",
    halo: "bg-sky-500/12",
  },
  emerald: {
    border: "border-emerald-400/30 hover:border-emerald-300/45",
    bg: "bg-[linear-gradient(155deg,rgba(16,185,129,0.11),rgba(11,13,20,0.88))]",
    iconBox: "bg-emerald-500/15 text-emerald-200",
    valueText: "text-emerald-100",
    halo: "bg-emerald-500/10",
  },
  rose: {
    border: "border-rose-400/30 hover:border-rose-300/45",
    bg: "bg-[linear-gradient(155deg,rgba(244,63,94,0.11),rgba(11,13,20,0.88))]",
    iconBox: "bg-rose-500/15 text-rose-200",
    valueText: "text-rose-100",
    halo: "bg-rose-500/10",
  },
};

type Props = {
  refreshing: boolean;
  onRefresh: () => void;
  kpiCards: PostulationsKpiCard[];
};

export default function MembersPostulationsHeader({ refreshing, onRefresh, kpiCards }: Props) {
  return (
    <header
      className={`relative overflow-hidden ${hubCardClass}`}
      style={{ padding: "clamp(1.15rem, 0.95rem + 0.7vw, 1.9rem)" }}
    >
      <div
        className="pointer-events-none absolute -right-24 -top-20 h-64 w-64 rounded-full bg-violet-500/18 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-sky-500/[0.07] blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute right-1/3 top-1/2 h-40 w-40 -translate-y-1/2 rounded-full bg-rose-500/[0.05] blur-3xl"
        aria-hidden
      />

      <div className="relative flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
        <div className="min-w-0 max-w-2xl flex-1">
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.11em] text-zinc-200/90">
              Membres TENF
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-400/26 bg-violet-500/10 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.11em] text-violet-100/92">
              <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden />
              Cockpit staff
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/22 bg-emerald-500/8 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.11em] text-emerald-100/90">
              <HeartHandshake className="h-3.5 w-3.5 shrink-0" aria-hidden />
              Recrutement
            </span>
          </div>
          <p className={`${hubSectionLabelClass} mt-3`}>Postulations modération &amp; soutien</p>
          <h1
            className="mt-1 font-semibold tracking-tight text-white"
            style={{
              fontSize: "clamp(1.35rem, 1.1rem + 0.9vw, 2rem)",
              lineHeight: 1.15,
            }}
          >
            Parcours candidat staff
          </h1>
          <p
            className="mt-2 text-zinc-300/90"
            style={{
              fontSize: "clamp(0.82rem, 0.78rem + 0.15vw, 0.95rem)",
              lineHeight: 1.55,
              maxWidth: "58ch",
            }}
          >
            Lecture humaine des réponses, relecture croisée, entretien puis décision — chaque dossier engage la
            confiance des membres TENF.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            {PIPELINE_LABELS.map((label, i) => (
              <div key={label} className="flex items-center gap-2">
                <span className="rounded-full border border-white/12 bg-white/[0.05] px-3 py-1 text-[11px] font-medium text-zinc-300 ring-1 ring-inset ring-white/[0.04]">
                  {i + 1}. {label}
                </span>
                {i < PIPELINE_LABELS.length - 1 ? (
                  <ChevronRight className="h-4 w-4 shrink-0 text-zinc-600" aria-hidden />
                ) : null}
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          className={`${hubGhostButtonClass} shrink-0 disabled:opacity-60 ${hubFocusRingClass}`}
        >
          <RefreshCw className={`h-4 w-4 shrink-0 ${refreshing ? "animate-spin" : ""}`} aria-hidden />
          {refreshing ? "Actualisation…" : "Actualiser"}
        </button>
      </div>

      <div className="relative mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          const tones = kpiToneClass[card.tone];
          return (
            <button
              key={card.label}
              type="button"
              onClick={card.onClick}
              className={`group relative overflow-hidden rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 ${tones.border} ${tones.bg} ${hubFocusRingClass}`}
            >
              <span
                className={`pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full ${tones.halo} blur-2xl transition group-hover:scale-110`}
                aria-hidden
              />
              <span
                className={`relative inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 ${tones.iconBox}`}
              >
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              <p className="relative mt-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
                {card.label}
              </p>
              <p className={`relative mt-1 text-2xl font-bold tabular-nums ${tones.valueText}`}>{card.value}</p>
              <p className="relative mt-1 text-[11px] text-zinc-500">{card.sub}</p>
            </button>
          );
        })}
      </div>
    </header>
  );
}

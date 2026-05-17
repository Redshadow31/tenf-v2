"use client";

import Link from "next/link";
import { ArrowRight, Flame, HeartPulse, Sparkles, Stethoscope } from "lucide-react";
import type { MembersQualityTier } from "@/lib/admin/members/membersQualityScore";
import {
  hubCardClass,
  hubFocusRingClass,
  hubSectionLabelClass,
} from "./membersHubStyles";

type Props = {
  urgentCount: number;
  importantCount: number;
  pendingTotal: number;
  qualityScore: number;
  qualityTier: MembersQualityTier;
  weakSignalsCount: number;
};

const TIER_LABEL: Record<MembersQualityTier, { label: string; tone: string }> = {
  excellent: { label: "excellente", tone: "text-emerald-200" },
  ok: { label: "stable", tone: "text-indigo-200" },
  fragile: { label: "fragile", tone: "text-amber-200" },
  critique: { label: "critique", tone: "text-rose-200" },
};

/**
 * Bloc d'introduction "Aujourd'hui dans TENF".
 *
 * Synthétise en une phrase l'état réel de la communauté, puis offre 3 chips
 * compacts vers les pages détail. N'invente aucune donnée : si la file est
 * vide, le message est positif et oriente vers la valorisation.
 */
export default function MembersTodayPulse({
  urgentCount,
  importantCount,
  pendingTotal,
  qualityScore,
  qualityTier,
  weakSignalsCount,
}: Props) {
  const tier = TIER_LABEL[qualityTier];

  // Phrase dynamique, humaine, jamais inventée.
  const headline = (() => {
    if (urgentCount > 0) {
      return (
        <>
          <span className="text-rose-200">{urgentCount}</span> action
          {urgentCount > 1 ? "s" : ""} bloque
          {urgentCount > 1 ? "nt" : ""} des créateurs aujourd'hui.
        </>
      );
    }
    if (importantCount > 0) {
      return (
        <>
          Pas d'urgence — mais <span className="text-amber-200">{importantCount}</span> dossier
          {importantCount > 1 ? "s" : ""} important
          {importantCount > 1 ? "s" : ""} à instruire cette semaine.
        </>
      );
    }
    if (weakSignalsCount > 0) {
      return (
        <>
          Tout est sous contrôle. <span className="text-indigo-200">{weakSignalsCount}</span> signa
          {weakSignalsCount > 1 ? "ux" : "l"} à surveiller doucement.
        </>
      );
    }
    return (
      <>
        Tout est calme côté membres. Profitez-en pour{" "}
        <span className="text-violet-200">valoriser un créateur</span>.
      </>
    );
  })();

  const Icon = urgentCount > 0 ? Flame : importantCount > 0 ? Stethoscope : HeartPulse;
  const iconClass =
    urgentCount > 0
      ? "bg-rose-500/15 text-rose-200 border-rose-400/30"
      : importantCount > 0
        ? "bg-amber-500/15 text-amber-200 border-amber-400/30"
        : "bg-emerald-500/15 text-emerald-200 border-emerald-400/30";

  return (
    <section
      className={hubCardClass}
      style={{ padding: "clamp(0.9rem, 0.8rem + 0.5vw, 1.4rem)" }}
      aria-labelledby="members-hub-today-pulse"
    >
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${iconClass}`}
            aria-hidden
          >
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p id="members-hub-today-pulse" className={hubSectionLabelClass}>
              Aujourd'hui dans TENF
            </p>
            <p
              className="mt-1 font-semibold text-white"
              style={{
                fontSize: "clamp(0.9rem, 0.84rem + 0.25vw, 1.05rem)",
                lineHeight: 1.4,
                maxWidth: "60ch",
              }}
            >
              {headline}
            </p>
          </div>
        </div>

        <div
          className="flex max-w-full flex-wrap items-center gap-1.5"
          aria-label="Chiffres clés du pouls communauté"
        >
          <Link
            href="/admin/membres/actions"
            className={`group inline-flex max-w-full flex-wrap items-center gap-1.5 rounded-full border border-rose-400/30 bg-rose-500/[0.08] px-2.5 py-1 text-[0.7rem] font-semibold text-rose-100 transition hover:bg-rose-500/20 ${hubFocusRingClass}`}
          >
            <span className="font-bold tabular-nums">{urgentCount}</span>
            <span className="text-rose-100/85">urgents</span>
            <ArrowRight className="h-3 w-3 shrink-0 opacity-70 transition group-hover:translate-x-0.5" aria-hidden />
          </Link>
          <Link
            href="/admin/membres/actions"
            className={`group inline-flex max-w-full flex-wrap items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-500/[0.08] px-2.5 py-1 text-[0.7rem] font-semibold text-amber-100 transition hover:bg-amber-500/20 ${hubFocusRingClass}`}
          >
            <span className="font-bold tabular-nums">{pendingTotal}</span>
            <span className="text-amber-100/85">en file</span>
            <ArrowRight className="h-3 w-3 shrink-0 opacity-70 transition group-hover:translate-x-0.5" aria-hidden />
          </Link>
          <Link
            href="/admin/membres/qualite-data"
            className={`group inline-flex max-w-full flex-wrap items-center gap-1.5 rounded-full border border-indigo-300/30 bg-indigo-500/[0.08] px-2.5 py-1 text-[0.7rem] font-semibold text-indigo-100 transition hover:bg-indigo-500/20 ${hubFocusRingClass}`}
          >
            <Sparkles className="h-3 w-3 shrink-0 opacity-70" aria-hidden />
            <span className="font-bold tabular-nums">{qualityScore}/100</span>
            <span className={tier.tone}>{tier.label}</span>
            <ArrowRight className="h-3 w-3 shrink-0 opacity-70 transition group-hover:translate-x-0.5" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}

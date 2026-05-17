"use client";

import Link from "next/link";
import { Activity, ArrowUpRight, Database, ShieldCheck, UserCheck2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  MEMBERS_QUALITY_SCORE_EXPLAINER,
  type MembersQualityTier,
} from "@/lib/admin/members/membersQualityScore";
import {
  hubFocusRingClass,
  hubSectionLabelClass,
  hubSectionTitleClass,
} from "./membersHubStyles";

type Tone = "indigo" | "violet" | "emerald" | "amber" | "rose" | "cyan";

type HealthCardProps = {
  label: string;
  href: string;
  value: string;
  caption: string;
  icon: LucideIcon;
  tone: Tone;
};

const toneClass: Record<Tone, { border: string; bg: string; iconBox: string; valueText: string; halo: string }> = {
  indigo: {
    border: "border-indigo-300/25 hover:border-indigo-200/45",
    bg: "bg-[linear-gradient(155deg,rgba(99,102,241,0.14),rgba(11,13,20,0.85))]",
    iconBox: "bg-indigo-500/15 text-indigo-200",
    valueText: "text-indigo-100",
    halo: "bg-indigo-500/10",
  },
  violet: {
    border: "border-violet-300/25 hover:border-violet-200/45",
    bg: "bg-[linear-gradient(155deg,rgba(139,92,246,0.13),rgba(11,13,20,0.85))]",
    iconBox: "bg-violet-500/15 text-violet-200",
    valueText: "text-violet-100",
    halo: "bg-violet-500/10",
  },
  emerald: {
    border: "border-emerald-300/25 hover:border-emerald-200/45",
    bg: "bg-[linear-gradient(155deg,rgba(16,185,129,0.10),rgba(11,13,20,0.85))]",
    iconBox: "bg-emerald-500/15 text-emerald-200",
    valueText: "text-emerald-100",
    halo: "bg-emerald-500/10",
  },
  amber: {
    border: "border-amber-300/25 hover:border-amber-200/45",
    bg: "bg-[linear-gradient(155deg,rgba(245,158,11,0.12),rgba(11,13,20,0.85))]",
    iconBox: "bg-amber-500/15 text-amber-200",
    valueText: "text-amber-100",
    halo: "bg-amber-500/10",
  },
  rose: {
    border: "border-rose-300/25 hover:border-rose-200/45",
    bg: "bg-[linear-gradient(155deg,rgba(244,63,94,0.12),rgba(11,13,20,0.85))]",
    iconBox: "bg-rose-500/15 text-rose-200",
    valueText: "text-rose-100",
    halo: "bg-rose-500/10",
  },
  cyan: {
    border: "border-cyan-300/25 hover:border-cyan-200/45",
    bg: "bg-[linear-gradient(155deg,rgba(34,211,238,0.10),rgba(11,13,20,0.85))]",
    iconBox: "bg-cyan-500/15 text-cyan-200",
    valueText: "text-cyan-100",
    halo: "bg-cyan-500/10",
  },
};

function HealthCard({ label, href, value, caption, icon: Icon, tone }: HealthCardProps) {
  const tones = toneClass[tone];
  return (
    <Link
      href={href}
      className={`group relative overflow-hidden rounded-2xl border ${tones.border} ${tones.bg} p-4 transition hover:-translate-y-0.5 ${hubFocusRingClass}`}
    >
      <span
        className={`pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full ${tones.halo} blur-2xl transition group-hover:scale-110`}
        aria-hidden
      />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className={hubSectionLabelClass}>{label}</p>
          <p
            className={`mt-2 font-bold ${tones.valueText}`}
            style={{ fontSize: "clamp(1.45rem, 1.2rem + 0.9vw, 2.1rem)", lineHeight: 1.05 }}
          >
            {value}
          </p>
          <p
            className="mt-1.5 text-slate-400 group-hover:text-slate-300"
            style={{ fontSize: "clamp(0.7rem, 0.68rem + 0.08vw, 0.78rem)", lineHeight: 1.45 }}
          >
            {caption}
          </p>
        </div>
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tones.iconBox}`}
          aria-hidden
        >
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <span className="relative mt-3 inline-flex items-center gap-1 text-[0.7rem] font-semibold text-slate-300 group-hover:text-white">
        Ouvrir
        <ArrowUpRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" aria-hidden />
      </span>
    </Link>
  );
}

type Props = {
  totalMembers: number;
  validatedProfiles: number;
  qualityScore: number;
  qualityTier: MembersQualityTier;
  reviewOverdue: number;
  reviewDue7d: number;
  incomplete: number;
  profileValidationPending: number;
};

const QUALITY_TIER_TONE: Record<MembersQualityTier, Tone> = {
  excellent: "emerald",
  ok: "indigo",
  fragile: "amber",
  critique: "rose",
};

const QUALITY_TIER_LABEL: Record<MembersQualityTier, string> = {
  excellent: "Excellent",
  ok: "Stable",
  fragile: "Fragile",
  critique: "Critique",
};

export default function MembersHealthCards({
  totalMembers,
  validatedProfiles,
  qualityScore,
  qualityTier,
  reviewOverdue,
  reviewDue7d,
  incomplete,
  profileValidationPending,
}: Props) {
  const validatedRate =
    totalMembers > 0 ? Math.round((validatedProfiles / totalMembers) * 100) : 0;
  const accessPending = profileValidationPending + incomplete;

  return (
    <section aria-labelledby="members-hub-health">
      <header className="mb-3 flex items-end justify-between gap-3">
        <div>
          <p className={hubSectionLabelClass}>Santé de la communauté</p>
          <h2
            id="members-hub-health"
            className={`mt-1.5 ${hubSectionTitleClass}`}
            style={{ fontSize: "clamp(1.05rem, 0.9rem + 0.45vw, 1.3rem)" }}
          >
            Le pouls des créateurs TENF
          </h2>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <HealthCard
          label="Créateurs actifs"
          href="/admin/membres/gestion"
          value={`${totalMembers}`}
          caption={
            totalMembers > 0
              ? `${validatedRate}% de fiches validées par l'équipe`
              : "Aucun créateur détecté pour l'instant"
          }
          icon={UserCheck2}
          tone="violet"
        />
        <HealthCard
          label="Qualité des fiches"
          href="/admin/membres/qualite-data"
          value={`${qualityScore}/100`}
          caption={`Score ${QUALITY_TIER_LABEL[qualityTier].toLowerCase()} — ${MEMBERS_QUALITY_SCORE_EXPLAINER.toLowerCase()}`}
          icon={Database}
          tone={QUALITY_TIER_TONE[qualityTier]}
        />
        <HealthCard
          label="Suivi des créateurs"
          href="/admin/membres/revues"
          value={`${reviewOverdue}`}
          caption={
            reviewOverdue === 0
              ? `Toutes les revues sont à jour · ${reviewDue7d} prévue${reviewDue7d > 1 ? "s" : ""} cette semaine`
              : `${reviewOverdue} revue${reviewOverdue > 1 ? "s" : ""} en retard · ${reviewDue7d} à venir`
          }
          icon={ShieldCheck}
          tone={reviewOverdue > 0 ? "amber" : "indigo"}
        />
        <HealthCard
          label="Accès en attente"
          href={profileValidationPending > 0 ? "/admin/membres/validation-profil" : "/admin/membres/incomplets"}
          value={`${accessPending}`}
          caption={
            profileValidationPending > 0
              ? `${profileValidationPending} validation${profileValidationPending > 1 ? "s" : ""} + ${incomplete} profil${incomplete > 1 ? "s" : ""} à accompagner`
              : incomplete > 0
                ? `${incomplete} profil${incomplete > 1 ? "s" : ""} à accompagner — relance possible`
                : "Aucun créateur en attente d'accès"
          }
          icon={Activity}
          tone={accessPending > 0 ? "rose" : "emerald"}
        />
      </div>
    </section>
  );
}

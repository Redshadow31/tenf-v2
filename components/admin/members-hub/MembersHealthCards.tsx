"use client";

import Link from "next/link";
import { Activity, ArrowUpRight, Database, HeartPulse, ShieldCheck, UserCheck2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { MembersQualityTier } from "@/lib/admin/members/membersQualityScore";
import type { MembersHubCopyModel } from "@/lib/admin/members/membersHubCopyModel";
import { MembersHubPanel, MembersHubPanelHeader } from "@/components/admin/members-hub/MembersHubPanel";
import { hubFocusRingClass } from "./membersHubStyles";

type Tone = "indigo" | "violet" | "emerald" | "amber" | "rose" | "cyan";

type HealthCardProps = {
  label: string;
  href: string;
  value: string;
  caption: string;
  icon: LucideIcon;
  tone: Tone;
  openLabel: string;
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

function HealthCard({ label, href, value, caption, icon: Icon, tone, openLabel }: HealthCardProps) {
  const tones = toneClass[tone];
  return (
    <Link
      href={href}
      className={`group relative overflow-hidden rounded-2xl border ${tones.border} ${tones.bg} p-4 transition hover:-translate-y-0.5 ${hubFocusRingClass}`}
    >
      <span className={`pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full ${tones.halo} blur-2xl`} aria-hidden />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">{label}</p>
          <p className={`mt-2 text-3xl font-bold tabular-nums ${tones.valueText}`}>{value}</p>
          <p className="mt-1.5 text-xs leading-relaxed text-white/45 group-hover:text-white/60">{caption}</p>
        </div>
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tones.iconBox}`} aria-hidden>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <span className="relative mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-white/50 group-hover:text-white">
        {openLabel}
        <ArrowUpRight className="h-3 w-3" aria-hidden />
      </span>
    </Link>
  );
}

type Props = {
  copy: MembersHubCopyModel;
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

export default function MembersHealthCards({
  copy,
  totalMembers,
  validatedProfiles,
  qualityScore,
  qualityTier,
  reviewOverdue,
  reviewDue7d,
  incomplete,
  profileValidationPending,
}: Props) {
  const validatedRate = totalMembers > 0 ? Math.round((validatedProfiles / totalMembers) * 100) : 0;
  const accessPending = profileValidationPending + incomplete;

  return (
    <MembersHubPanel accentHex={copy.accent} tone="neutral" ariaLabelledBy="members-hub-health">
      <MembersHubPanelHeader
        kicker={copy.health.kicker}
        title={copy.health.title}
        intro={copy.health.intro}
        icon={HeartPulse}
        accentHex={copy.accent}
        titleId="members-hub-health"
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <HealthCard
          label={copy.health.activeLabel}
          href="/admin/membres/gestion"
          value={`${totalMembers}`}
          caption={copy.health.activeCaption(validatedRate, totalMembers)}
          icon={UserCheck2}
          tone="violet"
          openLabel={copy.health.openAction}
        />
        <HealthCard
          label={copy.health.qualityLabel}
          href="/admin/membres/qualite-data"
          value={`${qualityScore}/100`}
          caption={copy.health.qualityCaption(qualityScore, qualityTier)}
          icon={Database}
          tone={QUALITY_TIER_TONE[qualityTier]}
          openLabel={copy.health.openAction}
        />
        <HealthCard
          label={copy.health.reviewLabel}
          href="/admin/membres/revues"
          value={`${reviewOverdue}`}
          caption={copy.health.reviewCaption(reviewOverdue, reviewDue7d)}
          icon={ShieldCheck}
          tone={reviewOverdue > 0 ? "amber" : "indigo"}
          openLabel={copy.health.openAction}
        />
        <HealthCard
          label={copy.health.accessLabel}
          href={profileValidationPending > 0 ? "/admin/membres/validation-profil" : "/admin/membres/incomplets"}
          value={`${accessPending}`}
          caption={copy.health.accessCaption(profileValidationPending, incomplete)}
          icon={Activity}
          tone={accessPending > 0 ? "rose" : "emerald"}
          openLabel={copy.health.openAction}
        />
      </div>
    </MembersHubPanel>
  );
}

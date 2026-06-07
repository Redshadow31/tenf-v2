"use client";

import Link from "next/link";
import { ArrowUpRight, CheckCircle2, Clock3, ShieldCheck, Target } from "lucide-react";
import type { MemberProfileModel } from "@/components/member/profil/memberProfileModel";
import { hexToRgba } from "@/components/member/profil/memberProfileModel";
import StatusBadge from "@/components/member/ui/StatusBadge";
import {
  DashboardInnerCard,
  DashboardPanel,
  DashboardPanelHeader,
  MEMBER_SCROLL_MT,
} from "@/components/member/dashboard/dashboardUi";

type ProfileMetaPanelProps = {
  model: MemberProfileModel;
  status: string;
  compact?: boolean;
};

const VALIDATION_STEPS = [
  { id: "fill", label: "Profil complété", statuses: ["non_soumis", "en_cours_examen", "valide"] },
  { id: "review", label: "Relecture staff", statuses: ["en_cours_examen", "valide"] },
  { id: "done", label: "Fiche validée", statuses: ["valide"] },
] as const;

export default function ProfileMetaPanel({ model, status, compact = false }: ProfileMetaPanelProps) {
  const { accent, validationLabel, validationTone, quickActions } = model;
  const normalized = status.toLowerCase();

  return (
    <DashboardPanel
      id="validation"
      tone="emerald"
      accentHex={accent}
      intensity="soft"
      ariaLabelledBy="profile-meta-title"
      className={`${compact ? "" : "h-full"} ${MEMBER_SCROLL_MT}`}
    >
      <DashboardPanelHeader
        kicker="Staff"
        title={compact ? "Validation" : "Validation & raccourcis"}
        icon={ShieldCheck}
        tone="emerald"
        accentHex="#22c55e"
        titleId="profile-meta-title"
        badge={<StatusBadge label={validationLabel} tone={validationTone} />}
      />

      <div className={`flex flex-col gap-2.5 ${compact ? "" : "min-h-0 flex-1"}`}>
        {!compact ? (
          <DashboardInnerCard>
            <p className="text-xs leading-relaxed text-white/70">
              Statut : <strong className="text-white">{status}</strong>. Tes envois depuis « Compléter mon profil »
              sont relus avant publication.
            </p>
          </DashboardInnerCard>
        ) : null}

        <ul className="space-y-1.5">
          {VALIDATION_STEPS.map((step, index) => {
            const done =
              step.id === "done"
                ? normalized === "valide"
                : step.id === "review"
                  ? normalized === "en_cours_examen" || normalized === "valide"
                  : model.profilePercent >= 30 || normalized !== "non_soumis";
            const active =
              step.id === "done"
                ? normalized === "valide" || normalized === "en_cours_examen"
                : step.id === "review"
                  ? normalized === "en_cours_examen" || normalized === "valide" || model.profilePercent >= 30
                  : true;
            const Icon = done ? CheckCircle2 : Clock3;
            return (
              <li
                key={step.id}
                className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-black/20 px-3 py-2"
                style={{ opacity: active ? 1 : 0.55 }}
              >
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white/50"
                  style={{ backgroundColor: hexToRgba("#22c55e", done ? 0.2 : 0.08) }}
                >
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1 text-xs font-semibold text-white">{step.label}</span>
                <Icon
                  className="h-4 w-4 shrink-0"
                  style={{ color: done ? "#22c55e" : "rgba(255,255,255,0.35)" }}
                  aria-hidden
                />
              </li>
            );
          })}
        </ul>

        <div className={compact ? "border-t border-white/[0.06] pt-2.5" : "mt-auto border-t border-white/[0.06] pt-3"}>
          <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-white/45">
            <Target className="h-3 w-3" aria-hidden />
            Raccourcis
          </p>
          <ul className="grid gap-1">
            {quickActions.slice(0, compact ? 3 : 5).map((action) =>
              action.href ? (
                <li key={action.label}>
                  <Link
                    href={action.href}
                    className="group flex items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-2.5 py-2 transition hover:border-white/16 hover:bg-white/[0.03]"
                  >
                    <span className="min-w-0 flex-1 truncate text-xs font-semibold text-white">{action.label}</span>
                    <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-white/20 group-hover:text-white/60" aria-hidden />
                  </Link>
                </li>
              ) : (
                <li
                  key={action.label}
                  className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-black/15 px-2.5 py-2 text-xs text-white/45"
                >
                  <span className="truncate">{action.label}</span>
                  {action.soon ? (
                    <span className="text-[9px] font-bold uppercase">Bientôt</span>
                  ) : null}
                </li>
              ),
            )}
          </ul>
        </div>
      </div>
    </DashboardPanel>
  );
}

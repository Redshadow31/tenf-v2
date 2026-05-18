"use client";

import Link from "next/link";
import { Clock, ExternalLink, Shield, UserMinus, UserPlus } from "lucide-react";
import { getRoleBadgeClassName } from "@/lib/roleBadgeSystem";
import type { StaffPilotProfile } from "@/lib/staff-questionnaire/staffMemberPilotProfile";
import { Q_LAYOUT, QUI } from "@/components/admin/moderation/questionnaire/questionnaire-ui";

function alumniBadgeClass(status: StaffPilotProfile["alumniStatus"]): string {
  switch (status) {
    case "active_staff":
      return "border-emerald-400/35 bg-emerald-500/15 text-emerald-100";
    case "former_staff":
      return "border-amber-400/35 bg-amber-500/15 text-amber-100";
    case "pause_or_reduced":
      return "border-violet-400/35 bg-violet-500/15 text-violet-100";
    case "inactive_member":
    default:
      return "border-zinc-500/40 bg-zinc-800/60 text-zinc-300";
  }
}

export function StaffMemberPilotCard({
  profile,
  gestionHref,
  compact = false,
}: {
  profile: StaffPilotProfile;
  gestionHref?: string;
  compact?: boolean;
}) {
  const timeline = compact ? profile.timeline.slice(0, 4) : profile.timeline;

  return (
    <section className={`${Q_LAYOUT.glassSection} overflow-hidden`}>
      <div className={QUI.wizardAccentBar} aria-hidden />
      <div className="p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-400/30 bg-violet-500/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-violet-200">
                <Shield className="h-3.5 w-3.5" aria-hidden />
                Pilotage staff
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${alumniBadgeClass(profile.alumniStatus)}`}
              >
                {profile.alumniStatus === "active_staff" ? (
                  <UserPlus className="h-3 w-3" aria-hidden />
                ) : profile.alumniStatus === "former_staff" ? (
                  <UserMinus className="h-3 w-3" aria-hidden />
                ) : null}
                {profile.alumniStatusLabel}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-white">{profile.displayName}</h3>
            <p className="text-sm text-zinc-400">
              <span className={getRoleBadgeClassName(profile.currentRole)}>
                {profile.currentRoleLabel}
              </span>
              {profile.currentRoleDurationLabel ? (
                <span className="ml-2 text-zinc-500">· {profile.currentRoleDurationLabel} dans ce rôle</span>
              ) : null}
            </p>
          </div>
          {gestionHref ? (
            <Link
              href={gestionHref}
              className={`${Q_LAYOUT.subtleBtn} shrink-0 text-xs`}
            >
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              Gestion membre
            </Link>
          ) : null}
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-3 lg:grid-cols-4">
          <div className={Q_LAYOUT.statCell}>
            <dt className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
              Cumul staff
            </dt>
            <dd className="mt-1 font-semibold tabular-nums text-violet-100">
              {profile.staffTenureDurationLabel ?? "—"}
            </dd>
          </div>
          <div className={Q_LAYOUT.statCell}>
            <dt className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
              Entrée staff
            </dt>
            <dd className="mt-1 text-xs text-zinc-200">
              {profile.staffTenureStartedAt
                ? new Date(profile.staffTenureStartedAt).toLocaleDateString("fr-FR")
                : "—"}
            </dd>
          </div>
          {profile.staffTenureEndedAt ? (
            <div className={Q_LAYOUT.statCell}>
              <dt className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                Fin staff
              </dt>
              <dd className="mt-1 text-xs text-zinc-200">
                {new Date(profile.staffTenureEndedAt).toLocaleDateString("fr-FR")}
              </dd>
            </div>
          ) : null}
          {profile.integrationDateLabel ? (
            <div className={Q_LAYOUT.statCell}>
              <dt className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                Intégration
              </dt>
              <dd className="mt-1 text-xs text-zinc-200">{profile.integrationDateLabel}</dd>
            </div>
          ) : null}
          {profile.memberSinceLabel ? (
            <div className={Q_LAYOUT.statCell}>
              <dt className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                Membre depuis
              </dt>
              <dd className="mt-1 text-xs text-zinc-200">{profile.memberSinceLabel}</dd>
            </div>
          ) : null}
        </dl>

        {timeline.length > 0 ? (
          <div className="mt-4">
            <h4 className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
              <Clock className="h-4 w-4 text-indigo-300" aria-hidden />
              Historique des rôles
            </h4>
            <ul className="mt-2 space-y-2">
              {timeline.map((period) => (
                <li
                  key={`${period.role}-${period.startedAt}`}
                  className="rounded-xl border border-white/[0.08] bg-black/20 px-3 py-2.5"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span
                      className={
                        period.isStaffRole
                          ? "font-medium text-violet-100"
                          : "font-medium text-zinc-200"
                      }
                    >
                      {period.roleLabel}
                    </span>
                    <span className="text-xs tabular-nums text-zinc-500">{period.durationLabel}</span>
                  </div>
                  <p className="mt-1 text-[11px] text-zinc-500">
                    {new Date(period.startedAt).toLocaleDateString("fr-FR", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                    {period.endedAt
                      ? ` → ${new Date(period.endedAt).toLocaleDateString("fr-FR", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}`
                      : " → aujourd'hui"}
                  </p>
                  {period.reason ? (
                    <p className="mt-1 text-xs italic text-zinc-400">{period.reason}</p>
                  ) : null}
                </li>
              ))}
            </ul>
            {compact && profile.timeline.length > timeline.length ? (
              <p className="mt-2 text-xs text-zinc-500">
                + {profile.timeline.length - timeline.length} période
                {profile.timeline.length - timeline.length > 1 ? "s" : ""}…
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}

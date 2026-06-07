"use client";

import Link from "next/link";
import { Database, Sparkles, UserCheck, UserPlus, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { MembersHubCopyModel, MembersManagementPathsCounters } from "@/lib/admin/members/membersHubCopyModel";
import { MembersHubPanel, MembersHubPanelHeader } from "@/components/admin/members-hub/MembersHubPanel";
import type { MembersManagementPathsCounters } from "@/lib/admin/members/membersHubCopyModel";
import { hubFocusRingClass } from "./membersHubStyles";

type Props = {
  copy: MembersHubCopyModel;
  counters: MembersManagementPathsCounters;
};

const GROUP_META: Record<
  string,
  { icon: LucideIcon; accent: "violet" | "indigo" | "cyan" | "amber" | "emerald"; badge?: (c: MembersManagementPathsCounters) => number }
> = {
  cycle: {
    icon: UserCheck,
    accent: "indigo",
    badge: (c) => c.profileValidationPending + c.incomplete + c.reviewOverdue,
  },
  directory: { icon: Users, accent: "violet" },
  quality: {
    icon: Database,
    accent: "cyan",
    badge: (c) => c.dataErrors + c.syncMissing,
  },
  recruitment: { icon: UserPlus, accent: "amber", badge: (c) => c.staffApplicationsPending },
  recognition: { icon: Sparkles, accent: "emerald" },
};

const LINK_BADGE: Record<string, (c: MembersManagementPathsCounters) => number | undefined> = {
  "/admin/membres/validation-profil": (c) => c.profileValidationPending,
  "/admin/membres/incomplets": (c) => c.incomplete,
  "/admin/membres/revues": (c) => c.reviewOverdue,
  "/admin/membres/qualite-data?onglet=sync": (c) => c.syncMissing,
  "/admin/membres/incomplets?vue=erreurs": (c) => c.dataErrors,
  "/admin/membres/postulations": (c) => c.staffApplicationsPending,
};

const accentClasses: Record<
  "violet" | "indigo" | "cyan" | "amber" | "emerald",
  { card: string; iconBox: string; chip: string; halo: string; badge: string }
> = {
  violet: {
    card: "border-violet-300/20 bg-[linear-gradient(155deg,rgba(139,92,246,0.10),rgba(11,13,20,0.85)_60%)]",
    iconBox: "bg-violet-500/15 text-violet-200 border-violet-400/30",
    chip: "text-violet-200",
    halo: "bg-violet-500/10",
    badge: "border-violet-400/35 bg-violet-500/15 text-violet-100",
  },
  indigo: {
    card: "border-indigo-300/20 bg-[linear-gradient(155deg,rgba(99,102,241,0.10),rgba(11,13,20,0.85)_60%)]",
    iconBox: "bg-indigo-500/15 text-indigo-200 border-indigo-400/30",
    chip: "text-indigo-200",
    halo: "bg-indigo-500/10",
    badge: "border-indigo-400/35 bg-indigo-500/15 text-indigo-100",
  },
  cyan: {
    card: "border-cyan-300/20 bg-[linear-gradient(155deg,rgba(34,211,238,0.10),rgba(11,13,20,0.85)_60%)]",
    iconBox: "bg-cyan-500/15 text-cyan-200 border-cyan-400/30",
    chip: "text-cyan-200",
    halo: "bg-cyan-500/10",
    badge: "border-cyan-400/35 bg-cyan-500/15 text-cyan-100",
  },
  amber: {
    card: "border-amber-300/20 bg-[linear-gradient(155deg,rgba(245,158,11,0.10),rgba(11,13,20,0.85)_60%)]",
    iconBox: "bg-amber-500/15 text-amber-200 border-amber-400/30",
    chip: "text-amber-200",
    halo: "bg-amber-500/10",
    badge: "border-amber-400/35 bg-amber-500/15 text-amber-100",
  },
  emerald: {
    card: "border-emerald-300/20 bg-[linear-gradient(155deg,rgba(16,185,129,0.10),rgba(11,13,20,0.85)_60%)]",
    iconBox: "bg-emerald-500/15 text-emerald-200 border-emerald-400/30",
    chip: "text-emerald-200",
    halo: "bg-emerald-500/10",
    badge: "border-emerald-400/35 bg-emerald-500/15 text-emerald-100",
  },
};

export default function MembersManagementPaths({ copy, counters }: Props) {
  return (
    <MembersHubPanel accentHex={copy.accent} tone="neutral" className="h-full" ariaLabelledBy="members-hub-paths">
      <MembersHubPanelHeader
        kicker={copy.paths.kicker}
        title={copy.paths.title}
        intro={copy.paths.intro}
        icon={Users}
        accentHex={copy.accent}
        titleId="members-hub-paths"
      />

      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
        {copy.paths.groups.map((group) => {
          const meta = GROUP_META[group.id];
          if (!meta) return null;
          const accent = accentClasses[meta.accent];
          const Icon = meta.icon;
          const groupBadge = meta.badge?.(counters) ?? 0;

          return (
            <article key={group.id} className={`relative overflow-hidden rounded-2xl border p-4 ${accent.card}`}>
              <span className={`pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full ${accent.halo} blur-2xl`} aria-hidden />
              <header className="relative flex items-start gap-3">
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${accent.iconBox}`} aria-hidden>
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-white">{group.title}</h3>
                    {groupBadge > 0 ? (
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold tabular-nums ${accent.badge}`}>
                        {groupBadge}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-0.5 text-xs leading-relaxed text-white/45">{group.description}</p>
                </div>
              </header>

              <ul role="list" className="relative mt-3 space-y-1.5">
                {group.links.map((link) => {
                  const badge = LINK_BADGE[link.href]?.(counters);
                  return (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className={`group flex items-center justify-between gap-2 rounded-lg border border-white/[0.05] bg-black/20 px-2.5 py-2 transition hover:border-white/15 hover:bg-black/30 ${hubFocusRingClass}`}
                      >
                        <span className="min-w-0">
                          <span className={`block text-sm font-medium ${accent.chip}`}>{link.label}</span>
                          <span className="block text-[11px] text-white/40 group-hover:text-white/55">{link.description}</span>
                        </span>
                        <span className="flex shrink-0 items-center gap-1.5">
                          {badge && badge > 0 ? (
                            <span className={`rounded-full border px-1.5 py-0.5 text-[10px] font-semibold tabular-nums ${accent.badge}`}>
                              {badge}
                            </span>
                          ) : null}
                          <span className="text-white/35 group-hover:text-white" aria-hidden>
                            →
                          </span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </article>
          );
        })}
      </div>
    </MembersHubPanel>
  );
}

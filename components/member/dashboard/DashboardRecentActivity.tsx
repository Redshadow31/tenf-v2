"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Calendar, GraduationCap, History, Rocket } from "lucide-react";
import {
  formatDateTime,
  hexToRgba,
  type MemberDashboardModel,
} from "@/components/member/dashboard/memberDashboardModel";
import { DashboardPanel, DashboardPanelHeader } from "@/components/member/dashboard/dashboardUi";

type FilterId = "all" | "raids" | "events" | "formations";

const FILTERS: { id: FilterId; label: string }[] = [
  { id: "all", label: "Tout" },
  { id: "raids", label: "Raids" },
  { id: "events", label: "Events" },
  { id: "formations", label: "Formations" },
];

type DashboardRecentActivityProps = {
  model: MemberDashboardModel;
};

function entryFilter(entry: { type: string }, filter: FilterId): boolean {
  if (filter === "all") return true;
  const t = entry.type.toLowerCase();
  if (filter === "raids") return t.includes("raid");
  if (filter === "events") return t.includes("présence") || t.includes("presence");
  if (filter === "formations") return t.includes("formation");
  return true;
}

export default function DashboardRecentActivity({ model }: DashboardRecentActivityProps) {
  const { accent, recentTimeline } = model;
  const [filter, setFilter] = useState<FilterId>("all");

  const filtered = useMemo(
    () => recentTimeline.filter((e) => entryFilter(e, filter)),
    [recentTimeline, filter],
  );

  return (
    <DashboardPanel tone="rose" accentHex={accent} intensity="soft" ariaLabelledBy="dashboard-recent-title">
      <DashboardPanelHeader
        kicker="Historique"
        title="Activité récente"
        icon={History}
        tone="rose"
        accentHex="#f472b6"
        titleId="dashboard-recent-title"
        badge={
          <Link
            href="/member/activite"
            className="text-[11px] font-bold"
            style={{ color: hexToRgba(accent, 0.95) }}
          >
            Tout →
          </Link>
        }
      />

      {recentTimeline.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/12 bg-black/20 p-4">
          <p className="text-sm text-white/60">
            Tes raids, présences et formations apparaîtront ici.
          </p>
          <Link
            href="/lives"
            className="mt-3 inline-flex items-center gap-1 rounded-lg border border-white/12 px-3 py-1.5 text-xs font-semibold text-white/85 hover:bg-white/5"
          >
            Voir les lives <ArrowRight className="h-3 w-3" aria-hidden />
          </Link>
        </div>
      ) : (
        <>
          <div
            className="flex flex-wrap gap-1 rounded-xl border border-white/8 bg-black/30 p-1"
            role="tablist"
            aria-label="Filtrer l'activité"
          >
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                role="tab"
                aria-selected={filter === f.id}
                onClick={() => setFilter(f.id)}
                className={`rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition ${
                  filter === f.id
                    ? "bg-white/14 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
                    : "text-white/50 hover:bg-white/5 hover:text-white/80"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <p className="mt-4 text-sm text-white/50">Rien dans cette catégorie pour l&apos;instant.</p>
          ) : (
            <ol className="relative mt-4 space-y-0 pl-1">
              <div
                className="absolute bottom-3 left-[17px] top-3 w-px bg-gradient-to-b from-rose-400/40 via-white/10 to-transparent"
                aria-hidden
              />
              {filtered.slice(0, 5).map((entry, index) => (
                <TimelineItem key={entry.id} entry={entry} accent={accent} isFirst={index === 0} />
              ))}
            </ol>
          )}
        </>
      )}
    </DashboardPanel>
  );
}

function TimelineItem({
  entry,
  accent,
  isFirst,
}: {
  entry: { id: string; title: string; type: string; date: string; color: string };
  accent: string;
  isFirst: boolean;
}) {
  const isRaid = entry.type.toLowerCase().includes("raid");
  const isFormation = entry.type.toLowerCase().includes("formation");
  const Icon = isRaid ? Rocket : isFormation ? GraduationCap : Calendar;
  const iconColor = isRaid ? "#e9d5ff" : isFormation ? "#86efac" : hexToRgba(accent, 0.9);

  return (
    <li className="relative flex gap-3 pb-3 last:pb-0">
      <span
        className={`relative z-10 mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 bg-[#0c0c10] ${
          isFirst ? "ring-2 ring-white/10" : ""
        }`}
        style={{
          borderColor: entry.color,
          boxShadow: isFirst ? `0 0 16px ${entry.color}` : undefined,
        }}
        aria-hidden
      >
        <Icon className="h-4 w-4" style={{ color: iconColor }} />
      </span>
      <div className="min-w-0 flex-1 rounded-xl border border-white/8 bg-black/25 px-3 py-2.5 transition hover:border-white/14 hover:bg-white/[0.02]">
        <p className="truncate text-sm font-semibold text-white">{entry.title}</p>
        <p className="text-[11px] text-white/45">
          {entry.type} · {formatDateTime(entry.date)}
        </p>
      </div>
    </li>
  );
}

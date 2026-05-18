"use client";

import { useMemo, useState } from "react";
import { GitBranch } from "lucide-react";
import {
  buildUnifiedMemberJourney,
  filterUnifiedJourney,
  type UnifiedJourneyFilter,
  type UnifiedJourneyItem,
} from "@/lib/admin/members-gestion/unifiedMemberJourney";
import type { MemberTimelineEntry } from "@/lib/admin/members-gestion/memberTimeline";
import type { StaffPeriod } from "@/lib/admin/members-gestion/staffPeriods";

const accentBorder: Record<UnifiedJourneyItem["accent"], string> = {
  indigo: "#818cf8",
  emerald: "#34d399",
  amber: "#fbbf24",
  zinc: "#71717a",
  violet: "#a78bfa",
};

const FILTER_LABELS: Record<UnifiedJourneyFilter, string> = {
  all: "Tout",
  staff: "Staff",
  events: "Événements",
};

export default function MemberUnifiedJourneyTimeline({
  timeline,
  staffPeriods,
  createdAt,
  integrationDate,
  limit,
  onEditManual,
}: {
  timeline: MemberTimelineEntry[];
  staffPeriods: StaffPeriod[];
  createdAt?: string | null;
  integrationDate?: string | null;
  limit?: number;
  onEditManual?: (entry: MemberTimelineEntry) => void;
}) {
  const [filter, setFilter] = useState<UnifiedJourneyFilter>("all");

  const allItems = useMemo(
    () =>
      buildUnifiedMemberJourney({
        timeline,
        staffPeriods,
        createdAt,
        integrationDate,
      }),
    [timeline, staffPeriods, createdAt, integrationDate],
  );

  const filtered = useMemo(
    () => filterUnifiedJourney(allItems, filter),
    [allItems, filter],
  );

  const visible = limit ? filtered.slice(0, limit) : filtered;
  const hiddenCount = limit && filtered.length > limit ? filtered.length - limit : 0;

  if (allItems.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        Aucun événement ni période confirmée — l&apos;historique apparaîtra ici au fur et à mesure.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-200">
          <GitBranch className="h-4 w-4 text-indigo-300" aria-hidden />
          Frise du parcours
        </span>
        <div className="flex flex-wrap gap-1">
          {(Object.keys(FILTER_LABELS) as UnifiedJourneyFilter[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={`rounded-full border px-2 py-0.5 text-[10px] font-medium transition ${
                filter === key
                  ? "border-indigo-400/40 bg-indigo-500/20 text-indigo-100"
                  : "border-white/10 bg-black/20 text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {FILTER_LABELS[key]}
            </button>
          ))}
        </div>
      </div>

      <ol className="relative ml-1 space-y-0 border-l border-white/10 pl-4">
        {visible.map((item) => (
          <li key={item.id} className="relative pb-4 last:pb-0">
            <span
              className="absolute -left-[calc(0.25rem+5px)] top-1.5 h-2.5 w-2.5 rounded-full ring-2 ring-[#0e0e10]"
              style={{ backgroundColor: accentBorder[item.accent] }}
              aria-hidden
            />
            <div className="rounded-lg border border-white/[0.06] bg-black/20 px-3 py-2.5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap gap-1">
                    {item.badges.slice(0, 4).map((b) => (
                      <span
                        key={`${item.id}-${b}`}
                        className="rounded-full border border-white/10 bg-black/30 px-1.5 py-0.5 text-[10px] text-zinc-400"
                      >
                        {b}
                      </span>
                    ))}
                  </div>
                  <p className="mt-1 text-sm font-medium text-zinc-100">{item.title}</p>
                  {item.subtitle ? (
                    <p className="text-xs text-zinc-400">{item.subtitle}</p>
                  ) : null}
                </div>
                <time className="shrink-0 text-[10px] tabular-nums text-zinc-500">
                  {new Date(item.at).toLocaleString("fr-FR", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </time>
              </div>
              {item.detail ? (
                <p className="mt-1.5 whitespace-pre-wrap text-xs text-zinc-400">{item.detail}</p>
              ) : null}
              {onEditManual && item.timelineEntry?.source === "manual" ? (
                <button
                  type="button"
                  onClick={() => onEditManual(item.timelineEntry!)}
                  className="mt-2 text-[10px] font-medium text-indigo-300 hover:text-indigo-200"
                >
                  Modifier
                </button>
              ) : null}
            </div>
          </li>
        ))}
      </ol>

      {hiddenCount > 0 ? (
        <p className="text-xs text-zinc-500">
          + {hiddenCount} élément{hiddenCount > 1 ? "s" : ""} — ouvrez l&apos;historique complet
        </p>
      ) : null}
    </div>
  );
}
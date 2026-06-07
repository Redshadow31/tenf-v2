"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays, ChevronDown, ExternalLink, Filter, Search, Sparkles } from "lucide-react";
import {
  DashboardInnerCard,
  DashboardPanel,
  DashboardPanelHeader,
  MEMBER_SCROLL_MT,
  MemberPrimaryLink,
} from "@/components/member/dashboard/dashboardUi";
import {
  formatRaidDate,
  RAID_FIELD_CLASS,
  RAID_HISTORY_ACCENT,
  sourceBadge,
  statusPointsBadge,
  statusRaidBadge,
  twitchChannelUrl,
  type RaidEntry,
  type RaidFilter,
} from "@/components/member/raids/raidHistoryUtils";

type RaidHistoryTimelinePanelProps = {
  loading: boolean;
  raids: RaidEntry[];
  filteredRaids: RaidEntry[];
  raidFilter: RaidFilter;
  onFilterChange: (filter: RaidFilter) => void;
  filterButtons: { id: RaidFilter; label: string; count: number }[];
  timelineQuery: string;
  onQueryChange: (value: string) => void;
  expandedRaidId: string | null;
  onToggleExpand: (id: string) => void;
};

function raidRowBorder(status: RaidEntry["raidStatus"]) {
  if (status === "validated") return "border-emerald-500/22 hover:border-emerald-500/35";
  if (status === "rejected") return "border-red-500/22 hover:border-red-500/35";
  return "border-amber-500/22 hover:border-amber-500/32";
}

export default function RaidHistoryTimelinePanel({
  loading,
  raids,
  filteredRaids,
  raidFilter,
  onFilterChange,
  filterButtons,
  timelineQuery,
  onQueryChange,
  expandedRaidId,
  onToggleExpand,
}: RaidHistoryTimelinePanelProps) {
  return (
    <DashboardPanel
      id="raid-timeline"
      tone="violet"
      accentHex={RAID_HISTORY_ACCENT}
      intensity="medium"
      ariaLabelledBy="raid-timeline-title"
      className={MEMBER_SCROLL_MT}
    >
      <DashboardPanelHeader
        kicker="Détail"
        title="Tes envois du mois"
        icon={CalendarDays}
        tone="violet"
        accentHex="#9146ff"
        titleId="raid-timeline-title"
        badge={
          <span className="text-[11px] font-semibold text-white/50">
            {loading ? "…" : `${filteredRaids.length} ligne${filteredRaids.length !== 1 ? "s" : ""}`}
          </span>
        }
      />

      <div className="mb-3 space-y-2.5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/35" aria-hidden />
          <input
            type="search"
            value={timelineQuery}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Chercher une chaîne…"
            className={`${RAID_FIELD_CLASS} pl-9`}
            autoComplete="off"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Filter className="h-3.5 w-3.5 text-white/35" aria-hidden />
          {filterButtons.map((fb) => (
            <button
              key={fb.id}
              type="button"
              onClick={() => onFilterChange(fb.id)}
              disabled={loading}
              className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition disabled:opacity-50 ${
                raidFilter === fb.id
                  ? "border-violet-400/45 bg-violet-500/18 text-violet-100"
                  : "border-white/10 text-white/50 hover:border-white/18 hover:text-white/78"
              }`}
            >
              {fb.label} <span className="tabular-nums opacity-70">({fb.count})</span>
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl border border-white/[0.06] bg-white/[0.04]" />
          ))}
        </div>
      ) : filteredRaids.length === 0 ? (
        <DashboardInnerCard className="py-8 text-center">
          <Sparkles className="mx-auto h-8 w-8 text-amber-400/70" aria-hidden />
          <p className="mt-2 text-sm font-semibold text-white">
            {raids.length === 0
              ? "Aucun raid sur cette période"
              : timelineQuery.trim()
                ? "Aucune chaîne ne correspond"
                : "Aucune ligne pour ce filtre"}
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <MemberPrimaryLink href="/lives" accentHex={RAID_HISTORY_ACCENT}>
              Voir les lives <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </MemberPrimaryLink>
            {raidFilter !== "all" || timelineQuery.trim() ? (
              <button
                type="button"
                onClick={() => {
                  onFilterChange("all");
                  onQueryChange("");
                }}
                className="rounded-xl border border-white/12 px-3 py-1.5 text-xs font-semibold text-white/55 hover:text-white/85"
              >
                Tout réafficher
              </button>
            ) : null}
          </div>
        </DashboardInnerCard>
      ) : (
        <ul className="max-h-[min(40rem,62vh)] space-y-2 overflow-y-auto pr-0.5">
          {filteredRaids.map((raid, idx) => {
            const src = sourceBadge(raid.source);
            const expanded = expandedRaidId === raid.id;
            const twitchUrl = twitchChannelUrl(raid.targetLogin);
            return (
              <li key={raid.id}>
                <article className={`rounded-xl border bg-black/25 px-3 py-3 transition ${raidRowBorder(raid.raidStatus)} ${expanded ? "ring-1 ring-violet-500/20" : ""}`}>
                  <button
                    type="button"
                    onClick={() => onToggleExpand(raid.id)}
                    className="flex w-full items-start justify-between gap-2 text-left"
                  >
                    <div className="flex min-w-0 flex-1 gap-2.5">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-black/35 text-[10px] font-bold text-white/45">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">
                          {raid.targetLabel}{" "}
                          <span className="font-normal text-white/45">(@{raid.targetLogin || "?"})</span>
                        </p>
                        <p className="mt-0.5 text-[11px] text-white/45">{formatRaidDate(raid.eventAt)}</p>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          <span
                            className="rounded-full border px-2 py-0.5 text-[10px] font-semibold"
                            style={{ borderColor: src.border, color: src.color, backgroundColor: src.bg }}
                          >
                            {src.short}
                          </span>
                          {typeof raid.viewers === "number" ? (
                            <span className="rounded-full border border-white/10 bg-black/30 px-2 py-0.5 text-[10px] text-white/45">
                              ~{raid.viewers} viewers
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <span
                        className="rounded-full border px-2 py-0.5 text-[10px] font-semibold"
                        style={{
                          borderColor: statusRaidBadge(raid.raidStatus).border,
                          color: statusRaidBadge(raid.raidStatus).color,
                          backgroundColor: statusRaidBadge(raid.raidStatus).bg,
                        }}
                      >
                        {raid.raidStatusLabel}
                      </span>
                      <ChevronDown className={`h-4 w-4 text-white/35 transition ${expanded ? "rotate-180" : ""}`} aria-hidden />
                    </div>
                  </button>

                  {expanded ? (
                    <div className="mt-3 border-t border-white/[0.08] pt-3">
                      <div className="flex flex-wrap gap-1.5">
                        <span
                          className="rounded-full border px-2 py-0.5 text-[10px] font-semibold"
                          style={{
                            borderColor: statusPointsBadge(raid.pointsStatus).border,
                            color: statusPointsBadge(raid.pointsStatus).color,
                            backgroundColor: statusPointsBadge(raid.pointsStatus).bg,
                          }}
                        >
                          Récompense : {raid.pointsStatusLabel}
                        </span>
                        <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-white/45">{src.label}</span>
                      </div>
                      {raid.note ? (
                        <p className="mt-2 rounded-lg border border-white/10 bg-black/30 px-2.5 py-2 text-xs text-white/70">
                          <span className="font-semibold text-white/45">Équipe : </span>
                          {raid.note}
                        </p>
                      ) : null}
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {twitchUrl ? (
                          <a
                            href={twitchUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-lg border border-violet-400/35 bg-violet-500/10 px-2.5 py-1.5 text-[11px] font-semibold text-violet-100"
                          >
                            Twitch <ExternalLink className="h-3 w-3" aria-hidden />
                          </a>
                        ) : null}
                        <Link
                          href="/member/raids/declarer"
                          className="inline-flex items-center rounded-lg border border-white/12 px-2.5 py-1.5 text-[11px] font-semibold text-white/50 hover:text-white/80"
                        >
                          Signaler absent
                        </Link>
                      </div>
                    </div>
                  ) : null}
                </article>
              </li>
            );
          })}
        </ul>
      )}
    </DashboardPanel>
  );
}

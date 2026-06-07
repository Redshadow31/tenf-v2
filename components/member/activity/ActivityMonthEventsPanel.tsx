"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  CircleDot,
  ListOrdered,
} from "lucide-react";
import {
  DashboardPanel,
  DashboardPanelHeader,
  MEMBER_SCROLL_MT,
} from "@/components/member/dashboard/dashboardUi";
import { ACTIVITY_ACCENT, categoryAccent, formatIsoShort, formatMonthLabel } from "@/components/member/activity/activityUtils";

type MonthEvent = {
  id: string;
  title: string;
  date: string;
  category: string;
  attended: boolean;
  isKeyEvent?: boolean;
  discordPointsStatus?: "awarded" | "pending" | null | string;
};

type ActivityMonthEventsPanelProps = {
  monthKey: string;
  events: MonthEvent[];
  discordPointsAvailable: boolean;
};

export default function ActivityMonthEventsPanel({
  monthKey,
  events,
  discordPointsAvailable,
}: ActivityMonthEventsPanelProps) {
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const sortedEvents = useMemo(
    () => [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [events],
  );

  return (
    <DashboardPanel
      id="activity-events"
      tone="accent"
      accentHex={ACTIVITY_ACCENT}
      intensity="soft"
      ariaLabelledBy="activity-events-title"
      className={MEMBER_SCROLL_MT}
    >
      <DashboardPanelHeader
        kicker="Ce mois-ci"
        title={`Événements suivis — ${formatMonthLabel(monthKey)}`}
        icon={ListOrdered}
        tone="cyan"
        accentHex={ACTIVITY_ACCENT}
        titleId="activity-events-title"
      />

      <p className="mb-4 text-sm text-white/55">
        Ouvre une ligne pour le détail (points Discord si disponibles).
      </p>

      {sortedEvents.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-10 text-center text-sm text-white/45">
          Aucun événement suivi pour {formatMonthLabel(monthKey)} pour l&apos;instant.{" "}
          <Link href="/member/evenements" className="font-semibold text-orange-300 hover:underline">
            Consulter le planning
          </Link>
        </div>
      ) : (
        <ul className="space-y-2">
          {sortedEvents.map((ev) => {
            const open = expandedEventId === ev.id;
            const styles = categoryAccent(ev.category);
            return (
              <li key={ev.id} className="overflow-hidden rounded-xl border border-white/10 bg-black/25">
                <button
                  type="button"
                  className="flex w-full items-start gap-3 px-3 py-3 text-left transition hover:bg-white/5"
                  onClick={() => setExpandedEventId(open ? null : ev.id)}
                  aria-expanded={open}
                >
                  <span className="mt-0.5 shrink-0">
                    {ev.attended ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-400" aria-hidden />
                    ) : (
                      <CircleDot className="h-5 w-5 text-slate-500" aria-hidden />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-white">{ev.title}</span>
                    <span className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                      <CalendarDays className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      {formatIsoShort(ev.date)}
                      <span
                        className="rounded-full border px-2 py-0.5 text-[10px] font-semibold"
                        style={{ backgroundColor: styles.bg, color: styles.text, borderColor: styles.border }}
                      >
                        {ev.category}
                      </span>
                      {ev.isKeyEvent ? (
                        <span className="rounded-full border border-violet-400/40 bg-violet-500/15 px-2 py-0.5 text-[10px] font-semibold text-violet-100">
                          Moment fort
                        </span>
                      ) : null}
                    </span>
                  </span>
                  <ChevronDown
                    className={`mt-1 h-4 w-4 shrink-0 text-slate-500 transition ${open ? "rotate-180" : ""}`}
                    aria-hidden
                  />
                </button>
                {open ? (
                  <div className="border-t border-white/10 px-3 py-3 text-xs text-slate-300">
                    <p>
                      Statut présence :{" "}
                      <strong className="text-white">
                        {ev.attended ? "Présence enregistrée" : "Non marqué·e présent·e"}
                      </strong>
                    </p>
                    {discordPointsAvailable && ev.attended ? (
                      <p className="mt-2">
                        Points événement Discord :{" "}
                        <strong className="text-white">
                          {ev.discordPointsStatus === "awarded"
                            ? "Attribués"
                            : ev.discordPointsStatus === "pending"
                              ? "En attente de synchro"
                              : "Non suivis pour cet événement"}
                        </strong>
                      </p>
                    ) : null}
                    <Link
                      href="/member/evenements/presences"
                      className="mt-3 inline-flex items-center gap-1 font-semibold text-orange-300 hover:text-white"
                    >
                      Page présences
                      <ArrowRight className="h-3 w-3" aria-hidden />
                    </Link>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </DashboardPanel>
  );
}

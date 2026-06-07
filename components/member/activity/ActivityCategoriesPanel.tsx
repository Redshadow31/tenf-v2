"use client";

import Link from "next/link";
import { PieChart } from "lucide-react";
import {
  DashboardPanel,
  DashboardPanelHeader,
  MEMBER_SCROLL_MT,
} from "@/components/member/dashboard/dashboardUi";
import { ACTIVITY_ACCENT, categoryAccent } from "@/components/member/activity/activityUtils";

type CategoryRow = {
  category: string;
  attendedEvents: number;
  totalEvents: number;
};

type ActivityCategoriesPanelProps = {
  rows: CategoryRow[];
  onScrollToEvents: () => void;
};

export default function ActivityCategoriesPanel({ rows, onScrollToEvents }: ActivityCategoriesPanelProps) {
  return (
    <DashboardPanel
      id="activity-categories"
      tone="accent"
      accentHex={ACTIVITY_ACCENT}
      intensity="soft"
      ariaLabelledBy="activity-categories-title"
      className={MEMBER_SCROLL_MT}
    >
      <DashboardPanelHeader
        kicker="Événements"
        title="Répartition par type"
        icon={PieChart}
        tone="violet"
        accentHex={ACTIVITY_ACCENT}
        titleId="activity-categories-title"
        badge={
          <Link href="/member/evenements" className="text-[11px] font-semibold text-orange-300 hover:text-white">
            Voir le planning
          </Link>
        }
      />

      {rows.length === 0 ? (
        <p className="text-sm text-white/45">
          Pas encore de répartition pour ce mois — les catégories apparaîtront quand des événements seront suivis.
        </p>
      ) : (
        <ul className="space-y-3">
          {rows.map((row) => {
            const pct = row.totalEvents > 0 ? Math.round((row.attendedEvents / row.totalEvents) * 100) : 0;
            const styles = categoryAccent(row.category);
            return (
              <li key={row.category}>
                <button
                  type="button"
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-left transition hover:bg-white/5"
                  onClick={onScrollToEvents}
                  title="Voir la liste du mois"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span
                      className="rounded-full border px-2 py-0.5 text-[11px] font-semibold"
                      style={{ backgroundColor: styles.bg, color: styles.text, borderColor: styles.border }}
                    >
                      {row.category}
                    </span>
                    <span className="text-xs font-semibold text-white">
                      {row.attendedEvents}/{row.totalEvents} · {pct}%
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-orange-400 to-rose-400 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </DashboardPanel>
  );
}

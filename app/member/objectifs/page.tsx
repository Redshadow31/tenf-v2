"use client";

import { useEffect, useMemo, useState } from "react";
import MemberSurface from "@/components/member/ui/MemberSurface";
import MemberPageHeader from "@/components/member/ui/MemberPageHeader";
import ProgressGoalCard from "@/components/member/ui/ProgressGoalCard";
import { useMemberOverview } from "@/components/member/hooks/useMemberOverview";
import { useMemberMonthlyGoals } from "@/components/member/hooks/useMemberMonthlyGoals";

function isSpotlightCategory(category?: string): boolean {
  return String(category || "").toLowerCase().includes("spotlight");
}

function formatMonthLabel(key: string): string {
  const [year, month] = key.split("-");
  const monthIndex = Number(month) - 1;
  const monthNames = ["Janvier", "Fevrier", "Mars", "Avril", "Mai", "Juin", "Juillet", "Aout", "Septembre", "Octobre", "Novembre", "Decembre"];
  return `${monthNames[monthIndex] || "Mois"} ${year}`;
}

function getLast12Months(): string[] {
  const now = new Date();
  return Array.from({ length: 12 }, (_, idx) => {
    const d = new Date(now.getFullYear(), now.getMonth() - idx, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }).reverse();
}

export default function MemberGoalsPage() {
  const { data, loading } = useMemberOverview();
  const [selectedMonth, setSelectedMonth] = useState("");
  const [raidsForMonth, setRaidsForMonth] = useState(0);

  useEffect(() => {
    if (data?.monthKey) setSelectedMonth(data.monthKey);
  }, [data?.monthKey]);

  const { goals, updateGoals, resetGoals } = useMemberMonthlyGoals(selectedMonth);

  if (loading || !data) return <p style={{ color: "var(--color-text-secondary)" }}>Chargement des objectifs...</p>;

  const selectedAttendance = data.attendance?.monthlyHistory.find((entry) => entry.monthKey === selectedMonth) || null;
  const eventsCurrent = selectedAttendance?.attendedEvents || 0;

  const selectedMonthEvents =
    data.attendance?.monthEventsByMonth.find((entry) => entry.monthKey === selectedMonth)?.events || [];
  const spotlightCurrent = selectedMonthEvents.filter((event) => isSpotlightCategory(event.category) && event.attended).length;

  const formationsCurrent =
    (data.attendance?.monthEventsByMonth.find((entry) => entry.monthKey === selectedMonth)?.events || []).filter(
      (event) => event.attended && String(event.category || "").toLowerCase().includes("formation")
    ).length ||
    data.stats.formationsValidatedThisMonth ??
    data.formationHistory.filter((item) => item.date.slice(0, 7) === data.monthKey).length;

  useEffect(() => {
    if (!selectedMonth || !data?.member?.twitchLogin) return;
    (async () => {
      try {
        const response = await fetch(`/api/discord/raids/data-v2?month=${selectedMonth}`, { cache: "no-store" });
        const body = await response.json();
        const mine = (body.raidsFaits || []).filter(
          (raid: any) => String(raid.raiderTwitchLogin || "").toLowerCase() === data.member.twitchLogin.toLowerCase()
        );
        const total = mine.reduce((sum: number, raid: any) => sum + (raid.count || 1), 0);
        setRaidsForMonth(total);
      } catch {
        setRaidsForMonth(0);
      }
    })();
  }, [selectedMonth, data?.member?.twitchLogin]);

  const months = useMemo(() => getLast12Months(), []);

  return (
    <MemberSurface>
      <MemberPageHeader
        title="Objectifs du mois"
        description="Definis tes objectifs mensuels depuis un seul espace: presences, spotlight, raids TENF et formations."
        badge="Objectifs personnalises"
      />

      <section className="rounded-xl border p-5 space-y-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <label className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
              Mois a parametrer
            </label>
            <select
              value={selectedMonth}
              onChange={(event) => setSelectedMonth(event.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm md:w-64"
              style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}
            >
              {months
                .slice()
                .reverse()
                .map((month) => (
                  <option key={month} value={month}>
                    {formatMonthLabel(month)}
                  </option>
                ))}
            </select>
          </div>
          <button
            type="button"
            onClick={resetGoals}
            className="rounded-lg border px-3 py-2 text-sm font-semibold"
            style={{ borderColor: "rgba(255,255,255,0.18)", color: "var(--color-text-secondary)" }}
          >
            Reinitialiser les objectifs de ce mois
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <label className="rounded-lg border p-3" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
            <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
              Presence evenements (general)
            </span>
            <input
              type="number"
              min={1}
              max={30}
              value={goals.events}
              onChange={(event) => updateGoals({ events: Number(event.target.value) })}
              className="mt-2 w-full rounded-md border px-3 py-2 text-sm"
              style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}
            />
          </label>
          <label className="rounded-lg border p-3" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
            <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
              Presence spotlight
            </span>
            <input
              type="number"
              min={0}
              max={20}
              value={goals.spotlight}
              onChange={(event) => updateGoals({ spotlight: Number(event.target.value) })}
              className="mt-2 w-full rounded-md border px-3 py-2 text-sm"
              style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}
            />
          </label>
          <label className="rounded-lg border p-3" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
            <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
              Raids TENF
            </span>
            <input
              type="number"
              min={1}
              max={40}
              value={goals.raids}
              onChange={(event) => updateGoals({ raids: Number(event.target.value) })}
              className="mt-2 w-full rounded-md border px-3 py-2 text-sm"
              style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}
            />
          </label>
          <label className="rounded-lg border p-3" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
            <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
              Formations a valider
            </span>
            <input
              type="number"
              min={1}
              max={20}
              value={goals.formations}
              onChange={(event) => updateGoals({ formations: Number(event.target.value) })}
              className="mt-2 w-full rounded-md border px-3 py-2 text-sm"
              style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}
            />
          </label>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <ProgressGoalCard label="Objectif presences (general)" current={eventsCurrent} target={goals.events} />
        <ProgressGoalCard label="Objectif presences Spotlight" current={spotlightCurrent} target={goals.spotlight} />
        <ProgressGoalCard label="Objectif raids TENF" current={raidsForMonth} target={goals.raids} />
        <ProgressGoalCard label="Objectif formations du mois" current={formationsCurrent} target={goals.formations} />
      </section>
    </MemberSurface>
  );
}

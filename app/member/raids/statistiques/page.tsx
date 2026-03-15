"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronRight, Flame, Shield, Target, TrendingUp, UserRound } from "lucide-react";
import MemberSurface from "@/components/member/ui/MemberSurface";
import MemberPageHeader from "@/components/member/ui/MemberPageHeader";
import EmptyFeatureCard from "@/components/member/ui/EmptyFeatureCard";
import { useMemberOverview } from "@/components/member/hooks/useMemberOverview";
import { useMemberMonthlyGoals } from "@/components/member/hooks/useMemberMonthlyGoals";

type RaidApiItem = {
  date: string;
  count?: number;
  source?: string;
  raiderTwitchLogin?: string;
  targetTwitchLogin?: string;
  raiderDisplayName?: string;
  targetDisplayName?: string;
};

type MonthRaidHistory = {
  monthKey: string;
  sent: number;
  received: number;
  uniqueTargets: number;
  interactionScore: number;
};

type RaidSummary = {
  sent: number;
  received: number;
  uniqueTargets: number;
  topTarget: { key: string; label: string; count: number } | null;
  topRaider: { key: string; label: string; count: number } | null;
};

function formatMonthLabel(key: string): string {
  const [year, month] = key.split("-");
  const monthIndex = Number(month) - 1;
  const monthNames = ["Janvier", "Fevrier", "Mars", "Avril", "Mai", "Juin", "Juillet", "Aout", "Septembre", "Octobre", "Novembre", "Decembre"];
  return `${monthNames[monthIndex] || "Mois"} ${year}`;
}

function normalizeLogin(value?: string): string {
  return String(value || "").toLowerCase().trim();
}

function getTier(score: number): { label: string; color: string } {
  if (score >= 20) return { label: "Titan des raids", color: "#d4af37" };
  if (score >= 12) return { label: "Pilier", color: "#60a5fa" };
  if (score >= 7) return { label: "Actif", color: "#34d399" };
  if (score >= 3) return { label: "En route", color: "#f59e0b" };
  return { label: "Demarrage", color: "#f87171" };
}

function getPreviousMonthKey(monthKey: string): string {
  const [yearStr, monthStr] = monthKey.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr) - 1;
  const date = new Date(year, month - 1, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getLast12Months(): string[] {
  const now = new Date();
  return Array.from({ length: 12 }, (_, idx) => {
    const date = new Date(now.getFullYear(), now.getMonth() - idx, 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  }).reverse();
}

function computeSummary(sentRaids: RaidApiItem[], receivedRaids: RaidApiItem[]): RaidSummary {
  const sent = sentRaids.reduce((sum, raid) => sum + (raid.count || 1), 0);
  const received = receivedRaids.length;

  const targetsCount = new Map<string, { label: string; count: number }>();
  for (const raid of sentRaids) {
    const key = normalizeLogin(raid.targetTwitchLogin || raid.targetDisplayName);
    if (!key) continue;
    const current = targetsCount.get(key) || { label: raid.targetDisplayName || raid.targetTwitchLogin || "Cible", count: 0 };
    current.count += raid.count || 1;
    targetsCount.set(key, current);
  }

  const raidersCount = new Map<string, { label: string; count: number }>();
  for (const raid of receivedRaids) {
    const key = normalizeLogin(raid.raiderTwitchLogin || raid.raiderDisplayName);
    if (!key) continue;
    const current = raidersCount.get(key) || { label: raid.raiderDisplayName || raid.raiderTwitchLogin || "Membre", count: 0 };
    current.count += 1;
    raidersCount.set(key, current);
  }

  const topTargetEntry = Array.from(targetsCount.entries()).sort((a, b) => b[1].count - a[1].count)[0];
  const topRaiderEntry = Array.from(raidersCount.entries()).sort((a, b) => b[1].count - a[1].count)[0];

  return {
    sent,
    received,
    uniqueTargets: targetsCount.size,
    topTarget: topTargetEntry ? { key: topTargetEntry[0], label: topTargetEntry[1].label, count: topTargetEntry[1].count } : null,
    topRaider: topRaiderEntry ? { key: topRaiderEntry[0], label: topRaiderEntry[1].label, count: topRaiderEntry[1].count } : null,
  };
}

function ProgressRing({ value, label }: { value: number; label: string }) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="relative h-36 w-36">
      <svg viewBox="0 0 140 140" className="h-36 w-36 -rotate-90">
        <circle cx="70" cy="70" r={radius} stroke="rgba(255,255,255,0.14)" strokeWidth="12" fill="transparent" />
        <circle
          cx="70"
          cy="70"
          r={radius}
          stroke="url(#raid-ring-gradient)"
          strokeWidth="12"
          strokeLinecap="round"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
        <defs>
          <linearGradient id="raid-ring-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f0c96b" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-3xl font-bold" style={{ color: "var(--color-text)" }}>
          {clamped}%
        </p>
        <p className="text-xs uppercase tracking-[0.15em]" style={{ color: "var(--color-text-secondary)" }}>
          {label}
        </p>
      </div>
    </div>
  );
}

export default function MemberRaidStatsPage() {
  const { data: overview, loading: loadingOverview, error } = useMemberOverview();
  const [selectedMonth, setSelectedMonth] = useState("");
  const [activeTab, setActiveTab] = useState<"general" | "received">("general");
  const [loadingMonth, setLoadingMonth] = useState(false);
  const [sentRaids, setSentRaids] = useState<RaidApiItem[]>([]);
  const [receivedRaids, setReceivedRaids] = useState<RaidApiItem[]>([]);
  const [history, setHistory] = useState<MonthRaidHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const { goals } = useMemberMonthlyGoals(selectedMonth);

  useEffect(() => {
    const currentMonth = getLast12Months().slice(-1)[0] || "";
    setSelectedMonth(currentMonth);
  }, []);

  useEffect(() => {
    if (!overview?.member?.twitchLogin || !selectedMonth) return;
    (async () => {
      setLoadingMonth(true);
      try {
        const response = await fetch(`/api/discord/raids/data-v2?month=${selectedMonth}`, { cache: "no-store" });
        const body = await response.json();
        const login = normalizeLogin(overview.member.twitchLogin);
        const mineSent = (body.raidsFaits || [])
          .filter((raid: RaidApiItem) => normalizeLogin(raid.raiderTwitchLogin) === login)
          .sort((a: RaidApiItem, b: RaidApiItem) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const mineReceived = (body.raidsRecus || [])
          .filter((raid: RaidApiItem) => normalizeLogin(raid.targetTwitchLogin) === login)
          .sort((a: RaidApiItem, b: RaidApiItem) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setSentRaids(mineSent);
        setReceivedRaids(mineReceived);
      } catch {
        setSentRaids([]);
        setReceivedRaids([]);
      } finally {
        setLoadingMonth(false);
      }
    })();
  }, [overview?.member?.twitchLogin, selectedMonth]);

  useEffect(() => {
    if (!overview?.member?.twitchLogin) return;
    const months = getLast12Months();
    (async () => {
      setHistoryLoading(true);
      try {
        const login = normalizeLogin(overview.member.twitchLogin);
        const historyRows = await Promise.all(
          months.map(async (monthKey) => {
            const response = await fetch(`/api/discord/raids/data-v2?month=${monthKey}`, { cache: "no-store" });
            const body = await response.json();
            const mineSent = (body.raidsFaits || []).filter((raid: RaidApiItem) => normalizeLogin(raid.raiderTwitchLogin) === login);
            const mineReceived = (body.raidsRecus || []).filter((raid: RaidApiItem) => normalizeLogin(raid.targetTwitchLogin) === login);
            const summary = computeSummary(mineSent, mineReceived);
            return {
              monthKey,
              sent: summary.sent,
              received: summary.received,
              uniqueTargets: summary.uniqueTargets,
              interactionScore: summary.sent + summary.received,
            };
          })
        );
        setHistory(historyRows);
      } catch {
        setHistory([]);
      } finally {
        setHistoryLoading(false);
      }
    })();
  }, [overview?.member?.twitchLogin]);

  const summary = useMemo(() => computeSummary(sentRaids, receivedRaids), [sentRaids, receivedRaids]);
  const selectedHistory = useMemo(() => history.find((entry) => entry.monthKey === selectedMonth) || null, [history, selectedMonth]);
  const previousHistory = useMemo(() => history.find((entry) => entry.monthKey === getPreviousMonthKey(selectedMonth)) || null, [history, selectedMonth]);
  const delta = (selectedHistory?.interactionScore || 0) - (previousHistory?.interactionScore || 0);
  const completionRate = goals.raids > 0 ? (summary.sent / goals.raids) * 100 : 0;
  const remainingToTarget = Math.max(0, goals.raids - summary.sent);
  const tier = getTier(summary.interactionScore);

  const targetBreakdown = useMemo(() => {
    const map = new Map<string, { label: string; count: number }>();
    for (const raid of sentRaids) {
      const key = normalizeLogin(raid.targetTwitchLogin || raid.targetDisplayName);
      if (!key) continue;
      const item = map.get(key) || { label: raid.targetDisplayName || raid.targetTwitchLogin || "Cible", count: 0 };
      item.count += raid.count || 1;
      map.set(key, item);
    }
    const max = Math.max(1, ...Array.from(map.values()).map((item) => item.count));
    return Array.from(map.entries())
      .map(([key, value]) => ({
        key,
        label: value.label,
        count: value.count,
        rate: Math.round((value.count / max) * 100),
      }))
      .sort((a, b) => b.count - a.count);
  }, [sentRaids]);

  const raiderBreakdown = useMemo(() => {
    const map = new Map<string, { label: string; count: number }>();
    for (const raid of receivedRaids) {
      const key = normalizeLogin(raid.raiderTwitchLogin || raid.raiderDisplayName);
      if (!key) continue;
      const item = map.get(key) || { label: raid.raiderDisplayName || raid.raiderTwitchLogin || "Membre", count: 0 };
      item.count += 1;
      map.set(key, item);
    }
    const max = Math.max(1, ...Array.from(map.values()).map((item) => item.count));
    return Array.from(map.entries())
      .map(([key, value]) => ({
        key,
        label: value.label,
        count: value.count,
        rate: Math.round((value.count / max) * 100),
      }))
      .sort((a, b) => b.count - a.count);
  }, [receivedRaids]);

  const sparklineData = history.filter((entry) => entry.interactionScore > 0).slice(-6);
  const maxInteractions = Math.max(1, ...sparklineData.map((entry) => entry.interactionScore));

  return (
    <MemberSurface>
      <MemberPageHeader title="Statistiques de raids" description="Un vrai espace de suivi premium, mois par mois." badge={tier.label} />

      {loadingOverview ? <p style={{ color: "var(--color-text-secondary)" }}>Chargement des statistiques...</p> : null}
      {!loadingOverview && (error || !overview) ? (
        <EmptyFeatureCard title="Statistiques de raids" description={error || "Donnees indisponibles."} />
      ) : null}

      {overview ? (
        <>
          <section className="rounded-xl border p-3 md:p-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="inline-flex rounded-lg border p-1" style={{ borderColor: "rgba(255,255,255,0.14)" }}>
                <button
                  type="button"
                  onClick={() => setActiveTab("general")}
                  className="rounded-md px-3 py-1.5 text-sm font-semibold transition"
                  style={{
                    backgroundColor: activeTab === "general" ? "rgba(139,92,246,0.28)" : "transparent",
                    color: activeTab === "general" ? "var(--color-text)" : "var(--color-text-secondary)",
                  }}
                >
                  General raids
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("received")}
                  className="rounded-md px-3 py-1.5 text-sm font-semibold transition"
                  style={{
                    backgroundColor: activeTab === "received" ? "rgba(240,201,107,0.22)" : "transparent",
                    color: activeTab === "received" ? "#f0c96b" : "var(--color-text-secondary)",
                  }}
                >
                  Recus
                </button>
              </div>

              <select
                value={selectedMonth}
                onChange={(event) => setSelectedMonth(event.target.value)}
                className="rounded-lg border px-3 py-2 text-sm"
                style={{ borderColor: "var(--color-border)", backgroundColor: "rgba(10,10,14,0.55)", color: "var(--color-text)" }}
              >
                {getLast12Months()
                  .slice()
                  .reverse()
                  .map((month) => (
                    <option key={month} value={month}>
                      {formatMonthLabel(month)}
                    </option>
                  ))}
              </select>
            </div>
          </section>

          {activeTab === "general" ? (
            <>
              <section
                className="rounded-2xl border p-5 md:p-6"
                style={{
                  borderColor: "rgba(212, 175, 55, 0.35)",
                  background: "radial-gradient(circle at 12% 18%, rgba(212,175,55,0.16), rgba(25,25,31,0.96) 42%)",
                  boxShadow: "0 18px 36px rgba(0,0,0,0.24)",
                }}
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-center gap-5">
                    <ProgressRing value={completionRate} label="Objectif" />
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em]" style={{ color: "rgba(240, 201, 107, 0.88)" }}>
                        Mon mois raids
                      </p>
                      <h2 className="mt-2 text-2xl font-semibold" style={{ color: "var(--color-text)" }}>
                        {summary.sent} raid(s) faits en {formatMonthLabel(selectedMonth)}
                      </h2>
                      <p className="mt-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                        {remainingToTarget > 0
                          ? `Encore ${remainingToTarget} raid(s) pour atteindre ton objectif du mois.`
                          : "Objectif mensuel atteint. Continue pour consolider ton avance."}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:min-w-[280px]">
                    <div className="rounded-xl border px-4 py-3" style={{ borderColor: "rgba(255,255,255,0.12)", backgroundColor: "rgba(12,12,15,0.45)" }}>
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                          Objectif raids (depuis /member/objectifs)
                        </span>
                        <span className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                          {goals.raids} raids
                        </span>
                      </div>
                      <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                        Modifie cet objectif depuis la page Objectifs pour garder la meme valeur partout.
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-lg border px-3 py-2" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
                        <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                          Delta
                        </p>
                        <p className="text-sm font-semibold" style={{ color: delta >= 0 ? "#34d399" : "#f87171" }}>
                          {delta >= 0 ? "+" : ""}
                          {delta}
                        </p>
                      </div>
                      <div className="rounded-lg border px-3 py-2" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
                        <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                          Cibles
                        </p>
                        <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                          {summary.uniqueTargets}
                        </p>
                      </div>
                      <div className="rounded-lg border px-3 py-2" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
                        <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                          Recus
                        </p>
                        <p className="text-sm font-semibold" style={{ color: "#60a5fa" }}>
                          {summary.received}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
                <article className="rounded-xl border p-5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <h3 className="flex items-center gap-2 text-lg font-semibold" style={{ color: "var(--color-text)" }}>
                      <TrendingUp size={17} />
                      Suivi par mois
                    </h3>
                    <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                      12 derniers mois
                    </span>
                  </div>

                  <div className="space-y-3">
                    {historyLoading || sparklineData.length === 0 ? (
                      <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                        {historyLoading ? "Chargement de la tendance..." : "Pas assez de donnees pour afficher la tendance."}
                      </p>
                    ) : (
                      sparklineData.map((entry) => (
                        <div key={entry.monthKey}>
                          <div className="mb-1 flex items-center justify-between text-sm">
                            <span style={{ color: "var(--color-text)" }}>{formatMonthLabel(entry.monthKey)}</span>
                            <span style={{ color: "var(--color-text-secondary)" }}>
                              {entry.sent} faits / {entry.received} recus
                            </span>
                          </div>
                          <div className="h-2.5 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.12)" }}>
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${Math.max(8, (entry.interactionScore / maxInteractions) * 100)}%`,
                                background: "linear-gradient(90deg, rgba(240,201,107,0.9), rgba(139,92,246,0.85))",
                              }}
                            />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </article>

                <article className="rounded-xl border p-5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
                  <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold" style={{ color: "var(--color-text)" }}>
                    <Target size={17} />
                    Repartition des cibles
                  </h3>
                  {targetBreakdown.length === 0 ? (
                    <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                      Aucune cible sur ce mois.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {targetBreakdown.slice(0, 8).map((item) => (
                        <div key={item.key} className="rounded-lg border px-3 py-2" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                          <div className="flex items-center justify-between text-sm">
                            <span style={{ color: "var(--color-text)" }}>{item.label}</span>
                            <span style={{ color: "var(--color-text-secondary)" }}>x{item.count}</span>
                          </div>
                          <div className="mt-2 h-1.5 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.11)" }}>
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${item.rate}%`,
                                backgroundColor: item.count >= 3 ? "#34d399" : item.count >= 2 ? "#f59e0b" : "#f87171",
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </article>
              </section>

              <section className="rounded-xl border p-5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="flex items-center gap-2 text-lg font-semibold" style={{ color: "var(--color-text)" }}>
                    <CalendarDays size={17} />
                    Timeline des raids faits
                  </h3>
                  <span className="inline-flex items-center gap-1 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                    <Flame size={14} />
                    Source admin/raids
                  </span>
                </div>
                {loadingMonth ? (
                  <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                    Chargement des raids...
                  </p>
                ) : sentRaids.length === 0 ? (
                  <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                    Aucun raid fait sur {formatMonthLabel(selectedMonth)}.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {sentRaids.map((raid, index) => (
                      <div
                        key={`${raid.date}-${index}`}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-lg border px-3 py-2"
                        style={{
                          borderColor: "rgba(239,68,68,0.35)",
                          backgroundColor: "rgba(239,68,68,0.07)",
                        }}
                      >
                        <div>
                          <p style={{ color: "var(--color-text)" }}>{raid.targetDisplayName || raid.targetTwitchLogin || "Cible TENF"}</p>
                          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                            {new Date(raid.date).toLocaleString("fr-FR")}
                          </p>
                        </div>
                        <span
                          className="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-semibold"
                          style={{ borderColor: "rgba(239,68,68,0.45)", color: "#fca5a5" }}
                        >
                          x{raid.count || 1}
                          <ChevronRight size={12} />
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          ) : (
            <section
              className="rounded-xl border p-5"
              style={{
                borderColor: "rgba(96,165,250,0.35)",
                background: "linear-gradient(145deg, rgba(96,165,250,0.09), rgba(17,17,22,0.95))",
              }}
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="flex items-center gap-2 text-lg font-semibold" style={{ color: "var(--color-text)" }}>
                  <Shield size={17} />
                  Raids recus
                </h3>
                <span className="rounded-full border px-2 py-1 text-xs" style={{ borderColor: "rgba(96,165,250,0.45)", color: "#93c5fd" }}>
                  Sur {formatMonthLabel(selectedMonth)}
                </span>
              </div>

              <div className="grid gap-3 md:grid-cols-4">
                <div className="rounded-lg border px-3 py-3" style={{ borderColor: "rgba(255,255,255,0.12)" }}>
                  <p className="text-xs uppercase tracking-[0.08em]" style={{ color: "var(--color-text-secondary)" }}>
                    Total recus
                  </p>
                  <p className="mt-1 text-2xl font-semibold" style={{ color: "#93c5fd" }}>
                    {summary.received}
                  </p>
                </div>
                <div className="rounded-lg border px-3 py-3" style={{ borderColor: "rgba(255,255,255,0.12)" }}>
                  <p className="text-xs uppercase tracking-[0.08em]" style={{ color: "var(--color-text-secondary)" }}>
                    Raids faits
                  </p>
                  <p className="mt-1 text-2xl font-semibold" style={{ color: "var(--color-text)" }}>
                    {summary.sent}
                  </p>
                </div>
                <div className="rounded-lg border px-3 py-3" style={{ borderColor: "rgba(255,255,255,0.12)" }}>
                  <p className="text-xs uppercase tracking-[0.08em]" style={{ color: "var(--color-text-secondary)" }}>
                    Top raider
                  </p>
                  <p className="mt-1 text-lg font-semibold" style={{ color: "var(--color-text)" }}>
                    {summary.topRaider?.label || "Aucun"}
                  </p>
                </div>
                <div className="rounded-lg border px-3 py-3" style={{ borderColor: "rgba(255,255,255,0.12)" }}>
                  <p className="text-xs uppercase tracking-[0.08em]" style={{ color: "var(--color-text-secondary)" }}>
                    Cible principale
                  </p>
                  <p className="mt-1 text-lg font-semibold" style={{ color: "var(--color-text)" }}>
                    {summary.topTarget?.label || "Aucune"}
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                  Repartition des raiders
                </p>
                {raiderBreakdown.length === 0 ? (
                  <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                    Aucun raid recu ce mois-ci.
                  </p>
                ) : (
                  raiderBreakdown.map((item) => (
                    <div key={item.key} className="rounded-lg border px-3 py-2" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
                      <div className="flex items-center justify-between text-sm">
                        <span style={{ color: "var(--color-text)" }}>{item.label}</span>
                        <span style={{ color: "var(--color-text-secondary)" }}>{item.count} raid(s)</span>
                      </div>
                      <div className="mt-2 h-1.5 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.11)" }}>
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${item.rate}%`,
                            backgroundColor: "#60a5fa",
                          }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-5 space-y-2">
                <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                  Historique des raids recus
                </p>
                {loadingMonth ? (
                  <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                    Chargement des raids recus...
                  </p>
                ) : receivedRaids.length === 0 ? (
                  <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                    Aucun raid recu enregistre pour ce mois.
                  </p>
                ) : (
                  receivedRaids.map((raid, index) => (
                    <div
                      key={`${raid.date}-${index}-received`}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border px-3 py-2"
                      style={{ borderColor: "rgba(255,255,255,0.1)", backgroundColor: "rgba(0,0,0,0.08)" }}
                    >
                      <div className="flex items-center gap-2">
                        <UserRound size={14} style={{ color: "#93c5fd" }} />
                        <div>
                          <p style={{ color: "var(--color-text)" }}>{raid.raiderDisplayName || raid.raiderTwitchLogin || "Membre"}</p>
                          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                            {new Date(raid.date).toLocaleString("fr-FR")}
                          </p>
                        </div>
                      </div>
                      <span
                        className="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-semibold"
                        style={{ borderColor: "rgba(96,165,250,0.5)", color: "#93c5fd" }}
                      >
                        Recu
                      </span>
                    </div>
                  ))
                )}
              </div>
      </section>
          )}
        </>
      ) : null}
    </MemberSurface>
  );
}

"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import { Activity, BarChart3, ClipboardCheck, Sparkles, Users } from "lucide-react";

type ResultStats = {
  membersCount: number;
  avgFinalScore: number;
  vipCount: number;
  surveillerCount: number;
  validatedCount: number;
};

type ResultRow = {
  twitchLogin: string;
  finalScore: number;
};

type BonusRecord = {
  timezoneBonusEnabled?: boolean;
  moderationBonus?: number;
};

const glassCardClass =
  "rounded-2xl border border-indigo-300/20 bg-[linear-gradient(150deg,rgba(99,102,241,0.12),rgba(14,15,23,0.85)_45%,rgba(56,189,248,0.08))] shadow-[0_20px_50px_rgba(2,6,23,0.45)] backdrop-blur";
const sectionCardClass =
  "rounded-2xl border border-[#2f3244] bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.10),_rgba(11,13,20,0.95)_46%)] p-5 shadow-[0_16px_40px_rgba(2,6,23,0.45)]";
const denseStatCardClass =
  "rounded-xl border border-white/10 bg-black/20 p-3 min-h-[92px] flex flex-col justify-between";
const quickLinkClass =
  "rounded-lg border border-indigo-300/25 px-3 py-1.5 text-indigo-100 hover:border-indigo-200/45 transition-colors";
const subtleButtonClass =
  "inline-flex items-center gap-2 rounded-xl border border-indigo-300/25 bg-[linear-gradient(135deg,rgba(79,70,229,0.24),rgba(30,41,59,0.36))] px-3 py-2 text-sm font-medium text-indigo-100 transition hover:-translate-y-[1px] hover:border-indigo-200/45 hover:bg-[linear-gradient(135deg,rgba(99,102,241,0.34),rgba(30,41,59,0.54))]";

const premiumHeroStyle: CSSProperties = {
  borderColor: "rgba(129,140,248,0.28)",
  background:
    "radial-gradient(circle at 12% 18%, rgba(99,102,241,0.2), rgba(99,102,241,0) 45%), radial-gradient(circle at 78% 0%, rgba(56,189,248,0.18), rgba(56,189,248,0) 35%), linear-gradient(150deg, rgba(14,15,23,0.92), rgba(14,15,23,0.98))",
  boxShadow: "0 20px 50px rgba(2, 6, 23, 0.45)",
};

const premiumCardStyle: CSSProperties = {
  borderColor: "rgba(79, 70, 229, 0.3)",
  background: "radial-gradient(circle at top, rgba(79,70,229,0.12), rgba(11,13,20,0.95) 46%)",
  boxShadow: "0 16px 40px rgba(2, 6, 23, 0.45)",
};

const softCardStyle: CSSProperties = {
  borderColor: "rgba(79, 70, 229, 0.24)",
  background: "linear-gradient(150deg, rgba(79,70,229,0.08), rgba(15,23,42,0.65))",
};

function getCurrentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthOptions(): string[] {
  const options: string[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    options.push(`${year}-${month}`);
  }
  return options;
}

function formatMonthKey(key: string): string {
  const [year, month] = key.split("-");
  const monthNames = [
    "Janvier",
    "Février",
    "Mars",
    "Avril",
    "Mai",
    "Juin",
    "Juillet",
    "Août",
    "Septembre",
    "Octobre",
    "Novembre",
    "Décembre",
  ];
  return `${monthNames[Math.max(0, Number(month) - 1)]} ${year}`;
}

function averageFromMap(map: Record<string, number>): number {
  const values = Object.values(map).filter((value) => Number.isFinite(value));
  if (values.length === 0) return 0;
  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 100) / 100;
}

export default function EvaluationDashboardPage() {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [loadingAccess, setLoadingAccess] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthKey());
  const [loadingData, setLoadingData] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadedAt, setLoadedAt] = useState<string | null>(null);

  const [resultStats, setResultStats] = useState<ResultStats>({
    membersCount: 0,
    avgFinalScore: 0,
    vipCount: 0,
    surveillerCount: 0,
    validatedCount: 0,
  });
  const [resultRows, setResultRows] = useState<ResultRow[]>([]);
  const [finalNotesCount, setFinalNotesCount] = useState(0);
  const [overridesCount, setOverridesCount] = useState(0);
  const [bonusCount, setBonusCount] = useState(0);
  const [followSourceFallbackMonth, setFollowSourceFallbackMonth] = useState<string | null>(null);

  const [spotlightPoints, setSpotlightPoints] = useState<Record<string, number>>({});
  const [raidsPoints, setRaidsPoints] = useState<Record<string, number>>({});
  const [discordPoints, setDiscordPoints] = useState<Record<string, number>>({});
  const [followPoints, setFollowPoints] = useState<Record<string, number>>({});
  const [eventsPresence, setEventsPresence] = useState<any[]>([]);

  useEffect(() => {
    async function checkAccess() {
      try {
        const response = await fetch("/api/user/role");
        if (response.ok) {
          const data = await response.json();
          setHasAccess(data.hasAdminAccess === true);
        } else {
          setHasAccess(false);
        }
      } catch (error) {
        console.error("[evaluation/dashboard] Erreur vérification accès:", error);
        setHasAccess(false);
      } finally {
        setLoadingAccess(false);
      }
    }
    void checkAccess();
  }, []);

  useEffect(() => {
    if (!hasAccess) {
      setLoadingData(false);
      return;
    }

    let mounted = true;

    async function loadDashboard() {
      try {
        setLoadingData(true);
        setLoadError(null);

        const [
          resultRes,
          finalNotesRes,
          overridesRes,
          bonusRes,
          spotlightRes,
          raidsRes,
          discordRes,
          followRes,
          eventsRes,
        ] = await Promise.allSettled([
          fetch(`/api/evaluations/result?month=${selectedMonth}`, { cache: "no-store" }),
          fetch(`/api/evaluations/synthesis/save?month=${selectedMonth}`, { cache: "no-store" }),
          fetch(`/api/evaluations/synthesis/overrides?month=${selectedMonth}&limit=300`, { cache: "no-store" }),
          fetch(`/api/evaluations/bonus?month=${selectedMonth}`, { cache: "no-store" }),
          fetch(`/api/evaluations/spotlights/points?month=${selectedMonth}`, { cache: "no-store" }),
          fetch(`/api/evaluations/raids/points?month=${selectedMonth}`, { cache: "no-store" }),
          fetch(`/api/evaluations/discord/points?month=${selectedMonth}`, { cache: "no-store" }),
          fetch(`/api/evaluations/follow/points?month=${selectedMonth}`, { cache: "no-store" }),
          fetch(`/api/admin/events/presence?month=${selectedMonth}`, { cache: "no-store" }),
        ]);

        if (!mounted) return;

        if (resultRes.status === "fulfilled" && resultRes.value.ok) {
          const payload = await resultRes.value.json();
          setResultStats(payload.stats || resultStats);
          setResultRows(Array.isArray(payload.rows) ? payload.rows : []);
        }

        if (finalNotesRes.status === "fulfilled" && finalNotesRes.value.ok) {
          const payload = await finalNotesRes.value.json();
          const finalNotes = payload.finalNotes || {};
          setFinalNotesCount(Object.keys(finalNotes).length);
        }

        if (overridesRes.status === "fulfilled" && overridesRes.value.ok) {
          const payload = await overridesRes.value.json();
          setOverridesCount(Number(payload.count || 0));
        }

        if (bonusRes.status === "fulfilled" && bonusRes.value.ok) {
          const payload = await bonusRes.value.json();
          const bonuses = (payload.bonuses || {}) as Record<string, BonusRecord>;
          const count = Object.values(bonuses).filter((bonus) => {
            const tz = bonus?.timezoneBonusEnabled === true;
            const mod = Number(bonus?.moderationBonus || 0) > 0;
            return tz || mod;
          }).length;
          setBonusCount(count);
        }

        if (spotlightRes.status === "fulfilled" && spotlightRes.value.ok) {
          const payload = await spotlightRes.value.json();
          setSpotlightPoints((payload.points || {}) as Record<string, number>);
        }

        if (raidsRes.status === "fulfilled" && raidsRes.value.ok) {
          const payload = await raidsRes.value.json();
          setRaidsPoints((payload.points || {}) as Record<string, number>);
        }

        if (discordRes.status === "fulfilled" && discordRes.value.ok) {
          const payload = await discordRes.value.json();
          setDiscordPoints((payload.points || {}) as Record<string, number>);
        }

        if (followRes.status === "fulfilled" && followRes.value.ok) {
          const payload = await followRes.value.json();
          setFollowPoints((payload.points || {}) as Record<string, number>);
          const sourceMonth =
            typeof payload.dataSourceMonth === "string" && payload.dataSourceMonth !== selectedMonth
              ? payload.dataSourceMonth
              : null;
          setFollowSourceFallbackMonth(sourceMonth);
        } else {
          setFollowSourceFallbackMonth(null);
        }

        if (eventsRes.status === "fulfilled" && eventsRes.value.ok) {
          const payload = await eventsRes.value.json();
          setEventsPresence(Array.isArray(payload.events) ? payload.events : []);
        }
      } catch (error) {
        if (!mounted) return;
        setLoadError(error instanceof Error ? error.message : "Erreur de chargement");
      } finally {
        if (mounted) {
          setLoadingData(false);
          setLoadedAt(new Date().toISOString());
        }
      }
    }

    void loadDashboard();
    return () => {
      mounted = false;
    };
  }, [hasAccess, selectedMonth]);

  const loadedAtLabel = useMemo(() => {
    if (!loadedAt) return "Mise à jour en cours";
    const date = new Date(loadedAt);
    if (Number.isNaN(date.getTime())) return "Mise à jour récente";
    return `Dernière synchro: ${date.toLocaleString("fr-FR")}`;
  }, [loadedAt]);

  const metrics = useMemo(() => {
    const spotlightAvg = averageFromMap(spotlightPoints);
    const raidsAvg = averageFromMap(raidsPoints);
    const discordAvg = averageFromMap(discordPoints);
    const followAvg = averageFromMap(followPoints);

    const followsLowCount = Object.values(followPoints).filter((value) => Number(value) < 2.5).length;
    const discordLowCount = Object.values(discordPoints).filter((value) => Number(value) < 2).length;

    const spotlightEvents = eventsPresence.filter((event) =>
      String(event?.category || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .includes("spotlight")
    );
    const communityEvents = eventsPresence.filter((event) => !spotlightEvents.includes(event));

    const communityParticipants = new Set<string>();
    for (const event of communityEvents) {
      for (const presence of event?.presences || []) {
        if (presence?.present && typeof presence?.twitchLogin === "string") {
          communityParticipants.add(presence.twitchLogin.toLowerCase());
        }
      }
    }

    const toValidateCount = Math.max(0, resultStats.membersCount - resultStats.validatedCount);
    const finalNoteCoverage =
      resultStats.membersCount > 0 ? Math.round((finalNotesCount / resultStats.membersCount) * 100) : 0;

    return {
      headline: {
        members: resultStats.membersCount,
        avgFinalScore: resultStats.avgFinalScore,
        vip: resultStats.vipCount,
        alerts: resultStats.surveillerCount,
        validated: resultStats.validatedCount,
        toValidateCount,
        finalNoteCoverage,
      },
      sectionA: {
        spotlightAvg,
        raidsAvg,
        spotlightEventsCount: spotlightEvents.length,
      },
      sectionB: {
        discordAvg,
        communityEventsCount: communityEvents.length,
        communityParticipantsCount: communityParticipants.size,
        discordLowCount,
      },
      sectionC: {
        followAvg,
        followsLowCount,
        fallbackMonth: followSourceFallbackMonth,
      },
      sectionD: {
        bonusCount,
        overridesCount,
        finalNotesCount,
      },
    };
  }, [
    discordPoints,
    eventsPresence,
    finalNotesCount,
    followPoints,
    followSourceFallbackMonth,
    overridesCount,
    raidsPoints,
    resultStats,
    spotlightPoints,
    bonusCount,
  ]);

  const actionBoard = useMemo(() => {
    const actions = [
      {
        id: "validate-results",
        label: "Finaliser les validations de résultats",
        count: metrics.headline.toValidateCount,
        href: "/admin/evaluation/result",
      },
      {
        id: "surveiller",
        label: "Traiter les membres à surveiller",
        count: metrics.headline.alerts,
        href: "/admin/evaluation/d?preset=surveiller",
      },
      {
        id: "discord-low",
        label: "Renforcer l'engagement Discord faible",
        count: metrics.sectionB.discordLowCount,
        href: "/admin/evaluation/b/discord",
      },
      {
        id: "follow-low",
        label: "Relancer les follows faibles",
        count: metrics.sectionC.followsLowCount,
        href: "/admin/evaluation/c",
      },
      {
        id: "audit-overrides",
        label: "Contrôler les overrides et bonus manuels",
        count: metrics.sectionD.overridesCount,
        href: "/admin/evaluation/d",
      },
    ];
    return actions.filter((item) => item.count > 0).sort((a, b) => b.count - a.count);
  }, [metrics]);

  const scoreInsights = useMemo(() => {
    const total = resultRows.length;
    if (total === 0) {
      return {
        total,
        highCount: 0,
        mediumCount: 0,
        lowCount: 0,
        highPct: 0,
        mediumPct: 0,
        lowPct: 0,
      };
    }

    const highCount = resultRows.filter((row) => Number(row.finalScore) >= 16).length;
    const lowCount = resultRows.filter((row) => Number(row.finalScore) < 5).length;
    const mediumCount = Math.max(0, total - highCount - lowCount);

    return {
      total,
      highCount,
      mediumCount,
      lowCount,
      highPct: Math.round((highCount / total) * 100),
      mediumPct: Math.round((mediumCount / total) * 100),
      lowPct: Math.round((lowCount / total) * 100),
    };
  }, [resultRows]);

  const priorityMembers = useMemo(() => {
    const enriched = resultRows
      .map((row) => {
        const score = Number(row.finalScore || 0);
        const gap = Math.max(0, 16 - score);
        const risk = score < 5 ? "critique" : score < 8 ? "elevé" : score < 12 ? "modéré" : "stable";
        return {
          twitchLogin: row.twitchLogin,
          finalScore: score,
          gap,
          risk,
        };
      })
      .sort((a, b) => a.finalScore - b.finalScore);

    return enriched.slice(0, 8);
  }, [resultRows]);

  if (loadingAccess) {
    return (
      <div className="min-h-screen bg-[#0e0e10] text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#9146ff]" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-[#0e0e10] text-white p-8">
        <div className="bg-[#1a1a1d] border border-red-500 rounded-lg p-8">
          <h1 className="text-2xl font-bold text-red-400 mb-4">Accès refusé</h1>
          <p className="text-gray-400">Vous n'avez pas les permissions nécessaires.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="text-white space-y-8">
      <div className={`${glassCardClass} p-6 md:p-7`} style={premiumHeroStyle}>
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-indigo-200/90">Pilotage évaluation</p>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-indigo-100 via-sky-200 to-cyan-200 bg-clip-text text-transparent">
              Évaluation mensuelle - Dashboard de pilotage
            </h1>
            <p className="text-gray-300 max-w-3xl">
              Pilotage des sections A/B/C, synthèse mensuelle, bonus et validations finales.
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-gray-300">{loadedAtLabel}</div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <label className="text-sm font-semibold text-gray-200">Mois :</label>
          <select
            value={selectedMonth}
            onChange={(event) => setSelectedMonth(event.target.value)}
            className="bg-[#11131a] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-300/60"
          >
            {getMonthOptions().map((option) => (
              <option key={option} value={option}>
                {formatMonthKey(option)}
              </option>
            ))}
          </select>
          <span className="rounded-lg border border-indigo-300/25 bg-indigo-500/10 px-3 py-1.5 text-xs text-indigo-100">
            {loadingData ? "Actualisation..." : `Période active: ${formatMonthKey(selectedMonth)}`}
          </span>
          <Link href="/admin/evaluation/v2/pilotage" className={subtleButtonClass}>
            Ouvrir pilotage v2
          </Link>
        </div>
      </div>

      {loadError ? (
        <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-rose-200">
          Chargement partiel des indicateurs: {loadError}
        </div>
      ) : null}

      <section className={`${sectionCardClass}`} style={softCardStyle}>
        <h2 className="text-lg font-semibold">Explication de la page</h2>
        <div className="mt-3 grid grid-cols-1 gap-2 text-sm md:grid-cols-3">
          <p className="rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-amber-100">
            1. Contrôler la santé globale du mois (volume, moyenne, alertes, validations).
          </p>
          <p className="rounded-lg border border-blue-400/30 bg-blue-500/10 px-3 py-2 text-blue-100">
            2. Prioriser les actions de relance via “À traiter maintenant”.
          </p>
          <p className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-emerald-100">
            3. Finaliser la synthèse puis valider les résultats pour clôturer le mois.
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Vue globale</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className={`${sectionCardClass} min-h-[138px]`} style={premiumCardStyle}>
            <p className="text-sm text-gray-400">Membres évalués</p>
            <p className="mt-2 text-3xl font-bold">{metrics.headline.members}</p>
            <p className="mt-2 text-xs text-gray-400">Base de calcul du mois</p>
          </div>
          <div className={`${sectionCardClass} min-h-[138px]`} style={premiumCardStyle}>
            <p className="text-sm text-gray-400">Moyenne finale</p>
            <p className="mt-2 text-3xl font-bold">{metrics.headline.avgFinalScore.toFixed(2)}</p>
            <p className="mt-2 text-xs text-gray-400">Score global mensuel</p>
          </div>
          <div className={`${sectionCardClass} min-h-[138px]`} style={premiumCardStyle}>
            <p className="text-sm text-gray-400">VIP potentiels</p>
            <p className="mt-2 text-3xl font-bold text-emerald-300">{metrics.headline.vip}</p>
            <p className="mt-2 text-xs text-gray-400">Membres &gt;= 16</p>
          </div>
          <div className={`${sectionCardClass} min-h-[138px]`} style={premiumCardStyle}>
            <p className="text-sm text-gray-400">À surveiller</p>
            <p className={`mt-2 text-3xl font-bold ${metrics.headline.alerts > 0 ? "text-rose-300" : "text-emerald-300"}`}>
              {metrics.headline.alerts}
            </p>
            <p className="mt-2 text-xs text-gray-400">Membres &lt; 5</p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">À traiter maintenant</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {actionBoard.length === 0 ? (
            <div className={`${sectionCardClass} text-sm text-emerald-300 xl:col-span-3`} style={softCardStyle}>
              Aucun backlog critique détecté pour cette période.
            </div>
          ) : (
            actionBoard.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className={`${sectionCardClass} min-h-[112px] transition hover:border-indigo-200/45 hover:-translate-y-[1px]`}
                style={softCardStyle}
              >
                <div className="flex items-center justify-between gap-3 mb-2">
                  <p className="text-sm font-medium">{item.label}</p>
                  <span className="inline-flex min-w-10 justify-center rounded-full border border-amber-400/40 bg-amber-500/15 px-2 py-1 text-xs font-semibold text-amber-200">
                    {item.count}
                  </span>
                </div>
                <p className="text-xs text-gray-400">Action directe en un clic</p>
              </Link>
            ))
          )}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Lecture opérationnelle du mois</h2>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className={`${sectionCardClass}`} style={softCardStyle}>
            <p className="text-sm text-gray-400">Couverture validations</p>
            <p className="mt-1 text-2xl font-bold">{metrics.headline.members > 0 ? Math.round((metrics.headline.validated / metrics.headline.members) * 100) : 0}%</p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-300"
                style={{ width: `${Math.min(100, Math.max(0, metrics.headline.members > 0 ? Math.round((metrics.headline.validated / metrics.headline.members) * 100) : 0))}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-gray-400">
              {metrics.headline.validated}/{metrics.headline.members} snapshots validés
            </p>
          </div>

          <div className={`${sectionCardClass}`} style={softCardStyle}>
            <p className="text-sm text-gray-400">Répartition des scores</p>
            <div className="mt-3 space-y-3 text-xs">
              <div>
                <div className="mb-1 flex items-center justify-between text-emerald-200">
                  <span>Performants (>= 16)</span>
                  <span>{scoreInsights.highCount}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-emerald-400" style={{ width: `${scoreInsights.highPct}%` }} />
                </div>
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between text-amber-200">
                  <span>Intermédiaires</span>
                  <span>{scoreInsights.mediumCount}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-amber-400" style={{ width: `${scoreInsights.mediumPct}%` }} />
                </div>
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between text-rose-200">
                  <span>À risque (&lt; 5)</span>
                  <span>{scoreInsights.lowCount}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-rose-400" style={{ width: `${scoreInsights.lowPct}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className={`${sectionCardClass}`} style={softCardStyle}>
            <p className="text-sm text-gray-400">Couverture qualitative</p>
            <p className="mt-1 text-2xl font-bold">{metrics.headline.finalNoteCoverage}%</p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-cyan-300"
                style={{ width: `${Math.min(100, Math.max(0, metrics.headline.finalNoteCoverage))}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-gray-400">
              Notes finales manuelles: {metrics.sectionD.finalNotesCount}
            </p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <section className={`${sectionCardClass} min-h-[340px]`} style={softCardStyle}>
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-5 w-5 text-indigo-300" />
            <h3 className="text-lg font-semibold">A. Présence active</h3>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className={denseStatCardClass}>
              <p className="text-gray-400">Moyenne Spotlight</p>
              <p className="text-2xl font-bold mt-1">{metrics.sectionA.spotlightAvg.toFixed(2)}</p>
            </div>
            <div className={denseStatCardClass}>
              <p className="text-gray-400">Moyenne Raids</p>
              <p className="text-2xl font-bold mt-1">{metrics.sectionA.raidsAvg.toFixed(2)}</p>
            </div>
            <div className={`${denseStatCardClass} col-span-2`}>
              <p className="text-gray-400">Sessions Spotlight détectées</p>
              <p className="text-2xl font-bold mt-1">{metrics.sectionA.spotlightEventsCount}</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <Link href="/admin/evaluation/a" className={quickLinkClass}>
              Dashboard section A
            </Link>
            <Link href="/admin/evaluation/a/spotlights" className={quickLinkClass}>
              Spotlights
            </Link>
            <Link href="/admin/evaluation/a/raids" className={quickLinkClass}>
              Raids
            </Link>
          </div>
        </section>

        <section className={`${sectionCardClass} min-h-[340px]`} style={softCardStyle}>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-indigo-300" />
            <h3 className="text-lg font-semibold">B. Engagement communautaire</h3>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className={denseStatCardClass}>
              <p className="text-gray-400">Moyenne Discord</p>
              <p className="text-2xl font-bold mt-1">{metrics.sectionB.discordAvg.toFixed(2)}</p>
            </div>
            <div className={denseStatCardClass}>
              <p className="text-gray-400">Discord faible (&lt; 2)</p>
              <p className={`text-2xl font-bold mt-1 ${metrics.sectionB.discordLowCount > 0 ? "text-rose-300" : "text-emerald-300"}`}>
                {metrics.sectionB.discordLowCount}
              </p>
            </div>
            <div className={denseStatCardClass}>
              <p className="text-gray-400">Events communauté</p>
              <p className="text-2xl font-bold mt-1">{metrics.sectionB.communityEventsCount}</p>
            </div>
            <div className={denseStatCardClass}>
              <p className="text-gray-400">Participants Events</p>
              <p className="text-2xl font-bold mt-1">{metrics.sectionB.communityParticipantsCount}</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <Link href="/admin/evaluation/b" className={quickLinkClass}>
              Dashboard section B
            </Link>
            <Link href="/admin/evaluation/b/discord" className={quickLinkClass}>
              Discord
            </Link>
            <Link href="/admin/evaluation/b/events-serveur" className={quickLinkClass}>
              Events serveur
            </Link>
          </div>
        </section>

        <section className={`${sectionCardClass} min-h-[340px]`} style={softCardStyle}>
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-indigo-300" />
            <h3 className="text-lg font-semibold">C. Follow</h3>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className={denseStatCardClass}>
              <p className="text-gray-400">Moyenne Follow</p>
              <p className="text-2xl font-bold mt-1">{metrics.sectionC.followAvg.toFixed(2)}</p>
            </div>
            <div className={denseStatCardClass}>
              <p className="text-gray-400">Follow faible (&lt; 2.5)</p>
              <p className={`text-2xl font-bold mt-1 ${metrics.sectionC.followsLowCount > 0 ? "text-rose-300" : "text-emerald-300"}`}>
                {metrics.sectionC.followsLowCount}
              </p>
            </div>
            <div className={`${denseStatCardClass} col-span-2`}>
              <p className="text-gray-400">Source de données Follow</p>
              <p className="text-sm mt-1 text-gray-200">
                {metrics.sectionC.fallbackMonth
                  ? `Fallback appliqué: données de ${formatMonthKey(metrics.sectionC.fallbackMonth)}`
                  : `Données natives de ${formatMonthKey(selectedMonth)}`}
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <Link href="/admin/evaluation/c" className={quickLinkClass}>
              Dashboard section C
            </Link>
          </div>
        </section>

        <section className={`${sectionCardClass} min-h-[340px]`} style={softCardStyle}>
          <div className="flex items-center gap-2 mb-4">
            <ClipboardCheck className="h-5 w-5 text-indigo-300" />
            <h3 className="text-lg font-semibold">Synthèse & résultat final</h3>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className={denseStatCardClass}>
              <p className="text-gray-400">Snapshots validés</p>
              <p className="text-2xl font-bold mt-1">{metrics.headline.validated}</p>
            </div>
            <div className={denseStatCardClass}>
              <p className="text-gray-400">Reste à valider</p>
              <p className={`text-2xl font-bold mt-1 ${metrics.headline.toValidateCount > 0 ? "text-amber-300" : "text-emerald-300"}`}>
                {metrics.headline.toValidateCount}
              </p>
            </div>
            <div className={denseStatCardClass}>
              <p className="text-gray-400">Notes finales manuelles</p>
              <p className="text-2xl font-bold mt-1">{metrics.sectionD.finalNotesCount}</p>
            </div>
            <div className={denseStatCardClass}>
              <p className="text-gray-400">Bonus appliqués</p>
              <p className="text-2xl font-bold mt-1">{metrics.sectionD.bonusCount}</p>
            </div>
            <div className={`${denseStatCardClass} col-span-2`}>
              <p className="text-gray-400">Couverture notes finales</p>
              <p className="text-2xl font-bold mt-1">{metrics.headline.finalNoteCoverage}%</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <Link href="/admin/evaluation/d" className={quickLinkClass}>
              Synthèse & bonus
            </Link>
            <Link href="/admin/evaluation/result" className={quickLinkClass}>
              Résultats validés
            </Link>
            <Link href="/admin/evaluation/progression" className={quickLinkClass}>
              Progression
            </Link>
            <Link href="/admin/evaluation/v2" className={quickLinkClass}>
              Évaluation v2
            </Link>
            <Link href="/admin/evaluation/v2/pilotage" className={quickLinkClass}>
              Pilotage manuel v2
            </Link>
          </div>
        </section>
      </div>

      <section>
        <h2 className="text-xl font-semibold mb-4">File priorisée membres</h2>
        <div className={`${sectionCardClass} overflow-hidden`} style={softCardStyle}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-xs uppercase tracking-[0.12em] text-gray-400">
                  <th className="px-4 py-3">Membre</th>
                  <th className="px-4 py-3">Score final</th>
                  <th className="px-4 py-3">Ecart VIP (16)</th>
                  <th className="px-4 py-3">Risque</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {priorityMembers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-gray-400">
                      Aucun membre à prioriser pour cette période.
                    </td>
                  </tr>
                ) : (
                  priorityMembers.map((member) => (
                    <tr key={member.twitchLogin} className="border-b border-white/5 hover:bg-white/5">
                      <td className="px-4 py-3 font-medium text-gray-100">{member.twitchLogin}</td>
                      <td className="px-4 py-3">{member.finalScore.toFixed(2)}</td>
                      <td className="px-4 py-3">{member.gap.toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full border px-2 py-0.5 text-xs ${
                            member.risk === "critique"
                              ? "border-rose-400/40 bg-rose-500/15 text-rose-200"
                              : member.risk === "elevé"
                                ? "border-amber-400/40 bg-amber-500/15 text-amber-200"
                                : member.risk === "modéré"
                                  ? "border-blue-400/40 bg-blue-500/15 text-blue-200"
                                  : "border-emerald-400/40 bg-emerald-500/15 text-emerald-200"
                          }`}
                        >
                          {member.risk}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href="/admin/evaluation/d?preset=surveiller"
                          className="rounded-lg border border-white/15 px-2.5 py-1.5 text-xs hover:border-[#d4af37]"
                        >
                          Ouvrir suivi
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section>
        <div className="rounded-2xl border border-[#2b2b36] p-5" style={softCardStyle}>
          <div className="mb-3 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-indigo-300" />
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-300">Parcours rapide</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 text-sm">
            <Link href="/admin/evaluation/a" className="rounded-lg border border-indigo-300/25 px-3 py-2 text-indigo-100 hover:border-indigo-200/45 transition-colors">
              A. Présence active
            </Link>
            <Link href="/admin/evaluation/b" className="rounded-lg border border-indigo-300/25 px-3 py-2 text-indigo-100 hover:border-indigo-200/45 transition-colors">
              B. Engagement communautaire
            </Link>
            <Link href="/admin/evaluation/c" className="rounded-lg border border-indigo-300/25 px-3 py-2 text-indigo-100 hover:border-indigo-200/45 transition-colors">
              C. Follow
            </Link>
            <Link href="/admin/evaluation/d" className="rounded-lg border border-indigo-300/25 px-3 py-2 text-indigo-100 hover:border-indigo-200/45 transition-colors">
              Synthèse mensuelle
            </Link>
            <Link href="/admin/evaluation/result" className="rounded-lg border border-indigo-300/25 px-3 py-2 text-indigo-100 hover:border-indigo-200/45 transition-colors">
              Résultats validés
            </Link>
            <Link href="/admin/evaluation/progression" className="rounded-lg border border-indigo-300/25 px-3 py-2 text-indigo-100 hover:border-indigo-200/45 transition-colors">
              Progression détaillée
            </Link>
            <Link href="/admin/evaluation/v2" className="rounded-lg border border-indigo-300/25 px-3 py-2 text-indigo-100 hover:border-indigo-200/45 transition-colors">
              Évaluation v2
            </Link>
            <Link href="/admin/evaluation/v2/pilotage" className="rounded-lg border border-indigo-300/25 px-3 py-2 text-indigo-100 hover:border-indigo-200/45 transition-colors">
              Pilotage manuel v2
            </Link>
          </div>
        </div>
      </section>

      {loadingData ? (
        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-300">
          Chargement des indicateurs d'évaluation...
        </div>
      ) : null}

      {resultRows.length === 0 && !loadingData ? (
        <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          Aucun résultat trouvé pour {formatMonthKey(selectedMonth)}. Vérifie la synthèse mensuelle.
        </div>
      ) : null}
    </div>
  );
}


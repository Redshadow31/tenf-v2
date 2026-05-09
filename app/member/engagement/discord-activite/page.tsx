"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  CalendarDays,
  ChevronDown,
  Flame,
  HelpCircle,
  Heart,
  MessageSquare,
  Mic,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import MemberSurface from "@/components/member/ui/MemberSurface";
import MemberBreadcrumbs from "@/components/member/ui/MemberBreadcrumbs";
import { formatVocalDurationFr } from "@/lib/discordActivityVocal";

type MonthRow = {
  month: string;
  messages: number;
  vocalMinutes: number;
  vocalDisplay: string;
  vocalHoursDecimal: number;
};

type SortMode = "recent" | "activity";

function formatMonthLabel(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  if (!y || !m) return ym;
  const d = new Date(y, m - 1, 1);
  return d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
}

function formatMonthShort(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  if (!y || !m) return ym;
  const d = new Date(y, m - 1, 1);
  return d.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
}

export default function MemberDiscordActivitePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string>("");
  const [twitchLogin, setTwitchLogin] = useState<string>("");
  const [months, setMonths] = useState<MonthRow[]>([]);
  const [onlyActiveMonths, setOnlyActiveMonths] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>("recent");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/members/me/discord-activity", {
        cache: "no-store",
        credentials: "include",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof json.error === "string" ? json.error : "Chargement impossible");
      }
      setDisplayName(typeof json.displayName === "string" ? json.displayName : "");
      setTwitchLogin(typeof json.twitchLogin === "string" ? json.twitchLogin : "");
      setMonths(Array.isArray(json.months) ? json.months : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
      setMonths([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const hasAnyActivity = months.some((m) => m.messages > 0 || m.vocalMinutes > 0);

  const filteredMonths = useMemo(() => {
    let list = onlyActiveMonths ? months.filter((m) => m.messages > 0 || m.vocalMinutes > 0) : [...months];
    if (sortMode === "recent") {
      list.sort((a, b) => b.month.localeCompare(a.month));
    } else {
      list.sort((a, b) => {
        const score = (x: MonthRow) => x.messages + x.vocalMinutes / 30;
        return score(b) - score(a) || b.month.localeCompare(a.month);
      });
    }
    return list;
  }, [months, onlyActiveMonths, sortMode]);

  const timelineAscending = useMemo(() => {
    const base = onlyActiveMonths ? months.filter((m) => m.messages > 0 || m.vocalMinutes > 0) : [...months];
    return base.sort((a, b) => a.month.localeCompare(b.month));
  }, [months, onlyActiveMonths]);

  const totals = useMemo(() => {
    const totalMessages = months.reduce((s, m) => s + m.messages, 0);
    const totalVocalMinutes = months.reduce((s, m) => s + m.vocalMinutes, 0);
    const activeMonthCount = months.filter((m) => m.messages > 0 || m.vocalMinutes > 0).length;
    const best = months.reduce<{ row: MonthRow | null; score: number }>(
      (acc, m) => {
        const score = m.messages + m.vocalMinutes / 45;
        if (score > acc.score) return { row: m, score };
        return acc;
      },
      { row: null, score: 0 }
    );
    return {
      totalMessages,
      totalVocalMinutes,
      totalVocalHours: Math.round((totalVocalMinutes / 60) * 10) / 10,
      activeMonthCount,
      bestMonth: best.row && best.score > 0 ? best.row : null,
    };
  }, [months]);

  const maxMessages = useMemo(() => Math.max(1, ...months.map((m) => m.messages)), [months]);
  const maxVocalMinutes = useMemo(() => Math.max(1, ...months.map((m) => m.vocalMinutes)), [months]);

  const chartMessagesData = useMemo(
    () =>
      timelineAscending.map((m) => ({
        label: formatMonthShort(m.month),
        full: formatMonthLabel(m.month),
        messages: m.messages,
      })),
    [timelineAscending]
  );

  const chartVocalData = useMemo(
    () =>
      timelineAscending.map((m) => ({
        label: formatMonthShort(m.month),
        full: formatMonthLabel(m.month),
        hours: Math.round((m.vocalMinutes / 60) * 10) / 10,
        vocalMinutes: m.vocalMinutes,
      })),
    [timelineAscending]
  );

  const discordMuted = "rgba(148,163,184,0.35)";
  const msgFill = "#5865F2";
  const vocalFill = "#a78bfa";

  return (
    <MemberSurface>
      {/* En-tête fort : titre imposant + accroche + aperçu chiffres */}
      <header
        className="relative overflow-hidden rounded-2xl border-2 p-6 shadow-[0_24px_80px_-24px_rgba(88,101,242,0.35)] md:p-8 lg:p-10"
        style={{
          borderColor: "rgba(88,101,242,0.45)",
          background:
            "linear-gradient(145deg, rgba(22,20,38,0.98) 0%, rgba(28,32,62,0.96) 42%, rgba(14,16,28,0.99) 100%)",
        }}
      >
        <div
          className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full blur-3xl"
          style={{ backgroundColor: "rgba(88,101,242,0.32)" }}
        />
        <div
          className="pointer-events-none absolute -bottom-28 -right-20 h-72 w-72 rounded-full blur-3xl"
          style={{ backgroundColor: "rgba(212,175,55,0.14)" }}
        />
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent"
          aria-hidden
        />

        <div className="relative">
          <MemberBreadcrumbs />

          <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(260px,340px)] lg:items-start lg:gap-10">
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-[#5865F2]/45 bg-[#5865F2]/18 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#dbe0ff]">
                  <Sparkles className="h-3.5 w-3.5 shrink-0 text-[#b4b9ff]" aria-hidden />
                  Engagement TENF
                </span>
                <span
                  className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold"
                  style={{
                    borderColor: "rgba(145, 70, 255, 0.5)",
                    color: "#e9d5ff",
                    backgroundColor: "rgba(145, 70, 255, 0.14)",
                  }}
                >
                  <Users className="h-3.5 w-3.5 opacity-90" aria-hidden />
                  Communauté
                </span>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 md:text-sm">
                  Serveur Discord · même source que les bilans staff
                </p>
                <h1 className="text-[clamp(1.85rem,5vw,3.25rem)] font-black leading-[1.08] tracking-tight text-white md:leading-[1.06]">
                  Mon activité{" "}
                  <span className="bg-gradient-to-r from-[#b4b9ff] via-[#5865F2] to-[#a78bfa] bg-clip-text text-transparent">
                    Discord
                  </span>
                </h1>
                <p className="max-w-2xl pt-3 text-base font-medium leading-relaxed text-gray-300 md:text-lg md:leading-relaxed">
                  Retrouve{" "}
                  <strong className="font-semibold text-white">ta présence réelle</strong> sur le Discord TENF — salons
                  écrits et vocal — mois par mois. Les données viennent des imports mensuels de l&apos;équipe : une vision
                  commune pour tout le monde.
                </p>
                <p className="flex max-w-2xl items-start gap-2 pt-2 text-sm leading-relaxed text-gray-500">
                  <Heart className="mt-0.5 h-4 w-4 shrink-0 text-rose-400/80" aria-hidden />
                  <span>
                    Pas une course aux performances : un <strong className="font-medium text-gray-400">souvenir lisible</strong>{" "}
                    de tes échanges et des moments passés avec la communauté.
                  </span>
                </p>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <span className="inline-flex items-center gap-2 rounded-xl border border-[#5865F2]/35 bg-black/30 px-4 py-2.5 text-sm font-semibold text-gray-100 shadow-inner shadow-black/20 transition hover:border-[#5865F2]/55 hover:bg-[#5865F2]/10">
                  <MessageSquare className="h-4 w-4 text-[#5865F2]" aria-hidden />
                  Messages &amp; salons écrits
                </span>
                <span className="inline-flex items-center gap-2 rounded-xl border border-violet-500/35 bg-black/30 px-4 py-2.5 text-sm font-semibold text-gray-100 shadow-inner shadow-black/20 transition hover:border-violet-400/45 hover:bg-violet-500/10">
                  <Mic className="h-4 w-4 text-violet-300" aria-hidden />
                  Temps vocal cumulé
                </span>
              </div>
            </div>

            <aside className="flex flex-col gap-4">
              {(displayName || twitchLogin) && (
                <div
                  className="rounded-2xl border border-white/15 bg-black/35 p-4 backdrop-blur-md"
                  style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)" }}
                >
                  <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-500">
                    Profil rattaché à ces stats
                  </span>
                  <p className="mt-1.5 truncate text-lg font-bold text-white">{displayName || twitchLogin}</p>
                  {twitchLogin && displayName !== twitchLogin ? (
                    <p className="truncate text-sm text-[#94a3b8]">@{twitchLogin}</p>
                  ) : null}
                </div>
              )}

              <div className="rounded-2xl border border-white/12 bg-gradient-to-br from-black/40 to-black/25 p-4 backdrop-blur-sm">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500">Aperçu rapide</p>
                {loading ? (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-16 animate-pulse rounded-xl bg-white/[0.06]" />
                    ))}
                  </div>
                ) : error ? (
                  <p className="mt-3 text-sm text-amber-200/90">Les chiffres s&apos;afficheront dès que les données seront accessibles.</p>
                ) : (
                  <dl className="mt-3 grid grid-cols-2 gap-2 text-center">
                    <div className="rounded-xl border border-white/[0.07] bg-white/[0.04] px-2 py-3">
                      <dt className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">Messages</dt>
                      <dd className="mt-1 text-lg font-black tabular-nums text-white">
                        {totals.totalMessages.toLocaleString("fr-FR")}
                      </dd>
                    </div>
                    <div className="rounded-xl border border-white/[0.07] bg-white/[0.04] px-2 py-3">
                      <dt className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">Vocal</dt>
                      <dd className="mt-1 text-lg font-black tabular-nums text-violet-200">{totals.totalVocalHours} h</dd>
                    </div>
                    <div className="rounded-xl border border-white/[0.07] bg-white/[0.04] px-2 py-3">
                      <dt className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">Mois actifs</dt>
                      <dd className="mt-1 text-lg font-black tabular-nums text-emerald-200">{totals.activeMonthCount}</dd>
                    </div>
                    <div className="rounded-xl border border-white/[0.07] bg-white/[0.04] px-2 py-3">
                      <dt className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">Historique</dt>
                      <dd className="mt-1 text-lg font-black tabular-nums text-gray-200">{months.length}</dd>
                    </div>
                  </dl>
                )}
              </div>
            </aside>
          </div>
        </div>
      </header>

      {/* Corps principal */}
      <section
        className="relative overflow-hidden rounded-2xl border p-6 md:p-8"
        style={{
          borderColor: "rgba(88,101,242,0.22)",
          background: "linear-gradient(132deg, rgba(18,17,30,0.98) 0%, rgba(28,32,58,0.92) 100%)",
        }}
      >
        <div
          className="pointer-events-none absolute -left-16 top-4 h-40 w-40 rounded-full blur-3xl"
          style={{ backgroundColor: "rgba(88,101,242,0.18)" }}
        />

        <div className="relative space-y-8">
          {loading ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-24 rounded-xl bg-white/5" />
              <div className="h-48 rounded-xl bg-white/5" />
              <div className="h-40 rounded-xl bg-white/5" />
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
              <p className="font-semibold">Impossible de charger tes données</p>
              <p className="mt-1 text-red-200/80">{error}</p>
              <button
                type="button"
                onClick={() => void load()}
                className="mt-3 rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/15"
              >
                Réessayer
              </button>
            </div>
          ) : months.length === 0 ? (
            <EmptyNoData />
          ) : !hasAnyActivity ? (
            <EmptyNoMatch />
          ) : (
            <>
              {/* KPIs */}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  icon={<MessageSquare className="h-5 w-5 text-[#5865F2]" aria-hidden />}
                  label="Messages (tous les mois)"
                  value={totals.totalMessages.toLocaleString("fr-FR")}
                />
                <StatCard
                  icon={<Mic className="h-5 w-5 text-violet-300" aria-hidden />}
                  label="Temps vocal cumulé"
                  value={`${totals.totalVocalHours} h`}
                  hint={`${Math.floor(totals.totalVocalMinutes / 60)} h ${totals.totalVocalMinutes % 60} min`}
                />
                <StatCard
                  icon={<CalendarDays className="h-5 w-5 text-emerald-300/90" aria-hidden />}
                  label="Mois avec activité"
                  value={`${totals.activeMonthCount}`}
                  hint={`sur ${months.length} mois en base`}
                />
                <StatCard
                  icon={<Flame className="h-5 w-5 text-amber-300" aria-hidden />}
                  label="Mois le plus dense"
                  value={totals.bestMonth ? formatMonthShort(totals.bestMonth.month) : "—"}
                  hint={
                    totals.bestMonth
                      ? `${totals.bestMonth.messages.toLocaleString("fr-FR")} msg · ${formatVocalDurationFr(totals.bestMonth.vocalMinutes)}`
                      : undefined
                  }
                />
              </div>

              {/* Contrôles */}
              <div className="flex flex-col gap-4 rounded-xl border border-white/10 bg-black/20 p-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                <div className="flex flex-wrap gap-2">
                  <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <TrendingUp className="h-3.5 w-3.5" aria-hidden />
                    Tri
                  </span>
                  <button
                    type="button"
                    onClick={() => setSortMode("recent")}
                    className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                      sortMode === "recent"
                        ? "bg-[#5865F2] text-white shadow-lg shadow-[#5865F2]/25"
                        : "bg-white/[0.06] text-gray-300 hover:bg-white/10"
                    }`}
                  >
                    Plus récent
                  </button>
                  <button
                    type="button"
                    onClick={() => setSortMode("activity")}
                    className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                      sortMode === "activity"
                        ? "bg-[#5865F2] text-white shadow-lg shadow-[#5865F2]/25"
                        : "bg-white/[0.06] text-gray-300 hover:bg-white/10"
                    }`}
                  >
                    Plus d&apos;activité
                  </button>
                </div>
                <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-300">
                  <input
                    type="checkbox"
                    checked={onlyActiveMonths}
                    onChange={(e) => setOnlyActiveMonths(e.target.checked)}
                    className="rounded border-gray-600 bg-[#0f1118] text-[#5865F2] focus:ring-[#5865F2]/50"
                  />
                  Masquer les mois sans activité
                </label>
              </div>

              {/* Graphiques */}
              <div className="grid gap-6 lg:grid-cols-2">
                <ChartCard title="Messages par mois" subtitle="Sur la période affichée dans les graphiques (filtre ci-dessus appliqué).">
                  {chartMessagesData.length === 0 ? (
                    <p className="py-12 text-center text-sm text-gray-500">Pas assez de données pour ce filtre.</p>
                  ) : (
                    <div className="h-[240px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartMessagesData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                          <XAxis dataKey="label" stroke={discordMuted} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                          <YAxis stroke={discordMuted} tick={{ fill: "#94a3b8", fontSize: 11 }} width={36} />
                          <Tooltip
                            cursor={{ fill: "rgba(255,255,255,0.04)" }}
                            content={({ active, payload }) => {
                              if (!active || !payload?.[0]) return null;
                              const p = payload[0].payload as { full: string; messages: number };
                              return (
                                <div className="rounded-lg border border-white/10 bg-[#1e293b] px-3 py-2 text-xs shadow-xl">
                                  <p className="font-semibold capitalize text-white">{p.full}</p>
                                  <p className="tabular-nums text-[#a5b4fc]">{p.messages.toLocaleString("fr-FR")} messages</p>
                                </div>
                              );
                            }}
                          />
                          <Bar dataKey="messages" radius={[6, 6, 0, 0]} maxBarSize={48}>
                            {chartMessagesData.map((_, i) => (
                              <Cell key={i} fill={msgFill} opacity={0.85 + (i % 3) * 0.05} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </ChartCard>

                <ChartCard title="Temps vocal par mois" subtitle="En heures (arrondi à une décimale).">
                  {chartVocalData.length === 0 ? (
                    <p className="py-12 text-center text-sm text-gray-500">Pas assez de données pour ce filtre.</p>
                  ) : (
                    <div className="h-[240px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartVocalData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                          <XAxis dataKey="label" stroke={discordMuted} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                          <YAxis
                            stroke={discordMuted}
                            tick={{ fill: "#94a3b8", fontSize: 11 }}
                            width={36}
                            tickFormatter={(v) => `${v}h`}
                          />
                          <Tooltip
                            cursor={{ fill: "rgba(255,255,255,0.04)" }}
                            content={({ active, payload }) => {
                              if (!active || !payload?.[0]) return null;
                              const p = payload[0].payload as { full: string; hours: number; vocalMinutes: number };
                              return (
                                <div className="rounded-lg border border-white/10 bg-[#1e293b] px-3 py-2 text-xs shadow-xl">
                                  <p className="font-semibold capitalize text-white">{p.full}</p>
                                  <p className="text-violet-200">{formatVocalDurationFr(p.vocalMinutes)}</p>
                                </div>
                              );
                            }}
                          />
                          <Bar dataKey="hours" radius={[6, 6, 0, 0]} maxBarSize={48}>
                            {chartVocalData.map((_, i) => (
                              <Cell key={i} fill={vocalFill} opacity={0.85 + (i % 3) * 0.05} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </ChartCard>
              </div>

              {/* Liste détaillée */}
              <div>
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-violet-300" aria-hidden />
                  <h3 className="text-sm font-semibold text-white">Détail mois par mois</h3>
                  <span className="text-xs text-gray-500">({filteredMonths.length} ligne{filteredMonths.length > 1 ? "s" : ""})</span>
                </div>

                {/* Cartes mobile-first */}
                <div className="grid gap-3 md:hidden">
                  {filteredMonths.map((row) => (
                    <MonthCard
                      key={row.month}
                      row={row}
                      maxMessages={maxMessages}
                      maxVocalMinutes={maxVocalMinutes}
                    />
                  ))}
                </div>

                {/* Tableau desktop */}
                <div className="hidden overflow-x-auto rounded-xl border border-white/10 bg-black/20 md:block">
                  <table className="w-full min-w-[520px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-gray-400">
                        <th className="px-4 py-3 font-medium">Mois</th>
                        <th className="px-4 py-3 font-medium">
                          <span className="inline-flex items-center gap-1.5">
                            <MessageSquare className="h-3.5 w-3.5 text-[#5865F2]" aria-hidden />
                            Messages
                          </span>
                        </th>
                        <th className="hidden lg:table-cell lg:w-[28%] px-4 py-3 font-medium">Relatif</th>
                        <th className="px-4 py-3 font-medium">
                          <span className="inline-flex items-center gap-1.5">
                            <Mic className="h-3.5 w-3.5 text-violet-300" aria-hidden />
                            Vocal
                          </span>
                        </th>
                        <th className="hidden lg:table-cell lg:w-[28%] px-4 py-3 font-medium">Relatif</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredMonths.map((row) => {
                        const inactive = row.messages === 0 && row.vocalMinutes === 0;
                        return (
                          <tr
                            key={row.month}
                            className={`transition hover:bg-white/[0.03] ${inactive ? "opacity-55" : ""}`}
                            style={{ color: "var(--color-text)" }}
                          >
                            <td className="px-4 py-3 font-medium capitalize">{formatMonthLabel(row.month)}</td>
                            <td className="px-4 py-3 tabular-nums text-gray-200">
                              {row.messages.toLocaleString("fr-FR")}
                            </td>
                            <td className="hidden lg:table-cell px-4 py-3">
                              <div className="h-2 overflow-hidden rounded-full bg-gray-800">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-[#5865F2] to-indigo-400"
                                  style={{ width: `${(row.messages / maxMessages) * 100}%` }}
                                />
                              </div>
                            </td>
                            <td className="px-4 py-3 text-gray-200">{formatVocalDurationFr(row.vocalMinutes)}</td>
                            <td className="hidden lg:table-cell px-4 py-3">
                              <div className="h-2 overflow-hidden rounded-full bg-gray-800">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-400"
                                  style={{ width: `${(row.vocalMinutes / maxVocalMinutes) * 100}%` }}
                                />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          <details className="group rounded-xl border border-white/[0.08] bg-black/15">
            <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-medium text-gray-300 [&::-webkit-details-marker]:hidden">
              <HelpCircle className="h-4 w-4 shrink-0 text-[#f4db97]" aria-hidden />
              Comprendre ces chiffres
              <ChevronDown className="ml-auto h-4 w-4 text-gray-500 transition group-open:rotate-180" aria-hidden />
            </summary>
            <div className="space-y-2 border-t border-white/[0.06] px-4 py-3 text-sm leading-relaxed text-gray-400">
              <p>
                TENF importe des classements Discord préparés par le staff : ce que tu vois est donc aligné avec les
                bilans internes, pas une capture en direct de l&apos;application Discord.
              </p>
              <p>
                Si un mois est à zéro alors que tu étais très présent·e, vérifie que ton{" "}
                <strong className="text-gray-200">pseudo Twitch</strong> sur ta fiche membre correspond bien aux exports
                (ou que ton Discord est relié au même profil).
              </p>
              <p className="text-xs text-gray-500">
                Temps vocal : durée cumulée sur le mois, affichée en heures et minutes (ex.{" "}
                <span className="text-gray-400">5 h 30 min</span>).
              </p>
            </div>
          </details>
        </div>
      </section>
    </MemberSurface>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div
      className="rounded-xl border border-white/10 bg-black/25 p-4 backdrop-blur-sm"
      style={{ borderColor: "rgba(255,255,255,0.1)" }}
    >
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-white/[0.06] p-2">{icon}</div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{label}</p>
          <p className="mt-1 truncate text-xl font-bold tabular-nums text-white">{value}</p>
          {hint ? <p className="mt-0.5 text-xs text-gray-500">{hint}</p> : null}
        </div>
      </div>
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-4">
      <div className="mb-2">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        {subtitle ? <p className="mt-1 text-xs text-gray-500">{subtitle}</p> : null}
      </div>
      {children}
    </div>
  );
}

function MonthCard({
  row,
  maxMessages,
  maxVocalMinutes,
}: {
  row: MonthRow;
  maxMessages: number;
  maxVocalMinutes: number;
}) {
  const inactive = row.messages === 0 && row.vocalMinutes === 0;
  return (
    <div
      className={`rounded-xl border border-white/10 bg-black/25 p-4 ${inactive ? "opacity-60" : ""}`}
      style={{ borderColor: "rgba(255,255,255,0.08)" }}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Mois</p>
      <p className="text-base font-bold capitalize text-white">{formatMonthLabel(row.month)}</p>
      <div className="mt-3 space-y-3">
        <div>
          <div className="flex justify-between text-xs text-gray-400">
            <span className="inline-flex items-center gap-1">
              <MessageSquare className="h-3 w-3 text-[#5865F2]" aria-hidden />
              Messages
            </span>
            <span className="tabular-nums text-gray-200">{row.messages.toLocaleString("fr-FR")}</span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-800">
            <div
              className="h-full rounded-full bg-[#5865F2]"
              style={{ width: `${(row.messages / maxMessages) * 100}%` }}
            />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-xs text-gray-400">
            <span className="inline-flex items-center gap-1">
              <Mic className="h-3 w-3 text-violet-300" aria-hidden />
              Vocal
            </span>
            <span className="text-gray-200">{formatVocalDurationFr(row.vocalMinutes)}</span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-800">
            <div
              className="h-full rounded-full bg-violet-500"
              style={{ width: `${(row.vocalMinutes / maxVocalMinutes) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyNoData() {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-8 text-center">
      <CalendarDays className="mx-auto h-12 w-12 text-[#5865F2]/80" aria-hidden />
      <p className="mt-4 text-base font-semibold text-white">Pas encore de données</p>
      <p className="mx-auto mt-2 max-w-md text-sm" style={{ color: "var(--color-text-secondary)" }}>
        Dès que l&apos;équipe aura importé les exports Discord du serveur TENF, ton historique messages et vocal
        apparaîtra ici automatiquement.
      </p>
    </div>
  );
}

function EmptyNoMatch() {
  return (
    <div className="rounded-xl border border-amber-500/25 bg-amber-500/[0.07] p-8 text-center">
      <MessageSquare className="mx-auto h-12 w-12 text-amber-200/80" aria-hidden />
      <p className="mt-4 text-base font-semibold text-amber-100">On te cherche dans les fichiers…</p>
      <p className="mx-auto mt-2 max-w-lg text-sm text-amber-100/80">
        Des mois sont bien enregistrés côté TENF, mais aucune ligne ne correspond encore à ton profil dans ces imports.
        Vérifie que ton <strong className="text-white">pseudo Twitch</strong> est identique à celui des classements, ou
        que ton compte Discord est bien relié à ta fiche membre.
      </p>
    </div>
  );
}

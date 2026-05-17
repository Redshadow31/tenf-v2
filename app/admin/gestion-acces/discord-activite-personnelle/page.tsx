"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  CalendarRange,
  ChevronDown,
  ExternalLink,
  Hash,
  HelpCircle,
  MessageSquare,
  Mic,
  Search,
  Sparkles,
  Trash2,
  TrendingUp,
  Upload,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminConfirmModal from "@/components/admin/AdminConfirmModal";
import { administrationSiteHubNav } from "@/lib/admin/gestionAccesNav";
import DiscordMessagesImportModal from "@/components/admin/DiscordMessagesImportModal";
import DiscordVocalsImportModal from "@/components/admin/DiscordVocalsImportModal";
import {
  DISCORD_ACTIVITY_COMMUNITY_LOGIN,
  formatDiscordActivityMemberLabel,
} from "@/lib/discordActivityCommunityAggregate";

type TabId = "ecrit" | "vocal";
type ScopeMode = "month" | "period" | "all";

function currentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function enumerateMonthsInclusive(start: string, end: string): string[] {
  if (!/^\d{4}-\d{2}$/.test(start) || !/^\d{4}-\d{2}$/.test(end)) return [];
  const [ys, ms] = start.split("-").map(Number);
  const [ye, me] = end.split("-").map(Number);
  let y = ys;
  let m = ms;
  const out: string[] = [];
  while (y < ye || (y === ye && m <= me)) {
    out.push(`${y}-${String(m).padStart(2, "0")}`);
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  return out;
}

type VocalEntry = { hoursDecimal: number; totalMinutes: number; display: string };

function vocalDisplayFromMinutes(totalMinutes: number): string {
  const hh = Math.floor(totalMinutes / 60);
  const mm = totalMinutes % 60;
  return `${hh}h${mm.toString().padStart(2, "0")}`;
}

function mergeMessagesMaps(maps: Array<Record<string, number>>): Record<string, number> {
  const acc: Record<string, number> = {};
  for (const m of maps) {
    for (const [login, count] of Object.entries(m)) {
      acc[login] = (acc[login] || 0) + (typeof count === "number" ? count : 0);
    }
  }
  return acc;
}

function mergeVocalsMaps(maps: Array<Record<string, VocalEntry>>): Record<string, VocalEntry> {
  const minutesAcc: Record<string, number> = {};
  for (const m of maps) {
    for (const [login, v] of Object.entries(m)) {
      const add = typeof v?.totalMinutes === "number" ? v.totalMinutes : Math.round((v?.hoursDecimal || 0) * 60);
      minutesAcc[login] = (minutesAcc[login] || 0) + add;
    }
  }
  const out: Record<string, VocalEntry> = {};
  for (const [login, totalMinutes] of Object.entries(minutesAcc)) {
    const hoursDecimal = totalMinutes / 60;
    out[login] = {
      hoursDecimal,
      totalMinutes,
      display: vocalDisplayFromMinutes(totalMinutes),
    };
  }
  return out;
}

/** Lien gestion membres : recherche + préremplissage création (fondateurs). */
function gestionMemberCreationHref(pseudo: string): string {
  if (pseudo === DISCORD_ACTIVITY_COMMUNITY_LOGIN) {
    return "/admin/membres/gestion";
  }
  const enc = encodeURIComponent(pseudo);
  const twitchLike = /^[a-z0-9_]{2,25}$/i.test(pseudo);
  if (twitchLike) {
    return `/admin/membres/gestion?search=${enc}&addTwitch=${enc}`;
  }
  return `/admin/membres/gestion?search=${enc}&addDiscord=${enc}`;
}

type MessageRowModel = {
  login: string;
  messages: number;
  onlyInImport: boolean;
  isCommunityAggregate?: boolean;
};

type VocalRowModel = {
  login: string;
  vocal: VocalEntry;
  onlyInImport: boolean;
  isCommunityAggregate?: boolean;
};

function buildMessagesTableModel(
  messagesByUser: Record<string, number>,
  siteLogins: string[]
): { rows: MessageRowModel[]; communityBreakdown: Array<{ pseudo: string; messages: number }> } {
  const siteSet = new Set(siteLogins);
  let communityTotal = 0;
  const communityBreakdown: Array<{ pseudo: string; messages: number }> = [];

  for (const [login, count] of Object.entries(messagesByUser)) {
    if (siteSet.has(login)) continue;
    const v = typeof count === "number" ? count : 0;
    communityTotal += v;
    communityBreakdown.push({ pseudo: login, messages: v });
  }
  communityBreakdown.sort((a, b) => b.messages - a.messages || a.pseudo.localeCompare(b.pseudo));

  const rows: MessageRowModel[] = siteLogins.map((login) => ({
    login,
    messages: messagesByUser[login] ?? 0,
    onlyInImport: false,
  }));

  if (communityTotal > 0) {
    rows.push({
      login: DISCORD_ACTIVITY_COMMUNITY_LOGIN,
      messages: communityTotal,
      onlyInImport: false,
      isCommunityAggregate: true,
    });
  }

  rows.sort((a, b) => b.messages - a.messages || a.login.localeCompare(b.login));
  return { rows, communityBreakdown };
}

function buildVocalsTableModel(
  vocalsByUser: Record<string, VocalEntry>,
  siteLogins: string[]
): { rows: VocalRowModel[]; communityBreakdown: Array<{ pseudo: string; vocal: VocalEntry }> } {
  const siteSet = new Set(siteLogins);
  let communityMinutes = 0;
  const breakdownParts: Array<{ pseudo: string; minutes: number }> = [];

  for (const [login, v] of Object.entries(vocalsByUser)) {
    if (siteSet.has(login)) continue;
    const mins = typeof v?.totalMinutes === "number" ? v.totalMinutes : Math.round((v?.hoursDecimal || 0) * 60);
    communityMinutes += mins;
    breakdownParts.push({ pseudo: login, minutes: mins });
  }

  breakdownParts.sort((a, b) => b.minutes - a.minutes || a.pseudo.localeCompare(b.pseudo));
  const communityBreakdown = breakdownParts.map(({ pseudo, minutes }) => ({
    pseudo,
    vocal: {
      hoursDecimal: minutes / 60,
      totalMinutes: minutes,
      display: vocalDisplayFromMinutes(minutes),
    },
  }));

  const zeroVocal: VocalEntry = { hoursDecimal: 0, totalMinutes: 0, display: "0h00" };
  const rows: VocalRowModel[] = siteLogins.map((login) => ({
    login,
    vocal: vocalsByUser[login] ?? zeroVocal,
    onlyInImport: false,
  }));

  if (communityMinutes > 0) {
    rows.push({
      login: DISCORD_ACTIVITY_COMMUNITY_LOGIN,
      vocal: {
        hoursDecimal: communityMinutes / 60,
        totalMinutes: communityMinutes,
        display: vocalDisplayFromMinutes(communityMinutes),
      },
      onlyInImport: false,
      isCommunityAggregate: true,
    });
  }

  rows.sort((a, b) => b.vocal.totalMinutes - a.vocal.totalMinutes || a.login.localeCompare(b.login));
  return { rows, communityBreakdown };
}

const CHART_ACCENT = "#a78bfa";
const CHART_MUTED = "rgba(148,163,184,0.35)";

function discordActivityRowMatchesSearch(login: string, q: string): boolean {
  if (!q) return true;
  const norm = q.toLowerCase();
  return login.includes(norm) || formatDiscordActivityMemberLabel(login).toLowerCase().includes(norm);
}

function PodiumCard({
  rank,
  login,
  value,
  valueLabel,
}: {
  rank: 1 | 2 | 3;
  login: string;
  value: string;
  valueLabel: string;
}) {
  const ring =
    rank === 1
      ? "from-amber-400/30 via-amber-300/10 to-transparent ring-amber-400/40"
      : rank === 2
        ? "from-slate-300/25 via-slate-400/10 to-transparent ring-slate-400/35"
        : "from-amber-700/30 via-amber-800/10 to-transparent ring-amber-800/40";
  const order =
    rank === 1
      ? "order-first md:order-2 md:scale-[1.04]"
      : rank === 2
        ? "order-2 md:order-1"
        : "order-3 md:order-3";
  const h = rank === 1 ? "min-h-[132px]" : "min-h-[112px]";

  return (
    <div
      className={`relative flex flex-1 flex-col justify-end rounded-2xl border border-white/10 bg-gradient-to-b p-4 shadow-lg ring-1 ${ring} ${order} ${h}`}
    >
      <div className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/30 text-lg font-black tabular-nums text-white/90">
        {rank}
      </div>
      <p
        className="truncate pr-10 font-semibold text-white"
        title={formatDiscordActivityMemberLabel(login)}
      >
        {formatDiscordActivityMemberLabel(login)}
      </p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-[#f4db97]">{value}</p>
      <p className="text-[11px] uppercase tracking-wide text-gray-400">{valueLabel}</p>
    </div>
  );
}

export default function DiscordActivitePersonnellePage() {
  const [activeTab, setActiveTab] = useState<TabId>("ecrit");
  const [scopeMode, setScopeMode] = useState<ScopeMode>("month");
  const [singleMonth, setSingleMonth] = useState(currentMonthKey);
  const [periodStart, setPeriodStart] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 2);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [periodEnd, setPeriodEnd] = useState(currentMonthKey);
  const [storedMonths, setStoredMonths] = useState<string[]>([]);
  const [importMonth, setImportMonth] = useState(currentMonthKey);
  const [showMessagesImport, setShowMessagesImport] = useState(false);
  const [showVocalsImport, setShowVocalsImport] = useState(false);
  const [importing, setImporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [deleteMonthScope, setDeleteMonthScope] = useState<"all" | "messages" | "vocals" | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [siteLogins, setSiteLogins] = useState<string[]>([]);
  const [rosterLoading, setRosterLoading] = useState(true);
  const [tableSearch, setTableSearch] = useState("");
  const [onlyWithActivity, setOnlyWithActivity] = useState(false);
  const [aggregated, setAggregated] = useState<{
    monthsLoaded: string[];
    messagesByUser: Record<string, number>;
    vocalsByUser: Record<string, VocalEntry>;
    totalMessages: number;
    totalVoiceHours: number;
  }>({
    monthsLoaded: [],
    messagesByUser: {},
    vocalsByUser: {},
    totalMessages: 0,
    totalVoiceHours: 0,
  });

  const monthsToFetch = useMemo(() => {
    if (scopeMode === "month") return [singleMonth];
    if (scopeMode === "period") return enumerateMonthsInclusive(periodStart, periodEnd);
    return storedMonths;
  }, [scopeMode, singleMonth, periodStart, periodEnd, storedMonths]);

  const loadStoredMonthKeys = useCallback(async () => {
    const res = await fetch("/api/admin/discord-activity/months", { cache: "no-store" });
    if (!res.ok) throw new Error("Impossible de lister les mois enregistrés.");
    const json = await res.json();
    return (json.months || []) as string[];
  }, []);

  const refreshData = useCallback(async () => {
    setLoadError(null);
    setLoading(true);
    try {
      let keys = monthsToFetch;
      if (scopeMode === "all") {
        keys = await loadStoredMonthKeys();
        setStoredMonths(keys);
      }

      if (keys.length === 0) {
        setAggregated({
          monthsLoaded: [],
          messagesByUser: {},
          vocalsByUser: {},
          totalMessages: 0,
          totalVoiceHours: 0,
        });
        return;
      }

      const results = await Promise.all(
        keys.map(async (month) => {
          const res = await fetch(`/api/admin/discord-activity/data?month=${encodeURIComponent(month)}`, {
            cache: "no-store",
          });
          if (!res.ok) return null;
          const json = await res.json();
          const d = json?.data;
          if (!d) return null;
          return {
            month,
            messagesByUser: (d.messagesByUser || {}) as Record<string, number>,
            vocalsByUser: (d.vocalsByUser || {}) as Record<string, VocalEntry>,
          };
        })
      );

      const valid = results.filter(Boolean) as Array<{
        month: string;
        messagesByUser: Record<string, number>;
        vocalsByUser: Record<string, VocalEntry>;
      }>;

      const msgMaps = valid.map((v) => v.messagesByUser);
      const vocMaps = valid.map((v) => v.vocalsByUser);
      const messagesByUser = mergeMessagesMaps(msgMaps);
      const vocalsByUser = mergeVocalsMaps(vocMaps);
      const totalMessages = Object.values(messagesByUser).reduce((s, n) => s + n, 0);
      const totalVoiceHours = Object.values(vocalsByUser).reduce((s, v) => s + (v.hoursDecimal || 0), 0);

      setAggregated({
        monthsLoaded: valid.map((v) => v.month),
        messagesByUser,
        vocalsByUser,
        totalMessages,
        totalVoiceHours,
      });
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Erreur de chargement");
      setAggregated({
        monthsLoaded: [],
        messagesByUser: {},
        vocalsByUser: {},
        totalMessages: 0,
        totalVoiceHours: 0,
      });
    } finally {
      setLoading(false);
    }
  }, [monthsToFetch, scopeMode, loadStoredMonthKeys]);

  useEffect(() => {
    void refreshData();
  }, [refreshData]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setRosterLoading(true);
      try {
        const res = await fetch("/api/admin/members?discordImportLookup=1", { cache: "no-store" });
        if (!res.ok || cancelled) return;
        const json = await res.json();
        const raw = (json.members || []) as Array<{ twitchLogin?: string }>;
        const list = raw
          .map((m) => (m.twitchLogin || "").toLowerCase().trim())
          .filter((login) => login.length > 0);
        const unique = Array.from(new Set(list)).sort((a, b) => a.localeCompare(b));
        if (!cancelled) setSiteLogins(unique);
      } finally {
        if (!cancelled) setRosterLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const { rows: allMessageRows, communityBreakdown: communityMessagesBreakdown } = useMemo(
    () => buildMessagesTableModel(aggregated.messagesByUser, siteLogins),
    [siteLogins, aggregated.messagesByUser]
  );

  const { rows: allVocalRows, communityBreakdown: communityVocalsBreakdown } = useMemo(
    () => buildVocalsTableModel(aggregated.vocalsByUser, siteLogins),
    [siteLogins, aggregated.vocalsByUser]
  );

  const maxMessages = useMemo(
    () => Math.max(1, ...allMessageRows.map((r) => r.messages)),
    [allMessageRows]
  );
  const maxVocalMinutes = useMemo(
    () => Math.max(1, ...allVocalRows.map((r) => r.vocal.totalMinutes)),
    [allVocalRows]
  );

  const filteredMessageRows = useMemo(() => {
    const q = tableSearch.trim().toLowerCase();
    let rows = allMessageRows;
    if (onlyWithActivity) rows = rows.filter((r) => r.messages > 0);
    if (q) rows = rows.filter((r) => discordActivityRowMatchesSearch(r.login, q));
    return rows;
  }, [allMessageRows, tableSearch, onlyWithActivity]);

  const filteredVocalRows = useMemo(() => {
    const q = tableSearch.trim().toLowerCase();
    let rows = allVocalRows;
    if (onlyWithActivity) rows = rows.filter((r) => r.vocal.totalMinutes > 0);
    if (q) rows = rows.filter((r) => discordActivityRowMatchesSearch(r.login, q));
    return rows;
  }, [allVocalRows, tableSearch, onlyWithActivity]);

  const podiumMessages = useMemo(() => {
    const actifs = allMessageRows.filter((r) => r.messages > 0);
    return actifs.slice(0, 3);
  }, [allMessageRows]);

  const podiumVocals = useMemo(() => {
    const actifs = allVocalRows.filter((r) => r.vocal.totalMinutes > 0);
    return actifs.slice(0, 3);
  }, [allVocalRows]);

  const chartMessages = useMemo(() => {
    return allMessageRows
      .filter((r) => r.messages > 0)
      .slice(0, 14)
      .map((r) => {
        const display = formatDiscordActivityMemberLabel(r.login);
        return {
          label: display.length > 12 ? `${display.slice(0, 12)}…` : display,
          full: display,
          value: r.messages,
        };
      });
  }, [allMessageRows]);

  const chartVocals = useMemo(() => {
    return allVocalRows
      .filter((r) => r.vocal.totalMinutes > 0)
      .slice(0, 14)
      .map((r) => {
        const display = formatDiscordActivityMemberLabel(r.login);
        return {
          label: display.length > 12 ? `${display.slice(0, 12)}…` : display,
          full: display,
          value: Math.round((r.vocal.totalMinutes / 60) * 10) / 10,
        };
      });
  }, [allVocalRows]);

  const membersWithMsg = useMemo(() => allMessageRows.filter((r) => r.messages > 0).length, [allMessageRows]);
  const membersWithVoc = useMemo(() => allVocalRows.filter((r) => r.vocal.totalMinutes > 0).length, [allVocalRows]);

  async function handleImportMessages(data: Record<string, number>) {
    setImporting(true);
    setPageError(null);
    try {
      const response = await fetch("/api/admin/discord-activity/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month: importMonth, type: "messages", data }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || "Erreur lors de l'import des messages");
      }
      await refreshData();
      setShowMessagesImport(false);
    } catch (error) {
      console.error(error);
      setPageError(error instanceof Error ? error.message : "Erreur import messages");
    } finally {
      setImporting(false);
    }
  }

  function openDeleteMonthModal(scope: "all" | "messages" | "vocals") {
    setDeleteMonthScope(scope);
  }

  async function executeDeleteMonth() {
    if (!deleteMonthScope) return;
    const month = importMonth;
    const scope = deleteMonthScope;
    setDeleting(true);
    setPageError(null);
    try {
      const res = await fetch(
        `/api/admin/discord-activity/month?month=${encodeURIComponent(month)}&scope=${encodeURIComponent(scope)}`,
        { method: "DELETE" },
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof json.error === "string" ? json.error : "Échec de la suppression");
      }
      await refreshData();
      setDeleteMonthScope(null);
    } catch (e) {
      console.error(e);
      setPageError(e instanceof Error ? e.message : "Erreur lors de la suppression");
    } finally {
      setDeleting(false);
    }
  }

  async function handleImportVocals(data: Record<string, VocalEntry>) {
    setImporting(true);
    setPageError(null);
    try {
      const response = await fetch("/api/admin/discord-activity/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month: importMonth, type: "vocals", data }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || "Erreur lors de l'import des vocaux");
      }
      await refreshData();
      setShowVocalsImport(false);
    } catch (error) {
      console.error(error);
      setPageError(error instanceof Error ? error.message : "Erreur import vocaux");
    } finally {
      setImporting(false);
    }
  }

  const deleteMonthModalDesc = useMemo(() => {
    if (!deleteMonthScope) return null;
    const month = importMonth;
    if (deleteMonthScope === "all") {
      return (
        <>
          Supprimer toutes les données Discord (messages <strong className="text-rose-100">et</strong> vocaux) pour le
          mois <strong className="text-rose-100">{month}</strong> ? Cette action est irréversible.
        </>
      );
    }
    if (deleteMonthScope === "messages") {
      return (
        <>
          Supprimer uniquement les messages pour <strong className="text-amber-100">{month}</strong> ? Les données
          vocales du même mois seront conservées.
        </>
      );
    }
    return (
      <>
        Supprimer uniquement les vocaux pour <strong className="text-amber-100">{month}</strong> ? Les messages du même
        mois seront conservés.
      </>
    );
  }, [deleteMonthScope, importMonth]);

  const scopeSummary =
    scopeMode === "month"
      ? `Mois affiché : ${singleMonth}`
      : scopeMode === "period"
        ? `Période : ${periodStart} → ${periodEnd} (${monthsToFetch.length} mois)`
        : `Tous les mois enregistrés (${aggregated.monthsLoaded.length} mois)`;

  const scopePill = (mode: ScopeMode, label: string) => (
    <button
      type="button"
      onClick={() => setScopeMode(mode)}
      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
        scopeMode === mode
          ? "bg-[#5865F2] text-white shadow-lg shadow-[#5865F2]/25"
          : "bg-white/[0.06] text-gray-300 hover:bg-white/10"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-[#0b0d12] text-white">
      <AdminHeader
        title="Activité Discord — communauté TENF"
        navLinks={administrationSiteHubNav("/admin/gestion-acces/discord-activite-personnelle")}
      />

      <main className="mx-auto max-w-7xl space-y-6 px-4 pb-16 pt-2">
        {pageError ? (
          <div
            role="alert"
            className="flex items-start justify-between gap-3 rounded-xl border border-red-500/40 bg-red-950/35 px-4 py-3 text-sm text-red-100"
          >
            <span className="min-w-0 flex-1 leading-relaxed">{pageError}</span>
            <button
              type="button"
              onClick={() => setPageError(null)}
              className="shrink-0 rounded-lg p-1 text-red-300 transition hover:bg-red-950/60 hover:text-red-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/50"
              aria-label="Fermer le message d’erreur"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>
        ) : null}
        {/* Hero */}
        <section className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-[#151a2a] via-[#10131c] to-[#0b0d12] p-6 shadow-2xl md:p-8">
          <div
            className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[#5865F2]/20 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-[#d4af37]/10 blur-3xl"
            aria-hidden
          />
          <div className="relative flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="max-w-2xl space-y-3">
              <p className="inline-flex items-center gap-2 rounded-full border border-[#5865F2]/35 bg-[#5865F2]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#b4b9ff]">
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
                Visibilité pour l&apos;équipe &amp; la communauté
              </p>
              <h1 className="text-2xl font-bold leading-tight md:text-3xl">
                La présence Discord TENF,{' '}
                <span className="bg-gradient-to-r from-[#f4db97] to-[#c9a227] bg-clip-text text-transparent">
                  lisible et équitable
                </span>
              </h1>
              <p className="text-sm leading-relaxed text-gray-400 md:text-[15px]">
                Cette page centralise les stats personnelles importées depuis Discord (messages écrits et temps vocal),
                alignées sur les pseudos Twitch du site. Elle sert à{' '}
                <strong className="font-medium text-gray-200">reconnaître l&apos;engagement</strong> des membres, pas à
                juger en silence : les données viennent des exports CSV configurés comme sur le tableau de bord admin.
              </p>
            </div>
            <div className="grid shrink-0 grid-cols-3 gap-2 sm:gap-3 md:w-[340px]">
              <div className="rounded-2xl border border-white/10 bg-black/25 p-3 text-center backdrop-blur-sm">
                <CalendarRange className="mx-auto mb-1 h-5 w-5 text-[#f4db97]" aria-hidden />
                <p className="text-[10px] uppercase tracking-wide text-gray-500">Mois chargés</p>
                <p className="text-lg font-bold tabular-nums">
                  {loading ? "…" : aggregated.monthsLoaded.length}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/25 p-3 text-center backdrop-blur-sm">
                <Users className="mx-auto mb-1 h-5 w-5 text-emerald-300/90" aria-hidden />
                <p className="text-[10px] uppercase tracking-wide text-gray-500">Annuaire site</p>
                <p className="text-lg font-bold tabular-nums">{rosterLoading ? "…" : siteLogins.length}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/25 p-3 text-center backdrop-blur-sm">
                <TrendingUp className="mx-auto mb-1 h-5 w-5 text-violet-300/90" aria-hidden />
                <p className="text-[10px] uppercase tracking-wide text-gray-500">Statut</p>
                <p className="text-xs font-semibold leading-snug text-gray-200">
                  {loadError ? "Erreur" : loading ? "Sync…" : "À jour"}
                </p>
              </div>
            </div>
          </div>

          <details className="relative mt-6 rounded-2xl border border-white/[0.06] bg-black/20">
            <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-medium text-gray-300 [&::-webkit-details-marker]:hidden">
              <HelpCircle className="h-4 w-4 text-[#f4db97]" aria-hidden />
              Pourquoi ces chiffres ? (à partager avec les membres)
              <span className="ml-auto text-xs text-gray-500">Cliquer pour ouvrir</span>
            </summary>
            <div className="space-y-2 border-t border-white/[0.06] px-4 py-3 text-sm text-gray-400">
              <p>
                Les totaux reflètent uniquement ce qui a été <strong className="text-gray-200">importé</strong> pour la
                période choisie. Un membre à zéro peut ne pas figurer dans l&apos;export ou utiliser un identifiant
                différent de sa fiche TENF.
              </p>
              <p>
                Dans le <strong className="text-gray-200">tableau général</strong>, tous les pseudos absents de
                l&apos;annuaire site (y compris les anciennes lignes par pseudo Discord) sont{' '}
                <strong className="text-gray-200">fusionnés</strong> sur une seule ligne{' '}
                <strong className="text-gray-200">Membres de la communauté</strong> (badge{' '}
                <span className="text-slate-300">communauté</span>). Le détail par pseudo reste disponible dans chaque
                onglet pour créer les fiches dans la gestion des membres.
              </p>
              <p>
                Utilise cette vue pour les bilans collectifs, les remerciements et la cohérence avec le dashboard public :
                même format CSV, même mois cible.
              </p>
            </div>
          </details>
        </section>

        {/* Portée */}
        <section className="rounded-2xl border border-[#d4af37]/20 bg-[#12151f] p-5 shadow-lg">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <CalendarRange className="h-5 w-5 text-[#f4db97]" aria-hidden />
            <h2 className="text-lg font-semibold text-white">Période analysée</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {scopePill("month", "Un mois")}
            {scopePill("period", "Plusieurs mois")}
            {scopePill("all", "Toute l'historique importée")}
          </div>

          <div className="mt-5 flex flex-wrap items-end gap-4">
            {scopeMode === "month" && (
              <div>
                <label htmlFor="scope-single-month" className="mb-1 block text-xs font-medium text-gray-500">
                  Mois
                </label>
                <input
                  id="scope-single-month"
                  type="month"
                  value={singleMonth}
                  onChange={(e) => setSingleMonth(e.target.value)}
                  className="rounded-xl border border-gray-600 bg-[#0b0d12] px-3 py-2.5 text-sm outline-none ring-[#5865F2]/0 transition focus:ring-2 focus:ring-[#5865F2]/50"
                />
              </div>
            )}
            {scopeMode === "period" && (
              <>
                <div>
                  <label htmlFor="scope-period-start" className="mb-1 block text-xs font-medium text-gray-500">
                    Début
                  </label>
                  <input
                    id="scope-period-start"
                    type="month"
                    value={periodStart}
                    onChange={(e) => setPeriodStart(e.target.value)}
                    className="rounded-xl border border-gray-600 bg-[#0b0d12] px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#5865F2]/50"
                  />
                </div>
                <div>
                  <label htmlFor="scope-period-end" className="mb-1 block text-xs font-medium text-gray-500">
                    Fin
                  </label>
                  <input
                    id="scope-period-end"
                    type="month"
                    value={periodEnd}
                    onChange={(e) => setPeriodEnd(e.target.value)}
                    className="rounded-xl border border-gray-600 bg-[#0b0d12] px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#5865F2]/50"
                  />
                </div>
              </>
            )}
            <button
              type="button"
              onClick={() => void refreshData()}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-[#d4af37]/45 bg-gradient-to-r from-[#d4af37]/15 to-transparent px-5 py-2.5 text-sm font-semibold text-[#f4db97] transition hover:from-[#d4af37]/25 disabled:opacity-50"
            >
              {loading ? "Chargement…" : "Rafraîchir les données"}
            </button>
          </div>
          <p className="mt-3 text-xs text-gray-500">{scopeSummary}</p>
          {loadError && <p className="mt-2 text-sm text-red-400">{loadError}</p>}
        </section>

        {/* Import */}
        <section className="rounded-2xl border border-[#5865F2]/25 bg-gradient-to-br from-[#1a1f35]/90 to-[#12151f] p-5">
          <div className="mb-3 flex items-center gap-2">
            <Upload className="h-5 w-5 text-[#b4b9ff]" aria-hidden />
            <h2 className="text-lg font-semibold">Importer les exports Discord</h2>
          </div>
          <p className="text-sm text-gray-400">
            Un fichier = <strong className="text-gray-200">un mois</strong>. Même procédure que sur{' '}
            <strong className="text-gray-200">Dashboard membre</strong> : tu charges les CSV, TENF agrège par
            pseudo Twitch.
          </p>
          <div className="mt-4 flex flex-wrap items-end gap-4">
            <div>
              <label htmlFor="import-month" className="mb-1 block text-xs font-medium text-gray-500">
                Mois enregistré pour ce fichier
              </label>
              <input
                id="import-month"
                type="month"
                value={importMonth}
                onChange={(e) => setImportMonth(e.target.value)}
                className="rounded-xl border border-gray-600 bg-[#0b0d12] px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#5865F2]/50"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowMessagesImport(true)}
              disabled={importing || deleting}
              className="inline-flex items-center gap-2 rounded-xl bg-[#5865F2] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#5865F2]/20 transition hover:bg-[#4752C4] disabled:opacity-50"
            >
              <MessageSquare className="h-4 w-4" />
              Messages (CSV)
            </button>
            <button
              type="button"
              onClick={() => setShowVocalsImport(true)}
              disabled={importing || deleting}
              className="inline-flex items-center gap-2 rounded-xl bg-[#5865F2] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#5865F2]/20 transition hover:bg-[#4752C4] disabled:opacity-50"
            >
              <Mic className="h-4 w-4" />
              Vocaux (CSV)
            </button>
          </div>

          <div className="mt-6 border-t border-white/10 pt-5">
            <div className="mb-2 flex items-center gap-2 text-amber-200/90">
              <Trash2 className="h-4 w-4 shrink-0" aria-hidden />
              <h3 className="text-sm font-semibold uppercase tracking-wide">Corriger un import</h3>
            </div>
            <p className="text-sm text-gray-400">
              Supprime les données du mois <strong className="text-gray-200">{importMonth}</strong> si un fichier était
              erroné.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => openDeleteMonthModal("messages")}
                disabled={importing || deleting}
                className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-200 transition hover:bg-red-500/20 disabled:opacity-50"
              >
                {deleting ? "…" : "Supprimer les messages du mois"}
              </button>
              <button
                type="button"
                onClick={() => openDeleteMonthModal("vocals")}
                disabled={importing || deleting}
                className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-200 transition hover:bg-red-500/20 disabled:opacity-50"
              >
                {deleting ? "…" : "Supprimer les vocaux du mois"}
              </button>
              <button
                type="button"
                onClick={() => openDeleteMonthModal("all")}
                disabled={importing || deleting}
                className="rounded-xl border border-red-600/60 bg-red-600/15 px-3 py-2 text-sm font-semibold text-red-100 transition hover:bg-red-600/25 disabled:opacity-50"
              >
                {deleting ? "…" : "Tout supprimer pour ce mois"}
              </button>
            </div>
          </div>
        </section>

        {/* Tabs */}
        <div
          className="flex gap-2 rounded-2xl border border-white/[0.08] bg-[#12151f]/80 p-1.5 backdrop-blur-sm"
          role="tablist"
          aria-label="Type d&apos;activité Discord"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "ecrit"}
            id="tab-ecrit"
            aria-controls="panel-ecrit"
            onClick={() => setActiveTab("ecrit")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${
              activeTab === "ecrit"
                ? "bg-gradient-to-br from-[#5865F2]/35 to-[#5865F2]/10 text-white shadow-inner ring-1 ring-[#5865F2]/40"
                : "text-gray-400 hover:bg-white/[0.05] hover:text-gray-200"
            }`}
          >
            <MessageSquare className="h-4 w-4 shrink-0" aria-hidden />
            Messages écrits
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "vocal"}
            id="tab-vocal"
            aria-controls="panel-vocal"
            onClick={() => setActiveTab("vocal")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${
              activeTab === "vocal"
                ? "bg-gradient-to-br from-violet-500/30 to-violet-600/10 text-white ring-1 ring-violet-400/35"
                : "text-gray-400 hover:bg-white/[0.05] hover:text-gray-200"
            }`}
          >
            <Mic className="h-4 w-4 shrink-0" aria-hidden />
            Temps vocal
          </button>
        </div>

        {/* Panel écrit */}
        <div
          role="tabpanel"
          id="panel-ecrit"
          aria-labelledby="tab-ecrit"
          hidden={activeTab !== "ecrit"}
          className="space-y-5"
        >
          {activeTab === "ecrit" && (
            <>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-[#151924] p-5">
                  <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <MessageSquare className="h-4 w-4 text-[#5865F2]" aria-hidden />
                    Messages (période)
                  </p>
                  <p className="mt-2 text-3xl font-bold tabular-nums text-white">
                    {aggregated.totalMessages.toLocaleString("fr-FR")}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-[#151924] p-5">
                  <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <Users className="h-4 w-4 text-emerald-400/90" aria-hidden />
                    Membres actifs (écrit)
                  </p>
                  <p className="mt-2 text-3xl font-bold tabular-nums text-white">{membersWithMsg}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-[#151924] p-5">
                  <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <Hash className="h-4 w-4 text-[#f4db97]" aria-hidden />
                    Lignes classement
                  </p>
                  <p className="mt-2 text-3xl font-bold tabular-nums text-white">{allMessageRows.length}</p>
                </div>
              </div>

              {communityMessagesBreakdown.length > 0 && (
                <details className="group rounded-2xl border border-slate-500/35 bg-[#151924]/90 p-4 open:border-[#5865F2]/35">
                  <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-semibold text-slate-200 [&::-webkit-details-marker]:hidden">
                    <ChevronDown className="h-4 w-4 shrink-0 transition group-open:rotate-180" aria-hidden />
                    Membres de la communauté — détail des pseudos (messages)
                  </summary>
                  <p className="mt-2 text-xs text-gray-500">
                    Ligne agrégée du tableau = somme de ces pseudos (hors annuaire TENF).{' '}
                    <strong className="text-gray-400">Gestion membres</strong> ouvre la liste avec recherche ; les
                    fondateurs ont le modal « Ajouter une chaîne » prérempli (
                    <span className="text-gray-400">addTwitch</span> ou{' '}
                    <span className="text-gray-400">addDiscord</span>).
                  </p>
                  <div className="mt-3 max-h-[min(40vh,320px)] overflow-auto rounded-xl border border-white/10">
                    <table className="w-full text-left text-sm">
                      <thead className="sticky top-0 z-[1] bg-[#1a1f2e] text-xs uppercase tracking-wide text-gray-400">
                        <tr>
                          <th className="px-3 py-2 font-medium">Pseudo (export Discord)</th>
                          <th className="px-3 py-2 text-right font-medium">Messages</th>
                          <th className="px-3 py-2 text-right font-medium">Créer / ouvrir</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {communityMessagesBreakdown.map((row) => (
                          <tr key={`msg-bd-${row.pseudo}`}>
                            <td className="px-3 py-2 font-medium text-gray-200">
                              {row.pseudo === DISCORD_ACTIVITY_COMMUNITY_LOGIN
                                ? "Agrégat import (bucket technique)"
                                : row.pseudo}
                            </td>
                            <td className="px-3 py-2 text-right tabular-nums text-gray-300">
                              {row.messages.toLocaleString("fr-FR")}
                            </td>
                            <td className="px-3 py-2 text-right">
                              {row.pseudo !== DISCORD_ACTIVITY_COMMUNITY_LOGIN ? (
                                <Link
                                  href={gestionMemberCreationHref(row.pseudo)}
                                  className="inline-flex items-center gap-1 rounded-lg border border-violet-500/40 bg-violet-500/10 px-2.5 py-1 text-xs font-semibold text-violet-200 transition hover:bg-violet-500/20"
                                >
                                  <UserPlus className="h-3.5 w-3.5 shrink-0" aria-hidden />
                                  Gestion membres
                                  <ExternalLink className="h-3 w-3 shrink-0 opacity-70" aria-hidden />
                                </Link>
                              ) : (
                                <span className="text-xs text-gray-500">Inclus dans la ligne agrégat</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>
              )}

              {podiumMessages.length >= 1 && (
                <div>
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#f4db97]">
                    <Sparkles className="h-4 w-4" aria-hidden />
                    Podium des contributeurs (écrit)
                  </h3>
                  <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-center md:gap-4">
                    {podiumMessages[1] && (
                      <PodiumCard
                        rank={2}
                        login={podiumMessages[1].login}
                        value={podiumMessages[1].messages.toLocaleString("fr-FR")}
                        valueLabel="messages"
                      />
                    )}
                    {podiumMessages[0] && (
                      <PodiumCard
                        rank={1}
                        login={podiumMessages[0].login}
                        value={podiumMessages[0].messages.toLocaleString("fr-FR")}
                        valueLabel="messages"
                      />
                    )}
                    {podiumMessages[2] && (
                      <PodiumCard
                        rank={3}
                        login={podiumMessages[2].login}
                        value={podiumMessages[2].messages.toLocaleString("fr-FR")}
                        valueLabel="messages"
                      />
                    )}
                  </div>
                </div>
              )}

              <div className="rounded-2xl border border-white/10 bg-[#151924] p-5">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
                    <BarChart3 className="h-4 w-4 text-violet-300" aria-hidden />
                    Top contributeurs (aperçu interactif)
                  </h3>
                  <span className="text-xs text-gray-500">Survole une barre pour le pseudo complet</span>
                </div>
                {chartMessages.length === 0 ? (
                  <p className="py-8 text-center text-sm text-gray-500">Aucun message sur cette portée.</p>
                ) : (
                  <div className="h-[280px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartMessages} layout="vertical" margin={{ left: 8, right: 16 }}>
                        <XAxis type="number" stroke={CHART_MUTED} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                        <YAxis
                          type="category"
                          dataKey="label"
                          width={88}
                          stroke={CHART_MUTED}
                          tick={{ fill: "#cbd5e1", fontSize: 11 }}
                        />
                        <Tooltip
                          cursor={{ fill: "rgba(255,255,255,0.04)" }}
                          content={({ active, payload }) => {
                            if (!active || !payload?.[0]) return null;
                            const p = payload[0].payload as { full: string; value: number };
                            return (
                              <div className="rounded-lg border border-white/10 bg-[#1e293b] px-3 py-2 text-xs shadow-xl">
                                <p className="font-semibold text-white">{p.full}</p>
                                <p className="tabular-nums text-violet-200">{p.value.toLocaleString("fr-FR")} messages</p>
                              </div>
                            );
                          }}
                        />
                        <Bar dataKey="value" radius={[0, 6, 6, 0]} isAnimationActive>
                          {chartMessages.map((_, i) => (
                            <Cell key={i} fill={i < 3 ? "#f4db97" : CHART_ACCENT} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#151924] p-5">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <h3 className="text-sm font-semibold text-white">Classement détaillé</h3>
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-400">
                      <input
                        type="checkbox"
                        checked={onlyWithActivity}
                        onChange={(e) => setOnlyWithActivity(e.target.checked)}
                        className="rounded border-gray-600 bg-[#0b0d12] text-[#5865F2] focus:ring-[#5865F2]/50"
                      />
                      Uniquement avec messages
                    </label>
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                      <input
                        type="search"
                        value={tableSearch}
                        onChange={(e) => setTableSearch(e.target.value)}
                        placeholder="Filtrer par pseudo…"
                        className="w-full rounded-xl border border-gray-600 bg-[#0b0d12] py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-[#5865F2]/40 sm:w-56"
                      />
                    </div>
                  </div>
                </div>
                {rosterLoading ? (
                  <p className="text-sm text-gray-500">Chargement de l&apos;annuaire…</p>
                ) : filteredMessageRows.length === 0 ? (
                  <p className="text-sm text-gray-500">Aucune ligne ne correspond au filtre.</p>
                ) : (
                  <div className="max-h-[min(55vh,520px)] overflow-auto rounded-xl border border-gray-700/80">
                    <table className="w-full text-left text-sm">
                      <thead className="sticky top-0 z-10 bg-[#1a1f2e] text-xs uppercase tracking-wide text-gray-400">
                        <tr>
                          <th className="px-3 py-2.5 font-medium">#</th>
                          <th className="px-3 py-2.5 font-medium">Pseudo Twitch</th>
                          <th className="px-3 py-2.5 text-right font-medium">Messages</th>
                          <th className="hidden px-3 py-2.5 font-medium md:table-cell">Relatif</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800">
                        {filteredMessageRows.map((row, i) => (
                          <tr
                            key={row.login}
                            className={`transition hover:bg-white/[0.03] ${row.isCommunityAggregate ? "bg-slate-500/[0.06]" : row.onlyInImport ? "bg-amber-500/[0.06]" : ""}`}
                          >
                            <td className="px-3 py-2.5 tabular-nums text-gray-500">{i + 1}</td>
                            <td className="px-3 py-2.5 font-medium text-gray-100">
                              {formatDiscordActivityMemberLabel(row.login)}
                              {row.isCommunityAggregate ? (
                                <span className="ml-2 rounded bg-slate-500/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-slate-300">
                                  communauté
                                </span>
                              ) : row.onlyInImport ? (
                                <span className="ml-2 rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-amber-400">
                                  import
                                </span>
                              ) : null}
                            </td>
                            <td className="px-3 py-2.5 text-right tabular-nums text-gray-200">
                              {row.messages.toLocaleString("fr-FR")}
                            </td>
                            <td className="hidden px-3 py-2 md:table-cell">
                              <div className="h-2 overflow-hidden rounded-full bg-gray-800">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-[#5865F2] to-violet-400 transition-[width]"
                                  style={{ width: `${(row.messages / maxMessages) * 100}%` }}
                                />
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Panel vocal */}
        <div
          role="tabpanel"
          id="panel-vocal"
          aria-labelledby="tab-vocal"
          hidden={activeTab !== "vocal"}
          className="space-y-5"
        >
          {activeTab === "vocal" && (
            <>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-[#151924] p-5">
                  <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <Mic className="h-4 w-4 text-violet-400" aria-hidden />
                    Heures vocal (somme)
                  </p>
                  <p className="mt-2 text-3xl font-bold tabular-nums text-white">
                    {aggregated.totalVoiceHours.toFixed(1)} h
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-[#151924] p-5">
                  <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <Users className="h-4 w-4 text-emerald-400/90" aria-hidden />
                    Membres en vocal
                  </p>
                  <p className="mt-2 text-3xl font-bold tabular-nums text-white">{membersWithVoc}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-[#151924] p-5">
                  <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <Hash className="h-4 w-4 text-[#f4db97]" aria-hidden />
                    Lignes classement
                  </p>
                  <p className="mt-2 text-3xl font-bold tabular-nums text-white">{allVocalRows.length}</p>
                </div>
              </div>

              {communityVocalsBreakdown.length > 0 && (
                <details className="group rounded-2xl border border-slate-500/35 bg-[#151924]/90 p-4 open:border-violet-500/35">
                  <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-semibold text-slate-200 [&::-webkit-details-marker]:hidden">
                    <ChevronDown className="h-4 w-4 shrink-0 transition group-open:rotate-180" aria-hidden />
                    Membres de la communauté — détail des pseudos (vocal)
                  </summary>
                  <p className="mt-2 text-xs text-gray-500">
                    Même logique que l&apos;onglet messages : total vocal du tableau général = somme des lignes hors
                    annuaire.
                  </p>
                  <div className="mt-3 max-h-[min(40vh,320px)] overflow-auto rounded-xl border border-white/10">
                    <table className="w-full text-left text-sm">
                      <thead className="sticky top-0 z-[1] bg-[#1a1f2e] text-xs uppercase tracking-wide text-gray-400">
                        <tr>
                          <th className="px-3 py-2 font-medium">Pseudo (export Discord)</th>
                          <th className="px-3 py-2 text-right font-medium">Temps vocal</th>
                          <th className="px-3 py-2 text-right font-medium">Créer / ouvrir</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {communityVocalsBreakdown.map((row) => (
                          <tr key={`voc-bd-${row.pseudo}`}>
                            <td className="px-3 py-2 font-medium text-gray-200">
                              {row.pseudo === DISCORD_ACTIVITY_COMMUNITY_LOGIN
                                ? "Agrégat import (bucket technique)"
                                : row.pseudo}
                            </td>
                            <td className="px-3 py-2 text-right tabular-nums text-gray-300">{row.vocal.display}</td>
                            <td className="px-3 py-2 text-right">
                              {row.pseudo !== DISCORD_ACTIVITY_COMMUNITY_LOGIN ? (
                                <Link
                                  href={gestionMemberCreationHref(row.pseudo)}
                                  className="inline-flex items-center gap-1 rounded-lg border border-violet-500/40 bg-violet-500/10 px-2.5 py-1 text-xs font-semibold text-violet-200 transition hover:bg-violet-500/20"
                                >
                                  <UserPlus className="h-3.5 w-3.5 shrink-0" aria-hidden />
                                  Gestion membres
                                  <ExternalLink className="h-3 w-3 shrink-0 opacity-70" aria-hidden />
                                </Link>
                              ) : (
                                <span className="text-xs text-gray-500">Inclus dans la ligne agrégat</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>
              )}

              {podiumVocals.length >= 1 && (
                <div>
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-violet-200">
                    <Sparkles className="h-4 w-4" aria-hidden />
                    Podium temps vocal
                  </h3>
                  <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-center md:gap-4">
                    {podiumVocals[1] && (
                      <PodiumCard
                        rank={2}
                        login={podiumVocals[1].login}
                        value={podiumVocals[1].vocal.display}
                        valueLabel="temps vocal"
                      />
                    )}
                    {podiumVocals[0] && (
                      <PodiumCard
                        rank={1}
                        login={podiumVocals[0].login}
                        value={podiumVocals[0].vocal.display}
                        valueLabel="temps vocal"
                      />
                    )}
                    {podiumVocals[2] && (
                      <PodiumCard
                        rank={3}
                        login={podiumVocals[2].login}
                        value={podiumVocals[2].vocal.display}
                        valueLabel="temps vocal"
                      />
                    )}
                  </div>
                </div>
              )}

              <div className="rounded-2xl border border-white/10 bg-[#151924] p-5">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
                    <BarChart3 className="h-4 w-4 text-violet-300" aria-hidden />
                    Top temps vocal (heures)
                  </h3>
                  <span className="text-xs text-gray-500">Pseudo complet dans l&apos;infobulle</span>
                </div>
                {chartVocals.length === 0 ? (
                  <p className="py-8 text-center text-sm text-gray-500">Aucun temps vocal sur cette portée.</p>
                ) : (
                  <div className="h-[280px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartVocals} layout="vertical" margin={{ left: 8, right: 16 }}>
                        <XAxis
                          type="number"
                          stroke={CHART_MUTED}
                          tick={{ fill: "#94a3b8", fontSize: 11 }}
                          tickFormatter={(v) => `${v}h`}
                        />
                        <YAxis
                          type="category"
                          dataKey="label"
                          width={88}
                          stroke={CHART_MUTED}
                          tick={{ fill: "#cbd5e1", fontSize: 11 }}
                        />
                        <Tooltip
                          cursor={{ fill: "rgba(255,255,255,0.04)" }}
                          content={({ active, payload }) => {
                            if (!active || !payload?.[0]) return null;
                            const p = payload[0].payload as { full: string; value: number };
                            return (
                              <div className="rounded-lg border border-white/10 bg-[#1e293b] px-3 py-2 text-xs shadow-xl">
                                <p className="font-semibold text-white">{p.full}</p>
                                <p className="tabular-nums text-violet-200">{p.value} h</p>
                              </div>
                            );
                          }}
                        />
                        <Bar dataKey="value" radius={[0, 6, 6, 0]} isAnimationActive>
                          {chartVocals.map((_, i) => (
                            <Cell key={i} fill={i < 3 ? "#c4b5fd" : "#7c3aed"} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#151924] p-5">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <h3 className="text-sm font-semibold text-white">Classement détaillé</h3>
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-400">
                      <input
                        type="checkbox"
                        checked={onlyWithActivity}
                        onChange={(e) => setOnlyWithActivity(e.target.checked)}
                        className="rounded border-gray-600 bg-[#0b0d12] text-violet-500 focus:ring-violet-500/50"
                      />
                      Uniquement avec temps vocal
                    </label>
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                      <input
                        type="search"
                        value={tableSearch}
                        onChange={(e) => setTableSearch(e.target.value)}
                        placeholder="Filtrer par pseudo…"
                        className="w-full rounded-xl border border-gray-600 bg-[#0b0d12] py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-violet-500/40 sm:w-56"
                      />
                    </div>
                  </div>
                </div>
                {rosterLoading ? (
                  <p className="text-sm text-gray-500">Chargement de l&apos;annuaire…</p>
                ) : filteredVocalRows.length === 0 ? (
                  <p className="text-sm text-gray-500">Aucune ligne ne correspond au filtre.</p>
                ) : (
                  <div className="max-h-[min(55vh,520px)] overflow-auto rounded-xl border border-gray-700/80">
                    <table className="w-full text-left text-sm">
                      <thead className="sticky top-0 z-10 bg-[#1a1f2e] text-xs uppercase tracking-wide text-gray-400">
                        <tr>
                          <th className="px-3 py-2.5 font-medium">#</th>
                          <th className="px-3 py-2.5 font-medium">Pseudo Twitch</th>
                          <th className="px-3 py-2.5 text-right font-medium">Temps vocal</th>
                          <th className="hidden px-3 py-2.5 font-medium md:table-cell">Relatif</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800">
                        {filteredVocalRows.map((row, i) => (
                          <tr
                            key={row.login}
                            className={`transition hover:bg-white/[0.03] ${row.isCommunityAggregate ? "bg-slate-500/[0.06]" : row.onlyInImport ? "bg-amber-500/[0.06]" : ""}`}
                          >
                            <td className="px-3 py-2.5 tabular-nums text-gray-500">{i + 1}</td>
                            <td className="px-3 py-2.5 font-medium text-gray-100">
                              {formatDiscordActivityMemberLabel(row.login)}
                              {row.isCommunityAggregate ? (
                                <span className="ml-2 rounded bg-slate-500/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-slate-300">
                                  communauté
                                </span>
                              ) : row.onlyInImport ? (
                                <span className="ml-2 rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-amber-400">
                                  import
                                </span>
                              ) : null}
                            </td>
                            <td className="px-3 py-2.5 text-right tabular-nums text-gray-200">{row.vocal.display}</td>
                            <td className="hidden px-3 py-2 md:table-cell">
                              <div className="h-2 overflow-hidden rounded-full bg-gray-800">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-400 transition-[width]"
                                  style={{
                                    width: `${(row.vocal.totalMinutes / maxVocalMinutes) * 100}%`,
                                  }}
                                />
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>

      <AdminConfirmModal
        open={deleteMonthScope !== null}
        tone={deleteMonthScope === "all" ? "danger" : "warning"}
        title="Confirmer la suppression"
        description={deleteMonthModalDesc}
        confirmLabel="Supprimer"
        loading={deleting}
        onCancel={() => !deleting && setDeleteMonthScope(null)}
        onConfirm={() => void executeDeleteMonth()}
      />

      <DiscordMessagesImportModal
        isOpen={showMessagesImport}
        onClose={() => setShowMessagesImport(false)}
        onImport={handleImportMessages}
        month={importMonth}
      />

      <DiscordVocalsImportModal
        isOpen={showVocalsImport}
        onClose={() => setShowVocalsImport(false)}
        onImport={handleImportVocals}
        month={importMonth}
      />
    </div>
  );
}

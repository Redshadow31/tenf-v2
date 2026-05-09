"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  ArrowRight,
  BarChart3,
  CalendarRange,
  ChevronDown,
  Eye,
  Hash,
  Heart,
  MessageSquare,
  Mic,
  RefreshCw,
  Settings2,
  Shield,
  Sparkles,
  Upload,
  Users,
} from "lucide-react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import AdminHeader from "@/components/admin/AdminHeader";
import DiscordSalonsImportModal from "@/components/admin/DiscordSalonsImportModal";
import DiscordStaffSalonClusterCard from "@/components/admin/DiscordStaffSalonClusterCard";
import type { SalonSplitDisplay } from "@/lib/discordActivityChannelsAggregate";

function currentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function formatMinutesFr(totalMinutes: number): string {
  const hh = Math.floor(totalMinutes / 60);
  const mm = totalMinutes % 60;
  return `${hh}h${mm.toString().padStart(2, "0")}`;
}

function monthLabelFr(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  if (!y || !m) return ym;
  return format(new Date(y, m - 1, 1), "MMMM yyyy", { locale: fr });
}

function shortMonth(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  if (!y || !m) return ym;
  return format(new Date(y, m - 1, 1), "MMM yy", { locale: fr });
}

type TimelineRow = {
  month: string;
  totalMessages: number;
  totalVoiceHours: number;
  hasSalonMessages: boolean;
  hasSalonVocals: boolean;
  /** % du volume salons messages classés staff (null si pas d’import salons). */
  staffSalonMessagesPct?: number | null;
  /** % du temps vocal salons classés staff (null si pas d’import salons). */
  staffSalonVocalsPct?: number | null;
  salonsMessages: SalonSplitDisplay;
  salonsVocals: SalonSplitDisplay;
};

const CHART_MSG_PUBLIC = "#3d4fa3";
const CHART_MSG_STAFF = "#d8b4fe";
const CHART_VOC_PUBLIC = "#6d28d9";
const CHART_VOC_STAFF = "#f0abfc";
/** Dégradés barres détail salons (blocs messages / vocaux). */
const CHART_MSG = "#5865F2";
const CHART_VOC = "#a78bfa";

function SalonBlock({
  title,
  split,
  valueSuffix,
  accent,
}: {
  title: string;
  split: SalonSplitDisplay;
  valueSuffix: string;
  accent: string;
}) {
  const hasAny = split.rankedRows.length > 0;

  const maxVal = useMemo(() => {
    let m = 1;
    for (const x of split.rankedRows) m = Math.max(m, x.value);
    return m;
  }, [split]);

  if (!hasAny) {
    return (
      <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-br from-[#0f1219] to-[#151924] p-4">
        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">{title}</p>
        <p className="mt-3 flex items-center gap-2 text-sm text-gray-600">
          <Hash className="h-4 w-4 shrink-0 opacity-50" aria-hidden />
          Importe un fichier salons pour voir où la communauté discute le plus.
        </p>
      </div>
    );
  }

  const scale = maxVal > 0 ? maxVal : 1;

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-br from-[#0f1219] to-[#151924] p-4 shadow-inner">
      <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">{title}</p>
      <ul className="mt-3 list-none space-y-3">
        {split.rankedRows.map((row, idx) => (
          <li key={`${title}-${row.kind}-${row.label}-${idx}`}>
            <div className="flex gap-2.5">
              <span
                className="w-5 shrink-0 pt-0.5 text-right text-[11px] font-bold tabular-nums text-gray-500"
                aria-hidden
              >
                {idx + 1}
              </span>
              <div className="min-w-0 flex-1">
                {row.kind === "staff" ? (
                  <DiscordStaffSalonClusterCard
                    compact
                    label={row.label}
                    valueFormatted={
                      valueSuffix === "msg"
                        ? row.value.toLocaleString("fr-FR")
                        : formatMinutesFr(Math.round(row.value))
                    }
                  />
                ) : (
                  <>
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span className="truncate font-medium text-gray-100" title={row.label}>
                        #{row.label}
                      </span>
                      <span className="shrink-0 tabular-nums text-xs font-semibold text-gray-400">
                        {valueSuffix === "msg"
                          ? row.value.toLocaleString("fr-FR")
                          : formatMinutesFr(Math.round(row.value))}
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-black/40">
                      <div
                        className="h-full rounded-full transition-all duration-500 ease-out"
                        style={{
                          width: `${Math.min(100, (row.value / scale) * 100)}%`,
                          backgroundImage: accent,
                          opacity: 0.9,
                        }}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function DiscordActiviteMensuellePage() {
  const [mergeStaff, setMergeStaff] = useState(true);
  const [topPublic, setTopPublic] = useState(8);
  const [rows, setRows] = useState<TimelineRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [staffPatternsText, setStaffPatternsText] = useState("");
  const [staffBucketLabel, setStaffBucketLabel] = useState("");
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsSaved, setSettingsSaved] = useState<string | null>(null);

  const [importMonth, setImportMonth] = useState(currentMonthKey);
  const [salonModal, setSalonModal] = useState<"messages" | "vocals" | null>(null);
  const [openMonth, setOpenMonth] = useState<string | null>(null);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);

  const loadSettings = useCallback(async () => {
    setSettingsLoading(true);
    try {
      const res = await fetch("/api/admin/discord-activity/salon-settings", { cache: "no-store" });
      if (!res.ok) throw new Error("Paramètres salons indisponibles");
      const json = await res.json();
      const s = json.settings || {};
      setStaffPatternsText((s.staffNameSubstrings || []).join(", "));
      setStaffBucketLabel(s.staffBucketLabel || "");
    } catch {
      setStaffPatternsText("");
      setStaffBucketLabel("");
    } finally {
      setSettingsLoading(false);
    }
  }, []);

  const loadTimeline = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const q = new URLSearchParams({
        mergeStaff: mergeStaff ? "1" : "0",
        topPublic: String(topPublic),
      });
      const res = await fetch(`/api/admin/discord-activity/timeline?${q}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Impossible de charger la chronologie.");
      const json = await res.json();
      setRows((json.rows || []) as TimelineRow[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [mergeStaff, topPublic]);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    void loadTimeline();
  }, [loadTimeline]);

  const saveSettings = async () => {
    setSettingsSaved(null);
    const subs = staffPatternsText
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    const res = await fetch("/api/admin/discord-activity/salon-settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        staffNameSubstrings: subs,
        staffBucketLabel: staffBucketLabel.trim() || "Espace staff (hors capture publique)",
      }),
    });
    if (!res.ok) {
      setSettingsSaved("Erreur enregistrement.");
      return;
    }
    setSettingsSaved("Enregistré.");
    void loadTimeline();
  };

  const handleSalonImport = async (
    kind: "messages" | "vocals",
    payload: { data: Record<string, number>; replace: boolean; staffNormalizedKeys: string[] }
  ) => {
    const body =
      kind === "messages"
        ? {
            month: importMonth,
            replace: payload.replace,
            messagesByChannel: payload.data,
            staffNormalizedKeysMessages: payload.staffNormalizedKeys,
          }
        : {
            month: importMonth,
            replace: payload.replace,
            staffNormalizedKeysVocals: payload.staffNormalizedKeys,
            vocalsMinutesByChannel: payload.data,
          };

    const res = await fetch("/api/admin/discord-activity/import-salons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error(j.error || "Import refusé");
    }
    void loadTimeline();
  };

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, r) => {
        acc.messages += r.totalMessages;
        acc.hours += r.totalVoiceHours;
        return acc;
      },
      { messages: 0, hours: 0 }
    );
  }, [rows]);

  const chartData = useMemo(() => {
    return rows.map((r) => {
      const mPct =
        r.staffSalonMessagesPct != null && !Number.isNaN(r.staffSalonMessagesPct)
          ? r.staffSalonMessagesPct / 100
          : null;
      const vPct =
        r.staffSalonVocalsPct != null && !Number.isNaN(r.staffSalonVocalsPct)
          ? r.staffSalonVocalsPct / 100
          : null;
      const messagesStaff =
        mPct != null && r.totalMessages > 0 ? Math.round(r.totalMessages * mPct) : 0;
      const messagesPublic = Math.max(0, r.totalMessages - messagesStaff);
      const hoursStaff =
        vPct != null && r.totalVoiceHours > 0
          ? Number((r.totalVoiceHours * vPct).toFixed(2))
          : 0;
      const hoursPublic = Math.max(0, Number((r.totalVoiceHours - hoursStaff).toFixed(2)));
      return {
        label: shortMonth(r.month),
        month: r.month,
        messagesPublic,
        messagesStaff,
        hoursPublic,
        hoursStaff,
        staffSalonMessagesPct: r.staffSalonMessagesPct ?? null,
        staffSalonVocalsPct: r.staffSalonVocalsPct ?? null,
      };
    });
  }, [rows]);

  const maxMonthMessages = useMemo(() => Math.max(1, ...rows.map((r) => r.totalMessages)), [rows]);
  const maxMonthHours = useMemo(() => Math.max(1, ...rows.map((r) => r.totalVoiceHours)), [rows]);

  const latestMonth = rows.length ? rows[rows.length - 1].month : null;

  return (
    <div className="min-h-screen bg-[#07080c] text-white">
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.35]"
        style={{
          backgroundImage: `
            radial-gradient(ellipse 80% 50% at 50% -20%, rgba(88,101,242,0.25), transparent),
            radial-gradient(ellipse 60% 40% at 100% 50%, rgba(167,139,250,0.12), transparent),
            radial-gradient(ellipse 50% 30% at 0% 80%, rgba(212,175,55,0.08), transparent)
          `,
        }}
        aria-hidden
      />

      <AdminHeader
        title="Discord TENF — pouls de la communauté"
        navLinks={[
          { href: "/admin/gestion-acces/accueil", label: "Dashboard administration" },
          { href: "/admin/gestion-acces", label: "Comptes administrateurs" },
          { href: "/admin/gestion-acces/dashboard", label: "Paramètres dashboard" },
          {
            href: "/admin/gestion-acces/discord-activite-personnelle",
            label: "Activité Discord personnelle",
          },
          {
            href: "/admin/gestion-acces/discord-activite",
            label: "Vue communauté & salons",
            active: true,
          },
          { href: "/admin/gestion-acces/permissions", label: "Permissions par section" },
          { href: "/admin/gestion-acces/images", label: "Images profils Twitch" },
        ]}
      />

      <main className="relative mx-auto max-w-7xl space-y-8 px-4 pb-20 pt-4 md:px-6">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-[2rem] border border-white/[0.09] bg-gradient-to-br from-[#12182a]/95 via-[#0e1118]/95 to-[#080a10]/95 p-8 shadow-[0_24px_80px_-20px_rgba(0,0,0,0.65)] backdrop-blur-xl md:p-10">
          <div
            className="pointer-events-none absolute -right-20 top-0 h-72 w-72 rounded-full bg-[#5865F2]/20 blur-[100px]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -left-16 bottom-0 h-56 w-56 rounded-full bg-[#d4af37]/10 blur-[90px]"
            aria-hidden
          />

          <div className="relative grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-[#5865F2]/40 bg-[#5865F2]/15 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-[#c7cbff]">
                  <Heart className="h-3.5 w-3.5 text-pink-300/90" aria-hidden />
                  Au service des membres TENF
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-gray-400">
                  <Eye className="h-3.5 w-3.5" aria-hidden />
                  Transparence & équité
                </span>
              </div>

              <h1 className="text-balance text-3xl font-bold leading-[1.15] tracking-tight md:text-4xl lg:text-[2.35rem]">
                Où vit la communauté sur{' '}
                <span className="bg-gradient-to-r from-[#f4db97] via-[#e8c547] to-[#c9a227] bg-clip-text text-transparent">
                  Discord
                </span>{' '}
                — mois après mois
              </h1>

              <p className="max-w-2xl text-base leading-relaxed text-gray-400 md:text-[17px]">
                Cette vue aide l&apos;équipe à{' '}
                <strong className="font-semibold text-gray-200">mettre en lumière l&apos;énergie collective</strong> :
                échanges écrits, moments vocal, et lieux de discussion les plus vivants. Les chiffres viennent des mêmes
                imports que la page personnelle : tu racontes une histoire{' '}
                <strong className="font-semibold text-gray-200">cohérente</strong> pour les membres et pour les bilans
                internes.
              </p>

              <div className="flex flex-wrap gap-3 pt-1">
                <Link
                  href="/admin/gestion-acces/discord-activite-personnelle"
                  className="group inline-flex items-center gap-2 rounded-2xl bg-[#5865F2] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-[#5865F2]/30 transition hover:bg-[#4752C4] hover:shadow-[#5865F2]/45"
                >
                  Voir l&apos;activité par membre
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
                </Link>
                <Link
                  href="/member/engagement/discord-activite"
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-gray-200 transition hover:border-[#5865F2]/40 hover:bg-[#5865F2]/10"
                >
                  <Users className="h-4 w-4 text-emerald-300/90" aria-hidden />
                  Ce que voient les membres
                </Link>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              <div className="group rounded-2xl border border-white/10 bg-gradient-to-br from-[#5865F2]/20 to-transparent p-5 transition hover:border-[#5865F2]/35 hover:shadow-lg hover:shadow-[#5865F2]/10">
                <CalendarRange className="mb-3 h-8 w-8 text-[#f4db97]" aria-hidden />
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Mois suivis</p>
                <p className="mt-1 text-3xl font-black tabular-nums tracking-tight">
                  {loading ? (
                    <span className="inline-block h-9 w-12 animate-pulse rounded-lg bg-white/10" />
                  ) : (
                    rows.length
                  )}
                </p>
                <p className="mt-2 text-xs leading-snug text-gray-500">
                  Chaque bloc ci-dessous = une période où tu as importé des données.
                </p>
              </div>
              <div className="group rounded-2xl border border-white/10 bg-gradient-to-br from-[#5865F2]/15 to-transparent p-5 transition hover:border-[#5865F2]/35">
                <MessageSquare className="mb-3 h-8 w-8 text-[#5865F2]" aria-hidden />
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Messages (cumul)</p>
                <p className="mt-1 text-3xl font-black tabular-nums tracking-tight text-[#b4b9ff]">
                  {loading ? (
                    <span className="inline-block h-9 w-28 animate-pulse rounded-lg bg-white/10" />
                  ) : (
                    totals.messages.toLocaleString("fr-FR")
                  )}
                </p>
                <p className="mt-2 text-xs text-gray-500">Toutes les conversations comptées sur la période chargée.</p>
              </div>
              <div className="group rounded-2xl border border-white/10 bg-gradient-to-br from-violet-500/15 to-transparent p-5 transition hover:border-violet-400/35 sm:col-span-3 lg:col-span-1 xl:col-span-1">
                <Mic className="mb-3 h-8 w-8 text-violet-300" aria-hidden />
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Temps vocal (cumul)</p>
                <p className="mt-1 text-3xl font-black tabular-nums tracking-tight text-violet-200">
                  {loading ? (
                    <span className="inline-block h-9 w-24 animate-pulse rounded-lg bg-white/10" />
                  ) : (
                    `${totals.hours.toFixed(1)} h`
                  )}
                </p>
                <p className="mt-2 text-xs text-gray-500">Les présences vocal enrichissent le lien entre membres.</p>
              </div>
            </div>
          </div>

          {/* Valeurs TENF */}
          <div className="relative mt-10 grid gap-4 border-t border-white/[0.06] pt-8 md:grid-cols-3">
            <div className="flex gap-4 rounded-2xl border border-white/[0.05] bg-black/20 p-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300">
                <Users className="h-5 w-5" aria-hidden />
              </div>
              <div>
                <p className="font-semibold text-gray-100">Centré utilisateur</p>
                <p className="mt-1 text-sm text-gray-500">
                  Les stats servent à reconnaître la communauté, pas à la noter dans son coin.
                </p>
              </div>
            </div>
            <div className="flex gap-4 rounded-2xl border border-white/[0.05] bg-black/20 p-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-200">
                <Sparkles className="h-5 w-5" aria-hidden />
              </div>
              <div>
                <p className="font-semibold text-gray-100">Récit clair</p>
                <p className="mt-1 text-sm text-gray-500">
                  Même source de données que les vues individuelles : pas de double langage.
                </p>
              </div>
            </div>
            <div className="flex gap-4 rounded-2xl border border-white/[0.05] bg-black/20 p-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-violet-200">
                <Shield className="h-5 w-5" aria-hidden />
              </div>
              <div>
                <p className="font-semibold text-gray-100">Vie privée staff</p>
                <p className="mt-1 text-sm text-gray-500">
                  Les salons sensibles peuvent être regroupés sans exposer leur nom au grand public.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Graphique */}
        {!loading && rows.length > 0 && (
          <section className="rounded-[1.75rem] border border-white/[0.08] bg-[#0c0f16]/80 p-6 shadow-xl backdrop-blur-md md:p-8">
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#5865F2]">
                  <BarChart3 className="h-4 w-4" aria-hidden />
                  Lecture rapide
                </p>
                <h2 className="mt-2 text-xl font-bold md:text-2xl">Courbe d&apos;activité par mois</h2>
                <p className="mt-1 max-w-xl text-sm text-gray-500">
                  Barres empilées : part estimée <strong className="font-semibold text-violet-200/90">staff</strong>{" "}
                  (violet) vs public, d’après la répartition des <strong className="font-semibold text-gray-300">salons
                  importés</strong> pour le mois — les hauteurs totales restent les volumes membres (messages / heures
                  vocal).
                </p>
              </div>
              <button
                type="button"
                onClick={() => void loadTimeline()}
                className="inline-flex items-center gap-2 self-start rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-gray-300 transition hover:border-[#5865F2]/40 hover:text-white"
              >
                <RefreshCw className="h-4 w-4" aria-hidden />
                Rafraîchir
              </button>
            </div>
            <div className="h-[320px] w-full min-h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: "#94a3b8", fontSize: 11 }}
                    axisLine={{ stroke: "rgba(148,163,184,0.2)" }}
                  />
                  <YAxis
                    yAxisId="left"
                    tick={{ fill: "#94a3b8", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    label={{
                      value: "Messages",
                      angle: -90,
                      position: "insideLeft",
                      fill: "#64748b",
                      fontSize: 11,
                    }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fill: "#94a3b8", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    label={{
                      value: "Heures vocal",
                      angle: 90,
                      position: "insideRight",
                      fill: "#64748b",
                      fontSize: 11,
                    }}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const row = payload[0].payload as {
                        month?: string;
                        staffSalonMessagesPct?: number | null;
                        staffSalonVocalsPct?: number | null;
                        messagesPublic?: number;
                        messagesStaff?: number;
                        hoursPublic?: number;
                        hoursStaff?: number;
                      };
                      const title = row.month ? monthLabelFr(row.month) : "";
                      const fmtMsg = (n: number) => n.toLocaleString("fr-FR");
                      const fmtH = (n: number) => `${n} h`;
                      const showStaffNote =
                        row.staffSalonMessagesPct != null || row.staffSalonVocalsPct != null;
                      return (
                        <div
                          className="rounded-xl border border-white/10 px-3 py-2.5 text-[13px] shadow-xl"
                          style={{ background: "#151924" }}
                        >
                          <p className="mb-2 font-semibold text-white">{title}</p>
                          <ul className="space-y-1 text-gray-200">
                            <li className="flex justify-between gap-6">
                              <span style={{ color: CHART_MSG_PUBLIC }}>Messages public</span>
                              <span className="tabular-nums">{fmtMsg(row.messagesPublic ?? 0)}</span>
                            </li>
                            <li className="flex justify-between gap-6">
                              <span style={{ color: CHART_MSG_STAFF }}>Messages staff</span>
                              <span className="tabular-nums">{fmtMsg(row.messagesStaff ?? 0)}</span>
                            </li>
                            <li className="flex justify-between gap-6 pt-1">
                              <span style={{ color: CHART_VOC_PUBLIC }}>Vocal public</span>
                              <span className="tabular-nums text-gray-200">{fmtH(row.hoursPublic ?? 0)}</span>
                            </li>
                            <li className="flex justify-between gap-6">
                              <span style={{ color: CHART_VOC_STAFF }}>Vocal staff</span>
                              <span className="tabular-nums text-gray-200">{fmtH(row.hoursStaff ?? 0)}</span>
                            </li>
                          </ul>
                          {showStaffNote && (
                            <p className="mt-2 border-t border-white/10 pt-2 text-[11px] leading-snug text-gray-500">
                              Part staff (salons importés) :{" "}
                              <strong className="text-violet-300">
                                {row.staffSalonMessagesPct != null
                                  ? `${row.staffSalonMessagesPct.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`
                                  : "—"}{" "}
                                messages
                              </strong>
                              {" · "}
                              <strong className="text-violet-300">
                                {row.staffSalonVocalsPct != null
                                  ? `${row.staffSalonVocalsPct.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`
                                  : "—"}{" "}
                                vocal
                              </strong>
                            </p>
                          )}
                        </div>
                      );
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "16px" }} />
                  <Bar
                    yAxisId="left"
                    stackId="msg"
                    dataKey="messagesPublic"
                    name="Messages · public"
                    fill={CHART_MSG_PUBLIC}
                    maxBarSize={40}
                  />
                  <Bar
                    yAxisId="left"
                    stackId="msg"
                    dataKey="messagesStaff"
                    name="Messages · staff"
                    fill={CHART_MSG_STAFF}
                    radius={[6, 6, 0, 0]}
                    maxBarSize={40}
                  />
                  <Bar
                    yAxisId="right"
                    stackId="voc"
                    dataKey="hoursPublic"
                    name="Vocal · public"
                    fill={CHART_VOC_PUBLIC}
                    maxBarSize={40}
                  />
                  <Bar
                    yAxisId="right"
                    stackId="voc"
                    dataKey="hoursStaff"
                    name="Vocal · staff"
                    fill={CHART_VOC_STAFF}
                    radius={[6, 6, 0, 0]}
                    maxBarSize={40}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}

        {/* Contrôles visuels */}
        <section className="rounded-[1.75rem] border border-[#5865F2]/20 bg-gradient-to-br from-[#12151f] to-[#0d1018] p-6 md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <h2 className="text-lg font-bold md:text-xl">Comment tu affiches la communauté</h2>
              <p className="max-w-lg text-sm text-gray-400">
                Ces réglages changent instantanément la chronologie et les graphiques — adapte-les avant une présentation
                ou un bilan pour les membres.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                role="switch"
                aria-checked={mergeStaff}
                onClick={() => setMergeStaff((v) => !v)}
                className={`relative flex h-11 w-[200px] shrink-0 items-center rounded-full border px-1 transition ${
                  mergeStaff
                    ? "border-violet-500/50 bg-violet-500/20 shadow-inner shadow-violet-500/10"
                    : "border-white/10 bg-black/30"
                }`}
              >
                <span
                  className={`absolute left-1 top-1 flex h-9 w-[calc(50%-4px)] items-center justify-center rounded-full text-xs font-bold transition-all ${
                    mergeStaff
                      ? "translate-x-[calc(100%+0px)] bg-violet-500 text-white"
                      : "translate-x-0 bg-white/15 text-gray-300"
                  }`}
                >
                  {mergeStaff ? "Staff masqué" : "Tout détaillé"}
                </span>
                <span className="pointer-events-none flex w-full justify-between px-4 text-[10px] font-bold uppercase tracking-wide text-gray-500">
                  <span>Détail</span>
                  <span>Staff groupé</span>
                </span>
              </button>
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
                <label htmlFor="top-public" className="text-xs font-semibold text-gray-400 whitespace-nowrap">
                  Salons visibles
                </label>
                <input
                  id="top-public"
                  type="range"
                  min={3}
                  max={25}
                  value={topPublic}
                  onChange={(e) => setTopPublic(Number.parseInt(e.target.value, 10))}
                  className="h-2 w-36 cursor-pointer accent-[#5865F2]"
                />
                <span className="w-8 text-center text-sm font-black tabular-nums text-[#b4b9ff]">{topPublic}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowSettingsPanel((v) => !v)}
            className="mt-6 flex w-full items-center justify-between rounded-2xl border border-white/[0.07] bg-[#151924]/60 px-5 py-4 text-left transition hover:border-[#5865F2]/30"
          >
            <span className="flex items-center gap-3">
              <Settings2 className="h-5 w-5 text-[#b4b9ff]" aria-hidden />
              <span>
                <span className="block font-semibold text-gray-100">Mots-clés staff & libellé du bloc anonyme</span>
                <span className="text-sm text-gray-500">Affine la détection automatique des salons « équipe »</span>
              </span>
            </span>
            <ChevronDown
              className={`h-5 w-5 shrink-0 text-gray-500 transition ${showSettingsPanel ? "rotate-180" : ""}`}
              aria-hidden
            />
          </button>

          {showSettingsPanel && (
            <div className="mt-4 space-y-4 rounded-2xl border border-white/[0.06] bg-black/25 p-5">
              <textarea
                value={staffPatternsText}
                onChange={(e) => setStaffPatternsText(e.target.value)}
                disabled={settingsLoading}
                rows={3}
                placeholder="staff, équipe, moderation, …"
                className="w-full rounded-xl border border-gray-600/80 bg-[#0b0d12] px-4 py-3 text-sm text-gray-100 outline-none ring-0 transition focus:border-[#5865F2]/50 disabled:opacity-50"
              />
              <input
                type="text"
                value={staffBucketLabel}
                onChange={(e) => setStaffBucketLabel(e.target.value)}
                disabled={settingsLoading}
                placeholder="Libellé du total staff"
                className="w-full rounded-xl border border-gray-600/80 bg-[#0b0d12] px-4 py-3 text-sm outline-none focus:border-[#5865F2]/50 disabled:opacity-50"
              />
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => void saveSettings()}
                  disabled={settingsLoading}
                  className="rounded-xl bg-gradient-to-r from-violet-600 to-[#5865F2] px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-500/20 hover:opacity-95 disabled:opacity-50"
                >
                  Enregistrer
                </button>
                {settingsSaved && (
                  <span className="text-sm font-medium text-emerald-400/90">{settingsSaved}</span>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Import CTAs */}
        <section className="grid gap-6 lg:grid-cols-2">
          <div className="relative overflow-hidden rounded-[1.75rem] border border-[#d4af37]/25 bg-gradient-to-br from-[#1a1610]/90 to-[#0f0e0c] p-8">
            <Upload className="absolute right-6 top-6 h-24 w-24 text-[#d4af37]/10" aria-hidden />
            <h2 className="text-xl font-bold">Enrichir le récit : salons Discord</h2>
            <p className="mt-3 text-sm leading-relaxed text-gray-400">
              Au-delà des membres, montre <strong className="text-gray-200">où</strong> la communauté prend vie :
              salons les plus actifs, temps vocal par canal. Assistant en{' '}
              <strong className="text-[#f4db97]">3 étapes</strong> (import → staff → validation).
            </p>
            <div className="mt-6 flex flex-wrap items-end gap-4">
              <div>
                <label htmlFor="salon-import-month" className="mb-1 block text-xs font-semibold text-gray-500">
                  Mois concerné
                </label>
                <input
                  id="salon-import-month"
                  type="month"
                  value={importMonth}
                  onChange={(e) => setImportMonth(e.target.value)}
                  className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#d4af37]/40"
                />
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setSalonModal("messages")}
                className="inline-flex flex-1 min-w-[160px] items-center justify-center gap-2 rounded-2xl bg-[#5865F2] px-5 py-4 text-sm font-bold text-white shadow-xl shadow-[#5865F2]/25 transition hover:scale-[1.02] hover:bg-[#4752C4] active:scale-[0.98]"
              >
                <MessageSquare className="h-5 w-5" aria-hidden />
                Importer salons · messages
              </button>
              <button
                type="button"
                onClick={() => setSalonModal("vocals")}
                className="inline-flex flex-1 min-w-[160px] items-center justify-center gap-2 rounded-2xl border-2 border-violet-400/40 bg-violet-500/10 px-5 py-4 text-sm font-bold text-violet-100 transition hover:scale-[1.02] hover:bg-violet-500/20 active:scale-[0.98]"
              >
                <Mic className="h-5 w-5" aria-hidden />
                Importer salons · vocaux
              </button>
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-[1.75rem] border border-white/[0.08] bg-[#0e1118]/90 p-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Astuce communauté</p>
              <p className="mt-3 text-lg font-semibold leading-snug text-gray-100">
                « Les chiffres racontent la présence ; ton discours raconte la bienveillance. »
              </p>
              <p className="mt-4 text-sm leading-relaxed text-gray-500">
                Utilise cette page pour préparer des messages de remerciement, des bilans ou des annonces : les montants
                sont lisibles, et les espaces staff restent dignes quand tu actives le regroupement.
              </p>
            </div>
            {latestMonth && (
              <p className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-200/90">
                <strong className="font-semibold text-emerald-100">Dernière période chargée :</strong>{" "}
                {monthLabelFr(latestMonth)}
              </p>
            )}
          </div>
        </section>

        {/* Timeline */}
        <section className="rounded-[1.75rem] border border-white/[0.07] bg-[#0c0f16]/75 p-6 backdrop-blur-sm md:p-8">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-xl font-bold md:text-2xl">Chaque mois, une fenêtre sur TENF</h2>
              <p className="mt-2 max-w-2xl text-sm text-gray-400">
                Ouvre un mois pour voir les salons qui ont porté les conversations — idéal pour comprendre où les membres
                se retrouvent le plus.
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          {loading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-36 animate-pulse rounded-2xl bg-gradient-to-br from-white/[0.06] to-transparent"
                />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <div className="rounded-[1.5rem] border border-dashed border-white/15 bg-black/20 px-8 py-16 text-center">
              <MessageSquare className="mx-auto h-14 w-14 text-gray-600" aria-hidden />
              <p className="mt-6 text-lg font-semibold text-gray-300">Pas encore de mois à raconter</p>
              <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
                Commence par importer l&apos;activité des membres sur la page personnelle. Ensuite, ajoute les salons ici
                pour une vue encore plus vivante pour la communauté.
              </p>
              <Link
                href="/admin/gestion-acces/discord-activite-personnelle"
                className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-[#5865F2] px-6 py-3 text-sm font-bold text-white hover:bg-[#4752C4]"
              >
                Aller aux imports membres
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          ) : (
            <div className="grid gap-4">
              {rows.map((row) => {
                const open = openMonth === row.month;
                const msgPct = (row.totalMessages / maxMonthMessages) * 100;
                const vocPct = (row.totalVoiceHours / maxMonthHours) * 100;
                return (
                  <div
                    key={row.month}
                    className={`overflow-hidden rounded-[1.35rem] border transition-all duration-300 ${
                      open
                        ? "border-[#5865F2]/45 bg-[#121725]/95 shadow-[0_0_40px_-12px_rgba(88,101,242,0.35)]"
                        : "border-white/[0.07] bg-[#10131c]/90 hover:border-white/15"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenMonth(open ? null : row.month)}
                      className="flex w-full flex-col gap-4 p-5 text-left md:flex-row md:items-center md:justify-between md:gap-6"
                    >
                      <div className="flex items-start gap-4">
                        <span
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition ${
                            open
                              ? "border-[#5865F2]/50 bg-[#5865F2]/20 text-[#b4b9ff]"
                              : "border-white/10 bg-black/30 text-gray-500"
                          }`}
                        >
                          <ChevronDown
                            className={`h-5 w-5 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
                            aria-hidden
                          />
                        </span>
                        <div>
                          <p className="font-mono text-xs text-gray-500">{row.month}</p>
                          <p className="text-lg font-bold capitalize text-white">{monthLabelFr(row.month)}</p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <span className="rounded-full bg-[#5865F2]/20 px-3 py-1 text-xs font-bold text-[#b4b9ff]">
                              {row.totalMessages.toLocaleString("fr-FR")} messages
                            </span>
                            <span className="rounded-full bg-violet-500/20 px-3 py-1 text-xs font-bold text-violet-200">
                              {row.totalVoiceHours.toFixed(1)} h vocal
                            </span>
                            {!row.hasSalonMessages && !row.hasSalonVocals && (
                              <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-gray-500">
                                Salons à ajouter
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex min-w-[200px] flex-1 flex-col gap-2 md:max-w-md">
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-gray-500">
                          <span className="w-24 text-[#5865F2]">Messages</span>
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-black/40">
                            <div
                              className="h-full rounded-full bg-[#5865F2] transition-all duration-500"
                              style={{ width: `${msgPct}%` }}
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-gray-500">
                          <span className="w-24 text-violet-400">Vocal</span>
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-black/40">
                            <div
                              className="h-full rounded-full bg-violet-500 transition-all duration-500"
                              style={{ width: `${vocPct}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </button>
                    {open && (
                      <div className="border-t border-white/[0.06] bg-black/20 px-5 py-6 md:px-8">
                        <div className="grid gap-6 lg:grid-cols-2">
                          <SalonBlock
                            title="Où la communauté écrit"
                            split={row.salonsMessages}
                            valueSuffix="msg"
                            accent={`linear-gradient(90deg, ${CHART_MSG}, #818cf8)`}
                          />
                          <SalonBlock
                            title="Où la communauté est en vocal"
                            split={row.salonsVocals}
                            valueSuffix="min"
                            accent={`linear-gradient(90deg, ${CHART_VOC}, #c4b5fd)`}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <DiscordSalonsImportModal
        isOpen={salonModal !== null}
        onClose={() => setSalonModal(null)}
        kind={salonModal || "messages"}
        month={importMonth}
        onImport={(payload) => handleSalonImport(salonModal || "messages", payload)}
      />
    </div>
  );
}

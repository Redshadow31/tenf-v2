"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  ChevronDown,
  Clock3,
  Compass,
  ExternalLink,
  Filter,
  Heart,
  History,
  PlusCircle,
  RefreshCw,
  Reply,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  XCircle,
} from "lucide-react";
import MemberSurface from "@/components/member/ui/MemberSurface";
import MemberPageHeader from "@/components/member/ui/MemberPageHeader";

type RaidEntry = {
  id: string;
  source: "manual" | "raids_sub";
  eventAt: string;
  targetLogin: string;
  targetLabel: string;
  viewers: number | null;
  raidStatus: "validated" | "pending" | "rejected";
  raidStatusLabel: string;
  pointsStatus: "awarded" | "pending";
  pointsStatusLabel: string;
  note: string | null;
};

type RaidHistoryResponse = {
  month: string;
  months: string[];
  entries: RaidEntry[];
  summary: {
    total: number;
    validated: number;
    pending: number;
    rejected: number;
    pointsAwarded: number;
    pointsPending: number;
  };
};

type RaidFilter = "all" | "validated" | "pending" | "rejected";

type ReturnPendingSuggestion = {
  login: string;
  label: string;
  receivedCount: number;
  lastReceivedAt: string;
};

type ReturnPendingMeta = {
  monthsScanned: number;
  uniqueRaidersReceived: number;
  pendingReturnTotal: number;
  truncated?: boolean;
  explanation?: string;
};

const TENF_VALUES = [
  {
    title: "Bienveillance active",
    description: "Chaque raid est un geste de soutien concret. On célèbre les efforts, pas la perfection.",
    icon: Heart,
    accent: "from-rose-500/20 to-violet-500/10",
    iconClass: "text-rose-400",
  },
  {
    title: "Ouverture et inclusion",
    description: "On valorise la diversité des styles, des tailles de chaîne et des parcours de streaming.",
    icon: Users,
    accent: "from-sky-500/20 to-indigo-500/10",
    iconClass: "text-sky-400",
  },
  {
    title: "Esprit de progression",
    description: "Un raid construit des ponts durables : découverte, entraide et évolution collective.",
    icon: Compass,
    accent: "from-amber-500/20 to-emerald-500/10",
    iconClass: "text-amber-400",
  },
] as const;

const RAID_GUIDELINES = [
  "Présenter la cible avec respect et contexte avant le raid.",
  "Encourager le chat à adopter une attitude positive et accueillante.",
  "Favoriser les créateurs peu raidés pour amplifier la solidarité TENF.",
  "Transformer chaque raid en opportunité de connexion humaine.",
];

const RECEIVED_RAID_GUIDELINES = [
  "Accueillir la communauté entrante avec un message chaleureux et inclusif.",
  "Prendre 20 secondes pour remercier publiquement le streamer raideur.",
  "Présenter l’univers de la chaîne sans surjouer : naturel, clair et authentique.",
  "Inviter les nouveaux à interagir sans pression et avec bienveillance.",
];

function getCurrentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonthLabel(key: string): string {
  const [, month] = key.split("-");
  const monthIndex = Number(month) - 1;
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
  const year = key.split("-")[0];
  return `${monthNames[monthIndex] || "Mois"} ${year}`;
}

function statusRaidBadge(status: RaidEntry["raidStatus"]) {
  if (status === "validated") {
    return { border: "rgba(52,211,153,0.45)", bg: "rgba(52,211,153,0.12)", color: "#34d399" };
  }
  if (status === "rejected") {
    return { border: "rgba(248,113,113,0.45)", bg: "rgba(248,113,113,0.12)", color: "#f87171" };
  }
  return { border: "rgba(250,204,21,0.45)", bg: "rgba(250,204,21,0.12)", color: "#facc15" };
}

function statusPointsBadge(status: RaidEntry["pointsStatus"]) {
  if (status === "awarded") {
    return { border: "rgba(96,165,250,0.45)", bg: "rgba(96,165,250,0.12)", color: "#93c5fd" };
  }
  return { border: "rgba(167,139,250,0.45)", bg: "rgba(167,139,250,0.12)", color: "#c4b5fd" };
}

function sourceBadge(source: RaidEntry["source"]) {
  if (source === "manual") {
    return {
      label: "Déclaration manuelle",
      short: "Manuel",
      border: "rgba(250,204,21,0.45)",
      bg: "rgba(250,204,21,0.12)",
      color: "#fde68a",
    };
  }
  return {
    label: "Raids-sub automatique",
    short: "Auto",
    border: "rgba(96,165,250,0.45)",
    bg: "rgba(96,165,250,0.12)",
    color: "#93c5fd",
  };
}

function raidCardClasses(status: RaidEntry["raidStatus"]) {
  if (status === "validated") {
    return "border-emerald-500/25 bg-gradient-to-br from-emerald-950/35 to-black/40 hover:border-emerald-500/40";
  }
  if (status === "rejected") {
    return "border-red-500/25 bg-gradient-to-br from-red-950/30 to-black/40 hover:border-red-500/35";
  }
  return "border-amber-500/25 bg-gradient-to-br from-amber-950/25 to-black/40 hover:border-amber-500/35";
}

function formatRaidDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function twitchChannelUrl(login: string): string | null {
  const clean = login.trim().toLowerCase();
  if (!clean || clean === "inconnu") return null;
  return `https://www.twitch.tv/${clean}`;
}

export default function MemberRaidHistoryPage() {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthKey);
  const [months, setMonths] = useState<string[]>([]);
  const [raids, setRaids] = useState<RaidEntry[]>([]);
  const [summary, setSummary] = useState<RaidHistoryResponse["summary"] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [raidFilter, setRaidFilter] = useState<RaidFilter>("all");
  const [expandedRaidId, setExpandedRaidId] = useState<string | null>(null);
  const [guidelineTab, setGuidelineTab] = useState<"outgoing" | "incoming">("outgoing");
  const [returnSuggestions, setReturnSuggestions] = useState<ReturnPendingSuggestion[]>([]);
  const [returnMeta, setReturnMeta] = useState<ReturnPendingMeta | null>(null);
  const [returnLoading, setReturnLoading] = useState(true);
  const [returnError, setReturnError] = useState("");

  const loadReturnSuggestions = useCallback(async () => {
    setReturnLoading(true);
    setReturnError("");
    try {
      const res = await fetch("/api/members/me/raid-suggestions/return-pending", { cache: "no-store" });
      const body = (await res.json()) as {
        suggestions?: ReturnPendingSuggestion[];
        meta?: ReturnPendingMeta;
        error?: string;
      };
      if (!res.ok) {
        throw new Error(body.error || "Impossible de charger les suggestions.");
      }
      setReturnSuggestions(body.suggestions || []);
      setReturnMeta(body.meta || null);
    } catch (e) {
      setReturnError(e instanceof Error ? e.message : "Erreur réseau.");
      setReturnSuggestions([]);
      setReturnMeta(null);
    } finally {
      setReturnLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadReturnSuggestions();
  }, [loadReturnSuggestions]);

  useEffect(() => {
    if (!selectedMonth) return;
    (async () => {
      setLoading(true);
      try {
        setError("");
        const response = await fetch(`/api/members/me/raids-history?month=${encodeURIComponent(selectedMonth)}`, {
          cache: "no-store",
        });
        const body = (await response.json()) as RaidHistoryResponse & { error?: string };
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Tu dois être connecté pour voir ton historique.");
          }
          if (response.status === 404) {
            throw new Error("Profil membre introuvable. Contacte un admin TENF.");
          }
          throw new Error(body.error || "Impossible de charger l'historique.");
        }
        setRaids(body.entries || []);
        setSummary(body.summary || null);
        setMonths(body.months || []);
        setExpandedRaidId(null);
        setRaidFilter("all");
      } finally {
        setLoading(false);
      }
    })().catch((e) => {
      setError(e instanceof Error ? e.message : "Erreur réseau.");
      setRaids([]);
      setSummary(null);
      setMonths([]);
    });
  }, [selectedMonth]);

  const monthOptions = months.length > 0 ? months : [selectedMonth];

  const filteredRaids = useMemo(() => {
    if (raidFilter === "all") return raids;
    return raids.filter((r) => r.raidStatus === raidFilter);
  }, [raids, raidFilter]);

  const toggleExpand = useCallback((id: string) => {
    setExpandedRaidId((prev) => (prev === id ? null : id));
  }, []);

  const validationRate = useMemo(() => {
    const t = summary?.total ?? 0;
    const v = summary?.validated ?? 0;
    if (t <= 0) return 0;
    return Math.round((v / t) * 100);
  }, [summary]);

  const filterButtons: { id: RaidFilter; label: string; count: number }[] = useMemo(
    () => [
      { id: "all", label: "Tous", count: summary?.total ?? raids.length },
      { id: "validated", label: "Validés", count: summary?.validated ?? 0 },
      { id: "pending", label: "En attente", count: summary?.pending ?? 0 },
      { id: "rejected", label: "Refusés", count: summary?.rejected ?? 0 },
    ],
    [summary, raids.length],
  );

  return (
    <MemberSurface>
      <MemberPageHeader
        title="Mes raids TENF"
        description="Retrouve chaque raid enregistré pour ton compte : validation staff, points d’engagement et source (déclaration ou automatique). Filtre par mois, comprends les statuts et garde le cap sur l’esprit bienveillant de la communauté."
        badge="Historique"
      />

      <div className="mb-6 flex flex-wrap gap-2">
        <Link
          href="/member/raids/declarer"
          className="inline-flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm font-semibold text-amber-100 transition hover:border-amber-400/50 hover:bg-amber-500/15"
        >
          <PlusCircle className="h-4 w-4 shrink-0" aria-hidden />
          Déclarer un raid
        </Link>
        <Link
          href="/member/raids/statistiques"
          className="inline-flex items-center gap-2 rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-2.5 text-sm font-semibold text-violet-100 transition hover:border-violet-400/45 hover:bg-violet-500/15"
        >
          <BarChart3 className="h-4 w-4 shrink-0" aria-hidden />
          Statistiques
          <ArrowRight className="h-4 w-4 opacity-70" aria-hidden />
        </Link>
      </div>

      <section
        className="relative mb-8 overflow-hidden rounded-3xl border p-5 shadow-2xl sm:p-8"
        style={{
          borderColor: "rgba(212, 175, 55, 0.38)",
          background:
            "radial-gradient(ellipse 80% 60% at 0% -10%, rgba(212,175,55,0.22), transparent 50%), radial-gradient(ellipse 50% 40% at 100% 0%, rgba(139,92,246,0.14), transparent 45%), linear-gradient(165deg, rgba(22,23,30,0.95), rgba(8,10,14,0.98))",
          boxShadow: "0 24px 48px rgba(0,0,0,0.35)",
        }}
      >
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-amber-200/90">
              <History className="h-3.5 w-3.5" aria-hidden />
              Espace raids
            </p>
            <h2 className="mt-2 text-balance text-2xl font-black text-white sm:text-3xl">Ton impact mois par mois</h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400">
              Les raids comptent pour l’engagement TENF : visibilité mutuelle, découverte de créateurs et points une fois validés. Choisis un mois
              ci-dessous pour explorer la timeline détaillée.
            </p>
            {summary && summary.total > 0 ? (
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <div className="rounded-xl border border-white/10 bg-black/35 px-4 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Taux validés / déclarés</p>
                  <p className="text-xl font-black tabular-nums text-white">{validationRate}%</p>
                </div>
                <p className="max-w-md text-xs text-zinc-500">
                  Indicatif sur le mois affiché : utile pour voir si des dossiers sont encore en revue staff.
                </p>
              </div>
            ) : null}
          </div>

          <div className="w-full shrink-0 lg:max-w-md">
            <label htmlFor="raid-month-select" className="mb-2 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Mois affiché
            </label>
            <div className="mb-3 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {monthOptions.map((m) => {
                const active = m === selectedMonth;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setSelectedMonth(m)}
                    className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                      active
                        ? "border-amber-400/50 bg-amber-500/20 text-amber-50 shadow-[0_0_20px_rgba(251,191,36,0.15)]"
                        : "border-white/10 bg-black/30 text-zinc-400 hover:border-white/20 hover:text-zinc-200"
                    }`}
                  >
                    {formatMonthLabel(m)}
                  </button>
                );
              })}
            </div>
            <select
              id="raid-month-select"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full cursor-pointer rounded-xl border border-white/12 bg-[#0a0c12]/95 px-3.5 py-3 text-sm text-zinc-100 transition focus:border-amber-500/40 focus:outline-none focus:ring-2 focus:ring-amber-500/15"
            >
              {monthOptions.map((month) => (
                <option key={month} value={month}>
                  {formatMonthLabel(month)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard
          label="Raids du mois"
          value={summary?.total ?? 0}
          icon={<Sparkles className="h-4 w-4 text-amber-300" />}
          gradient="from-amber-500/15 to-transparent"
        />
        <StatCard
          label="Validés"
          value={summary?.validated ?? 0}
          icon={<ShieldCheck className="h-4 w-4 text-emerald-400" />}
          gradient="from-emerald-500/15 to-transparent"
        />
        <StatCard
          label="En attente"
          value={summary?.pending ?? 0}
          icon={<Clock3 className="h-4 w-4 text-amber-400" />}
          gradient="from-amber-500/12 to-transparent"
        />
        <StatCard
          label="Refusés"
          value={summary?.rejected ?? 0}
          icon={<XCircle className="h-4 w-4 text-red-400" />}
          gradient="from-red-500/12 to-transparent"
        />
        <StatCard
          label="Points OK"
          value={summary?.pointsAwarded ?? 0}
          icon={<Target className="h-4 w-4 text-sky-400" />}
          gradient="from-sky-500/15 to-transparent"
        />
        <StatCard
          label="Points attente"
          value={summary?.pointsPending ?? 0}
          icon={<ShieldAlert className="h-4 w-4 text-violet-400" />}
          gradient="from-violet-500/15 to-transparent"
        />
      </section>

      <section className="mb-8 rounded-3xl border border-cyan-500/25 bg-gradient-to-br from-cyan-950/35 via-black/40 to-violet-950/20 p-5 sm:p-7">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-cyan-500/35 bg-cyan-500/15">
              <Reply className="h-5 w-5 text-cyan-300" aria-hidden />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Qui t’a soutenu·e — et à qui rendre la pareille ?</h3>
              <p className="mt-1 max-w-3xl text-sm leading-relaxed text-zinc-400">
                Chez TENF, un raid, c’est un geste fort entre créateurs. Sur environ{" "}
                <strong className="text-zinc-300">{returnMeta?.monthsScanned ?? "…"} mois</strong> d’historique communautaire, on repère les
                membres qui sont déjà venus sur <strong className="text-zinc-300">ta chaîne</strong> alors qu’aucun raid de ta part vers eux ne
                figure encore dans les données que nous suivons ensemble. Ce n’est ni une obligation ni un classement : simplement une invitation à
                la réciprocité et à la bienveillance, au même titre que tes autres stats raids.
              </p>
              {returnMeta?.uniqueRaidersReceived != null ? (
                <p className="mt-2 text-xs text-zinc-500">
                  Personnes différentes qui t’ont envoyé un raid sur cette période : {returnMeta.uniqueRaidersReceived}. Pour qui aucun retour
                  n’apparaît encore dans nos outils : {returnMeta.pendingReturnTotal}
                  {returnMeta.truncated ? ` — on t’en affiche ${returnSuggestions.length} pour garder la liste lisible.` : "."}
                </p>
              ) : null}
            </div>
          </div>
          <button
            type="button"
            onClick={() => void loadReturnSuggestions()}
            disabled={returnLoading}
            className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-xl border border-white/12 bg-black/35 px-4 py-2.5 text-sm font-semibold text-zinc-200 transition hover:bg-white/10 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${returnLoading ? "animate-spin" : ""}`} aria-hidden />
            Mettre à jour
          </button>
        </div>

        {returnError ? (
          <p className="rounded-xl border border-red-500/30 bg-red-950/25 px-4 py-3 text-sm text-red-200">{returnError}</p>
        ) : returnLoading ? (
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 w-36 animate-pulse rounded-full bg-white/10" />
            ))}
          </div>
        ) : returnSuggestions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 bg-black/25 px-4 py-10 text-center">
            <Sparkles className="mx-auto h-9 w-9 text-cyan-500/60" aria-hidden />
            <p className="mt-3 text-sm font-semibold text-zinc-200">Tout va bien de ce côté — ou la liste n’a pas encore assez d’infos</p>
            <p className="mx-auto mt-2 max-w-lg text-xs text-zinc-500">
              Peut-être as-tu déjà rendu des raids à celles et ceux qui t’ont soutenu·e, ou bien tout n’est pas encore remonté dans l’outil. Pour
              trouver d’autres chaînes à soutenir (par exemple des membres moins exposés aux raids ce mois-ci), passe aussi par la page dédiée.
            </p>
            <Link
              href="/member/raids/declarer"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-violet-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg hover:brightness-110"
            >
              Déclarer un raid vers quelqu’un <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {returnSuggestions.map((s) => {
              const last = new Date(s.lastReceivedAt);
              const lastLabel = Number.isNaN(last.getTime()) ? "—" : last.toLocaleDateString("fr-FR");
              const tw = twitchChannelUrl(s.login);
              return (
                <li
                  key={s.login}
                  className="flex min-w-[min(100%,280px)] flex-1 flex-col gap-2 rounded-2xl border border-white/10 bg-black/35 p-4 sm:min-w-[260px] sm:max-w-[320px]"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-white">{s.label}</p>
                    <p className="truncate text-xs text-zinc-500">@{s.login}</p>
                  </div>
                  <p className="text-xs text-zinc-400">
                    Est déjà passé·e sur ta chaîne <span className="font-semibold text-cyan-300/90">{s.receivedCount}</span> fois · dernier passage
                    : {lastLabel}
                  </p>
                  <div className="mt-auto flex flex-wrap gap-2 pt-1">
                    <Link
                      href={`/member/raids/declarer?cible=${encodeURIComponent(s.login)}`}
                      className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 px-3 py-2 text-center text-xs font-bold text-white hover:brightness-110 sm:flex-none"
                      title={`Préremplir une déclaration de raid vers ${s.label}`}
                    >
                      Préparer un raid retour <ArrowRight className="h-3 w-3" aria-hidden />
                    </Link>
                    {tw ? (
                      <a
                        href={tw}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1 rounded-xl border border-white/15 px-3 py-2 text-xs font-semibold text-zinc-300 hover:bg-white/10"
                      >
                        Twitch <ExternalLink className="h-3 w-3" aria-hidden />
                      </a>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {error ? (
        <section className="mb-8 rounded-2xl border border-red-500/35 bg-red-950/25 p-4">
          <p className="text-sm text-red-200">{error}</p>
        </section>
      ) : null}

      <section className="mb-8 grid gap-4 md:grid-cols-3">
        {TENF_VALUES.map((item) => {
          const Icon = item.icon;
          return (
            <article
              key={item.title}
              className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br ${item.accent} p-5 transition duration-300 hover:-translate-y-0.5 hover:border-violet-500/25 hover:shadow-lg hover:shadow-violet-900/10`}
            >
              <div
                className={`mb-3 inline-flex rounded-xl border border-white/10 bg-black/30 p-2.5 transition group-hover:border-white/20 ${item.iconClass}`}
              >
                <Icon className="h-5 w-5" aria-hidden />
              </div>
              <h3 className="text-base font-bold text-white">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">{item.description}</p>
            </article>
          );
        })}
      </section>

      <section className="mb-8 overflow-hidden rounded-2xl border border-white/10 bg-black/25">
        <div className="flex flex-wrap border-b border-white/10">
          <button
            type="button"
            onClick={() => setGuidelineTab("outgoing")}
            className={`flex flex-1 items-center justify-center gap-2 px-4 py-3 text-sm font-semibold transition sm:flex-none sm:justify-start sm:px-6 ${
              guidelineTab === "outgoing"
                ? "border-b-2 border-sky-400 bg-sky-500/10 text-sky-100"
                : "text-zinc-500 hover:bg-white/[0.03] hover:text-zinc-300"
            }`}
          >
            <Heart className="h-4 w-4 shrink-0" aria-hidden />
            Quand tu envoies un raid
          </button>
          <button
            type="button"
            onClick={() => setGuidelineTab("incoming")}
            className={`flex flex-1 items-center justify-center gap-2 px-4 py-3 text-sm font-semibold transition sm:flex-none sm:justify-start sm:px-6 ${
              guidelineTab === "incoming"
                ? "border-b-2 border-emerald-400 bg-emerald-500/10 text-emerald-100"
                : "text-zinc-500 hover:bg-white/[0.03] hover:text-zinc-300"
            }`}
          >
            <Users className="h-4 w-4 shrink-0" aria-hidden />
            Quand tu es raidé·e
          </button>
        </div>
        <div className="p-5 sm:p-6">
          {guidelineTab === "outgoing" ? (
            <>
              <p className="mb-4 text-sm text-zinc-400">
                Une ligne de conduite simple pour transmettre une énergie bienveillante à chaque raid sortant.
              </p>
              <ul className="grid gap-2 sm:grid-cols-2">
                {RAID_GUIDELINES.map((tip, i) => (
                  <li
                    key={tip}
                    className="flex gap-3 rounded-xl border border-sky-500/20 bg-sky-950/20 px-4 py-3 text-sm text-zinc-200 transition hover:border-sky-400/35"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sky-500/20 text-xs font-bold text-sky-300">
                      {i + 1}
                    </span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <>
              <p className="mb-4 text-sm text-zinc-400">
                Accueillir un raid, c’est accueillir des humains : quelques réflexes qui font la différence.
              </p>
              <ul className="grid gap-2 sm:grid-cols-2">
                {RECEIVED_RAID_GUIDELINES.map((tip, i) => (
                  <li
                    key={tip}
                    className="flex gap-3 rounded-xl border border-emerald-500/20 bg-emerald-950/20 px-4 py-3 text-sm text-zinc-200 transition hover:border-emerald-400/35"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-xs font-bold text-emerald-300">
                      {i + 1}
                    </span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-gradient-to-b from-[#12141c]/90 to-black/40 p-5 sm:p-7">
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-violet-500/30 bg-violet-500/15">
              <CalendarDays className="h-5 w-5 text-violet-300" aria-hidden />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Timeline du mois</h3>
              <p className="text-sm text-zinc-500">
                {loading ? "Chargement…" : `${filteredRaids.length} entrée${filteredRaids.length !== 1 ? "s" : ""} affichée${filteredRaids.length !== 1 ? "s" : ""}`}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              <Filter className="h-3.5 w-3.5" aria-hidden />
              Filtrer
            </span>
            {filterButtons.map((fb) => (
              <button
                key={fb.id}
                type="button"
                onClick={() => setRaidFilter(fb.id)}
                disabled={loading}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${
                  raidFilter === fb.id
                    ? "border-violet-400/50 bg-violet-500/20 text-violet-100"
                    : "border-white/10 bg-black/30 text-zinc-400 hover:border-white/18 hover:text-zinc-200"
                }`}
              >
                {fb.label}
                <span className="ml-1 tabular-nums opacity-70">({fb.count})</span>
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse rounded-2xl border border-white/8 bg-white/[0.04] p-4">
                <div className="h-4 w-1/3 rounded-lg bg-white/10" />
                <div className="mt-3 h-3 w-2/3 rounded bg-white/5" />
                <div className="mt-3 flex gap-2">
                  <div className="h-6 w-20 rounded-full bg-white/8" />
                  <div className="h-6 w-24 rounded-full bg-white/8" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredRaids.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 bg-black/30 px-6 py-12 text-center">
            <Sparkles className="mx-auto h-10 w-10 text-amber-400/80" aria-hidden />
            <p className="mt-4 text-base font-semibold text-white">
              {raids.length === 0 ? "Aucun raid sur cette période" : "Aucun raid pour ce filtre"}
            </p>
            <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500">
              {raids.length === 0
                ? "Quand tu enverras un raid (ou qu’un événement sera synchronisé), il apparaîtra ici avec son statut."
                : "Change de filtre ou consulte une autre catégorie pour voir tes entrées."}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                href="/member/raids/declarer"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg transition hover:brightness-110"
              >
                Déclarer un raid <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              {raidFilter !== "all" ? (
                <button
                  type="button"
                  onClick={() => setRaidFilter("all")}
                  className="rounded-xl border border-white/15 px-5 py-2.5 text-sm font-semibold text-zinc-300 hover:bg-white/5"
                >
                  Réinitialiser le filtre
                </button>
              ) : null}
            </div>
          </div>
        ) : (
          <ul className="space-y-3">
            {filteredRaids.map((raid, idx) => {
              const src = sourceBadge(raid.source);
              const expanded = expandedRaidId === raid.id;
              const twitchUrl = twitchChannelUrl(raid.targetLogin);
              return (
                <li key={raid.id}>
                  <article
                    className={`rounded-2xl border px-4 py-4 transition ${raidCardClasses(raid.raidStatus)} ${expanded ? "ring-1 ring-violet-500/25" : ""}`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleExpand(raid.id)}
                      className="flex w-full flex-col gap-3 text-left sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex min-w-0 flex-1 items-start gap-3">
                        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/40 text-xs font-bold text-zinc-500">
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-white">
                            {raid.targetLabel}{" "}
                            <span className="font-normal text-zinc-500">
                              ({raid.targetLogin || "login inconnu"})
                            </span>
                          </p>
                          <p className="mt-1 text-xs text-zinc-500">{formatRaidDate(raid.eventAt)}</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <span
                              className="rounded-full border px-2.5 py-0.5 text-[11px] font-semibold"
                              style={{
                                borderColor: src.border,
                                color: src.color,
                                backgroundColor: src.bg,
                              }}
                            >
                              {src.short}
                            </span>
                            {typeof raid.viewers === "number" ? (
                              <span className="rounded-full border border-white/10 bg-black/30 px-2.5 py-0.5 text-[11px] font-medium text-zinc-400">
                                ~{raid.viewers} viewers
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
                        <span
                          className="rounded-full border px-2.5 py-1 text-[11px] font-semibold"
                          style={{
                            borderColor: statusRaidBadge(raid.raidStatus).border,
                            color: statusRaidBadge(raid.raidStatus).color,
                            backgroundColor: statusRaidBadge(raid.raidStatus).bg,
                          }}
                        >
                          {raid.raidStatusLabel}
                        </span>
                        <ChevronDown
                          className={`h-5 w-5 text-zinc-500 transition-transform ${expanded ? "rotate-180" : ""}`}
                          aria-hidden
                        />
                      </div>
                    </button>

                    {expanded ? (
                      <div className="mt-4 border-t border-white/10 pt-4">
                        <div className="flex flex-wrap gap-2">
                          <span
                            className="rounded-full border px-2.5 py-1 text-[11px] font-semibold"
                            style={{
                              borderColor: statusPointsBadge(raid.pointsStatus).border,
                              color: statusPointsBadge(raid.pointsStatus).color,
                              backgroundColor: statusPointsBadge(raid.pointsStatus).bg,
                            }}
                          >
                            Points : {raid.pointsStatusLabel}
                          </span>
                          <span className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-zinc-400">{src.label}</span>
                        </div>
                        {raid.note ? (
                          <p className="mt-3 rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-sm text-zinc-300">
                            <span className="font-semibold text-zinc-400">Note staff : </span>
                            {raid.note}
                          </p>
                        ) : null}
                        <div className="mt-4 flex flex-wrap gap-2">
                          {twitchUrl ? (
                            <a
                              href={twitchUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 rounded-xl border border-violet-500/35 bg-violet-500/10 px-4 py-2 text-sm font-semibold text-violet-100 transition hover:bg-violet-500/20"
                            >
                              Chaîne Twitch <ExternalLink className="h-4 w-4" aria-hidden />
                            </a>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => toggleExpand(raid.id)}
                            className="rounded-xl border border-white/12 px-4 py-2 text-sm text-zinc-400 hover:bg-white/5"
                          >
                            Réduire
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </article>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </MemberSurface>
  );
}

function StatCard({
  label,
  value,
  icon,
  gradient,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  gradient: string;
}) {
  return (
    <article
      className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br ${gradient} to-black/50 p-4 transition hover:border-white/18 hover:shadow-md hover:shadow-black/20`}
    >
      <div className="mb-2 flex items-center gap-2 text-zinc-500">
        <span className="rounded-lg border border-white/10 bg-black/30 p-1.5">{icon}</span>
        <p className="text-[11px] font-semibold uppercase tracking-wide">{label}</p>
      </div>
      <p className="text-2xl font-black tabular-nums text-white">{value}</p>
    </article>
  );
}

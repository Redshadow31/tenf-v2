"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  ChevronDown,
  Clock3,
  Compass,
  ExternalLink,
  Filter,
  Gift,
  Heart,
  History,
  PlusCircle,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  XCircle,
  Zap,
} from "lucide-react";
import MemberSurface from "@/components/member/ui/MemberSurface";

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
  displayedCount?: number;
  sampleRandomized?: boolean;
  sampleMax?: number;
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
      label: "Tu l’as déclaré",
      short: "Déclaration",
      border: "rgba(250,204,21,0.45)",
      bg: "rgba(250,204,21,0.12)",
      color: "#fde68a",
    };
  }
  return {
    label: "Détecté pour toi",
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

function normalizeRaidSearch(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
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
  const [timelineQuery, setTimelineQuery] = useState("");

  const loadReturnSuggestions = useCallback(async () => {
    setReturnLoading(true);
    setReturnError("");
    try {
      const res = await fetch("/api/members/me/raid-suggestions/return-pending", {
        cache: "no-store",
        credentials: "include",
      });
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
          credentials: "include",
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
        setTimelineQuery("");
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
    let list = raidFilter === "all" ? raids : raids.filter((r) => r.raidStatus === raidFilter);
    const q = normalizeRaidSearch(timelineQuery);
    if (q) {
      list = list.filter(
        (r) =>
          normalizeRaidSearch(r.targetLabel).includes(q) ||
          normalizeRaidSearch(r.targetLogin || "").includes(q)
      );
    }
    return list;
  }, [raids, raidFilter, timelineQuery]);

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
      { id: "all", label: "Tout voir", count: summary?.total ?? raids.length },
      { id: "validated", label: "Validés", count: summary?.validated ?? 0 },
      { id: "pending", label: "En cours de vérif", count: summary?.pending ?? 0 },
      { id: "rejected", label: "Non retenus", count: summary?.rejected ?? 0 },
    ],
    [summary, raids.length],
  );

  const scrollToRaid = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <MemberSurface>
      <section
        id="raid-hero"
        className="relative mb-6 overflow-hidden rounded-2xl border px-5 py-6 shadow-[0_18px_45px_rgba(0,0,0,0.22)] sm:px-7 sm:py-7"
        style={{
          borderColor: "rgba(212,175,55,0.28)",
          background:
            "linear-gradient(145deg, rgba(212,175,55,0.14) 0%, rgba(22,18,35,0.92) 40%, rgba(10,12,18,0.96) 100%)",
        }}
      >
        <div className="pointer-events-none absolute -left-16 -top-10 h-40 w-40 rounded-full bg-amber-400/18 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 -right-8 h-36 w-36 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 max-w-2xl">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/35 bg-amber-500/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.11em] text-amber-100/95">
                <History className="h-3.5 w-3.5" aria-hidden />
                Tes raids
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-400/30 bg-violet-500/12 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-violet-100">
                <Heart className="h-3.5 w-3.5" aria-hidden />
                Communauté TENF
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-amber-300/30 bg-amber-500/15 text-amber-50">
                <Sparkles className="h-5 w-5" aria-hidden />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Ton historique de raids</h1>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-zinc-200 sm:text-[15px]">
              Ici tu retrouves <strong className="font-semibold text-amber-100/95">ce que tu as envoyé</strong> comme soutien à d’autres chaînes,
              mois par mois — sans jargon technique : juste les dates, les chaînes et où en est ta demande.
            </p>
            <p className="mt-2 text-sm text-violet-100/90">
              <Zap className="mr-1.5 inline-block h-3.5 w-3.5 align-[-0.12em] text-violet-300" aria-hidden />
              Plus bas : une petite sélection de personnes qui t’ont soutenu·e et vers qui tu n’as pas encore de raid retour enregistré chez nous — au
              hasard, pour rester léger.
            </p>
          </div>
          <div className="flex w-full shrink-0 flex-col gap-2 sm:flex-row lg:max-w-md lg:flex-col">
            <Link
              href="/member/raids/declarer"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-amber-400/35 bg-amber-500/15 px-4 py-3 text-sm font-semibold text-amber-50 transition hover:border-amber-300/50 hover:bg-amber-500/22"
            >
              <PlusCircle className="h-4 w-4 shrink-0" aria-hidden />
              Envoyer un raid
            </Link>
            <Link
              href="/member/raids/statistiques"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-violet-400/30 bg-violet-500/12 px-4 py-3 text-sm font-semibold text-violet-50 transition hover:border-violet-300/45 hover:bg-violet-500/18"
            >
              <BarChart3 className="h-4 w-4 shrink-0" aria-hidden />
              Voir mes stats
              <ArrowRight className="h-4 w-4 opacity-80" aria-hidden />
            </Link>
          </div>
        </div>
      </section>

      <nav
        aria-label="Accès rapide"
        className="sticky top-14 z-20 mb-6 flex flex-wrap gap-2 rounded-2xl border border-white/[0.08] bg-[#0c0e14]/80 p-2 shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur-md supports-[backdrop-filter]:bg-[#0c0e14]/65"
      >
        <button
          type="button"
          onClick={() => scrollToRaid("raid-month")}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-transparent bg-white/[0.04] px-3 py-2.5 text-xs font-semibold text-zinc-200 transition hover:border-amber-400/25 hover:bg-amber-500/10 hover:text-white sm:flex-none sm:px-4"
        >
          <CalendarDays className="h-3.5 w-3.5 text-amber-300" aria-hidden />
          Choisir le mois
        </button>
        <button
          type="button"
          onClick={() => scrollToRaid("raid-kpis")}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-transparent bg-white/[0.04] px-3 py-2.5 text-xs font-semibold text-zinc-200 transition hover:border-emerald-400/20 hover:bg-emerald-500/10 hover:text-white sm:flex-none sm:px-4"
        >
          <Target className="h-3.5 w-3.5 text-emerald-300" aria-hidden />
          Synthèse
        </button>
        <button
          type="button"
          onClick={() => scrollToRaid("raid-gratitude")}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-transparent bg-white/[0.04] px-3 py-2.5 text-xs font-semibold text-zinc-200 transition hover:border-cyan-400/25 hover:bg-cyan-500/10 hover:text-white sm:flex-none sm:px-4"
        >
          <Gift className="h-3.5 w-3.5 text-cyan-300" aria-hidden />
          Petits retours
        </button>
        <button
          type="button"
          onClick={() => scrollToRaid("raid-timeline")}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-transparent bg-white/[0.04] px-3 py-2.5 text-xs font-semibold text-zinc-200 transition hover:border-violet-400/25 hover:bg-violet-500/12 hover:text-white sm:flex-none sm:px-4"
        >
          <Search className="h-3.5 w-3.5 text-violet-300" aria-hidden />
          Liste & recherche
        </button>
      </nav>

      <section
        id="raid-month"
        className="relative mb-8 scroll-mt-[5.5rem] overflow-hidden rounded-3xl border p-5 shadow-2xl sm:p-8"
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
              Calendrier
            </p>
            <h2 className="mt-2 text-balance text-2xl font-black text-white sm:text-3xl">Quel mois veux-tu revoir ?</h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400">
              Glisse sur les pastilles ou ouvre le menu : tu vois tout ce qui est enregistré pour toi sur ce mois — les validations suivent leur cours,
              tu n’as rien à « forcer » depuis ici.
            </p>
            {summary && summary.total > 0 ? (
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <div className="rounded-xl border border-white/10 bg-black/35 px-4 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Part déjà validée</p>
                  <p className="text-xl font-black tabular-nums text-white">{validationRate}%</p>
                </div>
                <p className="max-w-md text-xs text-zinc-500">
                  Sur le mois affiché : une idée simple de combien de lignes sont déjà passées au vert côté équipe.
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

      <section
        id="raid-kpis"
        className="mb-8 scroll-mt-[5.5rem] grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6"
      >
        <StatCard
          label="Enregistrés ce mois"
          value={summary?.total ?? 0}
          icon={<Sparkles className="h-4 w-4 text-amber-300" />}
          gradient="from-amber-500/15 to-transparent"
        />
        <StatCard
          label="Déjà validés"
          value={summary?.validated ?? 0}
          icon={<ShieldCheck className="h-4 w-4 text-emerald-400" />}
          gradient="from-emerald-500/15 to-transparent"
        />
        <StatCard
          label="En vérification"
          value={summary?.pending ?? 0}
          icon={<Clock3 className="h-4 w-4 text-amber-400" />}
          gradient="from-amber-500/12 to-transparent"
        />
        <StatCard
          label="Non retenus"
          value={summary?.rejected ?? 0}
          icon={<XCircle className="h-4 w-4 text-red-400" />}
          gradient="from-red-500/12 to-transparent"
        />
        <StatCard
          label="Récompense OK"
          value={summary?.pointsAwarded ?? 0}
          icon={<Target className="h-4 w-4 text-sky-400" />}
          gradient="from-sky-500/15 to-transparent"
        />
        <StatCard
          label="Récompense en attente"
          value={summary?.pointsPending ?? 0}
          icon={<ShieldAlert className="h-4 w-4 text-violet-400" />}
          gradient="from-violet-500/15 to-transparent"
        />
      </section>

      <section
        id="raid-gratitude"
        className="mb-8 scroll-mt-[5.5rem] rounded-3xl border border-cyan-500/30 bg-gradient-to-br from-cyan-950/40 via-[#0f121c] to-violet-950/25 p-5 shadow-[0_18px_48px_rgba(0,0,0,0.28)] sm:p-7"
      >
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-cyan-500/35 bg-cyan-500/15 shadow-[0_0_24px_rgba(34,211,238,0.12)]">
              <Gift className="h-5 w-5 text-cyan-300" aria-hidden />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white sm:text-xl">Quelques idées de « merci » en raid</h3>
              <p className="mt-1 max-w-3xl text-sm leading-relaxed text-zinc-400">
                On te propose <strong className="text-cyan-100/95">au plus quatre noms</strong>, tirés au hasard parmi les personnes qui{" "}
                <strong className="text-zinc-200">t’ont déjà raidé·e</strong> et pour qui{" "}
                <strong className="text-zinc-200">aucun raid de toi vers elles</strong> n’apparaît encore dans nos données sur environ{" "}
                <strong className="text-zinc-300">{returnMeta?.monthsScanned ?? "…"} mois</strong>. Ce n’est pas une liste complète ni une obligation :
                juste une piste bienveillante. Actualise pour en voir d’autres si la liste est longue.
              </p>
              {returnMeta?.pendingReturnTotal != null ? (
                <p className="mt-2 text-xs text-zinc-500">
                  Personnes concernées (sans raid retour enregistré de ta part) :{" "}
                  <span className="font-semibold text-zinc-400">{returnMeta.pendingReturnTotal}</span>
                  {returnMeta.pendingReturnTotal > (returnMeta.sampleMax ?? 4)
                    ? ` — tu en vois ${returnSuggestions.length} ici.`
                    : returnMeta.pendingReturnTotal > 0
                      ? ` — affichage complet ce coup-ci.`
                      : "."}
                </p>
              ) : null}
            </div>
          </div>
          <button
            type="button"
            onClick={() => void loadReturnSuggestions()}
            disabled={returnLoading}
            title="Tirer un autre petit échantillon au hasard"
            className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-xl border border-cyan-400/25 bg-cyan-500/10 px-4 py-2.5 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/18 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${returnLoading ? "animate-spin" : ""}`} aria-hidden />
            Autres idées
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
              Soit tu as déjà renvoyé l’ascenseur à tout le monde côté données, soit tout n’est pas encore remonté chez nous. Tu peux quand même
              déclarer un raid depuis la page dédiée, vers qui tu veux.
            </p>
            <Link
              href="/member/raids/declarer"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-violet-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg hover:brightness-110"
            >
              Déclarer un raid vers quelqu’un <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {returnSuggestions.map((s) => {
              const last = new Date(s.lastReceivedAt);
              const lastLabel = Number.isNaN(last.getTime()) ? "—" : last.toLocaleDateString("fr-FR");
              const tw = twitchChannelUrl(s.login);
              return (
                <li
                  key={s.login}
                  className="flex min-w-0 flex-col gap-3 rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-black/50 to-cyan-950/20 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition hover:border-cyan-400/35 hover:shadow-[0_12px_28px_rgba(0,0,0,0.25)]"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-white">{s.label}</p>
                    <p className="truncate text-xs text-zinc-500">@{s.login}</p>
                  </div>
                  <p className="text-xs text-zinc-400">
                    Déjà venu·e sur ta chaîne <span className="font-semibold text-cyan-200/90">{s.receivedCount}</span> fois · dernier passage :{" "}
                    {lastLabel}
                  </p>
                  <div className="mt-auto flex flex-wrap gap-2 pt-1">
                    <Link
                      href={`/member/raids/declarer?cible=${encodeURIComponent(s.login)}`}
                      className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 px-3 py-2.5 text-center text-xs font-bold text-white shadow-md hover:brightness-110 sm:flex-none"
                      title={`Ouvrir la déclaration avec @${s.login} en cible`}
                    >
                      Dire merci en raid <ArrowRight className="h-3 w-3" aria-hidden />
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

      <section id="raid-values" className="mb-8 scroll-mt-[5.5rem] grid gap-4 md:grid-cols-3">
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

      <section className="mb-8 overflow-hidden rounded-2xl border border-white/10 bg-black/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
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

      <section
        id="raid-timeline"
        className="scroll-mt-[5.5rem] rounded-3xl border border-white/10 bg-gradient-to-b from-[#12141c]/90 to-black/40 p-5 shadow-[0_14px_40px_rgba(0,0,0,0.22)] sm:p-7"
      >
        <div className="mb-5 flex flex-col gap-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-violet-500/30 bg-violet-500/15">
                <CalendarDays className="h-5 w-5 text-violet-300" aria-hidden />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Tes envois du mois</h3>
                <p className="text-sm text-zinc-500">
                  {loading
                    ? "Chargement…"
                    : `${filteredRaids.length} ligne${filteredRaids.length !== 1 ? "s" : ""}${timelineQuery.trim() ? " avec ta recherche" : ""}`}
                </p>
              </div>
            </div>
            <div className="relative w-full min-w-0 lg:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" aria-hidden />
              <input
                type="search"
                value={timelineQuery}
                onChange={(e) => setTimelineQuery(e.target.value)}
                placeholder="Chercher une chaîne…"
                className="w-full rounded-xl border border-white/12 bg-black/40 py-2.5 pl-10 pr-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-violet-400/35 focus:outline-none focus:ring-2 focus:ring-violet-500/15"
                autoComplete="off"
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              <Filter className="h-3.5 w-3.5" aria-hidden />
              Statut
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
              {raids.length === 0
                ? "Aucun raid sur cette période"
                : timelineQuery.trim()
                  ? "Aucune chaîne ne correspond à ta recherche"
                  : "Aucune ligne pour ce filtre"}
            </p>
            <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500">
              {raids.length === 0
                ? "Dès que tu enverras un raid (ou qu’il sera pris en compte automatiquement), il apparaîtra ici."
                : timelineQuery.trim()
                  ? "Efface la recherche ou essaie un autre mot-clé."
                  : "Essaie un autre statut ou repasse sur « Tout voir »."}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                href="/member/raids/declarer"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg transition hover:brightness-110"
              >
                Envoyer un raid <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              {raidFilter !== "all" || timelineQuery.trim() ? (
                <button
                  type="button"
                  onClick={() => {
                    setRaidFilter("all");
                    setTimelineQuery("");
                  }}
                  className="rounded-xl border border-white/15 px-5 py-2.5 text-sm font-semibold text-zinc-300 hover:bg-white/5"
                >
                  Tout réafficher
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
                            Récompense : {raid.pointsStatusLabel}
                          </span>
                          <span className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-zinc-400">{src.label}</span>
                        </div>
                        {raid.note ? (
                          <p className="mt-3 rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-sm text-zinc-300">
                            <span className="font-semibold text-zinc-400">Message équipe : </span>
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
  icon: ReactNode;
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

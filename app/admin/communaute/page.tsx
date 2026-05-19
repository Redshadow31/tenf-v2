"use client";

import Image from "next/image";
import Link from "next/link";
import CommunauteHubWelcome from "@/components/admin/communaute/CommunauteHubWelcome";
import { COMUI, opsMetricTone, staffVerifyTone } from "@/components/admin/communaute/communaute-ui";
import { getDiscordUser } from "@/lib/discord";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import {
  Activity,
  ArrowRight,
  Cake,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  Compass,
  ExternalLink,
  Filter,
  HeartHandshake,
  LayoutList,
  ListOrdered,
  PartyPopper,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Zap,
} from "lucide-react";

const panelClass = COMUI.glassPanel;
const heroVisualClass =
  "relative isolate overflow-hidden rounded-2xl border border-violet-500/20 bg-zinc-950/70 ring-1 ring-inset ring-violet-500/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]";
const focusRingClass =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950";
const subtleButtonClass =
  "inline-flex min-h-[2.5rem] items-center gap-2 rounded-xl border border-violet-500/25 bg-violet-950/25 px-3 py-2 text-sm font-medium text-violet-100 transition hover:border-violet-400/40 hover:bg-violet-900/30";
const hubAnimationLogoClass =
  "h-[clamp(7rem,20vw,12rem)] w-auto max-w-[min(100%,32rem)] object-contain object-center drop-shadow-[0_12px_40px_rgba(0,0,0,0.55)] sm:max-w-[38rem] lg:h-[clamp(9rem,24vw,15rem)] lg:max-w-[min(50vw,28rem)] xl:h-[clamp(10rem,26vw,17rem)] lg:object-left";

type PillarCategory = "events" | "engagement" | "anniversaires";

type Pillar = {
  href: string;
  label: string;
  description: string;
  staffTip: string;
  memberAngle: string;
  tags: string[];
  icon: typeof CalendarDays;
  category: PillarCategory;
};

const pillars: Pillar[] = [
  {
    href: "/admin/communaute/evenements",
    label: "Événements",
    description: "Planifier, suivre et récapituler les rendez-vous communautaires.",
    staffTip:
      "Gardez un fil unique entre annonce, lien vocal et suivi post-événement : les membres s’y repèrent quand c’est prévisible.",
    memberAngle: "Moments partagés, visibilité des prochains lives et réunions.",
    tags: ["Pilotage", "Suivi"],
    icon: PartyPopper,
    category: "events",
  },
  {
    href: "/admin/communaute/engagement",
    label: "Engagement",
    description: "Suivre les raids, les points, le follow et les signaux d’entraide.",
    staffTip:
      "Priorisez les files avec impact visible côté chaîne (raids, signalements) avant les ajustements de configuration.",
    memberAngle: "Reconnaissance du soutien mutuel (hosts, présence).",
    tags: ["Données", "À contrôler"],
    icon: Activity,
    category: "engagement",
  },
  {
    href: "/admin/communaute/anniversaires",
    label: "Anniversaires",
    description: "Valoriser les membres et préparer les rappels communautaires.",
    staffTip:
      "Synchronisez annonces Discord et rappels staff pour éviter les doublons ou les oublis sur les profils sensibles.",
    memberAngle: "Petites attentions qui renforcent l’appartenance à TENF.",
    tags: ["Reconnaissance", "Suivi"],
    icon: Cake,
    category: "anniversaires",
  },
];

type QuickLinkTag = "Événement" | "Raids" | "Points" | "Follow" | "Reconnaissance" | "Spotlight";

type QuickLink = {
  href: string;
  label: string;
  hint: string;
  tag: QuickLinkTag;
  category: PillarCategory | "raids";
};

const quickLinks: QuickLink[] = [
  {
    href: "/admin/communaute/evenements",
    label: "Événements",
    hint: "Pilotage calendrier, participation et archives",
    tag: "Événement",
    category: "events",
  },
  {
    href: "/admin/communaute/evenements/recap",
    label: "Récap événements",
    hint: "Clôturer et capitaliser après un temps fort",
    tag: "Événement",
    category: "events",
  },
  {
    href: "/admin/communaute/engagement",
    label: "Engagement",
    hint: "Vue d’ensemble follow, raids et points",
    tag: "Follow",
    category: "engagement",
  },
  {
    href: "/admin/communaute/engagement/raids-fiabilite",
    label: "Raids & fiabilité",
    hint: "EventSub, signalements et historique consolidé",
    tag: "Raids",
    category: "raids",
  },
  {
    href: "/admin/communaute/engagement/signalements-raids",
    label: "Signalements raids",
    hint: "File manuelle quand EventSub ou le membre signale un écart",
    tag: "Raids",
    category: "raids",
  },
  {
    href: "/admin/communaute/engagement/historique-raids",
    label: "Historique raids",
    hint: "Audit et volumes sur la durée",
    tag: "Raids",
    category: "raids",
  },
  {
    href: "/admin/communaute/engagement/points-discord",
    label: "Points Discord",
    hint: "Attribution après vérification des données raids",
    tag: "Points",
    category: "engagement",
  },
  {
    href: "/admin/communaute/engagement/follow",
    label: "Follow réseau",
    hint: "Suivi global des feuilles staff",
    tag: "Follow",
    category: "engagement",
  },
  {
    href: "/admin/communaute/anniversaires/mois",
    label: "Anniversaires",
    hint: "Vue du mois pour la modération",
    tag: "Reconnaissance",
    category: "anniversaires",
  },
  {
    href: "/admin/communaute/evenements/spotlight",
    label: "Spotlight",
    hint: "Pilotage opérationnel des cycles spotlight",
    tag: "Spotlight",
    category: "events",
  },
];

const staffVerificationItems = [
  {
    href: "/admin/communaute/engagement/raids-fiabilite",
    title: "Raids & signalements",
    body: "Vérifier les écarts entre EventSub, signalements membres et historique.",
    tone: staffVerifyTone.rose,
  },
  {
    href: "/admin/communaute/engagement/points-discord",
    title: "Points Discord",
    body: "Attribution des points après vérification des données.",
    tone: staffVerifyTone.emerald,
  },
  {
    href: "/admin/communaute/evenements",
    title: "Événements & présences",
    body: "Contrôler les événements, présences et récapitulatifs.",
    tone: staffVerifyTone.sky,
  },
  {
    href: "/admin/communaute/anniversaires",
    title: "Anniversaires & reconnaissance",
    body: "Préparer les attentions communautaires et valorisations.",
    tone: staffVerifyTone.amber,
  },
];

type AggregateResponse = {
  success?: boolean;
  data?: {
    ops?: {
      raidsPendingCount?: number;
      discordPointsPendingCount?: number;
      raidsIgnoredToProcessCount?: number;
      followOverdueStaffNames?: string[];
    };
    recap?: {
      upcomingKpis?: {
        pendingEventValidations?: number;
        upcomingSpotlights?: number;
      };
    };
  };
};

type OpsSignals = {
  loading: boolean;
  error: string | null;
  loaded: boolean;
  raidsPendingCount: number;
  discordPointsPendingCount: number;
  raidsIgnoredToProcessCount: number;
  followOverdueCount: number;
  pendingEventValidations: number;
  upcomingSpotlights: number;
};

const opsMetricLinks = [
  {
    key: "raidsPendingCount" as const,
    label: "Raids à traiter",
    href: "/admin/communaute/engagement/signalements-raids",
    tone: opsMetricTone.rose,
  },
  {
    key: "raidsIgnoredToProcessCount" as const,
    label: "Raids ignorés à revoir",
    href: "/admin/communaute/engagement/raids-eventsub",
    tone: opsMetricTone.amber,
  },
  {
    key: "discordPointsPendingCount" as const,
    label: "Points Discord en attente",
    href: "/admin/communaute/engagement/points-discord",
    tone: opsMetricTone.emerald,
  },
  {
    key: "followOverdueCount" as const,
    label: "Retards follow (staff)",
    href: "/admin/communaute/engagement/follow",
    tone: opsMetricTone.cyan,
  },
  {
    key: "pendingEventValidations" as const,
    label: "Événements à valider",
    href: "/admin/communaute/evenements",
    tone: opsMetricTone.indigo,
  },
  {
    key: "upcomingSpotlights" as const,
    label: "Spotlights à venir",
    href: "/admin/communaute/evenements/spotlight",
    tone: opsMetricTone.violet,
  },
];

function tagPillClass(tag: QuickLinkTag): string {
  const base = "rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide";
  if (tag === "Raids") return `${base} border-rose-400/30 bg-rose-500/10 text-rose-200`;
  if (tag === "Points") return `${base} border-emerald-400/30 bg-emerald-500/10 text-emerald-200`;
  if (tag === "Follow") return `${base} border-cyan-400/30 bg-cyan-500/10 text-cyan-200`;
  if (tag === "Reconnaissance") return `${base} border-amber-400/30 bg-amber-500/10 text-amber-200`;
  if (tag === "Spotlight") return `${base} border-fuchsia-400/30 bg-fuchsia-500/10 text-fuchsia-200`;
  return `${base} border-indigo-400/30 bg-indigo-500/10 text-indigo-200`;
}

type FilterKey = "all" | PillarCategory | "raids";

const journeySteps = [
  {
    n: "1",
    title: "Prioriser",
    body: "Commencer par « Ce que le staff doit vérifier » et les signaux ops si disponibles.",
  },
  {
    n: "2",
    title: "Ouvrir",
    body: "Entrer dans le pôle concerné (événements, engagement, anniversaires, raids).",
  },
  {
    n: "3",
    title: "Agir",
    body: "Valider, corriger les données et documenter si besoin pour l’équipe.",
  },
  {
    n: "4",
    title: "Boucler",
    body: "Partager un court recap staff pour aligner la prochaine vague.",
  },
];

const CHECKLIST_KEY = "tenf-admin-communaute-hub-checklist-v1";
const checklistItems = [
  { id: "raids", label: "Passage pilier raids (fiabilité, signalements ou historique)" },
  { id: "calendar", label: "Cohérence calendrier public ↔ annonces Discord" },
  { id: "follow", label: "File follow : rien en retard côté validation staff" },
  { id: "birthdays", label: "Anniversaires du mois relus pour éviter les doublons" },
];

const RAIDS_BASE = "/admin/communaute/engagement";

export default function CommunauteDashboardPage() {
  const polesId = useId();
  const quickId = useId();
  const staffCheckId = useId();
  const [filter, setFilter] = useState<FilterKey>("all");
  const [expandedHref, setExpandedHref] = useState<string | null>(null);
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [checklistHydrated, setChecklistHydrated] = useState(false);
  const [opsRefreshKey, setOpsRefreshKey] = useState(0);
  const [username, setUsername] = useState("");
  const [ops, setOps] = useState<OpsSignals>({
    loading: true,
    error: null,
    loaded: false,
    raidsPendingCount: 0,
    discordPointsPendingCount: 0,
    raidsIgnoredToProcessCount: 0,
    followOverdueCount: 0,
    pendingEventValidations: 0,
    upcomingSpotlights: 0,
  });
  const polesRef = useRef<HTMLDivElement>(null);
  const quickRef = useRef<HTMLDivElement>(null);
  const staffCheckRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void getDiscordUser()
      .then((user) => setUsername(user?.username ?? ""))
      .catch(() => setUsername(""));
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CHECKLIST_KEY);
      if (raw) setChecklist(JSON.parse(raw) as Record<string, boolean>);
    } catch {
      /* ignore */
    }
    setChecklistHydrated(true);
  }, []);

  useEffect(() => {
    if (!checklistHydrated) return;
    try {
      localStorage.setItem(CHECKLIST_KEY, JSON.stringify(checklist));
    } catch {
      /* ignore */
    }
  }, [checklist, checklistHydrated]);

  useEffect(() => {
    let cancelled = false;
    async function loadOps() {
      setOps((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const res = await fetch("/api/admin/dashboard/aggregate", { cache: "no-store" });
        if (!res.ok) {
          throw new Error(`Indicateurs indisponibles (${res.status})`);
        }
        const json = (await res.json()) as AggregateResponse;
        if (cancelled) return;
        const opsData = json.data?.ops;
        const kpis = json.data?.recap?.upcomingKpis;
        setOps({
          loading: false,
          error: null,
          loaded: true,
          raidsPendingCount: Number(opsData?.raidsPendingCount ?? 0),
          discordPointsPendingCount: Number(opsData?.discordPointsPendingCount ?? 0),
          raidsIgnoredToProcessCount: Number(opsData?.raidsIgnoredToProcessCount ?? 0),
          followOverdueCount: Array.isArray(opsData?.followOverdueStaffNames)
            ? opsData.followOverdueStaffNames.length
            : 0,
          pendingEventValidations: Number(kpis?.pendingEventValidations ?? 0),
          upcomingSpotlights: Number(kpis?.upcomingSpotlights ?? 0),
        });
      } catch (error) {
        if (cancelled) return;
        setOps((prev) => ({
          ...prev,
          loading: false,
          loaded: false,
          error: error instanceof Error ? error.message : "Erreur inconnue",
        }));
      }
    }
    void loadOps();
    return () => {
      cancelled = true;
    };
  }, [opsRefreshKey]);

  const filteredPillars = useMemo(() => {
    if (filter === "all" || filter === "raids") return pillars;
    return pillars.filter((p) => p.category === filter);
  }, [filter]);

  const filteredQuick = useMemo(() => {
    if (filter === "all") return quickLinks;
    if (filter === "raids") return quickLinks.filter((q) => q.category === "raids");
    return quickLinks.filter((q) => q.category === filter);
  }, [filter]);

  const checklistDone = useMemo(
    () => checklistItems.filter((i) => checklist[i.id]).length,
    [checklist]
  );

  const hasOpsSignals = useMemo(
    () =>
      ops.loaded &&
      [
        ops.raidsPendingCount,
        ops.discordPointsPendingCount,
        ops.raidsIgnoredToProcessCount,
        ops.followOverdueCount,
        ops.pendingEventValidations,
        ops.upcomingSpotlights,
      ].some((v) => v > 0),
    [ops]
  );

  const opsPendingTotal = useMemo(() => {
    if (!ops.loaded || ops.loading) return null;
    return (
      ops.raidsPendingCount +
      ops.discordPointsPendingCount +
      ops.raidsIgnoredToProcessCount +
      ops.followOverdueCount +
      ops.pendingEventValidations +
      ops.upcomingSpotlights
    );
  }, [ops]);

  const scrollToPoles = useCallback(() => {
    polesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const scrollToQuick = useCallback(() => {
    quickRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const scrollToStaffCheck = useCallback(() => {
    staffCheckRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const toggleExpand = (href: string) => {
    setExpandedHref((h) => (h === href ? null : href));
  };

  const toggleCheck = (id: string) => {
    setChecklist((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="relative isolate min-w-0 scroll-smooth pb-12 text-white selection:bg-violet-500/35 [--com-gap:clamp(1rem,1.55vw,1.85rem)]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-[max(-4rem,calc(-6vw))] top-[-3rem] -z-10 h-[clamp(260px,35vw,480px)] overflow-hidden blur-3xl"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_24%_-10%,rgba(167,139,250,0.3),transparent_54%),radial-gradient(ellipse_at_86%_22%,rgba(244,114,182,0.12),transparent_48%),radial-gradient(ellipse_at_52%_100%,rgba(56,189,248,0.1),transparent_52%)]" />
      </div>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 -z-20 h-[min(820px,100vh)]"
        style={{
          backgroundImage:
            "linear-gradient(104deg,rgba(255,255,255,0.032) 0px,rgba(255,255,255,0.032) 1px,transparent 1px,transparent 74px)",
          backgroundSize: "clamp(54px,4.2vw,72px) 100%",
          opacity: 0.21,
          maskImage: "linear-gradient(180deg,black 0%,transparent 78%)",
        }}
      />

      <div className="mx-auto w-full max-w-[min(1680px,calc(100vw-2*clamp(0.6rem,1.75vw,1.75rem)))] px-[clamp(0.75rem,2vw,2.35rem)] pb-12 pt-2 sm:pt-3">
        <div className="grid min-w-0 grid-cols-1 gap-6 [--sidebar:min(100%,clamp(17rem,24vw,25rem))] xl:grid-cols-[minmax(0,1fr)_var(--sidebar)] xl:items-start xl:gap-[clamp(1.35rem,2.6vw,2.85rem)]">
          <main className="min-w-0 space-y-6 sm:space-y-8 xl:space-y-[var(--com-gap)]">
            <header
              className={`grid min-w-0 gap-6 p-[clamp(1rem,2vw,1.6rem)] lg:grid-cols-[minmax(0,1.65fr)_minmax(240px,min(100%,0.88fr))] lg:gap-8 xl:grid-cols-[minmax(0,1.75fr)_minmax(260px,min(100%,0.9fr))] ${panelClass}`}
            >
              <div className="min-w-0 space-y-4">
                <Link
                  href="/admin/pilotage"
                  className={`inline-flex items-center gap-1 text-[length:clamp(0.8rem,0.74rem+0.32vw,0.9375rem)] text-zinc-400 transition hover:text-white ${focusRingClass} rounded-lg`}
                >
                  <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden />
                  Retour au pilotage serveur
                </Link>
                <div className="grid grid-cols-1 items-center gap-5 sm:gap-6 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-start lg:gap-6 xl:gap-8">
                  <div className="flex shrink-0 justify-center lg:justify-start">
                    <Image
                      src="/images/communaute/hub-animation-logo.png"
                      alt="Animation et engagement — Hub TENF"
                      width={1024}
                      height={1024}
                      priority
                      unoptimized
                      className={hubAnimationLogoClass}
                    />
                  </div>
                  <div className="min-w-0 space-y-4">
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[length:clamp(0.65rem,0.58rem+0.25vw,0.6875rem)] font-semibold uppercase tracking-[0.11em] text-zinc-200/90">
                    <PartyPopper className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    Hub animation TENF
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-400/26 bg-violet-500/[0.1] px-3 py-1 text-[length:clamp(0.65rem,0.58rem+0.25vw,0.6875rem)] font-semibold uppercase tracking-[0.11em] text-violet-100/92">
                    <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    Orientation staff
                  </span>
                </div>
                <div>
                  <p className="text-[length:clamp(0.6875rem,0.625rem+0.25vw,0.8125rem)] uppercase tracking-[0.12em] text-violet-200/95">
                    Animation & engagement
                  </p>
                  <div className="mt-3">
                    <CommunauteHubWelcome username={username} hasOpsSignals={hasOpsSignals} />
                  </div>
                </div>
                <div className="flex min-w-0 flex-wrap gap-[clamp(0.4rem,0.85vw,0.625rem)]">
                  <button type="button" onClick={scrollToStaffCheck} className={`${subtleButtonClass} ${focusRingClass}`}>
                    <ShieldAlert className="h-4 w-4 shrink-0" aria-hidden />
                    À vérifier
                  </button>
                  <button type="button" onClick={scrollToPoles} className={`${subtleButtonClass} ${focusRingClass}`}>
                    <LayoutList className="h-4 w-4 shrink-0" aria-hidden />
                    Les trois pôles
                  </button>
                  <button
                    type="button"
                    onClick={scrollToQuick}
                    className={`${subtleButtonClass} ${focusRingClass} border-sky-500/25 bg-sky-950/25 text-sky-100`}
                  >
                    <Zap className="h-4 w-4 shrink-0" aria-hidden />
                    Accès rapides
                  </button>
                  <Link
                    href="/member/evenements"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${subtleButtonClass} ${focusRingClass} border-emerald-500/25 bg-emerald-950/25 text-emerald-100`}
                  >
                    <ExternalLink className="h-4 w-4 shrink-0" aria-hidden />
                    Aperçu membre
                  </Link>
                </div>
                  </div>
                </div>
              </div>
              <div className={`relative min-h-[11rem] p-[clamp(0.875rem,1.5vw,1.2rem)] sm:min-h-[12rem] ${heroVisualClass}`}>
                <div
                  aria-hidden
                  className="absolute inset-0 bg-[conic-gradient(from_200deg_at_72%_-10%,rgba(167,139,250,0.16),transparent_42%,transparent_58%,rgba(244,114,182,0.1))]"
                />
                <div
                  aria-hidden
                  className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.12),transparent_40%,transparent_65%,rgba(0,0,0,0.32))]"
                />
                <div className="relative flex h-full min-h-[10rem] flex-col justify-between gap-4">
                  <span className="inline-flex w-fit items-center gap-2 rounded-xl border border-violet-400/26 bg-violet-500/[0.11] px-3 py-1.5 text-[length:clamp(0.65rem,0.55rem+0.35vw,0.7rem)] font-semibold uppercase tracking-[0.08em] text-violet-50/96">
                    <Sparkles className="h-3.5 w-3.5 shrink-0 text-violet-200/92" aria-hidden />
                    Synthèse
                  </span>
                  <dl className="grid min-w-0 grid-cols-3 gap-[clamp(0.45rem,0.9vw,0.65rem)] text-[length:clamp(0.65rem,0.58rem+0.22vw,0.775rem)]">
                    <div className="rounded-xl border border-white/[0.08] bg-zinc-900/52 p-[clamp(0.45rem,0.85vw,0.55rem)] text-center">
                      <dt className="font-medium uppercase tracking-wide text-zinc-500">Pôles</dt>
                      <dd className="mt-1 text-[clamp(1.05rem,0.88rem+0.45vw,1.45rem)] font-semibold tabular-nums text-zinc-50">
                        3
                      </dd>
                    </div>
                    <div className="rounded-xl border border-white/[0.08] bg-zinc-900/52 p-[clamp(0.45rem,0.85vw,0.55rem)] text-center">
                      <dt className="font-medium uppercase tracking-wide text-zinc-500">Raccourcis</dt>
                      <dd className="mt-1 text-[clamp(1.05rem,0.88rem+0.45vw,1.45rem)] font-semibold tabular-nums text-sky-200/95">
                        {quickLinks.length}
                      </dd>
                    </div>
                    <div className="rounded-xl border border-white/[0.08] bg-zinc-900/52 p-[clamp(0.45rem,0.85vw,0.55rem)] text-center">
                      <dt className="font-medium uppercase tracking-wide text-zinc-500">Ops Σ</dt>
                      <dd className="mt-1 text-[clamp(1.05rem,0.88rem+0.45vw,1.45rem)] font-semibold tabular-nums text-amber-200/95">
                        {opsPendingTotal ?? "—"}
                      </dd>
                    </div>
                  </dl>
                  <p className="text-[length:clamp(0.65rem,0.58rem+0.2vw,0.75rem)] leading-snug text-zinc-500">
                    Signaux actifs :{" "}
                    <span className="font-semibold text-zinc-200">{hasOpsSignals ? "oui" : "non"}</span>
                    <span className="mx-1.5 text-zinc-600">·</span>
                    Checklist :{" "}
                    <span className="font-medium tabular-nums text-zinc-300">
                      {checklistDone}/{checklistItems.length}
                    </span>
                  </p>
                </div>
              </div>
            </header>

      {/* KPI honnêtes */}
      <section className="space-y-3" aria-label="Repères du hub">
        <p className={COMUI.sectionLabel}>Repères du hub</p>
        <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <button
          type="button"
          onClick={scrollToPoles}
          className={`${COMUI.kpiCard} hover:border-violet-400/35 ${focusRingClass}`}
        >
          <span className={COMUI.kpiAccentViolet} aria-hidden />
          <p className={COMUI.kpiLabel}>Pôles d’animation</p>
          <p className={`${COMUI.kpiValue} text-zinc-100`}>3 pôles</p>
          <p className={COMUI.kpiDesc}>Événements, engagement, anniversaires</p>
        </button>
        <button
          type="button"
          onClick={scrollToQuick}
          className={`${COMUI.kpiCard} hover:border-sky-400/35 ${focusRingClass}`}
        >
          <span className={COMUI.kpiAccentSky} aria-hidden />
          <p className={COMUI.kpiLabel}>Accès rapides</p>
          <p className={`${COMUI.kpiValue} text-sky-200/95`}>{quickLinks.length}</p>
          <p className={COMUI.kpiDesc}>Liens directs vers les écrans les plus utilisés</p>
        </button>
        <button
          type="button"
          onClick={scrollToStaffCheck}
          className={`${COMUI.kpiCard} hover:border-amber-400/35 ${focusRingClass}`}
        >
          <span className={COMUI.kpiAccentAmber} aria-hidden />
          <p className={COMUI.kpiLabel}>Raccourcis prioritaires</p>
          <p className={`${COMUI.kpiValue} text-amber-100/95`}>{staffVerificationItems.length} zones</p>
          <p className={COMUI.kpiDesc}>À contrôler régulièrement — pas d’alerte temps réel</p>
        </button>
        <article className={`${COMUI.kpiCard} hover:border-zinc-400/25`}>
          <span className={COMUI.kpiAccentZinc} aria-hidden />
          <p className={COMUI.kpiLabel}>Vue d’orientation</p>
          <p className={`${COMUI.kpiValue} text-base text-zinc-200`}>Hub racine</p>
          <p className={COMUI.kpiDesc}>
            Ouvre les écrans métier ; ne remplace pas les cockpits raids ou points.
          </p>
        </article>
        </div>
      </section>

      {/* Signaux ops réels */}
      <section className={`${panelClass} min-w-0 p-4 sm:p-5`} aria-label="Signaux opérationnels">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/[0.06] pb-4">
          <div>
            <p className={COMUI.sectionLabel}>Tableau de bord</p>
            <h2 className={`mt-1.5 ${COMUI.sectionTitle}`}>Signaux ops</h2>
            <p className={COMUI.sectionLead}>
              Données issues de <span className="font-medium text-zinc-300">/api/admin/dashboard/aggregate</span>{" "}
              lorsque disponibles. Zéro affiché = file vide, pas une métrique inventée.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpsRefreshKey((k) => k + 1)}
            disabled={ops.loading}
            className={`inline-flex min-h-[2.35rem] items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.05] px-3.5 py-2 text-xs font-medium text-zinc-200 backdrop-blur-md transition hover:bg-white/[0.1] disabled:opacity-50 ${focusRingClass}`}
            aria-label="Actualiser les signaux ops du tableau de bord"
          >
            <RefreshCw className={`h-3.5 w-3.5 shrink-0 ${ops.loading ? "animate-spin" : ""}`} aria-hidden />
            Actualiser
          </button>
        </div>
        {ops.loading ? (
          <p className="mt-3 text-sm text-zinc-500" role="status" aria-live="polite">
            Chargement des signaux ops…
          </p>
        ) : null}
        {ops.error ? (
          <p className="mt-3 text-sm text-amber-200/90" role="status">
            {ops.error} — utilisez les raccourcis ci-dessous.
          </p>
        ) : null}
        {!ops.loading && ops.loaded && !hasOpsSignals ? (
          <p className="mt-3 text-sm text-emerald-200/90" role="status">
            Aucun signal ops en attente détecté pour l’instant (tous les compteurs à zéro).
          </p>
        ) : null}
        {ops.loaded && !ops.loading ? (
          <div className="mt-4 grid min-w-0 grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
            {opsMetricLinks.map((metric) => {
              const value = ops[metric.key];
              return (
                <Link
                  key={metric.key}
                  href={metric.href}
                  className={`${COMUI.opsMetricBase} ${metric.tone} ${focusRingClass} ${typeof value === "number" && value > 0 ? "ring-1 ring-white/10" : ""}`}
                  aria-label={`${metric.label} : ${value}`}
                >
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-300/90">{metric.label}</p>
                  <p className="mt-1.5 text-[clamp(1.15rem,0.95rem+0.45vw,1.4rem)] font-bold tabular-nums">{value}</p>
                </Link>
              );
            })}
          </div>
        ) : null}
      </section>

      {/* Pilier Raids & fiabilité */}
      <section className={COMUI.featuredPillar} aria-labelledby="raids-pillar-heading">
        <div className={COMUI.featuredPillarGlow} aria-hidden />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 max-w-2xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-rose-200/95">Pilier prioritaire</p>
            <h2 id="raids-pillar-heading" className="mt-2 text-xl font-semibold tracking-tight text-white sm:text-2xl">
              Raids & fiabilité
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-300/90">
              Vérifier les raids détectés, les signalements membres et l’historique avant d’attribuer ou corriger des points.
            </p>
          </div>
          <Link href={`${RAIDS_BASE}/raids-fiabilite`} className={`${COMUI.btnPrimary} ${focusRingClass}`}>
            Ouvrir le pilier raids
            <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
          </Link>
        </div>
        <div className="relative mt-5 flex min-w-0 flex-wrap gap-2">
          <Link href={`${RAIDS_BASE}/raids-eventsub`} className={`${COMUI.chipLink} ${focusRingClass}`}>
            EventSub
          </Link>
          <Link href={`${RAIDS_BASE}/signalements-raids`} className={`${COMUI.chipLink} ${focusRingClass}`}>
            Signalements
          </Link>
          <Link href={`${RAIDS_BASE}/historique-raids`} className={`${COMUI.chipLink} ${focusRingClass}`}>
            Historique
          </Link>
          <Link href={`${RAIDS_BASE}/points-discord`} className={`${COMUI.chipLink} ${focusRingClass}`}>
            Points Discord
          </Link>
        </div>
      </section>

      {/* Checklist + Ce que le staff doit vérifier */}
      <section className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-[1.05fr_1fr]">
        <article className={`${panelClass} min-w-0 p-5 md:p-6`}>
          <p className={COMUI.sectionLabel}>Mémo personnel</p>
          <h2 className={`mt-1.5 ${COMUI.sectionTitle}`}>Passage rapide équipe</h2>
          <p className={COMUI.sectionLead}>
            Cette checklist est <strong className="font-medium text-zinc-300">locale à ton navigateur</strong>. Elle sert de
            mémo personnel, pas de suivi d’équipe.
          </p>
          <p className="mt-2 text-xs font-medium text-zinc-500" role="status" aria-live="polite">
            {checklistDone} / {checklistItems.length} points cochés sur cet appareil
          </p>
          <ul className="mt-4 space-y-2" aria-label="Checklist personnelle du hub animation">
            {checklistItems.map((item) => {
              const done = Boolean(checklist[item.id]);
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={done}
                    onClick={() => toggleCheck(item.id)}
                    className={`${COMUI.checklistRow} ${focusRingClass} ${
                      done
                        ? "border-emerald-400/40 bg-emerald-500/12 text-emerald-50 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]"
                        : "border-white/[0.09] bg-white/[0.03] text-zinc-200 hover:border-violet-400/30 hover:bg-violet-500/[0.06]"
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                        done ? "border-emerald-400 bg-emerald-600 text-white" : "border-zinc-500 bg-zinc-900"
                      }`}
                      aria-hidden
                    >
                      {done ? <span className="text-[10px] font-bold">✓</span> : null}
                    </span>
                    <span className="min-w-0 leading-snug">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </article>

        <article
          ref={staffCheckRef}
          id={staffCheckId}
          className={`${panelClass} min-w-0 scroll-mt-24 p-5 md:p-6`}
          aria-labelledby="staff-check-heading"
        >
          <p className={COMUI.sectionLabel}>Contrôles réguliers</p>
          <h2 id="staff-check-heading" className={`mt-1.5 ${COMUI.sectionTitle}`}>
            Ce que le staff doit vérifier
          </h2>
          <p className={COMUI.sectionLead}>
            Ces raccourcis ne remplacent pas les compteurs métier. Ils t’orientent vers les zones à contrôler régulièrement.
          </p>
          <div className="mt-4 space-y-2.5">
            {staffVerificationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`${item.tone} ${focusRingClass} group`}
              >
                <span className="flex items-center justify-between gap-2 font-semibold leading-snug text-white">
                  {item.title}
                  <ArrowRight className="h-3.5 w-3.5 shrink-0 opacity-60 motion-safe:transition-transform group-hover:translate-x-0.5 group-hover:opacity-100" aria-hidden />
                </span>
                <span className="mt-1.5 block text-xs leading-relaxed text-zinc-300/90">{item.body}</span>
              </Link>
            ))}
          </div>
        </article>
      </section>

      {/* Filtres */}
      <div className={`${panelClass} flex min-w-0 flex-col gap-4 p-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between`}>
        <div className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
          <Filter className="h-4 w-4 text-violet-300" aria-hidden />
          Filtrer l’affichage
        </div>
        <div
          className="flex min-w-0 flex-wrap gap-2"
          role="group"
          aria-label="Filtrer les pôles et accès rapides"
        >
          {(
            [
              { key: "all" as const, label: "Tout" },
              { key: "events" as const, label: "Événements" },
              { key: "engagement" as const, label: "Engagement" },
              { key: "raids" as const, label: "Raids" },
              { key: "anniversaires" as const, label: "Anniversaires" },
            ] as const
          ).map(({ key, label }) => (
            <button
              key={key}
              type="button"
              aria-pressed={filter === key}
              aria-controls={`${polesId} ${quickId}`}
              onClick={() => setFilter(key)}
              className={`min-h-[2.25rem] rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wide transition ${focusRingClass} ${
                filter === key
                  ? "border-violet-400/50 bg-violet-500/15 text-violet-100"
                  : "border-white/[0.08] bg-zinc-900/80 text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Pôles */}
      <section
        ref={polesRef}
        id={polesId}
        className="min-w-0 scroll-mt-24 space-y-4"
        aria-labelledby="poles-heading"
      >
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-violet-300/90">Pôles</p>
          <h2 id="poles-heading" className="mt-1 text-xl font-semibold text-white">
            Où agir en premier
          </h2>
          <p className="mt-1 text-sm text-zinc-500">Trois grands domaines — sans indicateur de couverture fictif.</p>
        </div>
        <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-3">
          {filteredPillars.map((pillar) => {
            const Icon = pillar.icon;
            const open = expandedHref === pillar.href;
            return (
              <div key={pillar.href} className={`${panelClass} flex min-w-0 flex-col overflow-hidden`}>
                <Link href={pillar.href} className={`group block min-w-0 flex-1 p-5 ${focusRingClass}`}>
                  <div className="inline-flex rounded-xl border border-white/[0.08] bg-violet-500/10 p-3 text-violet-200">
                    <Icon className="h-6 w-6" aria-hidden />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-white group-hover:text-violet-100">{pillar.label}</h3>
                  <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-zinc-400">{pillar.description}</p>
                  <div className="mt-3 flex min-w-0 flex-wrap gap-1.5">
                    {pillar.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-md border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-400"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <p className="mt-3 text-xs text-zinc-500">
                    <HeartHandshake className="mr-1 inline h-3.5 w-3.5 text-emerald-400/80" aria-hidden />
                    Côté membre : {pillar.memberAngle}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-violet-200/90">
                    Ouvrir le module
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
                  </span>
                </Link>
                <div className="border-t border-white/[0.06] px-5 pb-5">
                  <button
                    type="button"
                    onClick={() => toggleExpand(pillar.href)}
                    className={`mt-3 flex w-full items-center justify-between rounded-xl border border-white/[0.08] bg-black/20 px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-zinc-400 transition hover:bg-white/[0.03] ${focusRingClass}`}
                    aria-expanded={open}
                  >
                    <span>Conseil staff</span>
                    <ChevronDown className={`h-4 w-4 shrink-0 transition ${open ? "rotate-180" : ""}`} aria-hidden />
                  </button>
                  {open ? (
                    <p className="mt-3 rounded-xl border border-violet-400/15 bg-violet-500/[0.06] p-4 text-sm leading-relaxed text-zinc-300">
                      {pillar.staffTip}
                    </p>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
        {filteredPillars.length === 0 ? (
          <p className="text-center text-sm text-zinc-500">Aucun pôle pour ce filtre.</p>
        ) : null}
      </section>

      {/* Accès rapides */}
      <section
        ref={quickRef}
        id={quickId}
        className={`${panelClass} min-w-0 scroll-mt-24 overflow-hidden`}
        aria-labelledby="quick-heading"
      >
        <div className="border-b border-white/[0.06] px-5 py-4 md:px-6">
          <h2 id="quick-heading" className="text-base font-semibold text-white md:text-lg">
            Accès rapides
          </h2>
          <p className="mt-1 text-xs text-zinc-500">
            {filteredQuick.length} lien(s) selon le filtre — cartes sobres, tags par type de travail.
          </p>
        </div>
        <div className="grid min-w-0 grid-cols-1 gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredQuick.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex min-w-0 flex-col rounded-xl border border-white/[0.08] bg-zinc-900/40 px-4 py-4 transition hover:border-violet-400/25 hover:bg-zinc-900/70 ${focusRingClass}`}
            >
              <span className={tagPillClass(item.tag)}>{item.tag}</span>
              <p className="mt-3 font-semibold text-zinc-100 group-hover:text-white">{item.label}</p>
              <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-zinc-500">{item.hint}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-violet-200/90">
                Ouvrir
                <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" aria-hidden />
              </span>
            </Link>
          ))}
        </div>
        {filteredQuick.length === 0 ? (
          <p className="px-5 pb-5 text-center text-sm text-zinc-500">Aucun accès rapide pour ce filtre.</p>
        ) : null}
      </section>

      <section className="rounded-[clamp(1rem,2vw,1.25rem)] border border-sky-400/20 bg-sky-500/5 p-[clamp(1rem,2vw,1.5rem)] md:p-[clamp(1.125rem,2.2vw,1.75rem)]">
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start">
          <Sparkles className="h-5 w-5 shrink-0 text-sky-300" aria-hidden />
          <div className="min-w-0 text-[length:clamp(0.8125rem,0.75rem+0.35vw,0.9375rem)] leading-relaxed text-zinc-400">
            <p className="font-semibold text-zinc-100">Rôle de cette page</p>
            <p className="mt-2">
              Ce hub ne remplace pas les écrans métier (EventSub, points Discord, calendrier). Il vous aide à comprendre les
              grands pôles TENF et à ouvrir les zones à contrôler — avec des chiffres réels quand l’API aggregate répond, sinon
              des raccourcis clairement nommés.
            </p>
          </div>
        </div>
      </section>
          </main>

          <aside className="min-w-0 space-y-4 xl:sticky xl:top-5 xl:self-start" aria-label="Parcours et pivots communauté">
            <div className={`${panelClass} p-[clamp(0.875rem,1.75vw,1.25rem)]`}>
              <p className="flex items-center gap-2 text-[length:clamp(0.6875rem,0.625rem+0.2vw,0.8125rem)] font-semibold uppercase tracking-[0.08em] text-zinc-500">
                <ListOrdered className="h-4 w-4 shrink-0 text-violet-300/85" aria-hidden />
                Parcours conseillé
              </p>
              <ol className="mt-4 space-y-[0.65rem]">
                {journeySteps.map((step) => (
                  <li key={step.n} className="flex min-w-0 gap-3">
                    <span
                      aria-hidden
                      className="flex h-[2.125em] min-w-[2.125em] items-center justify-center rounded-lg border border-violet-500/28 bg-violet-500/[0.09] text-[length:clamp(0.65rem,0.58rem+0.22vw,0.75rem)] font-bold tabular-nums text-violet-50"
                    >
                      {step.n}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[length:clamp(0.78rem,0.72rem+0.22vw,0.9rem)] font-semibold text-zinc-100">{step.title}</p>
                      <p className="mt-1 text-[length:clamp(0.6875rem,0.62rem+0.2vw,0.8rem)] leading-[1.55] text-zinc-500">
                        {step.body}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className={`${panelClass} space-y-3 p-[clamp(0.875rem,1.75vw,1.25rem)]`}>
              <p className="flex items-center gap-2 text-[length:clamp(0.6875rem,0.625rem+0.2vw,0.8125rem)] font-semibold uppercase tracking-[0.08em] text-zinc-500">
                <Compass className="h-4 w-4 shrink-0 text-violet-300/85" aria-hidden />
                Astuce équipe
              </p>
              <p className="text-[length:clamp(0.75rem,0.68rem+0.28vw,0.8625rem)] leading-[1.6] text-zinc-400">
                Gardez ce hub comme table des matières : les chiffres utiles vivent dans chaque pilier (raids, points,
                calendrier).
              </p>
            </div>

            <div className={`${panelClass} p-[clamp(0.875rem,1.75vw,1.25rem)]`}>
              <p className="text-[length:clamp(0.6875rem,0.625rem+0.2vw,0.8125rem)] font-semibold uppercase tracking-[0.08em] text-zinc-500">
                Les trois pôles
              </p>
              <nav className="mt-3 flex flex-col gap-2" aria-label="Navigation piliers animation">
                <Link
                  href="/admin/communaute/evenements"
                  className={`flex min-h-[2.85rem] min-w-0 items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-zinc-900/45 px-3 py-2 text-[length:clamp(0.78rem,0.72rem+0.22vw,0.9rem)] font-medium text-zinc-100 transition hover:border-violet-400/26 hover:bg-zinc-900/72 ${focusRingClass}`}
                >
                  Événements
                  <ArrowRight className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
                </Link>
                <Link
                  href="/admin/communaute/engagement"
                  className={`flex min-h-[2.85rem] min-w-0 items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-zinc-900/45 px-3 py-2 text-[length:clamp(0.78rem,0.72rem+0.22vw,0.9rem)] font-medium text-zinc-100 transition hover:border-emerald-400/26 hover:bg-zinc-900/72 ${focusRingClass}`}
                >
                  Engagement
                  <ArrowRight className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
                </Link>
                <Link
                  href="/admin/communaute/anniversaires"
                  className={`flex min-h-[2.85rem] min-w-0 items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-zinc-900/45 px-3 py-2 text-[length:clamp(0.78rem,0.72rem+0.22vw,0.9rem)] font-medium text-zinc-100 transition hover:border-amber-400/24 hover:bg-zinc-900/72 ${focusRingClass}`}
                >
                  Anniversaires
                  <ArrowRight className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
                </Link>
                <Link
                  href="/admin/pilotage"
                  className={`flex min-h-[2.85rem] min-w-0 items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-zinc-900/45 px-3 py-2 text-[length:clamp(0.78rem,0.72rem+0.22vw,0.9rem)] font-medium text-zinc-100 transition hover:border-white/14 hover:bg-zinc-900/72 ${focusRingClass}`}
                >
                  Pilotage serveur
                  <ArrowRight className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
                </Link>
              </nav>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

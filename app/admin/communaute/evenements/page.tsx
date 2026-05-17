"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  CalendarCheck2,
  CheckCircle2,
  ChevronLeft,
  Compass,
  ExternalLink,
  ListOrdered,
  Megaphone,
  RefreshCw,
  Sparkles,
  Users,
} from "lucide-react";

const panelClass =
  "rounded-2xl border border-white/[0.08] bg-zinc-950/55 shadow-sm shadow-black/20 ring-1 ring-inset ring-white/[0.03]";
const heroVisualClass =
  "relative isolate overflow-hidden rounded-2xl border border-violet-500/20 bg-zinc-950/70 ring-1 ring-inset ring-violet-500/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]";
const focusRingClass =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950";
const subtleButtonClass =
  "inline-flex min-h-[2.5rem] items-center gap-2 rounded-xl border border-violet-500/25 bg-violet-950/25 px-3 py-2 text-sm font-medium text-violet-100 transition hover:border-violet-400/40 hover:bg-violet-900/30";

type ModuleTag = "Pilotage" | "Présences" | "Récap" | "Spotlight";

type EventModule = {
  href: string;
  label: string;
  description: string;
  cta: string;
  tag: ModuleTag;
  icon: typeof CalendarCheck2;
};

const eventModules: EventModule[] = [
  {
    href: "/admin/communaute/evenements/calendrier",
    label: "Calendrier",
    description: "Créer, publier et suivre les rendez-vous communautaires.",
    cta: "Ouvrir le calendrier",
    tag: "Pilotage",
    icon: CalendarCheck2,
  },
  {
    href: "/admin/communaute/evenements/participation",
    label: "Participation",
    description: "Saisir ou contrôler les présences après les événements.",
    cta: "Suivre les présences",
    tag: "Présences",
    icon: Users,
  },
  {
    href: "/admin/communaute/evenements/recap",
    label: "Récapitulatif",
    description: "Retrouver les bilans et les éléments à clôturer après un événement.",
    cta: "Voir les récapitulatifs",
    tag: "Récap",
    icon: CheckCircle2,
  },
  {
    href: "/admin/communaute/evenements/spotlight",
    label: "Spotlight",
    description: "Préparer et suivre les mises en avant créateurs.",
    cta: "Ouvrir Spotlight",
    tag: "Spotlight",
    icon: Megaphone,
  },
];

type QuickLinkTag = "Pilotage" | "Présences" | "Récap" | "Spotlight" | "Organisation" | "À vérifier";

type QuickLink = {
  href: string;
  label: string;
  hint: string;
  tag: QuickLinkTag;
};

const primaryQuickLinks: QuickLink[] = [
  {
    href: "/admin/communaute/evenements/calendrier",
    label: "Calendrier",
    hint: "Planifier et publier les rendez-vous",
    tag: "Pilotage",
  },
  {
    href: "/admin/communaute/evenements/liste",
    label: "Liste des événements",
    hint: "Vue liste pour parcourir tous les créneaux",
    tag: "Pilotage",
  },
  {
    href: "/admin/communaute/evenements/participation",
    label: "Participation",
    hint: "Présences et taux de participation",
    tag: "Présences",
  },
  {
    href: "/admin/communaute/evenements/recap",
    label: "Récapitulatif",
    hint: "Bilans et clôture après événement",
    tag: "Récap",
  },
  {
    href: "/admin/communaute/evenements/suivi",
    label: "Suivi par type",
    hint: "Présences regroupées par format de créneau",
    tag: "Présences",
  },
  {
    href: "/admin/communaute/evenements/spotlight",
    label: "Spotlight",
    hint: "Accueil du cycle de mise en avant",
    tag: "Spotlight",
  },
  {
    href: "/admin/communaute/evenements/spotlight/gestion",
    label: "Gestion Spotlight",
    hint: "Paramètres et sessions",
    tag: "Spotlight",
  },
  {
    href: "/admin/communaute/evenements/spotlight/evaluation",
    label: "Évaluation Spotlight",
    hint: "Évaluation streamer (staff)",
    tag: "Spotlight",
  },
];

const otherQuickLinks: QuickLink[] = [
  {
    href: "/admin/communaute/evenements/propositions",
    label: "Propositions",
    hint: "Idées soumises par les membres",
    tag: "Organisation",
  },
  {
    href: "/admin/communaute/evenements/liens-vocaux",
    label: "Liens vocaux",
    hint: "Salons Discord liés aux événements",
    tag: "Organisation",
  },
  {
    href: "/admin/communaute/evenements/archives",
    label: "Archives",
    hint: "Événements passés archivés",
    tag: "Organisation",
  },
  {
    href: "/admin/communaute/evenements/spotlight/membres",
    label: "Consultation évaluations",
    hint: "Lecture des évaluations membres",
    tag: "Spotlight",
  },
  {
    href: "/admin/communaute/evenements/spotlight/presences",
    label: "Présences Spotlight",
    hint: "Présences enregistrées sur les sessions",
    tag: "Présences",
  },
  {
    href: "/admin/communaute/evenements/spotlight/analytics",
    label: "Analyses Spotlight",
    hint: "Tendances et statistiques",
    tag: "À vérifier",
  },
  {
    href: "/admin/communaute/evenements/spotlight/recover",
    label: "Récupération Spotlight",
    hint: "Outils de récupération de données",
    tag: "À vérifier",
  },
];

const staffCheckItems = [
  {
    href: "/admin/communaute/evenements/calendrier",
    title: "Calendrier publié",
    body: "Vérifier que les prochains rendez-vous sont visibles et compréhensibles.",
    tone: "border-indigo-400/25 bg-indigo-500/5 text-indigo-50 hover:border-indigo-400/40 hover:bg-indigo-500/10",
  },
  {
    href: "/admin/communaute/evenements/participation",
    title: "Présences à saisir",
    body: "Contrôler les présences après les événements passés.",
    tone: "border-sky-400/25 bg-sky-500/5 text-sky-50 hover:border-sky-400/40 hover:bg-sky-500/10",
    signalKey: "pendingEventValidations" as const,
  },
  {
    href: "/admin/communaute/evenements/recap",
    title: "Récap à clôturer",
    body: "Préparer les bilans et garder une trace claire de ce qui s’est passé.",
    tone: "border-emerald-400/25 bg-emerald-500/5 text-emerald-50 hover:border-emerald-400/40 hover:bg-emerald-500/10",
  },
  {
    href: "/admin/communaute/evenements/spotlight",
    title: "Spotlight à suivre",
    body: "Vérifier les mises en avant et les créateurs concernés.",
    tone: "border-fuchsia-400/25 bg-fuchsia-500/5 text-fuchsia-50 hover:border-fuchsia-400/40 hover:bg-fuchsia-500/10",
    signalKey: "upcomingSpotlights" as const,
  },
];

type AggregateResponse = {
  success?: boolean;
  data?: {
    recap?: {
      upcomingKpis?: {
        pendingEventValidations?: number;
        upcomingSpotlights?: number;
      };
    };
  };
};

type EventSignals = {
  loading: boolean;
  error: string | null;
  loaded: boolean;
  pendingEventValidations: number;
  upcomingSpotlights: number;
};

function tagPillClass(tag: QuickLinkTag | ModuleTag): string {
  const base = "rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide";
  if (tag === "Présences") return `${base} border-sky-400/30 bg-sky-500/10 text-sky-200`;
  if (tag === "Récap") return `${base} border-emerald-400/30 bg-emerald-500/10 text-emerald-200`;
  if (tag === "Spotlight") return `${base} border-fuchsia-400/30 bg-fuchsia-500/10 text-fuchsia-200`;
  if (tag === "À vérifier") return `${base} border-amber-400/30 bg-amber-500/10 text-amber-200`;
  if (tag === "Organisation") return `${base} border-zinc-400/30 bg-zinc-500/10 text-zinc-300`;
  return `${base} border-indigo-400/30 bg-indigo-500/10 text-indigo-200`;
}

const totalQuickCount = primaryQuickLinks.length + otherQuickLinks.length;

const workflowSteps = [
  {
    n: "1",
    title: "Annoncer & planifier",
    body: "Publier dans le calendrier staff et vérifier la cohérence avec Discord et le site public.",
  },
  {
    n: "2",
    title: "Pendant et après",
    body: "Saisir ou contrôler les présences dès que l’événement est passé.",
  },
  {
    n: "3",
    title: "Clôturer",
    body: "Passer par le récap pour les bilans, décisions et relances pour les prochains créneaux.",
  },
];

export default function CommunauteEvenementsPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [signals, setSignals] = useState<EventSignals>({
    loading: true,
    error: null,
    loaded: false,
    pendingEventValidations: 0,
    upcomingSpotlights: 0,
  });

  useEffect(() => {
    let cancelled = false;
    async function loadSignals() {
      setSignals((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const res = await fetch("/api/admin/dashboard/aggregate", { cache: "no-store" });
        if (!res.ok) {
          throw new Error(`Indicateurs indisponibles (${res.status})`);
        }
        const json = (await res.json()) as AggregateResponse;
        if (cancelled) return;
        const kpis = json.data?.recap?.upcomingKpis;
        setSignals({
          loading: false,
          error: null,
          loaded: true,
          pendingEventValidations: Number(kpis?.pendingEventValidations ?? 0),
          upcomingSpotlights: Number(kpis?.upcomingSpotlights ?? 0),
        });
      } catch (error) {
        if (cancelled) return;
        setSignals((prev) => ({
          ...prev,
          loading: false,
          loaded: false,
          error: error instanceof Error ? error.message : "Erreur inconnue",
        }));
      }
    }
    void loadSignals();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const hasEventSignals =
    signals.loaded && (signals.pendingEventValidations > 0 || signals.upcomingSpotlights > 0);

  function signalBadge(key: "pendingEventValidations" | "upcomingSpotlights"): string | null {
    if (!signals.loaded) return null;
    const value = key === "pendingEventValidations" ? signals.pendingEventValidations : signals.upcomingSpotlights;
    if (value <= 0) return null;
    return `${value} à vérifier`;
  }

  return (
    <div className="relative isolate min-w-0 text-white [--ev-gap:clamp(1rem,1.5vw,1.75rem)]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-[max(-4rem,calc(-6vw))] top-[-3rem] -z-10 h-[clamp(260px,35vw,480px)] overflow-hidden blur-3xl"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_28%_-10%,rgba(167,139,250,0.33),transparent_55%),radial-gradient(ellipse_at_85%_20%,rgba(56,189,248,0.16),transparent_50%),radial-gradient(ellipse_at_50%_100%,rgba(244,114,182,0.09),transparent_52%)]" />
      </div>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 -z-20 h-[100vh] max-h-[840px]"
        style={{
          backgroundImage:
            "linear-gradient(105deg,rgba(255,255,255,0.04) 0px,rgba(255,255,255,0.04) 1px,transparent 1px,transparent 76px)",
          backgroundSize: "clamp(56px,4.5vw,76px) 100%",
          opacity: 0.25,
          maskImage: "linear-gradient(180deg,black,transparent)",
        }}
      />

      <div className="mx-auto w-full max-w-[min(1680px,calc(100vw-2*clamp(0.6rem,1.75vw,1.75rem)))] space-y-6 pb-10 pt-1 sm:space-y-8 sm:pt-2">
        <div className="grid min-w-0 grid-cols-1 gap-6 [--sidebar:min(100%,clamp(17rem,24vw,24rem))] xl:grid-cols-[minmax(0,1fr)_var(--sidebar)] xl:items-start xl:gap-[clamp(1.25rem,2.5vw,2.5rem)]">
          <main className="min-w-0 space-y-6 sm:space-y-8">
            <header
              className={`grid min-w-0 gap-6 p-[clamp(1rem,2vw,1.6rem)] sm:gap-8 lg:grid-cols-[minmax(0,1.38fr)_minmax(260px,min(100%,0.92fr))] ${panelClass}`}
            >
              <div className="min-w-0">
                <Link
                  href="/admin/communaute"
                  className={`inline-flex items-center gap-1 text-[length:clamp(0.8rem,0.75rem+0.35vw,0.9375rem)] text-zinc-400 transition hover:text-white ${focusRingClass} rounded-lg`}
                >
                  <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden />
                  Animation & engagement
                </Link>
                <p className="mt-4 text-[length:clamp(0.65rem,0.6rem+0.25vw,0.75rem)] font-medium uppercase tracking-[0.14em] text-violet-300/90">
                  Communauté · Événements
                </p>
                <h1 className="mt-2 text-[clamp(1.35rem,1rem+1.1vw,2.1rem)] font-semibold tracking-tight text-white">
                  Événements TENF
                </h1>
                <p className="mt-3 max-w-2xl text-[length:clamp(0.8125rem,0.75rem+0.35vw,0.9375rem)] leading-[1.65] text-zinc-400">
                  Planifier, suivre les présences et retrouver les récapitulatifs des rendez-vous communautaires. Le cockpit
                  s’élargit sur grand écran : les deux colonnes et les grilles s’adaptent au zoom tout en gardant une base
                  de lecture confortable.
                </p>
                <div className="mt-5 flex min-w-0 flex-wrap gap-[clamp(0.4rem,0.8vw,0.625rem)]">
                  <Link href="/admin/communaute/evenements/calendrier" className={`${subtleButtonClass} ${focusRingClass}`}>
                    Ouvrir le calendrier
                    <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
                  </Link>
                  <Link
                    href="/admin/communaute/evenements/recap"
                    className={`${subtleButtonClass} ${focusRingClass} border-sky-500/25 bg-sky-950/25 text-sky-100`}
                  >
                    Voir les récapitulatifs
                    <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
                  </Link>
                </div>
              </div>
              <div className={`relative min-h-[11rem] p-[clamp(0.875rem,1.5vw,1.125rem)] sm:min-h-[12.5rem] ${heroVisualClass}`}>
                <div
                  aria-hidden
                  className="absolute inset-0 bg-[conic-gradient(from_200deg_at_70%_-10%,rgba(167,139,250,0.18),transparent_42%,transparent_58%,rgba(56,189,248,0.12))]"
                />
                <div aria-hidden className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.15),transparent_42%,transparent_68%,rgba(0,0,0,0.35))]" />
                <div className="relative flex h-full min-h-[10rem] flex-col justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center gap-2 rounded-xl border border-violet-400/25 bg-violet-500/[0.12] px-3 py-1.5 text-[length:clamp(0.65rem,0.55rem+0.35vw,0.6875rem)] font-semibold uppercase tracking-wide text-violet-100/95">
                      <Sparkles className="h-3.5 w-3.5 shrink-0 text-violet-200/90" aria-hidden />
                      Pilier événements
                    </span>
                  </div>
                  <dl className="grid min-w-0 grid-cols-2 gap-3 text-[length:clamp(0.6875rem,0.625rem+0.25vw,0.8125rem)]">
                    <div className="rounded-xl border border-white/[0.08] bg-zinc-900/55 p-3">
                      <dt className="font-medium uppercase tracking-wide text-zinc-500">Modules</dt>
                      <dd className="mt-1 text-[clamp(1.125rem,0.95rem+0.5vw,1.5rem)] font-semibold tabular-nums text-zinc-100">
                        {eventModules.length}
                      </dd>
                    </div>
                    <div className="rounded-xl border border-white/[0.08] bg-zinc-900/55 p-3">
                      <dt className="font-medium uppercase tracking-wide text-zinc-500">Raccourcis</dt>
                      <dd className="mt-1 text-[clamp(1.125rem,0.95rem+0.5vw,1.5rem)] font-semibold tabular-nums text-sky-200/95">
                        {totalQuickCount}
                      </dd>
                    </div>
                  </dl>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[length:clamp(0.65rem,0.58rem+0.28vw,0.75rem)] text-zinc-500">
                    <span className="inline-flex items-center gap-1">
                      <Compass className="h-3.5 w-3.5 text-violet-300/70" aria-hidden /> Espacement fluide&nbsp;: zoom ↑ = plus
                      d’infos visibles sans casser les grilles.
                    </span>
                  </div>
                </div>
              </div>
            </header>

            <section
              className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-4"
              aria-label="Repères du hub événements"
            >
        <article className={`${panelClass} min-w-0 p-4`}>
          <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">Modules principaux</p>
          <p className="mt-1 text-[clamp(1.25rem,1rem+0.6vw,1.75rem)] font-semibold text-zinc-100">{eventModules.length}</p>
          <p className="mt-1 text-xs leading-snug text-zinc-500">Calendrier, participation, récap, Spotlight</p>
        </article>
        <article className={`${panelClass} min-w-0 p-4`}>
          <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">Outils disponibles</p>
          <p className="mt-1 text-[clamp(1.25rem,1rem+0.6vw,1.75rem)] font-semibold tabular-nums text-sky-200/95">
            {totalQuickCount}
          </p>
          <p className="mt-1 text-xs leading-snug text-zinc-500">Raccourcis vers les écrans du pilier</p>
        </article>
        <article className={`${panelClass} min-w-0 p-4`}>
          <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">Raccourcis de contrôle</p>
          <p className="mt-1 text-[clamp(1.25rem,1rem+0.6vw,1.75rem)] font-semibold text-amber-100/95">
            {staffCheckItems.length} zones
          </p>
          <p className="mt-1 text-xs leading-snug text-zinc-500">À parcourir régulièrement — pas d’alerte temps réel</p>
        </article>
        <article className={`${panelClass} min-w-0 p-4`}>
          <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">Vue d’orientation</p>
          <p className="mt-1 text-sm font-semibold leading-snug text-zinc-200">Hub événements</p>
          <p className="mt-1 text-xs leading-snug text-zinc-500">Les chiffres ops ci-dessous viennent du tableau de bord admin</p>
        </article>
      </section>

      <section className={`${panelClass} min-w-0 p-4 sm:p-5`} aria-label="Signaux événements">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-zinc-100">Signaux événements (tableau de bord)</h2>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-zinc-500">
              Données issues de <span className="text-zinc-400">recap.upcomingKpis</span> dans l’aggregate admin. Zéro =
              rien en attente côté ce critère.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setRefreshKey((k) => k + 1)}
            disabled={signals.loading}
            className={`inline-flex min-h-[2.25rem] items-center gap-2 rounded-lg border border-white/[0.1] bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:bg-white/[0.08] disabled:opacity-50 ${focusRingClass}`}
            aria-label="Actualiser les signaux événements"
          >
            <RefreshCw className={`h-3.5 w-3.5 shrink-0 ${signals.loading ? "animate-spin" : ""}`} aria-hidden />
            Actualiser
          </button>
        </div>
        {signals.loading ? (
          <p className="mt-3 text-sm text-zinc-500" role="status" aria-live="polite">
            Chargement des signaux…
          </p>
        ) : null}
        {signals.error ? (
          <p className="mt-3 text-sm text-amber-200/90" role="status">
            {signals.error} — utilisez les raccourcis ci-dessous.
          </p>
        ) : null}
        {signals.loaded && !signals.loading && !hasEventSignals ? (
          <p className="mt-3 text-sm text-emerald-200/90" role="status">
            Aucun signal événement en attente sur les critères suivis.
          </p>
        ) : null}
        {signals.loaded && !signals.loading ? (
          <div className="mt-4 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
            <Link
              href="/admin/communaute/evenements/participation"
              className={`min-w-0 rounded-xl border border-indigo-400/20 bg-indigo-500/5 px-4 py-3 transition hover:brightness-110 ${focusRingClass}`}
              aria-label={`Présences à vérifier : ${signals.pendingEventValidations}`}
            >
              <p className="text-[10px] font-medium uppercase tracking-wide text-indigo-200/80">Présences à vérifier</p>
              <p className="mt-1 text-[clamp(1.1rem,0.95rem+0.4vw,1.35rem)] font-semibold tabular-nums text-indigo-100">
                {signals.pendingEventValidations}
              </p>
              <p className="mt-1 text-xs text-zinc-500">Événements passés avec inscriptions sans présence saisie</p>
            </Link>
            <Link
              href="/admin/communaute/evenements/spotlight"
              className={`min-w-0 rounded-xl border border-fuchsia-400/20 bg-fuchsia-500/5 px-4 py-3 transition hover:brightness-110 ${focusRingClass}`}
              aria-label={`Spotlights à venir : ${signals.upcomingSpotlights}`}
            >
              <p className="text-[10px] font-medium uppercase tracking-wide text-fuchsia-200/80">Spotlights à venir</p>
              <p className="mt-1 text-[clamp(1.1rem,0.95rem+0.4vw,1.35rem)] font-semibold tabular-nums text-fuchsia-100">
                {signals.upcomingSpotlights}
              </p>
              <p className="mt-1 text-xs text-zinc-500">Créneaux spotlight planifiés à l’avenir</p>
            </Link>
          </div>
        ) : null}
      </section>

      <section className="min-w-0 space-y-4" aria-labelledby="modules-heading">
        <div>
          <h2 id="modules-heading" className="text-lg font-semibold text-zinc-100">
            Modules principaux
          </h2>
          <p className="mt-1 text-sm text-zinc-500">Quatre parcours — sans indicateur de maturité fictif.</p>
        </div>
        <div className="grid min-w-0 grid-cols-1 gap-[var(--ev-gap)] lg:gap-6 sm:grid-cols-2 xl:grid-cols-4 2xl:gap-8">
          {eventModules.map((module) => {
            const Icon = module.icon;
            return (
              <article key={module.href} className={`${panelClass} flex min-w-0 flex-col p-5`}>
                <div className="inline-flex rounded-xl border border-white/[0.08] bg-violet-500/10 p-3 text-violet-200 w-fit">
                  <Icon className="h-6 w-6" aria-hidden />
                </div>
                <span className={`mt-4 w-fit ${tagPillClass(module.tag)}`}>{module.tag}</span>
                <h3 className="mt-3 text-lg font-semibold text-white">{module.label}</h3>
                <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-zinc-400">{module.description}</p>
                <Link
                  href={module.href}
                  className={`mt-4 inline-flex min-h-[2.5rem] w-fit items-center gap-2 text-sm font-semibold text-violet-200/90 transition hover:text-violet-100 ${focusRingClass} rounded-lg`}
                  aria-label={`${module.cta} — ${module.label}`}
                >
                  {module.cta}
                  <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
                </Link>
              </article>
            );
          })}
        </div>
      </section>

      <section className={`${panelClass} min-w-0 p-5 md:p-6`} aria-labelledby="staff-check-heading">
        <h2 id="staff-check-heading" className="text-lg font-semibold text-zinc-100">
          Ce que le staff doit vérifier
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-zinc-500">
          Raccourcis de contrôle régulier — les badges n’apparaissent que si le tableau de bord signale un volume &gt; 0.
        </p>
        <div className="mt-4 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
          {staffCheckItems.map((item) => {
            const badge = item.signalKey ? signalBadge(item.signalKey) : null;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block min-w-0 rounded-xl border px-4 py-3 transition ${item.tone} ${focusRingClass}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <span className="font-semibold leading-snug text-white">{item.title}</span>
                  {badge ? (
                    <span className="rounded-md border border-amber-400/35 bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-100">
                      {badge}
                    </span>
                  ) : null}
                </div>
                <span className="mt-1 block text-xs leading-relaxed opacity-90">{item.body}</span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className={`${panelClass} min-w-0 overflow-hidden`} aria-labelledby="quick-primary-heading">
        <div className="border-b border-white/[0.06] px-5 py-4">
          <h2 id="quick-primary-heading" className="text-base font-semibold text-white md:text-lg">
            Accès rapides
          </h2>
          <p className="mt-1 text-xs text-zinc-500">Liens les plus utilisés — sans affichage d’URL brute.</p>
        </div>
        <div className="grid min-w-0 grid-cols-1 gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {primaryQuickLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex min-w-0 flex-col rounded-xl border border-white/[0.08] bg-zinc-900/40 px-4 py-4 transition hover:border-violet-400/25 hover:bg-zinc-900/70 ${focusRingClass}`}
              aria-label={`${item.label} — ${item.hint}`}
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
      </section>

      <section className={`${panelClass} min-w-0 overflow-hidden`} aria-labelledby="quick-other-heading">
        <div className="border-b border-white/[0.06] px-5 py-4">
          <h2 id="quick-other-heading" className="text-base font-semibold text-white">
            Autres outils
          </h2>
          <p className="mt-1 text-xs text-zinc-500">Propositions, archives, analytics Spotlight, etc.</p>
        </div>
        <div className="grid min-w-0 grid-cols-1 gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {otherQuickLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex min-w-0 flex-col rounded-xl border border-white/[0.08] bg-zinc-900/40 px-4 py-4 transition hover:border-violet-400/25 hover:bg-zinc-900/70 ${focusRingClass}`}
              aria-label={`${item.label} — ${item.hint}`}
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
      </section>

      <section className="rounded-[clamp(1rem,2vw,1.25rem)] border border-sky-400/20 bg-sky-500/5 p-[clamp(1rem,2vw,1.5rem)] md:p-[clamp(1.125rem,2.2vw,1.75rem)]">
        <p className="text-[length:clamp(0.8125rem,0.75rem+0.35vw,0.9375rem)] font-semibold text-zinc-100">Rôle de cette page</p>
        <p className="mt-2 text-[length:clamp(0.8125rem,0.75rem+0.35vw,0.9375rem)] leading-[1.65] text-zinc-400">
          Ce hub ne remplace pas le calendrier ni les écrans de présences. Il oriente le staff vers les bons outils ; les
          seuls compteurs affichés proviennent du tableau de bord admin lorsque l’aggregate répond.
        </p>
      </section>
          </main>

          <aside
            aria-label="Résumé navigation et périmètres événements"
            className="min-w-0 space-y-4 xl:sticky xl:top-5 xl:self-start"
          >
            <div className={`${panelClass} p-[clamp(0.875rem,1.75vw,1.25rem)]`}>
              <p className="flex items-center gap-2 text-[length:clamp(0.6875rem,0.625rem+0.25vw,0.8125rem)] font-semibold uppercase tracking-[0.1em] text-zinc-500">
                <ListOrdered className="h-4 w-4 shrink-0 text-violet-300/85" aria-hidden />
                Flux type (staff)
              </p>
              <ol className="mt-4 space-y-4">
                {workflowSteps.map((step) => (
                  <li key={step.n} className="flex min-w-0 gap-3">
                    <span
                      aria-hidden
                      className="flex h-[2.125em] min-w-[2.125em] items-center justify-center rounded-lg border border-violet-500/30 bg-violet-500/[0.1] text-[length:clamp(0.7rem,0.65rem+0.2vw,0.8125rem)] font-bold tabular-nums text-violet-100"
                    >
                      {step.n}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[length:clamp(0.8125rem,0.75rem+0.25vw,0.9375rem)] font-semibold text-zinc-100">
                        {step.title}
                      </p>
                      <p className="mt-1 text-[length:clamp(0.6875rem,0.625rem+0.25vw,0.8125rem)] leading-[1.6] text-zinc-500">
                        {step.body}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className={`${panelClass} p-[clamp(0.875rem,1.75vw,1.25rem)]`}>
              <p className="flex items-center gap-2 text-[length:clamp(0.6875rem,0.625rem+0.25vw,0.8125rem)] font-semibold uppercase tracking-[0.08em] text-zinc-500">
                Hors écran staff
              </p>
              <nav className="mt-4 flex flex-col gap-2">
                <Link
                  href="/evenements"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex min-h-[2.85rem] min-w-0 items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-zinc-900/45 px-3 py-2 text-[length:clamp(0.75rem,0.7rem+0.22vw,0.875rem)] font-medium text-zinc-100 transition hover:border-emerald-400/25 hover:bg-zinc-900/75 ${focusRingClass}`}
                >
                  <span className="min-w-0 leading-snug">Vue publique des événements</span>
                  <ExternalLink className="h-4 w-4 shrink-0 text-emerald-300/85" aria-hidden />
                </Link>
                <Link
                  href="/evenements-communautaires"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex min-h-[2.85rem] min-w-0 items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-zinc-900/45 px-3 py-2 text-[length:clamp(0.75rem,0.7rem+0.22vw,0.875rem)] font-medium text-zinc-100 transition hover:border-sky-400/25 hover:bg-zinc-900/75 ${focusRingClass}`}
                >
                  <span className="min-w-0 leading-snug">Plateforme « événements communautaires »</span>
                  <ExternalLink className="h-4 w-4 shrink-0 text-sky-300/85" aria-hidden />
                </Link>
              </nav>
            </div>

            <div className={`${panelClass} p-[clamp(0.875rem,1.75vw,1.25rem)]`}>
              <p className="text-[length:clamp(0.6875rem,0.625rem+0.25vw,0.8125rem)] font-semibold uppercase tracking-[0.08em] text-zinc-500">
                Pivot animation
              </p>
              <p className="mt-3 text-[length:clamp(0.6875rem,0.625rem+0.25vw,0.8125rem)] leading-[1.6] text-zinc-400">
                Retour rapide au hub communautaire pour passer sur raids, suivis communautaires ou autres piliers.
              </p>
              <Link
                href="/admin/communaute"
                className={`mt-4 inline-flex min-h-[2.5rem] w-full items-center justify-center gap-2 rounded-xl border border-violet-500/25 bg-violet-950/30 px-3 py-2 text-[length:clamp(0.75rem,0.7rem+0.22vw,0.875rem)] font-semibold text-violet-100 transition hover:bg-violet-900/35 ${focusRingClass}`}
              >
                Hub Animation & engagement
                <ArrowRight className="h-4 w-4 shrink-0 opacity-85" aria-hidden />
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

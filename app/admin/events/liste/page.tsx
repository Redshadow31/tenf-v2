"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Calendar,
  CalendarCheck2,
  CheckCircle2,
  ChevronLeft,
  Compass,
  ExternalLink,
  ListOrdered,
  MapPin,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Users,
  XCircle,
} from "lucide-react";

interface EventWithRegistrations {
  event: {
    id: string;
    title: string;
    date: string;
    category: string;
    description?: string;
    location?: string;
    image?: string;
    isPublished: boolean;
  };
  registrations: Array<{
    id: string;
    twitchLogin: string;
    displayName: string;
    registeredAt: string;
  }>;
  registrationCount: number;
  presences?: Array<{
    id: string;
    twitchLogin: string;
    displayName: string;
    present: boolean;
  }>;
  presenceCount?: number;
  absentCount?: number;
  presenceRate?: number;
}

interface CategoryConfig {
  value: string;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

const categories: CategoryConfig[] = [
  {
    value: "Spotlight",
    label: "Spotlight",
    color: "text-[#9146ff]",
    bgColor: "bg-[#9146ff]/20",
    borderColor: "border-[#9146ff]/30",
  },
  {
    value: "Soirée Film",
    label: "Soirée Film",
    color: "text-blue-400",
    bgColor: "bg-blue-500/20",
    borderColor: "border-blue-500/30",
  },
  {
    value: "Formation",
    label: "Formation",
    color: "text-green-400",
    bgColor: "bg-green-500/20",
    borderColor: "border-green-500/30",
  },
  {
    value: "Jeux communautaire",
    label: "Jeux communautaire",
    color: "text-amber-400",
    bgColor: "bg-amber-500/20",
    borderColor: "border-amber-500/30",
  },
  {
    value: "Apéro",
    label: "Apéro",
    color: "text-purple-400",
    bgColor: "bg-purple-500/20",
    borderColor: "border-purple-500/30",
  },
  {
    value: "Organisation Aventura 2026",
    label: "Organisation Aventura 2026",
    color: "text-pink-400",
    bgColor: "bg-pink-500/20",
    borderColor: "border-pink-500/30",
  },
];

const panelClass =
  "rounded-2xl border border-white/[0.08] bg-zinc-950/55 shadow-sm shadow-black/20 ring-1 ring-inset ring-white/[0.03]";
const heroVisualClass =
  "relative isolate overflow-hidden rounded-2xl border border-violet-500/20 bg-zinc-950/70 ring-1 ring-inset ring-violet-500/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]";
const subtleButtonClass =
  "inline-flex min-h-[2.5rem] items-center justify-center gap-2 rounded-xl border border-violet-500/25 bg-violet-950/25 px-3 py-2 text-sm font-medium text-violet-100 transition hover:border-violet-400/40 hover:bg-violet-900/30";
const focusRingClass =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950";

const listeAsideSteps = [
  {
    n: "1",
    title: "Lire le regroupement",
    body: "Les cartes sont groupées par type d’événement ; le compteur par ligne reflète la fenêtre chargée.",
  },
  {
    n: "2",
    title: "Taux et absences",
    body: "Le taux de présence compare aux inscriptions ; les absents incluent inscrits sans saisie de présence.",
  },
  {
    n: "3",
    title: "Détail par créneau",
    body: "Ouvrez « Voir les inscrits » pour la liste Twitch ; croisez avec participation staff si un chiffre surprend.",
  },
];

const getCategoryConfig = (categoryValue: string): CategoryConfig => {
  return categories.find(cat => cat.value === categoryValue) || categories[0];
};

function normalizeLogin(value?: string): string {
  return (value || "").trim().toLowerCase();
}

function safeTs(value?: string): number {
  if (!value) return 0;
  const ts = new Date(value).getTime();
  return Number.isNaN(ts) ? 0 : ts;
}

function dedupeRegistrations(registrations: EventWithRegistrations["registrations"]) {
  const byLogin = new Map<string, EventWithRegistrations["registrations"][number]>();
  for (const reg of registrations || []) {
    const key = normalizeLogin(reg.twitchLogin);
    if (!key) continue;
    const existing = byLogin.get(key);
    if (!existing || safeTs(reg.registeredAt) >= safeTs(existing.registeredAt)) {
      byLogin.set(key, reg);
    }
  }
  return Array.from(byLogin.values());
}

function dedupePresences(presences: NonNullable<EventWithRegistrations["presences"]>) {
  const byLogin = new Map<string, NonNullable<EventWithRegistrations["presences"]>[number]>();
  for (const presence of presences || []) {
    const key = normalizeLogin(presence.twitchLogin);
    if (!key) continue;
    const existing = byLogin.get(key);
    if (!existing) {
      byLogin.set(key, presence);
      continue;
    }
    // Avec les données legacy/v2, garder une présence "présent" si au moins une source est à true.
    byLogin.set(key, {
      ...presence,
      present: presence.present || existing.present,
      displayName: presence.displayName || existing.displayName,
    });
  }
  return Array.from(byLogin.values());
}

function normalizeEventItem(item: EventWithRegistrations): EventWithRegistrations {
  const registrations = dedupeRegistrations(item.registrations || []);
  return {
    ...item,
    registrations,
    registrationCount: registrations.length,
  };
}

export default function ListeEventsPage() {
  const [data, setData] = useState<EventWithRegistrations[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/events/registrations", {
        cache: 'no-store',
      });
      let eventsData: EventWithRegistrations[] = [];

      if (response.ok) {
        const result = await response.json();
        eventsData = (result.eventsWithRegistrations || []).map(normalizeEventItem);
        
        console.log(`[Liste Events Page] Événements reçus: ${eventsData.length}`, {
          totalEvents: result?.totalEvents,
          totalRegistrations: result?.totalRegistrations,
        });
        
        if (eventsData.length === 0) {
          console.warn('[Liste Events Page] Aucun événement reçu de l\'API');
        }
      } else {
        console.error("[Liste Events Page] API registrations non OK:", response.status);
      }

      // Fallback de resilience migration: même en cas d'erreur API registrations,
      // on recharge les événements bruts pour au moins afficher la liste.
      if (eventsData.length === 0) {
        try {
          let fallbackResponse = await fetch("/api/events?admin=true", { cache: "no-store" });
          if (!fallbackResponse.ok) {
            fallbackResponse = await fetch("/api/events", { cache: "no-store" });
          }

          if (fallbackResponse.ok) {
            const fallbackPayload = await fallbackResponse.json();
            const fallbackEvents = fallbackPayload.events || [];
            eventsData = fallbackEvents.map((event: any) => ({
              event: {
                id: event.id,
                title: event.title,
                date: event.startAtUtc || event.date,
                category: event.category,
                description: event.description,
                location: event.location,
                image: event.image,
                isPublished: event.isPublished ?? false,
              },
              registrations: [],
              registrationCount: 0,
            }));
          }
        } catch (fallbackError) {
          console.error("[Liste Events Page] Fallback /api/events échoué:", fallbackError);
        }
      }
        
      // Charger les présences pour chaque événement
      const eventsWithPresences = await Promise.all(
        eventsData.map(async (item: EventWithRegistrations) => {
          try {
            const presenceResponse = await fetch(`/api/admin/events/presence?eventId=${item.event.id}`, {
              cache: 'no-store',
            });
            if (presenceResponse.ok) {
              const presenceData = await presenceResponse.json();
              const presences = dedupePresences(presenceData.presences || []);
              const presentCount = presences.filter((p: any) => p.present).length;
              const absentCount = presences.filter((p: any) => !p.present).length;
              const registeredWithoutPresence = item.registrations.filter(reg =>
                !presences.some((p: any) => normalizeLogin(p.twitchLogin) === normalizeLogin(reg.twitchLogin))
              ).length;
              const totalAbsents = absentCount + registeredWithoutPresence;
              const presenceRate = item.registrationCount > 0
                ? Math.round((presentCount / item.registrationCount) * 100)
                : 0;

              return {
                ...item,
                presences,
                presenceCount: presentCount,
                absentCount: totalAbsents,
                presenceRate,
              };
            }
          } catch (error) {
            console.error(`Erreur chargement présences pour ${item.event.id}:`, error);
          }
          return {
            ...item,
            presences: [],
            presenceCount: 0,
            absentCount: item.registrationCount,
            presenceRate: 0,
          };
        })
      );
      
      setData(eventsWithPresences);
    } catch (error) {
      console.error("Erreur chargement données:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatEventDate = (dateStr: string): string => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  // Grouper les événements par catégorie et trier
  const groupEventsByCategory = () => {
    const grouped: Record<string, EventWithRegistrations[]> = {};
    
    data.forEach((item) => {
      const category = item.event.category || "Autre";
      
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(item);
    });

    // Trier les événements dans chaque catégorie : du plus récent au plus vieux
    Object.keys(grouped).forEach(category => {
      grouped[category].sort((a, b) => {
        // Trier par date décroissante (plus récent en premier)
        return new Date(b.event.date).getTime() - new Date(a.event.date).getTime();
      });
    });

    // Trier les catégories par ordre alphabétique
    return Object.entries(grouped).sort((a, b) => {
      return a[0].localeCompare(b[0], 'fr');
    });
  };

  const groupedEvents = groupEventsByCategory();

  // Calculer les statistiques générales
  const totalEvents = data.length;
  const totalRegistrations = data.reduce((sum, item) => sum + item.registrationCount, 0);
  const totalPresences = data.reduce((sum, item) => sum + (item.presenceCount || 0), 0);
  const totalAbsents = data.reduce((sum, item) => sum + (item.absentCount || 0), 0);
  const averageRegistrations = totalEvents > 0 ? Math.round(totalRegistrations / totalEvents) : 0;
  const averagePresences = totalEvents > 0 ? Math.round(totalPresences / totalEvents) : 0;
  const globalPresenceRate = totalRegistrations > 0 ? Math.round((totalPresences / totalRegistrations) * 100) : 0;
  const publishedEvents = data.filter(item => item.event.isPublished).length;

  // Statistiques par catégorie
  const categoryStats = Object.entries(
    data.reduce((acc, item) => {
      const cat = item.event.category || "Autre";
      if (!acc[cat]) {
        acc[cat] = {
          count: 0,
          registrations: 0,
          presences: 0,
          absents: 0,
        };
      }
      acc[cat].count++;
      acc[cat].registrations += item.registrationCount;
      acc[cat].presences += (item.presenceCount || 0);
      acc[cat].absents += (item.absentCount || 0);
      return acc;
    }, {} as Record<string, { count: number; registrations: number; presences: number; absents: number }>)
  ).map(([category, stats]) => ({
    category,
    ...stats,
    averageRegistrations: stats.count > 0 ? Math.round(stats.registrations / stats.count) : 0,
    averagePresences: stats.count > 0 ? Math.round(stats.presences / stats.count) : 0,
    presenceRate: stats.registrations > 0 ? Math.round((stats.presences / stats.registrations) * 100) : 0,
  }));

  return (
    <div className="relative isolate min-h-[calc(100vh-4rem)] min-w-0 scroll-smooth pb-10 text-white selection:bg-violet-500/35 [--liste-gap:clamp(1rem,1.55vw,1.85rem)]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-[max(-4rem,calc(-6vw))] top-[-2.5rem] -z-10 h-[clamp(240px,32vw,440px)] overflow-hidden blur-3xl"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_24%_-8%,rgba(167,139,250,0.28),transparent_54%),radial-gradient(ellipse_at_86%_22%,rgba(56,189,248,0.12),transparent_48%),radial-gradient(ellipse_at_52%_100%,rgba(244,114,182,0.09),transparent_52%)]" />
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

      <div className="mx-auto w-full max-w-[min(1720px,calc(100vw-2*clamp(0.6rem,1.75vw,1.75rem)))] px-[clamp(0.75rem,2vw,2.35rem)] pb-10 pt-2 sm:pb-12 sm:pt-3">
        <div className="grid min-w-0 grid-cols-1 gap-6 [--sidebar:min(100%,clamp(17rem,24vw,25rem))] xl:grid-cols-[minmax(0,1fr)_var(--sidebar)] xl:items-start xl:gap-[clamp(1.35rem,2.6vw,2.85rem)]">
          <main className="min-w-0 space-y-6 sm:space-y-8 xl:space-y-[var(--liste-gap)]">
            <header className={`grid min-w-0 gap-6 p-[clamp(1rem,2vw,1.6rem)] lg:grid-cols-[minmax(0,1.4fr)_minmax(260px,min(100%,0.94fr))] lg:gap-8 ${panelClass}`}>
              <div className="min-w-0 space-y-4">
                <Link
                  href="/admin/communaute/evenements"
                  className={`inline-flex items-center gap-1 text-[length:clamp(0.8rem,0.74rem+0.32vw,0.9375rem)] text-zinc-400 transition hover:text-white ${focusRingClass} rounded-lg`}
                >
                  <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden />
                  Retour pilotage événements
                </Link>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[length:clamp(0.65rem,0.58rem+0.25vw,0.6875rem)] font-semibold uppercase tracking-[0.11em] text-violet-100/92">
                    Inscriptions & présences
                  </span>
                  <span className="rounded-full border border-sky-400/26 bg-sky-500/[0.08] px-3 py-1 text-[length:clamp(0.65rem,0.58rem+0.25vw,0.6875rem)] font-semibold uppercase tracking-[0.11em] text-sky-100/90">
                    Vue consolidée
                  </span>
                </div>
                <div>
                  <p className="text-[length:clamp(0.6875rem,0.625rem+0.25vw,0.8125rem)] uppercase tracking-[0.12em] text-violet-200/95">
                    Communauté · Liste
                  </p>
                  <h1 className="mt-2 text-[clamp(1.45rem,1.05rem+1.05vw,2.35rem)] font-semibold tracking-tight text-white">
                    Événements et inscriptions
                  </h1>
                  <p className="mt-3 max-w-3xl text-[length:clamp(0.8125rem,0.75rem+0.32vw,0.9625rem)] leading-[1.65] text-zinc-400">
                    Parcourez les créneaux avec leurs inscrits et agrégats de présence. La grille principale s’étend sur grand
                    écran ; la colonne de droite reste accessible au défilement (sticky) pour les raccourcis staff.
                  </p>
                </div>
                <div className="flex min-w-0 flex-wrap gap-[clamp(0.4rem,0.85vw,0.625rem)]">
                  <button type="button" onClick={() => void loadData()} className={`${subtleButtonClass} ${focusRingClass}`}>
                    <RefreshCw className={`h-4 w-4 shrink-0 ${loading ? "animate-spin" : ""}`} aria-hidden />
                    Actualiser
                  </button>
                  <Link
                    href="/admin/communaute/evenements/calendrier"
                    className={`${subtleButtonClass} ${focusRingClass}`}
                  >
                    Calendrier staff
                    <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
                  </Link>
                  <Link
                    href="/evenements"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${subtleButtonClass} ${focusRingClass} border-sky-400/28 bg-sky-950/[0.35] text-sky-100`}
                  >
                    <ExternalLink className="h-4 w-4 shrink-0" aria-hidden />
                    Agenda public
                  </Link>
                </div>
              </div>
              <div className={`relative min-h-[11rem] p-[clamp(0.875rem,1.5vw,1.2rem)] sm:min-h-[12rem] ${heroVisualClass}`}>
                <div
                  aria-hidden
                  className="absolute inset-0 bg-[conic-gradient(from_200deg_at_72%_-10%,rgba(167,139,250,0.16),transparent_42%,transparent_58%,rgba(56,189,248,0.1))]"
                />
                <div aria-hidden className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.12),transparent_40%,transparent_65%,rgba(0,0,0,0.32))]" />
                <div className="relative flex h-full min-h-[10rem] flex-col justify-between gap-4">
                  <span className="inline-flex w-fit items-center gap-2 rounded-xl border border-violet-400/26 bg-violet-500/[0.11] px-3 py-1.5 text-[length:clamp(0.65rem,0.55rem+0.35vw,0.7rem)] font-semibold uppercase tracking-[0.08em] text-violet-50/96">
                    <Sparkles className="h-3.5 w-3.5 shrink-0 text-violet-200/92" aria-hidden />
                    Synthèse liste
                  </span>
                  <dl className="grid min-w-0 grid-cols-2 gap-[clamp(0.5rem,1vw,0.875rem)] text-[length:clamp(0.65rem,0.58rem+0.22vw,0.775rem)] sm:grid-cols-4">
                    <div className="rounded-xl border border-white/[0.08] bg-zinc-900/52 p-[clamp(0.45rem,0.85vw,0.55rem)] sm:col-span-1">
                      <dt className="font-medium uppercase tracking-wide text-zinc-500">Événements</dt>
                      <dd className="mt-1 text-[clamp(1.05rem,0.88rem+0.45vw,1.45rem)] font-semibold tabular-nums text-zinc-50">
                        {loading ? "…" : totalEvents}
                      </dd>
                    </div>
                    <div className="rounded-xl border border-white/[0.08] bg-zinc-900/52 p-[clamp(0.45rem,0.85vw,0.55rem)] sm:col-span-1">
                      <dt className="font-medium uppercase tracking-wide text-sky-500/90">Inscriptions</dt>
                      <dd className="mt-1 text-[clamp(1.05rem,0.88rem+0.45vw,1.45rem)] font-semibold tabular-nums text-sky-200/96">
                        {loading ? "…" : totalRegistrations}
                      </dd>
                    </div>
                    <div className="rounded-xl border border-white/[0.08] bg-zinc-900/52 p-[clamp(0.45rem,0.85vw,0.55rem)] sm:col-span-1">
                      <dt className="font-medium uppercase tracking-wide text-emerald-500/90">Présences</dt>
                      <dd className="mt-1 text-[clamp(1.05rem,0.88rem+0.45vw,1.45rem)] font-semibold tabular-nums text-emerald-200/96">
                        {loading ? "…" : totalPresences}
                      </dd>
                    </div>
                    <div className="rounded-xl border border-white/[0.08] bg-zinc-900/52 p-[clamp(0.45rem,0.85vw,0.55rem)] sm:col-span-1">
                      <dt className="font-medium uppercase tracking-wide text-violet-300/90">Taux global</dt>
                      <dd className="mt-1 text-[clamp(1.05rem,0.88rem+0.45vw,1.45rem)] font-semibold tabular-nums text-violet-100/95">
                        {loading ? "…" : `${globalPresenceRate}%`}
                      </dd>
                    </div>
                  </dl>
                  <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[length:clamp(0.65rem,0.56rem+0.26vw,0.78rem)] text-zinc-500">
                    <Compass className="h-3.5 w-3.5 shrink-0 text-violet-400/75" aria-hidden />
                    Données API inscriptions + présences par événement · zoom navigateur pris en charge (clamp).
                  </p>
                </div>
              </div>
            </header>

            {loading ? (
              <div className="space-y-[var(--liste-gap)]">
                <div className="grid min-w-0 grid-cols-1 gap-[var(--liste-gap)] md:grid-cols-2 lg:grid-cols-4">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className={`${panelClass} h-[clamp(7rem,9vw,7.75rem)] animate-pulse bg-zinc-800/35`} />
                  ))}
                </div>
                <div className={`${panelClass} h-[clamp(14rem,28vw,18rem)] animate-pulse bg-zinc-800/30`} />
                <div className="grid min-w-0 grid-cols-1 gap-[var(--liste-gap)] md:grid-cols-2 lg:grid-cols-3">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className={`${panelClass} h-40 animate-pulse bg-zinc-800/28`} />
                  ))}
                </div>
                <p className="text-center text-[length:clamp(0.8125rem,0.75rem+0.25vw,0.9375rem)] text-zinc-500">
                  Chargement des événements et des présences…
                </p>
              </div>
            ) : (
              <>
                {/* Statistiques générales */}
                {data.length > 0 && (
                  <div className="grid min-w-0 grid-cols-1 gap-[var(--liste-gap)] md:grid-cols-2 lg:grid-cols-4">
                    <div className={`${panelClass} p-[clamp(1rem,1.9vw,1.25rem)]`}>
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-[length:clamp(0.75rem,0.68rem+0.22vw,0.8125rem)] text-zinc-500">Total événements</span>
                        <Calendar className="h-5 w-5 shrink-0 text-violet-400" aria-hidden />
                      </div>
                      <p className="text-[clamp(1.65rem,1.35rem+0.95vw,2.125rem)] font-semibold tabular-nums text-white">{totalEvents}</p>
                      <p className="mt-1 text-[length:clamp(0.6875rem,0.625rem+0.18vw,0.78rem)] text-zinc-500">{publishedEvents} publiés</p>
                    </div>

                    <div className={`${panelClass} p-[clamp(1rem,1.9vw,1.25rem)]`}>
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-[length:clamp(0.75rem,0.68rem+0.22vw,0.8125rem)] text-zinc-500">Total inscriptions</span>
                        <Users className="h-5 w-5 shrink-0 text-sky-400" aria-hidden />
                      </div>
                      <p className="text-[clamp(1.65rem,1.35rem+0.95vw,2.125rem)] font-semibold tabular-nums text-white">{totalRegistrations}</p>
                      <p className="mt-1 text-[length:clamp(0.6875rem,0.625rem+0.18vw,0.78rem)] text-zinc-500">
                        Moyenne&nbsp;: {averageRegistrations}/événement
                      </p>
                    </div>

                    <div className={`${panelClass} border-emerald-500/18 p-[clamp(1rem,1.9vw,1.25rem)]`}>
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-[length:clamp(0.75rem,0.68rem+0.22vw,0.8125rem)] text-zinc-500">Total présences</span>
                        <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" aria-hidden />
                      </div>
                      <p className="text-[clamp(1.65rem,1.35rem+0.95vw,2.125rem)] font-semibold tabular-nums text-emerald-300">{totalPresences}</p>
                      <p className="mt-1 text-[length:clamp(0.6875rem,0.625rem+0.18vw,0.78rem)] text-zinc-500">
                        Moyenne&nbsp;: {averagePresences}/événement
                      </p>
                    </div>

                    <div className={`${panelClass} border-violet-500/18 p-[clamp(1rem,1.9vw,1.25rem)]`}>
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-[length:clamp(0.75rem,0.68rem+0.22vw,0.8125rem)] text-zinc-500">Taux de présence</span>
                        <TrendingUp className="h-5 w-5 shrink-0 text-violet-300" aria-hidden />
                      </div>
                      <p className="text-[clamp(1.65rem,1.35rem+0.95vw,2.125rem)] font-semibold tabular-nums text-violet-200">{globalPresenceRate}%</p>
                      <p className="mt-1 text-[length:clamp(0.6875rem,0.625rem+0.18vw,0.78rem)] text-zinc-500">{totalAbsents} absents</p>
                    </div>
                  </div>
                )}

                {/* Statistiques par catégorie */}
                {categoryStats.length > 0 && (
                  <div className={`${panelClass} p-[clamp(1.1rem,2vw,1.6rem)] sm:p-[clamp(1.125rem,2.2vw,1.75rem)]`}>
                    <div className="mb-4 flex items-center gap-2">
                      <BarChart3 className="h-6 w-6 shrink-0 text-violet-400" aria-hidden />
                      <h2 className="text-[length:clamp(1.0625rem,0.95rem+0.4vw,1.25rem)] font-semibold text-white">
                        Statistiques par catégorie
                      </h2>
                    </div>
                    <div className="grid min-w-0 grid-cols-1 gap-[var(--liste-gap)] md:grid-cols-2 lg:grid-cols-3">
                      {categoryStats.map((stat) => {
                        const catConfig = getCategoryConfig(stat.category);
                        return (
                          <div key={stat.category} className="rounded-xl border border-white/[0.07] bg-zinc-900/50 p-4">
                            <div className="mb-3 flex items-center justify-between">
                              <h3 className={`font-semibold ${catConfig.color}`}>{stat.category}</h3>
                              <span className="text-xs text-zinc-500">
                                {stat.count} événement{stat.count > 1 ? "s" : ""}
                              </span>
                            </div>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-zinc-500">Inscriptions&nbsp;:</span>
                                <span className="font-medium text-white">{stat.registrations}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-zinc-500">Moyenne&nbsp;:</span>
                                <span className="text-zinc-300">{stat.averageRegistrations}/événement</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-zinc-500">Présences&nbsp;:</span>
                                <span className="font-medium text-emerald-400">{stat.presences}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-zinc-500">Moyenne&nbsp;:</span>
                                <span className="text-emerald-400">{stat.averagePresences}/événement</span>
                              </div>
                              <div className="flex items-center justify-between border-t border-white/[0.08] pt-2">
                                <span className="text-zinc-500">Taux&nbsp;:</span>
                                <span
                                  className={`font-bold ${
                                    stat.presenceRate >= 80
                                      ? "text-emerald-400"
                                      : stat.presenceRate >= 50
                                        ? "text-amber-400"
                                        : "text-rose-400"
                                  }`}
                                >
                                  {stat.presenceRate}%
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {groupedEvents.length === 0 ? (
                  <div className={`${panelClass} p-8 text-center`}>
                    <p className="text-zinc-400">Aucun événement pour le moment</p>
                  </div>
                ) : (
                  <div className="space-y-[var(--liste-gap)]">
                    {groupedEvents.map(([category, categoryEvents]) => {
                      const catConfig = getCategoryConfig(category);
                      return (
                        <div key={category}>
                          <div className="mb-6">
                            <div className="mb-3 flex flex-wrap items-center gap-3">
                              <h2 className="text-[length:clamp(1.125rem,1rem+0.55vw,1.5rem)] font-semibold text-white">
                                Type d&apos;événement&nbsp;: <span className={catConfig.color}>{category}</span>
                              </h2>
                              <span className="text-sm text-zinc-500">
                                ({categoryEvents.length} {categoryEvents.length > 1 ? "événements" : "événement"})
                              </span>
                            </div>
                            <div className={`h-px border-t ${catConfig.borderColor}`} />
                          </div>

                          <div className="grid min-w-0 grid-cols-1 gap-[var(--liste-gap)] md:grid-cols-2 xl:grid-cols-3 2xl:gap-8">
                            {categoryEvents.map((item) => {
                              const itemCatConfig = getCategoryConfig(item.event.category);
                              return (
                                <div
                                  key={item.event.id}
                                  className={`${panelClass} group overflow-hidden transition hover:border-violet-400/35 hover:shadow-lg hover:shadow-violet-950/25`}
                                >
                                  {item.event.image && (
                                    <div className="relative h-48 w-full overflow-hidden bg-zinc-800">
                                      <img
                                        src={item.event.image}
                                        alt={item.event.title}
                                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                                      />
                                    </div>
                                  )}

                                  <div className="p-4 sm:p-[clamp(1rem,1.8vw,1.25rem)]">
                                    <div className="mb-2 flex items-start justify-between">
                                      <h3 className="line-clamp-2 flex-1 text-[length:clamp(1rem,0.9rem+0.35vw,1.125rem)] font-semibold text-white">
                                        {item.event.title}
                                      </h3>
                                    </div>

                                    <div className="mb-3 flex flex-wrap items-center gap-2">
                                      <span
                                        className={`rounded border px-2 py-1 text-xs ${itemCatConfig.bgColor} ${itemCatConfig.color} ${itemCatConfig.borderColor}`}
                                      >
                                        {item.event.category}
                                      </span>
                                      {item.event.isPublished && (
                                        <span className="rounded border border-emerald-500/30 bg-emerald-500/20 px-2 py-1 text-xs text-emerald-300">
                                          Publié
                                        </span>
                                      )}
                                    </div>

                                    <div className="mb-3 space-y-2 text-sm">
                                      <div className="flex items-center gap-2 text-zinc-500">
                                        <Calendar className="h-4 w-4 shrink-0" aria-hidden />
                                        <span>{formatEventDate(item.event.date)}</span>
                                      </div>
                                      {item.event.location && (
                                        <div className="flex items-center gap-2 text-zinc-500">
                                          <MapPin className="h-4 w-4 shrink-0" aria-hidden />
                                          <span>{item.event.location}</span>
                                        </div>
                                      )}
                                      <div className="flex items-center justify-between border-t border-white/[0.08] pt-2">
                                        <div className="flex items-center gap-2 text-zinc-500">
                                          <Users className="h-4 w-4 shrink-0" aria-hidden />
                                          <span>
                                            {item.registrationCount} inscription{item.registrationCount > 1 ? "s" : ""}
                                          </span>
                                        </div>
                                        {item.presenceCount !== undefined && (
                                          <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-1 text-emerald-400">
                                              <CheckCircle2 className="h-3 w-3 shrink-0" aria-hidden />
                                              <span className="text-xs font-medium">{item.presenceCount}</span>
                                            </div>
                                            {item.absentCount !== undefined && item.absentCount > 0 && (
                                              <div className="flex items-center gap-1 text-rose-400">
                                                <XCircle className="h-3 w-3 shrink-0" aria-hidden />
                                                <span className="text-xs font-medium">{item.absentCount}</span>
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                      {item.presenceRate !== undefined && item.presenceRate > 0 && (
                                        <div className="flex items-center justify-between pt-1">
                                          <span className="text-xs text-zinc-500">Taux de présence</span>
                                          <span
                                            className={`text-xs font-semibold ${
                                              item.presenceRate >= 80
                                                ? "text-emerald-400"
                                                : item.presenceRate >= 50
                                                  ? "text-amber-400"
                                                  : "text-rose-400"
                                            }`}
                                          >
                                            {item.presenceRate}%
                                          </span>
                                        </div>
                                      )}
                                    </div>

                                    {item.event.description && (
                                      <p className="mb-3 line-clamp-2 text-sm text-zinc-400">{item.event.description}</p>
                                    )}

                                    <button
                                      type="button"
                                      onClick={() =>
                                        setSelectedEvent(selectedEvent === item.event.id ? null : item.event.id)
                                      }
                                      className={`${subtleButtonClass} ${focusRingClass} mt-3 w-full border-violet-500/35 bg-violet-600/[0.28] hover:bg-violet-600/[0.38]`}
                                    >
                                      {selectedEvent === item.event.id ? "Masquer les inscrits" : "Voir les inscrits"}
                                    </button>

                                    {selectedEvent === item.event.id && (
                                      <div className="mt-4 border-t border-white/[0.08] pt-4">
                                        {item.registrations.length === 0 ? (
                                          <p className="py-2 text-center text-sm text-zinc-500">Aucune inscription</p>
                                        ) : (
                                          <div className="max-h-64 space-y-2 overflow-y-auto">
                                            {item.registrations.map((reg) => (
                                              <div
                                                key={reg.id}
                                                className="rounded-lg border border-white/[0.08] bg-zinc-900/60 p-2"
                                              >
                                                <div className="text-sm font-semibold text-white">{reg.displayName}</div>
                                                <div className="text-xs text-zinc-500">@{reg.twitchLogin}</div>
                                                <div className="mt-1 text-xs text-zinc-600">
                                                  Inscrit le {new Date(reg.registeredAt).toLocaleDateString("fr-FR")}
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </main>

          <aside className="min-w-0 space-y-4 xl:sticky xl:top-5 xl:self-start" aria-label="Aide liste événements">
            <div className={`${panelClass} space-y-3 p-[clamp(0.875rem,1.75vw,1.25rem)]`}>
              <p className="text-[length:clamp(0.6875rem,0.625rem+0.2vw,0.8125rem)] font-semibold uppercase tracking-[0.1em] text-zinc-500">
                Source des données
              </p>
              <p className="text-[length:clamp(0.75rem,0.68rem+0.28vw,0.8625rem)] leading-[1.6] text-zinc-400">
                Les inscriptions viennent de l’API admin dédiée ; en secours, la liste peut se remplir depuis{" "}
                <code className="rounded bg-zinc-900 px-1 py-0.5 text-[0.85em] text-zinc-300">/api/events</code> sans
                détail inscrits.
              </p>
            </div>

            <div className={`${panelClass} p-[clamp(0.875rem,1.75vw,1.25rem)]`}>
              <p className="flex items-center gap-2 text-[length:clamp(0.6875rem,0.625rem+0.2vw,0.8125rem)] font-semibold uppercase tracking-[0.08em] text-zinc-500">
                <ListOrdered className="h-4 w-4 shrink-0 text-violet-300/85" aria-hidden />
                Lire cette page
              </p>
              <ol className="mt-4 space-y-[0.65rem]">
                {listeAsideSteps.map((step) => (
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

            <div className={`${panelClass} p-[clamp(0.875rem,1.75vw,1.25rem)]`}>
              <p className="text-[length:clamp(0.6875rem,0.625rem+0.2vw,0.8125rem)] font-semibold uppercase tracking-[0.08em] text-zinc-500">
                Raccourcis
              </p>
              <nav className="mt-3 flex flex-col gap-2" aria-label="Navigation événements">
                <Link
                  href="/admin/communaute/evenements/participation"
                  className={`flex min-h-[2.85rem] min-w-0 items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-zinc-900/45 px-3 py-2 text-[length:clamp(0.78rem,0.72rem+0.22vw,0.9rem)] font-medium text-zinc-100 transition hover:border-sky-400/26 hover:bg-zinc-900/72 ${focusRingClass}`}
                >
                  Participation
                  <ArrowRight className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
                </Link>
                <Link
                  href="/admin/communaute/evenements/suivi"
                  className={`flex min-h-[2.85rem] min-w-0 items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-zinc-900/45 px-3 py-2 text-[length:clamp(0.78rem,0.72rem+0.22vw,0.9rem)] font-medium text-zinc-100 transition hover:border-emerald-400/26 hover:bg-zinc-900/72 ${focusRingClass}`}
                >
                  Suivi par type
                  <ArrowRight className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
                </Link>
                <Link
                  href="/admin/communaute/evenements/recap"
                  className={`flex min-h-[2.85rem] min-w-0 items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-zinc-900/45 px-3 py-2 text-[length:clamp(0.78rem,0.72rem+0.22vw,0.9rem)] font-medium text-zinc-100 transition hover:border-fuchsia-400/22 hover:bg-zinc-900/72 ${focusRingClass}`}
                >
                  Récapitulatif
                  <ArrowRight className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
                </Link>
                <Link
                  href="/admin/events"
                  className={`flex min-h-[2.85rem] min-w-0 items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-zinc-900/45 px-3 py-2 text-[length:clamp(0.78rem,0.72rem+0.22vw,0.9rem)] font-medium text-zinc-100 transition hover:border-white/14 hover:bg-zinc-900/72 ${focusRingClass}`}
                >
                  Hub admin événements
                  <ArrowRight className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
                </Link>
                <Link
                  href="/admin/communaute/evenements"
                  className={`flex min-h-[2.85rem] min-w-0 items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-zinc-900/45 px-3 py-2 text-[length:clamp(0.78rem,0.72rem+0.22vw,0.9rem)] font-medium text-zinc-100 transition hover:border-violet-400/26 hover:bg-zinc-900/72 ${focusRingClass}`}
                >
                  <span className="inline-flex min-w-0 items-center gap-2">
                    <CalendarCheck2 className="h-4 w-4 shrink-0 opacity-85" aria-hidden />
                    Pilotage communauté
                  </span>
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


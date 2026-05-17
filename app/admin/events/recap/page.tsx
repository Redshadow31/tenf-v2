"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  Calendar,
  CalendarCheck2,
  CalendarDays,
  ChevronLeft,
  Compass,
  ListOrdered,
  RefreshCw,
  Sparkles,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react";

interface EventPresence {
  id: string;
  twitchLogin: string;
  displayName: string;
  present: boolean;
}

interface RecapData {
  totalEvents: number;
  totalRegistrations: number;
  eventsWithRegistrations: Array<{
    event: {
      id: string;
      title: string;
      date: string;
      category: string;
      isPublished: boolean;
    };
    registrations: Array<any>;
    registrationCount: number;
    presences?: EventPresence[];
    presenceCount?: number; // Nombre de présents (present: true)
  }>;
}

type ViewMode = "all" | "month";

const layoutPanelClass =
  "rounded-2xl border border-white/[0.08] bg-zinc-950/55 shadow-sm shadow-black/20 ring-1 ring-inset ring-white/[0.03]";
const heroVisualClass =
  "relative isolate overflow-hidden rounded-2xl border border-violet-500/20 bg-zinc-950/70 ring-1 ring-inset ring-violet-500/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]";
const hubSubtleBtnClass =
  "inline-flex min-h-[2.5rem] items-center gap-2 rounded-xl border border-violet-500/25 bg-violet-950/25 px-3 py-2 text-sm font-medium text-violet-100 transition hover:border-violet-400/40 hover:bg-violet-900/30";
const focusRingClass =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950";

const recapAsideSteps = [
  {
    n: "1",
    title: "Choisir la fenêtre",
    body: "« Tout » pour la vision globale ; « Par mois » pour isoler une campagne ou comparer deux périodes sans bruit.",
  },
  {
    n: "2",
    title: "Top hors staff",
    body: "Le mode « Hors staff » met en avant les membres hors rôles animation : utile pour mesurer l’adhésion communautaire.",
  },
  {
    n: "3",
    title: "Croiser avec les présences",
    body: "Les chiffres s’appuient sur les feuilles de présence saisies ; un créneau sans saisie peut sous-estimer la réalité.",
  },
];

const legacyShellCard = "bg-[#1a1a1d] border border-gray-700 rounded-lg";
const legacyInsetCard = "bg-[#0e0e10] border border-gray-700 rounded-lg";

function normalizeLogin(value?: string): string {
  return (value || "").trim().toLowerCase();
}

function safeTs(value?: string): number {
  if (!value) return 0;
  const ts = new Date(value).getTime();
  return Number.isNaN(ts) ? 0 : ts;
}

function dedupeRegistrations(registrations: Array<any>): Array<any> {
  const byLogin = new Map<string, any>();
  for (const reg of registrations || []) {
    const key = normalizeLogin(reg?.twitchLogin);
    if (!key) continue;
    const existing = byLogin.get(key);
    if (!existing || safeTs(reg?.registeredAt) >= safeTs(existing?.registeredAt)) {
      byLogin.set(key, reg);
    }
  }
  return Array.from(byLogin.values());
}

function dedupePresences(presences: EventPresence[]): EventPresence[] {
  const byLogin = new Map<string, EventPresence>();
  for (const presence of presences || []) {
    const key = normalizeLogin(presence?.twitchLogin);
    if (!key) continue;
    const existing = byLogin.get(key);
    if (!existing) {
      byLogin.set(key, presence);
      continue;
    }
    // Garder la plus récente. En cas d'égalité stricte, privilégier absent
    // pour éviter de compter un faux présent.
    const existingTs = safeTs((existing as any).validatedAt) || safeTs((existing as any).createdAt);
    const currentTs = safeTs((presence as any).validatedAt) || safeTs((presence as any).createdAt);
    const hasClearNewer = currentTs !== existingTs;
    const newer = hasClearNewer ? (currentTs > existingTs ? presence : existing) : presence;
    const older = newer === presence ? existing : presence;
    const resolvedPresent = hasClearNewer
      ? newer.present
      : (newer.present && older.present);
    byLogin.set(key, {
      ...newer,
      present: resolvedPresent,
      displayName: newer.displayName || older.displayName,
    });
  }
  return Array.from(byLogin.values());
}

function normalizeEventItem(item: any) {
  const registrations = dedupeRegistrations(item.registrations || []);
  const presences = dedupePresences(item.presences || []);
  const presenceCount = presences.filter((p) => p.present).length;
  return {
    ...item,
    registrations,
    registrationCount: registrations.length,
    presences,
    presenceCount,
  };
}

export default function RecapPage() {
  const pathname = usePathname() || "";
  const hubLayout = pathname.startsWith("/admin/communaute/evenements");
  const [data, setData] = useState<RecapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("all");
  const [topMode, setTopMode] = useState<"all" | "noStaff">("all");
  const [staffLogins, setStaffLogins] = useState<Set<string>>(new Set());
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Charger les inscriptions + membres (pour filtre staff) en parallèle
      const [registrationsResponse, membersResponse] = await Promise.all([
        fetch("/api/admin/events/registrations", {
          cache: "no-store",
        }),
        fetch("/api/admin/members", {
          cache: "no-store",
        }),
      ]);
      
      let eventsData: any[] = [];
      if (registrationsResponse.ok) {
        const registrationsResult = await registrationsResponse.json();
        eventsData = registrationsResult.eventsWithRegistrations || [];
      } else {
        // Fallback: afficher au moins les événements même si les inscriptions admin ne remontent pas.
        const fallbackEventsResponse = await fetch("/api/events?admin=true", { cache: "no-store" });
        if (fallbackEventsResponse.ok) {
          const fallbackPayload = await fallbackEventsResponse.json();
          eventsData = (fallbackPayload.events || []).map((event: any) => ({
            event: {
              id: event.id,
              title: event.title,
              date: event.startAtUtc || event.date,
              category: event.category,
              isPublished: event.isPublished ?? false,
            },
            registrations: [],
            registrationCount: 0,
          }));
        }
      }
      
      // Charger les présences pour chaque événement passé uniquement
      const eventsWithPresencesRaw = await Promise.all(
        eventsData.map(async (item: any) => {
          try {
            const presenceResponse = await fetch(
              `/api/admin/events/presence?eventId=${item.event.id}`,
              { cache: 'no-store' }
            );
            
            if (presenceResponse.ok) {
              const presenceData = await presenceResponse.json();
              const presences = presenceData.presences || [];
              // Compter uniquement les présents (present: true)
              const presenceCount = presences.filter((p: EventPresence) => p.present).length;
              
              return {
                ...item,
                presences,
                presenceCount,
              };
            }
            
            return {
              ...item,
              presences: [],
              presenceCount: 0,
            };
          } catch (error) {
            console.error(`Erreur chargement présences pour ${item.event.id}:`, error);
            return {
              ...item,
              presences: [],
              presenceCount: 0,
            };
          }
        })
      );
      const eventsWithPresences = eventsWithPresencesRaw.map(normalizeEventItem);
      
      // Calculer le total des inscriptions de tous les événements affichés
      const totalRegistrationsPast = eventsWithPresences.reduce(
        (sum, item) => sum + item.registrationCount,
        0
      );

      // Construire la liste staff via les rôles membres
      if (membersResponse.ok) {
        const membersPayload = await membersResponse.json();
        const STAFF_ROLES = new Set([
          "Admin",
          "Admin Coordinateur",
          "Modérateur",
          "Modérateur en formation",
          "Modérateur en activité réduite",
          "Modérateur en pause",
          "Soutien TENF",
        ]);
        const staffSet = new Set<string>(
          (membersPayload.members || [])
            .filter((m: any) => STAFF_ROLES.has(m.role))
            .map((m: any) => (m.twitchLogin || "").toLowerCase())
            .filter(Boolean)
        );
        setStaffLogins(staffSet);
      } else {
        setStaffLogins(new Set());
      }
      
      setData({
        totalEvents: eventsWithPresences.length,
        totalRegistrations: totalRegistrationsPast,
        eventsWithRegistrations: eventsWithPresences,
      });
    } catch (error) {
      console.error("Erreur chargement données:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrage par mois ou tout
  const displayedEvents = !data ? [] : viewMode === "all"
    ? data.eventsWithRegistrations
    : data.eventsWithRegistrations.filter((item: any) => {
        const d = new Date(item.event.date);
        return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth;
      });
  const viewData: RecapData | null = data ? {
    totalEvents: displayedEvents.length,
    totalRegistrations: displayedEvents.reduce((s, i) => s + i.registrationCount, 0),
    eventsWithRegistrations: displayedEvents,
  } : null;

  const getCategoryStats = (source: RecapData | null = viewData) => {
    if (!source) return {};
    const stats: Record<string, { count: number; registrations: number; totalPresences: number; uniqueParticipants: number }> = {};
    const uniqueLoginsByCategory: Record<string, Set<string>> = {};
    source.eventsWithRegistrations.forEach((item) => {
      const cat = item.event.category;
      if (!stats[cat]) {
        stats[cat] = { count: 0, registrations: 0, totalPresences: 0, uniqueParticipants: 0 };
        uniqueLoginsByCategory[cat] = new Set();
      }
      stats[cat].count++;
      stats[cat].registrations += item.registrationCount;
      // Ajouter le nombre de présents pour cet événement
      stats[cat].totalPresences += item.presenceCount || 0;
      // Collecter les participants uniques par catégorie
      if (item.presences) {
        item.presences.forEach((presence: EventPresence) => {
          if (presence.present && presence.twitchLogin) {
            uniqueLoginsByCategory[cat].add(presence.twitchLogin.toLowerCase());
          }
        });
      }
    });
    // Affecter le nombre de participants uniques
    Object.keys(stats).forEach((cat) => {
      stats[cat].uniqueParticipants = uniqueLoginsByCategory[cat]?.size || 0;
    });
    return stats;
  };

  const getAveragePresences = (source: RecapData | null = viewData) => {
    if (!source || source.totalEvents === 0) return 0;
    const totalPresences = source.eventsWithRegistrations.reduce(
      (sum, item) => sum + (item.presenceCount || 0),
      0
    );
    return Math.round((totalPresences / source.totalEvents) * 10) / 10;
  };

  const getTotalPresences = (source: RecapData | null = viewData) => {
    if (!source) return 0;
    return source.eventsWithRegistrations.reduce(
      (sum, item) => sum + (item.presenceCount || 0),
      0
    );
  };

  const getUniqueParticipants = (source: RecapData | null = viewData) => {
    if (!source) return 0;
    const uniqueLogins = new Set<string>();
    source.eventsWithRegistrations.forEach((item) => {
      // Compter uniquement les présents
      if (item.presences) {
        item.presences.forEach((presence: EventPresence) => {
          if (presence.present && presence.twitchLogin) {
            uniqueLogins.add(presence.twitchLogin.toLowerCase());
          }
        });
      }
    });
    return uniqueLogins.size;
  };

  const getTopParticipantsByCategory = (
    source: RecapData | null = viewData,
    excludeStaff: boolean = false
  ) => {
    if (!source) return {} as Record<string, Array<{ login: string; count: number }>>;

    const counters: Record<string, Map<string, number>> = {};

    source.eventsWithRegistrations.forEach((item) => {
      const cat = item.event.category;
      if (!counters[cat]) counters[cat] = new Map<string, number>();

      // Dédupliquer par login dans un même événement pour éviter le double comptage legacy/v2.
      const uniquePresentInEvent = new Set<string>();
      (item.presences || [])
        .filter((presence: EventPresence) => presence.present && !!presence.twitchLogin)
        .forEach((presence: EventPresence) => {
          const login = normalizeLogin(presence.twitchLogin);
          if (!login || uniquePresentInEvent.has(login)) return;
          uniquePresentInEvent.add(login);
          if (excludeStaff && staffLogins.has(login)) return;
          counters[cat].set(login, (counters[cat].get(login) || 0) + 1);
        });
    });

    const result: Record<string, Array<{ login: string; count: number }>> = {};
    Object.entries(counters).forEach(([cat, map]) => {
      result[cat] = Array.from(map.entries())
        .map(([login, count]) => ({ login, count }))
        .sort((a, b) => (b.count !== a.count ? b.count - a.count : a.login.localeCompare(b.login, "fr")))
        .slice(0, 5);
    });
    return result;
  };

  const totalPresences = getTotalPresences();
  const uniqueParticipants = getUniqueParticipants();
  const topByCategory = getTopParticipantsByCategory(viewData, topMode === "noStaff");

  const monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
  const currentYear = now.getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
  const eventsBasePath = hubLayout ? "/admin/communaute/evenements" : "/admin/events";
  const shellCard = hubLayout ? layoutPanelClass : legacyShellCard;
  const insetCard = hubLayout
    ? "rounded-xl border border-white/[0.08] bg-zinc-900/45 ring-1 ring-inset ring-white/[0.04]"
    : legacyInsetCard;
  const tabActive = hubLayout
    ? "border border-violet-400/35 bg-violet-600/25 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
    : "bg-[#9146ff] text-white";
  const tabInactive = hubLayout
    ? "border border-white/10 bg-zinc-900/50 text-zinc-400 hover:text-white hover:border-violet-400/25"
    : "bg-[#0e0e10] text-gray-400 hover:text-white border border-gray-700";
  const selectControl = hubLayout
    ? `rounded-xl border border-white/10 bg-zinc-900/80 px-3 py-2 text-sm text-white ring-1 ring-inset ring-white/[0.04] ${focusRingClass}`
    : "bg-[#0e0e10] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm";
  const accentNumber = hubLayout ? "text-violet-300" : "text-[#9146ff]";

  if (loading) {
    if (hubLayout) {
      return (
        <div className="relative isolate min-h-[calc(100vh-4rem)] min-w-0 scroll-smooth pb-12 text-white selection:bg-violet-500/35 [--rec-gap:clamp(1rem,1.55vw,1.85rem)]">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-[max(-4rem,calc(-6vw))] top-[-2.5rem] -z-10 h-[clamp(240px,32vw,440px)] overflow-hidden blur-3xl"
          >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_24%_-8%,rgba(167,139,250,0.28),transparent_54%),radial-gradient(ellipse_at_86%_22%,rgba(244,114,182,0.12),transparent_48%),radial-gradient(ellipse_at_52%_100%,rgba(56,189,248,0.1),transparent_52%)]" />
          </div>
          <div className="mx-auto w-full max-w-[min(1720px,calc(100vw-2*clamp(0.6rem,1.75vw,1.75rem)))] px-[clamp(0.75rem,2vw,2.35rem)] pb-12 pt-2 sm:pt-3">
            <div className="grid min-w-0 grid-cols-1 gap-6 [--sidebar:min(100%,clamp(17rem,24vw,25rem))] xl:grid-cols-[minmax(0,1fr)_var(--sidebar)] xl:items-start xl:gap-[clamp(1.35rem,2.6vw,2.85rem)]">
              <div className="min-w-0 space-y-6 sm:space-y-8 xl:space-y-[var(--rec-gap)]">
                <div className={`grid min-w-0 gap-6 p-[clamp(1rem,2vw,1.6rem)] lg:grid-cols-2 lg:gap-8 ${layoutPanelClass}`}>
                  <div className="space-y-4">
                    <div className="h-4 w-44 animate-pulse rounded-lg bg-zinc-700/60" />
                    <div className="h-9 max-w-lg animate-pulse rounded-xl bg-zinc-800/70" />
                    <div className="h-16 max-w-2xl animate-pulse rounded-xl bg-zinc-800/50" />
                  </div>
                  <div className={`min-h-[11rem] animate-pulse rounded-2xl bg-zinc-900/60 ${heroVisualClass}`} />
                </div>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div key={i} className={`h-28 animate-pulse rounded-2xl bg-zinc-900/45 ${layoutPanelClass}`} />
                  ))}
                </div>
              </div>
              <div className="hidden min-w-0 space-y-4 xl:block">
                <div className={`h-32 animate-pulse rounded-2xl bg-zinc-900/45 ${layoutPanelClass}`} />
                <div className={`h-40 animate-pulse rounded-2xl bg-zinc-900/45 ${layoutPanelClass}`} />
              </div>
            </div>
            <p className="mt-6 text-center text-sm text-zinc-500">Chargement du récapitulatif…</p>
          </div>
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-[#0e0e10] text-white">
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[#9146ff]" />
        </div>
      </div>
    );
  }

  const categoryStats = getCategoryStats();

  return (
    <div
      className={
        hubLayout
          ? "relative isolate min-h-[calc(100vh-4rem)] min-w-0 scroll-smooth pb-12 text-white selection:bg-violet-500/35 [--rec-gap:clamp(1rem,1.55vw,1.85rem)]"
          : "min-h-screen bg-[#0e0e10] p-8 text-white"
      }
    >
      {hubLayout ? (
        <>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-[max(-4rem,calc(-6vw))] top-[-2.5rem] -z-10 h-[clamp(240px,32vw,440px)] overflow-hidden blur-3xl"
          >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_24%_-8%,rgba(167,139,250,0.28),transparent_54%),radial-gradient(ellipse_at_86%_22%,rgba(244,114,182,0.12),transparent_48%),radial-gradient(ellipse_at_52%_100%,rgba(56,189,248,0.1),transparent_52%)]" />
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
        </>
      ) : null}
      <div
        className={
          hubLayout
            ? "mx-auto w-full max-w-[min(1720px,calc(100vw-2*clamp(0.6rem,1.75vw,1.75rem)))] px-[clamp(0.75rem,2vw,2.35rem)] pb-12 pt-2 sm:pt-3"
            : ""
        }
      >
        <div
          className={
            hubLayout
              ? "grid min-w-0 grid-cols-1 gap-6 [--sidebar:min(100%,clamp(17rem,24vw,25rem))] xl:grid-cols-[minmax(0,1fr)_var(--sidebar)] xl:items-start xl:gap-[clamp(1.35rem,2.6vw,2.85rem)]"
              : "contents"
          }
        >
          <div
            className={
              hubLayout
                ? "min-w-0 space-y-6 sm:space-y-8 xl:space-y-[var(--rec-gap)]"
                : ""
            }
          >
            {hubLayout ? (
              <header
                className={`grid min-w-0 gap-6 p-[clamp(1rem,2vw,1.6rem)] lg:grid-cols-[minmax(0,1.4fr)_minmax(260px,min(100%,0.94fr))] lg:gap-8 ${layoutPanelClass}`}
              >
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
                      Lecture & décisions
                    </span>
                    <span className="rounded-full border border-sky-400/26 bg-sky-500/[0.08] px-3 py-1 text-[length:clamp(0.65rem,0.58rem+0.25vw,0.6875rem)] font-semibold uppercase tracking-[0.11em] text-sky-100/90">
                      Alignement staff
                    </span>
                  </div>
                  <div>
                    <p className="text-[length:clamp(0.6875rem,0.625rem+0.25vw,0.8125rem)] uppercase tracking-[0.12em] text-violet-200/95">
                      Récapitulatif — historique & tendances
                    </p>
                    <h1 className="mt-2 text-[clamp(1.45rem,1.05rem+1.05vw,2.35rem)] font-semibold tracking-tight text-white">
                      Récapitulatif des événements
                    </h1>
                    <p className="mt-3 max-w-3xl text-[length:clamp(0.8125rem,0.75rem+0.32vw,0.9625rem)] leading-[1.65] text-zinc-400">
                      Vue agrégée des inscriptions et présences saisies sur les créneaux : utile pour cadrer une saison,
                      comparer des périodes ou repérer les formats qui portent le mieux.
                    </p>
                  </div>
                  <div className="flex min-w-0 flex-wrap gap-[clamp(0.4rem,0.85vw,0.625rem)]">
                    <button
                      type="button"
                      onClick={() => void loadData()}
                      className={`${hubSubtleBtnClass} ${focusRingClass}`}
                    >
                      <RefreshCw className="h-4 w-4 shrink-0" aria-hidden />
                      Actualiser
                    </button>
                    <Link
                      href="/admin/communaute/evenements/participation"
                      className={`${hubSubtleBtnClass} ${focusRingClass} border-emerald-400/28 bg-emerald-950/[0.28] text-emerald-100`}
                    >
                      <UserCheck className="h-4 w-4 shrink-0" aria-hidden />
                      Feuilles de présence
                    </Link>
                    <Link href="/admin/communaute/evenements/calendrier" className={`${hubSubtleBtnClass} ${focusRingClass}`}>
                      <CalendarDays className="h-4 w-4 shrink-0" aria-hidden />
                      Calendrier
                    </Link>
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
                      Synthèse (vue active)
                    </span>
                    <dl className="grid min-w-0 grid-cols-3 gap-[clamp(0.45rem,0.9vw,0.65rem)] text-[length:clamp(0.65rem,0.58rem+0.22vw,0.775rem)]">
                      <div className="rounded-xl border border-white/[0.08] bg-zinc-900/52 p-[clamp(0.45rem,0.85vw,0.55rem)] text-center">
                        <dt className="font-medium uppercase tracking-wide text-zinc-500">Événements</dt>
                        <dd className="mt-1 text-[clamp(1.05rem,0.88rem+0.45vw,1.45rem)] font-semibold tabular-nums text-zinc-50">
                          {viewData?.totalEvents ?? 0}
                        </dd>
                      </div>
                      <div className="rounded-xl border border-white/[0.08] bg-zinc-900/52 p-[clamp(0.45rem,0.85vw,0.55rem)] text-center">
                        <dt className="font-medium uppercase tracking-wide text-zinc-500">Inscriptions</dt>
                        <dd className="mt-1 text-[clamp(1.05rem,0.88rem+0.45vw,1.45rem)] font-semibold tabular-nums text-zinc-50">
                          {viewData?.totalRegistrations ?? 0}
                        </dd>
                      </div>
                      <div className="rounded-xl border border-white/[0.08] bg-zinc-900/52 p-[clamp(0.45rem,0.85vw,0.55rem)] text-center">
                        <dt className="font-medium uppercase tracking-wide text-zinc-500">Présences</dt>
                        <dd className="mt-1 text-[clamp(1.05rem,0.88rem+0.45vw,1.45rem)] font-semibold tabular-nums text-emerald-200/95">
                          {totalPresences}
                        </dd>
                      </div>
                    </dl>
                    <p className="text-[length:clamp(0.65rem,0.58rem+0.2vw,0.75rem)] leading-snug text-zinc-500">
                      Participants uniques :{" "}
                      <span className="font-semibold tabular-nums text-zinc-200">{uniqueParticipants}</span>
                      <span className="mx-1.5 text-zinc-600">·</span>
                      Moy. / événement :{" "}
                      <span className="font-semibold tabular-nums text-zinc-200">{getAveragePresences()}</span>
                    </p>
                  </div>
                </div>
              </header>
            ) : (
              <div className="mb-8">
                <Link
                  href={eventsBasePath}
                  className="mb-4 inline-block text-gray-400 transition-colors hover:text-white"
                >
                  ← Retour aux événements
                </Link>
                <h1 className="mb-2 text-4xl font-bold text-white">Récapitulatif des Événements</h1>
                <p className="text-gray-400">Statistiques et analyse des événements TENF</p>
              </div>
            )}

      {/* Filtre Tout / Par mois */}
      {data && data.eventsWithRegistrations.length > 0 && (
        <div className={`${shellCard} p-4 mb-6 flex flex-wrap items-center gap-4`}>
          <span className="text-gray-400 text-sm font-medium">Afficher :</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setViewMode("all")}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${focusRingClass} ${
                viewMode === "all" ? tabActive : tabInactive
              }`}
            >
              Tout
            </button>
            <button
              type="button"
              onClick={() => setViewMode("month")}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${focusRingClass} ${
                viewMode === "month" ? tabActive : tabInactive
              }`}
            >
              Par mois
            </button>
          </div>
          {viewMode === "month" && (
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className={selectControl}
              >
                {monthNames.map((name, i) => (
                  <option key={i} value={i}>{name}</option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className={selectControl}
              >
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <span className="text-gray-400 text-sm">
                {monthNames[selectedMonth]} {selectedYear}
              </span>
            </div>
          )}
        </div>
      )}

      {!viewData || viewData.totalEvents === 0 ? (
        <div className={`${shellCard} p-8 text-center`}>
          <p className="text-gray-400">
            {viewMode === "month"
              ? `Aucun événement pour ${monthNames[selectedMonth]} ${selectedYear}`
              : "Aucune donnée disponible"}
          </p>
        </div>
      ) : (
        <>
          {/* Statistiques globales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <div className={`${shellCard} p-6`}>
              <div className="flex items-center gap-3 mb-2">
                <Calendar className={`h-6 w-6 ${accentNumber}`} />
                <h3 className="text-sm font-semibold text-gray-400">
                  Total Événements
                </h3>
              </div>
              <p className="text-3xl font-bold text-white">
                {viewData.totalEvents}
              </p>
            </div>

            <div className={`${shellCard} p-6`}>
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-6 h-6 text-blue-400" />
                <h3 className="text-sm font-semibold text-gray-400">
                  Total Inscriptions
                </h3>
              </div>
              <p className="text-3xl font-bold text-white">
                {viewData.totalRegistrations}
              </p>
            </div>

            <div className={`${shellCard} p-6`}>
              <div className="flex items-center gap-3 mb-2">
                <UserCheck className="w-6 h-6 text-amber-400" />
                <h3 className="text-sm font-semibold text-gray-400">
                  Total Participants
                </h3>
              </div>
              <p className="text-3xl font-bold text-white">
                {totalPresences}
              </p>
              <div className="mt-3 space-y-1 text-xs">
                <div className="flex justify-between text-gray-400">
                  <span>Nombre total:</span>
                  <span className="text-white font-semibold">{totalPresences}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Nom unique:</span>
                  <span className="text-white font-semibold">{uniqueParticipants}</span>
                </div>
              </div>
            </div>

            <div className={`${shellCard} p-6`}>
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-6 h-6 text-green-400" />
                <h3 className="text-sm font-semibold text-gray-400">
                  Moyenne par événement
                </h3>
              </div>
              <p className="text-3xl font-bold text-white">
                {getAveragePresences()}
              </p>
            </div>

            <div className={`${shellCard} p-6`}>
              <div className="flex items-center gap-3 mb-2">
                <BarChart3 className="w-6 h-6 text-purple-400" />
                <h3 className="text-sm font-semibold text-gray-400">
                  Catégories
                </h3>
              </div>
              <p className="text-3xl font-bold text-white">
                {Object.keys(categoryStats).length}
              </p>
            </div>
          </div>

          {/* Statistiques par catégorie */}
          <div className={`${shellCard} mb-8 p-6`}>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <h2 className="text-xl font-semibold text-white">Statistiques par catégorie</h2>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setTopMode("all")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${focusRingClass} ${
                    topMode === "all" ? tabActive : tabInactive
                  }`}
                >
                  Top 5 - Tous
                </button>
                <button
                  type="button"
                  onClick={() => setTopMode("noStaff")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${focusRingClass} ${
                    topMode === "noStaff" ? tabActive : tabInactive
                  }`}
                >
                  Top 5 - Hors staff
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(categoryStats).map(([category, stats]) => (
                <div
                  key={category}
                  className={`${insetCard} p-4`}
                >
                  <h3 className="text-sm font-semibold text-gray-300 mb-3">
                    {category}
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Événements:</span>
                      <span className="text-white font-semibold">
                        {stats.count}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Inscriptions:</span>
                      <span className="text-white font-semibold">
                        {stats.registrations}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Participation:</span>
                      <span className="text-amber-400 font-semibold">
                        {stats.totalPresences}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Participation unique:</span>
                      <span className="text-green-400 font-semibold">
                        {stats.uniqueParticipants}
                      </span>
                    </div>
                    {stats.count > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Moyenne:</span>
                        <span className="text-white font-semibold">
                          {Math.round((stats.totalPresences / stats.count) * 10) / 10}
                        </span>
                      </div>
                    )}
                    <div className="pt-2 mt-2 border-t border-gray-700">
                      <p className="text-[11px] uppercase tracking-wide text-gray-500 mb-2">
                        Top 5 présences ({topMode === "all" ? "tous" : "hors staff"})
                      </p>
                      {topByCategory[category]?.length ? (
                        <div className="space-y-1">
                          {topByCategory[category].map((entry, idx) => (
                            <div key={`${category}-${entry.login}`} className="flex justify-between text-xs">
                              <span className="text-gray-300">
                                {idx + 1}. {entry.login}
                              </span>
                              <span className={`font-semibold ${accentNumber}`}>{entry.count}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500">Aucune donnée.</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top événements */}
          <div className={`${shellCard} p-6`}>
            <h2 className="text-xl font-semibold text-white mb-6">
              Événements les plus populaires
            </h2>
            <div className="space-y-3">
              {[...viewData.eventsWithRegistrations]
                .sort((a, b) => (b.presenceCount || 0) - (a.presenceCount || 0))
                .slice(0, 5)
                .map((item) => (
                  <div
                    key={item.event.id}
                  className={`${insetCard} flex items-center justify-between p-4`}
                  >
                    <div>
                      <h3 className="text-white font-semibold mb-1">
                        {item.event.title}
                      </h3>
                      <p className="text-sm text-gray-400">
                        {item.event.category} •{" "}
                        {new Date(item.event.date).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-2xl font-bold ${accentNumber}`}>
                        {item.presenceCount || 0}
                      </p>
                      <p className="text-xs text-gray-400">présents</p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </>
      )}
          </div>
          {hubLayout ? (
            <aside className="min-w-0 space-y-4 xl:sticky xl:top-5 xl:self-start" aria-label="Aide et raccourcis récap événements">
              <div className={`${layoutPanelClass} space-y-3 p-[clamp(0.875rem,1.75vw,1.25rem)]`}>
                <p className="flex items-center gap-2 text-[length:clamp(0.6875rem,0.625rem+0.2vw,0.8125rem)] font-semibold uppercase tracking-[0.08em] text-zinc-500">
                  <Compass className="h-4 w-4 shrink-0 text-violet-300/85" aria-hidden />
                  Astuce équipe
                </p>
                <p className="text-[length:clamp(0.75rem,0.68rem+0.28vw,0.8625rem)] leading-[1.6] text-zinc-400">
                  Les totaux reflètent les données chargées ici ; si une feuille de présence n&apos;a pas été validée, le
                  récap peut sous-estimer la participation réelle.
                </p>
              </div>

              <div className={`${layoutPanelClass} p-[clamp(0.875rem,1.75vw,1.25rem)]`}>
                <p className="flex items-center gap-2 text-[length:clamp(0.6875rem,0.625rem+0.2vw,0.8125rem)] font-semibold uppercase tracking-[0.08em] text-zinc-500">
                  <ListOrdered className="h-4 w-4 shrink-0 text-violet-300/85" aria-hidden />
                  En trois gestes
                </p>
                <ol className="mt-4 space-y-[0.65rem]">
                  {recapAsideSteps.map((step) => (
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

              <div className={`${layoutPanelClass} p-[clamp(0.875rem,1.75vw,1.25rem)]`}>
                <p className="text-[length:clamp(0.6875rem,0.625rem+0.2vw,0.8125rem)] font-semibold uppercase tracking-[0.08em] text-zinc-500">
                  Modules proches
                </p>
                <nav className="mt-3 flex flex-col gap-2" aria-label="Liens pilier événements">
                  <Link
                    href="/admin/communaute/evenements/participation"
                    className={`flex min-h-[2.85rem] min-w-0 items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-zinc-900/45 px-3 py-2 text-[length:clamp(0.78rem,0.72rem+0.22vw,0.9rem)] font-medium text-zinc-100 transition hover:border-emerald-400/26 hover:bg-zinc-900/72 ${focusRingClass}`}
                  >
                    Présences
                    <ArrowRight className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
                  </Link>
                  <Link
                    href="/admin/communaute/evenements/calendrier"
                    className={`flex min-h-[2.85rem] min-w-0 items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-zinc-900/45 px-3 py-2 text-[length:clamp(0.78rem,0.72rem+0.22vw,0.9rem)] font-medium text-zinc-100 transition hover:border-violet-400/26 hover:bg-zinc-900/72 ${focusRingClass}`}
                  >
                    Calendrier
                    <ArrowRight className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
                  </Link>
                  <Link
                    href="/admin/communaute/evenements/suivi"
                    className={`flex min-h-[2.85rem] min-w-0 items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-zinc-900/45 px-3 py-2 text-[length:clamp(0.78rem,0.72rem+0.22vw,0.9rem)] font-medium text-zinc-100 transition hover:border-sky-400/26 hover:bg-zinc-900/72 ${focusRingClass}`}
                  >
                    Suivi par type
                    <ArrowRight className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
                  </Link>
                  <Link
                    href="/admin/communaute/evenements/liste"
                    className={`flex min-h-[2.85rem] min-w-0 items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-zinc-900/45 px-3 py-2 text-[length:clamp(0.78rem,0.72rem+0.22vw,0.9rem)] font-medium text-zinc-100 transition hover:border-fuchsia-400/22 hover:bg-zinc-900/72 ${focusRingClass}`}
                  >
                    Liste des événements
                    <ArrowRight className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
                  </Link>
                  <Link
                    href="/admin/communaute/evenements"
                    className={`flex min-h-[2.85rem] min-w-0 items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-zinc-900/45 px-3 py-2 text-[length:clamp(0.78rem,0.72rem+0.22vw,0.9rem)] font-medium text-zinc-100 transition hover:border-white/14 hover:bg-zinc-900/72 ${focusRingClass}`}
                  >
                    <span className="inline-flex min-w-0 items-center gap-2">
                      <CalendarCheck2 className="h-4 w-4 shrink-0 opacity-85" aria-hidden />
                      Hub événements
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
                  </Link>
                </nav>
              </div>
            </aside>
          ) : null}
        </div>
      </div>
    </div>
  );
}

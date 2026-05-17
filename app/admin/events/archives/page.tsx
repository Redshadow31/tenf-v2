"use client";

import React, { useCallback, useEffect, useId, useMemo, useState } from "react";
import Link from "next/link";
import {
  Archive,
  ArrowRight,
  BarChart3,
  Calendar,
  CalendarCheck2,
  CalendarDays,
  ChevronLeft,
  Clock3,
  Compass,
  Image as ImageIcon,
  ListOrdered,
  MapPin,
  PartyPopper,
  RefreshCw,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { useCommunauteEventsHub } from "@/lib/admin/CommunauteEventsHubContext";

interface Event {
  id: string;
  title: string;
  description?: string;
  date: string;
  category: string;
  location?: string;
  image?: string;
  isPublished: boolean;
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

function getCategoryConfig(categoryValue: string): CategoryConfig {
  const found = categories.find((cat) => cat.value === categoryValue);
  if (found) return found;
  return {
    value: categoryValue,
    label: categoryValue || "Autre",
    color: "text-slate-300",
    bgColor: "bg-slate-500/15",
    borderColor: "border-slate-500/30",
  };
}

const glassCardClass =
  "rounded-2xl border border-indigo-300/20 bg-[linear-gradient(150deg,rgba(99,102,241,0.12),rgba(14,15,23,0.85)_45%,rgba(56,189,248,0.08))] shadow-[0_20px_50px_rgba(2,6,23,0.45)] backdrop-blur";
const sectionCardClass =
  "rounded-2xl border border-[#2f3244] bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.10),_rgba(11,13,20,0.95)_46%)] shadow-[0_16px_40px_rgba(2,6,23,0.45)]";
const subtleButtonClass =
  "inline-flex items-center gap-2 rounded-xl border border-indigo-300/25 bg-[linear-gradient(135deg,rgba(79,70,229,0.24),rgba(30,41,59,0.36))] px-3 py-2 text-sm font-medium text-indigo-100 transition hover:-translate-y-[1px] hover:border-indigo-200/45 hover:bg-[linear-gradient(135deg,rgba(99,102,241,0.34),rgba(30,41,59,0.54))]";
const layoutPanelClass =
  "rounded-2xl border border-white/[0.08] bg-zinc-950/55 shadow-sm shadow-black/20 ring-1 ring-inset ring-white/[0.03]";
const heroVisualClass =
  "relative isolate overflow-hidden rounded-2xl border border-violet-500/20 bg-zinc-950/70 ring-1 ring-inset ring-violet-500/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]";
const hubSubtleBtnClass =
  "inline-flex min-h-[2.5rem] items-center gap-2 rounded-xl border border-violet-500/25 bg-violet-950/25 px-3 py-2 text-sm font-medium text-violet-100 transition hover:border-violet-400/40 hover:bg-violet-900/30";
const focusRingClass =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950";

const archivesAsideSteps = [
  {
    n: "1",
    title: "Filtrer puis zoomer",
    body: "Combine mois, catégorie et recherche : ouvrez la fiche pour relire le contexte avant une réédition.",
  },
  {
    n: "2",
    title: "Visuels = repères",
    body: "Le filtre « Avec visuel » isole les créneaux prêts à être réutilisés comme modèles de communication.",
  },
  {
    n: "3",
    title: "Périodes creuses",
    body: "Comparer le nombre de mois distincts au volume total aide à repérer les trous dans le calendrier passé.",
  },
];
const modalBackdropClass =
  "fixed inset-0 z-[100] flex animate-fadeIn items-center justify-center bg-black/70 p-4 backdrop-blur-md";
const modalShellClass =
  "relative max-h-[90vh] w-full max-w-2xl animate-fadeIn overflow-hidden overflow-y-auto rounded-3xl border border-indigo-400/25 bg-[linear-gradient(165deg,rgba(99,102,241,0.12),rgba(14,15,23,0.97)_42%,rgba(11,13,20,0.99))] shadow-[0_28px_80px_rgba(2,6,23,0.75)]";

type InsightFilter = "all" | "published" | "withImage";

function groupEventsByMonth(list: Event[]): [string, Event[]][] {
  const grouped: Record<string, Event[]> = {};
  list.forEach((event) => {
    const eventDate = new Date(event.date);
    const year = eventDate.getFullYear();
    const month = String(eventDate.getMonth() + 1).padStart(2, "0");
    const monthKey = `${year}-${month}`;
    if (!grouped[monthKey]) grouped[monthKey] = [];
    grouped[monthKey].push(event);
  });
  return Object.entries(grouped).sort((a, b) => b[0].localeCompare(a[0]));
}

function formatMonthKey(key: string): string {
  const [, month] = key.split("-");
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
  return `${monthNames[parseInt(month, 10) - 1]} ${year}`;
}

function formatEventDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

export default function ArchivesPage() {
  const hubLayout = useCommunauteEventsHub();
  const detailTitleId = useId();

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [insightFilter, setInsightFilter] = useState<InsightFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [search, setSearch] = useState("");
  const [detailEvent, setDetailEvent] = useState<Event | null>(null);

  const loadEvents = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const response = await fetch("/api/events?admin=true", { cache: "no-store" });
      if (!response.ok) {
        setLoadError("Impossible de charger les événements.");
        setEvents([]);
        return;
      }
      const data = await response.json();
      const now = new Date();
      const pastEvents = (data.events || []).filter((event: Event) => {
        const eventDate = new Date(event.date);
        return eventDate < now;
      });
      pastEvents.sort((a: Event, b: Event) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setEvents(pastEvents);
    } catch (error) {
      console.error("Erreur chargement événements:", error);
      setLoadError("Erreur réseau ou serveur.");
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    if (!detailEvent) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDetailEvent(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [detailEvent]);

  const publishedCount = useMemo(() => events.filter((event) => event.isPublished).length, [events]);
  const withImageCount = useMemo(() => events.filter((event) => Boolean(event.image)).length, [events]);

  const filteredEvents = useMemo(() => {
    const q = search.trim().toLowerCase();
    return events.filter((e) => {
      if (insightFilter === "published" && !e.isPublished) return false;
      if (insightFilter === "withImage" && !e.image) return false;
      if (categoryFilter && e.category !== categoryFilter) return false;
      if (q) {
        const inTitle = e.title.toLowerCase().includes(q);
        const inDesc = (e.description || "").toLowerCase().includes(q);
        const inLoc = (e.location || "").toLowerCase().includes(q);
        if (!inTitle && !inDesc && !inLoc) return false;
      }
      return true;
    });
  }, [events, insightFilter, categoryFilter, search]);

  const groupedFiltered = useMemo(() => groupEventsByMonth(filteredEvents), [filteredEvents]);
  const groupedAll = useMemo(() => groupEventsByMonth(events), [events]);

  const displayedGroups = selectedMonth
    ? groupedFiltered.filter(([monthKey]) => monthKey === selectedMonth)
    : groupedFiltered;

  const latestMonth = groupedAll.length > 0 ? groupedAll[0][0] : "";

  const categoryCounts = useMemo(() => {
    const map: Record<string, number> = {};
    events.forEach((e) => {
      const k = e.category || "Autre";
      map[k] = (map[k] || 0) + 1;
    });
    return map;
  }, [events]);

  const hubBackHref = "/admin/communaute/evenements";
  const classicBackHref = "/admin/events";

  function resetFilters() {
    setInsightFilter("all");
    setCategoryFilter("");
    setSearch("");
    setSelectedMonth("");
  }

  function toggleInsight(next: InsightFilter) {
    setInsightFilter((cur) => (cur === next ? "all" : next));
  }

  const hubPanel = hubLayout ? layoutPanelClass : sectionCardClass;
  const chipBase = hubLayout
    ? `shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition ${focusRingClass}`
    : "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60";
  const chipInactive = hubLayout
    ? "border-white/10 bg-zinc-900/50 text-zinc-300 hover:border-violet-400/25 hover:text-slate-100"
    : "border-[#3b4157] bg-[#13192b] text-slate-300 hover:border-indigo-300/35 hover:text-slate-100";
  const chipActive = hubLayout
    ? "border-violet-400/50 bg-violet-500/20 text-violet-50"
    : "border-indigo-400/50 bg-indigo-500/20 text-indigo-50";

  return (
    <div
      className={
        hubLayout
          ? "relative isolate min-h-[calc(100vh-4rem)] min-w-0 scroll-smooth pb-12 text-white selection:bg-violet-500/35 [--arch-gap:clamp(1rem,1.55vw,1.85rem)]"
          : "min-h-screen space-y-6 bg-[#0e0e10] p-8 text-white"
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
          <div className={hubLayout ? "min-w-0 space-y-6 sm:space-y-8 xl:space-y-[var(--arch-gap)]" : "space-y-6"}>
            {hubLayout ? (
              <header
                className={`grid min-w-0 gap-6 p-[clamp(1rem,2vw,1.6rem)] lg:grid-cols-[minmax(0,1.4fr)_minmax(260px,min(100%,0.94fr))] lg:gap-8 ${layoutPanelClass}`}
              >
                <div className="min-w-0 space-y-4">
                  <Link
                    href={hubBackHref}
                    className={`inline-flex items-center gap-1 text-[length:clamp(0.8rem,0.74rem+0.32vw,0.9375rem)] text-zinc-400 transition hover:text-white ${focusRingClass} rounded-lg`}
                  >
                    <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden />
                    Retour pilotage événements
                  </Link>
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/28 bg-amber-500/[0.08] px-3 py-1 text-[length:clamp(0.65rem,0.58rem+0.25vw,0.6875rem)] font-semibold uppercase tracking-[0.11em] text-amber-100/90">
                      <PartyPopper className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      Mémoire côté membres
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-400/26 bg-violet-500/[0.1] px-3 py-1 text-[length:clamp(0.65rem,0.58rem+0.25vw,0.6875rem)] font-semibold uppercase tracking-[0.11em] text-violet-100/92">
                      <BarChart3 className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      Pilotage staff
                    </span>
                  </div>
                  <div>
                    <p className="text-[length:clamp(0.6875rem,0.625rem+0.25vw,0.8125rem)] uppercase tracking-[0.12em] text-violet-200/95">
                      Historique & réutilisation
                    </p>
                    <h1 className="mt-2 flex flex-wrap items-center gap-3 text-[clamp(1.45rem,1.05rem+1.05vw,2.35rem)] font-semibold tracking-tight text-white">
                      <Archive className="h-8 w-8 shrink-0 text-amber-300/90 md:h-9 md:w-9" aria-hidden />
                      Archives événements
                    </h1>
                    <p className="mt-3 max-w-3xl text-[length:clamp(0.8125rem,0.75rem+0.32vw,0.9625rem)] leading-[1.65] text-zinc-400">
                      Historique des événements passés : explorez par mois et par catégorie, cherchez un format, ouvrez une
                      fiche pour relire le contexte avant une nouvelle édition.
                    </p>
                  </div>
                  <div className="flex min-w-0 flex-wrap gap-[clamp(0.4rem,0.85vw,0.625rem)]">
                    <button
                      type="button"
                      onClick={() => void loadEvents()}
                      className={`${hubSubtleBtnClass} ${focusRingClass}`}
                    >
                      <RefreshCw className="h-4 w-4 shrink-0" aria-hidden />
                      Actualiser
                    </button>
                    <Link href="/admin/communaute/evenements/calendrier" className={`${hubSubtleBtnClass} ${focusRingClass}`}>
                      <CalendarDays className="h-4 w-4 shrink-0" aria-hidden />
                      Calendrier
                    </Link>
                    <Link
                      href="/admin/communaute/evenements/recap"
                      className={`${hubSubtleBtnClass} ${focusRingClass} border-sky-400/28 bg-sky-950/[0.35] text-sky-100`}
                    >
                      <BarChart3 className="h-4 w-4 shrink-0" aria-hidden />
                      Récaps
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
                      Synthèse
                    </span>
                    <dl className="grid min-w-0 grid-cols-3 gap-[clamp(0.45rem,0.9vw,0.65rem)] text-[length:clamp(0.65rem,0.58rem+0.22vw,0.775rem)]">
                      <div className="rounded-xl border border-white/[0.08] bg-zinc-900/52 p-[clamp(0.45rem,0.85vw,0.55rem)] text-center">
                        <dt className="font-medium uppercase tracking-wide text-zinc-500">Archivés</dt>
                        <dd className="mt-1 text-[clamp(1.05rem,0.88rem+0.45vw,1.45rem)] font-semibold tabular-nums text-zinc-50">
                          {events.length}
                        </dd>
                      </div>
                      <div className="rounded-xl border border-white/[0.08] bg-zinc-900/52 p-[clamp(0.45rem,0.85vw,0.55rem)] text-center">
                        <dt className="font-medium uppercase tracking-wide text-zinc-500">Publiés</dt>
                        <dd className="mt-1 text-[clamp(1.05rem,0.88rem+0.45vw,1.45rem)] font-semibold tabular-nums text-emerald-200/95">
                          {publishedCount}
                        </dd>
                      </div>
                      <div className="rounded-xl border border-white/[0.08] bg-zinc-900/52 p-[clamp(0.45rem,0.85vw,0.55rem)] text-center">
                        <dt className="font-medium uppercase tracking-wide text-zinc-500">Mois</dt>
                        <dd className="mt-1 text-[clamp(1.05rem,0.88rem+0.45vw,1.45rem)] font-semibold tabular-nums text-amber-200/95">
                          {groupedAll.length}
                        </dd>
                      </div>
                    </dl>
                    <p className="text-[length:clamp(0.65rem,0.58rem+0.2vw,0.75rem)] leading-snug text-zinc-500">
                      Résultat filtres :{" "}
                      <span className="font-semibold tabular-nums text-zinc-200">{filteredEvents.length}</span>
                      <span className="mx-1.5 text-zinc-600">·</span>
                      Dernier mois :{" "}
                      <span className="font-medium text-zinc-300">{latestMonth ? formatMonthKey(latestMonth) : "—"}</span>
                    </p>
                  </div>
                </div>
              </header>
            ) : (
              <section className={`${glassCardClass} p-5 md:p-6`}>
                <Link
                  href={classicBackHref}
                  className="mb-4 inline-flex items-center gap-2 text-gray-300 transition-colors hover:text-white"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Retour aux événements
                </Link>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="max-w-3xl">
                    <p className="text-xs uppercase tracking-[0.14em] text-indigo-200/90">Evenements communautaires</p>
                    <h1 className="mt-2 bg-gradient-to-r from-indigo-100 via-sky-200 to-cyan-200 bg-clip-text text-3xl font-semibold text-transparent md:text-4xl">
                      Archives des evenements
                    </h1>
                    <p className="mt-3 text-sm text-slate-300">
                      Cette page centralise l&apos;historique des evenements passes pour faciliter les analyses, la reutilisation des
                      formats qui performent et la preparation des prochaines editions.
                    </p>
                  </div>
                  <div className="rounded-xl border border-indigo-300/25 bg-[#101522]/70 px-4 py-3 text-sm text-indigo-100">
                    <p className="text-xs uppercase tracking-[0.1em] text-indigo-200/80">Dernier mois archive</p>
                    <p className="mt-1">{latestMonth ? formatMonthKey(latestMonth) : "Aucun"}</p>
                  </div>
                </div>
              </section>
            )}

      {loadError ? (
        <div className="animate-fadeIn rounded-2xl border border-rose-500/35 bg-rose-950/30 px-4 py-3 text-sm text-rose-100">
          {loadError}{" "}
          <button type="button" onClick={() => loadEvents()} className="ml-2 font-semibold text-white underline">
            Réessayer
          </button>
        </div>
      ) : null}

      <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <button
          type="button"
          onClick={resetFilters}
          className={`${hubPanel} p-4 text-left transition hover:shadow-[0_12px_36px_rgba(2,6,23,0.5)] ${
            hubLayout ? "hover:border-violet-400/30" : "hover:border-indigo-400/35"
          } ${
            insightFilter === "all" && !categoryFilter && !search && !selectedMonth
              ? hubLayout
                ? "ring-2 ring-violet-400/45 ring-offset-2 ring-offset-zinc-950"
                : "ring-2 ring-indigo-400/45 ring-offset-2 ring-offset-[#0a0b10]"
              : ""
          }`}
        >
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Événements archivés</p>
          <p className="mt-2 text-3xl font-semibold">{events.length}</p>
          {hubLayout ? <p className="mt-2 text-[11px] text-slate-500">Réinitialiser les filtres</p> : null}
        </button>
        <button
          type="button"
          onClick={() => toggleInsight("published")}
          className={`${hubPanel} p-4 text-left transition hover:shadow-[0_12px_36px_rgba(2,6,23,0.5)] ${
            hubLayout ? "hover:border-emerald-400/30" : "hover:border-emerald-400/35"
          } ${
            insightFilter === "published"
              ? hubLayout
                ? "ring-2 ring-emerald-400/45 ring-offset-2 ring-offset-zinc-950"
                : "ring-2 ring-emerald-400/45 ring-offset-2 ring-offset-[#0a0b10]"
              : ""
          }`}
        >
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Publiés</p>
          <p className="mt-2 text-3xl font-semibold text-emerald-300">{publishedCount}</p>
          {hubLayout ? <p className="mt-2 text-[11px] text-slate-500">Cliquer pour filtrer / désactiver</p> : null}
        </button>
        <button
          type="button"
          onClick={() => toggleInsight("withImage")}
          className={`${hubPanel} p-4 text-left transition hover:shadow-[0_12px_36px_rgba(2,6,23,0.5)] ${
            hubLayout ? "hover:border-sky-400/30" : "hover:border-sky-400/35"
          } ${
            insightFilter === "withImage"
              ? hubLayout
                ? "ring-2 ring-sky-400/45 ring-offset-2 ring-offset-zinc-950"
                : "ring-2 ring-sky-400/45 ring-offset-2 ring-offset-[#0a0b10]"
              : ""
          }`}
        >
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Avec visuel</p>
          <p className="mt-2 text-3xl font-semibold text-sky-300">{withImageCount}</p>
          {hubLayout ? <p className="mt-2 text-[11px] text-slate-500">Uniquement avec bannière</p> : null}
        </button>
        <button
          type="button"
          onClick={() => setSelectedMonth("")}
          className={`${hubPanel} p-4 text-left transition hover:shadow-[0_12px_36px_rgba(2,6,23,0.5)] ${
            hubLayout ? "hover:border-amber-400/30" : "hover:border-amber-400/35"
          }`}
        >
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Mois (périodes)</p>
          <p className="mt-2 text-3xl font-semibold text-amber-300">{groupedAll.length}</p>
          {hubLayout ? (
            <p className="mt-2 text-[11px] text-slate-500">
              {selectedMonth ? "Cliquer pour afficher tous les mois" : "Filtre mois : vue globale"}
            </p>
          ) : null}
        </button>
      </section>

      <section className={`${hubPanel} p-5`}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold text-slate-100">Filtres interactifs</h2>
            <p className="mt-1 text-sm text-slate-400">
              Combine recherche texte, mois, catégorie et vignettes statistiques. Cliquez une carte pour ouvrir le détail.
            </p>
            <div className="relative mt-4 max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher titre, lieu, description…"
                className="w-full rounded-xl border border-[#353a50] bg-[#0f1424] py-2.5 pl-10 pr-3 text-sm text-white placeholder:text-slate-500 focus:border-indigo-300/45 focus:outline-none"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2 lg:justify-end">
            {search || categoryFilter || insightFilter !== "all" || selectedMonth ? (
              <button
                type="button"
                onClick={resetFilters}
                className="self-start rounded-xl border border-slate-600/60 bg-slate-800/60 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700"
              >
                Tout effacer
              </button>
            ) : null}
          </div>
        </div>

        <div className="mt-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Mois</p>
          <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:thin]">
            <button
              type="button"
              onClick={() => setSelectedMonth("")}
              className={`${chipBase} ${selectedMonth === "" ? chipActive : chipInactive}`}
            >
              Tous les mois
            </button>
            {groupedAll.map(([monthKey, monthList]) => (
              <button
                key={monthKey}
                type="button"
                onClick={() => setSelectedMonth((cur) => (cur === monthKey ? "" : monthKey))}
                className={`${chipBase} ${selectedMonth === monthKey ? chipActive : chipInactive}`}
              >
                {formatMonthKey(monthKey)}
                <span className="ml-1.5 rounded-md bg-black/30 px-1.5 py-0.5 text-[10px] text-slate-300">
                  {monthList.length}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Catégorie</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCategoryFilter("")}
              className={`${chipBase} ${categoryFilter === "" ? chipActive : chipInactive}`}
            >
              Toutes
            </button>
            {categories.map((cat) => {
              const n = categoryCounts[cat.value] ?? 0;
              if (n === 0) return null;
              return (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategoryFilter((c) => (c === cat.value ? "" : cat.value))}
                  className={`${chipBase} ${categoryFilter === cat.value ? chipActive : chipInactive}`}
                >
                  <span className={cat.color}>{cat.label}</span>
                  <span className="ml-1.5 text-slate-400">({n})</span>
                </button>
              );
            })}
            {Object.entries(categoryCounts)
              .filter(([k]) => !categories.some((c) => c.value === k))
              .map(([k, n]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setCategoryFilter((c) => (c === k ? "" : k))}
                  className={`${chipBase} ${categoryFilter === k ? chipActive : chipInactive}`}
                >
                  {k}
                  <span className="ml-1.5 text-slate-400">({n})</span>
                </button>
              ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_1.1fr]">
        <article className={`${hubPanel} p-5`}>
          <h2 className="text-lg font-semibold text-slate-100">Lecture rapide</h2>
          <div className="mt-3 space-y-2 text-sm text-slate-300">
            <p className="rounded-lg border border-indigo-300/30 bg-indigo-300/10 px-3 py-2 text-indigo-100">
              <Archive className="mr-1 inline h-4 w-4" />
              Conserver une trace fiable des événements terminés.
            </p>
            <p className="rounded-lg border border-cyan-300/30 bg-cyan-300/10 px-3 py-2 text-cyan-100">
              <Clock3 className="mr-1 inline h-4 w-4" />
              Identifier les périodes fortes et les creux d&apos;activité.
            </p>
            <p className="rounded-lg border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-amber-100">
              <Sparkles className="mr-1 inline h-4 w-4" />
              Réutiliser les formats qui ont donné les meilleurs résultats.
            </p>
          </div>
        </article>
        <article className={`${hubPanel} flex flex-col justify-center p-5`}>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-indigo-400/30 bg-indigo-500/10">
              <CalendarDays className="h-6 w-6 text-indigo-200" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.1em] text-slate-500">Résultat courant</p>
              <p className="text-2xl font-semibold text-white">{filteredEvents.length}</p>
              <p className="text-xs text-slate-500">
                sur {events.length} archivé{events.length > 1 ? "s" : ""}
                {selectedMonth ? ` · ${formatMonthKey(selectedMonth)}` : ""}
              </p>
            </div>
          </div>
        </article>
      </section>

      {loading ? (
        hubLayout ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className={`${hubPanel} animate-pulse overflow-hidden`}>
                <div className="h-40 bg-slate-800/50" />
                <div className="space-y-3 p-4">
                  <div className="h-4 w-[75%] rounded bg-slate-700/40" />
                  <div className="h-3 w-1/2 rounded bg-slate-800/40" />
                  <div className="h-3 w-full rounded bg-slate-800/40" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={`${hubPanel} py-12 text-center`}>
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-b-2 border-[#9146ff]" />
            <p className="mt-4 text-gray-400">Chargement des événements...</p>
          </div>
        )
      ) : displayedGroups.length === 0 ? (
        <div className={`${hubPanel} p-10 text-center`}>
          <Archive className="mx-auto h-12 w-12 text-slate-600" />
          <p className="mt-4 text-slate-400">
            {events.length === 0
              ? "Aucun événement passé pour l’instant."
              : "Aucun événement ne correspond à ces filtres."}
          </p>
          {events.length > 0 ? (
            <button
              type="button"
              onClick={resetFilters}
              className="mt-4 rounded-xl border border-indigo-400/40 bg-indigo-600/20 px-4 py-2 text-sm font-semibold text-indigo-100 hover:bg-indigo-600/30"
            >
              Réinitialiser les filtres
            </button>
          ) : null}
        </div>
      ) : (
        <div className="space-y-10">
          {displayedGroups.map(([monthKey, monthEvents]) => (
            <div key={monthKey}>
              <div className="mb-6 flex flex-wrap items-center gap-3">
                <Calendar className="h-6 w-6 shrink-0 text-amber-400" />
                <h2 className="text-2xl font-bold text-white">{formatMonthKey(monthKey)}</h2>
                <span className="text-sm text-gray-400">
                  ({monthEvents.length} {monthEvents.length > 1 ? "événements" : "événement"})
                </span>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {monthEvents.map((event) => {
                  const catConfig = getCategoryConfig(event.category);
                  return (
                    <button
                      key={event.id}
                      type="button"
                      onClick={() => setDetailEvent(event)}
                      className="group rounded-2xl border border-[#353a50] bg-[#121623]/85 text-left overflow-hidden transition hover:border-indigo-400/40 hover:shadow-[0_16px_40px_rgba(67,56,202,0.28)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60"
                    >
                      {event.image ? (
                        <div className="relative h-48 w-full overflow-hidden bg-gray-800">
                          <img
                            src={event.image}
                            alt={event.title}
                            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0b10]/90 via-transparent to-transparent opacity-80" />
                          <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-lg border border-white/15 bg-black/40 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm">
                            <ImageIcon className="h-3 w-3" />
                            Voir fiche
                          </span>
                        </div>
                      ) : (
                        <div className="flex h-36 items-center justify-center border-b border-[#2a3042] bg-gradient-to-br from-indigo-900/30 to-[#121623]">
                          <Calendar className="h-14 w-14 text-slate-600 transition group-hover:text-indigo-400/80" />
                        </div>
                      )}

                      <div className="p-4">
                        <h3 className="line-clamp-2 text-lg font-semibold text-white">{event.title}</h3>

                        <div className="mb-3 mt-2 flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded border px-2 py-1 text-xs ${catConfig.bgColor} ${catConfig.color} ${catConfig.borderColor}`}
                          >
                            {event.category}
                          </span>
                          {event.isPublished ? (
                            <span className="rounded border border-green-500/30 bg-green-500/20 px-2 py-1 text-xs text-green-400">
                              Publié
                            </span>
                          ) : (
                            <span className="rounded border border-slate-600/50 bg-slate-800/60 px-2 py-1 text-xs text-slate-400">
                              Brouillon
                            </span>
                          )}
                        </div>

                        <div className="space-y-2 text-sm text-gray-400">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 shrink-0" />
                            <span>{formatEventDate(event.date)}</span>
                          </div>
                          {event.location ? (
                            <div className="flex items-start gap-2">
                              <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                              <span className="line-clamp-2">{event.location}</span>
                            </div>
                          ) : null}
                        </div>

                        {event.description ? (
                          <p className="mt-3 line-clamp-3 text-sm text-gray-300">{event.description}</p>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

          </div>
          {hubLayout ? (
            <aside className="min-w-0 space-y-4 xl:sticky xl:top-5 xl:self-start" aria-label="Aide et raccourcis archives">
              <div className={`${layoutPanelClass} space-y-3 p-[clamp(0.875rem,1.75vw,1.25rem)]`}>
                <p className="flex items-center gap-2 text-[length:clamp(0.6875rem,0.625rem+0.2vw,0.8125rem)] font-semibold uppercase tracking-[0.08em] text-zinc-500">
                  <Compass className="h-4 w-4 shrink-0 text-violet-300/85" aria-hidden />
                  Astuce équipe
                </p>
                <p className="text-[length:clamp(0.75rem,0.68rem+0.28vw,0.8625rem)] leading-[1.6] text-zinc-400">
                  Les fiches archivées documentent ce qui s&apos;est réellement joué : précieuses pour réutiliser un format ou
                  trancher sur une ancienne édition.
                </p>
              </div>

              <div className={`${layoutPanelClass} p-[clamp(0.875rem,1.75vw,1.25rem)]`}>
                <p className="flex items-center gap-2 text-[length:clamp(0.6875rem,0.625rem+0.2vw,0.8125rem)] font-semibold uppercase tracking-[0.08em] text-zinc-500">
                  <ListOrdered className="h-4 w-4 shrink-0 text-violet-300/85" aria-hidden />
                  En trois gestes
                </p>
                <ol className="mt-4 space-y-[0.65rem]">
                  {archivesAsideSteps.map((step) => (
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
                    href="/admin/communaute/evenements/calendrier"
                    className={`flex min-h-[2.85rem] min-w-0 items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-zinc-900/45 px-3 py-2 text-[length:clamp(0.78rem,0.72rem+0.22vw,0.9rem)] font-medium text-zinc-100 transition hover:border-violet-400/26 hover:bg-zinc-900/72 ${focusRingClass}`}
                  >
                    Calendrier
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
                    href="/admin/communaute/evenements/participation"
                    className={`flex min-h-[2.85rem] min-w-0 items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-zinc-900/45 px-3 py-2 text-[length:clamp(0.78rem,0.72rem+0.22vw,0.9rem)] font-medium text-zinc-100 transition hover:border-emerald-400/26 hover:bg-zinc-900/72 ${focusRingClass}`}
                  >
                    Présences
                    <ArrowRight className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
                  </Link>
                  <Link
                    href="/admin/communaute/evenements/liste"
                    className={`flex min-h-[2.85rem] min-w-0 items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-zinc-900/45 px-3 py-2 text-[length:clamp(0.78rem,0.72rem+0.22vw,0.9rem)] font-medium text-zinc-100 transition hover:border-sky-400/26 hover:bg-zinc-900/72 ${focusRingClass}`}
                  >
                    Liste des événements
                    <ArrowRight className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
                  </Link>
                  <Link
                    href="/admin/communaute/evenements/propositions"
                    className={`flex min-h-[2.85rem] min-w-0 items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-zinc-900/45 px-3 py-2 text-[length:clamp(0.78rem,0.72rem+0.22vw,0.9rem)] font-medium text-zinc-100 transition hover:border-amber-400/24 hover:bg-zinc-900/72 ${focusRingClass}`}
                  >
                    Propositions
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

      {detailEvent ? (
        <div
          className={modalBackdropClass}
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setDetailEvent(null);
          }}
        >
          <div
            className={modalShellClass}
            role="dialog"
            aria-modal="true"
            aria-labelledby={detailTitleId}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex justify-end border-b border-white/10 bg-[#0c0e14]/90 px-3 py-2 backdrop-blur-md">
              <button
                type="button"
                onClick={() => setDetailEvent(null)}
                className="rounded-xl border border-white/10 bg-black/30 p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
                aria-label="Fermer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {detailEvent.image ? (
              <div className="relative max-h-[40vh] w-full overflow-hidden bg-slate-900">
                <img src={detailEvent.image} alt={detailEvent.title} className="max-h-[40vh] w-full object-cover object-center" />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0a0b10] to-transparent" />
              </div>
            ) : null}
            <div className="space-y-4 p-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-indigo-200/85">Archive</p>
                <h2 id={detailTitleId} className="mt-1 text-2xl font-semibold text-white">
                  {detailEvent.title}
                </h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {(() => {
                  const c = getCategoryConfig(detailEvent.category);
                  return (
                    <span className={`rounded-lg border px-2.5 py-1 text-xs font-medium ${c.bgColor} ${c.color} ${c.borderColor}`}>
                      {detailEvent.category}
                    </span>
                  );
                })()}
                {detailEvent.isPublished ? (
                  <span className="rounded-lg border border-emerald-500/35 bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-200">
                    Publié
                  </span>
                ) : (
                  <span className="rounded-lg border border-slate-500/40 bg-slate-800/80 px-2.5 py-1 text-xs text-slate-400">
                    Non publié
                  </span>
                )}
              </div>
              <div className="grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
                  <Calendar className="h-4 w-4 text-amber-300" />
                  {formatEventDate(detailEvent.date)}
                </div>
                {detailEvent.location ? (
                  <div className="flex items-start gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
                    <span>{detailEvent.location}</span>
                  </div>
                ) : null}
              </div>
              {detailEvent.description ? (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Description</p>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-200">{detailEvent.description}</p>
                </div>
              ) : (
                <p className="text-sm text-slate-500">Pas de description enregistrée.</p>
              )}
            </div>
          </div>
        </div>
      ) : null}
      </div>
    </div>
  );
}

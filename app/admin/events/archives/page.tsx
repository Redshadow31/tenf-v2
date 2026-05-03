"use client";

import React, { useCallback, useEffect, useId, useMemo, useState } from "react";
import Link from "next/link";
import {
  Archive,
  ArrowRight,
  BarChart3,
  Calendar,
  CalendarDays,
  ChevronLeft,
  Clock3,
  Image as ImageIcon,
  MapPin,
  PartyPopper,
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
const hubHeroClass =
  "relative overflow-hidden rounded-3xl border border-indigo-400/25 bg-[linear-gradient(155deg,rgba(99,102,241,0.14),rgba(14,15,23,0.92)_38%,rgba(11,13,20,0.97))] shadow-[0_24px_70px_rgba(2,6,23,0.55)] backdrop-blur-xl";
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

  const chipBase =
    "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60";
  const chipInactive = "border-[#3b4157] bg-[#13192b] text-slate-300 hover:border-indigo-300/35 hover:text-slate-100";
  const chipActive = "border-indigo-400/50 bg-indigo-500/20 text-indigo-50";

  return (
    <div className={`space-y-6 text-white ${hubLayout ? "mx-auto max-w-6xl pb-10" : ""}`}>
      {hubLayout ? (
        <section className={`${hubHeroClass} p-6 md:p-8`}>
          <div className="pointer-events-none absolute -right-16 top-0 h-48 w-48 rounded-full bg-amber-500/15 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-0 h-40 w-40 rounded-full bg-indigo-600/20 blur-3xl" />
          <div className="relative">
            <Link
              href={hubBackHref}
              className="inline-flex items-center gap-2 text-sm text-indigo-100/90 hover:text-white transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Retour au hub événements communauté
            </Link>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/35 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-100">
                <PartyPopper className="h-3.5 w-3.5" />
                Mémoire côté membres
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-400/35 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-100">
                <BarChart3 className="h-3.5 w-3.5" />
                Pilotage staff
              </span>
            </div>
            <h1 className="mt-4 flex flex-wrap items-center gap-3 bg-gradient-to-r from-indigo-100 via-sky-200 to-cyan-200 bg-clip-text text-3xl font-semibold text-transparent md:text-4xl">
              <Archive className="h-9 w-9 shrink-0 text-amber-300/90 md:h-10 md:w-10" />
              Archives événements
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-300">
              Historique des événements passés : explorez par mois et par catégorie, cherchez un format, ouvrez une fiche pour
              relire le contexte avant une nouvelle édition.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/admin/communaute/evenements/calendrier" className={subtleButtonClass}>
                Calendrier
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/admin/communaute/evenements/recap" className={subtleButtonClass}>
                Récaps
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      ) : (
        <section className={`${glassCardClass} p-5 md:p-6`}>
          <Link
            href={classicBackHref}
            className="text-gray-300 hover:text-white transition-colors mb-4 inline-flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
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
          className={`${sectionCardClass} p-4 text-left transition hover:border-indigo-400/35 ${
            insightFilter === "all" && !categoryFilter && !search && !selectedMonth
              ? "ring-2 ring-indigo-400/45 ring-offset-2 ring-offset-[#0a0b10]"
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
          className={`${sectionCardClass} p-4 text-left transition hover:border-emerald-400/35 ${
            insightFilter === "published" ? "ring-2 ring-emerald-400/45 ring-offset-2 ring-offset-[#0a0b10]" : ""
          }`}
        >
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Publiés</p>
          <p className="mt-2 text-3xl font-semibold text-emerald-300">{publishedCount}</p>
          {hubLayout ? <p className="mt-2 text-[11px] text-slate-500">Cliquer pour filtrer / désactiver</p> : null}
        </button>
        <button
          type="button"
          onClick={() => toggleInsight("withImage")}
          className={`${sectionCardClass} p-4 text-left transition hover:border-sky-400/35 ${
            insightFilter === "withImage" ? "ring-2 ring-sky-400/45 ring-offset-2 ring-offset-[#0a0b10]" : ""
          }`}
        >
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Avec visuel</p>
          <p className="mt-2 text-3xl font-semibold text-sky-300">{withImageCount}</p>
          {hubLayout ? <p className="mt-2 text-[11px] text-slate-500">Uniquement avec bannière</p> : null}
        </button>
        <button
          type="button"
          onClick={() => setSelectedMonth("")}
          className={`${sectionCardClass} p-4 text-left transition hover:border-amber-400/35`}
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

      <section className={`${sectionCardClass} p-5`}>
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
        <article className={`${sectionCardClass} p-5`}>
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
        <article className={`${sectionCardClass} flex flex-col justify-center p-5`}>
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
              <div key={i} className={`${sectionCardClass} animate-pulse overflow-hidden`}>
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
          <div className={`${sectionCardClass} py-12 text-center`}>
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-b-2 border-[#9146ff]" />
            <p className="mt-4 text-gray-400">Chargement des événements...</p>
          </div>
        )
      ) : displayedGroups.length === 0 ? (
        <div className={`${sectionCardClass} p-10 text-center`}>
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
  );
}

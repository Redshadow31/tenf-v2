"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  ChevronDown,
  Clock,
  Compass,
  ExternalLink,
  Filter,
  Heart,
  Loader2,
  PartyPopper,
  Search,
  Sparkles,
  Ticket,
  Users,
} from "lucide-react";
import MemberSurface from "@/components/member/ui/MemberSurface";
import MemberPageHeader from "@/components/member/ui/MemberPageHeader";
import EmptyFeatureCard from "@/components/member/ui/EmptyFeatureCard";

type CommunityEvent = {
  id: string;
  title: string;
  category: string;
  date: string;
  location?: string;
  image?: string;
  description?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  seriesName?: string;
};

type ListTab = "upcoming" | "past" | "all";

const TENF_EVENT_VALUES = [
  {
    title: "Respect et écoute",
    description: "Chaque événement est un espace où chacun peut s’exprimer et être entendu.",
    icon: Heart,
    accent: "from-rose-500/20 to-violet-500/10",
    iconClass: "text-rose-400",
  },
  {
    title: "Ouverture communautaire",
    description: "On favorise la rencontre entre profils différents pour enrichir la dynamique TENF.",
    icon: Users,
    accent: "from-sky-500/20 to-indigo-500/10",
    iconClass: "text-sky-400",
  },
  {
    title: "Progression collective",
    description: "Apprendre ensemble, partager et faire monter tout le monde.",
    icon: Compass,
    accent: "from-amber-500/20 to-emerald-500/10",
    iconClass: "text-amber-400",
  },
] as const;

const EVENT_PARTICIPATION_GUIDELINES = [
  "Venir avec une posture positive, curieuse et respectueuse des autres membres.",
  "Participer au rythme de chacun : contribuer sans pression ni jugement.",
  "Encourager les nouveaux participants pour renforcer le sentiment d’appartenance.",
  "Valoriser les apprentissages partagés, même les plus simples.",
];

const EVENT_COMMUNITY_GUIDELINES = [
  "Favoriser des échanges clairs et bienveillants dans le chat et en vocal.",
  "Respecter les timings et les consignes pour fluidifier l’expérience de groupe.",
  "Mettre en avant l’entraide plutôt que la performance individuelle.",
  "Faire de chaque événement un moment utile, inclusif et motivant.",
];

function getCategoryBadgeStyles(category: string): { bg: string; text: string; border: string } {
  const normalized = category.toLowerCase();
  if (normalized.includes("formation")) {
    return { bg: "rgba(56, 189, 248, 0.15)", text: "#7dd3fc", border: "rgba(56, 189, 248, 0.35)" };
  }
  if (normalized.includes("film")) {
    return { bg: "rgba(244, 114, 182, 0.15)", text: "#f9a8d4", border: "rgba(244, 114, 182, 0.35)" };
  }
  if (normalized.includes("spotlight")) {
    return { bg: "rgba(167, 139, 250, 0.2)", text: "#e9d5ff", border: "rgba(167, 139, 250, 0.45)" };
  }
  if (normalized.includes("jeux") || normalized.includes("gaming")) {
    return { bg: "rgba(167, 139, 250, 0.15)", text: "#c4b5fd", border: "rgba(167, 139, 250, 0.35)" };
  }
  if (normalized.includes("apero") || normalized.includes("apéro")) {
    return { bg: "rgba(250, 204, 21, 0.15)", text: "#fde68a", border: "rgba(250, 204, 21, 0.35)" };
  }
  return { bg: "rgba(148, 163, 184, 0.15)", text: "#cbd5e1", border: "rgba(148, 163, 184, 0.35)" };
}

function formatEventDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function googleCalendarUrl(title: string, startIso: string): string {
  const start = new Date(startIso);
  if (Number.isNaN(start.getTime())) return "#";
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const p = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${fmt(start)}/${fmt(end)}`,
    details: "Événement TENF — https://tenf-community.com/member/evenements",
  });
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
}

function daysUntil(iso: string): number | null {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  const diff = t - Date.now();
  return Math.max(0, Math.ceil(diff / 86400000));
}

function InscriptionsSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-28 rounded-2xl bg-white/[0.06]" />
      ))}
    </div>
  );
}

export default function MemberEventRegistrationsPage() {
  const [registeredEventIds, setRegisteredEventIds] = useState<Set<string>>(new Set());
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [listTab, setListTab] = useState<ListTab>("upcoming");
  const [search, setSearch] = useState("");
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [guidelineTab, setGuidelineTab] = useState<"participation" | "communaute">("participation");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [registrationsResponse, eventsResponse] = await Promise.all([
        fetch("/api/events/registrations/me", { cache: "no-store", credentials: "include" }),
        fetch("/api/events", { cache: "no-store", credentials: "include" }),
      ]);

      if (!registrationsResponse.ok) {
        if (registrationsResponse.status === 401) {
          setError("Connecte-toi pour voir tes inscriptions.");
          return;
        }
        throw new Error("Impossible de charger tes inscriptions.");
      }
      if (!eventsResponse.ok) {
        throw new Error("Impossible de charger les événements.");
      }

      const [registrationsBody, eventsBody] = await Promise.all([registrationsResponse.json(), eventsResponse.json()]);

      const ids = Array.isArray(registrationsBody?.registeredEventIds)
        ? registrationsBody.registeredEventIds.filter((id: unknown): id is string => typeof id === "string")
        : [];
      const allEvents = (eventsBody?.events || []) as CommunityEvent[];

      setRegisteredEventIds(new Set(ids));
      setEvents(allEvents);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const registeredEvents = useMemo(() => {
    return events
      .filter((event) => registeredEventIds.has(event.id))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [events, registeredEventIds]);

  const upcoming = useMemo(() => {
    const now = Date.now();
    return registeredEvents.filter((event) => new Date(event.date).getTime() >= now);
  }, [registeredEvents]);

  const past = useMemo(() => {
    const now = Date.now();
    return registeredEvents.filter((event) => new Date(event.date).getTime() < now).reverse();
  }, [registeredEvents]);

  const searchNorm = search.trim().toLowerCase();
  const filterBySearch = useCallback(
    (list: CommunityEvent[]) =>
      searchNorm
        ? list.filter(
            (e) =>
              e.title.toLowerCase().includes(searchNorm) ||
              e.category.toLowerCase().includes(searchNorm) ||
              (e.seriesName || "").toLowerCase().includes(searchNorm)
          )
        : list,
    [searchNorm]
  );

  const displayedList = useMemo(() => {
    let base: CommunityEvent[];
    if (listTab === "upcoming") base = upcoming;
    else if (listTab === "past") base = past;
    else base = [...upcoming, ...past];
    return filterBySearch(base);
  }, [listTab, upcoming, past, filterBySearch]);

  const nextEvent = upcoming[0];
  const daysToNext = nextEvent ? daysUntil(nextEvent.date) : null;

  const toggleExpand = useCallback((id: string) => {
    setExpandedEventId((prev) => (prev === id ? null : id));
  }, []);

  return (
    <MemberSurface>
      <MemberPageHeader
        title="Mes inscriptions"
        description="Centralise les événements TENF auxquels tu es inscrit·e : dates, catégories, liens utiles et rappels calendrier. Parcours les séances à venir, retrouve celles déjà vécues et rejoins l’agenda pour découvrir de nouvelles rencontres communautaires."
        badge="Événements"
      />

      <div className="mb-6 flex flex-wrap gap-2">
        <Link
          href="/member/evenements"
          className="inline-flex items-center gap-2 rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-2.5 text-sm font-semibold text-violet-100 transition hover:border-violet-400/45 hover:bg-violet-500/15"
        >
          <CalendarPlus className="h-4 w-4 shrink-0" aria-hidden />
          Agenda & inscriptions
        </Link>
        <Link
          href="/member/evenements/presences"
          className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-2.5 text-sm font-semibold text-emerald-100 transition hover:border-emerald-400/40 hover:bg-emerald-500/15"
        >
          <Users className="h-4 w-4 shrink-0" aria-hidden />
          Mes présences
          <ArrowRight className="h-4 w-4 opacity-70" aria-hidden />
        </Link>
      </div>

      <section
        className="relative mb-8 overflow-hidden rounded-3xl border p-5 shadow-2xl sm:p-8"
        style={{
          borderColor: "rgba(212, 175, 55, 0.38)",
          background:
            "radial-gradient(ellipse 80% 55% at 0% -15%, rgba(212,175,55,0.22), transparent 48%), radial-gradient(ellipse 45% 40% at 100% 0%, rgba(139,92,246,0.14), transparent 42%), linear-gradient(165deg, rgba(22,23,30,0.96), rgba(8,10,14,0.99))",
          boxShadow: "0 24px 48px rgba(0,0,0,0.35)",
        }}
      >
        <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-amber-200/90">
              <PartyPopper className="h-3.5 w-3.5" aria-hidden />
              Communauté TENF
            </p>
            <h2 className="mt-2 text-balance text-2xl font-black text-white sm:text-3xl">Ton engagement sur l’agenda</h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400">
              Chaque inscription compte pour la cohésion : prépare-toi aux créneaux à venir et garde une trace des moments déjà partagés avec la
              New Family.
            </p>
            {nextEvent && daysToNext !== null ? (
              <div className="mt-5 inline-flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-black/35 px-4 py-3">
                <Clock className="h-5 w-5 text-amber-400" aria-hidden />
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Prochain événement</p>
                  <p className="font-semibold text-white">{nextEvent.title}</p>
                  <p className="text-xs text-amber-200/90">
                    {daysToNext === 0 ? "C’est aujourd’hui ou très bientôt" : `Dans ${daysToNext} jour${daysToNext > 1 ? "s" : ""}`}
                  </p>
                </div>
              </div>
            ) : null}
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/30 p-5 text-center lg:text-left">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Récap rapide</p>
            <p className="mt-2 text-3xl font-black tabular-nums text-white">{registeredEvents.length}</p>
            <p className="text-sm text-zinc-400">inscription{registeredEvents.length !== 1 ? "s" : ""} enregistrée{registeredEvents.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
      </section>

      <section className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Inscriptions"
          value={registeredEvents.length}
          icon={<Ticket className="h-4 w-4 text-amber-300" />}
          gradient="from-amber-500/15 to-transparent"
        />
        <StatCard
          label="À venir"
          value={upcoming.length}
          icon={<CalendarDays className="h-4 w-4 text-sky-400" />}
          gradient="from-sky-500/15 to-transparent"
        />
        <StatCard
          label="Terminés"
          value={past.length}
          icon={<CheckCircle2 className="h-4 w-4 text-emerald-400" />}
          gradient="from-emerald-500/15 to-transparent"
        />
        <StatCard
          label={daysToNext !== null && upcoming.length > 0 ? "Jours avant le prochain" : "Prochain créneau"}
          value={daysToNext !== null && upcoming.length > 0 ? daysToNext : upcoming.length > 0 ? 0 : "—"}
          icon={<Sparkles className="h-4 w-4 text-violet-400" />}
          gradient="from-violet-500/15 to-transparent"
        />
      </section>

      <section className="mb-8 grid gap-4 md:grid-cols-3">
        {TENF_EVENT_VALUES.map((item) => {
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
            onClick={() => setGuidelineTab("participation")}
            className={`flex flex-1 items-center justify-center gap-2 px-4 py-3 text-sm font-semibold transition sm:flex-none sm:justify-start sm:px-6 ${
              guidelineTab === "participation"
                ? "border-b-2 border-sky-400 bg-sky-500/10 text-sky-100"
                : "text-zinc-500 hover:bg-white/[0.03] hover:text-zinc-300"
            }`}
          >
            <Heart className="h-4 w-4 shrink-0" aria-hidden />
            Ta posture
          </button>
          <button
            type="button"
            onClick={() => setGuidelineTab("communaute")}
            className={`flex flex-1 items-center justify-center gap-2 px-4 py-3 text-sm font-semibold transition sm:flex-none sm:justify-start sm:px-6 ${
              guidelineTab === "communaute"
                ? "border-b-2 border-emerald-400 bg-emerald-500/10 text-emerald-100"
                : "text-zinc-500 hover:bg-white/[0.03] hover:text-zinc-300"
            }`}
          >
            <Users className="h-4 w-4 shrink-0" aria-hidden />
            Esprit groupe
          </button>
        </div>
        <div className="p-5 sm:p-6">
          <p className="mb-4 text-sm text-zinc-400">
            {guidelineTab === "participation"
              ? "Des repères simples pour arriver détendu·e et présent·e aux autres."
              : "Construire ensemble des moments utiles et inclusifs."}
          </p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {(guidelineTab === "participation" ? EVENT_PARTICIPATION_GUIDELINES : EVENT_COMMUNITY_GUIDELINES).map((tip, i) => (
              <li
                key={tip}
                className={`flex gap-3 rounded-xl border px-4 py-3 text-sm text-zinc-200 transition hover:border-opacity-60 ${
                  guidelineTab === "participation"
                    ? "border-sky-500/20 bg-sky-950/20 hover:border-sky-400/35"
                    : "border-emerald-500/20 bg-emerald-950/20 hover:border-emerald-400/35"
                }`}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                    guidelineTab === "participation" ? "bg-sky-500/20 text-sky-300" : "bg-emerald-500/20 text-emerald-300"
                  }`}
                >
                  {i + 1}
                </span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-gradient-to-b from-[#12141c]/90 to-black/40 p-5 sm:p-7">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">Tes événements inscrits</h3>
            <p className="mt-1 text-sm text-zinc-500">
              Filtre, recherche et déplie une carte pour la description ou les liens.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadData()}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-white/12 bg-black/35 px-4 py-2.5 text-sm font-semibold text-zinc-200 transition hover:bg-white/10 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
            Actualiser
          </button>
        </div>

        {!error && registeredEvents.length > 0 ? (
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              <Filter className="h-3.5 w-3.5" aria-hidden />
              Vue
            </span>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["upcoming", `À venir (${upcoming.length})`],
                  ["past", `Passés (${past.length})`],
                  ["all", `Tout (${registeredEvents.length})`],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setListTab(id)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    listTab === id
                      ? "border-violet-400/50 bg-violet-500/20 text-violet-100"
                      : "border-white/10 bg-black/30 text-zinc-400 hover:border-white/18 hover:text-zinc-200"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" aria-hidden />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher par titre, série…"
                className="w-full rounded-xl border border-white/12 bg-[#0a0c12]/90 py-2.5 pl-10 pr-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-violet-500/40 focus:outline-none focus:ring-2 focus:ring-violet-500/15"
              />
            </div>
          </div>
        ) : null}

        {loading ? (
          <InscriptionsSkeleton />
        ) : error ? (
          <EmptyFeatureCard title="Mes inscriptions" description={error} />
        ) : registeredEvents.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/12 px-6 py-14 text-center">
            <Ticket className="mx-auto h-12 w-12 text-violet-500/50" aria-hidden />
            <p className="mt-4 text-lg font-semibold text-white">Aucune inscription pour l’instant</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500">
              Parcours l’agenda TENF pour rejoindre une soirée film, un jeu communautaire, une formation ou un spotlight — un clic suffit pour
              t’inscrire.
            </p>
            <Link
              href="/member/evenements"
              className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-3 text-sm font-bold text-white shadow-lg hover:brightness-110"
            >
              Voir l’agenda <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        ) : displayedList.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-black/30 px-6 py-10 text-center">
            <p className="text-sm text-zinc-400">Aucun résultat pour cette vue ou cette recherche.</p>
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setListTab("all");
              }}
              className="mt-4 rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-zinc-300 hover:bg-white/5"
            >
              Réinitialiser filtres
            </button>
          </div>
        ) : (
          <ul className="space-y-3">
            {displayedList.map((event) => {
              const cat = getCategoryBadgeStyles(event.category);
              const expanded = expandedEventId === event.id;
              const isPast = new Date(event.date).getTime() < Date.now();
              const calUrl = googleCalendarUrl(event.title, event.date);
              const desc = (event.description || "").trim();

              return (
                <li key={`${listTab}-${event.id}`}>
                  <article
                    className={`overflow-hidden rounded-2xl border transition ${
                      isPast
                        ? "border-white/8 bg-white/[0.03] hover:border-white/15"
                        : "border-sky-500/20 bg-gradient-to-br from-sky-950/20 to-black/40 hover:border-sky-400/35"
                    }`}
                  >
                    <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-stretch">
                      <div className="relative h-24 w-full shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-violet-950/60 to-zinc-900 sm:h-auto sm:w-36">
                        {event.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={event.image} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <CalendarDays className="h-8 w-8 text-violet-400/40" aria-hidden />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <p className="font-bold text-white">{event.title}</p>
                            {event.seriesName ? (
                              <p className="mt-0.5 text-xs text-violet-300/80">{event.seriesName}</p>
                            ) : null}
                          </div>
                          <span
                            className="shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide"
                            style={{ backgroundColor: cat.bg, color: cat.text, borderColor: cat.border }}
                          >
                            {event.category}
                          </span>
                        </div>
                        <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-zinc-400">
                          <CalendarDays className="h-4 w-4 shrink-0 text-zinc-500" aria-hidden />
                          {formatEventDate(event.date)}
                          {event.location ? (
                            <>
                              <span className="text-zinc-600">·</span>
                              <span>{event.location}</span>
                            </>
                          ) : null}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {!isPast ? (
                            <a
                              href={calUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/35 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-100 hover:bg-amber-500/20"
                            >
                              Google Agenda <ExternalLink className="h-3 w-3" aria-hidden />
                            </a>
                          ) : null}
                          {event.ctaUrl ? (
                            <a
                              href={event.ctaUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-xl border border-violet-500/35 bg-violet-500/10 px-3 py-2 text-xs font-semibold text-violet-100 hover:bg-violet-500/20"
                            >
                              {event.ctaLabel || "Lien"} <ExternalLink className="h-3 w-3" aria-hidden />
                            </a>
                          ) : null}
                          <Link
                            href="/member/evenements"
                            className="inline-flex items-center gap-1 rounded-xl border border-white/12 px-3 py-2 text-xs font-semibold text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                          >
                            Agenda <ArrowRight className="h-3 w-3" aria-hidden />
                          </Link>
                          {desc ? (
                            <button
                              type="button"
                              onClick={() => toggleExpand(event.id)}
                              className="inline-flex items-center gap-1 rounded-xl border border-white/12 px-3 py-2 text-xs font-semibold text-zinc-400 hover:bg-white/5"
                            >
                              {expanded ? "Moins" : "Description"}
                              <ChevronDown className={`h-4 w-4 transition ${expanded ? "rotate-180" : ""}`} aria-hidden />
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                    {expanded && desc ? (
                      <div className="border-t border-white/8 px-4 py-4">
                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">{desc}</p>
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
  value: number | string;
  icon: React.ReactNode;
  gradient: string;
}) {
  const numeric = typeof value === "number";
  return (
    <article
      className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br ${gradient} to-black/50 p-4 transition hover:border-white/18 hover:shadow-md hover:shadow-black/20`}
    >
      <div className="mb-2 flex items-center gap-2 text-zinc-500">
        <span className="rounded-lg border border-white/10 bg-black/30 p-1.5">{icon}</span>
        <p className="text-[11px] font-semibold uppercase tracking-wide">{label}</p>
      </div>
      <p className={`font-black text-white ${numeric ? "text-2xl tabular-nums" : "text-xl"}`}>{value}</p>
    </article>
  );
}

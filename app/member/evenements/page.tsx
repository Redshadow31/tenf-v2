"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Calendar,
  CalendarPlus,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  ExternalLink,
  Loader2,
  MapPin,
  PartyPopper,
  Sparkles,
  UserMinus,
  UserPlus,
  Users,
} from "lucide-react";
import MemberSurface from "@/components/member/ui/MemberSurface";
import MemberPageHeader from "@/components/member/ui/MemberPageHeader";
import { buildEventLocationDisplay, type EventLocationLink } from "@/lib/eventLocation";

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
  isMaskedForAudience?: boolean;
  spotlightStreamerDisplayName?: string;
  seriesName?: string;
};

type RangeFilter = "all" | "week";

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

function googleCalendarUrl(title: string, startIso: string): string {
  const start = new Date(startIso);
  if (Number.isNaN(start.getTime())) return "#";
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  const fmt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const p = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${fmt(start)}/${fmt(end)}`,
    details: "Événement TENF — https://tenf-community.com/member/evenements",
  });
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
}

function EventsHeroSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-36 rounded-2xl bg-white/5 sm:h-40" />
      <div className="grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-24 rounded-xl bg-white/5" />
        ))}
      </div>
      <div className="h-64 rounded-2xl bg-white/5" />
    </div>
  );
}

export default function MemberEventsPlanningPage() {
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [locationLinks, setLocationLinks] = useState<EventLocationLink[]>([]);
  const [registeredIds, setRegisteredIds] = useState<Set<string>>(() => new Set());
  const [registrationsReady, setRegistrationsReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [rangeFilter, setRangeFilter] = useState<RangeFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionEventId, setActionEventId] = useState<string | null>(null);
  const [actionErrors, setActionErrors] = useState<Record<string, string>>({});

  const toggleExpanded = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [eventsResponse, linksResponse, regResponse] = await Promise.all([
          fetch("/api/events", { cache: "no-store", credentials: "include" }),
          fetch("/api/events/location-links", { cache: "no-store" }),
          fetch("/api/events/registrations/me", { cache: "no-store", credentials: "include" }),
        ]);
        const [eventsBody, linksBody, regBody] = await Promise.all([
          eventsResponse.json(),
          linksResponse.json(),
          regResponse.json().catch(() => ({})),
        ]);

        const threeHoursAgo = Date.now() - 3 * 60 * 60 * 1000;
        const upcomingEvents = (eventsBody.events || [])
          .filter((event: CommunityEvent) => new Date(event.date).getTime() >= threeHoursAgo)
          .sort((a: CommunityEvent, b: CommunityEvent) => {
            return new Date(a.date).getTime() - new Date(b.date).getTime();
          })
          .slice(0, 40);
        setEvents(upcomingEvents);
        setLocationLinks((linksBody.links || []) as EventLocationLink[]);

        if (regResponse.ok && Array.isArray(regBody?.registeredEventIds)) {
          const ids = regBody.registeredEventIds.filter((id: unknown): id is string => typeof id === "string");
          setRegisteredIds(new Set(ids));
        } else {
          setRegisteredIds(new Set());
        }
      } catch {
        setRegisteredIds(new Set());
      } finally {
        setRegistrationsReady(true);
        setLoading(false);
      }
    })();
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    events.forEach((e) => {
      if (e.category?.trim()) set.add(e.category.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "fr"));
  }, [events]);

  const filteredEvents = useMemo(() => {
    const now = Date.now();
    const weekEnd = now + 7 * 24 * 60 * 60 * 1000;
    return events.filter((e) => {
      const t = new Date(e.date).getTime();
      if (rangeFilter === "week" && (t > weekEnd || t < now - 60 * 1000)) return false;
      if (categoryFilter !== "all" && e.category.trim() !== categoryFilter) return false;
      return true;
    });
  }, [events, rangeFilter, categoryFilter]);

  const nextEvent = events[0] ?? null;
  const daysUntilNext = nextEvent
    ? Math.ceil((new Date(nextEvent.date).getTime() - Date.now()) / (24 * 60 * 60 * 1000))
    : null;

  const myRegistrationsInList = useMemo(
    () => events.filter((e) => registeredIds.has(e.id)).length,
    [events, registeredIds],
  );

  const runRegistrationToggle = useCallback(
    async (event: CommunityEvent) => {
      const id = event.id;
      const isRegistered = registeredIds.has(id);
      if (isRegistered) {
        const ok = window.confirm(
          `Retirer ton inscription à « ${event.title} » ?\n\nTu pourras toujours te réinscrire plus tard si ton planning s’éclaircit.`,
        );
        if (!ok) return;
      }
      setActionErrors((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      setActionEventId(id);
      try {
        const encoded = encodeURIComponent(id);
        const res = isRegistered
          ? await fetch(`/api/events/${encoded}/unregister`, { method: "DELETE", credentials: "include" })
          : await fetch(`/api/events/${encoded}/register`, {
              method: "POST",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({}),
            });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          const msg =
            typeof body?.error === "string" && body.error.trim()
              ? body.error.trim()
              : "Impossible de mettre à jour ton inscription pour le moment. Réessaie dans un instant ou préviens le staff sur Discord si ça persiste.";
          setActionErrors((prev) => ({ ...prev, [id]: msg }));
          return;
        }
        setRegisteredIds((prev) => {
          const next = new Set(prev);
          if (isRegistered) next.delete(id);
          else next.add(id);
          return next;
        });
      } finally {
        setActionEventId(null);
      }
    },
    [registeredIds],
  );

  return (
    <MemberSurface>
      <MemberPageHeader
        title="Planning des événements TENF"
        description="Bienvenue dans l’agenda de la communauté : ici tu vois ce qui arrive pour tout le monde — formations, soirées, spotlights, moments chill entre créateurs. Tu es libre de ton rythme : une inscription aide surtout le staff à prévoir les places et le bon déroulé ; si ton planning bouge, tu peux te désinscrire sans stress."
        badge="Espace membre"
        extras={
          <span className="inline-flex items-center gap-1 rounded-full border border-violet-400/35 bg-violet-500/12 px-2.5 py-1 text-[11px] font-semibold text-violet-100">
            <Sparkles className="h-3 w-3 text-amber-300" aria-hidden />
            New Family
          </span>
        }
      />

      <section
        className="rounded-2xl border border-white/10 bg-gradient-to-br from-violet-950/35 via-slate-950/60 to-slate-950/95 px-4 py-4 sm:px-5 sm:py-5"
        aria-labelledby="events-planning-intro"
      >
        <h2 id="events-planning-intro" className="sr-only">
          Pourquoi cette page existe
        </h2>
        <p className="text-sm leading-relaxed text-slate-200 sm:text-[15px]">
          <strong className="text-white">Pour les membres TENF</strong>, c’est le point d’entrée pour savoir{" "}
          <em className="text-violet-200 not-italic">quand</em> la communauté se retrouve et comment t’y greffer. Tu peux consulter comme un simple curieux·se,
          t’inscrire aux créneaux qui t’intéressent, puis retrouver ton historique sous « Mes inscriptions » ou « Mes présences » si tu veux suivre ta régularité — sans
          obligation de tout faire.
        </p>
      </section>

      {/* Liens rapides participation */}
      <div className="flex flex-wrap gap-2 sm:gap-3">
        <Link
          href="/member/evenements/inscriptions"
          className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl border border-violet-500/35 bg-violet-500/10 px-4 py-2.5 text-sm font-semibold text-violet-100 shadow-sm transition hover:border-violet-400/55 hover:bg-violet-500/18 sm:flex-none"
        >
          <Users className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
          Mes inscriptions en cours
        </Link>
        <Link
          href="/member/evenements/presences"
          className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl border border-emerald-500/35 bg-emerald-500/10 px-4 py-2.5 text-sm font-semibold text-emerald-100 shadow-sm transition hover:border-emerald-400/50 hover:bg-emerald-500/18 sm:flex-none"
        >
          <PartyPopper className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
          Mes présences & tendances
        </Link>
      </div>

      {loading ? (
        <EventsHeroSkeleton />
      ) : events.length === 0 ? (
        <section
          className="relative overflow-hidden rounded-2xl border px-6 py-16 text-center sm:px-10 sm:py-20"
          style={{
            borderColor: "var(--color-border)",
            background:
              "linear-gradient(160deg, rgba(145,70,255,0.1) 0%, var(--color-card) 50%, rgba(15,15,22,0.98) 100%)",
          }}
        >
          <div
            className="pointer-events-none absolute -left-20 top-0 h-56 w-56 rounded-full opacity-40 blur-3xl"
            style={{ background: "rgba(145, 70, 255, 0.25)" }}
          />
          <Calendar className="mx-auto mb-4 h-14 w-14 text-violet-300/90" strokeWidth={1.25} aria-hidden />
          <h2 className="text-xl font-bold" style={{ color: "var(--color-text)" }}>
            Le calendrier fait une petite pause
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed sm:text-[15px]" style={{ color: "var(--color-text-secondary)" }}>
            Pour l’instant, aucun événement à venir n’apparaît ici — soit il n’y en a pas de publiés, soit ils sont encore en préparation côté équipe. Ce n’est pas un signal sur ta place dans TENF : la communauté vit aussi sur Discord et pendant les lives. Reviens plus tard ou passe par tes raccourcis ci-dessous pour retrouver tes traces.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/member/evenements/inscriptions"
              className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              Mes inscriptions en cours
            </Link>
            <Link
              href="/member/dashboard"
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-5 py-2.5 text-sm font-medium text-zinc-200 transition hover:bg-white/5"
            >
              Retour au tableau de bord
            </Link>
          </div>
        </section>
      ) : (
        <>
          {/* Hero stats + filtres */}
          <section
            className="relative overflow-hidden rounded-2xl border shadow-[0_24px_60px_rgba(0,0,0,0.28)]"
            style={{ borderColor: "var(--color-border)" }}
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-90"
              style={{
                background:
                  "radial-gradient(ellipse 100% 80% at 10% -20%, rgba(145,70,255,0.22), transparent 52%), radial-gradient(ellipse 70% 60% at 95% 110%, rgba(206,25,70,0.12), transparent 48%)",
              }}
            />
            <div className="relative space-y-6 p-5 sm:p-8" style={{ backgroundColor: "var(--color-card)" }}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-violet-300/90">
                    <Sparkles className="h-3.5 w-3.5" aria-hidden />
                    Ce qui arrive dans la communauté
                  </p>
                  <p className="text-3xl font-black tabular-nums tracking-tight sm:text-4xl" style={{ color: "var(--color-text)" }}>
                    {events.length}
                    <span className="ml-2 text-lg font-bold text-zinc-400 sm:text-xl">rendez-vous à l’affiche</span>
                  </p>
                  <p className="mt-2 max-w-2xl text-xs leading-relaxed text-zinc-500 sm:text-sm">
                    Les événements affichés sont ouverts aux membres TENF (et parfois à des formats visibles plus largement selon ce qui est prévu). Les filtres te permettent de te concentrer sur une semaine ou un type d’animation.
                  </p>
                  {nextEvent && daysUntilNext !== null ? (
                    <p className="mt-2 max-w-xl text-sm leading-relaxed sm:text-[15px]" style={{ color: "var(--color-text-secondary)" }}>
                      Prochain rendez-vous : <strong style={{ color: "var(--color-text)" }}>{nextEvent.title}</strong>
                      {daysUntilNext <= 0 ? (
                        <> — c’est pour bientôt ou en cours, pense à vérifier le lieu et l’heure.</>
                      ) : daysUntilNext === 1 ? (
                        <> — dans environ une journée.</>
                      ) : (
                        <> — dans environ {daysUntilNext} jours.</>
                      )}
                    </p>
                  ) : null}
                  {registrationsReady && events.length > 0 ? (
                    myRegistrationsInList > 0 ? (
                      <p className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-emerald-200/95">
                        <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
                        Tu es inscrit(e) à {myRegistrationsInList}{" "}
                        {myRegistrationsInList > 1 ? "créneaux" : "créneau"} dans cette liste — merci, ça aide vraiment à organiser la session.
                      </p>
                    ) : (
                      <p className="mt-2 max-w-xl text-sm text-zinc-500">
                        Tu n’es encore inscrit(e) à aucun de ces créneaux : choisis-en un ou deux qui te parlent ; une simple inscription suffit pour que l’équipe anticipe les places et le matériel.
                      </p>
                    )
                  ) : null}
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div
                    className="inline-flex rounded-xl border p-1"
                    style={{ borderColor: "var(--color-border)", backgroundColor: "rgba(0,0,0,0.22)" }}
                    role="group"
                    aria-label="Filtrer les événements par période"
                  >
                    <button
                      type="button"
                      onClick={() => setRangeFilter("all")}
                      className={`rounded-lg px-3.5 py-2 text-[13px] font-semibold transition sm:px-4 sm:text-sm ${
                        rangeFilter === "all" ? "bg-white/12 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"
                      }`}
                    >
                      Toute la liste
                    </button>
                    <button
                      type="button"
                      onClick={() => setRangeFilter("week")}
                      className={`rounded-lg px-3.5 py-2 text-[13px] font-semibold transition sm:px-4 sm:text-sm ${
                        rangeFilter === "week" ? "bg-violet-600 text-white shadow-md" : "text-zinc-500 hover:text-zinc-300"
                      }`}
                    >
                      Cette semaine
                    </button>
                  </div>
                </div>
              </div>

              {categories.length > 1 ? (
                <div className="flex flex-wrap gap-2" aria-label="Filtrer par type d’événement (formation, spotlight, etc.)">
                  <button
                    type="button"
                    onClick={() => setCategoryFilter("all")}
                    className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition sm:text-[13px] ${
                      categoryFilter === "all"
                        ? "border-violet-400/50 bg-violet-500/20 text-violet-100"
                        : "border-white/10 bg-black/20 text-zinc-400 hover:border-white/20 hover:text-zinc-200"
                    }`}
                  >
                    Tous les formats
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategoryFilter(cat)}
                      className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition sm:text-[13px] ${
                        categoryFilter === cat
                          ? "border-fuchsia-400/45 bg-fuchsia-500/15 text-fuchsia-100"
                          : "border-white/10 bg-black/20 text-zinc-400 hover:border-white/20 hover:text-zinc-200"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </section>

          {filteredEvents.length === 0 ? (
            <div
              className="rounded-2xl border border-dashed px-6 py-12 text-center"
              style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
            >
              <p className="mx-auto max-w-md text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                Avec cette combinaison de filtres, rien ne ressort pour le moment. Ça peut arriver si tu regardes seulement la semaine en cours alors que les prochains moments sont plus loin, ou si un format précis n’est pas encore planifié.
              </p>
              <button
                type="button"
                onClick={() => {
                  setRangeFilter("all");
                  setCategoryFilter("all");
                }}
                className="mt-4 text-sm font-semibold text-violet-400 hover:text-violet-300 hover:underline"
              >
                Afficher toute la liste sans filtre
              </button>
            </div>
          ) : (
            <div className="space-y-5 sm:space-y-6">
              {filteredEvents.map((event) => {
                const categoryStyles = getCategoryBadgeStyles(event.category);
                const locationDisplay = buildEventLocationDisplay(event.location, locationLinks);
                const start = new Date(event.date);
                const dateText = start.toLocaleDateString("fr-FR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                });
                const hourText = start.toLocaleTimeString("fr-FR", {
                  hour: "2-digit",
                  minute: "2-digit",
                });
                const dayNum = start.toLocaleDateString("fr-FR", { day: "2-digit" });
                const monthShort = start.toLocaleDateString("fr-FR", { month: "short" });
                const weekdayShort = start.toLocaleDateString("fr-FR", { weekday: "short" });
                const desc = (event.description || "").trim();
                const expanded = expandedId === event.id;
                const calUrl = googleCalendarUrl(event.title, event.date);
                const isRegisteredHere = registeredIds.has(event.id);
                const isBusy = actionEventId === event.id;

                return (
                  <article
                    key={event.id}
                    className="group overflow-hidden rounded-2xl border transition duration-300 hover:border-violet-500/25 hover:shadow-[0_20px_50px_rgba(0,0,0,0.25)]"
                    style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
                  >
                    <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-stretch">
                      {/* Visuel */}
                      <div className="relative aspect-[21/9] min-h-[140px] w-full overflow-hidden bg-gradient-to-br from-violet-950/80 via-zinc-900 to-zinc-950 sm:aspect-[2.4/1] lg:min-h-[200px]">
                        {event.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={event.image}
                            alt={`Illustration · ${event.title}`}
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                          />
                        ) : (
                          <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-6 text-center">
                            <Calendar className="h-10 w-10 text-violet-300/50" aria-hidden />
                            <span className="max-w-[14rem] text-sm font-medium leading-snug text-zinc-500">
                              Image ou bannière en préparation — le créneau reste valable.
                            </span>
                          </div>
                        )}
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                        <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-end justify-between gap-2 sm:bottom-4 sm:left-4 sm:right-4">
                          <span
                            className="rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide text-white/95 backdrop-blur-md"
                            style={{
                              backgroundColor: categoryStyles.bg,
                              borderColor: categoryStyles.border,
                              color: categoryStyles.text,
                            }}
                          >
                            {event.category}
                          </span>
                          {registrationsReady && isRegisteredHere ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-950/70 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-emerald-100 backdrop-blur-md">
                              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                              Inscrit·e
                            </span>
                          ) : null}
                        </div>
                      </div>

                      {/* Colonne date — desktop */}
                      <div
                        className="hidden flex-col items-center justify-center border-t border-white/[0.06] p-6 text-center lg:flex lg:border-l lg:border-t-0"
                        style={{ background: "linear-gradient(180deg, rgba(145,70,255,0.08), transparent)" }}
                      >
                        <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">{weekdayShort}</span>
                        <span className="my-1 text-5xl font-black tabular-nums leading-none text-white">{dayNum}</span>
                        <span className="text-sm font-semibold capitalize text-violet-200/90">{monthShort}</span>
                        <span
                          className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-black/30 px-2.5 py-1 text-xs font-medium text-zinc-200"
                        >
                          <Clock className="h-3.5 w-3.5" aria-hidden />
                          {hourText}
                        </span>
                      </div>
                    </div>

                    <div className="border-t border-white/[0.06] p-4 sm:p-6 lg:grid lg:grid-cols-[1fr_auto] lg:items-start lg:gap-8">
                      <div className="min-w-0 space-y-3">
                        {/* Date ligne mobile */}
                        <div className="flex flex-wrap items-center gap-2 lg:hidden">
                          <span
                            className="inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm font-semibold"
                            style={{
                              backgroundColor: "rgba(145, 70, 255, 0.15)",
                              color: "#e9d5ff",
                              borderColor: "rgba(145, 70, 255, 0.35)",
                            }}
                          >
                            <Calendar className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
                            {dateText} · {hourText}
                          </span>
                        </div>

                        <h3 className="text-xl font-bold leading-tight tracking-tight sm:text-2xl" style={{ color: "var(--color-text)" }}>
                          {event.title}
                        </h3>

                        {event.seriesName ? (
                          <p className="text-sm font-medium text-sky-300/90">
                            Fait partie de la série « {event.seriesName} » — tu peux suivre plusieurs épisodes au fil des semaines.
                          </p>
                        ) : null}
                        {event.spotlightStreamerDisplayName ? (
                          <p className="text-sm text-violet-200/90">
                            Créateur·rice mis(e) en avant ·{" "}
                            <span className="font-semibold text-white">{event.spotlightStreamerDisplayName}</span>
                          </p>
                        ) : null}

                        {locationDisplay ? (
                          <a
                            href={locationDisplay.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex max-w-full items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-medium text-zinc-200 transition hover:border-violet-400/35 hover:bg-violet-500/10"
                          >
                            <MapPin className="h-4 w-4 shrink-0 text-violet-400" aria-hidden />
                            <span className="min-w-0 truncate">{locationDisplay.label}</span>
                            <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden />
                          </a>
                        ) : event.location ? (
                          <p className="flex items-start gap-2 text-sm text-zinc-400">
                            <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                            {event.location}
                          </p>
                        ) : null}

                        {desc ? (
                          <div>
                            <p
                              className={`text-sm leading-relaxed text-zinc-300 sm:text-[15px] ${expanded ? "" : "line-clamp-3"}`}
                            >
                              {desc}
                            </p>
                            {desc.length > 140 ? (
                              <button
                                type="button"
                                onClick={() => toggleExpanded(event.id)}
                                className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-violet-400 hover:text-violet-300"
                                aria-expanded={expanded}
                              >
                                {expanded ? (
                                  <>
                                    <ChevronUp className="h-4 w-4" aria-hidden />
                                    Réduire
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="h-4 w-4" aria-hidden />
                                    Lire toute la description
                                  </>
                                )}
                              </button>
                            ) : null}
                          </div>
                        ) : null}

                        {event.isMaskedForAudience && event.ctaLabel && event.ctaUrl ? (
                          <a
                            href={event.ctaUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:brightness-110"
                            style={{ backgroundColor: "var(--color-primary)" }}
                          >
                            {event.ctaLabel}
                            <ExternalLink className="h-4 w-4" aria-hidden />
                          </a>
                        ) : null}
                      </div>

                      <div className="mt-5 flex flex-col gap-2 border-t border-white/[0.06] pt-5 lg:mt-0 lg:w-52 lg:border-0 lg:border-l lg:pl-6 lg:pt-0">
                        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Ta présence</p>
                        <p className="text-[11px] leading-snug text-zinc-500">
                          Indique si tu comptes être là — ce n’est pas un engagement juridique, mais ça sécurise l’organisation pour tout le monde.
                        </p>
                        {registrationsReady ? (
                          <>
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => void runRegistrationToggle(event)}
                              className={`inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                                isRegisteredHere
                                  ? "border border-rose-400/35 bg-rose-500/10 text-rose-100 hover:border-rose-400/55 hover:bg-rose-500/16"
                                  : "border border-emerald-400/35 bg-emerald-600/90 text-white shadow-md hover:bg-emerald-500"
                              }`}
                            >
                              {isBusy ? (
                                <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
                              ) : isRegisteredHere ? (
                                <UserMinus className="h-4 w-4 shrink-0" aria-hidden />
                              ) : (
                                <UserPlus className="h-4 w-4 shrink-0" aria-hidden />
                              )}
                              {isRegisteredHere ? "Me désinscrire" : "Je m’inscris"}
                            </button>
                            {actionErrors[event.id] ? (
                              <p className="text-center text-xs leading-snug text-rose-400 lg:text-left" role="alert">
                                {actionErrors[event.id]}
                              </p>
                            ) : null}
                          </>
                        ) : (
                          <div
                            className="flex min-h-[44px] items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]"
                            aria-hidden
                          >
                            <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />
                          </div>
                        )}
                        <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-zinc-500">Mon agenda perso</p>
                        <a
                          href={calUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/[0.06] px-3 py-2.5 text-sm font-semibold text-zinc-100 transition hover:border-violet-400/40 hover:bg-violet-500/10"
                        >
                          <CalendarPlus className="h-4 w-4 shrink-0 text-violet-300" aria-hidden />
                          Ajouter dans Google Agenda
                        </a>
                        <p className="text-center text-[11px] leading-snug text-zinc-500 lg:text-left">
                          Une fenêtre Google Calendar s’ouvre : tu peux y corriger la durée ou ajouter un rappel — l’horaire affiché suit la fiche événement TENF.
                        </p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}
    </MemberSurface>
  );
}

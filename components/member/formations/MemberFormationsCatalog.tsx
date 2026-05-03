"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  ExternalLink,
  LayoutGrid,
  Library,
  List,
  Loader2,
  MessageSquarePlus,
  Search,
  Sparkles,
  Target,
  X,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import MemberSurface from "@/components/member/ui/MemberSurface";
import MemberPageHeader from "@/components/member/ui/MemberPageHeader";
import EmptyFeatureCard from "@/components/member/ui/EmptyFeatureCard";
import FormationsSubnav from "@/components/member/formations/FormationsSubnav";
import FormationRequestModal from "@/components/member/formations/FormationRequestModal";

type EventItem = {
  id: string;
  title: string;
  date: string;
  category: string;
  description?: string;
  image?: string;
  location?: string;
};

type TwitchLinkState = {
  loading: boolean;
  connected: boolean;
};

function CatalogSkeleton({ grid }: { grid?: boolean }) {
  if (grid) {
    return (
      <div className="grid animate-pulse grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-hidden>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-52 rounded-2xl bg-white/5" />
        ))}
      </div>
    );
  }
  return (
    <div className="space-y-3 animate-pulse" aria-hidden>
      <div className="h-24 rounded-xl bg-white/5" />
      <div className="h-24 rounded-xl bg-white/5" />
    </div>
  );
}

/** Première « lettre » pour filtres (regroupe symboles / chiffres sous #). */
function catalogFirstBucket(title: string): string {
  const t = title.trim();
  if (!t) return "#";
  const c = t.charAt(0).toUpperCase();
  if (/[A-ZÀÂÄÉÈÊËÎÏÔÖÙÛÜŸÆŒÇ]/u.test(c)) return c;
  return "#";
}

function catalogHue(title: string): number {
  let h = 0;
  for (let i = 0; i < title.length; i++) h = (h + title.charCodeAt(i) * (i + 3)) % 360;
  return h;
}

export default function MemberFormationsCatalog() {
  const [formations, setFormations] = useState<EventItem[]>([]);
  const [pendingTitles, setPendingTitles] = useState<Set<string>>(new Set());
  const [submittingTitle, setSubmittingTitle] = useState<string>("");
  const [registeredEventIds, setRegisteredEventIds] = useState<Set<string>>(new Set());
  const [registeringEventId, setRegisteringEventId] = useState<string>("");
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<string>("");
  const [twitchLinkState, setTwitchLinkState] = useState<TwitchLinkState>({
    loading: true,
    connected: false,
  });
  const [activeSection, setActiveSection] = useState<"upcoming" | "catalog">("upcoming");
  const [catalogQuery, setCatalogQuery] = useState("");
  const [showInterestedOnly, setShowInterestedOnly] = useState(false);
  const [catalogViewMode, setCatalogViewMode] = useState<"grid" | "list">("grid");
  const [catalogSort, setCatalogSort] = useState<"alpha" | "alpha-desc">("alpha");
  const [catalogLetter, setCatalogLetter] = useState<string | null>(null);
  const [requestModalOpen, setRequestModalOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [eventsResponse, requestsResponse] = await Promise.all([
          fetch("/api/events", { cache: "no-store" }),
          fetch("/api/members/me/formation-requests", { cache: "no-store" }),
        ]);

        const eventsBody = await eventsResponse.json();
        const requestsBody = requestsResponse.ok ? await requestsResponse.json() : { pendingTitles: [] };

        const rows = (eventsBody.events || []).filter((event: EventItem) =>
          (event.category || "").toLowerCase().includes("formation")
        );
        setFormations(rows);
        setPendingTitles(new Set<string>((requestsBody.pendingTitles || []).map((title: string) => String(title))));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch("/api/auth/twitch/link/status", { cache: "no-store" });
        const body = await response.json().catch(() => ({}));
        setTwitchLinkState({
          loading: false,
          connected: response.ok && body?.connected === true,
        });
      } catch {
        setTwitchLinkState({ loading: false, connected: false });
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch("/api/events/registrations/me", {
          cache: "no-store",
          credentials: "include",
        });
        if (!response.ok) {
          if (response.status === 401) {
            setRegisteredEventIds(new Set());
          }
          return;
        }
        const data = await response.json();
        const ids = Array.isArray(data?.registeredEventIds)
          ? data.registeredEventIds.filter((id: unknown): id is string => typeof id === "string")
          : [];
        setRegisteredEventIds(new Set(ids));
      } catch {
        setRegisteredEventIds(new Set());
      }
    })();
  }, []);

  const nowTs = Date.now();
  const sortedFormations = useMemo(
    () => formations.slice().sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [formations]
  );
  const upcomingFormations = sortedFormations.filter((formation) => new Date(formation.date).getTime() >= nowTs);
  const pastFormationsUnique = useMemo(() => {
    const byKey = new Map<string, { title: string; sourceEventId: string | null; latestDate: number }>();
    for (const formation of sortedFormations) {
      if (new Date(formation.date).getTime() >= nowTs) continue;
      const key = formation.title.trim().toLowerCase();
      if (!key) continue;
      const ts = new Date(formation.date).getTime();
      const prev = byKey.get(key);
      if (!prev || ts > prev.latestDate) {
        byKey.set(key, {
          title: formation.title,
          sourceEventId: formation.id ? String(formation.id) : null,
          latestDate: ts,
        });
      }
    }
    return Array.from(byKey.entries()).map(([key, v]) => ({
      key,
      title: v.title,
      sourceEventId: v.sourceEventId,
    }));
  }, [sortedFormations, nowTs]);
  const filteredPastFormations = useMemo(() => {
    const query = catalogQuery.trim().toLowerCase();
    return pastFormationsUnique.filter((formation) => {
      const matchesQuery = !query || formation.title.toLowerCase().includes(query);
      const matchesInterested = !showInterestedOnly || pendingTitles.has(formation.title);
      return matchesQuery && matchesInterested;
    });
  }, [catalogQuery, pastFormationsUnique, pendingTitles, showInterestedOnly]);
  const interestedCount = useMemo(
    () => pastFormationsUnique.filter((formation) => pendingTitles.has(formation.title)).length,
    [pastFormationsUnique, pendingTitles]
  );

  const catalogLetterChips = useMemo(() => {
    const counts = new Map<string, number>();
    for (const f of filteredPastFormations) {
      const L = catalogFirstBucket(f.title);
      counts.set(L, (counts.get(L) || 0) + 1);
    }
    return Array.from(counts.entries()).sort(([a], [b]) => a.localeCompare(b, "fr", { sensitivity: "base" }));
  }, [filteredPastFormations]);

  const catalogSuggestionsForModal = useMemo(
    () => pastFormationsUnique.map(({ title, sourceEventId }) => ({ title, sourceEventId })),
    [pastFormationsUnique]
  );

  const displayedPastCatalog = useMemo(() => {
    let list = catalogLetter
      ? filteredPastFormations.filter((f) => catalogFirstBucket(f.title) === catalogLetter)
      : filteredPastFormations;
    list = [...list].sort((a, b) =>
      catalogSort === "alpha" ? a.title.localeCompare(b.title, "fr") : b.title.localeCompare(a.title, "fr")
    );
    return list;
  }, [filteredPastFormations, catalogLetter, catalogSort]);

  const refreshPendingFormationRequests = useCallback(async () => {
    try {
      const requestsResponse = await fetch("/api/members/me/formation-requests", { cache: "no-store" });
      if (!requestsResponse.ok) return;
      const requestsBody = await requestsResponse.json();
      setPendingTitles(new Set<string>((requestsBody.pendingTitles || []).map((title: string) => String(title))));
    } catch {
      /* ignore */
    }
  }, []);

  async function submitInterest(formationTitle: string, sourceEventId?: string | null, memberMessage?: string | null) {
    setFeedback("");
    setSubmittingTitle(formationTitle);
    try {
      const payload: Record<string, unknown> = {
        formationTitle,
        sourceEventId: sourceEventId || null,
      };
      if (memberMessage && memberMessage.trim()) {
        payload.message = memberMessage.trim().slice(0, 2000);
      }
      const response = await fetch("/api/members/me/formation-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await response.json();
      if (!response.ok) {
        setFeedback(body.error || "Impossible d'enregistrer ta demande.");
        return;
      }
      setPendingTitles((previous) => new Set([...Array.from(previous), formationTitle]));
      setFeedback(
        body.created ? "Demande enregistrée. Merci, on remonte ça à l'équipe formation." : "Demande déjà enregistrée pour cette formation."
      );
      void refreshPendingFormationRequests();
    } catch {
      setFeedback("Erreur réseau. Réessaie dans quelques instants.");
    } finally {
      setSubmittingTitle("");
    }
  }

  async function toggleRegistration(eventId: string) {
    const isRegistered = registeredEventIds.has(eventId);
    setRegisteringEventId(eventId);
    setFeedback("");
    try {
      const response = await fetch(`/api/events/${eventId}/${isRegistered ? "unregister" : "register"}`, {
        method: isRegistered ? "DELETE" : "POST",
        credentials: "include",
        headers: isRegistered ? undefined : { "Content-Type": "application/json" },
        body: isRegistered ? undefined : JSON.stringify({}),
      });
      const body = await response.json();
      if (response.ok || (!isRegistered && response.status === 409)) {
        setRegisteredEventIds((previous) => {
          const next = new Set(previous);
          if (isRegistered) {
            next.delete(eventId);
          } else {
            next.add(eventId);
          }
          return next;
        });
        setFeedback(
          isRegistered
            ? body.message || "Désinscription enregistrée."
            : response.status === 409
              ? "Tu es déjà inscrit à cette formation."
              : body.message || "Inscription enregistrée."
        );
        return;
      }
      setFeedback(body.error || "Impossible de mettre à jour ton inscription.");
    } catch {
      setFeedback("Erreur réseau. Réessaie dans quelques instants.");
    } finally {
      setRegisteringEventId("");
    }
  }

  function calendarUrlForEvent(event: EventItem): string {
    const start = new Date(event.date);
    if (Number.isNaN(start.getTime())) return "/member/formations";
    const end = new Date(start.getTime() + 90 * 60 * 1000);
    const formatUtc = (value: Date) => value.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
    const details = `${event.description || "Formation TENF"}\n\n${typeof window !== "undefined" ? window.location.origin : ""}/member/formations`;
    const location = event.location || "Discord TENF";
    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: event.title,
      dates: `${formatUtc(start)}/${formatUtc(end)}`,
      details,
      location,
    });
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  }

  return (
    <MemberSurface>
      <FormationsSubnav />

      <MemberPageHeader
        title="Catalogue des formations"
        description="Sessions à venir (inscription + calendrier), archive des thèmes déjà animés, et signalement d’intérêt pour un nouveau créneau. Pensé pour les membres TENF et les curieux du parcours Academy."
        badge="Academy TENF"
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Link
          href="/member/formations/validees"
          className="group flex items-center gap-3 rounded-xl border p-3 transition hover:border-violet-500/35 hover:bg-violet-500/5"
          style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
        >
          <Sparkles className="h-5 w-5 shrink-0 text-amber-200/90" />
          <span className="min-w-0 text-sm font-medium leading-snug break-words text-pretty" style={{ color: "var(--color-text)" }}>
            Voir mes formations validées
          </span>
          <ArrowRight className="ml-auto h-4 w-4 shrink-0 opacity-50 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
        </Link>
        <Link
          href="/member/academy"
          className="group flex items-center gap-3 rounded-xl border p-3 transition hover:border-violet-500/35 hover:bg-violet-500/5"
          style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
        >
          <BookOpen className="h-5 w-5 shrink-0 text-violet-200/90" />
          <span className="min-w-0 text-sm font-medium leading-snug break-words text-pretty" style={{ color: "var(--color-text)" }}>
            Présentation Academy
          </span>
          <ExternalLink className="ml-auto h-4 w-4 shrink-0 opacity-50 group-hover:opacity-100" />
        </Link>
        <Link
          href="/member/objectifs"
          className="group flex items-center gap-3 rounded-xl border p-3 transition hover:border-violet-500/35 hover:bg-violet-500/5"
          style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
        >
          <Target className="h-5 w-5 shrink-0 text-emerald-200/90" />
          <span className="min-w-0 text-sm font-medium leading-snug break-words text-pretty" style={{ color: "var(--color-text)" }}>
            Objectifs du mois (formations)
          </span>
          <ArrowRight className="ml-auto h-4 w-4 shrink-0 opacity-50 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
        </Link>
      </div>

      <div
        className="flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between"
        style={{ borderColor: "rgba(139,92,246,0.35)", backgroundColor: "rgba(139,92,246,0.08)" }}
      >
        <div className="min-w-0">
          <p className="text-sm font-bold leading-snug break-words text-pretty" style={{ color: "var(--color-text)" }}>
            Une idée de sujet ou un besoin précis ?
          </p>
          <p className="mt-1 text-xs leading-relaxed break-words text-pretty" style={{ color: "var(--color-text-secondary)" }}>
            Ouvre le formulaire : titre, texte pour l&apos;équipe, lien optionnel avec une formation déjà au catalogue.
            Les demandes sont visibles dans l&apos;admin « Demandes de formation » (avec liaison vers l&apos;événement
            source si connu).
          </p>
        </div>
        <button
          type="button"
          onClick={() => setRequestModalOpen(true)}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border-2 border-violet-400/50 bg-violet-600/25 px-4 py-3 text-sm font-bold text-violet-50 shadow-lg transition hover:bg-violet-600/35 active:scale-[0.99]"
        >
          <MessageSquarePlus className="h-5 w-5" aria-hidden />
          Demander une formation
        </button>
      </div>

      {feedback ? (
        <section
          className="rounded-xl border px-4 py-3 text-sm leading-relaxed break-words text-pretty animate-fadeIn"
          style={{ borderColor: "rgba(139,92,246,0.35)", backgroundColor: "rgba(139,92,246,0.08)", color: "var(--color-text)" }}
          role="status"
        >
          {feedback}
        </section>
      ) : null}

      <section
        className="relative overflow-hidden rounded-2xl border p-5 md:p-6"
        style={{
          borderColor: twitchLinkState.loading
            ? "rgba(145,70,255,0.30)"
            : twitchLinkState.connected
              ? "rgba(52,211,153,0.40)"
              : "rgba(248,113,113,0.40)",
          backgroundColor: "var(--color-card)",
        }}
      >
        <div
          className="pointer-events-none absolute -left-20 -top-20 h-56 w-56 rounded-full bg-violet-600/20 blur-3xl animate-mesh"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-16 -right-10 h-48 w-48 rounded-full bg-amber-500/15 blur-3xl animate-mesh [animation-delay:-6s]"
          aria-hidden
        />
        <div className="relative z-[1] flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--color-text-secondary)" }}>
              Parcours formations
            </p>
            <h2 className="mt-1 text-xl font-bold leading-snug break-words text-pretty md:text-2xl" style={{ color: "var(--color-text)" }}>
              Choisis ton onglet : sessions live ou catalogue passé
            </h2>
            <p className="mt-2 text-sm leading-relaxed break-words text-pretty" style={{ color: "var(--color-text-secondary)" }}>
              Les compteurs se mettent à jour selon les événements chargés. La liaison Twitch aide certaines intégrations
              côté profil — ce n’est pas obligatoire pour consulter le catalogue.
            </p>
            <div className="mt-3">
              <span
                className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold"
                style={{
                  borderColor: twitchLinkState.loading
                    ? "var(--color-border)"
                    : twitchLinkState.connected
                      ? "rgba(52,211,153,0.45)"
                      : "rgba(248,113,113,0.45)",
                  color: twitchLinkState.loading
                    ? "var(--color-text-secondary)"
                    : twitchLinkState.connected
                      ? "#34d399"
                      : "#f87171",
                  backgroundColor: twitchLinkState.loading
                    ? "rgba(148,163,184,0.08)"
                    : twitchLinkState.connected
                      ? "rgba(52,211,153,0.12)"
                      : "rgba(248,113,113,0.12)",
                }}
              >
                {twitchLinkState.loading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                    Vérification Twitch…
                  </>
                ) : twitchLinkState.connected ? (
                  "Twitch lié"
                ) : (
                  "Twitch non lié — rappel depuis Paramètres"
                )}
              </span>
            </div>
          </div>
          <div className="grid w-full max-w-md grid-cols-3 gap-2 text-center md:max-w-sm">
            <div
              className="rounded-xl border px-2 py-3 transition hover:border-violet-400/30"
              style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg)" }}
            >
              <p className="text-[11px] font-medium uppercase tracking-wide" style={{ color: "var(--color-text-secondary)" }}>
                À venir
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums" style={{ color: "var(--color-text)" }}>
                {upcomingFormations.length}
              </p>
            </div>
            <div
              className="rounded-xl border px-2 py-3 transition hover:border-violet-400/30"
              style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg)" }}
            >
              <p className="text-[11px] font-medium uppercase tracking-wide" style={{ color: "var(--color-text-secondary)" }}>
                Catalogue
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums" style={{ color: "var(--color-text)" }}>
                {pastFormationsUnique.length}
              </p>
            </div>
            <div
              className="rounded-xl border px-2 py-3 transition hover:border-violet-400/30"
              style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg)" }}
            >
              <p className="text-[11px] font-medium uppercase tracking-wide" style={{ color: "var(--color-text-secondary)" }}>
                Intérêts
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-amber-200/95">
                {interestedCount}
              </p>
            </div>
          </div>
        </div>

        <div
          className="relative z-[1] mt-5 flex flex-col gap-2 rounded-xl border p-1 sm:flex-row"
          style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg)" }}
          role="tablist"
          aria-label="Affichage catalogue"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeSection === "upcoming"}
            id="tab-upcoming"
            aria-controls="panel-upcoming"
            onClick={() => setActiveSection("upcoming")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-3 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400 ${
              activeSection === "upcoming"
                ? "bg-violet-500/25 text-violet-50 shadow-inner ring-1 ring-violet-400/30"
                : "text-[color:var(--color-text-secondary)] hover:bg-white/5"
            }`}
            style={{ color: activeSection === "upcoming" ? undefined : "var(--color-text-secondary)" }}
          >
            <CalendarDays className="h-4 w-4 shrink-0" aria-hidden />
            <span className="break-words text-center">Prochaines sessions</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeSection === "catalog"}
            id="tab-catalog"
            aria-controls="panel-catalog"
            onClick={() => setActiveSection("catalog")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-3 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400 ${
              activeSection === "catalog"
                ? "bg-violet-500/25 text-violet-50 shadow-inner ring-1 ring-violet-400/30"
                : "text-[color:var(--color-text-secondary)] hover:bg-white/5"
            }`}
            style={{ color: activeSection === "catalog" ? undefined : "var(--color-text-secondary)" }}
          >
            <Library className="h-4 w-4 shrink-0" aria-hidden />
            <span className="break-words text-center">Anciennes formations</span>
          </button>
        </div>
      </section>

      {activeSection === "upcoming" ? (
        <section
          id="panel-upcoming"
          role="tabpanel"
          aria-labelledby="tab-upcoming"
          className="rounded-2xl border p-5 md:p-6"
          style={{
            borderColor: "rgba(212, 175, 55, 0.35)",
            background: "radial-gradient(circle at 12% 18%, rgba(212,175,55,0.14), var(--color-card) 48%)",
            boxShadow: "0 18px 36px rgba(0,0,0,0.18)",
          }}
        >
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <Sparkles size={18} className="text-amber-200/95" aria-hidden />
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-200/90">Prochaines formations</p>
          </div>

          {loading ? (
            <CatalogSkeleton />
          ) : upcomingFormations.length === 0 ? (
            <EmptyFeatureCard
              title="Aucune session planifiée"
              description="Reviens plus tard ou explore le catalogue des thèmes déjà animés dans l’onglet « Anciennes formations »."
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {upcomingFormations.slice(0, 12).map((formation, idx) => (
                <article
                  key={formation.id}
                  className="flex flex-col rounded-xl border p-4 animate-fadeIn transition duration-200 hover:border-amber-400/35 hover:shadow-lg"
                  style={{
                    borderColor: "rgba(255,255,255,0.12)",
                    backgroundColor: "rgba(12,12,15,0.35)",
                    animationDelay: `${Math.min(idx, 5) * 50}ms`,
                  }}
                >
                  <p className="text-base font-semibold leading-snug break-words text-pretty" style={{ color: "var(--color-text)" }}>
                    {formation.title}
                  </p>
                  <p className="mt-2 flex flex-wrap items-center gap-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                    <CalendarDays size={14} className="shrink-0" aria-hidden />
                    <span>{new Date(formation.date).toLocaleString("fr-FR")}</span>
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => toggleRegistration(formation.id)}
                      disabled={registeringEventId === formation.id}
                      className="inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
                      style={{
                        borderColor: registeredEventIds.has(formation.id) ? "rgba(248,113,113,0.45)" : "rgba(139,92,246,0.45)",
                        color: registeredEventIds.has(formation.id) ? "#f87171" : "#c4b5fd",
                      }}
                    >
                      {registeringEventId === formation.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : null}
                      {registeredEventIds.has(formation.id) ? "Se désinscrire" : "S'inscrire"}
                      <ArrowRight size={14} className="opacity-80" aria-hidden />
                    </button>
                    <a
                      href={calendarUrlForEvent(formation)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition hover:border-amber-300/50"
                      style={{
                        borderColor: "rgba(240,201,107,0.45)",
                        color: "#f0c96b",
                      }}
                    >
                      Calendrier
                      <ExternalLink size={14} />
                    </a>
                    <button
                      type="button"
                      onClick={() => setSelectedEvent(formation)}
                      className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition hover:bg-white/5"
                      style={{
                        borderColor: "rgba(255,255,255,0.22)",
                        color: "var(--color-text)",
                      }}
                    >
                      Détails
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      ) : null}

      {activeSection === "catalog" ? (
        <section
          id="panel-catalog"
          role="tabpanel"
          aria-labelledby="tab-catalog"
          className="relative overflow-hidden rounded-2xl border p-5 md:p-7"
          style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
        >
          <div
            className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-violet-600/18 blur-3xl animate-mesh"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-amber-500/12 blur-3xl animate-mesh [animation-delay:-7s]"
            aria-hidden
          />
          <BookOpen
            className="pointer-events-none absolute right-6 top-24 h-40 w-40 text-violet-500/[0.07] sm:right-10 sm:top-28"
            strokeWidth={1}
            aria-hidden
          />

          <div className="relative z-[1]">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <BookOpen size={20} className="shrink-0 text-amber-200/95" aria-hidden />
                  <h3 className="text-lg font-bold leading-snug break-words sm:text-xl" style={{ color: "var(--color-text)" }}>
                    Catalogue des anciennes formations
                  </h3>
                </div>
                <p className="max-w-2xl text-sm leading-relaxed break-words text-pretty" style={{ color: "var(--color-text-secondary)" }}>
                  Explore les thèmes déjà animés : recherche, tri, pastilles par lettre, vue grille ou liste. Un clic
                  envoie ton intérêt à l&apos;équipe pour de futurs créneaux.
                </p>
              </div>
              <div
                className="flex shrink-0 rounded-xl border p-1 shadow-inner"
                style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg)" }}
                role="group"
                aria-label="Mode d’affichage"
              >
                <button
                  type="button"
                  onClick={() => setCatalogViewMode("grid")}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-400 ${
                    catalogViewMode === "grid" ? "bg-violet-500/25 text-violet-100 ring-1 ring-violet-400/35" : "text-[color:var(--color-text-secondary)] hover:bg-white/5"
                  }`}
                >
                  <LayoutGrid className="h-4 w-4" aria-hidden />
                  Grille
                </button>
                <button
                  type="button"
                  onClick={() => setCatalogViewMode("list")}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-400 ${
                    catalogViewMode === "list" ? "bg-violet-500/25 text-violet-100 ring-1 ring-violet-400/35" : "text-[color:var(--color-text-secondary)] hover:bg-white/5"
                  }`}
                >
                  <List className="h-4 w-4" aria-hidden />
                  Liste
                </button>
              </div>
            </div>

            <div className="mb-4 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setRequestModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-violet-400/40 bg-violet-500/15 px-3 py-2 text-xs font-bold text-violet-100 transition hover:bg-violet-500/25"
              >
                <MessageSquarePlus className="h-4 w-4" aria-hidden />
                Formulaire détaillé (titre + message)
              </button>
            </div>

            <div className="mb-5 grid gap-3 lg:grid-cols-[1fr_auto_auto]">
              <div className="relative min-w-0">
                <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 opacity-60" style={{ color: "var(--color-text-secondary)" }} />
                <input
                  type="search"
                  value={catalogQuery}
                  onChange={(event) => setCatalogQuery(event.target.value)}
                  placeholder="Rechercher par titre…"
                  className="w-full rounded-xl border py-2.5 pl-10 pr-3 text-sm transition focus:border-violet-400/50 focus:outline-none"
                  style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg)", color: "var(--color-text)" }}
                  aria-label="Rechercher dans le catalogue"
                />
              </div>
              <button
                type="button"
                onClick={() => setShowInterestedOnly((prev) => !prev)}
                className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                  showInterestedOnly ? "ring-1 ring-emerald-400/40" : ""
                }`}
                style={{
                  borderColor: showInterestedOnly ? "rgba(52,211,153,0.50)" : "var(--color-border)",
                  backgroundColor: showInterestedOnly ? "rgba(52,211,153,0.12)" : "var(--color-bg)",
                  color: showInterestedOnly ? "#34d399" : "var(--color-text-secondary)",
                }}
              >
                {showInterestedOnly ? "Tout le catalogue" : "Mes demandes uniquement"}
              </button>
              <div className="flex rounded-xl border p-1" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg)" }} role="group" aria-label="Tri alphabétique">
                <button
                  type="button"
                  onClick={() => setCatalogSort("alpha")}
                  className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                    catalogSort === "alpha" ? "bg-amber-500/20 text-amber-100 ring-1 ring-amber-400/30" : "text-[color:var(--color-text-secondary)] hover:bg-white/5"
                  }`}
                >
                  A → Z
                </button>
                <button
                  type="button"
                  onClick={() => setCatalogSort("alpha-desc")}
                  className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                    catalogSort === "alpha-desc" ? "bg-amber-500/20 text-amber-100 ring-1 ring-amber-400/30" : "text-[color:var(--color-text-secondary)] hover:bg-white/5"
                  }`}
                >
                  Z → A
                </button>
              </div>
            </div>

            {!loading && filteredPastFormations.length > 0 && catalogLetterChips.length > 1 ? (
              <div className="mb-5">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--color-text-secondary)" }}>
                  Filtrer par première lettre
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setCatalogLetter(null)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-400 ${
                      catalogLetter === null ? "bg-violet-500/25 ring-1 ring-violet-400/40" : "hover:border-violet-400/35"
                    }`}
                    style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
                  >
                    Toutes ({filteredPastFormations.length})
                  </button>
                  {catalogLetterChips.map(([letter, count]) => (
                    <button
                      key={letter}
                      type="button"
                      onClick={() => setCatalogLetter((prev) => (prev === letter ? null : letter))}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold tabular-nums transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-400 ${
                        catalogLetter === letter ? "bg-violet-500/25 ring-1 ring-violet-400/40" : "hover:border-violet-400/35"
                      }`}
                      style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
                    >
                      {letter === "#" ? "# · autres" : letter} ({count})
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {loading ? (
              <CatalogSkeleton grid={catalogViewMode === "grid"} />
            ) : filteredPastFormations.length === 0 ? (
              <EmptyFeatureCard
                title="Aucun résultat"
                description="Essaie un autre mot-clé ou désactive le filtre « Mes demandes »."
              />
            ) : displayedPastCatalog.length === 0 ? (
              <EmptyFeatureCard
                title="Rien sous cette lettre"
                description="Choisis une autre pastille ou « Toutes » pour réafficher tout le catalogue filtré."
              />
            ) : (
              <>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <p style={{ color: "var(--color-text-secondary)" }}>
                    <span className="font-semibold text-violet-200/90">{displayedPastCatalog.length}</span> thème
                    {displayedPastCatalog.length > 1 ? "s" : ""}
                    {catalogLetter ? ` · lettre « ${catalogLetter === "#" ? "#" : catalogLetter} »` : ""}
                    {showInterestedOnly ? " · demandes d’intérêt" : ""}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {catalogQuery.trim() ? (
                      <button
                        type="button"
                        onClick={() => setCatalogQuery("")}
                        className="rounded-lg border px-2.5 py-1 font-semibold transition hover:bg-violet-500/10"
                        style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
                      >
                        Effacer la recherche
                      </button>
                    ) : null}
                    {catalogLetter ? (
                      <button
                        type="button"
                        onClick={() => setCatalogLetter(null)}
                        className="rounded-lg border px-2.5 py-1 font-semibold transition hover:bg-violet-500/10"
                        style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
                      >
                        Toutes les lettres
                      </button>
                    ) : null}
                  </div>
                </div>

                {catalogViewMode === "grid" ? (
                  <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {displayedPastCatalog.map((formation, index) => {
                      const isPending = pendingTitles.has(formation.title);
                      const hue = catalogHue(formation.title);
                      const initial = formation.title.trim().charAt(0).toUpperCase() || "?";
                      return (
                        <li key={formation.key} className="animate-fadeIn" style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}>
                          <article
                            className="group relative flex h-full flex-col overflow-hidden rounded-2xl border transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_50px_rgba(0,0,0,0.35)]"
                            style={{
                              borderColor: isPending ? "rgba(52,211,153,0.45)" : "rgba(139,92,246,0.28)",
                              backgroundColor: "var(--color-bg)",
                            }}
                          >
                            <div
                              className="relative px-4 pb-3 pt-5"
                              style={{
                                background: `linear-gradient(135deg, hsla(${hue}, 58%, 38%, 0.45) 0%, hsla(${(hue + 52) % 360}, 45%, 22%, 0.25) 55%, transparent 100%)`,
                              }}
                            >
                              <BookOpen className="absolute right-3 top-3 h-16 w-16 text-white/[0.08] transition group-hover:scale-105 group-hover:text-white/[0.12]" aria-hidden />
                              <div className="relative flex items-start gap-3">
                                <span
                                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 text-lg font-bold text-white shadow-lg backdrop-blur-sm"
                                  style={{
                                    borderColor: `hsla(${hue}, 70%, 72%, 0.45)`,
                                    background: `linear-gradient(145deg, hsla(${hue}, 55%, 42%, 0.85), hsla(${(hue + 30) % 360}, 50%, 28%, 0.75))`,
                                  }}
                                >
                                  {initial}
                                </span>
                                <div className="min-w-0 flex-1 pt-0.5">
                                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/70">Archive TENF</p>
                                  <h4 className="mt-1 text-sm font-bold leading-snug break-words text-pretty text-white drop-shadow-sm sm:text-base">
                                    {formation.title}
                                  </h4>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-1 flex-col gap-3 px-4 pb-4 pt-3">
                              <div className="flex flex-wrap gap-2">
                                <span
                                  className="inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold"
                                  style={{
                                    borderColor: isPending ? "rgba(52,211,153,0.45)" : "var(--color-border)",
                                    color: isPending ? "#6ee7b7" : "var(--color-text-secondary)",
                                    backgroundColor: isPending ? "rgba(52,211,153,0.12)" : "transparent",
                                  }}
                                >
                                  {isPending ? "Demande envoyée" : "Ouverte aux demandes"}
                                </span>
                                <span
                                  className="inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-medium"
                                  style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
                                >
                                  Replay / archive
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => submitInterest(formation.title, formation.sourceEventId)}
                                disabled={isPending || submittingTitle === formation.title}
                                className="mt-auto inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 py-3 text-sm font-bold transition group-hover:border-violet-400/50 disabled:cursor-not-allowed disabled:opacity-60"
                                style={{
                                  borderColor: isPending ? "rgba(52,211,153,0.5)" : "rgba(167,139,250,0.45)",
                                  color: isPending ? "#6ee7b7" : "#ddd6fe",
                                  backgroundColor: isPending ? "rgba(52,211,153,0.1)" : "rgba(139,92,246,0.12)",
                                }}
                              >
                                {submittingTitle === formation.title ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                                {isPending ? "Déjà dans ta liste" : "Ça m’intéresse"}
                                {!isPending ? <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" /> : null}
                              </button>
                            </div>
                          </article>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <ul className="space-y-3">
                    {displayedPastCatalog.map((formation, index) => {
                      const isPending = pendingTitles.has(formation.title);
                      const hue = catalogHue(formation.title);
                      return (
                        <li key={formation.key} className="animate-fadeIn" style={{ animationDelay: `${Math.min(index, 10) * 35}ms` }}>
                          <article
                            className="group relative flex flex-col gap-4 overflow-hidden rounded-2xl border p-4 transition hover:border-violet-400/35 md:flex-row md:items-center md:gap-5"
                            style={{
                              borderColor: isPending ? "rgba(52,211,153,0.4)" : "var(--color-border)",
                              backgroundColor: isPending ? "rgba(52,211,153,0.07)" : "var(--color-bg)",
                            }}
                          >
                            <div
                              className="absolute bottom-0 left-0 top-0 w-1 rounded-l-2xl opacity-90 transition group-hover:w-1.5"
                              style={{ background: `linear-gradient(180deg, hsl(${hue}, 70%, 55%), hsl(${(hue + 40) % 360}, 60%, 45%))` }}
                              aria-hidden
                            />
                            <div className="flex min-w-0 flex-1 items-start gap-3 pl-2 md:items-center">
                              <span
                                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border text-sm font-bold tabular-nums transition group-hover:scale-105"
                                style={{
                                  borderColor: `hsla(${hue}, 50%, 55%, 0.4)`,
                                  background: `linear-gradient(135deg, hsla(${hue}, 45%, 32%, 0.5), hsla(${(hue + 35) % 360}, 40%, 22%, 0.4))`,
                                  color: "#f5f3ff",
                                }}
                              >
                                #{index + 1}
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold leading-snug break-words text-pretty md:text-base" style={{ color: "var(--color-text)" }}>
                                  {formation.title}
                                </p>
                                <div className="mt-2 flex flex-wrap gap-2">
                                  <span
                                    className="inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium"
                                    style={{
                                      borderColor: isPending ? "rgba(52,211,153,0.42)" : "var(--color-border)",
                                      color: isPending ? "#34d399" : "var(--color-text-secondary)",
                                      backgroundColor: isPending ? "rgba(52,211,153,0.10)" : "transparent",
                                    }}
                                  >
                                    {isPending ? "Intérêt enregistré" : "Disponible à la demande"}
                                  </span>
                                  <span
                                    className="inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium"
                                    style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
                                  >
                                    Archive
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex shrink-0 pl-2 md:pl-0">
                              <button
                                type="button"
                                onClick={() => submitInterest(formation.title, formation.sourceEventId)}
                                disabled={isPending || submittingTitle === formation.title}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-bold transition hover:bg-violet-500/15 disabled:cursor-not-allowed disabled:opacity-65 md:w-auto md:min-w-[11rem]"
                                style={{
                                  borderColor: isPending ? "rgba(52,211,153,0.45)" : "rgba(139,92,246,0.45)",
                                  color: isPending ? "#34d399" : "#c4b5fd",
                                  backgroundColor: isPending ? "rgba(52,211,153,0.08)" : "rgba(139,92,246,0.08)",
                                }}
                              >
                                {submittingTitle === formation.title ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                                {isPending ? "Demande envoyée" : "Cette formation m’intéresse"}
                                {!isPending ? <ArrowRight className="h-3.5 w-3.5 opacity-80" /> : null}
                              </button>
                            </div>
                          </article>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </>
            )}
          </div>
        </section>
      ) : null}

      {selectedEvent ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setSelectedEvent(null)}
          role="presentation"
        >
          <div
            className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border shadow-2xl"
            style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="formation-modal-title"
          >
            {selectedEvent.image ? (
              <img
                src={selectedEvent.image}
                alt=""
                className="h-auto max-h-[280px] w-full object-contain"
                style={{ backgroundColor: "rgba(10,10,14,0.8)" }}
              />
            ) : null}
            <div className="space-y-4 border-b p-5 md:p-6" style={{ borderColor: "var(--color-border)" }}>
              <div className="flex items-start justify-between gap-3">
                <h3 id="formation-modal-title" className="text-xl font-bold leading-snug break-words text-pretty md:text-2xl" style={{ color: "var(--color-text)" }}>
                  {selectedEvent.title}
                </h3>
                <button
                  type="button"
                  onClick={() => setSelectedEvent(null)}
                  className="inline-flex shrink-0 items-center rounded-lg border p-2 transition hover:bg-white/5"
                  style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
                  aria-label="Fermer la fenêtre détail formation"
                >
                  <X size={18} />
                </button>
              </div>
              <p className="text-sm break-words" style={{ color: "var(--color-text-secondary)" }}>
                {new Date(selectedEvent.date).toLocaleString("fr-FR")} — {selectedEvent.category}
              </p>
              <div
                className="prose prose-invert max-w-none prose-p:my-2 prose-li:my-1 prose-headings:text-white prose-p:text-gray-300 prose-strong:text-white prose-em:text-gray-200 prose-a:text-[#9146ff] prose-a:hover:text-[#7c3aed] prose-ul:text-gray-300 prose-ol:text-gray-300 prose-li:text-gray-300"
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {selectedEvent.description || "Aucune description disponible pour cette formation."}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <FormationRequestModal
        open={requestModalOpen}
        onClose={() => setRequestModalOpen(false)}
        catalogSuggestions={catalogSuggestionsForModal}
        onSuccess={() => {
          void refreshPendingFormationRequests();
          setFeedback("Demande enregistrée. L’équipe la verra dans l’admin « Demandes de formation ».");
        }}
      />
    </MemberSurface>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BookOpen, CalendarDays, Search, Sparkles, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import MemberSurface from "@/components/member/ui/MemberSurface";
import MemberPageHeader from "@/components/member/ui/MemberPageHeader";
import EmptyFeatureCard from "@/components/member/ui/EmptyFeatureCard";

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

export default function MemberFormationCatalogPage() {
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

  useEffect(() => {
    (async () => {
      try {
        const [eventsResponse, requestsResponse] = await Promise.all([
          fetch("/api/events", { cache: "no-store" }),
          fetch("/api/members/me/formation-requests", { cache: "no-store" }),
        ]);

        const eventsBody = await eventsResponse.json();
        const requestsBody = requestsResponse.ok ? await requestsResponse.json() : { pendingTitles: [] };

        const rows = (eventsBody.events || []).filter((event: EventItem) => (event.category || "").toLowerCase().includes("formation"));
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
    const map = new Map<string, string>();
    for (const formation of sortedFormations) {
      if (new Date(formation.date).getTime() >= nowTs) continue;
      const key = formation.title.trim().toLowerCase();
      if (!key || map.has(key)) continue;
      map.set(key, formation.title);
    }
    return Array.from(map.entries()).map(([key, title]) => ({ key, title }));
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

  async function submitInterest(formationTitle: string, sourceEventId?: string) {
    setFeedback("");
    setSubmittingTitle(formationTitle);
    try {
      const response = await fetch("/api/members/me/formation-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formationTitle,
          sourceEventId: sourceEventId || null,
        }),
      });
      const body = await response.json();
      if (!response.ok) {
        setFeedback(body.error || "Impossible d enregistrer ta demande.");
        return;
      }
      setPendingTitles((previous) => new Set([...Array.from(previous), formationTitle]));
      setFeedback(body.created ? "Demande enregistree. Merci, on remonte ca a l equipe formation." : "Demande deja enregistree pour cette formation.");
    } catch {
      setFeedback("Erreur reseau. Reessaie dans quelques instants.");
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
            ? body.message || "Desinscription enregistree."
            : response.status === 409
              ? "Tu es deja inscrit a cette formation."
              : body.message || "Inscription enregistree."
        );
        return;
      }
      setFeedback(body.error || "Impossible de mettre a jour ton inscription.");
    } catch {
      setFeedback("Erreur reseau. Reessaie dans quelques instants.");
    } finally {
      setRegisteringEventId("");
    }
  }

  function calendarUrlForEvent(event: EventItem): string {
    const start = new Date(event.date);
    if (Number.isNaN(start.getTime())) return "/member/formations";
    const end = new Date(start.getTime() + 90 * 60 * 1000);
    const formatUtc = (value: Date) => value.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
    const details = `${event.description || "Formation TENF"}\n\n${window.location.origin}/member/formations`;
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
      <MemberPageHeader
        title="Catalogue des formations"
        description="Mise en avant des prochaines sessions, puis catalogue des formations deja passees."
        badge="Academy TENF"
      />

      {feedback ? (
        <section className="rounded-xl border px-4 py-3 text-sm" style={{ borderColor: "rgba(139,92,246,0.35)", backgroundColor: "rgba(139,92,246,0.08)", color: "var(--color-text)" }}>
          {feedback}
        </section>
      ) : null}

      <section
        className="rounded-2xl border p-5 md:p-6"
        style={{
          borderColor: twitchLinkState.loading
            ? "rgba(145,70,255,0.30)"
            : twitchLinkState.connected
              ? "rgba(52,211,153,0.40)"
              : "rgba(248,113,113,0.40)",
          background:
            twitchLinkState.loading
              ? "radial-gradient(circle at 8% 0%, rgba(145,70,255,0.16), transparent 38%), radial-gradient(circle at 90% 0%, rgba(240,201,107,0.12), transparent 30%), linear-gradient(180deg, rgba(17,24,39,0.32), rgba(17,24,39,0.08))"
              : twitchLinkState.connected
                ? "radial-gradient(circle at 8% 0%, rgba(52,211,153,0.18), transparent 38%), radial-gradient(circle at 90% 0%, rgba(16,185,129,0.10), transparent 30%), linear-gradient(180deg, rgba(17,24,39,0.32), rgba(17,24,39,0.08))"
                : "radial-gradient(circle at 8% 0%, rgba(248,113,113,0.18), transparent 38%), radial-gradient(circle at 90% 0%, rgba(239,68,68,0.10), transparent 30%), linear-gradient(180deg, rgba(17,24,39,0.32), rgba(17,24,39,0.08))",
        }}
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.12em]" style={{ color: "var(--color-text-secondary)" }}>
              Parcours formations
            </p>
            <h2 className="mt-1 text-xl font-semibold" style={{ color: "var(--color-text)" }}>
              Trouve la bonne session et suis tes demandes
            </h2>
            <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
              Tout est centralisé: prochaines sessions, anciens contenus et demandes d intérêt.
            </p>
            <div className="mt-2">
              <span
                className="inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold"
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
                {twitchLinkState.loading
                  ? "Verification Twitch..."
                  : twitchLinkState.connected
                    ? "Twitch lie"
                    : "Twitch non lie"}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg border px-3 py-2" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
              <p className="text-[11px]" style={{ color: "var(--color-text-secondary)" }}>A venir</p>
              <p className="text-lg font-bold" style={{ color: "var(--color-text)" }}>{upcomingFormations.length}</p>
            </div>
            <div className="rounded-lg border px-3 py-2" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
              <p className="text-[11px]" style={{ color: "var(--color-text-secondary)" }}>Catalogue</p>
              <p className="text-lg font-bold" style={{ color: "var(--color-text)" }}>{pastFormationsUnique.length}</p>
            </div>
            <div className="rounded-lg border px-3 py-2" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
              <p className="text-[11px]" style={{ color: "var(--color-text-secondary)" }}>Interets</p>
              <p className="text-lg font-bold" style={{ color: "var(--color-text)" }}>{interestedCount}</p>
            </div>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveSection("upcoming")}
            className="rounded-lg border px-3 py-2 text-sm font-semibold"
            style={{
              borderColor: activeSection === "upcoming" ? "rgba(145,70,255,0.60)" : "var(--color-border)",
              backgroundColor: activeSection === "upcoming" ? "rgba(145,70,255,0.18)" : "var(--color-surface)",
              color: activeSection === "upcoming" ? "var(--color-text)" : "var(--color-text-secondary)",
            }}
          >
            Prochaines sessions
          </button>
          <button
            type="button"
            onClick={() => setActiveSection("catalog")}
            className="rounded-lg border px-3 py-2 text-sm font-semibold"
            style={{
              borderColor: activeSection === "catalog" ? "rgba(145,70,255,0.60)" : "var(--color-border)",
              backgroundColor: activeSection === "catalog" ? "rgba(145,70,255,0.18)" : "var(--color-surface)",
              color: activeSection === "catalog" ? "var(--color-text)" : "var(--color-text-secondary)",
            }}
          >
            Anciennes formations
          </button>
        </div>
      </section>

      {activeSection === "upcoming" ? (
      <section
        className="rounded-2xl border p-5 md:p-6"
        style={{
          borderColor: "rgba(212, 175, 55, 0.35)",
          background: "radial-gradient(circle at 12% 18%, rgba(212,175,55,0.16), rgba(25,25,31,0.96) 42%)",
          boxShadow: "0 18px 36px rgba(0,0,0,0.24)",
        }}
      >
        <div className="mb-4 flex items-center gap-2">
          <Sparkles size={16} style={{ color: "#f0c96b" }} />
          <p className="text-xs uppercase tracking-[0.16em]" style={{ color: "rgba(240, 201, 107, 0.88)" }}>
            Prochaines formations
          </p>
        </div>

        {loading ? (
          <p style={{ color: "var(--color-text-secondary)" }}>Chargement des prochaines sessions...</p>
        ) : upcomingFormations.length === 0 ? (
          <p style={{ color: "var(--color-text-secondary)" }}>Aucune formation planifiee prochainement.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {upcomingFormations.slice(0, 6).map((formation) => (
              <article
                key={formation.id}
                className="rounded-xl border p-4"
                style={{ borderColor: "rgba(255,255,255,0.12)", backgroundColor: "rgba(12,12,15,0.45)" }}
              >
                <p className="text-base font-semibold" style={{ color: "var(--color-text)" }}>
                  {formation.title}
                </p>
                <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                  <CalendarDays size={14} className="mr-1 inline-block" />
                  {new Date(formation.date).toLocaleString("fr-FR")}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => toggleRegistration(formation.id)}
                    disabled={registeringEventId === formation.id}
                    className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-70"
                    style={{
                      borderColor: registeredEventIds.has(formation.id) ? "rgba(248,113,113,0.45)" : "rgba(139,92,246,0.45)",
                      color: registeredEventIds.has(formation.id) ? "#f87171" : "#c4b5fd",
                    }}
                  >
                    {registeredEventIds.has(formation.id) ? "Se desinscrire" : "S'inscrire"}
                    <ArrowRight size={14} />
                  </button>
                  <a
                    href={calendarUrlForEvent(formation)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold"
                    style={{
                      borderColor: "rgba(240,201,107,0.45)",
                      color: "#f0c96b",
                    }}
                  >
                    Ajouter au calendrier
                  </a>
                  <button
                    type="button"
                    onClick={() => setSelectedEvent(formation)}
                    className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold"
                    style={{
                      borderColor: "rgba(255,255,255,0.25)",
                      color: "var(--color-text)",
                    }}
                  >
                    Voir details
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
      ) : null}

      {activeSection === "catalog" ? (
      <section className="rounded-xl border p-5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
        <div className="mb-4 flex items-center gap-2">
          <BookOpen size={16} style={{ color: "#f0c96b" }} />
          <h3 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>
            Catalogue des anciennes formations
          </h3>
        </div>
        <div className="mb-4 grid gap-2 md:grid-cols-[1fr_auto]">
          <div className="relative">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--color-text-secondary)" }} />
            <input
              type="text"
              value={catalogQuery}
              onChange={(event) => setCatalogQuery(event.target.value)}
              placeholder="Rechercher une formation dans le catalogue..."
              className="w-full rounded-lg border py-2 pl-9 pr-3 text-sm"
              style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}
            />
          </div>
          <button
            type="button"
            onClick={() => setShowInterestedOnly((prev) => !prev)}
            className="rounded-lg border px-3 py-2 text-sm font-semibold"
            style={{
              borderColor: showInterestedOnly ? "rgba(52,211,153,0.50)" : "var(--color-border)",
              backgroundColor: showInterestedOnly ? "rgba(52,211,153,0.12)" : "var(--color-surface)",
              color: showInterestedOnly ? "#34d399" : "var(--color-text-secondary)",
            }}
          >
            Mes demandes uniquement
          </button>
        </div>

        {loading ? (
          <p style={{ color: "var(--color-text-secondary)" }}>Chargement du catalogue...</p>
        ) : filteredPastFormations.length === 0 ? (
          <EmptyFeatureCard title="Catalogue vide" description="Aucune ancienne formation detectee pour le moment." />
        ) : (
          <>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs">
              <p style={{ color: "var(--color-text-secondary)" }}>
                {filteredPastFormations.length} formation{filteredPastFormations.length > 1 ? "s" : ""} trouvee
                {showInterestedOnly ? " (interets uniquement)" : ""}.
              </p>
              {catalogQuery.trim() ? (
                <button
                  type="button"
                  onClick={() => setCatalogQuery("")}
                  className="rounded-md border px-2.5 py-1 font-semibold"
                  style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
                >
                  Effacer la recherche
                </button>
              ) : null}
            </div>

            <div className="space-y-2.5">
              {filteredPastFormations.map((formation, index) => {
                const isPending = pendingTitles.has(formation.title);
                return (
                  <article
                    key={formation.key}
                    className="grid gap-3 rounded-xl border p-3 md:grid-cols-[1fr_auto]"
                    style={{
                      borderColor: isPending ? "rgba(52,211,153,0.38)" : "var(--color-border)",
                      backgroundColor: isPending ? "rgba(52,211,153,0.06)" : "var(--color-surface)",
                    }}
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className="inline-flex rounded-md border px-1.5 py-0.5 text-[11px] font-semibold"
                          style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
                        >
                          #{index + 1}
                        </span>
                        <p className="truncate text-sm font-medium" style={{ color: "var(--color-text)" }}>
                          {formation.title}
                        </p>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px]">
                        <span
                          className="inline-flex rounded-full border px-2 py-0.5"
                          style={{
                            borderColor: isPending ? "rgba(52,211,153,0.42)" : "var(--color-border)",
                            color: isPending ? "#34d399" : "var(--color-text-secondary)",
                            backgroundColor: isPending ? "rgba(52,211,153,0.10)" : "transparent",
                          }}
                        >
                          {isPending ? "Interet deja envoye" : "Disponible a la demande"}
                        </span>
                        <span className="inline-flex rounded-full border px-2 py-0.5" style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}>
                          Ancienne session
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center md:justify-end">
                      <button
                        type="button"
                        onClick={() => submitInterest(formation.title)}
                        disabled={isPending || submittingTitle === formation.title}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-70 md:w-auto"
                        style={{
                          borderColor: isPending ? "rgba(52,211,153,0.45)" : "rgba(139,92,246,0.45)",
                          color: isPending ? "#34d399" : "#c4b5fd",
                          backgroundColor: isPending ? "rgba(52,211,153,0.08)" : "transparent",
                        }}
                      >
                        {isPending ? "Demande envoyee" : "Cette formation m interesse"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </section>
      ) : null}

      {selectedEvent ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setSelectedEvent(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl border"
            style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
            onClick={(event) => event.stopPropagation()}
          >
            {selectedEvent.image ? (
              <img
                src={selectedEvent.image}
                alt={selectedEvent.title}
                className="h-auto max-h-[280px] w-full object-contain"
                style={{ backgroundColor: "rgba(10,10,14,0.8)" }}
              />
            ) : null}
            <div className="space-y-4 p-5 md:p-6">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-2xl font-semibold" style={{ color: "var(--color-text)" }}>
                  {selectedEvent.title}
                </h3>
                <button
                  type="button"
                  onClick={() => setSelectedEvent(null)}
                  className="inline-flex items-center rounded-md border p-2"
                  style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
                >
                  <X size={16} />
                </button>
              </div>
              <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                {new Date(selectedEvent.date).toLocaleString("fr-FR")} - {selectedEvent.category}
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
    </MemberSurface>
  );
}

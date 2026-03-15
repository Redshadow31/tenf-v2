"use client";

import { useEffect, useMemo, useState } from "react";
import MemberSurface from "@/components/member/ui/MemberSurface";
import MemberPageHeader from "@/components/member/ui/MemberPageHeader";
import EmptyFeatureCard from "@/components/member/ui/EmptyFeatureCard";

type CommunityEvent = {
  id: string;
  title: string;
  category: string;
  date: string;
};

function categoryBadge(category: string): { bg: string; color: string; border: string } {
  const key = category.toLowerCase();
  if (key.includes("formation")) {
    return { bg: "rgba(56, 189, 248, 0.15)", color: "#7dd3fc", border: "rgba(56, 189, 248, 0.35)" };
  }
  if (key.includes("film")) {
    return { bg: "rgba(244, 114, 182, 0.15)", color: "#f9a8d4", border: "rgba(244, 114, 182, 0.35)" };
  }
  if (key.includes("jeux") || key.includes("gaming")) {
    return { bg: "rgba(167, 139, 250, 0.15)", color: "#c4b5fd", border: "rgba(167, 139, 250, 0.35)" };
  }
  if (key.includes("apero")) {
    return { bg: "rgba(250, 204, 21, 0.15)", color: "#fde68a", border: "rgba(250, 204, 21, 0.35)" };
  }
  return { bg: "rgba(148, 163, 184, 0.15)", color: "#cbd5e1", border: "rgba(148, 163, 184, 0.35)" };
}

export default function MemberEventRegistrationsPage() {
  const [registeredEventIds, setRegisteredEventIds] = useState<Set<string>>(new Set());
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
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
          throw new Error("Impossible de charger les evenements.");
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
    })();
  }, []);

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

  return (
    <MemberSurface>
      <MemberPageHeader
        title="Mes inscriptions"
        description="Retrouve tous les evenements auxquels tu es inscrit."
      />

      <section className="rounded-xl border p-5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
        {loading ? (
          <p style={{ color: "var(--color-text-secondary)" }}>Chargement des inscriptions...</p>
        ) : error ? (
          <EmptyFeatureCard title="Mes inscriptions" description={error} />
        ) : registeredEvents.length === 0 ? (
          <EmptyFeatureCard title="Mes inscriptions" description="Tu n'es inscrit a aucun evenement pour le moment." />
        ) : (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
              <span>{registeredEvents.length} inscription(s)</span>
              <span>-</span>
              <span>{upcoming.length} a venir</span>
              <span>-</span>
              <span>{past.length} terminee(s)</span>
            </div>

            {upcoming.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>
                  A venir
                </h3>
                {upcoming.map((event) => {
                  const categoryStyles = categoryBadge(event.category);
                  return (
                    <div key={event.id} className="rounded-lg border px-3 py-3" style={{ borderColor: "var(--color-border)" }}>
                      <p className="font-semibold" style={{ color: "var(--color-text)" }}>
                        {event.title}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                        <span
                          className="rounded-full border px-3 py-1 font-semibold"
                          style={{
                            backgroundColor: "rgba(145, 70, 255, 0.2)",
                            color: "#d8b4fe",
                            borderColor: "rgba(145, 70, 255, 0.35)",
                          }}
                        >
                          {new Date(event.date).toLocaleString("fr-FR")}
                        </span>
                        <span
                          className="rounded-full border px-3 py-1 font-semibold"
                          style={{
                            backgroundColor: categoryStyles.bg,
                            color: categoryStyles.color,
                            borderColor: categoryStyles.border,
                          }}
                        >
                          {event.category}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {past.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>
                  Termines
                </h3>
                {past.map((event) => (
                  <div key={`past-${event.id}`} className="rounded-lg border px-3 py-3 text-sm" style={{ borderColor: "var(--color-border)" }}>
                    <p style={{ color: "var(--color-text)" }}>{event.title}</p>
                    <p style={{ color: "var(--color-text-secondary)" }}>
                      {new Date(event.date).toLocaleString("fr-FR")} - {event.category}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>
    </MemberSurface>
  );
}

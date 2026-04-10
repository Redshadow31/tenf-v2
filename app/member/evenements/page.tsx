"use client";

import { useEffect, useState } from "react";
import MemberSurface from "@/components/member/ui/MemberSurface";
import MemberPageHeader from "@/components/member/ui/MemberPageHeader";
import EmptyFeatureCard from "@/components/member/ui/EmptyFeatureCard";
import { buildEventLocationDisplay, type EventLocationLink } from "@/lib/eventLocation";

type CommunityEvent = {
  id: string;
  title: string;
  category: string;
  date: string;
  location?: string;
  image?: string;
};

export default function MemberEventsPlanningPage() {
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [locationLinks, setLocationLinks] = useState<EventLocationLink[]>([]);
  const [loading, setLoading] = useState(true);

  function getCategoryBadgeStyles(category: string): { bg: string; text: string; border: string } {
    const normalized = category.toLowerCase();
    if (normalized.includes("formation")) {
      return { bg: "rgba(56, 189, 248, 0.15)", text: "#7dd3fc", border: "rgba(56, 189, 248, 0.35)" };
    }
    if (normalized.includes("film")) {
      return { bg: "rgba(244, 114, 182, 0.15)", text: "#f9a8d4", border: "rgba(244, 114, 182, 0.35)" };
    }
    if (normalized.includes("jeux") || normalized.includes("gaming")) {
      return { bg: "rgba(167, 139, 250, 0.15)", text: "#c4b5fd", border: "rgba(167, 139, 250, 0.35)" };
    }
    if (normalized.includes("apero")) {
      return { bg: "rgba(250, 204, 21, 0.15)", text: "#fde68a", border: "rgba(250, 204, 21, 0.35)" };
    }
    return { bg: "rgba(148, 163, 184, 0.15)", text: "#cbd5e1", border: "rgba(148, 163, 184, 0.35)" };
  }

  useEffect(() => {
    (async () => {
      try {
        const [eventsResponse, linksResponse] = await Promise.all([
          fetch("/api/events", { cache: "no-store" }),
          fetch("/api/events/location-links", { cache: "no-store" }),
        ]);
        const [eventsBody, linksBody] = await Promise.all([eventsResponse.json(), linksResponse.json()]);

        const threeHoursAgo = Date.now() - 3 * 60 * 60 * 1000;
        const upcomingEvents = (eventsBody.events || [])
          .filter((event: CommunityEvent) => new Date(event.date).getTime() >= threeHoursAgo)
          .sort((a: CommunityEvent, b: CommunityEvent) => {
            return new Date(a.date).getTime() - new Date(b.date).getTime();
          })
          .slice(0, 30);
        setEvents(upcomingEvents);
        setLocationLinks((linksBody.links || []) as EventLocationLink[]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <MemberSurface>
      <MemberPageHeader
        title="Planning des événements"
        description="Retrouve les prochains événements communautaires TENF."
      />
      <section className="rounded-xl border p-5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
        {loading ? (
          <p style={{ color: "var(--color-text-secondary)" }}>Chargement du planning...</p>
        ) : events.length === 0 ? (
          <EmptyFeatureCard
            title="Planning des événements"
            description="Aucun événement à venir pour le moment."
          />
        ) : (
          <div className="space-y-2">
            {events.map((event) => {
              const categoryStyles = getCategoryBadgeStyles(event.category);
              const locationDisplay = buildEventLocationDisplay(event.location, locationLinks);
              const dateText = new Date(event.date).toLocaleDateString("fr-FR", {
                weekday: "long",
                day: "2-digit",
                month: "long",
                year: "numeric",
              });
              const hourText = new Date(event.date).toLocaleTimeString("fr-FR", {
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div
                  key={event.id}
                  className="overflow-hidden rounded-lg border p-3 md:p-4"
                  style={{ borderColor: "var(--color-border)" }}
                >
                  {event.image ? (
                    <div className="mx-auto mb-3 w-full max-w-[800px] overflow-hidden rounded-lg border" style={{ borderColor: "var(--color-border)" }}>
                      <img
                        src={event.image}
                        alt={`Banniere ${event.title}`}
                        className="h-[200px] w-full object-cover"
                      />
                    </div>
                  ) : null}

                  <div className="space-y-2">
                    <h3 className="text-2xl font-extrabold md:text-3xl" style={{ color: "var(--color-text)" }}>
                      {event.title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="rounded-full border px-3 py-1 text-sm font-semibold"
                        style={{
                          backgroundColor: "rgba(145, 70, 255, 0.2)",
                          color: "#d8b4fe",
                          borderColor: "rgba(145, 70, 255, 0.35)",
                        }}
                      >
                        {dateText} a {hourText}
                      </span>
                      <span
                        className="rounded-full border px-3 py-1 text-sm font-semibold"
                        style={{
                          backgroundColor: categoryStyles.bg,
                          color: categoryStyles.text,
                          borderColor: categoryStyles.border,
                        }}
                      >
                        {event.category}
                      </span>
                    </div>

                    {locationDisplay ? (
                      <a
                        href={locationDisplay.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm underline decoration-dotted transition-opacity hover:opacity-85"
                        style={{ color: "var(--color-text-secondary)" }}
                        title={locationDisplay.url}
                      >
                        <span>Salon :</span>
                        <span style={{ color: "var(--color-text)" }}>{locationDisplay.label}</span>
                      </a>
                    ) : event.location ? (
                      <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                        Adresse : {event.location}
                      </p>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </MemberSurface>
  );
}

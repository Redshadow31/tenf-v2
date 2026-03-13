"use client";

import { useEffect, useState } from "react";
import MemberSurface from "@/components/member/ui/MemberSurface";
import MemberPageHeader from "@/components/member/ui/MemberPageHeader";
import EmptyFeatureCard from "@/components/member/ui/EmptyFeatureCard";

type CommunityEvent = {
  id: string;
  title: string;
  category: string;
  date: string;
  location?: string;
};

export default function MemberEventsPlanningPage() {
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch("/api/events", { cache: "no-store" });
        const body = await response.json();
        setEvents((body.events || []).slice(0, 30));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <MemberSurface>
      <MemberPageHeader
        title="Planning des evenements"
        description="Retrouve les prochains evenements communautaires TENF."
      />
      <section className="rounded-xl border p-5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
        {loading ? (
          <p style={{ color: "var(--color-text-secondary)" }}>Chargement du planning...</p>
        ) : events.length === 0 ? (
          <EmptyFeatureCard title="Planning des evenements" description="Aucun evenement publie pour le moment." />
        ) : (
          <div className="space-y-2">
            {events.map((event) => (
              <div key={event.id} className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "var(--color-border)" }}>
                <p style={{ color: "var(--color-text)" }}>{event.title}</p>
                <p style={{ color: "var(--color-text-secondary)" }}>
                  {new Date(event.date).toLocaleString("fr-FR")} - {event.category}
                  {event.location ? ` - ${event.location}` : ""}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </MemberSurface>
  );
}

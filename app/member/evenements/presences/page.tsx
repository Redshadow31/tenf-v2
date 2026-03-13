"use client";

import MemberSurface from "@/components/member/ui/MemberSurface";
import MemberPageHeader from "@/components/member/ui/MemberPageHeader";
import EmptyFeatureCard from "@/components/member/ui/EmptyFeatureCard";
import { useMemberOverview } from "@/components/member/hooks/useMemberOverview";

export default function MemberEventPresencesPage() {
  const { data, loading, error } = useMemberOverview();

  if (loading) return <p style={{ color: "var(--color-text-secondary)" }}>Chargement des presences...</p>;
  if (error || !data) return <EmptyFeatureCard title="Mes presences" description={error || "Donnees indisponibles."} />;

  return (
    <MemberSurface>
      <MemberPageHeader title="Mes presences" description="Historique des evenements valides comme presents." />
      <section className="rounded-xl border p-5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
        {data.eventPresenceHistory.length === 0 ? (
          <p style={{ color: "var(--color-text-secondary)" }}>Aucune presence validee pour le moment.</p>
        ) : (
          <div className="space-y-2">
            {data.eventPresenceHistory.map((event) => (
              <div key={`${event.id}-${event.date}`} className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "var(--color-border)" }}>
                <p style={{ color: "var(--color-text)" }}>{event.title}</p>
                <p style={{ color: "var(--color-text-secondary)" }}>
                  {new Date(event.date).toLocaleString("fr-FR")} - {event.category}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </MemberSurface>
  );
}

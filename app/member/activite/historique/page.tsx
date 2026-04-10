"use client";

import MemberSurface from "@/components/member/ui/MemberSurface";
import MemberPageHeader from "@/components/member/ui/MemberPageHeader";
import EmptyFeatureCard from "@/components/member/ui/EmptyFeatureCard";
import { useMemberOverview } from "@/components/member/hooks/useMemberOverview";

export default function MemberActivityHistoryPage() {
  const { data, loading, error } = useMemberOverview();
  if (loading) return <p style={{ color: "var(--color-text-secondary)" }}>Chargement de l'historique...</p>;
  if (error || !data) return <EmptyFeatureCard title="Historique d'activité" description={error || "Données indisponibles."} />;

  return (
    <MemberSurface>
      <MemberPageHeader title="Historique d'activité" description="Historique simple de tes présences en événement." />
      <section className="rounded-xl border p-5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
        {data.eventPresenceHistory.length === 0 ? (
          <p style={{ color: "var(--color-text-secondary)" }}>Aucune activité enregistrée pour le moment.</p>
        ) : (
          <div className="space-y-2">
            {data.eventPresenceHistory.map((item) => (
              <div key={`${item.id}-${item.date}`} className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "var(--color-border)" }}>
                <p style={{ color: "var(--color-text)" }}>{item.title}</p>
                <p style={{ color: "var(--color-text-secondary)" }}>{new Date(item.date).toLocaleString("fr-FR")}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </MemberSurface>
  );
}

"use client";

import MemberSurface from "@/components/member/ui/MemberSurface";
import MemberPageHeader from "@/components/member/ui/MemberPageHeader";
import EmptyFeatureCard from "@/components/member/ui/EmptyFeatureCard";
import { useMemberOverview } from "@/components/member/hooks/useMemberOverview";

export default function MemberFormationHistoryPage() {
  const { data, loading, error } = useMemberOverview();
  if (loading) return <p style={{ color: "var(--color-text-secondary)" }}>Chargement...</p>;
  if (error || !data) return <EmptyFeatureCard title="Historique des formations" description={error || "Donnees indisponibles"} />;

  return (
    <MemberSurface>
      <MemberPageHeader title="Historique des formations" description="Historique de tes formations validees." />
      <section className="rounded-xl border p-5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
        {data.formationHistory.length === 0 ? (
          <p style={{ color: "var(--color-text-secondary)" }}>Aucune formation dans ton historique pour le moment.</p>
        ) : (
          <div className="space-y-2">
            {data.formationHistory.map((formation) => (
              <div key={`${formation.id}-${formation.date}`} className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "var(--color-border)" }}>
                <p style={{ color: "var(--color-text)" }}>{formation.title}</p>
                <p style={{ color: "var(--color-text-secondary)" }}>{new Date(formation.date).toLocaleString("fr-FR")}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </MemberSurface>
  );
}

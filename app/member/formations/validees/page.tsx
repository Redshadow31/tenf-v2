"use client";

import MemberSurface from "@/components/member/ui/MemberSurface";
import MemberPageHeader from "@/components/member/ui/MemberPageHeader";
import StatCard from "@/components/member/ui/StatCard";
import { useMemberOverview } from "@/components/member/hooks/useMemberOverview";

export default function MemberValidatedFormationsPage() {
  const { data, loading } = useMemberOverview();
  if (loading || !data) return <p style={{ color: "var(--color-text-secondary)" }}>Chargement des formations...</p>;

  const validated = data.formationHistory;

  return (
    <MemberSurface>
      <MemberPageHeader title="Mes formations validees" description="Formations validees depuis tes presences evenements type formation." />
      <section className="grid gap-4 md:grid-cols-3">
        <StatCard title="Total validees" value={data.stats.formationsValidated} />
      </section>
      <section className="rounded-xl border p-5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
        {validated.length === 0 ? (
          <p style={{ color: "var(--color-text-secondary)" }}>Aucune formation validee actuellement.</p>
        ) : (
          <div className="space-y-2">
            {validated.map((item) => (
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

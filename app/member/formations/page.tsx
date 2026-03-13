"use client";

import { useEffect, useState } from "react";
import MemberSurface from "@/components/member/ui/MemberSurface";
import MemberPageHeader from "@/components/member/ui/MemberPageHeader";

type EventItem = {
  id: string;
  title: string;
  date: string;
  category: string;
};

export default function MemberFormationCatalogPage() {
  const [formations, setFormations] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch("/api/events", { cache: "no-store" });
        const body = await response.json();
        const rows = (body.events || []).filter((event: EventItem) =>
          (event.category || "").toLowerCase().includes("formation")
        );
        setFormations(rows);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <MemberSurface>
      <MemberPageHeader title="Catalogue des formations" description="Evenements de type formation disponibles ou passes." />
      <section className="rounded-xl border p-5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
        {loading ? (
          <p style={{ color: "var(--color-text-secondary)" }}>Chargement du catalogue...</p>
        ) : formations.length === 0 ? (
          <p style={{ color: "var(--color-text-secondary)" }}>Aucune formation detectee pour le moment.</p>
        ) : (
          <div className="space-y-2">
            {formations.map((formation) => (
              <div key={formation.id} className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "var(--color-border)" }}>
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

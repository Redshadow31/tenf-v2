"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BookOpen, CalendarDays, Sparkles } from "lucide-react";
import MemberSurface from "@/components/member/ui/MemberSurface";
import MemberPageHeader from "@/components/member/ui/MemberPageHeader";
import EmptyFeatureCard from "@/components/member/ui/EmptyFeatureCard";

type EventItem = {
  id: string;
  title: string;
  date: string;
  category: string;
};

export default function MemberFormationCatalogPage() {
  const [formations, setFormations] = useState<EventItem[]>([]);
  const [pendingTitles, setPendingTitles] = useState<Set<string>>(new Set());
  const [submittingTitle, setSubmittingTitle] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<string>("");

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
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => submitInterest(formation.title, formation.id)}
                    disabled={pendingTitles.has(formation.title) || submittingTitle === formation.title}
                    className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-70"
                    style={{
                      borderColor: pendingTitles.has(formation.title) ? "rgba(52,211,153,0.45)" : "rgba(139,92,246,0.45)",
                      color: pendingTitles.has(formation.title) ? "#34d399" : "#c4b5fd",
                    }}
                  >
                    {pendingTitles.has(formation.title) ? "Demande envoyee" : "Cette formation m interesse"}
                    <ArrowRight size={14} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-xl border p-5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
        <div className="mb-4 flex items-center gap-2">
          <BookOpen size={16} style={{ color: "#f0c96b" }} />
          <h3 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>
            Catalogue des anciennes formations
          </h3>
        </div>

        {loading ? (
          <p style={{ color: "var(--color-text-secondary)" }}>Chargement du catalogue...</p>
        ) : pastFormationsUnique.length === 0 ? (
          <EmptyFeatureCard title="Catalogue vide" description="Aucune ancienne formation detectee pour le moment." />
        ) : (
          <div className="space-y-2">
            {pastFormationsUnique.map((formation) => (
              <div
                key={formation.key}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border px-3 py-3"
                style={{ borderColor: "var(--color-border)" }}
              >
                <p style={{ color: "var(--color-text)" }}>{formation.title}</p>
                <button
                  type="button"
                  onClick={() => submitInterest(formation.title)}
                  disabled={pendingTitles.has(formation.title) || submittingTitle === formation.title}
                  className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-70"
                  style={{
                    borderColor: pendingTitles.has(formation.title) ? "rgba(52,211,153,0.45)" : "rgba(139,92,246,0.45)",
                    color: pendingTitles.has(formation.title) ? "#34d399" : "#c4b5fd",
                  }}
                >
                  {pendingTitles.has(formation.title) ? "Demande envoyee" : "Cette formation m interesse"}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </MemberSurface>
  );
}

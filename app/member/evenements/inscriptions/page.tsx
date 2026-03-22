"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, Compass, Heart, Sparkles, Ticket, Users } from "lucide-react";
import MemberSurface from "@/components/member/ui/MemberSurface";
import MemberPageHeader from "@/components/member/ui/MemberPageHeader";
import EmptyFeatureCard from "@/components/member/ui/EmptyFeatureCard";

type CommunityEvent = {
  id: string;
  title: string;
  category: string;
  date: string;
};

const TENF_EVENT_VALUES = [
  {
    title: "Respect et ecoute",
    description: "Chaque evenement est un espace ou chacun peut s exprimer et etre entendu.",
    icon: Heart,
  },
  {
    title: "Ouverture communautaire",
    description: "On favorise la rencontre entre profils differents pour enrichir la dynamique TENF.",
    icon: Users,
  },
  {
    title: "Progression collective",
    description: "Les evenements servent a apprendre ensemble, partager, et faire monter tout le monde.",
    icon: Compass,
  },
];

const EVENT_PARTICIPATION_GUIDELINES = [
  "Venir avec une posture positive, curieuse et respectueuse des autres membres.",
  "Participer au rythme de chacun: contribuer sans pression ni jugement.",
  "Encourager les nouveaux participants pour renforcer le sentiment d appartenance.",
  "Valoriser les apprentissages partages, meme les plus simples.",
];

const EVENT_COMMUNITY_GUIDELINES = [
  "Favoriser des echanges clairs et bienveillants dans le chat et en vocal.",
  "Respecter les timings et les consignes pour fluidifier l experience de groupe.",
  "Mettre en avant l entraide plutot que la performance individuelle.",
  "Faire de chaque evenement un moment utile, inclusif et motivant.",
];

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

function formatEventDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("fr-FR");
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
        title="Mon parcours evenements"
        description="Retrouve tes inscriptions TENF et vis chaque evenement avec une dynamique bienveillante."
      />

      <section
        className="rounded-2xl border p-5 md:p-6"
        style={{
          borderColor: "rgba(212, 175, 55, 0.35)",
          background: "radial-gradient(circle at 12% 18%, rgba(212,175,55,0.16), rgba(22,23,30,0.96) 42%)",
          boxShadow: "0 18px 36px rgba(0,0,0,0.24)",
        }}
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.16em]" style={{ color: "rgba(240, 201, 107, 0.88)" }}>
              Evenements TENF
            </p>
            <h2 className="mt-2 text-2xl font-semibold" style={{ color: "var(--color-text)" }}>
              Tes inscriptions, ton impact communautaire
            </h2>
            <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
              Suis tes evenements a venir, revis les temps forts passes, et incarne les valeurs TENF a chaque session.
            </p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Inscriptions totales" value={registeredEvents.length} icon={<Ticket size={15} />} />
        <StatCard label="Evenements a venir" value={upcoming.length} icon={<CalendarDays size={15} />} />
        <StatCard label="Evenements termines" value={past.length} icon={<CheckCircle2 size={15} />} />
        <StatCard label="Engagement TENF" value={registeredEvents.length > 0 ? 100 : 0} suffix="%" icon={<Sparkles size={15} />} />
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {TENF_EVENT_VALUES.map((item) => {
          const Icon = item.icon;
          return (
            <article
              key={item.title}
              className="rounded-xl border p-4"
              style={{
                borderColor: "rgba(167,139,250,0.28)",
                background: "linear-gradient(160deg, rgba(31,41,55,0.65), rgba(22,24,34,0.92))",
              }}
            >
              <div className="mb-2 inline-flex rounded-lg border p-2" style={{ borderColor: "rgba(196,181,253,0.4)", color: "#c4b5fd" }}>
                <Icon size={16} />
              </div>
              <h3 className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                {item.title}
              </h3>
              <p className="mt-1 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                {item.description}
              </p>
            </article>
          );
        })}
      </section>

      <section
        className="rounded-xl border p-4"
        style={{
          borderColor: "rgba(59,130,246,0.32)",
          background: "linear-gradient(120deg, rgba(30,41,59,0.62), rgba(20,27,38,0.94))",
        }}
      >
        <div className="mb-2 flex items-center gap-2">
          <Heart size={16} style={{ color: "#93c5fd" }} />
          <h3 className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
            Intention de participation TENF
          </h3>
        </div>
        <p className="mb-3 text-xs" style={{ color: "var(--color-text-secondary)" }}>
          Une ligne de conduite simple pour vivre chaque evenement avec ouverture, respect et esprit d equipe.
        </p>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-2">
          {EVENT_PARTICIPATION_GUIDELINES.map((tip) => (
            <div
              key={tip}
              className="rounded-lg border px-3 py-2 text-xs"
              style={{ borderColor: "rgba(147,197,253,0.3)", backgroundColor: "rgba(15,23,42,0.46)", color: "var(--color-text)" }}
            >
              {tip}
            </div>
          ))}
        </div>
      </section>

      <section
        className="rounded-xl border p-4"
        style={{
          borderColor: "rgba(52,211,153,0.32)",
          background: "linear-gradient(120deg, rgba(18,45,39,0.58), rgba(17,31,35,0.94))",
        }}
      >
        <div className="mb-2 flex items-center gap-2">
          <Users size={16} style={{ color: "#6ee7b7" }} />
          <h3 className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
            Intention communautaire evenement TENF
          </h3>
        </div>
        <p className="mb-3 text-xs" style={{ color: "var(--color-text-secondary)" }}>
          Ces repères aident a faire des evenements TENF des moments utiles, inclusifs et memorables.
        </p>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-2">
          {EVENT_COMMUNITY_GUIDELINES.map((tip) => (
            <div
              key={tip}
              className="rounded-lg border px-3 py-2 text-xs"
              style={{ borderColor: "rgba(110,231,183,0.3)", backgroundColor: "rgba(16,38,34,0.46)", color: "var(--color-text)" }}
            >
              {tip}
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border p-5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
        {loading ? (
          <p style={{ color: "var(--color-text-secondary)" }}>Chargement des inscriptions...</p>
        ) : error ? (
          <EmptyFeatureCard title="Mon parcours evenements" description={error} />
        ) : registeredEvents.length === 0 ? (
          <EmptyFeatureCard title="Mon parcours evenements" description="Tu n'es inscrit a aucun evenement pour le moment." />
        ) : (
          <div className="space-y-6">
            {upcoming.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>
                  Prochains evenements
                </h3>
                {upcoming.map((event) => {
                  const categoryStyles = categoryBadge(event.category);
                  return (
                    <div
                      key={event.id}
                      className="rounded-lg border px-3 py-3"
                      style={{
                        borderColor: "rgba(96,165,250,0.35)",
                        backgroundColor: "rgba(20,35,55,0.42)",
                      }}
                    >
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
                          {formatEventDate(event.date)}
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
                  Evenements termines
                </h3>
                {past.map((event) => (
                  <div
                    key={`past-${event.id}`}
                    className="rounded-lg border px-3 py-3 text-sm"
                    style={{ borderColor: "rgba(148,163,184,0.35)", backgroundColor: "rgba(30,41,59,0.35)" }}
                  >
                    <p style={{ color: "var(--color-text)" }}>{event.title}</p>
                    <p style={{ color: "var(--color-text-secondary)" }}>
                      {formatEventDate(event.date)} - {event.category}
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

function StatCard({
  label,
  value,
  icon,
  suffix = "",
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  suffix?: string;
}) {
  return (
    <article className="rounded-xl border p-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
      <div className="mb-1 flex items-center gap-2" style={{ color: "var(--color-text-secondary)" }}>
        {icon}
        <p className="text-xs">{label}</p>
      </div>
      <p className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>
        {value}
        {suffix}
      </p>
    </article>
  );
}

import type { PublicEventItem } from "@/components/lives/types";

type UpcomingEventsSectionProps = {
  events: PublicEventItem[];
  allEventsHref: string;
};

export default function UpcomingEventsSection({
  events,
  allEventsHref,
}: UpcomingEventsSectionProps) {
  return (
    <section className="space-y-4 rounded-2xl border p-5 md:p-6" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)", boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-bold" style={{ color: "var(--color-text)" }}>
          📅 Prochains evenements
        </h2>
        <a
          href={allEventsHref}
          className="rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-white/5"
          style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
        >
          Voir tous les evenements
        </a>
      </div>

      {events.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
          Aucun evenement programme pour le moment.
        </p>
      ) : (
        <div className="grid gap-3 md:grid-cols-3">
          {events.map((event) => (
            <article key={event.id} className="rounded-xl border p-4" style={{ borderColor: "var(--color-border)", backgroundColor: "rgba(255,255,255,0.01)" }}>
              <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                {event.title}
              </p>
              <p className="mt-1 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                {new Date(event.date).toLocaleString("fr-FR")}
              </p>
              <p className="mt-2 inline-flex rounded-full border px-2.5 py-1 text-xs" style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}>
                {event.category}
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

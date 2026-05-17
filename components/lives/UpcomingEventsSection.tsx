import { ArrowRight, CalendarDays, Clock } from "lucide-react";
import type { CSSProperties } from "react";
import type { PublicEventItem } from "@/components/lives/types";

type UpcomingEventsSectionProps = {
  events: PublicEventItem[];
  allEventsHref: string;
};

function formatEventDate(value: string): { date: string; time: string } {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return { date: value, time: "" };
  return {
    date: parsed.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "long" }),
    time: parsed.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
  };
}

export default function UpcomingEventsSection({ events, allEventsHref }: UpcomingEventsSectionProps) {
  const sectionStyle: CSSProperties = {
    padding: "clamp(1.25rem, 2vw, 2rem)",
    borderColor: "var(--color-border)",
    backgroundColor: "var(--color-card)",
    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
  };

  return (
    <section className="space-y-4 rounded-2xl border" style={sectionStyle} aria-labelledby="upcoming-events-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2
            id="upcoming-events-title"
            className="flex items-center gap-2 font-bold tracking-tight"
            style={{ color: "var(--color-text)", fontSize: "clamp(1.1rem, 1rem + 0.5vw, 1.4rem)" }}
          >
            <CalendarDays className="h-5 w-5 text-violet-300" aria-hidden />
            Prochains rendez-vous TENF
          </h2>
          <p className="mt-1 text-sm text-zinc-400">
            Les trois prochains événements officiels — réunions, soirées, raids organisés.
          </p>
        </div>
        <a
          href={allEventsHref}
          className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300"
          style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
        >
          Voir tout l'agenda
          <ArrowRight className="h-4 w-4" aria-hidden />
        </a>
      </div>

      {events.length === 0 ? (
        <div
          className="rounded-xl border border-dashed p-6 text-center text-sm leading-relaxed"
          style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
        >
          Aucun événement programmé pour l'instant — on prépare la suite côté Discord, viens jeter un œil quand tu
          veux. En attendant, l'agenda complet recense tout ce qui se passe sur TENF.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => {
            const { date, time } = formatEventDate(event.date);
            return (
              <article
                key={event.id}
                className="group rounded-xl border p-4 transition hover:-translate-y-0.5 hover:border-violet-400/35"
                style={{ borderColor: "var(--color-border)", backgroundColor: "rgba(255,255,255,0.025)" }}
              >
                <p
                  className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                  style={{
                    borderColor: "rgba(145,70,255,0.4)",
                    color: "#d8c4ff",
                    backgroundColor: "rgba(145,70,255,0.12)",
                  }}
                >
                  {event.category}
                </p>
                <p className="mt-2 text-sm font-bold leading-snug" style={{ color: "var(--color-text)" }}>
                  {event.title}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-400">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5 text-violet-300" aria-hidden />
                    {date}
                  </span>
                  {time ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-zinc-500" aria-hidden />
                      {time}
                    </span>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

import { ArrowRight, CalendarDays, Clock } from "lucide-react";
import type { PublicEventItem } from "@/components/lives/types";
import theme from "@/components/lives/lives-theme.module.css";

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
  return (
    <section
      className={`space-y-4 ${theme.panel} ${theme.panelPadding}`}
      aria-labelledby="upcoming-events-title"
    >
      <div className={theme.panelOrbViolet} aria-hidden />
      <div className={`${theme.panelInner} space-y-4`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2
              id="upcoming-events-title"
              className="flex items-center gap-2 text-[clamp(1.1rem,1rem+0.5vw,1.4rem)] font-bold tracking-tight"
              style={{ color: "var(--color-text)" }}
            >
              <CalendarDays className={`h-5 w-5 ${theme.iconViolet}`} aria-hidden />
              Prochains rendez-vous TENF
            </h2>
            <p className="mt-1 text-sm text-zinc-400">
              Les trois prochains événements officiels — réunions, soirées, raids organisés.
            </p>
          </div>
          <a href={allEventsHref} className={theme.btnSecondary}>
            Voir tout l'agenda
            <ArrowRight className="h-4 w-4" aria-hidden />
          </a>
        </div>

        {events.length === 0 ? (
          <div className={theme.emptyState}>
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
                  className={`${theme.glassCard} ${theme.glassCardViolet} ${theme.glassInsetHover} p-4`}
                >
                  <p className={theme.badgeViolet}>{event.category}</p>
                  <p className="mt-2 text-sm font-bold leading-snug text-white">{event.title}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-400">
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className={`h-3.5 w-3.5 ${theme.iconViolet}`} aria-hidden />
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
      </div>
    </section>
  );
}

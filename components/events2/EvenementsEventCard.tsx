"use client";

import {
  CalendarPlus,
  ListChecks,
  Loader2,
  Sparkles,
  Users,
} from "lucide-react";
import EventDateTime from "@/components/EventDateTime";
import FormationCategoryBadge from "@/components/events/FormationCategoryBadge";
import theme from "@/components/events2/evenements-theme.module.css";
import {
  calendarUrlForEvent,
  categoryColor,
  getStatusBadge,
  getUrgencyLabel,
  type EventItem,
} from "@/components/events2/evenementsAgendaUtils";

type EvenementsEventCardProps = {
  event: EventItem;
  isRegistered: boolean;
  isPast: boolean;
  actionLoading: boolean;
  onOpenDetail: (event: EventItem) => void;
  onRegister: (eventId: string) => void;
  onUnregister: (eventId: string) => void;
};

export default function EvenementsEventCard({
  event,
  isRegistered,
  isPast,
  actionLoading,
  onOpenDetail,
  onRegister,
  onUnregister,
}: EvenementsEventCardProps) {
  const hasPublicCta = !!event.ctaUrl;
  const hideRegistration = event.isMaskedForAudience === true;
  const categoryLabel = event.isMaskedForAudience ? "Event TENF" : event.category;
  const categoryBadgeClass = event.isMaskedForAudience
    ? "border-red-400/35 bg-red-500/12 text-red-100"
    : categoryColor(event.category);
  const statusBadge = getStatusBadge(event.date);
  const urgency = getUrgencyLabel(event.date);
  const seatsLabel =
    typeof event.remainingSeats === "number"
      ? `${Math.max(0, event.remainingSeats)} place(s) restante(s)`
      : "Places ouvertes";

  return (
    <article className={theme.eventCard}>
      {event.image ? (
        <div className="relative h-36 w-full overflow-hidden bg-black/30">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={event.image}
            alt=""
            className="h-full w-full object-contain transition duration-500 hover:scale-[1.02]"
          />
          {isRegistered && !isPast ? (
            <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full border border-emerald-400/50 bg-emerald-500/80 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
              <ListChecks className="h-3 w-3" aria-hidden />
              Inscrit·e
            </span>
          ) : null}
        </div>
      ) : (
        <div className="relative flex h-36 w-full items-center justify-center bg-gradient-to-br from-violet-900/25 via-fuchsia-900/15 to-transparent">
          <CalendarPlus className="h-10 w-10 text-fuchsia-200/20" aria-hidden />
          {isRegistered && !isPast ? (
            <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full border border-emerald-400/50 bg-emerald-500/80 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
              <ListChecks className="h-3 w-3" aria-hidden />
              Inscrit·e
            </span>
          ) : null}
        </div>
      )}

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className={`rounded-full border px-2 py-1 text-xs font-semibold ${categoryBadgeClass}`}>
            {categoryLabel}
          </span>
          <span className={`rounded-full border px-2 py-1 text-xs ${statusBadge.className}`}>
            {statusBadge.label}
          </span>
        </div>

        <h3 className="line-clamp-2 text-lg font-semibold text-white">{event.title}</h3>
        <EventDateTime startUtc={event.date} className="text-sm text-zinc-400" />

        <div className="flex flex-wrap gap-1.5">
          {event.category === "Formation" && event.formationCategory ? (
            <FormationCategoryBadge formationCategory={event.formationCategory} />
          ) : null}
          {urgency ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-pink-400/35 bg-pink-500/10 px-2 py-0.5 text-[11px] font-semibold text-pink-100">
              <Sparkles className="h-3 w-3" aria-hidden />
              {urgency}
            </span>
          ) : null}
          {!isPast ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-violet-400/30 bg-violet-500/10 px-2 py-0.5 text-[11px] font-semibold text-violet-100">
              <Users className="h-3 w-3" aria-hidden />
              {seatsLabel}
            </span>
          ) : null}
        </div>

        <p className="line-clamp-3 whitespace-pre-wrap text-sm text-zinc-300">
          {event.description ||
            "L'équipe TENF prépare cette rencontre. Le programme arrive très bientôt — reviens y jeter un œil."}
        </p>

        <div className="mt-auto flex flex-col gap-2 pt-2 sm:flex-row sm:flex-wrap">
          <button type="button" onClick={() => onOpenDetail(event)} className={`${theme.btnSecondary} w-full sm:w-auto`}>
            Voir le détail
          </button>
          <a
            href={calendarUrlForEvent(event)}
            target="_blank"
            rel="noreferrer"
            className={`${theme.btnPrimary} w-full sm:w-auto`}
          >
            <CalendarPlus className="h-4 w-4" aria-hidden />
            Agenda Google
          </a>
          {hasPublicCta ? (
            <a
              href={event.ctaUrl}
              target="_blank"
              rel="noreferrer"
              className={`${theme.btnSecondary} w-full sm:w-auto`}
            >
              {event.ctaLabel || "En savoir plus"}
            </a>
          ) : null}
          {!isPast && !hideRegistration ? (
            <button
              type="button"
              onClick={() => (isRegistered ? onUnregister(event.id) : onRegister(event.id))}
              disabled={actionLoading}
              aria-pressed={isRegistered}
              className={`w-full rounded-xl px-3 py-2 text-sm font-semibold text-white transition sm:w-auto ${
                isRegistered
                  ? "border border-red-400/40 bg-red-600/80 hover:bg-red-600"
                  : "border border-emerald-400/35 bg-emerald-600/85 hover:bg-emerald-600"
              } disabled:cursor-not-allowed disabled:opacity-60`}
            >
              {actionLoading ? <Loader2 className="mr-1 inline h-4 w-4 animate-spin" aria-hidden /> : null}
              {isRegistered ? "Je me désinscris" : "Je participe"}
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}

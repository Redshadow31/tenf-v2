"use client";

import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  CalendarHeart,
  GraduationCap,
  Users,
} from "lucide-react";
import {
  formatDateTime,
  hexToRgba,
  type DashboardEventItem,
  type MemberDashboardModel,
} from "@/components/member/dashboard/memberDashboardModel";

type EventsPreviewCardProps = {
  model: MemberDashboardModel;
};

export default function EventsPreviewCard({ model }: EventsPreviewCardProps) {
  const { accent, upcomingEvents, meetings, status } = model;

  return (
    <section
      aria-labelledby="dashboard-events-title"
      className="grid gap-4 lg:grid-cols-[1.2fr_1fr]"
    >
      {/* Réunion & intégration */}
      <article
        className="rounded-3xl border p-5 md:p-6"
        style={{
          borderColor: "rgba(56,189,248,0.25)",
          background:
            "linear-gradient(150deg, rgba(56,189,248,0.10), rgba(15,17,22,0.92))",
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-cyan-200/80">
              Réunion & intégration
            </p>
            <h2
              id="dashboard-events-title"
              className="mt-1 text-xl font-bold md:text-2xl"
              style={{ color: "var(--color-text)" }}
            >
              Les rendez-vous qui font vivre la famille
            </h2>
          </div>
          <CalendarHeart className="h-7 w-7 text-cyan-300/80" aria-hidden />
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {/* Intégration */}
          <div
            className="rounded-2xl border p-4"
            style={{
              borderColor: "rgba(56,189,248,0.3)",
              backgroundColor: "rgba(56,189,248,0.06)",
            }}
          >
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-cyan-300" aria-hidden />
              <p
                className="text-[11px] font-bold uppercase tracking-wide text-cyan-200/80"
              >
                Réunion d&apos;intégration
              </p>
            </div>
            <p
              className="mt-2 text-sm font-bold"
              style={{ color: "var(--color-text)" }}
            >
              {meetings.isIntegrationDone
                ? `Effectuée le ${meetings.integrationDateLabel}`
                : "Pas encore planifiée"}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-white/65">
              {status === "newcomer"
                ? "Inscris-toi à une session quand tu veux : on y présente la communauté en douceur."
                : "Pour les nouveaux membres, c'est le moment d'accueil et de découverte de la communauté."}
            </p>
            {meetings.onboardingEvent ? (
              <p
                className="mt-2 text-xs leading-relaxed"
                style={{ color: hexToRgba(accent, 0.95) }}
              >
                Prochaine session : {meetings.onboardingEvent.title} —{" "}
                {formatDateTime(meetings.onboardingEvent.date)}
              </p>
            ) : null}
          </div>

          {/* Communauté */}
          <div
            className="rounded-2xl border p-4"
            style={{
              borderColor: "rgba(167,139,250,0.3)",
              backgroundColor: "rgba(167,139,250,0.06)",
            }}
          >
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-violet-300" aria-hidden />
              <p
                className="text-[11px] font-bold uppercase tracking-wide text-violet-200/80"
              >
                Réunion mensuelle / events
              </p>
            </div>
            <p
              className="mt-2 text-sm font-bold"
              style={{ color: "var(--color-text)" }}
            >
              {meetings.nextCommunityEvent
                ? meetings.nextCommunityEvent.title
                : "À programmer"}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-white/65">
              {meetings.nextCommunityEvent
                ? formatDateTime(meetings.nextCommunityEvent.date)
                : "Les prochains événements seront affichés ici dès qu'ils sont validés."}
            </p>
          </div>
        </div>

        <Link
          href="/member/evenements"
          className="mt-4 inline-flex items-center gap-1 text-sm font-semibold transition hover:gap-2"
          style={{ color: hexToRgba(accent, 0.95) }}
        >
          Tous les événements
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </article>

      {/* Agenda 2-3 events à venir */}
      <article
        className="rounded-3xl border p-5 md:p-6"
        style={{
          borderColor: "rgba(255,255,255,0.1)",
          backgroundColor: "rgba(20,20,26,0.85)",
        }}
      >
        <div className="flex items-center justify-between gap-3">
          <h3
            className="text-lg font-bold"
            style={{ color: "var(--color-text)" }}
          >
            Agenda TENF
          </h3>
          <Link
            href="/member/evenements"
            className="text-xs font-semibold text-violet-300 hover:text-white"
          >
            Tout voir
          </Link>
        </div>
        <p className="mt-1 text-xs text-white/55">
          Les 3 prochains rendez-vous communautaires.
        </p>
        {upcomingEvents.length === 0 ? (
          <div
            className="mt-4 rounded-2xl border border-dashed p-4 text-sm text-white/60"
            style={{ borderColor: "rgba(255,255,255,0.12)" }}
          >
            Aucun événement listé pour le moment — reviens dans quelques jours.
          </div>
        ) : (
          <ul className="mt-4 space-y-2">
            {upcomingEvents.slice(0, 3).map((ev) => (
              <UpcomingEventRow key={ev.id} ev={ev} accent={accent} />
            ))}
          </ul>
        )}
      </article>
    </section>
  );
}

function UpcomingEventRow({ ev, accent }: { ev: DashboardEventItem; accent: string }) {
  const Icon =
    ev.bucket === "onboarding"
      ? Users
      : ev.bucket === "community"
      ? Calendar
      : GraduationCap;

  return (
    <li
      className="flex items-start gap-3 rounded-xl border px-3 py-2.5 transition hover:-translate-y-0.5"
      style={{
        borderColor: "rgba(255,255,255,0.1)",
        backgroundColor: "rgba(255,255,255,0.03)",
      }}
    >
      <span
        className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
        style={{
          backgroundColor: hexToRgba(accent, 0.16),
          color: hexToRgba(accent, 0.95),
        }}
        aria-hidden
      >
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p
          className="line-clamp-1 text-sm font-bold"
          style={{ color: "var(--color-text)" }}
        >
          {ev.title}
        </p>
        <p className="text-xs text-white/55">
          {formatDateTime(ev.date)} · {ev.category}
        </p>
      </div>
    </li>
  );
}

"use client";

import Link from "next/link";
import { ArrowRight, Calendar, CalendarHeart, GraduationCap, Users } from "lucide-react";
import {
  formatDateTime,
  hexToRgba,
  type DashboardEventItem,
  type MemberDashboardModel,
} from "@/components/member/dashboard/memberDashboardModel";
import { DashboardPanel, DashboardPanelHeader } from "@/components/member/dashboard/dashboardUi";

type EventsPreviewCardProps = {
  model: MemberDashboardModel;
  variant?: "full" | "compact";
};

export default function EventsPreviewCard({ model, variant = "full" }: EventsPreviewCardProps) {
  const { accent, upcomingEvents, meetings, status } = model;
  const showIntegration = status === "newcomer" || !meetings.isIntegrationDone;
  const compact = variant === "compact";

  if (compact) {
    return (
      <DashboardPanel tone="cyan" accentHex={accent} intensity="soft" ariaLabelledBy="dashboard-events-title">
        <DashboardPanelHeader
          kicker="Agenda"
          title="Prochains RDV"
          icon={Calendar}
          tone="cyan"
          titleId="dashboard-events-title"
          badge={
            <Link href="/member/evenements" className="text-[11px] font-bold text-cyan-300 hover:text-white">
              Tout →
            </Link>
          }
        />

        {showIntegration ? (
          <div
            className="mb-3 rounded-xl border border-cyan-400/25 bg-gradient-to-r from-cyan-500/10 to-transparent p-3"
          >
            <div className="flex items-center gap-2">
              <CalendarHeart className="h-4 w-4 text-cyan-300" aria-hidden />
              <p className="text-xs font-bold text-white">
                {meetings.isIntegrationDone ? "Intégration OK" : "Session d'accueil"}
              </p>
            </div>
            {meetings.onboardingEvent ? (
              <p className="mt-1 text-[11px] text-white/65">
                {meetings.onboardingEvent.title} · {formatDateTime(meetings.onboardingEvent.date)}
              </p>
            ) : null}
          </div>
        ) : meetings.nextCommunityEvent ? (
          <p className="mb-3 text-xs leading-relaxed text-white/70">
            <strong className="text-white">{meetings.nextCommunityEvent.title}</strong>
            <br />
            {formatDateTime(meetings.nextCommunityEvent.date)}
          </p>
        ) : null}

        {upcomingEvents.length === 0 ? (
          <p className="flex flex-1 items-center text-xs text-white/50">Aucun événement listé pour le moment.</p>
        ) : (
          <ul className="space-y-2">
            {upcomingEvents.slice(0, 3).map((ev) => (
              <UpcomingEventRow key={ev.id} ev={ev} accent={accent} compact />
            ))}
          </ul>
        )}
      </DashboardPanel>
    );
  }

  return (
    <section aria-labelledby="dashboard-events-title-full" className="grid gap-4 lg:grid-cols-2">
      {showIntegration ? (
        <DashboardPanel tone="cyan" accentHex={accent} ariaLabelledBy="dashboard-events-title-full">
          <DashboardPanelHeader
            kicker="Intégration"
            title={meetings.isIntegrationDone ? "Intégration effectuée" : "Bienvenue dans la famille"}
            icon={CalendarHeart}
            tone="cyan"
            titleId="dashboard-events-title-full"
          />
          <p className="text-sm text-white/70">
            {meetings.isIntegrationDone
              ? `Réunion faite le ${meetings.integrationDateLabel}.`
              : "Inscris-toi à une session d'accueil pour découvrir la communauté."}
          </p>
          {meetings.onboardingEvent ? (
            <p className="mt-2 text-xs text-cyan-200/90">
              {meetings.onboardingEvent.title} — {formatDateTime(meetings.onboardingEvent.date)}
            </p>
          ) : null}
          <Link
            href="/member/evenements"
            className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-cyan-300 hover:text-white"
          >
            Voir les sessions <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </DashboardPanel>
      ) : null}

      <DashboardPanel tone="neutral" accentHex={accent} className={showIntegration ? "" : "lg:col-span-2"}>
        <DashboardPanelHeader kicker="Communauté" title="Prochains rendez-vous" icon={Calendar} tone="neutral" />
        {upcomingEvents.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/12 p-4 text-sm text-white/60">
            Aucun événement listé.
          </div>
        ) : (
          <ul className="space-y-2">
            {upcomingEvents.slice(0, 3).map((ev) => (
              <UpcomingEventRow key={ev.id} ev={ev} accent={accent} />
            ))}
          </ul>
        )}
      </DashboardPanel>
    </section>
  );
}

function UpcomingEventRow({
  ev,
  accent,
  compact,
}: {
  ev: DashboardEventItem;
  accent: string;
  compact?: boolean;
}) {
  const Icon = ev.bucket === "onboarding" ? Users : ev.bucket === "community" ? Calendar : GraduationCap;
  const date = new Date(ev.date);
  const day = Number.isNaN(date.getTime()) ? "—" : String(date.getDate()).padStart(2, "0");
  const month = Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleDateString("fr-FR", { month: "short" }).replace(".", "");

  const rowClass = `group flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 transition hover:-translate-y-0.5 hover:border-white/16 hover:bg-white/[0.03] ${
    compact ? "px-2.5 py-2" : "px-3 py-2.5"
  }`;

  return (
    <li>
      <Link href="/member/evenements" className={rowClass}>
      <div
        className="flex shrink-0 flex-col items-center rounded-lg border px-2 py-1.5 text-center shadow-inner"
        style={{
          borderColor: hexToRgba(accent, 0.28),
          background: `linear-gradient(160deg, ${hexToRgba(accent, 0.14)}, rgba(0,0,0,0.3))`,
          minWidth: compact ? 38 : 44,
        }}
        aria-hidden
      >
        <span className="text-[9px] font-bold uppercase tracking-wide text-white/45">{month}</span>
        <span className="text-base font-black leading-none text-white">{day}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className={`truncate font-bold text-white ${compact ? "text-xs" : "text-sm"}`}>{ev.title}</p>
        <p className="text-[10px] text-white/50">
          {formatDateTime(ev.date)} · {ev.category}
        </p>
      </div>
      <Icon
        className="h-4 w-4 shrink-0 opacity-30 transition group-hover:opacity-70"
        style={{ color: hexToRgba(accent, 0.95) }}
        aria-hidden
      />
      </Link>
    </li>
  );
}

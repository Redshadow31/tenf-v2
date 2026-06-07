"use client";

import {
  ArrowRight,
  CalendarDays,
  ExternalLink,
  Loader2,
  Sparkles,
} from "lucide-react";
import {
  DashboardPanel,
  DashboardPanelHeader,
  MEMBER_SCROLL_MT,
} from "@/components/member/dashboard/dashboardUi";
import {
  calendarUrlForEvent,
  FORMATIONS_CATALOG_ACCENT,
  type FormationEventItem,
} from "@/components/member/formations/catalog/formationsCatalogUtils";

type FormationsCatalogUpcomingPanelProps = {
  loading: boolean;
  formations: FormationEventItem[];
  registeredEventIds: Set<string>;
  registeringEventId: string;
  onToggleRegistration: (eventId: string) => void;
  onSelectEvent: (event: FormationEventItem) => void;
};

function UpcomingSkeleton() {
  return (
    <div className="grid animate-pulse grid-cols-1 gap-4 sm:grid-cols-2" aria-hidden>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-40 rounded-2xl bg-white/[0.04]" />
      ))}
    </div>
  );
}

export default function FormationsCatalogUpcomingPanel({
  loading,
  formations,
  registeredEventIds,
  registeringEventId,
  onToggleRegistration,
  onSelectEvent,
}: FormationsCatalogUpcomingPanelProps) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <DashboardPanel
      id="formations-upcoming"
      tone="accent"
      accentHex={FORMATIONS_CATALOG_ACCENT}
      intensity="soft"
      ariaLabelledBy="formations-upcoming-title"
      className={MEMBER_SCROLL_MT}
    >
      <DashboardPanelHeader
        kicker="Sessions live"
        title="Prochaines formations"
        icon={Sparkles}
        tone="amber"
        accentHex="#f59e0b"
        titleId="formations-upcoming-title"
        badge={
          <span className="text-[11px] text-white/45">
            {loading ? "…" : `${formations.length} session${formations.length > 1 ? "s" : ""}`}
          </span>
        }
      />

      <p className="mb-4 text-sm text-white/55">
        Inscription, ajout calendrier ou détail — les créneaux TENF se vivent en direct sur Discord.
      </p>

      {loading ? (
        <UpcomingSkeleton />
      ) : formations.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-10 text-center text-sm text-white/45">
          Aucune session planifiée pour l&apos;instant. Explore l&apos;archive ci-dessous ou envoie une demande de
          thème.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {formations.slice(0, 12).map((formation) => {
            const isRegistered = registeredEventIds.has(formation.id);
            return (
              <article
                key={formation.id}
                className="flex flex-col rounded-2xl border border-white/10 bg-black/25 p-4 transition hover:border-amber-400/30 hover:shadow-lg"
              >
                <p className="text-base font-semibold leading-snug text-white">{formation.title}</p>
                <p className="mt-2 flex flex-wrap items-center gap-1 text-sm text-white/55">
                  <CalendarDays size={14} className="shrink-0" aria-hidden />
                  <span>{new Date(formation.date).toLocaleString("fr-FR")}</span>
                </p>
                {isRegistered ? (
                  <span className="mt-2 inline-flex w-fit rounded-full border border-emerald-400/40 bg-emerald-500/12 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-200">
                    Inscrit·e
                  </span>
                ) : null}
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onToggleRegistration(formation.id)}
                    disabled={registeringEventId === formation.id}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
                    style={{
                      borderColor: isRegistered ? "rgba(248,113,113,0.45)" : "rgba(139,92,246,0.45)",
                      color: isRegistered ? "#f87171" : "#c4b5fd",
                    }}
                  >
                    {registeringEventId === formation.id ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    {isRegistered ? "Se désinscrire" : "S'inscrire"}
                    <ArrowRight size={14} className="opacity-80" aria-hidden />
                  </button>
                  <a
                    href={calendarUrlForEvent(formation, origin)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg border border-amber-400/40 px-3 py-2 text-sm font-semibold text-amber-200 transition hover:border-amber-300/50"
                  >
                    Calendrier
                    <ExternalLink size={14} aria-hidden />
                  </a>
                  <button
                    type="button"
                    onClick={() => onSelectEvent(formation)}
                    className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/5"
                  >
                    Détails
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </DashboardPanel>
  );
}

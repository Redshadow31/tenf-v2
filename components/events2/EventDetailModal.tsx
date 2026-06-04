"use client";

import EventDateTime from "@/components/EventDateTime";
import { formatEventDateTimeInTimezone } from "@/lib/timezone";
import { buildEventLocationDisplay, type EventLocationLink } from "@/lib/eventLocation";
import {
  CalendarPlus,
  CalendarRange,
  CheckCircle2,
  Clock,
  ExternalLink,
  HeartHandshake,
  Loader2,
  MapPin,
  Share2,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import FormationCategoryBadge from "@/components/events/FormationCategoryBadge";
import RgpdConsentCheckbox from "@/components/legal/RgpdConsentCheckbox";
import { PRIVACY_CONSENT_ERROR_FORM } from "@/lib/legal/privacyConsent";
import { useCallback, useEffect, useId, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import theme from "@/components/events2/evenements-theme.module.css";

export type EventDetailModalItem = {
  id: string;
  title: string;
  description: string;
  image?: string;
  date: string;
  category: string;
  formationCategory?: string | null;
  location?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  isMaskedForAudience?: boolean;
  remainingSeats?: number | null;
};

type StatusBadge = { label: string; className: string };

type TabId = "about" | "infos" | "participer";

const TABS: { id: TabId; label: string; hint: string }[] = [
  { id: "about", label: "À propos", hint: "Programme" },
  { id: "infos", label: "Infos pratiques", hint: "Lieu & horaires" },
  { id: "participer", label: "Participer", hint: "Inscription" },
];

function DateHighlight({ iso }: { iso: string }) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return (
    <div
      className={`${theme.glassCard} ${theme.glassCardPink} flex shrink-0 flex-col items-center justify-center px-4 py-3 text-center min-w-[5.5rem]`}
    >
      <span className="text-2xl font-bold tabular-nums text-white leading-none">{d.getDate()}</span>
      <span className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-fuchsia-200/90">
        {d.toLocaleDateString("fr-FR", { month: "short" })}
      </span>
      <span className="mt-0.5 text-[11px] capitalize text-zinc-400">
        {d.toLocaleDateString("fr-FR", { weekday: "short" })}
      </span>
      <span className="mt-2 w-full border-t border-white/10 pt-2 text-[10px] text-zinc-500">Heure locale</span>
    </div>
  );
}

function MarkdownBody({ value }: { value: string }) {
  if (!value?.trim()) {
    return <p className={theme.markdownBody}>Aucune description pour le moment.</p>;
  }
  return (
    <div className={theme.markdownBody}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
    </div>
  );
}

export type EventDetailModalProps = {
  event: EventDetailModalItem;
  open: boolean;
  onClose: () => void;
  calendarUrl: string;
  locationLinks: EventLocationLink[];
  categoryBadgeClass: string;
  categoryLabel: string;
  statusBadge: StatusBadge;
  urgencyLabel: string | null;
  isRegistered: boolean;
  isPast: boolean;
  hideRegistration: boolean;
  actionLoading: boolean;
  onRegister: () => void;
  onUnregister: () => void;
  browserTimezone: string;
};

export default function EventDetailModal({
  event,
  open,
  onClose,
  calendarUrl,
  locationLinks,
  categoryBadgeClass,
  categoryLabel,
  statusBadge,
  urgencyLabel,
  isRegistered,
  isPast,
  hideRegistration,
  actionLoading,
  onRegister,
  onUnregister,
  browserTimezone,
}: EventDetailModalProps) {
  const titleId = useId();
  const [tab, setTab] = useState<TabId>("about");
  const [copied, setCopied] = useState(false);
  const [entered, setEntered] = useState(false);
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [consentError, setConsentError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setPrivacyConsent(false);
      setConsentError(null);
      setTab("about");
      setCopied(false);
      const t = requestAnimationFrame(() => setEntered(true));
      return () => cancelAnimationFrame(t);
    }
    setEntered(false);
  }, [open, event.id]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) return;
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onKeyDown]);

  const shareText = useCallback(async () => {
    const line1 = `Événement TENF : ${event.title}`;
    const line2 = typeof window !== "undefined" ? `${window.location.origin}/evenements` : "/evenements";
    const text = `${line1}\n${line2}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: event.title, text: line1, url: line2 });
        return;
      }
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } catch {
        // ignore
      }
    }
  }, [event.title]);

  const handleRegisterClick = useCallback(() => {
    if (!privacyConsent) {
      setConsentError(PRIVACY_CONSENT_ERROR_FORM);
      setTab("participer");
      return;
    }
    setConsentError(null);
    onRegister();
  }, [privacyConsent, onRegister]);

  if (!open) return null;

  const locationDisplay = event.location ? buildEventLocationDisplay(event.location, locationLinks) : null;
  const fullWhen = formatEventDateTimeInTimezone(event.date, browserTimezone, "fr-FR").fullLabel;
  const seatsLine =
    typeof event.remainingSeats === "number"
      ? `${Math.max(0, event.remainingSeats)} place(s) restante(s)`
      : "Places ouvertes (dans la limite prévue par l’organisateur)";

  const showParticipateCta = !isPast && !hideRegistration;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4 transition-opacity duration-200 ${
        entered ? "opacity-100" : "opacity-0"
      }`}
      role="presentation"
    >
      <button
        type="button"
        className={`absolute inset-0 ${theme.modalBackdrop}`}
        aria-label="Fermer la fenêtre"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`${theme.panel} ${theme.modalShell} relative z-10 flex w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl sm:rounded-3xl transition-transform duration-200 ease-out ${
          entered ? "translate-y-0 sm:scale-100" : "translate-y-6 sm:scale-95"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={theme.panelOrbViolet} aria-hidden />
        <div className={theme.panelOrbPink} aria-hidden />

        <div className={`${theme.panelInner} flex min-h-0 flex-1 flex-col`}>
          {/* Hero visuel */}
          <div className={theme.modalHero}>
            {event.image ? (
              <div className={theme.modalHeroImageFrame}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={event.image} alt="" className="h-full w-full object-contain object-center" />
              </div>
            ) : null}
            <div className={theme.modalHeroFade} aria-hidden />
            <div className={theme.modalHeroOverlay}>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className={`${theme.badgeViolet} !text-[10px]`}>
                  <Sparkles className="h-3 w-3" aria-hidden />
                  Détail événement
                </span>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${categoryBadgeClass}`}>
                  {categoryLabel}
                </span>
                {event.category === "Formation" && event.formationCategory ? (
                  <FormationCategoryBadge formationCategory={event.formationCategory} />
                ) : null}
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusBadge.className}`}>
                  {statusBadge.label}
                </span>
                {isRegistered && !isPast ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-100">
                    <CheckCircle2 className="h-3 w-3" aria-hidden />
                    Inscrit·e
                  </span>
                ) : null}
              </div>
              <button type="button" onClick={onClose} className={theme.modalClose} aria-label="Fermer">
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
          </div>

          {/* Titre & contexte */}
          <div className={theme.modalSection}>
            {urgencyLabel && !isPast ? (
              <p className={`${theme.noticeUrgent} mb-2`}>
                <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden />
                {urgencyLabel}
              </p>
            ) : null}
            <h2 id={titleId} className="text-xl font-bold leading-tight text-white sm:text-2xl">
              {event.title}
            </h2>
            <p className="mt-1.5 text-sm text-zinc-400">
              <span className={theme.titleGradient}>TENF</span> — moment convivial en ligne ou sur place. Pense à
              vérifier Discord pour les rappels.
            </p>
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <span className={`${theme.badgeNeutral} gap-1`}>
                <Users className="h-3.5 w-3.5" aria-hidden />
                Grand public
              </span>
              <span className={`${theme.badgeViolet} ${theme.badgePink} !normal-case !tracking-normal !text-xs gap-1`}>
                <HeartHandshake className="h-3.5 w-3.5" aria-hidden />
                Membres TENF
              </span>
            </div>
          </div>

          <hr className={theme.divider} />

          {/* Date & partage */}
          <div className={theme.modalSection}>
            <div className="flex flex-wrap items-stretch gap-3">
              <DateHighlight iso={event.date} />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex items-start gap-2 text-sm text-zinc-200">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-fuchsia-300/90" aria-hidden />
                  <div>
                    <p className="font-medium text-white">{fullWhen}</p>
                    <EventDateTime startUtc={event.date} className="text-xs text-zinc-500" />
                  </div>
                </div>
                {!isPast ? (
                  <p className="flex items-center gap-2 text-xs text-emerald-200/90">
                    <Users className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    {seatsLine}
                  </p>
                ) : null}
                <button
                  type="button"
                  onClick={() => void shareText()}
                  className={`${theme.btnSecondary} !min-h-0 !px-2.5 !py-1.5 !text-xs`}
                >
                  <Share2 className="h-3.5 w-3.5" aria-hidden />
                  {copied ? "Copié !" : "Partager / copier"}
                </button>
              </div>
            </div>
          </div>

          <hr className={theme.divider} />

          {/* Onglets */}
          <div className={`${theme.modalSection} !pb-2`} role="tablist" aria-label="Sections du détail d’événement">
            <div className={`${theme.glassInset} flex gap-1 overflow-x-auto p-1`}>
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={tab === t.id}
                  onClick={() => setTab(t.id)}
                  className={`${theme.modalTab} ${tab === t.id ? theme.modalTabActive : ""}`}
                >
                  <span>{t.label}</span>
                  <span className={theme.modalTabHint}>{t.hint}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Contenu */}
          <div className={theme.modalBody}>
            {tab === "about" && (
              <div className="space-y-4" role="tabpanel">
                <div className={`${theme.glassCard} ${theme.glassCardViolet} p-4`}>
                  <p className="flex items-center gap-2 text-sm font-semibold text-violet-100">
                    <HeartHandshake className="h-4 w-4" aria-hidden />
                    Pour toute la family
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                    Descriptions rédigées par l’équipe ou les animateurs — relis les consignes avant le jour J.
                  </p>
                </div>
                <MarkdownBody value={event.description || ""} />
              </div>
            )}

            {tab === "infos" && (
              <div className="space-y-4" role="tabpanel">
                <div className={`${theme.glassCard} ${theme.glassCardViolet} flex gap-3 p-4`}>
                  <CalendarRange className="h-9 w-9 shrink-0 text-fuchsia-300/85" aria-hidden />
                  <div>
                    <h3 className="text-sm font-semibold text-white">Quand</h3>
                    <p className="mt-1 text-sm text-zinc-300">{fullWhen}</p>
                    <p className="mt-1 text-xs text-zinc-500">Horaires adaptés à ton fuseau local.</p>
                  </div>
                </div>

                <div className={`${theme.glassCard} ${theme.glassCardPink} flex gap-3 p-4`}>
                  <MapPin className="h-9 w-9 shrink-0 text-fuchsia-300/85" aria-hidden />
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-white">Lieu & accès</h3>
                    {locationDisplay ? (
                      <a
                        className={`${theme.linkAccent} mt-1 inline-flex items-center gap-1 break-all text-sm`}
                        href={locationDisplay.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {locationDisplay.label}
                        <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      </a>
                    ) : (
                      <p className="mt-1 text-sm text-zinc-400">
                        Le lieu exact est communiqué par l’équipe TENF avant l’événement.
                      </p>
                    )}
                  </div>
                </div>

                <p className="text-xs text-zinc-500">
                  Une question ?{" "}
                  <Link href="/evenements-communautaires" className={theme.linkAccent} onClick={onClose}>
                    Page communautaire
                  </Link>{" "}
                  ou annonces Discord.
                </p>
              </div>
            )}

            {tab === "participer" && (
              <div className="space-y-4" role="tabpanel">
                {!hideRegistration ? (
                  <div className={theme.noticeMember}>
                    <strong className="text-white">Membres TENF</strong> — inscris-toi en un clic pour les rappels et
                    suivre tes participations.
                  </div>
                ) : (
                  <div className={theme.noticeLimited}>
                    <strong className="text-white">Accès limité</strong> — événement réservé à un groupe précis.
                    Renseigne-toi sur Discord ou auprès du staff.
                  </div>
                )}

                <div className="grid gap-3 sm:grid-cols-2">
                  <a
                    href={calendarUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={`${theme.glassCard} ${theme.glassCardViolet} ${theme.glassCardInteractive} ${theme.actionCardLink} p-4`}
                  >
                    <div className={theme.actionIconViolet}>
                      <CalendarPlus className="h-6 w-6" aria-hidden />
                    </div>
                    <div>
                      <p className="font-semibold text-white">Google Calendar</p>
                      <p className="text-xs text-zinc-500">Ajoute l’événement à ton agenda</p>
                    </div>
                  </a>

                  {event.ctaUrl ? (
                    <a
                      href={event.ctaUrl}
                      target="_blank"
                      rel="noreferrer"
                      className={`${theme.glassCard} ${theme.glassCardPink} ${theme.glassCardInteractive} ${theme.actionCardLink} p-4`}
                    >
                      <div className={theme.actionIconPink}>
                        <ExternalLink className="h-6 w-6" aria-hidden />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-white">{event.ctaLabel || "En savoir plus"}</p>
                        <p className="truncate text-xs text-zinc-500">Page ou ressource dédiée</p>
                      </div>
                    </a>
                  ) : null}
                </div>

                <div className="space-y-3 border-t border-white/10 pt-4">
                  {isPast ? (
                    <p className={theme.noticePast}>Événement terminé — merci pour ta participation !</p>
                  ) : !hideRegistration ? (
                    isRegistered ? (
                      <button
                        type="button"
                        onClick={onUnregister}
                        disabled={actionLoading}
                        className={`${theme.btnDanger} w-full`}
                      >
                        {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
                        Me désinscrire
                      </button>
                    ) : (
                      <div className="space-y-3">
                        <RgpdConsentCheckbox
                          id="event-register-privacy-consent"
                          checked={privacyConsent}
                          onChange={(checked) => {
                            setPrivacyConsent(checked);
                            if (checked) setConsentError(null);
                          }}
                          disabled={actionLoading}
                          error={consentError}
                        />
                        <button
                          type="button"
                          onClick={handleRegisterClick}
                          disabled={actionLoading}
                          className={`${theme.btnPrimary} w-full`}
                        >
                          {actionLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                          ) : (
                            <HeartHandshake className="h-4 w-4" aria-hidden />
                          )}
                          Confirmer mon inscription
                        </button>
                      </div>
                    )
                  ) : null}
                </div>

                <div className={`${theme.glassInset} px-3 py-3 text-xs text-zinc-500`}>
                  Pas encore membre ?{" "}
                  <Link href="/rejoindre/guide-public" className={theme.linkAccent} onClick={onClose}>
                    Rejoindre TENF
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Pied — actions rapides */}
          <footer className={theme.modalFooter}>
            <a
              href={calendarUrl}
              target="_blank"
              rel="noreferrer"
              className={`${theme.btnSecondary} flex-1 sm:flex-none`}
            >
              <CalendarPlus className="h-4 w-4" aria-hidden />
              Agenda
            </a>

            {showParticipateCta ? (
              isRegistered ? (
                <button
                  type="button"
                  onClick={onUnregister}
                  disabled={actionLoading}
                  className={`${theme.btnDanger} flex-1 sm:flex-none`}
                >
                  {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
                  Désinscription
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setTab("participer")}
                  className={`${theme.btnPrimary} flex-1 sm:flex-none`}
                >
                  <HeartHandshake className="h-4 w-4" aria-hidden />
                  Je participe
                </button>
              )
            ) : null}

            <button type="button" onClick={onClose} className={`${theme.btnSecondary} flex-1 sm:flex-none`}>
              Fermer
            </button>
          </footer>
        </div>
      </div>
    </div>
  );
}

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
  MapPin,
  Share2,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useId, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export type EventDetailModalItem = {
  id: string;
  title: string;
  description: string;
  image?: string;
  date: string;
  category: string;
  location?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  isMaskedForAudience?: boolean;
  remainingSeats?: number | null;
};

type StatusBadge = { label: string; className: string };

type TabId = "about" | "infos" | "participer";

const TABS: { id: TabId; label: string; hint: string }[] = [
  { id: "about", label: "À propos", hint: "Texte & programme" },
  { id: "infos", label: "Infos pratiques", hint: "Lieu, horaires" },
  { id: "participer", label: "Participer", hint: "Calendrier & inscription" },
];

function DateHighlight({ iso, browserTimezone }: { iso: string; browserTimezone: string }) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return (
    <div className="flex shrink-0 flex-col items-center justify-center rounded-2xl border border-violet-500/25 bg-gradient-to-b from-violet-500/15 to-transparent px-4 py-3 text-center min-w-[5.5rem] shadow-[0_0_24px_rgba(145,70,255,0.12)]">
      <span className="text-2xl font-bold tabular-nums text-white leading-none">{d.getDate()}</span>
      <span className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-violet-200/90">
        {d.toLocaleDateString("fr-FR", { month: "short" })}
      </span>
      <span className="mt-0.5 text-[11px] capitalize text-gray-400">{d.toLocaleDateString("fr-FR", { weekday: "short" })}</span>
      <span className="mt-2 text-[10px] text-gray-500 border-t border-white/10 pt-2 w-full">Fuseau : {browserTimezone}</span>
    </div>
  );
}

function MarkdownBody({ value, className }: { value: string; className?: string }) {
  if (!value?.trim()) {
    return <p className={`text-gray-400 ${className ?? ""}`}>Aucune description pour le moment.</p>;
  }
  return (
    <div className={className}>
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

  useEffect(() => {
    if (open) {
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
    const line2 = typeof window !== "undefined" ? `${window.location.origin}/events2` : "/events2";
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

  if (!open) return null;

  const locationDisplay = event.location ? buildEventLocationDisplay(event.location, locationLinks) : null;
  const fullWhen = formatEventDateTimeInTimezone(event.date, browserTimezone, "fr-FR").fullLabel;
  const seatsLine =
    typeof event.remainingSeats === "number"
      ? `${Math.max(0, event.remainingSeats)} place(s) restante(s)`
      : "Capacité : places ouvertes (sous réserve de l’organisateur)";

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4 transition-opacity duration-200 ${
        entered ? "opacity-100" : "opacity-0"
      }`}
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        aria-label="Fermer la fenêtre"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`relative z-10 flex max-h-[min(92dvh,900px)] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl border border-white/10 bg-[#0f0f14] shadow-[0_-8px_60px_rgba(0,0,0,0.5),0_0_0_1px_rgba(145,70,255,0.12)] sm:rounded-3xl transition-transform duration-200 ease-out ${
          entered ? "translate-y-0 sm:scale-100" : "translate-y-6 sm:scale-95"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative max-h-[38vh] min-h-[140px] shrink-0 overflow-hidden bg-[#0a0a0c] sm:max-h-[220px]">
          {event.image ? (
            <img src={event.image} alt="" className="h-full w-full object-cover object-center opacity-90" />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-violet-900/40 via-[#1a1025] to-[#0a0a0c]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f14] via-[#0f0f14]/80 to-transparent" />
          <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3 sm:p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${categoryBadgeClass}`}>{categoryLabel}</span>
              <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusBadge.className}`}>{statusBadge.label}</span>
              {isRegistered && !isPast && (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/35 bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-100">
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                  Inscrit(e)
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/15 bg-black/40 p-2 text-gray-200 backdrop-blur-md transition hover:border-white/30 hover:bg-black/60 hover:text-white"
              aria-label="Fermer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="absolute inset-x-0 bottom-0 p-3 sm:p-5">
            {urgencyLabel && !isPast && (
              <p className="mb-2 inline-flex items-center gap-1.5 rounded-lg border border-amber-400/25 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-100">
                <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden />
                {urgencyLabel}
              </p>
            )}
            <h2 id={titleId} className="text-xl font-bold leading-tight text-white sm:text-2xl md:text-3xl pr-4">
              {event.title}
            </h2>
            <p className="mt-1.5 text-sm text-gray-300/95 line-clamp-2 sm:line-clamp-none">
              <span className="text-violet-200/90">TENF</span> — moment communautaire, en visio ou en présentiel selon l’événement. Membres : pense
              à vérifier Discord pour les rappels.
            </p>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <div className="border-b border-white/8 bg-[#12121a]/90 px-3 py-3 sm:px-5">
            <div className="flex flex-wrap items-stretch gap-3">
              <DateHighlight iso={event.date} browserTimezone={browserTimezone} />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex items-start gap-2 text-sm text-gray-200">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-violet-300/90" aria-hidden />
                  <div>
                    <p className="font-medium text-white">{fullWhen}</p>
                    <EventDateTime startUtc={event.date} className="text-xs text-gray-400" />
                  </div>
                </div>
                {!isPast && (
                  <div className="flex items-center gap-2 text-xs text-emerald-200/90">
                    <Users className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    {seatsLine}
                  </div>
                )}
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={shareText}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/12 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-gray-200 transition hover:border-violet-400/40 hover:bg-white/10"
                  >
                    <Share2 className="h-3.5 w-3.5" aria-hidden />
                    {copied ? "Copié !" : "Partager / copier"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="px-2 pt-2 sm:px-4" role="tablist" aria-label="Sections du détail d’événement">
            <div className="flex gap-1 overflow-x-auto rounded-xl border border-white/8 bg-black/20 p-1 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:pb-1">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={tab === t.id}
                  onClick={() => setTab(t.id)}
                  className={`shrink-0 rounded-lg px-3 py-2 text-left text-xs font-semibold transition sm:text-sm ${
                    tab === t.id
                      ? "bg-violet-600 text-white shadow-[0_0_20px_rgba(145,70,255,0.25)]"
                      : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
                  }`}
                >
                  <span className="block">{t.label}</span>
                  <span className={`mt-0.5 block text-[10px] font-normal sm:text-xs ${tab === t.id ? "text-violet-100/80" : "text-gray-500"}`}>
                    {t.hint}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 px-4 py-4 sm:px-6 sm:py-5">
            {tab === "about" && (
              <div className="space-y-4 animate-fadeIn" role="tabpanel">
                <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/10 to-transparent p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-violet-100">
                    <HeartHandshake className="h-4 w-4" aria-hidden />
                    Pour le grand public & les membres
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-gray-300">
                    Ce calendrier centralise les temps forts de la communauté TENF. Les descriptions sont rédigées par l’équipe ou les animateurs :
                    n’hésite pas à relire les consignes avant le jour J.
                  </p>
                </div>
                <MarkdownBody
                  value={event.description || ""}
                  className="prose prose-invert max-w-none prose-p:my-2 prose-li:my-1 prose-headings:text-white prose-p:text-gray-200 prose-strong:text-white prose-em:text-gray-200 prose-a:text-[#a78bfa] prose-a:hover:text-[#c4b5fd] prose-ul:text-gray-200 prose-ol:text-gray-200 prose-li:text-gray-200"
                />
              </div>
            )}

            {tab === "infos" && (
              <div className="space-y-4 animate-fadeIn" role="tabpanel">
                <div className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <CalendarRange className="h-10 w-10 shrink-0 text-violet-300/80" aria-hidden />
                  <div>
                    <h3 className="text-sm font-semibold text-white">Quand</h3>
                    <p className="mt-1 text-sm text-gray-300">{fullWhen}</p>
                    <p className="mt-1 text-xs text-gray-500">Affiché selon le fuseau de ton navigateur ({browserTimezone}).</p>
                  </div>
                </div>

                <div className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <MapPin className="h-10 w-10 shrink-0 text-fuchsia-300/80" aria-hidden />
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-white">Lieu & accès</h3>
                    {locationDisplay ? (
                      <a
                        className="mt-1 inline-flex items-center gap-1 break-all text-sm text-[#a78bfa] hover:text-[#c4b5fd]"
                        href={locationDisplay.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {locationDisplay.label}
                        <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      </a>
                    ) : (
                      <p className="mt-1 text-sm text-gray-400">Lieu communiqué par l’organisateur (souvent salon vocal ou lien Discord).</p>
                    )}
                  </div>
                </div>

                <p className="text-xs text-gray-500">
                  Une question sur le déroulé ? Passe par{" "}
                  <Link href="/evenements-communautaires" className="text-violet-300 hover:underline" onClick={onClose}>
                    la page communautaire
                  </Link>{" "}
                  ou les annonces Discord.
                </p>
              </div>
            )}

            {tab === "participer" && (
              <div className="space-y-4 animate-fadeIn" role="tabpanel">
                {!hideRegistration && (
                  <div className="rounded-2xl border border-blue-500/25 bg-blue-500/10 p-4 text-sm text-blue-100/95">
                    <strong className="text-white">Membres TENF</strong> : connecte-toi avec ton compte pour t’inscrire ou te désinscrire. Le bouton
                    ci-dessous utilise ta session en cours.
                  </div>
                )}
                {hideRegistration && (
                  <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4 text-sm text-amber-100/95">
                    <strong className="text-white">Événement réservé ou masqué</strong> : certaines actions (lien public, places) peuvent être
                    limitées. Renseigne-toi sur Discord ou auprès du staff.
                  </div>
                )}

                <div className="grid gap-3 sm:grid-cols-2">
                  <a
                    href={calendarUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 rounded-2xl border border-white/12 bg-[#1a1a22] p-4 transition hover:border-violet-400/40 hover:bg-[#1f1f2a]"
                  >
                    <div className="rounded-xl bg-violet-500/20 p-2 text-violet-200">
                      <CalendarPlus className="h-6 w-6" aria-hidden />
                    </div>
                    <div>
                      <p className="font-semibold text-white">Ajouter au calendrier</p>
                      <p className="text-xs text-gray-400">Google Calendar — rappels sur téléphone ou bureau</p>
                    </div>
                  </a>

                  {event.ctaUrl && (
                    <a
                      href={event.ctaUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-3 rounded-2xl border border-white/12 bg-[#1a1a22] p-4 transition hover:border-violet-400/40 hover:bg-[#1f1f2a]"
                    >
                      <div className="rounded-xl bg-fuchsia-500/20 p-2 text-fuchsia-200">
                        <ExternalLink className="h-6 w-6" aria-hidden />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-white">{event.ctaLabel || "En savoir plus"}</p>
                        <p className="truncate text-xs text-gray-400">Lien fourni par l’organisateur</p>
                      </div>
                    </a>
                  )}
                </div>

                <div className="flex flex-col gap-2 border-t border-white/10 pt-4 sm:flex-row sm:flex-wrap">
                  {!isPast && !hideRegistration && (
                    <>
                      {isRegistered ? (
                        <button
                          type="button"
                          onClick={onUnregister}
                          disabled={actionLoading}
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600/90 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-600 disabled:opacity-50"
                        >
                          Me désinscrire
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={onRegister}
                          disabled={actionLoading}
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_0_24px_rgba(145,70,255,0.35)] transition hover:bg-violet-500 disabled:opacity-50"
                        >
                          <HeartHandshake className="h-4 w-4" aria-hidden />
                          Confirmer mon inscription
                        </button>
                      )}
                    </>
                  )}
                  {isPast && (
                    <span className="inline-flex items-center justify-center rounded-xl border border-gray-600 bg-[#15151c] px-5 py-3 text-sm text-gray-400">
                      Événement terminé — merci d’avoir participé !
                    </span>
                  )}
                </div>

                <div className="rounded-xl border border-white/8 bg-black/15 px-3 py-3 text-xs text-gray-500">
                  Pas encore membre ?{" "}
                  <Link href="/rejoindre/guide-public" className="text-violet-300 hover:underline" onClick={onClose}>
                    Découvre comment rejoindre TENF
                  </Link>
                  .
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { ArrowRight, Check, CheckCheck, ExternalLink, Loader2, Maximize2 } from "lucide-react";
import AnnouncementMarkdown from "@/components/ui/AnnouncementMarkdown";
import { classifyNotification } from "@/lib/notifications/classification";
import {
  formatAbsoluteFr,
  formatRelativeFr,
  isInternalLink,
  normalizeMemberNotificationLink,
} from "@/lib/notifications/format";
import type { NotificationItem } from "@/components/member/notifications/types";

type NotificationCardProps = {
  notification: NotificationItem;
  pending: boolean;
  onMarkRead: (id: string) => void;
  onOpenImage: (src: string, title: string) => void;
  /** Variante `prominent` : utilisée dans le panneau « À traiter ». */
  prominent?: boolean;
};

export default function NotificationCard({
  notification,
  pending,
  onMarkRead,
  onOpenImage,
  prominent,
}: NotificationCardProps) {
  const descriptor = classifyNotification(notification);
  const Icon = descriptor.icon;
  const rel = formatRelativeFr(notification.updatedAt);
  const abs = formatAbsoluteFr(notification.updatedAt);
  const actionHref = normalizeMemberNotificationLink(notification.link);
  const isInternal = isInternalLink(actionHref);

  const actionLabel = (() => {
    if (descriptor.category === "agenda") return "Voir l’événement";
    if (descriptor.category === "annonce") return "Ouvrir l’annonce";
    if (descriptor.category === "staff") return "Traiter dans l’admin";
    return "Ouvrir le lien";
  })();

  const handleLinkClick = () => {
    if (!notification.isRead) onMarkRead(notification.id);
  };

  const isAnnouncement = descriptor.category === "annonce";
  const hasImage = Boolean(notification.imageUrl);

  const baseShadow = notification.isRead
    ? "shadow-[0_2px_6px_rgba(0,0,0,0.18)]"
    : isAnnouncement
      ? "shadow-[0_10px_28px_rgba(180,83,9,0.12),0_4px_14px_rgba(0,0,0,0.2)]"
      : "shadow-[0_8px_22px_rgba(76,29,149,0.18)]";
  const stateBorder = notification.isRead
    ? isAnnouncement
      ? "border-amber-500/15 hover:border-amber-400/25"
      : "border-white/[0.06] hover:border-white/[0.14]"
    : prominent
      ? "border-rose-400/40 hover:border-rose-300/60"
      : isAnnouncement
        ? "border-amber-400/35 hover:border-amber-300/50"
        : "border-violet-400/35 hover:border-violet-300/55";

  /** Colonne image en % de la largeur de la carte (pas du viewport) → image à gauche même en grille 2 colonnes étroite. */
  const imageSideGrid =
    hasImage &&
    "grid-cols-[clamp(4.5rem,26%,10.5rem)_minmax(0,1fr)] items-start gap-x-[clamp(0.65rem,1.1vw,1rem)]";

  const announcementBg = isAnnouncement
    ? notification.isRead
      ? "linear-gradient(155deg, rgba(251,191,36,0.10) 0%, rgba(88,28,135,0.06) 42%, rgba(15,14,20,0.97) 72%, rgba(12,11,16,0.99) 100%)"
      : "linear-gradient(155deg, rgba(251,191,36,0.16) 0%, rgba(167,139,250,0.10) 38%, rgba(76,29,149,0.08) 58%, rgba(15,14,20,0.96) 85%)"
    : undefined;

  const defaultBg = !isAnnouncement
    ? notification.isRead
      ? undefined
      : prominent
        ? "linear-gradient(135deg, rgba(244,63,94,0.08) 0%, transparent 55%)"
        : "linear-gradient(135deg, rgba(139,92,246,0.08) 0%, transparent 55%)"
    : undefined;

  return (
    <article
      aria-labelledby={`notification-${notification.id}-title`}
      className={
        "group relative overflow-hidden rounded-2xl border transition-all duration-200 hover:-translate-y-[1px] " +
        stateBorder +
        " " +
        baseShadow
      }
      style={{
        backgroundColor: isAnnouncement ? "rgb(18, 16, 22)" : "var(--color-card)",
        backgroundImage: isAnnouncement ? announcementBg : defaultBg,
      }}
    >
      {!notification.isRead ? (
        <div
          className={
            "absolute inset-y-0 left-0 w-[3px] " +
            (prominent
              ? "bg-gradient-to-b from-rose-400 via-rose-500 to-rose-600"
              : isAnnouncement
                ? "bg-gradient-to-b from-amber-400 via-amber-500 to-orange-600"
                : "bg-gradient-to-b from-violet-400 via-fuchsia-500 to-violet-600")
          }
          aria-hidden
        />
      ) : null}

      {isAnnouncement && !prominent ? (
        <>
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-20 h-44 w-44 rounded-full bg-amber-400/22 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-20 -left-12 h-40 w-52 rounded-full bg-violet-500/18 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(251,191,36,0.12),transparent_55%)]"
          />
        </>
      ) : null}

      <div
        className={
          "relative z-[1] grid gap-y-[clamp(0.65rem,0.9vw,0.95rem)] px-[clamp(0.85rem,1.1vw,1.25rem)] py-[clamp(0.85rem,1vw,1.1rem)]" +
          (!notification.isRead ? " pl-[clamp(1rem,1.4vw,1.6rem)]" : "") +
          (hasImage ? ` ${imageSideGrid}` : "")
        }
      >
        {notification.imageUrl ? (
          <button
            type="button"
            className={
              "group/img relative block w-full shrink-0 overflow-hidden rounded-xl border text-left outline-none ring-offset-2 transition hover:opacity-95 focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] " +
              (isAnnouncement
                ? "border-amber-400/30 bg-gradient-to-b from-amber-500/10 to-black/40 shadow-[0_4px_20px_rgba(0,0,0,0.35)]"
                : "")
            }
            style={{ borderColor: isAnnouncement ? undefined : "var(--color-border)" }}
            aria-label={`Voir l’image en grand : ${notification.title}`}
            onClick={() => onOpenImage(notification.imageUrl as string, notification.title)}
          >
            <span className="pointer-events-none absolute inset-0 z-[1] flex items-center justify-center bg-black/0 opacity-0 transition group-hover/img:bg-black/35 group-hover/img:opacity-100">
              <span className="inline-flex items-center gap-1 rounded-lg bg-black/65 px-2 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
                <Maximize2 className="h-3 w-3" aria-hidden />
                Agrandir
              </span>
            </span>
            {/* Hauteur bornée : vignette à côté du texte sans allonger la carte comme un bandeau pleine largeur */}
            <div className="aspect-[3/4] w-full max-h-[min(13rem,38vh)] min-h-[5.5rem]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={notification.imageUrl} alt="" className="h-full w-full object-cover" />
            </div>
          </button>
        ) : null}

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={
                "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wider " +
                descriptor.chipClass
              }
            >
              <Icon className="h-3 w-3" aria-hidden />
              {descriptor.label}
            </span>
            {descriptor.actionable && !notification.isRead ? (
              <span className="inline-flex items-center rounded-full border border-rose-400/40 bg-rose-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-100">
                À traiter
              </span>
            ) : null}
            {!notification.isRead ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-fuchsia-600/85 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                <span className="h-1.5 w-1.5 rounded-full bg-white" aria-hidden />
                Non lu
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400/80">
                <Check className="h-3 w-3" aria-hidden />
                Lu
              </span>
            )}
            <time
              dateTime={notification.updatedAt}
              title={abs || undefined}
              className="ml-auto text-[11px] tabular-nums text-zinc-500"
            >
              {rel}
            </time>
          </div>

          <h3
            id={`notification-${notification.id}-title`}
            className="mt-2 text-pretty font-bold leading-snug tracking-tight"
            style={{
              color: "var(--color-text)",
              fontSize: prominent ? "clamp(1rem,1.2vw,1.15rem)" : "clamp(0.95rem,1.05vw,1.0625rem)",
            }}
          >
            {notification.title}
          </h3>

          <div
            className="mt-2 max-w-[78ch] text-pretty leading-relaxed"
            style={{
              color: "var(--color-text-secondary)",
              fontSize: "clamp(0.85rem,0.95vw,0.95rem)",
              lineHeight: 1.6,
            }}
          >
            {notification.bodyFormat === "markdown" ? (
              <AnnouncementMarkdown
                content={notification.message}
                className={
                  isAnnouncement
                    ? "prose-p:leading-relaxed prose-a:break-words prose-a:text-amber-200/95 hover:prose-a:text-amber-100 prose-strong:text-amber-50/95"
                    : "prose-p:leading-relaxed prose-a:break-words prose-a:text-violet-300 hover:prose-a:text-violet-200"
                }
              />
            ) : (
              <p className="whitespace-pre-wrap break-words">{notification.message}</p>
            )}
          </div>

          <div
            className={
              "mt-3 flex flex-wrap items-center gap-2 border-t pt-3 " +
              (isAnnouncement ? "border-amber-500/15" : "border-white/[0.06]")
            }
          >
            {actionHref ? (
              isInternal ? (
                <Link
                  href={actionHref}
                  onClick={handleLinkClick}
                  className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl px-3 py-1.5 text-[clamp(0.8rem,0.9vw,0.875rem)] font-bold text-white shadow-md transition hover:brightness-110"
                  style={{ backgroundColor: "var(--color-primary)" }}
                >
                  {actionLabel}
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              ) : (
                <a
                  href={actionHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleLinkClick}
                  className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl px-3 py-1.5 text-[clamp(0.8rem,0.9vw,0.875rem)] font-bold text-white shadow-md transition hover:brightness-110"
                  style={{ backgroundColor: "var(--color-primary)" }}
                >
                  {actionLabel}
                  <ExternalLink className="h-4 w-4" aria-hidden />
                </a>
              )
            ) : null}

            {!notification.isRead ? (
              <button
                type="button"
                onClick={() => onMarkRead(notification.id)}
                disabled={pending}
                className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[clamp(0.78rem,0.88vw,0.85rem)] font-semibold transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
                style={{ color: "var(--color-text)" }}
              >
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCheck className="h-4 w-4" aria-hidden />}
                Marquer comme lu
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}

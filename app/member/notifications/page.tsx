"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Bell,
  BellOff,
  CalendarClock,
  CheckCheck,
  ExternalLink,
  Heart,
  Loader2,
  Megaphone,
  Sparkles,
  User,
  X,
} from "lucide-react";
import MemberSurface from "@/components/member/ui/MemberSurface";
import MemberPageHeader from "@/components/member/ui/MemberPageHeader";
import AnnouncementMarkdown from "@/components/ui/AnnouncementMarkdown";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  createdAt: string;
  updatedAt: string;
  isRead: boolean;
  imageUrl?: string | null;
  bodyFormat?: "markdown" | "plain";
}

function formatRelativeFr(iso: string): string {
  const d = new Date(iso);
  const t = d.getTime();
  if (Number.isNaN(t)) return "";
  const diffSec = Math.floor((Date.now() - t) / 1000);
  if (diffSec < 45) return "À l’instant";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `Il y a ${diffHr} h`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay === 1) return "Hier";
  if (diffDay < 7) return `Il y a ${diffDay} j`;
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function absoluteDateFr(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function notificationKind(type: string): {
  label: string;
  Icon: typeof Megaphone;
  chipClass: string;
} {
  switch (type) {
    case "server_announcement":
      return {
        label: "Pour tout le monde",
        Icon: Megaphone,
        chipClass:
          "border-amber-400/30 bg-amber-500/[0.09] text-amber-100/95 ring-1 ring-amber-400/12",
      };
    case "profile_validation_pending":
      return {
        label: "Côté organisation",
        Icon: User,
        chipClass:
          "border-violet-400/30 bg-violet-500/[0.1] text-violet-100/90 ring-1 ring-violet-400/15",
      };
    case "registration_reminder_eve":
    case "registration_reminder_day":
      return {
        label: "Ton agenda",
        Icon: CalendarClock,
        chipClass:
          "border-sky-400/30 bg-sky-500/[0.09] text-sky-100/95 ring-1 ring-sky-400/12",
      };
    default:
      return {
        label: "Pour toi",
        Icon: Bell,
        chipClass:
          "border-white/12 bg-white/[0.05] text-zinc-200 ring-1 ring-white/8",
      };
  }
}

function NotificationsLoadingSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Chargement des notifications">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="animate-pulse rounded-2xl border border-white/[0.06] bg-[var(--color-card)] p-5 sm:p-6"
          style={{ borderColor: "var(--color-border)" }}
        >
          <div className="mb-4 flex gap-3">
            <div className="h-9 w-24 rounded-full bg-white/10" />
            <div className="h-4 flex-1 rounded bg-white/10" />
          </div>
          <div className="space-y-2">
            <div className="h-5 w-4/5 max-w-md rounded bg-white/[0.08]" />
            <div className="h-4 w-full rounded bg-white/[0.05]" />
            <div className="h-4 w-[92%] rounded bg-white/[0.05]" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function MemberNotificationsPage() {
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [hasAdminAccess, setHasAdminAccess] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [lightbox, setLightbox] = useState<{ src: string; title: string } | null>(null);
  const [listFilter, setListFilter] = useState<"all" | "unread">("all");

  const unreadCount = useMemo(() => notifications.filter((item) => !item.isRead).length, [notifications]);

  const displayedNotifications = useMemo(() => {
    if (listFilter === "unread") return notifications.filter((n) => !n.isRead);
    return notifications;
  }, [notifications, listFilter]);

  const notifySidebarRefresh = useCallback(() => {
    window.dispatchEvent(new CustomEvent("member-notifications-refresh"));
  }, []);

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/members/me/notifications", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Erreur lors du chargement des notifications");
      }
      const data = await response.json();
      setHasAdminAccess(Boolean(data?.hasAdminAccess));
      setNotifications(Array.isArray(data?.notifications) ? data.notifications : []);
      notifySidebarRefresh();
    } catch (error) {
      console.error("[member/notifications] load error:", error);
      setNotifications([]);
      setHasAdminAccess(false);
    } finally {
      setLoading(false);
    }
  }, [notifySidebarRefresh]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    if (!lightbox) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setLightbox(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox]);

  async function markAsRead(notificationId: string) {
    try {
      setActioningId(notificationId);
      const response = await fetch("/api/members/me/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId }),
      });
      if (!response.ok) throw new Error("Erreur lors du marquage");
      const data = await response.json();
      setNotifications(Array.isArray(data?.notifications) ? data.notifications : []);
      notifySidebarRefresh();
    } catch (error) {
      console.error("[member/notifications] mark read error:", error);
    } finally {
      setActioningId(null);
    }
  }

  async function markAllAsRead() {
    try {
      setActioningId("all");
      const response = await fetch("/api/members/me/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });
      if (!response.ok) throw new Error("Erreur lors du marquage global");
      const data = await response.json();
      setNotifications(Array.isArray(data?.notifications) ? data.notifications : []);
      notifySidebarRefresh();
    } catch (error) {
      console.error("[member/notifications] mark all read error:", error);
    } finally {
      setActioningId(null);
    }
  }

  if (loading) {
    return (
      <MemberSurface>
        <MemberPageHeader
          title="Tes nouvelles"
          description="On charge ce que la communauté t’a envoyé…"
        />
        <NotificationsLoadingSkeleton />
      </MemberSurface>
    );
  }

  if (notifications.length === 0) {
    return (
      <MemberSurface>
        <MemberPageHeader
          title="Tes nouvelles"
          description={
            hasAdminAccess
              ? "Quand il se passe quelque chose d’important pour toi ou pour la communauté, c’est ici."
              : "Les annonces de la New Family et les infos utiles pour toi apparaîtront ici."
          }
        />
        <section
          className="relative overflow-hidden rounded-2xl border px-6 py-16 text-center sm:px-10 sm:py-20"
          style={{
            borderColor: "var(--color-border)",
            background:
              "linear-gradient(165deg, rgba(145,70,255,0.08) 0%, var(--color-card) 45%, rgba(15,15,20,0.98) 100%)",
          }}
        >
          <div
            className="pointer-events-none absolute -left-24 top-0 h-64 w-64 rounded-full opacity-40 blur-3xl"
            style={{ background: "rgba(145, 70, 255, 0.22)" }}
          />
          <div
            className="pointer-events-none absolute -right-20 bottom-0 h-56 w-56 rounded-full opacity-30 blur-3xl"
            style={{ background: "rgba(206, 25, 70, 0.12)" }}
          />
          <div className="relative mx-auto flex max-w-md flex-col items-center">
            <div
              className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-violet-500/30 bg-violet-500/10 shadow-[0_0_40px_rgba(145,70,255,0.15)]"
              aria-hidden
            >
              <BellOff className="h-8 w-8 text-violet-300/90" strokeWidth={1.75} />
            </div>
            <h2 className="text-xl font-bold tracking-tight" style={{ color: "var(--color-text)" }}>
              Rien pour l’instant — et c’est ok
            </h2>
            <p className="mt-3 text-sm leading-relaxed sm:text-[15px]" style={{ color: "var(--color-text-secondary)" }}>
              {hasAdminAccess
                ? "Dès qu’il y a une annonce ou une action à voir pour toi, tu la retrouveras ici sans rien chercher."
                : "Quand la communauté aura quelque chose à te dire, tu le verras ici en premier."}
            </p>
            <div className="mt-8 flex items-start gap-2.5 rounded-xl border border-white/[0.06] bg-black/20 px-4 py-3 text-left text-xs leading-snug text-zinc-400 sm:text-[13px]">
              <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-400/90" aria-hidden />
              <span>
                Astuce : si ton navigateur te le propose, tu peux autoriser les notifications — pratique pour ne rien
                manquer.
              </span>
            </div>
          </div>
        </section>
      </MemberSurface>
    );
  }

  return (
    <MemberSurface>
      <MemberPageHeader
        title="Tes nouvelles"
        description={
          hasAdminAccess
            ? "Tout ce qui concerne la communauté — et parfois des petites actions côté orga — au même endroit, pour toi."
            : "Un seul endroit pour les annonces et les rappels de la New Family, rédigés pour les membres."
        }
      />

      <p
        className="-mt-2 mb-2 max-w-2xl text-sm leading-relaxed sm:text-[15px]"
        style={{ color: "var(--color-text-secondary)" }}
      >
        <Heart
          className="mr-1.5 inline-block h-3.5 w-3.5 text-fuchsia-400/90 align-[-0.12em]"
          aria-hidden
          strokeWidth={2}
        />
        Prends le temps de lire tranquillement : rien n’est urgent comme un DM Discord, tout reste disponible ici.
      </p>

      {/* Résumé + filtres — ton convivial */}
      <section className="relative overflow-hidden rounded-2xl border shadow-[0_16px_40px_rgba(0,0,0,0.2)] sm:rounded-[1.25rem]">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.55]"
          style={{
            background:
              "radial-gradient(ellipse 90% 80% at 15% 0%, rgba(145,70,255,0.14), transparent 55%), radial-gradient(ellipse 70% 60% at 95% 100%, rgba(206,25,70,0.08), transparent 50%)",
          }}
        />
        <div
          className="relative border-b border-white/[0.06] px-4 py-4 sm:px-6 sm:py-5"
          style={{ backgroundColor: "var(--color-card)" }}
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-violet-500/25 bg-violet-500/15 shadow-inner shadow-violet-900/20"
                aria-hidden
              >
                <Bell className="h-5 w-5 text-violet-300" strokeWidth={2} />
              </div>
              <div>
                <p className="text-[15px] font-semibold" style={{ color: "var(--color-text)" }}>
                  {unreadCount > 0 ? (
                    <>
                      Tu as <span className="tabular-nums text-violet-200">{unreadCount}</span> message
                      {unreadCount > 1 ? "s" : ""} à parcourir
                    </>
                  ) : (
                    "Tu es à jour"
                  )}
                </p>
                <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                  {notifications.length} au total dans ton fil
                </p>
              </div>
              {unreadCount > 0 ? (
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-40" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-violet-400 shadow-[0_0_12px_rgba(167,139,250,0.9)]" />
                </span>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div
                className="inline-flex rounded-xl border p-1"
                style={{ borderColor: "var(--color-border)", backgroundColor: "rgba(0,0,0,0.2)" }}
                role="group"
                aria-label="Afficher les messages"
              >
                <button
                  type="button"
                  onClick={() => setListFilter("all")}
                  className={`rounded-lg px-3.5 py-2 text-[13px] font-medium transition sm:px-4 sm:text-sm ${
                    listFilter === "all"
                      ? "bg-white/10 text-white shadow-sm"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  Tout afficher
                </button>
                <button
                  type="button"
                  onClick={() => setListFilter("unread")}
                  className={`rounded-lg px-3.5 py-2 text-[13px] font-medium transition sm:px-4 sm:text-sm ${
                    listFilter === "unread"
                      ? "bg-violet-600/90 text-white shadow-md shadow-violet-900/30"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  Seulement à lire
                </button>
              </div>

              <button
                type="button"
                onClick={() => void markAllAsRead()}
                disabled={unreadCount === 0 || actioningId === "all"}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-900/25 transition hover:brightness-110 disabled:pointer-events-none disabled:opacity-45"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                {actioningId === "all" ? <Loader2 size={16} className="animate-spin" /> : <CheckCheck size={16} />}
                Tout marquer comme lu
              </button>
            </div>
          </div>
        </div>
      </section>

      {lightbox ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-label="Image en grand"
          onClick={() => setLightbox(null)}
        >
          <button
            type="button"
            className="absolute right-4 top-4 z-[101] rounded-full border border-white/10 bg-white/10 p-2.5 text-white transition hover:bg-white/20"
            aria-label="Fermer"
            onClick={(e) => {
              e.stopPropagation();
              setLightbox(null);
            }}
          >
            <X size={22} />
          </button>
          <div className="max-h-[min(92vh,920px)] max-w-[min(96vw,1200px)] overflow-auto" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightbox.src}
              alt={lightbox.title}
              className="mx-auto max-h-[min(92vh,920px)] w-auto max-w-full rounded-xl object-contain shadow-2xl ring-1 ring-white/10"
            />
          </div>
        </div>
      ) : null}

      {displayedNotifications.length === 0 && notifications.length > 0 ? (
        <section
          className="rounded-2xl border border-dashed px-6 py-12 text-center"
          style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
        >
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Avec ce filtre, il n’y a plus rien à lire pour l’instant.
          </p>
          <button
            type="button"
            onClick={() => setListFilter("all")}
            className="mt-4 text-sm font-semibold text-violet-400 underline-offset-4 hover:text-violet-300 hover:underline"
          >
            Revoir tout le fil
          </button>
        </section>
      ) : (
        <section className="space-y-4 sm:space-y-5">
          {displayedNotifications.map((notification) => {
            const kind = notificationKind(notification.type);
            const KindIcon = kind.Icon;
            const rel = formatRelativeFr(notification.updatedAt);
            const abs = absoluteDateFr(notification.updatedAt);

            return (
              <article
                key={notification.id}
                className={`group relative overflow-hidden rounded-2xl border transition duration-300 sm:rounded-[1.25rem] ${
                  notification.isRead
                    ? "border-white/[0.07] opacity-[0.98] hover:border-white/[0.12]"
                    : "border-violet-400/30 shadow-[0_0_0_1px_rgba(167,139,250,0.12),0_18px_40px_rgba(0,0,0,0.22)] hover:border-violet-400/40"
                }`}
                style={{
                  backgroundColor: "var(--color-card)",
                  backgroundImage: notification.isRead
                    ? undefined
                    : "linear-gradient(135deg, rgba(145,70,255,0.07) 0%, transparent 42%)",
                }}
              >
                {!notification.isRead ? (
                  <div
                    className="absolute bottom-0 left-0 top-0 w-[3px] bg-gradient-to-b from-violet-400 via-fuchsia-500 to-violet-600 opacity-90"
                    aria-hidden
                  />
                ) : null}

                <div className={`relative px-4 py-5 sm:px-7 sm:py-6 ${!notification.isRead ? "pl-5 sm:pl-8" : ""}`}>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] font-medium ${kind.chipClass}`}
                        >
                          <KindIcon className="h-3.5 w-3.5 opacity-85" aria-hidden />
                          {kind.label}
                        </span>
                        {!notification.isRead ? (
                          <span className="rounded-full bg-fuchsia-600/85 px-2.5 py-0.5 text-[11px] font-semibold text-white shadow-sm shadow-fuchsia-950/30">
                            À lire
                          </span>
                        ) : (
                          <span className="text-[12px] font-medium text-zinc-500">Déjà lu</span>
                        )}
                      </div>

                      <h2
                        className="text-lg font-bold leading-snug tracking-tight sm:text-xl"
                        style={{ color: "var(--color-text)" }}
                      >
                        {notification.title}
                      </h2>

                      {notification.imageUrl ? (
                        <button
                          type="button"
                          className="group/img relative block w-full max-w-xl overflow-hidden rounded-xl border text-left outline-none ring-offset-2 transition hover:opacity-[0.98] focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                          style={{ borderColor: "var(--color-border)" }}
                          title="Voir l’image en grand"
                          aria-label={`Voir l’image en grand : ${notification.title}`}
                          onClick={() =>
                            setLightbox({
                              src: notification.imageUrl as string,
                              title: notification.title,
                            })
                          }
                        >
                          <span className="pointer-events-none absolute inset-0 z-[1] flex items-center justify-center bg-black/0 opacity-0 transition group-hover/img:bg-black/30 group-hover/img:opacity-100">
                            <span className="rounded-lg bg-black/60 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
                              Agrandir l’image
                            </span>
                          </span>
                          <div className="aspect-video w-full">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={notification.imageUrl} alt="" className="h-full w-full object-cover" />
                          </div>
                        </button>
                      ) : null}

                      <div
                        className="text-[15px] leading-relaxed sm:text-base sm:leading-[1.65]"
                        style={{ color: "var(--color-text-secondary)" }}
                      >
                        {notification.bodyFormat === "markdown" ? (
                          <AnnouncementMarkdown
                            content={notification.message}
                            className="prose-p:leading-relaxed prose-a:text-violet-400 prose-a:no-underline hover:prose-a:underline"
                          />
                        ) : (
                          <p className="whitespace-pre-wrap">{notification.message}</p>
                        )}
                      </div>

                      <p className="text-xs tabular-nums text-zinc-500">
                        <time dateTime={notification.updatedAt} title={abs || undefined}>
                          {rel}
                        </time>
                        {abs ? <span className="sr-only"> ({abs})</span> : null}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2 border-t border-white/[0.06] pt-5 sm:gap-3">
                    {notification.link ? (
                      <Link
                        href={notification.link}
                        className="inline-flex min-h-[44px] items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:brightness-110"
                        style={{ backgroundColor: "var(--color-primary)" }}
                      >
                        Voir le lien
                        <ExternalLink className="h-4 w-4 opacity-90" aria-hidden />
                      </Link>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => void markAsRead(notification.id)}
                      disabled={notification.isRead || actioningId === notification.id}
                      className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-45"
                      style={{ color: "var(--color-text)" }}
                    >
                      {actioningId === notification.id ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <CheckCheck size={16} className="opacity-80" />
                      )}
                      {notification.isRead ? "C’est bon, j’ai lu" : "J’ai fini de lire"}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </MemberSurface>
  );
}

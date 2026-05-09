"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

type TimeBucket = "today" | "week" | "older";

function getTimeBucket(iso: string): TimeBucket {
  const d = new Date(iso);
  const t = d.getTime();
  if (Number.isNaN(t)) return "older";
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  if (t >= startOfToday) return "today";
  const diffDays = Math.floor((startOfToday - t) / (1000 * 60 * 60 * 24));
  if (diffDays <= 7) return "week";
  return "older";
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
  const [listFilter, setListFilter] = useState<"unread" | "read">("unread");
  const [typeFilter, setTypeFilter] = useState<"all" | "agenda" | "annonces" | "compte">("all");
  const [query, setQuery] = useState("");
  const [autoReadDone, setAutoReadDone] = useState(false);
  const autoReadOnceRef = useRef(false);

  const unreadCount = useMemo(() => notifications.filter((item) => !item.isRead).length, [notifications]);
  const readCount = useMemo(() => notifications.filter((item) => item.isRead).length, [notifications]);
  const unreadAgendaCount = useMemo(
    () =>
      notifications.filter(
        (item) => !item.isRead && (item.type === "registration_reminder_eve" || item.type === "registration_reminder_day"),
      ).length,
    [notifications],
  );
  const unreadAnnouncementsCount = useMemo(
    () => notifications.filter((item) => !item.isRead && item.type === "server_announcement").length,
    [notifications],
  );
  const unreadAccountCount = useMemo(
    () =>
      notifications.filter(
        (item) =>
          !item.isRead &&
          item.type !== "server_announcement" &&
          item.type !== "registration_reminder_eve" &&
          item.type !== "registration_reminder_day",
      ).length,
    [notifications],
  );

  const displayedNotifications = useMemo(() => {
    let list = notifications;
    list = listFilter === "unread" ? list.filter((n) => !n.isRead) : list.filter((n) => n.isRead);
    if (typeFilter === "agenda") {
      list = list.filter((n) => n.type === "registration_reminder_eve" || n.type === "registration_reminder_day");
    } else if (typeFilter === "annonces") {
      list = list.filter((n) => n.type === "server_announcement");
    } else if (typeFilter === "compte") {
      list = list.filter((n) => n.type !== "server_announcement" && n.type !== "registration_reminder_eve" && n.type !== "registration_reminder_day");
    }
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((n) => n.title.toLowerCase().includes(q) || n.message.toLowerCase().includes(q));
  }, [notifications, listFilter, query, typeFilter]);

  const groupedNotifications = useMemo(() => {
    const sorted = [...displayedNotifications].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return {
      today: sorted.filter((n) => getTimeBucket(n.updatedAt) === "today"),
      week: sorted.filter((n) => getTimeBucket(n.updatedAt) === "week"),
      older: sorted.filter((n) => getTimeBucket(n.updatedAt) === "older"),
    };
  }, [displayedNotifications]);

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

  useEffect(() => {
    if (loading) return;
    if (autoReadOnceRef.current) return;
    if (unreadCount <= 0) return;
    autoReadOnceRef.current = true;
    void (async () => {
      await markAllAsRead();
      setAutoReadDone(true);
    })();
  }, [loading, unreadCount]); // eslint-disable-line react-hooks/exhaustive-deps

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
      <section
        className="relative overflow-hidden rounded-2xl border px-4 py-5 shadow-[0_18px_45px_rgba(0,0,0,0.24)] sm:px-6 sm:py-6"
        style={{
          borderColor: "rgba(145,70,255,0.32)",
          background:
            "linear-gradient(145deg, rgba(145,70,255,0.18) 0%, rgba(20,16,35,0.92) 45%, rgba(13,13,19,0.95) 100%)",
        }}
      >
        <div className="pointer-events-none absolute -top-14 -left-12 h-48 w-48 rounded-full bg-violet-500/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -right-10 h-44 w-44 rounded-full bg-fuchsia-500/15 blur-3xl" />
        <div className="relative">
          <div className="mb-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-300/35 bg-violet-500/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.11em] text-violet-100/95">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              Espace membre
            </span>
          </div>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-violet-300/30 bg-violet-500/15 text-violet-100">
                  <Bell className="h-5 w-5" aria-hidden />
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Tes nouvelles</h1>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-zinc-200 sm:text-[15px]">
                {hasAdminAccess
                  ? "Ton fil membre TENF : annonces de la communauté, rappels d’événements et informations utiles au quotidien."
                  : "Un espace simple pour retrouver les annonces de TENF, les rappels d’événements et les infos importantes."}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-violet-100/90">
                <Heart className="mr-1.5 inline-block h-3.5 w-3.5 align-[-0.12em]" aria-hidden strokeWidth={2} />
                Prends deux minutes pour parcourir ton fil : tout reste ici, au calme, pour ne rien rater.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-violet-300/35 bg-violet-500/18 px-3 py-1.5 text-xs font-semibold text-violet-100">
                {listFilter === "unread" ? "Focus non lues" : "Historique lu"}
              </span>
              <span className="rounded-full border border-fuchsia-300/30 bg-fuchsia-500/15 px-3 py-1.5 text-xs font-semibold text-fuchsia-100 tabular-nums">
                {unreadCount} à lire
              </span>
              <span className="rounded-full border border-white/20 bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-zinc-100 tabular-nums">
                {notifications.length} au total
              </span>
            </div>
          </div>
        </div>
      </section>

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
                  onClick={() => setListFilter("unread")}
                  className={`rounded-lg px-3.5 py-2 text-[13px] font-medium transition sm:px-4 sm:text-sm ${
                    listFilter === "unread"
                      ? "bg-white/10 text-white shadow-sm"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  Non lues
                  <span className="ml-1.5 rounded-full bg-black/25 px-1.5 py-0.5 text-[11px] tabular-nums">{unreadCount}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setListFilter("read")}
                  className={`rounded-lg px-3.5 py-2 text-[13px] font-medium transition sm:px-4 sm:text-sm ${
                    listFilter === "read"
                      ? "bg-violet-600/90 text-white shadow-md shadow-violet-900/30"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  Anciennes (déjà lues)
                  <span className="ml-1.5 rounded-full bg-black/25 px-1.5 py-0.5 text-[11px] tabular-nums">{readCount}</span>
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

      {autoReadDone ? (
        <section
          className="rounded-xl border px-4 py-3 text-sm"
          style={{
            borderColor: "rgba(99, 102, 241, 0.35)",
            backgroundColor: "rgba(99, 102, 241, 0.12)",
            color: "var(--color-text)",
          }}
        >
          Ta page est ouverte : tes nouvelles ont été marquées comme lues automatiquement.
        </section>
      ) : null}

      <section className="rounded-2xl border p-4 sm:p-5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
        <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { label: "À lire", value: unreadCount, tone: "text-violet-200 border-violet-400/30 bg-violet-500/12" },
            { label: "Déjà lues", value: readCount, tone: "text-zinc-200 border-white/15 bg-white/[0.05]" },
            { label: "Agenda", value: unreadAgendaCount, tone: "text-sky-200 border-sky-400/30 bg-sky-500/12" },
            { label: "Annonces", value: unreadAnnouncementsCount, tone: "text-amber-100 border-amber-400/30 bg-amber-500/[0.11]" },
          ].map((cell) => (
            <div key={cell.label} className={`rounded-xl border px-3 py-2 ${cell.tone}`}>
              <p className="text-[11px] uppercase tracking-wide">{cell.label}</p>
              <p className="mt-1 text-lg font-semibold tabular-nums">{cell.value}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {(
            [
              { id: "agenda" as const, label: "Agenda", hint: "Rappels d’événements", count: unreadAgendaCount },
              { id: "annonces" as const, label: "Annonces", hint: "Infos communauté", count: unreadAnnouncementsCount },
              { id: "compte" as const, label: "Compte", hint: "Nouvelles personnelles", count: unreadAccountCount },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTypeFilter((prev) => (prev === item.id ? "all" : item.id))}
              className={`rounded-xl border p-3 text-left transition ${
                typeFilter === item.id ? "border-violet-400/45 bg-violet-500/12" : "border-white/[0.08] bg-black/20 hover:border-violet-400/30"
              }`}
            >
              <p className="text-sm font-semibold text-white">{item.label}</p>
              <p className="mt-0.5 text-xs text-zinc-400">{item.hint}</p>
              <p className="mt-2 text-xs font-semibold text-violet-200">{item.count} non lu{item.count > 1 ? "s" : ""}</p>
            </button>
          ))}
        </div>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher une nouvelle..."
            className="w-full rounded-xl border px-3.5 py-2.5 text-sm"
            style={{ borderColor: "var(--color-border)", backgroundColor: "rgba(0,0,0,0.22)", color: "var(--color-text)" }}
          />
          {(typeFilter !== "all" || query.trim().length > 0 || listFilter !== "unread") && (
            <button
              type="button"
              onClick={() => {
                setTypeFilter("all");
                setQuery("");
                setListFilter("unread");
              }}
              className="rounded-xl border px-3.5 py-2.5 text-xs font-semibold text-zinc-300 transition hover:border-violet-400/35 hover:text-white"
              style={{ borderColor: "var(--color-border)", backgroundColor: "rgba(0,0,0,0.2)" }}
            >
              Réinitialiser
            </button>
          )}
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
            {listFilter === "unread"
              ? "Tu as tout lu pour le moment. 🎉"
              : "Aucune ancienne nouvelle à afficher avec ce filtre."}
          </p>
          <button
            type="button"
            onClick={() => setListFilter(listFilter === "unread" ? "read" : "unread")}
            className="mt-4 text-sm font-semibold text-violet-400 underline-offset-4 hover:text-violet-300 hover:underline"
          >
            {listFilter === "unread" ? "Voir mes anciennes nouvelles" : "Revenir aux non lues"}
          </button>
        </section>
      ) : (
        <section className="space-y-4 sm:space-y-5">
          {(
            [
              { key: "today" as const, title: "Aujourd’hui", items: groupedNotifications.today },
              { key: "week" as const, title: "Cette semaine", items: groupedNotifications.week },
              { key: "older" as const, title: "Plus ancien", items: groupedNotifications.older },
            ] as const
          ).map((group) => (
            group.items.length > 0 ? (
              <div key={group.key} className="space-y-3">
                <div className="sticky top-[72px] z-10 inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#0e0e13]/85 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-zinc-300 backdrop-blur">
                  {group.title}
                  <span className="tabular-nums text-zinc-500">{group.items.length}</span>
                </div>
                {group.items.map((notification) => {
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
              </div>
            ) : null
          ))}
        </section>
      )}
    </MemberSurface>
  );
}

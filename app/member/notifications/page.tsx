"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Bell, BellOff, CheckCheck, Loader2 } from "lucide-react";
import MemberSurface from "@/components/member/ui/MemberSurface";
import MemberPageHeader from "@/components/member/ui/MemberPageHeader";
import EmptyFeatureCard from "@/components/member/ui/EmptyFeatureCard";
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

export default function MemberNotificationsPage() {
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [hasAdminAccess, setHasAdminAccess] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const unreadCount = useMemo(() => notifications.filter((item) => !item.isRead).length, [notifications]);

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
        <MemberPageHeader title="Mes notifications" description="Centre de notifications de ton espace membre." />
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--color-primary)" }} />
        </div>
      </MemberSurface>
    );
  }

  if (notifications.length === 0) {
    return (
      <MemberSurface>
        <MemberPageHeader
          title="Mes notifications"
          description={
            hasAdminAccess
              ? "Alertes administration et annonces serveur."
              : "Annonces communautaires TENF (connexion Discord requise)."
          }
        />
        <EmptyFeatureCard
          title="Aucune notification active"
          description={
            hasAdminAccess
              ? "Rien à afficher pour l’instant (validations de profils, annonces, etc.)."
              : "Tu seras notifié ici lors des annonces à destination de tous les membres."
          }
          icon={BellOff}
        />
      </MemberSurface>
    );
  }

  return (
    <MemberSurface>
      <MemberPageHeader
        title="Mes notifications"
        description={
          hasAdminAccess
            ? "Validations profils, alertes admin et annonces serveur (Markdown)."
            : "Annonces TENF pour tous les membres connectés."
        }
      />

      <section className="rounded-xl border p-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Bell size={18} style={{ color: "var(--color-primary)" }} />
            <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
              {unreadCount > 0
                ? `${unreadCount} notification${unreadCount > 1 ? "s" : ""} non lue${unreadCount > 1 ? "s" : ""}`
                : "Toutes les notifications sont lues"}
            </p>
          </div>
          <button
            onClick={() => void markAllAsRead()}
            disabled={unreadCount === 0 || actioningId === "all"}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            {actioningId === "all" ? <Loader2 size={14} className="animate-spin" /> : <CheckCheck size={14} />}
            Tout marquer comme lu
          </button>
        </div>
      </section>

      <section className="space-y-3">
        {notifications.map((notification) => (
          <article
            key={notification.id}
            className="rounded-xl border p-4"
            style={{
              borderColor: notification.isRead ? "var(--color-border)" : "var(--color-primary)",
              backgroundColor: "var(--color-card)",
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-semibold" style={{ color: "var(--color-text)" }}>
                  {notification.title}
                </h2>
                {notification.imageUrl ? (
                  <div
                    className="relative mt-3 aspect-video max-w-xl overflow-hidden rounded-lg border"
                    style={{ borderColor: "var(--color-border)" }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={notification.imageUrl} alt="" className="h-full w-full object-cover" />
                  </div>
                ) : null}
                <div className="mt-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                  {notification.bodyFormat === "markdown" ? (
                    <AnnouncementMarkdown content={notification.message} className="prose-sm" />
                  ) : (
                    <p className="whitespace-pre-wrap">{notification.message}</p>
                  )}
                </div>
                <p className="mt-2 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                  Mise à jour : {new Date(notification.updatedAt).toLocaleString("fr-FR")}
                </p>
              </div>
              {!notification.isRead ? (
                <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full bg-red-500" title="Non lue" />
              ) : null}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              {notification.link ? (
                <Link
                  href={notification.link}
                  className="inline-flex rounded-lg px-3 py-2 text-sm font-medium text-white"
                  style={{ backgroundColor: "var(--color-primary)" }}
                >
                  Ouvrir
                </Link>
              ) : null}
              <button
                type="button"
                onClick={() => void markAsRead(notification.id)}
                disabled={notification.isRead || actioningId === notification.id}
                className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm disabled:opacity-50"
                style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
              >
                {actioningId === notification.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCheck size={14} />}
                {notification.isRead ? "Déjà lue" : "Marquer comme lue"}
              </button>
            </div>
          </article>
        ))}
      </section>
    </MemberSurface>
  );
}

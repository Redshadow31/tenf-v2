"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Bell, X } from "lucide-react";

/**
 * Espace membre public : préfixe (n) sur le titre d’onglet, bannière globale, événement de compteur pour le header.
 */
export default function MemberGlobalNotificationHint() {
  const { status } = useSession();
  const pathname = usePathname();
  const [unread, setUnread] = useState(0);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const fetchUnread = useCallback(async () => {
    if (status !== "authenticated") return;
    try {
      const r = await fetch("/api/members/me/notifications", { cache: "no-store" });
      if (!r.ok) {
        setUnread(0);
        window.dispatchEvent(new CustomEvent("member-notifications-count", { detail: { count: 0 } }));
        return;
      }
      const data = await r.json();
      const n = Number(data?.unreadCount || 0);
      setUnread(n);
      window.dispatchEvent(new CustomEvent("member-notifications-count", { detail: { count: n } }));
    } catch {
      /* ignore */
    }
  }, [status]);

  useEffect(() => {
    if (status !== "authenticated") {
      setUnread(0);
      return;
    }
    void fetchUnread();
  }, [status, fetchUnread]);

  useEffect(() => {
    const onRefresh = () => void fetchUnread();
    window.addEventListener("member-notifications-refresh", onRefresh);
    return () => window.removeEventListener("member-notifications-refresh", onRefresh);
  }, [fetchUnread]);

  useEffect(() => {
    const onCount = (e: Event) => {
      const ce = e as CustomEvent<{ count?: number }>;
      if (typeof ce.detail?.count === "number") setUnread(ce.detail.count);
    };
    window.addEventListener("member-notifications-count", onCount);
    return () => window.removeEventListener("member-notifications-count", onCount);
  }, []);

  useEffect(() => {
    if (unread === 0) setBannerDismissed(false);
  }, [unread]);

  useEffect(() => {
    if (status !== "authenticated") {
      document.title = document.title.replace(/^\(\d+\)\s*/, "");
      return;
    }

    const strip = (t: string) => t.replace(/^\(\d+\)\s*/, "");
    const apply = () => {
      const base = strip(document.title);
      document.title = unread > 0 ? `(${unread}) ${base}` : base;
    };

    const id = requestAnimationFrame(apply);
    const t = window.setTimeout(apply, 220);
    return () => {
      cancelAnimationFrame(id);
      clearTimeout(t);
    };
  }, [status, unread, pathname]);

  useEffect(() => {
    return () => {
      document.title = document.title.replace(/^\(\d+\)\s*/, "");
    };
  }, []);

  if (status !== "authenticated" || unread === 0 || bannerDismissed) {
    return null;
  }

  const label =
    unread === 1 ? "Vous avez 1 notification non lue." : `Vous avez ${unread} notifications non lues.`;

  return (
    <div
      role="status"
      className="border-b px-3 py-2.5 sm:px-6"
      style={{
        borderColor: "rgba(145, 70, 255, 0.35)",
        background: "linear-gradient(90deg, rgba(145, 70, 255, 0.18), rgba(99, 102, 241, 0.12))",
      }}
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-3 text-center sm:text-left">
        <div className="flex items-center gap-2 text-sm font-medium" style={{ color: "var(--color-text)" }}>
          <Bell className="h-4 w-4 shrink-0 text-red-400" aria-hidden />
          <span>{label}</span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Link
            href="/member/notifications"
            className="inline-flex rounded-lg px-3 py-1.5 text-xs font-semibold text-white sm:text-sm"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            Ouvrir mes notifications
          </Link>
          <button
            type="button"
            onClick={() => setBannerDismissed(true)}
            className="inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-medium sm:text-sm"
            style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
            aria-label="Masquer ce message"
          >
            <X className="h-3.5 w-3.5" aria-hidden />
            Plus tard
          </button>
        </div>
      </div>
    </div>
  );
}

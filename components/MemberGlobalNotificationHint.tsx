"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Bell, X } from "lucide-react";

/**
 * Espace membre public : préfixe (n) sur le titre d’onglet, toast fixe au scroll, événement de compteur pour le header.
 */
export default function MemberGlobalNotificationHint() {
  const { status } = useSession();
  const pathname = usePathname();
  const [unread, setUnread] = useState(0);
  const [toastDismissed, setToastDismissed] = useState(false);

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
    if (unread === 0) setToastDismissed(false);
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

  if (status !== "authenticated" || unread === 0 || toastDismissed) {
    return null;
  }

  const label =
    unread === 1 ? "Tu as 1 nouvelle à lire." : `Tu as ${unread} nouvelles à lire.`;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Rappel de nouvelles"
      className="pointer-events-none fixed z-[90]"
      style={{
        bottom: "max(1rem, env(safe-area-inset-bottom, 0px))",
        left: "max(1rem, env(safe-area-inset-left, 0px))",
        right: "max(1rem, env(safe-area-inset-right, 0px))",
      }}
    >
      {/* Desktop / tablette : coin bas-droite ; le bloc reste dans la zone safe-area */}
      <div className="pointer-events-none flex justify-center sm:justify-end">
        <div
          className="member-notif-toast-in pointer-events-auto w-full max-w-md rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur-md sm:max-w-sm"
          style={{
            borderColor: "rgba(145, 70, 255, 0.45)",
            backgroundColor: "var(--color-card)",
            boxShadow:
              "0 24px 48px -12px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(145, 70, 255, 0.12) inset",
          }}
        >
          <div className="flex gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: "rgba(145, 70, 255, 0.2)" }}
            >
              <Bell className="h-5 w-5 text-red-400" aria-hidden />
            </div>
            <div className="min-w-0 flex-1 space-y-3">
              <p className="text-sm font-medium leading-snug" style={{ color: "var(--color-text)" }}>
                {label}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href="/member/notifications"
                  className="inline-flex min-h-[2.5rem] flex-1 items-center justify-center rounded-xl px-3 py-2 text-center text-xs font-semibold leading-tight text-white transition hover:opacity-95 sm:flex-none sm:min-h-0 sm:text-sm"
                  style={{ backgroundColor: "var(--color-primary)" }}
                >
                  Voir tes nouvelles
                </Link>
                <button
                  type="button"
                  onClick={() => setToastDismissed(true)}
                  className="inline-flex items-center justify-center rounded-xl border px-3 py-2 text-xs font-medium transition hover:opacity-90 sm:text-sm"
                  style={{
                    borderColor: "var(--color-border)",
                    color: "var(--color-text-secondary)",
                    backgroundColor: "var(--color-card-hover)",
                  }}
                  aria-label="Masquer ce rappel jusqu’à la prochaine nouvelle"
                >
                  Plus tard
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setToastDismissed(true)}
              className="-mr-1 -mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg opacity-70 transition hover:opacity-100"
              style={{ color: "var(--color-text-secondary)" }}
              aria-label="Fermer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

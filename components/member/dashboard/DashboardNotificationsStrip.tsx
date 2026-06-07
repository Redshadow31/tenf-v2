"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { useEffect, useState } from "react";
import { MEMBER_PANEL_RADIUS } from "@/components/member/dashboard/dashboardUi";

export default function DashboardNotificationsStrip() {
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    const handler = (event: Event) => {
      const ce = event as CustomEvent<{ count?: number }>;
      if (typeof ce.detail?.count === "number") setUnread(ce.detail.count);
    };
    window.addEventListener("member-notifications-count", handler);
    return () => window.removeEventListener("member-notifications-count", handler);
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/members/me/notifications", { cache: "no-store" });
        if (!res.ok || !active) return;
        const data = await res.json();
        setUnread(Number(data?.unreadCount || 0));
      } catch {
        /* silent */
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  if (unread <= 0) return null;

  return (
    <Link
      href="/member/notifications"
      className={`group flex items-center justify-between gap-3 overflow-hidden ${MEMBER_PANEL_RADIUS} border border-violet-400/35 bg-gradient-to-r from-violet-500/15 via-violet-500/10 to-transparent px-4 py-3 text-sm shadow-[0_8px_24px_rgba(0,0,0,0.2)] backdrop-blur-sm transition hover:border-violet-300/45 hover:from-violet-500/20`}
    >
      <span className="relative inline-flex items-center gap-2.5 font-semibold text-violet-50">
        <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/25 ring-1 ring-violet-300/30">
          <Bell className="h-4 w-4" aria-hidden />
          <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-300 opacity-70" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-violet-200" />
          </span>
        </span>
        {unread} nouvelle{unread > 1 ? "s" : ""} à lire
      </span>
      <span className="rounded-full bg-violet-500/20 px-2.5 py-1 text-xs font-bold text-violet-100 transition group-hover:bg-violet-500/30">
        Voir →
      </span>
    </Link>
  );
}

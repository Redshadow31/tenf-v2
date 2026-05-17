"use client";

import { AlertCircle } from "lucide-react";
import NotificationCard from "@/components/member/notifications/NotificationCard";
import type { NotificationItem } from "@/components/member/notifications/types";

type NotificationActionPanelProps = {
  items: NotificationItem[];
  pendingId: string | null;
  onMarkRead: (id: string) => void;
  onOpenImage: (src: string, title: string) => void;
};

export default function NotificationActionPanel({
  items,
  pendingId,
  onMarkRead,
  onOpenImage,
}: NotificationActionPanelProps) {
  if (items.length === 0) return null;
  return (
    <section
      aria-labelledby="notifications-todo-heading"
      className="relative overflow-hidden rounded-2xl border"
      style={{
        borderColor: "rgba(244,63,94,0.32)",
        background:
          "linear-gradient(135deg, rgba(244,63,94,0.10) 0%, rgba(20,16,30,0.25) 55%, rgba(13,12,18,0.3) 100%)",
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-40 blur-3xl"
        style={{ background: "rgba(244,63,94,0.18)" }}
      />
      <div className="relative px-[clamp(0.85rem,1.1vw,1.25rem)] py-[clamp(0.75rem,0.9vw,1rem)]">
        <header className="mb-3 flex items-center justify-between gap-2">
          <h2
            id="notifications-todo-heading"
            className="inline-flex items-center gap-2 text-pretty font-bold tracking-tight text-rose-50"
            style={{ fontSize: "clamp(0.9rem,1.05vw,1rem)" }}
          >
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-rose-300/40 bg-rose-500/20 text-rose-100">
              <AlertCircle className="h-4 w-4" aria-hidden />
            </span>
            À traiter
            <span className="rounded-full bg-rose-500/35 px-2 py-0.5 text-[11px] font-bold tabular-nums text-rose-50">
              {items.length}
            </span>
          </h2>
          <p className="hidden text-[clamp(0.72rem,0.8vw,0.8rem)] text-rose-100/80 md:block">
            Ces notifications attendent une action de ta part.
          </p>
        </header>
        <div className="grid grid-cols-1 gap-[clamp(0.65rem,1vw,1rem)] lg:grid-cols-2 2xl:grid-cols-3">
          {items.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              pending={pendingId === notification.id}
              onMarkRead={onMarkRead}
              onOpenImage={onOpenImage}
              prominent
            />
          ))}
        </div>
      </div>
    </section>
  );
}

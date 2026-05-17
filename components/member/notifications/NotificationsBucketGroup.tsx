"use client";

import NotificationCard from "@/components/member/notifications/NotificationCard";
import type { NotificationItem } from "@/components/member/notifications/types";

type NotificationsBucketGroupProps = {
  title: string;
  items: NotificationItem[];
  pendingId: string | null;
  onMarkRead: (id: string) => void;
  onOpenImage: (src: string, title: string) => void;
};

export default function NotificationsBucketGroup({
  title,
  items,
  pendingId,
  onMarkRead,
  onOpenImage,
}: NotificationsBucketGroupProps) {
  if (items.length === 0) return null;

  return (
    <section aria-label={title} className="space-y-3">
      <div className="flex items-center gap-2">
        <h2
          className="text-pretty font-bold uppercase tracking-[0.14em] text-violet-200"
          style={{ fontSize: "clamp(0.72rem,0.85vw,0.825rem)" }}
        >
          {title}
        </h2>
        <span
          aria-hidden
          className="h-px flex-1 bg-gradient-to-r from-violet-500/40 via-violet-500/15 to-transparent"
        />
        <span className="rounded-full bg-white/[0.05] px-2 py-0.5 text-[10.5px] font-bold tabular-nums text-zinc-400">
          {items.length}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-[clamp(0.65rem,1vw,1rem)] lg:grid-cols-2 2xl:grid-cols-3">
        {items.map((notification) => (
          <NotificationCard
            key={notification.id}
            notification={notification}
            pending={pendingId === notification.id}
            onMarkRead={onMarkRead}
            onOpenImage={onOpenImage}
          />
        ))}
      </div>
    </section>
  );
}

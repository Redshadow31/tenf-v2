"use client";

import { Bell, CheckCheck, Loader2, Sparkles } from "lucide-react";
import { pluralize } from "@/lib/notifications/format";

type NotificationsHeaderProps = {
  total: number;
  unread: number;
  onMarkAll: () => void;
  markAllPending: boolean;
};

export default function NotificationsHeader({
  total,
  unread,
  onMarkAll,
  markAllPending,
}: NotificationsHeaderProps) {
  return (
    <header
      className="relative overflow-hidden rounded-[clamp(1rem,1.4vw,1.5rem)] border"
      style={{
        borderColor: "rgba(139,92,246,0.25)",
        background:
          "linear-gradient(135deg, rgba(139,92,246,0.12) 0%, rgba(20,16,30,0.55) 40%, rgba(13,12,18,0.6) 100%)",
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full opacity-50 blur-3xl"
        style={{ background: "rgba(168,85,247,0.18)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-12 -left-6 h-40 w-40 rounded-full opacity-40 blur-3xl"
        style={{ background: "rgba(232,121,249,0.10)" }}
      />

      <div className="relative flex flex-col gap-[clamp(0.75rem,1vw,1.25rem)] px-[clamp(1rem,1.6vw,1.75rem)] py-[clamp(1rem,1.4vw,1.5rem)] lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-start gap-[clamp(0.75rem,1vw,1rem)]">
          <span
            aria-hidden
            className="relative flex h-[clamp(2.75rem,3.2vw,3.5rem)] w-[clamp(2.75rem,3.2vw,3.5rem)] shrink-0 items-center justify-center rounded-2xl border border-violet-400/35 bg-violet-500/15 text-violet-100 shadow-[0_8px_24px_rgba(139,92,246,0.18)]"
          >
            <Bell className="h-[55%] w-[55%]" strokeWidth={2} />
            {unread > 0 ? (
              <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full border border-zinc-950 bg-rose-500 px-1 text-[10px] font-bold tabular-nums text-white shadow-md">
                {unread > 99 ? "99+" : unread}
              </span>
            ) : null}
          </span>
          <div className="min-w-0">
            <p className="inline-flex items-center gap-1.5 rounded-full border border-violet-400/30 bg-violet-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-violet-200">
              <Sparkles className="h-3 w-3" aria-hidden />
              Boîte de réception TENF
            </p>
            <h1
              className="mt-2 text-pretty font-bold tracking-tight"
              style={{ color: "var(--color-text)", fontSize: "clamp(1.25rem,1.9vw,1.875rem)", lineHeight: 1.15 }}
            >
              Mes nouvelles
            </h1>
            <p
              className="mt-1 max-w-[62ch] text-pretty leading-snug"
              style={{ color: "var(--color-text-secondary)", fontSize: "clamp(0.85rem,0.95vw,0.95rem)" }}
            >
              Annonces, rappels et messages importants liés à ton espace TENF.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 lg:flex-nowrap lg:justify-end">
          <div
            className="flex items-baseline gap-1 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-[clamp(0.8rem,0.9vw,0.85rem)] text-zinc-200"
            aria-live="polite"
          >
            <span className="text-base font-extrabold tabular-nums text-white sm:text-lg">{unread}</span>
            <span className="text-xs text-zinc-400">{pluralize(unread, "non lue", "non lues")}</span>
          </div>
          <div className="flex items-baseline gap-1 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-[clamp(0.8rem,0.9vw,0.85rem)] text-zinc-200">
            <span className="text-base font-extrabold tabular-nums text-white sm:text-lg">{total}</span>
            <span className="text-xs text-zinc-400">au total</span>
          </div>
          {unread > 0 ? (
            <button
              type="button"
              onClick={onMarkAll}
              disabled={markAllPending}
              className="inline-flex min-h-[40px] items-center gap-2 rounded-xl border border-violet-400/35 bg-violet-500/15 px-3.5 py-2 text-sm font-bold text-violet-50 transition hover:border-violet-300/55 hover:bg-violet-500/25 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {markAllPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCheck className="h-4 w-4" aria-hidden />}
              Tout marquer comme lu
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
}

"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";

type SidebarCollapsibleGroupProps = {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  /** Point rouge à côté du titre (ex. notifications non lues dans le groupe) */
  showTitleUnreadDot?: boolean;
};

export default function SidebarCollapsibleGroup({
  title,
  children,
  defaultOpen = false,
  showTitleUnreadDot = false,
}: SidebarCollapsibleGroupProps) {
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    if (defaultOpen) setOpen(true);
  }, [defaultOpen]);

  return (
    <div
      className="space-y-1.5 rounded-xl border p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
      style={{
        borderColor: "rgba(139, 92, 246, 0.28)",
        background:
          "linear-gradient(165deg, rgba(139, 92, 246, 0.08) 0%, rgba(15, 16, 22, 0.35) 55%, rgba(15, 16, 22, 0.2) 100%)",
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="group flex w-full items-start justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] font-semibold tracking-wide transition hover:bg-white/[0.06]"
        style={{ color: "var(--color-text)" }}
        aria-expanded={open}
      >
        <span className="flex min-w-0 flex-1 items-start gap-2">
          <span className="min-w-0 flex-1 break-words text-pretty leading-snug">{title}</span>
          {showTitleUnreadDot ? (
            <span
              className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.7)]"
              title="Notifications non lues"
              aria-hidden
            />
          ) : null}
        </span>
        <span
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border transition group-hover:border-violet-400/40"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.25)",
            borderColor: "rgba(139, 92, 246, 0.35)",
            color: "var(--color-text-secondary)",
          }}
        >
          <ChevronDown
            size={16}
            className="transition-transform duration-200 ease-out"
            style={{ transform: open ? "rotate(0deg)" : "rotate(-90deg)" }}
            aria-hidden
          />
        </span>
      </button>
      {open ? (
        <div className="space-y-1.5 border-l border-violet-500/25 pl-2.5 pr-0.5 pt-0.5" style={{ marginLeft: "0.4rem" }}>
          {children}
        </div>
      ) : null}
    </div>
  );
}

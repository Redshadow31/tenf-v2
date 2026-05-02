"use client";

import type { ReactNode } from "react";
import { useState } from "react";
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

  return (
    <div
      className="space-y-2 rounded-xl border p-2"
      style={{ borderColor: "rgba(145, 70, 255, 0.2)", backgroundColor: "rgba(145, 70, 255, 0.04)" }}
    >
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-sm font-semibold tracking-[0.04em]"
        style={{ color: "var(--color-text)" }}
      >
        <span className="flex items-center gap-2">
          {title}
          {showTitleUnreadDot ? (
            <span className="h-2 w-2 shrink-0 rounded-full bg-red-500" title="Notifications non lues" aria-hidden />
          ) : null}
        </span>
        <span
          className="inline-flex h-5 w-5 items-center justify-center rounded-md"
          style={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)" }}
        >
          <ChevronDown size={12} style={{ transform: open ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 120ms ease" }} />
        </span>
      </button>
      {open ? (
        <div
          className="space-y-2 pl-2"
          style={{ borderLeft: "1px solid rgba(145, 70, 255, 0.26)", marginLeft: "0.35rem", paddingLeft: "0.65rem" }}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}

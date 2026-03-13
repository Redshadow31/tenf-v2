"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

type SidebarCollapsibleGroupProps = {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
};

export default function SidebarCollapsibleGroup({
  title,
  children,
  defaultOpen = true,
}: SidebarCollapsibleGroupProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between rounded-lg px-2 py-1 text-left text-xs font-semibold uppercase tracking-[0.12em]"
        style={{ color: "var(--color-text-secondary)" }}
      >
        <span>{title}</span>
        <ChevronDown size={14} style={{ transform: open ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 120ms ease" }} />
      </button>
      {open ? <div className="space-y-2">{children}</div> : null}
    </div>
  );
}

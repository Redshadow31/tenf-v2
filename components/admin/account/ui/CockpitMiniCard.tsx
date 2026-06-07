"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { FOCUS_RING_CLASS } from "@/lib/admin/account/adminAccountUtils";

type CockpitMiniCardAction =
  | { kind: "none" }
  | { kind: "link"; href: string }
  | { kind: "scroll"; targetId: string };

export default function CockpitMiniCard({
  icon: Icon,
  label,
  value,
  tone,
  action = { kind: "none" },
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  tone: "ok" | "warn" | "danger" | "neutral";
  action?: CockpitMiniCardAction;
}) {
  const bar =
    tone === "ok"
      ? "bg-emerald-500"
      : tone === "warn"
        ? "bg-amber-400"
        : tone === "danger"
          ? "bg-red-500"
          : "bg-zinc-500";
  const interactive =
    action.kind !== "none"
      ? "cursor-pointer transition hover:border-white/20 hover:bg-black/50"
      : "";
  const shellClass = `relative flex min-h-[88px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-black/35 pl-3.5 pr-3 py-3 text-left shadow-inner ${interactive} ${FOCUS_RING_CLASS}`;

  const inner = (
    <>
      <span className={`absolute left-0 top-0 h-full w-1 ${bar}`} aria-hidden />
      <div className="flex items-center gap-2 pl-1">
        <Icon className="h-4 w-4 shrink-0 text-zinc-400" aria-hidden />
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500">{label}</span>
      </div>
      <p className="mt-2 flex-1 pl-1 text-sm font-semibold leading-snug text-zinc-50">{value}</p>
      {action.kind !== "none" ? (
        <span className="mt-1 pl-1 text-[10px] font-semibold uppercase tracking-wider text-violet-300/80">
          {action.kind === "link" ? "Ouvrir →" : "Aller à la section →"}
        </span>
      ) : null}
    </>
  );

  if (action.kind === "link") {
    return (
      <Link href={action.href} className={`${shellClass} block`}>
        {inner}
      </Link>
    );
  }
  if (action.kind === "scroll") {
    return (
      <button
        type="button"
        className={shellClass}
        onClick={() =>
          document.getElementById(action.targetId)?.scrollIntoView({ behavior: "smooth", block: "start" })
        }
      >
        {inner}
      </button>
    );
  }
  return <div className={shellClass}>{inner}</div>;
}

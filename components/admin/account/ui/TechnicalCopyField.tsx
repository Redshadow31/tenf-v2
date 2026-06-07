"use client";

import { useState } from "react";
import { CheckCircle2, ClipboardCopy } from "lucide-react";
import { FOCUS_RING_CLASS } from "@/lib/admin/account/adminAccountUtils";

export default function TechnicalCopyField({
  title,
  subtitle,
  value,
  masked,
}: {
  title: string;
  subtitle: string;
  value: string;
  masked: boolean;
}) {
  const [done, setDone] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setDone(true);
      window.setTimeout(() => setDone(false), 2000);
    } catch {
      /* ignore */
    }
  }

  const shown = masked ? "•".repeat(18) : value;

  return (
    <div className="flex flex-col gap-1.5 rounded-xl border border-white/10 bg-black/25 px-3 py-2.5">
      <div>
        <span className="text-xs font-semibold text-zinc-200">{title}</span>
        <p className="text-[11px] leading-snug text-zinc-500">{subtitle}</p>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <code className="break-all text-xs text-zinc-200">{shown}</code>
        <button
          type="button"
          onClick={() => void copy()}
          disabled={masked}
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-35 ${
            masked
              ? "border-white/10 bg-white/5 text-zinc-500"
              : "border-violet-400/40 bg-violet-500/15 text-violet-100 hover:bg-violet-500/25"
          } ${FOCUS_RING_CLASS}`}
        >
          {done ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <ClipboardCopy className="h-3.5 w-3.5" />}
          {done ? "Copié" : "Copier"}
        </button>
      </div>
    </div>
  );
}

"use client";

const ITEMS = [
  { label: "VIP auto", className: "border-emerald-500/40 bg-emerald-500/15 text-emerald-300" },
  { label: "Passage auto Communauté", className: "border-cyan-500/40 bg-cyan-500/15 text-cyan-300" },
  { label: "À surveiller (2m)", className: "border-amber-500/40 bg-amber-500/15 text-amber-300" },
  { label: "Follow neutre", className: "border-sky-500/40 bg-sky-500/15 text-sky-300" },
  { label: "Override manuel", className: "border-violet-500/40 bg-violet-500/15 text-violet-300" },
  { label: "Communauté forcée", className: "border-cyan-500/40 bg-cyan-500/15 text-cyan-300" },
  { label: "Δ M-1 / Δ 3M", className: "border-sky-500/40 bg-sky-500/15 text-sky-300" },
  { label: "Base validée ✓", className: "border-white/20 bg-white/[0.06] text-zinc-300" },
] as const;

export default function EvaluationDLegend() {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-white/[0.06] bg-zinc-900/35 px-3 py-2.5">
      <span className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-zinc-500">Légende</span>
      {ITEMS.map((item) => (
        <span
          key={item.label}
          className={`inline-flex rounded-lg border px-2 py-0.5 text-[10px] font-semibold ${item.className}`}
        >
          {item.label}
        </span>
      ))}
    </div>
  );
}

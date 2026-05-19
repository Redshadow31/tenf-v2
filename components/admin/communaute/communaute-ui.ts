/** Tokens UI — hub Animation & engagement (glass, aligné modération). */

const glassBlur = "backdrop-blur-xl backdrop-saturate-[1.12]";
const cardMotion =
  "motion-safe:transition-[transform,box-shadow,border-color] duration-300 ease-out motion-safe:hover:-translate-y-0.5";

export const COMUI = {
  glassPanel: `rounded-2xl border border-white/[0.1] bg-[color-mix(in_srgb,#18181b_52%,transparent)] ${glassBlur} shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_12px_40px_rgba(0,0,0,0.1)]`,
  glassInset: `rounded-xl border border-white/[0.08] bg-white/[0.04] ${glassBlur} shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]`,
  sectionLabel: "text-[11px] font-semibold uppercase tracking-[0.12em] text-violet-200/90",
  sectionTitle: "text-base font-semibold tracking-tight text-zinc-50 sm:text-lg",
  sectionLead: "mt-1.5 max-w-2xl text-sm leading-relaxed text-zinc-400",
  cardMotion,
  kpiCard: `group relative min-w-0 overflow-hidden rounded-2xl border border-white/[0.09] bg-white/[0.03] p-[clamp(0.9rem,1.1vw,1.15rem)] text-left ${glassBlur} shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] ${cardMotion}`,
  kpiLabel: "text-[11px] font-semibold uppercase tracking-wide text-zinc-400",
  kpiValue: "mt-1.5 text-[clamp(1.25rem,1rem+0.55vw,1.75rem)] font-semibold tabular-nums",
  kpiDesc: "mt-1.5 text-xs leading-snug text-zinc-500",
  kpiAccentViolet: "absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-violet-400/90 via-violet-500/50 to-transparent",
  kpiAccentSky: "absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-sky-400/90 via-sky-500/50 to-transparent",
  kpiAccentAmber: "absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-amber-400/90 via-amber-500/50 to-transparent",
  kpiAccentZinc: "absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-zinc-400/70 via-zinc-500/40 to-transparent",
  opsMetricBase: `relative min-w-0 overflow-hidden rounded-xl border border-white/[0.09] pl-3.5 pr-3 py-3 ${glassBlur} ${cardMotion}`,
  featuredPillar: `relative overflow-hidden rounded-2xl border border-rose-400/25 bg-gradient-to-br from-rose-950/35 via-violet-950/20 to-transparent p-5 sm:p-6 ${glassBlur} shadow-[0_0_48px_color-mix(in_srgb,#f43f5e_10%,transparent),inset_0_1px_0_0_rgba(255,255,255,0.08)]`,
  featuredPillarGlow: "pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-rose-500/15 blur-3xl",
  btnPrimary:
    "inline-flex min-h-[2.75rem] shrink-0 items-center justify-center gap-2 rounded-xl border border-violet-400/35 bg-gradient-to-b from-violet-600/90 to-violet-700/90 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_4px_24px_color-mix(in_srgb,#7c3aed_35%,transparent),inset_0_1px_0_0_rgba(255,255,255,0.12)] transition hover:from-violet-500/95 hover:to-violet-600/95",
  chipLink: `rounded-xl border border-white/[0.09] bg-white/[0.04] px-3.5 py-2 text-xs font-medium text-zinc-300 ${glassBlur} transition hover:border-violet-400/35 hover:bg-violet-500/[0.08] hover:text-white`,
  checklistRow: `flex w-full min-w-0 items-start gap-3 rounded-xl border px-3.5 py-3 text-left text-sm ${glassBlur} motion-safe:transition-all`,
  staffVerifyCard: `block min-w-0 rounded-xl border px-4 py-3.5 ${glassBlur} ${cardMotion}`,
} as const;

export const opsMetricTone = {
  rose: "border-l-[3px] border-l-rose-400/70 bg-rose-500/[0.08] text-rose-50 hover:bg-rose-500/[0.14]",
  amber: "border-l-[3px] border-l-amber-400/70 bg-amber-500/[0.08] text-amber-50 hover:bg-amber-500/[0.14]",
  emerald: "border-l-[3px] border-l-emerald-400/70 bg-emerald-500/[0.08] text-emerald-50 hover:bg-emerald-500/[0.14]",
  cyan: "border-l-[3px] border-l-cyan-400/70 bg-cyan-500/[0.08] text-cyan-50 hover:bg-cyan-500/[0.14]",
  indigo: "border-l-[3px] border-l-indigo-400/70 bg-indigo-500/[0.08] text-indigo-50 hover:bg-indigo-500/[0.14]",
  violet: "border-l-[3px] border-l-violet-400/70 bg-violet-500/[0.08] text-violet-50 hover:bg-violet-500/[0.14]",
} as const;

export const staffVerifyTone = {
  rose: `${COMUI.staffVerifyCard} border-rose-400/30 bg-rose-500/[0.07] hover:border-rose-400/45 hover:bg-rose-500/[0.11]`,
  emerald: `${COMUI.staffVerifyCard} border-emerald-400/30 bg-emerald-500/[0.07] hover:border-emerald-400/45 hover:bg-emerald-500/[0.11]`,
  sky: `${COMUI.staffVerifyCard} border-sky-400/30 bg-sky-500/[0.07] hover:border-sky-400/45 hover:bg-sky-500/[0.11]`,
  amber: `${COMUI.staffVerifyCard} border-amber-400/30 bg-amber-500/[0.07] hover:border-amber-400/45 hover:bg-amber-500/[0.11]`,
} as const;

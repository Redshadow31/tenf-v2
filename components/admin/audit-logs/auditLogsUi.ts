/** Tokens UI — pages Audit & logs (dark + light via data-theme). */

export const REALTIME_ACTIVE_MINUTES = 5;

export const ALI = {
  text: "text-[var(--color-text)]",
  textSecondary: "text-[var(--color-text-secondary)]",
  textMuted: "text-[var(--color-text-muted)]",
  sectionLabel:
    "text-[11px] font-bold uppercase tracking-[0.14em] text-violet-600 dark:text-violet-300/90 [html[data-theme=light]_&]:text-violet-700",
  pageWrap: "mx-auto w-full max-w-[min(100%,120rem)]",
  heroCard:
    "relative overflow-hidden rounded-[clamp(0.9rem,1.25vw,1.3rem)] border border-[var(--color-border)] bg-[var(--color-card)] shadow-[0_12px_40px_color-mix(in_srgb,var(--color-primary)_8%,transparent)]",
  heroMesh: "pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]",
  card:
    "rounded-[clamp(0.85rem,1.15vw,1.2rem)] border border-[var(--color-border)] bg-[var(--color-card)] shadow-[0_1px_0_color-mix(in_srgb,var(--color-text)_5%,transparent)]",
  cardPad:
    "rounded-[clamp(0.85rem,1.15vw,1.2rem)] border border-[var(--color-border)] bg-[var(--color-card)] p-[clamp(0.85rem,1vw,1.2rem)] shadow-[0_1px_0_color-mix(in_srgb,var(--color-text)_5%,transparent)]",
  panelHeader:
    "border-b border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-primary)_6%,var(--color-card))]",
  input:
    "min-h-[2.5rem] w-full min-w-0 rounded-xl border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-card)_88%,var(--color-bg))] px-3 py-2 text-sm text-[var(--color-text)] transition focus:border-violet-400/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400/60",
  inputPlaceholder: "placeholder:text-[var(--color-text-muted)]",
  btnSecondary:
    "min-h-[2.5rem] w-full rounded-xl border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-card)_90%,var(--color-bg))] px-3 py-2 text-sm font-semibold text-[var(--color-text)] transition hover:border-violet-400/40 hover:bg-[color-mix(in_srgb,var(--color-primary)_6%,var(--color-card))] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400/60",
  scopeActive:
    "rounded-xl bg-gradient-to-b from-violet-500 to-violet-700 px-4 py-2 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(139,92,246,0.3)] ring-1 ring-violet-400/40",
  scopeIdle:
    "rounded-xl border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-card)_92%,var(--color-bg))] px-4 py-2 text-sm font-semibold text-[var(--color-text-secondary)] transition hover:border-violet-400/30 hover:text-[var(--color-text)]",
  link: "text-sm text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400/60",
  kpiCard:
    "relative overflow-hidden rounded-[clamp(0.85rem,1.1vw,1.15rem)] border border-[var(--color-border)] bg-[var(--color-card)] p-4 shadow-[0_4px_20px_color-mix(in_srgb,var(--color-text)_4%,transparent)]",
  kpiAccentBar: "absolute left-0 top-0 h-full w-1 rounded-l-[inherit]",
  iconBox:
    "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-text)_4%,var(--color-card))]",
  iconViolet:
    "border-violet-400/30 bg-[color-mix(in_srgb,var(--color-primary)_12%,var(--color-card))] text-violet-600 dark:text-violet-200",
  iconIndigo:
    "border-indigo-400/30 bg-[color-mix(in_srgb,#6366f1_12%,var(--color-card))] text-indigo-700 dark:text-indigo-200",
  iconEmerald:
    "border-emerald-400/35 bg-[color-mix(in_srgb,#10b981_12%,var(--color-card))] text-emerald-700 dark:text-emerald-200",
  iconCyan:
    "border-cyan-400/35 bg-[color-mix(in_srgb,#06b6d4_12%,var(--color-card))] text-cyan-700 dark:text-cyan-200",
  tableHead:
    "sticky top-0 z-10 bg-[color-mix(in_srgb,var(--color-card)_96%,var(--color-bg))] text-left text-xs uppercase tracking-wide text-[var(--color-text-muted)] backdrop-blur-sm",
  tableRow:
    "border-t border-[var(--color-border)] text-[var(--color-text-secondary)] transition-colors hover:bg-[color-mix(in_srgb,var(--color-primary)_5%,var(--color-card))]",
  alertError:
    "rounded-xl border border-rose-400/35 bg-[color-mix(in_srgb,#f43f5e_10%,var(--color-card))] p-4 text-sm text-rose-900 dark:text-rose-100",
  badge:
    "inline-flex items-center rounded-full border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-text)_4%,var(--color-card))] px-2.5 py-1 text-[11px] font-semibold text-[var(--color-text-secondary)]",
  divider: "h-px w-full bg-gradient-to-r from-transparent via-[var(--color-border)] to-transparent",
  btnPager:
    "rounded-lg border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-card)_90%,var(--color-bg))] px-3 py-1.5 text-sm font-medium text-[var(--color-text)] transition hover:border-violet-400/35 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400/60",
  heroStat:
    "rounded-xl border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-card)_88%,var(--color-bg))] px-3 py-2 text-right shadow-sm",
  pulseDot:
    "relative inline-flex h-2 w-2 rounded-full bg-emerald-500 before:absolute before:inset-0 before:animate-ping before:rounded-full before:bg-emerald-400/70",
  typeBadgeDiscord:
    "inline-flex rounded-full border border-indigo-400/35 bg-[color-mix(in_srgb,#6366f1_14%,var(--color-card))] px-2 py-0.5 text-[11px] font-semibold text-indigo-800 dark:text-indigo-200",
  typeBadgeGuest:
    "inline-flex rounded-full border border-emerald-400/35 bg-[color-mix(in_srgb,#10b981_12%,var(--color-card))] px-2 py-0.5 text-[11px] font-semibold text-emerald-800 dark:text-emerald-200",
  emptyState:
    "mx-auto flex max-w-md flex-col items-center gap-3 py-6 text-center",
  chartWrap:
    "rounded-xl border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-bg)_90%,var(--color-card))] p-2",
} as const;

export const kpiValueAccent = {
  default: "text-violet-700 dark:text-violet-200",
  indigo: "text-indigo-700 dark:text-indigo-300",
  emerald: "text-emerald-700 dark:text-emerald-300",
  cyan: "text-cyan-700 dark:text-cyan-300",
} as const;

export const chartTooltipStyle = {
  backgroundColor: "var(--color-card)",
  border: "1px solid var(--color-border)",
  borderRadius: 10,
  color: "var(--color-text)",
  boxShadow: "0 8px 24px color-mix(in srgb, var(--color-text) 12%, transparent)",
} as const;

export const kpiAccentColors = {
  default: "bg-violet-500",
  indigo: "bg-indigo-500",
  emerald: "bg-emerald-500",
  cyan: "bg-cyan-500",
} as const;

/** Tokens UI partagés — hub modération (dark + light via data-theme). */

export {
  qCardStyle as muiCardStyle,
  qSurfaceStyle as muiSurfaceStyle,
} from "@/components/admin/moderation/questionnaire/questionnaire-ui";

export const MUI = {
  text: "text-[var(--color-text)]",
  textSecondary: "text-[var(--color-text-secondary)]",
  textMuted: "text-[var(--color-text-muted)]",
  border: "border-[var(--color-border)]",
  panelHeader: "border-b border-[var(--color-border)]",
  sectionLabel:
    "text-[11px] font-bold uppercase tracking-[0.14em] text-violet-600 dark:text-violet-300/90 [html[data-theme=light]_&]:text-violet-700",
  card:
    "rounded-[clamp(0.85rem,1.2vw,1.25rem)] border border-[var(--color-border)] bg-[var(--color-card)] shadow-[0_1px_0_color-mix(in_srgb,var(--color-text)_6%,transparent)]",
  cardPad:
    "rounded-[clamp(0.85rem,1.2vw,1.25rem)] border border-[var(--color-border)] bg-[var(--color-card)] p-[clamp(0.85rem,1vw,1.2rem)] shadow-[0_1px_0_color-mix(in_srgb,var(--color-text)_6%,transparent)]",
  featuredRing:
    "rounded-[clamp(0.9rem,1.25vw,1.3rem)] border border-[var(--color-border)] bg-[var(--color-card)] p-[1px] shadow-[0_8px_32px_color-mix(in_srgb,var(--color-primary)_12%,transparent)]",
  featuredInner:
    "rounded-[clamp(0.82rem,1.2vw,1.22rem)] bg-[color-mix(in_srgb,var(--color-card)_94%,var(--color-bg))]",
  hubMesh:
    "pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit] [html[data-theme=light]_&]:opacity-90",
  surface:
    "border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-card)_92%,var(--color-bg))]",
  surfaceHover:
    "hover:border-violet-400/35 hover:bg-[color-mix(in_srgb,var(--color-primary)_8%,var(--color-card))] hover:shadow-[0_4px_20px_color-mix(in_srgb,var(--color-primary)_8%,transparent)]",
  moduleRow:
    "group flex items-center justify-between gap-2 rounded-xl border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-card)_88%,var(--color-bg))] px-3 py-2 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400/60",
  moduleRowInactive:
    "opacity-[0.72] border-dashed bg-[color-mix(in_srgb,var(--color-text)_2%,var(--color-card))] hover:opacity-90",
  moduleTitle: "line-clamp-2 text-pretty font-semibold text-[var(--color-text)]",
  moduleDesc: "mt-0.5 line-clamp-2 text-pretty text-[var(--color-text-secondary)]",
  iconAccent:
    "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-violet-400/30 bg-[color-mix(in_srgb,var(--color-primary)_14%,var(--color-card))] text-violet-600 dark:text-violet-200",
  iconEmerald:
    "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-emerald-400/35 bg-[color-mix(in_srgb,#10b981_14%,var(--color-card))] text-emerald-700 dark:text-emerald-200",
  iconAmber:
    "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-amber-400/35 bg-[color-mix(in_srgb,#f59e0b_12%,var(--color-card))] text-amber-700 dark:text-amber-200",
  iconRose:
    "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-rose-400/35 bg-[color-mix(in_srgb,#f43f5e_12%,var(--color-card))] text-rose-700 dark:text-rose-200",
  iconEmeraldLg:
    "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-emerald-400/40 bg-[color-mix(in_srgb,#10b981_16%,var(--color-card))] text-emerald-700 shadow-[0_4px_14px_color-mix(in_srgb,#10b981_18%,transparent)] dark:text-emerald-200",
  iconEmeraldMd:
    "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-emerald-400/35 bg-[color-mix(in_srgb,#10b981_12%,var(--color-card))] text-emerald-700 dark:text-emerald-200",
  btnPrimary:
    "inline-flex min-h-[2.65rem] items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-violet-500 to-violet-700 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_4px_18px_rgba(139,92,246,0.28)] transition hover:from-violet-400 hover:to-violet-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400 disabled:opacity-40",
  btnGhost:
    "inline-flex items-center gap-1.5 rounded-xl border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-card)_90%,var(--color-bg))] px-3.5 py-2 text-sm font-semibold text-[var(--color-text)] transition hover:border-violet-400/40 hover:bg-[color-mix(in_srgb,var(--color-primary)_6%,var(--color-card))] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400",
  toggleTrack:
    "inline-flex flex-wrap items-center rounded-xl border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-card)_85%,var(--color-bg))] p-1 shadow-inner",
  toggleActive:
    "bg-[color-mix(in_srgb,var(--color-primary)_20%,var(--color-card))] text-[var(--color-text)] shadow-sm ring-1 ring-violet-400/45",
  toggleIdle:
    "text-[var(--color-text-secondary)] hover:bg-[color-mix(in_srgb,var(--color-text)_5%,var(--color-card))] hover:text-[var(--color-text)]",
  todoPrimary:
    "border-[color-mix(in_srgb,var(--color-primary)_40%,var(--color-border))] bg-[color-mix(in_srgb,var(--color-primary)_12%,var(--color-card))] shadow-[0_2px_12px_color-mix(in_srgb,var(--color-primary)_10%,transparent)]",
  todoUrgent:
    "border-rose-400/40 bg-[color-mix(in_srgb,#f43f5e_10%,var(--color-card))] shadow-[0_2px_12px_color-mix(in_srgb,#f43f5e_12%,transparent)] ring-1 ring-rose-400/20 hover:border-rose-400/55",
  todoMuted:
    "border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-text)_3%,var(--color-card))] opacity-[0.92] hover:opacity-100 hover:border-[color-mix(in_srgb,var(--color-primary)_25%,var(--color-border))]",
  progressTrack:
    "h-2 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--color-text)_8%,var(--color-card))]",
  progressFill:
    "h-full rounded-full bg-gradient-to-r from-violet-500 via-violet-400 to-emerald-500 transition-[width] duration-500 motion-reduce:transition-none",
  alertUrgent:
    "rounded-[clamp(0.85rem,1.2vw,1.2rem)] border border-rose-400/35 bg-[color-mix(in_srgb,#f43f5e_8%,var(--color-card))] p-[clamp(0.75rem,1vw,1rem)]",
  divider:
    "h-px w-full bg-gradient-to-r from-transparent via-[var(--color-border)] to-transparent",
} as const;

export const toneAccentBar: Record<string, string> = {
  violet: "bg-violet-500",
  indigo: "bg-indigo-500",
  sky: "bg-sky-500",
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  rose: "bg-rose-500",
  slate: "bg-slate-400",
};

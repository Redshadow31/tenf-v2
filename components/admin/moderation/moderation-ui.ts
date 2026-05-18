/** Tokens UI partagés — hub modération (glass doux, dark + light via data-theme). */

const glassBlur = "backdrop-blur-xl backdrop-saturate-[1.12]";

export {
  qCardStyle as muiCardStyle,
  qSurfaceStyle as muiSurfaceStyle,
} from "@/components/admin/moderation/questionnaire/questionnaire-ui";

export const MUI = {
  text: "text-[var(--color-text)]",
  textSecondary: "text-[var(--color-text-secondary)]",
  textMuted: "text-[var(--color-text-muted)]",
  border: "border-white/[0.08] dark:border-white/[0.09]",
  panelHeader: "border-b border-white/[0.06] dark:border-white/[0.07]",
  sectionLabel:
    "text-[10px] font-medium uppercase tracking-[0.2em] text-violet-600/85 dark:text-violet-300/70 [html[data-theme=light]_&]:text-violet-700/90",
  glassPanel:
    `rounded-2xl border border-white/[0.09] bg-[color-mix(in_srgb,var(--color-card)_42%,transparent)] ${glassBlur} shadow-[inset_0_1px_0_0_rgba(255,255,255,0.07),0_8px_32px_rgba(0,0,0,0.06)] dark:bg-[color-mix(in_srgb,var(--color-card)_38%,transparent)]`,
  glassHeader:
    "bg-[linear-gradient(135deg,color-mix(in_srgb,var(--color-primary)_6%,transparent),color-mix(in_srgb,#a78bfa_4%,transparent)_40%,transparent)] backdrop-blur-md",
  glassInset:
    `rounded-xl border border-white/[0.07] bg-white/[0.03] ${glassBlur} shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] dark:bg-white/[0.025]`,
  card:
    `rounded-2xl border border-white/[0.08] bg-[color-mix(in_srgb,var(--color-card)_45%,transparent)] ${glassBlur} shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05),0_6px_28px_rgba(0,0,0,0.07)]`,
  cardPad:
    `rounded-2xl border border-white/[0.08] bg-[color-mix(in_srgb,var(--color-card)_45%,transparent)] p-[clamp(0.85rem,1vw,1.2rem)] ${glassBlur} shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05),0_6px_28px_rgba(0,0,0,0.07)]`,
  featuredRing:
    `rounded-[clamp(1rem,1.3vw,1.35rem)] border border-white/[0.12] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--color-primary)_12%,transparent),color-mix(in_srgb,#10b981_6%,transparent))] p-px ${glassBlur} shadow-[0_12px_48px_color-mix(in_srgb,var(--color-primary)_14%,transparent),inset_0_1px_0_0_rgba(255,255,255,0.1)]`,
  featuredInner:
    `rounded-[clamp(0.92rem,1.2vw,1.28rem)] bg-[color-mix(in_srgb,var(--color-card)_35%,transparent)] ${glassBlur}`,
  hubMesh:
    "pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit] [html[data-theme=light]_&]:opacity-90",
  hubAmbient:
    "pointer-events-none absolute inset-0 -z-10 overflow-hidden",
  surface:
    `border border-white/[0.07] bg-[color-mix(in_srgb,var(--color-card)_40%,transparent)] ${glassBlur}`,
  surfaceHover:
    "hover:border-violet-400/25 hover:bg-[color-mix(in_srgb,var(--color-primary)_6%,transparent)] hover:shadow-[0_8px_32px_color-mix(in_srgb,var(--color-primary)_10%,transparent)]",
  moduleRow:
    `group flex items-center justify-between gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2 ${glassBlur} transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400/50`,
  moduleRowInactive:
    "opacity-[0.78] border-dashed border-white/[0.05] bg-transparent hover:opacity-95",
  moduleTitle: "line-clamp-2 text-pretty font-semibold text-[var(--color-text)]",
  moduleDesc: "mt-0.5 line-clamp-2 text-pretty leading-relaxed text-[var(--color-text-secondary)]",
  iconAccent:
    `flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-violet-400/20 bg-violet-500/[0.08] ${glassBlur} text-violet-600 dark:text-violet-200/95`,
  iconEmerald:
    `flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-emerald-400/25 bg-emerald-500/[0.08] ${glassBlur} text-emerald-700 dark:text-emerald-200/95`,
  iconAmber:
    `flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-amber-400/25 bg-amber-500/[0.08] ${glassBlur} text-amber-700 dark:text-amber-200/95`,
  iconRose:
    `flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-rose-400/25 bg-rose-500/[0.08] ${glassBlur} text-rose-700 dark:text-rose-200/95`,
  iconEmeraldLg:
    `flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-emerald-400/30 bg-emerald-500/[0.1] ${glassBlur} text-emerald-700 shadow-[0_4px_20px_color-mix(in_srgb,#10b981_12%,transparent)] dark:text-emerald-200/95`,
  iconEmeraldMd:
    `flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-emerald-400/25 bg-emerald-500/[0.08] ${glassBlur} text-emerald-700 dark:text-emerald-200/95`,
  btnPrimary:
    "inline-flex min-h-[2.65rem] items-center justify-center gap-2 rounded-xl border border-white/10 bg-gradient-to-b from-violet-500/95 to-violet-600/95 px-5 py-2.5 text-sm font-medium text-white shadow-[0_4px_24px_color-mix(in_srgb,var(--color-primary)_28%,transparent),inset_0_1px_0_0_rgba(255,255,255,0.15)] backdrop-blur-sm transition hover:from-violet-400/95 hover:to-violet-500/95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400/60 disabled:opacity-40",
  btnGhost:
    `inline-flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3.5 py-2 text-sm font-medium text-[var(--color-text)] ${glassBlur} transition hover:border-violet-400/30 hover:bg-violet-500/[0.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400/50`,
  toggleTrack:
    `inline-flex flex-wrap items-center rounded-xl border border-white/[0.08] bg-white/[0.04] p-1 ${glassBlur} shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)]`,
  toggleActive:
    "bg-[color-mix(in_srgb,var(--color-primary)_18%,transparent)] text-[var(--color-text)] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] ring-1 ring-violet-400/30 backdrop-blur-md",
  toggleIdle:
    "text-[var(--color-text-secondary)] hover:bg-white/[0.05] hover:text-[var(--color-text)]",
  todoPrimary:
    `border-violet-400/20 bg-violet-500/[0.06] ${glassBlur} shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05),0_4px_20px_color-mix(in_srgb,var(--color-primary)_8%,transparent)]`,
  todoUrgent:
    `border-rose-400/25 bg-rose-500/[0.06] ${glassBlur} shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04),0_4px_20px_color-mix(in_srgb,#f43f5e_8%,transparent)] ring-1 ring-rose-400/15 hover:border-rose-400/35`,
  todoMuted:
    `border-white/[0.06] bg-white/[0.02] ${glassBlur} hover:border-violet-400/20 hover:bg-violet-500/[0.04]`,
  todoCardMotion:
    "motion-safe:transition-[transform,box-shadow,border-color,background-color] duration-300 ease-out motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-[0_12px_36px_color-mix(in_srgb,var(--color-primary)_12%,transparent)] motion-safe:active:translate-y-0",
  hubSectionGap: "space-y-[clamp(1.25rem,2.4vw,2.25rem)]",
  hubPanelGlow:
    "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06),0_16px_48px_color-mix(in_srgb,var(--color-primary)_6%,transparent)]",
  progressTrack:
    `h-2 overflow-hidden rounded-full border border-white/[0.05] bg-black/20 ${glassBlur}`,
  progressFill:
    "h-full rounded-full bg-gradient-to-r from-violet-400/90 via-violet-300/80 to-emerald-400/85 shadow-[0_0_12px_color-mix(in_srgb,var(--color-primary)_35%,transparent)] transition-[width] duration-700 ease-out motion-reduce:transition-none",
  alertUrgent:
    `rounded-2xl border border-rose-400/25 bg-rose-500/[0.06] p-[clamp(0.75rem,1vw,1rem)] ${glassBlur}`,
  divider:
    "h-px w-full bg-gradient-to-r from-transparent via-white/[0.08] to-transparent",
} as const;

export const toneAccentBar: Record<string, string> = {
  violet: "bg-gradient-to-r from-violet-400/80 to-violet-500/60",
  indigo: "bg-gradient-to-r from-indigo-400/80 to-indigo-500/60",
  sky: "bg-gradient-to-r from-sky-400/80 to-sky-500/60",
  emerald: "bg-gradient-to-r from-emerald-400/80 to-emerald-500/60",
  amber: "bg-gradient-to-r from-amber-400/80 to-amber-500/60",
  rose: "bg-gradient-to-r from-rose-400/80 to-rose-500/60",
  slate: "bg-gradient-to-r from-slate-400/50 to-slate-500/40",
};

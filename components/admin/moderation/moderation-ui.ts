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
  asideSectionLabel:
    "text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]",
  asidePanelTitle: "text-base font-semibold tracking-tight text-[var(--color-text)]",
  asideTileLabel: "text-sm font-medium text-[var(--color-text-secondary)]",
  asideTileValue: "text-base font-bold tracking-tight",
  asideUrgentBadge:
    "mt-2 inline-flex items-center rounded-md border border-rose-300/35 bg-rose-500/20 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-rose-50",
  asideStaffPanel:
    `rounded-2xl border border-white/[0.1] bg-[color-mix(in_srgb,var(--color-card)_55%,transparent)] ${glassBlur} shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]`,
  asideViewToggleWrap:
    `rounded-2xl border border-white/[0.1] bg-[color-mix(in_srgb,var(--color-card)_52%,transparent)] p-3.5 ${glassBlur} shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]`,
  asideViewToggleLabel:
    "text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-text)]",
  asideToggleTrack:
    `flex w-full gap-1 rounded-xl border border-white/[0.12] bg-black/30 p-1 ${glassBlur} shadow-[inset_0_1px_3px_rgba(0,0,0,0.2)]`,
  asideToggleIdle:
    "font-medium text-[var(--color-text)]/85 hover:bg-white/[0.1] hover:text-[var(--color-text)]",
  asideToggleActive:
    "bg-violet-500/40 font-semibold text-white shadow-[0_2px_14px_color-mix(in_srgb,var(--color-primary)_28%,transparent),inset_0_1px_0_0_rgba(255,255,255,0.14)] ring-1 ring-violet-400/50",
  asideToggleIconIdle: "text-[var(--color-text-secondary)]",
  asideToggleIconActive: "text-white",
  asideProgressTrack:
    `mt-3 h-2.5 overflow-hidden rounded-full border border-white/[0.08] bg-white/[0.06] ${glassBlur}`,
  asideLinkCta:
    "mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-violet-600 dark:text-violet-200",
  glassHero:
    `rounded-[clamp(1rem,1.35vw,1.4rem)] border border-white/[0.1] bg-[color-mix(in_srgb,var(--color-card)_32%,transparent)] backdrop-blur-2xl backdrop-saturate-[1.18] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_20px_60px_rgba(0,0,0,0.12),0_0_0_1px_rgba(255,255,255,0.04)] dark:bg-[color-mix(in_srgb,var(--color-card)_28%,transparent)]`,
  glassHeroShine:
    "pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent",
  glassHeroColumn:
    `rounded-2xl border border-white/[0.08] bg-white/[0.02] p-[clamp(0.65rem,0.85vw,0.9rem)] ${glassBlur} shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] lg:border-l-0`,
  iconHero:
    `flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-violet-400/25 bg-violet-500/[0.1] ${glassBlur} text-violet-600 shadow-[0_4px_24px_color-mix(in_srgb,var(--color-primary)_18%,transparent)] dark:text-violet-200/95`,
  audiencePill:
    `inline-flex items-center rounded-full border border-violet-400/20 bg-violet-500/[0.08] px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-violet-700/90 backdrop-blur-md dark:text-violet-200/85`,
  hubTitleLogo:
    "h-[clamp(7rem,22vw,13rem)] w-auto max-w-[min(100%,40rem)] object-contain object-left drop-shadow-[0_8px_28px_rgba(0,0,0,0.45)] sm:max-w-[44rem] lg:h-[clamp(9.5rem,26vw,17rem)] lg:max-w-[min(62vw,50rem)] xl:h-[clamp(11rem,28vw,19rem)] 2xl:h-[clamp(12rem,30vw,21rem)]",
  hubTitleLogoWrap:
    "flex shrink-0 items-center justify-center lg:justify-start",
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
  hubSectionsPanel:
    `rounded-2xl border border-white/[0.1] bg-[color-mix(in_srgb,var(--color-card)_48%,transparent)] p-[clamp(0.85rem,1.1vw,1.35rem)] ${glassBlur} shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_12px_40px_rgba(0,0,0,0.08)]`,
  hubSectionTitle: "text-lg font-semibold tracking-tight text-[var(--color-text)] sm:text-xl",
  hubSectionLead: "mt-1.5 max-w-[65ch] text-pretty text-sm leading-relaxed text-[var(--color-text-secondary)]",
  groupCard:
    `rounded-2xl border border-white/[0.1] bg-[color-mix(in_srgb,var(--color-card)_50%,transparent)] ${glassBlur} shadow-[inset_0_1px_0_0_rgba(255,255,255,0.07),0_8px_32px_rgba(0,0,0,0.06)]`,
  groupActiveCount:
    "shrink-0 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-100",
  groupWipHint: "mt-2.5 text-xs font-medium text-[var(--color-text-secondary)]",
  moduleRow:
    `group flex items-center justify-between gap-3 rounded-xl border border-white/[0.09] bg-white/[0.04] px-3.5 py-2.5 ${glassBlur} transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400/50`,
  moduleRowInactive:
    `border-dashed border-amber-400/20 bg-amber-500/[0.04] hover:border-amber-400/35 hover:bg-amber-500/[0.07]`,
  moduleTitle: "line-clamp-2 text-pretty font-semibold text-[var(--color-text)]",
  moduleDesc: "mt-1 line-clamp-2 text-pretty text-sm leading-snug text-[var(--color-text-secondary)]",
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
  charterUrgent:
    `relative overflow-hidden border-rose-400/40 bg-gradient-to-br from-rose-950/40 via-rose-500/15 to-rose-500/5 ${glassBlur} shadow-[0_0_32px_color-mix(in_srgb,#f43f5e_14%,transparent),inset_0_1px_0_0_rgba(255,255,255,0.08)] ring-1 ring-rose-400/30 before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:bg-[radial-gradient(ellipse_at_top_left,color-mix(in_srgb,#f43f5e_22%,transparent),transparent_60%)]`,
  asideTileInset:
    `rounded-xl border border-white/[0.1] bg-white/[0.05] ${glassBlur} shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]`,
  skeletonShimmer:
    "animate-pulse rounded-md bg-white/[0.06] dark:bg-white/[0.05]",
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

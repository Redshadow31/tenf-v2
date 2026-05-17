/** Classes partagées — tokens CSS TENF (dark + light via data-theme). */

export const qCardStyle = {
  borderColor: "var(--color-border)",
  backgroundColor: "var(--color-card)",
} as const;

export const qSurfaceStyle = {
  backgroundColor: "color-mix(in srgb, var(--color-card) 88%, var(--color-bg))",
  borderColor: "var(--color-border)",
} as const;

export const QUI = {
  text: "text-[var(--color-text)]",
  textSecondary: "text-[var(--color-text-secondary)]",
  textMuted: "text-[var(--color-text-muted)]",
  border: "border-[var(--color-border)]",
  sectionLabel:
    "text-[11px] font-bold uppercase tracking-[0.14em] text-violet-600 dark:text-violet-300/90 [html[data-theme=light]_&]:text-violet-700",
  heading: "font-bold text-[var(--color-text)]",
  divider: "border-[var(--color-border)]",
  progressTrack:
    "h-2 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--color-text)_8%,var(--color-card))]",
  progressFill: "h-full rounded-full bg-gradient-to-r from-violet-500 to-emerald-500 transition-[width] duration-500 motion-reduce:transition-none",
  input:
    "w-full rounded-xl border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-card)_88%,var(--color-bg))] px-4 py-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-violet-400/50 focus:outline-none focus:ring-2 focus:ring-violet-500/25",
  choice:
    "flex cursor-pointer items-start gap-3 rounded-xl border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-card)_92%,var(--color-bg))] px-4 py-3 text-sm text-[var(--color-text)] transition hover:border-violet-400/35 hover:bg-[color-mix(in_srgb,var(--color-primary)_7%,var(--color-card))] has-[:checked]:border-violet-400/50 has-[:checked]:bg-[color-mix(in_srgb,var(--color-primary)_14%,var(--color-card))] focus-within:ring-2 focus-within:ring-violet-500/30 focus-within:ring-offset-2 focus-within:ring-offset-[var(--color-card)]",
  choiceInput:
    "mt-1 h-4 w-4 shrink-0 accent-violet-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400",
  scaleCard:
    "flex flex-col items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-card)_92%,var(--color-bg))] px-2 py-3 text-center transition hover:border-violet-400/35 has-[:checked]:border-violet-400/50 has-[:checked]:bg-[color-mix(in_srgb,var(--color-primary)_14%,var(--color-card))] focus-within:ring-2 focus-within:ring-violet-500/30",
  btnSecondary:
    "inline-flex min-h-[2.75rem] items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-card)_90%,var(--color-bg))] px-4 py-2 text-sm font-semibold text-[var(--color-text)] transition hover:border-violet-400/35 hover:bg-[color-mix(in_srgb,var(--color-primary)_8%,var(--color-card))] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400 disabled:opacity-40",
  btnPrimary:
    "inline-flex min-h-[2.75rem] items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400 disabled:opacity-40",
  btnGhost:
    "inline-flex min-h-[2.75rem] items-center justify-center gap-2 rounded-xl border border-transparent px-3 py-2 text-sm font-medium text-[var(--color-text-secondary)] underline-offset-2 transition hover:text-[var(--color-text)] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400 disabled:opacity-40",
  btnSave:
    "inline-flex min-h-[2.75rem] items-center justify-center gap-2 rounded-xl border border-violet-400/35 bg-[color-mix(in_srgb,var(--color-primary)_10%,var(--color-card))] px-4 py-2 text-sm font-semibold text-violet-700 transition hover:border-violet-400/50 [html[data-theme=light]_&]:text-violet-800 dark:text-violet-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400 disabled:opacity-40",
  btnSubmit:
    "inline-flex min-h-[2.75rem] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-emerald-500 to-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:from-emerald-400 hover:to-emerald-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 disabled:opacity-40 sm:w-auto",
  alertError:
    "rounded-xl border border-rose-400/35 bg-rose-500/10 px-4 py-3 text-sm text-rose-900 [html[data-theme=light]_&]:text-rose-900 dark:text-rose-100",
  alertSuccess:
    "rounded-xl border border-emerald-400/35 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-900 [html[data-theme=light]_&]:text-emerald-900 dark:text-emerald-100",
  questionEnter:
    "motion-safe:animate-[qfFadeIn_0.22s_ease-out] motion-reduce:animate-none",
} as const;

import type { CSSProperties } from "react";

/** Classes & styles — charte visuelle alignée sur le hub Événements (or / violet / verre). */

export const Q_LAYOUT = {
  page:
    "relative isolate min-w-0 scroll-smooth pb-12 text-white selection:bg-violet-500/35 [--q-gap:clamp(1rem,1.55vw,1.85rem)]",
  blurBg:
    "pointer-events-none absolute inset-x-[max(-4rem,calc(-6vw))] top-[-2.5rem] -z-10 h-[clamp(240px,32vw,440px)] overflow-hidden blur-3xl",
  blurGradient:
    "absolute inset-0 bg-[radial-gradient(ellipse_at_24%_-8%,rgba(167,139,250,0.28),transparent_54%),radial-gradient(ellipse_at_86%_22%,rgba(244,114,182,0.12),transparent_48%),radial-gradient(ellipse_at_52%_100%,rgba(56,189,248,0.1),transparent_52%)]",
  gridLines:
    "pointer-events-none fixed inset-x-0 top-0 -z-20 h-[min(820px,100vh)] opacity-[0.21]",
  container:
    "mx-auto w-full max-w-[min(1720px,calc(100vw-2*clamp(0.6rem,1.75vw,1.75rem)))] px-[clamp(0.75rem,2vw,2.35rem)] pb-12 pt-2 sm:pt-3",
  mainGrid:
    "grid min-w-0 grid-cols-1 gap-6 2xl:grid-cols-[minmax(0,1fr)_min(18rem,22vw)] 2xl:items-start 2xl:gap-[clamp(1rem,2vw,1.75rem)]",
  tableScroll:
    "w-full min-w-0 max-w-full overflow-x-auto overscroll-x-contain [scrollbar-gutter:stable] [-webkit-overflow-scrolling:touch]",
  tableBase:
    "w-full table-fixed border-collapse text-[length:clamp(0.625rem,0.65rem+0.2vw,0.8125rem)] leading-snug",
  tableCell:
    "px-[clamp(0.3rem,0.45vw,0.6rem)] py-[clamp(0.35rem,0.5vw,0.55rem)] align-top",
  tableHead:
    "px-[clamp(0.3rem,0.45vw,0.6rem)] py-[clamp(0.4rem,0.55vw,0.65rem)] text-left text-[length:clamp(0.5625rem,0.6rem+0.15vw,0.6875rem)] font-semibold uppercase tracking-[0.06em] text-zinc-500",
  panel:
    "rounded-2xl border border-white/[0.08] bg-zinc-950/55 shadow-sm shadow-black/20 ring-1 ring-inset ring-white/[0.03]",
  glassSection:
    "rounded-2xl border border-indigo-300/20 bg-[linear-gradient(150deg,rgba(99,102,241,0.12),rgba(14,15,23,0.85)_45%,rgba(56,189,248,0.08))] shadow-[0_20px_50px_rgba(2,6,23,0.45)] backdrop-blur-sm",
  heroVisual:
    "relative isolate overflow-hidden rounded-2xl border border-violet-500/20 bg-zinc-950/70 ring-1 ring-inset ring-violet-500/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]",
  focusRing:
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950",
  subtleBtn:
    "inline-flex min-h-[2.5rem] items-center gap-2 rounded-xl border border-violet-500/25 bg-violet-950/25 px-3 py-2 text-sm font-medium text-violet-100 transition hover:border-violet-400/40 hover:bg-violet-900/30",
  statCell:
    "rounded-xl border border-white/[0.08] bg-zinc-900/52 p-[clamp(0.45rem,0.85vw,0.55rem)] text-center",
  eyebrow:
    "text-[length:clamp(0.6875rem,0.625rem+0.25vw,0.8125rem)] uppercase tracking-[0.12em] text-violet-200/95",
  badgeAmber:
    "inline-flex items-center gap-1.5 rounded-full border border-amber-400/28 bg-amber-500/[0.08] px-3 py-1 text-[length:clamp(0.65rem,0.58rem+0.25vw,0.6875rem)] font-semibold uppercase tracking-[0.11em] text-amber-100/90",
  badgeViolet:
    "inline-flex items-center gap-1.5 rounded-full border border-violet-400/26 bg-violet-500/[0.1] px-3 py-1 text-[length:clamp(0.65rem,0.58rem+0.25vw,0.6875rem)] font-semibold uppercase tracking-[0.11em] text-violet-100/92",
} as const;

export const qPremiumCardStyle: CSSProperties = {
  borderColor: "rgba(212,175,55,0.2)",
  background:
    "radial-gradient(circle at 12% 8%, rgba(212,175,55,0.12), transparent 42%), linear-gradient(155deg, rgba(30,30,36,0.96), rgba(17,17,22,0.98))",
  boxShadow: "0 18px 42px rgba(0, 0, 0, 0.32)",
};

export const qCardStyle: CSSProperties = {
  ...qPremiumCardStyle,
  borderColor: "rgba(212,175,55,0.2)",
};

export const qSurfaceStyle = {
  backgroundColor: "rgba(24,24,27,0.65)",
  borderColor: "rgba(255,255,255,0.08)",
} as const;

export const qGlassIntroStyle: CSSProperties = {
  borderColor: "rgba(99,102,241,0.22)",
  background:
    "linear-gradient(145deg, rgba(99,102,241,0.14), rgba(14,15,23,0.88) 48%, rgba(56,189,248,0.06))",
  boxShadow: "0 12px 32px rgba(2,6,23,0.35)",
};

export const QUI = {
  text: "text-zinc-100",
  textSecondary: "text-zinc-400",
  textMuted: "text-zinc-500",
  border: "border-white/10",
  sectionLabel:
    "text-[11px] font-bold uppercase tracking-[0.14em] text-violet-300/95",
  heading: "font-semibold tracking-tight text-white",
  divider: "border-white/10",
  progressTrack: "h-2.5 overflow-hidden rounded-full bg-zinc-800/90 ring-1 ring-inset ring-white/5",
  progressFill:
    "h-full rounded-full bg-gradient-to-r from-amber-400/90 via-violet-500 to-emerald-500 transition-[width] duration-500 motion-reduce:transition-none",
  input:
    "w-full rounded-xl border border-white/10 bg-zinc-900/80 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-violet-400/50 focus:outline-none focus:ring-2 focus:ring-violet-500/30",
  filterSelect:
    "rounded-xl border border-white/10 bg-zinc-900/80 px-3 py-2 text-sm text-zinc-100 focus:border-violet-400/50 focus:outline-none focus:ring-2 focus:ring-violet-500/30",
  pillYes:
    "inline-flex rounded-full border border-emerald-400/35 bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-100",
  pillNo:
    "inline-flex rounded-full border border-zinc-500/30 bg-zinc-800/60 px-2 py-0.5 text-xs font-medium text-zinc-400",
  choice:
    "flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-zinc-900/50 px-4 py-3 text-sm text-zinc-100 transition hover:border-violet-400/35 hover:bg-violet-500/[0.08] has-[:checked]:border-violet-400/45 has-[:checked]:bg-violet-500/[0.14] focus-within:ring-2 focus-within:ring-violet-500/35 focus-within:ring-offset-2 focus-within:ring-offset-zinc-950",
  choiceInput:
    "mt-1 h-4 w-4 shrink-0 accent-violet-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400",
  scaleCard:
    "flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-zinc-900/50 px-2 py-3 text-center transition hover:border-violet-400/35 has-[:checked]:border-violet-400/50 has-[:checked]:bg-violet-500/[0.14] focus-within:ring-2 focus-within:ring-violet-500/35",
  btnSecondary: `${Q_LAYOUT.subtleBtn} min-h-[2.75rem] font-semibold`,
  btnPrimary:
    "inline-flex min-h-[2.75rem] items-center justify-center gap-2 rounded-xl border border-violet-400/35 bg-gradient-to-b from-violet-500 to-violet-700 px-4 py-2 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(109,40,217,0.35)] transition hover:from-violet-400 hover:to-violet-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400 disabled:opacity-40",
  btnGhost:
    "inline-flex min-h-[2.75rem] items-center justify-center gap-2 rounded-xl border border-transparent px-3 py-2 text-sm font-medium text-zinc-400 underline-offset-2 transition hover:text-zinc-200 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400 disabled:opacity-40",
  btnSave:
    "inline-flex min-h-[2.75rem] items-center justify-center gap-2 rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-100 transition hover:border-amber-400/45 hover:bg-amber-500/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400 disabled:opacity-40",
  btnSubmit:
    "inline-flex min-h-[2.75rem] w-full items-center justify-center gap-2 rounded-xl border border-emerald-400/35 bg-gradient-to-b from-emerald-500 to-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(16,185,129,0.28)] transition hover:from-emerald-400 hover:to-emerald-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 disabled:opacity-40 sm:w-auto",
  alertError:
    "rounded-xl border border-rose-400/35 bg-rose-500/10 px-4 py-3 text-sm text-rose-100",
  alertSuccess:
    "rounded-xl border border-emerald-400/35 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100",
  questionEnter:
    "motion-safe:animate-[qfFadeIn_0.22s_ease-out] motion-reduce:animate-none",
  wizardAccentBar:
    "h-1 w-full bg-gradient-to-r from-amber-400/80 via-violet-500 to-cyan-400/70",
} as const;

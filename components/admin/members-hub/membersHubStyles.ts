/**
 * Styles partagés hub / gestion membres — cockpit zinc/violet (aligné onboarding).
 */

export const cockpitPanelClass =
  "rounded-2xl border border-white/[0.08] bg-zinc-950/55 shadow-sm shadow-black/20 ring-1 ring-inset ring-white/[0.03]";

export const cockpitHeroClass =
  "relative isolate overflow-hidden rounded-2xl border border-violet-500/20 bg-zinc-950/70 ring-1 ring-inset ring-violet-500/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]";

export const cockpitBtnClass =
  "inline-flex min-h-[2.5rem] items-center gap-2 rounded-xl border border-violet-500/25 bg-violet-950/25 px-3 py-2 text-sm font-medium text-violet-100 transition hover:border-violet-400/40 hover:bg-violet-900/30";

/** @deprecated Préférer cockpitPanelClass — conservé pour compat composants hub existants */
export const hubCardClass = cockpitPanelClass;

export const hubSubCardClass =
  "rounded-xl border border-white/[0.08] bg-zinc-900/40 ring-1 ring-inset ring-white/[0.03]";

export const hubFocusRingClass =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950";

export const hubGhostButtonClass =
  "inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-[0.78rem] font-medium text-zinc-200 transition hover:border-violet-400/35 hover:bg-violet-950/30 hover:text-white";

export const hubPrimaryButtonClass =
  "inline-flex items-center gap-2 rounded-xl border border-violet-400/35 bg-violet-600/25 px-3 py-2 text-[0.78rem] font-semibold text-violet-50 shadow-sm transition hover:border-violet-300/50 hover:bg-violet-600/35";

export const hubSectionTitleClass = "font-semibold tracking-tight text-white";

export const hubSectionLabelClass =
  "text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-violet-200/80";

export const hubMembersLogoClass =
  "h-[clamp(7rem,20vw,12rem)] w-auto max-w-[min(100%,32rem)] object-contain object-center drop-shadow-[0_12px_40px_rgba(0,0,0,0.55)] sm:max-w-[38rem] lg:h-[clamp(9rem,24vw,15rem)] lg:max-w-[min(50vw,28rem)] xl:h-[clamp(10rem,26vw,17rem)] lg:object-left";

/** Logo compact pour le hero bento hub membres */
export const hubMembersLogoCompactClass =
  "h-[clamp(4.5rem,10vw,6.5rem)] w-auto max-w-[7.5rem] object-contain object-center drop-shadow-[0_8px_28px_rgba(0,0,0,0.45)] lg:h-[clamp(5rem,11vw,7rem)] lg:max-w-[8.5rem]";

/** Pastille filtre cockpit (hub membres, actions, postulations) */
export function cockpitFilterChipClass(active: boolean): string {
  return `rounded-lg border px-3 py-2 text-xs font-semibold transition ${hubFocusRingClass} ${
    active
      ? "border-violet-400/40 bg-violet-500/15 text-violet-100"
      : "border-white/10 bg-white/[0.03] text-zinc-400 hover:border-violet-400/25 hover:text-zinc-200"
  }`;
}

export const cockpitInputClass =
  "rounded-xl border border-white/10 bg-zinc-900/60 px-3 py-2.5 text-sm text-zinc-100 ring-1 ring-inset ring-white/[0.04] transition placeholder:text-zinc-600 focus:border-violet-400/35 focus:outline-none focus:ring-2 focus:ring-violet-400/30";

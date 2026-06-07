/** Styles partagés — synthèse évaluation D (zinc / violet, aligné hub admin). */



export const evalDPageClass =

  "relative min-h-[calc(100vh-5rem)] bg-[#0a0a0c] pb-16 text-zinc-100";



export const evalDContainerClass =

  "mx-auto w-full min-w-0 max-w-[min(1920px,calc(100vw-clamp(2.5rem,6vw,7rem)))] px-[clamp(0.5rem,1.75vw,1.75rem)] py-[clamp(0.75rem,1.5vw,1.5rem)]";



export const evalDPanelClass =

  "relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-b from-zinc-950/80 to-zinc-950/55 shadow-lg shadow-black/30 ring-1 ring-inset ring-white/[0.04]";



export const evalDSubPanelClass =

  "rounded-xl border border-white/[0.08] bg-zinc-900/50 ring-1 ring-inset ring-white/[0.03] transition hover:border-white/[0.12] hover:bg-zinc-900/65";



export const evalDKickerClass =

  "text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-violet-200/75";



export const evalDTitleClass = "font-semibold tracking-tight text-white";



export const evalDIntroClass = "text-sm leading-relaxed text-zinc-400";



export const evalDInputClass =

  "rounded-xl border border-white/10 bg-zinc-900/60 px-3 py-2.5 text-sm text-zinc-100 ring-1 ring-inset ring-white/[0.04] transition placeholder:text-zinc-600 focus:border-violet-400/35 focus:outline-none focus:ring-2 focus:ring-violet-400/30";



export const evalDFocusRing =

  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950";



export const evalDZoneClass =

  "rounded-2xl border border-white/[0.06] bg-black/20 p-[clamp(0.75rem,1.5vw,1.25rem)] ring-1 ring-inset ring-white/[0.03]";



export function evalDChipClass(active: boolean): string {

  return `rounded-xl border px-3 py-2 text-xs font-semibold transition ${evalDFocusRing} ${

    active

      ? "border-violet-400/40 bg-violet-500/15 text-violet-100 shadow-sm shadow-violet-950/30"

      : "border-white/10 bg-white/[0.03] text-zinc-400 hover:border-violet-400/25 hover:text-zinc-200"

  }`;

}



export function evalDTabClass(active: boolean): string {

  return `group relative inline-flex min-w-0 flex-1 flex-col items-start gap-0.5 rounded-xl border px-3 py-3 text-left transition sm:px-4 ${evalDFocusRing} ${

    active

      ? "border-violet-400/35 bg-gradient-to-br from-violet-600/90 via-violet-700/85 to-violet-900/90 text-white shadow-lg shadow-violet-950/45"

      : "border-transparent bg-transparent text-zinc-400 hover:border-white/10 hover:bg-white/[0.04] hover:text-zinc-200"

  }`;

}



export const evalDTableShellClass =

  "overflow-hidden rounded-2xl border border-white/[0.08] bg-zinc-950/50 ring-1 ring-inset ring-white/[0.04]";



export const evalDTableScrollWrapClass =

  "max-h-[min(75vh,calc(100dvh-13rem))] overflow-auto overscroll-contain [scrollbar-gutter:stable]";



export function evalDTableMinWidthClass(compact: boolean, advanced: boolean): string {

  if (compact && advanced) return "min-w-[1080px]";

  if (compact) return "min-w-[920px]";

  if (advanced) return "min-w-[1280px]";

  return "min-w-[1080px]";

}



export const evalDTableHeadClass =

  "border-b border-white/10 bg-zinc-900/90 text-[0.62rem] font-bold uppercase tracking-[0.1em] text-zinc-400";



export const evalDTableGroupClass =

  "border-b border-white/[0.06] text-[0.58rem] font-bold uppercase tracking-[0.12em]";



export const evalDTableTdClass =

  "px-2 text-center text-sm font-medium tabular-nums text-zinc-200 sm:px-3";



export const evalDTableTdMutedClass = "px-2 text-sm text-zinc-400 sm:px-3";



export const evalDTableInputCompactClass =

  "rounded-lg border border-white/10 bg-zinc-900/60 px-2 py-1 text-center text-sm text-zinc-100 ring-1 ring-inset ring-white/[0.04] transition placeholder:text-zinc-600 focus:border-violet-400/35 focus:outline-none focus:ring-2 focus:ring-violet-400/30";



export const evalDTableCheckboxClass =

  "h-4 w-4 rounded border-white/20 bg-zinc-900/60 accent-violet-500 sm:h-5 sm:w-5";



export const evalDBtnPrimaryClass = `rounded-xl border border-violet-400/35 bg-gradient-to-r from-violet-600/30 to-violet-800/30 px-4 py-2 text-sm font-semibold text-violet-50 shadow-sm transition hover:from-violet-600/45 hover:to-violet-800/45 disabled:opacity-40 ${evalDFocusRing}`;



export const evalDBtnSuccessClass = `rounded-xl border border-emerald-400/35 bg-gradient-to-r from-emerald-600/25 to-emerald-800/25 px-4 py-2 text-sm font-semibold text-emerald-50 shadow-sm transition hover:from-emerald-600/40 hover:to-emerald-800/40 disabled:opacity-40 ${evalDFocusRing}`;



export function evalDActionBadgeClass(kind: string): string {

  const k = kind.toLowerCase();

  if (k.includes("vip") || k.includes("bonus")) return "border-emerald-500/35 bg-emerald-500/15 text-emerald-300";

  if (k.includes("note") || k.includes("override") || k.includes("final"))

    return "border-violet-500/35 bg-violet-500/15 text-violet-300";

  if (k.includes("statut") || k.includes("role") || k.includes("commun"))

    return "border-cyan-500/35 bg-cyan-500/15 text-cyan-300";

  return "border-zinc-500/35 bg-zinc-500/15 text-zinc-300";

}



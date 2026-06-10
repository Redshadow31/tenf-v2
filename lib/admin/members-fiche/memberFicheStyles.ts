/**

 * Design system fiche membre 360° — pro, graphique, touches de couleur discrètes.

 */



export const FICHE_ACCENT = "#9146ff";



export type FicheTone =

  | "violet"

  | "emerald"

  | "sky"

  | "amber"

  | "indigo"

  | "rose"

  | "cyan"

  | "slate"

  | "neutral";



export type FicheTabAccent = FicheTone;



export const FICHE_TONE_STYLES: Record<

  FicheTone,

  {

    panel: string;

    kicker: string;

    accentBar: string;

    statBorder: string;

    statGlow: string;

    tabActive: string;

    tabIcon: string;

  }

> = {

  violet: {

    panel: "border-violet-500/18 bg-gradient-to-br from-violet-950/20 via-zinc-950/60 to-zinc-950/80",

    kicker: "text-violet-300/80",

    accentBar: "from-violet-500/70 via-violet-400/40 to-transparent",

    statBorder: "border-violet-500/20 hover:border-violet-400/35",

    statGlow: "hover:shadow-violet-950/30",

    tabActive:

      "border-violet-400/40 bg-gradient-to-br from-violet-600/22 via-violet-900/18 to-zinc-950/50 text-violet-50 shadow-md shadow-violet-950/35",

    tabIcon: "text-violet-300",

  },

  emerald: {

    panel: "border-emerald-500/18 bg-gradient-to-br from-emerald-950/18 via-zinc-950/60 to-zinc-950/80",

    kicker: "text-emerald-300/80",

    accentBar: "from-emerald-500/70 via-emerald-400/35 to-transparent",

    statBorder: "border-emerald-500/20 hover:border-emerald-400/35",

    statGlow: "hover:shadow-emerald-950/30",

    tabActive:

      "border-emerald-400/38 bg-gradient-to-br from-emerald-600/20 via-emerald-900/15 to-zinc-950/50 text-emerald-50 shadow-md shadow-emerald-950/30",

    tabIcon: "text-emerald-300",

  },

  sky: {

    panel: "border-sky-500/18 bg-gradient-to-br from-sky-950/18 via-zinc-950/60 to-zinc-950/80",

    kicker: "text-sky-300/80",

    accentBar: "from-sky-500/70 via-sky-400/35 to-transparent",

    statBorder: "border-sky-500/20 hover:border-sky-400/35",

    statGlow: "hover:shadow-sky-950/30",

    tabActive:

      "border-sky-400/38 bg-gradient-to-br from-sky-600/20 via-sky-900/15 to-zinc-950/50 text-sky-50 shadow-md shadow-sky-950/30",

    tabIcon: "text-sky-300",

  },

  amber: {

    panel: "border-amber-500/18 bg-gradient-to-br from-amber-950/16 via-zinc-950/60 to-zinc-950/80",

    kicker: "text-amber-300/80",

    accentBar: "from-amber-500/65 via-amber-400/30 to-transparent",

    statBorder: "border-amber-500/20 hover:border-amber-400/35",

    statGlow: "hover:shadow-amber-950/28",

    tabActive:

      "border-amber-400/36 bg-gradient-to-br from-amber-600/18 via-amber-900/14 to-zinc-950/50 text-amber-50 shadow-md shadow-amber-950/28",

    tabIcon: "text-amber-300",

  },

  indigo: {

    panel: "border-indigo-500/18 bg-gradient-to-br from-indigo-950/20 via-zinc-950/60 to-zinc-950/80",

    kicker: "text-indigo-300/80",

    accentBar: "from-indigo-500/70 via-indigo-400/35 to-transparent",

    statBorder: "border-indigo-500/20 hover:border-indigo-400/35",

    statGlow: "hover:shadow-indigo-950/30",

    tabActive:

      "border-indigo-400/38 bg-gradient-to-br from-indigo-600/22 via-indigo-900/16 to-zinc-950/50 text-indigo-50 shadow-md shadow-indigo-950/30",

    tabIcon: "text-indigo-300",

  },

  rose: {

    panel: "border-rose-500/18 bg-gradient-to-br from-rose-950/16 via-zinc-950/60 to-zinc-950/80",

    kicker: "text-rose-300/80",

    accentBar: "from-rose-500/65 via-rose-400/30 to-transparent",

    statBorder: "border-rose-500/20 hover:border-rose-400/35",

    statGlow: "hover:shadow-rose-950/28",

    tabActive:

      "border-rose-400/36 bg-gradient-to-br from-rose-600/18 via-rose-900/14 to-zinc-950/50 text-rose-50 shadow-md shadow-rose-950/28",

    tabIcon: "text-rose-300",

  },

  cyan: {

    panel: "border-cyan-500/18 bg-gradient-to-br from-cyan-950/16 via-zinc-950/60 to-zinc-950/80",

    kicker: "text-cyan-300/80",

    accentBar: "from-cyan-500/65 via-cyan-400/30 to-transparent",

    statBorder: "border-cyan-500/20 hover:border-cyan-400/35",

    statGlow: "hover:shadow-cyan-950/28",

    tabActive:

      "border-cyan-400/36 bg-gradient-to-br from-cyan-600/18 via-cyan-900/14 to-zinc-950/50 text-cyan-50 shadow-md shadow-cyan-950/28",

    tabIcon: "text-cyan-300",

  },

  slate: {

    panel: "border-slate-500/20 bg-gradient-to-br from-slate-900/30 via-zinc-950/60 to-zinc-950/80",

    kicker: "text-slate-300/75",

    accentBar: "from-slate-400/50 via-slate-500/25 to-transparent",

    statBorder: "border-slate-500/22 hover:border-slate-400/35",

    statGlow: "hover:shadow-black/35",

    tabActive:

      "border-slate-400/35 bg-gradient-to-br from-slate-600/22 via-slate-900/18 to-zinc-950/50 text-slate-100 shadow-md shadow-black/35",

    tabIcon: "text-slate-300",

  },

  neutral: {

    panel: "border-white/[0.08] bg-gradient-to-br from-zinc-900/40 via-zinc-950/65 to-zinc-950/85",

    kicker: "text-zinc-400/90",

    accentBar: "from-white/25 via-white/10 to-transparent",

    statBorder: "border-white/[0.08] hover:border-white/16",

    statGlow: "hover:shadow-black/30",

    tabActive:

      "border-white/18 bg-gradient-to-br from-zinc-800/35 via-zinc-900/25 to-zinc-950/55 text-zinc-100 shadow-md shadow-black/30",

    tabIcon: "text-zinc-300",

  },

};



export const FICHE_TAB_ACCENTS: Record<string, FicheTabAccent> = {

  overview: "violet",

  journey: "indigo",

  vipParcours: "amber",

  recap: "emerald",

  performance: "sky",

  participation: "amber",

  raids: "rose",

  community: "cyan",

  logs: "amber",

  admin: "slate",

};



export const fichePageClass =

  "relative min-h-screen bg-[#08080a] text-zinc-100 p-4 md:p-6 xl:p-8";



export const fichePageBackdropClass =

  "pointer-events-none fixed inset-0 -z-10 overflow-hidden";



export const ficheContainerClass = "relative mx-auto w-full max-w-[1600px] space-y-5";



export const ficheHeroClass =

  "relative overflow-hidden rounded-2xl border border-white/[0.09] bg-gradient-to-br from-zinc-950/95 via-[#0c0c10] to-violet-950/25 shadow-xl shadow-black/40 ring-1 ring-inset ring-white/[0.05]";



export const fichePanelClass =

  "rounded-2xl border border-white/[0.08] bg-zinc-950/55 shadow-sm shadow-black/25 ring-1 ring-inset ring-white/[0.03]";



export const ficheSubPanelClass =

  "rounded-xl border border-white/[0.07] bg-zinc-900/40 ring-1 ring-inset ring-white/[0.03] backdrop-blur-[2px]";



export const ficheKickerClass =

  "inline-flex items-center gap-1.5 text-[0.62rem] font-bold uppercase tracking-[0.2em]";



export const ficheTitleClass = "text-lg font-semibold tracking-tight text-white";



export const ficheIntroClass = "text-sm leading-relaxed text-zinc-400/95";



export const ficheStatCardClass =

  "relative overflow-hidden rounded-xl border bg-black/20 p-3 ring-1 ring-inset ring-white/[0.04] transition-all duration-200";



export const ficheStatCardInteractiveClass =

  "cursor-pointer hover:-translate-y-0.5 hover:bg-black/30 hover:shadow-md active:translate-y-0";



export const ficheStatLabelClass =

  "text-[10px] font-bold uppercase tracking-[0.14em] text-white/45";



export const ficheTabNavClass =

  "rounded-2xl border border-white/[0.08] bg-zinc-950/70 p-2 shadow-sm shadow-black/25 ring-1 ring-inset ring-white/[0.04] backdrop-blur-sm";



export const ficheTableShellClass =

  "overflow-hidden rounded-xl border border-white/[0.08] bg-zinc-950/50 ring-1 ring-inset ring-white/[0.03]";



export const ficheTableHeadClass =

  "border-b border-white/10 bg-zinc-900/90 text-[0.62rem] font-bold uppercase tracking-[0.1em] text-zinc-400";



export const ficheInputClass =

  "rounded-xl border border-white/10 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-100 ring-1 ring-inset ring-white/[0.04] transition focus:border-violet-400/35 focus:outline-none focus:ring-2 focus:ring-violet-400/30";



export const ficheFocusRing =

  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950";



export function ficheTabClass(active: boolean): string {

  return `rounded-xl border px-3 py-2 text-sm font-semibold transition ${ficheFocusRing} ${

    active

      ? "border-violet-400/40 bg-violet-500/15 text-violet-100 shadow-sm shadow-violet-950/30"

      : "border-white/10 bg-white/[0.03] text-zinc-400 hover:border-violet-400/25 hover:text-zinc-200"

  }`;

}



export function ficheTonePanelClass(tone: FicheTone): string {

  const t = FICHE_TONE_STYLES[tone] ?? FICHE_TONE_STYLES.neutral;

  return `relative overflow-hidden rounded-2xl border p-5 shadow-sm shadow-black/25 ring-1 ring-inset ring-white/[0.04] transition-shadow duration-300 hover:shadow-lg hover:shadow-black/35 ${t.panel}`;

}



export function ficheToneAccentBarClass(tone: FicheTone): string {

  const t = FICHE_TONE_STYLES[tone] ?? FICHE_TONE_STYLES.neutral;

  return `absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r ${t.accentBar}`;

}



export function ficheToneKickerClass(tone: FicheTone): string {

  const t = FICHE_TONE_STYLES[tone] ?? FICHE_TONE_STYLES.neutral;

  return `${ficheKickerClass} ${t.kicker}`;

}



export function ficheStatToneClass(tone: FicheTone, active = false): string {

  const t = FICHE_TONE_STYLES[tone] ?? FICHE_TONE_STYLES.neutral;

  if (active) {

    return `${t.statBorder} bg-black/35 ring-1 ring-inset ring-white/[0.06] shadow-sm ${t.statGlow.replace("hover:", "")}`;

  }

  return `${t.statBorder} ${t.statGlow}`;

}



export function ficheFieldAccentClass(tone: FicheTone): string {

  const accents: Record<FicheTone, string> = {

    violet: "border-l-violet-500/45",

    emerald: "border-l-emerald-500/45",

    sky: "border-l-sky-500/45",

    amber: "border-l-amber-500/45",

    indigo: "border-l-indigo-500/45",

    rose: "border-l-rose-500/45",

    cyan: "border-l-cyan-500/45",

    slate: "border-l-slate-400/40",

    neutral: "border-l-white/15",

  };

  return `border-l-2 ${accents[tone]}`;

}



export function ficheScoreTone(score: number): "emerald" | "violet" | "amber" | "red" {

  if (score >= 22) return "emerald";

  if (score >= 16) return "violet";

  if (score >= 10) return "amber";

  return "red";

}



export function ficheScoreBarClass(score: number): string {

  const tone = ficheScoreTone(score);

  const colors: Record<string, string> = {

    emerald: "bg-emerald-400",

    violet: "bg-violet-400",

    amber: "bg-amber-400",

    red: "bg-red-400",

  };

  return colors[tone];

}



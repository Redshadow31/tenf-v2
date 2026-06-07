/** Couleurs de groupes de colonnes — tableau récapitulatif */

export const EVAL_D_TABLE_GROUPS = {
  identite: {
    label: "Identité",
    headerClass: "border-r border-white/[0.08] bg-zinc-800/70 text-violet-100/90",
    cellBorder: "border-r border-white/[0.06]",
  },
  bareme: {
    label: "Barème hors bonus",
    headerClass: "border-r border-white/[0.08] bg-violet-950/50 text-violet-200/90",
    cellBorder: "",
  },
  bonus: {
    label: "Bonus",
    headerClass: "border-r border-white/[0.08] bg-amber-950/35 text-amber-200/90",
    cellBorder: "border-r border-white/[0.06]",
  },
  totaux: {
    label: "Totaux",
    headerClass: "border-r border-white/[0.08] bg-cyan-950/30 text-cyan-200/90",
    cellBorder: "border-r border-white/[0.06]",
  },
  synthese: {
    label: "Synthèse & override",
    headerClass: "border-r border-white/[0.08] bg-emerald-950/30 text-emerald-200/90",
    cellBorder: "border-r border-white/[0.06]",
  },
  decisions: {
    label: "Décisions",
    headerClass: "bg-pink-950/25 text-pink-200/90",
    cellBorder: "",
  },
} as const;

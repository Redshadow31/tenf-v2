export const ACTIVITY_WHY = {
  kicker: "Boussole TENF",
  title: "Pourquoi suivre ton activité",
  lead:
    "Cette page raconte ton mois : raids, événements, formations. Ce n'est pas un classement ni une obligation — une boussole pour voir comment tu tisses l'entraide, à ton rythme.",
  footnote: "Les chiffres peuvent arriver avec un léger décalage (Twitch, synchro Discord, validation staff).",
};

export const ACTIVITY_GENTLE_TRUTHS = [
  {
    id: "no-pressure",
    title: "Pas de pression",
    body: "Un mois calme est normal. TENF reste ouvert quand tu reviens — l'entraide durable bat la performance sur un seul mois.",
  },
  {
    id: "mix",
    title: "Plusieurs façons de participer",
    body: "Raid, événement, formation, Discord : tu n'as pas besoin de tout cumuler pour compter dans la commu.",
  },
  {
    id: "story",
    title: "Une histoire, pas un verdict",
    body: "L'intensité affichée est une photo ludique du mois — elle ne définit pas ta valeur de membre.",
  },
] as const;

export const ACTIVITY_NEXT_STEPS = [
  { label: "Mes objectifs", href: "/member/objectifs" },
  { label: "Ma progression", href: "/member/progression" },
  { label: "Planning événements", href: "/member/evenements" },
  { label: "Historique détaillé", href: "/member/activite/historique" },
] as const;

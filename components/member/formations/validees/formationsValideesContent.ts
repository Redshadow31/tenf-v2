export const FORMATIONS_VALIDEES_WHY = {
  kicker: "Progression TENF",
  title: "Ce que « validée » veut dire",
  lead:
    "Une formation validée, c'est une présence enregistrée côté TENF lors d'une session formation — pas une note ni un diplôme officiel. C'est surtout une trace de ton investissement dans le collectif.",
  footnote: "Les données peuvent mettre un peu de temps à se synchroniser après une session.",
};

export const FORMATIONS_VALIDEES_TRUTHS = [
  {
    id: "goal",
    title: "Objectif = repère, pas obligation",
    body: "L'objectif du mois sur la page Objectifs est un guide personnel. Zéro formation ce mois-ci ne remet pas en cause ta place dans TENF.",
  },
  {
    id: "tier",
    title: "Paliers ludiques",
    body: "Démarrage, En route, Régulier… Les paliers célèbrent ta régularité sans créer de hiérarchie entre membres.",
  },
  {
    id: "next",
    title: "Et après ?",
    body: "Catalogue pour t'inscrire aux prochaines dates, ou Objectifs pour ajuster ton cap du mois — tu avances à ton tempo.",
  },
] as const;

export const FORMATIONS_VALIDEES_LINKS = [
  { label: "Catalogue & sessions", href: "/member/formations" },
  { label: "Objectifs du mois", href: "/member/objectifs" },
  { label: "Ma progression", href: "/member/progression" },
] as const;

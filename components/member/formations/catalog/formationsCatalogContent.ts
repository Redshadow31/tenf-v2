export const FORMATIONS_CATALOG_WHY = {
  kicker: "Academy TENF",
  title: "Pourquoi les formations comptent",
  lead:
    "Les sessions TENF t'aident à progresser en streaming, modération ou outils — à ton rythme. Ce catalogue n'est pas un examen : c'est une bibliothèque vivante, alimentée par la commu et l'équipe.",
  footnote: "Inscription aux sessions à venir, intérêt sur les archives, ou formulaire libre — trois façons de participer sans pression.",
};

export const FORMATIONS_CATALOG_TRUTHS = [
  {
    id: "pace",
    title: "À ton rythme",
    body: "Tu n'as pas besoin de tout suivre d'un coup. Une formation par mois, ou une seule sur l'année, reste une vraie progression.",
  },
  {
    id: "interest",
    title: "Ton avis compte",
    body: "Signaler un thème du catalogue ou proposer un sujet aide l'équipe à planifier les prochains créneaux.",
  },
  {
    id: "live",
    title: "Live ou archive",
    body: "Les sessions à venir se vivent en direct ; les thèmes passés peuvent revenir si assez de membres manifestent leur intérêt.",
  },
] as const;

export const FORMATIONS_CATALOG_LINKS = [
  { label: "Mes formations validées", href: "/member/formations/validees" },
  { label: "Présentation Academy", href: "/member/academy" },
  { label: "Objectifs du mois", href: "/member/objectifs" },
] as const;

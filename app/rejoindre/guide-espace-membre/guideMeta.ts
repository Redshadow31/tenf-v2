export type GuideMemberStep = {
  title: string;
  href: string;
  shortLabel: string;
  readTime: string;
  expectedResult: string;
  accent: string;
};

export const guideMemberSteps: GuideMemberStep[] = [
  {
    title: "Premiere connexion",
    href: "/rejoindre/guide-espace-membre/premiere-connexion",
    shortLabel: "Demarrage",
    readTime: "3 min",
    expectedResult: "Completer ton profil et verifier les acces essentiels.",
    accent: "#06b6d4",
  },
  {
    title: "Tableau de bord",
    href: "/rejoindre/guide-espace-membre/tableau-de-bord",
    shortLabel: "Navigation",
    readTime: "3 min",
    expectedResult: "Savoir te reperer dans les blocs et raccourcis du dashboard.",
    accent: "#8b5cf6",
  },
  {
    title: "Fonctionnalites principales",
    href: "/rejoindre/guide-espace-membre/fonctionnalites-principales",
    shortLabel: "Utilisation",
    readTime: "4 min",
    expectedResult: "Identifier les modules les plus utiles selon ton objectif.",
    accent: "#f59e0b",
  },
  {
    title: "Parametres et securite",
    href: "/rejoindre/guide-espace-membre/parametres-securite",
    shortLabel: "Protection",
    readTime: "3 min",
    expectedResult: "Configurer ton compte et appliquer les bonnes pratiques de securite.",
    accent: "#ef4444",
  },
  {
    title: "FAQ membre",
    href: "/rejoindre/guide-espace-membre/faq-membre",
    shortLabel: "Support",
    readTime: "2 min",
    expectedResult: "Trouver vite les solutions aux blocages les plus frequents.",
    accent: "#ec4899",
  },
];

export function getGuideMemberStepIndex(pathname: string): number {
  return guideMemberSteps.findIndex((step) => step.href === pathname);
}

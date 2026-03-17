export type GuideStep = {
  title: string;
  href: string;
  shortLabel: string;
  readTime: string;
  expectedResult: string;
  accent: string;
};

export const guideSteps: GuideStep[] = [
  {
    title: "Presentation rapide",
    href: "/rejoindre/guide-public/presentation-rapide",
    shortLabel: "Base",
    readTime: "3 min",
    expectedResult: "Comprendre TENF, ses categories publiques et comment naviguer sur le site.",
    accent: "#06b6d4",
  },
  {
    title: "Creer un compte",
    href: "/rejoindre/guide-public/creer-un-compte",
    shortLabel: "Demarrage",
    readTime: "4 min",
    expectedResult: "Savoir creer son espace TENF via la connexion Discord.",
    accent: "#9146ff",
  },
  {
    title: "Liaison Twitch",
    href: "/rejoindre/guide-public/liaison-twitch",
    shortLabel: "Activation",
    readTime: "3 min",
    expectedResult: "Lier Twitch pour activer les fonctionnalites avancees de l'espace membre.",
    accent: "#f59e0b",
  },
  {
    title: "FAQ publique",
    href: "/rejoindre/guide-public/faq-publique",
    shortLabel: "Support",
    readTime: "2 min",
    expectedResult: "Trouver rapidement les reponses avant de rejoindre TENF.",
    accent: "#ec4899",
  },
];

export function getStepIndex(pathname: string): number {
  return guideSteps.findIndex((step) => step.href === pathname);
}


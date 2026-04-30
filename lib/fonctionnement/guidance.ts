export type TabId = "integration" | "reglement" | "systeme-points" | "boutique-points" | "spotlight" | "conseil";

interface Tab {
  id: TabId;
  label: string;
}

export const tabs: Tab[] = [
  { id: "integration", label: "Intégration" },
  { id: "reglement", label: "Règlement" },
  { id: "systeme-points", label: "Système de points" },
  { id: "boutique-points", label: "Boutique" },
  { id: "spotlight", label: "Spotlight" },
  { id: "conseil", label: "Conseils" },
];

export const tabUiMeta: Record<TabId, { icon: string; subtitle: string }> = {
  integration: {
    icon: "✨",
    subtitle: "Onboarding progressif pour bien démarrer dans TENF.",
  },
  reglement: {
    icon: "📜",
    subtitle: "Cadre clair pour garder une ambiance saine et bienveillante.",
  },
  "systeme-points": {
    icon: "⭐",
    subtitle: "Ton implication se transforme en progression concrète.",
  },
  "boutique-points": {
    icon: "🛍️",
    subtitle: "Récompenses utiles, fun et orientées évolution de chaîne.",
  },
  spotlight: {
    icon: "🌟",
    subtitle: "Moments de visibilité communautaire et soutien collectif.",
  },
  conseil: {
    icon: "🎯",
    subtitle: "Conseils pratiques pour progresser avec régularité.",
  },
};

export type TabGuidance = {
  tldr: string[];
  accordions: {
    key: "essentiel" | "bonnes-pratiques" | "details";
    title: string;
    text: string;
  }[];
  cta: {
    title: string;
    description: string;
    buttonLabel: string;
    targetTab: TabId;
  };
};

export const tabGuidance: Record<TabId, TabGuidance> = {
  integration: {
    tldr: [
      "Respecte les étapes d'arrivée pour une intégration solide",
      "Participe aux échanges et aux événements communautaires",
      "Demande de l'aide: l'entraide est le cœur de TENF",
      "Évite les actions passives: l'implication fait la différence",
    ],
    accordions: [
      {
        key: "essentiel",
        title: "Essentiel",
        text: "Remplis ton intégration, participe à la réunion, puis prends place dans la vie du serveur pour créer tes premiers liens.",
      },
      {
        key: "bonnes-pratiques",
        title: "Bonnes pratiques",
        text: "Présente-toi clairement, pose des questions, rejoins les lives et les events pour avancer plus vite avec les autres membres.",
      },
      {
        key: "details",
        title: "Détails",
        text: "Les évaluations et l'évolution des rôles servent à suivre ta progression, pas à sanctionner. Le but est d'accompagner durablement.",
      },
    ],
    cta: {
      title: "Prêt à passer à l'étape suivante ?",
      description: "Découvre les règles clés pour garder un cadre sain et bienveillant.",
      buttonLabel: "Voir le règlement",
      targetTab: "reglement",
    },
  },
  reglement: {
    tldr: [
      "Respect et bienveillance en priorité",
      "Participation active sans spam ni comportements toxiques",
      "Cadre vocal et textuel clair pour tous",
      "Le staff protège la communauté quand nécessaire",
    ],
    accordions: [
      {
        key: "essentiel",
        title: "Essentiel",
        text: "Le règlement existe pour protéger la communauté. Respect, écoute et entraide sont non négociables.",
      },
      {
        key: "bonnes-pratiques",
        title: "Bonnes pratiques",
        text: "Privilégie les échanges constructifs, évite les tensions publiques et contacte le staff en cas de besoin.",
      },
      {
        key: "details",
        title: "Détails",
        text: "Les règles couvrent les salons textuels, vocaux et comportements globaux. Le but est de préserver un espace sûr.",
      },
    ],
    cta: {
      title: "Tu veux transformer ton implication en progression ?",
      description: "Passe au système de points pour comprendre comment ton engagement est valorisé.",
      buttonLabel: "Voir le système de points",
      targetTab: "systeme-points",
    },
  },
  "systeme-points": {
    tldr: [
      "Les points valorisent l'implication, pas la compétition",
      "Quêtes, entraide, raids, événements: tout compte",
      "Des bonus réguliers renforcent la progression",
      "Pas de triche/spam: qualité > quantité",
    ],
    accordions: [
      {
        key: "essentiel",
        title: "Essentiel",
        text: "Le système de points récompense la présence utile et les actions qui font grandir la communauté.",
      },
      {
        key: "bonnes-pratiques",
        title: "Bonnes pratiques",
        text: "Reste régulier, participe proprement, et privilégie les actions d'entraide concrètes plutôt que les actions artificielles.",
      },
      {
        key: "details",
        title: "Détails",
        text: "Certaines actions demandent un format précis ou une preuve. Les règles détaillées sont listées dans les sections ci-dessous.",
      },
    ],
    cta: {
      title: "Tes points, tu les utilises comment ?",
      description: "Découvre la boutique pour convertir ton engagement en récompenses utiles ou fun.",
      buttonLabel: "Voir la boutique",
      targetTab: "boutique-points",
    },
  },
  "boutique-points": {
    tldr: [
      "Choisis une récompense adaptée à ton objectif",
      "Achat via Discord puis ticket obligatoire",
      "Cool-down et limites selon les items",
      "Communication claire = traitement plus rapide",
    ],
    accordions: [
      {
        key: "essentiel",
        title: "Essentiel",
        text: "Après achat, ouvre un ticket avec les infos demandées. Sans ticket, la demande ne peut pas être traitée.",
      },
      {
        key: "bonnes-pratiques",
        title: "Bonnes pratiques",
        text: "Prépare ton pseudo, tes disponibilités et tes liens utiles dès le départ pour éviter les allers-retours.",
      },
      {
        key: "details",
        title: "Détails",
        text: "Certaines récompenses ont des délais, quotas ou cooldown. Vérifie chaque carte avant de valider.",
      },
    ],
    cta: {
      title: "Envie d'aller plus loin dans la mise en avant ?",
      description: "Le Spotlight t'explique comment créer un vrai temps fort communautaire.",
      buttonLabel: "Comprendre le spotlight",
      targetTab: "spotlight",
    },
  },
  spotlight: {
    tldr: [
      "Le spotlight valorise un créateur dans un cadre communautaire",
      "Viewer ou streamer: chacun a un rôle utile",
      "Présence possible sans pression inutile",
      "Objectif: lien humain, découverte, soutien",
    ],
    accordions: [
      {
        key: "essentiel",
        title: "Essentiel",
        text: "Le spotlight est un moment collectif pour mettre en lumière un membre et renforcer la cohésion TENF.",
      },
      {
        key: "bonnes-pratiques",
        title: "Bonnes pratiques",
        text: "Prépare ton passage, communique clairement et adopte une posture d'entraide des deux côtés (viewer/streamer).",
      },
      {
        key: "details",
        title: "Détails",
        text: "Les recommandations détaillent ce qui est attendu avant, pendant et après un spotlight pour une expérience réussie.",
      },
    ],
    cta: {
      title: "Tu veux optimiser ta présence globale ?",
      description: "Passe aux conseils pour consolider ton rythme, ta communication et ton bien-être.",
      buttonLabel: "Voir les conseils",
      targetTab: "conseil",
    },
  },
  conseil: {
    tldr: [
      "Construis une présence régulière et soutenable",
      "Soigne ton image et tes interactions",
      "Protège ton énergie mentale dans la durée",
      "Reste aligné avec les valeurs TENF",
    ],
    accordions: [
      {
        key: "essentiel",
        title: "Essentiel",
        text: "La régularité et la cohérence priment sur l'intensité ponctuelle. Garde un rythme que tu peux tenir.",
      },
      {
        key: "bonnes-pratiques",
        title: "Bonnes pratiques",
        text: "Prépare ton contenu, anticipe ta communication et reste bienveillant sur toutes les plateformes.",
      },
      {
        key: "details",
        title: "Détails",
        text: "Les sections listent des conseils concrets sur image, positionnement, réseau et équilibre personnel.",
      },
    ],
    cta: {
      title: "Prêt pour ton prochain cap TENF ?",
      description: "Reviens à l'intégration pour valider les bases et relancer ton parcours communautaire.",
      buttonLabel: "Revenir à l'intégration",
      targetTab: "integration",
    },
  },
};

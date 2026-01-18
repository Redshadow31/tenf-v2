/**
 * Configuration de navigation pour la sidebar admin
 * 
 * IMPORTANT: Ne pas modifier les href existants pour éviter de casser les routes.
 * Seuls les labels peuvent être modifiés pour améliorer l'UX.
 */

export interface NavItem {
  href: string;
  label: string;
  icon?: string;
  children?: NavItem[];
}

export const adminNavigation: NavItem[] = [
  // 1. 📊 Vue d'ensemble
  {
    href: "/admin/dashboard",
    label: "Tableau de bord",
    icon: "📊",
  },
  {
    href: "/admin/control-center",
    label: "Centre de contrôle",
    icon: "📌",
  },

  // 2. ⚙️ Administration du site
  {
    href: "/admin/gestion-acces",
    label: "Administration du site",
    icon: "⚙️",
    children: [
      {
        href: "/admin/gestion-acces",
        label: "Accès administrateur",
      },
      {
        href: "/admin/gestion-acces/dashboard",
        label: "Paramètres / configuration",
      },
      {
        href: "/admin/gestion-acces/permissions",
        label: "Permissions par section (Fondateurs)",
      },
    ],
  },

  // 3. 👥 Gestion des membres
  {
    href: "/admin/membres",
    label: "Gestion des membres",
    icon: "👥",
    children: [
      {
        href: "/admin/membres",
        label: "Hub membres",
      },
      {
        href: "/admin/membres/gestion",
        label: "Liste & gestion des membres",
      },
      {
        href: "/admin/membres/incomplets",
        label: "Comptes incomplets",
      },
      {
        href: "/admin/membres/erreurs",
        label: "Incohérences & erreurs",
      },
      {
        href: "/admin/membres/synchronisation",
        label: "Synchronisation des données",
      },
      {
        href: "/admin/membres/badges",
        label: "Badges & rôles",
      },
      {
        href: "/admin/membres/vip",
        label: "VIP & reconnaissances",
      },
      {
        href: "/admin/membres/historique",
        label: "Historique des modifications",
      },
    ],
  },

  // 4. 🌟 Spotlight & mise en avant
  {
    href: "/admin/spotlight",
    label: "Spotlight & mise en avant",
    icon: "🌟",
    children: [
      {
        href: "/admin/spotlight",
        label: "Hub Spotlight",
      },
      {
        href: "/admin/spotlight/gestion",
        label: "Gestion des Spotlights",
      },
      {
        href: "/admin/spotlight/membres",
        label: "Données par streamer",
      },
      {
        href: "/admin/spotlight/presence",
        label: "Présence & participation",
      },
      {
        href: "/admin/spotlight/evaluation",
        label: "Évaluation Spotlight",
      },
    ],
  },

  // 5. 👁️ Suivi de l'engagement (ALLÉGÉ - seulement Hub, pages individuelles accessibles via le hub)
  {
    href: "/admin/follow",
    label: "Suivi de l'engagement",
    icon: "👁️",
    // Pas d'enfants dans la sidebar - les pages individuelles (/admin/follow/red, /admin/follow/clara, etc.)
    // restent accessibles via le hub mais ne sont plus listées pour alléger le menu
  },

  // 6. 📈 Évaluation mensuelle
  {
    href: "/admin/evaluation",
    label: "Évaluation mensuelle",
    icon: "📈",
    children: [
      {
        href: "/admin/evaluation",
        label: "Hub évaluation",
      },
      {
        href: "/admin/evaluation/a",
        label: "Présence & activité",
        children: [
          {
            href: "/admin/evaluation/a/spotlights",
            label: "Spotlights",
          },
          {
            href: "/admin/evaluation/a/raids",
            label: "Raids",
          },
        ],
      },
      {
        href: "/admin/evaluation/b",
        label: "Engagement communautaire",
        children: [
          {
            href: "/admin/evaluation/b/discord",
            label: "Discord",
          },
          {
            href: "/admin/evaluation/b/events-serveur",
            label: "Events serveur",
          },
        ],
      },
      {
        href: "/admin/evaluation/c",
        label: "Suivi des follows",
      },
      {
        href: "/admin/evaluation/d",
        label: "Synthèse & bonus",
      },
      {
        href: "/admin/evaluation/result",
        label: "Résultat final",
      },
    ],
  },

  // 7. 🚪 Intégration des membres
  {
    href: "/admin/evaluations",
    label: "Intégration des membres",
    icon: "🚪",
    children: [
      {
        href: "/admin/evaluations",
        label: "Hub intégration",
      },
      {
        href: "/admin/evaluations/planification",
        label: "Planification des réunions",
      },
      {
        href: "/admin/evaluations/inscription",
        label: "Inscriptions",
      },
      {
        href: "/admin/evaluations/presence-retour",
        label: "Présence & retours",
      },
      {
        href: "/admin/evaluations/statistique",
        label: "Statistiques",
      },
      {
        href: "/admin/evaluations/presentation",
        label: "Présentation TENF",
      },
      {
        href: "/admin/evaluations/discours",
        label: "Discours & trame",
      },
    ],
  },

  // 8. 🚀 Suivi des raids
  {
    href: "/admin/raids",
    label: "Suivi des raids",
    icon: "🚀",
    children: [
      {
        href: "/admin/raids",
        label: "Hub raids",
      },
      {
        href: "/admin/raids/twitch",
        label: "Raids Twitch",
      },
      {
        href: "/admin/raids/historique",
        label: "Historique des raids",
      },
    ],
  },

  // 9. 📅 Événements communautaires
  {
    href: "/admin/events",
    label: "Événements communautaires",
    icon: "📅",
    children: [
      {
        href: "/admin/events",
        label: "Hub événements",
      },
      {
        href: "/admin/events/planification",
        label: "Planification",
      },
      {
        href: "/admin/events/liste",
        label: "Liste des événements",
      },
      {
        href: "/admin/events/presence",
        label: "Présences & participation",
      },
      {
        href: "/admin/events/recap",
        label: "Récapitulatif",
      },
    ],
  },

  // 10. 🛒 Boutique & récompenses
  {
    href: "/admin/boutique",
    label: "Boutique & récompenses",
    icon: "🛒",
  },

  // 11. 📜 Logs & historique
  {
    href: "/admin/log-center",
    label: "Logs & audit",
    icon: "📜",
  },

  // 12. 🔎 Recherche
  {
    href: "/admin/search",
    label: "Recherche membre",
    icon: "🔎",
  },
];

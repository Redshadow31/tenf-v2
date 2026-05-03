/**
 * Configuration de navigation pour la sidebar admin
 *
 * IMPORTANT: ne pas modifier les href (routes stables).
 * Libellés orientés modérateurs / administrateurs : formulations courtes, vocabulaire de pilotage (animation,
 * engagement, validation) plutôt que marketing grand public.
 */

export interface NavItem {
  href: string;
  label: string;
  icon?: string;
  sectionLabel?: string;
  children?: NavItem[];
}

export const adminNavigation: NavItem[] = [
  {
    href: "/admin/pilotage",
    label: "Pilotage du serveur",
    icon: "📊",
    sectionLabel: "PILOTAGE",
    children: [
      { href: "/admin/pilotage", label: "Vue d'ensemble pilotage" },
      { href: "/admin/pilotage/backlog", label: "File d'actions (backlog)" },
      { href: "/admin/pilotage/incidents", label: "Incidents & alertes" },
      { href: "/admin/pilotage/ops-live", label: "Monitoring temps réel" },
      { href: "/admin/pilotage/data-health", label: "Qualité des données" },
      { href: "/admin/pilotage/release-readiness", label: "Préparation release" },
    ],
  },
  {
    href: "/admin/mon-compte",
    label: "Mon compte",
    icon: "👤",
    sectionLabel: "COMPTE",
  },
  {
    href: "/admin/membres",
    label: "Gestion des membres",
    icon: "👥",
    sectionLabel: "MEMBRES",
    children: [
      {
        href: "/admin/membres",
        label: "Vue d'ensemble & recherche",
        children: [
          { href: "/admin/membres", label: "Dashboard membres" },
          { href: "/admin/membres/gestion", label: "Liste & gestion des membres" },
          { href: "/admin/membres/actions", label: "Actions à traiter (queue unifiée)" },
          { href: "/admin/search", label: "Recherche membre" },
        ],
      },
      {
        href: "/admin/membres/validation-profil",
        label: "Cycle profil",
        children: [
          { href: "/admin/membres/validation-profil", label: "Validation des profils" },
          { href: "/admin/membres/revues", label: "Revues membres (SLA & responsables)" },
          { href: "/admin/membres/historique", label: "Historique des modifications" },
        ],
      },
      {
        href: "/admin/membres/qualite-data",
        label: "Qualité data",
        children: [
          { href: "/admin/membres/qualite-data", label: "Qualité data (vue fusionnée)" },
          { href: "/admin/membres/incomplets", label: "Comptes incomplets" },
          { href: "/admin/membres/reconciliation", label: "Réconciliation public -> gestion" },
        ],
      },
      {
        href: "/admin/membres/badges",
        label: "Rôles & distinctions",
        children: [
          { href: "/admin/membres/badges", label: "Badges & rôles" },
          { href: "/admin/membres/vip", label: "VIP & reconnaissances" },
        ],
      },
      {
        href: "/admin/membres/postulations",
        label: "Recrutement staff",
        children: [{ href: "/admin/membres/postulations", label: "Postulations staff" }],
      },
    ],
  },
  {
    href: "/admin/onboarding",
    label: "Accueil & intégration",
    icon: "🌱",
    sectionLabel: "ACCUEIL",
    children: [
      {
        href: "/admin/onboarding",
        label: "Sessions d'accueil",
        children: [
          { href: "/admin/onboarding", label: "Tableau de bord" },
          { href: "/admin/onboarding/sessions", label: "Créneaux & annonces" },
          { href: "/admin/onboarding/inscriptions", label: "Inscriptions" },
          { href: "/admin/onboarding/staff", label: "Équipe sur session" },
          { href: "/admin/onboarding/presences", label: "Présences & passage membre" },
          { href: "/admin/onboarding/activation", label: "Rôles & activation" },
          { href: "/admin/onboarding/contenus", label: "Supports & discours" },
          { href: "/admin/onboarding/kpi", label: "Indicateurs" },
        ],
      },
    ],
  },
  {
    href: "/admin/communaute",
    label: "Animation & engagement",
    icon: "🎉",
    sectionLabel: "ANIMATION",
    children: [
      {
        href: "/admin/communaute",
        label: "Synthèse",
        children: [
          { href: "/admin/communaute", label: "Tableau de bord — animation & engagement" },
        ],
      },
      {
        href: "/admin/communaute/evenements",
        label: "Événements",
        children: [
          { href: "/admin/communaute/evenements", label: "Pilotage des événements" },
          { href: "/admin/communaute/evenements/suivi", label: "Suivi par type de créneau" },
          { href: "/admin/communaute/evenements/calendrier", label: "Calendrier & planification" },
          { href: "/admin/communaute/evenements/participation", label: "Présences & participation" },
          { href: "/admin/communaute/evenements/propositions", label: "Propositions des membres" },
          { href: "/admin/communaute/evenements/liens-vocaux", label: "Liens vocaux (Discord)" },
          { href: "/admin/communaute/evenements/archives", label: "Archives des événements" },
        ],
      },
      {
        href: "/admin/communaute/anniversaires",
        label: "Anniversaires & reconnaissance",
        children: [
          { href: "/admin/communaute/anniversaires", label: "Vue d’ensemble anniversaires" },
          { href: "/admin/communaute/anniversaires/mois", label: "Anniversaires du mois" },
          { href: "/admin/communaute/anniversaires/tous", label: "Tous les anniversaires" },
        ],
      },
      {
        href: "/admin/communaute/engagement/follow",
        label: "Follows mutuels",
        children: [
          { href: "/admin/communaute/engagement", label: "Vue d’ensemble engagement" },
          { href: "/admin/communaute/engagement/follow", label: "Suivi des follows (membres)" },
          { href: "/admin/communaute/engagement/feuilles-follow", label: "Feuilles de suivi" },
          { href: "/admin/communaute/engagement/config-follow", label: "Paramètres réservés au staff" },
        ],
      },
      {
        href: "/admin/communaute/engagement/raids-fiabilite",
        label: "Raids & fiabilité",
        children: [
          { href: "/admin/communaute/engagement/raids-fiabilite", label: "Accueil catégorie" },
          { href: "/admin/communaute/engagement/raids-eventsub", label: "Raids — EventSub" },
          { href: "/admin/communaute/engagement/signalements-raids", label: "File signalements & correctifs" },
          { href: "/admin/communaute/engagement/historique-raids", label: "Historique des raids" },
        ],
      },
      {
        href: "/admin/communaute/engagement/points-discord",
        label: "Points Discord",
        children: [
          { href: "/admin/communaute/engagement/points-discord", label: "Règles & attribution des points" },
        ],
      },
      {
        href: "/admin/communaute/evenements/spotlight",
        label: "Spotlight — outillage historique",
        children: [
          { href: "/admin/communaute/evenements/spotlight", label: "Pilotage Spotlight (hérité)" },
          { href: "/admin/communaute/evenements/spotlight/gestion", label: "Paramètres & sessions" },
          { href: "/admin/communaute/evenements/spotlight/evaluation", label: "Évaluation streamer (staff)" },
          { href: "/admin/communaute/evenements/spotlight/membres", label: "Consultation des évaluations" },
          { href: "/admin/communaute/evenements/spotlight/presences", label: "Présences enregistrées" },
          { href: "/admin/communaute/evenements/spotlight/analytics", label: "Analyses & tendances" },
          { href: "/admin/communaute/evenements/spotlight/recover", label: "Récupération de données" },
        ],
      },
    ],
  },
  {
    href: "/admin/upa-event",
    label: "Partenariats",
    icon: "🤝",
    sectionLabel: "PARTENARIATS",
    children: [{ href: "/admin/upa-event", label: "UPA Event" }],
  },
  {
    href: "/admin/new-family-aventura",
    label: "New Family & Aventures",
    icon: "🎢",
    sectionLabel: "PROJETS",
    children: [
      { href: "/admin/new-family-aventura", label: "Vue d'ensemble" },
      { href: "/admin/new-family-aventura/reponses-interet", label: "Réponses & intérêt" },
      { href: "/admin/new-family-aventura/questions-preferences", label: "Questions / préférences" },
      { href: "/admin/new-family-aventura/galerie-inspiration", label: "Galerie inspiration" },
      { href: "/admin/new-family-aventura/galerie-souvenirs", label: "Galerie souvenirs" },
      { href: "/admin/new-family-aventura/parametres-page", label: "Paramètres page" },
    ],
  },
  {
    href: "/admin/interviews",
    label: "Contenus publics",
    icon: "🎬",
    sectionLabel: "CONTENUS",
    children: [{ href: "/admin/interviews", label: "Interviews TENF (YouTube)" }],
  },
  {
    href: "/admin/evaluation",
    label: "Évaluation & progression",
    icon: "📊",
    sectionLabel: "ÉVALUATION",
    children: [
      {
        href: "/admin/evaluation",
        label: "Évaluation mensuelle",
        children: [
          { href: "/admin/evaluation", label: "Dashboard évaluation" },
          { href: "/admin/evaluation/a", label: "Présence & activité" },
          { href: "/admin/evaluation/b", label: "Engagement animation (critère B)" },
          { href: "/admin/evaluation/c", label: "Suivi des follows" },
          { href: "/admin/evaluation/d", label: "Synthèse & bonus" },
          { href: "/admin/evaluation/result", label: "Résultats validés" },
          { href: "/admin/evaluation/progression", label: "Progression" },
          { href: "/admin/evaluation/v2/guide", label: "Guide évaluation v2" },
          { href: "/admin/evaluation/v2", label: "Évaluation v2" },
          { href: "/admin/evaluation/v2/sources", label: "Pilotage données manquantes v2" },
          { href: "/admin/evaluation/v2/pilotage", label: "Pilotage manuel v2" },
        ],
      },
    ],
  },
  {
    href: "/admin/boutique",
    label: "Récompenses & avantages",
    icon: "🎁",
    sectionLabel: "RÉCOMPENSES",
    children: [{ href: "/admin/boutique", label: "Boutique & récompenses" }],
  },
  {
    href: "/admin/academy",
    label: "Formation & accompagnement",
    icon: "🎓",
    sectionLabel: "FORMATION",
    children: [
      {
        href: "/admin/academy",
        label: "TENF Academy",
        children: [
          { href: "/admin/academy", label: "Dashboard Academy" },
          { href: "/admin/academy/access", label: "Accès & rôles" },
          { href: "/admin/academy/promos", label: "Promos" },
          { href: "/admin/academy/participants", label: "Participants" },
        ],
      },
      {
        href: "/admin/formation",
        label: "Formation TENF",
        children: [
          { href: "/admin/formation", label: "Dashboard formation" },
          { href: "/admin/formation/twitch-rules", label: "Comprendre Twitch et ses règles" },
        ],
      },
    ],
  },
  {
    href: "/admin/moderation/staff",
    label: "Modération",
    icon: "🛡️",
    sectionLabel: "MODÉRATION",
    children: [
      { href: "/admin/moderation/staff", label: "Dashboard modération staff" },
      { href: "/admin/mon-compte", label: "Mon compte (profil staff)" },
      { href: "/admin/mon-compte/pilotage-staff", label: "Mon compte — Pilotage staff (admin avancé)" },
      { href: "/admin/moderation/staff/info/annonces-staff", label: "Info - Annonces staff" },
      { href: "/admin/moderation/staff/info/charte", label: "Info - Charte modération" },
      { href: "/admin/moderation/staff/info/validation-charte", label: "Info - Validation charte" },
      { href: "/admin/moderation/staff/info/comptes-rendus-reunions", label: "Info - Comptes rendus de réunion" },
      { href: "/admin/moderation/staff/petits-travaux/exercices-mensuels", label: "Petit travaux - Exercices mensuels" },
      { href: "/admin/moderation/staff/petits-travaux/mes-soumissions", label: "Petit travaux - Mes soumissions" },
      { href: "/admin/moderation/staff/petits-travaux/mes-validations", label: "Petit travaux - Mes validations" },
      { href: "/admin/moderation/staff/discord/tickets", label: "Discord - Tickets" },
      { href: "/admin/moderation/staff/discord/incidents-streamers", label: "Discord - Incidents streamers" },
      { href: "/admin/moderation/staff/discord/cas-sensibles", label: "Discord - Cas sensibles" },
    ],
  },
  {
    href: "/admin/gestion-acces/accueil",
    label: "Administration du site",
    icon: "⚙️",
    sectionLabel: "ADMINISTRATION",
    children: [
      {
        href: "/admin/gestion-acces/accueil",
        label: "Vue d'ensemble administration",
        children: [{ href: "/admin/gestion-acces/accueil", label: "Dashboard d'accueil administration" }],
      },
      {
        href: "/admin/gestion-acces",
        label: "Accès & sécurité",
        children: [
          { href: "/admin/gestion-acces", label: "Comptes administrateurs" },
          { href: "/admin/gestion-acces/permissions", label: "Permissions par section" },
          { href: "/admin/gestion-acces/admin-avance", label: "Accès admin avancé (fondateurs)" },
        ],
      },
      {
        href: "/admin/gestion-acces/dashboard",
        label: "Configuration & données",
        children: [
          { href: "/admin/gestion-acces/dashboard", label: "Paramètres dashboard" },
          { href: "/admin/gestion-acces/images", label: "Gestion des images profils Twitch" },
          { href: "/admin/migration", label: "Migration des données" },
        ],
      },
      {
        href: "/admin/gestion-acces/organigramme-staff",
        label: "Organisation staff",
        children: [
          { href: "/admin/gestion-acces/organigramme-staff", label: "Organigramme staff" },
          { href: "/admin/gestion-acces/missions-staff", label: "Missions nominatives staff" },
          { href: "/admin/gestion-acces/reunions-staff-mensuelles", label: "Réunions mensuelles staff" },
          { href: "/admin/follow/config", label: "Configuration follow staff" },
        ],
      },
      {
        href: "/admin/moderation",
        label: "Modération",
        children: [
          { href: "/admin/moderation", label: "Dashboard modération" },
          { href: "/admin/mon-compte", label: "Mon compte (profil staff)" },
          { href: "/admin/mon-compte/pilotage-staff", label: "Mon compte — Pilotage staff (admin avancé)" },
          { href: "/admin/moderation/config/navigation-labels", label: "Config - Labels navigation" },
          { href: "/admin/moderation/config/roles-permissions", label: "Config - Rôles & permissions" },
          { href: "/admin/moderation/config/parametres", label: "Config - Paramètres" },
          { href: "/admin/moderation/logs/actions", label: "Logs - Actions" },
          { href: "/admin/moderation/logs/status-history", label: "Logs - Historique statuts" },
          { href: "/admin/moderation/logs/exports", label: "Logs - Exports" },
          { href: "/admin/moderation/info/annonces", label: "Info - Annonces" },
          { href: "/admin/moderation/info/charte-versions", label: "Info - Charte versions" },
          { href: "/admin/moderation/info/charte-validations", label: "Info - Charte validations" },
          { href: "/admin/moderation/staff/info/validation-charte", label: "Info - Validation charte (staff)" },
          { href: "/admin/moderation/petits-travaux/catalogue-exercices", label: "Petit travaux - Catalogue" },
          { href: "/admin/moderation/petits-travaux/campagnes-mensuelles", label: "Petit travaux - Campagnes" },
          { href: "/admin/moderation/petits-travaux/assignations", label: "Petit travaux - Assignations" },
          { href: "/admin/moderation/petits-travaux/soumissions", label: "Petit travaux - Soumissions" },
          { href: "/admin/moderation/petits-travaux/validations", label: "Petit travaux - Validations" },
          { href: "/admin/moderation/discord/tickets", label: "Discord - Tickets" },
          { href: "/admin/moderation/discord/incidents", label: "Discord - Incidents" },
          { href: "/admin/moderation/discord/cas-sensibles", label: "Discord - Cas sensibles" },
          { href: "/admin/moderation/discord/transferts-admin", label: "Discord - Transferts admin" },
        ],
      },
      {
        href: "/admin/audit-logs",
        label: "Logs & conformité",
        children: [
          { href: "/admin/audit-logs", label: "Audit & logs" },
          { href: "/admin/gestion-acces/retours-faq", label: "Retours FAQ rejoindre" },
          { href: "/admin/audit-logs/connexions", label: "Logs de connexion" },
          { href: "/admin/audit-logs/membres", label: "Logs membres" },
          { href: "/admin/audit-logs/historique-pages", label: "Historique des pages" },
          { href: "/admin/audit-logs/temps-reel", label: "Temps réel" },
          { href: "/admin/log-center", label: "Logs & audit (legacy)" },
          { href: "/admin/log-center/notifications-lues", label: "Notifications lues (legacy)" },
        ],
      },
    ],
  },
];

/**
 * Navigation admin simple - pour les modérateurs qui débutent
 * Même structure de hubs que le mode avancé (Capture 2) en TopBar,
 * sidebar allégée avec les sections essentielles
 */
export const adminNavigationSimple: NavItem[] = [
  {
    href: "/admin/pilotage",
    label: "Pilotage du serveur",
    icon: "📊",
    children: [
      { href: "/admin/pilotage", label: "Vue d'ensemble pilotage" },
      { href: "/admin/pilotage/backlog", label: "File d'actions" },
      { href: "/admin/pilotage/incidents", label: "Incidents & alertes" },
      { href: "/admin/pilotage/ops-live", label: "Monitoring temps réel" },
      { href: "/admin/pilotage/data-health", label: "Qualité des données" },
      { href: "/admin/pilotage/release-readiness", label: "Préparation release" },
    ],
  },
  {
    href: "/admin/mon-compte",
    label: "Mon compte",
    icon: "👤",
  },
  {
    href: "/admin/membres",
    label: "Gestion des membres",
    icon: "👥",
    children: [
      {
        href: "/admin/membres",
        label: "Vue d'ensemble & recherche",
        children: [
          { href: "/admin/membres", label: "Dashboard membres" },
          { href: "/admin/membres/gestion", label: "Liste & gestion" },
          { href: "/admin/membres/actions", label: "Actions à traiter" },
          { href: "/admin/search", label: "Recherche membre" },
        ],
      },
      {
        href: "/admin/membres/validation-profil",
        label: "Cycle profil",
        children: [
          { href: "/admin/membres/validation-profil", label: "Validation des profils" },
          { href: "/admin/membres/revues", label: "Revues membres" },
          { href: "/admin/membres/historique", label: "Historique des modifications" },
        ],
      },
      {
        href: "/admin/membres/qualite-data",
        label: "Qualité data",
        children: [
          { href: "/admin/membres/qualite-data", label: "Qualité data" },
          { href: "/admin/membres/incomplets", label: "Comptes incomplets" },
          { href: "/admin/membres/reconciliation", label: "Détection public -> gestion" },
        ],
      },
      {
        href: "/admin/membres/badges",
        label: "Rôles & distinctions",
        children: [
          { href: "/admin/membres/badges", label: "Badges & rôles" },
          { href: "/admin/membres/vip", label: "VIP & reconnaissances" },
        ],
      },
      {
        href: "/admin/membres/postulations",
        label: "Recrutement staff",
        children: [{ href: "/admin/membres/postulations", label: "Postulations staff" }],
      },
    ],
  },
  {
    href: "/admin/onboarding",
    label: "Accueil & intégration",
    icon: "🌱",
    children: [
      {
        href: "/admin/onboarding",
        label: "Sessions d'accueil",
        children: [
          { href: "/admin/onboarding", label: "Tableau de bord" },
          { href: "/admin/onboarding/sessions", label: "Créneaux & annonces" },
          { href: "/admin/onboarding/inscriptions", label: "Inscriptions" },
          { href: "/admin/onboarding/staff", label: "Équipe sur session" },
          { href: "/admin/onboarding/presences", label: "Présences & passage membre" },
          { href: "/admin/onboarding/activation", label: "Rôles & activation" },
          { href: "/admin/onboarding/contenus", label: "Supports & discours" },
          { href: "/admin/onboarding/kpi", label: "Indicateurs" },
        ],
      },
    ],
  },
  {
    href: "/admin/communaute",
    label: "Animation & engagement",
    icon: "🎉",
    children: [
      {
        href: "/admin/communaute",
        label: "Synthèse",
        children: [{ href: "/admin/communaute", label: "Tableau de bord — animation & engagement" }],
      },
      {
        href: "/admin/communaute/evenements",
        label: "Événements",
        children: [
          { href: "/admin/communaute/evenements", label: "Pilotage des événements" },
          { href: "/admin/communaute/evenements/suivi", label: "Suivi par type de créneau" },
          { href: "/admin/communaute/evenements/calendrier", label: "Calendrier & planification" },
          { href: "/admin/communaute/evenements/participation", label: "Présences & participation" },
          { href: "/admin/communaute/evenements/propositions", label: "Propositions des membres" },
          { href: "/admin/communaute/evenements/liens-vocaux", label: "Liens vocaux (Discord)" },
          { href: "/admin/communaute/evenements/archives", label: "Archives des événements" },
        ],
      },
      {
        href: "/admin/communaute/anniversaires",
        label: "Anniversaires & reconnaissance",
        children: [
          { href: "/admin/communaute/anniversaires", label: "Vue d’ensemble anniversaires" },
          { href: "/admin/communaute/anniversaires/mois", label: "Anniversaires du mois" },
          { href: "/admin/communaute/anniversaires/tous", label: "Tous les anniversaires" },
        ],
      },
      {
        href: "/admin/communaute/engagement/follow",
        label: "Follows mutuels",
        children: [
          { href: "/admin/communaute/engagement", label: "Vue d’ensemble engagement" },
          { href: "/admin/communaute/engagement/follow", label: "Suivi des follows (membres)" },
          { href: "/admin/communaute/engagement/feuilles-follow", label: "Feuilles de suivi" },
        ],
      },
      {
        href: "/admin/communaute/engagement/raids-fiabilite",
        label: "Raids & fiabilité",
        children: [
          { href: "/admin/communaute/engagement/raids-fiabilite", label: "Accueil catégorie" },
          { href: "/admin/communaute/engagement/raids-eventsub", label: "Raids — EventSub" },
          { href: "/admin/communaute/engagement/signalements-raids", label: "File signalements & correctifs" },
          { href: "/admin/communaute/engagement/historique-raids", label: "Historique des raids" },
        ],
      },
      {
        href: "/admin/communaute/engagement/points-discord",
        label: "Points Discord",
        children: [{ href: "/admin/communaute/engagement/points-discord", label: "Règles & attribution des points" }],
      },
      {
        href: "/admin/communaute/evenements/spotlight",
        label: "Spotlight — outillage historique",
        children: [
          { href: "/admin/communaute/evenements/spotlight", label: "Pilotage Spotlight (hérité)" },
          { href: "/admin/communaute/evenements/spotlight/gestion", label: "Paramètres & sessions" },
        ],
      },
    ],
  },
  {
    href: "/admin/upa-event",
    label: "Partenariats",
    icon: "🤝",
    children: [{ href: "/admin/upa-event", label: "UPA Event" }],
  },
  {
    href: "/admin/new-family-aventura",
    label: "New Family & Aventures",
    icon: "🎢",
    children: [
      { href: "/admin/new-family-aventura", label: "Vue d'ensemble" },
      { href: "/admin/new-family-aventura/reponses-interet", label: "Réponses & intérêt" },
      { href: "/admin/new-family-aventura/questions-preferences", label: "Questions / préférences" },
      { href: "/admin/new-family-aventura/galerie-inspiration", label: "Galerie inspiration" },
      { href: "/admin/new-family-aventura/galerie-souvenirs", label: "Galerie souvenirs" },
      { href: "/admin/new-family-aventura/parametres-page", label: "Paramètres page" },
    ],
  },
  {
    href: "/admin/interviews",
    label: "Contenus publics",
    icon: "🎬",
    children: [{ href: "/admin/interviews", label: "Interviews TENF (YouTube)" }],
  },
  {
    href: "/admin/evaluation",
    label: "Évaluation & progression",
    icon: "📊",
    children: [
      {
        href: "/admin/evaluation",
        label: "Évaluation mensuelle",
        children: [
          { href: "/admin/evaluation", label: "Dashboard évaluation" },
          { href: "/admin/evaluation/a", label: "Présence & activité" },
          { href: "/admin/evaluation/b", label: "Engagement animation (critère B)" },
          { href: "/admin/evaluation/c", label: "Suivi des follows" },
          { href: "/admin/evaluation/d", label: "Synthèse & bonus" },
          { href: "/admin/evaluation/result", label: "Résultats validés" },
          { href: "/admin/evaluation/progression", label: "Progression" },
          { href: "/admin/evaluation/v2", label: "Évaluation v2" },
        ],
      },
    ],
  },
  {
    href: "/admin/boutique",
    label: "Récompenses & avantages",
    icon: "🎁",
    children: [{ href: "/admin/boutique", label: "Boutique & récompenses" }],
  },
  {
    href: "/admin/academy",
    label: "Formation & accompagnement",
    icon: "🎓",
    children: [
      {
        href: "/admin/academy",
        label: "TENF Academy",
        children: [
          { href: "/admin/academy", label: "Dashboard Academy" },
          { href: "/admin/academy/access", label: "Accès & rôles" },
          { href: "/admin/academy/promos", label: "Promos" },
          { href: "/admin/academy/participants", label: "Participants" },
        ],
      },
      {
        href: "/admin/formation",
        label: "Formation TENF",
        children: [
          { href: "/admin/formation", label: "Dashboard formation" },
          { href: "/admin/formation/twitch-rules", label: "Comprendre Twitch et ses règles" },
        ],
      },
    ],
  },
  {
    href: "/admin/moderation/staff",
    label: "Modération",
    icon: "🛡️",
    children: [
      { href: "/admin/moderation/staff", label: "Dashboard modération staff" },
      { href: "/admin/mon-compte", label: "Mon compte (profil staff)" },
      { href: "/admin/mon-compte/pilotage-staff", label: "Mon compte — Pilotage staff (admin avancé)" },
      {
        href: "/admin/moderation/staff/info",
        label: "Info",
        children: [
          { href: "/admin/moderation/staff/info/annonces-staff", label: "Annonces staff" },
          { href: "/admin/moderation/staff/info/charte", label: "Charte modération" },
          { href: "/admin/moderation/staff/info/validation-charte", label: "Validation charte" },
          { href: "/admin/moderation/staff/info/comptes-rendus-reunions", label: "Comptes rendus de réunion" },
        ],
      },
      {
        href: "/admin/moderation/staff/petits-travaux",
        label: "Petit travaux",
        children: [
          { href: "/admin/moderation/staff/petits-travaux/exercices-mensuels", label: "Exercices mensuels" },
          { href: "/admin/moderation/staff/petits-travaux/mes-soumissions", label: "Mes soumissions" },
          { href: "/admin/moderation/staff/petits-travaux/mes-validations", label: "Mes validations" },
        ],
      },
      {
        href: "/admin/moderation/staff/discord",
        label: "Discord",
        children: [
          { href: "/admin/moderation/staff/discord/tickets", label: "Tickets" },
          { href: "/admin/moderation/staff/discord/incidents-streamers", label: "Incidents streamers" },
          { href: "/admin/moderation/staff/discord/cas-sensibles", label: "Cas sensibles" },
        ],
      },
    ],
  },
  {
    href: "/admin/gestion-acces/accueil",
    label: "Administration du site",
    icon: "⚙️",
    children: [
      {
        href: "/admin/gestion-acces/accueil",
        label: "Vue d'ensemble administration",
        children: [{ href: "/admin/gestion-acces/accueil", label: "Dashboard d'accueil" }],
      },
      {
        href: "/admin/gestion-acces",
        label: "Accès & sécurité",
        children: [
          { href: "/admin/gestion-acces", label: "Comptes administrateurs" },
          { href: "/admin/gestion-acces/permissions", label: "Permissions par section" },
          { href: "/admin/gestion-acces/admin-avance", label: "Accès admin avancé" },
        ],
      },
      {
        href: "/admin/gestion-acces/dashboard",
        label: "Configuration & données",
        children: [
          { href: "/admin/gestion-acces/dashboard", label: "Paramètres dashboard" },
          { href: "/admin/gestion-acces/images", label: "Images profils Twitch" },
          { href: "/admin/migration", label: "Migration des données" },
        ],
      },
      {
        href: "/admin/gestion-acces/organigramme-staff",
        label: "Organisation staff",
        children: [
          { href: "/admin/gestion-acces/organigramme-staff", label: "Organigramme staff" },
          { href: "/admin/gestion-acces/missions-staff", label: "Missions nominatives staff" },
          { href: "/admin/gestion-acces/reunions-staff-mensuelles", label: "Réunions mensuelles staff" },
          { href: "/admin/follow/config", label: "Configuration follow staff" },
        ],
      },
      {
        href: "/admin/moderation",
        label: "Modération",
        children: [
          { href: "/admin/moderation/staff", label: "Dashboard modération staff" },
          { href: "/admin/mon-compte", label: "Mon compte (profil staff)" },
          { href: "/admin/mon-compte/pilotage-staff", label: "Mon compte — Pilotage staff (admin avancé)" },
          { href: "/admin/moderation/staff/info/annonces-staff", label: "Info - Annonces staff" },
          { href: "/admin/moderation/staff/info/charte", label: "Info - Charte modération" },
          { href: "/admin/moderation/staff/info/validation-charte", label: "Info - Validation charte" },
          { href: "/admin/moderation/staff/info/comptes-rendus-reunions", label: "Info - Comptes rendus de réunion" },
          { href: "/admin/moderation/staff/petits-travaux/exercices-mensuels", label: "Petit travaux - Exercices mensuels" },
          { href: "/admin/moderation/staff/petits-travaux/mes-soumissions", label: "Petit travaux - Mes soumissions" },
          { href: "/admin/moderation/staff/petits-travaux/mes-validations", label: "Petit travaux - Mes validations" },
          { href: "/admin/moderation/staff/discord/tickets", label: "Discord - Tickets" },
          { href: "/admin/moderation/staff/discord/incidents-streamers", label: "Discord - Incidents streamers" },
          { href: "/admin/moderation/staff/discord/cas-sensibles", label: "Discord - Cas sensibles" },
        ],
      },
      {
        href: "/admin/audit-logs",
        label: "Logs & conformité",
        children: [
          { href: "/admin/audit-logs", label: "Audit & logs" },
          { href: "/admin/gestion-acces/retours-faq", label: "Retours FAQ rejoindre" },
          { href: "/admin/audit-logs/connexions", label: "Logs de connexion" },
          { href: "/admin/audit-logs/membres", label: "Logs membres" },
        ],
      },
    ],
  },
  { href: "/admin/search", label: "Recherche membre", icon: "🔎" },
];

/**
 * Navigation admin avancé - menu complet
 */
export const adminNavigationAvance = adminNavigation;

export type AdminMode = "simple" | "advanced";

export function getNavigationByMode(mode: AdminMode): NavItem[] {
  return mode === "advanced" ? adminNavigationAvance : adminNavigationSimple;
}

function isItemActiveInTree(item: NavItem, pathname: string): boolean {
  if (pathname === item.href || pathname.startsWith(`${item.href}/`)) {
    return true;
  }
  if (!item.children || item.children.length === 0) {
    return false;
  }
  return item.children.some((child) => isItemActiveInTree(child, pathname));
}

export function findActiveHub(navItems: NavItem[], pathname: string): NavItem | null {
  if (!navItems.length) return null;
  const matched = navItems.find((item) => isItemActiveInTree(item, pathname));
  return matched || navItems[0];
}

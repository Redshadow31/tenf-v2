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
    label: "Onboarding membres",
    icon: "🌱",
    sectionLabel: "ONBOARDING",
    children: [
      {
        href: "/admin/onboarding",
        label: "Parcours onboarding",
        children: [
          { href: "/admin/onboarding", label: "Dashboard onboarding" },
          { href: "/admin/onboarding/sessions", label: "Sessions (planification)" },
          { href: "/admin/onboarding/inscriptions", label: "Inscriptions membres" },
          { href: "/admin/onboarding/staff", label: "Staff onboarding" },
          { href: "/admin/onboarding/presences", label: "Présences & retours" },
          { href: "/admin/onboarding/activation", label: "Activation membres" },
          { href: "/admin/onboarding/contenus", label: "Contenus onboarding" },
          { href: "/admin/onboarding/kpi", label: "KPI onboarding" },
        ],
      },
    ],
  },
  {
    href: "/admin/communaute",
    label: "Vie communautaire",
    icon: "🎉",
    sectionLabel: "COMMUNAUTÉ",
    children: [
      {
        href: "/admin/communaute",
        label: "Vue d'ensemble",
        children: [
          { href: "/admin/communaute", label: "Dashboard Vie communautaire" },
        ],
      },
      {
        href: "/admin/communaute/evenements",
        label: "Événements & animation",
        children: [
          { href: "/admin/communaute/evenements", label: "Pilotage événements" },
          { href: "/admin/communaute/evenements/calendrier", label: "Calendrier & planification" },
          { href: "/admin/communaute/evenements/participation", label: "Participation & présences" },
          { href: "/admin/communaute/evenements/propositions", label: "Événements proposés" },
          { href: "/admin/communaute/evenements/liens-vocaux", label: "Liens vocaux" },
          { href: "/admin/communaute/evenements/archives", label: "Archives événements" },
        ],
      },
      {
        href: "/admin/communaute/anniversaires",
        label: "Moments communautaires",
        children: [
          { href: "/admin/communaute/anniversaires", label: "Dashboard anniversaires" },
          { href: "/admin/communaute/anniversaires/mois", label: "Anniversaires du mois" },
          { href: "/admin/communaute/anniversaires/tous", label: "Tous les anniversaires" },
        ],
      },
      {
        href: "/admin/communaute/engagement/follow",
        label: "Engagement follow",
        children: [
          { href: "/admin/communaute/engagement", label: "Centre engagement" },
          { href: "/admin/communaute/engagement/follow", label: "Follow" },
          { href: "/admin/communaute/engagement/feuilles-follow", label: "Feuilles de follow" },
          { href: "/admin/communaute/engagement/config-follow", label: "Configuration follow staff" },
        ],
      },
      {
        href: "/admin/communaute/engagement/raids-eventsub",
        label: "Engagement raids",
        children: [
          { href: "/admin/communaute/engagement/raids-eventsub", label: "Raids EventSub" },
          { href: "/admin/communaute/engagement/signalements-raids", label: "Signalements raid (fallback bug)" },
          { href: "/admin/communaute/engagement/historique-raids", label: "Historique raids" },
        ],
      },
      {
        href: "/admin/communaute/engagement/points-discord",
        label: "Points Discord",
        children: [{ href: "/admin/communaute/engagement/points-discord", label: "Points Discord" }],
      },
      {
        href: "/admin/communaute/evenements/spotlight",
        label: "Spotlight (legacy / transition)",
        children: [
          { href: "/admin/communaute/evenements/spotlight", label: "Pilotage Spotlight (legacy)" },
          { href: "/admin/communaute/evenements/spotlight/gestion", label: "Gestion Spotlight" },
          { href: "/admin/communaute/evenements/spotlight/evaluation", label: "Évaluer le streamer" },
          { href: "/admin/communaute/evenements/spotlight/membres", label: "Consulter les évaluations" },
          { href: "/admin/communaute/evenements/spotlight/presences", label: "Présences Spotlight" },
          { href: "/admin/communaute/evenements/spotlight/analytics", label: "Analyse Spotlight" },
          { href: "/admin/communaute/evenements/spotlight/recover", label: "Récupération Spotlight" },
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
          { href: "/admin/evaluation/b", label: "Engagement communautaire" },
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
      { href: "/admin/moderation/staff/info/annonces-staff", label: "Info - Annonces staff" },
      { href: "/admin/moderation/staff/info/charte", label: "Info - Charte modération" },
      { href: "/admin/moderation/staff/info/validation-charte", label: "Info - Validation charte" },
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
          { href: "/admin/follow/config", label: "Configuration follow staff" },
        ],
      },
      {
        href: "/admin/moderation",
        label: "Modération",
        children: [
          { href: "/admin/moderation", label: "Dashboard modération" },
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
 * Menu allégé avec les sections essentielles de consultation
 */
export const adminNavigationSimple: NavItem[] = [
  { href: "/admin/pilotage", label: "Vue d'ensemble pilotage", icon: "📊" },
  { href: "/admin/pilotage/backlog", label: "File d'actions", icon: "📌" },
  { href: "/admin/pilotage/incidents", label: "Incidents & alertes", icon: "🚨" },
  { href: "/admin/pilotage/ops-live", label: "Monitoring temps réel", icon: "🛰️" },
  { href: "/admin/pilotage/data-health", label: "Qualité des données", icon: "🧬" },
  { href: "/admin/pilotage/release-readiness", label: "Préparation release", icon: "🧪" },
  {
    href: "/admin/membres",
    label: "Membres",
    icon: "👥",
    children: [
      { href: "/admin/membres", label: "Dashboard membres" },
      { href: "/admin/membres/gestion", label: "Liste & gestion" },
      { href: "/admin/membres/actions", label: "Actions à traiter" },
      { href: "/admin/membres/revues", label: "Revues membres" },
      { href: "/admin/membres/qualite-data", label: "Qualité data" },
      { href: "/admin/membres/reconciliation", label: "Détection public -> gestion" },
      { href: "/admin/membres/postulations", label: "Postulations staff" },
    ],
  },
  {
    href: "/admin/onboarding",
    label: "Onboarding",
    icon: "🚪",
    children: [
      { href: "/admin/onboarding", label: "Dashboard onboarding" },
      { href: "/admin/onboarding/sessions", label: "Sessions" },
      { href: "/admin/onboarding/inscriptions", label: "Inscriptions" },
      { href: "/admin/onboarding/staff", label: "Staff onboarding" },
      { href: "/admin/onboarding/presences", label: "Présences" },
      { href: "/admin/onboarding/activation", label: "Activation" },
      { href: "/admin/onboarding/contenus", label: "Contenus" },
      { href: "/admin/onboarding/kpi", label: "KPI" },
    ],
  },
  {
    href: "/admin/communaute",
    label: "Vie communautaire",
    icon: "📅",
    children: [
      { href: "/admin/communaute", label: "Dashboard Vie communautaire" },
      { href: "/admin/communaute/evenements/calendrier", label: "Événements - Calendrier" },
      { href: "/admin/communaute/evenements/participation", label: "Événements - Participation" },
      { href: "/admin/communaute/evenements/propositions", label: "Événements - Propositions" },
      { href: "/admin/communaute/anniversaires", label: "Anniversaires" },
      { href: "/admin/communaute/engagement/raids-eventsub", label: "Raids EventSub" },
      { href: "/admin/communaute/engagement/signalements-raids", label: "Signalements raid" },
      { href: "/admin/communaute/engagement/points-discord", label: "Points Discord" },
      { href: "/admin/communaute/engagement/follow", label: "Follow" },
      { href: "/admin/communaute/engagement/feuilles-follow", label: "Feuilles de follow" },
      { href: "/admin/communaute/evenements/spotlight", label: "Spotlight (legacy)" },
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
    label: "Interviews TENF",
    icon: "🎬",
    children: [{ href: "/admin/interviews", label: "Gestion interviews YouTube" }],
  },
  {
    href: "/admin/moderation/staff",
    label: "Modération",
    icon: "🛡️",
    children: [
      { href: "/admin/moderation/staff", label: "Dashboard modération staff" },
      { href: "/admin/moderation/staff/info/annonces-staff", label: "Info - Annonces staff" },
      { href: "/admin/moderation/staff/info/charte", label: "Info - Charte" },
      { href: "/admin/moderation/staff/info/validation-charte", label: "Info - Validation charte" },
      { href: "/admin/moderation/staff/petits-travaux/exercices-mensuels", label: "Petit travaux - Exercices" },
      { href: "/admin/moderation/staff/discord/tickets", label: "Discord - Tickets" },
    ],
  },
  {
    href: "/admin/gestion-acces/accueil",
    label: "Administration du site",
    icon: "🧭",
    children: [
      { href: "/admin/gestion-acces/accueil", label: "Dashboard administration" },
      { href: "/admin/gestion-acces", label: "Comptes administrateurs" },
      { href: "/admin/gestion-acces/permissions", label: "Permissions" },
      { href: "/admin/gestion-acces/dashboard", label: "Paramètres dashboard" },
      { href: "/admin/gestion-acces/images", label: "Images profils Twitch" },
      { href: "/admin/gestion-acces/organigramme-staff", label: "Organigramme staff" },
      { href: "/admin/gestion-acces/retours-faq", label: "Retours FAQ rejoindre" },
      { href: "/admin/moderation", label: "Dashboard modération" },
      { href: "/admin/moderation/info/annonces", label: "Modération - Annonces" },
      { href: "/admin/moderation/info/charte-validations", label: "Modération - Validations charte" },
      { href: "/admin/moderation/staff/info/validation-charte", label: "Modération - Validation charte (staff)" },
      { href: "/admin/moderation/petits-travaux/validations", label: "Modération - Validations exercices" },
      { href: "/admin/moderation/discord/tickets", label: "Modération - Tickets Discord" },
      { href: "/admin/audit-logs/connexions", label: "Logs de connexion" },
      { href: "/admin/audit-logs/membres", label: "Logs membres" },
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

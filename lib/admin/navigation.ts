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
    href: "/admin/dashboard",
    label: "Pilotage du serveur",
    icon: "📊",
    sectionLabel: "PILOTAGE",
    children: [
      { href: "/admin/dashboard", label: "Tableau de bord" },
      { href: "/admin/control-center", label: "Centre de contrôle" },
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
        label: "Membres",
        children: [
          { href: "/admin/membres", label: "Hub membres" },
          { href: "/admin/membres/gestion", label: "Liste & gestion des membres" },
          { href: "/admin/search", label: "Recherche membre" },
        ],
      },
      {
        href: "/admin/membres/validation-profil",
        label: "Profils & données",
        children: [
          { href: "/admin/membres/incomplets", label: "Comptes incomplets" },
          { href: "/admin/membres/validation-profil", label: "Validation des profils" },
          { href: "/admin/membres/synchronisation", label: "Synchronisation des données" },
          { href: "/admin/membres/reconciliation", label: "Détection public -> gestion" },
          { href: "/admin/membres/erreurs", label: "Incohérences & erreurs" },
          { href: "/admin/membres/historique", label: "Historique des modifications" },
        ],
      },
      {
        href: "/admin/membres/badges",
        label: "Rôles & reconnaissance",
        children: [
          { href: "/admin/membres/badges", label: "Badges & rôles" },
          { href: "/admin/membres/vip", label: "VIP & reconnaissances" },
          { href: "/admin/membres/spotlight", label: "Spotlight (mise en avant lives)" },
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
    href: "/admin/integration",
    label: "Parcours des membres",
    icon: "🌱",
    sectionLabel: "PARCOURS MEMBRE",
    children: [
      {
        href: "/admin/integration",
        label: "Intégration",
        children: [
          { href: "/admin/integration", label: "Hub intégration" },
          { href: "/admin/integration/planification", label: "Planification des réunions" },
          { href: "/admin/integration/inscription", label: "Inscriptions" },
          { href: "/admin/integration/presence-retour", label: "Présence & retours" },
          { href: "/admin/integration/statistique", label: "Statistiques" },
          { href: "/admin/integration/presentation-anime", label: "Présentation TENF" },
          { href: "/admin/integration/discours2", label: "Discours & trame" },
        ],
      },
    ],
  },
  {
    href: "/admin/events",
    label: "Vie communautaire",
    icon: "🎉",
    sectionLabel: "COMMUNAUTÉ",
    children: [
      {
        href: "/admin/events",
        label: "Événements",
        children: [
          { href: "/admin/events", label: "Hub événements" },
          { href: "/admin/events/planification", label: "Planification" },
          { href: "/admin/events/liste", label: "Liste des événements" },
          { href: "/admin/events/presence", label: "Présences & participation" },
          { href: "/admin/events/recap", label: "Récapitulatif" },
          { href: "/admin/events/propositions", label: "Événements proposés" },
        ],
      },
      {
        href: "/admin/events/spotlight",
        label: "Spotlight",
        children: [
          { href: "/admin/spotlight/evaluation", label: "Évaluer le streamer" },
          { href: "/admin/spotlight/membres", label: "Consulter les évaluations" },
          { href: "/admin/events/spotlight/presences", label: "Présences validées (catégorie Spotlight)" },
          { href: "/admin/events/spotlight/analytics", label: "Analyse Spotlight (mois / tout)" },
        ],
      },
      {
        href: "/admin/events/anniversaires",
        label: "Anniversaires",
        children: [
          { href: "/admin/events/anniversaires/mois", label: "Anniversaires du mois" },
          { href: "/admin/events/anniversaires/tous", label: "Tous les anniversaires" },
        ],
      },
      {
        href: "/admin/raids",
        label: "Engagement",
        children: [
          { href: "/admin/follow", label: "Feuilles de follow" },
          { href: "/admin/raids", label: "Suivi des raids" },
        ],
      },
    ],
  },
  {
    href: "/admin/new-family-aventura",
    label: "New Family Aventura",
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
    href: "/admin/evaluation",
    label: "Évaluation & progression",
    icon: "📊",
    sectionLabel: "ÉVALUATION",
    children: [
      {
        href: "/admin/evaluation",
        label: "Évaluation mensuelle",
        children: [
          { href: "/admin/evaluation", label: "Hub évaluation" },
          { href: "/admin/evaluation/a", label: "Présence & activité" },
          { href: "/admin/evaluation/b", label: "Engagement communautaire" },
          { href: "/admin/evaluation/c", label: "Suivi des follows" },
          { href: "/admin/evaluation/d", label: "Synthèse & bonus" },
          { href: "/admin/evaluation/result", label: "Résultats validés" },
          { href: "/admin/evaluation/progression", label: "Progression" },
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
          { href: "/admin/academy", label: "Hub Academy" },
          { href: "/admin/academy/access", label: "Accès & rôles" },
          { href: "/admin/academy/promos", label: "Promos" },
          { href: "/admin/academy/participants", label: "Participants" },
        ],
      },
      {
        href: "/admin/formation",
        label: "Formation TENF",
        children: [
          { href: "/admin/formation", label: "Hub formation" },
          { href: "/admin/formation/twitch-rules", label: "Comprendre Twitch et ses règles" },
        ],
      },
    ],
  },
  {
    href: "/admin/log-center",
    label: "Logs & audit",
    icon: "🧾",
    sectionLabel: "LOGS",
    children: [
      { href: "/admin/log-center", label: "Logs & audit (legacy)" },
      { href: "/admin/audit-logs", label: "Audit & Logs" },
      { href: "/admin/audit-logs/connexions", label: "Logs de connexion" },
      { href: "/admin/audit-logs/historique-pages", label: "Historique des pages" },
      { href: "/admin/audit-logs/temps-reel", label: "Temps réel" },
    ],
  },
  {
    href: "/admin/gestion-acces",
    label: "Administration du site",
    icon: "⚙️",
    sectionLabel: "ADMINISTRATION",
    children: [
      { href: "/admin/gestion-acces", label: "Accès administrateur" },
      { href: "/admin/gestion-acces/dashboard", label: "Paramètres / configuration" },
      { href: "/admin/gestion-acces/permissions", label: "Permissions par section" },
      { href: "/admin/gestion-acces/images", label: "Gestion des images profils Twitch" },
      { href: "/admin/gestion-acces/admin-avance", label: "Accès admin avancé" },
      { href: "/admin/migration", label: "Migration des données" },
      { href: "/admin/follow/config", label: "Configuration staff follow" },
    ],
  },
];

/**
 * Navigation admin simple - pour les modérateurs qui débutent
 * Menu allégé avec les sections essentielles de consultation
 */
export const adminNavigationSimple: NavItem[] = [
  { href: "/admin/dashboard", label: "Tableau de bord", icon: "📊" },
  { href: "/admin/control-center", label: "Centre de contrôle", icon: "📌" },
  {
    href: "/admin/membres",
    label: "Membres",
    icon: "👥",
    children: [
      { href: "/admin/membres", label: "Hub membres" },
      { href: "/admin/membres/gestion", label: "Liste & gestion" },
      { href: "/admin/membres/reconciliation", label: "Détection public -> gestion" },
      { href: "/admin/membres/spotlight", label: "Spotlight lives" },
      { href: "/admin/membres/postulations", label: "Postulations staff" },
    ],
  },
  {
    href: "/admin/integration",
    label: "Intégration",
    icon: "🚪",
    children: [
      { href: "/admin/integration", label: "Hub intégration" },
      { href: "/admin/integration/planification", label: "Planification" },
      { href: "/admin/integration/inscription", label: "Inscriptions" },
      { href: "/admin/integration/presence-retour", label: "Présence & retours" },
    ],
  },
  {
    href: "/admin/events",
    label: "Événements",
    icon: "📅",
    children: [
      { href: "/admin/events", label: "Hub événements" },
      { href: "/admin/events/liste", label: "Liste des événements" },
      { href: "/admin/events/presence", label: "Présences" },
      { href: "/admin/events/propositions", label: "Événements proposés" },
      { href: "/admin/events/spotlight", label: "Groupe Spotlight" },
      { href: "/admin/events/anniversaires", label: "Groupe Anniversaires" },
    ],
  },
  {
    href: "/admin/new-family-aventura",
    label: "New Family Aventura",
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
  { href: "/admin/follow", label: "Suivi de l'engagement", icon: "👁️" },
  {
    href: "/admin/audit-logs",
    label: "Audit & Logs",
    icon: "🧾",
    children: [
      { href: "/admin/audit-logs/connexions", label: "Logs de connexion" },
      { href: "/admin/audit-logs/historique-pages", label: "Historique des pages" },
      { href: "/admin/audit-logs/temps-reel", label: "Temps réel" },
    ],
  },
  { href: "/admin/search", label: "Recherche membre", icon: "🔎" },
];

/**
 * Navigation admin avancé - menu complet
 */
export const adminNavigationAvance = adminNavigation;

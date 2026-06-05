/**
 * Configuration de navigation pour la sidebar admin
 *
 * IMPORTANT: ne pas modifier les href (routes stables).
 * Libellés orientés modérateurs / administrateurs : formulations courtes, vocabulaire de pilotage (animation,
 * engagement, validation) plutôt que marketing grand public.
 *
 * Le bloc "Modération" est dérivé de la source unique `lib/moderation/moderationTree.ts`
 * via `buildModerationNavSection()` pour éviter les duplications.
 */

import { buildModerationNavSection } from "@/lib/moderation/navigation";

export interface NavItem {
  href: string;
  label: string;
  icon?: string;
  sectionLabel?: string;
  children?: NavItem[];
}

const moderationNavStaff = buildModerationNavSection();
const moderationNavFull = buildModerationNavSection({ includeAdminView: true });

function moderationSectionForSidebar(): NavItem {
  return {
    href: moderationNavStaff.href,
    label: moderationNavStaff.label,
    icon: "🛡️",
    sectionLabel: "MODÉRATION",
    children: moderationNavStaff.children,
  };
}

function moderationSectionForAdministration(): NavItem {
  return {
    href: moderationNavFull.href,
    label: moderationNavFull.label,
    children: moderationNavFull.children,
  };
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
    // Hub "Gestion des membres" — labels courts et premium.
    // L'ordre des sous-catégories suit le parcours admin :
    //   Vue d'ensemble → Profils → Données → Staff → Reconnaissance.
    // Toutes les routes restent inchangées (pas de page créée ni supprimée).
    children: [
      {
        href: "/admin/membres",
        label: "Vue d'ensemble",
        children: [
          { href: "/admin/membres", label: "Dashboard membres" },
          { href: "/admin/membres/actions", label: "Actions à traiter" },
          { href: "/admin/membres/gestion", label: "Liste & gestion" },
          { href: "/admin/search", label: "Recherche membre" },
        ],
      },
      {
        href: "/admin/membres/validation-profil",
        label: "Profils",
        children: [
          { href: "/admin/membres/validation-profil", label: "Validation" },
          { href: "/admin/membres/revues", label: "Revues" },
          { href: "/admin/membres/historique", label: "Historique" },
        ],
      },
      {
        href: "/admin/membres/qualite-data",
        label: "Données",
        children: [
          { href: "/admin/membres/qualite-data", label: "Diagnostic" },
          { href: "/admin/membres/incomplets", label: "Comptes incomplets" },
          { href: "/admin/membres/reconciliation", label: "Réconciliation" },
        ],
      },
      {
        href: "/admin/membres/postulations",
        label: "Staff",
        children: [{ href: "/admin/membres/postulations", label: "Candidatures" }],
      },
      {
        href: "/admin/membres/badges",
        label: "Reconnaissance",
        children: [
          { href: "/admin/membres/badges", label: "Badges & rôles" },
          { href: "/admin/membres/vip", label: "VIP" },
        ],
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
          { href: "/admin/onboarding/staff-mobile", label: "Équipe (vue mobile)" },
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
          { href: "/admin/communaute/evenements/liste", label: "Liste des événements" },
          { href: "/admin/communaute/evenements/participation", label: "Présences & participation" },
          { href: "/admin/communaute/evenements/recap", label: "Récapitulatifs" },
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
    href: "/admin/partenariats",
    label: "Partenariats",
    icon: "🤝",
    sectionLabel: "PARTENARIATS",
    children: [
      { href: "/admin/partenariats", label: "Demandes reçues" },
      { href: "/admin/upa-event", label: "Partenaire TENF (UPA)" },
    ],
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
          { href: "/admin/evaluation/v3", label: "Évaluation v3 (barème /100)" },
          { href: "/admin/evaluation/v3/pilotage", label: "Pilotage manuel v3 (Discord)" },
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
  moderationSectionForSidebar(),
  {
    href: "/admin/gestion-acces",
    label: "Administration du site",
    icon: "⚙️",
    sectionLabel: "ADMINISTRATION",
    children: [
      {
        href: "/admin/gestion-acces",
        label: "Vue d'ensemble",
        children: [{ href: "/admin/gestion-acces", label: "Accueil administration" }],
      },
      {
        href: "/admin/gestion-acces/comptes",
        label: "Accès & sécurité",
        children: [
          { href: "/admin/gestion-acces/comptes", label: "Comptes administrateurs" },
          { href: "/admin/gestion-acces/permissions", label: "Permissions par section" },
          { href: "/admin/gestion-acces/admin-avance", label: "Accès admin avancé (fondateurs)" },
        ],
      },
      {
        href: "/admin/gestion-acces/dashboard",
        label: "Configuration du site",
        children: [
          { href: "/admin/gestion-acces/dashboard", label: "Dashboard membre" },
          { href: "/admin/gestion-acces/images", label: "Images profils Twitch" },
          { href: "/admin/migration", label: "Migration des données" },
        ],
      },
      {
        href: "/admin/gestion-acces/organigramme-staff",
        label: "Équipe staff",
        children: [
          { href: "/admin/gestion-acces/organigramme-staff", label: "Organigramme staff" },
          { href: "/admin/gestion-acces/missions-staff", label: "Missions staff" },
          { href: "/admin/gestion-acces/reunions-staff-mensuelles", label: "Réunions mensuelles staff" },
          { href: "/admin/follow/config", label: "Configuration follow staff" },
        ],
      },
      {
        href: "/admin/gestion-acces/discord-activite",
        label: "Activité & données",
        children: [
          { href: "/admin/gestion-acces/discord-activite", label: "Activité Discord (mois & salons)" },
          { href: "/admin/gestion-acces/discord-activite-personnelle", label: "Activité Discord personnelle" },
        ],
      },
      moderationSectionForAdministration(),
      {
        href: "/admin/gestion-acces/rgpd",
        label: "RGPD & données personnelles",
        children: [{ href: "/admin/gestion-acces/rgpd", label: "Accès & effacement membre" }],
      },
      {
        href: "/admin/audit-logs",
        label: "Audit & conformité",
        children: [
          { href: "/admin/audit-logs", label: "Audit & logs" },
          { href: "/admin/audit-logs/connexions", label: "Logs de connexion" },
          { href: "/admin/audit-logs/membres", label: "Logs membres" },
          { href: "/admin/audit-logs/historique-pages", label: "Historique des pages" },
          { href: "/admin/audit-logs/temps-reel", label: "Temps réel" },
          { href: "/admin/gestion-acces/retours-faq", label: "Retours FAQ rejoindre" },
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
    // Mode simple — même arborescence que le mode avancé pour ce hub :
    // labels courts et ordre Vue d'ensemble → Profils → Données → Staff → Reconnaissance.
    children: [
      {
        href: "/admin/membres",
        label: "Vue d'ensemble",
        children: [
          { href: "/admin/membres", label: "Dashboard membres" },
          { href: "/admin/membres/actions", label: "Actions à traiter" },
          { href: "/admin/membres/gestion", label: "Liste & gestion" },
          { href: "/admin/search", label: "Recherche membre" },
        ],
      },
      {
        href: "/admin/membres/validation-profil",
        label: "Profils",
        children: [
          { href: "/admin/membres/validation-profil", label: "Validation" },
          { href: "/admin/membres/revues", label: "Revues" },
          { href: "/admin/membres/historique", label: "Historique" },
        ],
      },
      {
        href: "/admin/membres/qualite-data",
        label: "Données",
        children: [
          { href: "/admin/membres/qualite-data", label: "Diagnostic" },
          { href: "/admin/membres/incomplets", label: "Comptes incomplets" },
          { href: "/admin/membres/reconciliation", label: "Réconciliation" },
        ],
      },
      {
        href: "/admin/membres/postulations",
        label: "Staff",
        children: [{ href: "/admin/membres/postulations", label: "Candidatures" }],
      },
      {
        href: "/admin/membres/badges",
        label: "Reconnaissance",
        children: [
          { href: "/admin/membres/badges", label: "Badges & rôles" },
          { href: "/admin/membres/vip", label: "VIP" },
        ],
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
          { href: "/admin/onboarding/staff-mobile", label: "Équipe (vue mobile)" },
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
          { href: "/admin/communaute/evenements/liste", label: "Liste des événements" },
          { href: "/admin/communaute/evenements/participation", label: "Présences & participation" },
          { href: "/admin/communaute/evenements/recap", label: "Récapitulatifs" },
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
    href: "/admin/partenariats",
    label: "Partenariats",
    icon: "🤝",
    children: [
      { href: "/admin/partenariats", label: "Demandes reçues" },
      { href: "/admin/upa-event", label: "Partenaire TENF (UPA)" },
    ],
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
          { href: "/admin/evaluation/v2/guide", label: "Guide évaluation v2" },
          { href: "/admin/evaluation/v2/sources", label: "Pilotage données manquantes v2" },
          { href: "/admin/evaluation/v2/pilotage", label: "Pilotage manuel v2" },
          { href: "/admin/evaluation/v3", label: "Évaluation v3 (barème /100)" },
          { href: "/admin/evaluation/v3/pilotage", label: "Pilotage manuel v3 (Discord)" },
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
    href: moderationNavStaff.href,
    label: moderationNavStaff.label,
    icon: "🛡️",
    children: moderationNavStaff.children,
  },
  {
    href: "/admin/gestion-acces",
    label: "Administration du site",
    icon: "⚙️",
    children: [
      {
        href: "/admin/gestion-acces",
        label: "Vue d'ensemble",
        children: [{ href: "/admin/gestion-acces", label: "Accueil administration" }],
      },
      {
        href: "/admin/gestion-acces/comptes",
        label: "Accès & sécurité",
        children: [
          { href: "/admin/gestion-acces/comptes", label: "Comptes administrateurs" },
          { href: "/admin/gestion-acces/permissions", label: "Permissions par section" },
          { href: "/admin/gestion-acces/admin-avance", label: "Accès admin avancé" },
        ],
      },
      {
        href: "/admin/gestion-acces/dashboard",
        label: "Configuration du site",
        children: [
          { href: "/admin/gestion-acces/dashboard", label: "Dashboard membre" },
          { href: "/admin/gestion-acces/images", label: "Images profils Twitch" },
          { href: "/admin/migration", label: "Migration des données" },
        ],
      },
      {
        href: "/admin/gestion-acces/organigramme-staff",
        label: "Équipe staff",
        children: [
          { href: "/admin/gestion-acces/organigramme-staff", label: "Organigramme staff" },
          { href: "/admin/gestion-acces/missions-staff", label: "Missions staff" },
          { href: "/admin/gestion-acces/reunions-staff-mensuelles", label: "Réunions mensuelles staff" },
          { href: "/admin/follow/config", label: "Configuration follow staff" },
        ],
      },
      {
        href: "/admin/gestion-acces/discord-activite",
        label: "Activité & données",
        children: [
          { href: "/admin/gestion-acces/discord-activite", label: "Activité Discord (mois & salons)" },
          { href: "/admin/gestion-acces/discord-activite-personnelle", label: "Activité Discord personnelle" },
        ],
      },
      moderationSectionForAdministration(),
      {
        href: "/admin/gestion-acces/rgpd",
        label: "RGPD & données personnelles",
        children: [{ href: "/admin/gestion-acces/rgpd", label: "Accès & effacement membre" }],
      },
      {
        href: "/admin/audit-logs",
        label: "Audit & conformité",
        children: [
          { href: "/admin/audit-logs", label: "Audit & logs" },
          { href: "/admin/audit-logs/connexions", label: "Logs de connexion" },
          { href: "/admin/audit-logs/membres", label: "Logs membres" },
          { href: "/admin/audit-logs/historique-pages", label: "Historique des pages" },
          { href: "/admin/audit-logs/temps-reel", label: "Temps réel" },
          { href: "/admin/gestion-acces/retours-faq", label: "Retours FAQ rejoindre" },
          { href: "/admin/log-center", label: "Logs & audit (legacy)" },
          { href: "/admin/log-center/notifications-lues", label: "Notifications lues (legacy)" },
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

/** Tous les href présents dans un arbre de navigation (feuilles et nœuds). */
export function collectNavHrefs(items: NavItem[]): string[] {
  const out = new Set<string>();
  function walk(nodes: NavItem[]) {
    for (const n of nodes) {
      out.add(n.href);
      if (n.children?.length) walk(n.children);
    }
  }
  walk(items);
  return [...out];
}

/** Union des href du menu simple et du menu avancé (pour l’API filtrage accès). */
export function allAdminNavHrefsUnion(): string[] {
  const s = new Set<string>();
  for (const h of collectNavHrefs(adminNavigationSimple)) s.add(h);
  for (const h of collectNavHrefs(adminNavigationAvance)) s.add(h);
  return [...s];
}

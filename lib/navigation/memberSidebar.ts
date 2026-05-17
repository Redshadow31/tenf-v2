import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Bell,
  Calendar,
  ClipboardList,
  Cog,
  Flag,
  GraduationCap,
  Briefcase,
  History,
  LayoutDashboard,
  ListChecks,
  MessageSquare,
  Radio,
  Rocket,
  Shield,
  Smartphone,
  Sparkles,
  Target,
  UserCircle,
  UserCog,
  Users,
} from "lucide-react";
import { DISCORD_INVITE_URL } from "@/lib/socialLinks";

/** Identifiants stables — ne jamais brancher la logique métier sur `section.title`. */
export type SidebarSectionId = "home" | "me" | "community" | "activity" | "learning" | "support";

export type SidebarNavItem = {
  href: string;
  label: string;
  icon?: LucideIcon;
  adminOnly?: boolean;
  /** Liens externes (Discord, etc.) */
  external?: boolean;
  /** Mots-clés pour la recherche rapide (insensible à la casse côté UI). */
  keywords?: string[];
  /** Lien désactivé : grisé, non cliquable (ex. fonctionnalité bientôt disponible). */
  disabled?: boolean;
  /** Court libellé affiché à côté d’un lien désactivé (ex. « Bientôt »). */
  disabledHint?: string;
};

export type SidebarNavSection = {
  id: SidebarSectionId;
  title: string;
  items: SidebarNavItem[];
};

/**
 * Navigation membre TENF — sections plates (section → liens), sans groupe intermédiaire.
 * Source unique pour la sidebar desktop, le drawer mobile et le menu burger.
 */
export const memberSidebarSections: SidebarNavSection[] = [
  {
    id: "home",
    title: "Accueil",
    items: [
      {
        href: "/member/dashboard",
        label: "Tableau de bord",
        icon: LayoutDashboard,
        keywords: ["accueil", "dashboard", "home", "synthèse"],
      },
      {
        href: "/member/notifications",
        label: "Mes nouvelles",
        icon: Bell,
        keywords: ["notif", "notifications", "nouvelles", "news", "alertes"],
      },
    ],
  },
  {
    id: "me",
    title: "Moi sur TENF",
    items: [
      { href: "/member/profil", label: "Mon profil", icon: UserCircle, keywords: ["profil", "fiche", "présentation", "moi"] },
      {
        href: "/member/profil/completer",
        label: "Compléter ma fiche",
        icon: ListChecks,
        keywords: ["compléter", "fiche", "twitch", "visibilité"],
      },
      {
        href: "/member/planning",
        label: "Mon planning de live",
        icon: Calendar,
        keywords: ["live", "stream", "planning", "twitch", "horaire"],
      },
      { href: "/member/parametres", label: "Paramètres", icon: Cog, keywords: ["réglages", "compte", "préférences"] },
    ],
  },
  {
    id: "community",
    title: "Communauté & entraide",
    items: [
      { href: "/membres", label: "Annuaire membres", icon: Users, keywords: ["annuaire", "membres", "liste", "découvrir"] },
      { href: "/lives", label: "Lives en cours", icon: Radio, keywords: ["live", "stream", "direct", "twitch"] },
      {
        href: "/decouvrir-createurs",
        label: "Découvrir des créateurs",
        icon: Sparkles,
        keywords: ["clips", "créateurs", "découverte", "twitch", "tenf"],
      },
      { href: "/member/raids/historique", label: "Mes raids", icon: History, keywords: ["raid", "raids", "historique", "entraide"] },
      {
        href: "/member/raids/statistiques",
        label: "Mes stats raids",
        icon: Activity,
        keywords: ["raid", "stats", "statistiques", "performance"],
      },
      { href: "/member/raids/declarer", label: "Signaler un raid", icon: Rocket, keywords: ["raid", "déclarer", "signaler"] },
      {
        href: "/member/engagement/a-decouvrir",
        label: "À découvrir",
        icon: Flag,
        keywords: ["découverte", "chaînes", "communauté"],
      },
      { href: "/member/engagement/amis", label: "Mes amis", icon: Users, keywords: ["amis", "suivis", "réseau"] },
      {
        href: "/member/engagement/discord-activite",
        label: "Mon activité Discord",
        icon: MessageSquare,
        keywords: ["discord", "salon", "activité", "serveur"],
      },
      {
        href: DISCORD_INVITE_URL,
        label: "Discord TENF",
        icon: MessageSquare,
        external: true,
        keywords: ["discord", "serveur", "salon", "communauté", "rejoindre"],
      },
    ],
  },
  {
    id: "activity",
    title: "Activité du mois",
    items: [
      { href: "/member/evenements", label: "Agenda TENF", icon: Calendar, keywords: ["agenda", "événements", "calendrier", "planning"] },
      {
        href: "/member/evenements/inscriptions",
        label: "Mes inscriptions",
        icon: ClipboardList,
        keywords: ["inscription", "événement", "event"],
      },
      { href: "/member/evenements/presences", label: "Mes présences", icon: Users, keywords: ["présence", "événement", "event"] },
      {
        href: "/member/engagement/score",
        label: "Mon score d’engagement",
        icon: Activity,
        keywords: ["score", "points", "xp", "engagement", "participation"],
      },
      { href: "/member/objectifs", label: "Objectifs du mois", icon: Target, keywords: ["objectifs", "mois", "défis"] },
      { href: "/member/progression", label: "Ma progression", icon: Activity, keywords: ["progression", "parcours", "niveau"] },
      { href: "/member/activite", label: "Mon activité du mois", icon: Calendar, keywords: ["activité", "mois", "résumé"] },
      {
        href: "/member/activite/historique",
        label: "Historique d’activité",
        icon: History,
        keywords: ["historique", "activité", "passé"],
      },
    ],
  },
  {
    id: "learning",
    title: "Parcours TENF",
    items: [
      {
        href: "/member/academy",
        label: "TENF Academy",
        icon: GraduationCap,
        keywords: ["academy", "formation", "apprendre", "parcours"],
        disabled: true,
        disabledHint: "Bientôt",
      },
      {
        href: "/member/academy/postuler",
        label: "Postuler à l’Academy",
        icon: ClipboardList,
        keywords: ["academy", "candidature", "postuler"],
        disabled: true,
        disabledHint: "Bientôt",
      },
      {
        href: "/member/academy/parcours",
        label: "Mon parcours Academy",
        icon: Flag,
        keywords: ["academy", "parcours", "suivi"],
        disabled: true,
        disabledHint: "Bientôt",
      },
      {
        href: "/member/formations",
        label: "Explorer les formations",
        icon: GraduationCap,
        keywords: ["formation", "catalogue", "cours", "apprendre"],
      },
      {
        href: "/member/formations/validees",
        label: "Mes formations terminées",
        icon: ListChecks,
        keywords: ["formation", "validé", "terminé", "certificat"],
      },
      { href: "/member/evaluations", label: "Mon évaluation", icon: ClipboardList, keywords: ["évaluation", "bilan", "retour"] },
      {
        href: "/member/evaluations/historique",
        label: "Historique des évaluations",
        icon: History,
        keywords: ["évaluation", "historique", "cycles"],
      },
    ],
  },
  {
    id: "support",
    title: "Aide & repères",
    items: [
      { href: "/charte", label: "Charte TENF", icon: Shield, keywords: ["charte", "règles", "cadre"] },
      {
        href: "/fonctionnement-tenf/faq",
        label: "FAQ",
        icon: MessageSquare,
        keywords: ["faq", "aide", "question", "comment"],
      },
      { href: "/contact", label: "Contacter le staff", icon: MessageSquare, keywords: ["contact", "staff", "aide", "message"] },
      {
        href: "/partenariats",
        label: "Partenariats",
        icon: Briefcase,
        keywords: ["partenaire", "partenariat", "collaboration"],
      },
      {
        href: "/postuler",
        label: "Rejoindre l’équipe TENF",
        icon: ClipboardList,
        keywords: ["postuler", "staff", "bénévole", "candidature", "équipe"],
      },
    ],
  },
];

/** Raccourcis vers l’espace admin — affichés dans un bloc séparé (ne pas mélanger au fil membre). */
export const memberSidebarAdminShortcuts: SidebarNavItem[] = [
  { href: "/admin/dashboard", label: "Tableau de bord admin", icon: LayoutDashboard, adminOnly: true },
  { href: "/admin/membres/gestion", label: "Membres", icon: Users, adminOnly: true },
  /** URL canonique (redirect 301 depuis `/admin/events` dans next.config.js). */
  { href: "/admin/communaute/evenements", label: "Événements", icon: Calendar, adminOnly: true },
  { href: "/admin/engagement/raids-a-valider", label: "Raids à valider", icon: Rocket, adminOnly: true },
];

/** Liens admin additionnels (menu « Plus » ou page dédiée). */
export const memberSidebarAdminMoreItems: SidebarNavItem[] = [
  { href: "/admin/onboarding/staff", label: "Onboarding staff", icon: UserCog, adminOnly: true },
  { href: "/admin/onboarding/staff-mobile", label: "Onboarding (mobile)", icon: Smartphone, adminOnly: true },
  { href: "/admin/profils", label: "Profils site", icon: UserCircle, adminOnly: true },
  { href: "/admin/evaluations", label: "Évaluations", icon: Shield, adminOnly: true },
];

/** Liens aplatis pour le menu burger mobile (espace membre), hors liens purement externes si besoin d’exclure */
export const memberSidebarNavItemsForMobile: {
  href: string;
  label: string;
  external?: boolean;
  disabled?: boolean;
  disabledHint?: string;
}[] = memberSidebarSections.flatMap((s) =>
  s.items
    .filter((i) => !i.adminOnly)
    .map((i) => ({
      href: i.href,
      label: i.label,
      external: i.external,
      disabled: i.disabled,
      disabledHint: i.disabledHint,
    })),
);

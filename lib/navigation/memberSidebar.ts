import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Bell,
  Calendar,
  ClipboardList,
  Cog,
  Flag,
  GraduationCap,
  History,
  LayoutDashboard,
  ListChecks,
  Rocket,
  Shield,
  Target,
  UserCircle,
  Users,
} from "lucide-react";

export type SidebarNavItem = {
  href: string;
  label: string;
  icon?: LucideIcon;
  adminOnly?: boolean;
};

export type SidebarNavGroup = {
  title: string;
  items: SidebarNavItem[];
};

export type SidebarNavSection = {
  title: string;
  groups: SidebarNavGroup[];
  adminOnly?: boolean;
};

export const memberSidebarSections: SidebarNavSection[] = [
  {
    title: "Espace membre",
    groups: [
      {
        title: "Navigation",
        items: [
          { href: "/member/dashboard", label: "Dashboard", icon: LayoutDashboard },
          { href: "/postuler", label: "Postuler modérateur / soutien TENF", icon: ClipboardList },
          { href: "/member/evenements", label: "Agenda TENF", icon: Calendar },
          { href: "/member/notifications", label: "Tes nouvelles", icon: Bell },
        ],
      },
    ],
  },
  {
    title: "Mon profil",
    groups: [
      {
        title: "Profil",
        items: [
          { href: "/member/profil", label: "Mon profil", icon: UserCircle },
          { href: "/member/profil/completer", label: "Compléter mon profil", icon: ListChecks },
        ],
      },
      {
        title: "Planning",
        items: [
          { href: "/member/planning", label: "Mon planning de live", icon: Calendar },
        ],
      },
    ],
  },
  {
    title: "Participation TENF",
    groups: [
      {
        title: "Raids",
        items: [
          { href: "/member/raids/historique", label: "Mes raids", icon: History },
          { href: "/member/raids/statistiques", label: "Statistiques de raids", icon: Activity },
          { href: "/member/raids/declarer", label: "Signaler un raid", icon: Rocket },
        ],
      },
      {
        title: "Événements",
        items: [
          { href: "/member/evenements", label: "Planning des événements", icon: Calendar },
          { href: "/member/evenements/inscriptions", label: "Mes inscriptions", icon: ClipboardList },
          { href: "/member/evenements/presences", label: "Mes présences", icon: Users },
        ],
      },
      {
        title: "Engagement",
        items: [
          { href: "/member/engagement/score", label: "Mon score d'engagement", icon: Activity },
          { href: "/member/engagement/a-decouvrir", label: "À découvrir", icon: Flag },
          { href: "/member/engagement/amis", label: "Mes amis", icon: Users },
        ],
      },
    ],
  },
  {
    title: "Objectifs & activité",
    groups: [
      {
        title: "Suivi",
        items: [
          { href: "/member/objectifs", label: "Objectifs du mois", icon: Target },
          { href: "/member/progression", label: "Ma progression", icon: Activity },
          { href: "/member/activite", label: "Mon activité du mois", icon: Calendar },
          { href: "/member/activite/historique", label: "Historique d'activité", icon: History },
        ],
      },
    ],
  },
  {
    title: "Academy & progression",
    groups: [
      {
        title: "TENF Academy",
        items: [
          { href: "/member/academy", label: "Présentation Academy", icon: GraduationCap },
          { href: "/member/academy/postuler", label: "Postuler à l'Academy", icon: ClipboardList },
          { href: "/member/academy/parcours", label: "Suivi de mon parcours", icon: Flag },
        ],
      },
      {
        title: "Formations",
        items: [
          { href: "/member/formations", label: "Catalogue des formations", icon: GraduationCap },
          { href: "/member/formations/validees", label: "Mes formations validées", icon: ListChecks },
        ],
      },
    ],
  },
  {
    title: "Évaluation",
    groups: [
      {
        title: "Évaluation",
        items: [
          { href: "/member/evaluations", label: "Mon évaluation", icon: ClipboardList },
          { href: "/member/evaluations/historique", label: "Historique des évaluations", icon: History },
        ],
      },
    ],
  },
  {
    title: "Compte",
    groups: [
      {
        title: "Compte",
        items: [{ href: "/member/parametres", label: "Paramètres", icon: Cog }],
      },
    ],
  },
  {
    title: "Administration",
    adminOnly: true,
    groups: [
      {
        title: "Administration",
        items: [
          { href: "/admin/dashboard", label: "Dashboard Admin", icon: LayoutDashboard, adminOnly: true },
          { href: "/admin/membres/gestion", label: "Gestion membres", icon: Users, adminOnly: true },
          { href: "/admin/profils", label: "Gestion profils site", icon: UserCircle, adminOnly: true },
          { href: "/admin/engagement/raids-a-valider", label: "Gestion raids", icon: Rocket, adminOnly: true },
          { href: "/admin/events", label: "Gestion événements", icon: Calendar, adminOnly: true },
          { href: "/admin/evaluations", label: "Gestion évaluations", icon: Shield, adminOnly: true },
        ],
      },
    ],
  },
];

/** Liens aplatis pour le menu burger mobile (espace membre), hors admin */
export const memberSidebarNavItemsForMobile: { href: string; label: string }[] = memberSidebarSections
  .filter((s) => !s.adminOnly)
  .flatMap((s) => s.groups.flatMap((g) => g.items.filter((i) => !i.adminOnly)))
  .map((i) => ({ href: i.href, label: i.label }));

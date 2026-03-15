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
  PencilLine,
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
          { href: "/postuler", label: "Postuler moderateur / soutien TENF", icon: ClipboardList },
          { href: "/member/evenements", label: "Planning TENF", icon: Calendar },
          { href: "/member/notifications", label: "Mes notifications", icon: Bell },
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
          { href: "/member/profil/completer", label: "Completer mon profil", icon: ListChecks },
          { href: "/member/profil/modifier", label: "Modifier mon profil", icon: PencilLine },
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
          { href: "/member/raids/declarer", label: "Declarer un raid", icon: Rocket },
          { href: "/member/raids/historique", label: "Historique de mes raids", icon: History },
          { href: "/member/raids/statistiques", label: "Statistiques de raids", icon: Activity },
        ],
      },
      {
        title: "Evenements",
        items: [
          { href: "/member/evenements", label: "Planning des evenements", icon: Calendar },
          { href: "/member/evenements/inscriptions", label: "Mes inscriptions", icon: ClipboardList },
          { href: "/member/evenements/presences", label: "Mes presences", icon: Users },
        ],
      },
    ],
  },
  {
    title: "Objectifs & activite",
    groups: [
      {
        title: "Suivi",
        items: [
          { href: "/member/objectifs", label: "Objectifs du mois", icon: Target },
          { href: "/member/progression", label: "Ma progression", icon: Activity },
          { href: "/member/activite", label: "Mon activite du mois", icon: Calendar },
          { href: "/member/activite/historique", label: "Historique d'activite", icon: History },
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
          { href: "/member/academy", label: "Presentation Academy", icon: GraduationCap },
          { href: "/member/academy/postuler", label: "Postuler a l'Academy", icon: ClipboardList },
          { href: "/member/academy/parcours", label: "Suivi de mon parcours", icon: Flag },
        ],
      },
      {
        title: "Formations",
        items: [
          { href: "/member/formations", label: "Catalogue des formations", icon: GraduationCap },
          { href: "/member/formations/validees", label: "Mes formations validees", icon: ListChecks },
          { href: "/member/formations/historique", label: "Historique des formations", icon: History },
        ],
      },
    ],
  },
  {
    title: "Evaluation",
    groups: [
      {
        title: "Evaluation",
        items: [
          { href: "/member/evaluations", label: "Mon evaluation", icon: ClipboardList },
          { href: "/member/evaluations/historique", label: "Historique des evaluations", icon: History },
        ],
      },
    ],
  },
  {
    title: "Compte",
    groups: [
      {
        title: "Compte",
        items: [{ href: "/member/parametres", label: "Parametres", icon: Cog }],
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
          { href: "/admin/raids", label: "Gestion raids", icon: Rocket, adminOnly: true },
          { href: "/admin/events", label: "Gestion evenements", icon: Calendar, adminOnly: true },
          { href: "/admin/evaluations", label: "Gestion evaluations", icon: Shield, adminOnly: true },
        ],
      },
    ],
  },
];

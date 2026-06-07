import type { LucideIcon } from "lucide-react";
import {
  Bell,
  Calendar,
  ClipboardList,
  Cog,
  GraduationCap,
  History,
  LayoutDashboard,
  ListChecks,
  MessageSquare,
  Radio,
  Rocket,
  Shield,
  Target,
  UserCircle,
  Users,
} from "lucide-react";
import { DISCORD_INVITE_URL } from "@/lib/socialLinks";

/** Identifiants stables — ne jamais brancher la logique métier sur `section.title`. */
export type SidebarSectionId = "me" | "community" | "activity" | "learning";

export type SidebarNavItem = {
  href: string;
  label: string;
  icon?: LucideIcon;
  adminOnly?: boolean;
  /** Liens externes (Discord, etc.) */
  external?: boolean;
  /** Mots-clés pour la recherche rapide (insensible à la casse côté UI). */
  keywords?: string[];
  /** Préfixes de chemin qui activent ce lien (ex. hub « Mon mois »). */
  activePrefixes?: string[];
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

/** Sidebar complète sur l’espace membre et l’annuaire ; version compacte ailleurs. */
export function isMemberSidebarFullContext(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return pathname.startsWith("/member") || pathname.startsWith("/membres");
}

export function isMemberSidebarNavItemActive(
  pathname: string,
  item: Pick<SidebarNavItem, "href" | "activePrefixes">,
): boolean {
  if (pathname === item.href) return true;
  if (item.href.startsWith("/") && item.href !== "/" && !item.href.startsWith("/api/") && pathname.startsWith(`${item.href}/`)) {
    return true;
  }
  return item.activePrefixes?.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)) ?? false;
}

/** Raccourcis épinglés (sidebar « En un clic », menu burger mobile). */
export const memberSidebarPinnedItems: SidebarNavItem[] = [
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
];

/** Lien d’aide affiché en bas du menu (hors accordéon). */
export const memberSidebarFooterLink: SidebarNavItem = {
  href: "/guides/espace-membre",
  label: "Aide & ressources",
  icon: Shield,
  keywords: ["aide", "guide", "faq", "charte", "contact", "ressources", "repères"],
};

const MEMBER_MONTH_ACTIVITY_PREFIXES = [
  "/member/evenements",
  "/member/engagement/score",
  "/member/objectifs",
  "/member/progression",
  "/member/activite",
] as const;

/**
 * Navigation membre TENF — 4 sections : Moi, Communauté, Mon mois, Parcours.
 * Source unique pour la sidebar desktop, le drawer mobile et le menu burger.
 */
export const memberSidebarSections: SidebarNavSection[] = [
  {
    id: "me",
    title: "Moi",
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
    title: "Communauté",
    items: [
      { href: "/lives", label: "Lives TENF", icon: Radio, keywords: ["live", "lives", "twitch", "stream", "direct", "entraide"] },
      { href: "/member/raids/historique", label: "Mes raids", icon: History, keywords: ["raid", "raids", "historique", "entraide", "stats", "statistiques", "pilotage"] },
      {
        href: "/member/engagement/a-decouvrir",
        label: "À découvrir",
        icon: Target,
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
      {
        href: "/member/raids/declarer",
        label: "Signaler un raid (secours)",
        icon: Rocket,
        keywords: ["raid", "déclarer", "signaler", "manuel", "secours", "absent"],
      },
    ],
  },
  {
    id: "activity",
    title: "Mon mois",
    items: [
      {
        href: "/member/activite",
        label: "Mon activité du mois",
        icon: Calendar,
        activePrefixes: [...MEMBER_MONTH_ACTIVITY_PREFIXES],
        keywords: [
          "activité",
          "mois",
          "résumé",
          "agenda",
          "événements",
          "calendrier",
          "inscription",
          "présence",
          "score",
          "engagement",
          "objectifs",
          "progression",
          "historique",
        ],
      },
    ],
  },
  {
    id: "learning",
    title: "Parcours",
    items: [
      {
        href: "/member/academy",
        label: "TENF Academy",
        icon: GraduationCap,
        keywords: ["academy", "formation", "apprendre", "parcours", "candidature"],
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
      {
        href: "/member/evaluations",
        label: "Mon évaluation",
        icon: ClipboardList,
        keywords: ["évaluation", "bilan", "retour"],
        disabled: true,
        disabledHint: "Bientôt",
      },
    ],
  },
];

/** Liens aplatis pour le menu burger mobile (espace membre). */
export const memberSidebarNavItemsForMobile: {
  href: string;
  label: string;
  external?: boolean;
  disabled?: boolean;
  disabledHint?: string;
}[] = [
  ...memberSidebarPinnedItems.map((i) => ({
    href: i.href,
    label: i.label,
    external: i.external,
    disabled: i.disabled,
    disabledHint: i.disabledHint,
  })),
  ...memberSidebarSections.flatMap((s) =>
    s.items
      .filter((i) => !i.adminOnly)
      .map((i) => ({
        href: i.href,
        label: i.label,
        external: i.external,
        disabled: i.disabled,
        disabledHint: i.disabledHint,
      })),
  ),
  {
    href: memberSidebarFooterLink.href,
    label: memberSidebarFooterLink.label,
  },
];

export type MemberSidebarSearchEntry = {
  href: string;
  label: string;
  sectionTitle: string;
  keywords?: string[];
  external?: boolean;
  disabled?: boolean;
};

export function normalizeMemberSidebarSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/** Entrées indexées pour la recherche header + filtre sidebar. */
export function buildMemberSidebarSearchEntries(): MemberSidebarSearchEntry[] {
  const entries: MemberSidebarSearchEntry[] = [
    ...memberSidebarPinnedItems.map((item) => ({
      href: item.href,
      label: item.label,
      sectionTitle: "Raccourcis",
      keywords: item.keywords,
      external: item.external,
      disabled: item.disabled,
    })),
    ...memberSidebarSections.flatMap((section) =>
      section.items
        .filter((item) => !item.adminOnly)
        .map((item) => ({
          href: item.href,
          label: item.label,
          sectionTitle: section.title,
          keywords: item.keywords,
          external: item.external,
          disabled: item.disabled,
        })),
    ),
    {
      href: memberSidebarFooterLink.href,
      label: memberSidebarFooterLink.label,
      sectionTitle: "Aide",
      keywords: memberSidebarFooterLink.keywords,
    },
  ];
  return entries;
}

export function filterMemberSidebarSearchEntries(
  query: string,
  entries: MemberSidebarSearchEntry[],
  limit = 8,
): MemberSidebarSearchEntry[] {
  const q = normalizeMemberSidebarSearchText(query);
  if (!q) return [];
  return entries
    .filter((item) => {
      if (normalizeMemberSidebarSearchText(item.label).includes(q)) return true;
      if (normalizeMemberSidebarSearchText(item.sectionTitle).includes(q)) return true;
      if (item.keywords?.some((keyword) => normalizeMemberSidebarSearchText(keyword).includes(q))) return true;
      return false;
    })
    .slice(0, limit);
}

export function memberSidebarNavItemMatchesQuery(
  query: string,
  item: { label: string; keywords?: string[] },
  section: Pick<SidebarNavSection, "title" | "id">,
): boolean {
  const q = normalizeMemberSidebarSearchText(query);
  if (!q) return true;
  if (normalizeMemberSidebarSearchText(item.label).includes(q)) return true;
  if (normalizeMemberSidebarSearchText(section.title).includes(q)) return true;
  if (normalizeMemberSidebarSearchText(section.id).includes(q)) return true;
  if (item.keywords?.some((keyword) => normalizeMemberSidebarSearchText(keyword).includes(q))) return true;
  return false;
}

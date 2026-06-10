import type { NavItem } from "@/lib/admin/navigation";

export const ADMIN_HUB_PRIORITY_ORDER = [
  "/admin/pilotage",
  "/admin/mon-compte",
  "/admin/membres",
  "/admin/onboarding",
  "/admin/communaute",
  "/admin/evaluation",
  "/admin/academy",
  "/admin/upa-event",
  "/admin/new-family-aventura",
  "/admin/interviews",
  "/admin/boutique",
  "/admin/gestion-acces",
  "/admin/moderation/staff",
  "/admin/search",
] as const;

export function getAdminHubPriority(href: string): number {
  const idx = ADMIN_HUB_PRIORITY_ORDER.findIndex(
    (candidate) => href === candidate || href.startsWith(`${candidate}/`),
  );
  return idx === -1 ? ADMIN_HUB_PRIORITY_ORDER.length + 1 : idx;
}

export function sortAdminHubNavItems(items: NavItem[]): NavItem[] {
  return items.slice().sort((a, b) => {
    const rankA = getAdminHubPriority(a.href);
    const rankB = getAdminHubPriority(b.href);
    if (rankA !== rankB) return rankA - rankB;
    return a.label.localeCompare(b.label, "fr-FR");
  });
}

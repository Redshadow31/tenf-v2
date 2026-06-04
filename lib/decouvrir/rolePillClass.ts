import type { BadgeVisualVariant } from "@/lib/roleBadgeSystem";

/** Pastille rôle TENF — alignée sur le design system global (violet + vert pastel). */
export function rolePillClass(variant: BadgeVisualVariant): string {
  const base =
    "role-badge inline-flex max-w-full shrink-0 items-center justify-center";

  switch (variant) {
    case "newcomer":
      return `${base} role-badge--newcomer`;
    case "active-affilie":
      return `${base} role-badge--active-affilie`;
    case "active-dev":
      return `${base} role-badge--active-dev`;
    case "active-support":
      return `${base} role-badge--active-support`;
    case "minor-creator":
      return `${base} role-badge--minor-creator`;
    case "minor-community":
      return `${base} role-badge--minor-community`;
    case "community":
      return `${base} role-badge--community`;
    case "staff-founder":
      return `${base} role-badge--staff-founder role-badge--shimmer`;
    case "staff-coordinator":
      return `${base} role-badge--staff-coordinator role-badge--shimmer`;
    case "staff-moderator":
      return `${base} role-badge--staff-moderator role-badge--shimmer`;
    case "staff-autonomie":
      return `${base} role-badge--staff-autonomie`;
    case "staff-accompagnement":
      return `${base} role-badge--staff-accompagnement`;
    case "staff-decouverte":
      return `${base} role-badge--staff-decouverte`;
    case "staff-trainee":
      return `${base} role-badge--staff-trainee`;
    case "staff-reduced":
      return `${base} role-badge--staff-reduced`;
    case "staff-paused":
      return `${base} role-badge--staff-paused`;
    case "contributor":
      return `${base} role-badge--contributor role-badge--shimmer`;
    case "vip":
      return `${base} role-badge--vip role-badge--shimmer`;
    default:
      return `${base} role-badge--default`;
  }
}

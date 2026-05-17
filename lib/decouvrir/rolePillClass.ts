import type { BadgeVisualVariant } from "@/lib/roleBadgeSystem";

/** Pastille rôle TENF sur les cartes clips : lisible + cohérent avec le design system des badges. */
export function rolePillClass(variant: BadgeVisualVariant): string {
  const base =
    "inline-flex max-w-full shrink-0 items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold leading-tight";

  switch (variant) {
    case "newcomer":
      return `${base} border-zinc-500/40 bg-zinc-500/15 text-zinc-100`;
    case "active-affilie":
      return `${base} border-violet-400/45 bg-violet-500/25 text-violet-50`;
    case "active-dev":
      return `${base} border-emerald-400/40 bg-emerald-500/20 text-emerald-50`;
    case "active-support":
      return `${base} border-sky-400/40 bg-sky-500/20 text-sky-50`;
    case "minor-creator":
    case "minor-community":
      return `${base} border-amber-400/45 bg-amber-500/20 text-amber-50`;
    case "community":
      return `${base} border-zinc-400/35 bg-zinc-600/25 text-zinc-100`;
    case "staff-founder":
    case "staff-coordinator":
    case "staff-moderator":
    case "staff-trainee":
    case "staff-reduced":
    case "staff-paused":
      return `${base} border-rose-400/40 bg-rose-500/20 text-rose-50`;
    case "contributor":
      return `${base} border-fuchsia-400/40 bg-fuchsia-500/20 text-fuchsia-50`;
    case "vip":
      return `${base} border-amber-300/50 bg-amber-400/25 text-amber-950`;
    default:
      return `${base} border-white/15 bg-white/10 text-zinc-100`;
  }
}

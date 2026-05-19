import Link from "next/link";
import { ChevronRight } from "lucide-react";

export type ModerationBreadcrumbItem = {
  label: string;
  href?: string;
};

type Props = {
  items: ModerationBreadcrumbItem[];
  /** Liens et séparateurs adoucis (header hub vitré). */
  hubAccent?: boolean;
};

/**
 * Breadcrumb harmonisé pour les pages /admin/moderation/**.
 * - Le dernier item est considéré comme la page courante (non cliquable).
 * - Scalable au zoom : tailles via clamp().
 */
export default function ModerationBreadcrumb({ items, hubAccent = false }: Props) {
  if (!items.length) return null;
  return (
    <nav aria-label="Fil d'Ariane" className="min-w-0">
      <ol
        className="flex min-w-0 flex-wrap items-center gap-x-1 gap-y-1 text-[var(--color-text-muted)]"
        style={{ fontSize: "clamp(0.7rem,0.8vw,0.82rem)" }}
      >
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex min-w-0 items-center gap-1">
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className={
                    "truncate rounded-md px-1.5 py-0.5 font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400/40 " +
                    (hubAccent
                      ? "text-[var(--color-text-secondary)] hover:bg-white/[0.06] hover:text-[var(--color-text)]"
                      : "text-[var(--color-text-secondary)] hover:bg-[color-mix(in_srgb,var(--color-text)_6%,var(--color-card))] hover:text-[var(--color-text)]")
                  }
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={
                    "truncate px-1 py-[1px] " +
                    (isLast ? "font-bold text-[var(--color-text)]" : "text-[var(--color-text-muted)]")
                  }
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.label}
                </span>
              )}
              {!isLast ? (
                <ChevronRight
                  className="h-3 w-3 shrink-0 text-[var(--color-text-muted)]"
                  aria-hidden
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

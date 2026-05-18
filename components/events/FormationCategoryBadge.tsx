"use client";

import { formationCategoryLabel } from "@/lib/events/formationCategories";

type FormationCategoryBadgeProps = {
  formationCategory: string | null | undefined;
  className?: string;
};

/** Badge discret pour les événements de type Formation. */
export default function FormationCategoryBadge({ formationCategory, className = "" }: FormationCategoryBadgeProps) {
  const label = formationCategoryLabel(formationCategory);
  if (!label) return null;

  return (
    <span
      className={`inline-flex max-w-full items-center rounded-full border border-cyan-400/30 bg-cyan-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-cyan-100/95 ${className}`}
    >
      {label}
    </span>
  );
}

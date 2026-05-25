"use client";

import {
  Archive,
  AlertCircle,
  Ban,
  CheckCircle2,
  LogOut,
  PauseCircle,
  Shield,
  Sparkles,
  Star,
  Users,
  Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  memberStateToneClasses,
  type MemberTenfState,
  type MemberTenfStateId,
} from "@/lib/admin/members-gestion/memberState";

type MemberStateBadgeProps = {
  state: MemberTenfState;
  /** Mode compact : taille xs, idéal pour les lignes du tableau. */
  size?: "sm" | "md";
  /** Cache l'icône (utile dans les listes très denses). */
  hideIcon?: boolean;
  className?: string;
};

const ICON_BY_ID: Record<MemberTenfStateId, LucideIcon> = {
  archived: Archive,
  departed: LogOut,
  banned: Ban,
  staff: Shield,
  review_due: AlertCircle,
  new: Sparkles,
  incomplete: Wrench,
  paused: PauseCircle,
  community: Users,
  vip: Star,
  active: CheckCircle2,
};

/**
 * Badge synthétique « État TENF » d'un membre. Utilisé à la fois dans le tableau,
 * dans les cartes et potentiellement dans la fiche pour donner un repère unique.
 *
 * Le badge encode l'info aussi via une icône → ne dépend pas uniquement de la
 * couleur (a11y : OK pour daltoniens et niveaux de gris).
 */
export default function MemberStateBadge({
  state,
  size = "sm",
  hideIcon = false,
  className = "",
}: MemberStateBadgeProps) {
  const Icon = ICON_BY_ID[state.id];
  const baseClasses =
    size === "md"
      ? "px-2.5 py-1 text-[11px] gap-1.5"
      : "px-2 py-0.5 text-[10px] gap-1";
  const toneClasses = memberStateToneClasses[state.tone];
  return (
    <span
      className={`inline-flex items-center rounded-full border font-semibold leading-none whitespace-nowrap ${baseClasses} ${toneClasses} ${className}`}
      title={state.hint}
      aria-label={`État TENF : ${state.label}. ${state.hint}`}
      data-state={state.id}
    >
      {!hideIcon && Icon ? <Icon className="h-3 w-3 shrink-0 opacity-90" aria-hidden /> : null}
      {state.label}
    </span>
  );
}

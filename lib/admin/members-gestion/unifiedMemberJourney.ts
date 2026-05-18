/**
 * Phase C — frise chronologique unifiée (événements + périodes confirmées).
 */

import {
  getTimelineEntryTitle,
  TIMELINE_KIND_LABELS,
  type MemberTimelineEntry,
} from "@/lib/admin/members-gestion/memberTimeline";
import {
  formatPeriodRangeFr,
  STAFF_PERIOD_TYPE_LABELS,
  type StaffPeriod,
} from "@/lib/admin/members-gestion/staffPeriods";

export type UnifiedJourneyKind =
  | "timeline"
  | "confirmed_period"
  | "integration"
  | "member_created";

export type UnifiedJourneyItem = {
  id: string;
  kind: UnifiedJourneyKind;
  at: string;
  sortAt: number;
  title: string;
  subtitle?: string;
  detail?: string;
  badges: string[];
  accent: "indigo" | "emerald" | "amber" | "zinc" | "violet";
  timelineEntry?: MemberTimelineEntry;
  staffPeriod?: StaffPeriod;
};

export type UnifiedJourneyFilter = "all" | "staff" | "events";

function atMs(iso: string): number {
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? 0 : t;
}

export function buildUnifiedMemberJourney(params: {
  timeline: MemberTimelineEntry[];
  staffPeriods: StaffPeriod[];
  createdAt?: string | null;
  integrationDate?: string | null;
}): UnifiedJourneyItem[] {
  const items: UnifiedJourneyItem[] = [];

  for (const entry of params.timeline) {
    const isStaffish =
      entry.kind === "staff_milestone" ||
      entry.tags?.some((t) => /staff|modérateur|pause|promotion/i.test(t));
    items.push({
      id: `tl-${entry.id}`,
      kind: "timeline",
      at: entry.changedAt,
      sortAt: atMs(entry.changedAt),
      title: getTimelineEntryTitle(entry),
      subtitle:
        entry.kind === "role_change" && entry.fromRole && entry.toRole
          ? `${entry.fromRole} → ${entry.toRole}`
          : entry.kind === "status_change" && entry.fromRole && entry.toRole
            ? `Statut : ${entry.fromRole} → ${entry.toRole}`
            : undefined,
      detail: entry.summary || entry.reason,
      badges: [
        entry.source === "manual" ? "Manuel" : "Système",
        TIMELINE_KIND_LABELS[entry.kind],
        ...(entry.isBackfill ? ["Rétroactif"] : []),
        ...(entry.tags ?? []),
      ],
      accent: isStaffish ? "violet" : entry.kind === "status_change" ? "amber" : "indigo",
      timelineEntry: entry,
    });
  }

  for (const period of params.staffPeriods) {
    items.push({
      id: `sp-${period.id}`,
      kind: "confirmed_period",
      at: period.from,
      sortAt: atMs(period.from),
      title: period.label,
      subtitle: formatPeriodRangeFr(period),
      detail: period.notes,
      badges: ["Confirmé", STAFF_PERIOD_TYPE_LABELS[period.type]],
      accent: "emerald",
      staffPeriod: period,
    });
  }

  if (params.integrationDate) {
    items.push({
      id: "integration",
      kind: "integration",
      at: params.integrationDate,
      sortAt: atMs(params.integrationDate),
      title: "Intégration TENF validée",
      badges: ["Référence"],
      accent: "zinc",
    });
  }

  if (params.createdAt) {
    items.push({
      id: "created",
      kind: "member_created",
      at: params.createdAt,
      sortAt: atMs(params.createdAt),
      title: "Création de la fiche membre",
      badges: ["Référence"],
      accent: "zinc",
    });
  }

  return items.sort((a, b) => b.sortAt - a.sortAt);
}

export function filterUnifiedJourney(
  items: UnifiedJourneyItem[],
  filter: UnifiedJourneyFilter,
): UnifiedJourneyItem[] {
  if (filter === "all") return items;
  if (filter === "staff") {
    return items.filter(
      (i) =>
        i.kind === "confirmed_period" ||
        i.kind === "integration" ||
        i.accent === "violet" ||
        i.timelineEntry?.kind === "staff_milestone" ||
        i.timelineEntry?.tags?.some((t) => /staff|modérateur/i.test(t)),
    );
  }
  return items.filter((i) => i.kind === "timeline");
}

import { toCanonicalMemberRole } from "@/lib/memberRoles";
import { getRoleBadgeLabel } from "@/lib/roleBadgeSystem";
import { isStaffRole } from "@/lib/admin/members-gestion/memberListHelpers";
import {
  affectsRoleTenure,
  normalizeTimeline,
  toRoleChangeShape,
  type MemberTimelineEntry,
} from "@/lib/admin/members-gestion/memberTimeline";
import {
  computeConfirmedStaffMetrics,
  mergeStaffPilotMetrics,
  type StaffPeriod,
} from "@/lib/admin/members-gestion/staffPeriods";

export type RoleHistoryEntry = MemberTimelineEntry;

export type RoleTenure = {
  role: string;
  roleLabel: string;
  from: Date;
  to: Date | null;
  durationMs: number;
  isStaff: boolean;
  isStaffReduced: boolean;
  ongoing: boolean;
};

export type StaffPilotSummary = {
  isCurrentlyStaff: boolean;
  isFormerStaff: boolean;
  neverStaff: boolean;
  currentStatut: string;
  currentRoleLabel: string;
  currentStaffTenureMs: number | null;
  currentStaffTenureFrom: Date | null;
  totalStaffTenureMs: number;
  firstStaffAt: Date | null;
  lastStaffExitAt: Date | null;
  staffRoleLabels: string[];
  staffTransitionCount: number;
  usesConfirmedPeriods: boolean;
  confirmedPeriodCount: number;
  tenureSourceLabel: string;
};

const STAFF_REDUCED_ROLES = new Set([
  "Modérateur en pause",
  "Modérateur en activité réduite",
]);

function parseDate(value?: string | null): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function isStaffReducedRole(role: string): boolean {
  const c = toCanonicalMemberRole(role);
  return STAFF_REDUCED_ROLES.has(c) || STAFF_REDUCED_ROLES.has(role);
}

function makeTenure(role: string, from: Date, to: Date | null, now: Date): RoleTenure {
  const end = to ?? now;
  const durationMs = Math.max(0, end.getTime() - from.getTime());
  return {
    role,
    roleLabel: getRoleBadgeLabel(role),
    from,
    to,
    durationMs,
    isStaff: isStaffRole(role),
    isStaffReduced: isStaffReducedRole(role),
    ongoing: to === null,
  };
}

/** Reconstruit les périodes de rôle (du plus ancien au plus récent). */
export function buildRoleTenures(
  history: RoleHistoryEntry[] | undefined,
  currentRole: string,
  createdAt?: string | null,
  now: Date = new Date()
): RoleTenure[] {
  const canonicalCurrent = toCanonicalMemberRole(currentRole || "");
  const roleChanges = normalizeTimeline(history as unknown[])
    .filter(affectsRoleTenure)
    .map(toRoleChangeShape)
    .filter((e): e is NonNullable<typeof e> => e !== null);

  const sorted = [...roleChanges].sort(
    (a, b) => new Date(a.changedAt).getTime() - new Date(b.changedAt).getTime()
  );

  if (sorted.length === 0) {
    const from = parseDate(createdAt) ?? now;
    return [makeTenure(canonicalCurrent, from, null, now)];
  }

  const tenures: RoleTenure[] = [];
  const first = sorted[0];
  const firstChangeAt = parseDate(first.changedAt) ?? now;
  const profileStart = parseDate(createdAt) ?? firstChangeAt;

  if (first.fromRole) {
    const fromRole = toCanonicalMemberRole(first.fromRole);
    if (fromRole !== toCanonicalMemberRole(first.toRole)) {
      tenures.push(makeTenure(fromRole, profileStart, firstChangeAt, now));
    }
  }

  for (let i = 0; i < sorted.length; i++) {
    const entry = sorted[i];
    const from = parseDate(entry.changedAt) ?? now;
    const nextChange = i < sorted.length - 1 ? parseDate(sorted[i + 1].changedAt) : null;
    const role = toCanonicalMemberRole(entry.toRole);
    tenures.push(makeTenure(role, from, nextChange, now));
  }

  const lastTenure = tenures[tenures.length - 1];
  if (lastTenure && toCanonicalMemberRole(lastTenure.role) !== canonicalCurrent) {
    const from = lastTenure.to ?? parseDate(sorted[sorted.length - 1].changedAt) ?? now;
    tenures.push(makeTenure(canonicalCurrent, from, null, now));
  }

  return tenures;
}

export function analyzeStaffPilot(
  tenures: RoleTenure[],
  currentRole: string,
  currentStatut: string,
  history?: RoleHistoryEntry[],
  staffPeriods?: StaffPeriod[],
  now: Date = new Date()
): StaffPilotSummary {
  const staffTenures = tenures.filter((t) => t.isStaff);
  const isCurrentlyStaff = isStaffRole(currentRole);
  const totalStaffTenureMs = staffTenures.reduce((sum, t) => sum + t.durationMs, 0);
  const staffRoleLabels = [
    ...new Set(staffTenures.map((t) => t.roleLabel)),
  ];
  const firstStaffAt =
    staffTenures.length > 0
      ? staffTenures.reduce((min, t) => (t.from < min ? t.from : min), staffTenures[0].from)
      : null;

  let currentStaffTenure: RoleTenure | undefined;
  if (isCurrentlyStaff) {
    for (let i = tenures.length - 1; i >= 0; i--) {
      if (tenures[i].isStaff) {
        currentStaffTenure = tenures[i];
        break;
      }
    }
  }

  let lastStaffExitAt: Date | null = null;
  if (!isCurrentlyStaff && staffTenures.length > 0) {
    const lastStaff = staffTenures[staffTenures.length - 1];
    lastStaffExitAt = lastStaff.to ?? lastStaff.from;
  }

  const confirmed = computeConfirmedStaffMetrics(staffPeriods, now);
  const merged = mergeStaffPilotMetrics(
    {
      totalStaffTenureMs,
      firstStaffAt,
      lastStaffExitAt,
      currentStaffTenureMs: currentStaffTenure?.durationMs ?? null,
      currentStaffTenureFrom: currentStaffTenure?.from ?? null,
    },
    confirmed,
  );

  return {
    isCurrentlyStaff,
    isFormerStaff: !isCurrentlyStaff && (staffTenures.length > 0 || confirmed.usesConfirmedPeriods),
    neverStaff: staffTenures.length === 0 && !confirmed.usesConfirmedPeriods,
    currentStatut: currentStatut || "—",
    currentRoleLabel: getRoleBadgeLabel(currentRole),
    currentStaffTenureMs: merged.currentStaffTenureMs,
    currentStaffTenureFrom: merged.currentStaffTenureFrom,
    totalStaffTenureMs: merged.totalStaffTenureMs,
    firstStaffAt: merged.firstStaffAt,
    lastStaffExitAt: merged.lastStaffExitAt,
    staffRoleLabels,
    staffTransitionCount: countStaffRoleTransitions(history),
    usesConfirmedPeriods: merged.usesConfirmedPeriods,
    confirmedPeriodCount: merged.confirmedPeriodCount,
    tenureSourceLabel: merged.tenureSourceLabel,
  };
}

export function countStaffRoleTransitions(history: RoleHistoryEntry[] | undefined): number {
  const roleChanges = normalizeTimeline(history as unknown[])
    .filter(affectsRoleTenure)
    .map(toRoleChangeShape)
    .filter((e): e is NonNullable<typeof e> => e !== null);
  if (!roleChanges.length) return 0;
  let count = 0;
  for (const entry of roleChanges) {
    const fromStaff = isStaffRole(entry.fromRole);
    const toStaff = isStaffRole(entry.toRole);
    if (fromStaff !== toStaff || (fromStaff && toStaff && entry.fromRole !== entry.toRole)) {
      if (fromStaff || toStaff) count += 1;
    }
  }
  return count;
}

/** Durée lisible en français (approx. mois = 30j). */
export function formatDurationFr(ms: number): string {
  if (ms <= 0) return "0 jour";
  const days = Math.floor(ms / (24 * 60 * 60 * 1000));
  if (days < 1) return "moins d'un jour";
  if (days < 45) return `${days} jour${days > 1 ? "s" : ""}`;
  const months = Math.floor(days / 30);
  if (months < 24) {
    const remDays = days % 30;
    if (remDays < 7) return `${months} mois`;
    return `${months} mois ${remDays} j`;
  }
  const years = Math.floor(months / 12);
  const remMonths = months % 12;
  if (remMonths === 0) return `${years} an${years > 1 ? "s" : ""}`;
  return `${years} an${years > 1 ? "s" : ""} ${remMonths} mois`;
}

export function formatPeriodFr(from: Date, to: Date | null): string {
  const opts: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "short",
    year: "numeric",
  };
  const start = from.toLocaleDateString("fr-FR", opts);
  if (!to) return `${start} → aujourd'hui`;
  return `${start} → ${to.toLocaleDateString("fr-FR", opts)}`;
}

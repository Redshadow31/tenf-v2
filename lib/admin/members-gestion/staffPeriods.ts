/**
 * Périodes staff confirmées (Phase B) — dates officielles saisies à la main.
 */

import { getRoleBadgeLabel } from "@/lib/roleBadgeSystem";

export type StaffPeriodType =
  | "staff_role"
  | "reduced_activity"
  | "leave"
  | "staff_global";

export type StaffPeriod = {
  id: string;
  type: StaffPeriodType;
  label: string;
  role?: string;
  from: string;
  to: string | null;
  notes?: string;
  confirmed: true;
  source: "manual";
  createdAt: string;
  createdBy: string;
};

export const STAFF_PERIOD_TYPE_LABELS: Record<StaffPeriodType, string> = {
  staff_role: "Rôle staff",
  reduced_activity: "Pause / activité réduite",
  leave: "Fin de parcours staff",
  staff_global: "Période staff (générale)",
};

export type CreateStaffPeriodInput = {
  type: StaffPeriodType;
  label: string;
  role?: string;
  from: string;
  to?: string | null;
  notes?: string;
};

export function generateStaffPeriodId(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

function parseDate(value?: string | null): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function normalizeStaffPeriod(raw: unknown): StaffPeriod | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const from = typeof o.from === "string" ? o.from : null;
  const label = typeof o.label === "string" ? o.label.trim() : "";
  if (!from || !label) return null;
  const to = typeof o.to === "string" ? o.to : o.to === null ? null : undefined;
  return {
    id: typeof o.id === "string" ? o.id : generateStaffPeriodId(),
    type: (o.type as StaffPeriodType) || "staff_global",
    label,
    role: typeof o.role === "string" ? o.role : undefined,
    from: new Date(from).toISOString(),
    to: to ? new Date(to).toISOString() : null,
    notes: typeof o.notes === "string" ? o.notes : undefined,
    confirmed: true,
    source: "manual",
    createdAt: typeof o.createdAt === "string" ? o.createdAt : from,
    createdBy: typeof o.createdBy === "string" ? o.createdBy : "admin",
  };
}

export function normalizeStaffPeriods(raw: unknown[] | undefined | null): StaffPeriod[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((p) => normalizeStaffPeriod(p))
    .filter((p): p is StaffPeriod => p !== null)
    .sort((a, b) => new Date(a.from).getTime() - new Date(b.from).getTime());
}

export function validateStaffPeriodInput(input: CreateStaffPeriodInput): string | null {
  if (!input.label?.trim()) return "Le libellé est obligatoire.";
  const from = parseDate(input.from);
  if (!from) return "Date de début invalide.";
  if (input.to) {
    const to = parseDate(input.to);
    if (!to) return "Date de fin invalide.";
    if (to < from) return "La date de fin doit être après le début.";
  }
  if (input.type === "staff_role" && !input.role?.trim()) {
    return "Le rôle est obligatoire pour une période « rôle staff ».";
  }
  return null;
}

export function createStaffPeriod(
  input: CreateStaffPeriodInput,
  changedBy: string,
): StaffPeriod {
  const err = validateStaffPeriodInput(input);
  if (err) throw new Error(err);
  const now = new Date().toISOString();
  return {
    id: generateStaffPeriodId(),
    type: input.type,
    label: input.label.trim(),
    role: input.role?.trim() || undefined,
    from: new Date(input.from).toISOString(),
    to: input.to ? new Date(input.to).toISOString() : null,
    notes: input.notes?.trim() || undefined,
    confirmed: true,
    source: "manual",
    createdAt: now,
    createdBy: changedBy,
  };
}

export function appendStaffPeriod(
  periods: StaffPeriod[] | undefined,
  period: StaffPeriod,
): StaffPeriod[] {
  return [...normalizeStaffPeriods(periods as unknown[]), period];
}

export function updateStaffPeriod(
  periods: StaffPeriod[] | undefined,
  id: string,
  patch: Partial<CreateStaffPeriodInput>,
): StaffPeriod[] {
  const list = normalizeStaffPeriods(periods as unknown[]);
  const idx = list.findIndex((p) => p.id === id);
  if (idx < 0) throw new Error("Période introuvable.");
  const existing = list[idx];
  const merged: CreateStaffPeriodInput = {
    type: patch.type ?? existing.type,
    label: patch.label ?? existing.label,
    role: patch.role !== undefined ? patch.role : existing.role,
    from: patch.from ?? existing.from,
    to: patch.to !== undefined ? patch.to : existing.to,
    notes: patch.notes !== undefined ? patch.notes : existing.notes,
  };
  const updated = createStaffPeriod(merged, existing.createdBy);
  updated.id = existing.id;
  updated.createdAt = existing.createdAt;
  const next = [...list];
  next[idx] = updated;
  return next;
}

export function deleteStaffPeriod(
  periods: StaffPeriod[] | undefined,
  id: string,
): StaffPeriod[] {
  const list = normalizeStaffPeriods(periods as unknown[]);
  if (!list.some((p) => p.id === id)) throw new Error("Période introuvable.");
  return list.filter((p) => p.id !== id);
}

export function periodDurationMs(period: StaffPeriod, now = new Date()): number {
  const from = parseDate(period.from) ?? now;
  const to = period.to ? parseDate(period.to) ?? now : now;
  return Math.max(0, to.getTime() - from.getTime());
}

export function formatPeriodRangeFr(period: StaffPeriod): string {
  const opts: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "short",
    year: "numeric",
  };
  const start = new Date(period.from).toLocaleDateString("fr-FR", opts);
  if (!period.to) return `${start} → aujourd'hui`;
  return `${start} → ${new Date(period.to).toLocaleDateString("fr-FR", opts)}`;
}

/** Périodes qui comptent dans le cumul staff. */
export function isStaffTenurePeriod(period: StaffPeriod): boolean {
  return (
    period.type === "staff_role" ||
    period.type === "staff_global" ||
    period.type === "reduced_activity"
  );
}

export type ConfirmedStaffMetrics = {
  usesConfirmedPeriods: boolean;
  confirmedPeriodCount: number;
  totalStaffTenureMs: number;
  firstStaffAt: Date | null;
  lastStaffExitAt: Date | null;
  currentStaffTenureMs: number | null;
  currentStaffTenureFrom: Date | null;
  ongoingPeriodLabel: string | null;
};

export function computeConfirmedStaffMetrics(
  periods: StaffPeriod[] | undefined,
  now: Date = new Date(),
): ConfirmedStaffMetrics {
  const list = normalizeStaffPeriods(periods as unknown[]).filter(isStaffTenurePeriod);
  if (list.length === 0) {
    return {
      usesConfirmedPeriods: false,
      confirmedPeriodCount: 0,
      totalStaffTenureMs: 0,
      firstStaffAt: null,
      lastStaffExitAt: null,
      currentStaffTenureMs: null,
      currentStaffTenureFrom: null,
      ongoingPeriodLabel: null,
    };
  }

  const totalStaffTenureMs = list.reduce((sum, p) => sum + periodDurationMs(p, now), 0);
  const firstStaffAt = list.reduce(
    (min, p) => {
      const d = parseDate(p.from)!;
      return d < min ? d : min;
    },
    parseDate(list[0].from)!,
  );

  const ended = list.filter((p) => p.to);
  const lastStaffExitAt =
    ended.length > 0
      ? ended.reduce((max, p) => {
          const d = parseDate(p.to!)!;
          return d > max ? d : max;
        }, parseDate(ended[0].to!)!)
      : null;

  const ongoing = list.filter((p) => !p.to);
  const current = ongoing.length > 0 ? ongoing[ongoing.length - 1] : null;

  return {
    usesConfirmedPeriods: true,
    confirmedPeriodCount: list.length,
    totalStaffTenureMs,
    firstStaffAt,
    lastStaffExitAt: ongoing.length === 0 ? lastStaffExitAt : null,
    currentStaffTenureMs: current ? periodDurationMs(current, now) : null,
    currentStaffTenureFrom: current ? parseDate(current.from) : null,
    ongoingPeriodLabel: current
      ? current.role
        ? getRoleBadgeLabel(current.role)
        : current.label
      : null,
  };
}

export function mergeStaffPilotMetrics(
  estimated: {
    totalStaffTenureMs: number;
    firstStaffAt: Date | null;
    lastStaffExitAt: Date | null;
    currentStaffTenureMs: number | null;
    currentStaffTenureFrom: Date | null;
  },
  confirmed: ConfirmedStaffMetrics,
): {
  totalStaffTenureMs: number;
  firstStaffAt: Date | null;
  lastStaffExitAt: Date | null;
  currentStaffTenureMs: number | null;
  currentStaffTenureFrom: Date | null;
  usesConfirmedPeriods: boolean;
  confirmedPeriodCount: number;
  tenureSourceLabel: string;
} {
  if (!confirmed.usesConfirmedPeriods) {
    return {
      ...estimated,
      usesConfirmedPeriods: false,
      confirmedPeriodCount: 0,
      tenureSourceLabel: "Estimé (historique des rôles)",
    };
  }
  return {
    totalStaffTenureMs: confirmed.totalStaffTenureMs,
    firstStaffAt: confirmed.firstStaffAt,
    lastStaffExitAt: confirmed.lastStaffExitAt,
    currentStaffTenureMs: confirmed.currentStaffTenureMs,
    currentStaffTenureFrom: confirmed.currentStaffTenureFrom,
    usesConfirmedPeriods: true,
    confirmedPeriodCount: confirmed.confirmedPeriodCount,
    tenureSourceLabel: "Confirmé (périodes saisies)",
  };
}

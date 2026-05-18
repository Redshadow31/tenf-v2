import { supabaseAdmin } from "@/lib/db/supabase";
import { toCanonicalMemberRole } from "@/lib/memberRoles";
import { getRoleBadgeLabel, STAFF_MEMBER_ROLE_KEYS } from "@/lib/roleBadgeSystem";
import {
  computeConfirmedStaffMetrics,
  mergeStaffPilotMetrics,
  normalizeStaffPeriods,
} from "@/lib/admin/members-gestion/staffPeriods";

const LEGACY_STAFF_ROLES = [
  "Admin Adjoint",
  "Mentor",
  "Modérateur Junior",
  "Modérateur en formation",
  "Modérateur en Formation",
  "Fondateur TENF",
  "Fondateurs TENF",
  "Coordinateur TENF",
  "Modérateur TENF",
] as const;

export const ALL_STAFF_MEMBER_ROLES = [
  ...new Set([...STAFF_MEMBER_ROLE_KEYS, ...LEGACY_STAFF_ROLES]),
] as string[];

export type RoleHistoryEntry = {
  fromRole: string;
  toRole: string;
  changedAt: string;
  changedBy: string;
  reason?: string;
};

export type RoleTimelinePeriod = {
  role: string;
  roleLabel: string;
  isStaffRole: boolean;
  startedAt: string;
  endedAt: string | null;
  durationLabel: string;
  changedBy?: string;
  reason?: string;
  source: "role_history" | "staff_roles" | "current";
};

export type StaffRoleRecord = {
  roleName: string;
  roleLabel: string;
  scope: string | null;
  startsAt: string;
  endsAt: string | null;
  assignedBy: string | null;
  durationLabel: string;
  isActive: boolean;
};

export type StaffPilotAlumniStatus =
  | "active_staff"
  | "inactive_member"
  | "former_staff"
  | "pause_or_reduced";

export type StaffPilotProfile = {
  memberId: string;
  displayName: string;
  discordUsername: string | null;
  twitchLogin: string | null;
  discordId: string | null;
  currentRole: string;
  currentRoleLabel: string;
  isMemberActive: boolean;
  isCurrentlyStaff: boolean;
  alumniStatus: StaffPilotAlumniStatus;
  alumniStatusLabel: string;
  memberSince: string | null;
  memberSinceLabel: string | null;
  integrationDate: string | null;
  integrationDateLabel: string | null;
  staffTenureStartedAt: string | null;
  staffTenureEndedAt: string | null;
  staffTenureDurationLabel: string | null;
  currentRoleSince: string | null;
  currentRoleDurationLabel: string | null;
  timeline: RoleTimelinePeriod[];
  staffRoleRecords: StaffRoleRecord[];
};

type MemberRow = {
  id: string;
  display_name?: string | null;
  discord_username?: string | null;
  twitch_login?: string | null;
  discord_id?: string | null;
  role?: string | null;
  is_active?: boolean | null;
  created_at?: string | null;
  integration_date?: string | null;
  role_history?: RoleHistoryEntry[] | null;
  updated_at?: string | null;
};

type StaffMemberRow = {
  id: string;
  member_id: string;
  joined_at: string;
  left_at: string | null;
  is_active: boolean;
};

type StaffRoleRow = {
  role_name: string;
  scope: string | null;
  starts_at: string;
  ends_at: string | null;
  assigned_by: string | null;
};

export function isStaffMemberRole(role: string | null | undefined): boolean {
  if (!role) return false;
  const canonical = toCanonicalMemberRole(role);
  return ALL_STAFF_MEMBER_ROLES.some(
    (r) => toCanonicalMemberRole(r) === canonical || r === role || r === canonical,
  );
}

export function formatDurationFr(fromIso: string, toIso?: string | null): string {
  const from = new Date(fromIso);
  const to = toIso ? new Date(toIso) : new Date();
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return "—";
  const ms = Math.max(0, to.getTime() - from.getTime());
  const days = Math.floor(ms / 86_400_000);
  if (days < 1) return "< 1 jour";
  if (days < 30) return `${days} jour${days > 1 ? "s" : ""}`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} mois`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  if (rem === 0) return `${years} an${years > 1 ? "s" : ""}`;
  return `${years} an${years > 1 ? "s" : ""} ${rem} mois`;
}

function formatDateFr(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function resolveAlumniStatus(
  role: string,
  isMemberActive: boolean,
  isCurrentlyStaff: boolean,
  staffLeftAt: string | null,
): { status: StaffPilotAlumniStatus; label: string } {
  const r = role.toLowerCase();
  if (staffLeftAt || (!isCurrentlyStaff && !isMemberActive)) {
    return { status: "former_staff", label: "Ancien staff" };
  }
  if (!isMemberActive && isCurrentlyStaff) {
    return { status: "inactive_member", label: "Membre inactif (rôle staff)" };
  }
  if (r.includes("pause") || r.includes("activité réduite") || r.includes("activite reduite")) {
    return { status: "pause_or_reduced", label: "Staff en pause / activité réduite" };
  }
  return { status: "active_staff", label: "Staff actif" };
}

export function buildRoleTimelineFromHistory(
  member: Pick<MemberRow, "role" | "created_at" | "role_history">,
): RoleTimelinePeriod[] {
  const history = Array.isArray(member.role_history) ? [...member.role_history] : [];
  history.sort(
    (a, b) => new Date(a.changedAt).getTime() - new Date(b.changedAt).getTime(),
  );

  const periods: RoleTimelinePeriod[] = [];
  const memberStart = member.created_at ?? history[0]?.changedAt ?? new Date().toISOString();

  if (history.length === 0) {
    const role = member.role ?? "—";
    periods.push({
      role,
      roleLabel: getRoleBadgeLabel(role),
      isStaffRole: isStaffMemberRole(role),
      startedAt: memberStart,
      endedAt: null,
      durationLabel: formatDurationFr(memberStart),
      source: "current",
    });
    return periods;
  }

  const first = history[0];
  periods.push({
    role: first.fromRole,
    roleLabel: getRoleBadgeLabel(first.fromRole),
    isStaffRole: isStaffMemberRole(first.fromRole),
    startedAt: memberStart,
    endedAt: first.changedAt,
    durationLabel: formatDurationFr(memberStart, first.changedAt),
    changedBy: first.changedBy,
    reason: first.reason,
    source: "role_history",
  });

  for (let i = 0; i < history.length; i++) {
    const entry = history[i];
    const next = history[i + 1];
    periods.push({
      role: entry.toRole,
      roleLabel: getRoleBadgeLabel(entry.toRole),
      isStaffRole: isStaffMemberRole(entry.toRole),
      startedAt: entry.changedAt,
      endedAt: next?.changedAt ?? null,
      durationLabel: formatDurationFr(entry.changedAt, next?.changedAt ?? null),
      changedBy: entry.changedBy,
      reason: entry.reason,
      source: i === history.length - 1 && !next ? "current" : "role_history",
    });
  }

  const lastPeriod = periods[periods.length - 1];
  const currentRole = member.role ?? lastPeriod?.role ?? "—";
  if (lastPeriod && lastPeriod.role !== currentRole) {
    const since = history[history.length - 1]?.changedAt ?? memberStart;
    periods.push({
      role: currentRole,
      roleLabel: getRoleBadgeLabel(currentRole),
      isStaffRole: isStaffMemberRole(currentRole),
      startedAt: since,
      endedAt: null,
      durationLabel: formatDurationFr(since),
      source: "current",
    });
  }

  return periods;
}

export function buildStaffPilotProfile(
  member: MemberRow,
  staffMember: StaffMemberRow | null,
  staffRoles: StaffRoleRow[],
): StaffPilotProfile {
  const currentRole = member.role ?? "—";
  const isMemberActive = member.is_active !== false;
  const isCurrentlyStaff = isStaffMemberRole(currentRole);
  const timeline = buildRoleTimelineFromHistory(member);

  const staffRoleRecords: StaffRoleRecord[] = staffRoles
    .map((sr) => ({
      roleName: sr.role_name,
      roleLabel: getRoleBadgeLabel(sr.role_name),
      scope: sr.scope,
      startsAt: sr.starts_at,
      endsAt: sr.ends_at,
      assignedBy: sr.assigned_by,
      durationLabel: formatDurationFr(sr.starts_at, sr.ends_at),
      isActive: !sr.ends_at,
    }))
    .sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime());

  const firstStaffInTimeline = [...timeline]
    .filter((p) => p.isStaffRole)
    .sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime())[0];

  const staffPeriods = normalizeStaffPeriods(
    (member as MemberRow & { staff_periods?: unknown }).staff_periods as unknown[],
  );
  const confirmed = computeConfirmedStaffMetrics(staffPeriods);
  const estimatedTenure = {
    totalStaffTenureMs: 0,
    firstStaffAt: null as Date | null,
    lastStaffExitAt: null as Date | null,
    currentStaffTenureMs: null as number | null,
    currentStaffTenureFrom: null as Date | null,
  };

  const staffTenureStartedAtEst =
    staffMember?.joined_at ?? firstStaffInTimeline?.startedAt ?? null;
  const staffTenureEndedAtEst = staffMember?.left_at ?? null;
  if (staffTenureStartedAtEst) {
    estimatedTenure.firstStaffAt = new Date(staffTenureStartedAtEst);
    estimatedTenure.totalStaffTenureMs = Math.max(
      0,
      (staffTenureEndedAtEst ? new Date(staffTenureEndedAtEst) : new Date()).getTime() -
        new Date(staffTenureStartedAtEst).getTime(),
    );
    estimatedTenure.lastStaffExitAt = staffTenureEndedAtEst
      ? new Date(staffTenureEndedAtEst)
      : null;
  }

  const currentPeriod = timeline.find((p) => !p.endedAt) ?? timeline[timeline.length - 1];
  const currentRoleSince = currentPeriod?.startedAt ?? null;
  if (currentRoleSince && isCurrentlyStaff) {
    estimatedTenure.currentStaffTenureFrom = new Date(currentRoleSince);
    estimatedTenure.currentStaffTenureMs = Math.max(
      0,
      Date.now() - new Date(currentRoleSince).getTime(),
    );
  }

  const merged = mergeStaffPilotMetrics(estimatedTenure, confirmed);
  const staffTenureStartedAt =
    merged.firstStaffAt?.toISOString() ?? staffTenureStartedAtEst;
  const staffTenureEndedAt =
    merged.lastStaffExitAt?.toISOString() ?? staffTenureEndedAtEst ?? null;
  const staffTenureDurationLabel = staffTenureStartedAt
    ? formatDurationFr(staffTenureStartedAt, staffTenureEndedAt)
    : null;
  const currentRoleDurationLabel = merged.currentStaffTenureFrom
    ? formatDurationFr(merged.currentStaffTenureFrom.toISOString())
    : currentRoleSince
      ? formatDurationFr(currentRoleSince)
      : null;

  const { status, label } = resolveAlumniStatus(
    currentRole,
    isMemberActive,
    isCurrentlyStaff,
    staffTenureEndedAt,
  );

  return {
    memberId: member.id,
    displayName: member.display_name || member.discord_username || "—",
    discordUsername: member.discord_username ?? null,
    twitchLogin: member.twitch_login ?? null,
    discordId: member.discord_id ?? null,
    currentRole,
    currentRoleLabel: getRoleBadgeLabel(currentRole),
    isMemberActive,
    isCurrentlyStaff,
    alumniStatus: status,
    alumniStatusLabel: label,
    memberSince: member.created_at ?? null,
    memberSinceLabel: formatDateFr(member.created_at),
    integrationDate: member.integration_date ?? null,
    integrationDateLabel: formatDateFr(member.integration_date),
    staffTenureStartedAt,
    staffTenureEndedAt,
    staffTenureDurationLabel,
    currentRoleSince,
    currentRoleDurationLabel,
    timeline: [...timeline].reverse(),
    staffRoleRecords,
  };
}

export async function fetchStaffPilotProfile(memberId: string): Promise<StaffPilotProfile | null> {
  const { data: member, error } = await supabaseAdmin
    .from("members")
    .select(
      "id, display_name, discord_username, twitch_login, discord_id, role, is_active, created_at, integration_date, role_history, staff_periods, updated_at",
    )
    .eq("id", memberId)
    .maybeSingle();

  if (error || !member) return null;

  const { data: staffMember } = await supabaseAdmin
    .from("staff_members")
    .select("id, member_id, joined_at, left_at, is_active")
    .eq("member_id", memberId)
    .maybeSingle();

  let staffRoles: StaffRoleRow[] = [];
  if (staffMember?.id) {
    const { data: roles } = await supabaseAdmin
      .from("staff_roles")
      .select("role_name, scope, starts_at, ends_at, assigned_by")
      .eq("staff_member_id", staffMember.id)
      .order("starts_at", { ascending: false });
    staffRoles = (roles ?? []) as StaffRoleRow[];
  }

  return buildStaffPilotProfile(
    member as MemberRow,
    staffMember as StaffMemberRow | null,
    staffRoles,
  );
}

export async function fetchStaffPilotProfilesByMemberIds(
  memberIds: string[],
): Promise<Map<string, StaffPilotProfile>> {
  const out = new Map<string, StaffPilotProfile>();
  if (memberIds.length === 0) return out;

  const { data: members, error } = await supabaseAdmin
    .from("members")
    .select(
      "id, display_name, discord_username, twitch_login, discord_id, role, is_active, created_at, integration_date, role_history, staff_periods, updated_at",
    )
    .in("id", memberIds);

  if (error || !members?.length) return out;

  const { data: staffMembers } = await supabaseAdmin
    .from("staff_members")
    .select("id, member_id, joined_at, left_at, is_active")
    .in("member_id", memberIds);

  const staffByMember = new Map(
    (staffMembers ?? []).map((sm) => [sm.member_id as string, sm as StaffMemberRow]),
  );

  const staffMemberIds = (staffMembers ?? []).map((sm) => sm.id as string).filter(Boolean);
  const rolesByStaffId = new Map<string, StaffRoleRow[]>();

  if (staffMemberIds.length > 0) {
    const { data: allRoles } = await supabaseAdmin
      .from("staff_roles")
      .select("staff_member_id, role_name, scope, starts_at, ends_at, assigned_by")
      .in("staff_member_id", staffMemberIds)
      .order("starts_at", { ascending: false });

    for (const row of allRoles ?? []) {
      const sid = row.staff_member_id as string;
      const list = rolesByStaffId.get(sid) ?? [];
      list.push({
        role_name: row.role_name as string,
        scope: (row.scope as string) ?? null,
        starts_at: row.starts_at as string,
        ends_at: (row.ends_at as string) ?? null,
        assigned_by: (row.assigned_by as string) ?? null,
      });
      rolesByStaffId.set(sid, list);
    }
  }

  for (const member of members as MemberRow[]) {
    const sm = staffByMember.get(member.id) ?? null;
    const roles = sm ? rolesByStaffId.get(sm.id) ?? [] : [];
    out.set(member.id, buildStaffPilotProfile(member, sm, roles));
  }

  return out;
}

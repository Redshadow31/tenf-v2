import { getBlobStore } from "@/lib/memberData";
import { getDevRolePreviewLabel } from "@/lib/admin/devRolePreviewLabels";
import type { AdminDashboardAggregate } from "@/lib/admin/dashboard/adminDashboardTypes";
import { getDashboardSummaryCached } from "@/lib/admin/dashboardSummary";
import { loadDashboardData } from "@/lib/dashboardDataStorage";
import { getAllEvents } from "@/lib/memberEvents";
import { loadStaffApplications } from "@/lib/staffApplicationsStorage";
import { evaluationRepository, eventRepository } from "@/lib/repositories";
import { readVipMonthLogins } from "@/lib/vipMonthStore";
import {
  getAllFollowValidationsForMonth,
  getLastMonthWithData,
  isValidationObsolete,
} from "@/lib/followStorage";
import { getActiveFollowStaff } from "@/lib/followStaffStorage";
import { getActiveRaidTestRun } from "@/lib/raidEventsubTest";
import { supabaseAdmin } from "@/lib/db/supabase";
import type { AuthenticatedAdmin } from "@/lib/requireAdmin";

const ACCESS_STORE = "tenf-admin-access";
const ACCESS_KEY = "admin-access-list";

const ROLE_LABELS: Record<string, string> = {
  FONDATEUR: "Fondateur·rice TENF",
  ADMIN_COORDINATEUR: "Admin coordinateur·rice",
  MODERATEUR: "Modérateur·rice",
  MODERATEUR_AUTONOMIE: "Modérateur·rice en autonomie",
  MODERATEUR_ACCOMPAGNEMENT: "Modérateur·rice en accompagnement",
  MODERATEUR_DECOUVERTE: "Modérateur·rice en découverte",
  MODERATEUR_EN_PAUSE: "Modérateur·rice en pause",
  SOUTIEN_TENF: "Soutien TENF",
  CONTRIBUTEUR_INVITE: "Contributeur·rice invité(e)",
};

function normalizeCategoryLabel(value: string | undefined): string {
  return (value || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function monthKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function previousMonthKey(date = new Date()): string {
  return monthKey(new Date(date.getFullYear(), date.getMonth() - 1, 1));
}

async function loadAdminAlias(discordId: string): Promise<string | null> {
  try {
    const store = getBlobStore(ACCESS_STORE);
    const raw = await store.get(ACCESS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Array<{ discordId?: string; adminAlias?: string }>;
    const current = parsed.find((entry) => String(entry?.discordId || "") === discordId);
    const alias = typeof current?.adminAlias === "string" ? current.adminAlias.trim() : "";
    return alias || null;
  } catch {
    return null;
  }
}

async function loadRecentMemberEvents(limit = 12) {
  const since = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
  const events = await getAllEvents({ startDate: since });
  return events
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit)
    .map((event) => ({
      id: event.id,
      memberId: event.memberId,
      type: event.type,
      createdAt: event.createdAt,
      source: event.source,
      actor: event.actor,
    }));
}

async function loadFollowOverdueStaffNames(currentMonth: string): Promise<string[]> {
  let validations = await getAllFollowValidationsForMonth(currentMonth);
  if (validations.length === 0) {
    const fallback = await getLastMonthWithData(currentMonth);
    if (fallback) validations = await getAllFollowValidationsForMonth(fallback);
  }
  const staffList = await getActiveFollowStaff();
  const staffNames = new Map(staffList.map((s) => [s.slug, s.displayName || s.slug]));
  return validations
    .filter((v) => isValidationObsolete(v.validatedAt))
    .map((v) => staffNames.get(v.staffSlug) || v.staffSlug)
    .filter(Boolean);
}

async function loadFinalNotesCount(evaluationMonth: string): Promise<number> {
  const evaluations = await evaluationRepository.findByMonth(evaluationMonth, 1000, 0);
  return evaluations.filter((e) => e.finalNote !== undefined && e.finalNote !== null).length;
}

async function loadProfileValidationPendingCount(): Promise<number> {
  const { count, error } = await supabaseAdmin
    .from("member_profile_pending")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");
  if (error) throw error;
  return count || 0;
}

async function loadRaidsPendingCount(): Promise<number> {
  const { count, error } = await supabaseAdmin
    .from("raid_declarations")
    .select("*", { count: "exact", head: true })
    .in("status", ["processing", "to_study"]);
  if (error) throw error;
  return count || 0;
}

async function loadDiscordPointsTodoCount(): Promise<number> {
  const runId = (await getActiveRaidTestRun())?.id;
  if (!runId) return 0;

  const [{ data: matchedEvents, error: eventsError }, { data: awardedRows, error: awardedError }] =
    await Promise.all([
      supabaseAdmin
        .from("raid_test_events")
        .select("id")
        .eq("run_id", runId)
        .eq("processing_status", "matched")
        .limit(1000),
      supabaseAdmin.from("raid_test_points").select("raid_test_event_id").eq("run_id", runId).limit(5000),
    ]);

  if (eventsError || awardedError) return 0;
  const awarded = new Set(
    (awardedRows || []).map((row) => String(row.raid_test_event_id || "")).filter(Boolean),
  );
  return (matchedEvents || []).filter((row) => !awarded.has(String(row.id))).length;
}

async function loadRaidsIgnoredCount(): Promise<number> {
  const runId = (await getActiveRaidTestRun())?.id;
  if (!runId) return 0;
  const { count, error } = await supabaseAdmin
    .from("raid_test_events")
    .select("*", { count: "exact", head: true })
    .eq("run_id", runId)
    .eq("processing_status", "ignored");
  if (error) return 0;
  return count || 0;
}

async function loadUpcomingKpis(now = new Date()) {
  const dashboardData = await loadDashboardData();
  const events = await eventRepository.findAll(120, 0);
  const windowStart = new Date(now);
  windowStart.setDate(windowStart.getDate() - 120);
  const windowEnd = new Date(now);
  windowEnd.setDate(windowEnd.getDate() + 120);

  const inWindow = events
    .filter((event) => {
      const date = new Date(event.date);
      return date >= windowStart && date <= windowEnd;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 40);

  const eventStats = await Promise.all(
    inWindow.map(async (event) => {
      const [registrations, presences] = await Promise.all([
        eventRepository.getRegistrations(event.id),
        eventRepository.getPresences(event.id),
      ]);
      return {
        event,
        registrationCount: registrations.length,
        presenceCount: presences.length,
      };
    }),
  );

  const pastEvents = eventStats.filter((item) => new Date(item.event.date) < now);
  const futureEvents = eventStats.filter((item) => new Date(item.event.date) >= now);

  const pendingEventValidations = pastEvents.filter(
    (item) => item.registrationCount > 0 && item.presenceCount === 0,
  ).length;

  const findNextRegistrationCount = (matcher: (category: string) => boolean): number => {
    const found = futureEvents.find((item) => matcher(normalizeCategoryLabel(item.event.category)));
    return found?.registrationCount || 0;
  };

  let nextMeetingRegistrations = findNextRegistrationCount(
    (category) => category.includes("integration") || category.includes("reunion"),
  );

  const nextEvent = futureEvents[0];
  const nextEventRegistrations = Number(nextEvent?.registrationCount || 0);
  const nextEventLabel = String(nextEvent?.event?.title || "");
  const upcomingSpotlights = futureEvents.filter((item) =>
    normalizeCategoryLabel(item.event.category).includes("spotlight"),
  ).length;

  const plannedMeetings = Array.isArray(dashboardData?.meetingSchedule)
    ? dashboardData.meetingSchedule
    : [];
  const nextPlannedMeeting = plannedMeetings
    .filter((item: { enabled?: boolean; datetime?: string }) => item?.enabled !== false && item?.datetime)
    .map((item: { datetime: string; label?: string }) => ({
      datetime: String(item.datetime),
      label: String(item.label || "Réunion"),
    }))
    .filter((item) => new Date(item.datetime).getTime() >= now.getTime())
    .sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime())[0];

  let nextMeetingDateIso = "";
  let nextMeetingLabel = "";
  if (nextPlannedMeeting) {
    nextMeetingDateIso = nextPlannedMeeting.datetime;
    nextMeetingLabel = nextPlannedMeeting.label;
  } else if (nextEvent?.event?.date) {
    nextMeetingDateIso = new Date(nextEvent.event.date).toISOString();
    nextMeetingLabel = "Réunion planifiée";
  }

  if (nextMeetingRegistrations === 0 && nextEvent) {
    nextMeetingRegistrations = nextEventRegistrations;
  }

  return {
    nextMeetingRegistrations,
    nextMeetingDateIso,
    nextMeetingLabel,
    nextEventRegistrations,
    nextEventLabel,
    upcomingSpotlights,
    pendingEventValidations,
  };
}

export type BentoDashboardPayload = {
  user: {
    displayName: string;
    roleLabel: string;
    rawRole: string | null;
  };
  data: AdminDashboardAggregate;
};

export async function loadBentoDashboardPayload(
  admin: AuthenticatedAdmin,
  currentMonth = monthKey(),
  evaluationMonth = previousMonthKey(),
): Promise<BentoDashboardPayload> {
  const [
    alias,
    summary,
    events,
    followOverdueStaffNames,
    vipLogins,
    staffApplications,
    profileValidationPendingCount,
    raidsPendingCount,
    discordPointsPendingCount,
    raidsIgnoredToProcessCount,
    finalNotesCount,
    upcoming,
  ] = await Promise.all([
    loadAdminAlias(admin.discordId),
    getDashboardSummaryCached(),
    loadRecentMemberEvents(12),
    loadFollowOverdueStaffNames(currentMonth),
    readVipMonthLogins(currentMonth),
    loadStaffApplications(),
    loadProfileValidationPendingCount(),
    loadRaidsPendingCount(),
    loadDiscordPointsTodoCount(),
    loadRaidsIgnoredCount(),
    loadFinalNotesCount(evaluationMonth),
    loadUpcomingKpis(),
  ]);

  const pendingStatuses = new Set(["nouveau", "a_contacter", "entretien_prevu"]);
  const staffApplicationsPendingCount = staffApplications.filter((app) =>
    pendingStatuses.has(app.admin_status),
  ).length;
  const staffApplicationsRedFlagCount = staffApplications.filter((app) => app.has_red_flag).length;

  const roleLabel =
    ROLE_LABELS[admin.role] || getDevRolePreviewLabel(admin.role) || admin.role.replace(/_/g, " ");

  return {
    user: {
      displayName: alias || admin.username || "Staff",
      roleLabel,
      rawRole: admin.role,
    },
    data: {
      summary,
      ops: {
        events,
        finalNotesCount,
        followOverdueStaffNames,
        vipMonthCount: vipLogins.length,
        staffApplicationsPendingCount,
        staffApplicationsRedFlagCount,
        profileValidationPendingCount,
        raidsPendingCount,
        discordPointsPendingCount,
        raidsIgnoredToProcessCount,
      },
      upcoming,
    },
  };
}

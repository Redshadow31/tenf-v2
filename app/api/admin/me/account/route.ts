import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireAdmin } from "@/lib/requireAdmin";
import { hasAdvancedAdminAccess } from "@/lib/advancedAccess";
import { memberRepository } from "@/lib/repositories";
import { supabaseAdmin } from "@/lib/db/supabase";
import {
  CHARTER_VERSION,
  getLatestModerationCharterValidationForMember,
} from "@/lib/moderationCharterValidationsStorage";
import { listStaffMissionsForAssignee } from "@/lib/staffMissionAssignments";
import type { AdminRole } from "@/lib/adminRoles";
import { getAdminRole, isFounder } from "@/lib/adminRoles";
import { loadAdminAccessCache, getAdminRoleFromCache, getAllAdminIdsFromCache } from "@/lib/adminAccessCache";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const CHARTER_GRACE_MS = 15 * 24 * 60 * 60 * 1000;

function labelForAdminRole(role: AdminRole | string): string {
  const map: Record<string, string> = {
    FONDATEUR: "Fondateur",
    ADMIN_COORDINATEUR: "Admin coordinateur",
    MODERATEUR: "Modérateur",
    MODERATEUR_EN_FORMATION: "Modérateur en formation",
    MODERATEUR_EN_PAUSE: "Modérateur en pause",
    SOUTIEN_TENF: "Soutien TENF",
  };
  return map[role] || String(role);
}

function isValidEmail(value: string): boolean {
  const v = value.trim();
  if (v.length > 320) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function resolvedStaffAdminRole(discordId: string): AdminRole | null {
  if (isFounder(discordId)) return "FONDATEUR";
  return getAdminRole(discordId) || getAdminRoleFromCache(discordId);
}

async function loadStaffSnapshot(): Promise<{
  activeCommunityMembers: number | null;
  moderatorsActive: number;
  moderatorsPaused: number;
  staffWithDashboardAccess: number;
}> {
  let activeCommunityMembers: number | null = null;
  try {
    const { count, error } = await supabaseAdmin
      .from("members")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true)
      .eq("is_archived", false);
    if (!error && typeof count === "number") activeCommunityMembers = count;
  } catch (e) {
    console.warn("[admin/me/account] members count:", e);
  }

  let moderatorsActive = 0;
  let moderatorsPaused = 0;
  try {
    await loadAdminAccessCache();
    const ids = getAllAdminIdsFromCache();
    for (const id of ids) {
      const role = resolvedStaffAdminRole(id);
      if (!role) continue;
      if (role === "MODERATEUR" || role === "MODERATEUR_EN_FORMATION") moderatorsActive += 1;
      else if (role === "MODERATEUR_EN_PAUSE") moderatorsPaused += 1;
    }
    return {
      activeCommunityMembers,
      moderatorsActive,
      moderatorsPaused,
      staffWithDashboardAccess: ids.length,
    };
  } catch (e) {
    console.warn("[admin/me/account] staff snapshot:", e);
    return {
      activeCommunityMembers,
      moderatorsActive: 0,
      moderatorsPaused: 0,
      staffWithDashboardAccess: 0,
    };
  }
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const session = await getServerSession(authOptions);
  const sessionGlobal =
    (session?.user as { discordGlobalName?: string | null } | undefined)?.discordGlobalName ?? null;
  const sessionHandle =
    (session?.user as { discordHandle?: string | null } | undefined)?.discordHandle ?? null;

  const canViewSensitive = await hasAdvancedAdminAccess(admin.discordId);

  let member = null as Awaited<ReturnType<typeof memberRepository.findByDiscordId>>;
  try {
    member = await memberRepository.findByDiscordId(admin.discordId);
  } catch (e) {
    console.error("[admin/me/account] findByDiscordId:", e);
  }

  let linkedTwitch: { twitchUserId: string; twitchLogin: string; twitchDisplayName: string | null } | null =
    null;
  try {
    const { data, error } = await supabaseAdmin
      .from("linked_twitch_accounts")
      .select("twitch_user_id, twitch_login, twitch_display_name")
      .eq("discord_id", admin.discordId)
      .maybeSingle();
    if (!error && data) {
      linkedTwitch = {
        twitchUserId: String(data.twitch_user_id || ""),
        twitchLogin: String(data.twitch_login || ""),
        twitchDisplayName: data.twitch_display_name ? String(data.twitch_display_name) : null,
      };
    }
  } catch (e) {
    console.warn("[admin/me/account] linked_twitch_accounts:", e);
  }

  let charterValidation = null as Awaited<ReturnType<typeof getLatestModerationCharterValidationForMember>>;
  try {
    charterValidation = await getLatestModerationCharterValidationForMember(admin.discordId);
  } catch (e) {
    console.warn("[admin/me/account] charter validation:", e);
  }

  const charterAccepted = !!charterValidation;
  const baseForGrace = member?.integrationDate || member?.createdAt || new Date();
  const graceStart = baseForGrace instanceof Date ? baseForGrace.getTime() : new Date(baseForGrace).getTime();
  const charterDeadlineIso = new Date(graceStart + CHARTER_GRACE_MS).toISOString();
  const now = Date.now();
  const charterDeadlineMs = graceStart + CHARTER_GRACE_MS;
  const isCharterGraceElapsed = !charterAccepted && now > charterDeadlineMs;
  const msRemaining = !charterAccepted ? Math.max(0, charterDeadlineMs - now) : 0;
  const daysRemainingCharter = Math.ceil(msRemaining / (24 * 60 * 60 * 1000));

  const twitchLogin = member?.twitchLogin || linkedTwitch?.twitchLogin || null;
  const twitchIdFromMember = member?.twitchId || null;
  const twitchIdFromLink = linkedTwitch?.twitchUserId || null;

  const discordUsernameDisplay =
    member?.discordUsername?.trim() ||
    sessionHandle ||
    admin.username ||
    null;

  const integrationDateIso = member?.integrationDate
    ? (member.integrationDate instanceof Date
        ? member.integrationDate.toISOString()
        : new Date(member.integrationDate).toISOString())
    : null;
  const memberCreatedAtIso = member?.createdAt
    ? (member.createdAt instanceof Date ? member.createdAt.toISOString() : new Date(member.createdAt).toISOString())
    : null;

  let staffSnapshot = null as Awaited<ReturnType<typeof loadStaffSnapshot>> | null;
  try {
    staffSnapshot = await loadStaffSnapshot();
  } catch (e) {
    console.warn("[admin/me/account] staffSnapshot:", e);
  }

  let staffMissions: { id: string; title: string; description: string | null; sortOrder: number }[] = [];
  try {
    const rows = await listStaffMissionsForAssignee(admin.discordId);
    staffMissions = rows.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      sortOrder: r.sortOrder,
    }));
  } catch (e) {
    console.warn("[admin/me/account] staffMissions:", e);
  }

  const payload = {
    hasAdvancedAdminView: canViewSensitive,
    displayName: member?.displayName || admin.username,
    siteUsername: member?.siteUsername ?? null,
    siteRole: member?.role ?? null,
    adminRole: admin.role,
    adminRoleLabel: labelForAdminRole(admin.role),
    discordUsername: discordUsernameDisplay,
    twitchLogin,
    twitchDisplayNameLinked: linkedTwitch?.twitchDisplayName ?? null,
    hasLinkedTwitchAccount: !!linkedTwitch,
    twitchUrl: member?.twitchUrl || (twitchLogin ? `https://www.twitch.tv/${twitchLogin}` : null),
    integrationDateIso,
    memberCreatedAtIso,
    charter: {
      currentVersion: CHARTER_VERSION,
      accepted: charterAccepted,
      validatedAt: charterValidation?.validatedAt ?? null,
      validatedVersion: charterValidation?.charterVersion ?? null,
      deadlineIso: charterDeadlineIso,
      daysRemainingApprox: charterAccepted ? null : daysRemainingCharter,
      graceElapsed: isCharterGraceElapsed,
    },
    staffNotificationEmail: member?.staffNotificationEmail?.trim() || "",
    staffSnapshot,
    staffMissions,
    sensitive: canViewSensitive
      ? {
          discordId: admin.discordId,
          discordRename: sessionGlobal,
          discordHandle: sessionHandle,
          twitchId: twitchIdFromMember || twitchIdFromLink || null,
        }
      : null,
  };

  return NextResponse.json(payload);
}

export async function PATCH(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  let body: { staffNotificationEmail?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const raw = typeof body.staffNotificationEmail === "string" ? body.staffNotificationEmail.trim() : "";
  if (raw.length > 0 && !isValidEmail(raw)) {
    return NextResponse.json({ error: "Adresse e-mail invalide" }, { status: 400 });
  }

  const member = await memberRepository.findByDiscordId(admin.discordId);
  if (!member) {
    return NextResponse.json(
      { error: "Aucune fiche membre liée à ton compte Discord. Contacte un fondateur." },
      { status: 404 }
    );
  }

  try {
    await memberRepository.update(member.twitchLogin, {
      staffNotificationEmail: raw.length === 0 ? null : raw,
      updatedBy: admin.discordId,
    });
  } catch (e) {
    console.error("[admin/me/account] PATCH update:", e);
    return NextResponse.json({ error: "Enregistrement impossible" }, { status: 500 });
  }

  return NextResponse.json({ success: true, staffNotificationEmail: raw.length === 0 ? "" : raw });
}

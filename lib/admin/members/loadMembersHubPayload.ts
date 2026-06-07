import { getBlobStore, getAllMemberData, loadMemberDataFromStorage } from "@/lib/memberData";
import type { MemberData } from "@/lib/memberData";
import { getDevRolePreviewLabel } from "@/lib/admin/devRolePreviewLabels";
import { getDashboardSummaryCached } from "@/lib/admin/dashboardSummary";
import { loadStaffApplications } from "@/lib/staffApplicationsStorage";
import { memberRepository } from "@/lib/repositories";
import { supabaseAdmin } from "@/lib/db/supabase";
import { cacheGet, cacheKey, cacheSetWithNamespace } from "@/lib/cache";
import type { AuthenticatedAdmin } from "@/lib/requireAdmin";
import type {
  MembersHubDataHealth,
  MembersHubOps,
  MembersHubSummary,
} from "@/lib/admin/members/membersHubModel";

const ACCESS_STORE = "tenf-admin-access";
const ACCESS_KEY = "admin-access-list";
const ADMIN_BLOB_STORE = "tenf-admin-members";
const BOT_BLOB_STORE = "tenf-bot-members";
const ADMIN_BLOB_KEY = "admin-members-data";
const BOT_BLOB_KEY = "bot-members-data";
const HUB_NAMESPACE = "admin_members_hub";
const SYNC_COUNT_TTL_SECONDS = 300;

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

export type MembersHubPayload = {
  user: {
    displayName: string;
    roleLabel: string;
    rawRole: string | null;
  };
  summary: MembersHubSummary;
  ops: MembersHubOps;
  dataHealth: MembersHubDataHealth;
  syncMissingCount: number;
  meta: {
    generatedAt: string;
    partial: boolean;
  };
};

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

async function loadProfileValidationPendingCount(): Promise<number> {
  const { count, error } = await supabaseAdmin
    .from("member_profile_pending")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");
  if (error) throw error;
  return count || 0;
}

async function loadAdminMembersFromBlobs(): Promise<Record<string, MemberData>> {
  try {
    const store = getBlobStore(ADMIN_BLOB_STORE);
    const data = await store.get(ADMIN_BLOB_KEY, { type: "text" });
    if (!data) return {};
    return JSON.parse(data) as Record<string, MemberData>;
  } catch {
    return {};
  }
}

async function loadBotMembersFromBlobs(): Promise<Record<string, MemberData>> {
  try {
    const store = getBlobStore(BOT_BLOB_STORE);
    const data = await store.get(BOT_BLOB_KEY, { type: "text" });
    if (!data) return {};
    return JSON.parse(data) as Record<string, MemberData>;
  } catch {
    return {};
  }
}

async function countSyncMissingMembers(): Promise<number> {
  const syncCacheKey = cacheKey("api", "admin", "members", "hub", "sync-missing", "v1");
  const cached = await cacheGet<number>(syncCacheKey);
  if (typeof cached === "number") return cached;

  const adminMembersBlobs = await loadAdminMembersFromBlobs();
  const botMembersBlobs = await loadBotMembersFromBlobs();
  const mergedBlobs: Record<string, MemberData> = { ...botMembersBlobs, ...adminMembersBlobs };

  const supabaseMembers = await memberRepository.findAll(1000, 0);
  const supabaseLogins = new Set(
    supabaseMembers.map((m) => (m.twitchLogin || "").toLowerCase()).filter(Boolean),
  );

  let missing = 0;
  for (const member of Object.values(mergedBlobs)) {
    const login = (member.twitchLogin || "").toLowerCase();
    if (login && !supabaseLogins.has(login)) missing += 1;
  }

  await cacheSetWithNamespace(HUB_NAMESPACE, syncCacheKey, missing, SYNC_COUNT_TTL_SECONDS);
  return missing;
}

async function countDiscordMissingUsername(): Promise<number> {
  const { count, error } = await supabaseAdmin
    .from("members")
    .select("*", { count: "exact", head: true })
    .not("discord_id", "is", null)
    .or("discord_username.is.null,discord_username.eq.");
  if (error) return 0;
  return count || 0;
}

async function countDataHealthErrors(): Promise<{ errors: number; warnings: number }> {
  await loadMemberDataFromStorage();
  const allMembers = getAllMemberData();

  let incompleteCount = 0;
  let errorsCount = 0;

  for (const member of allMembers) {
    const missingFields: string[] = [];
    if (!member.twitchLogin || member.twitchLogin.trim() === "") missingFields.push("twitchLogin");
    if (!member.discordId || member.discordId.trim() === "") missingFields.push("discordId");

    const roleStr = String(member.role || "");
    const isCreator =
      roleStr.includes("Créateur") ||
      roleStr.includes("créateur") ||
      roleStr === "Affilié" ||
      roleStr === "Développement" ||
      roleStr === "Créateur Junior" ||
      roleStr === "Les P'tits Jeunes";

    if (isCreator && (!member.displayName || member.displayName.trim() === "")) {
      missingFields.push("displayName");
    }

    if (missingFields.length > 0) incompleteCount += 1;

    if (!member.twitchLogin || member.twitchLogin.trim() === "") {
      errorsCount += 1;
      continue;
    }
    if (member.twitchLogin.startsWith("discord_")) {
      errorsCount += 1;
      continue;
    }
    if (member.discordId && (!member.discordUsername || member.discordUsername.trim() === "")) {
      errorsCount += 1;
      continue;
    }
    const twitchLoginRegex = /^[a-zA-Z0-9_]{4,25}$/;
    if (member.twitchLogin && !twitchLoginRegex.test(member.twitchLogin)) {
      errorsCount += 1;
    }
  }

  return { errors: errorsCount, warnings: incompleteCount };
}

export async function loadMembersHubPayload(admin: AuthenticatedAdmin): Promise<MembersHubPayload> {
  const generatedAt = new Date().toISOString();
  let partial = false;

  const results = await Promise.allSettled([
    loadAdminAlias(admin.discordId),
    getDashboardSummaryCached(),
    loadStaffApplications(),
    loadProfileValidationPendingCount(),
    countDataHealthErrors(),
    countDiscordMissingUsername(),
    countSyncMissingMembers(),
  ]);

  const alias = results[0].status === "fulfilled" ? results[0].value : null;
  if (results[0].status === "rejected") partial = true;

  const summaryRaw = results[1].status === "fulfilled" ? results[1].value : null;
  if (results[1].status === "rejected") partial = true;

  const staffApplications = results[2].status === "fulfilled" ? results[2].value : [];
  if (results[2].status === "rejected") partial = true;

  const profileValidationPendingCount =
    results[3].status === "fulfilled" ? results[3].value : 0;
  if (results[3].status === "rejected") partial = true;

  const dataHealthRaw =
    results[4].status === "fulfilled" ? results[4].value : { errors: 0, warnings: 0 };
  if (results[4].status === "rejected") partial = true;

  const discordMissingUsername = results[5].status === "fulfilled" ? results[5].value : 0;
  if (results[5].status === "rejected") partial = true;

  const syncMissingCount = results[6].status === "fulfilled" ? results[6].value : 0;
  if (results[6].status === "rejected") partial = true;

  const pendingStatuses = new Set(["nouveau", "a_contacter", "entretien_prevu"]);
  const staffApplicationsPendingCount = staffApplications.filter((app) =>
    pendingStatuses.has(app.admin_status),
  ).length;
  const staffApplicationsRedFlagCount = staffApplications.filter((app) => app.has_red_flag).length;

  const roleLabel =
    ROLE_LABELS[admin.role] || getDevRolePreviewLabel(admin.role) || admin.role.replace(/_/g, " ");

  const summary: MembersHubSummary = {
    total: Number(summaryRaw?.total || 0),
    missingDiscord: Number(summaryRaw?.missingDiscord || 0),
    missingTwitchId: Number(summaryRaw?.missingTwitchId || 0),
    incomplete: Number(summaryRaw?.incomplete || 0),
    reviewOverdue: Number(summaryRaw?.reviewOverdue || 0),
    reviewDue7d: Number(summaryRaw?.reviewDue7d || 0),
    avgCompletion: Number(summaryRaw?.avgCompletion || 0),
    validatedProfiles: Number(summaryRaw?.validatedProfiles || 0),
  };

  return {
    user: {
      displayName: alias || admin.username || "Staff",
      roleLabel,
      rawRole: admin.role,
    },
    summary,
    ops: {
      staffApplicationsPendingCount,
      staffApplicationsRedFlagCount,
      profileValidationPendingCount,
    },
    dataHealth: {
      errors: dataHealthRaw.errors,
      warnings: dataHealthRaw.warnings,
      discordMissingUsername,
    },
    syncMissingCount,
    meta: { generatedAt, partial },
  };
}

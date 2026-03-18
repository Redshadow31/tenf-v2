/**
 * API Route pour migrer les membres depuis Netlify Blobs vers Supabase
 * avec mode dry-run, anti-doublons robuste et migration d'historique.
 *
 * POST /api/admin/migration/migrate-members
 * Body: {
 *   source?: 'admin' | 'bot' | 'merged',
 *   selectedLogins?: string[],
 *   dryRun?: boolean
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/requireAdmin";
import { getBlobStore } from "@/lib/memberData";
import { memberRepository } from "@/lib/repositories";
import type { MemberData } from "@/lib/memberData";
import { getTwitchUsers } from "@/lib/twitch";
import { buildTwitchAvatarMap, hydrateTwitchStatusAvatar } from "@/lib/memberAvatar";
import { invalidateAdminDashboardCache } from "@/lib/admin/dashboardSummary";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minutes

const ADMIN_BLOB_STORE = "tenf-admin-members";
const BOT_BLOB_STORE = "tenf-bot-members";
const ADMIN_BLOB_KEY = "admin-members-data";
const BOT_BLOB_KEY = "bot-members-data";
const SUPABASE_PAGE_SIZE = 1000;
const SUPABASE_MAX_PAGES = 20;

type MigrationSource = "admin" | "bot" | "merged";
type CandidateSource = "admin" | "bot";
type ActionType = "create" | "update" | "skip";

type Candidate = {
  key: string;
  sourceOfTruth: CandidateSource;
  sourcePresence: CandidateSource[];
  member: MemberData;
  aliases: string[];
};

type ActionPlan = {
  action: ActionType;
  candidate: Candidate;
  targetLogin: string;
  reason?: string;
  fieldsToUpdate?: string[];
  conflicts?: string[];
  patch?: Partial<MemberData>;
  existing?: MemberData;
};

type MigrationReport = {
  dryRun: boolean;
  source: MigrationSource;
  totals: {
    fromBlobs: number;
    afterSelection: number;
    candidatesAfterDedup: number;
    dedupCollapsed: number;
    actionsCreate: number;
    actionsUpdate: number;
    actionsSkip: number;
    appliedCreate: number;
    appliedUpdate: number;
    appliedSkip: number;
    appliedArchived: number;
    errors: number;
    conflicts: number;
    excludedByArchive: number;
  };
  dedup: Array<{
    stableKey: string;
    keptLogin: string;
    droppedLogins: string[];
  }>;
  actionsPreview: Array<{
    action: ActionType;
    login: string;
    source: CandidateSource;
    fieldsToUpdate?: string[];
    conflicts?: string[];
    reason?: string;
  }>;
  errors: string[];
};

function normalizeLogin(value?: string | null): string {
  return String(value || "").trim().toLowerCase();
}

function normalizeId(value?: string | null): string {
  return String(value || "").trim();
}

function normalizeDiscordIdDigits(value?: string | null): string {
  return normalizeId(value).replace(/\D/g, "");
}

function isDeletedEntry(key: string, member: any): boolean {
  if (key.startsWith("__deleted_")) return true;
  if (member && typeof member === "object" && member.deleted === true) return true;
  return false;
}

function extractArchivedLogins(adminMembersBlobs: Record<string, MemberData>): Set<string> {
  const archived = new Set<string>();
  for (const [key, member] of Object.entries(adminMembersBlobs)) {
    if (key.startsWith("__deleted_")) {
      const login = normalizeLogin(key.replace("__deleted_", ""));
      if (login) archived.add(login);
      continue;
    }
    const asAny = member as any;
    if (asAny?.deleted === true) {
      const login = normalizeLogin(member?.twitchLogin);
      if (login) archived.add(login);
    }
  }
  return archived;
}

function isUsefulMember(member: MemberData): boolean {
  const login = normalizeLogin(member.twitchLogin);
  if (!login) return false;
  if (login.startsWith("discord_")) return false;
  if (login.startsWith("nouveau_")) return false;
  return true;
}

function toDate(value: any): Date | null {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function chooseByPriority(a: MemberData, b: MemberData, sourceA: CandidateSource, sourceB: CandidateSource): MemberData {
  // Règle explicite: admin > bot, puis updatedAt le plus récent.
  if (sourceA !== sourceB) {
    return sourceA === "admin" ? a : b;
  }
  const aUpdated = toDate((a as any).updatedAt)?.getTime() || 0;
  const bUpdated = toDate((b as any).updatedAt)?.getTime() || 0;
  return aUpdated >= bUpdated ? a : b;
}

function mergeRoleHistory(existing: any[] | undefined, incoming: any[] | undefined): any[] {
  const combined = [...(existing || []), ...(incoming || [])];
  const seen = new Set<string>();
  const uniq: any[] = [];
  for (const item of combined) {
    if (!item || typeof item !== "object") continue;
    const key = [
      String(item.fromRole || ""),
      String(item.toRole || ""),
      String(item.changedAt || ""),
      String(item.changedBy || ""),
      String(item.reason || ""),
    ].join("|");
    if (seen.has(key)) continue;
    seen.add(key);
    uniq.push(item);
  }
  uniq.sort((x, y) => {
    const tx = toDate(x.changedAt)?.getTime() || 0;
    const ty = toDate(y.changedAt)?.getTime() || 0;
    return tx - ty;
  });
  return uniq;
}

function isDifferent(a: any, b: any): boolean {
  if (a === undefined && b === undefined) return false;
  if (a instanceof Date || b instanceof Date) {
    const ta = toDate(a)?.getTime() || 0;
    const tb = toDate(b)?.getTime() || 0;
    return ta !== tb;
  }
  if (Array.isArray(a) || Array.isArray(b)) {
    try {
      return JSON.stringify(a || []) !== JSON.stringify(b || []);
    } catch {
      return true;
    }
  }
  return a !== b;
}

function buildUpdatePatch(existing: MemberData, incoming: MemberData): {
  patch: Partial<MemberData>;
  fieldsToUpdate: string[];
  conflicts: string[];
} {
  const patch: Partial<MemberData> = {};
  const fieldsToUpdate: string[] = [];
  const conflicts: string[] = [];

  const scalarFields: Array<keyof MemberData> = [
    "discordId",
    "discordUsername",
    "displayName",
    "siteUsername",
    "role",
    "isVip",
    "isActive",
    "listId",
    "roleManuallySet",
    "description",
    "customBio",
    "integrationDate",
    "parrain",
    "profileValidationStatus",
    "onboardingStatus",
    "mentorTwitchLogin",
    "primaryLanguage",
    "timezone",
    "countryCode",
    "lastReviewAt",
    "nextReviewAt",
    "birthday",
    "twitchAffiliateDate",
    "shadowbanLives",
    "twitchId",
    "twitchUrl",
  ];

  const conflictSensitive: Array<keyof MemberData> = [
    "discordId",
    "twitchId",
    "displayName",
    "role",
  ];

  for (const field of scalarFields) {
    const oldValue = (existing as any)[field];
    const newValue = (incoming as any)[field];

    if (newValue === undefined || newValue === null || newValue === "") {
      continue;
    }

    if (oldValue === undefined || oldValue === null || oldValue === "") {
      (patch as any)[field] = newValue;
      fieldsToUpdate.push(String(field));
      continue;
    }

    if (conflictSensitive.includes(field) && isDifferent(oldValue, newValue)) {
      conflicts.push(`${String(field)}: "${String(oldValue)}" -> "${String(newValue)}"`);
      continue;
    }
  }

  if (incoming.badges && Array.isArray(incoming.badges) && incoming.badges.length > 0) {
    const mergedBadges = Array.from(new Set([...(existing.badges || []), ...incoming.badges]));
    if (isDifferent(existing.badges || [], mergedBadges)) {
      patch.badges = mergedBadges;
      fieldsToUpdate.push("badges");
    }
  }

  const mergedHistory = mergeRoleHistory(existing.roleHistory, incoming.roleHistory);
  if (mergedHistory.length > (existing.roleHistory || []).length) {
    patch.roleHistory = mergedHistory;
    fieldsToUpdate.push("roleHistory");
  }

  if (incoming.twitchStatus) {
    const hydrated = hydrateTwitchStatusAvatar(existing.twitchStatus, incoming.twitchStatus?.profileImageUrl);
    if (isDifferent(existing.twitchStatus, hydrated)) {
      patch.twitchStatus = hydrated as any;
      fieldsToUpdate.push("twitchStatus");
    }
  }

  // Préserve l'ancien createdAt si déjà présent.
  const existingCreatedAt = toDate(existing.createdAt);
  const incomingCreatedAt = toDate(incoming.createdAt);
  if (!existingCreatedAt && incomingCreatedAt) {
    patch.createdAt = incomingCreatedAt;
    fieldsToUpdate.push("createdAt");
  }

  return { patch, fieldsToUpdate, conflicts };
}

async function loadMembersFromStore(storeName: string, key: string): Promise<Record<string, MemberData>> {
  try {
    const store = getBlobStore(storeName);
    const data = await store.get(key, { type: "text" });
    if (!data) return {};
    const parsed = JSON.parse(data);
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as Record<string, MemberData>;
  } catch (error) {
    console.error(`[Migration Members] Erreur chargement ${storeName}/${key}:`, error);
    return {};
  }
}

async function saveMembersToStore(
  storeName: string,
  key: string,
  payload: Record<string, MemberData>
): Promise<void> {
  const store = getBlobStore(storeName);
  await store.set(key, JSON.stringify(payload, null, 2));
}

async function fetchAllSupabaseMembers(): Promise<MemberData[]> {
  const out: MemberData[] = [];
  for (let page = 0; page < SUPABASE_MAX_PAGES; page++) {
    const chunk = await memberRepository.findAll(SUPABASE_PAGE_SIZE, page * SUPABASE_PAGE_SIZE);
    if (!Array.isArray(chunk) || chunk.length === 0) break;
    out.push(...chunk);
    if (chunk.length < SUPABASE_PAGE_SIZE) break;
  }
  return out;
}

function buildCandidates(
  adminMembersBlobs: Record<string, MemberData>,
  botMembersBlobs: Record<string, MemberData>,
  source: MigrationSource,
  selectedLogins?: string[]
): { candidates: Candidate[]; dedup: MigrationReport["dedup"]; rawCount: number; selectedCount: number } {
  const raw: Array<{ source: CandidateSource; key: string; member: MemberData }> = [];

  if (source === "admin" || source === "merged") {
    for (const [key, member] of Object.entries(adminMembersBlobs)) {
      if (isDeletedEntry(key, member)) continue;
      raw.push({ source: "admin", key, member });
    }
  }
  if (source === "bot" || source === "merged") {
    for (const [key, member] of Object.entries(botMembersBlobs)) {
      if (isDeletedEntry(key, member)) continue;
      raw.push({ source: "bot", key, member });
    }
  }

  const selectedSet =
    selectedLogins && selectedLogins.length > 0
      ? new Set(selectedLogins.map((v) => normalizeLogin(v)).filter(Boolean))
      : null;

  const filtered = raw.filter((entry) => {
    if (!entry.member || !isUsefulMember(entry.member)) return false;
    const login = normalizeLogin(entry.member.twitchLogin);
    if (!selectedSet) return true;
    return selectedSet.has(login);
  });

  const byStable = new Map<string, Candidate>();
  const dedup: MigrationReport["dedup"] = [];

  const stableKeyFor = (m: MemberData) => {
    const discord = normalizeDiscordIdDigits(m.discordId);
    const twitchId = normalizeId(m.twitchId);
    const login = normalizeLogin(m.twitchLogin);
    if (discord) return `discord:${discord}`;
    if (twitchId) return `twitchId:${twitchId}`;
    return `login:${login}`;
  };

  for (const entry of filtered) {
    const stableKey = stableKeyFor(entry.member);
    const login = normalizeLogin(entry.member.twitchLogin);
    const existing = byStable.get(stableKey);
    if (!existing) {
      byStable.set(stableKey, {
        key: stableKey,
        sourceOfTruth: entry.source,
        sourcePresence: [entry.source],
        member: entry.member,
        aliases: [login],
      });
      continue;
    }

    const chosen = chooseByPriority(existing.member, entry.member, existing.sourceOfTruth, entry.source);
    const chosenSource: CandidateSource =
      chosen === existing.member ? existing.sourceOfTruth : entry.source;
    const aliases = Array.from(new Set([...existing.aliases, login]));
    const sourcePresence = Array.from(new Set([...existing.sourcePresence, entry.source])) as CandidateSource[];

    const droppedLogins =
      chosen === existing.member ? [login] : existing.aliases.filter((x) => x !== login);
    if (droppedLogins.length > 0) {
      dedup.push({
        stableKey,
        keptLogin: normalizeLogin(chosen.twitchLogin),
        droppedLogins,
      });
    }

    byStable.set(stableKey, {
      key: stableKey,
      sourceOfTruth: chosenSource,
      sourcePresence,
      member: chosen,
      aliases,
    });
  }

  return {
    candidates: Array.from(byStable.values()),
    dedup,
    rawCount: raw.length,
    selectedCount: filtered.length,
  };
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireRole("FONDATEUR");
    if (!admin) {
      return NextResponse.json({ error: "Réservé aux fondateurs" }, { status: 403 });
    }

    const body = await request.json();
    const source: MigrationSource = body?.source === "admin" || body?.source === "bot" ? body.source : "merged";
    const selectedLogins: string[] | undefined = Array.isArray(body?.selectedLogins)
      ? body.selectedLogins.filter((v: unknown): v is string => typeof v === "string")
      : undefined;
    const dryRun = body?.dryRun !== false;
    const includeCreates = body?.includeCreates !== false;
    const includeUpdates = body?.includeUpdates !== false;
    const archiveSkippedCreates = body?.archiveSkippedCreates === true;
    const archiveReasonRaw = typeof body?.archiveReason === "string" ? body.archiveReason.trim() : "";
    const archiveReason = archiveReasonRaw ? archiveReasonRaw.slice(0, 500) : "";

    const [adminMembersBlobs, botMembersBlobs] = await Promise.all([
      loadMembersFromStore(ADMIN_BLOB_STORE, ADMIN_BLOB_KEY),
      loadMembersFromStore(BOT_BLOB_STORE, BOT_BLOB_KEY),
    ]);
    const archivedLogins = extractArchivedLogins(adminMembersBlobs);

    const { candidates, dedup, rawCount, selectedCount } = buildCandidates(
      adminMembersBlobs,
      botMembersBlobs,
      source,
      selectedLogins
    );
    const candidatesAfterArchiveFilter = candidates.filter((c) => {
      const login = normalizeLogin(c.member.twitchLogin);
      return !archivedLogins.has(login);
    });

    const supabaseMembers = await fetchAllSupabaseMembers();
    const byLogin = new Map<string, MemberData>();
    const byDiscord = new Map<string, MemberData>();
    const byTwitchId = new Map<string, MemberData>();
    for (const row of supabaseMembers) {
      const login = normalizeLogin(row.twitchLogin);
      const discord = normalizeDiscordIdDigits(row.discordId);
      const twitchId = normalizeId(row.twitchId);
      if (login) byLogin.set(login, row);
      if (discord) byDiscord.set(discord, row);
      if (twitchId) byTwitchId.set(twitchId, row);
    }

    const twitchLogins = Array.from(
      new Set(candidatesAfterArchiveFilter.map((candidate) => normalizeLogin(candidate.member.twitchLogin)).filter(Boolean))
    );
    let avatarMap = new Map<string, string>();
    try {
      const twitchUsers = await getTwitchUsers(twitchLogins);
      avatarMap = buildTwitchAvatarMap(twitchUsers);
    } catch (avatarError) {
      console.warn("[Migration Members] Impossible de précharger les avatars Twitch:", avatarError);
    }

    const plans: ActionPlan[] = [];
    const errors: string[] = [];

    for (const candidate of candidatesAfterArchiveFilter) {
      const incoming = candidate.member;
      const incomingLogin = normalizeLogin(incoming.twitchLogin);
      const incomingDiscord = normalizeDiscordIdDigits(incoming.discordId);
      const incomingTwitchId = normalizeId(incoming.twitchId);

      const existing =
        byLogin.get(incomingLogin) ||
        (incomingDiscord ? byDiscord.get(incomingDiscord) : undefined) ||
        (incomingTwitchId ? byTwitchId.get(incomingTwitchId) : undefined);

      if (!existing) {
        plans.push({
          action: "create",
          candidate,
          targetLogin: incomingLogin,
        });
        continue;
      }

      const { patch, fieldsToUpdate, conflicts } = buildUpdatePatch(existing, incoming);
      if (fieldsToUpdate.length === 0) {
        plans.push({
          action: "skip",
          candidate,
          targetLogin: normalizeLogin(existing.twitchLogin),
          reason: conflicts.length > 0 ? "Conflits détectés (aucun champ appliqué)" : "Déjà synchronisé",
          conflicts,
          existing,
        });
        continue;
      }

      plans.push({
        action: "update",
        candidate,
        targetLogin: normalizeLogin(existing.twitchLogin),
        fieldsToUpdate,
        conflicts,
        patch,
        existing,
      });
    }

    const report: MigrationReport = {
      dryRun,
      source,
      totals: {
        fromBlobs: rawCount,
        afterSelection: selectedCount,
        candidatesAfterDedup: candidatesAfterArchiveFilter.length,
        dedupCollapsed: Math.max(0, selectedCount - candidatesAfterArchiveFilter.length),
        actionsCreate: plans.filter((p) => p.action === "create").length,
        actionsUpdate: plans.filter((p) => p.action === "update").length,
        actionsSkip: plans.filter((p) => p.action === "skip").length,
        appliedCreate: 0,
        appliedUpdate: 0,
        appliedSkip: 0,
        appliedArchived: 0,
        errors: 0,
        conflicts: plans.reduce((acc, p) => acc + (p.conflicts?.length || 0), 0),
        excludedByArchive: archivedLogins.size,
      },
      dedup,
      actionsPreview: plans.slice(0, 300).map((p) => ({
        action: p.action,
        login: p.targetLogin,
        source: p.candidate.sourceOfTruth,
        fieldsToUpdate: p.fieldsToUpdate,
        conflicts: p.conflicts,
        reason: p.reason,
      })),
      errors,
    };

    if (!dryRun) {
      for (const plan of plans) {
        try {
          const incoming = plan.candidate.member;
          if (plan.action === "create") {
            if (!includeCreates) {
              report.totals.appliedSkip += 1;
              if (archiveSkippedCreates) {
                const login = normalizeLogin(incoming.twitchLogin);
                if (login) {
                  (adminMembersBlobs as any)[`__deleted_${login}`] = {
                    twitchLogin: login,
                    twitchUrl: incoming.twitchUrl || `https://www.twitch.tv/${login}`,
                    displayName: incoming.displayName || login,
                    role: incoming.role || "Affilié",
                    isVip: false,
                    isActive: false,
                    deleted: true,
                    updatedAt: new Date().toISOString(),
                    updatedBy: admin.discordId,
                    deletionReason: archiveReason || "Migration: création explicitement refusée",
                  } as any;
                  report.totals.appliedArchived += 1;
                }
              }
              continue;
            }
            const login = normalizeLogin(incoming.twitchLogin);
            const fetchedAvatar = avatarMap.get(login);
            await memberRepository.create({
              twitchLogin: login,
              twitchId: incoming.twitchId,
              twitchUrl: incoming.twitchUrl || `https://www.twitch.tv/${login}`,
              discordId: incoming.discordId,
              discordUsername: incoming.discordUsername,
              displayName: incoming.displayName || login,
              siteUsername: incoming.siteUsername,
              role: incoming.role || "Affilié",
              isVip: incoming.isVip ?? false,
              isActive: incoming.isActive !== false,
              badges: incoming.badges || [],
              listId: incoming.listId,
              roleManuallySet: incoming.roleManuallySet,
              description: incoming.description,
              customBio: incoming.customBio,
              integrationDate: incoming.integrationDate,
              roleHistory: incoming.roleHistory || [],
              parrain: incoming.parrain,
              onboardingStatus: incoming.onboardingStatus,
              mentorTwitchLogin: incoming.mentorTwitchLogin,
              primaryLanguage: incoming.primaryLanguage,
              timezone: incoming.timezone,
              countryCode: incoming.countryCode,
              lastReviewAt: incoming.lastReviewAt,
              nextReviewAt: incoming.nextReviewAt,
              birthday: incoming.birthday,
              twitchAffiliateDate: incoming.twitchAffiliateDate,
              shadowbanLives: incoming.shadowbanLives,
              twitchStatus: hydrateTwitchStatusAvatar(incoming.twitchStatus, fetchedAvatar) as any,
              profileValidationStatus: incoming.profileValidationStatus || "valide",
              createdAt: incoming.createdAt ? new Date(incoming.createdAt as any) : new Date(),
              updatedAt: new Date(),
              updatedBy: admin.discordId,
            });
            report.totals.appliedCreate += 1;
            continue;
          }

          if (plan.action === "update" && plan.patch && plan.existing) {
            if (!includeUpdates) {
              report.totals.appliedSkip += 1;
              continue;
            }
            await memberRepository.update(normalizeLogin(plan.existing.twitchLogin), {
              ...plan.patch,
              updatedAt: new Date(),
              updatedBy: admin.discordId,
            });
            report.totals.appliedUpdate += 1;
            continue;
          }

          report.totals.appliedSkip += 1;
        } catch (error) {
          report.totals.errors += 1;
          const login = plan.targetLogin || normalizeLogin(plan.candidate.member.twitchLogin);
          const errMsg = `Erreur migration ${login}: ${error instanceof Error ? error.message : String(error)}`;
          errors.push(errMsg);
          console.error("[Migration Members]", errMsg);
        }
      }

      if (archiveSkippedCreates && report.totals.appliedArchived > 0) {
        await saveMembersToStore(ADMIN_BLOB_STORE, ADMIN_BLOB_KEY, adminMembersBlobs);
      }

      await invalidateAdminDashboardCache();
    } else {
      report.totals.appliedSkip = plans.length;
    }

    const migrated = dryRun ? 0 : report.totals.appliedCreate + report.totals.appliedUpdate;
    const skipped = dryRun ? report.totals.actionsSkip : report.totals.appliedSkip;

    return NextResponse.json({
      success: true,
      message: dryRun
        ? `Dry-run terminé: ${report.totals.actionsCreate} création(s), ${report.totals.actionsUpdate} mise(s) à jour, ${report.totals.actionsSkip} ignoré(s)`
        : `Migration terminée: ${migrated} migré(s), ${skipped} ignoré(s)`,
      summary: {
        totalInBlobs: report.totals.afterSelection,
        migrated,
        skipped,
        errors: report.totals.errors,
      },
      report,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("[Migration Members] Erreur migration:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la migration",
      },
      { status: 500 }
    );
  }
}

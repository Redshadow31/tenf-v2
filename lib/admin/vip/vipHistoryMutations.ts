import {
  addVipEntry,
  getVipHistoryByMonth,
  loadVipHistory,
  removeVipEntry,
} from "@/lib/vipHistory";
import { readVipMonthLogins } from "@/lib/vipMonthStore";
import { vipRepository } from "@/lib/repositories";

function mergeMonthMaps(
  ...maps: Array<Record<string, string[]>>
): Record<string, string[]> {
  const merged: Record<string, string[]> = {};
  for (const map of maps) {
    for (const [month, logins] of Object.entries(map)) {
      if (!merged[month]) merged[month] = [];
      for (const login of logins) {
        const normalized = login.toLowerCase();
        if (!merged[month].includes(normalized)) {
          merged[month].push(normalized);
        }
      }
    }
  }
  for (const month of Object.keys(merged)) {
    merged[month].sort((a, b) => a.localeCompare(b));
  }
  return merged;
}

/** Union fichier JSON + Supabase + snapshots blob (mois connus). */
export async function getMergedVipHistoryByMonth(
  extraMonths?: string[]
): Promise<Record<string, string[]>> {
  const fromFile = getVipHistoryByMonth();
  let fromDb: Record<string, string[]> = {};
  try {
    fromDb = await vipRepository.findAllGroupedByMonth();
  } catch (error) {
    console.error("[vipHistoryMutations] Supabase grouped load failed:", error);
  }

  const monthKeys = new Set([
    ...Object.keys(fromFile),
    ...Object.keys(fromDb),
    ...(extraMonths || []),
  ]);

  const fromBlob: Record<string, string[]> = {};
  await Promise.all(
    Array.from(monthKeys).map(async (month) => {
      const logins = await readVipMonthLogins(month);
      if (logins.length > 0) fromBlob[month] = logins;
    })
  );

  return mergeMonthMaps(fromFile, fromDb, fromBlob);
}

/** Mois VIP d'un membre (union JSON + Supabase). */
export async function getMemberVipMonths(twitchLogin: string): Promise<string[]> {
  const login = twitchLogin.toLowerCase();
  const fromFile = loadVipHistory()
    .filter((entry) => entry.login.toLowerCase() === login)
    .map((entry) => entry.month);

  let fromDb: string[] = [];
  try {
    fromDb = await vipRepository.findMonthsByMember(login);
  } catch (error) {
    console.error("[vipHistoryMutations] Supabase member months failed:", error);
  }

  return Array.from(new Set([...fromFile, ...fromDb])).sort((a, b) => b.localeCompare(a));
}

export async function addMemberVipMonth(
  twitchLogin: string,
  month: string,
  displayName?: string
): Promise<void> {
  if (!month.match(/^\d{4}-\d{2}$/)) {
    throw new Error("Format de mois invalide (attendu: YYYY-MM)");
  }

  addVipEntry(twitchLogin, month);

  try {
    await vipRepository.ensureMemberMonth(month, twitchLogin, displayName);
  } catch (error) {
    console.error(`[vipHistoryMutations] Sync Supabase add ${twitchLogin}@${month}:`, error);
  }
}

export async function removeMemberVipMonth(twitchLogin: string, month: string): Promise<void> {
  if (!month.match(/^\d{4}-\d{2}$/)) {
    throw new Error("Format de mois invalide (attendu: YYYY-MM)");
  }

  removeVipEntry(twitchLogin, month);

  try {
    await vipRepository.deleteByMemberAndMonth(month, twitchLogin);
  } catch (error) {
    console.error(`[vipHistoryMutations] Sync Supabase remove ${twitchLogin}@${month}:`, error);
  }
}

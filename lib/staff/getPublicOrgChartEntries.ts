import { staffOrgChartRepository } from "@/lib/repositories";
import type { OrgChartEntry } from "@/lib/staff/orgChartTypes";
import { getTwitchUsers } from "@/lib/twitch";
import { buildTwitchAvatarMap, extractUniqueTwitchLogins, resolveMemberAvatar } from "@/lib/memberAvatar";

const TWITCH_LOOKUP_TIMEOUT_MS = 7000;

async function enrichEntriesWithAvatars(entries: OrgChartEntry[]): Promise<OrgChartEntry[]> {
  if (entries.length === 0) return entries;

  const twitchLogins = extractUniqueTwitchLogins(entries.map((entry) => ({ twitchLogin: entry.member.twitchLogin })));
  if (twitchLogins.length === 0) {
    return entries.map((entry) => ({
      ...entry,
      member: {
        ...entry.member,
        avatarUrl: resolveMemberAvatar({ displayName: entry.member.displayName, twitchLogin: entry.member.twitchLogin }),
      },
    }));
  }

  const twitchUsers = await Promise.race([
    getTwitchUsers(twitchLogins),
    new Promise<Awaited<ReturnType<typeof getTwitchUsers>>>((resolve) => setTimeout(() => resolve([]), TWITCH_LOOKUP_TIMEOUT_MS)),
  ]).catch(() => []);

  const avatarMap = buildTwitchAvatarMap(twitchUsers);

  return entries.map((entry) => {
    const login = String(entry.member.twitchLogin || "").toLowerCase();
    const fetchedAvatar = login ? avatarMap.get(login) : undefined;
    const avatarUrl = resolveMemberAvatar(
      {
        displayName: entry.member.displayName,
        twitchLogin: entry.member.twitchLogin,
        twitchStatus: { profileImageUrl: entry.member.avatarUrl },
      },
      fetchedAvatar
    );

    return {
      ...entry,
      member: {
        ...entry.member,
        avatarUrl,
      },
    };
  });
}

export async function getPublicOrgChartEntries(): Promise<OrgChartEntry[]> {
  try {
    const entries = await staffOrgChartRepository.listPublic();
    return await enrichEntriesWithAvatars(entries);
  } catch (error) {
    console.error("[getPublicOrgChartEntries] Erreur:", error);
    return [];
  }
}

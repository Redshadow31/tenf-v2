import {
  findMemberByIdentifier,
  getAllMemberData,
  getArchivedMemberEntries,
  loadMemberDataFromStorage,
} from "@/lib/memberData";
import { memberRepository } from "@/lib/repositories";

function memberMatches(member: any, value: string): boolean {
  const normalized = String(value).toLowerCase();
  return (
    normalized === String(member.twitchLogin || "").toLowerCase() ||
    normalized === String(member.discordId || "").toLowerCase() ||
    normalized === String(member.displayName || "").toLowerCase() ||
    normalized === String(member.siteUsername || "").toLowerCase() ||
    normalized === String(member.twitchId || "").toLowerCase()
  );
}

/** Résout un membre depuis l'identifiant URL fiche (discordId, twitch login, etc.). */
export async function resolveMemberForFiche(decodedId: string): Promise<any | null> {
  const id = decodedId.trim();
  const idLower = id.toLowerCase();

  if (/^\d{17,20}$/.test(id)) {
    const byDiscord = await memberRepository.findByDiscordId(id);
    if (byDiscord) return byDiscord;
    const byTwitchId = await memberRepository.findByTwitchId(id);
    if (byTwitchId) return byTwitchId;
  }

  const byLogin = await memberRepository.findByTwitchLogin(idLower);
  if (byLogin) return byLogin;

  await loadMemberDataFromStorage();

  let member =
    findMemberByIdentifier({ twitchLogin: id }) ||
    findMemberByIdentifier({ discordId: id }) ||
    (/^\d+$/.test(id) ? findMemberByIdentifier({ twitchId: id }) : null);

  if (!member) {
    const allMembers = getAllMemberData();
    member =
      allMembers.find(
        (m) =>
          m.displayName?.toLowerCase() === idLower ||
          m.siteUsername?.toLowerCase() === idLower
      ) || null;
  }

  if (!member) {
    const archived = await getArchivedMemberEntries();
    const archivedEntry = archived.find((entry) => memberMatches(entry.snapshot, idLower));
    if (archivedEntry) {
      member = {
        ...archivedEntry.snapshot,
        archived: true,
        archivedAt: archivedEntry.deletedAt,
        archivedBy: archivedEntry.deletedBy,
        archiveReason: archivedEntry.deleteReason,
      };
    }
  }

  return member;
}

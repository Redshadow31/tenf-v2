// Fonctions pour synchroniser les membres Discord avec les données locales

import { allMembers } from "./members";
import { MemberData, getAllMemberData, updateMemberData } from "./memberData";

/**
 * Trouve un membre local par son pseudo Discord
 */
export function findMemberByDiscordUsername(discordUsername: string) {
  return allMembers.find(
    (member) => member.discordUsername.toLowerCase() === discordUsername.toLowerCase()
  );
}

/**
 * Trouve un membre local par son ID Discord
 */
export function findMemberByDiscordId(discordId: string) {
  const allMemberData = getAllMemberData();
  return allMemberData.find((member) => member.discordId === discordId);
}

/**
 * Lie un membre Discord à un membre local (par Twitch login)
 */
export function linkDiscordToLocal(
  discordId: string,
  discordUsername: string,
  twitchLogin: string,
  updatedBy: string
): boolean {
  const memberData = getAllMemberData().find((m) => m.twitchLogin === twitchLogin);
  if (!memberData) {
    return false;
  }

  updateMemberData(
    twitchLogin,
    {
      discordId,
      discordUsername,
    },
    updatedBy
  );

  return true;
}

/**
 * Synchronise les données Discord avec les données locales
 */
export function syncDiscordWithLocal(
  discordMembers: Array<{
    discordId: string;
    discordUsername: string;
    discordNickname?: string;
    roles: string[];
    avatar: string;
  }>
): {
  linked: number;
  unlinked: number;
  errors: string[];
} {
  const localMembers = allMembers;
  let linked = 0;
  let unlinked = 0;
  const errors: string[] = [];

  for (const discordMember of discordMembers) {
    // Chercher un membre local correspondant
    const localMember = findMemberByDiscordUsername(discordMember.discordUsername);
    
    if (localMember) {
      // Mettre à jour les données avec l'ID Discord
      const memberData = getAllMemberData().find((m) => m.twitchLogin === localMember.twitchLogin);
      if (memberData) {
        try {
          updateMemberData(
            localMember.twitchLogin,
            {
              discordId: discordMember.discordId,
              discordUsername: discordMember.discordUsername,
            },
            "system"
          );
          linked++;
        } catch (error) {
          errors.push(`Erreur pour ${discordMember.discordUsername}: ${error}`);
        }
      }
    } else {
      unlinked++;
    }
  }

  return { linked, unlinked, errors };
}










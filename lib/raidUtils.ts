// Utilitaires pour la gestion des raids
import { getAllMemberData, loadMemberDataFromStorage, MemberData } from '@/lib/memberData';

/**
 * Extrait tous les IDs Discord d'un message au format <@ID> ou <@!ID>
 * @param message Le contenu du message Discord
 * @returns Tableau des IDs Discord trouvés (sans les chevrons)
 */
export function extractDiscordIds(message: string): string[] {
  if (!message || typeof message !== 'string') {
    return [];
  }
  
  // Pattern pour <@ID> ou <@!ID> (mention Discord)
  const mentionPattern = /<@!?(\d+)>/g;
  const ids: string[] = [];
  let match;
  
  while ((match = mentionPattern.exec(message)) !== null) {
    const discordId = match[1];
    if (discordId && !ids.includes(discordId)) {
      ids.push(discordId);
    }
  }
  
  return ids;
}

/**
 * Trouve un membre par son Discord ID dans la base fusionnée (admin + bot)
 * @param discordId L'ID Discord du membre
 * @returns Le membre trouvé ou null
 */
export async function findMemberByDiscordId(discordId: string): Promise<MemberData | null> {
  if (!discordId || discordId.trim().length === 0) {
    return null;
  }
  
  // Charger les données des membres (fusionnées)
  await loadMemberDataFromStorage();
  const allMembers = getAllMemberData();
  
  // Chercher le membre par Discord ID
  const member = allMembers.find(m => m.discordId === discordId);
  
  return member || null;
}

/**
 * Trouve plusieurs membres par leurs Discord IDs
 * @param discordIds Tableau des IDs Discord
 * @returns Map des membres trouvés (discordId -> MemberData)
 */
export async function findMembersByDiscordIds(discordIds: string[]): Promise<Map<string, MemberData>> {
  const membersMap = new Map<string, MemberData>();
  
  if (!discordIds || discordIds.length === 0) {
    return membersMap;
  }
  
  // Charger les données des membres (fusionnées)
  await loadMemberDataFromStorage();
  const allMembers = getAllMemberData();
  
  // Créer un index par Discord ID
  const membersByDiscordId = new Map<string, MemberData>();
  allMembers.forEach(member => {
    if (member.discordId) {
      membersByDiscordId.set(member.discordId, member);
    }
  });
  
  // Récupérer les membres correspondants
  for (const discordId of discordIds) {
    const member = membersByDiscordId.get(discordId);
    if (member) {
      membersMap.set(discordId, member);
    }
  }
  
  return membersMap;
}


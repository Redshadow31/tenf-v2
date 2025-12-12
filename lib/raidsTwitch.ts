// Fonctions utilitaires pour gérer les raids Twitch EventSub

import { addRaidFait, getCurrentMonthKey, getMonthKey } from './raidStorage';
import { loadMemberDataFromStorage, getAllMemberData } from './memberData';

export interface TwitchRaidEvent {
  from_broadcaster_user_id: string;
  from_broadcaster_user_login: string;
  from_broadcaster_user_name: string;
  to_broadcaster_user_id: string;
  to_broadcaster_user_login: string;
  to_broadcaster_user_name: string;
  viewers: number;
}

/**
 * Trouve un membre par son Twitch ID ou login
 */
function findMemberByTwitchIdOrLogin(
  twitchId: string,
  twitchLogin: string,
  allMembers: any[]
): any | null {
  // Chercher d'abord par Twitch ID (si disponible)
  if (twitchId) {
    const memberById = allMembers.find(m => 
      m.twitchId === twitchId
    );
    if (memberById) {
      return memberById;
    }
  }
  
  // Sinon chercher par login
  if (twitchLogin) {
    const memberByLogin = allMembers.find(m => 
      m.twitchLogin?.toLowerCase() === twitchLogin.toLowerCase()
    );
    if (memberByLogin) {
      return memberByLogin;
    }
  }
  
  return null;
}

/**
 * Sauvegarde un raid Twitch dans les fichiers mensuels
 * Respecte la priorité MANUAL > BOT
 */
export async function saveTwitchRaid(event: TwitchRaidEvent): Promise<void> {
  try {
    // Charger les membres pour mapper les Twitch IDs/logins
    await loadMemberDataFromStorage();
    const allMembers = getAllMemberData();

    // Trouver les membres correspondants
    const raiderMember = findMemberByTwitchIdOrLogin(
      event.from_broadcaster_user_id,
      event.from_broadcaster_user_login,
      allMembers
    );
    
    const targetMember = findMemberByTwitchIdOrLogin(
      event.to_broadcaster_user_id,
      event.to_broadcaster_user_login,
      allMembers
    );

    // Utiliser le twitchLogin du membre si trouvé, sinon le login de l'event
    const raider = raiderMember?.twitchLogin?.toLowerCase() || event.from_broadcaster_user_login.toLowerCase();
    const target = targetMember?.twitchLogin?.toLowerCase() || event.to_broadcaster_user_login.toLowerCase();

    // Déterminer le mois actuel
    const now = new Date();
    const monthKey = getCurrentMonthKey();

    console.log(`[Twitch Raid] Enregistrement: ${raider} → ${target} (${event.viewers} viewers) - ${monthKey}`);

    // Ajouter le raid avec source "twitch-live"
    await addRaidFait(
      monthKey,
      raider,
      target,
      now.toISOString(),
      false, // manual = false (c'est automatique depuis Twitch)
      undefined, // pas de messageId pour Twitch
      "twitch-live", // source
      event.viewers // nombre de viewers
    );

    console.log(`[Twitch Raid] ✅ Raid enregistré avec succès`);
  } catch (error) {
    console.error(`[Twitch Raid] ❌ Erreur lors de l'enregistrement:`, error);
    throw error;
  }
}


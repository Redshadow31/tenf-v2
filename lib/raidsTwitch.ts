// Fonctions utilitaires pour gérer les raids Twitch EventSub

import { addRaidFait, getCurrentMonthKey, getMonthKey } from './raidStorage';
import { loadMemberDataFromStorage, getAllMemberData } from './memberData';
import { cacheTwitchId, getCachedTwitchId } from './twitchIdCache';
import { getTwitchUserIdByLogin } from './twitchHelpers';

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

    // Mettre en cache les IDs Twitch si nécessaire
    const monthKey = getCurrentMonthKey();
    
    // Vérifier le cache pour le raider
    let cachedRaiderId = await getCachedTwitchId(event.from_broadcaster_user_login, monthKey);
    if (!cachedRaiderId && event.from_broadcaster_user_id) {
      await cacheTwitchId(event.from_broadcaster_user_login, event.from_broadcaster_user_id, monthKey);
      cachedRaiderId = event.from_broadcaster_user_id;
    }
    
    // Vérifier le cache pour la cible
    let cachedTargetId = await getCachedTwitchId(event.to_broadcaster_user_login, monthKey);
    if (!cachedTargetId && event.to_broadcaster_user_id) {
      await cacheTwitchId(event.to_broadcaster_user_login, event.to_broadcaster_user_id, monthKey);
      cachedTargetId = event.to_broadcaster_user_id;
    }

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

    // Ajouter le raid avec source "bot" (automatique depuis Twitch EventSub)
    await addRaidFait(
      monthKey,
      raider,
      target,
      now.toISOString(),
      false, // manual = false (c'est automatique depuis Twitch)
      undefined, // pas de messageId pour Twitch
      "bot", // source = bot (automatique)
      event.viewers // nombre de viewers
    );

    console.log(`[Twitch Raid] ✅ Raid enregistré avec succès`);
  } catch (error) {
    console.error(`[Twitch Raid] ❌ Erreur lors de l'enregistrement:`, error);
    throw error;
  }
}


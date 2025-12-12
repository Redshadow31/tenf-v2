// Fonctions utilitaires pour gérer les raids Twitch EventSub

import { addRaidFait, getCurrentMonthKey, getMonthKey } from './raidStorage';
import { loadMemberDataFromStorage, getAllMemberData, updateMemberData } from './memberData';
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
 * PRIORITÉ: twitch_user_id > twitch_username
 */
function findMemberByTwitchIdOrLogin(
  twitchId: string,
  twitchLogin: string,
  allMembers: any[]
): any | null {
  // PRIORITÉ 1: Chercher par Twitch ID (MANDATORY pour EventSub)
  if (twitchId) {
    const memberById = allMembers.find(m => 
      m.isActive && m.twitchId === twitchId
    );
    if (memberById) {
      console.log(`[Twitch Raid] ✅ Membre trouvé par ID: ${twitchId} -> ${memberById.twitchLogin}`);
      return memberById;
    }
  }
  
  // FALLBACK: Chercher par login (si ID non trouvé ou non fourni)
  if (twitchLogin) {
    const memberByLogin = allMembers.find(m => 
      m.isActive && m.twitchLogin?.toLowerCase() === twitchLogin.toLowerCase()
    );
    if (memberByLogin) {
      console.log(`[Twitch Raid] ⚠️ Membre trouvé par login (ID manquant): ${twitchLogin}`);
      return memberByLogin;
    }
  }
  
  console.log(`[Twitch Raid] ❌ Aucun membre trouvé pour ID: ${twitchId}, Login: ${twitchLogin}`);
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

    // Trouver les membres correspondants - PRIORISER twitch_user_id
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

    // Mettre à jour les twitchId des membres si manquants
    if (raiderMember && event.from_broadcaster_user_id && !raiderMember.twitchId) {
      console.log(`[Twitch Raid] Mise à jour twitchId pour ${raiderMember.twitchLogin}: ${event.from_broadcaster_user_id}`);
      try {
        await updateMemberData(raiderMember.twitchLogin, { twitchId: event.from_broadcaster_user_id }, 'system');
        raiderMember.twitchId = event.from_broadcaster_user_id;
      } catch (error) {
        console.error(`[Twitch Raid] Erreur mise à jour twitchId pour ${raiderMember.twitchLogin}:`, error);
      }
    }

    if (targetMember && event.to_broadcaster_user_id && !targetMember.twitchId) {
      console.log(`[Twitch Raid] Mise à jour twitchId pour ${targetMember.twitchLogin}: ${event.to_broadcaster_user_id}`);
      try {
        await updateMemberData(targetMember.twitchLogin, { twitchId: event.to_broadcaster_user_id }, 'system');
        targetMember.twitchId = event.to_broadcaster_user_id;
      } catch (error) {
        console.error(`[Twitch Raid] Erreur mise à jour twitchId pour ${targetMember.twitchLogin}:`, error);
      }
    }

    // Utiliser le twitchLogin du membre si trouvé, sinon le login de l'event
    const raider = raiderMember?.twitchLogin?.toLowerCase() || event.from_broadcaster_user_login.toLowerCase();
    const target = targetMember?.twitchLogin?.toLowerCase() || event.to_broadcaster_user_login.toLowerCase();

    // monthKey est déjà défini plus haut, pas besoin de le redéfinir
    const now = new Date();

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


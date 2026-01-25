// Helper pour résoudre et cacher les IDs Twitch depuis les logins
// Utilise l'endpoint Helix GET /helix/users?login={username}
// Cache automatiquement dans memberData (twitch_login -> twitch_user_id)

import { getTwitchUserIdByLogin, getTwitchUserIdsByLogins } from './twitchHelpers';
import { getAllMemberData, updateMemberData, loadMemberDataFromStorage } from './memberData';

/**
 * Résout un ID Twitch depuis un login et le cache dans memberData
 * @param twitchLogin - Le login Twitch (ex: "nexou31")
 * @param forceRefresh - Si true, force la résolution même si déjà en cache
 * @returns L'ID Twitch résolu ou null
 */
export async function resolveAndCacheTwitchId(
  twitchLogin: string,
  forceRefresh: boolean = false
): Promise<string | null> {
  if (!twitchLogin || typeof twitchLogin !== 'string' || twitchLogin.trim() === '') {
    console.warn('[Twitch ID Resolver] Login invalide:', twitchLogin);
    return null;
  }

  // Charger les données membres
  await loadMemberDataFromStorage();
  const allMembers = getAllMemberData();
  
  // Chercher le membre dans les Blobs
  let member = allMembers.find(m => 
    m.twitchLogin?.toLowerCase() === twitchLogin.toLowerCase().trim()
  );

  // Si pas trouvé dans les Blobs, chercher dans Supabase
  if (!member) {
    try {
      const { MemberRepository } = await import('@/lib/repositories/MemberRepository');
      const memberRepo = new MemberRepository();
      const supabaseMember = await memberRepo.findByTwitchLogin(twitchLogin);
      
      if (supabaseMember) {
        // Convertir le membre Supabase en format MemberData
        member = {
          twitchLogin: supabaseMember.twitchLogin,
          twitchId: supabaseMember.twitchId,
          twitchUrl: supabaseMember.twitchUrl || `https://twitch.tv/${supabaseMember.twitchLogin}`,
          discordId: supabaseMember.discordId,
          discordUsername: supabaseMember.discordUsername,
          displayName: supabaseMember.displayName,
          role: supabaseMember.role,
          isVip: supabaseMember.isVip || false,
          isActive: supabaseMember.isActive !== false,
          badges: supabaseMember.badges,
          createdAt: supabaseMember.createdAt,
          updatedAt: supabaseMember.updatedAt,
        };
        console.log(`[Twitch ID Resolver] Membre trouvé dans Supabase: ${twitchLogin}`);
      }
    } catch (error) {
      console.error(`[Twitch ID Resolver] Erreur lors de la recherche dans Supabase pour ${twitchLogin}:`, error);
    }
  }

  if (!member) {
    console.warn(`[Twitch ID Resolver] Membre non trouvé pour login: ${twitchLogin}`);
    return null;
  }

  // Si déjà en cache et pas de force refresh
  if (!forceRefresh && member.twitchId) {
    console.log(`[Twitch ID Resolver] ✅ ID déjà en cache pour ${twitchLogin}: ${member.twitchId}`);
    return member.twitchId;
  }

  // Résoudre l'ID via Helix API
  console.log(`[Twitch ID Resolver] 🔍 Résolution de l'ID pour ${twitchLogin} via Helix API...`);
  const twitchId = await getTwitchUserIdByLogin(twitchLogin);

  if (!twitchId) {
    console.warn(`[Twitch ID Resolver] ⚠️ Impossible de résoudre l'ID pour ${twitchLogin}`);
    return null;
  }

  // Sauvegarder dans memberData
  try {
    await updateMemberData(twitchLogin, { twitchId }, 'system');
    console.log(`[Twitch ID Resolver] ✅ ID résolu et mis en cache: ${twitchLogin} -> ${twitchId}`);
    return twitchId;
  } catch (error) {
    console.error(`[Twitch ID Resolver] ❌ Erreur lors de la sauvegarde de l'ID pour ${twitchLogin}:`, error);
    // Retourner quand même l'ID résolu même si la sauvegarde échoue
    return twitchId;
  }
}

/**
 * Résout les IDs Twitch pour plusieurs logins en batch et les cache dans memberData
 * @param twitchLogins - Tableau de logins Twitch
 * @param forceRefresh - Si true, force la résolution même si déjà en cache
 * @returns Map<login, userId> des IDs résolus
 */
export async function resolveAndCacheTwitchIds(
  twitchLogins: string[],
  forceRefresh: boolean = false
): Promise<Map<string, string>> {
  const result = new Map<string, string>();

  if (!twitchLogins || twitchLogins.length === 0) {
    return result;
  }

  // Charger les données membres
  await loadMemberDataFromStorage();
  const allMembers = getAllMemberData();

  // Filtrer les logins qui ont besoin d'être résolus
  const loginsToResolve: string[] = [];
  const memberMap = new Map<string, typeof allMembers[0]>();

  for (const login of twitchLogins) {
    if (!login || typeof login !== 'string' || login.trim() === '') {
      continue;
    }

    const normalizedLogin = login.toLowerCase().trim();
    const member = allMembers.find(m => 
      m.twitchLogin?.toLowerCase() === normalizedLogin
    );

    if (!member) {
      console.warn(`[Twitch ID Resolver] Membre non trouvé pour login: ${login}`);
      continue;
    }

    memberMap.set(normalizedLogin, member);

    // Si déjà en cache et pas de force refresh
    if (!forceRefresh && member.twitchId) {
      result.set(normalizedLogin, member.twitchId);
      console.log(`[Twitch ID Resolver] ✅ ID déjà en cache pour ${login}: ${member.twitchId}`);
    } else {
      loginsToResolve.push(login);
    }
  }

  if (loginsToResolve.length === 0) {
    return result;
  }

  // Résoudre les IDs en batch via Helix API
  console.log(`[Twitch ID Resolver] 🔍 Résolution batch de ${loginsToResolve.length} IDs via Helix API...`);
  const resolvedIds = await getTwitchUserIdsByLogins(loginsToResolve);

  // Sauvegarder les IDs résolus dans memberData
  let savedCount = 0;
  for (const [login, twitchId] of resolvedIds.entries()) {
    const normalizedLogin = login.toLowerCase();
    const member = memberMap.get(normalizedLogin);

    if (!member) {
      continue;
    }

    result.set(normalizedLogin, twitchId);

    // Sauvegarder dans memberData
    try {
      await updateMemberData(member.twitchLogin, { twitchId }, 'system');
      savedCount++;
    } catch (error) {
      console.error(`[Twitch ID Resolver] ❌ Erreur sauvegarde ID pour ${login}:`, error);
    }
  }

  console.log(`[Twitch ID Resolver] ✅ ${savedCount} IDs résolus et mis en cache`);
  
  return result;
}

/**
 * Récupère l'ID Twitch depuis le cache (memberData) sans appel API
 * @param twitchLogin - Le login Twitch
 * @returns L'ID Twitch en cache ou null
 */
export function getCachedTwitchId(twitchLogin: string): string | null {
  if (!twitchLogin || typeof twitchLogin !== 'string' || twitchLogin.trim() === '') {
    return null;
  }

  const allMembers = getAllMemberData();
  const member = allMembers.find(m => 
    m.twitchLogin?.toLowerCase() === twitchLogin.toLowerCase().trim()
  );

  return member?.twitchId || null;
}


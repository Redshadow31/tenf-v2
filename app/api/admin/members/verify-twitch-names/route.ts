import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/adminAuth';
import { hasPermission } from '@/lib/adminRoles';
import { loadMemberDataFromStorage, getAllMemberData, updateMemberData, findMemberByIdentifier } from '@/lib/memberData';
import { getTwitchLoginsByIds } from '@/lib/twitchHelpers';

/**
 * GET - Récupère la liste des membres avec un ID Twitch pour vérification
 */
export async function GET() {
  try {
    const admin = await getCurrentAdmin();

    if (!admin) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    // Vérifier les permissions : write pour modifier
    if (!hasPermission(admin.id, "write")) {
      return NextResponse.json(
        { error: "Accès refusé. Permissions insuffisantes." },
        { status: 403 }
      );
    }

    // Charger les données depuis le stockage persistant
    await loadMemberDataFromStorage();
    const allMembers = getAllMemberData();

    // Filtrer les membres qui ont un ID Twitch (candidats pour vérification)
    const membersWithTwitchId = allMembers
      .filter(member => member.twitchId && member.twitchId.trim() !== '')
      .map(member => ({
        twitchLogin: member.twitchLogin,
        twitchId: member.twitchId,
        discordId: member.discordId,
        displayName: member.displayName,
        isActive: member.isActive,
      }));

    return NextResponse.json({
      members: membersWithTwitchId,
      count: membersWithTwitchId.length,
    });
  } catch (error) {
    console.error('Error fetching members for verification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST - Vérifie et met à jour les noms de chaînes Twitch via leurs IDs
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await getCurrentAdmin();

    if (!admin) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    // Vérifier les permissions : write pour modifier
    if (!hasPermission(admin.id, "write")) {
      return NextResponse.json(
        { error: "Accès refusé. Permissions insuffisantes." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { memberIds } = body; // Array de { twitchId, discordId } ou { twitchLogin }

    if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
      return NextResponse.json(
        { error: "memberIds est requis et doit être un tableau non vide" },
        { status: 400 }
      );
    }

    // Charger les données depuis le stockage persistant
    await loadMemberDataFromStorage();
    const allMembers = getAllMemberData();

    // Collecter tous les IDs Twitch à vérifier
    const twitchIdsToCheck: string[] = [];
    const memberMap = new Map<string, typeof allMembers[0]>(); // twitchId -> member

    for (const identifier of memberIds) {
      let member: typeof allMembers[0] | null = null;

      if (identifier.twitchId) {
        // Chercher par ID Twitch
        member = allMembers.find(m => m.twitchId === identifier.twitchId) || null;
      } else if (identifier.discordId) {
        // Chercher par Discord ID
        member = findMemberByIdentifier({ discordId: identifier.discordId });
      } else if (identifier.twitchLogin) {
        // Chercher par login Twitch (fallback)
        member = allMembers.find(m => 
          m.twitchLogin?.toLowerCase() === identifier.twitchLogin?.toLowerCase()
        ) || null;
      }

      if (member && member.twitchId) {
        twitchIdsToCheck.push(member.twitchId);
        memberMap.set(member.twitchId, member);
      }
    }

    if (twitchIdsToCheck.length === 0) {
      return NextResponse.json(
        { error: "Aucun membre avec ID Twitch trouvé pour vérification" },
        { status: 400 }
      );
    }

    // Récupérer les logins actuels depuis l'API Twitch
    console.log(`[Verify Twitch Names] Vérification de ${twitchIdsToCheck.length} IDs Twitch...`);
    const loginMap = await getTwitchLoginsByIds(twitchIdsToCheck);

    const results: Array<{
      twitchId: string;
      oldLogin: string;
      newLogin: string | null;
      updated: boolean;
      error?: string;
    }> = [];

    // Comparer et mettre à jour si nécessaire
    for (const twitchId of twitchIdsToCheck) {
      const member = memberMap.get(twitchId);
      if (!member) continue;

      const oldLogin = member.twitchLogin?.toLowerCase() || '';
      const newLogin = loginMap.get(twitchId)?.toLowerCase() || null;

      if (!newLogin) {
        results.push({
          twitchId,
          oldLogin,
          newLogin: null,
          updated: false,
          error: 'Login non trouvé via API Twitch',
        });
        continue;
      }

      if (oldLogin === newLogin) {
        // Pas de changement
        results.push({
          twitchId,
          oldLogin,
          newLogin,
          updated: false,
        });
        continue;
      }

      // Le login a changé, mettre à jour
      try {
        // Identifier le membre de manière stable (utiliser discordId ou twitchId)
        const memberIdentifier = member.discordId
          ? { discordId: member.discordId, twitchId: member.twitchId, twitchLogin: member.twitchLogin }
          : member.twitchId
          ? { twitchId: member.twitchId, twitchLogin: member.twitchLogin }
          : member.twitchLogin;

        await updateMemberData(memberIdentifier, {
          twitchLogin: newLogin,
          twitchUrl: `https://www.twitch.tv/${newLogin}`,
        }, admin.id);

        results.push({
          twitchId,
          oldLogin,
          newLogin,
          updated: true,
        });

        console.log(`[Verify Twitch Names] ✅ ${oldLogin} → ${newLogin} (ID: ${twitchId})`);
      } catch (error) {
        console.error(`[Verify Twitch Names] ❌ Erreur lors de la mise à jour de ${oldLogin}:`, error);
        results.push({
          twitchId,
          oldLogin,
          newLogin,
          updated: false,
          error: error instanceof Error ? error.message : 'Erreur inconnue',
        });
      }
    }

    const updatedCount = results.filter(r => r.updated).length;
    const unchangedCount = results.filter(r => !r.updated && !r.error).length;
    const errorCount = results.filter(r => r.error).length;

    return NextResponse.json({
      success: true,
      results,
      summary: {
        total: results.length,
        updated: updatedCount,
        unchanged: unchangedCount,
        errors: errorCount,
      },
    });
  } catch (error) {
    console.error('Error verifying Twitch names:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}


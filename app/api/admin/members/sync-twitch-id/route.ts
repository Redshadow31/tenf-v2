// API endpoint pour synchroniser les IDs Twitch pour les membres
// Peut synchroniser un membre spécifique ou tous les membres actifs

import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/requireAdmin';
import { loadMemberDataFromStorage, getAllMemberData, updateMemberData } from '@/lib/memberData';
import { resolveAndCacheTwitchId } from '@/lib/twitchIdResolver';

/**
 * POST - Synchronise les IDs Twitch
 * Body: { twitchLogin?: string } - si twitchLogin fourni, sync seulement ce membre, sinon sync tous
 */
export async function POST(request: NextRequest) {
  try {
    // Authentification NextAuth + permission write
    const admin = await requirePermission("write");
    
    if (!admin) {
      return NextResponse.json(
        { error: 'Non authentifié ou permissions insuffisantes' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { twitchLogin } = body;

    await loadMemberDataFromStorage();
    const allMembers = getAllMemberData();

    let membersToSync: typeof allMembers = [];
    
    if (twitchLogin) {
      // Synchroniser un seul membre
      const member = allMembers.find(m => 
        m.twitchLogin?.toLowerCase() === twitchLogin.toLowerCase()
      );
      if (!member) {
        return NextResponse.json(
          { error: `Membre non trouvé: ${twitchLogin}` },
          { status: 404 }
        );
      }
      membersToSync = [member];
    } else {
      // Synchroniser tous les membres actifs avec twitchLogin mais sans twitchId
      membersToSync = allMembers.filter(m => 
        m.isActive && 
        m.twitchLogin && 
        m.twitchLogin.trim() !== '' &&
        !m.twitchId
      );
    }

    if (membersToSync.length === 0) {
      return NextResponse.json({
        success: true,
        message: twitchLogin 
          ? `Le membre ${twitchLogin} a déjà un ID Twitch` 
          : 'Aucun membre à synchroniser (tous ont déjà un ID Twitch)',
        synced: 0,
        updated: [],
      });
    }

    const results: Array<{
      twitchLogin: string;
      success: boolean;
      twitchId?: string;
      error?: string;
    }> = [];

    let successCount = 0;

    for (const member of membersToSync) {
      if (!member.twitchLogin) continue;

      try {
        console.log(`[Sync Twitch ID] Résolution ID pour ${member.twitchLogin}...`);
        const twitchId = await resolveAndCacheTwitchId(member.twitchLogin, false);

        if (twitchId) {
          // Mettre à jour le membre avec l'ID résolu
          await updateMemberData(member.twitchLogin, { twitchId }, admin.discordId);
          results.push({
            twitchLogin: member.twitchLogin,
            success: true,
            twitchId,
          });
          successCount++;
          console.log(`[Sync Twitch ID] ✅ ${member.twitchLogin} -> ${twitchId}`);
        } else {
          results.push({
            twitchLogin: member.twitchLogin,
            success: false,
            error: 'ID Twitch non trouvé via API',
          });
          console.warn(`[Sync Twitch ID] ⚠️ Impossible de résoudre l'ID pour ${member.twitchLogin}`);
        }
      } catch (error) {
        results.push({
          twitchLogin: member.twitchLogin,
          success: false,
          error: error instanceof Error ? error.message : 'Erreur inconnue',
        });
        console.error(`[Sync Twitch ID] ❌ Erreur pour ${member.twitchLogin}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      message: `${successCount} membre(s) mis à jour avec succès`,
      synced: successCount,
      total: membersToSync.length,
      results,
    });
  } catch (error) {
    console.error('[Sync Twitch ID] Erreur générale:', error);
    return NextResponse.json(
      { 
        error: 'Erreur lors de la synchronisation',
        details: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    );
  }
}

/**
 * GET - Vérifie le statut des IDs Twitch pour tous les membres
 */
export async function GET(request: NextRequest) {
  try {
    // Authentification NextAuth + permission read
    const admin = await requirePermission("read");
    
    if (!admin) {
      return NextResponse.json(
        { error: 'Non authentifié ou permissions insuffisantes' },
        { status: 401 }
      );
    }

    await loadMemberDataFromStorage();
    const allMembers = getAllMemberData();

    const membersWithTwitch = allMembers.filter(m => 
      m.isActive && m.twitchLogin && m.twitchLogin.trim() !== ''
    );

    const stats = {
      total: membersWithTwitch.length,
      withId: membersWithTwitch.filter(m => m.twitchId).length,
      withoutId: membersWithTwitch.filter(m => !m.twitchId).length,
    };

    const membersWithoutId = membersWithTwitch
      .filter(m => !m.twitchId)
      .map(m => ({
        twitchLogin: m.twitchLogin,
        displayName: m.displayName,
      }));

    return NextResponse.json({
      stats,
      membersWithoutId,
    });
  } catch (error) {
    console.error('[Sync Twitch ID] Erreur vérification:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la vérification' },
      { status: 500 }
    );
  }
}


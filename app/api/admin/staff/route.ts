import { NextRequest, NextResponse } from 'next/server';
import { getAdminRoleFromCache, getAllAdminIdsFromCache, loadAdminAccessCache } from '@/lib/adminAccessCache';
import { requireAdmin } from '@/lib/requireAdmin';
import { getAdminRole } from '@/lib/adminRoles';
import { getAllMemberData, loadMemberDataFromStorage } from '@/lib/memberData';

export const dynamic = 'force-dynamic';

/**
 * GET - Récupère la liste des membres du staff (admins, modos) pour sélection
 */
export async function GET(request: NextRequest) {
  try {
    // Authentification NextAuth + rôle admin requis
    const admin = await requireAdmin();
    
    if (!admin) {
      return NextResponse.json({ error: 'Non authentifié ou accès refusé' }, { status: 401 });
    }

    await loadMemberDataFromStorage();
    await loadAdminAccessCache();
    const allMembers = getAllMemberData();
    const adminIdSet = new Set(getAllAdminIdsFromCache());

    // Filtrer les membres qui ont un accès admin (fondateurs + liste Gestion des accès)
    const staffMembers = allMembers
      .filter(member => {
        if (!member.discordId) return false;
        return adminIdSet.has(member.discordId);
      })
      .map(member => {
        const role = getAdminRole(member.discordId!) ?? getAdminRoleFromCache(member.discordId!) ?? 'MODERATEUR_EN_FORMATION';
        return {
          discordId: member.discordId,
          discordUsername: member.discordUsername || '',
          displayName: member.displayName || member.twitchLogin,
          twitchLogin: member.twitchLogin,
          role,
        };
      })
      .sort((a, b) => {
        // Trier par rôle (FONDATEUR > ADMIN_COORDINATEUR > MODERATEUR > MODERATEUR_EN_FORMATION > MODERATEUR_EN_PAUSE > SOUTIEN_TENF)
        const roleOrder: Record<string, number> = {
          'FONDATEUR': 0,
          'ADMIN_COORDINATEUR': 1,
          'MODERATEUR': 2,
          'MODERATEUR_EN_FORMATION': 3,
          'MODERATEUR_EN_PAUSE': 4,
          'SOUTIEN_TENF': 5,
        };
        return (roleOrder[a.role] || 99) - (roleOrder[b.role] || 99);
      });

    return NextResponse.json({ staff: staffMembers });
  } catch (error) {
    console.error('[Admin Staff API] Erreur:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}


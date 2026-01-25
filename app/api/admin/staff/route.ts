import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/requireAdmin';
import { getAllAdminIds, getAdminRole } from '@/lib/adminRoles';
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
    const allMembers = getAllMemberData();
    const allAdminIds = getAllAdminIds();

    // Filtrer les membres qui sont dans le staff (admins, modos)
    const staffMembers = allMembers
      .filter(member => {
        if (!member.discordId) return false;
        return allAdminIds.includes(member.discordId);
      })
      .map(member => {
        const role = getAdminRole(member.discordId!);
        return {
          discordId: member.discordId,
          discordUsername: member.discordUsername || '',
          displayName: member.displayName || member.twitchLogin,
          twitchLogin: member.twitchLogin,
          role: role || 'MODO_JUNIOR',
        };
      })
      .sort((a, b) => {
        // Trier par rôle (FOUNDER > ADMIN_ADJOINT > MODO_MENTOR > MODO_JUNIOR)
        const roleOrder: Record<string, number> = {
          'FOUNDER': 0,
          'ADMIN_ADJOINT': 1,
          'MODO_MENTOR': 2,
          'MODO_JUNIOR': 3,
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


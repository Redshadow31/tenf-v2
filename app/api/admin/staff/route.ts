import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/requireAdmin';
import { getAllMemberData, loadMemberDataFromStorage } from '@/lib/memberData';
import { ADMIN_ROLE_HIERARCHY } from '@/lib/adminRoles';
import {
  getDiscordIdsWithStaffModerationAccess,
  resolveAdminRoleForDiscord,
} from '@/lib/staff/staffModerationRecipients';

const STAFF_ROLE_SORT_ORDER = Object.fromEntries(
  Object.entries(ADMIN_ROLE_HIERARCHY).map(([role, level]) => [role, -level]),
) as Record<string, number>;

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
    const staffAccessIds = new Set(await getDiscordIdsWithStaffModerationAccess());

    const fromMembers = allMembers
      .filter((member) => member.discordId && staffAccessIds.has(member.discordId))
      .map((member) => {
        const role = resolveAdminRoleForDiscord(member.discordId!) ?? 'MODERATEUR_ACCOMPAGNEMENT';
        return {
          discordId: member.discordId!,
          discordUsername: member.discordUsername || '',
          displayName: member.displayName || member.twitchLogin,
          twitchLogin: member.twitchLogin,
          role,
        };
      });

    const seen = new Set(fromMembers.map((s) => s.discordId));
    const withoutMemberRow: typeof fromMembers = [];
    for (const discordId of staffAccessIds) {
      if (seen.has(discordId)) continue;
      const role = resolveAdminRoleForDiscord(discordId) ?? 'MODERATEUR_ACCOMPAGNEMENT';
      withoutMemberRow.push({
        discordId,
        discordUsername: '',
        displayName: `Admin (hors liste membres · …${discordId.slice(-4)})`,
        twitchLogin: '',
        role,
      });
    }

    const staffMembers = [...fromMembers, ...withoutMemberRow].sort(
      (a, b) => (STAFF_ROLE_SORT_ORDER[a.role] ?? 99) - (STAFF_ROLE_SORT_ORDER[b.role] ?? 99),
    );

    return NextResponse.json({ staff: staffMembers });
  } catch (error) {
    console.error('[Admin Staff API] Erreur:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}


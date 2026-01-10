import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/adminAuth';
import { hasPermission } from '@/lib/adminRoles';
import { getCurrentMonthKey } from '@/lib/evaluationStorage';
import { getDiscordEngagementData } from '@/lib/discordEngagementStorage';
import { getAllMemberData, loadMemberDataFromStorage } from '@/lib/memberData';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Récupère les points Discord (note finale) depuis la page B/discord
 * Retourne un objet { twitchLogin: noteFinale } pour chaque membre
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin || !hasPermission(admin.id, "read")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const monthParam = searchParams.get('month');
    const monthKey = monthParam || getCurrentMonthKey();

    // Charger les membres pour la conversion Discord ID -> Twitch Login
    await loadMemberDataFromStorage();
    const allMembers = getAllMemberData();
    const discordIdToTwitchLogin = new Map<string, string>();
    allMembers.forEach((m: any) => {
      if (m.discordId && m.twitchLogin) {
        discordIdToTwitchLogin.set(m.discordId, m.twitchLogin);
      }
    });

    // Charger les données d'engagement Discord depuis le storage
    const engagementData = await getDiscordEngagementData(monthKey);
    
    if (!engagementData || !engagementData.dataByMember) {
      return NextResponse.json({ success: true, points: {}, month: monthKey });
    }

    // Convertir les notes finales de Discord ID vers Twitch Login
    const pointsMap: Record<string, number> = {};
    
    Object.entries(engagementData.dataByMember).forEach(([discordId, engagement]: [string, any]) => {
      const twitchLogin = discordIdToTwitchLogin.get(discordId);
      if (twitchLogin && engagement && typeof engagement.noteFinale === 'number') {
        pointsMap[twitchLogin.toLowerCase()] = engagement.noteFinale;
      }
    });

    return NextResponse.json({ success: true, points: pointsMap, month: monthKey });
  } catch (error) {
    console.error('[API Evaluations Discord Points GET] Erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}


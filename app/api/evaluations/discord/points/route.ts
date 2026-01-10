import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/adminAuth';
import { hasPermission } from '@/lib/adminRoles';
import { getCurrentMonthKey } from '@/lib/evaluationStorage';
import { getDiscordEngagementData } from '@/lib/discordEngagementStorage';
import { getAllMemberData, loadMemberDataFromStorage } from '@/lib/memberData';
import { calculateNoteEcrit, calculateNoteVocal, calculateNoteFinale } from '@/lib/discordEngagement';

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
    
    // Valider le format du mois (YYYY-MM)
    let monthKey: string;
    if (monthParam) {
      if (!monthParam.match(/^\d{4}-\d{2}$/)) {
        return NextResponse.json({ error: "Format de mois invalide (attendu: YYYY-MM)" }, { status: 400 });
      }
      monthKey = monthParam;
    } else {
      monthKey = getCurrentMonthKey();
    }

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
    // Si noteFinale existe dans le storage, on l'utilise, sinon on la calcule
    const pointsMap: Record<string, number> = {};
    
    Object.entries(engagementData.dataByMember).forEach(([discordId, engagement]: [string, any]) => {
      const twitchLogin = discordIdToTwitchLogin.get(discordId);
      if (twitchLogin && engagement) {
        let noteFinale: number;
        
        // Si noteFinale existe déjà dans le storage, l'utiliser
        if (typeof engagement.noteFinale === 'number' && !isNaN(engagement.noteFinale)) {
          noteFinale = engagement.noteFinale;
        } else {
          // Sinon, calculer la note finale à partir de nbMessages et nbVocalMinutes
          const nbMessages = engagement.nbMessages || 0;
          const nbVocalMinutes = engagement.nbVocalMinutes || 0;
          const noteEcrit = calculateNoteEcrit(nbMessages);
          const noteVocal = calculateNoteVocal(nbVocalMinutes);
          noteFinale = calculateNoteFinale(noteEcrit, noteVocal);
        }
        
        pointsMap[twitchLogin.toLowerCase()] = noteFinale;
      }
    });

    return NextResponse.json({ success: true, points: pointsMap, month: monthKey });
  } catch (error) {
    console.error('[API Evaluations Discord Points GET] Erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}


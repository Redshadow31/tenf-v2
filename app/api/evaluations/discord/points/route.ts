import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/requireAdmin';
import { getCurrentMonthKey } from '@/lib/evaluationStorage';
import { memberRepository, evaluationRepository } from '@/lib/repositories';
import { calculateNoteEcrit, calculateNoteVocal, calculateNoteFinale } from '@/lib/discordEngagement';
import { getDiscordEngagementData } from '@/lib/discordEngagementStorage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Récupère les points Discord (note finale) depuis la page B/discord
 * Retourne un objet { twitchLogin: noteFinale } pour chaque membre
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await requirePermission("read");
    if (!admin) {
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

    // Charger les membres depuis Supabase pour la conversion Discord ID -> Twitch Login
    // Récupérer tous les membres (limite élevée pour conversion Discord ID)
    const allMembers = await memberRepository.findAll(1000, 0);
    const discordIdToTwitchLogin = new Map<string, string>();
    allMembers.forEach((m) => {
      if (m.discordId && m.twitchLogin) {
        discordIdToTwitchLogin.set(m.discordId, m.twitchLogin);
      }
    });

    // PRIORITÉ 1: Charger depuis Netlify Blobs (discordEngagementStorage)
    // C'est la source de vérité car c'est là que les données sont importées
    const engagementData = await getDiscordEngagementData(monthKey);
    
    const pointsMap: Record<string, number> = {};
    
    if (engagementData && engagementData.dataByMember) {
      // Parcourir les données depuis Netlify Blobs
      Object.entries(engagementData.dataByMember).forEach(([discordId, engagement]) => {
        const twitchLogin = discordIdToTwitchLogin.get(discordId);
        if (twitchLogin) {
          const nbMessages = engagement.nbMessages || 0;
          const nbVocalMinutes = engagement.nbVocalMinutes || 0;
          const noteEcrit = calculateNoteEcrit(nbMessages);
          const noteVocal = calculateNoteVocal(nbVocalMinutes);
          const noteFinale = calculateNoteFinale(noteEcrit, noteVocal);
          
          pointsMap[twitchLogin.toLowerCase()] = noteFinale;
        }
      });
    }
    
    // PRIORITÉ 2: Compléter avec les données depuis Supabase (si pas dans Blobs)
    // Cela permet de récupérer les données qui auraient été migrées
    const evaluations = await evaluationRepository.findByMonth(monthKey);
    
    evaluations.forEach((evaluation) => {
      if (evaluation.discordEngagement && evaluation.twitchLogin) {
        const login = evaluation.twitchLogin.toLowerCase();
        
        // Ne pas écraser si on a déjà une valeur depuis Blobs
        if (pointsMap[login] !== undefined) {
          return;
        }
        
        const engagement = evaluation.discordEngagement;
        let noteFinale: number;
        
        // Si noteFinale existe déjà dans discordEngagement, l'utiliser
        if (typeof engagement.total === 'number' && !isNaN(engagement.total)) {
          noteFinale = engagement.total;
        } else if (typeof engagement.noteFinale === 'number' && !isNaN(engagement.noteFinale)) {
          noteFinale = engagement.noteFinale;
        } else {
          // Sinon, calculer la note finale à partir de messages et vocal
          const nbMessages = engagement.messages || 0;
          const nbVocalMinutes = engagement.vocals || 0;
          const noteEcrit = calculateNoteEcrit(nbMessages);
          const noteVocal = calculateNoteVocal(nbVocalMinutes);
          noteFinale = calculateNoteFinale(noteEcrit, noteVocal);
        }
        
        pointsMap[login] = noteFinale;
      }
    });

    return NextResponse.json({ success: true, points: pointsMap, month: monthKey });
  } catch (error) {
    console.error('[API Evaluations Discord Points GET] Erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}


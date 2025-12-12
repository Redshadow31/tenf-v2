import { NextRequest, NextResponse } from 'next/server';
import { loadMonthlyRaids, getMonthKey } from '@/lib/raids';
import { loadMemberDataFromStorage, getAllMemberData } from '@/lib/memberData';

/**
 * GET - Récupère les détails des raids d'un membre (avec dates)
 * Query params: ?member=twitchLogin&month=YYYY-MM
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const memberTwitchLogin = searchParams.get('member');
    const monthParam = searchParams.get('month');
    
    if (!memberTwitchLogin) {
      return NextResponse.json(
        { error: "member est requis" },
        { status: 400 }
      );
    }
    
    // Déterminer le monthKey
    let monthKey: string | undefined;
    if (monthParam) {
      const monthMatch = monthParam.match(/^(\d{4})-(\d{2})$/);
      if (monthMatch) {
        const year = parseInt(monthMatch[1]);
        const month = parseInt(monthMatch[2]);
        if (month >= 1 && month <= 12) {
          monthKey = getMonthKey(year, month);
        }
      }
    }
    
    // Charger les membres pour la conversion
    await loadMemberDataFromStorage();
    const allMembers = getAllMemberData();
    
    // Trouver le membre par Twitch login
    const member = allMembers.find(m => m.twitchLogin.toLowerCase() === memberTwitchLogin.toLowerCase());
    
    if (!member || !member.discordId) {
      return NextResponse.json(
        { error: `Membre non trouvé: ${memberTwitchLogin}` },
        { status: 404 }
      );
    }
    
    // Charger les raids
    const raidsByDiscordId = await loadMonthlyRaids(monthKey);
    console.log(`[Raid Details] Recherche pour Discord ID: ${member.discordId}, monthKey: ${monthKey || 'mois en cours'}`);
    console.log(`[Raid Details] Nombre total de membres avec raids: ${Object.keys(raidsByDiscordId).length}`);
    
    const memberRaids = raidsByDiscordId[member.discordId];
    
    if (!memberRaids) {
      console.log(`[Raid Details] Aucun raid trouvé pour ${member.twitchLogin} (${member.discordId})`);
      return NextResponse.json({
        details: {
          raids: [],
          receivedRaids: [],
        },
      });
    }
    
    // S'assurer que les tableaux existent (pour compatibilité)
    const raids = memberRaids.raids || [];
    const receivedRaids = memberRaids.receivedRaids || [];
    
    // Détecter si les données sont anciennes (compteurs > 0 mais tableaux vides)
    const hasLegacyData = (memberRaids.done > 0 && raids.length === 0) || 
                          (memberRaids.received > 0 && receivedRaids.length === 0);
    
    console.log(`[Raid Details] Raids trouvés pour ${member.twitchLogin}: ${raids.length} faits, ${receivedRaids.length} reçus`);
    console.log(`[Raid Details] Stats brutes: done=${memberRaids.done}, received=${memberRaids.received}`);
    if (hasLegacyData) {
      console.warn(`[Raid Details] ⚠️ Données anciennes détectées: compteurs > 0 mais tableaux vides`);
    }
    
    // Créer un map Discord ID -> Twitch Login pour la conversion
    const discordIdToTwitchLogin = new Map<string, string>();
    allMembers.forEach(m => {
      if (m.discordId && m.twitchLogin) {
        discordIdToTwitchLogin.set(m.discordId, m.twitchLogin.toLowerCase());
      }
    });
    
    // Les raids sont déjà corrects (contiennent les Discord IDs)
    // Les receivedRaids aussi
    
    return NextResponse.json({
      details: {
        raids,
        receivedRaids,
        discordIdToTwitchLogin: Object.fromEntries(discordIdToTwitchLogin),
        hasLegacyData, // Indiquer si les données sont anciennes
      },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des détails:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}


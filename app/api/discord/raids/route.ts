import { NextRequest, NextResponse } from 'next/server';
import { recordRaid } from '@/lib/raids';
import { loadMemberDataFromStorage, getAllMemberData } from '@/lib/memberData';

/**
 * POST - Enregistre un raid depuis le bot Discord
 * Le bot Discord appelle cette route quand il détecte un message "@user1 a raid @user2"
 * 
 * Body:
 * {
 *   raiderDiscordId: string,
 *   targetDiscordId: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { raiderDiscordId, targetDiscordId } = body;
    
    if (!raiderDiscordId || !targetDiscordId) {
      return NextResponse.json(
        { error: "raiderDiscordId et targetDiscordId sont requis" },
        { status: 400 }
      );
    }
    
    // Charger les données des membres
    await loadMemberDataFromStorage();
    const allMembers = getAllMemberData();
    
    // Trouver les membres par Discord ID
    const raider = allMembers.find(m => m.discordId === raiderDiscordId);
    const target = allMembers.find(m => m.discordId === targetDiscordId);
    
    if (!raider) {
      return NextResponse.json(
        { error: `Membre non trouvé pour Discord ID: ${raiderDiscordId}` },
        { status: 404 }
      );
    }
    
    if (!target) {
      return NextResponse.json(
        { error: `Membre non trouvé pour Discord ID: ${targetDiscordId}` },
        { status: 404 }
      );
    }
    
    if (!raider.twitchLogin) {
      return NextResponse.json(
        { error: `Le raider ${raider.displayName} n'a pas de Twitch login` },
        { status: 400 }
      );
    }
    
    if (!target.twitchLogin) {
      return NextResponse.json(
        { error: `La cible ${target.displayName} n'a pas de Twitch login` },
        { status: 400 }
      );
    }
    
    // Enregistrer le raid
    await recordRaid(raider.twitchLogin, target.twitchLogin);
    
    return NextResponse.json({
      success: true,
      raider: {
        twitchLogin: raider.twitchLogin,
        displayName: raider.displayName,
      },
      target: {
        twitchLogin: target.twitchLogin,
        displayName: target.displayName,
      },
    });
  } catch (error) {
    console.error("Erreur lors de l'enregistrement du raid:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

/**
 * GET - Récupère les stats de raids pour le mois en cours
 */
export async function GET(request: NextRequest) {
  try {
    const { getAllRaidStats } = await import('@/lib/raids');
    const raids = await getAllRaidStats();
    
    return NextResponse.json({ raids });
  } catch (error) {
    console.error("Erreur lors de la récupération des raids:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}


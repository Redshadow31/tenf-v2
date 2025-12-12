import { NextRequest, NextResponse } from 'next/server';
import { recordRaid } from '@/lib/raids';
import { loadMemberDataFromStorage, getAllMemberData } from '@/lib/memberData';

const COORDINATION_RAID_CHANNEL_ID = "1278840270753894535";
const GUILD_ID = process.env.DISCORD_GUILD_ID || "535244857891880970";

/**
 * POST - Scanne les messages du salon coordination-raid et enregistre les raids
 * Cette route peut être appelée périodiquement ou via webhook Discord
 */
export async function POST(request: NextRequest) {
  try {
    const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
    
    if (!DISCORD_BOT_TOKEN) {
      return NextResponse.json(
        { error: 'Discord bot token not configured' },
        { status: 500 }
      );
    }

    // Charger les données des membres
    await loadMemberDataFromStorage();
    const allMembers = getAllMemberData();
    
    // Créer un index des membres par Discord ID
    const membersByDiscordId = new Map<string, any>();
    allMembers.forEach(member => {
      if (member.discordId) {
        membersByDiscordId.set(member.discordId, member);
      }
    });

    // Récupérer les messages récents du salon coordination-raid
    const messagesResponse = await fetch(
      `https://discord.com/api/v10/channels/${COORDINATION_RAID_CHANNEL_ID}/messages?limit=50`,
      {
        headers: {
          Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
        },
      }
    );

    if (!messagesResponse.ok) {
      const errorText = await messagesResponse.text();
      return NextResponse.json(
        { error: 'Failed to fetch Discord messages', details: errorText },
        { status: messagesResponse.status }
      );
    }

    const messages: any[] = await messagesResponse.json();
    
    // Pattern pour détecter "@user1 a raid @user2"
    const raidPattern = /<@(\d+)>\s+a\s+raid\s+<@(\d+)>/i;
    
    let raidsRecorded = 0;
    const errors: string[] = [];
    
    for (const message of messages) {
      const content = message.content;
      const match = content.match(raidPattern);
      
      if (match) {
        const raiderDiscordId = match[1];
        const targetDiscordId = match[2];
        
        // Trouver les membres
        const raider = membersByDiscordId.get(raiderDiscordId);
        const target = membersByDiscordId.get(targetDiscordId);
        
        if (!raider) {
          errors.push(`Raider non trouvé: ${raiderDiscordId}`);
          continue;
        }
        
        if (!target) {
          errors.push(`Cible non trouvée: ${targetDiscordId}`);
          continue;
        }
        
        if (!raider.twitchLogin) {
          errors.push(`Le raider ${raider.displayName} n'a pas de Twitch login`);
          continue;
        }
        
        if (!target.twitchLogin) {
          errors.push(`La cible ${target.displayName} n'a pas de Twitch login`);
          continue;
        }
        
        try {
          // Enregistrer le raid
          await recordRaid(raider.twitchLogin, target.twitchLogin);
          raidsRecorded++;
        } catch (error) {
          errors.push(`Erreur lors de l'enregistrement du raid: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      raidsRecorded,
      messagesScanned: messages.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Erreur lors du scan des raids:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

/**
 * GET - Scanne les messages (pour test)
 */
export async function GET() {
  return await POST(new NextRequest("http://localhost", { method: "POST" }));
}


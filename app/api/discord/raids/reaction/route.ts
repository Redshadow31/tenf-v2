import { NextRequest, NextResponse } from 'next/server';
import { validatePendingRaid, rejectPendingRaid, addPendingRaid } from '@/lib/raids';
import { loadMemberDataFromStorage, getAllMemberData } from '@/lib/memberData';

const COORDINATION_RAID_CHANNEL_ID = "1278840270753894535";
const CHECKMARK_EMOJI = "✅"; // Unicode: U+2705
const CROSS_EMOJI = "❌"; // Unicode: U+274C

/**
 * POST - Gère les réactions sur les messages de raid
 * Appelé par le bot Discord quand une réaction est ajoutée
 * 
 * Body:
 * {
 *   messageId: string,
 *   userId: string,
 *   emoji: string, // "✅" ou "❌"
 *   channelId: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messageId, userId, emoji, channelId } = body;
    
    if (!messageId || !userId || !emoji || !channelId) {
      return NextResponse.json(
        { error: "messageId, userId, emoji et channelId sont requis" },
        { status: 400 }
      );
    }
    
    // Vérifier que c'est bien le bon salon
    if (channelId !== COORDINATION_RAID_CHANNEL_ID) {
      return NextResponse.json(
        { error: "Ce salon n'est pas le salon de coordination des raids" },
        { status: 400 }
      );
    }
    
    // Vérifier que c'est une réaction valide (✔️ ou ❌)
    const normalizedEmoji = emoji.replace(/[^\u2705\u274C]/g, ''); // Garder seulement ✅ et ❌
    if (!normalizedEmoji || (normalizedEmoji !== CHECKMARK_EMOJI && normalizedEmoji !== CROSS_EMOJI)) {
      return NextResponse.json(
        { error: "Emoji invalide. Seules les réactions ✅ et ❌ sont acceptées" },
        { status: 400 }
      );
    }
    
    // Charger les raids en attente pour trouver le raid correspondant
    const { loadPendingRaids } = await import('@/lib/raids');
    const pendingRaids = await loadPendingRaids();
    const raid = pendingRaids.find(r => r.messageId === messageId);
    
    if (!raid) {
      // Si le raid n'est pas en attente, vérifier si c'est un nouveau message de raid
      // Récupérer le message depuis Discord pour vérifier son contenu
      const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
      if (!DISCORD_BOT_TOKEN) {
        return NextResponse.json(
          { error: "Discord bot token not configured" },
          { status: 500 }
        );
      }
      
      try {
        const messageResponse = await fetch(
          `https://discord.com/api/v10/channels/${channelId}/messages/${messageId}`,
          {
            headers: {
              Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
            },
          }
        );
        
        if (messageResponse.ok) {
          const message: any = await messageResponse.json();
          const content = message.content;
          
          // Déterminer le mois depuis le timestamp du message
          let monthKey: string | undefined;
          try {
            const { getMonthKey } = await import('@/lib/raids');
            const msgDate = new Date(message.timestamp);
            monthKey = getMonthKey(msgDate.getFullYear(), msgDate.getMonth() + 1);
            console.log(`[Raid Reaction] Mois déterminé depuis timestamp: ${monthKey} (${message.timestamp})`);
          } catch (error) {
            console.warn(`[Raid Reaction] Impossible de déterminer le mois depuis le timestamp: ${message.timestamp}`, error);
          }
          
          // Pattern flexible pour détecter "@Pseudo a raid @Cible" avec variations
          const raidPattern = /@([A-Za-z0-9_]+)(?:\s*\([^)]*\))?\s+a\s+raid\s+@([A-Za-z0-9_]+)(?:\s*\([^)]*\))?/i;
          const match = content.match(raidPattern);
          
          if (match) {
            const raiderName = match[1].trim();
            const targetName = match[2].trim();
            
            // Charger les membres pour obtenir les Twitch logins
            await loadMemberDataFromStorage();
            const allMembers = getAllMemberData();
            
            // Créer des index pour la recherche
            const membersByDisplayName = new Map<string, any>();
            const membersByTwitchLogin = new Map<string, any>();
            const membersByDiscordUsername = new Map<string, any>();
            
            allMembers.forEach(member => {
              if (member.displayName) {
                membersByDisplayName.set(member.displayName.toLowerCase(), member);
              }
              if (member.twitchLogin) {
                membersByTwitchLogin.set(member.twitchLogin.toLowerCase(), member);
              }
              if (member.discordUsername) {
                membersByDiscordUsername.set(member.discordUsername.toLowerCase(), member);
              }
            });
            
            /**
             * Trouve un membre par son nom
             */
            function findMemberByName(name: string): any | null {
              const normalizedName = name.toLowerCase().trim();
              
              let member = membersByDisplayName.get(normalizedName);
              if (member) return member;
              
              member = membersByTwitchLogin.get(normalizedName);
              if (member) return member;
              
              member = membersByDiscordUsername.get(normalizedName);
              if (member) return member;
              
              // Recherche partielle
              for (const [key, m] of membersByDisplayName.entries()) {
                if (key.includes(normalizedName) || normalizedName.includes(key)) {
                  return m;
                }
              }
              
              return null;
            }
            
            const raider = findMemberByName(raiderName);
            const target = findMemberByName(targetName);
            
            if (!raider || !raider.discordId) {
              return NextResponse.json(
                { error: `Raider non trouvé: ${raiderName}` },
                { status: 404 }
              );
            }
            
            if (!target || !target.discordId) {
              return NextResponse.json(
                { error: `Cible non trouvée: ${targetName}` },
                { status: 404 }
              );
            }
            
            const raiderDiscordId = raider.discordId;
            const targetDiscordId = target.discordId;
            
            // Ajouter le raid en attente avec le monthKey
            await addPendingRaid(
              messageId,
              raiderDiscordId,
              targetDiscordId,
              raider?.twitchLogin,
              target?.twitchLogin,
              monthKey
            );
            
            // Si c'est une validation immédiate (✅), valider le raid
            if (normalizedEmoji === CHECKMARK_EMOJI) {
              await validatePendingRaid(messageId);
              return NextResponse.json({
                success: true,
                action: "validated",
                raider: {
                  discordId: raiderDiscordId,
                  twitchLogin: raider?.twitchLogin,
                  displayName: raider?.displayName,
                },
                target: {
                  discordId: targetDiscordId,
                  twitchLogin: target?.twitchLogin,
                  displayName: target?.displayName,
                },
              });
            }
            
            return NextResponse.json({
              success: true,
              action: "pending",
              message: "Raid ajouté en attente de validation",
            });
          }
        }
      } catch (error) {
        console.error("Erreur lors de la récupération du message:", error);
      }
      
      return NextResponse.json(
        { error: "Message de raid non trouvé" },
        { status: 404 }
      );
    }
    
    // Traiter la réaction sur un raid en attente
    if (normalizedEmoji === CHECKMARK_EMOJI) {
      // Valider le raid
      const validated = await validatePendingRaid(messageId);
      if (validated) {
        return NextResponse.json({
          success: true,
          action: "validated",
          raider: {
            discordId: raid.raiderDiscordId,
            twitchLogin: raid.raiderTwitchLogin,
          },
          target: {
            discordId: raid.targetDiscordId,
            twitchLogin: raid.targetTwitchLogin,
          },
        });
      }
    } else if (normalizedEmoji === CROSS_EMOJI) {
      // Rejeter le raid
      const rejected = await rejectPendingRaid(messageId);
      if (rejected) {
        return NextResponse.json({
          success: true,
          action: "rejected",
          message: "Raid rejeté et retiré des statistiques",
        });
      }
    }
    
    return NextResponse.json({
      success: false,
      error: "Action non reconnue",
    });
  } catch (error) {
    console.error("Erreur lors du traitement de la réaction:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}


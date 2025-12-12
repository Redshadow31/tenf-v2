import { NextRequest, NextResponse } from 'next/server';
import { addPendingRaid, validatePendingRaid, rejectPendingRaid, loadPendingRaids } from '@/lib/raids';
import { loadMemberDataFromStorage, getAllMemberData } from '@/lib/memberData';

const COORDINATION_RAID_CHANNEL_ID = "1278840270753894535";
const CHECKMARK_EMOJI = "✅"; // Unicode: U+2705
const CROSS_EMOJI = "❌"; // Unicode: U+274C

/**
 * POST - Scanne les messages du salon coordination-raid et vérifie les réactions
 * Cette route peut être appelée périodiquement pour synchroniser les raids validés
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
    // Créer un index par displayName (insensible à la casse)
    const membersByDisplayName = new Map<string, any>();
    // Créer un index par twitchLogin (insensible à la casse)
    const membersByTwitchLogin = new Map<string, any>();
    // Créer un index par discordUsername (insensible à la casse)
    const membersByDiscordUsername = new Map<string, any>();
    
    allMembers.forEach(member => {
      if (member.discordId) {
        membersByDiscordId.set(member.discordId, member);
      }
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
     * Trouve un membre par son nom (displayName, twitchLogin, ou discordUsername)
     */
    function findMemberByName(name: string): any | null {
      const normalizedName = name.toLowerCase().trim();
      
      // Chercher par displayName
      let member = membersByDisplayName.get(normalizedName);
      if (member) return member;
      
      // Chercher par twitchLogin
      member = membersByTwitchLogin.get(normalizedName);
      if (member) return member;
      
      // Chercher par discordUsername
      member = membersByDiscordUsername.get(normalizedName);
      if (member) return member;
      
      // Recherche partielle (pour gérer les variations)
      for (const [key, m] of membersByDisplayName.entries()) {
        if (key.includes(normalizedName) || normalizedName.includes(key)) {
          return m;
        }
      }
      
      return null;
    }

    // Récupérer les messages récents du salon coordination-raid
    const messagesResponse = await fetch(
      `https://discord.com/api/v10/channels/${COORDINATION_RAID_CHANNEL_ID}/messages?limit=100`,
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
    
    // Pattern flexible pour détecter "@Pseudo a raid @Cible" avec variations
    // Accepte: "@Pseudo a raid @Cible", "@Pseudo ( NomServeur ) a raid @Cible", etc.
    // Le nom peut être suivi d'espaces, parenthèses, ou autres caractères avant "a raid"
    const raidPattern = /@([A-Za-z0-9_]+)(?:\s*\([^)]*\))?\s+a\s+raid\s+@([A-Za-z0-9_]+)(?:\s*\([^)]*\))?/i;
    
    let newRaidsAdded = 0;
    let raidsValidated = 0;
    let raidsRejected = 0;
    const errors: string[] = [];
    const pendingRaids = await loadPendingRaids();
    const processedMessageIds = new Set(pendingRaids.map(r => r.messageId));
    
    for (const message of messages) {
      const content = message.content;
      const match = content.match(raidPattern);
      
      if (match) {
        const messageId = message.id;
        const raiderName = match[1].trim();
        const targetName = match[2].trim();
        
        // Trouver les membres par leur nom
        const raider = findMemberByName(raiderName);
        const target = findMemberByName(targetName);
        
        if (!raider || !raider.discordId) {
          errors.push(`Raider non trouvé: ${raiderName} (cherché dans displayName, twitchLogin, discordUsername)`);
          continue;
        }
        
        if (!target || !target.discordId) {
          errors.push(`Cible non trouvée: ${targetName} (cherché dans displayName, twitchLogin, discordUsername)`);
          continue;
        }
        
        const raiderDiscordId = raider.discordId;
        const targetDiscordId = target.discordId;
        
        // Vérifier les réactions sur le message
        const reactions = message.reactions || [];
        let hasCheckmark = false;
        let hasCross = false;
        
        for (const reaction of reactions) {
          const emoji = reaction.emoji.name || reaction.emoji;
          if (emoji === CHECKMARK_EMOJI || emoji === "✅") {
            hasCheckmark = true;
          } else if (emoji === CROSS_EMOJI || emoji === "❌") {
            hasCross = true;
          }
        }
        
        // Si le message n'a pas encore été traité
        if (!processedMessageIds.has(messageId)) {
          // Ajouter en attente si pas de réaction
          if (!hasCheckmark && !hasCross) {
            try {
              await addPendingRaid(
                messageId,
                raiderDiscordId,
                targetDiscordId,
                raider.twitchLogin,
                target.twitchLogin
              );
              newRaidsAdded++;
            } catch (error) {
              errors.push(`Erreur lors de l'ajout du raid en attente: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
            }
          } else if (hasCheckmark) {
            // Valider immédiatement si ✅ est présent
            try {
              await addPendingRaid(
                messageId,
                raiderDiscordId,
                targetDiscordId,
                raider.twitchLogin,
                target.twitchLogin
              );
              await validatePendingRaid(messageId);
              raidsValidated++;
            } catch (error) {
              errors.push(`Erreur lors de la validation du raid: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
            }
          } else if (hasCross) {
            // Rejeter si ❌ est présent
            try {
              await addPendingRaid(
                messageId,
                raiderDiscordId,
                targetDiscordId,
                raider.twitchLogin,
                target.twitchLogin
              );
              await rejectPendingRaid(messageId);
              raidsRejected++;
            } catch (error) {
              errors.push(`Erreur lors du rejet du raid: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
            }
          }
        } else {
          // Message déjà traité, vérifier si les réactions ont changé
          const existingRaid = pendingRaids.find(r => r.messageId === messageId);
          if (existingRaid) {
            if (hasCheckmark && !hasCross) {
              // Valider si ✅ est maintenant présent
              try {
                await validatePendingRaid(messageId);
                raidsValidated++;
              } catch (error) {
                // Peut-être déjà validé
              }
            } else if (hasCross) {
              // Rejeter si ❌ est présent
              try {
                await rejectPendingRaid(messageId);
                raidsRejected++;
              } catch (error) {
                // Peut-être déjà rejeté
              }
            }
          }
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      newRaidsAdded,
      raidsValidated,
      raidsRejected,
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


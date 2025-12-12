import { NextRequest, NextResponse } from 'next/server';
import { addPendingRaid, validatePendingRaid, rejectPendingRaid, loadPendingRaids, addUnmatchedRaid, getCurrentMonthKey, getMonthKey } from '@/lib/raids';
import { loadMemberDataFromStorage, getAllMemberData } from '@/lib/memberData';

const COORDINATION_RAID_CHANNEL_ID = "1278840270753894535";
const CHECKMARK_EMOJI = "✅"; // Unicode: U+2705
const CROSS_EMOJI = "❌"; // Unicode: U+274C
const MAX_MESSAGES_TO_SCAN = 5000; // Maximum de messages à scanner (sécurité)

/**
 * POST - Scanne les messages du salon coordination-raid et vérifie les réactions
 * Cette route peut être appelée périodiquement pour synchroniser les raids validés
 * Query params: ?month=YYYY-MM (optionnel, par défaut mois en cours)
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
    
    // Récupérer le paramètre de mois depuis l'URL
    const { searchParams } = new URL(request.url);
    const monthParam = searchParams.get('month');
    let targetMonthKey: string | undefined;
    let targetYear: number | undefined;
    let targetMonth: number | undefined;
    
    if (monthParam) {
      const monthMatch = monthParam.match(/^(\d{4})-(\d{2})$/);
      if (monthMatch) {
        targetYear = parseInt(monthMatch[1]);
        targetMonth = parseInt(monthMatch[2]);
        if (targetMonth >= 1 && targetMonth <= 12) {
          targetMonthKey = getMonthKey(targetYear, targetMonth);
        }
      }
    }
    
    // Si pas de mois spécifié, utiliser le mois en cours
    if (!targetMonthKey) {
      targetMonthKey = getCurrentMonthKey();
      const now = new Date();
      targetYear = now.getFullYear();
      targetMonth = now.getMonth() + 1;
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
     * avec normalisation et recherche flexible
     */
    function findMemberByName(name: string): any | null {
      if (!name || name.trim().length === 0) {
        return null;
      }
      
      // Normalisation systématique
      const normalizedName = name.toLowerCase().trim();
      
      // Chercher par displayName (exact match)
      let member = membersByDisplayName.get(normalizedName);
      if (member) {
        console.log(`[Raid Scan] Membre trouvé par displayName: ${name} → ${member.displayName}`);
        return member;
      }
      
      // Chercher par twitchLogin (exact match)
      member = membersByTwitchLogin.get(normalizedName);
      if (member) {
        console.log(`[Raid Scan] Membre trouvé par twitchLogin: ${name} → ${member.twitchLogin}`);
        return member;
      }
      
      // Chercher par discordUsername (exact match)
      member = membersByDiscordUsername.get(normalizedName);
      if (member) {
        console.log(`[Raid Scan] Membre trouvé par discordUsername: ${name} → ${member.discordUsername}`);
        return member;
      }
      
      // Recherche partielle (pour gérer les variations de casse et caractères)
      for (const [key, m] of membersByDisplayName.entries()) {
        // Comparaison insensible à la casse et aux variations
        const keyNormalized = key.replace(/[^a-z0-9_]/g, '');
        const nameNormalized = normalizedName.replace(/[^a-z0-9_]/g, '');
        
        if (keyNormalized === nameNormalized || 
            keyNormalized.includes(nameNormalized) || 
            nameNormalized.includes(keyNormalized)) {
          console.log(`[Raid Scan] Membre trouvé par recherche partielle: ${name} → ${m.displayName}`);
          return m;
        }
      }
      
      // Recherche dans twitchLogin avec normalisation
      for (const [key, m] of membersByTwitchLogin.entries()) {
        const keyNormalized = key.replace(/[^a-z0-9_]/g, '');
        const nameNormalized = normalizedName.replace(/[^a-z0-9_]/g, '');
        
        if (keyNormalized === nameNormalized) {
          console.log(`[Raid Scan] Membre trouvé par twitchLogin partiel: ${name} → ${m.twitchLogin}`);
          return m;
        }
      }
      
      return null;
    }

    // Récupérer TOUS les messages du salon coordination-raid avec pagination
    const messages: any[] = [];
    let before: string | undefined = undefined;
    let hasMore = true;
    let totalMessagesFetched = 0;

    console.log(`[Raid Scan] Début du scan avec pagination (max ${MAX_MESSAGES_TO_SCAN} messages)`);

    while (hasMore && totalMessagesFetched < MAX_MESSAGES_TO_SCAN) {
      const url = `https://discord.com/api/v10/channels/${COORDINATION_RAID_CHANNEL_ID}/messages?limit=100${before ? `&before=${before}` : ''}`;
      
      const messagesResponse = await fetch(url, {
        headers: {
          Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
        },
      });

      if (!messagesResponse.ok) {
        const errorText = await messagesResponse.text();
        console.error(`[Raid Scan] Erreur API Discord (batch ${Math.floor(totalMessagesFetched / 100) + 1}):`, errorText);
        
        // Si c'est une erreur de rate limit, on arrête mais on retourne ce qu'on a déjà
        if (messagesResponse.status === 429) {
          console.warn(`[Raid Scan] Rate limit atteint, arrêt du scan avec ${totalMessagesFetched} messages`);
          break;
        }
        
        return NextResponse.json(
          { error: 'Failed to fetch Discord messages', details: errorText },
          { status: messagesResponse.status }
        );
      }

      const batch: any[] = await messagesResponse.json();
      messages.push(...batch);
      totalMessagesFetched += batch.length;

      console.log(`[Raid Scan] Batch ${Math.floor(totalMessagesFetched / 100)}: ${batch.length} messages (total: ${totalMessagesFetched})`);

      // Si on a récupéré moins de 100 messages, on a atteint la fin de l'historique
      if (batch.length < 100) {
        hasMore = false;
        console.log(`[Raid Scan] Fin de l'historique atteinte (${batch.length} messages dans le dernier batch)`);
      } else {
        // Utiliser l'ID du dernier message comme cursor pour la pagination
        before = batch[batch.length - 1].id;
      }
      
      // Sécurité : arrêter si on atteint le maximum
      if (totalMessagesFetched >= MAX_MESSAGES_TO_SCAN) {
        console.warn(`[Raid Scan] Maximum de ${MAX_MESSAGES_TO_SCAN} messages atteint, arrêt du scan`);
        hasMore = false;
      }
    }

    console.log(`[Raid Scan] Scan terminé: ${totalMessagesFetched} messages récupérés au total`);
    
    // Filtrer les messages par mois si un mois cible est spécifié
    let messagesToProcess = messages;
    if (targetYear && targetMonth) {
      messagesToProcess = messages.filter(msg => {
        try {
          const msgDate = new Date(msg.timestamp);
          const msgYear = msgDate.getFullYear();
          const msgMonth = msgDate.getMonth() + 1;
          return msgYear === targetYear && msgMonth === targetMonth;
        } catch {
          return false;
        }
      });
      console.log(`[Raid Scan] Filtrage par mois ${targetYear}-${String(targetMonth).padStart(2, '0')}: ${messagesToProcess.length} messages sur ${messages.length}`);
    }
    
    // Pattern robuste pour détecter "@Pseudo a raid @Cible" avec variations
    // Extrait UNIQUEMENT le nom avant la parenthèse (si présente)
    // Exemples supportés:
    // - "@Face_BCD ( Capichef ) a raid @Dylow95" → raider: "Face_BCD", target: "Dylow95"
    // - "@RoiSephiBoo (51/1079 shiny FO) a raid @Cible" → raider: "RoiSephiBoo", target: "Cible"
    // - "@Darkinsomg a raid @Target" → raider: "Darkinsomg", target: "Target"
    const raidPattern = /@([A-Za-z0-9_]+)(?:\s*\([^)]*\))?\s+a\s+raid\s+@([A-Za-z0-9_]+)(?:\s*\([^)]*\))?/i;
    
    let newRaidsAdded = 0;
    let raidsValidated = 0;
    let raidsRejected = 0;
    let messagesWithRaids = 0;
    let messagesNotRecognized = 0;
    const errors: string[] = [];
    const unrecognizedMessages: string[] = [];
    const pendingRaids = await loadPendingRaids();
    const processedMessageIds = new Set(pendingRaids.map(r => r.messageId));
    
    for (const message of messagesToProcess) {
      const content = message.content;
      if (!content || content.trim().length === 0) {
        continue;
      }
      
      const match = content.match(raidPattern);
      
      if (match) {
        messagesWithRaids++;
        const messageId = message.id;
        // Extraire uniquement le nom (avant la parenthèse si présente)
        const raiderName = match[1].trim();
        const targetName = match[2].trim();
        
        console.log(`[Raid Scan] Message ${messageId}: "${content.substring(0, 100)}..." → raider: "${raiderName}", target: "${targetName}"`);
        
        // Trouver les membres par leur nom (avec normalisation)
        const raider = findMemberByName(raiderName);
        const target = findMemberByName(targetName);
        
        if (!raider || !raider.discordId) {
          const errorMsg = `Raider non trouvé: "${raiderName}" (cherché dans displayName, twitchLogin, discordUsername)`;
          errors.push(errorMsg);
          unrecognizedMessages.push(`[Raider] ${content.substring(0, 150)}`);
          console.warn(`[Raid Scan] ${errorMsg}`);
          
          // Ajouter dans unmatched pour traitement manuel
          try {
            await addUnmatchedRaid({
              id: message.id,
              content: content,
              timestamp: message.timestamp,
              reason: "unknown_raider",
              messageId: message.id,
            }, targetMonthKey);
            console.log(`[Raid Scan] Message ajouté dans unmatched (raider inconnu): ${message.id}`);
          } catch (error) {
            console.error(`[Raid Scan] Erreur lors de l'ajout dans unmatched:`, error);
          }
          continue;
        }
        
        if (!target || !target.discordId) {
          const errorMsg = `Cible non trouvée: "${targetName}" (cherché dans displayName, twitchLogin, discordUsername)`;
          errors.push(errorMsg);
          unrecognizedMessages.push(`[Target] ${content.substring(0, 150)}`);
          console.warn(`[Raid Scan] ${errorMsg}`);
          
          // Ajouter dans unmatched pour traitement manuel
          try {
            await addUnmatchedRaid({
              id: message.id,
              content: content,
              timestamp: message.timestamp,
              reason: "unknown_target",
              messageId: message.id,
            }, targetMonthKey);
            console.log(`[Raid Scan] Message ajouté dans unmatched (cible inconnue): ${message.id}`);
          } catch (error) {
            console.error(`[Raid Scan] Erreur lors de l'ajout dans unmatched:`, error);
          }
          continue;
        }
        
        // Vérifier que raider et target sont correctement assignés
        const raiderDiscordId = raider.discordId;
        const targetDiscordId = target.discordId;
        
        if (raiderDiscordId === targetDiscordId) {
          console.warn(`[Raid Scan] Raid ignoré: raider et cible sont identiques (${raiderDiscordId})`);
          continue;
        }
        
        console.log(`[Raid Scan] Raid valide: ${raider.displayName} (${raiderDiscordId}) → ${target.displayName} (${targetDiscordId})`);
        
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
              console.log(`[Raid Scan] Raid ajouté en attente: ${messageId}`);
            } catch (error) {
              const errorMsg = `Erreur lors de l'ajout du raid en attente: ${error instanceof Error ? error.message : 'Erreur inconnue'}`;
              errors.push(errorMsg);
              console.error(`[Raid Scan] ${errorMsg}`, error);
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
              console.log(`[Raid Scan] Raid validé immédiatement: ${messageId}`);
            } catch (error) {
              const errorMsg = `Erreur lors de la validation du raid: ${error instanceof Error ? error.message : 'Erreur inconnue'}`;
              errors.push(errorMsg);
              console.error(`[Raid Scan] ${errorMsg}`, error);
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
              console.log(`[Raid Scan] Raid rejeté: ${messageId}`);
            } catch (error) {
              const errorMsg = `Erreur lors du rejet du raid: ${error instanceof Error ? error.message : 'Erreur inconnue'}`;
              errors.push(errorMsg);
              console.error(`[Raid Scan] ${errorMsg}`, error);
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
                console.log(`[Raid Scan] Raid validé (réaction changée): ${messageId}`);
              } catch (error) {
                // Peut-être déjà validé, ignorer silencieusement
                console.log(`[Raid Scan] Raid déjà validé: ${messageId}`);
              }
            } else if (hasCross) {
              // Rejeter si ❌ est présent
              try {
                await rejectPendingRaid(messageId);
                raidsRejected++;
                console.log(`[Raid Scan] Raid rejeté (réaction changée): ${messageId}`);
              } catch (error) {
                // Peut-être déjà rejeté, ignorer silencieusement
                console.log(`[Raid Scan] Raid déjà rejeté: ${messageId}`);
              }
            }
          }
        }
      } else {
        // Message non reconnu comme raid - vérifier s'il contient "raid" pour logging
        if (content.toLowerCase().includes('raid') && content.includes('@')) {
          messagesNotRecognized++;
          unrecognizedMessages.push(`[Format non reconnu] ${content.substring(0, 200)}`);
          console.log(`[Raid Scan] Message non reconnu (contient "raid"): "${content.substring(0, 100)}..."`);
          
          // Ajouter dans unmatched pour traitement manuel
          try {
            await addUnmatchedRaid({
              id: message.id,
              content: content,
              timestamp: message.timestamp,
              reason: "regex_fail",
              messageId: message.id,
            }, targetMonthKey);
            console.log(`[Raid Scan] Message ajouté dans unmatched: ${message.id}`);
          } catch (error) {
            console.error(`[Raid Scan] Erreur lors de l'ajout dans unmatched:`, error);
          }
        }
      }
    }
    
    console.log(`[Raid Scan] Résumé final:
      - Messages scannés: ${totalMessagesFetched}
      - Messages avec raids détectés: ${messagesWithRaids}
      - Messages non reconnus: ${messagesNotRecognized}
      - Raids ajoutés en attente: ${newRaidsAdded}
      - Raids validés: ${raidsValidated}
      - Raids rejetés: ${raidsRejected}
      - Erreurs: ${errors.length}`);
    
    return NextResponse.json({
      success: true,
      newRaidsAdded,
      raidsValidated,
      raidsRejected,
      messagesScanned: totalMessagesFetched,
      totalMessagesInHistory: messages.length,
      messagesWithRaids,
      messagesNotRecognized,
      errors: errors.length > 0 ? errors.slice(0, 50) : undefined, // Limiter à 50 erreurs pour éviter des réponses trop grandes
      unrecognizedMessages: unrecognizedMessages.length > 0 ? unrecognizedMessages.slice(0, 20) : undefined, // Limiter à 20 messages non reconnus
      maxReached: totalMessagesFetched >= MAX_MESSAGES_TO_SCAN,
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


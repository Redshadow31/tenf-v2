import { NextRequest, NextResponse } from 'next/server';
import { loadMonthlyRaids, saveMonthlyRaids, getMonthKey } from '@/lib/raids';
import { getCurrentAdmin, isFounder } from '@/lib/admin';

/**
 * POST - Nettoie les données de raids pour un membre ou tous les membres
 * - Supprime tous les raids Twitch EventSub (source = "twitch-live")
 * - Supprime tous les raids Discord (source = "discord")
 * - Supprime les doublons manuels (garde le plus récent)
 * - Ne garde que les raids manuels d'aujourd'hui (depuis ce matin à 6h)
 * 
 * Body: { memberTwitchLogin?: string, month?: string }
 */
export async function POST(request: NextRequest) {
  try {
    // Vérifier les permissions (fondateurs uniquement)
    const admin = await getCurrentAdmin();
    if (!admin || !isFounder(admin.id)) {
      return NextResponse.json(
        { error: "Accès refusé. Réservé aux fondateurs." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { memberTwitchLogin, month } = body;

    // Déterminer le monthKey
    let monthKey: string | undefined;
    if (month) {
      const monthMatch = month.match(/^(\d{4})-(\d{2})$/);
      if (monthMatch) {
        const year = parseInt(monthMatch[1]);
        const monthNum = parseInt(monthMatch[2]);
        if (monthNum >= 1 && monthNum <= 12) {
          monthKey = getMonthKey(year, monthNum);
        }
      }
    }

    // Charger les raids du mois
    const raids = await loadMonthlyRaids(monthKey);
    
    // Date de référence : aujourd'hui à 6h du matin
    const today = new Date();
    today.setHours(6, 0, 0, 0);
    const todayTimestamp = today.toISOString();

    // Charger les membres pour la conversion
    const { loadMemberDataFromStorage, getAllMemberData } = await import('@/lib/memberData');
    await loadMemberDataFromStorage();
    const allMembers = getAllMemberData();

    // Créer un map Discord ID -> Twitch Login
    const discordIdToTwitchLogin = new Map<string, string>();
    allMembers.forEach(m => {
      if (m.discordId && m.twitchLogin) {
        discordIdToTwitchLogin.set(m.discordId, m.twitchLogin.toLowerCase());
      }
    });

    // Trouver le membre si spécifié
    let targetDiscordId: string | undefined;
    if (memberTwitchLogin) {
      const member = allMembers.find(m => m.twitchLogin.toLowerCase() === memberTwitchLogin.toLowerCase());
      if (!member || !member.discordId) {
        return NextResponse.json(
          { error: `Membre non trouvé: ${memberTwitchLogin}` },
          { status: 404 }
        );
      }
      targetDiscordId = member.discordId;
    }

    let cleanedCount = 0;
    let twitchEventSubRemoved = 0;
    let discordRemoved = 0;
    let duplicatesRemoved = 0;
    let oldManualRemoved = 0;

    // Nettoyer les raids
    for (const [discordId, memberRaids] of Object.entries(raids)) {
      // Si un membre spécifique est demandé, ne traiter que ce membre
      if (targetDiscordId && discordId !== targetDiscordId) {
        continue;
      }

      // Nettoyer les raids faits
      if (memberRaids.raids && memberRaids.raids.length > 0) {
        // Filtrer : garder uniquement les raids manuels d'aujourd'hui
        const cleanedRaids = memberRaids.raids
          .filter(raid => {
            const source = raid.source || "twitch-live"; // Par défaut, considérer comme twitch-live si non défini
            // Supprimer les raids Twitch EventSub
            if (source === "twitch-live" || source === "bot") {
              twitchEventSubRemoved++;
              return false;
            }
            // Supprimer les raids Discord
            if (source === "discord") {
              discordRemoved++;
              return false;
            }
            // Garder uniquement les raids manuels
            if (source !== "manual" && source !== "admin") {
              return false;
            }
            // Garder uniquement les raids d'aujourd'hui (depuis 6h du matin)
            const raidDate = new Date(raid.timestamp);
            if (raidDate < today) {
              oldManualRemoved++;
              return false;
            }
            return true;
          });

        // Supprimer les doublons (même targetDiscordId et même timestamp à la minute près)
        const uniqueRaids: typeof memberRaids.raids = [];
        const seen = new Set<string>();
        
        // Trier par date décroissante (plus récent en premier)
        cleanedRaids.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        
        for (const raid of cleanedRaids) {
          // Créer une clé unique : targetDiscordId + timestamp arrondi à la minute
          const raidDate = new Date(raid.timestamp);
          const minuteKey = `${raid.targetDiscordId}-${raidDate.getFullYear()}-${raidDate.getMonth()}-${raidDate.getDate()}-${raidDate.getHours()}-${raidDate.getMinutes()}`;
          
          if (!seen.has(minuteKey)) {
            seen.add(minuteKey);
            uniqueRaids.push(raid);
          } else {
            duplicatesRemoved++;
          }
        }

        memberRaids.raids = uniqueRaids;
        memberRaids.done = uniqueRaids.length;
        
        // Recalculer les targets
        memberRaids.targets = {};
        for (const raid of uniqueRaids) {
          memberRaids.targets[raid.targetDiscordId] = (memberRaids.targets[raid.targetDiscordId] || 0) + 1;
        }

        cleanedCount += memberRaids.raids.length;
      } else {
        memberRaids.raids = [];
        memberRaids.done = 0;
        memberRaids.targets = {};
      }

      // Nettoyer les raids reçus
      if (memberRaids.receivedRaids && memberRaids.receivedRaids.length > 0) {
        // Filtrer : garder uniquement les raids manuels d'aujourd'hui
        const cleanedReceivedRaids = memberRaids.receivedRaids
          .filter(raid => {
            const source = raid.source || "twitch-live"; // Par défaut, considérer comme twitch-live si non défini
            // Supprimer les raids Twitch EventSub
            if (source === "twitch-live" || source === "bot") {
              twitchEventSubRemoved++;
              return false;
            }
            // Supprimer les raids Discord
            if (source === "discord") {
              discordRemoved++;
              return false;
            }
            // Garder uniquement les raids manuels
            if (source !== "manual" && source !== "admin") {
              return false;
            }
            // Garder uniquement les raids d'aujourd'hui (depuis 6h du matin)
            const raidDate = new Date(raid.timestamp);
            if (raidDate < today) {
              oldManualRemoved++;
              return false;
            }
            return true;
          });

        // Supprimer les doublons (même targetDiscordId et même timestamp à la minute près)
        const uniqueReceivedRaids: typeof memberRaids.receivedRaids = [];
        const seen = new Set<string>();
        
        // Trier par date décroissante (plus récent en premier)
        cleanedReceivedRaids.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        
        for (const raid of cleanedReceivedRaids) {
          // Pour les raids reçus, targetDiscordId contient l'ID du raider
          const raidDate = new Date(raid.timestamp);
          const minuteKey = `${raid.targetDiscordId}-${raidDate.getFullYear()}-${raidDate.getMonth()}-${raidDate.getDate()}-${raidDate.getHours()}-${raidDate.getMinutes()}`;
          
          if (!seen.has(minuteKey)) {
            seen.add(minuteKey);
            uniqueReceivedRaids.push(raid);
          } else {
            duplicatesRemoved++;
          }
        }

        memberRaids.receivedRaids = uniqueReceivedRaids;
        memberRaids.received = uniqueReceivedRaids.length;
      } else {
        memberRaids.receivedRaids = [];
        memberRaids.received = 0;
      }

      // Si le membre n'a plus de raids, on peut le supprimer (optionnel)
      if (memberRaids.done === 0 && memberRaids.received === 0) {
        // On garde quand même l'entrée avec des tableaux vides pour éviter les erreurs
      }
    }

    // Sauvegarder les données nettoyées
    await saveMonthlyRaids(raids, monthKey);

    return NextResponse.json({
      success: true,
      message: "Données nettoyées avec succès",
      stats: {
        cleanedCount,
        twitchEventSubRemoved,
        discordRemoved,
        duplicatesRemoved,
        oldManualRemoved,
      },
    });
  } catch (error) {
    console.error("Erreur lors du nettoyage des raids:", error);
    return NextResponse.json(
      { error: "Erreur serveur lors du nettoyage" },
      { status: 500 }
    );
  }
}


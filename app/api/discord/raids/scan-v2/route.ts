import { NextRequest, NextResponse } from 'next/server';
import {
  loadRaidsFaits,
  addRaidFait,
  isRaidManual,
  recalculateAlerts,
  getMonthKey,
  getCurrentMonthKey,
} from '@/lib/raidStorage';
import { loadMemberDataFromStorage, getAllMemberData } from '@/lib/memberData';
import { extractDiscordIds } from '@/lib/raidUtilsClient';

const COORDINATION_RAID_CHANNEL_ID = "1278840270753894535";
const MAX_MESSAGES_TO_SCAN = 5000;

/**
 * POST - Nouveau scanner de raids avec respect des overrides manuels
 * Body: { month: string, scanMode: "new" | "rescan", includeManual: boolean, logSkipped: boolean, simulateOnly: boolean }
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

    const body = await request.json();
    const {
      month, // Format YYYY-MM
      scanMode = "new",
      includeManual = false,
      logSkipped = true,
      simulateOnly = false,
    } = body;

    // Déterminer le monthKey
    let monthKey: string;
    if (month) {
      const monthMatch = month.match(/^(\d{4})-(\d{2})$/);
      if (monthMatch) {
        const year = parseInt(monthMatch[1]);
        const monthNum = parseInt(monthMatch[2]);
        if (monthNum >= 1 && monthNum <= 12) {
          monthKey = getMonthKey(year, monthNum);
        } else {
          return NextResponse.json({ error: "Mois invalide" }, { status: 400 });
        }
      } else {
        return NextResponse.json({ error: "Format de mois invalide (attendu: YYYY-MM)" }, { status: 400 });
      }
    } else {
      monthKey = getCurrentMonthKey();
    }

    // Charger les membres pour la conversion
    await loadMemberDataFromStorage();
    const allMembers = getAllMemberData();
    const discordIdToMember = new Map<string, any>();
    allMembers.forEach(m => {
      if (m.discordId) {
        discordIdToMember.set(m.discordId, m);
      }
    });

    // Charger les raids existants
    const existingRaids = await loadRaidsFaits(monthKey);
    const processedMessageIds = new Set<string>();
    existingRaids.forEach(raid => {
      if (raid.messageId) {
        processedMessageIds.add(raid.messageId);
      }
    });

    // Calculer les dates de début et fin du mois
    const [year, monthNum] = monthKey.split('-').map(Number);
    const startOfMonth = new Date(year, monthNum - 1, 1);
    const endOfMonth = new Date(year, monthNum, 0, 23, 59, 59);

    // Statistiques
    let messagesScanned = 0;
    let newRaidsAdded = 0;
    let raidsIgnored = 0;
    let repeatedRaidsDetected = 0;
    const errors: string[] = [];
    const skippedLogs: string[] = [];

    // Fonction pour traiter un message
    const processMessage = async (message: any) => {
      messagesScanned++;

      // Vérifier si le message est dans le mois cible
      const messageDate = new Date(message.timestamp);
      if (messageDate < startOfMonth || messageDate > endOfMonth) {
        return; // Ignorer les messages hors du mois
      }

      // Si mode "new" et message déjà traité, ignorer
      if (scanMode === "new" && processedMessageIds.has(message.id)) {
        return;
      }

      // Extraire les Discord IDs du message
      const discordIds = extractDiscordIds(message.content);
      if (discordIds.length < 2) {
        return; // Pas assez d'IDs
      }

      const raiderId = discordIds[0];
      const targetId = discordIds[1];

      // Vérifier que les membres existent
      const raider = discordIdToMember.get(raiderId);
      const target = discordIdToMember.get(targetId);

      if (!raider || !target) {
        return; // Membre non trouvé
      }

      // Vérifier si le raid est manuel et doit être ignoré
      const isManual = await isRaidManual(monthKey, raiderId, targetId, messageDate.toISOString());
      if (isManual && !includeManual) {
        raidsIgnored++;
        if (logSkipped) {
          skippedLogs.push(`Message ${message.id}: Raid manuel ignoré (${raider.twitchLogin} → ${target.twitchLogin})`);
        }
        return;
      }

      // Vérifier si le raid existe déjà
      const exists = existingRaids.some(
        r => r.raider === raiderId && r.target === targetId && r.date === messageDate.toISOString()
      );

      if (exists) {
        return; // Déjà présent
      }

      // Ajouter le raid (si pas en mode simulation)
      if (!simulateOnly) {
        try {
          await addRaidFait(
            monthKey,
            raiderId,
            targetId,
            messageDate.toISOString(),
            false, // manual = false (c'est le bot qui l'ajoute)
            message.id
          );
          newRaidsAdded++;
        } catch (error) {
          errors.push(`Erreur lors de l'ajout du raid: ${error}`);
        }
      } else {
        newRaidsAdded++; // Compter même en simulation
      }

      // Vérifier les raids répétés
      const sameTargetCount = existingRaids.filter(
        r => r.raider === raiderId && r.target === targetId
      ).length;
      if (sameTargetCount >= 2) { // Déjà 2, donc ce sera le 3ème
        repeatedRaidsDetected++;
      }
    };

    // Scanner les messages Discord
    let before: string | undefined;
    let hasMore = true;
    let totalFetched = 0;

    while (hasMore && totalFetched < MAX_MESSAGES_TO_SCAN) {
      const url = `https://discord.com/api/v10/channels/${COORDINATION_RAID_CHANNEL_ID}/messages?limit=100${before ? `&before=${before}` : ''}`;
      
      const response = await fetch(url, {
        headers: {
          Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
        },
      });

      if (!response.ok) {
        errors.push(`Erreur API Discord: ${response.status} ${response.statusText}`);
        break;
      }

      const messages: any[] = await response.json();
      
      if (messages.length === 0) {
        hasMore = false;
        break;
      }

      // Traiter les messages dans l'ordre chronologique (du plus récent au plus ancien)
      for (const message of messages) {
        const messageDate = new Date(message.timestamp);
        
        // Si on dépasse le début du mois, arrêter
        if (messageDate < startOfMonth) {
          hasMore = false;
          break;
        }

        await processMessage(message);
        before = message.id;
        totalFetched++;
      }

      // Si on a moins de 100 messages, on a atteint la fin
      if (messages.length < 100) {
        hasMore = false;
      }
    }

    // Recalculer les alertes (si pas en mode simulation)
    let alertsAdded = 0;
    if (!simulateOnly) {
      await recalculateAlerts(monthKey);
      const { loadAlerts } = await import('@/lib/raidStorage');
      const alerts = await loadAlerts(monthKey);
      alertsAdded = alerts.length;
    }

    return NextResponse.json({
      newRaidsAdded,
      raidsIgnored,
      repeatedRaidsDetected,
      alertsAdded,
      messagesScanned,
      errors: errors.length > 0 ? errors : undefined,
      skippedLogs: logSkipped && skippedLogs.length > 0 ? skippedLogs.slice(0, 10) : undefined, // Limiter à 10 logs
    });
  } catch (error) {
    console.error("Erreur lors du scan:", error);
    return NextResponse.json(
      { error: `Erreur serveur: ${error instanceof Error ? error.message : 'Erreur inconnue'}` },
      { status: 500 }
    );
  }
}


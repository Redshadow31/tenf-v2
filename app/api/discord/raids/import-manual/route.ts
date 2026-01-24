import { NextRequest, NextResponse } from 'next/server';
import {
  addRaidFait,
  addRaidRecu,
  loadRaidsFaits,
  saveRaidsFaits,
  loadRaidsRecus,
  saveRaidsRecus,
  recalculateAlerts,
  getMonthKey,
  getCurrentMonthKey,
} from '@/lib/raidStorage';
import { loadMemberDataFromStorage, getAllMemberData } from '@/lib/memberData';
import { getCurrentAdmin } from '@/lib/adminAuth';
import { hasPermission } from '@/lib/adminRoles';

// Forcer l'utilisation du runtime Node.js (nécessaire pour @netlify/blobs)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST - Importe plusieurs raids manuellement en une seule fois
 * Body: { month: string, raids: Array<{ raider: string, target: string, date?: string, countFrom?: boolean, countTo?: boolean }> }
 */
export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const admin = await getCurrentAdmin();
    
    if (!admin) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    // Vérifier les permissions : write pour importer
    if (!hasPermission(admin.id, "write")) {
      return NextResponse.json(
        { error: "Accès refusé. Permissions insuffisantes." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { month, raids } = body;

    if (!month) {
      return NextResponse.json(
        { error: "month est requis" },
        { status: 400 }
      );
    }

    if (!Array.isArray(raids) || raids.length === 0) {
      return NextResponse.json(
        { error: "raids doit être un tableau non vide" },
        { status: 400 }
      );
    }

    // Déterminer le monthKey
    let monthKey: string;
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
      monthKey = getCurrentMonthKey();
    }

    // Charger les membres pour la conversion
    await loadMemberDataFromStorage();
    const allMembers = getAllMemberData();

    // Créer un map pour la recherche rapide
    const memberMap = new Map<string, { discordId?: string; twitchLogin?: string }>();
    allMembers.forEach(m => {
      if (m.twitchLogin) {
        memberMap.set(m.twitchLogin.toLowerCase(), m);
      }
      if (m.discordId) {
        memberMap.set(m.discordId, m);
      }
    });

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Traiter chaque raid
    for (let i = 0; i < raids.length; i++) {
      const raid = raids[i];
      const { raider, target, date, countFrom = true, countTo = true } = raid;

      // Vérifier qu'au moins un côté est activé
      if (!countFrom && !countTo) {
        results.failed++;
        results.errors.push(`Raid #${i + 1}: au moins countFrom ou countTo doit être activé`);
        continue;
      }

      // Vérifier que les membres sont fournis pour les options activées
      if (countFrom && !raider) {
        results.failed++;
        results.errors.push(`Raid #${i + 1}: raider requis si countFrom est activé`);
        continue;
      }

      if (countTo && !target) {
        results.failed++;
        results.errors.push(`Raid #${i + 1}: target requis si countTo est activé`);
        continue;
      }

      try {
        // Utiliser la date fournie ou la date actuelle
        const raidDate = date || new Date().toISOString();

        // Chercher les membres
        const raiderMember = raider ? (memberMap.get(raider.toLowerCase()) || 
                          allMembers.find(m => 
                            m.twitchLogin?.toLowerCase() === raider.toLowerCase() ||
                            m.discordId === raider
                          )) : null;
        const targetMember = target ? (memberMap.get(target.toLowerCase()) || 
                          allMembers.find(m => 
                            m.twitchLogin?.toLowerCase() === target.toLowerCase() ||
                            m.discordId === target
                          )) : null;

        // Utiliser Discord ID si disponible, sinon utiliser le Twitch Login
        const raiderId = raiderMember?.discordId || raider;
        const targetId = targetMember?.discordId || target;

        // Traiter le raid fait (countFrom)
        if (countFrom && raider) {
          // Pour le raid fait, on a besoin d'une cible (même si countTo est false)
          // On utilise la cible fournie, ou le raider comme fallback
          const effectiveTargetId = targetId || raiderId;
          
          await addRaidFait(monthKey, raiderId, effectiveTargetId, raidDate, true, undefined, "manual");
          
          // Mettre à jour les flags countFrom et countTo dans le raid fait créé
          const raidsFaits = await loadRaidsFaits(monthKey);
          const lastRaid = raidsFaits.find(
            r => r.raider === raiderId && r.target === effectiveTargetId && r.date === raidDate
          );
          if (lastRaid) {
            lastRaid.countFrom = countFrom;
            lastRaid.countTo = countTo;
            await saveRaidsFaits(monthKey, raidsFaits);
          }
          
          // Si countTo est false, supprimer le raid reçu créé automatiquement par addRaidFait
          if (!countTo && target) {
            const raidsRecus = await loadRaidsRecus(monthKey);
            const indexToRemove = raidsRecus.findIndex(
              r => r.target === targetId && r.raider === raiderId && r.date === raidDate
            );
            if (indexToRemove !== -1) {
              raidsRecus.splice(indexToRemove, 1);
              await saveRaidsRecus(monthKey, raidsRecus);
            }
          } else if (countTo && target) {
            // Mettre à jour les flags dans le raid reçu créé automatiquement
            const raidsRecus = await loadRaidsRecus(monthKey);
            const receivedRaid = raidsRecus.find(
              r => r.target === targetId && r.raider === raiderId && r.date === raidDate
            );
            if (receivedRaid) {
              receivedRaid.countFrom = countFrom;
              receivedRaid.countTo = countTo;
              await saveRaidsRecus(monthKey, raidsRecus);
            }
          }
        }

        // Traiter le raid reçu (countTo)
        if (countTo && target && !countFrom) {
          // Si countFrom est false, on doit créer uniquement le raid reçu
          // Pour le raid reçu, on a besoin d'un raider (même si countFrom est false)
          // On utilise le raider fourni, ou la cible comme fallback
          const effectiveRaiderId = raiderId || targetId;
          await addRaidRecu(monthKey, targetId, effectiveRaiderId, raidDate, true, undefined, "manual");
          
          // Mettre à jour les flags countFrom et countTo dans le raid reçu créé
          const raidsRecus = await loadRaidsRecus(monthKey);
          const receivedRaid = raidsRecus.find(
            r => r.target === targetId && r.raider === effectiveRaiderId && r.date === raidDate
          );
          if (receivedRaid) {
            receivedRaid.countFrom = countFrom;
            receivedRaid.countTo = countTo;
            await saveRaidsRecus(monthKey, raidsRecus);
          }
        }

        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(
          `Raid #${i + 1} (${countFrom ? `fait: @${raider}` : ''}${countFrom && countTo ? ' / ' : ''}${countTo ? `reçu: @${target}` : ''}): ${error instanceof Error ? error.message : "Erreur inconnue"}`
        );
      }
    }

    // Recalculer les alertes après l'import
    try {
      await recalculateAlerts(monthKey);
    } catch (error) {
      console.error("[Import Manual] Erreur lors du recalcul des alertes:", error);
      // Ne pas faire échouer l'import si le recalcul des alertes échoue
    }

    return NextResponse.json({
      success: true,
      message: `${results.success} raid(s) importé(s) avec succès${results.failed > 0 ? `, ${results.failed} échec(s)` : ""}`,
      results: {
        total: raids.length,
        success: results.success,
        failed: results.failed,
        errors: results.errors.length > 0 ? results.errors : undefined,
      },
    });
  } catch (error) {
    console.error("[Import Manual] Erreur:", error);
    return NextResponse.json(
      { error: `Erreur serveur: ${error instanceof Error ? error.message : 'Erreur inconnue'}` },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from 'next/server';
import {
  loadRaidsFaits,
  saveRaidsFaits,
  loadRaidsRecus,
  saveRaidsRecus,
  recalculateAlerts,
  getMonthKey,
  getCurrentMonthKey,
  type RaidFait,
  type RaidRecu,
} from '@/lib/raidStorage';
import { loadMemberDataFromStorage, getAllMemberData } from '@/lib/memberData';
import { getCurrentAdmin } from '@/lib/adminAuth';
import { hasPermission } from '@/lib/adminRoles';

// Forcer l'utilisation du runtime Node.js (nécessaire pour @netlify/blobs)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Augmenter le timeout pour les imports de nombreux raids (éviter 504)
export const maxDuration = 60;

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

    // Charger une seule fois pour éviter 504 (timeout) sur gros imports
    let raidsFaits: RaidFait[] = await loadRaidsFaits(monthKey);
    let raidsRecus: RaidRecu[] = await loadRaidsRecus(monthKey);

    for (let i = 0; i < raids.length; i++) {
      const raid = raids[i];
      const { raider, target, date, countFrom = true, countTo = true } = raid;

      if (!countFrom && !countTo) {
        results.failed++;
        results.errors.push(`Raid #${i + 1}: au moins countFrom ou countTo doit être activé`);
        continue;
      }
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
        const raidDate = date || new Date().toISOString();
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
        const raiderId = raiderMember?.discordId || raider;
        const targetId = targetMember?.discordId || target;

        if (countFrom && raider) {
          const effectiveTargetId = targetId || raiderId;
          raidsFaits.push({
            raider: raiderId,
            target: effectiveTargetId,
            date: raidDate,
            count: 1,
            manual: true,
            source: "manual",
            countFrom,
            countTo: countTo ? true : undefined,
          });
          if (countTo && target) {
            raidsRecus.push({
              target: targetId,
              raider: raiderId,
              date: raidDate,
              manual: true,
              source: "manual",
              countFrom,
              countTo: true,
            });
          }
        } else if (countTo && target) {
          const effectiveRaiderId = raiderId || targetId;
          raidsRecus.push({
            target: targetId,
            raider: effectiveRaiderId,
            date: raidDate,
            manual: true,
            source: "manual",
            countFrom: countFrom ? true : undefined,
            countTo: true,
          });
        }

        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(
          `Raid #${i + 1} (${countFrom ? `fait: @${raider}` : ''}${countFrom && countTo ? ' / ' : ''}${countTo ? `reçu: @${target}` : ''}): ${error instanceof Error ? error.message : "Erreur inconnue"}`
        );
      }
    }

    // Une seule sauvegarde à la fin (évite des centaines d'appels Blob → plus de 504)
    await saveRaidsFaits(monthKey, raidsFaits);
    await saveRaidsRecus(monthKey, raidsRecus);

    // Recalculer les alertes une seule fois
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


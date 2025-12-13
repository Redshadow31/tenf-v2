import { NextRequest, NextResponse } from 'next/server';
import {
  addRaidFait,
  recalculateAlerts,
  getMonthKey,
  getCurrentMonthKey,
} from '@/lib/raidStorage';
import { loadMemberDataFromStorage, getAllMemberData } from '@/lib/memberData';

/**
 * POST - Importe plusieurs raids manuellement en une seule fois
 * Body: { month: string, raids: Array<{ raider: string, target: string }> }
 */
export async function POST(request: NextRequest) {
  try {
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

    const now = new Date().toISOString();

    // Traiter chaque raid
    for (let i = 0; i < raids.length; i++) {
      const raid = raids[i];
      const { raider, target } = raid;

      if (!raider || !target) {
        results.failed++;
        results.errors.push(`Raid #${i + 1}: raider ou target manquant`);
        continue;
      }

      try {
        // Chercher les membres par Twitch Login ou Discord ID
        const raiderMember = memberMap.get(raider.toLowerCase()) || 
                            allMembers.find(m => 
                              m.twitchLogin?.toLowerCase() === raider.toLowerCase() ||
                              m.discordId === raider
                            );
        const targetMember = memberMap.get(target.toLowerCase()) || 
                            allMembers.find(m => 
                              m.twitchLogin?.toLowerCase() === target.toLowerCase() ||
                              m.discordId === target
                            );

        // Utiliser Discord ID si disponible, sinon utiliser le Twitch Login
        const raiderId = raiderMember?.discordId || raider;
        const targetId = targetMember?.discordId || target;

        // Ajouter le raid avec source="manual"
        await addRaidFait(monthKey, raiderId, targetId, now, true, undefined, "manual");

        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(
          `Raid #${i + 1} (@${raider} → @${target}): ${error instanceof Error ? error.message : "Erreur inconnue"}`
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


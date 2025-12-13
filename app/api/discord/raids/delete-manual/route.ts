import { NextRequest, NextResponse } from 'next/server';
import {
  loadRaidsFaits,
  loadRaidsRecus,
  saveRaidsFaits,
  saveRaidsRecus,
  recalculateAlerts,
  getMonthKey,
  getCurrentMonthKey,
} from '@/lib/raidStorage';

/**
 * DELETE - Supprime tous les raids manuels pour un mois donné
 * Query params: ?month=YYYY-MM (optionnel, par défaut mois en cours)
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const monthParam = searchParams.get('month');

    // Déterminer le monthKey
    let monthKey: string;
    if (monthParam) {
      const monthMatch = monthParam.match(/^(\d{4})-(\d{2})$/);
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
    } else {
      monthKey = getCurrentMonthKey();
    }

    // Charger les raids
    let raidsFaits = await loadRaidsFaits(monthKey);
    let raidsRecus = await loadRaidsRecus(monthKey);

    // Compter les raids manuels avant suppression
    const manualRaidsFaits = raidsFaits.filter(r => r.source === "manual" || r.manual);
    const manualRaidsRecus = raidsRecus.filter(r => r.source === "manual" || r.manual);
    const totalDeleted = manualRaidsFaits.length + manualRaidsRecus.length;

    // Filtrer pour ne garder que les raids non-manuels
    raidsFaits = raidsFaits.filter(r => r.source !== "manual" && !r.manual);
    raidsRecus = raidsRecus.filter(r => r.source !== "manual" && !r.manual);

    // Sauvegarder
    await saveRaidsFaits(monthKey, raidsFaits);
    await saveRaidsRecus(monthKey, raidsRecus);

    // Recalculer les alertes après suppression
    try {
      await recalculateAlerts(monthKey);
    } catch (error) {
      console.error("[Delete Manual Raids] Erreur lors du recalcul des alertes:", error);
      // Ne pas faire échouer la suppression si le recalcul des alertes échoue
    }

    return NextResponse.json({
      success: true,
      message: `${totalDeleted} raid(s) manuel(s) supprimé(s)`,
      deleted: {
        raidsFaits: manualRaidsFaits.length,
        raidsRecus: manualRaidsRecus.length,
        total: totalDeleted,
      },
      month: monthKey,
    });
  } catch (error) {
    console.error("[Delete Manual Raids] Erreur:", error);
    return NextResponse.json(
      { error: `Erreur serveur: ${error instanceof Error ? error.message : 'Erreur inconnue'}` },
      { status: 500 }
    );
  }
}


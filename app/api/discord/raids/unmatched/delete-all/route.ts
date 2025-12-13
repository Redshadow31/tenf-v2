import { NextRequest, NextResponse } from 'next/server';
import { loadUnmatchedRaids, saveUnmatchedRaids, getMonthKey, getCurrentMonthKey } from '@/lib/raids';
import { getCurrentAdmin, isFounder } from '@/lib/admin';

/**
 * DELETE - Supprime tous les raids non reconnus pour un mois donné
 * Seuls les fondateurs peuvent effectuer cette action
 */
export async function DELETE(request: NextRequest) {
  try {
    // Vérifier les permissions (fondateurs uniquement)
    const admin = await getCurrentAdmin(request);
    if (!admin || !isFounder(admin.id)) {
      return NextResponse.json(
        { error: "Accès refusé. Seuls les fondateurs peuvent supprimer tous les raids non reconnus." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');

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
        monthKey = getCurrentMonthKey();
      }
    } else {
      monthKey = getCurrentMonthKey();
    }

    // Charger les raids non reconnus
    const unmatched = await loadUnmatchedRaids(monthKey);
    const count = unmatched.length;

    // Supprimer tous les raids non reconnus (sauvegarder un tableau vide)
    await saveUnmatchedRaids([], monthKey);

    console.log(`[Unmatched Raids] Tous les raids non reconnus supprimés pour ${monthKey} (${count} messages)`);

    return NextResponse.json({
      success: true,
      message: `${count} raid(s) non reconnu(s) supprimé(s) avec succès`,
      deleted: count,
      month: monthKey,
    });
  } catch (error) {
    console.error("Erreur lors de la suppression des raids non reconnus:", error);
    return NextResponse.json(
      { error: `Erreur serveur: ${error instanceof Error ? error.message : 'Erreur inconnue'}` },
      { status: 500 }
    );
  }
}


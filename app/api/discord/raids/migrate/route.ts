import { NextRequest, NextResponse } from 'next/server';
import {
  migrateLegacyData,
  isMonthMigrated,
  getMonthKey,
  getCurrentMonthKey,
} from '@/lib/raidStorage';

/**
 * POST - Migre les données legacy vers le nouveau format
 * Body: { month?: string } (optionnel, par défaut mois en cours)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { month } = body;

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

    // Vérifier si déjà migré
    const alreadyMigrated = await isMonthMigrated(monthKey);
    if (alreadyMigrated) {
      return NextResponse.json({
        success: true,
        message: "Données déjà migrées pour ce mois",
        alreadyMigrated: true,
      });
    }

    // Effectuer la migration
    const results = await migrateLegacyData(monthKey);

    return NextResponse.json({
      success: true,
      message: "Migration terminée",
      month: monthKey,
      results: {
        raidsFaitsMigres: results.raidsFaitsMigres,
        raidsRecusMigres: results.raidsRecusMigres,
        alertsMigres: results.alertsMigres,
      },
    });
  } catch (error) {
    console.error("Erreur lors de la migration:", error);
    return NextResponse.json(
      { error: `Erreur serveur: ${error instanceof Error ? error.message : 'Erreur inconnue'}` },
      { status: 500 }
    );
  }
}

/**
 * GET - Vérifie si un mois a été migré
 * Query params: ?month=YYYY-MM
 */
export async function GET(request: NextRequest) {
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

    const migrated = await isMonthMigrated(monthKey);

    return NextResponse.json({
      month: monthKey,
      migrated,
    });
  } catch (error) {
    console.error("Erreur lors de la vérification:", error);
    return NextResponse.json(
      { error: `Erreur serveur: ${error instanceof Error ? error.message : 'Erreur inconnue'}` },
      { status: 500 }
    );
  }
}


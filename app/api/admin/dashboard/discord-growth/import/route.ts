import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/adminAuth';
import { hasPermission } from '@/lib/adminRoles';
import {
  loadDashboardData,
  saveDashboardData,
  DashboardData,
  MonthlyDataPoint,
} from '@/lib/dashboardDataStorage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface ImportDataPoint {
  date: string; // Format YYYY-MM-DD
  members: number;
  avg21?: number | null;
}

/**
 * POST - Importe des données de croissance Discord depuis un TSV
 * Body: { data: ImportDataPoint[] }
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

    // Vérifier les permissions : write pour modifier les données
    if (!hasPermission(admin.id, "write")) {
      return NextResponse.json(
        { error: "Accès refusé. Permissions insuffisantes." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { data } = body;

    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json(
        { error: "Les données doivent être un tableau non vide" },
        { status: 400 }
      );
    }

    // Validation : au moins 2 points
    if (data.length < 2) {
      return NextResponse.json(
        { error: "Au moins 2 points valides sont nécessaires" },
        { status: 400 }
      );
    }

    // Convertir les données importées en format mensuel
    // Grouper par mois et prendre la dernière valeur de chaque mois
    const monthlyDataMap = new Map<string, { date: Date; members: number; avg21?: number | null }>();

    for (const point of data) {
      const date = new Date(point.date);
      if (isNaN(date.getTime())) {
        continue; // Ignorer les dates invalides
      }

      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      // Prendre la dernière valeur du mois (la plus récente)
      const existing = monthlyDataMap.get(monthKey);
      if (!existing || date > existing.date) {
        monthlyDataMap.set(monthKey, {
          date,
          members: point.members,
          avg21: point.avg21 !== undefined ? point.avg21 : null,
        });
      }
    }

    // Convertir en format pour le graphique
    const monthNames = [
      'Janv', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
      'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'
    ];

    const chartData: MonthlyDataPoint[] = Array.from(monthlyDataMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0])) // Trier par clé (YYYY-MM)
      .map(([monthKey, monthData], index, array) => {
        const [year, month] = monthKey.split('-');
        const monthIndex = parseInt(month, 10) - 1;
        
        // Afficher l'année seulement si c'est le premier mois de l'année ou si l'année change
        const prevMonthKey = index > 0 ? array[index - 1][0] : null;
        const prevYear = prevMonthKey ? prevMonthKey.split('-')[0] : null;
        const showYear = !prevYear || prevYear !== year;
        
        return {
          month: showYear ? `${monthNames[monthIndex]} ${year}` : monthNames[monthIndex],
          value: monthData.members,
        };
      });

    // Charger les données actuelles et mettre à jour
    const currentData = await loadDashboardData();
    const updatedData: DashboardData = {
      ...currentData,
      discordGrowth: chartData,
      lastUpdated: new Date().toISOString(),
      updatedBy: admin.id,
    };

    await saveDashboardData(updatedData, admin.id);

    return NextResponse.json({
      success: true,
      message: `${chartData.length} points de données importés avec succès`,
      data: chartData,
    });
  } catch (error) {
    console.error('[API Discord Growth Import] Erreur POST:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur inconnue' },
      { status: 500 }
    );
  }
}


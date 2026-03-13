import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/requireAdmin';
import { eventRepository } from '@/lib/repositories';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function isSpotlightCategory(category: string | undefined): boolean {
  return (category || "").toLowerCase() === "spotlight";
}

/**
 * GET - Récupère les données de progression Spotlight pour les 3 derniers mois
 * Source: événements catégorie Spotlight + présences réelles (/admin/events/presence).
 */
export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const now = new Date();
    const months: string[] = [];
    
    // Générer les 3 derniers mois
    for (let i = 0; i < 3; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      months.push(`${year}-${month}`);
    }

    // Charger les événements une seule fois, puis grouper par mois
    const allEvents = await eventRepository.findAll(1000, 0);
    const spotlightEvents = allEvents.filter((event) => {
      const eventDate = event.date instanceof Date ? event.date : new Date(event.date);
      if (Number.isNaN(eventDate.getTime())) return false;
      const mk = `${eventDate.getFullYear()}-${String(eventDate.getMonth() + 1).padStart(2, '0')}`;
      return months.includes(mk) && isSpotlightCategory(event.category);
    });

    const presenceEntries = await Promise.all(
      spotlightEvents.map(async (event) => {
        try {
          const presences = await eventRepository.getPresences(event.id);
          const presentCount = (presences || []).filter((p) => p.present === true).length;
          const eventDate = event.date instanceof Date ? event.date : new Date(event.date);
          const mk = `${eventDate.getFullYear()}-${String(eventDate.getMonth() + 1).padStart(2, '0')}`;
          return { monthKey: mk, presentCount };
        } catch (error) {
          console.error(`[Spotlight Progression] Erreur présences événement ${event.id}:`, error);
          const eventDate = event.date instanceof Date ? event.date : new Date(event.date);
          const mk = `${eventDate.getFullYear()}-${String(eventDate.getMonth() + 1).padStart(2, '0')}`;
          return { monthKey: mk, presentCount: 0 };
        }
      })
    );

    const byMonth = new Map<string, { presentTotal: number; spotlightCount: number }>();
    for (const mk of months) {
      byMonth.set(mk, { presentTotal: 0, spotlightCount: 0 });
    }
    for (const entry of presenceEntries) {
      const current = byMonth.get(entry.monthKey);
      if (!current) continue;
      current.presentTotal += entry.presentCount;
      current.spotlightCount += 1;
      byMonth.set(entry.monthKey, current);
    }

    const progressionData: Array<{ month: string; value: number }> = months.map((mk) => {
      const data = byMonth.get(mk) || { presentTotal: 0, spotlightCount: 0 };
      // Valeur = moyenne de présents par événement Spotlight du mois.
      const value = data.spotlightCount > 0
        ? Math.round((data.presentTotal / data.spotlightCount) * 10) / 10
        : 0;
      return { month: mk, value };
    });

    // Inverser pour avoir les mois dans l'ordre chronologique (du plus ancien au plus récent)
    progressionData.reverse();

    // Formater les mois pour l'affichage
    const monthNames = ["Janv", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sept", "Oct", "Nov", "Déc"];
    const formattedData = progressionData.map(item => {
      const [year, month] = item.month.split('-');
      const monthIndex = parseInt(month) - 1;
      return {
        month: `${monthNames[monthIndex]} ${year.slice(-2)}`,
        value: item.value,
      };
    });

    return NextResponse.json({
      success: true,
      data: formattedData,
    });
  } catch (error) {
    console.error('[Spotlight Progression API] Erreur:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/requireAdmin';
import { upsertDiscordDailyActivity } from '@/lib/discordDailyActivityStorage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST - Importe des données d'activité Discord quotidiennes (messages ou vocaux)
 * Body: { type: 'messages' | 'vocals', data: Array<{ date: string, value: number }> }
 */
export async function POST(request: NextRequest) {
  try {
    // Authentification NextAuth + permission write
    const admin = await requirePermission("write");
    
    if (!admin) {
      return NextResponse.json(
        { error: "Non authentifié ou permissions insuffisantes" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { type, data } = body;

    // Validation du type
    if (type !== 'messages' && type !== 'vocals') {
      return NextResponse.json(
        { error: "Le type doit être 'messages' ou 'vocals'" },
        { status: 400 }
      );
    }

    // Validation des données
    if (!data || !Array.isArray(data)) {
      return NextResponse.json(
        { error: "Les données doivent être un tableau" },
        { status: 400 }
      );
    }

    // Charger les données existantes
    const { loadDiscordDailyActivity } = await import('@/lib/discordDailyActivityStorage');
    const existing = await loadDiscordDailyActivity();
    const dateMap = new Map<string, { date: string; messages: number; vocals: number }>();

    // Charger les données existantes
    for (const point of existing.data || []) {
      dateMap.set(point.date, { date: point.date, messages: point.messages || 0, vocals: point.vocals || 0 });
    }

    // Mettre à jour avec les nouvelles données
    for (const item of data) {
      const date = item.date; // Format YYYY-MM-DD
      const value = typeof item.value === 'number' ? item.value : parseFloat(item.value);
      
      if (!date || isNaN(value)) continue;

      if (!dateMap.has(date)) {
        dateMap.set(date, { date, messages: 0, vocals: 0 });
      }

      const point = dateMap.get(date)!;
      if (type === 'messages') {
        point.messages = value;
      } else {
        point.vocals = value;
      }
    }

    // Convertir en tableau et sauvegarder
    const points = Array.from(dateMap.values()).map(p => ({
      date: p.date,
      messages: p.messages,
      vocals: p.vocals,
    }));

    await upsertDiscordDailyActivity(points, admin.discordId);

    return NextResponse.json({
      success: true,
      message: `Données ${type === 'messages' ? 'messages' : 'vocaux'} importées avec succès`,
    });
  } catch (error) {
    console.error('[API Discord Daily Activity Import] Erreur POST:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur inconnue' },
      { status: 500 }
    );
  }
}


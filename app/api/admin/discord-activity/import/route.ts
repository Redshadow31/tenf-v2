import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/adminAuth';
import { hasPermission } from '@/lib/adminRoles';
import {
  loadDiscordActivity,
  updateDiscordActivityForMonth,
} from '@/lib/discordActivityStorage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST - Importe des données d'activité Discord (messages ou vocaux)
 * Body: { month: string, type: 'messages' | 'vocals', data: ... }
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
    const { month, type, data } = body;

    // Validation du mois (format YYYY-MM)
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json(
        { error: "Le mois doit être au format YYYY-MM" },
        { status: 400 }
      );
    }

    // Validation du type
    if (type !== 'messages' && type !== 'vocals') {
      return NextResponse.json(
        { error: "Le type doit être 'messages' ou 'vocals'" },
        { status: 400 }
      );
    }

    // Validation des données
    if (!data || typeof data !== 'object') {
      return NextResponse.json(
        { error: "Les données doivent être un objet" },
        { status: 400 }
      );
    }

    // Mettre à jour les données d'activité Discord
    if (type === 'messages') {
      // data est Record<string, number>
      await updateDiscordActivityForMonth(month, {
        messagesByUser: data,
      });
    } else {
      // data est Record<string, { hoursDecimal, totalMinutes, display }>
      await updateDiscordActivityForMonth(month, {
        vocalsByUser: data,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Données ${type === 'messages' ? 'messages' : 'vocaux'} importées avec succès pour ${month}`,
    });
  } catch (error) {
    console.error('[API Discord Activity Import] Erreur POST:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur inconnue' },
      { status: 500 }
    );
  }
}


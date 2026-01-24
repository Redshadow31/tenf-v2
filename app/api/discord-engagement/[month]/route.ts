import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin, hasAdminDashboardAccess } from '@/lib/admin';
import { 
  getDiscordEngagementData, 
  saveDiscordEngagementData,
  type DiscordEngagementData 
} from '@/lib/discordEngagementStorage';

/**
 * GET - Récupère les données d'engagement Discord pour un mois
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { month: string } }
) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin || !hasAdminDashboardAccess(admin.discordId)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const { month } = params;

    if (!month.match(/^\d{4}-\d{2}$/)) {
      return NextResponse.json(
        { error: 'Format de mois invalide (attendu: YYYY-MM)' },
        { status: 400 }
      );
    }

    const data = await getDiscordEngagementData(month);

    return NextResponse.json({
      month,
      data: data || null,
    });
  } catch (error) {
    console.error('[Discord Engagement API] Erreur GET:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

/**
 * POST - Sauvegarde les données d'engagement Discord
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { month: string } }
) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin || !hasAdminDashboardAccess(admin.discordId)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const { month } = params;

    if (!month.match(/^\d{4}-\d{2}$/)) {
      return NextResponse.json(
        { error: 'Format de mois invalide (attendu: YYYY-MM)' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { dataByMember, hasMessagesImport, hasVocalsImport, messagesImportedAt, vocalsImportedAt } = body;

    const engagementData: DiscordEngagementData = {
      month,
      generatedAt: new Date().toISOString(),
      hasMessagesImport: hasMessagesImport || false,
      hasVocalsImport: hasVocalsImport || false,
      messagesImportedAt: messagesImportedAt || undefined,
      vocalsImportedAt: vocalsImportedAt || undefined,
      dataByMember: dataByMember || {},
    };

    await saveDiscordEngagementData(engagementData);

    return NextResponse.json({
      success: true,
      message: 'Données d\'engagement enregistrées avec succès',
    });
  } catch (error) {
    console.error('[Discord Engagement API] Erreur POST:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}


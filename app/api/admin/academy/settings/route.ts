import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/requireAdmin';
import { loadSettings, saveSettings } from '@/lib/academyStorage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET - Récupère les paramètres Academy
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    
    if (!admin) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 403 }
      );
    }

    const settings = await loadSettings();
    return NextResponse.json({ settings });
  } catch (error) {
    console.error('[Admin Academy Settings API] Erreur GET:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

/**
 * PUT - Met à jour les paramètres Academy
 * Body: { enabled?: boolean, allowedDiscordRoles?: string[] }
 */
export async function PUT(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    
    if (!admin) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const currentSettings = await loadSettings();
    
    const updatedSettings = {
      ...currentSettings,
      ...body,
      lastUpdated: new Date().toISOString(),
      updatedBy: admin.discordId,
    };

    await saveSettings(updatedSettings);
    return NextResponse.json({ success: true, settings: updatedSettings });
  } catch (error) {
    console.error('[Admin Academy Settings API] Erreur PUT:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

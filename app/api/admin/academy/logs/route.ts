import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/requireAdmin';
import { loadLogs } from '@/lib/academyStorage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET - Récupère les logs Academy
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

    const logs = await loadLogs();
    // Trier par timestamp décroissant (plus récent en premier)
    logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    return NextResponse.json({ logs });
  } catch (error) {
    console.error('[Admin Academy Logs API] Erreur GET:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

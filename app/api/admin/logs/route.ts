import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/requireAdmin';
import { logger, LogCategory, LogLevel } from '@/lib/logging/logger';

/**
 * GET - Récupère les logs avec filtres
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    
    if (!admin) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') as LogCategory | null;
    const level = searchParams.get('level') as LogLevel | null;
    const since = searchParams.get('since');
    const limit = searchParams.get('limit');

    const filters: any = {};
    if (category) filters.category = category;
    if (level) filters.level = level;
    if (since) filters.since = new Date(since);
    if (limit) filters.limit = parseInt(limit, 10);

    const logs = logger.getLogs(filters);
    const stats = logger.getStats();

    return NextResponse.json({
      logs,
      stats,
      total: logs.length,
    });
  } catch (error) {
    console.error('[API Admin Logs] Erreur:', error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Vide les logs
 */
export async function DELETE(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    
    if (!admin) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    logger.clear();    return NextResponse.json({ success: true, message: "Logs vidés" });
  } catch (error) {
    console.error('[API Admin Logs] Erreur:', error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

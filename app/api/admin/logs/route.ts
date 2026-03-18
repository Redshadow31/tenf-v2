import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, requireRole } from '@/lib/requireAdmin';
import { logger, LogCategory, LogLevel } from '@/lib/logging/logger';
import { logAction } from '@/lib/admin/logger';

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
    const offset = searchParams.get('offset');

    const filters: any = {};
    if (category) filters.category = category;
    if (level) filters.level = level;
    if (since) filters.since = new Date(since);
    if (limit) filters.limit = parseInt(limit, 10);
    if (offset) filters.offset = parseInt(offset, 10);

    const logs = await logger.getLogs(filters);
    const stats = await logger.getStats();

    return NextResponse.json({
      logs,
      stats,
      total: stats.total,
      hasMore: logs.length === (filters.limit || 50),
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
    const admin = await requireRole("FONDATEUR");
    
    if (!admin) {
      return NextResponse.json(
        { error: "Réservé aux fondateurs" },
        { status: 403 }
      );
    }

    let reason: string | undefined;
    try {
      const body = await request.json();
      if (typeof body?.reason === "string" && body.reason.trim().length > 0) {
        reason = body.reason.trim().slice(0, 500);
      }
    } catch {
      // Corps optionnel : garder compatible avec les appels DELETE existants.
    }

    const statsBefore = await logger.getStats();
    await logger.clear();

    await logAction({
      action: "admin.logs.clear",
      resourceType: "system_logs",
      resourceId: "global",
      previousValue: { total: statsBefore.total },
      newValue: { total: 0 },
      metadata: {
        sourcePage: "/admin/log-center",
        reason,
      },
    });
    
    return NextResponse.json({ success: true, message: "Logs vidés" });
  } catch (error) {
    console.error('[API Admin Logs] Erreur:', error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

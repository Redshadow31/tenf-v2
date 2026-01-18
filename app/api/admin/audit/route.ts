import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/requireAdmin';
import { getAllAuditLogs, revertAction, type AuditLog } from '@/lib/adminAudit';

/**
 * GET - Récupère les logs d'audit (founders uniquement)
 */
export async function GET(request: NextRequest) {
  try {
    // Authentification NextAuth + rôle FOUNDER requis
    const admin = await requireRole("FOUNDER");
    
    if (!admin) {
      return NextResponse.json(
        { error: 'Non authentifié ou accès refusé. Réservé aux fondateurs.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const filters: {
      actorDiscordId?: string;
      action?: string;
      resourceType?: string;
      reverted?: boolean;
      limit?: number;
    } = {};
    
    const month = searchParams.get('month'); // YYYY-MM format
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    if (searchParams.get('actorDiscordId')) {
      filters.actorDiscordId = searchParams.get('actorDiscordId')!;
    }
    if (searchParams.get('action')) {
      filters.action = searchParams.get('action')!;
    }
    if (searchParams.get('resourceType')) {
      filters.resourceType = searchParams.get('resourceType')!;
    }
    if (searchParams.get('reverted')) {
      filters.reverted = searchParams.get('reverted') === 'true';
    }
    filters.limit = limit + offset; // Charger plus pour pouvoir faire le slice

    // Si month est spécifié, utiliser getAuditLogs (plus performant)
    // Sinon, utiliser getAllAuditLogs (compatibilité backward)
    let logs;
    if (month) {
      const { getAuditLogs } = await import('@/lib/adminAudit');
      logs = await getAuditLogs(month, filters);
    } else {
      logs = await getAllAuditLogs(filters);
    }

    // Appliquer la pagination (slice)
    const paginatedLogs = logs.slice(offset, offset + limit);
    const hasMore = logs.length > offset + limit;

    return NextResponse.json({
      logs: paginatedLogs,
      total: logs.length,
      hasMore,
      offset,
      limit,
    });
  } catch (error) {
    console.error('[Audit API] Erreur:', error);
    return NextResponse.json(
      { error: `Erreur serveur: ${error instanceof Error ? error.message : 'Erreur inconnue'}` },
      { status: 500 }
    );
  }
}

/**
 * POST - Annule une action (revert) - founders uniquement
 */
export async function POST(request: NextRequest) {
  try {
    // Authentification NextAuth + rôle FOUNDER requis
    const admin = await requireRole("FOUNDER");
    
    if (!admin) {
      return NextResponse.json(
        { error: 'Non authentifié ou accès refusé. Réservé aux fondateurs.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { logId } = body;

    if (!logId || typeof logId !== 'string') {
      return NextResponse.json(
        { error: 'logId requis' },
        { status: 400 }
      );
    }

    // Le rôle est déjà dans l'objet admin depuis requireRole
    const revertLog = await revertAction(
      logId,
      admin.discordId,
      admin.role,
      admin.username
    );

    return NextResponse.json({
      success: true,
      revertLog,
      message: 'Action annulée avec succès',
    });
  } catch (error) {
    console.error('[Audit API] Erreur revert:', error);
    return NextResponse.json(
      { error: `Erreur serveur: ${error instanceof Error ? error.message : 'Erreur inconnue'}` },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/admin';
import { isFounder } from '@/lib/adminRoles';
import { getAllAuditLogs, revertAction, type AuditLog } from '@/lib/adminAudit';

/**
 * GET - Récupère les logs d'audit (founders uniquement)
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    
    if (!admin) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    if (!isFounder(admin.id)) {
      return NextResponse.json(
        { error: 'Accès refusé. Réservé aux fondateurs.' },
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
    if (searchParams.get('limit')) {
      filters.limit = parseInt(searchParams.get('limit')!, 10);
    }

    const logs = await getAllAuditLogs(filters);

    return NextResponse.json({
      logs,
      total: logs.length,
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
    const admin = await getCurrentAdmin();
    
    if (!admin) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    if (!isFounder(admin.id)) {
      return NextResponse.json(
        { error: 'Accès refusé. Réservé aux fondateurs.' },
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

    const { getAdminRole } = await import('@/lib/adminRoles');
    const role = getAdminRole(admin.id);
    
    if (!role) {
      return NextResponse.json(
        { error: 'Rôle non trouvé' },
        { status: 403 }
      );
    }

    const revertLog = await revertAction(
      logId,
      admin.id,
      role,
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


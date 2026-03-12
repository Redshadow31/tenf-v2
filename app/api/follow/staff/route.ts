import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/requireAdmin';
import { loadFollowStaffList } from '@/lib/followStaffStorage';

/**
 * GET - Liste des membres du staff pour le suivi des follows
 * Retourne tous (actifs + inactifs) pour permettre l'accès aux pages historiques
 */
export async function GET() {
  try {
    const admin = await requirePermission('read');
    if (!admin) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const staff = await loadFollowStaffList();
    return NextResponse.json({ staff });
  } catch (e) {
    console.error('[API Follow Staff] Erreur:', e);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/requireAdmin';
import {
  loadFollowStaffList,
  saveFollowStaffList,
  type FollowStaffEntry,
} from '@/lib/followStaffStorage';

/**
 * GET - Liste complète du staff (actifs + inactifs) - fondateurs uniquement
 */
export async function GET() {
  try {
    const admin = await requireRole('FOUNDER');
    if (!admin) {
      return NextResponse.json({ error: 'Réservé aux fondateurs' }, { status: 403 });
    }

    const staff = await loadFollowStaffList();
    return NextResponse.json({ staff });
  } catch (e) {
    console.error('[API Admin Follow Staff] GET erreur:', e);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

/**
 * PUT - Met à jour la liste complète - fondateurs uniquement
 */
export async function PUT(request: NextRequest) {
  try {
    const admin = await requireRole('FOUNDER');
    if (!admin) {
      return NextResponse.json({ error: 'Réservé aux fondateurs' }, { status: 403 });
    }

    const body = await request.json();
    const staff = body.staff as FollowStaffEntry[];

    if (!Array.isArray(staff)) {
      return NextResponse.json(
        { error: 'Format invalide : { staff: [...] } attendu' },
        { status: 400 }
      );
    }

    // Validation minimale
    const valid = staff.every(
      (e) =>
        typeof e.slug === 'string' &&
        e.slug.length > 0 &&
        typeof e.displayName === 'string' &&
        typeof e.isActive === 'boolean'
    );
    if (!valid) {
      return NextResponse.json(
        { error: 'Chaque entrée doit avoir slug, displayName et isActive' },
        { status: 400 }
      );
    }

    const withOrder = staff.map((e, i) => ({
      slug: e.slug.trim().toLowerCase().replace(/\s+/g, '-'),
      displayName: e.displayName.trim(),
      isActive: e.isActive,
      order: typeof e.order === 'number' ? e.order : i,
    }));

    await saveFollowStaffList(withOrder);

    return NextResponse.json({ success: true, staff: withOrder });
  } catch (e) {
    console.error('[API Admin Follow Staff] PUT erreur:', e);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

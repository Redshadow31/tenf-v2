import { NextResponse } from 'next/server';
import { getAllEvents, getMemberEvents, recordMemberEvent } from '@/lib/memberEvents';
import { requirePermission } from '@/lib/requireAdmin';

/**
 * GET - Récupère les événements avec filtres optionnels
 */
export async function GET(request: Request) {
  try {
    // Authentification NextAuth + permission read
    const admin = await requirePermission("read");
    
    if (!admin) {
      return NextResponse.json(
        { error: "Non authentifié ou permissions insuffisantes" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('memberId');
    const type = searchParams.get('type');
    const source = searchParams.get('source') as any;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;

    const events = await getAllEvents({
      memberId: memberId || undefined,
      type: type || undefined,
      source: source || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      limit,
    });

    return NextResponse.json({ events });
  } catch (error) {
    console.error('Error fetching member events:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST - Enregistre un nouvel événement
 */
export async function POST(request: Request) {
  try {
    // Authentification NextAuth + permission write
    const admin = await requirePermission("write");
    
    if (!admin) {
      return NextResponse.json(
        { error: "Non authentifié ou permissions insuffisantes" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { memberId, type, source, actor, payload } = body;

    if (!memberId || !type) {
      return NextResponse.json(
        { error: "memberId et type sont requis" },
        { status: 400 }
      );
    }

    const event = await recordMemberEvent(memberId, type, {
      source: source || 'manual',
      actor: actor || admin.discordId,
      payload,
    });

    return NextResponse.json({ success: true, event });
  } catch (error) {
    console.error('Error recording member event:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


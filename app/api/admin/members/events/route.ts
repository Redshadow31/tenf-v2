import { NextResponse } from 'next/server';
import { getAllEvents, getMemberEvents } from '@/lib/memberEvents';
import { getCurrentAdmin } from '@/lib/admin';

/**
 * GET - Récupère les événements avec filtres optionnels
 */
export async function GET(request: Request) {
  try {
    // Vérifier l'authentification
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json(
        { error: "Non authentifié" },
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


// API Route pour Section A - Présence Active
import { NextRequest, NextResponse } from 'next/server';
import { loadSectionAData, saveSectionAData, SectionAData, SpotlightEvaluation, EventEvaluation } from '@/lib/evaluationStorage';
import { getCurrentAdmin } from '@/lib/admin';
import { hasPermission } from '@/lib/adminRoles';

export async function GET(request: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin || !hasPermission(admin.id, 'read')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const monthKey = searchParams.get('month');
    
    if (!monthKey || !/^\d{4}-\d{2}$/.test(monthKey)) {
      return NextResponse.json({ error: 'Month key invalide (format: YYYY-MM)' }, { status: 400 });
    }

    const data = await loadSectionAData(monthKey);
    
    if (!data) {
      // Initialiser avec structure vide
      const emptyData: SectionAData = {
        month: monthKey,
        spotlights: [],
        events: [],
        raidPoints: {},
        spotlightBonus: {},
        lastUpdated: new Date().toISOString(),
      };
      return NextResponse.json({ data: emptyData });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('[API Evaluations Section A] Erreur:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin || !hasPermission(admin.id, 'write')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const body = await request.json();
    const { month, action, payload } = body;

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json({ error: 'Month key invalide' }, { status: 400 });
    }

    const loadedData = await loadSectionAData(month);
    const existingData: SectionAData = loadedData || {
      month,
      spotlights: [],
      events: [],
      raidPoints: {},
      spotlightBonus: {},
      lastUpdated: new Date().toISOString(),
    };

    switch (action) {
      case 'add-spotlight':
        const spotlight: SpotlightEvaluation = {
          ...payload,
          id: payload.id || `spotlight-${Date.now()}`,
          createdAt: payload.createdAt || new Date().toISOString(),
          createdBy: admin.id,
        };
        existingData.spotlights.push(spotlight);
        break;

      case 'update-spotlight':
        const spotlightIndex = existingData.spotlights.findIndex(s => s.id === payload.id);
        if (spotlightIndex >= 0) {
          existingData.spotlights[spotlightIndex] = {
            ...existingData.spotlights[spotlightIndex],
            ...payload,
          };
        }
        break;

      case 'add-event':
        const event: EventEvaluation = {
          ...payload,
          id: payload.id || `event-${Date.now()}`,
          createdAt: payload.createdAt || new Date().toISOString(),
          createdBy: admin.id,
        };
        existingData.events.push(event);
        break;

      case 'update-event':
        const eventIndex = existingData.events.findIndex(e => e.id === payload.id);
        if (eventIndex >= 0) {
          existingData.events[eventIndex] = {
            ...existingData.events[eventIndex],
            ...payload,
          };
        }
        break;

      default:
        return NextResponse.json({ error: 'Action inconnue' }, { status: 400 });
    }

    existingData.lastUpdated = new Date().toISOString();
    await saveSectionAData(existingData);

    return NextResponse.json({ success: true, data: existingData });
  } catch (error) {
    console.error('[API Evaluations Section A] Erreur POST:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}


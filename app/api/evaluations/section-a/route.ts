// API Route pour Section A - Présence Active
import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/requireAdmin';
import { evaluationRepository, memberRepository } from '@/lib/repositories';

export async function GET(request: NextRequest) {
  try {
    const admin = await requirePermission('read');
    if (!admin) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const monthKey = searchParams.get('month');
    
    if (!monthKey || !/^\d{4}-\d{2}$/.test(monthKey)) {
      return NextResponse.json({ error: 'Month key invalide (format: YYYY-MM)' }, { status: 400 });
    }

    // Récupérer toutes les évaluations du mois depuis Supabase
    const evaluations = await evaluationRepository.findByMonth(monthKey);
    
    // Agréger les données de la Section A depuis toutes les évaluations
    const spotlights: any[] = [];
    const events: any[] = [];
    const raidPoints: Record<string, number> = {};
    const spotlightBonus: Record<string, number> = {};
    let lastUpdated: string | undefined = undefined;

    evaluations.forEach(eval => {
      // Collecter les spotlightEvaluations (dédupliqués par ID)
      if (eval.spotlightEvaluations && Array.isArray(eval.spotlightEvaluations)) {
        eval.spotlightEvaluations.forEach((spotlight: any) => {
          if (!spotlights.find(s => s.id === spotlight.id)) {
            spotlights.push(spotlight);
          }
        });
      }

      // Collecter les eventEvaluations (dédupliqués par ID)
      if (eval.eventEvaluations && Array.isArray(eval.eventEvaluations)) {
        eval.eventEvaluations.forEach((event: any) => {
          if (!events.find(e => e.id === event.id)) {
            events.push(event);
          }
        });
      }

      // Collecter les raidPoints
      if (eval.raidPoints !== undefined && eval.raidPoints !== null) {
        raidPoints[eval.twitchLogin.toLowerCase()] = eval.raidPoints;
      }

      // Collecter les spotlightBonus
      if (eval.spotlightBonus !== undefined && eval.spotlightBonus !== null) {
        spotlightBonus[eval.twitchLogin.toLowerCase()] = eval.spotlightBonus;
      }

      // Garder la date de mise à jour la plus récente
      if (eval.updatedAt && (!lastUpdated || eval.updatedAt.toISOString() > lastUpdated)) {
        lastUpdated = eval.updatedAt.toISOString();
      }
    });

    const data = {
      month: monthKey,
      spotlights,
      events,
      raidPoints,
      spotlightBonus,
      lastUpdated: lastUpdated || new Date().toISOString(),
    };

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
    const admin = await requirePermission('write');
    if (!admin) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const body = await request.json();
    const { month, action, payload } = body;

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json({ error: 'Month key invalide' }, { status: 400 });
    }

    const monthDate = `${month}-01`;

    // Pour les actions qui modifient spotlightEvaluations ou eventEvaluations,
    // on doit mettre à jour toutes les évaluations qui contiennent ces données
    // ou créer une nouvelle évaluation pour un membre spécifique si nécessaire

    switch (action) {
      case 'add-spotlight': {
        const spotlight = {
          ...payload,
          id: payload.id || `spotlight-${Date.now()}`,
          date: payload.date || new Date().toISOString(),
          createdBy: admin.id,
        };

        // Si un twitchLogin est fourni, mettre à jour l'évaluation de ce membre
        if (payload.twitchLogin) {
          let evaluation = await evaluationRepository.findByMemberAndMonth(payload.twitchLogin, month);
          const spotlightEvaluations = evaluation?.spotlightEvaluations || [];
          
          // Vérifier si cette spotlight existe déjà
          const existingIndex = spotlightEvaluations.findIndex((s: any) => s.id === spotlight.id);
          if (existingIndex >= 0) {
            spotlightEvaluations[existingIndex] = spotlight;
          } else {
            spotlightEvaluations.push(spotlight);
          }

          await evaluationRepository.upsert({
            month: new Date(monthDate),
            twitchLogin: payload.twitchLogin.toLowerCase(),
            spotlightEvaluations,
            updatedAt: new Date(),
          });
        }
        break;
      }

      case 'update-spotlight': {
        // Mettre à jour toutes les évaluations qui contiennent cette spotlight
        const evaluations = await evaluationRepository.findByMonth(month);
        
        for (const eval of evaluations) {
          if (eval.spotlightEvaluations && Array.isArray(eval.spotlightEvaluations)) {
            const spotlightIndex = eval.spotlightEvaluations.findIndex((s: any) => s.id === payload.id);
            if (spotlightIndex >= 0) {
              eval.spotlightEvaluations[spotlightIndex] = {
                ...eval.spotlightEvaluations[spotlightIndex],
                ...payload,
              };

              await evaluationRepository.upsert({
                month: new Date(monthDate),
                twitchLogin: eval.twitchLogin,
                spotlightEvaluations: eval.spotlightEvaluations,
                updatedAt: new Date(),
              });
            }
          }
        }
        break;
      }

      case 'add-event': {
        const event = {
          ...payload,
          id: payload.id || `event-${Date.now()}`,
          createdAt: payload.createdAt || new Date().toISOString(),
          createdBy: admin.id,
        };

        // Si un twitchLogin est fourni, mettre à jour l'évaluation de ce membre
        if (payload.twitchLogin) {
          let evaluation = await evaluationRepository.findByMemberAndMonth(payload.twitchLogin, month);
          const eventEvaluations = evaluation?.eventEvaluations || [];
          
          // Vérifier si cet événement existe déjà
          const existingIndex = eventEvaluations.findIndex((e: any) => e.id === event.id);
          if (existingIndex >= 0) {
            eventEvaluations[existingIndex] = event;
          } else {
            eventEvaluations.push(event);
          }

          await evaluationRepository.upsert({
            month: new Date(monthDate),
            twitchLogin: payload.twitchLogin.toLowerCase(),
            eventEvaluations,
            updatedAt: new Date(),
          });
        }
        break;
      }

      case 'update-event': {
        // Mettre à jour toutes les évaluations qui contiennent cet événement
        const evaluations = await evaluationRepository.findByMonth(month);
        
        for (const eval of evaluations) {
          if (eval.eventEvaluations && Array.isArray(eval.eventEvaluations)) {
            const eventIndex = eval.eventEvaluations.findIndex((e: any) => e.id === payload.id);
            if (eventIndex >= 0) {
              eval.eventEvaluations[eventIndex] = {
                ...eval.eventEvaluations[eventIndex],
                ...payload,
              };

              await evaluationRepository.upsert({
                month: new Date(monthDate),
                twitchLogin: eval.twitchLogin,
                eventEvaluations: eval.eventEvaluations,
                updatedAt: new Date(),
              });
            }
          }
        }
        break;
      }

      default:
        return NextResponse.json({ error: 'Action inconnue' }, { status: 400 });
    }

    // Retourner les données mises à jour
    const evaluations = await evaluationRepository.findByMonth(month);
    const spotlights: any[] = [];
    const events: any[] = [];
    const raidPoints: Record<string, number> = {};
    const spotlightBonus: Record<string, number> = {};
    let lastUpdated: string | undefined = undefined;

    evaluations.forEach(eval => {
      if (eval.spotlightEvaluations && Array.isArray(eval.spotlightEvaluations)) {
        eval.spotlightEvaluations.forEach((spotlight: any) => {
          if (!spotlights.find(s => s.id === spotlight.id)) {
            spotlights.push(spotlight);
          }
        });
      }
      if (eval.eventEvaluations && Array.isArray(eval.eventEvaluations)) {
        eval.eventEvaluations.forEach((event: any) => {
          if (!events.find(e => e.id === event.id)) {
            events.push(event);
          }
        });
      }
      if (eval.raidPoints !== undefined && eval.raidPoints !== null) {
        raidPoints[eval.twitchLogin.toLowerCase()] = eval.raidPoints;
      }
      if (eval.spotlightBonus !== undefined && eval.spotlightBonus !== null) {
        spotlightBonus[eval.twitchLogin.toLowerCase()] = eval.spotlightBonus;
      }
      if (eval.updatedAt && (!lastUpdated || eval.updatedAt.toISOString() > lastUpdated)) {
        lastUpdated = eval.updatedAt.toISOString();
      }
    });

    const data = {
      month,
      spotlights,
      events,
      raidPoints,
      spotlightBonus,
      lastUpdated: lastUpdated || new Date().toISOString(),
    };

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('[API Evaluations Section A] Erreur POST:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}


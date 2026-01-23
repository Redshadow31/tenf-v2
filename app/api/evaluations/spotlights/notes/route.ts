import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/requireAdmin';
import { evaluationRepository } from '@/lib/repositories';
import { getCurrentMonthKey } from '@/lib/evaluationStorage';

// Forcer l'utilisation du runtime Node.js (nécessaire pour @netlify/blobs)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET - Récupère toutes les notes d'évaluation pour un mois
 * Query params: ?month=YYYY-MM
 */
export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const admin = await requirePermission("read");
    if (!admin) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const monthParam = searchParams.get('month');

    // Déterminer le monthKey
    let monthKey: string;
    if (monthParam) {
      const monthMatch = monthParam.match(/^(\d{4})-(\d{2})$/);
      if (monthMatch) {
        const year = parseInt(monthMatch[1]);
        const monthNum = parseInt(monthMatch[2]);
        if (monthNum >= 1 && monthNum <= 12) {
          monthKey = monthParam;
        } else {
          return NextResponse.json({ error: "Mois invalide" }, { status: 400 });
        }
      } else {
        monthKey = getCurrentMonthKey();
      }
    } else {
      monthKey = getCurrentMonthKey();
    }

    // Récupérer toutes les évaluations du mois depuis Supabase
    const evaluations = await evaluationRepository.findByMonth(monthKey);
    
    // Construire l'objet notes depuis spotlightEvaluations
    const notes: Record<string, string> = {};
    let lastUpdated: string | undefined = undefined;
    
    evaluations.forEach(eval => {
      if (eval.spotlightEvaluations && Array.isArray(eval.spotlightEvaluations)) {
        eval.spotlightEvaluations.forEach((spotlightEval: any) => {
          if (spotlightEval.members && Array.isArray(spotlightEval.members)) {
            spotlightEval.members.forEach((member: any) => {
              if (member.twitchLogin && member.comment) {
                const login = member.twitchLogin.toLowerCase();
                notes[login] = member.comment;
                
                // Garder la date de mise à jour la plus récente
                if (spotlightEval.validatedAt && (!lastUpdated || spotlightEval.validatedAt > lastUpdated)) {
                  lastUpdated = spotlightEval.validatedAt;
                }
              }
            });
          }
        });
      }
    });
    
    return NextResponse.json({
      month: monthKey,
      notes,
      lastUpdated,
    });
  } catch (error) {
    console.error('[API Spotlight Evaluation Notes] Erreur GET:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur inconnue' },
      { status: 500 }
    );
  }
}

/**
 * PUT - Met à jour ou crée une note d'évaluation pour un membre
 * Body: { month: string, twitchLogin: string, note: string | undefined }
 */
export async function PUT(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const admin = await requirePermission("write");
    if (!admin) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { month, twitchLogin, note } = body;

    if (!month || !twitchLogin) {
      return NextResponse.json(
        { error: "month et twitchLogin sont requis" },
        { status: 400 }
      );
    }

    // Valider le format du mois
    const monthMatch = month.match(/^(\d{4})-(\d{2})$/);
    if (!monthMatch) {
      return NextResponse.json({ error: "Format de mois invalide (attendu: YYYY-MM)" }, { status: 400 });
    }

    const year = parseInt(monthMatch[1]);
    const monthNum = parseInt(monthMatch[2]);
    if (monthNum < 1 || monthNum > 12) {
      return NextResponse.json({ error: "Mois invalide" }, { status: 400 });
    }

    const monthKey = month; // Utiliser directement le format YYYY-MM
    const monthDate = `${month}-01`;

    // Récupérer l'évaluation existante ou en créer une nouvelle
    let evaluation = await evaluationRepository.findByMemberAndMonth(twitchLogin, month);
    
    // Préparer les spotlightEvaluations
    let spotlightEvaluations: Array<any> = evaluation?.spotlightEvaluations || [];
    
    // Mettre à jour la note dans toutes les évaluations de spotlight du mois
    // On doit trouver toutes les spotlightEvaluations qui contiennent ce membre
    let updated = false;
    spotlightEvaluations = spotlightEvaluations.map((spotlightEval: any) => {
      if (spotlightEval.members && Array.isArray(spotlightEval.members)) {
        const updatedMembers = spotlightEval.members.map((member: any) => {
          if (member.twitchLogin?.toLowerCase() === twitchLogin.toLowerCase()) {
            updated = true;
            return {
              ...member,
              comment: note || undefined,
            };
          }
          return member;
        });
        
        return {
          ...spotlightEval,
          members: updatedMembers,
        };
      }
      return spotlightEval;
    });
    
    // Si aucune évaluation de spotlight n'a été trouvée pour ce membre, on ne peut pas ajouter de note
    // car on ne sait pas à quelle spotlight elle appartient
    if (!updated && note) {
      return NextResponse.json(
        { error: "Aucune évaluation de spotlight trouvée pour ce membre ce mois-ci" },
        { status: 404 }
      );
    }

    // Mettre à jour ou créer l'évaluation
    await evaluationRepository.upsert({
      month: new Date(monthDate),
      twitchLogin: twitchLogin.toLowerCase(),
      spotlightEvaluations,
      updatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: "Note mise à jour avec succès",
      note: note || null,
    });
  } catch (error) {
    console.error('[API Spotlight Evaluation Notes] Erreur PUT:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur inconnue' },
      { status: 500 }
    );
  }
}



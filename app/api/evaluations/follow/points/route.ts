import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/requireAdmin';
import { memberRepository, evaluationRepository } from '@/lib/repositories';
import { getCurrentMonthKey } from '@/lib/evaluationStorage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Fonction de normalisation pour les logins (identique à la page C)
 */
function normalizeLogin(x: string): string {
  return (x || "").trim().toLowerCase();
}

/**
 * Détermine si, dans UNE feuille de validation, le membre "login"
 * est marqué comme "me suit" (retour de follow) pour le modo en question.
 * Supporte plusieurs structures de stockage (identique à la page C)
 */
function memberFollowsStaffInSheet(sheet: any, memberLogin: string): boolean {
  const login = normalizeLogin(memberLogin);
  if (!login) return false;

  // Format A: sheet.follows = ["login1", "login2", ...]  (liste de ceux qui suivent le modo)
  if (Array.isArray(sheet?.follows)) {
    return sheet.follows.map(normalizeLogin).includes(login);
  }

  // Format B: sheet.members = { "login": { followsMe: true } }
  if (sheet?.members && typeof sheet.members === "object" && !Array.isArray(sheet.members)) {
    const entry = sheet.members[login] || sheet.members[memberLogin] || sheet.members[normalizeLogin(memberLogin)];
    return Boolean(entry?.followsMe);
  }

  // Format C: sheet.rows = [{ login, followsMe }, ...] ou meSuit
  if (Array.isArray(sheet?.rows)) {
    const row = sheet.rows.find((r: any) => normalizeLogin(r.login || r.user) === login);
    return Boolean(row?.followsMe ?? row?.meSuit);
  }

  // Format D: sheet.membersArray (format actuel) avec meSuit
  if (Array.isArray(sheet?.membersArray)) {
    const member = sheet.membersArray.find((m: any) => normalizeLogin(m.twitchLogin) === login);
    return Boolean(member?.meSuit === true);
  }

  // Format D alternatif: sheet.members (array) avec meSuit
  if (Array.isArray(sheet?.members)) {
    const member = sheet.members.find((m: any) => normalizeLogin(m.twitchLogin) === login);
    return Boolean(member?.meSuit === true);
  }

  return false;
}

/**
 * Calcule les scores (identique à la page C)
 */
function computeScores(members: string[], sheets: any[], maxPoints = 5) {
  const totalSheets = sheets.length;

  // aucune feuille → tout à 0
  if (totalSheets === 0) {
    return members.map(m => ({
      login: m,
      score: 0,
    }));
  }

  return members.map(login => {
    let count = 0;
    for (const s of sheets) {
      if (memberFollowsStaffInSheet(s, login)) count++;
    }
    const taux = count / totalSheets;
    const score = Math.round(taux * maxPoints * 100) / 100;
    return { login, score };
  });
}

/**
 * Trouve le mois le plus récent avec des validations de follow dans les évaluations
 * Pour l'instant, on utilise le mois actuel par défaut
 */
async function getLatestMonthWithFollowValidations(): Promise<string | null> {
  try {
    // Pour simplifier, on utilise le mois actuel
    // Si besoin, on pourra ajouter une requête Supabase pour trouver tous les mois uniques
    return getCurrentMonthKey();
  } catch (error) {
    console.error('[Follow Points API] Erreur récupération dernier mois:', error);
    return null;
  }
}

/**
 * GET - Récupère les points Follow depuis la dernière évaluation connue
 * (pas par mois, mais la dernière évaluation disponible)
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await requirePermission("read");
    if (!admin) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const monthParam = searchParams.get('month');
    
    // Déterminer le mois à utiliser
    let monthKey: string | null;
    if (monthParam && monthParam.match(/^\d{4}-\d{2}$/)) {
      monthKey = monthParam;
    } else {
      // Trouver le mois le plus récent avec des validations
      monthKey = await getLatestMonthWithFollowValidations();
    }
    
    if (!monthKey) {
      return NextResponse.json({ success: true, points: {}, month: null, message: "Aucune évaluation Follow trouvée" });
    }

    // Charger les membres actifs depuis Supabase
    // Récupérer tous les membres actifs (limite élevée)
    const allMembers = await memberRepository.findAll(1000, 0);
    const memberLogins = allMembers
      .filter(m => m.isActive !== false && m.twitchLogin)
      .map(m => m.twitchLogin.toLowerCase());

    // Récupérer toutes les évaluations du mois avec followValidations
    const evaluations = await evaluationRepository.findByMonth(monthKey);
    
    // Convertir les followValidations en format de feuilles de validation
    const validations: any[] = [];
    evaluations.forEach(eval => {
      if (eval.followValidations && eval.followValidations.length > 0) {
        eval.followValidations.forEach(validation => {
          // Créer une feuille de validation au format attendu par computeScores
          const sheet: any = {
            staffDiscordId: validation.staffDiscordId,
            staffTwitchLogin: validation.staffTwitchLogin,
            validatedAt: validation.validatedAt,
            members: {}, // Format B: { "login": { followsMe: true } }
          };
          
          // Convertir les follows en format membres
          Object.entries(validation.follows).forEach(([login, follows]) => {
            sheet.members[login.toLowerCase()] = { followsMe: follows };
          });
          
          validations.push(sheet);
        });
      }
    });

    // Calculer les scores (même logique que la page C)
    const scores = computeScores(memberLogins, validations, 5);

    // Convertir en map { twitchLogin: score }
    const pointsMap: Record<string, number> = {};
    scores.forEach(({ login, score }) => {
      pointsMap[login] = score;
    });

    return NextResponse.json({ 
      success: true, 
      points: pointsMap, 
      month: monthKey,
      message: `Évaluation trouvée : ${monthKey}`
    });
  } catch (error) {
    console.error('[API Evaluations Follow Points GET] Erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}



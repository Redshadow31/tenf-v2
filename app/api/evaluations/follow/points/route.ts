import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/requireAdmin';
import { memberRepository } from '@/lib/repositories';
import { getAllFollowValidationsForMonth, getLastMonthWithData } from '@/lib/followStorage';
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
 * GET - Récupère les points Follow pour le mois demandé depuis /admin/follow
 * (validations followStorage = même source que https://teamnewfamily.netlify.app/admin/follow)
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await requirePermission("read");
    if (!admin) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const monthParam = searchParams.get('month');

    let monthKey: string | null =
      monthParam && monthParam.match(/^\d{4}-\d{2}$/) ? monthParam : getCurrentMonthKey();

    if (!monthKey) {
      return NextResponse.json({ success: true, points: {}, month: null, dataSourceMonth: null });
    }

    // Charger les validations du mois depuis followStorage (même source que admin/follow)
    let allValidations = await getAllFollowValidationsForMonth(monthKey);
    let dataSourceMonth = monthKey;
    if (allValidations.length === 0) {
      const fallbackMonth = await getLastMonthWithData(monthKey);
      if (fallbackMonth) {
        allValidations = await getAllFollowValidationsForMonth(fallbackMonth);
        dataSourceMonth = fallbackMonth;
      }
    }

    // Charger les membres (actifs) pour la liste des logins
    const allMembers = await memberRepository.findAll(1000, 0);
    const memberLogins = allMembers
      .filter(m => m.isActive !== false && m.twitchLogin)
      .map(m => m.twitchLogin.toLowerCase());

    // Convertir chaque validation staff en "sheet" pour computeScores (format D: members array avec meSuit)
    const sheets = allValidations.map((v: any) => ({
      members: Array.isArray(v.members) ? v.members : [],
    }));

    const scores = computeScores(memberLogins, sheets, 5);

    const pointsMap: Record<string, number> = {};
    scores.forEach(({ login, score }) => {
      pointsMap[login] = score;
    });

    return NextResponse.json({
      success: true,
      points: pointsMap,
      month: monthKey,
      dataSourceMonth: dataSourceMonth !== monthKey ? dataSourceMonth : undefined,
      message: dataSourceMonth !== monthKey
        ? `Données Follow du mois ${dataSourceMonth} (aucune donnée pour ${monthKey})`
        : `Données Follow : ${monthKey}`,
    });
  } catch (error) {
    console.error('[API Evaluations Follow Points GET] Erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}



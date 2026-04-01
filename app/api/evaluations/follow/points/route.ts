import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/requireAdmin';
import { memberRepository } from '@/lib/repositories';
import { getAllFollowValidationsForMonth, getLastMonthWithData } from '@/lib/followStorage';
import { getCurrentMonthKey } from '@/lib/evaluationStorage';
import { getLatestFollowEngagementOverview } from '@/lib/admin/followEngagement';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const PAGE_SIZE = 1000;
const MAX_PAGES = 20;

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

async function fetchAllMembersForEvaluation() {
  const rows: any[] = [];
  for (let page = 0; page < MAX_PAGES; page++) {
    const offset = page * PAGE_SIZE;
    const chunk = await memberRepository.findAll(PAGE_SIZE, offset);
    if (!Array.isArray(chunk) || chunk.length === 0) break;
    rows.push(...chunk);
    if (chunk.length < PAGE_SIZE) break;
  }
  return rows;
}

/**
 * GET - Points Follow pour la synthèse évaluation :
 * - Feuilles staff (follow_validations) = même logique que /admin/communaute/engagement/feuilles-follow
 * - Dernier snapshot engagement Twitch = même source que /admin/communaute/engagement/follow
 * Si les deux sont disponibles : moyenne des deux notes (/5). Sinon la source disponible.
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

    // Charger tous les profils (actifs/inactifs/nouveaux) pour la liste des logins
    const allMembers = await fetchAllMembersForEvaluation();
    const memberLogins = allMembers
      .filter(m => m.twitchLogin)
      .map(m => m.twitchLogin.toLowerCase());

    // Convertir chaque validation staff en "sheet" pour computeScores (format D: members array avec meSuit)
    const sheets = allValidations.map((v: any) => ({
      members: Array.isArray(v.members) ? v.members : [],
    }));

    const scores = computeScores(memberLogins, sheets, 5);
    const sheetScoreByLogin = new Map<string, number>();
    scores.forEach(({ login, score }) => {
      sheetScoreByLogin.set(login, score);
    });

    const totalSheets = sheets.length;
    const snapshotScoreByLogin = new Map<string, number>();
    try {
      const overview = await getLatestFollowEngagementOverview();
      for (const row of overview?.rows || []) {
        const login = normalizeLogin(row?.memberTwitchLogin || "");
        if (!login) continue;
        if (row.state === "ok" && typeof row.followRate === "number") {
          snapshotScoreByLogin.set(
            login,
            Math.round((row.followRate / 100) * 5 * 100) / 100
          );
        }
      }
    } catch (e) {
      console.warn("[API Evaluations Follow Points] Snapshot engagement indisponible:", e);
    }

    const pointsMap: Record<string, number> = {};
    const hasSheets = totalSheets > 0;
    const hasAnySnapshot = snapshotScoreByLogin.size > 0;

    for (const login of memberLogins) {
      const sheetPts = sheetScoreByLogin.get(login) ?? 0;
      const snapPts = snapshotScoreByLogin.get(login);
      let finalPts: number;
      if (hasSheets && snapPts !== undefined) {
        finalPts = Math.round(((sheetPts + snapPts) / 2) * 100) / 100;
      } else if (hasSheets) {
        finalPts = sheetPts;
      } else if (snapPts !== undefined) {
        finalPts = snapPts;
      } else {
        finalPts = 0;
      }
      pointsMap[login] = finalPts;
    }

    let blendHint = "";
    if (hasSheets && hasAnySnapshot) {
      blendHint = "Moyenne feuilles staff + dernier snapshot engagement Twitch.";
    } else if (hasSheets) {
      blendHint = "Feuilles staff uniquement (snapshot engagement indisponible ou vide).";
    } else if (hasAnySnapshot) {
      blendHint = "Snapshot engagement uniquement (aucune feuille staff pour ce mois).";
    }

    return NextResponse.json({
      success: true,
      points: pointsMap,
      month: monthKey,
      dataSourceMonth: dataSourceMonth !== monthKey ? dataSourceMonth : undefined,
      followBlend: {
        sheetsCount: totalSheets,
        usedSnapshot: hasAnySnapshot,
        blended: hasSheets && hasAnySnapshot,
      },
      message: [
        dataSourceMonth !== monthKey
          ? `Feuilles follow : mois ${dataSourceMonth} (aucune pour ${monthKey})`
          : `Feuilles follow : ${monthKey}`,
        blendHint || undefined,
      ]
        .filter(Boolean)
        .join(" · "),
    });
  } catch (error) {
    console.error('[API Evaluations Follow Points GET] Erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}



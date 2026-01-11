import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/adminAuth';
import { hasPermission } from '@/lib/adminRoles';
import { listStaffFollowValidations } from '@/lib/followStorage';
import { getAllMemberData, loadMemberDataFromStorage } from '@/lib/memberData';

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
 * Liste tous les mois disponibles et retourne le plus récent
 */
async function getLatestMonth(): Promise<string | null> {
  try {
    const { getStore } = await import('@netlify/blobs');
    const isNetlify = typeof getStore === 'function' || 
                      !!process.env.NETLIFY || 
                      !!process.env.NETLIFY_DEV;
    
    if (isNetlify) {
      const store = getStore('tenf-follow-validations');
      const list = await store.list();
      
      // Extraire tous les mois uniques depuis les clés (format: YYYY-MM/staffSlug.json)
      const months = new Set<string>();
      for (const item of list.blobs ?? []) {
        const parts = item.key.split('/');
        if (parts.length >= 2 && parts[0].match(/^\d{4}-\d{2}$/)) {
          months.add(parts[0]);
        }
      }
      
      if (months.size === 0) return null;
      
      // Trier les mois et retourner le plus récent
      const sortedMonths = Array.from(months).sort((a, b) => {
        const [yearA, monthA] = a.split('-').map(Number);
        const [yearB, monthB] = b.split('-').map(Number);
        if (yearA !== yearB) return yearB - yearA;
        return monthB - monthA;
      });
      
      return sortedMonths[0];
    } else {
      // Développement local : lister les dossiers dans data/follow-validations
      const fs = await import('fs');
      const path = await import('path');
      const dataDir = path.default.join(process.cwd(), 'data', 'follow-validations');
      
      if (!fs.default.existsSync(dataDir)) return null;
      
      const dirs = fs.default.readdirSync(dataDir).filter((dir: string) => {
        return dir.match(/^\d{4}-\d{2}$/) && fs.default.statSync(path.default.join(dataDir, dir)).isDirectory();
      });
      
      if (dirs.length === 0) return null;
      
      // Trier et retourner le plus récent
      const sortedDirs = dirs.sort((a, b) => {
        const [yearA, monthA] = a.split('-').map(Number);
        const [yearB, monthB] = b.split('-').map(Number);
        if (yearA !== yearB) return yearB - yearA;
        return monthB - monthA;
      });
      
      return sortedDirs[0];
    }
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
    const admin = await getCurrentAdmin();
    if (!admin || !hasPermission(admin.id, "read")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    // Trouver le mois le plus récent avec des validations
    const latestMonth = await getLatestMonth();
    
    if (!latestMonth) {
      return NextResponse.json({ success: true, points: {}, month: null, message: "Aucune évaluation Follow trouvée" });
    }

    // Charger les membres actifs
    await loadMemberDataFromStorage();
    const allMembers = getAllMemberData();
    const memberLogins = allMembers
      .filter((m: any) => m.isActive !== false && m.twitchLogin)
      .map((m: any) => m.twitchLogin.toLowerCase());

    // Récupérer toutes les validations pour ce mois
    const validations = await listStaffFollowValidations(latestMonth);

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
      month: latestMonth,
      message: `Dernière évaluation trouvée : ${latestMonth}`
    });
  } catch (error) {
    console.error('[API Evaluations Follow Points GET] Erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}



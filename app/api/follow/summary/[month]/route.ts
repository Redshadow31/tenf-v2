import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/requireAdmin';
import { 
  getAllFollowValidationsForMonth,
  getLastMonthWithData,
  isValidationObsolete,
  calculateFollowStats 
} from '@/lib/followStorage';
import { getActiveFollowStaff } from '@/lib/followStaffStorage';
import { cacheGet, cacheSet, cacheKey } from '@/lib/cache';

const FOLLOW_SUMMARY_CURRENT_MONTH_TTL_SECONDS = 60;
const FOLLOW_SUMMARY_HISTORICAL_MONTH_TTL_SECONDS = 300;

/**
 * GET - Récupère le résumé des validations pour un mois donné
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { month: string } }
) {
  try {
    const admin = await requirePermission("read");
    if (!admin) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const { month } = params;

    // Vérifier le format du mois
    if (!month.match(/^\d{4}-\d{2}$/)) {
      return NextResponse.json(
        { error: 'Format de mois invalide (attendu: YYYY-MM)' },
        { status: 400 }
      );
    }

    const currentMonth = new Date().toISOString().slice(0, 7);
    const ttlSeconds =
      month === currentMonth
        ? FOLLOW_SUMMARY_CURRENT_MONTH_TTL_SECONDS
        : FOLLOW_SUMMARY_HISTORICAL_MONTH_TTL_SECONDS;
    const cacheKeyStr = cacheKey('api', 'follow', 'summary', month, 'v1');
    const cached = await cacheGet<any>(cacheKeyStr);
    if (cached) {
      return NextResponse.json(cached);
    }

    let allValidations = await getAllFollowValidationsForMonth(month);
    let dataSourceMonth = month;
    if (allValidations.length === 0) {
      const fallbackMonth = await getLastMonthWithData(month);
      if (fallbackMonth) {
        allValidations = await getAllFollowValidationsForMonth(fallbackMonth);
        dataSourceMonth = fallbackMonth;
      }
    }

    // Séparer les validations à jour et obsolètes
    const validValidations = allValidations.filter(v => !isValidationObsolete(v.validatedAt));
    const obsoleteValidations = allValidations.filter(v => isValidationObsolete(v.validatedAt));

    // Calculer les statistiques globales (uniquement à partir des validations à jour)
    // Utiliser totalRetour et totalJeSuis pour correspondre aux données des pages individuelles
    let totalFollowed = 0; // Total des follows retour (totalRetour)
    let totalMembers = 0; // Total des membres suivis (totalJeSuis)
    
    validValidations.forEach(validation => {
      const stats = calculateFollowStats(validation);
      totalFollowed += stats.totalRetour; // Utiliser totalRetour au lieu de followedCount
      totalMembers += stats.totalJeSuis; // Utiliser totalJeSuis au lieu de totalMembers
    });

    const averageFollowRate = totalMembers > 0 
      ? Math.round((totalFollowed / totalMembers) * 100 * 10) / 10 
      : 0;

    const staffList = await getActiveFollowStaff();

    // Créer le tableau récapitulatif (tous les staff, actifs et inactifs)
    const summary = staffList.map(({ slug, displayName }) => {
      const validation = allValidations.find(v => v.staffSlug === slug);
      const isObsolete = validation ? isValidationObsolete(validation.validatedAt) : false;
      const stats = validation ? calculateFollowStats(validation) : null;

      return {
        staffSlug: slug,
        staffName: displayName,
        lastValidationDate: validation?.validatedAt || null,
        followRate: stats?.tauxRetour || null, // Utiliser tauxRetour au lieu de followRate
        followedCount: stats?.totalRetour || null, // Utiliser totalRetour (follows retour) au lieu de followedCount
        totalMembers: stats?.totalJeSuis || null, // Utiliser totalJeSuis (membres suivis) au lieu de totalMembers
        status: validation 
          ? (isObsolete ? 'obsolete' : 'up_to_date')
          : 'not_validated',
      };
    });

    const payload = {
      month,
      dataSourceMonth,
      globalStats: {
        averageFollowRate,
        totalFollowed,
        totalMembers,
        validPagesCount: validValidations.length,
        obsoletePagesCount: obsoleteValidations.length,
      },
      summary,
    };

    await cacheSet(cacheKeyStr, payload, ttlSeconds);
    return NextResponse.json(payload);
  } catch (error) {
    console.error('[Follow Summary API] Erreur:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}


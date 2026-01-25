import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/adminAuth';
import { 
  getAllFollowValidationsForMonth,
  isValidationObsolete,
  calculateFollowStats 
} from '@/lib/followStorage';

const STAFF_MEMBERS: Record<string, string> = {
  red: "Red",
  clara: "Clara",
  nexou: "Nexou",
  tabs: "Tabs",
  nangel: "Nangel",
  jenny: "Jenny",
  selena: "Selena",
  dark: "Dark",
  yaya: "Yaya",
  rubby: "Rubby",
  livio: "Livio",
  rebelle: "Rebelle",
  sigurdson: "Sigurdson",
  nico: "Nico",
  willy: "Willy",
  b1nx: "B1nx",
  spydy: "Spydy",
  simon: "Simon",
  zylkao: "Zylkao",
};

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

    const allValidations = await getAllFollowValidationsForMonth(month);

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

    // Créer le tableau récapitulatif
    const summary = Object.keys(STAFF_MEMBERS).map(slug => {
      const validation = allValidations.find(v => v.staffSlug === slug);
      const isObsolete = validation ? isValidationObsolete(validation.validatedAt) : false;
      const stats = validation ? calculateFollowStats(validation) : null;

      return {
        staffSlug: slug,
        staffName: STAFF_MEMBERS[slug],
        lastValidationDate: validation?.validatedAt || null,
        followRate: stats?.tauxRetour || null, // Utiliser tauxRetour au lieu de followRate
        followedCount: stats?.totalRetour || null, // Utiliser totalRetour (follows retour) au lieu de followedCount
        totalMembers: stats?.totalJeSuis || null, // Utiliser totalJeSuis (membres suivis) au lieu de totalMembers
        status: validation 
          ? (isObsolete ? 'obsolete' : 'up_to_date')
          : 'not_validated',
      };
    });

    return NextResponse.json({
      month,
      globalStats: {
        averageFollowRate,
        totalFollowed,
        totalMembers,
        validPagesCount: validValidations.length,
        obsoletePagesCount: obsoleteValidations.length,
      },
      summary,
    });
  } catch (error) {
    console.error('[Follow Summary API] Erreur:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}


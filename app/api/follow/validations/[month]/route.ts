import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/adminAuth';
import { listStaffFollowValidations, getLastMonthWithData } from '@/lib/followStorage';

/**
 * GET - Récupère toutes les validations de follow pour un mois donné
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

    let validations = await listStaffFollowValidations(month);
    let dataSourceMonth = month;
    if (validations.length === 0) {
      const fallbackMonth = await getLastMonthWithData(month);
      if (fallbackMonth) {
        validations = await listStaffFollowValidations(fallbackMonth);
        dataSourceMonth = fallbackMonth;
      }
    }

    return NextResponse.json({
      month,
      dataSourceMonth,
      totalSheets: validations.length,
      validations,
    });
  } catch (error) {
    console.error('[Follow Validations API] Erreur GET:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}


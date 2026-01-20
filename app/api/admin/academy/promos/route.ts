import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/requireAdmin';
import bcrypt from 'bcryptjs';
import { loadPromos, createPromo, updatePromo, addLog } from '@/lib/academyStorage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET - Récupère toutes les promos
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    
    if (!admin) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 403 }
      );
    }

    const promos = await loadPromos();
    // Ne pas renvoyer les mots de passe hashés
    const promosWithoutPasswords = promos.map(({ password, ...promo }) => promo);
    return NextResponse.json({ promos: promosWithoutPasswords });
  } catch (error) {
    console.error('[Admin Academy Promos API] Erreur GET:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

/**
 * POST - Crée une nouvelle promo
 * Body: { name: string, description?: string, password: string, startDate: string, endDate?: string, isActive: boolean }
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    
    if (!admin) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, password, startDate, endDate, isActive } = body;

    if (!name || !password || !startDate) {
      return NextResponse.json(
        { error: 'name, password et startDate sont requis' },
        { status: 400 }
      );
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    const promo = await createPromo({
      name,
      description,
      password: hashedPassword,
      startDate,
      endDate,
      isActive: isActive !== false,
      createdBy: admin.discordId,
    });

    // Logger la création
    await addLog({
      userId: admin.discordId,
      promoId: promo.id,
      action: 'promo_created',
      accessType: 'discord',
      metadata: {
        promoName: promo.name,
        createdBy: admin.discordId,
      },
    });

    // Ne pas renvoyer le mot de passe hashé
    const { password: _, ...promoWithoutPassword } = promo;
    return NextResponse.json({ success: true, promo: promoWithoutPassword });
  } catch (error) {
    console.error('[Admin Academy Promos API] Erreur POST:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

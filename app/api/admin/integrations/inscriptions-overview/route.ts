import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/requireAdmin';
import { loadIntegrations, loadRegistrationsMapForIntegrationIds } from '@/lib/integrationStorage';

/**
 * GET — Intégrations publiées + toutes les inscriptions associées en un aller-retour
 * (évite N requêtes séquentielles depuis la page admin onboarding inscriptions).
 */
export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Non authentifié ou accès refusé' }, { status: 401 });
    }

    const allIntegrations = await loadIntegrations();
    const published = allIntegrations.filter((i) => i.isPublished);
    const ids = published.map((i) => i.id);
    const registrationsByIntegrationId = await loadRegistrationsMapForIntegrationIds(ids);

    return NextResponse.json({
      integrations: published,
      registrationsByIntegrationId,
    });
  } catch (error) {
    console.error('[Admin inscriptions-overview] Erreur GET:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

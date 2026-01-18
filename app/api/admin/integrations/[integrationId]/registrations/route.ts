import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/requireAdmin';
import { getIntegration, loadRegistrations, saveRegistrations, registerForIntegration, type IntegrationRegistration } from '@/lib/integrationStorage';

/**
 * GET - Récupère les inscriptions pour une intégration (admin uniquement)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { integrationId: string } }
) {
  try {
    // Authentification NextAuth + rôle admin requis
    const admin = await requireAdmin();
    
    if (!admin) {
      return NextResponse.json({ error: 'Non authentifié ou accès refusé' }, { status: 401 });
    }
    
    const { integrationId } = params;
    
    // Vérifier que l'intégration existe
    const integration = await getIntegration(integrationId);
    if (!integration) {
      return NextResponse.json(
        { error: 'Intégration non trouvée' },
        { status: 404 }
      );
    }
    
    // Charger les inscriptions
    const registrations = await loadRegistrations(integrationId);
    
    // Trier par date d'inscription (plus récentes en premier)
    registrations.sort((a, b) => {
      return new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime();
    });
    
    return NextResponse.json({ registrations });
  } catch (error) {
    console.error('[Admin Integration Registrations API] Erreur GET:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

/**
 * PUT - Met à jour les présences ou ajoute un membre manuellement (admin uniquement)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { integrationId: string } }
) {
  try {
    // Authentification NextAuth + rôle admin requis
    const admin = await requireAdmin();
    
    if (!admin) {
      return NextResponse.json({ error: 'Non authentifié ou accès refusé' }, { status: 401 });
    }
    
    const { integrationId } = params;
    const body = await request.json();
    
    // Vérifier que l'intégration existe
    const integration = await getIntegration(integrationId);
    if (!integration) {
      return NextResponse.json(
        { error: 'Intégration non trouvée' },
        { status: 404 }
      );
    }
    
    // Mode 1: Mise à jour des présences
    if (body.presences && Array.isArray(body.presences)) {
      const registrations = await loadRegistrations(integrationId);
      
      // Mettre à jour les présences
      const presencesMap = new Map<string, boolean>();
      body.presences.forEach((p: { registrationId: string; present: boolean }) => {
        presencesMap.set(p.registrationId, p.present);
      });
      
      registrations.forEach(reg => {
        if (presencesMap.has(reg.id)) {
          reg.present = presencesMap.get(reg.id);
        }
      });
      
      await saveRegistrations(integrationId, registrations);
      
      return NextResponse.json({ 
        success: true,
        message: 'Présences mises à jour avec succès'
      });
    }
    
    // Mode 2: Ajout manuel d'un membre
    if (body.newMember) {
      const { discordUsername, twitchChannelUrl, parrain, notes } = body.newMember;
      
      // Validation
      if (!discordUsername || !twitchChannelUrl || !parrain) {
        return NextResponse.json(
          { error: 'Le pseudo Discord, le lien Twitch et le parrain sont requis' },
          { status: 400 }
        );
      }
      
      // Extraire le pseudo Twitch du lien
      const extractTwitchLogin = (url: string): string | null => {
        if (!url) return null;
        const patterns = [
          /twitch\.tv\/([a-zA-Z0-9_]+)/i,
          /^([a-zA-Z0-9_]+)$/,
        ];
        for (const pattern of patterns) {
          const match = url.match(pattern);
          if (match && match[1]) {
            return match[1].toLowerCase();
          }
        }
        return null;
      };
      
      const twitchLogin = extractTwitchLogin(twitchChannelUrl);
      if (!twitchLogin) {
        return NextResponse.json(
          { error: 'Format de lien Twitch invalide' },
          { status: 400 }
        );
      }
      
      // Normaliser le lien Twitch
      const normalizedTwitchUrl = twitchChannelUrl.startsWith('http') 
        ? twitchChannelUrl 
        : `https://www.twitch.tv/${twitchLogin}`;
      
      // Ajouter le membre
      const registration = await registerForIntegration(integrationId, {
        twitchLogin: twitchLogin,
        twitchChannelUrl: normalizedTwitchUrl,
        displayName: discordUsername,
        discordUsername: discordUsername,
        parrain: parrain,
        notes: notes || undefined,
      });
      
      // Marquer comme présent par défaut si ajouté manuellement
      registration.present = true;
      const registrations = await loadRegistrations(integrationId);
      const updated = registrations.map(r => r.id === registration.id ? registration : r);
      await saveRegistrations(integrationId, updated);
      
      return NextResponse.json({ 
        registration,
        success: true,
        message: 'Membre ajouté avec succès'
      });
    }
    
    return NextResponse.json(
      { error: 'Requête invalide' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[Admin Integration Registrations API] Erreur PUT:', error);
    
    if (error instanceof Error && error.message.includes('déjà inscrit')) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Erreur serveur', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

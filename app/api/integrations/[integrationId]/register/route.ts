import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIntegration, registerForIntegration } from '@/lib/integrationStorage';
import { findMemberByIdentifier, loadMemberDataFromStorage } from '@/lib/memberData';

/**
 * POST - Inscription à une intégration
 * Accepte deux modes :
 * 1. Utilisateur connecté Discord (inscription automatique avec données de la base)
 * 2. Formulaire libre (pour personnes non encore membres du système)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { integrationId: string } }
) {
  try {
    const { integrationId } = params;
    const body = await request.json();
    
    // Vérifier que l'intégration existe et est publiée
    const integration = await getIntegration(integrationId);
    if (!integration) {
      return NextResponse.json(
        { error: 'Intégration non trouvée' },
        { status: 404 }
      );
    }
    
    if (!integration.isPublished) {
      return NextResponse.json(
        { error: 'Cette intégration n\'est pas disponible' },
        { status: 403 }
      );
    }
    
    // Récupérer l'utilisateur Discord connecté depuis les cookies (optionnel)
    const cookieStore = cookies();
    const discordUserId = cookieStore.get('discord_user_id')?.value;
    const discordUsername = cookieStore.get('discord_username')?.value;
    
    // MODE 1: Utilisateur connecté Discord (inscription automatique)
    if (discordUserId) {
      try {
        await loadMemberDataFromStorage();
        const member = findMemberByIdentifier({ discordId: discordUserId });
        
        if (member) {
          // Membre trouvé dans la base : inscription automatique
          const registration = await registerForIntegration(integrationId, {
            twitchLogin: member.twitchLogin,
            displayName: member.displayName || member.twitchLogin,
            discordId: member.discordId,
            discordUsername: member.discordUsername || discordUsername,
            notes: body.notes || undefined,
          });
          
          return NextResponse.json({ 
            registration,
            success: true,
            message: 'Inscription réussie !' 
          });
        }
      } catch (error) {
        // Si erreur, continuer avec le mode formulaire libre
        console.error('[Integration Registration] Erreur mode connecté:', error);
      }
    }
    
    // MODE 2: Formulaire libre (pour personnes non membres)
    const { 
      displayName, 
      email, 
      twitchLogin, 
      discordUsername: formDiscordUsername,
      notes 
    } = body;
    
    // Validation des champs requis pour le formulaire libre
    if (!displayName || !email) {
      return NextResponse.json(
        { error: 'Le nom et l\'email sont requis pour l\'inscription' },
        { status: 400 }
      );
    }
    
    // Validation email basique
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Format d\'email invalide' },
        { status: 400 }
      );
    }
    
    // S'inscrire avec les données du formulaire libre
    // Utiliser email comme identifiant unique si pas de twitchLogin
    const registration = await registerForIntegration(integrationId, {
      twitchLogin: twitchLogin || email.toLowerCase().split('@')[0], // Utiliser email si pas de Twitch
      displayName: displayName,
      email: email, // Stocker l'email pour les inscriptions libres
      discordId: discordUserId || undefined, // Si connecté Discord mais pas dans la base
      discordUsername: formDiscordUsername || discordUsername || undefined,
      notes: notes || undefined,
    });
    
    return NextResponse.json({ 
      registration,
      success: true,
      message: 'Inscription réussie !' 
    });
  } catch (error) {
    console.error('[Integration Registration API] Erreur POST:', error);
    
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


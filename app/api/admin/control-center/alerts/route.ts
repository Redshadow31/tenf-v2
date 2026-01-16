import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/adminAuth';
import { getAllMemberData, loadMemberDataFromStorage } from '@/lib/memberData';

/**
 * API pour récupérer les compteurs d'alertes pour le Centre de contrôle
 * Lecture seule, aucune modification de données
 */
export async function GET() {
  try {
    const admin = await getCurrentAdmin();
    
    if (!admin) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    // Vérifier l'accès admin
    const { hasAdminDashboardAccessAsync } = await import('@/lib/adminAccessCheck');
    if (!(await hasAdminDashboardAccessAsync(admin.id))) {
      return NextResponse.json(
        { error: "Accès refusé" },
        { status: 403 }
      );
    }

    // Charger les données membres
    await loadMemberDataFromStorage();
    const allMembers = getAllMemberData();

    // 1. Compter les comptes incomplets
    let incompleteCount = 0;
    try {
      for (const member of allMembers) {
        const missingFields: string[] = [];
        
        // Champs obligatoires
        if (!member.twitchLogin || member.twitchLogin.trim() === "") {
          missingFields.push("twitchLogin");
        }
        if (!member.discordId || member.discordId.trim() === "") {
          missingFields.push("discordId");
        }
        
        // Pour les créateurs, vérifier aussi certains champs
        const isCreator = member.role && (
          member.role.includes("Créateur") || 
          member.role.includes("créateur") ||
          member.role === "CREATOR_AFFILIATED" ||
          member.role === "CREATOR_DEVELOPMENT"
        );
        
        if (isCreator) {
          if (!member.displayName || member.displayName.trim() === "") {
            missingFields.push("displayName");
          }
        }
        
        // Si au moins un champ obligatoire manque
        if (missingFields.length > 0) {
          incompleteCount++;
        }
      }
    } catch (error) {
      console.error("Error counting incomplete members:", error);
    }

    // 2. Compter les erreurs & incohérences
    let errorsCount = 0;
    try {
      for (const member of allMembers) {
        // Erreurs à détecter
        // 1. Pas de twitchLogin
        if (!member.twitchLogin || member.twitchLogin.trim() === "") {
          errorsCount++;
          continue;
        }
        
        // 2. TwitchLogin invalide (commence par discord_)
        if (member.twitchLogin.startsWith('discord_')) {
          errorsCount++;
          continue;
        }
        
        // 3. Discord ID mais pas de username
        if (member.discordId && (!member.discordUsername || member.discordUsername.trim() === "")) {
          errorsCount++;
          continue;
        }
        
        // 4. TwitchLogin avec caractères invalides
        const twitchLoginRegex = /^[a-zA-Z0-9_]{4,25}$/;
        if (member.twitchLogin && !twitchLoginRegex.test(member.twitchLogin)) {
          errorsCount++;
          continue;
        }
      }
    } catch (error) {
      console.error("Error counting member errors:", error);
    }

    // 3. Compter les spotlights à planifier (spotlights actifs)
    let spotlightsPending = 0;
    try {
      const { getActiveSpotlight } = await import('@/lib/spotlightStorage');
      const activeSpotlight = await getActiveSpotlight();
      // Si un spotlight est actif, on peut considérer qu'il y a 1 spotlight en cours
      // Pour plus de détails, on pourrait compter les spotlights planifiés dans le futur
      spotlightsPending = activeSpotlight && activeSpotlight.status === 'active' ? 1 : 0;
    } catch (error) {
      console.error("Error counting pending spotlights:", error);
      // Si erreur, on laisse à 0 (donnée non disponible)
    }

    // 4. Compter les évaluations mensuelles à finaliser
    // Pour l'instant, on ne peut pas facilement compter ça sans connaître la structure exacte
    // On retourne null pour indiquer que c'est non disponible
    let evaluationsPending = null;
    try {
      // TODO: Implémenter si une structure d'évaluations mensuelles existe
      // Pour l'instant, on retourne null
    } catch (error) {
      console.error("Error counting pending evaluations:", error);
    }

    return NextResponse.json({
      incompleteAccounts: incompleteCount,
      errors: errorsCount,
      spotlightsPending: spotlightsPending,
      evaluationsPending: evaluationsPending, // null si non disponible
    });
  } catch (error) {
    console.error("Error in control-center alerts API:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdmin as getCurrentAdminLegacy, hasAdminDashboardAccess as hasAdminDashboardAccessLegacy } from "@/lib/admin";
import { isFounder, hasAdminDashboardAccess, hasPermission } from "@/lib/adminRoles";
import {
  getAllMemberData,
  getMemberData,
  updateMemberData,
  createMemberData,
  deleteMemberData,
  initializeMemberData,
  loadMemberDataFromStorage,
} from "@/lib/memberData";
import { getCurrentAdmin, logAction } from "@/lib/adminAuth";

// Désactiver le cache pour cette route - les données doivent toujours être à jour
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Initialiser les données au démarrage du serveur
let initialized = false;
if (!initialized) {
  initializeMemberData();
  initialized = true;
}

/**
 * GET - Récupère tous les membres ou un membre spécifique
 */
export async function GET(request: NextRequest) {
  try {
    // Charger les données depuis le stockage persistant (Blobs ou fichier)
    await loadMemberDataFromStorage();
    
    const admin = await getCurrentAdmin();
    
    if (!admin) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    // Vérifier l'accès avec le nouveau système de rôles
    if (!hasAdminDashboardAccess(admin.id)) {
      return NextResponse.json(
        { error: "Accès refusé. Réservé aux administrateurs." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const twitchLogin = searchParams.get("twitchLogin");

    if (twitchLogin) {
      // Récupérer un membre spécifique
      const member = getMemberData(twitchLogin);
      if (!member) {
        return NextResponse.json(
          { error: "Membre non trouvé" },
          { status: 404 }
        );
      }
      const response = NextResponse.json({ member });
      
      // Désactiver le cache côté client
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');
      
      return response;
    }

    // Récupérer tous les membres
    const members = getAllMemberData();
    const response = NextResponse.json({ members });
    
    // Désactiver le cache côté client
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
  } catch (error) {
    console.error("Error fetching members:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

/**
 * POST - Crée un nouveau membre
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    
    if (!admin) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    // Vérifier les permissions : write pour créer
    if (!hasPermission(admin.id, "write")) {
      return NextResponse.json(
        { error: "Accès refusé. Permissions insuffisantes." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      twitchLogin,
      displayName,
      twitchUrl,
      discordId,
      discordUsername,
      role,
      isVip,
      isActive,
      badges,
      description,
      customBio,
    } = body;

    if (!twitchLogin || !displayName || !twitchUrl) {
      return NextResponse.json(
        { error: "twitchLogin, displayName et twitchUrl sont requis" },
        { status: 400 }
      );
    }

    // Charger les données depuis le stockage persistant
    await loadMemberDataFromStorage();
    
    // Résoudre automatiquement l'ID Twitch si twitchLogin est fourni
    let twitchId: string | undefined = undefined;
    if (twitchLogin && twitchLogin.trim() !== '') {
      try {
        const { resolveAndCacheTwitchId } = await import('@/lib/twitchIdResolver');
        const resolvedId = await resolveAndCacheTwitchId(twitchLogin, false);
        if (resolvedId) {
          twitchId = resolvedId;
          console.log(`[Admin Create Member] ✅ Twitch ID résolu pour ${twitchLogin}: ${twitchId}`);
        }
      } catch (error) {
        console.warn(`[Admin Create Member] ⚠️ Impossible de résoudre Twitch ID pour ${twitchLogin}:`, error);
        // Ne pas bloquer la création si la résolution échoue
      }
    }
    
    const newMember = await createMemberData(
      {
        twitchLogin,
        twitchId,
        displayName,
        twitchUrl,
        discordId,
        discordUsername,
        role: role || "Affilié",
        isVip: isVip || false,
        isActive: isActive !== undefined ? isActive : true,
        badges: badges || [],
        description,
        customBio,
      },
      admin.id
    );

    // Logger l'action avec le nouveau système d'audit
    await logAction(
      admin,
      "member.create",
      "member",
      {
        resourceId: twitchLogin,
        newValue: { displayName, role, isVip, isActive },
      }
    );

    return NextResponse.json({ member: newMember, success: true });
  } catch (error) {
    console.error("Error creating member:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

/**
 * PUT - Met à jour un membre existant
 */
export async function PUT(request: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    
    if (!admin) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    // Vérifier les permissions : write pour modifier
    if (!hasPermission(admin.id, "write")) {
      return NextResponse.json(
        { error: "Accès refusé. Permissions insuffisantes." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { 
      twitchLogin, 
      memberId, // Identifiant stable (discordId) 
      originalDiscordId, // discordId original pour identifier le membre
      originalTwitchId, // twitchId original pour identifier le membre
      ...updates 
    } = body;

    // Charger les données depuis le stockage persistant AVANT de récupérer le membre
    await loadMemberDataFromStorage();
    
    // Identifier le membre par son identifiant stable (discordId ou twitchId) en priorité
    const { findMemberByIdentifier } = await import('@/lib/memberData');
    let existingMember: any = null;
    
    if (originalDiscordId || originalTwitchId) {
      // Chercher par identifiant stable (priorité)
      existingMember = findMemberByIdentifier({
        discordId: originalDiscordId,
        twitchId: originalTwitchId,
        twitchLogin: twitchLogin, // Fallback si les IDs ne sont pas disponibles
      });
      console.log(`[Update Member API] Recherche par identifiant stable - discordId: ${originalDiscordId}, twitchId: ${originalTwitchId}`);
    } else if (twitchLogin) {
      // Fallback: chercher par twitchLogin (mode legacy)
      existingMember = getMemberData(twitchLogin);
      console.log(`[Update Member API] Recherche par twitchLogin (legacy): ${twitchLogin}`);
    }
    
    if (!existingMember) {
      console.error(`[Update Member API] ❌ Membre non trouvé avec:`, {
        twitchLogin,
        originalDiscordId,
        originalTwitchId,
      });
      return NextResponse.json(
        { error: "Membre non trouvé" },
        { status: 404 }
      );
    }

    console.log(`[Update Member API] ✅ Membre trouvé: id=${existingMember.twitchLogin} (discordId: ${existingMember.discordId}, twitchId: ${existingMember.twitchId})`);
    
    // Récupérer le login original pour la mise à jour
    const originalLogin = existingMember.twitchLogin.toLowerCase();
    
    // Ajouter twitchLogin dans updates s'il est différent de l'ancien (important pour mettre à jour le nom de chaîne Twitch)
    if (twitchLogin && twitchLogin.toLowerCase() !== originalLogin) {
      updates.twitchLogin = twitchLogin;
      console.log(`[Update Member API] 🔄 Pseudo Twitch changé: ${originalLogin} → ${twitchLogin}`);
    } else if (twitchLogin) {
      // Même si identique, s'assurer que twitchLogin est dans updates pour la cohérence
      updates.twitchLogin = twitchLogin;
    }
    
    // Ne pas écraser discordId ou discordUsername avec des valeurs vides
    if (updates.discordId === "" || updates.discordId === null) {
      delete updates.discordId;
    }
    if (updates.discordUsername === "" || updates.discordUsername === null) {
      delete updates.discordUsername;
    }
    
    // Gérer createdAt (convertir string ISO en Date si nécessaire)
    if (updates.createdAt !== undefined) {
      if (updates.createdAt === "" || updates.createdAt === null) {
        updates.createdAt = undefined;
      } else if (typeof updates.createdAt === 'string') {
        updates.createdAt = new Date(updates.createdAt);
      }
    }
    
    // Gérer integrationDate (convertir string ISO en Date si nécessaire)
    if (updates.integrationDate !== undefined) {
      if (updates.integrationDate === "" || updates.integrationDate === null) {
        updates.integrationDate = undefined;
      } else if (typeof updates.integrationDate === 'string') {
        updates.integrationDate = new Date(updates.integrationDate);
      }
    }
    
    // Gérer parrain (string, peut être vide pour supprimer)
    if (updates.parrain !== undefined) {
      if (updates.parrain === "" || updates.parrain === null) {
        updates.parrain = undefined;
      }
      // Sinon, garder la valeur string telle quelle
    }
    
    // Si le rôle est modifié manuellement, marquer comme défini manuellement
    // La gestion de roleHistory est faite automatiquement dans updateMemberData
    if (updates.role && updates.role !== existingMember.role) {
      updates.roleManuallySet = true;
    }

    // Synchronisation VIP Élite <-> isVip
    // Si isVip est modifié, synchroniser avec le badge VIP Élite
    if (updates.isVip !== undefined) {
      const currentBadges = existingMember.badges || [];
      const hasVipEliteBadge = currentBadges.includes("VIP Élite");
      
      if (updates.isVip && !hasVipEliteBadge) {
        // Activer VIP : ajouter le badge VIP Élite s'il n'est pas présent
        updates.badges = [...currentBadges, "VIP Élite"];
      } else if (!updates.isVip && hasVipEliteBadge) {
        // Désactiver VIP : retirer le badge VIP Élite
        updates.badges = currentBadges.filter((badge: string) => badge !== "VIP Élite");
      }
    }
    
    // Si le badge VIP Élite est ajouté/supprimé manuellement, synchroniser isVip
    if (updates.badges !== undefined) {
      const currentBadges = Array.isArray(updates.badges) ? updates.badges : (existingMember.badges || []);
      const hasVipEliteBadge = currentBadges.includes("VIP Élite");
      const currentlyVip = existingMember.isVip || false;
      
      if (hasVipEliteBadge && !currentlyVip) {
        // Badge VIP Élite ajouté : activer isVip
        updates.isVip = true;
      } else if (!hasVipEliteBadge && currentlyVip && updates.isVip === undefined) {
        // Badge VIP Élite retiré : désactiver isVip (seulement si isVip n'est pas explicitement modifié)
        updates.isVip = false;
      }
    }
    
    // roleChangeReason sera utilisé par updateMemberData pour créer l'entrée roleHistory

    // Résoudre automatiquement l'ID Twitch si twitchLogin est modifié et twitchId manquant
    if (updates.twitchLogin && updates.twitchLogin !== existingMember.twitchLogin && !updates.twitchId && !existingMember.twitchId) {
      try {
        const { resolveAndCacheTwitchId } = await import('@/lib/twitchIdResolver');
        const resolvedId = await resolveAndCacheTwitchId(updates.twitchLogin, false);
        if (resolvedId) {
          updates.twitchId = resolvedId;
          console.log(`[Admin Update Member] ✅ Twitch ID résolu pour ${updates.twitchLogin}: ${resolvedId}`);
        }
      } catch (error) {
        console.warn(`[Admin Update Member] ⚠️ Impossible de résoudre Twitch ID pour ${updates.twitchLogin}:`, error);
      }
    }
    
    // Si twitchLogin existe mais twitchId manquant, essayer de le résoudre
    const loginToCheck = updates.twitchLogin || existingMember.twitchLogin;
    if (loginToCheck && !updates.twitchId && !existingMember.twitchId) {
      try {
        const { resolveAndCacheTwitchId } = await import('@/lib/twitchIdResolver');
        const resolvedId = await resolveAndCacheTwitchId(loginToCheck, false);
        if (resolvedId) {
          updates.twitchId = resolvedId;
          console.log(`[Admin Update Member] ✅ Twitch ID résolu pour ${loginToCheck}: ${resolvedId}`);
        }
      } catch (error) {
        console.warn(`[Admin Update Member] ⚠️ Impossible de résoudre Twitch ID pour ${loginToCheck}:`, error);
      }
    }

    // Préparer l'identifiant pour updateMemberData (utiliser identifiant stable si disponible)
    // Utiliser l'ancien twitchLogin pour identifier le membre, pas le nouveau
    const memberIdentifier = originalDiscordId || originalTwitchId
      ? { discordId: originalDiscordId, twitchId: originalTwitchId, twitchLogin: existingMember.twitchLogin }
      : existingMember.twitchLogin;

    // Log pour déboguer
    console.log(`[Update Member API] ${originalLogin}:`, {
      identifier: memberIdentifier,
      existingDiscordId: existingMember.discordId,
      newDiscordId: updates.discordId,
      existingDiscordUsername: existingMember.discordUsername,
      newDiscordUsername: updates.discordUsername,
      existingTwitchLogin: existingMember.twitchLogin,
      newTwitchLogin: updates.twitchLogin || twitchLogin,
      existingParrain: existingMember.parrain,
      newParrain: updates.parrain,
    });

    const updatedMember = await updateMemberData(memberIdentifier, updates, admin.id);
    
    // Log après mise à jour
    console.log(`[Update Member API] ✅ Après mise à jour:`, {
      discordId: updatedMember?.discordId,
      discordUsername: updatedMember?.discordUsername,
      twitchLogin: updatedMember?.twitchLogin,
      parrain: updatedMember?.parrain,
    });

    if (!updatedMember) {
      return NextResponse.json(
        { error: "Erreur lors de la mise à jour" },
        { status: 500 }
      );
    }

    // Logger l'action avec le nouveau système d'audit
    await logAction(
      admin,
      "member.update",
      "member",
      {
        resourceId: twitchLogin,
        previousValue: {
          role: existingMember.role,
          isVip: existingMember.isVip,
          isActive: existingMember.isActive,
          description: existingMember.description,
        },
        newValue: {
          role: updatedMember.role,
          isVip: updatedMember.isVip,
          isActive: updatedMember.isActive,
          description: updatedMember.description,
        },
        metadata: { changes: updates },
      }
    );

    return NextResponse.json({ member: updatedMember, success: true });
  } catch (error) {
    console.error("Error updating member:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Supprime un membre
 */
export async function DELETE(request: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    
    if (!admin) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    // Vérifier les permissions : write pour supprimer
    if (!hasPermission(admin.id, "write")) {
      return NextResponse.json(
        { error: "Accès refusé. Permissions insuffisantes." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const twitchLogin = searchParams.get("twitchLogin");

    if (!twitchLogin) {
      return NextResponse.json(
        { error: "twitchLogin est requis" },
        { status: 400 }
      );
    }

    // Charger les données depuis le stockage persistant
    await loadMemberDataFromStorage();
    
    const member = getMemberData(twitchLogin);
    if (!member) {
      return NextResponse.json(
        { error: "Membre non trouvé" },
        { status: 404 }
      );
    }

    const success = await deleteMemberData(twitchLogin, admin.id);

    if (!success) {
      return NextResponse.json(
        { error: "Erreur lors de la suppression" },
        { status: 500 }
      );
    }

    // Logger l'action avec le nouveau système d'audit
    await logAction(
      admin,
      "member.delete",
      "member",
      {
        resourceId: twitchLogin,
        previousValue: {
          displayName: member.displayName,
          role: member.role,
          isVip: member.isVip,
        },
      }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting member:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}


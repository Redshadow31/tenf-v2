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
    
    const newMember = await createMemberData(
      {
        twitchLogin,
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

    if (!isFounder(admin.id)) {
      return NextResponse.json(
        { error: "Accès refusé. Seuls les fondateurs peuvent modifier les membres." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { twitchLogin, ...updates } = body;

    if (!twitchLogin) {
      return NextResponse.json(
        { error: "twitchLogin est requis" },
        { status: 400 }
      );
    }

    // Charger les données depuis le stockage persistant AVANT de récupérer le membre
    await loadMemberDataFromStorage();
    
    const existingMember = getMemberData(twitchLogin);
    if (!existingMember) {
      return NextResponse.json(
        { error: "Membre non trouvé" },
        { status: 404 }
      );
    }
    
    // Ne pas écraser discordId ou discordUsername avec des valeurs vides
    if (updates.discordId === "" || updates.discordId === null) {
      delete updates.discordId;
    }
    if (updates.discordUsername === "" || updates.discordUsername === null) {
      delete updates.discordUsername;
    }
    
    // Si le rôle est modifié manuellement, marquer comme défini manuellement
    if (updates.role && updates.role !== existingMember.role) {
      updates.roleManuallySet = true;
    }

    // Log pour déboguer
    console.log(`[Update Member] ${twitchLogin}:`, {
      existingDiscordId: existingMember.discordId,
      newDiscordId: updates.discordId,
      existingDiscordUsername: existingMember.discordUsername,
      newDiscordUsername: updates.discordUsername,
    });

    const updatedMember = await updateMemberData(twitchLogin, updates, admin.id);
    
    // Log après mise à jour
    console.log(`[Update Member] ${twitchLogin} - Après mise à jour:`, {
      discordId: updatedMember?.discordId,
      discordUsername: updatedMember?.discordUsername,
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

    if (!isFounder(admin.id)) {
      return NextResponse.json(
        { error: "Accès refusé. Seuls les fondateurs peuvent supprimer des membres." },
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


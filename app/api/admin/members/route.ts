import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdmin, isFounder } from "@/lib/admin";
import {
  getAllMemberData,
  getMemberData,
  updateMemberData,
  createMemberData,
  deleteMemberData,
  initializeMemberData,
} from "@/lib/memberData";
import { logAction } from "@/lib/logAction";

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
    const admin = await getCurrentAdmin();
    
    if (!admin) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    if (!isFounder(admin.id)) {
      return NextResponse.json(
        { error: "Accès refusé. Réservé aux fondateurs." },
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
      return NextResponse.json({ member });
    }

    // Récupérer tous les membres
    const members = getAllMemberData();
    return NextResponse.json({ members });
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

    if (!isFounder(admin.id)) {
      return NextResponse.json(
        { error: "Accès refusé. Seuls les fondateurs peuvent créer des membres." },
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

    const newMember = createMemberData(
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

    // Logger l'action
    await logAction(
      admin.id,
      admin.username,
      "Création d'un membre",
      displayName,
      { twitchLogin, role, isVip, isActive }
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

    const existingMember = getMemberData(twitchLogin);
    if (!existingMember) {
      return NextResponse.json(
        { error: "Membre non trouvé" },
        { status: 404 }
      );
    }

    const updatedMember = updateMemberData(twitchLogin, updates, admin.id);

    if (!updatedMember) {
      return NextResponse.json(
        { error: "Erreur lors de la mise à jour" },
        { status: 500 }
      );
    }

    // Logger l'action
    await logAction(
      admin.id,
      admin.username,
      "Modification d'un membre",
      updatedMember.displayName,
      {
        twitchLogin,
        changes: updates,
        oldData: {
          role: existingMember.role,
          isVip: existingMember.isVip,
          isActive: existingMember.isActive,
          description: existingMember.description,
        },
        newData: {
          role: updatedMember.role,
          isVip: updatedMember.isVip,
          isActive: updatedMember.isActive,
          description: updatedMember.description,
        },
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

    const member = getMemberData(twitchLogin);
    if (!member) {
      return NextResponse.json(
        { error: "Membre non trouvé" },
        { status: 404 }
      );
    }

    const success = deleteMemberData(twitchLogin);

    if (!success) {
      return NextResponse.json(
        { error: "Erreur lors de la suppression" },
        { status: 500 }
      );
    }

    // Logger l'action
    await logAction(
      admin.id,
      admin.username,
      "Suppression d'un membre",
      member.displayName,
      {
        twitchLogin,
        role: member.role,
        isVip: member.isVip,
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


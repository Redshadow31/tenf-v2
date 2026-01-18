import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/requireAdmin";
import { getAllMemberData, loadMemberDataFromStorage } from "@/lib/memberData";

// Désactiver le cache pour cette route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET - Exporte les modifications manuelles des membres
 * Réservé aux fondateurs
 */
export async function GET(request: NextRequest) {
  try {
    // Authentification NextAuth + rôle FOUNDER requis
    const admin = await requireRole("FOUNDER");
    
    if (!admin) {
      return NextResponse.json(
        { error: "Non authentifié ou accès refusé. Réservé aux fondateurs." },
        { status: 403 }
      );
    }

    // Charger les données depuis le stockage persistant
    await loadMemberDataFromStorage();
    
    const allMembers = getAllMemberData();
    
    // Filtrer les membres avec des modifications manuelles
    const manualChanges: Record<string, any> = {};
    let count = 0;
    
    for (const member of allMembers) {
      // Vérifier si le membre a des modifications manuelles
      const hasManualChanges = 
        member.roleManuallySet === true ||
        member.description ||
        member.customBio ||
        member.siteUsername ||
        member.listId !== undefined;
      
      if (hasManualChanges) {
        manualChanges[member.twitchLogin] = {
          twitchLogin: member.twitchLogin,
          displayName: member.displayName,
          discordId: member.discordId,
          discordUsername: member.discordUsername,
          role: member.role,
          roleManuallySet: member.roleManuallySet,
          siteUsername: member.siteUsername,
          description: member.description,
          customBio: member.customBio,
          listId: member.listId,
          isVip: member.isVip,
          badges: member.badges,
          updatedAt: member.updatedAt,
          updatedBy: member.updatedBy,
        };
        count++;
      }
    }
    
    // Résumé par rôle
    const byRole: Record<string, number> = {};
    for (const member of Object.values(manualChanges)) {
      byRole[member.role] = (byRole[member.role] || 0) + 1;
    }
    
    return NextResponse.json({
      success: true,
      exportedAt: new Date().toISOString(),
      totalManualChanges: count,
      byRole,
      members: manualChanges,
    });
  } catch (error) {
    console.error("Error exporting manual changes:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'export" },
      { status: 500 }
    );
  }
}


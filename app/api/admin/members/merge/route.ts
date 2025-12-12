import { NextRequest, NextResponse } from "next/server";
import { getDiscordUser } from "@/lib/discord";
import { getCurrentAdmin, canPerformAction, isFounder, hasAdminDashboardAccess } from "@/lib/admin";
import {
  getAllMemberData,
  updateMemberData,
  deleteMemberData,
  loadMemberDataFromStorage,
} from "@/lib/memberData";

/**
 * POST - Fusionne plusieurs membres en doublon en un seul
 * 
 * Body:
 * {
 *   membersToMerge: string[], // Array de twitchLogin des membres à fusionner
 *   mergedData: MemberData // Données fusionnées à utiliser
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await getDiscordUser();
    if (!admin) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Charger les données pour vérifier le rôle dans memberData
    await loadMemberDataFromStorage();
    const allMembers = getAllMemberData();
    const userMember = allMembers.find(m => m.discordId === admin.id);
    const userRole = userMember?.role;

    // Vérifier l'accès : Fondateurs, Admins, ou Admin Adjoint
    if (!hasAdminDashboardAccess(admin.id, userRole)) {
      return NextResponse.json(
        { error: "Accès refusé. Seuls les fondateurs, admins et admin adjoints peuvent fusionner des membres." },
        { status: 403 }
      );
    }

    // Les données sont déjà chargées pour la vérification de rôle

    const body = await request.json();
    const { membersToMerge, mergedData } = body;

    if (!membersToMerge || !Array.isArray(membersToMerge) || membersToMerge.length < 2) {
      return NextResponse.json(
        { error: "Au moins 2 membres doivent être fournis pour la fusion" },
        { status: 400 }
      );
    }

    if (!mergedData || !mergedData.twitchLogin) {
      return NextResponse.json(
        { error: "Les données fusionnées sont requises" },
        { status: 400 }
      );
    }

    // Réutiliser allMembers déjà chargé
    const membersToDelete: string[] = [];
    const membersNotFound: string[] = [];

    // Vérifier que tous les membres existent
    for (const twitchLogin of membersToMerge) {
      const member = allMembers.find(
        (m) => m.twitchLogin.toLowerCase() === twitchLogin.toLowerCase()
      );
      if (!member) {
        membersNotFound.push(twitchLogin);
      }
    }

    if (membersNotFound.length > 0) {
      return NextResponse.json(
        { error: `Membres non trouvés: ${membersNotFound.join(", ")}` },
        { status: 404 }
      );
    }

    // Le membre principal (celui qui sera conservé) est celui avec le twitchLogin de mergedData
    const primaryTwitchLogin = mergedData.twitchLogin.toLowerCase();
    const otherMembers = membersToMerge.filter(
      (login: string) => login.toLowerCase() !== primaryTwitchLogin
    );

    // Mettre à jour le membre principal avec les données fusionnées
    await updateMemberData(
      primaryTwitchLogin,
      {
        ...mergedData,
        twitchLogin: primaryTwitchLogin, // S'assurer que le twitchLogin est correct
        updatedBy: admin.id,
        updatedAt: new Date(),
        // Marquer comme modifié manuellement pour protéger contre les synchronisations
        roleManuallySet: true,
      },
      admin.id
    );

    // Supprimer les autres membres (doublons)
    for (const twitchLogin of otherMembers) {
      await deleteMemberData(twitchLogin.toLowerCase(), admin.id);
      membersToDelete.push(twitchLogin);
    }

    return NextResponse.json({
      success: true,
      message: `Fusion réussie: ${membersToDelete.length} membre(s) fusionné(s) dans ${primaryTwitchLogin}`,
      primaryMember: primaryTwitchLogin,
      deletedMembers: membersToDelete,
    });
  } catch (error: any) {
    console.error("[Merge Members] Erreur:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de la fusion des membres" },
      { status: 500 }
    );
  }
}

/**
 * GET - Détecte les membres en doublon (même Discord ID/username mais Twitch différent)
 */
export async function GET(request: NextRequest) {
  try {
    // Utiliser getCurrentAdmin pour une meilleure vérification
    let admin = await getCurrentAdmin();
    
    // Si getCurrentAdmin ne fonctionne pas (côté client), utiliser getDiscordUser
    if (!admin) {
      const discordUser = await getDiscordUser();
      if (!discordUser) {
        return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
      }
      admin = { id: discordUser.id, username: discordUser.username, role: "Admin" as any };
    }

    // Charger les données pour vérifier le rôle dans memberData
    await loadMemberDataFromStorage();
    const allMembers = getAllMemberData();
    const userMember = allMembers.find(m => m.discordId === admin.id);
    const userRole = userMember?.role;

    // Vérifier l'accès : Fondateurs, Admins, ou Admin Adjoint
    if (!hasAdminDashboardAccess(admin.id, userRole)) {
      return NextResponse.json(
        { error: "Accès refusé. Seuls les fondateurs, admins et admin adjoints peuvent voir les doublons." },
        { status: 403 }
      );
    }

    // Les données sont déjà chargées pour la vérification de rôle
    // Réutiliser allMembers déjà chargé

    // Grouper les membres par différents critères pour détecter les doublons
    const membersByDisplayName: Record<string, any[]> = {};
    const membersByTwitchLogin: Record<string, any[]> = {};
    const membersByDiscordUsername: Record<string, any[]> = {};
    const membersByDiscordId: Record<string, any[]> = {};

    for (const member of allMembers) {
      // Grouper par nom du créateur (displayName) - case-insensitive
      if (member.displayName) {
        const normalizedName = member.displayName.toLowerCase().trim();
        if (normalizedName) {
          if (!membersByDisplayName[normalizedName]) {
            membersByDisplayName[normalizedName] = [];
          }
          membersByDisplayName[normalizedName].push(member);
        }
      }

      // Grouper par pseudo Twitch (twitchLogin) - case-insensitive
      if (member.twitchLogin) {
        const normalizedTwitch = member.twitchLogin.toLowerCase();
        if (!membersByTwitchLogin[normalizedTwitch]) {
          membersByTwitchLogin[normalizedTwitch] = [];
        }
        membersByTwitchLogin[normalizedTwitch].push(member);
      }

      // Grouper par pseudo Discord (discordUsername) - case-insensitive
      if (member.discordUsername) {
        const normalizedUsername = member.discordUsername.toLowerCase().trim();
        if (normalizedUsername) {
          if (!membersByDiscordUsername[normalizedUsername]) {
            membersByDiscordUsername[normalizedUsername] = [];
          }
          membersByDiscordUsername[normalizedUsername].push(member);
        }
      }

      // Grouper par ID Discord (discordId)
      if (member.discordId) {
        if (!membersByDiscordId[member.discordId]) {
          membersByDiscordId[member.discordId] = [];
        }
        membersByDiscordId[member.discordId].push(member);
      }
    }

    // Détecter les doublons selon tous les critères
    const duplicates: Array<{
      key: string; // Critère utilisé pour détecter le doublon
      type: "displayName" | "twitchLogin" | "discordUsername" | "discordId";
      members: any[];
    }> = [];

    // Ensemble pour éviter les doublons déjà détectés
    const detectedMemberPairs = new Set<string>();

    // Fonction pour créer une clé unique pour un groupe de membres
    const createMemberGroupKey = (members: any[]): string => {
      return members
        .map((m) => m.twitchLogin.toLowerCase())
        .sort()
        .join("|");
    };

    // Fonction pour vérifier si un groupe a déjà été détecté
    const isAlreadyDetected = (members: any[]): boolean => {
      const key = createMemberGroupKey(members);
      return detectedMemberPairs.has(key);
    };

    // Fonction pour marquer un groupe comme détecté
    const markAsDetected = (members: any[]): void => {
      const key = createMemberGroupKey(members);
      detectedMemberPairs.add(key);
    };

    // Vérifier les doublons par nom du créateur (displayName)
    for (const [displayName, members] of Object.entries(membersByDisplayName)) {
      if (members.length > 1) {
        // Vérifier si au moins un critère diffère (Twitch, Discord username, ou Discord ID)
        const uniqueTwitchLogins = [...new Set(members.map((m) => m.twitchLogin?.toLowerCase()).filter(Boolean))];
        const uniqueDiscordUsernames = [...new Set(members.map((m) => m.discordUsername?.toLowerCase()).filter(Boolean))];
        const uniqueDiscordIds = [...new Set(members.map((m) => m.discordId).filter(Boolean))];
        
        if (uniqueTwitchLogins.length > 1 || uniqueDiscordUsernames.length > 1 || uniqueDiscordIds.length > 1) {
          if (!isAlreadyDetected(members)) {
            duplicates.push({
              key: displayName,
              type: "displayName",
              members: members,
            });
            markAsDetected(members);
          }
        }
      }
    }

    // Vérifier les doublons par pseudo Twitch (twitchLogin)
    for (const [twitchLogin, members] of Object.entries(membersByTwitchLogin)) {
      if (members.length > 1) {
        // Vérifier si au moins un critère diffère (displayName, Discord username, ou Discord ID)
        const uniqueDisplayNames = [...new Set(members.map((m) => m.displayName?.toLowerCase().trim()).filter(Boolean))];
        const uniqueDiscordUsernames = [...new Set(members.map((m) => m.discordUsername?.toLowerCase()).filter(Boolean))];
        const uniqueDiscordIds = [...new Set(members.map((m) => m.discordId).filter(Boolean))];
        
        if (uniqueDisplayNames.length > 1 || uniqueDiscordUsernames.length > 1 || uniqueDiscordIds.length > 1) {
          if (!isAlreadyDetected(members)) {
            duplicates.push({
              key: twitchLogin,
              type: "twitchLogin",
              members: members,
            });
            markAsDetected(members);
          }
        }
      }
    }

    // Vérifier les doublons par pseudo Discord (discordUsername)
    for (const [discordUsername, members] of Object.entries(membersByDiscordUsername)) {
      if (members.length > 1) {
        // Vérifier si au moins un critère diffère (displayName, Twitch, ou Discord ID)
        const uniqueDisplayNames = [...new Set(members.map((m) => m.displayName?.toLowerCase().trim()).filter(Boolean))];
        const uniqueTwitchLogins = [...new Set(members.map((m) => m.twitchLogin?.toLowerCase()).filter(Boolean))];
        const uniqueDiscordIds = [...new Set(members.map((m) => m.discordId).filter(Boolean))];
        
        if (uniqueDisplayNames.length > 1 || uniqueTwitchLogins.length > 1 || uniqueDiscordIds.length > 1) {
          if (!isAlreadyDetected(members)) {
            duplicates.push({
              key: discordUsername,
              type: "discordUsername",
              members: members,
            });
            markAsDetected(members);
          }
        }
      }
    }

    // Vérifier les doublons par ID Discord (discordId)
    for (const [discordId, members] of Object.entries(membersByDiscordId)) {
      if (members.length > 1) {
        // Vérifier si au moins un critère diffère (displayName, Twitch, ou Discord username)
        const uniqueDisplayNames = [...new Set(members.map((m) => m.displayName?.toLowerCase().trim()).filter(Boolean))];
        const uniqueTwitchLogins = [...new Set(members.map((m) => m.twitchLogin?.toLowerCase()).filter(Boolean))];
        const uniqueDiscordUsernames = [...new Set(members.map((m) => m.discordUsername?.toLowerCase()).filter(Boolean))];
        
        if (uniqueDisplayNames.length > 1 || uniqueTwitchLogins.length > 1 || uniqueDiscordUsernames.length > 1) {
          if (!isAlreadyDetected(members)) {
            duplicates.push({
              key: discordId,
              type: "discordId",
              members: members,
            });
            markAsDetected(members);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      duplicates: duplicates,
      totalDuplicates: duplicates.length,
      totalMembersInDuplicates: duplicates.reduce((sum, dup) => sum + dup.members.length, 0),
    });
  } catch (error: any) {
    console.error("[Detect Duplicates] Erreur:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de la détection des doublons" },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/requireAdmin";
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
    // Authentification NextAuth + permission write (requis pour fusionner)
    const admin = await requirePermission("write");
    
    if (!admin) {
      return NextResponse.json(
        { error: "Non authentifié ou permissions insuffisantes. Seuls les admins avec permission write peuvent fusionner des membres." },
        { status: 401 }
      );
    }

    // Charger les données
    await loadMemberDataFromStorage();
    const allMembers = getAllMemberData();

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
        updatedBy: admin.discordId,
        updatedAt: new Date(),
        // Marquer comme modifié manuellement pour protéger contre les synchronisations
        roleManuallySet: true,
      },
      admin.discordId
    );

    // Supprimer les autres membres (doublons)
    for (const twitchLogin of otherMembers) {
      await deleteMemberData(twitchLogin.toLowerCase(), admin.discordId);
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
    // Authentification NextAuth + permission read
    const admin = await requirePermission("read");
    
    if (!admin) {
      return NextResponse.json(
        { error: "Non authentifié ou permissions insuffisantes" },
        { status: 401 }
      );
    }

    // Charger les données
    await loadMemberDataFromStorage();
    const allMembers = getAllMemberData();

    // Les données sont déjà chargées pour la vérification de rôle
    // Réutiliser allMembers déjà chargé

    // Grouper les membres par différents critères pour détecter les doublons
    const membersByDisplayName: Record<string, any[]> = {};
    const membersByTwitchLogin: Record<string, any[]> = {};
    const membersByDiscordUsername: Record<string, any[]> = {};
    const membersByDiscordId: Record<string, any[]> = {};
    const membersByIdentity: Record<string, any[]> = {};

    const addToGroup = (group: Record<string, any[]>, key: string | undefined, member: any) => {
      if (!key) return;
      if (!group[key]) {
        group[key] = [];
      }
      group[key].push(member);
    };

    const normalizeBasic = (value?: string): string | null => {
      if (!value) return null;
      const normalized = value.toLowerCase().trim().replace(/\s+/g, " ");
      return normalized || null;
    };

    const normalizeIdentity = (value?: string): string | null => {
      const basic = normalizeBasic(value);
      if (!basic) return null;

      // Uniformiser les alias d'identity: supprime accents/symboles et garde uniquement [a-z0-9]
      const asciiLike = basic
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "");

      if (asciiLike.length < 3) return null;
      return asciiLike;
    };

    for (const member of allMembers) {
      // Grouper par nom du créateur (displayName) - case-insensitive
      addToGroup(membersByDisplayName, normalizeBasic(member.displayName) ?? undefined, member);

      // Grouper par pseudo Twitch (twitchLogin) - case-insensitive
      addToGroup(membersByTwitchLogin, normalizeBasic(member.twitchLogin) ?? undefined, member);

      // Grouper par pseudo Discord (discordUsername) - case-insensitive
      addToGroup(membersByDiscordUsername, normalizeBasic(member.discordUsername) ?? undefined, member);

      // Grouper par ID Discord (discordId)
      if (member.discordId) {
        addToGroup(membersByDiscordId, member.discordId, member);
      }

      // Grouper par identité normalisée (couvre changements Discord/recréation de profil)
      const identityKeys = new Set<string>();
      const siteUsernameIdentity = normalizeIdentity(member.siteUsername);
      const displayNameIdentity = normalizeIdentity(member.displayName);

      // Supprimer "@" éventuel pour les pseudos Discord affichés
      const discordUsernameRaw = member.discordUsername?.replace(/^@+/, "");
      const discordIdentity = normalizeIdentity(discordUsernameRaw);

      if (siteUsernameIdentity) identityKeys.add(siteUsernameIdentity);
      if (displayNameIdentity) identityKeys.add(displayNameIdentity);
      if (discordIdentity) identityKeys.add(discordIdentity);

      for (const identityKey of identityKeys) {
        addToGroup(membersByIdentity, identityKey, member);
      }
    }

    // Détecter les doublons selon tous les critères
    const duplicates: Array<{
      key: string; // Critère utilisé pour détecter le doublon
      type: "displayName" | "twitchLogin" | "discordUsername" | "discordId" | "identity";
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

    const registerDuplicatesFromGroup = (
      group: Record<string, any[]>,
      type: "displayName" | "twitchLogin" | "discordUsername" | "discordId" | "identity"
    ) => {
      for (const [key, members] of Object.entries(group)) {
        if (members.length <= 1) continue;

        const uniqueTwitchLogins = [
          ...new Set(members.map((m) => m.twitchLogin?.toLowerCase()).filter(Boolean)),
        ];
        if (uniqueTwitchLogins.length <= 1) continue;

        if (isAlreadyDetected(members)) continue;

        duplicates.push({
          key,
          type,
          members,
        });
        markAsDetected(members);
      }
    };

    registerDuplicatesFromGroup(membersByDisplayName, "displayName");
    registerDuplicatesFromGroup(membersByTwitchLogin, "twitchLogin");
    registerDuplicatesFromGroup(membersByDiscordUsername, "discordUsername");
    registerDuplicatesFromGroup(membersByDiscordId, "discordId");
    registerDuplicatesFromGroup(membersByIdentity, "identity");

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


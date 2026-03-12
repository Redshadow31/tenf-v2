import { NextRequest, NextResponse } from "next/server";
import { memberRepository } from "@/lib/repositories";
import { getTwitchUsers } from "@/lib/twitch";
import type { TwitchUser } from "@/lib/twitch";
import { requireAdmin, requirePermission } from "@/lib/requireAdmin";
import { logAction, prepareAuditValues } from "@/lib/admin/logger";
import { logApi, logMember } from "@/lib/logging/logger";
import { toCanonicalBadges, toCanonicalMemberRole } from "@/lib/memberRoles";

// Désactiver le cache pour cette route - les données doivent toujours être à jour
export const dynamic = 'force-dynamic';
export const revalidate = 0;
const LEGACY_FETCH_TIMEOUT_MS = 1500;
const TWITCH_AVATARS_TIMEOUT_MS = 15000;
const SUPABASE_PAGE_SIZE = 1000;
const SUPABASE_MAX_PAGES = 20;

function getDiscordDefaultAvatar(discordId?: string): string | undefined {
  if (!discordId) return undefined;
  const numericId = Number.parseInt(discordId, 10);
  if (Number.isNaN(numericId)) return undefined;
  return `https://cdn.discordapp.com/embed/avatars/${numericId % 5}.png`;
}

function isUsableTwitchAvatar(url?: string): boolean {
  if (!url) return false;
  const normalized = url.toLowerCase();
  return !normalized.includes("placehold.co") && !normalized.includes("text=twitch");
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, fallback: T, label: string): Promise<T> {
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<T>((resolve) => {
    timeoutHandle = setTimeout(() => {
      console.warn(`[Admin Members] Timeout (${timeoutMs}ms) sur ${label}, fallback appliqué.`);
      resolve(fallback);
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    return result;
  } catch (error) {
    console.warn(`[Admin Members] Erreur sur ${label}, fallback appliqué:`, error);
    return fallback;
  } finally {
    if (timeoutHandle) clearTimeout(timeoutHandle);
  }
}

function normalizeId(value?: string | null): string | undefined {
  if (!value) return undefined;
  const v = String(value).trim();
  return v.length > 0 ? v : undefined;
}

function normalizeLogin(value?: string | null): string | undefined {
  const v = normalizeId(value);
  return v ? v.toLowerCase() : undefined;
}

function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (error && typeof error === "object") {
    const asRecord = error as Record<string, unknown>;
    const parts = [asRecord.message, asRecord.details, asRecord.hint]
      .filter((v): v is string => typeof v === "string" && v.length > 0);
    if (parts.length > 0) return parts.join(" | ");
  }
  return String(error);
}

async function fetchAllSupabaseMembers(): Promise<any[]> {
  const allMembers: any[] = [];

  for (let page = 0; page < SUPABASE_MAX_PAGES; page++) {
    const offset = page * SUPABASE_PAGE_SIZE;
    const chunk = await memberRepository.findAll(SUPABASE_PAGE_SIZE, offset);

    if (!Array.isArray(chunk) || chunk.length === 0) {
      break;
    }

    allMembers.push(...chunk);

    if (chunk.length < SUPABASE_PAGE_SIZE) {
      break;
    }
  }

  return allMembers;
}

function mergeMembersWithoutDuplicates(legacyMembers: any[], supabaseMembers: any[]): any[] {
  const mergedByKey = new Map<string, any>();
  const keyByDiscordId = new Map<string, string>();
  const keyByTwitchId = new Map<string, string>();
  const keyByLogin = new Map<string, string>();

  const upsert = (member: any) => {
    const discordId = normalizeId(member?.discordId);
    const twitchId = normalizeId(member?.twitchId);
    const twitchLogin = normalizeLogin(member?.twitchLogin);

    let key =
      (discordId && keyByDiscordId.get(discordId)) ||
      (twitchId && keyByTwitchId.get(twitchId)) ||
      (twitchLogin && keyByLogin.get(twitchLogin));

    if (!key) {
      key =
        (discordId && `discord:${discordId}`) ||
        (twitchId && `twitchId:${twitchId}`) ||
        (twitchLogin && `login:${twitchLogin}`) ||
        `fallback:${mergedByKey.size + 1}`;
    }

    const current = mergedByKey.get(key) || {};
    const merged = { ...current, ...member };
    mergedByKey.set(key, merged);

    if (discordId) keyByDiscordId.set(discordId, key);
    if (twitchId) keyByTwitchId.set(twitchId, key);
    if (twitchLogin) keyByLogin.set(twitchLogin, key);
  };

  // Important: legacy d'abord, Supabase ensuite (Supabase prioritaire en cas de conflit)
  legacyMembers.forEach(upsert);
  supabaseMembers.forEach(upsert);

  return Array.from(mergedByKey.values());
}

/**
 * GET - Récupère tous les membres ou un membre spécifique
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  try {
    // Authentification NextAuth robuste
    const admin = await requireAdmin();
    
    if (!admin) {
      logApi.route('GET', '/api/admin/members', 401);
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const twitchLogin = searchParams.get("twitchLogin");
    const discordId = searchParams.get("discordId");

    if (twitchLogin) {
      // Récupérer un membre spécifique par login Twitch
      let member = await memberRepository.findByTwitchLogin(twitchLogin);
      if (!member) {
        try {
          const { loadMemberDataFromStorage, getMemberData } = await import('@/lib/memberData');
          await loadMemberDataFromStorage();
          member = getMemberData(twitchLogin) as any;
        } catch (error) {
          console.warn(`[Admin Members] Fallback legacy échoué (twitchLogin=${twitchLogin}):`, error);
        }
      }
      if (!member) {
        const duration = Date.now() - startTime;
        logApi.route('GET', '/api/admin/members', 404, duration);
        return NextResponse.json(
          { error: "Membre non trouvé" },
          { status: 404 }
        );
      }
      const response = NextResponse.json({
        member: {
          ...member,
          role: toCanonicalMemberRole(member.role),
          badges: toCanonicalBadges(member.badges),
        },
      });
      
      // Désactiver le cache côté client
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');
      
      const duration = Date.now() - startTime;
      logApi.route('GET', '/api/admin/members', 200, duration, admin.id, { twitchLogin });
      
      return response;
    }

    if (discordId) {
      // Récupérer un membre spécifique par ID Discord
      let member = await memberRepository.findByDiscordId(discordId);
      if (!member) {
        try {
          const { loadMemberDataFromStorage, getAllMemberData } = await import('@/lib/memberData');
          await loadMemberDataFromStorage();
          member =
            (getAllMemberData() as any[]).find((m) => normalizeId(m.discordId) === normalizeId(discordId)) || null;
        } catch (error) {
          console.warn(`[Admin Members] Fallback legacy échoué (discordId=${discordId}):`, error);
        }
      }
      if (!member) {
        const duration = Date.now() - startTime;
        logApi.route('GET', '/api/admin/members', 404, duration);
        return NextResponse.json(
          { error: "Membre non trouvé" },
          { status: 404 }
        );
      }
      const response = NextResponse.json({
        member: {
          ...member,
          role: toCanonicalMemberRole(member.role),
          badges: toCanonicalBadges(member.badges),
        },
      });
      
      // Désactiver le cache côté client
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');
      
      const duration = Date.now() - startTime;
      logApi.route('GET', '/api/admin/members', 200, duration, admin.id, { discordId });
      
      return response;
    }

    // Récupérer TOUS les membres Supabase + fallback legacy (limité dans le temps pour éviter les blocages UI)
    const supabaseMembersPromise = fetchAllSupabaseMembers();
    const legacyMembersPromise = withTimeout(
      (async () => {
        const { loadMemberDataFromStorage, getAllMemberData } = await import('@/lib/memberData');
        await loadMemberDataFromStorage();
        return (getAllMemberData() as any[]) || [];
      })(),
      LEGACY_FETCH_TIMEOUT_MS,
      [],
      "fallback legacy"
    );

    const [supabaseMembers, legacyMembers] = await Promise.all([
      supabaseMembersPromise,
      legacyMembersPromise,
    ]);
    const members = mergeMembersWithoutDuplicates(legacyMembers, supabaseMembers);

    // Récupérer les avatars Twitch pour TOUS les membres (y compris non validés)
    // La page admin gestion utilisait /api/members/public qui ne renvoie que les validés → avatars manquants
    const twitchLogins = Array.from(
      new Set(members.map((m) => m.twitchLogin).filter(Boolean) as string[])
    );
    let avatarMap = new Map<string, string>();
    if (twitchLogins.length > 0) {
      const twitchUsers = await withTimeout(
        getTwitchUsers(twitchLogins),
        TWITCH_AVATARS_TIMEOUT_MS,
        [],
        "récupération avatars Twitch"
      );
      twitchUsers.forEach((u: TwitchUser) => {
        if (isUsableTwitchAvatar(u.profile_image_url)) {
          avatarMap.set(u.login.toLowerCase(), u.profile_image_url);
        }
      });
    }

    // Enrichir chaque membre avec son avatar
    const membersWithAvatars = members.map((m) => {
      const normalizedLogin = typeof m.twitchLogin === 'string' ? m.twitchLogin.toLowerCase() : '';
      let avatar = normalizedLogin ? avatarMap.get(normalizedLogin) : undefined;
      if (!avatar && m.discordId) avatar = getDiscordDefaultAvatar(m.discordId);
      if (!avatar) {
        avatar = `https://placehold.co/64x64?text=${(m.displayName || m.twitchLogin || "?").charAt(0).toUpperCase()}`;
      }
      return {
        ...m,
        role: toCanonicalMemberRole(m.role),
        badges: toCanonicalBadges(m.badges),
        avatar,
      };
    });

    const response = NextResponse.json({ members: membersWithAvatars });
    
    // Désactiver le cache côté client
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    const duration = Date.now() - startTime;
    logApi.route('GET', '/api/admin/members', 200, duration, admin.id, { count: members.length });
    
    return response;
  } catch (error) {
    const duration = Date.now() - startTime;
    logApi.error('/api/admin/members', error instanceof Error ? error : new Error(String(error)));
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
  const startTime = Date.now();
  try {
    const admin = await requireAdmin();
    
    if (!admin) {
      logApi.route('POST', '/api/admin/members', 401);
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    // Permission write déjà vérifiée par requirePermission dans requireAdmin

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
      birthday,
      twitchAffiliateDate,
      shadowbanLives,
      onboardingStatus,
      mentorTwitchLogin,
      primaryLanguage,
      timezone,
      countryCode,
      lastReviewAt,
      nextReviewAt,
    } = body;

    const normalizedRole = typeof role === "string" ? toCanonicalMemberRole(role) : undefined;
    const normalizedBadges = toCanonicalBadges(badges);

    if (!twitchLogin || !displayName || !twitchUrl) {
      return NextResponse.json(
        { error: "twitchLogin, displayName et twitchUrl sont requis" },
        { status: 400 }
      );
    }

    // Vérifier si le membre existe déjà
    const existingMember = await memberRepository.findByTwitchLogin(twitchLogin);
    if (existingMember) {
      return NextResponse.json(
        { error: "Un membre avec ce login Twitch existe déjà" },
        { status: 400 }
      );
    }
    
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
    
    const targetRole = normalizedRole || "Affilié";
    const basePayload = {
      twitchLogin,
      twitchId,
      displayName,
      twitchUrl,
      discordId,
      discordUsername,
      isVip: isVip || false,
      isActive: isActive !== undefined ? isActive : true,
      badges: normalizedBadges || [],
      description,
      customBio,
      birthday: birthday ? new Date(birthday) : undefined,
      twitchAffiliateDate: twitchAffiliateDate ? new Date(twitchAffiliateDate) : undefined,
      shadowbanLives: shadowbanLives === true,
      profileValidationStatus: "valide" as const, // Membres créés par admin = visibles sur /membres
      onboardingStatus: onboardingStatus || "a_faire",
      mentorTwitchLogin,
      primaryLanguage,
      timezone,
      countryCode,
      lastReviewAt: lastReviewAt ? new Date(lastReviewAt) : undefined,
      nextReviewAt: nextReviewAt ? new Date(nextReviewAt) : undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
      updatedBy: admin.discordId,
    };

    let roleFallbackApplied = false;
    let newMember;
    try {
      newMember = await memberRepository.create({
        ...basePayload,
        role: targetRole,
      });
    } catch (createError) {
      const createMessage = extractErrorMessage(createError);
      const isMemberRoleEnumError =
        createMessage.includes("member_role") &&
        (createMessage.includes("invalid input value") ||
          createMessage.includes("enum") ||
          createMessage.includes("violates check"));

      // Compatibilité: certaines bases n'ont pas encore l'enum "Nouveau".
      if (targetRole === "Nouveau" && isMemberRoleEnumError) {
        roleFallbackApplied = true;
        newMember = await memberRepository.create({
          ...basePayload,
          role: "Affilié",
        });
      } else {
        throw createError;
      }
    }

    // Logger l'action avec before/after optimisés
    const { previousValue, newValue } = prepareAuditValues(undefined, newMember);
    
    const duration = Date.now() - startTime;
    logMember.create(twitchLogin, admin.id);
    logApi.route('POST', '/api/admin/members', 200, duration, admin.id, { twitchLogin });
    
    await logAction({
      action: "member.create",
      resourceType: "member",
      resourceId: twitchLogin,
      previousValue,
      newValue,
      metadata: { sourcePage: "/admin/membres/gestion" },
    });

    return NextResponse.json({
      member: newMember,
      success: true,
      roleFallbackApplied,
      warning: roleFallbackApplied
        ? "Le rôle 'Nouveau' n'est pas disponible sur cette base. Le membre a été créé en 'Affilié'."
        : undefined,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logApi.error('/api/admin/members', error instanceof Error ? error : new Error(String(error)));
    const message = extractErrorMessage(error);
    const isDuplicateTwitchIdError =
      message.toLowerCase().includes("twitch_id") &&
      (message.toLowerCase().includes("duplicate key") ||
        message.toLowerCase().includes("unique"));

    if (isDuplicateTwitchIdError) {
      const idFromErrorMatch = message.match(/\d{5,}/);
      const incomingTwitchId = normalizeId(idFromErrorMatch?.[0]);
      try {
        const allMembers = await memberRepository.findAll(5000, 0);
        const resolvedExisting = allMembers.find((m) => {
          const existingId = normalizeId(m.twitchId);
          return !!incomingTwitchId && !!existingId && incomingTwitchId === existingId;
        });

        if (resolvedExisting) {
          return NextResponse.json(
            {
              error: `Cet ID Twitch est déjà lié à ${resolvedExisting.twitchLogin}${resolvedExisting.displayName ? ` (${resolvedExisting.displayName})` : ""}.`,
            },
            { status: 400 }
          );
        }
      } catch {
        // Fallback silencieux: on renvoie le message générique ci-dessous
      }

      return NextResponse.json(
        { error: "Cet ID Twitch est déjà utilisé par un autre membre." },
        { status: 400 }
      );
    }

    if (message.includes('member_role')) {
      return NextResponse.json(
        {
          error:
            "Le rôle sélectionné n'est pas encore disponible dans la base (member_role). Applique la migration SQL des rôles, ou utilise temporairement le rôle 'Affilié'.",
        },
        { status: 400 }
      );
    }
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
  const startTime = Date.now();
  try {
    // Authentification NextAuth + permission write
    const admin = await requirePermission("write");
    
    if (!admin) {
      logApi.route('PUT', '/api/admin/members', 401);
      return NextResponse.json(
        { error: "Non authentifié ou permissions insuffisantes" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { 
      twitchLogin, 
      memberId, // Identifiant stable (discordId) 
      originalDiscordId, // discordId original pour identifier le membre
      originalTwitchId, // twitchId original pour identifier le membre
      originalTwitchLogin, // twitchLogin original pour identifier le membre si le pseudo change
      ...updates 
    } = body;

    if (typeof updates.role === "string") {
      updates.role = toCanonicalMemberRole(updates.role);
    }
    if (Array.isArray(updates.badges)) {
      updates.badges = toCanonicalBadges(updates.badges);
    }

    // Identifier le membre par son identifiant stable (discordId ou twitchId) en priorité
    let existingMember = null;
    
    if (originalDiscordId) {
      // Chercher par ID Discord (priorité)
      existingMember = await memberRepository.findByDiscordId(originalDiscordId);
      console.log(`[Update Member API] Recherche par Discord ID: ${originalDiscordId}`);
    } else if (originalTwitchLogin) {
      // Fallback robuste : chercher par ancien login Twitch si le pseudo a été modifié
      existingMember = await memberRepository.findByTwitchLogin(originalTwitchLogin);
      console.log(`[Update Member API] Recherche par Twitch login original: ${originalTwitchLogin}`);
    } else if (twitchLogin) {
      // Fallback: chercher par twitchLogin
      existingMember = await memberRepository.findByTwitchLogin(twitchLogin);
      console.log(`[Update Member API] Recherche par Twitch login: ${twitchLogin}`);
    }
    
    if (!existingMember) {
      console.error(`[Update Member API] ❌ Membre non trouvé avec:`, {
        twitchLogin,
        originalDiscordId,
        originalTwitchId,
        originalTwitchLogin,
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

    // Normaliser champs Phase 2
    if (updates.mentorTwitchLogin !== undefined) {
      if (updates.mentorTwitchLogin === "" || updates.mentorTwitchLogin === null) {
        updates.mentorTwitchLogin = undefined;
      } else if (typeof updates.mentorTwitchLogin === "string") {
        updates.mentorTwitchLogin = updates.mentorTwitchLogin.toLowerCase().trim();
      }
    }
    if (updates.primaryLanguage !== undefined && (updates.primaryLanguage === "" || updates.primaryLanguage === null)) {
      updates.primaryLanguage = undefined;
    }
    if (updates.timezone !== undefined && (updates.timezone === "" || updates.timezone === null)) {
      updates.timezone = undefined;
    }
    if (updates.countryCode !== undefined) {
      if (updates.countryCode === "" || updates.countryCode === null) {
        updates.countryCode = undefined;
      } else if (typeof updates.countryCode === "string") {
        updates.countryCode = updates.countryCode.toUpperCase().trim();
      }
    }
    if (updates.lastReviewAt !== undefined) {
      if (updates.lastReviewAt === "" || updates.lastReviewAt === null) {
        updates.lastReviewAt = undefined;
      } else if (typeof updates.lastReviewAt === "string") {
        updates.lastReviewAt = new Date(updates.lastReviewAt);
      }
    }
    if (updates.nextReviewAt !== undefined) {
      if (updates.nextReviewAt === "" || updates.nextReviewAt === null) {
        updates.nextReviewAt = undefined;
      } else if (typeof updates.nextReviewAt === "string") {
        updates.nextReviewAt = new Date(updates.nextReviewAt);
      }
    }
    if (updates.birthday !== undefined) {
      if (updates.birthday === "" || updates.birthday === null) {
        updates.birthday = undefined;
      } else if (typeof updates.birthday === "string") {
        updates.birthday = new Date(updates.birthday);
      }
    }
    if (updates.twitchAffiliateDate !== undefined) {
      if (updates.twitchAffiliateDate === "" || updates.twitchAffiliateDate === null) {
        updates.twitchAffiliateDate = undefined;
      } else if (typeof updates.twitchAffiliateDate === "string") {
        updates.twitchAffiliateDate = new Date(updates.twitchAffiliateDate);
      }
    }
    if (updates.shadowbanLives !== undefined) {
      updates.shadowbanLives = Boolean(updates.shadowbanLives);
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

    // Gérer roleHistory si le rôle change
    if (updates.role && updates.role !== existingMember.role) {
      const roleHistory = existingMember.roleHistory || [];
      updates.roleHistory = [
        ...roleHistory,
        {
          fromRole: existingMember.role,
          toRole: updates.role,
          changedAt: new Date().toISOString(),
          changedBy: admin.discordId || "admin",
          reason: (updates as any).roleChangeReason,
        },
      ];
    }

    // Ajouter updatedBy et updatedAt
    updates.updatedBy = admin.discordId;
    updates.updatedAt = new Date();

    // Log pour déboguer
    console.log(`[Update Member API] ${originalLogin}:`, {
      existingDiscordId: existingMember.discordId,
      newDiscordId: updates.discordId,
      existingDiscordUsername: existingMember.discordUsername,
      newDiscordUsername: updates.discordUsername,
      existingTwitchLogin: existingMember.twitchLogin,
      newTwitchLogin: updates.twitchLogin || twitchLogin,
      existingParrain: existingMember.parrain,
      newParrain: updates.parrain,
    });

    const updatedMember = await memberRepository.update(originalLogin, updates);
    
    // Log après mise à jour
    console.log(`[Update Member API] ✅ Après mise à jour:`, {
      discordId: updatedMember?.discordId,
      discordUsername: updatedMember?.discordUsername,
      twitchLogin: updatedMember?.twitchLogin,
      parrain: updatedMember?.parrain,
    });

    // Identifier les champs modifiés
    const fieldsChanged: string[] = [];
    if (updates.role && updates.role !== existingMember.role) fieldsChanged.push("role");
    if (updates.isVip !== undefined && updates.isVip !== existingMember.isVip) fieldsChanged.push("isVip");
    if (updates.isActive !== undefined && updates.isActive !== existingMember.isActive) fieldsChanged.push("isActive");
    if (updates.description !== undefined && updates.description !== existingMember.description) fieldsChanged.push("description");
    if (updates.twitchLogin && updates.twitchLogin !== existingMember.twitchLogin) fieldsChanged.push("twitchLogin");
    if (updates.discordId !== undefined && updates.discordId !== existingMember.discordId) fieldsChanged.push("discordId");
    if (updates.badges !== undefined) fieldsChanged.push("badges");
    if (updates.parrain !== undefined) fieldsChanged.push("parrain");
    if (updates.onboardingStatus !== undefined) fieldsChanged.push("onboardingStatus");
    if (updates.mentorTwitchLogin !== undefined) fieldsChanged.push("mentorTwitchLogin");
    if (updates.primaryLanguage !== undefined) fieldsChanged.push("primaryLanguage");
    if (updates.timezone !== undefined) fieldsChanged.push("timezone");
    if (updates.countryCode !== undefined) fieldsChanged.push("countryCode");
    if (updates.lastReviewAt !== undefined) fieldsChanged.push("lastReviewAt");
    if (updates.nextReviewAt !== undefined) fieldsChanged.push("nextReviewAt");
    if (updates.birthday !== undefined) fieldsChanged.push("birthday");
    if (updates.twitchAffiliateDate !== undefined) fieldsChanged.push("twitchAffiliateDate");
    if (updates.shadowbanLives !== undefined) fieldsChanged.push("shadowbanLives");

    // Logger l'action avec before/after optimisés (état complet avant/après)
    const { previousValue, newValue } = prepareAuditValues(existingMember, updatedMember);
    
    const duration = Date.now() - startTime;
    logMember.update(originalLogin, admin.id);
    logApi.route('PUT', '/api/admin/members', 200, duration, admin.id, { twitchLogin: originalLogin, fieldsChanged });
    
    await logAction({
      action: "member.update",
      resourceType: "member",
      resourceId: updatedMember.twitchLogin || twitchLogin,
      previousValue,
      newValue,
      metadata: {
        fieldsChanged,
        sourcePage: "/admin/membres/gestion",
      },
    });

    return NextResponse.json({ member: updatedMember, success: true });
  } catch (error) {
    const duration = Date.now() - startTime;
    logApi.error('/api/admin/members', error instanceof Error ? error : new Error(String(error)));
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes('invalid input value for enum') && message.includes('member_role')) {
      return NextResponse.json(
        { error: "La base n'est pas encore migrée pour les nouveaux rôles (member_role)." },
        { status: 400 }
      );
    }
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
  const startTime = Date.now();
  try {
    // Authentification NextAuth + permission write
    const admin = await requirePermission("write");
    
    if (!admin) {
      logApi.route('DELETE', '/api/admin/members', 401);
      return NextResponse.json(
        { error: "Non authentifié ou permissions insuffisantes" },
        { status: 401 }
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

    // Chercher le membre dans Supabase
    let member = await memberRepository.findByTwitchLogin(twitchLogin);
    
    // Si pas trouvé dans Supabase, chercher dans les Blobs
    let memberFromBlobs = null;
    if (!member) {
      try {
        const { loadMemberDataFromStorage, getMemberData } = await import('@/lib/memberData');
        await loadMemberDataFromStorage();
        memberFromBlobs = getMemberData(twitchLogin);
      } catch (error) {
        console.warn(`[Delete Member] Erreur lors de la recherche dans les Blobs pour ${twitchLogin}:`, error);
      }
    }

    // Si le membre n'existe ni dans Supabase ni dans les Blobs
    if (!member && !memberFromBlobs) {
      return NextResponse.json(
        { error: "Membre non trouvé" },
        { status: 404 }
      );
    }

    // Utiliser le membre de Supabase en priorité, sinon celui des Blobs
    const memberToDelete = member || memberFromBlobs;

    // Supprimer définitivement de Supabase (hard delete, pas soft delete)
    if (member) {
      try {
        await memberRepository.hardDelete(twitchLogin);
        console.log(`[Delete Member] ✅ Membre supprimé définitivement de Supabase: ${twitchLogin}`);
      } catch (error) {
        console.error(`[Delete Member] ❌ Erreur lors de la suppression de Supabase pour ${twitchLogin}:`, error);
        // Continuer quand même pour supprimer des Blobs
      }
    }

    // Supprimer des Blobs si présent
    if (memberFromBlobs || member) {
      try {
        const { deleteMemberData } = await import('@/lib/memberData');
        const deletedFromBlobs = await deleteMemberData(twitchLogin, admin.discordId);
        if (deletedFromBlobs) {
          console.log(`[Delete Member] ✅ Membre supprimé des Blobs: ${twitchLogin}`);
        }
      } catch (error) {
        console.error(`[Delete Member] ❌ Erreur lors de la suppression des Blobs pour ${twitchLogin}:`, error);
        // Ne pas bloquer si la suppression des Blobs échoue
      }
    }

    // Logger l'action avec before optimisé (état complet avant suppression)
    const { previousValue } = prepareAuditValues(memberToDelete, undefined);
    
    const duration = Date.now() - startTime;
    logMember.delete(twitchLogin, admin.id);
    logApi.route('DELETE', '/api/admin/members', 200, duration, admin.id, { twitchLogin });
    
    await logAction({
      action: "member.delete",
      resourceType: "member",
      resourceId: twitchLogin,
      previousValue,
      metadata: { sourcePage: "/admin/membres/gestion" },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const duration = Date.now() - startTime;
    logApi.error('/api/admin/members', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}


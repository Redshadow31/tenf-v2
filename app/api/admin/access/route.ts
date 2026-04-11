import { NextRequest, NextResponse } from 'next/server';
import {
  listModerationCharterValidations,
  type ModerationCharterValidationEntry,
} from '@/lib/moderationCharterValidationsStorage';
import { requireRole } from '@/lib/requireAdmin';
import { isFounder, getAllAdminIds, getAdminRole, FOUNDERS, normalizeAdminRole, type AdminRole } from '@/lib/adminRoles';
import { loadAdminAccessCache } from '@/lib/adminAccessCache';
import { memberRepository } from '@/lib/repositories';
import { getBlobStore, getAllMemberData, loadMemberDataFromStorage } from '@/lib/memberData';

const ACCESS_STORE = 'tenf-admin-access';
const ACCESS_KEY = 'admin-access-list';
const DEV_AUTH_BYPASS_ENABLED =
  process.env.NODE_ENV !== "production" &&
  process.env.ENABLE_DEV_AUTH !== "false";
const DEV_BYPASS_DISCORD_ID = process.env.DEV_BYPASS_DISCORD_ID || "333001130705420299";
const DEV_BYPASS_USERNAME = process.env.DEV_BYPASS_USERNAME || "Dev Fondateur";

interface AdminAccess {
  discordId: string;
  role: AdminRole;
  addedAt: string;
  addedBy: string;
  username?: string; // Optionnel, mis à jour depuis Discord
  adminAlias?: string; // Pseudo interne visible dans l'espace admin
}

interface StoredAdminAccessEntry {
  discordId: string;
  role: string;
  addedAt: string;
  addedBy: string;
  username?: string;
  adminAlias?: string;
}

function sanitizeAdminAlias(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim().replace(/\s+/g, " ");
  if (!normalized) return undefined;
  return normalized.slice(0, 40);
}

function parseStoredAccessEntries(parsed: StoredAdminAccessEntry[]): AdminAccess[] {
  return parsed.reduce<AdminAccess[]>((acc, entry) => {
    const normalizedRole = normalizeAdminRole(entry.role);
    if (!normalizedRole) return acc;
    acc.push({
      ...entry,
      role: normalizedRole,
      adminAlias: sanitizeAdminAlias(entry.adminAlias),
    });
    return acc;
  }, []);
}

function getStoredEntryByDiscordId(storedAccessList: AdminAccess[], discordId: string): AdminAccess | undefined {
  return storedAccessList.find((entry) => entry.discordId === discordId);
}

/** Dernière validation charte par membre (liste déjà triée du plus récent au plus ancien). */
function buildLatestCharterValidationByDiscordId(
  entries: ModerationCharterValidationEntry[],
): Map<string, { validatedAt: string; charterVersion: string }> {
  const m = new Map<string, { validatedAt: string; charterVersion: string }>();
  for (const e of entries) {
    const id = String(e.validatedMemberDiscordId || "").trim();
    if (!id || m.has(id)) continue;
    m.set(id, { validatedAt: e.validatedAt, charterVersion: e.charterVersion || "" });
  }
  return m;
}

/**
 * GET - Récupère la liste de tous les membres avec accès au dashboard admin
 */
export async function GET() {
  try {
    // Authentification NextAuth + rôle FOUNDER requis
    const admin =
      (await requireRole("FONDATEUR")) ||
      (DEV_AUTH_BYPASS_ENABLED
        ? {
            id: DEV_BYPASS_DISCORD_ID,
            discordId: DEV_BYPASS_DISCORD_ID,
            username: DEV_BYPASS_USERNAME,
            avatar: null,
            role: "FONDATEUR" as AdminRole,
          }
        : null);
    
    if (!admin) {
      return NextResponse.json(
        { error: "Non authentifié ou accès refusé. Réservé aux fondateurs." },
        { status: 403 }
      );
    }

    // Récupérer la liste depuis Blobs (membres ajoutés manuellement)
    const store = getBlobStore(ACCESS_STORE);
    let storedAccessList: AdminAccess[] = [];
    try {
      const stored = await store.get(ACCESS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as StoredAdminAccessEntry[];
        storedAccessList = parseStoredAccessEntries(parsed);
      }
    } catch (error) {
      console.error('Error loading admin access from Blobs:', error);
    }

    // Charger le cache pour obtenir les membres ajoutés via Blobs
    await loadAdminAccessCache();
    
    // Construire la liste complète avec TOUS les membres ayant accès admin
    const accessList: AdminAccess[] = [];
    const addedIds = new Set<string>();
    
    // 1. Toujours inclure les fondateurs en premier (hardcodés, non modifiables)
    FOUNDERS.forEach(id => {
      const stored = getStoredEntryByDiscordId(storedAccessList, id);
      accessList.push({
        discordId: id,
        role: 'FONDATEUR' as AdminRole,
        addedAt: new Date(0).toISOString(), // Date ancienne pour indiquer qu'ils sont là depuis le début
        addedBy: 'system',
        adminAlias: stored?.adminAlias,
      });
      addedIds.add(id);
    });
    
    // 2. Ajouter tous les autres membres hardcodés (Admin Adjoint, Modo Mentor, Modo Junior)
    const allHardcodedIds = getAllAdminIds();
    allHardcodedIds.forEach(id => {
      if (!addedIds.has(id)) {
        const role = getAdminRole(id);
        if (role) {
          const stored = getStoredEntryByDiscordId(storedAccessList, id);
          accessList.push({
            discordId: id,
            role: role,
            addedAt: new Date(0).toISOString(),
            addedBy: 'system',
            adminAlias: stored?.adminAlias,
          });
          addedIds.add(id);
        }
      }
    });
    
    // 3. Ajouter les membres ajoutés manuellement via Blobs (ceux qui ne sont pas hardcodés)
    storedAccessList.forEach(access => {
      if (!addedIds.has(access.discordId)) {
        accessList.push(access);
        addedIds.add(access.discordId);
      }
    });

    // Fonction helper pour récupérer les infos Discord d'un utilisateur depuis un cache
    const createDiscordUserInfoResolver = async () => {
      const userInfoCache = new Map<string, { username: string; avatar: string | null }>();

      // Fallback local: utiliser les données membres fusionnées (rapide, pas d'appel Discord)
      try {
        await loadMemberDataFromStorage();
        const members = getAllMemberData();
        members.forEach((member) => {
          if (!member.discordId) return;
          const username =
            member.discordUsername ||
            member.siteUsername ||
            member.displayName ||
            "Inconnu";
          userInfoCache.set(member.discordId, {
            username,
            avatar: null,
          });
        });
      } catch (error) {
        console.warn("[Admin Access] Impossible de charger le fallback local membres:", error);
      }
      
      // Récupérer tous les membres Discord en une fois via l'API interne
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL || 'https://tenf-community.com';
        const membersResponse = await fetch(`${baseUrl}/api/discord/members`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          },
        });

        if (membersResponse.ok) {
          const data = await membersResponse.json();
          const members = data.members || [];
          
          // Construire/écraser le cache avec les données Discord (plus fraîches, avec avatar)
          members.forEach((member: any) => {
            if (member.discordId) {
              const username = member.discordNickname || member.discordUsername || 'Inconnu';
              userInfoCache.set(member.discordId, {
                username,
                avatar: member.avatar || null,
              });
            }
          });
          
          console.log(`[Admin Access] Cache Discord initialisé avec ${userInfoCache.size} membres`);
        }
      } catch (error) {
        console.error('[Admin Access] Erreur lors de la récupération des membres Discord:', error);
      }

      // Fonction pour résoudre un ID Discord en infos utilisateur
      const resolveDiscordId = async (discordId: string): Promise<{ username: string; avatar: string | null }> => {
        // Vérifier d'abord dans le cache
        if (userInfoCache.has(discordId)) {
          return userInfoCache.get(discordId)!;
        }
        
        // Eviter des dizaines d'appels Discord externes (lents) pour les IDs inconnus :
        // on garde un fallback local pour maintenir une page réactive.
        const defaultInfo = { username: 'Inconnu', avatar: null };
        userInfoCache.set(discordId, defaultInfo); // Mettre en cache pour éviter les appels répétés
        return defaultInfo;
      };

      return resolveDiscordId;
    };

    // Enrichir avec les informations Discord (username, avatar) pour tous les membres
    try {
      const resolveDiscordId = await createDiscordUserInfoResolver();
      
      // Récupérer les informations pour chaque membre (utilisateur et ajouté par)
      const enrichedList = await Promise.all(
        accessList.map(async (access) => {
          // Récupérer les infos de l'utilisateur principal
          const userInfo = await resolveDiscordId(access.discordId);
          
          // Récupérer les infos de "ajouté par" si ce n'est pas "system"
          let addedByUsername = access.addedBy;
          if (access.addedBy !== 'system' && access.addedBy) {
            const addedByInfo = await resolveDiscordId(access.addedBy);
            addedByUsername = addedByInfo.username;
          }
          
          return {
            ...access,
            username: userInfo.username,
            avatar: userInfo.avatar,
            addedByUsername: addedByUsername, // Nom d'utilisateur de la personne qui a ajouté l'accès
          };
        })
      );

      let monCompteFlags = new Map<
        string,
        { memberInSupabase: boolean; staffNotificationEmailConfigured: boolean }
      >();
      let charterByDiscord = new Map<string, { validatedAt: string; charterVersion: string }>();
      try {
        const ids = enrichedList.map((a) => a.discordId);
        const [flags, charterEntries] = await Promise.all([
          memberRepository.findAdminMonCompteFlagsByDiscordIds(ids),
          listModerationCharterValidations(),
        ]);
        monCompteFlags = flags;
        charterByDiscord = buildLatestCharterValidationByDiscordId(charterEntries);
      } catch (enrichErr) {
        console.warn('[Admin Access] Enrichissement Mon compte / charte ignoré:', enrichErr);
      }

      const withCompliance = enrichedList.map((access) => {
        const f = monCompteFlags.get(access.discordId);
        const ch = charterByDiscord.get(access.discordId);
        return {
          ...access,
          memberInSupabase: f?.memberInSupabase ?? false,
          hasStaffNotificationEmail: f?.staffNotificationEmailConfigured ?? false,
          moderationCharterValidated: !!ch,
          moderationCharterValidatedAt: ch?.validatedAt ?? null,
          moderationCharterVersion: ch?.charterVersion ?? null,
        };
      });

      return NextResponse.json({ accessList: withCompliance });
    } catch (error) {
      console.error('[Admin Access] Error enriching admin access list:', error);
      // En cas d'erreur, retourner la liste sans enrichissement plutôt que de tout casser
      return NextResponse.json({ accessList });
    }

    return NextResponse.json({ accessList });
  } catch (error) {
    console.error('Error fetching admin access list:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST - Ajoute un accès admin pour un membre
 */
export async function POST(request: NextRequest) {
  try {
    // Authentification NextAuth + rôle FOUNDER requis
    const admin =
      (await requireRole("FONDATEUR")) ||
      (DEV_AUTH_BYPASS_ENABLED
        ? {
            id: DEV_BYPASS_DISCORD_ID,
            discordId: DEV_BYPASS_DISCORD_ID,
            username: DEV_BYPASS_USERNAME,
            avatar: null,
            role: "FONDATEUR" as AdminRole,
          }
        : null);
    
    if (!admin) {
      return NextResponse.json(
        { error: "Non authentifié ou accès refusé. Réservé aux fondateurs." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { discordId, role } = body;
    const adminAlias = sanitizeAdminAlias(body?.adminAlias);
    const normalizedRole = normalizeAdminRole(role);

    if (!discordId || !normalizedRole) {
      return NextResponse.json(
        { error: "discordId et role sont requis" },
        { status: 400 }
      );
    }

    // Vérifier que le rôle est valide
    const validRoles: AdminRole[] = ['FONDATEUR', 'ADMIN_COORDINATEUR', 'MODERATEUR', 'MODERATEUR_EN_FORMATION', 'MODERATEUR_EN_PAUSE', 'SOUTIEN_TENF'];
    if (!validRoles.includes(normalizedRole)) {
      return NextResponse.json(
        { error: "Rôle invalide" },
        { status: 400 }
      );
    }

    // Charger la liste actuelle depuis Blobs (uniquement les membres ajoutés manuellement)
    const store = getBlobStore(ACCESS_STORE);
    let storedAccessList: AdminAccess[] = [];
    
    try {
      const stored = await store.get(ACCESS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as StoredAdminAccessEntry[];
        storedAccessList = parseStoredAccessEntries(parsed);
      }
    } catch (error) {
      console.error('Error loading admin access from Blobs:', error);
    }

    const hardcodedRole = getAdminRole(discordId);
    const targetRole = hardcodedRole || normalizedRole;

    if (!targetRole) {
      return NextResponse.json(
        { error: "Rôle invalide" },
        { status: 400 }
      );
    }

    // Si c'est un membre hardcodé (dont fondateur), le rôle ne peut pas être modifié.
    if (hardcodedRole && normalizedRole !== hardcodedRole) {
      return NextResponse.json(
        { error: "Le rôle de ce membre est verrouillé. Seul le pseudo admin peut être modifié." },
        { status: 403 }
      );
    }

    // Vérifier si l'accès existe déjà dans la liste Blobs
    const existingIndex = storedAccessList.findIndex(a => a.discordId === discordId);
    
    if (existingIndex >= 0) {
      // Mettre à jour le rôle existant
      storedAccessList[existingIndex] = {
        ...storedAccessList[existingIndex],
        role: targetRole,
        addedAt: new Date().toISOString(),
        addedBy: admin.discordId,
        adminAlias,
      };
    } else {
      // Ajouter un nouvel accès
      storedAccessList.push({
        discordId,
        role: targetRole,
        addedAt: new Date().toISOString(),
        addedBy: admin.discordId,
        adminAlias,
      });
    }

    // Sauvegarder dans Blobs (uniquement les membres ajoutés manuellement)
    await store.set(ACCESS_KEY, JSON.stringify(storedAccessList, null, 2));

    // Recharger le cache en mémoire
    await loadAdminAccessCache();

    // Logger l'action
    const { logAction } = await import("@/lib/admin/logger");
    await logAction({
      action: existingIndex >= 0 ? "admin.access.update" : "admin.access.create",
      resourceType: "admin_access",
      resourceId: discordId,
      newValue: { role: targetRole, adminAlias: adminAlias || null },
      metadata: { sourcePage: "/admin/gestion-acces" },
    });

    return NextResponse.json({ 
      success: true,
      message: existingIndex >= 0 ? 'Accès mis à jour' : 'Accès ajouté'
    });
  } catch (error) {
    console.error('Error adding/updating admin access:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Supprime un accès admin
 */
export async function DELETE(request: NextRequest) {
  try {
    // Authentification NextAuth + rôle FOUNDER requis
    const admin =
      (await requireRole("FONDATEUR")) ||
      (DEV_AUTH_BYPASS_ENABLED
        ? {
            id: DEV_BYPASS_DISCORD_ID,
            discordId: DEV_BYPASS_DISCORD_ID,
            username: DEV_BYPASS_USERNAME,
            avatar: null,
            role: "FONDATEUR" as AdminRole,
          }
        : null);
    
    if (!admin) {
      return NextResponse.json(
        { error: "Non authentifié ou accès refusé. Réservé aux fondateurs." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const discordId = searchParams.get('discordId');

    if (!discordId) {
      return NextResponse.json(
        { error: "discordId est requis" },
        { status: 400 }
      );
    }

    // Vérifier que ce n'est pas un fondateur (les fondateurs ne peuvent pas être supprimés)
    if (isFounder(discordId)) {
      return NextResponse.json(
        { error: "Impossible de supprimer un fondateur" },
        { status: 403 }
      );
    }

    // Vérifier que ce n'est pas un membre hardcodé (Admin Adjoint, Modo Mentor, Modo Junior)
    const hardcodedRole = getAdminRole(discordId);
    if (hardcodedRole && !isFounder(discordId)) {
      return NextResponse.json(
        { error: "Impossible de supprimer un membre hardcodé. Les membres hardcodés doivent être modifiés dans le code source." },
        { status: 403 }
      );
    }

    // Charger la liste actuelle depuis Blobs (uniquement les membres ajoutés manuellement)
    const store = getBlobStore(ACCESS_STORE);
    let storedAccessList: AdminAccess[] = [];
    
    try {
      const stored = await store.get(ACCESS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as StoredAdminAccessEntry[];
        storedAccessList = parseStoredAccessEntries(parsed);
      }
    } catch (error) {
      console.error('Error loading admin access from Blobs:', error);
      return NextResponse.json(
        { error: 'Error loading access list' },
        { status: 500 }
      );
    }

    // Vérifier que le membre existe dans la liste Blobs (il doit avoir été ajouté manuellement)
    const memberExists = storedAccessList.find(a => a.discordId === discordId);
    if (!memberExists) {
      return NextResponse.json(
        { error: "Ce membre n'a pas été ajouté manuellement via cette interface et ne peut pas être supprimé." },
        { status: 404 }
      );
    }

    // Filtrer pour retirer l'accès (uniquement les membres ajoutés via Blobs)
    const filteredList = storedAccessList.filter(a => a.discordId !== discordId);

    // Sauvegarder dans Blobs (uniquement les membres ajoutés manuellement)
    await store.set(ACCESS_KEY, JSON.stringify(filteredList, null, 2));

    // Recharger le cache en mémoire
    await loadAdminAccessCache();

    // Logger l'action
    const { logAction } = await import("@/lib/admin/logger");
    await logAction({
      action: "admin.access.delete",
      resourceType: "admin_access",
      resourceId: discordId,
      previousValue: { role: memberExists?.role },
      metadata: { sourcePage: "/admin/gestion-acces" },
    });

    return NextResponse.json({ 
      success: true,
      message: 'Accès supprimé'
    });
  } catch (error) {
    console.error('Error deleting admin access:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


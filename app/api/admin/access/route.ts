import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/requireAdmin';
import { isFounder, getAllAdminIds, getAdminRole, FOUNDERS, type AdminRole } from '@/lib/adminRoles';
import { loadAdminAccessCache, getAdminRoleFromCache, getAllAdminIdsFromCache } from '@/lib/adminAccessCache';
import { getBlobStore } from '@/lib/memberData';
import { GUILD_ID } from '@/lib/discordRoles';

const ACCESS_STORE = 'tenf-admin-access';
const ACCESS_KEY = 'admin-access-list';

interface AdminAccess {
  discordId: string;
  role: AdminRole;
  addedAt: string;
  addedBy: string;
  username?: string; // Optionnel, mis à jour depuis Discord
}

/**
 * GET - Récupère la liste de tous les membres avec accès au dashboard admin
 */
export async function GET() {
  try {
    // Authentification NextAuth + rôle FOUNDER requis
    const admin = await requireRole("FOUNDER");
    
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
        storedAccessList = JSON.parse(stored);
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
      accessList.push({
        discordId: id,
        role: 'FOUNDER' as AdminRole,
        addedAt: new Date(0).toISOString(), // Date ancienne pour indiquer qu'ils sont là depuis le début
        addedBy: 'system',
      });
      addedIds.add(id);
    });
    
    // 2. Ajouter tous les autres membres hardcodés (Admin Adjoint, Modo Mentor, Modo Junior)
    const allHardcodedIds = getAllAdminIds();
    allHardcodedIds.forEach(id => {
      if (!addedIds.has(id)) {
        const role = getAdminRole(id);
        if (role) {
          accessList.push({
            discordId: id,
            role: role,
            addedAt: new Date(0).toISOString(),
            addedBy: 'system',
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
      
      // Récupérer tous les membres Discord en une fois via l'API interne
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL || 'https://teamnewfamily.netlify.app';
        const membersResponse = await fetch(`${baseUrl}/api/discord/members`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          },
        });

        if (membersResponse.ok) {
          const data = await membersResponse.json();
          const members = data.members || [];
          
          // Construire le cache avec tous les membres
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

        // Si pas dans le cache, essayer de récupérer via l'API Discord directement
        const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
        if (DISCORD_BOT_TOKEN) {
          try {
            // Essayer d'abord de récupérer depuis le serveur (guild member)
            const memberResponse = await fetch(
              `https://discord.com/api/v10/guilds/${GUILD_ID}/members/${discordId}`,
              {
                headers: {
                  Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
                },
              }
            );

            if (memberResponse.ok) {
              const member = await memberResponse.json();
              const user = member.user || member;
              const username = member.nick || user.global_name || user.username || 'Inconnu';
              const avatarHash = user.avatar;
              const avatar = avatarHash
                ? `https://cdn.discordapp.com/avatars/${discordId}/${avatarHash}.png`
                : null;
              
              const info = { username, avatar };
              userInfoCache.set(discordId, info); // Mettre en cache
              return info;
            }

            // Si le membre n'est pas dans le serveur, essayer l'API Users
            if (memberResponse.status === 404) {
              const userResponse = await fetch(
                `https://discord.com/api/v10/users/${discordId}`,
                {
                  headers: {
                    Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
                  },
                }
              );

              if (userResponse.ok) {
                const user = await userResponse.json();
                const username = user.global_name || user.username || 'Inconnu';
                const avatarHash = user.avatar;
                const avatar = avatarHash
                  ? `https://cdn.discordapp.com/avatars/${discordId}/${avatarHash}.png`
                  : null;
                
                const info = { username, avatar };
                userInfoCache.set(discordId, info); // Mettre en cache
                return info;
              }
            }
          } catch (error) {
            console.error(`[Admin Access] Error fetching Discord info for ${discordId}:`, error);
          }
        }
        
        // Par défaut, retourner "Inconnu"
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

      return NextResponse.json({ accessList: enrichedList });
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
    const admin = await requireRole("FOUNDER");
    
    if (!admin) {
      return NextResponse.json(
        { error: "Non authentifié ou accès refusé. Réservé aux fondateurs." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { discordId, role } = body;

    if (!discordId || !role) {
      return NextResponse.json(
        { error: "discordId et role sont requis" },
        { status: 400 }
      );
    }

    // Vérifier que le rôle est valide
    const validRoles: AdminRole[] = ['FOUNDER', 'ADMIN_ADJOINT', 'MODO_MENTOR', 'MODO_JUNIOR'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: "Rôle invalide" },
        { status: 400 }
      );
    }

    // Vérifier que ce n'est pas un fondateur (les fondateurs ne peuvent pas être supprimés/modifiés)
    if (isFounder(discordId)) {
      return NextResponse.json(
        { error: "Impossible de modifier un fondateur" },
        { status: 403 }
      );
    }

    // Charger la liste actuelle depuis Blobs (uniquement les membres ajoutés manuellement)
    const store = getBlobStore(ACCESS_STORE);
    let storedAccessList: AdminAccess[] = [];
    
    try {
      const stored = await store.get(ACCESS_KEY);
      if (stored) {
        storedAccessList = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading admin access from Blobs:', error);
    }

    // Filtrer les membres hardcodés de la liste Blobs (ils ne doivent pas être stockés)
    storedAccessList = storedAccessList.filter(access => {
      const hardcodedRole = getAdminRole(access.discordId);
      // Garder uniquement les membres qui ne sont pas hardcodés
      return !hardcodedRole || isFounder(access.discordId);
    });

    // Vérifier si l'accès existe déjà dans la liste Blobs
    const existingIndex = storedAccessList.findIndex(a => a.discordId === discordId);
    
    if (existingIndex >= 0) {
      // Mettre à jour le rôle existant
      storedAccessList[existingIndex] = {
        ...storedAccessList[existingIndex],
        role: role as AdminRole,
        addedAt: new Date().toISOString(),
        addedBy: admin.discordId,
      };
    } else {
      // Ajouter un nouvel accès
      storedAccessList.push({
        discordId,
        role: role as AdminRole,
        addedAt: new Date().toISOString(),
        addedBy: admin.discordId,
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
      newValue: { role },
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
    const admin = await requireRole("FOUNDER");
    
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
        storedAccessList = JSON.parse(stored);
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


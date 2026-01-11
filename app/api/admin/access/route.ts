import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/adminAuth';
import { isFounder, getAllAdminIds, getAdminRole, FOUNDERS, type AdminRole } from '@/lib/adminRoles';
import { loadAdminAccessCache, getAdminRoleFromCache, getAllAdminIdsFromCache } from '@/lib/adminAccessCache';
import { getStore } from '@netlify/blobs';
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
    const admin = await getCurrentAdmin();
    
    if (!admin) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    // Seuls les fondateurs peuvent voir la liste complète
    if (!isFounder(admin.id)) {
      return NextResponse.json(
        { error: "Accès refusé. Réservé aux fondateurs." },
        { status: 403 }
      );
    }

    // Récupérer la liste depuis Blobs (membres ajoutés manuellement)
    const store = getStore(ACCESS_STORE);
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

    // Enrichir avec les informations Discord (username, avatar)
    const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
    if (DISCORD_BOT_TOKEN) {
      try {
        // Récupérer les informations pour chaque membre
        const enrichedList = await Promise.all(
          accessList.map(async (access) => {
            try {
              // Essayer d'abord de récupérer depuis le serveur (guild member)
              const memberResponse = await fetch(
                `https://discord.com/api/v10/guilds/${GUILD_ID}/members/${access.discordId}`,
                {
                  headers: {
                    Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
                  },
                }
              );

              if (memberResponse.ok) {
                const member = await memberResponse.json();
                const user = member.user || member;
                const username = user.nick || user.global_name || user.username || 'Inconnu';
                const avatarHash = user.avatar;
                const avatar = avatarHash
                  ? `https://cdn.discordapp.com/avatars/${access.discordId}/${avatarHash}.png`
                  : null;
                
                return {
                  ...access,
                  username,
                  avatar,
                };
              }

              // Si le membre n'est pas dans le serveur, essayer l'API Users
              if (memberResponse.status === 404) {
                const userResponse = await fetch(
                  `https://discord.com/api/v10/users/${access.discordId}`,
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
                    ? `https://cdn.discordapp.com/avatars/${access.discordId}/${avatarHash}.png`
                    : null;
                  
                  return {
                    ...access,
                    username,
                    avatar,
                  };
                }
              }
            } catch (error) {
              console.error(`Error fetching Discord info for ${access.discordId}:`, error);
            }
            
            return {
              ...access,
              username: 'Inconnu',
              avatar: null,
            };
          })
        );

        return NextResponse.json({ accessList: enrichedList });
      } catch (error) {
        console.error('Error enriching admin access list:', error);
      }
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
    const admin = await getCurrentAdmin();
    
    if (!admin) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    // Seuls les fondateurs peuvent ajouter des accès
    if (!isFounder(admin.id)) {
      return NextResponse.json(
        { error: "Accès refusé. Réservé aux fondateurs." },
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
    const store = getStore(ACCESS_STORE);
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
        addedBy: admin.id,
      };
    } else {
      // Ajouter un nouvel accès
      storedAccessList.push({
        discordId,
        role: role as AdminRole,
        addedAt: new Date().toISOString(),
        addedBy: admin.id,
      });
    }

    // Sauvegarder dans Blobs (uniquement les membres ajoutés manuellement)
    await store.set(ACCESS_KEY, JSON.stringify(storedAccessList, null, 2));

    // Recharger le cache en mémoire
    await loadAdminAccessCache();

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
    const admin = await getCurrentAdmin();
    
    if (!admin) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    // Seuls les fondateurs peuvent supprimer des accès
    if (!isFounder(admin.id)) {
      return NextResponse.json(
        { error: "Accès refusé. Réservé aux fondateurs." },
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
    const store = getStore(ACCESS_STORE);
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


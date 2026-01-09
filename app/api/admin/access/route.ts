import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/adminAuth';
import { isFounder, getAllAdminIds, getAdminRole, loadAdminAccessCache, type AdminRole } from '@/lib/adminRoles';
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

    // Récupérer la liste depuis Blobs
    let accessList: AdminAccess[] = [];
    try {
      const store = getStore(ACCESS_STORE);
      const stored = await store.get(ACCESS_KEY);
      if (stored) {
        accessList = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading admin access from Blobs:', error);
    }

    // Si la liste est vide, initialiser avec les données hardcodées
    if (accessList.length === 0) {
      const hardcodedIds = getAllAdminIds();
      accessList = hardcodedIds.map(id => {
        const role = getAdminRole(id) || 'MODO_JUNIOR';
        return {
          discordId: id,
          role: role as AdminRole,
          addedAt: new Date().toISOString(),
          addedBy: 'system',
        };
      });
      
      // Sauvegarder dans Blobs
      try {
        const store = getStore(ACCESS_STORE);
        await store.set(ACCESS_KEY, JSON.stringify(accessList, null, 2));
      } catch (error) {
        console.error('Error saving admin access to Blobs:', error);
      }
    }

    // Enrichir avec les informations Discord (username, avatar)
    const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
    if (DISCORD_BOT_TOKEN) {
      try {
        // Récupérer les informations pour chaque membre
        const enrichedList = await Promise.all(
          accessList.map(async (access) => {
            try {
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
                return {
                  ...access,
                  username: member.user?.username || member.user?.global_name || 'Inconnu',
                  avatar: member.user?.avatar
                    ? `https://cdn.discordapp.com/avatars/${access.discordId}/${member.user.avatar}.png`
                    : null,
                };
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

    // Charger la liste actuelle
    const store = getStore(ACCESS_STORE);
    let accessList: AdminAccess[] = [];
    
    try {
      const stored = await store.get(ACCESS_KEY);
      if (stored) {
        accessList = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading admin access from Blobs:', error);
    }

    // Vérifier si l'accès existe déjà
    const existingIndex = accessList.findIndex(a => a.discordId === discordId);
    
    if (existingIndex >= 0) {
      // Mettre à jour le rôle existant
      accessList[existingIndex] = {
        ...accessList[existingIndex],
        role: role as AdminRole,
        addedAt: new Date().toISOString(),
        addedBy: admin.id,
      };
    } else {
      // Ajouter un nouvel accès
      accessList.push({
        discordId,
        role: role as AdminRole,
        addedAt: new Date().toISOString(),
        addedBy: admin.id,
      });
    }

    // Sauvegarder dans Blobs
    await store.set(ACCESS_KEY, JSON.stringify(accessList, null, 2));

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

    // Charger la liste actuelle
    const store = getStore(ACCESS_STORE);
    let accessList: AdminAccess[] = [];
    
    try {
      const stored = await store.get(ACCESS_KEY);
      if (stored) {
        accessList = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading admin access from Blobs:', error);
      return NextResponse.json(
        { error: 'Error loading access list' },
        { status: 500 }
      );
    }

    // Filtrer pour retirer l'accès
    const filteredList = accessList.filter(a => a.discordId !== discordId);

    // Sauvegarder dans Blobs
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


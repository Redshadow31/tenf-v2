import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/requireAdmin';
import { isFounder } from '@/lib/adminRoles';
import { getAuthenticatedAdmin } from '@/lib/requireAdmin';
import { getBlobStore } from '@/lib/memberData';
import { GUILD_ID } from '@/lib/discordRoles';
import { resetAdvancedAccessCache } from '@/lib/advancedAccess';

const ACCESS_STORE = 'tenf-admin-access';
const ADVANCED_ACCESS_KEY = 'admin-advanced-access-list';

interface AdvancedAccessEntry {
  discordId: string;
  addedAt: string;
  addedBy: string;
}

/**
 * GET - Deux modes :
 * - ?check=1 ou sans param (pour sidebar) : retourne { canAccessAdvanced: boolean } - tout admin peut appeler
 * - (fondateur) : retourne { accessList: [...] } pour la page de gestion
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await getAuthenticatedAdmin();
    
    if (!admin) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const checkOnly = searchParams.get('check') === '1' || searchParams.get('check') === 'true';

    // Charger la liste depuis Blobs
    let advancedList: AdvancedAccessEntry[] = [];
    try {
      const store = getBlobStore(ACCESS_STORE);
      const stored = await store.get(ADVANCED_ACCESS_KEY);
      if (stored) {
        advancedList = JSON.parse(stored);
      }
    } catch (error) {
      console.error('[Advanced Access] Erreur chargement depuis Blobs:', error);
    }

    // Mode check : retourner uniquement si l'utilisateur a accès
    if (checkOnly) {
      const canAccess = isFounder(admin.discordId) || 
        advancedList.some((e) => e.discordId === admin.discordId);
      return NextResponse.json({ canAccessAdvanced: canAccess });
    }

    // Mode liste complète : réservé aux fondateurs
    if (!isFounder(admin.discordId)) {
      return NextResponse.json(
        { error: "Réservé aux fondateurs" },
        { status: 403 }
      );
    }

    // Enrichir avec les infos Discord (comme gestion-acces)
    const createResolver = async () => {
      const cache = new Map<string, { username: string; avatar: string | null }>();
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL || 'https://tenf-community.com';
        const res = await fetch(`${baseUrl}/api/discord/members`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          (data.members || []).forEach((m: any) => {
            if (m.discordId) {
              cache.set(m.discordId, {
                username: m.discordNickname || m.discordUsername || 'Inconnu',
                avatar: m.avatar || null,
              });
            }
          });
        }
      } catch (e) {
        console.error('[Advanced Access] Erreur fetch Discord members:', e);
      }

      return async (discordId: string) => {
        if (cache.has(discordId)) return cache.get(discordId)!;
        const token = process.env.DISCORD_BOT_TOKEN;
        if (token) {
          try {
            const memberRes = await fetch(
              `https://discord.com/api/v10/guilds/${GUILD_ID}/members/${discordId}`,
              { headers: { Authorization: `Bot ${token}` } }
            );
            if (memberRes.ok) {
              const member = await memberRes.json();
              const user = member.user || member;
              const info = {
                username: member.nick || user.global_name || user.username || 'Inconnu',
                avatar: user.avatar ? `https://cdn.discordapp.com/avatars/${discordId}/${user.avatar}.png` : null,
              };
              cache.set(discordId, info);
              return info;
            }
          } catch (e) {
            console.error('[Advanced Access] Erreur fetch Discord:', e);
          }
        }
        const def = { username: 'Inconnu', avatar: null };
        cache.set(discordId, def);
        return def;
      };
    };

    const resolve = await createResolver();
    const enriched = await Promise.all(
      advancedList.map(async (e) => {
        const info = await resolve(e.discordId);
        let addedByUsername = e.addedBy;
        if (e.addedBy && e.addedBy !== 'system') {
          const addedInfo = await resolve(e.addedBy);
          addedByUsername = addedInfo.username;
        }
        return {
          ...e,
          username: info.username,
          avatar: info.avatar,
          addedByUsername,
        };
      })
    );

    return NextResponse.json({ accessList: enriched });
  } catch (error) {
    console.error('[Advanced Access] GET error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

/**
 * POST - Ajoute une personne à la liste (fondateur uniquement)
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await requireRole("FONDATEUR");
    if (!admin) {
      return NextResponse.json(
        { error: "Réservé aux fondateurs" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { discordId } = body;

    if (!discordId || typeof discordId !== 'string') {
      return NextResponse.json(
        { error: "discordId est requis" },
        { status: 400 }
      );
    }

    // Les fondateurs n'ont pas besoin d'être dans la liste
    if (isFounder(discordId)) {
      return NextResponse.json(
        { error: "Les fondateurs ont toujours accès" },
        { status: 400 }
      );
    }

    const store = getBlobStore(ACCESS_STORE);
    let list: AdvancedAccessEntry[] = [];
    try {
      const stored = await store.get(ADVANCED_ACCESS_KEY);
      if (stored) list = JSON.parse(stored);
    } catch (e) {
      console.error('[Advanced Access] Erreur chargement:', e);
    }

    if (list.some((e) => e.discordId === discordId)) {
      return NextResponse.json(
        { error: "Cette personne a déjà accès" },
        { status: 409 }
      );
    }

    list.push({
      discordId,
      addedAt: new Date().toISOString(),
      addedBy: admin.discordId,
    });

    await store.set(ADVANCED_ACCESS_KEY, JSON.stringify(list, null, 2));
    resetAdvancedAccessCache();

    const { logAction } = await import("@/lib/admin/logger");
    await logAction({
      action: "admin.advanced_access.add",
      resourceType: "admin_advanced_access",
      resourceId: discordId,
      newValue: {},
      metadata: { sourcePage: "/admin/gestion-acces/admin-avance" },
    });

    return NextResponse.json({ success: true, message: "Accès ajouté" });
  } catch (error) {
    console.error('[Advanced Access] POST error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

/**
 * DELETE - Retire une personne de la liste (fondateur uniquement)
 */
export async function DELETE(request: NextRequest) {
  try {
    const admin = await requireRole("FONDATEUR");
    if (!admin) {
      return NextResponse.json(
        { error: "Réservé aux fondateurs" },
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

    if (isFounder(discordId)) {
      return NextResponse.json(
        { error: "Impossible de retirer un fondateur" },
        { status: 403 }
      );
    }

    const store = getBlobStore(ACCESS_STORE);
    let list: AdvancedAccessEntry[] = [];
    try {
      const stored = await store.get(ADVANCED_ACCESS_KEY);
      if (stored) list = JSON.parse(stored);
    } catch (e) {
      console.error('[Advanced Access] Erreur chargement:', e);
      return NextResponse.json({ error: 'Erreur chargement' }, { status: 500 });
    }

    const before = list.length;
    list = list.filter((e) => e.discordId !== discordId);

    if (list.length === before) {
      return NextResponse.json(
        { error: "Personne non trouvée dans la liste" },
        { status: 404 }
      );
    }

    await store.set(ADVANCED_ACCESS_KEY, JSON.stringify(list, null, 2));
    resetAdvancedAccessCache();

    const { logAction } = await import("@/lib/admin/logger");
    await logAction({
      action: "admin.advanced_access.remove",
      resourceType: "admin_advanced_access",
      resourceId: discordId,
      previousValue: {},
      metadata: { sourcePage: "/admin/gestion-acces/admin-avance" },
    });

    return NextResponse.json({ success: true, message: "Accès retiré" });
  } catch (error) {
    console.error('[Advanced Access] DELETE error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

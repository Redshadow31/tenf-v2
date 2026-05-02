import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/requireAdmin';
import { isFounder } from '@/lib/adminRoles';
import { getAuthenticatedAdmin } from '@/lib/requireAdmin';
import { getBlobStore } from '@/lib/memberData';
import { GUILD_ID } from '@/lib/discordRoles';
import {
  hasAdvancedAdminAccess,
  rawAdvancedAccessEntryActive,
  resetAdvancedAccessCache,
} from '@/lib/advancedAccess';
import { logAction, prepareAuditValues } from "@/lib/admin/logger";

const ACCESS_STORE = 'tenf-admin-access';
const ADVANCED_ACCESS_KEY = 'admin-advanced-access-list';
const MAX_ACCESS_DURATION_DAYS = 90;
const LEGACY_GRACE_DAYS = 30;

interface AdvancedAccessEntry {
  discordId: string;
  addedAt: string;
  addedBy: string;
  justification: string;
  expiresAt: string;
}

function sanitizeReason(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed.slice(0, 500) : undefined;
}

function parseDateValue(value: unknown): Date | null {
  if (typeof value !== "string") return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function normalizeEntry(raw: any): AdvancedAccessEntry | null {
  if (!raw || typeof raw !== "object" || typeof raw.discordId !== "string") {
    return null;
  }

  const now = Date.now();
  const addedAtDate = parseDateValue(raw.addedAt) || new Date(now);
  const expiresAtDate =
    parseDateValue(raw.expiresAt) ||
    new Date(now + LEGACY_GRACE_DAYS * 24 * 60 * 60 * 1000);

  return {
    discordId: raw.discordId.trim(),
    addedAt: addedAtDate.toISOString(),
    addedBy: typeof raw.addedBy === "string" && raw.addedBy.trim().length > 0 ? raw.addedBy : "system",
    justification:
      sanitizeReason(raw.justification) ||
      "Acces migre depuis une ancienne entree (justification absente).",
    expiresAt: expiresAtDate.toISOString(),
  };
}

function isEntryActive(entry: AdvancedAccessEntry): boolean {
  const expiresAt = new Date(entry.expiresAt).getTime();
  if (Number.isNaN(expiresAt)) return false;
  return expiresAt > Date.now();
}

async function loadAdvancedAccessList(): Promise<AdvancedAccessEntry[]> {
  const store = getBlobStore(ACCESS_STORE);
  const stored = await store.get(ADVANCED_ACCESS_KEY);
  const parsed = stored ? JSON.parse(stored) : [];
  if (!Array.isArray(parsed)) return [];

  return parsed
    .map(normalizeEntry)
    .filter((entry): entry is AdvancedAccessEntry => !!entry && entry.discordId.length > 0);
}

async function loadAdvancedAccessPairs(): Promise<
  Array<{ raw: unknown; entry: AdvancedAccessEntry }>
> {
  const store = getBlobStore(ACCESS_STORE);
  const stored = await store.get(ADVANCED_ACCESS_KEY);
  const parsed = stored ? JSON.parse(stored) : [];
  if (!Array.isArray(parsed)) return [];

  return parsed
    .map((raw) => {
      const entry = normalizeEntry(raw);
      if (!entry || entry.discordId.length === 0) return null;
      return { raw, entry };
    })
    .filter((p): p is { raw: unknown; entry: AdvancedAccessEntry } => p !== null);
}

async function saveAdvancedAccessList(list: AdvancedAccessEntry[]): Promise<void> {
  const store = getBlobStore(ACCESS_STORE);
  await store.set(ADVANCED_ACCESS_KEY, JSON.stringify(list, null, 2));
  resetAdvancedAccessCache();
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

    // Mode check : retourner uniquement si l'utilisateur a accès
    if (checkOnly) {
      const canAccess = await hasAdvancedAdminAccess(admin.discordId);
      return NextResponse.json({ canAccessAdvanced: canAccess });
    }

    // Mode liste complète : réservé aux fondateurs
    if (!isFounder(admin.discordId)) {
      return NextResponse.json(
        { error: "Réservé aux fondateurs" },
        { status: 403 }
      );
    }

    let advancedPairs: Array<{ raw: unknown; entry: AdvancedAccessEntry }> = [];
    try {
      advancedPairs = await loadAdvancedAccessPairs();
    } catch (error) {
      console.error('[Advanced Access] Erreur chargement depuis Blobs:', error);
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
      advancedPairs.map(async ({ raw, entry: e }) => {
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
          isExpired: !rawAdvancedAccessEntryActive(raw),
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
    const discordId =
      typeof body?.discordId === "string" ? body.discordId.trim() : "";
    const justification = sanitizeReason(body?.justification);
    const expiresAtRaw = typeof body?.expiresAt === "string" ? body.expiresAt : "";
    const expiresAtDate = parseDateValue(expiresAtRaw);

    if (!discordId) {
      return NextResponse.json(
        { error: "discordId est requis" },
        { status: 400 }
      );
    }

    if (!justification) {
      return NextResponse.json(
        { error: "La justification est obligatoire" },
        { status: 400 }
      );
    }

    if (!expiresAtDate) {
      return NextResponse.json(
        { error: "Une date d'expiration valide est obligatoire" },
        { status: 400 }
      );
    }

    const now = Date.now();
    const expiresAtMs = expiresAtDate.getTime();
    if (expiresAtMs <= now) {
      return NextResponse.json(
        { error: "La date d'expiration doit etre dans le futur" },
        { status: 400 }
      );
    }

    const maxDurationMs = MAX_ACCESS_DURATION_DAYS * 24 * 60 * 60 * 1000;
    if (expiresAtMs - now > maxDurationMs) {
      return NextResponse.json(
        { error: `L'acces avance ne peut pas depasser ${MAX_ACCESS_DURATION_DAYS} jours` },
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

    let list = await loadAdvancedAccessList();
    const existing = list.find((e) => e.discordId === discordId);

    if (existing && isEntryActive(existing)) {
      return NextResponse.json(
        { error: "Cette personne a déjà accès" },
        { status: 409 }
      );
    }

    // Si l'entrée existe mais a expiré, on la remplace proprement.
    list = list.filter((e) => e.discordId !== discordId);

    const newEntry: AdvancedAccessEntry = {
      discordId: discordId.trim(),
      addedAt: new Date().toISOString(),
      addedBy: admin.discordId,
      justification,
      expiresAt: expiresAtDate.toISOString(),
    };
    list.push(newEntry);

    await saveAdvancedAccessList(list);
    const { previousValue, newValue } = prepareAuditValues(existing, newEntry);
    await logAction({
      action: "admin.advanced_access.add",
      resourceType: "admin_advanced_access",
      resourceId: discordId,
      previousValue,
      newValue,
      metadata: {
        sourcePage: "/admin/gestion-acces/admin-avance",
        reason: justification,
      },
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
    let reason = sanitizeReason(searchParams.get("reason"));
    if (!reason) {
      try {
        const body = await request.json();
        reason = sanitizeReason(body?.reason);
      } catch {
        // Pas de body -> on garde la valeur actuelle
      }
    }

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

    if (!reason) {
      return NextResponse.json(
        { error: "Le motif de retrait est obligatoire" },
        { status: 400 }
      );
    }

    let list: AdvancedAccessEntry[] = [];
    try {
      list = await loadAdvancedAccessList();
    } catch (e) {
      console.error('[Advanced Access] Erreur chargement:', e);
      return NextResponse.json({ error: 'Erreur chargement' }, { status: 500 });
    }

    const removedEntry = list.find((e) => e.discordId === discordId);
    const before = list.length;
    list = list.filter((e) => e.discordId !== discordId);

    if (list.length === before) {
      return NextResponse.json(
        { error: "Personne non trouvée dans la liste" },
        { status: 404 }
      );
    }

    await saveAdvancedAccessList(list);
    const { previousValue } = prepareAuditValues(removedEntry, undefined);
    await logAction({
      action: "admin.advanced_access.remove",
      resourceType: "admin_advanced_access",
      resourceId: discordId,
      previousValue,
      metadata: {
        sourcePage: "/admin/gestion-acces/admin-avance",
        reason,
      },
    });

    return NextResponse.json({ success: true, message: "Accès retiré" });
  } catch (error) {
    console.error('[Advanced Access] DELETE error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

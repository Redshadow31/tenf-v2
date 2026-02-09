/**
 * API Route pour nettoyer les membres avec twitchLogin commençant par "discord_"
 * Ces entrées sont des doublons créés par le bot Discord quand le login Twitch n'était pas connu.
 * 
 * Optimisé : charge TOUS les membres en une seule requête puis traite en mémoire.
 * 
 * GET  - Preview: liste les membres discord_ et indique lesquels ont un vrai doublon
 * POST - Exécute la suppression des doublons discord_
 */

import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/requireAdmin';
import { supabaseAdmin } from '@/lib/db/supabase';
import { cacheInvalidateNamespace } from '@/lib/cache';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

interface DiscordDuplicate {
  discordLogin: string;
  discordId: string | null;
  displayName: string;
  hasRealMember: boolean;
  realMemberLogin?: string;
  realMemberName?: string;
}

/**
 * Charge TOUS les membres en une seule requête Supabase
 * et sépare les discord_ des vrais membres
 */
async function loadAllMembers() {
  const { data, error } = await supabaseAdmin
    .from('members')
    .select('twitch_login, discord_id, display_name');

  if (error) throw error;

  const discordPrefixed: Array<{ twitchLogin: string; discordId: string | null; displayName: string }> = [];
  const realByDiscordId = new Map<string, { twitchLogin: string; displayName: string }>();

  for (const row of (data || [])) {
    const twitchLogin = row.twitch_login || '';
    const discordId = row.discord_id || null;
    const displayName = row.display_name || twitchLogin;

    if (twitchLogin.startsWith('discord_')) {
      discordPrefixed.push({ twitchLogin, discordId, displayName });
    } else if (discordId) {
      // Stocker les vrais membres par discordId pour matching rapide
      realByDiscordId.set(discordId, { twitchLogin, displayName });
    }
  }

  return { discordPrefixed, realByDiscordId };
}

export async function GET() {
  try {
    const admin = await requirePermission('read');
    if (!admin) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const { discordPrefixed, realByDiscordId } = await loadAllMembers();

    // Matcher en mémoire (pas de requêtes supplémentaires)
    const duplicates: DiscordDuplicate[] = discordPrefixed.map(member => {
      // Extraire le discordId depuis le champ ou depuis le twitchLogin
      const discordId = member.discordId || member.twitchLogin.replace('discord_', '');
      const realMember = discordId ? realByDiscordId.get(discordId) : undefined;

      return {
        discordLogin: member.twitchLogin,
        discordId,
        displayName: member.displayName,
        hasRealMember: !!realMember,
        realMemberLogin: realMember?.twitchLogin,
        realMemberName: realMember?.displayName,
      };
    });

    return NextResponse.json({
      success: true,
      total: duplicates.length,
      withRealDuplicate: duplicates.filter(d => d.hasRealMember).length,
      orphans: duplicates.filter(d => !d.hasRealMember).length,
      duplicates,
    });
  } catch (error) {
    console.error('[Cleanup] Erreur:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requirePermission('write');
    if (!admin) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const body = await request.json();
    const { deleteOrphans = false } = body;

    const { discordPrefixed, realByDiscordId } = await loadAllMembers();

    // Déterminer quels logins supprimer
    const loginsToDelete: string[] = [];
    let skipped = 0;

    for (const member of discordPrefixed) {
      const discordId = member.discordId || member.twitchLogin.replace('discord_', '');
      const hasRealMember = discordId ? realByDiscordId.has(discordId) : false;

      if (hasRealMember || deleteOrphans) {
        loginsToDelete.push(member.twitchLogin);
      } else {
        skipped++;
      }
    }

    if (loginsToDelete.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Aucun doublon à supprimer.',
        summary: { total: discordPrefixed.length, deleted: 0, skipped, errors: 0 },
      });
    }

    // Suppression en batch (par groupes de 50 pour éviter les limites Supabase)
    let deleted = 0;
    const errors: string[] = [];
    const BATCH_SIZE = 50;

    for (let i = 0; i < loginsToDelete.length; i += BATCH_SIZE) {
      const batch = loginsToDelete.slice(i, i + BATCH_SIZE);
      try {
        const { error } = await supabaseAdmin
          .from('members')
          .delete()
          .in('twitch_login', batch);

        if (error) {
          errors.push(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${error.message}`);
        } else {
          deleted += batch.length;
        }
      } catch (err) {
        errors.push(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${err instanceof Error ? err.message : 'Erreur'}`);
      }
    }

    // Invalider le cache
    try {
      await cacheInvalidateNamespace('members');
    } catch (e) {
      // Pas critique
    }

    return NextResponse.json({
      success: true,
      message: `Nettoyage terminé: ${deleted} supprimé(s), ${skipped} ignoré(s)${errors.length > 0 ? `, ${errors.length} erreur(s)` : ''}`,
      summary: {
        total: discordPrefixed.length,
        deleted,
        skipped,
        errors: errors.length,
      },
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('[Cleanup] Erreur:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur serveur' },
      { status: 500 }
    );
  }
}

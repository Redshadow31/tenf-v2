/**
 * API Route pour nettoyer les membres avec twitchLogin commençant par "discord_"
 * Ces entrées sont des doublons créés par le bot Discord quand le login Twitch n'était pas connu.
 * 
 * GET  - Preview: liste les membres discord_ et indique lesquels ont un vrai doublon
 * POST - Exécute la suppression des doublons discord_
 */

import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/requireAdmin';
import { memberRepository } from '@/lib/repositories';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

interface DiscordDuplicate {
  discordLogin: string;       // Le login discord_XXXX
  discordId: string | null;   // L'ID Discord associé
  displayName: string;
  hasRealMember: boolean;     // true si un vrai membre existe avec le même discordId
  realMemberLogin?: string;   // Le vrai twitchLogin si trouvé
  realMemberName?: string;    // Le vrai displayName si trouvé
}

export async function GET() {
  try {
    const admin = await requirePermission('read');
    if (!admin) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    // Trouver tous les membres avec discord_ prefix
    const discordMembers = await memberRepository.findByTwitchLoginPrefix('discord_');

    // Pour chaque membre discord_, chercher si un vrai membre existe avec le même discordId
    const duplicates: DiscordDuplicate[] = [];

    for (const member of discordMembers) {
      const discordId = member.discordId || member.twitchLogin?.replace('discord_', '');
      
      let hasRealMember = false;
      let realMemberLogin: string | undefined;
      let realMemberName: string | undefined;

      if (discordId) {
        // Chercher un membre avec le même discordId mais un vrai twitchLogin
        const realMember = await memberRepository.findByDiscordId(discordId);
        if (realMember && !realMember.twitchLogin?.startsWith('discord_')) {
          hasRealMember = true;
          realMemberLogin = realMember.twitchLogin;
          realMemberName = realMember.displayName;
        }
      }

      duplicates.push({
        discordLogin: member.twitchLogin || '',
        discordId: discordId || null,
        displayName: member.displayName || member.twitchLogin || '',
        hasRealMember,
        realMemberLogin,
        realMemberName,
      });
    }

    return NextResponse.json({
      success: true,
      total: discordMembers.length,
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
    const { deleteOrphans = false, selectedLogins } = body;

    // Trouver tous les membres avec discord_ prefix
    const discordMembers = await memberRepository.findByTwitchLoginPrefix('discord_');

    let deleted = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const member of discordMembers) {
      // Si une liste est fournie, ne supprimer que ceux sélectionnés
      if (selectedLogins && !selectedLogins.includes(member.twitchLogin?.toLowerCase())) {
        skipped++;
        continue;
      }

      const discordId = member.discordId || member.twitchLogin?.replace('discord_', '');
      
      let hasRealMember = false;
      if (discordId) {
        const realMember = await memberRepository.findByDiscordId(discordId);
        if (realMember && !realMember.twitchLogin?.startsWith('discord_')) {
          hasRealMember = true;
        }
      }

      // Supprimer seulement si un vrai doublon existe OU si deleteOrphans est activé
      if (hasRealMember || deleteOrphans) {
        try {
          await memberRepository.hardDelete(member.twitchLogin!);
          deleted++;
        } catch (err) {
          errors.push(`Erreur suppression ${member.twitchLogin}: ${err instanceof Error ? err.message : 'Erreur'}`);
        }
      } else {
        skipped++;
      }
    }

    // Invalider le cache
    try {
      const { cacheInvalidateNamespace } = await import('@/lib/cache');
      await cacheInvalidateNamespace('members');
    } catch (e) {
      // Pas critique
    }

    return NextResponse.json({
      success: true,
      message: `Nettoyage terminé: ${deleted} supprimé(s), ${skipped} ignoré(s)`,
      summary: {
        total: discordMembers.length,
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

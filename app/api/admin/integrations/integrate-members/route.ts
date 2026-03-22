import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/requireAdmin';
import { memberRepository } from '@/lib/repositories';
import type { MemberRole } from '@/lib/memberRoles';
import { fetchCanonicalTwitchAvatarForLogin, hydrateTwitchStatusAvatar } from '@/lib/memberAvatar';
type IntegrateMemberInput = {
  id?: string;
  discordUsername?: string;
  discordId?: string;
  twitchLogin?: string;
  twitchChannelUrl?: string;
  parrain?: string;
  role?: 'Affilié' | 'Développement';
  integrationDate?: string;
};

/**
 * POST - Intègre les membres présents au site et Discord
 * Crée ou met à jour les membres (Supabase) avec rôle, statut actif et date d'intégration
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();

    if (!admin) {
      return NextResponse.json({ error: 'Non authentifié ou accès refusé' }, { status: 401 });
    }

    const body = await request.json();
    const { integrationId, members } = body as { integrationId?: string; members?: IntegrateMemberInput[] };

    if (!members || !Array.isArray(members) || members.length === 0) {
      return NextResponse.json(
        { error: 'Aucun membre à intégrer' },
        { status: 400 }
      );
    }

    const integrationDateDefault = new Date();
    let integrated = 0;
    let updated = 0;
    const errors: string[] = [];

    for (const member of members as IntegrateMemberInput[]) {
      try {
        const {
          discordUsername,
          discordId,
          twitchLogin,
          twitchChannelUrl,
          parrain,
          role,
          integrationDate: integrationDateStr,
        } = member;

        const displayName = discordUsername?.trim() || '';
        const login = (twitchLogin || '').trim().toLowerCase();

        if (!login || !displayName) {
          errors.push(`${displayName || 'Membre inconnu'}: Pseudo Discord et Twitch requis`);
          continue;
        }

        const normalizedTwitchUrl = twitchChannelUrl?.trim()
          ? twitchChannelUrl.startsWith('http')
            ? twitchChannelUrl
            : `https://www.twitch.tv/${login}`
          : `https://www.twitch.tv/${login}`;

        const targetRole: MemberRole = role === 'Développement' ? 'Développement' : 'Affilié';
        const integrationDate = integrationDateStr
          ? new Date(integrationDateStr)
          : integrationDateDefault;

        let existingMember = null;
        if (discordId) {
          existingMember = await memberRepository.findByDiscordId(discordId);
        }
        if (!existingMember && login) {
          existingMember = await memberRepository.findByTwitchLogin(login);
        }
        if (!existingMember && displayName) {
          const allChunk = await memberRepository.findAll(2000, 0);
          const normalized = displayName.toLowerCase().replace(/\s+/g, '');
          existingMember = allChunk.find(
            (m) =>
              m.discordUsername?.toLowerCase().replace(/\s+/g, '') === normalized ||
              m.displayName?.toLowerCase().replace(/\s+/g, '') === normalized
          ) || null;
        }

        const fetchedAvatar = await fetchCanonicalTwitchAvatarForLogin(login);

        if (existingMember) {
          try {
            await memberRepository.update(existingMember.twitchLogin, {
              displayName: displayName || existingMember.displayName,
              discordId: discordId || existingMember.discordId,
              discordUsername: displayName || existingMember.discordUsername,
              parrain: parrain || existingMember.parrain,
              twitchUrl: normalizedTwitchUrl,
              role: targetRole,
              roleManuallySet: true,
              isActive: true,
              integrationDate: existingMember.integrationDate || integrationDate,
              twitchStatus: hydrateTwitchStatusAvatar(existingMember.twitchStatus, fetchedAvatar) as any,
              updatedBy: admin.discordId || admin.id,
            });
            updated++;
          } catch (updateError) {
            console.error(`[Integrate Members] Erreur mise à jour ${displayName}:`, updateError);
            errors.push(`${displayName}: Erreur lors de la mise à jour`);
          }
        } else {
          try {
            let twitchId: string | undefined;
            try {
              const { resolveAndCacheTwitchId } = await import('@/lib/twitchIdResolver');
              twitchId = await resolveAndCacheTwitchId(login, false) || undefined;
            } catch {
              // ignorer
            }

            await memberRepository.create({
              twitchLogin: login,
              twitchId,
              twitchUrl: normalizedTwitchUrl,
              displayName,
              discordId: discordId || undefined,
              discordUsername: displayName,
              parrain: parrain || undefined,
              role: targetRole,
              roleManuallySet: true,
              isActive: true,
              isVip: false,
              integrationDate,
              badges: [],
              twitchStatus: hydrateTwitchStatusAvatar(undefined, fetchedAvatar) as any,
              profileValidationStatus: 'valide',
              onboardingStatus: 'termine',
              createdAt: new Date(),
              updatedAt: new Date(),
              updatedBy: admin.discordId || admin.id,
            });
            integrated++;
          } catch (createError) {
            console.error(`[Integrate Members] Erreur création ${displayName}:`, createError);
            errors.push(`${displayName}: Erreur lors de la création`);
          }
        }
      } catch (error) {
        const name = (member as IntegrateMemberInput).discordUsername || 'membre inconnu';
        console.error(`[Integrate Members] Erreur pour ${name}:`, error);
        errors.push(`${name}: Erreur interne`);
      }
    }

    return NextResponse.json({
      success: true,
      integrated,
      updated,
      errors: errors.length > 0 ? errors : undefined,
      message: `${integrated} membre(s) créé(s), ${updated} membre(s) mis à jour${errors.length > 0 ? `, ${errors.length} erreur(s)` : ''}`,
    });
  } catch (error) {
    console.error('[Integrate Members API] Erreur POST:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}


import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/requireAdmin';
import { findMemberByIdentifier, updateMemberData, createMemberData, getAllActiveMemberData, loadMemberDataFromStorage } from '@/lib/memberData';
import type { MemberRole } from '@/lib/memberRoles';

/**
 * POST - Intègre les membres présents au site et Discord
 * Crée ou met à jour les membres dans la base de données
 */
export async function POST(request: NextRequest) {
  try {
    // Authentification NextAuth + rôle admin requis
    const admin = await requireAdmin();
    
    if (!admin) {
      return NextResponse.json({ error: 'Non authentifié ou accès refusé' }, { status: 401 });
    }
    
    const body = await request.json();
    const { integrationId, members } = body;
    
    if (!members || !Array.isArray(members) || members.length === 0) {
      return NextResponse.json(
        { error: 'Aucun membre à intégrer' },
        { status: 400 }
      );
    }
    
    // Charger les données depuis le stockage
    await loadMemberDataFromStorage();
    const allMembers = getAllActiveMemberData();
    
    let integrated = 0;
    let updated = 0;
    let errors: string[] = [];
    
    for (const member of members) {
      try {
        const { discordUsername, discordId, twitchLogin, twitchChannelUrl, parrain } = member;
        
        if (!twitchLogin || !discordUsername) {
          errors.push(`${discordUsername || 'Membre inconnu'}: Données incomplètes (pseudo Discord et Twitch requis)`);
          continue;
        }
        
        if (!twitchChannelUrl) {
          errors.push(`${discordUsername}: Lien de chaîne Twitch requis`);
          continue;
        }
        
        // Chercher si le membre existe déjà
        let existingMember = null;
        if (discordId) {
          existingMember = findMemberByIdentifier({ discordId });
        }
        if (!existingMember) {
          existingMember = findMemberByIdentifier({ twitchLogin });
        }
        if (!existingMember) {
          // Normaliser le pseudo Discord pour la recherche
          const normalizedDiscordUsername = discordUsername.toLowerCase().replace(/\s+/g, '');
          existingMember = allMembers.find(m => 
            m.discordUsername?.toLowerCase().replace(/\s+/g, '') === normalizedDiscordUsername ||
            m.displayName?.toLowerCase().replace(/\s+/g, '') === normalizedDiscordUsername
          );
        }
        
        // Normaliser le lien Twitch
        const normalizedTwitchUrl = twitchChannelUrl.startsWith('http') 
          ? twitchChannelUrl 
          : `https://www.twitch.tv/${twitchLogin}`;
        
        // Préparer les données du membre
        const defaultRole: MemberRole = 'Affilié';
        const memberData: {
          twitchLogin: string;
          twitchUrl: string;
          displayName: string;
          discordUsername?: string;
          discordId?: string;
          parrain?: string;
          role: MemberRole;
          integrationDate?: Date;
          isActive: boolean;
          isVip: boolean;
        } = {
          twitchLogin: twitchLogin.toLowerCase(),
          twitchUrl: normalizedTwitchUrl,
          displayName: discordUsername,
          discordUsername: discordUsername,
          parrain: parrain || undefined,
          role: defaultRole, // Rôle par défaut pour les nouveaux membres
          integrationDate: new Date(),
          isActive: true,
          isVip: false,
        };
        
        if (discordId) {
          memberData.discordId = discordId;
        }
        
        if (existingMember) {
          // Mettre à jour le membre existant
          try {
            updateMemberData(
              existingMember.twitchLogin,
              {
                ...memberData,
                // Conserver certaines données existantes si elles sont meilleures
                displayName: memberData.displayName || existingMember.displayName,
                discordId: memberData.discordId || existingMember.discordId,
                discordUsername: memberData.discordUsername || existingMember.discordUsername,
                parrain: memberData.parrain || existingMember.parrain,
                integrationDate: existingMember.integrationDate || memberData.integrationDate,
              },
              admin.discordId
            );
            updated++;
          } catch (updateError) {
            console.error(`[Integrate Members] Erreur mise à jour ${discordUsername}:`, updateError);
            errors.push(`${discordUsername}: Erreur lors de la mise à jour`);
          }
        } else {
          // Créer un nouveau membre
          try {
            // Résoudre le Twitch ID si possible
            let twitchId: string | undefined = undefined;
            try {
              const { resolveAndCacheTwitchId } = await import('@/lib/twitchIdResolver');
              const resolvedId = await resolveAndCacheTwitchId(twitchLogin, false);
              if (resolvedId) {
                twitchId = resolvedId;
              }
            } catch (twitchError) {
              console.warn(`[Integrate Members] Impossible de résoudre Twitch ID pour ${twitchLogin}:`, twitchError);
            }
            
            await createMemberData(
              {
                twitchLogin: memberData.twitchLogin,
                twitchId: twitchId,
                twitchUrl: memberData.twitchUrl,
                displayName: memberData.displayName,
                discordId: memberData.discordId,
                discordUsername: memberData.discordUsername,
                role: memberData.role,
                isActive: memberData.isActive,
                isVip: memberData.isVip,
                integrationDate: memberData.integrationDate,
                parrain: memberData.parrain,
              },
              admin.discordId
            );
            integrated++;
          } catch (createError) {
            console.error(`[Integrate Members] Erreur création ${discordUsername}:`, createError);
            errors.push(`${discordUsername}: ${createError instanceof Error ? createError.message : 'Erreur lors de la création'}`);
          }
        }
      } catch (error) {
        console.error(`[Integrate Members] Erreur pour ${member.discordUsername || 'membre inconnu'}:`, error);
        errors.push(`${member.discordUsername || 'Membre inconnu'}: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
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
    return NextResponse.json(
      { error: 'Erreur serveur', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}


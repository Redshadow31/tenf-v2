import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin, isFounder } from '@/lib/admin';
import { getAllMemberData, updateMemberData, createMemberData, loadMemberDataFromStorage } from '@/lib/memberData';
import { DISCORD_ROLE_IDS, GUILD_ID, mapDiscordRoleToSiteRole } from '@/lib/discordRoles';

interface DiscordMember {
  user: {
    id: string;
    username: string;
    discriminator: string;
    avatar: string | null;
    global_name?: string | null;
    bot?: boolean;
  };
  roles: string[];
  nick?: string | null;
}

/**
 * POST - Synchronise les membres Discord avec le système centralisé
 * Réservé aux fondateurs
 * 
 * Query params:
 * - syncAll: si true, synchronise tous les membres même sans rôle pertinent (défaut: false)
 * - preview: si true, retourne seulement la liste des membres sans synchroniser (défaut: false)
 * 
 * Body (optionnel):
 * - selectedMemberIds: array de Discord IDs des membres à synchroniser (si non fourni, synchronise tous)
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

    if (!isFounder(admin.id)) {
      return NextResponse.json(
        { error: "Accès refusé. Réservé aux fondateurs." },
        { status: 403 }
      );
    }

    const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
    
    if (!DISCORD_BOT_TOKEN) {
      return NextResponse.json(
        { error: 'Discord bot token not configured' },
        { status: 500 }
      );
    }

    // Vérifier les paramètres de requête
    const { searchParams } = new URL(request.url);
    const syncAll = searchParams.get('syncAll') === 'true';
    const preview = searchParams.get('preview') === 'true';
    
    // Récupérer la liste des membres sélectionnés depuis le body
    let selectedMemberIds: Set<string> | null = null;
    try {
      const body = await request.json().catch(() => ({}));
      if (body.selectedMemberIds && Array.isArray(body.selectedMemberIds)) {
        selectedMemberIds = new Set(body.selectedMemberIds);
      }
    } catch (e) {
      // Pas de body, continuer
    }

    // Récupérer tous les membres du serveur Discord avec pagination
    // L'API Discord limite à 1000 membres par requête, il faut paginer
    const discordMembers: DiscordMember[] = [];
    let after: string | undefined = undefined;
    let hasMore = true;
    let totalFetched = 0;

    while (hasMore) {
      const url: string = `https://discord.com/api/v10/guilds/${GUILD_ID}/members?limit=1000${after ? `&after=${after}` : ''}`;
      const membersResponse = await fetch(url, {
        headers: {
          Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
        },
      });

      if (!membersResponse.ok) {
        const errorText = await membersResponse.text();
        return NextResponse.json(
          { error: 'Failed to fetch Discord members', details: errorText },
          { status: membersResponse.status }
        );
      }

      const batch: DiscordMember[] = await membersResponse.json();
      discordMembers.push(...batch);
      totalFetched += batch.length;

      // Si on a récupéré moins de 1000 membres, on a atteint la fin
      if (batch.length < 1000) {
        hasMore = false;
      } else {
        // Utiliser l'ID du dernier membre comme cursor pour la pagination
        after = batch[batch.length - 1].user.id;
      }
    }

    console.log(`[Discord Sync] Récupéré ${totalFetched} membres Discord au total`);
    
    // Log des premiers membres pour déboguer
    if (discordMembers.length > 0) {
      console.log(`[Discord Sync] Exemple de membre (premier):`, {
        id: discordMembers[0].user.id,
        username: discordMembers[0].user.username,
        roles: discordMembers[0].roles,
        rolesCount: discordMembers[0].roles.length,
      });
    }
    
    // Charger les données depuis le stockage persistant
    await loadMemberDataFromStorage();
    
    const existingMembers = getAllMemberData();
    const existingByDiscordId = new Map(
      existingMembers
        .filter(m => m.discordId)
        .map(m => [m.discordId!, m])
    );
    // Créer aussi un index par nom d'utilisateur Discord (fallback si pas d'ID)
    const existingByDiscordUsername = new Map(
      existingMembers
        .filter(m => m.discordUsername)
        .map(m => [m.discordUsername!.toLowerCase(), m])
    );

    let synced = 0;
    let created = 0;
    let updated = 0;
    let skippedBots = 0;
    let skippedNoRole = 0;
    let skippedManual = 0;
    let roleStats: Record<string, number> = {};
    let roleIdStats: Record<string, number> = {}; // Statistiques par ID de rôle Discord

    // Liste des membres pour le preview
    const previewMembersList: any[] = [];

    // Synchroniser chaque membre Discord
    for (const discordMember of discordMembers) {
      // Filtrer les bots
      if (discordMember.user.bot) {
        skippedBots++;
        continue;
      }

      // Compter les rôles Discord pour statistiques
      discordMember.roles.forEach(roleId => {
        roleIdStats[roleId] = (roleIdStats[roleId] || 0) + 1;
      });

      // Filtrer les membres qui ont au moins un des rôles recherchés (sauf si syncAll est activé)
      const hasRelevantRole = discordMember.roles.some(roleId => 
        Object.values(DISCORD_ROLE_IDS).includes(roleId as any)
      );
      
      if (!hasRelevantRole && !syncAll) {
        skippedNoRole++;
        // Log pour les premiers membres sans rôle pour déboguer
        if (skippedNoRole <= 5) {
          console.log(`[Discord Sync] Membre sans rôle pertinent: ${discordMember.user.username} (${discordMember.user.id}), rôles:`, discordMember.roles);
        }
        continue;
      }
      
      // Si syncAll est activé et pas de rôle pertinent, utiliser "Affilié" par défaut
      if (!hasRelevantRole && syncAll) {
        console.log(`[Discord Sync] Membre sans rôle pertinent mais syncAll activé: ${discordMember.user.username} (${discordMember.user.id})`);
      }

      const { role, badges } = mapDiscordRoleToSiteRole(discordMember.roles);
      const discordId = discordMember.user.id;
      const discordUsername = discordMember.user.username;
      const displayName = discordMember.nick || discordMember.user.global_name || discordUsername;

      // Si selectedMemberIds est fourni, ne traiter que les membres sélectionnés
      if (selectedMemberIds && !selectedMemberIds.has(discordId)) {
        continue;
      }

      // Compter les rôles pour les statistiques
      roleStats[role] = (roleStats[role] || 0) + 1;
      
      // Log pour les premiers membres synchronisés pour déboguer
      if (synced < 10 && !preview) {
        const hasDevRole = discordMember.roles.includes(DISCORD_ROLE_IDS.CREATEUR_DEVELOPPEMENT);
        const hasAffilieRole = discordMember.roles.includes(DISCORD_ROLE_IDS.CREATEUR_AFFILIE);
        console.log(`[Discord Sync] Membre ${synced + 1}: ${discordUsername} (${discordId})`, {
          roles: discordMember.roles,
          mappedRole: role,
          hasDevRole,
          hasAffilieRole,
          hasBothRoles: hasDevRole && hasAffilieRole,
          devRoleId: DISCORD_ROLE_IDS.CREATEUR_DEVELOPPEMENT,
        });
      }

      // Chercher un membre existant par Discord ID d'abord, puis par nom d'utilisateur
      let existing = existingByDiscordId.get(discordId);
      if (!existing) {
        // Fallback: chercher par nom d'utilisateur Discord (insensible à la casse)
        existing = existingByDiscordUsername.get(discordUsername.toLowerCase());
      }

      // En mode preview, ajouter à la liste sans synchroniser
      if (preview) {
        previewMembersList.push({
          discordId,
          discordUsername,
          displayName,
          roles: discordMember.roles,
          siteRole: role,
          badges,
          twitchLogin: existing?.twitchLogin,
          isExisting: !!existing,
          hasManualChanges: existing?.roleManuallySet || false,
        });
        synced++;
        continue;
      }

      if (existing) {
        // PROTECTION : Ne JAMAIS écraser les données manuelles
        if (existing.roleManuallySet) {
          console.log(`[Discord Sync] Membre ${discordUsername} ignoré - modifications manuelles protégées`);
          skippedManual++;
          continue;
        }

        // Mettre à jour le membre existant
        // Ne pas écraser le rôle si il a été défini manuellement
        // IMPORTANT: Toujours mettre à jour discordId et discordUsername pour refléter les changements de pseudo
        const updates: any = {
          discordId, // L'ID Discord ne change jamais, c'est l'identifiant principal
          discordUsername, // Mettre à jour le username si il a changé
          displayName, // Mettre à jour le displayName (nickname ou global_name)
          isVip: discordMember.roles.includes(DISCORD_ROLE_IDS.VIP_ELITE),
          isActive: true,
        };
        
        // Ne mettre à jour le rôle que s'il n'a pas été défini manuellement
        if (!existing.roleManuallySet) {
          updates.role = role;
        }
        
        await updateMemberData(
          existing.twitchLogin,
          updates,
          admin.id
        );
        updated++;
      } else {
        // Créer un nouveau membre (sans Twitch pour l'instant)
        // Il faudra lier manuellement via la page de gestion complète
        const twitchLogin = `discord_${discordId}`; // Placeholder
        await createMemberData(
          {
            twitchLogin,
            displayName,
            twitchUrl: `https://www.twitch.tv/${twitchLogin}`,
            discordId,
            discordUsername,
            role,
            isVip: discordMember.roles.includes(DISCORD_ROLE_IDS.VIP_ELITE),
            isActive: true,
          },
          admin.id
        );
        created++;
      }
      synced++;
    }

    // En mode preview, retourner la liste des membres sans synchroniser
    if (preview) {
      return NextResponse.json({
        success: true,
        message: `Prévisualisation: ${previewMembersList.length} membres trouvés`,
        members: previewMembersList,
        stats: {
          totalFetched,
          skippedBots,
          skippedNoRole,
          previewCount: previewMembersList.length,
        },
      });
    }

    console.log(`[Discord Sync] Statistiques:`);
    console.log(`  - Membres Discord récupérés: ${totalFetched}`);
    console.log(`  - Bots ignorés: ${skippedBots}`);
    console.log(`  - Membres sans rôle pertinent: ${skippedNoRole}`);
    console.log(`  - Membres ignorés (modifications manuelles): ${skippedManual}`);
    console.log(`  - Membres synchronisés: ${synced}`);
    console.log(`  - Membres créés: ${created}`);
    console.log(`  - Membres mis à jour: ${updated}`);
    console.log(`  - Répartition par rôle site:`, roleStats);
    console.log(`  - Répartition par ID rôle Discord (top 10):`, 
      Object.entries(roleIdStats)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .reduce((acc, [id, count]) => {
          const roleName = Object.entries(DISCORD_ROLE_IDS).find(([_, val]) => val === id)?.[0] || id;
          acc[roleName] = count;
          return acc;
        }, {} as Record<string, number>)
    );
    console.log(`  - Vérification ID rôle développement:`, {
      expected: DISCORD_ROLE_IDS.CREATEUR_DEVELOPPEMENT,
      found: roleIdStats[DISCORD_ROLE_IDS.CREATEUR_DEVELOPPEMENT] || 0,
    });

    return NextResponse.json({
      success: true,
      message: `Synchronisation terminée`,
      stats: {
        totalFetched,
        skippedBots,
        skippedNoRole,
        skippedManual,
        synced,
        created,
        updated,
        roleStats,
      },
    });
  } catch (error) {
    console.error("Error syncing Discord members:", error);
    return NextResponse.json(
      { error: "Erreur serveur", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}


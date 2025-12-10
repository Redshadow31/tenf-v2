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

    // Récupérer tous les membres du serveur Discord
    const membersResponse = await fetch(
      `https://discord.com/api/v10/guilds/${GUILD_ID}/members?limit=1000`,
      {
        headers: {
          Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
        },
      }
    );

    if (!membersResponse.ok) {
      const errorText = await membersResponse.text();
      return NextResponse.json(
        { error: 'Failed to fetch Discord members', details: errorText },
        { status: membersResponse.status }
      );
    }

    const discordMembers: DiscordMember[] = await membersResponse.json();
    
    // Charger les données depuis le stockage persistant
    await loadMemberDataFromStorage();
    
    const existingMembers = getAllMemberData();
    const existingByDiscordId = new Map(
      existingMembers
        .filter(m => m.discordId)
        .map(m => [m.discordId!, m])
    );

    let synced = 0;
    let created = 0;
    let updated = 0;

    // Synchroniser chaque membre Discord
    for (const discordMember of discordMembers) {
      // Filtrer les bots
      if (discordMember.user.bot) continue;

      // Filtrer les membres qui ont au moins un des rôles recherchés
      const hasRelevantRole = discordMember.roles.some(roleId => 
        Object.values(DISCORD_ROLE_IDS).includes(roleId as any)
      );
      if (!hasRelevantRole) continue;

      const { role, badges } = mapDiscordRoleToSiteRole(discordMember.roles);
      const discordId = discordMember.user.id;
      const discordUsername = discordMember.user.username;
      const displayName = discordMember.nick || discordMember.user.global_name || discordUsername;

      // Chercher un membre existant par Discord ID
      const existing = existingByDiscordId.get(discordId);

      if (existing) {
        // Mettre à jour le membre existant
        // Ne pas écraser le rôle si il a été défini manuellement
        const updates: any = {
          discordId,
          discordUsername,
          displayName,
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

    return NextResponse.json({
      success: true,
      message: `Synchronisation terminée`,
      synced,
      created,
      updated,
    });
  } catch (error) {
    console.error("Error syncing Discord members:", error);
    return NextResponse.json(
      { error: "Erreur serveur", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}


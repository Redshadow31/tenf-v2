import { NextResponse } from 'next/server';
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

interface DiscordRole {
  id: string;
  name: string;
  color: number;
  position: number;
}

interface MemberWithDiscordRoles {
  discordId: string;
  discordUsername: string;
  discordNickname?: string;
  avatar: string;
  roles: string[]; // IDs des rôles Discord
  roleNames: string[]; // Noms des rôles Discord
  siteRole: "Affilié" | "Développement" | "Modérateur Junior" | "Mentor" | "Admin" | "Admin Adjoint" | "Créateur Junior";
  badges: string[];
  isVip: boolean;
  isModeratorJunior: boolean;
  isModeratorMentor: boolean;
  isAdminFondateurs: boolean;
  isAdminAdjoint: boolean;
}

/**
 * GET - Récupère tous les membres du serveur Discord avec leurs rôles
 */
export async function GET() {
  try {
    const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
    
    if (!DISCORD_BOT_TOKEN) {
      return NextResponse.json(
        { error: 'Discord bot token not configured' },
        { status: 500 }
      );
    }

    // Récupérer tous les membres du serveur
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
      console.error('Discord API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to fetch Discord members', details: errorText },
        { status: membersResponse.status }
      );
    }

    const members: DiscordMember[] = await membersResponse.json();

    // Récupérer tous les rôles du serveur pour avoir les noms
    const rolesResponse = await fetch(
      `https://discord.com/api/v10/guilds/${GUILD_ID}/roles`,
      {
        headers: {
          Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
        },
      }
    );

    if (!rolesResponse.ok) {
      const errorText = await rolesResponse.text();
      console.error('Discord Roles API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to fetch Discord roles', details: errorText },
        { status: rolesResponse.status }
      );
    }

    const roles: DiscordRole[] = await rolesResponse.json();
    const roleMap = new Map(roles.map(role => [role.id, role.name]));

    // Filtrer et mapper les membres avec leurs rôles
    const membersWithRoles: MemberWithDiscordRoles[] = members
      .filter((member) => {
        // Filtrer les bots
        if (member.user.bot) return false;
        // Filtrer les membres qui ont au moins un des rôles recherchés
        const hasRelevantRole = member.roles.some(roleId => 
          Object.values(DISCORD_ROLE_IDS).includes(roleId as any)
        );
        return hasRelevantRole;
      })
      .map((member) => {
        const { role, badges } = mapDiscordRoleToSiteRole(member.roles);
        const roleNames = member.roles
          .map(roleId => roleMap.get(roleId))
          .filter(Boolean) as string[];

        // Convertir null en undefined pour discordNickname
        const nickname = member.nick || member.user.global_name;
        const discordNickname = nickname !== null && nickname !== undefined ? nickname : undefined;

        return {
          discordId: member.user.id,
          discordUsername: member.user.username,
          discordNickname,
          avatar: member.user.avatar
            ? `https://cdn.discordapp.com/avatars/${member.user.id}/${member.user.avatar}.png`
            : `https://cdn.discordapp.com/embed/avatars/${member.user.discriminator && member.user.discriminator !== '0' ? parseInt(member.user.discriminator) % 5 : 0}.png`,
          roles: member.roles,
          roleNames,
          siteRole: role,
          badges,
          isVip: member.roles.includes(DISCORD_ROLE_IDS.VIP_ELITE),
          isModeratorJunior: member.roles.includes(DISCORD_ROLE_IDS.MODERATEUR_JUNIOR),
          isModeratorMentor: member.roles.includes(DISCORD_ROLE_IDS.MODERATEUR_MENTOR),
          isAdminFondateurs: member.roles.includes(DISCORD_ROLE_IDS.ADMIN_FONDATEURS),
          isAdminAdjoint: member.roles.includes(DISCORD_ROLE_IDS.ADMIN_ADJOINT),
        };
      });

    return NextResponse.json({ 
      members: membersWithRoles,
      total: membersWithRoles.length,
      roles: Array.from(roleMap.entries()).map(([id, name]) => ({ id, name }))
    });
  } catch (error) {
    console.error('Error fetching Discord members:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}


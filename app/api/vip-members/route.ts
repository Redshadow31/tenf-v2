import { NextResponse } from 'next/server';

interface DiscordMember {
  user: {
    id: string;
    username: string;
    discriminator: string;
    avatar: string | null;
  };
  roles: string[];
}

interface VipMember {
  discordId: string;
  username: string;
  avatar: string;
  displayName: string;
}

/**
 * Récupère les membres avec le rôle VIP Elite depuis Discord
 * Serveur source: 1296104419146072075
 * Serveur cible: 535244857891880970
 */
export async function GET() {
  try {
    const GUILD_ID = '535244857891880970'; // Serveur cible
    const SOURCE_GUILD_ID = '1296104419146072075'; // Serveur source (pour référence)
    
    // Note: Vous devrez configurer DISCORD_BOT_TOKEN dans vos variables d'environnement
    const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
    
    if (!DISCORD_BOT_TOKEN) {
      console.error('DISCORD_BOT_TOKEN is not configured');
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

    // Récupérer les rôles du serveur pour trouver l'ID du rôle VIP Elite
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

    const roles = await rolesResponse.json();
    
    // Chercher le rôle VIP Elite (peut être nommé différemment, ajustez selon votre serveur)
    // Recherche flexible : VIP Elite, VIPElite, Elite VIP, etc.
    const vipEliteRole = roles.find(
      (role: any) => {
        const roleName = role.name.toLowerCase();
        return (
          (roleName.includes('vip') && roleName.includes('elite')) ||
          roleName === 'vip elite' ||
          roleName === 'elite vip'
        );
      }
    );

    if (!vipEliteRole) {
      console.warn('VIP Elite role not found. Available roles:', roles.map((r: any) => r.name));
      return NextResponse.json({ 
        members: [],
        warning: 'VIP Elite role not found. Please check the role name in your Discord server.'
      });
    }

    // Filtrer les membres qui ont le rôle VIP Elite
    const vipMembers: VipMember[] = members
      .filter((member) => member.roles.includes(vipEliteRole.id))
      .map((member) => ({
        discordId: member.user.id,
        username: member.user.username,
        avatar: member.user.avatar
          ? `https://cdn.discordapp.com/avatars/${member.user.id}/${member.user.avatar}.png`
          : `https://cdn.discordapp.com/embed/avatars/${member.user.discriminator && member.user.discriminator !== '0' ? parseInt(member.user.discriminator) % 5 : 0}.png`,
        displayName: member.user.username,
      }));

    return NextResponse.json({ members: vipMembers });
  } catch (error) {
    console.error('Error fetching VIP members:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}


import { NextResponse } from 'next/server';
import { DISCORD_ROLE_IDS, GUILD_ID, mapDiscordRoleToSiteRole } from '@/lib/discordRoles';

const CHANNEL_ID = '1278838338199224462'; // #vos-chaînes-twitch

interface DiscordMessage {
  id: string;
  content: string;
  author: {
    id: string;
    username: string;
    global_name?: string | null;
    avatar: string | null;
  };
  member?: {
    roles: string[];
    nick?: string | null;
  };
}

interface ParsedMember {
  discordId: string;
  discordUsername: string;
  discordNickname?: string;
  twitchLogin: string;
  twitchUrl: string;
  avatar: string;
  roles: string[];
  siteRole: "Affilié" | "Développement" | "Staff" | "Mentor" | "Admin";
  badges: string[];
  isVip: boolean;
  isModeratorJunior: boolean;
  isModeratorMentor: boolean;
}

/**
 * Parse un message pour extraire le pseudo Discord et la chaîne Twitch
 * Formats attendus :
 * - @username: https://www.twitch.tv/channel
 * - @username https://www.twitch.tv/channel
 * - username: https://www.twitch.tv/channel
 */
function parseMessage(message: string): { discordUsername?: string; twitchLogin?: string; twitchUrl?: string } | null {
  // Nettoyer le message
  const cleaned = message.trim();
  
  // Pattern pour détecter les URLs Twitch
  const twitchUrlPattern = /(?:https?:\/\/)?(?:www\.)?twitch\.tv\/([a-zA-Z0-9_]+)/gi;
  const twitchMatch = cleaned.match(twitchUrlPattern);
  
  if (!twitchMatch || twitchMatch.length === 0) {
    return null;
  }

  // Extraire le login Twitch de la première URL trouvée
  const twitchUrl = twitchMatch[0];
  const twitchLoginMatch = twitchUrl.match(/\/([a-zA-Z0-9_]+)$/);
  if (!twitchLoginMatch) {
    return null;
  }

  const twitchLogin = twitchLoginMatch[1].toLowerCase();
  const fullTwitchUrl = twitchUrl.startsWith('http') ? twitchUrl : `https://${twitchUrl}`;

  // Essayer d'extraire le pseudo Discord (peut être @username ou juste username)
  const discordMatch = cleaned.match(/(?:@)?([a-zA-Z0-9_]+)[:\s]+(?:https?:\/\/)?(?:www\.)?twitch\.tv/i);
  const discordUsername = discordMatch ? discordMatch[1] : undefined;

  return {
    discordUsername,
    twitchLogin,
    twitchUrl: fullTwitchUrl,
  };
}

/**
 * GET - Récupère les membres actifs depuis le canal #vos-chaînes-twitch
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

    // Récupérer les messages du canal (limite 100, on peut paginer si nécessaire)
    const messagesResponse = await fetch(
      `https://discord.com/api/v10/channels/${CHANNEL_ID}/messages?limit=100`,
      {
        headers: {
          Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
        },
      }
    );

    if (!messagesResponse.ok) {
      const errorText = await messagesResponse.text();
      console.error('Discord Messages API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to fetch Discord messages', details: errorText },
        { status: messagesResponse.status }
      );
    }

    const messages: DiscordMessage[] = await messagesResponse.json();

    // Récupérer les rôles du serveur pour mapper les rôles des membres
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
    const roleMap = new Map(roles.map((role: any) => [role.id, role.name]));

    // Récupérer les informations complètes des membres du serveur pour avoir leurs rôles
    const membersResponse = await fetch(
      `https://discord.com/api/v10/guilds/${GUILD_ID}/members?limit=1000`,
      {
        headers: {
          Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
        },
      }
    );

    let guildMembers: Map<string, any> = new Map();
    if (membersResponse.ok) {
      const members = await membersResponse.json();
      members.forEach((member: any) => {
        guildMembers.set(member.user.id, member);
      });
    }

    // Parser les messages et créer la liste des membres
    const parsedMembers: Map<string, ParsedMember> = new Map();

    for (const message of messages) {
      // Ignorer les bots
      if (message.author.bot) continue;

      const parsed = parseMessage(message.content);
      if (!parsed || !parsed.twitchLogin) {
        continue;
      }

      const discordId = message.author.id;
      // Utiliser toujours l'auteur du message comme source de vérité pour Discord
      const discordUsername = message.author.username;
      const guildMember = guildMembers.get(discordId);
      const memberRoles = guildMember?.roles || message.member?.roles || [];

      // Tous les membres qui ont posté dans ce canal sont considérés comme actifs
      // On inclut tous les membres, même s'ils n'ont pas de rôle spécifique

      const { role, badges } = mapDiscordRoleToSiteRole(memberRoles);
      const roleNames = memberRoles
        .map((roleId: string) => roleMap.get(roleId))
        .filter(Boolean) as string[];

      // Utiliser le pseudo Discord du message ou celui de l'auteur
      const displayName = message.member?.nick || message.author.global_name || message.author.username;

      // Créer ou mettre à jour le membre (on garde le dernier message trouvé pour chaque membre)
      // Si un membre a plusieurs messages, on garde le plus récent
      const existingMember = parsedMembers.get(discordId);
      if (!existingMember || message.id > (existingMember as any).lastMessageId) {
        parsedMembers.set(discordId, {
          discordId,
          discordUsername,
          discordNickname: displayName !== message.author.username ? displayName : undefined,
          twitchLogin: parsed.twitchLogin,
          twitchUrl: parsed.twitchUrl,
          avatar: message.author.avatar
            ? `https://cdn.discordapp.com/avatars/${message.author.id}/${message.author.avatar}.png`
            : `https://cdn.discordapp.com/embed/avatars/${parseInt(message.author.id) % 5}.png`,
          roles: memberRoles,
          siteRole: role,
          badges,
          isVip: memberRoles.includes(DISCORD_ROLE_IDS.VIP_ELITE),
          isModeratorJunior: memberRoles.includes(DISCORD_ROLE_IDS.MODERATEUR_JUNIOR),
          isModeratorMentor: memberRoles.includes(DISCORD_ROLE_IDS.MODERATEUR_MENTOR),
        } as ParsedMember & { lastMessageId?: string });
      }
    }

    // Convertir la Map en tableau
    const membersArray = Array.from(parsedMembers.values());

    return NextResponse.json({ 
      members: membersArray,
      total: membersArray.length,
      source: 'discord_channel',
      channelId: CHANNEL_ID,
    });
  } catch (error) {
    console.error('Error fetching Discord channel members:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}


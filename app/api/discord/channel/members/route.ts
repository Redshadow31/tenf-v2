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
    bot?: boolean;
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
  siteRole: "Affilié" | "Développement" | "Staff" | "Mentor" | "Admin" | "Admin Adjoint" | "Créateur Junior";
  badges: string[];
  isVip: boolean;
  isModeratorJunior: boolean;
  isModeratorMentor: boolean;
  isAdminFondateurs: boolean;
  isAdminAdjoint: boolean;
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
  // Gérer les cas avec ou sans underscore, avec ou sans @
  const discordMatch = cleaned.match(/(?:@)?([a-zA-Z0-9_]+)[:\s]+(?:https?:\/\/)?(?:www\.)?twitch\.tv/i);
  let discordUsername = discordMatch ? discordMatch[1] : undefined;
  
  // Nettoyer le pseudo Discord (enlever les underscores en fin si présent, normaliser)
  if (discordUsername) {
    discordUsername = discordUsername.trim();
  }

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

    // Récupérer tous les messages du canal avec pagination
    const messages: DiscordMessage[] = [];
    let before: string | undefined = undefined;
    let hasMore = true;
    let totalMessagesFetched = 0;

    while (hasMore) {
      const url = `https://discord.com/api/v10/channels/${CHANNEL_ID}/messages?limit=100${before ? `&before=${before}` : ''}`;
      const messagesResponse = await fetch(url, {
        headers: {
          Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
        },
      });

      if (!messagesResponse.ok) {
        const errorText = await messagesResponse.text();
        console.error('Discord Messages API error:', errorText);
        return NextResponse.json(
          { error: 'Failed to fetch Discord messages', details: errorText },
          { status: messagesResponse.status }
        );
      }

      const batch: DiscordMessage[] = await messagesResponse.json();
      messages.push(...batch);
      totalMessagesFetched += batch.length;

      // Si on a récupéré moins de 100 messages, on a atteint la fin
      if (batch.length < 100) {
        hasMore = false;
      } else {
        // Utiliser l'ID du dernier message comme cursor pour la pagination
        before = batch[batch.length - 1].id;
      }
    }

    console.log(`[Discord Channel] Récupéré ${totalMessagesFetched} messages au total`);

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

    // Récupérer tous les membres du serveur avec pagination pour avoir leurs rôles
    let guildMembers: Map<string, any> = new Map();
    let after: string | undefined = undefined;
    let hasMoreMembers = true;
    let totalMembersFetched = 0;

    while (hasMoreMembers) {
      const url = `https://discord.com/api/v10/guilds/${GUILD_ID}/members?limit=1000${after ? `&after=${after}` : ''}`;
      const membersResponse = await fetch(url, {
        headers: {
          Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
        },
      });

      if (membersResponse.ok) {
        const batch = await membersResponse.json();
        batch.forEach((member: any) => {
          // Filtrer les bots
          if (member.user && member.user.bot) {
            return;
          }
          guildMembers.set(member.user.id, member);
        });
        totalMembersFetched += batch.length;

        // Si on a récupéré moins de 1000 membres, on a atteint la fin
        if (batch.length < 1000) {
          hasMoreMembers = false;
        } else {
          // Utiliser l'ID du dernier membre comme cursor pour la pagination
          after = batch[batch.length - 1].user.id;
        }
      } else {
        hasMoreMembers = false;
      }
    }

    console.log(`[Discord Channel] Récupéré ${totalMembersFetched} membres du serveur au total`);

    // Parser les messages et créer la liste des membres
    const parsedMembers: Map<string, ParsedMember> = new Map();
    
    // Créer un index des membres du serveur par nom d'utilisateur (insensible à la casse)
    const guildMembersByUsername = new Map<string, any>();
    guildMembers.forEach((member) => {
      if (member.user && !member.user.bot) {
        const username = member.user.username.toLowerCase();
        guildMembersByUsername.set(username, member);
        // Aussi indexer par global_name si présent
        if (member.user.global_name) {
          guildMembersByUsername.set(member.user.global_name.toLowerCase(), member);
        }
      }
    });

    for (const message of messages) {
      // Ignorer les bots
      if (message.author.bot) continue;
      
      // Parser chaque ligne du message pour extraire tous les membres listés
      const lines = message.content.split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        const parsed = parseMessage(line);
        if (!parsed || !parsed.twitchLogin) {
          continue;
        }

        // Chercher le membre Discord réel par son pseudo (pas l'auteur du message)
        let guildMember: any = null;
        let discordId: string | null = null;
        let discordUsername: string;
        let discordNickname: string | undefined;
        
        if (parsed.discordUsername) {
          // Normaliser le pseudo pour la recherche (minuscules, enlever underscores en fin)
          const normalizedSearch = parsed.discordUsername.toLowerCase().replace(/_+$/, '');
          
          // Chercher le membre par son pseudo Discord (exact match d'abord)
          let foundMember = guildMembersByUsername.get(parsed.discordUsername.toLowerCase());
          
          // Si pas trouvé, chercher avec une recherche plus flexible
          if (!foundMember) {
            for (const [username, member] of guildMembersByUsername.entries()) {
              const normalizedUsername = username.replace(/_+$/, '');
              if (normalizedUsername === normalizedSearch || username === normalizedSearch) {
                foundMember = member;
                break;
              }
            }
          }
          
          if (foundMember) {
            guildMember = foundMember;
            discordId = foundMember.user.id;
            discordUsername = foundMember.user.username;
            discordNickname = foundMember.nick || foundMember.user.global_name || undefined;
          } else {
            // Si pas trouvé, utiliser le pseudo du texte mais sans ID Discord
            discordUsername = parsed.discordUsername;
            console.warn(`[Discord Channel] Membre Discord non trouvé: ${parsed.discordUsername} (recherché: ${normalizedSearch})`);
          }
        } else {
          // Si pas de pseudo Discord dans le texte, utiliser l'auteur du message
          const authorMember = guildMembers.get(message.author.id);
          if (authorMember && !authorMember.user.bot) {
            guildMember = authorMember;
            discordId = message.author.id;
            discordUsername = message.author.username;
            discordNickname = authorMember.nick || message.author.global_name || undefined;
          } else {
            continue; // Ignorer si on ne peut pas identifier le membre
          }
        }

        // Si on n'a pas d'ID Discord, on ne peut pas créer le membre
        if (!discordId) {
          continue;
        }

        const memberRoles = guildMember?.roles || [];
        const { role, badges } = mapDiscordRoleToSiteRole(memberRoles);

        // Utiliser le pseudo Discord du message ou celui de l'auteur
        const displayName = discordNickname || discordUsername;

        // Créer ou mettre à jour le membre (on garde le dernier message trouvé pour chaque membre)
        // Si un membre a plusieurs messages, on garde le plus récent
        const existingMember = parsedMembers.get(discordId);
        if (!existingMember || message.id > (existingMember as any).lastMessageId) {
          parsedMembers.set(discordId, {
            discordId,
            discordUsername,
            discordNickname: displayName !== discordUsername ? displayName : undefined,
            twitchLogin: parsed.twitchLogin,
            twitchUrl: parsed.twitchUrl,
            avatar: guildMember?.user?.avatar
              ? `https://cdn.discordapp.com/avatars/${guildMember.user.id}/${guildMember.user.avatar}.png`
              : `https://cdn.discordapp.com/embed/avatars/${parseInt(discordId) % 5}.png`,
            roles: memberRoles,
            siteRole: role,
            badges,
            isVip: memberRoles.includes(DISCORD_ROLE_IDS.VIP_ELITE),
            isModeratorJunior: memberRoles.includes(DISCORD_ROLE_IDS.MODERATEUR_JUNIOR),
            isModeratorMentor: memberRoles.includes(DISCORD_ROLE_IDS.MODERATEUR_MENTOR),
            isAdminFondateurs: memberRoles.includes(DISCORD_ROLE_IDS.ADMIN_FONDATEURS),
            isAdminAdjoint: memberRoles.includes(DISCORD_ROLE_IDS.ADMIN_ADJOINT),
          } as ParsedMember & { lastMessageId?: string });
        }
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


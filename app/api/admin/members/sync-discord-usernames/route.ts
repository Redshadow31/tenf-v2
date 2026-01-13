import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdmin, isFounder } from "@/lib/admin";
import { getAllMemberData, updateMemberData, loadMemberDataFromStorage } from "@/lib/memberData";
import { GUILD_ID } from "@/lib/discordRoles";

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
 * POST - Synchronise les pseudos Discord depuis Discord (via ID Discord)
 * Met à jour uniquement le champ discordUsername, sans toucher au displayName
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

    // Charger les données membres
    await loadMemberDataFromStorage();
    const allMembers = getAllMemberData();

    // Filtrer les membres qui ont un discordId
    const membersWithDiscordId = allMembers.filter(m => m.discordId);

    if (membersWithDiscordId.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: "Aucun membre avec ID Discord à synchroniser",
        synced: 0 
      });
    }

    // Récupérer tous les membres Discord du serveur
    const discordMembersMap = new Map<string, string>(); // discordId -> username
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
      
      // Ajouter les membres à la map
      batch.forEach(member => {
        if (!member.user.bot && member.user.id) {
          discordMembersMap.set(member.user.id, member.user.username);
        }
      });

      totalFetched += batch.length;

      // Si on a récupéré moins de 1000 membres, on a atteint la fin
      if (batch.length < 1000) {
        hasMore = false;
      } else {
        // Utiliser l'ID du dernier membre comme cursor pour la pagination
        after = batch[batch.length - 1].user.id;
      }
    }

    console.log(`[Sync Discord Usernames] Récupéré ${totalFetched} membres Discord au total`);

    // Synchroniser les pseudos Discord
    let synced = 0;
    let notFound = 0;
    const errors: string[] = [];

    for (const member of membersWithDiscordId) {
      if (!member.discordId) continue;

      const discordUsername = discordMembersMap.get(member.discordId);
      
      if (!discordUsername) {
        notFound++;
        console.warn(`[Sync Discord Usernames] Membre ${member.twitchLogin} (discordId: ${member.discordId}) non trouvé sur Discord`);
        continue;
      }

      // Mettre à jour uniquement le pseudo Discord si différent
      if (member.discordUsername !== discordUsername) {
        try {
          await updateMemberData(
            member.twitchLogin,
            {
              discordUsername: discordUsername,
            },
            admin.id
          );
          synced++;
          console.log(`[Sync Discord Usernames] ✅ ${member.twitchLogin}: ${member.discordUsername || 'N/A'} → ${discordUsername}`);
        } catch (error) {
          errors.push(`${member.twitchLogin}: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
          console.error(`[Sync Discord Usernames] ❌ Erreur pour ${member.twitchLogin}:`, error);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Synchronisation terminée: ${synced} pseudo(s) Discord mis à jour`,
      synced,
      notFound,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Error syncing Discord usernames:", error);
    return NextResponse.json(
      { error: "Erreur serveur", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}


import { GUILD_ID } from "@/lib/discordRoles";

/**
 * Tous les IDs utilisateurs Discord du serveur TENF (hors bots), via API Bot.
 * Paginé ; peut prendre du temps sur de gros serveurs.
 */
export async function fetchAllGuildMemberDiscordIds(botToken: string): Promise<string[]> {
  const token = botToken.trim();
  if (!token) return [];

  const ids: string[] = [];
  let after: string | undefined;

  for (;;) {
    const url = `https://discord.com/api/v10/guilds/${GUILD_ID}/members?limit=1000${after ? `&after=${after}` : ""}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bot ${token}` },
    });
    if (!res.ok) {
      console.warn("[discordGuildMemberIds] fetch failed", res.status);
      break;
    }
    const batch = (await res.json()) as Array<{ user?: { id?: string; bot?: boolean } }>;
    for (const m of batch) {
      if (m.user?.bot) continue;
      const id = m.user?.id;
      if (id) ids.push(id);
    }
    if (batch.length < 1000) break;
    const last = batch[batch.length - 1]?.user?.id;
    if (!last) break;
    after = last;
  }

  return ids;
}

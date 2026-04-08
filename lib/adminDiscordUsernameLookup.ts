import { supabaseAdmin } from "@/lib/db/supabase";

type MemberDiscordRow = {
  twitch_login: string;
  discord_username: string | null;
  discord_id: string | null;
};

/** Pseudo Discord via API Bot quand la colonne members.discord_username est vide mais discord_id est connu. */
export async function fetchDiscordUsernameByUserId(discordUserId: string): Promise<string | null> {
  const id = String(discordUserId || "").trim();
  if (!id) return null;
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) return null;
  try {
    const r = await fetch(`https://discord.com/api/v10/users/${encodeURIComponent(id)}`, {
      headers: { Authorization: `Bot ${token}` },
      cache: "no-store",
    });
    if (!r.ok) return null;
    const data = (await r.json()) as { username?: string; global_name?: string | null };
    const u = String(data.username || data.global_name || "").trim();
    return u || null;
  } catch {
    return null;
  }
}

/**
 * Map twitch_login (lowercase) -> pseudo Discord pour l’admin (raids, points événements).
 * Combine Supabase members + résolution Bot si besoin.
 */
export async function buildDiscordUsernameByTwitchLoginMap(twitchLogins: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  const unique = [...new Set(twitchLogins.map((l) => String(l || "").toLowerCase()).filter(Boolean))];
  if (unique.length === 0) return out;

  const memberRows: MemberDiscordRow[] = [];
  const chunkSize = 120;
  for (let i = 0; i < unique.length; i += chunkSize) {
    const chunk = unique.slice(i, i + chunkSize);
    const membersRes = await supabaseAdmin
      .from("members")
      .select("twitch_login,discord_username,discord_id")
      .in("twitch_login", chunk);
    if (membersRes.error) {
      console.warn("[adminDiscordUsernameLookup] members chunk error:", membersRes.error.message);
      continue;
    }
    memberRows.push(...((membersRes.data || []) as MemberDiscordRow[]));
  }

  const discordIdsToResolve = new Set<string>();
  for (const row of memberRows) {
    const du = String(row.discord_username || "").trim();
    const did = String(row.discord_id || "").trim();
    if (!du && did) discordIdsToResolve.add(did);
  }
  const usernameByDiscordId = new Map<string, string>();
  await Promise.all(
    [...discordIdsToResolve].map(async (did) => {
      const u = await fetchDiscordUsernameByUserId(did);
      if (u) usernameByDiscordId.set(did, u);
    })
  );

  for (const row of memberRows) {
    const login = String(row.twitch_login || "").toLowerCase();
    let discordUsername = String(row.discord_username || "").trim();
    const did = String(row.discord_id || "").trim();
    if (!discordUsername && did) {
      discordUsername = usernameByDiscordId.get(did) || "";
    }
    if (login && discordUsername) {
      out.set(login, discordUsername);
    }
  }
  return out;
}

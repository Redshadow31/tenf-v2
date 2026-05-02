const DISCORD_API = "https://discord.com/api/v10";

async function createDmChannel(botToken: string, recipientUserId: string): Promise<string | null> {
  const res = await fetch(`${DISCORD_API}/users/@me/channels`, {
    method: "POST",
    headers: {
      Authorization: `Bot ${botToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ recipient_id: recipientUserId }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.warn("[discordBotDm] create DM channel failed", res.status, text.slice(0, 200));
    return null;
  }
  const j = (await res.json()) as { id?: string };
  return typeof j.id === "string" ? j.id : null;
}

export async function sendDiscordDm(botToken: string, recipientUserId: string, content: string): Promise<boolean> {
  const trimmed = recipientUserId.trim();
  if (!trimmed || !content.trim()) return false;
  const channelId = await createDmChannel(botToken, trimmed);
  if (!channelId) return false;
  const payload = { content: content.slice(0, 2000) };
  const res = await fetch(`${DISCORD_API}/channels/${channelId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bot ${botToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.warn("[discordBotDm] send message failed", res.status, text.slice(0, 200));
    return false;
  }
  return true;
}

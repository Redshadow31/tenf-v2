import crypto from "crypto";
import { supabaseAdmin } from "@/lib/db/supabase";

const TABLE_NAME = "linked_twitch_accounts";
const ENCRYPTION_ALGO = "aes-256-gcm";
const TOKEN_REFRESH_SAFETY_MS = 5 * 60 * 1000;

interface EncryptedSecretEnvelope {
  version: 1;
  alg: typeof ENCRYPTION_ALGO;
  iv: string;
  tag: string;
  data: string;
}

export interface LinkedTwitchAccountPublic {
  discordId: string;
  twitchUserId: string;
  twitchLogin: string;
  twitchDisplayName: string | null;
  twitchAvatar: string | null;
  tokenExpiry: string;
  scope: string | null;
  createdAt: string;
  updatedAt: string;
}

interface LinkedTwitchAccountWithTokens extends LinkedTwitchAccountPublic {
  accessToken: string;
  refreshToken: string;
}

function getEncryptionKey(): Buffer | null {
  const secret = process.env.TWITCH_OAUTH_ENCRYPTION_KEY;
  if (!secret) return null;
  return crypto.createHash("sha256").update(secret).digest();
}

function encryptSecret(secretValue: string): string {
  const key = getEncryptionKey();
  if (!key) {
    return secretValue;
  }

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ENCRYPTION_ALGO, key, iv);
  const encrypted = Buffer.concat([cipher.update(secretValue, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  const payload: EncryptedSecretEnvelope = {
    version: 1,
    alg: ENCRYPTION_ALGO,
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
    data: encrypted.toString("base64"),
  };

  return JSON.stringify(payload);
}

function decryptSecret(rawValue: string): string | null {
  if (!rawValue) return null;

  // Backward/fallback: valeur en clair si la cle de chiffrement n'etait pas configuree.
  if (!rawValue.startsWith("{")) {
    return rawValue;
  }

  let payload: Partial<EncryptedSecretEnvelope> | null = null;
  try {
    payload = JSON.parse(rawValue) as Partial<EncryptedSecretEnvelope>;
  } catch {
    return null;
  }

  if (
    !payload ||
    payload.version !== 1 ||
    payload.alg !== ENCRYPTION_ALGO ||
    !payload.iv ||
    !payload.tag ||
    !payload.data
  ) {
    return null;
  }

  const key = getEncryptionKey();
  if (!key) return null;

  try {
    const decipher = crypto.createDecipheriv(
      ENCRYPTION_ALGO,
      key,
      Buffer.from(payload.iv, "base64")
    );
    decipher.setAuthTag(Buffer.from(payload.tag, "base64"));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(payload.data, "base64")),
      decipher.final(),
    ]).toString("utf8");
    return decrypted;
  } catch {
    return null;
  }
}

function mapRowToPublic(row: any): LinkedTwitchAccountPublic {
  return {
    discordId: row.discord_id,
    twitchUserId: row.twitch_user_id,
    twitchLogin: row.twitch_login,
    twitchDisplayName: row.twitch_display_name || null,
    twitchAvatar: row.twitch_avatar || null,
    tokenExpiry: row.token_expiry,
    scope: row.scope || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function upsertLinkedTwitchAccount(input: {
  discordId: string;
  twitchUserId: string;
  twitchLogin: string;
  twitchDisplayName?: string | null;
  twitchAvatar?: string | null;
  accessToken: string;
  refreshToken: string;
  tokenExpiry: Date;
  scope?: string | null;
}): Promise<LinkedTwitchAccountPublic> {
  const row = {
    discord_id: input.discordId,
    twitch_user_id: input.twitchUserId,
    twitch_login: input.twitchLogin.toLowerCase(),
    twitch_display_name: input.twitchDisplayName || null,
    twitch_avatar: input.twitchAvatar || null,
    access_token_encrypted: encryptSecret(input.accessToken),
    refresh_token_encrypted: encryptSecret(input.refreshToken),
    token_expiry: input.tokenExpiry.toISOString(),
    scope: input.scope || null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabaseAdmin
    .from(TABLE_NAME)
    .upsert(row, { onConflict: "discord_id" })
    .select("*")
    .single();

  if (error) throw error;
  return mapRowToPublic(data);
}

export async function getLinkedTwitchAccountByDiscordId(
  discordId: string
): Promise<LinkedTwitchAccountPublic | null> {
  const { data, error } = await supabaseAdmin
    .from(TABLE_NAME)
    .select("*")
    .eq("discord_id", discordId)
    .maybeSingle();

  if (error) {
    throw error;
  }
  if (!data) return null;
  return mapRowToPublic(data);
}

export async function getLinkedTwitchAccountByTwitchUserId(
  twitchUserId: string
): Promise<LinkedTwitchAccountPublic | null> {
  const { data, error } = await supabaseAdmin
    .from(TABLE_NAME)
    .select("*")
    .eq("twitch_user_id", twitchUserId)
    .maybeSingle();

  if (error) {
    throw error;
  }
  if (!data) return null;
  return mapRowToPublic(data);
}

async function getLinkedTwitchAccountWithTokensByDiscordId(
  discordId: string
): Promise<LinkedTwitchAccountWithTokens | null> {
  const { data, error } = await supabaseAdmin
    .from(TABLE_NAME)
    .select("*")
    .eq("discord_id", discordId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const accessToken = decryptSecret(data.access_token_encrypted || "");
  const refreshToken = decryptSecret(data.refresh_token_encrypted || "");
  if (!accessToken || !refreshToken) return null;

  return {
    ...mapRowToPublic(data),
    accessToken,
    refreshToken,
  };
}

export async function deleteLinkedTwitchAccountByDiscordId(discordId: string): Promise<void> {
  const { error } = await supabaseAdmin.from(TABLE_NAME).delete().eq("discord_id", discordId);
  if (error) throw error;
}

async function refreshLinkedTwitchAccessToken(
  linked: LinkedTwitchAccountWithTokens
): Promise<LinkedTwitchAccountWithTokens | null> {
  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  const tokenResponse = await fetch("https://id.twitch.tv/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: linked.refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!tokenResponse.ok) {
    return null;
  }

  const tokenData = await tokenResponse.json();
  const refreshed = await upsertLinkedTwitchAccount({
    discordId: linked.discordId,
    twitchUserId: linked.twitchUserId,
    twitchLogin: linked.twitchLogin,
    twitchDisplayName: linked.twitchDisplayName,
    twitchAvatar: linked.twitchAvatar,
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token || linked.refreshToken,
    tokenExpiry: new Date(Date.now() + Number(tokenData.expires_in || 0) * 1000),
    scope: Array.isArray(tokenData.scope)
      ? tokenData.scope.join(" ")
      : typeof tokenData.scope === "string"
        ? tokenData.scope
        : linked.scope,
  });

  return {
    ...refreshed,
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token || linked.refreshToken,
  };
}

export async function getValidLinkedTwitchAccessToken(
  discordId: string
): Promise<{ accessToken: string; twitchUserId: string } | null> {
  const linked = await getLinkedTwitchAccountWithTokensByDiscordId(discordId);
  if (!linked) return null;

  const expiryMs = new Date(linked.tokenExpiry).getTime();
  if (Number.isNaN(expiryMs)) return null;

  if (expiryMs > Date.now() + TOKEN_REFRESH_SAFETY_MS) {
    return {
      accessToken: linked.accessToken,
      twitchUserId: linked.twitchUserId,
    };
  }

  const refreshed = await refreshLinkedTwitchAccessToken(linked);
  if (!refreshed) return null;

  return {
    accessToken: refreshed.accessToken,
    twitchUserId: refreshed.twitchUserId,
  };
}

// Gestion du stockage des tokens OAuth Twitch pour les membres du staff

import crypto from "crypto";
import { getStore } from "@netlify/blobs";
import fs from "fs";
import path from "path";

export interface TwitchOAuthTokens {
  access_token: string;
  refresh_token: string;
  expires_at: number; // Timestamp en millisecondes
  scope?: string;
}

// Détecte si on est sur Netlify
function isNetlify(): boolean {
  if (process.env.NETLIFY || process.env.NETLIFY_DEV) {
    return true;
  }
  if (process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT) {
    return true;
  }
  if (process.env.NETLIFY_FUNCTIONS_VERSION) {
    return true;
  }
  return false;
}

const STORE_NAME = "tenf-twitch-oauth";
const DATA_DIR = path.join(process.cwd(), "data");
const TOKENS_DIR = path.join(DATA_DIR, "twitch-oauth");
const ENCRYPTION_ALGO = "aes-256-gcm";

interface EncryptedTokenEnvelope {
  version: 1;
  alg: typeof ENCRYPTION_ALGO;
  iv: string;
  tag: string;
  data: string;
}

type StoredTokensPayload = TwitchOAuthTokens | EncryptedTokenEnvelope;

function getEncryptionKey(): Buffer | null {
  const secret = process.env.TWITCH_OAUTH_ENCRYPTION_KEY;
  if (!secret) return null;
  return crypto.createHash("sha256").update(secret).digest();
}

function serializeTokens(tokens: TwitchOAuthTokens): string {
  const key = getEncryptionKey();
  if (!key) {
    return JSON.stringify(tokens);
  }

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ENCRYPTION_ALGO, key, iv);
  const plaintext = JSON.stringify(tokens);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  const payload: EncryptedTokenEnvelope = {
    version: 1,
    alg: ENCRYPTION_ALGO,
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
    data: encrypted.toString("base64"),
  };
  return JSON.stringify(payload);
}

function deserializeTokens(raw: unknown): TwitchOAuthTokens | null {
  if (!raw) return null;
  if (typeof raw === "string") {
    try {
      return deserializeTokens(JSON.parse(raw) as StoredTokensPayload);
    } catch {
      return null;
    }
  }
  if (typeof raw !== "object") return null;

  const candidate = raw as Partial<TwitchOAuthTokens> & Partial<EncryptedTokenEnvelope>;
  if (typeof candidate.access_token === "string" && typeof candidate.refresh_token === "string" && typeof candidate.expires_at === "number") {
    return {
      access_token: candidate.access_token,
      refresh_token: candidate.refresh_token,
      expires_at: candidate.expires_at,
      scope: candidate.scope,
    };
  }

  if (candidate.version !== 1 || candidate.alg !== ENCRYPTION_ALGO || !candidate.iv || !candidate.tag || !candidate.data) {
    return null;
  }

  const key = getEncryptionKey();
  if (!key) {
    return null;
  }

  try {
    const decipher = crypto.createDecipheriv(
      ENCRYPTION_ALGO,
      key,
      Buffer.from(candidate.iv, "base64")
    );
    decipher.setAuthTag(Buffer.from(candidate.tag, "base64"));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(candidate.data, "base64")),
      decipher.final(),
    ]).toString("utf8");
    return deserializeTokens(JSON.parse(decrypted) as StoredTokensPayload);
  } catch {
    return null;
  }
}

/**
 * Sauvegarde les tokens OAuth pour un membre du staff
 */
export async function saveTwitchOAuthTokens(
  staffKey: string,
  tokens: TwitchOAuthTokens
): Promise<void> {
  try {
    const serialized = serializeTokens(tokens);
    if (isNetlify()) {
      const store = getStore(STORE_NAME);
      await store.set(`${staffKey}.json`, serialized);
    } else {
      if (!fs.existsSync(TOKENS_DIR)) {
        fs.mkdirSync(TOKENS_DIR, { recursive: true });
      }
      const filePath = path.join(TOKENS_DIR, `${staffKey}.json`);
      fs.writeFileSync(filePath, serialized, "utf-8");
    }
  } catch (error) {
    console.error(`[TwitchOAuth] Erreur sauvegarde tokens (${staffKey})`);
    throw error;
  }
}

/**
 * Récupère les tokens OAuth pour un membre du staff
 */
export async function getTwitchOAuthTokens(
  staffKey: string
): Promise<TwitchOAuthTokens | null> {
  try {
    if (isNetlify()) {
      const store = getStore(STORE_NAME);
      const data = await store.get(`${staffKey}.json`, { type: "text" }).catch(() => null);
      return deserializeTokens(data);
    } else {
      const filePath = path.join(TOKENS_DIR, `${staffKey}.json`);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, "utf-8");
        return deserializeTokens(content);
      }
      return null;
    }
  } catch (error) {
    console.error(`[TwitchOAuth] Erreur récupération tokens (${staffKey})`);
    return null;
  }
}

/**
 * Supprime les tokens OAuth pour un membre du staff
 */
export async function deleteTwitchOAuthTokens(staffKey: string): Promise<void> {
  try {
    if (isNetlify()) {
      const store = getStore(STORE_NAME);
      await store.delete(`${staffKey}.json`);
    } else {
      const filePath = path.join(TOKENS_DIR, `${staffKey}.json`);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  } catch (error) {
    console.error(`[TwitchOAuth] Erreur suppression tokens (${staffKey})`);
    throw error;
  }
}

/**
 * Vérifie si un token est valide (non expiré)
 */
export function isTokenValid(tokens: TwitchOAuthTokens | null): boolean {
  if (!tokens) return false;
  const now = Date.now();
  // Ajouter une marge de 5 minutes pour éviter les problèmes de timing
  return tokens.expires_at > now + 5 * 60 * 1000;
}

/**
 * Rafraîchit un token OAuth Twitch
 */
export async function refreshTwitchToken(
  staffKey: string,
  refreshToken: string
): Promise<TwitchOAuthTokens | null> {
  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error("[TwitchOAuth] Configuration Twitch manquante");
    return null;
  }

  try {
    const response = await fetch("https://id.twitch.tv/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    if (!response.ok) {
      console.error("[TwitchOAuth] Erreur rafraîchissement token (HTTP non OK)");
      return null;
    }

    const data = await response.json();
    const tokens: TwitchOAuthTokens = {
      access_token: data.access_token,
      refresh_token: data.refresh_token || refreshToken, // Twitch peut ne pas renvoyer le refresh_token
      expires_at: Date.now() + data.expires_in * 1000,
      scope: data.scope,
    };

    await saveTwitchOAuthTokens(staffKey, tokens);
    return tokens;
  } catch (error) {
    console.error("[TwitchOAuth] Erreur rafraîchissement token");
    return null;
  }
}

/**
 * Récupère un token valide, en le rafraîchissant si nécessaire
 */
export async function getValidTwitchToken(
  staffKey: string
): Promise<string | null> {
  let tokens = await getTwitchOAuthTokens(staffKey);
  
  if (!tokens) {
    return null;
  }

  // Si le token est expiré, le rafraîchir
  if (!isTokenValid(tokens)) {
    tokens = await refreshTwitchToken(staffKey, tokens.refresh_token);
    if (!tokens) {
      return null;
    }
  }

  return tokens.access_token;
}


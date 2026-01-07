// Gestion du stockage des tokens OAuth Twitch pour les membres du staff

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

/**
 * Sauvegarde les tokens OAuth pour un membre du staff
 */
export async function saveTwitchOAuthTokens(
  staffKey: string,
  tokens: TwitchOAuthTokens
): Promise<void> {
  try {
    if (isNetlify()) {
      const store = getStore(STORE_NAME);
      await store.set(`${staffKey}.json`, JSON.stringify(tokens, null, 2));
    } else {
      if (!fs.existsSync(TOKENS_DIR)) {
        fs.mkdirSync(TOKENS_DIR, { recursive: true });
      }
      const filePath = path.join(TOKENS_DIR, `${staffKey}.json`);
      fs.writeFileSync(filePath, JSON.stringify(tokens, null, 2), "utf-8");
    }
  } catch (error) {
    console.error(`[TwitchOAuth] Erreur sauvegarde tokens pour ${staffKey}:`, error);
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
      const data = await store.get(`${staffKey}.json`, { type: "json" }).catch(() => null);
      return data as TwitchOAuthTokens | null;
    } else {
      const filePath = path.join(TOKENS_DIR, `${staffKey}.json`);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, "utf-8");
        return JSON.parse(content) as TwitchOAuthTokens;
      }
      return null;
    }
  } catch (error) {
    console.error(`[TwitchOAuth] Erreur récupération tokens pour ${staffKey}:`, error);
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
    console.error(`[TwitchOAuth] Erreur suppression tokens pour ${staffKey}:`, error);
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
      const errorText = await response.text();
      console.error("[TwitchOAuth] Erreur rafraîchissement token:", errorText);
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
    console.error("[TwitchOAuth] Erreur rafraîchissement token:", error);
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
    console.log(`[TwitchOAuth] Token expiré pour ${staffKey}, rafraîchissement...`);
    tokens = await refreshTwitchToken(staffKey, tokens.refresh_token);
    if (!tokens) {
      return null;
    }
  }

  return tokens.access_token;
}


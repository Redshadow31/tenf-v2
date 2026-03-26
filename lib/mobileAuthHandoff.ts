/**
 * Stockage fallback quand Redis (Upstash) n'est pas disponible (dev local).
 * Les codes sont à usage unique et expirent après quelques minutes.
 */
const memoryStore = new Map<string, { jwt: string; expiresAt: number }>();

const DEFAULT_TTL_MS = 120_000;

export function storeHandoffJwt(code: string, jwt: string, ttlMs: number = DEFAULT_TTL_MS): void {
  memoryStore.set(code, { jwt, expiresAt: Date.now() + ttlMs });
  for (const [key, v] of memoryStore) {
    if (v.expiresAt < Date.now()) memoryStore.delete(key);
  }
}

export function consumeHandoffJwt(code: string): string | null {
  const row = memoryStore.get(code);
  memoryStore.delete(code);
  if (!row || row.expiresAt < Date.now()) return null;
  return row.jwt;
}

type TwitchMobilePayload = {
  discordId: string;
  callbackPath: string;
};

const twitchMobileMemory = new Map<string, { payload: TwitchMobilePayload; expiresAt: number }>();

export function storeTwitchMobileState(
  state: string,
  payload: TwitchMobilePayload,
  ttlMs: number = 600_000
): void {
  twitchMobileMemory.set(state, { payload, expiresAt: Date.now() + ttlMs });
  for (const [key, v] of twitchMobileMemory) {
    if (v.expiresAt < Date.now()) twitchMobileMemory.delete(key);
  }
}

export function peekTwitchMobileState(state: string): TwitchMobilePayload | null {
  const row = twitchMobileMemory.get(state);
  if (!row || row.expiresAt < Date.now()) return null;
  return row.payload;
}

export function consumeTwitchMobileState(state: string): TwitchMobilePayload | null {
  const row = twitchMobileMemory.get(state);
  twitchMobileMemory.delete(state);
  if (!row || row.expiresAt < Date.now()) return null;
  return row.payload;
}

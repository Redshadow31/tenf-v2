import { getTwitchUsers, type TwitchUser } from "@/lib/twitch";

type AnyMember = {
  displayName?: string;
  twitchLogin?: string;
  twitchStatus?: {
    isLive?: boolean;
    profileImageUrl?: string;
    profileImageSource?: "twitch_api" | "manual";
    profileImageUpdatedAt?: string;
    profileImageError?: string;
  };
};

function toNonEmptyString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function normalizeTwitchLogin(value?: string | null): string | undefined {
  const normalized = toNonEmptyString(value);
  return normalized ? normalized.toLowerCase() : undefined;
}

export function isUsableTwitchAvatar(url?: string): boolean {
  const normalized = toNonEmptyString(url)?.toLowerCase();
  if (!normalized) return false;
  return (
    !normalized.includes("placehold.co") &&
    !normalized.includes("text=twitch") &&
    !normalized.includes("unavatar.io") &&
    !normalized.includes("user-default-pictures-uv")
  );
}

export function getStoredTwitchAvatar(member: AnyMember): string | undefined {
  return toNonEmptyString(member?.twitchStatus?.profileImageUrl);
}

function buildInitial(value?: string): string {
  const text = toNonEmptyString(value) || "?";
  return text.charAt(0).toUpperCase();
}

export function buildMemberAvatarPlaceholder(member: Pick<AnyMember, "displayName" | "twitchLogin">): string {
  const initial = buildInitial(member.displayName || member.twitchLogin);
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='128' height='128' viewBox='0 0 128 128'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0%' stop-color='%239146ff'/><stop offset='100%' stop-color='%235a32b4'/></linearGradient></defs><rect width='128' height='128' rx='64' fill='url(%23g)'/><text x='50%' y='54%' dominant-baseline='middle' text-anchor='middle' fill='white' font-family='Arial,sans-serif' font-size='52' font-weight='700'>${initial}</text></svg>`;
  return `data:image/svg+xml;utf8,${svg}`;
}

export function buildTwitchAvatarMap(twitchUsers: TwitchUser[]): Map<string, string> {
  return new Map(
    twitchUsers
      .filter((user) => isUsableTwitchAvatar(user.profile_image_url))
      .map((user) => [user.login.toLowerCase(), user.profile_image_url] as const)
  );
}

export function resolveMemberAvatar(member: AnyMember, fetchedAvatar?: string): string {
  if (fetchedAvatar && isUsableTwitchAvatar(fetchedAvatar)) return fetchedAvatar;
  const storedAvatar = getStoredTwitchAvatar(member);
  if (storedAvatar && isUsableTwitchAvatar(storedAvatar)) return storedAvatar;
  return buildMemberAvatarPlaceholder(member);
}

export function extractUniqueTwitchLogins(members: Array<Pick<AnyMember, "twitchLogin">>): string[] {
  return Array.from(
    new Set(
      members
        .map((member) => normalizeTwitchLogin(member.twitchLogin))
        .filter((login): login is string => typeof login === "string")
    )
  );
}

export async function fetchCanonicalTwitchAvatarForLogin(login?: string | null): Promise<string | undefined> {
  const normalizedLogin = normalizeTwitchLogin(login);
  if (!normalizedLogin) return undefined;
  try {
    const users = await getTwitchUsers([normalizedLogin]);
    const fetchedAvatar = users[0]?.profile_image_url;
    return isUsableTwitchAvatar(fetchedAvatar) ? fetchedAvatar : undefined;
  } catch {
    return undefined;
  }
}

export function hydrateTwitchStatusAvatar(
  existingStatus: AnyMember["twitchStatus"] | undefined,
  avatarUrl: string | undefined
): AnyMember["twitchStatus"] | undefined {
  if (!isUsableTwitchAvatar(avatarUrl)) return existingStatus;
  return {
    isLive: typeof existingStatus?.isLive === "boolean" ? existingStatus.isLive : false,
    ...(existingStatus || {}),
    profileImageUrl: avatarUrl,
    profileImageSource: "twitch_api",
    profileImageUpdatedAt: new Date().toISOString(),
    profileImageError: undefined,
  };
}

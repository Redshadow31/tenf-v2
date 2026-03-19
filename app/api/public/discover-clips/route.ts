import { NextRequest, NextResponse } from "next/server";
import { memberRepository } from "@/lib/repositories";
import { getTwitchUsers } from "@/lib/twitch";

type TwitchCredentials = {
  clientId: string;
  clientSecret: string;
};

type TwitchClipApiItem = {
  id: string;
  url: string;
  broadcaster_id: string;
  broadcaster_name: string;
  creator_id: string;
  creator_name: string;
  language: string;
  title: string;
  view_count: number;
  created_at: string;
  thumbnail_url: string;
  duration: number;
  game_id: string;
};

type DiscoverClip = {
  id: string;
  url: string;
  title: string;
  thumbnailUrl: string;
  creatorId: string;
  creatorName: string;
  creatorLogin: string;
  creatorAvatar?: string;
  viewCount: number;
  createdAt: string;
  duration: number;
  language: string;
  style: "fun" | "epic" | "educatif" | "best-of";
  category: "gaming" | "just-chatting" | "irl" | "autre";
  moderationStatus: "approved" | "pending" | "rejected";
  memberRole?: string;
};

const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 24;
const MIN_LIMIT = 6;
const MAX_MEMBER_PER_PAGE = 2;
const BROADCASTER_POOL_SIZE = 18;
const CLIPS_PER_BROADCASTER = 4;
const CACHE_MAX_AGE_SECONDS = 60;
const CACHE_STALE_SECONDS = 120;

const TITLE_STYLE_RULES: Array<{ regex: RegExp; style: DiscoverClip["style"] }> = [
  { regex: /(tuto|guide|tips|astuce|comment)/i, style: "educatif" },
  { regex: /(best|top|highlights|montage|compilation)/i, style: "best-of" },
  { regex: /(epic|insane|clutch|world record|speedrun)/i, style: "epic" },
];

function clampLimit(raw: string | null): number {
  const parsed = Number.parseInt(raw || "", 10);
  if (!Number.isFinite(parsed)) return DEFAULT_LIMIT;
  return Math.min(MAX_LIMIT, Math.max(MIN_LIMIT, parsed));
}

function normalizeSeed(seed: string): number {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash +=
      (hash << 1) +
      (hash << 4) +
      (hash << 7) +
      (hash << 8) +
      (hash << 24);
  }
  return Math.abs(hash >>> 0);
}

function seededSort<T>(items: T[], seedBase: string, extractor: (value: T) => string): T[] {
  return [...items].sort((left, right) => {
    const leftSeed = normalizeSeed(`${seedBase}:${extractor(left)}`);
    const rightSeed = normalizeSeed(`${seedBase}:${extractor(right)}`);
    return leftSeed - rightSeed;
  });
}

function chooseStyle(title: string): DiscoverClip["style"] {
  for (const rule of TITLE_STYLE_RULES) {
    if (rule.regex.test(title)) return rule.style;
  }
  return "fun";
}

function chooseCategory(gameId: string | undefined, title: string): DiscoverClip["category"] {
  if (!gameId) return "autre";
  if (gameId === "509658") return "just-chatting";
  if (/(irl|voyage|travel)/i.test(title)) return "irl";
  return "gaming";
}

function pickByFairness(clips: DiscoverClip[], limit: number, seedBase: string): DiscoverClip[] {
  const perMemberCount = new Map<string, number>();
  const uniqueByMember = new Map<string, DiscoverClip[]>();

  for (const clip of clips) {
    const bucket = uniqueByMember.get(clip.creatorLogin) || [];
    bucket.push(clip);
    uniqueByMember.set(clip.creatorLogin, bucket);
  }

  for (const [member, memberClips] of uniqueByMember.entries()) {
    uniqueByMember.set(
      member,
      seededSort(memberClips, `${seedBase}:member`, (clip) => clip.id).sort(
        (a, b) => a.viewCount - b.viewCount
      )
    );
  }

  const memberOrder = seededSort(
    Array.from(uniqueByMember.keys()),
    `${seedBase}:member-order`,
    (value) => value
  );
  const selected: DiscoverClip[] = [];
  let cursor = 0;

  while (selected.length < limit && memberOrder.length > 0) {
    const member = memberOrder[cursor % memberOrder.length];
    const pool = uniqueByMember.get(member) || [];
    const currentCount = perMemberCount.get(member) || 0;
    const nextClip = pool[currentCount];

    if (nextClip && currentCount < MAX_MEMBER_PER_PAGE) {
      selected.push(nextClip);
      perMemberCount.set(member, currentCount + 1);
    }

    cursor += 1;
    if (cursor > memberOrder.length * MAX_MEMBER_PER_PAGE * 3) {
      break;
    }
  }

  return selected.slice(0, limit);
}

function resolveTwitchCredentials(): TwitchCredentials | null {
  const legacyClientId = process.env.TWITCH_CLIENT_ID?.trim();
  const legacyClientSecret = process.env.TWITCH_CLIENT_SECRET?.trim();
  const appClientId = process.env.TWITCH_APP_CLIENT_ID?.trim();
  const appClientSecret = process.env.TWITCH_APP_CLIENT_SECRET?.trim();

  if (legacyClientId && legacyClientSecret) {
    return { clientId: legacyClientId, clientSecret: legacyClientSecret };
  }
  if (appClientId && appClientSecret) {
    return { clientId: appClientId, clientSecret: appClientSecret };
  }

  const mixedId = legacyClientId || appClientId;
  const mixedSecret = legacyClientSecret || appClientSecret;
  if (mixedId && mixedSecret) {
    return { clientId: mixedId, clientSecret: mixedSecret };
  }
  return null;
}

async function getTwitchAccessToken(credentials: TwitchCredentials): Promise<string | null> {
  try {
    const response = await fetch("https://id.twitch.tv/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: credentials.clientId,
        client_secret: credentials.clientSecret,
        grant_type: "client_credentials",
      }),
    });

    if (!response.ok) {
      return null;
    }

    const payload = await response.json();
    return typeof payload?.access_token === "string" ? payload.access_token : null;
  } catch {
    return null;
  }
}

async function fetchClipsForBroadcaster(
  broadcasterId: string,
  credentials: TwitchCredentials,
  accessToken: string
): Promise<TwitchClipApiItem[]> {
  try {
    const response = await fetch(
      `https://api.twitch.tv/helix/clips?broadcaster_id=${encodeURIComponent(
        broadcasterId
      )}&first=${CLIPS_PER_BROADCASTER}`,
      {
        headers: {
          "Client-ID": credentials.clientId,
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) return [];
    const payload = await response.json();
    if (!Array.isArray(payload?.data)) return [];
    return payload.data as TwitchClipApiItem[];
  } catch {
    return [];
  }
}

function isDiscoverEnabled(member: Record<string, unknown>): boolean {
  const legacyFlags = [
    member.discoverEnabled,
    member.discoverPublicEnabled,
    member.discover_enabled,
  ];
  for (const value of legacyFlags) {
    if (typeof value === "boolean") return value;
  }

  // Tant que le toggle admin n'est pas branché, on garde une expérience fonctionnelle.
  return true;
}

export async function GET(request: NextRequest) {
  const limit = clampLimit(request.nextUrl.searchParams.get("limit"));
  const refreshSeed = request.nextUrl.searchParams.get("seed") || "";
  const minuteBucket = Math.floor(Date.now() / 60_000);
  const seedBase = `discover:${minuteBucket}:${refreshSeed}`;

  try {
    const credentials = resolveTwitchCredentials();
    if (!credentials) {
      return NextResponse.json(
        { clips: [], total: 0, error: "TWITCH_CREDENTIALS_MISSING" },
        { status: 200 }
      );
    }

    const accessToken = await getTwitchAccessToken(credentials);
    if (!accessToken) {
      return NextResponse.json(
        { clips: [], total: 0, error: "TWITCH_TOKEN_UNAVAILABLE" },
        { status: 200 }
      );
    }

    const activeMembers = await memberRepository.findActive(1000, 0);
    const eligibleMembers = activeMembers.filter((member) => {
      if (member.profileValidationStatus !== "valide") return false;
      return isDiscoverEnabled(member as unknown as Record<string, unknown>);
    });

    const eligibleLogins = eligibleMembers
      .map((member) => member.twitchLogin?.toLowerCase())
      .filter((login): login is string => Boolean(login));

    if (eligibleLogins.length === 0) {
      const emptyResponse = NextResponse.json({ clips: [], total: 0 });
      emptyResponse.headers.set(
        "Cache-Control",
        `public, max-age=${CACHE_MAX_AGE_SECONDS}, stale-while-revalidate=${CACHE_STALE_SECONDS}`
      );
      return emptyResponse;
    }

    const candidateLogins = seededSort(eligibleLogins, `${seedBase}:logins`, (value) => value).slice(
      0,
      Math.max(BROADCASTER_POOL_SIZE, limit)
    );
    const twitchUsers = await getTwitchUsers(candidateLogins);
    const usersByLogin = new Map(twitchUsers.map((user) => [user.login.toLowerCase(), user]));

    const broadcasterIds = candidateLogins
      .map((login) => usersByLogin.get(login)?.id)
      .filter((id): id is string => Boolean(id));

    const rawClipsNested = await Promise.all(
      broadcasterIds.map((broadcasterId) =>
        fetchClipsForBroadcaster(broadcasterId, credentials, accessToken)
      )
    );
    const rawClips = rawClipsNested.flat();

    const memberByLogin = new Map(
      eligibleMembers.map((member) => [member.twitchLogin.toLowerCase(), member])
    );

    const discoverClips: DiscoverClip[] = rawClips
      .map((clip) => {
        const creatorLogin = clip.broadcaster_name?.toLowerCase() || "";
        const creatorProfile = usersByLogin.get(creatorLogin);
        const member = memberByLogin.get(creatorLogin);

        return {
          id: clip.id,
          url: clip.url,
          title: clip.title || "Clip Twitch",
          thumbnailUrl: clip.thumbnail_url,
          creatorId: clip.creator_id,
          creatorName: clip.broadcaster_name || creatorProfile?.display_name || creatorLogin,
          creatorLogin,
          creatorAvatar: creatorProfile?.profile_image_url,
          viewCount: clip.view_count || 0,
          createdAt: clip.created_at,
          duration: Math.max(0, Math.round(clip.duration || 0)),
          language: clip.language || "other",
          style: chooseStyle(clip.title || ""),
          category: chooseCategory(clip.game_id, clip.title || ""),
          moderationStatus: "approved",
          memberRole: member?.role,
        } satisfies DiscoverClip;
      })
      .filter((clip) => clip.id && clip.url && clip.thumbnailUrl && clip.creatorLogin);

    const uniqueById = new Map<string, DiscoverClip>();
    for (const clip of discoverClips) {
      if (!uniqueById.has(clip.id)) {
        uniqueById.set(clip.id, clip);
      }
    }

    const fairSelection = pickByFairness(Array.from(uniqueById.values()), limit, seedBase);

    const response = NextResponse.json({
      clips: fairSelection,
      total: fairSelection.length,
      generatedAt: new Date().toISOString(),
      meta: {
        eligibleMembers: eligibleLogins.length,
        sampledBroadcasters: broadcasterIds.length,
      },
    });

    response.headers.set(
      "Cache-Control",
      `public, max-age=${CACHE_MAX_AGE_SECONDS}, stale-while-revalidate=${CACHE_STALE_SECONDS}`
    );

    return response;
  } catch (error) {
    console.error("[Public Discover Clips] unexpected error:", error);
    const response = NextResponse.json({ clips: [], total: 0, error: "INTERNAL_ERROR" }, { status: 200 });
    response.headers.set(
      "Cache-Control",
      `public, max-age=${CACHE_MAX_AGE_SECONDS}, stale-while-revalidate=${CACHE_STALE_SECONDS}`
    );
    return response;
  }
}

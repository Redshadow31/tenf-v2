import { NextResponse } from "next/server";
import { requireUser } from "@/lib/requireUser";
import { memberRepository } from "@/lib/repositories";
import {
  getLinkedTwitchAccountByDiscordId,
  getValidLinkedTwitchAccessToken,
} from "@/lib/twitchLinkedAccount";
import { isExcludedFromMemberDiscover } from "@/lib/memberRoles";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type FollowState = "followed" | "not_followed" | "unknown";

type FollowStatusEntry = {
  twitchLogin: string;
  twitchId: string | null;
  state: FollowState;
  visual: "coeur_plein" | "coeur_vide" | "point_interrogation";
};

type TwitchFollowedChannel = {
  broadcaster_id: string;
  broadcaster_login: string;
};

type TwitchFollowedChannelsResponse = {
  data?: TwitchFollowedChannel[];
  pagination?: {
    cursor?: string;
  };
};

const MAX_ACTIVE_MEMBERS_PAGES = 10;
const ACTIVE_MEMBERS_PAGE_SIZE = 1000;
const MAX_TWITCH_PAGINATION_PAGES = 30;
const TWITCH_PAGE_SIZE = 100;

function stateToVisual(state: FollowState): FollowStatusEntry["visual"] {
  if (state === "followed") return "coeur_plein";
  if (state === "not_followed") return "coeur_vide";
  return "point_interrogation";
}

async function listVisibleMembers(): Promise<
  Array<{ twitchLogin: string; twitchId: string | null }>
> {
  const members: Array<{ twitchLogin: string; twitchId: string | null }> = [];

  for (let page = 0; page < MAX_ACTIVE_MEMBERS_PAGES; page++) {
    const offset = page * ACTIVE_MEMBERS_PAGE_SIZE;
    const chunk = await memberRepository.findActive(ACTIVE_MEMBERS_PAGE_SIZE, offset);
    if (!Array.isArray(chunk) || chunk.length === 0) break;

    for (const member of chunk) {
      // Aligner la population avec /membres : membres actifs + profil valide.
      if (member.profileValidationStatus !== "valide") continue;
      if (isExcludedFromMemberDiscover(member.role)) continue;
      if (!member.twitchLogin) continue;
      members.push({
        twitchLogin: String(member.twitchLogin).toLowerCase(),
        twitchId: member.twitchId ? String(member.twitchId) : null,
      });
    }

    if (chunk.length < ACTIVE_MEMBERS_PAGE_SIZE) break;
  }

  return members;
}

async function fetchAllFollowedChannels(
  accessToken: string,
  twitchUserId: string
): Promise<{ ids: Set<string>; logins: Set<string> }> {
  const clientId = process.env.TWITCH_CLIENT_ID;
  if (!clientId) {
    throw new Error("TWITCH_CLIENT_ID non configure");
  }

  const ids = new Set<string>();
  const logins = new Set<string>();
  let cursor: string | null = null;

  for (let page = 0; page < MAX_TWITCH_PAGINATION_PAGES; page++) {
    const url = new URL("https://api.twitch.tv/helix/channels/followed");
    url.searchParams.set("user_id", twitchUserId);
    url.searchParams.set("first", String(TWITCH_PAGE_SIZE));
    if (cursor) {
      url.searchParams.set("after", cursor);
    }

    const response = await fetch(url.toString(), {
      headers: {
        "Client-Id": clientId,
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const details = await response.text().catch(() => "");
      throw new Error(`Twitch API channels/followed HTTP ${response.status} ${details}`);
    }

    const body = (await response.json()) as TwitchFollowedChannelsResponse;
    const followed = Array.isArray(body.data) ? body.data : [];
    for (const channel of followed) {
      if (channel.broadcaster_id) ids.add(String(channel.broadcaster_id));
      if (channel.broadcaster_login) logins.add(String(channel.broadcaster_login).toLowerCase());
    }

    const nextCursor = body.pagination?.cursor;
    if (!nextCursor) break;
    cursor = nextCursor;
  }

  return { ids, logins };
}

function buildUnknownStatuses(
  members: Array<{ twitchLogin: string; twitchId: string | null }>
): Record<string, FollowStatusEntry> {
  const statuses: Record<string, FollowStatusEntry> = {};
  for (const member of members) {
    statuses[member.twitchLogin] = {
      twitchLogin: member.twitchLogin,
      twitchId: member.twitchId,
      state: "unknown",
      visual: stateToVisual("unknown"),
    };
  }
  return statuses;
}

export async function GET() {
  try {
    const user = await requireUser();
    if (!user?.discordId) {
      return NextResponse.json(
        { error: "Connexion requise", authenticated: false },
        { status: 401 }
      );
    }

    const members = await listVisibleMembers();
    const fallbackUnknown = buildUnknownStatuses(members);
    const linked = await getLinkedTwitchAccountByDiscordId(user.discordId);

    if (!linked) {
      return NextResponse.json({
        authenticated: true,
        linked: false,
        reason: "not_linked",
        statuses: fallbackUnknown,
      });
    }

    const validToken = await getValidLinkedTwitchAccessToken(user.discordId);
    if (!validToken?.accessToken) {
      return NextResponse.json({
        authenticated: true,
        linked: true,
        reason: "token_unavailable",
        statuses: fallbackUnknown,
      });
    }

    let followedSets: { ids: Set<string>; logins: Set<string> };
    try {
      followedSets = await fetchAllFollowedChannels(
        validToken.accessToken,
        validToken.twitchUserId
      );
    } catch (error) {
      console.error("[Follow Status] Erreur Twitch API:", error);
      return NextResponse.json({
        authenticated: true,
        linked: true,
        reason: "twitch_api_error",
        statuses: fallbackUnknown,
      });
    }

    const statuses: Record<string, FollowStatusEntry> = {};
    for (const member of members) {
      let state: FollowState = "unknown";
      const isViewerOwnChannel =
        (Boolean(linked.twitchUserId) && Boolean(member.twitchId) && member.twitchId === linked.twitchUserId) ||
        (Boolean(linked.twitchLogin) && member.twitchLogin === linked.twitchLogin.toLowerCase());

      if (isViewerOwnChannel) {
        // Produit: la propre chaine du viewer doit toujours apparaitre comme deja suivie/liee.
        state = "followed";
      } else if (member.twitchId) {
        state = followedSets.ids.has(member.twitchId) ? "followed" : "not_followed";
      } else if (member.twitchLogin) {
        state = followedSets.logins.has(member.twitchLogin) ? "followed" : "not_followed";
      }

      statuses[member.twitchLogin] = {
        twitchLogin: member.twitchLogin,
        twitchId: member.twitchId,
        state,
        visual: stateToVisual(state),
      };
    }

    return NextResponse.json({
      authenticated: true,
      linked: true,
      reason: "ok",
      statuses,
      legend: {
        followed: "coeur_plein",
        not_followed: "coeur_vide",
        unknown: "point_interrogation",
      },
    });
  } catch (error) {
    console.error("[Follow Status] Erreur:", error);
    return NextResponse.json(
      { error: "Erreur interne" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { requireUser } from "@/lib/requireUser";
import { getLinkedTwitchAccountByDiscordId } from "@/lib/twitchLinkedAccount";

export async function GET() {
  try {
    const user = await requireUser();
    if (!user?.discordId) {
      return NextResponse.json(
        { connected: false, authenticated: false },
        { status: 401 }
      );
    }

    const linked = await getLinkedTwitchAccountByDiscordId(user.discordId);
    if (!linked) {
      return NextResponse.json({
        connected: false,
        authenticated: true,
      });
    }

    return NextResponse.json({
      connected: true,
      authenticated: true,
      twitch: {
        userId: linked.twitchUserId,
        login: linked.twitchLogin,
        displayName: linked.twitchDisplayName,
        avatar: linked.twitchAvatar,
      },
      expiresAt: linked.tokenExpiry,
      scope: linked.scope,
    });
  } catch (error) {
    console.error("[Twitch Link Status] Erreur:", error);
    return NextResponse.json(
      { error: "Erreur interne" },
      { status: 500 }
    );
  }
}

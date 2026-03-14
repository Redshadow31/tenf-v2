import { NextResponse } from "next/server";
import { requireUser } from "@/lib/requireUser";
import { deleteLinkedTwitchAccountByDiscordId } from "@/lib/twitchLinkedAccount";

export async function POST() {
  try {
    const user = await requireUser();
    if (!user?.discordId) {
      return NextResponse.json(
        { error: "Non authentifie" },
        { status: 401 }
      );
    }

    await deleteLinkedTwitchAccountByDiscordId(user.discordId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Twitch Link Disconnect] Erreur:", error);
    return NextResponse.json(
      { error: "Erreur interne" },
      { status: 500 }
    );
  }
}

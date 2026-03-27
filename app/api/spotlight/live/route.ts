import { NextResponse } from "next/server";
import { spotlightRepository } from "@/lib/repositories";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET - Retourne le spotlight en cours (public).
 * Utilisé par la page /lives pour afficher la mise en avant programmée.
 */
export async function GET() {
  try {
    const all = await spotlightRepository.findAll(100, 0);
    const now = new Date();

    // Auto-clôture des spotlights expirés pour éviter tout affichage persistant.
    const expiredActive = all.filter(
      (spotlight) =>
        spotlight.status === "active" &&
        !!spotlight.endsAt &&
        spotlight.endsAt.getTime() < now.getTime()
    );
    if (expiredActive.length > 0) {
      await Promise.allSettled(
        expiredActive.map((spotlight) =>
          spotlightRepository.update(spotlight.id, { status: "completed" })
        )
      );
    }

    const activeSpotlights = all
      .filter(
        (spotlight) =>
          spotlight.status === "active" &&
          !!spotlight.endsAt &&
          spotlight.startedAt <= now &&
          spotlight.endsAt >= now
      )
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());

    const current = activeSpotlights[0] || null;

    if (!current) {
      return NextResponse.json({ spotlight: null });
    }

    return NextResponse.json({
      spotlight: {
        id: current.id,
        streamerTwitchLogin: current.streamerTwitchLogin,
        streamerDisplayName:
          current.streamerDisplayName || current.streamerTwitchLogin,
        startedAt: current.startedAt.toISOString(),
        endsAt: current.endsAt?.toISOString(),
        text:
          "Tu fais du super boulot, la communaute est derriere toi. Cote viewers, venez comme vous etes: un bonjour, un follow ou quelques minutes de soutien comptent enormement.",
      },
    });
  } catch (error) {
    console.error("[Spotlight Live API] Erreur GET:", error);
    return NextResponse.json({ spotlight: null }, { status: 200 });
  }
}

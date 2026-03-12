import { NextResponse } from "next/server";
import { spotlightRepository } from "@/lib/repositories";

/**
 * GET - Retourne le spotlight en cours (public).
 * Utilisé par la page /lives pour afficher la mise en avant programmée.
 */
export async function GET() {
  try {
    const all = await spotlightRepository.findAll(100, 0);
    const now = new Date();
    const nowTs = now.getTime();
    const timezoneToleranceMs = 2 * 60 * 60 * 1000; // Tolérance legacy (timestamp avec/sans timezone).

    const activeSpotlights = all
      .filter((spotlight) => spotlight.status === "active" && !!spotlight.endsAt)
      .sort(
        (a, b) => b.startedAt.getTime() - a.startedAt.getTime()
      );

    const exactCurrent = activeSpotlights.find((spotlight) => {
      if (spotlight.status !== "active" || !spotlight.endsAt) return false;
      return spotlight.startedAt <= now && spotlight.endsAt >= now;
    });

    const tolerantCurrent =
      exactCurrent ||
      activeSpotlights.find((spotlight) => {
        if (!spotlight.endsAt) return false;
        const startTs = spotlight.startedAt.getTime();
        const endTs = spotlight.endsAt.getTime();
        return (
          nowTs >= startTs - timezoneToleranceMs &&
          nowTs <= endTs + timezoneToleranceMs
        );
      });

    const current = tolerantCurrent;

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
          "Ce streamer est mis en avant par TENF aujourd'hui. Passe lui dire bonjour, reste quelques minutes et envoie de la force au chat !",
      },
    });
  } catch (error) {
    console.error("[Spotlight Live API] Erreur GET:", error);
    return NextResponse.json({ spotlight: null }, { status: 200 });
  }
}

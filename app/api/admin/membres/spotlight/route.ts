import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, requirePermission } from "@/lib/requireAdmin";
import { memberRepository, spotlightRepository } from "@/lib/repositories";

function overlaps(
  startA: Date,
  endA: Date,
  startB: Date,
  endB: Date
): boolean {
  return startA < endB && startB < endA;
}

/**
 * GET - Liste les spotlights programmés pour l'admin membres.
 */
export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const all = await spotlightRepository.findAll(200, 0);
    const now = new Date();

    const formatted = all.map((spotlight) => {
      const started = spotlight.startedAt <= now;
      const ended = spotlight.endsAt ? spotlight.endsAt < now : false;

      return {
        id: spotlight.id,
        streamerTwitchLogin: spotlight.streamerTwitchLogin,
        streamerDisplayName: spotlight.streamerDisplayName,
        startedAt: spotlight.startedAt.toISOString(),
        endsAt: spotlight.endsAt?.toISOString(),
        status: spotlight.status,
        moderatorUsername: spotlight.moderatorUsername,
        createdAt: spotlight.createdAt.toISOString(),
        hasStarted: started,
        hasEnded: ended,
      };
    });

    return NextResponse.json({ spotlights: formatted });
  } catch (error) {
    console.error("[Admin Membres Spotlight API] Erreur GET:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/**
 * POST - Programme un spotlight.
 * Body:
 * {
 *   streamerTwitchLogin: string,
 *   streamerDisplayName?: string,
 *   startedAt: string (ISO),
 *   endsAt: string (ISO)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await requirePermission("write");
    if (!admin) {
      return NextResponse.json(
        { error: "Non authentifié ou permissions insuffisantes" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { streamerTwitchLogin, streamerDisplayName, startedAt, endsAt } = body;

    if (!streamerTwitchLogin || !startedAt || !endsAt) {
      return NextResponse.json(
        { error: "streamerTwitchLogin, startedAt et endsAt sont requis" },
        { status: 400 }
      );
    }

    const startDate = new Date(startedAt);
    const endDate = new Date(endsAt);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return NextResponse.json({ error: "Dates invalides" }, { status: 400 });
    }

    if (endDate <= startDate) {
      return NextResponse.json(
        { error: "La fin doit être après le début" },
        { status: 400 }
      );
    }

    const login = String(streamerTwitchLogin).trim().toLowerCase();
    const member = await memberRepository.findByTwitchLogin(login);
    const displayName =
      member?.displayName || streamerDisplayName || streamerTwitchLogin;

    // Empêcher les chevauchements avec d'autres spotlights actifs.
    const all = await spotlightRepository.findAll(200, 0);
    const overlapping = all.find((s) => {
      if (s.status !== "active" || !s.endsAt) return false;
      return overlaps(startDate, endDate, s.startedAt, s.endsAt);
    });

    if (overlapping) {
      return NextResponse.json(
        {
          error:
            "Ce créneau chevauche un autre spotlight actif. Ajustez les horaires.",
        },
        { status: 409 }
      );
    }

    const created = await spotlightRepository.create({
      streamerTwitchLogin: login,
      streamerDisplayName: displayName,
      startedAt: startDate,
      endsAt: endDate,
      status: "active",
      moderatorDiscordId: admin.discordId,
      moderatorUsername: admin.username,
      createdAt: new Date(),
      createdBy: admin.discordId,
    });

    return NextResponse.json({
      spotlight: {
        id: created.id,
        streamerTwitchLogin: created.streamerTwitchLogin,
        streamerDisplayName: created.streamerDisplayName,
        startedAt: created.startedAt.toISOString(),
        endsAt: created.endsAt?.toISOString(),
        status: created.status,
      },
    });
  } catch (error) {
    console.error("[Admin Membres Spotlight API] Erreur POST:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/**
 * PATCH - Met à jour un spotlight (annuler / réactiver / compléter).
 * Body: { id: string, status: "active" | "cancelled" | "completed" }
 */
export async function PATCH(request: NextRequest) {
  try {
    const admin = await requirePermission("write");
    if (!admin) {
      return NextResponse.json(
        { error: "Non authentifié ou permissions insuffisantes" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, status } = body;

    if (!id || !status || !["active", "cancelled", "completed"].includes(status)) {
      return NextResponse.json(
        { error: "id et status valide sont requis" },
        { status: 400 }
      );
    }

    const updated = await spotlightRepository.update(id, { status });

    return NextResponse.json({
      spotlight: {
        id: updated.id,
        status: updated.status,
        startedAt: updated.startedAt.toISOString(),
        endsAt: updated.endsAt?.toISOString(),
      },
    });
  } catch (error) {
    console.error("[Admin Membres Spotlight API] Erreur PATCH:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

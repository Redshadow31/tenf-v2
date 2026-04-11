import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import {
  CHARTER_VERSION,
  getLatestModerationCharterValidationForMember,
  listModerationCharterValidations,
  recordModerationCharterValidation,
} from "@/lib/moderationCharterValidationsStorage";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const admin = await requireAdmin({ bypassModerationCharterGate: true });
  if (!admin) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const entries = await listModerationCharterValidations();
  const feedbackCount = entries.filter((entry) => String(entry.feedback || "").trim().length > 0).length;
  const uniqueValidatedMembers = new Set(entries.map((entry) => entry.validatedMemberDiscordId)).size;
  const viewerValidation = await getLatestModerationCharterValidationForMember(admin.discordId);

  return NextResponse.json({
    success: true,
    charterVersion: CHARTER_VERSION,
    entries,
    stats: {
      totalValidations: entries.length,
      uniqueValidatedMembers,
      feedbackCount,
    },
    viewerValidation,
  });
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin({ bypassModerationCharterGate: true });
  if (!admin) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const feedback = typeof body?.feedback === "string" ? body.feedback : "";
    const version =
      typeof body?.charterVersion === "string" && body.charterVersion.trim().length > 0
        ? body.charterVersion.trim()
        : CHARTER_VERSION;

    const entry = await recordModerationCharterValidation({
      validatedMemberDiscordId: admin.discordId,
      validatedMemberUsername: admin.username,
      charterVersion: version,
      feedback,
      validatedByDiscordId: admin.discordId,
      validatedByUsername: admin.username,
    });

    return NextResponse.json({ success: true, entry });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN";
    if (message === "INVALID_VALIDATION_PAYLOAD") {
      return NextResponse.json({ error: "Payload de validation invalide." }, { status: 400 });
    }
    console.error("[Admin Moderation Charter Validations] POST error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/requireUser";
import {
  cancelStaffApplicationCandidate,
  loadStaffApplicationsByApplicant,
  updateStaffApplicationCandidate,
} from "@/lib/staffApplicationsStorage";
import type { StaffApplicationAnswers } from "@/lib/staffApplicationsStorage";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const user = await requireUser();
    if (!user?.discordId) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const applications = await loadStaffApplicationsByApplicant(user.discordId);
    return NextResponse.json({ applications });
  } catch (error) {
    console.error("[StaffApplications me] GET error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireUser();
    if (!user?.discordId) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const body = await request.json();
    const id = typeof body?.id === "string" ? body.id : "";
    const answers = body?.answers as StaffApplicationAnswers | undefined;

    if (!id || !answers) {
      return NextResponse.json({ error: "Parametres invalides" }, { status: 400 });
    }

    const updated = await updateStaffApplicationCandidate({
      id,
      applicant_discord_id: user.discordId,
      applicant_username: user.username,
      applicant_avatar: user.avatar,
      answers,
    });

    if (!updated) {
      return NextResponse.json(
        { error: "Candidature introuvable ou verrouillee" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, application: updated });
  } catch (error) {
    console.error("[StaffApplications me] PATCH error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireUser();
    if (!user?.discordId) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const id = typeof body?.id === "string" ? body.id : "";
    if (!id) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 });
    }

    const cancelled = await cancelStaffApplicationCandidate({
      id,
      applicant_discord_id: user.discordId,
    });
    if (!cancelled) {
      return NextResponse.json(
        { error: "Candidature introuvable ou non annulable" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, application: cancelled });
  } catch (error) {
    console.error("[StaffApplications me] DELETE error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

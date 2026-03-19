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

const FINAL_DECISION_PREFIX = "__TENF_FINAL_DECISION__";

type MemberFinalDecision = {
  at: string;
  author: string;
  outcome: "soutien_tenf" | "moderateur_formation" | "candidature_refusee";
  memberMessage: string;
};

function extractMemberFinalDecision(adminNotes: string[] | undefined): MemberFinalDecision | null {
  const notes = Array.isArray(adminNotes) ? adminNotes : [];
  const decisions: MemberFinalDecision[] = [];

  for (const raw of notes) {
    if (!raw.startsWith(FINAL_DECISION_PREFIX)) continue;
    try {
      const parsed = JSON.parse(raw.slice(FINAL_DECISION_PREFIX.length)) as any;
      if (
        parsed &&
        typeof parsed.at === "string" &&
        typeof parsed.author === "string" &&
        typeof parsed.memberMessage === "string" &&
        ["soutien_tenf", "moderateur_formation", "candidature_refusee"].includes(parsed.outcome)
      ) {
        decisions.push({
          at: parsed.at,
          author: parsed.author,
          outcome: parsed.outcome,
          memberMessage: parsed.memberMessage,
        });
      }
    } catch {
      // Ignore malformed entries
    }
  }

  if (decisions.length === 0) return null;
  decisions.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  return decisions[0];
}

function toSafeMemberApplication(item: any) {
  return {
    id: item.id,
    created_at: item.created_at,
    updated_at: item.updated_at,
    applicant_discord_id: item.applicant_discord_id,
    applicant_username: item.applicant_username,
    answers: item.answers,
    admin_status: item.admin_status,
    member_final_decision: extractMemberFinalDecision(item.admin_notes),
  };
}

export async function GET() {
  try {
    const user = await requireUser();
    if (!user?.discordId) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const applications = await loadStaffApplicationsByApplicant(user.discordId);
    const safeApplications = applications.map((item: any) => toSafeMemberApplication(item));
    return NextResponse.json({ applications: safeApplications });
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

    return NextResponse.json({ success: true, application: toSafeMemberApplication(updated) });
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

    return NextResponse.json({ success: true, application: toSafeMemberApplication(cancelled) });
  } catch (error) {
    console.error("[StaffApplications me] DELETE error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

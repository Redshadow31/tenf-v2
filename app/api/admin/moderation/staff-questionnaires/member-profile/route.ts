import { NextRequest, NextResponse } from "next/server";
import { isNextResponse, requireQuestionnaireAdminAuth } from "@/lib/staff-questionnaire/api-auth";
import { fetchStaffPilotProfile } from "@/lib/staff-questionnaire/staffMemberPilotProfile";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireQuestionnaireAdminAuth();
  if (isNextResponse(auth)) return auth;

  const memberId = request.nextUrl.searchParams.get("memberId")?.trim();
  if (!memberId) {
    return NextResponse.json({ error: "memberId requis" }, { status: 400 });
  }

  try {
    const profile = await fetchStaffPilotProfile(memberId);
    if (!profile) {
      return NextResponse.json({ error: "Membre introuvable" }, { status: 404 });
    }
    return NextResponse.json({ profile });
  } catch (error) {
    console.error("[staff-questionnaires/member-profile GET]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

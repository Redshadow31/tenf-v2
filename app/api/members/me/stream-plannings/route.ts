import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { memberRepository } from "@/lib/repositories";
import {
  createMemberStreamPlanning,
  deleteMemberStreamPlanning,
  getMemberStreamPlanningsByUser,
} from "@/lib/memberPlanningStorage";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function isValidDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isValidTime(value: string): boolean {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);
}

async function getAuthenticatedMember() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.discordId) return null;
  const member = await memberRepository.findByDiscordId(session.user.discordId);
  if (!member) return null;
  return { member, discordId: session.user.discordId };
}

export async function GET() {
  try {
    const auth = await getAuthenticatedMember();
    if (!auth) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const plannings = await getMemberStreamPlanningsByUser(auth.discordId);
    return NextResponse.json({ plannings });
  } catch (error) {
    console.error("[members/me/stream-plannings] GET error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedMember();
    if (!auth) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const date = String(body?.date || "").trim();
    const time = String(body?.time || "").trim();
    const liveType = String(body?.liveType || "").trim();
    const title = String(body?.title || "").trim();

    if (!date || !time || !liveType) {
      return NextResponse.json(
        { error: "Les champs date, horaire et jeu/type de live sont requis." },
        { status: 400 }
      );
    }

    if (!isValidDate(date) || !isValidTime(time)) {
      return NextResponse.json(
        { error: "Format invalide pour la date ou l'horaire." },
        { status: 400 }
      );
    }

    if (liveType.length > 80 || title.length > 120) {
      return NextResponse.json(
        { error: "Le type de live ou le titre est trop long." },
        { status: 400 }
      );
    }

    const planning = await createMemberStreamPlanning({
      userId: auth.discordId,
      twitchLogin: auth.member.twitchLogin,
      date,
      time,
      liveType,
      title: title || undefined,
    });

    return NextResponse.json({ success: true, planning });
  } catch (error) {
    console.error("[members/me/stream-plannings] POST error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await getAuthenticatedMember();
    if (!auth) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const planningId = String(searchParams.get("planningId") || "").trim();

    if (!planningId) {
      return NextResponse.json({ error: "planningId est requis" }, { status: 400 });
    }

    const deleted = await deleteMemberStreamPlanning(planningId, auth.discordId);
    if (!deleted) {
      return NextResponse.json({ error: "Planning introuvable" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[members/me/stream-plannings] DELETE error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}


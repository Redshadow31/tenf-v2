import { NextRequest, NextResponse } from "next/server";
import {
  addAventuraInterestResponse,
  listAventuraInterestResponses,
  type AventuraProfileType,
  type AventuraQuickResponse,
} from "@/lib/newFamilyAventuraStorage";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const ALLOWED_QUICK: AventuraQuickResponse[] = [
  "interested",
  "more_info",
  "maybe",
  "not_for_me",
];
const ALLOWED_PROFILE: AventuraProfileType[] = ["createur", "membre", "autre"];

export async function GET() {
  try {
    const responses = await listAventuraInterestResponses();
    return NextResponse.json({ responses });
  } catch (error) {
    console.error("[api/new-family-aventura/interest] GET error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const pseudo = String(body?.pseudo || "").trim();
    const quickResponse = String(body?.quick_response || "").trim() as AventuraQuickResponse;
    const profileType = String(body?.profile_type || "").trim() as AventuraProfileType;

    if (!pseudo || !ALLOWED_QUICK.includes(quickResponse) || !ALLOWED_PROFILE.includes(profileType)) {
      return NextResponse.json(
        { error: "Données invalides. Vérifie pseudo, type de profil et réponse rapide." },
        { status: 400 }
      );
    }

    const response = await addAventuraInterestResponse({
      pseudo,
      contact: body?.contact,
      profile_type: profileType,
      quick_response: quickResponse,
      interest_reason: body?.interest_reason,
      conditions: Array.isArray(body?.conditions) ? body.conditions : [],
      comment: body?.comment,
      source: String(body?.source || "formulaire"),
    });

    return NextResponse.json({
      success: true,
      response,
      message: "Merci, votre réponse a bien été enregistrée.",
    });
  } catch (error) {
    console.error("[api/new-family-aventura/interest] POST error:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de l'enregistrement." },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from "next/server";
import {
  addAventuraInterestResponse,
  listAventuraInterestResponses,
  type AventuraProfileType,
  type AventuraQuickResponse,
} from "@/lib/newFamilyAventuraStorage";
import { requirePrivacyConsent } from "@/lib/legal/privacyConsent";

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
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
    }
    const record = body as Record<string, unknown>;
    const consentCheck = requirePrivacyConsent(record);
    if (!consentCheck.ok) {
      return NextResponse.json({ error: consentCheck.error }, { status: 400 });
    }

    const pseudo = String(record.pseudo || "").trim();
    const quickResponse = String(record.quick_response || "").trim() as AventuraQuickResponse;
    const profileType = String(record.profile_type || "").trim() as AventuraProfileType;

    if (!pseudo || !ALLOWED_QUICK.includes(quickResponse) || !ALLOWED_PROFILE.includes(profileType)) {
      return NextResponse.json(
        { error: "Données invalides. Vérifie pseudo, type de profil et réponse rapide." },
        { status: 400 }
      );
    }

    const response = await addAventuraInterestResponse({
      pseudo,
      contact: record.contact != null ? String(record.contact) : undefined,
      profile_type: profileType,
      quick_response: quickResponse,
      interest_reason:
        record.interest_reason != null ? String(record.interest_reason) : undefined,
      conditions: Array.isArray(record.conditions) ? record.conditions : [],
      comment: record.comment != null ? String(record.comment) : undefined,
      source: String(record.source || "formulaire"),
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


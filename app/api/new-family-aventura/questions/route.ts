import { NextRequest, NextResponse } from "next/server";
import {
  addAventuraQuestion,
  listAventuraQuestions,
  type AventuraQuestionCategory,
} from "@/lib/newFamilyAventuraStorage";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const ALLOWED_CATEGORIES: AventuraQuestionCategory[] = [
  "participation",
  "logement",
  "transport",
  "budget",
  "autre",
];

export async function GET() {
  try {
    const questions = await listAventuraQuestions();
    return NextResponse.json({ questions });
  } catch (error) {
    console.error("[api/new-family-aventura/questions] GET error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const pseudo = String(body?.pseudo || "").trim();
    const category = String(body?.category || "").trim() as AventuraQuestionCategory;
    const question = String(body?.question || "").trim();

    if (!pseudo || !question || !ALLOWED_CATEGORIES.includes(category)) {
      return NextResponse.json(
        { error: "Données invalides. Vérifie pseudo, catégorie et question." },
        { status: 400 },
      );
    }

    const item = await addAventuraQuestion({
      pseudo,
      contact: body?.contact,
      category,
      question,
      source: String(body?.source || "page_questions"),
    });

    return NextResponse.json({
      success: true,
      question: item,
      message: "Question envoyée. Les admins reviendront vers toi rapidement.",
    });
  } catch (error) {
    console.error("[api/new-family-aventura/questions] POST error:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de l'envoi de la question." },
      { status: 500 },
    );
  }
}

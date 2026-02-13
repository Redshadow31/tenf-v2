import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const MAX_MESSAGE_LENGTH = 500;
const MIN_MESSAGE_LENGTH = 10;

/** GET - Liste les avis/soutiens par type */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // 'tenf' | 'nexou'

    if (!type || !["tenf", "nexou"].includes(type)) {
      return NextResponse.json(
        { error: "Paramètre type requis: tenf ou nexou" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("public_reviews")
      .select("id, type, pseudo, message, hearts, created_at")
      .eq("type", type)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[reviews] GET error:", error);
      return NextResponse.json(
        { error: "Erreur lors du chargement" },
        { status: 500 }
      );
    }

    return NextResponse.json({ reviews: data || [] });
  } catch (err) {
    console.error("[reviews] GET:", err);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

/** POST - Crée un nouvel avis ou soutien */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, pseudo, message, hearts } = body;

    if (!type || !["tenf", "nexou"].includes(type)) {
      return NextResponse.json(
        { error: "Type invalide. Utilisez 'tenf' ou 'nexou'" },
        { status: 400 }
      );
    }

    const pseudoTrimmed = (pseudo || "").trim();
    if (!pseudoTrimmed || pseudoTrimmed.length < 2) {
      return NextResponse.json(
        { error: "Le pseudo doit contenir au moins 2 caractères" },
        { status: 400 }
      );
    }

    const messageTrimmed = (message || "").trim();
    if (messageTrimmed.length < MIN_MESSAGE_LENGTH) {
      return NextResponse.json(
        { error: `Le message doit contenir au moins ${MIN_MESSAGE_LENGTH} caractères` },
        { status: 400 }
      );
    }
    if (messageTrimmed.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        { error: `Le message ne doit pas dépasser ${MAX_MESSAGE_LENGTH} caractères` },
        { status: 400 }
      );
    }

    // Hearts obligatoire pour type tenf
    if (type === "tenf") {
      const h = Number(hearts);
      if (!Number.isInteger(h) || h < 1 || h > 5) {
        return NextResponse.json(
          { error: "La note doit être entre 1 et 5 cœurs" },
          { status: 400 }
        );
      }
    }

    const { data, error } = await supabaseAdmin.from("public_reviews").insert({
      type,
      pseudo: pseudoTrimmed,
      message: messageTrimmed,
      hearts: type === "tenf" ? Number(hearts) : null,
    }).select("id, type, pseudo, message, hearts, created_at").single();

    if (error) {
      console.error("[reviews] POST error:", error);
      return NextResponse.json(
        { error: "Erreur lors de l'enregistrement" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, review: data });
  } catch (err) {
    console.error("[reviews] POST:", err);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

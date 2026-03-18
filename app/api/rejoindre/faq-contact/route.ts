import { NextRequest, NextResponse } from "next/server";
import { createFaqContact } from "@/lib/faqContactStorage";

const TOPIC_ALLOWLIST = new Set([
  "integration",
  "roles",
  "points",
  "activite",
  "staff",
  "autre",
]);

function normalizeTopic(topic: unknown): string {
  const value = typeof topic === "string" ? topic.trim().toLowerCase() : "";
  return TOPIC_ALLOWLIST.has(value) ? value : "autre";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Honeypot antispam: doit rester vide côté utilisateur réel.
    if (typeof body?.website === "string" && body.website.trim().length > 0) {
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    const pseudo = typeof body?.pseudo === "string" ? body.pseudo : "";
    const contact = typeof body?.contact === "string" ? body.contact : "";
    const message = typeof body?.message === "string" ? body.message : "";
    const sourcePage = typeof body?.sourcePage === "string" ? body.sourcePage : "/rejoindre/faq";
    const topic = normalizeTopic(body?.topic);

    if (!pseudo.trim() || !contact.trim() || !message.trim()) {
      return NextResponse.json({ error: "Pseudo, contact et message sont obligatoires." }, { status: 400 });
    }

    if (message.trim().length < 20) {
      return NextResponse.json({ error: "Le message doit contenir au moins 20 caractères." }, { status: 400 });
    }

    const saved = await createFaqContact({
      sourcePage,
      pseudo,
      contact,
      topic,
      message,
    });

    return NextResponse.json({
      ok: true,
      id: saved.id,
      message: "Merci. Ton message a bien été transmis à l'équipe TENF.",
    });
  } catch (error) {
    console.error("[rejoindre/faq-contact] POST error:", error);
    return NextResponse.json({ error: "Erreur serveur lors de l'envoi du message." }, { status: 500 });
  }
}


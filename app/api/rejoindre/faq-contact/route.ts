import { NextRequest, NextResponse } from "next/server";
import { createFaqContact } from "@/lib/faqContactStorage";
import { requirePrivacyConsent } from "@/lib/legal/privacyConsent";

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
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
    }
    const record = body as Record<string, unknown>;

    const consentCheck = requirePrivacyConsent(record);
    if (!consentCheck.ok) {
      return NextResponse.json({ error: consentCheck.error }, { status: 400 });
    }

    // Honeypot antispam: doit rester vide côté utilisateur réel.
    if (typeof record.website === "string" && record.website.trim().length > 0) {
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    const pseudo = typeof record.pseudo === "string" ? record.pseudo : "";
    const contact = typeof record.contact === "string" ? record.contact : "";
    const message = typeof record.message === "string" ? record.message : "";
    const sourcePage = typeof record.sourcePage === "string" ? record.sourcePage : "/rejoindre/faq";
    const topic = normalizeTopic(record.topic);

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


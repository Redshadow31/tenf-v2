import { NextRequest, NextResponse } from "next/server";
import { createFaqContact } from "@/lib/faqContactStorage";
import { requirePrivacyConsent } from "@/lib/legal/privacyConsent";
import { checkRateLimit } from "@/lib/security/rateLimit";
import { CONTACT_TOPIC_IDS } from "@/app/contact/topics";

export const dynamic = "force-dynamic";

const ALLOWED_TOPICS = new Set<string>(CONTACT_TOPIC_IDS);

/** Rate-limit anti-bourrage : 5 envois par IP / 15 min. */
const IP_POLICY = {
  name: "public-contact-ip",
  limit: 5,
  windowSeconds: 15 * 60,
} as const;

/** Rate-limit secondaire par pseudo pour éviter qu'un seul abuse via plusieurs IP. */
const IDENTITY_POLICY = {
  name: "public-contact-identity",
  limit: 8,
  windowSeconds: 60 * 60,
} as const;

const MAX_MESSAGE = 2400;
const MIN_MESSAGE = 20;

function normalizeTopic(value: unknown): string {
  const cleaned = typeof value === "string" ? value.trim().toLowerCase() : "";
  return ALLOWED_TOPICS.has(cleaned) ? cleaned : "question_generale";
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

    // Honeypot : si rempli, on simule un succès silencieux (anti-bot).
    if (typeof record.website === "string" && record.website.trim().length > 0) {
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    const pseudo = typeof record.pseudo === "string" ? record.pseudo.trim() : "";
    const contact = typeof record.contact === "string" ? record.contact.trim() : "";
    const message = typeof record.message === "string" ? record.message.trim() : "";
    const topic = normalizeTopic(record.topic);

    if (!pseudo || !contact || !message) {
      return NextResponse.json(
        { error: "Pseudo, contact et message sont obligatoires." },
        { status: 400 }
      );
    }
    if (message.length < MIN_MESSAGE) {
      return NextResponse.json(
        { error: `Le message doit contenir au moins ${MIN_MESSAGE} caractères.` },
        { status: 400 }
      );
    }
    if (message.length > MAX_MESSAGE) {
      return NextResponse.json(
        { error: `Le message ne doit pas dépasser ${MAX_MESSAGE} caractères.` },
        { status: 400 }
      );
    }

    // Rate limit IP
    const ipLimit = await checkRateLimit({ request, policy: IP_POLICY });
    if (!ipLimit.allowed) {
      return NextResponse.json(
        { error: "Trop de tentatives. Réessaie dans quelques minutes." },
        {
          status: 429,
          headers: { "Retry-After": String(ipLimit.retryAfterSeconds) },
        }
      );
    }

    // Rate limit identité (pseudo)
    const identityLimit = await checkRateLimit({
      request,
      policy: IDENTITY_POLICY,
      identity: pseudo.toLowerCase(),
    });
    if (!identityLimit.allowed) {
      return NextResponse.json(
        { error: "Trop de messages envoyés avec ce pseudo. Réessaie plus tard." },
        {
          status: 429,
          headers: { "Retry-After": String(identityLimit.retryAfterSeconds) },
        }
      );
    }

    const saved = await createFaqContact({
      sourcePage: "/contact",
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
    console.error("[contact] POST error:", error);
    return NextResponse.json({ error: "Erreur serveur lors de l'envoi du message." }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import { memberRepository } from "@/lib/repositories";
import { isResendConfigured, sendResendEmail } from "@/lib/email/resendSend";

export const dynamic = "force-dynamic";

/**
 * POST — envoie un e-mail de test à l’adresse staff déjà enregistrée sur la fiche membre.
 */
export async function POST() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  if (!isResendConfigured()) {
    return NextResponse.json(
      { error: "Envoi e-mail non configuré (RESEND_API_KEY manquant côté serveur)." },
      { status: 503 }
    );
  }

  const member = await memberRepository.findByDiscordId(admin.discordId);
  const to = member?.staffNotificationEmail?.trim();
  if (!to) {
    return NextResponse.json(
      { error: "Aucune adresse enregistrée. Renseigne-la puis enregistre avant de tester." },
      { status: 400 }
    );
  }

  const result = await sendResendEmail({
    to,
    subject: "TENF — test de notification staff",
    text: [
      "Bonjour,",
      "",
      "Ceci est un message de test depuis l’espace admin TENF (page Mon compte).",
      "Si tu reçois cet e-mail, la chaîne d’alertes staff est opérationnelle pour ton adresse.",
      "",
      `Compte : ${admin.username || admin.discordId}`,
      "",
      "— TENF New Family (automatisé)",
    ].join("\n"),
    html: `<p>Bonjour,</p><p>Ceci est un <strong>message de test</strong> depuis l’espace admin TENF (page Mon compte).</p><p>Si tu reçois cet e-mail, la chaîne d’alertes staff est opérationnelle pour ton adresse.</p><p style="color:#666;font-size:12px;">Compte : ${escapeHtml(admin.username || admin.discordId)}</p><p>— TENF New Family (automatisé)</p>`,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.message || "Échec de l’envoi (Resend)." },
      { status: result.status >= 400 ? result.status : 502 }
    );
  }

  return NextResponse.json({ success: true });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const RESEND_URL = "https://api.resend.com/emails";

function looksLikeEmail(value: string): boolean {
  const v = value.trim();
  if (v.length < 5 || v.length > 320) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export function isResendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

export type ResendSendResult =
  | { ok: true }
  | { ok: false; status: number; message: string };

/**
 * Envoi transactionnel via [Resend](https://resend.com/docs/api-reference/emails/send-email).
 * Variables : `RESEND_API_KEY`, optionnellement `STAFF_NOTIFICATION_FROM` (ex. `TENF <cr@votredomaine.com>`).
 */
export async function sendResendEmail(input: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<ResendSendResult> {
  if (!looksLikeEmail(input.to)) {
    return { ok: false, status: 400, message: "Adresse destinataire invalide" };
  }

  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return { ok: false, status: 0, message: "RESEND_API_KEY absent" };
  }

  const from =
    process.env.STAFF_NOTIFICATION_FROM?.trim() || "TENF <onboarding@resend.dev>";

  const res = await fetch(RESEND_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.to.trim()],
      subject: input.subject.slice(0, 998),
      text: input.text,
      ...(input.html ? { html: input.html } : {}),
    }),
  });

  if (!res.ok) {
    let message = res.statusText || "Erreur Resend";
    try {
      const j = (await res.json()) as {
        message?: string | string[];
        error?: { message?: string } | string;
      };
      if (typeof j?.message === "string" && j.message.trim()) message = j.message.trim();
      else if (Array.isArray(j?.message) && j.message.length) message = j.message.map(String).join("; ");
      else if (typeof j?.error === "object" && j.error?.message) message = String(j.error.message);
      else if (typeof j?.error === "string" && j.error.trim()) message = j.error.trim();
    } catch {
      /* ignore */
    }
    return { ok: false, status: res.status, message };
  }

  return { ok: true };
}

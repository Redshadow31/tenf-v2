import type { StaffMeetingDiscoursItem } from "@/lib/staff/monthlyMeetingTypes";

function formatDateFr(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map((n) => Number.parseInt(n, 10));
  if (!y || !m || !d) return isoDate;
  try {
    return new Date(y, m - 1, d).toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return isoDate;
  }
}

/**
 * Concatène tout le contenu des discours en texte brut (Markdown conservé dans corps / conseil),
 * pour le coller dans ChatGPT, Claude, un document, etc.
 */
export function extractMeetingPlainTextForExternal(input: {
  meetingDate: string;
  title: string;
  discours: StaffMeetingDiscoursItem[];
}): string {
  const { meetingDate, title, discours } = input;
  const lines: string[] = [];

  lines.push("=== RÉUNION STAFF — TEXTE BRUT POUR GÉNÉRATION EXTERNE ===");
  lines.push("");
  if (meetingDate.trim()) {
    lines.push(`Date : ${formatDateFr(meetingDate)} (${meetingDate})`);
  } else {
    lines.push("Date : (non renseignée)");
  }
  if (title.trim()) lines.push(`Titre / objet : ${title.trim()}`);
  lines.push("");
  lines.push("--- Contenu des discours (Markdown inclus) ---");
  lines.push("");

  const rows = discours || [];
  if (rows.length === 0) {
    lines.push("(Aucun discours.)");
    return lines.join("\n");
  }

  rows.forEach((d, di) => {
    lines.push(`\n### DISCOURS ${di + 1}`);
    if (d.intervenant.trim()) lines.push(`Intervenant·e : ${d.intervenant.trim()}`);
    if (d.titre.trim()) lines.push(`Sujet / titre : ${d.titre.trim()}`);
    if ((d.musiqueUrl || "").trim()) lines.push(`Lien musique / ambiance : ${(d.musiqueUrl || "").trim()}`);
    lines.push("");

    (d.sections || []).forEach((sec, si) => {
      lines.push(`--- Partie ${si + 1}${sec.tabTitle.trim() ? ` : ${sec.tabTitle.trim()}` : ""} ---`);
      if (sec.corps.trim()) {
        lines.push("Corps :");
        lines.push(sec.corps.trim());
        lines.push("");
      }
      if (sec.conseil.trim()) {
        lines.push("Conseil :");
        lines.push(sec.conseil.trim());
        lines.push("");
      }
    });
  });

  lines.push("\n=== FIN DU TEXTE — Tu peux demander à ton outil de produire un compte-rendu à partir du bloc ci-dessus ===");
  return lines.join("\n").trim();
}

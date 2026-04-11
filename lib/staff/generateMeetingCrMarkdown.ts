import type { StaffMeetingDiscoursItem, StaffMeetingDiscoursSection } from "@/lib/staff/monthlyMeetingTypes";

/** Retire les blocs de code Markdown pour ne pas les traiter comme du contenu. */
function stripFencedCodeBlocks(markdown: string): string {
  return markdown.replace(/```[\s\S]*?```/g, "\n");
}

/**
 * Extrait des lignes « porteuses de sens » (titres, listes, citations courtes)
 * à partir d’un texte Markdown, pour alimenter un CR sans modèle de langage.
 */
export function extractKeyLinesFromMarkdown(markdown: string, maxLines: number): string[] {
  const cleaned = stripFencedCodeBlocks(markdown || "");
  const lines = cleaned.split(/\r?\n/);
  const out: string[] = [];
  const seen = new Set<string>();

  const push = (s: string) => {
    const t = s.replace(/\s+/g, " ").trim();
    if (t.length < 2 || t.length > 220) return;
    const k = t.toLowerCase();
    if (seen.has(k)) return;
    seen.add(k);
    out.push(t);
  };

  for (const raw of lines) {
    if (out.length >= maxLines) break;
    const line = raw.trim();
    if (!line || /^[-*_]{3,}$/.test(line)) continue;

    const h = /^\s{0,3}(#{1,6})\s+(.+)$/.exec(line);
    if (h) {
      push(h[2]);
      continue;
    }

    const b = /^\s{0,3}[-*+]\s+(?:\[[ x]\]\s*)?(.+)$/.exec(line);
    if (b) {
      push(b[1].replace(/^`|`$/g, "").trim());
      continue;
    }

    const n = /^\s{0,3}\d+[.)]\s+(.+)$/.exec(line);
    if (n) {
      push(n[1].trim());
      continue;
    }

    const q = /^\s{0,3}>\s?(.+)$/.exec(line);
    if (q) {
      push(`« ${q[1].trim()} »`);
      continue;
    }
  }

  if (out.length < 2) {
    const chunks = cleaned
      .split(/\n{2,}/)
      .map((c) => c.replace(/\s+/g, " ").trim())
      .filter((c) => c.length > 40 && !c.startsWith("#"));
    for (const c of chunks) {
      if (out.length >= maxLines) break;
      push(c.length > 200 ? `${c.slice(0, 197)}…` : c);
    }
  }

  return out.slice(0, maxLines);
}

function sectionHasContent(s: StaffMeetingDiscoursSection): boolean {
  return Boolean(s.tabTitle.trim() || s.corps.trim() || s.conseil.trim());
}

function discoursHasContent(d: StaffMeetingDiscoursItem): boolean {
  if (d.intervenant.trim() || d.titre.trim()) return true;
  if ((d.musiqueUrl || "").trim()) return true;
  return d.sections.some(sectionHasContent);
}

export type GenerateMeetingCrInput = {
  meetingDate: string;
  title: string;
  discours: StaffMeetingDiscoursItem[];
};

/**
 * Produit un compte-rendu structuré en Markdown à partir des discours saisis.
 * Ce n’est pas une analyse sémantique par IA : synthèse par extraits (titres, listes, paragraphes).
 * Utile pour les présents comme pour les absents (vue d’ensemble partageable).
 */
export function generateMeetingCrMarkdown(input: GenerateMeetingCrInput): string {
  const { meetingDate, title, discours } = input;
  const rows = (discours || []).filter(discoursHasContent);
  if (rows.length === 0 && !meetingDate.trim()) {
    return "";
  }

  let dateLabel = meetingDate;
  try {
    const [y, m, d] = meetingDate.split("-").map((n) => Number.parseInt(n, 10));
    if (y && m && d) {
      dateLabel = new Date(y, m - 1, d).toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    }
  } catch {
    /* garde meetingDate */
  }

  const lines: string[] = [];
  lines.push(`# Compte-rendu — réunion staff`);
  lines.push("");
  lines.push(`**Date :** ${dateLabel || "—"}`);
  if (title.trim()) lines.push(`**Objet / titre interne :** ${title.trim()}`);
  lines.push("");
  lines.push("## À l’attention de toutes et tous");
  lines.push("");
  lines.push(
    "Ce document est une **synthèse automatique** générée à partir des textes saisis pour la réunion (discours, onglets, conseils). " +
      "Il s’adresse **autant aux personnes présentes qu’aux absentes** : il ne remplace pas la prise de notes en direct ni les décisions formelles, mais permet de partager rapidement les grandes lignes."
  );
  lines.push("");
  lines.push("> Génération : extraits de titres, listes et paragraphes repérés dans le Markdown — **sans modèle de langage**.");
  lines.push("");

  if (rows.length === 0) {
    lines.push("## Contenu");
    lines.push("");
    lines.push("_Aucun discours ou texte exploitable n’a été trouvé. Renseigne au moins une date et du contenu dans les discours._");
    return lines.join("\n");
  }

  lines.push("## Ordre du jour synthétique");
  lines.push("");
  rows.forEach((d, i) => {
    const label = d.titre.trim() || `Discours ${i + 1}`;
    const who = d.intervenant.trim() ? ` — *${d.intervenant.trim()}*` : "";
    lines.push(`${i + 1}. **${label}**${who}`);
  });
  lines.push("");

  rows.forEach((d, di) => {
    const head = d.titre.trim() || `Discours ${di + 1}`;
    lines.push(`## ${head}`);
    if (d.intervenant.trim()) lines.push(`**Intervenant·e :** ${d.intervenant.trim()}`);
    if ((d.musiqueUrl || "").trim()) {
      lines.push("");
      lines.push(`**Ambiance / musique (lien) :** ${(d.musiqueUrl || "").trim()}`);
    }
    lines.push("");

    const secs = d.sections.filter(sectionHasContent);
    secs.forEach((sec, si) => {
      const tab = sec.tabTitle.trim() || `Partie ${si + 1}`;
      lines.push(`### ${tab}`);

      const fromCorps = extractKeyLinesFromMarkdown(sec.corps, 10);
      if (fromCorps.length) {
        lines.push("");
        lines.push("**Points retenus (extraits du corps) :**");
        fromCorps.forEach((p) => lines.push(`- ${p}`));
      } else if (sec.corps.trim()) {
        lines.push("");
        lines.push(
          `_Aucune liste ou titre explicite détecté ; extrait brut abrégé :_ ${sec.corps
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, 280)}${sec.corps.trim().length > 280 ? "…" : ""}`
        );
      }

      const fromConseil = extractKeyLinesFromMarkdown(sec.conseil, 6);
      if (fromConseil.length) {
        lines.push("");
        lines.push("**Conseils / posture (extraits) :**");
        fromConseil.forEach((p) => lines.push(`- ${p}`));
      }
      lines.push("");
    });
  });

  lines.push("---");
  lines.push("");
  lines.push("## Prochaines étapes (à compléter manuellement)");
  lines.push("");
  lines.push("- [ ] Décisions actées");
  lines.push("- [ ] Actions / responsables / échéances");
  lines.push("- [ ] Points à reporter à la prochaine réunion");
  lines.push("");
  return lines.join("\n").trim() + "\n";
}

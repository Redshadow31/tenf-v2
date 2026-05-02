import type { ReactNode } from "react";

const MARK_CLASS =
  "rounded px-1 py-0.5 font-semibold text-neutral-950 bg-amber-400 [color-scheme:light]";

export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Motif littéral où `'` et l’apostrophe typographique ’ matchent le même caractère (texte vs données). */
function patternWithFlexibleApostrophe(pattern: string): string {
  const pieces = pattern.split(/['\u2019]/);
  if (pieces.length === 1) return escapeRegExp(pattern);
  return pieces.map(escapeRegExp).join("(?:'|\u2019)");
}

function normalizeHighlightCompare(s: string): string {
  return s.toLowerCase().normalize("NFC").replace(/\u2019/g, "'");
}

/**
 * Fusionne phrases clés (prioritaires) et mots complémentaires, déduplique sans casse,
 * trie du plus long au plus court pour que les expressions complètes matchent avant les sous-mots.
 */
export function buildHighlightPatterns(keywords: string[], phrasesCles?: string[]): string[] {
  const raw = [...(phrasesCles ?? []), ...keywords]
    .map((s) => s.trim())
    .filter((s) => s.length >= 2);

  const seen = new Set<string>();
  const unique: string[] = [];
  for (const p of raw) {
    const low = p.toLowerCase();
    if (seen.has(low)) continue;
    seen.add(low);
    unique.push(p);
  }

  unique.sort((a, b) => b.length - a.length);
  return unique;
}

/**
 * Surligne dans un texte les occurrences des phrases/mots (insensible à la casse).
 * Les entrées de `phrasesCles` sont traitées en premier dans la liste (via buildHighlightPatterns).
 */
export function highlightDiscoursText(text: string, keywords: string[], phrasesCles?: string[]): ReactNode {
  const patterns = buildHighlightPatterns(keywords, phrasesCles);
  if (!patterns.length) return text;

  try {
    const regex = new RegExp(`(${patterns.map(patternWithFlexibleApostrophe).join("|")})`, "gi");
    const chunks = text.split(regex);

    return chunks.map((chunk, index) => {
      const isMatch = patterns.some((p) => normalizeHighlightCompare(p) === normalizeHighlightCompare(chunk));
      if (!isMatch) {
        return (
          <span key={`h-${index}`}>
            {chunk}
          </span>
        );
      }

      return (
        <mark key={`m-${index}`} className={MARK_CLASS}>
          {chunk}
        </mark>
      );
    });
  } catch {
    return text;
  }
}

"use client";

import { Fragment, type ReactNode } from "react";

/** Détecte « article 4 », « l'article 18 », « article 18–19 », etc. */
const ARTICLE_REF_PATTERN = /(?:[Ll]')?(article)\s+(\d+)(?:\s*[–-]\s*(\d+))?/gi;

const linkClassName =
  "font-medium text-violet-300 underline decoration-violet-400/50 underline-offset-2 transition hover:text-violet-200";

type CharteArticleTextProps = {
  text: string;
  onNavigateToArticle?: (sectionId: number) => void;
};

function makeArticleLink(
  sectionId: number,
  label: string,
  key: string,
  onNavigateToArticle?: (sectionId: number) => void,
): ReactNode {
  if (onNavigateToArticle) {
    return (
      <button
        key={key}
        type="button"
        onClick={() => onNavigateToArticle(sectionId)}
        className={linkClassName}
        aria-label={`Aller à l'article ${sectionId}`}
      >
        {label}
      </button>
    );
  }

  return (
    <a key={key} href={`#charte-art-${sectionId}`} className={linkClassName}>
      {label}
    </a>
  );
}

export function linkifyCharteArticleRefs(
  text: string,
  onNavigateToArticle?: (sectionId: number) => void,
): ReactNode {
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  const re = new RegExp(ARTICLE_REF_PATTERN.source, ARTICLE_REF_PATTERN.flags);
  let match: RegExpExecArray | null;

  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const leadingApostrophe = match[0].match(/^[Ll]'/)?.[0] ?? null;
    const articleWord = match[1];
    const firstId = Number.parseInt(match[2], 10);
    const secondId = match[3] ? Number.parseInt(match[3], 10) : null;
    const keyBase = `art-ref-${match.index}`;

    if (secondId !== null && !Number.isNaN(secondId)) {
      if (leadingApostrophe) {
        parts.push(leadingApostrophe);
      }
      parts.push(makeArticleLink(firstId, `${articleWord} ${firstId}`, `${keyBase}-a`, onNavigateToArticle));
      parts.push("–");
      parts.push(makeArticleLink(secondId, String(secondId), `${keyBase}-b`, onNavigateToArticle));
    } else {
      const label = leadingApostrophe
        ? `${leadingApostrophe}${articleWord} ${firstId}`
        : `${articleWord} ${firstId}`;
      parts.push(makeArticleLink(firstId, label, keyBase, onNavigateToArticle));
    }

    lastIndex = re.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  if (parts.length === 0) return text;
  if (parts.length === 1 && typeof parts[0] === "string") return parts[0];

  return parts.map((part, index) =>
    typeof part === "string" ? <Fragment key={`txt-${index}`}>{part}</Fragment> : part,
  );
}

export function CharteArticleText({ text, onNavigateToArticle }: CharteArticleTextProps) {
  return <>{linkifyCharteArticleRefs(text, onNavigateToArticle)}</>;
}

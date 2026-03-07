"use client";

import { useEffect, useMemo, useState } from "react";

export type DiscoursPartKey = "partie-1" | "partie-2" | "partie-3" | "partie-4";

interface PartContent {
  points?: string;
  discours?: string;
  conseils?: string;
}

function normalizeLines(text?: string): string[] {
  if (!text) return [];
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^[-•]\s*/, "").trim());
}

function splitParagraphs(text?: string): string[] {
  if (!text) return [];
  return text
    .split(/\r?\n\r?\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

function inlineBoldFragments(line: string): Array<{ text: string; bold: boolean }> {
  const parts = line.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return parts.map((part) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return { text: part.slice(2, -2), bold: true };
    }
    return { text: part, bold: false };
  });
}

export function useDiscoursCustomContent(part: DiscoursPartKey) {
  const [content, setContent] = useState<PartContent | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await fetch(`/api/admin/evaluations/discours-content?part=${part}`, { cache: "no-store" });
        if (!res.ok) return;
        const payload = await res.json();
        if (!active) return;
        setContent(payload?.content || null);
      } catch {
        // Silence: fallback sur le contenu statique existant
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [part]);

  return useMemo(
    () => ({
      points: content?.points?.trim() ? content.points : null,
      discours: content?.discours?.trim() ? content.discours : null,
      conseils: content?.conseils?.trim() ? content.conseils : null,
    }),
    [content],
  );
}

export function renderPointsOverride(pointsText: string) {
  const lines = normalizeLines(pointsText);
  if (lines.length === 0) return null;
  return (
    <ul className="list-none pl-0 space-y-2">
      {lines.map((line, index) => (
        <li
          key={`points-${index}`}
          className="pl-6 relative before:content-['✓'] before:absolute before:left-0 before:text-cyan-400 before:font-bold"
        >
          {line}
        </li>
      ))}
    </ul>
  );
}

export function renderConseilsOverride(conseilsText: string) {
  const lines = normalizeLines(conseilsText);
  if (lines.length === 0) return null;
  return (
    <ul className="list-disc pl-6 space-y-2 text-gray-300">
      {lines.map((line, index) => (
        <li key={`conseils-${index}`}>{line}</li>
      ))}
    </ul>
  );
}

export function renderDiscoursOverride(discoursText: string) {
  const paragraphs = splitParagraphs(discoursText);
  if (paragraphs.length === 0) return null;
  return (
    <div className="text-gray-300 leading-relaxed space-y-3">
      {paragraphs.map((paragraph, index) => (
        <p key={`discours-${index}`}>
          {inlineBoldFragments(paragraph).map((fragment, fragmentIndex) =>
            fragment.bold ? (
              <strong key={`f-${fragmentIndex}`}>{fragment.text}</strong>
            ) : (
              <span key={`f-${fragmentIndex}`}>{fragment.text}</span>
            ),
          )}
        </p>
      ))}
    </div>
  );
}

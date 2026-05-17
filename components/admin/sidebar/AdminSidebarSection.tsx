"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

type Props = {
  id: string;
  label: string;
  hint?: string;
  icon?: string;
  children: ReactNode;
  /** @deprecated Non affiché (les chiffres ont été retirés à la demande UX). */
  count?: number;
  defaultOpen?: boolean;
  showAttentionDot?: boolean;
};

/**
 * Bloc catégorie : header sur une seule ligne (icône + titre + chevron à droite).
 * Pas de compteur, pas de chiffres : la sidebar reste épurée.
 */
export default function AdminSidebarSection({
  id,
  label,
  hint,
  icon,
  children,
  count: _count,
  defaultOpen = true,
  showAttentionDot = false,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    if (defaultOpen) setOpen(true);
  }, [defaultOpen]);

  const headingId = `admin-sidebar-section-${id}`;
  const panelId = `admin-sidebar-panel-${id}`;

  /**
   * Taille de police adaptative selon la longueur du mot le plus long :
   * on shrink le titre pour que chaque mot tienne sur sa ligne et ne soit
   * jamais coupé en plein milieu (combiné à `word-break: keep-all`).
   */
  const longestWord = useMemo(() => {
    if (!label) return 0;
    return label
      .split(/[\s\-/&]+/)
      .reduce((max, word) => (word.length > max ? word.length : max), 0);
  }, [label]);

  // Tailles légèrement réduites : la sidebar gagne en finesse.
  const labelFontSize =
    longestWord >= 14
      ? "clamp(0.25rem,0.23rem+0.03vw,0.29rem)"
      : longestWord >= 12
        ? "clamp(0.27rem,0.25rem+0.04vw,0.31rem)"
        : longestWord >= 10
          ? "clamp(0.29rem,0.27rem+0.04vw,0.33rem)"
          : "clamp(0.31rem,0.29rem+0.05vw,0.36rem)";

  const labelLetterSpacing = longestWord >= 12 ? "0.015em" : "0.04em";

  return (
    <section
      className={
        "rounded-lg border bg-zinc-950/40 transition-colors " +
        (open
          ? "border-white/[0.05]"
          : "border-white/[0.03] hover:border-white/[0.06]")
      }
      aria-labelledby={headingId}
    >
      <h3 id={headingId} className="m-0">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
          aria-controls={panelId}
          className="group flex w-full min-w-0 items-center gap-1.5 rounded-lg px-2 py-1 text-left transition-colors duration-150 hover:bg-white/[0.025] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/40 focus-visible:ring-offset-1 focus-visible:ring-offset-zinc-950"
        >
          {icon ? (
            <span
              aria-hidden
              className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded text-[9px] text-violet-200/70 transition-colors group-hover:text-violet-100/90"
            >
              {icon}
            </span>
          ) : (
            <span
              aria-hidden
              className="inline-block h-2.5 w-[2px] shrink-0 rounded-full bg-gradient-to-b from-violet-300/55 via-indigo-300/50 to-rose-300/40"
            />
          )}

          <span
            className="min-w-0 flex-1 text-pretty font-normal uppercase leading-[1.15] text-zinc-300/65 transition-colors group-hover:text-zinc-100/85 [overflow-wrap:normal] [word-break:keep-all] [hyphens:none]"
            style={{
              fontSize: labelFontSize,
              letterSpacing: labelLetterSpacing,
            }}
          >
            {label}
          </span>

          {showAttentionDot ? (
            <span
              className="h-1 w-1 shrink-0 rounded-full bg-rose-400/85 shadow-[0_0_5px_rgba(244,114,182,0.35)]"
              aria-label="Attention requise"
            />
          ) : null}

          {hint ? (
            <span
              className="max-w-[5rem] shrink-0 truncate text-zinc-500/70"
              style={{ fontSize: "clamp(0.30rem,0.28rem+0.04vw,0.35rem)" }}
            >
              {hint}
            </span>
          ) : null}

          <ChevronDown
            size={10}
            aria-hidden
            className="shrink-0 text-zinc-500/60 transition-all duration-200 ease-out group-hover:text-violet-300/85"
            style={{ transform: open ? "rotate(0deg)" : "rotate(-90deg)" }}
          />
        </button>
      </h3>

      {open ? (
        <ul
          id={panelId}
          role="list"
          aria-labelledby={headingId}
          className="m-0 list-none space-y-0.5 p-0 px-1 pb-1 pt-0.5"
        >
          {children}
        </ul>
      ) : null}
    </section>
  );
}

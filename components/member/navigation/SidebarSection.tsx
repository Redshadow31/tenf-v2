"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";

type SidebarSectionProps = {
  /** Identifiant stable (utilisé pour la clé d’ouverture/fermeture). */
  id: string;
  title: string;
  children: ReactNode;
  /** Ouvert par défaut (typiquement quand la section contient la page courante). */
  defaultOpen?: boolean;
  /** Point d’attention sur le titre (ex : non-lus). */
  showAttentionDot?: boolean;
};

export default function SidebarSection({
  id,
  title,
  children,
  defaultOpen = false,
  showAttentionDot = false,
}: SidebarSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  // Replie les sections inactives à la navigation ; ouvre la section courante.
  useEffect(() => {
    setOpen(defaultOpen);
  }, [defaultOpen]);

  const headingId = `sidebar-section-${id}`;
  const panelId = `sidebar-panel-${id}`;

  return (
    <section className="space-y-1.5" aria-labelledby={headingId}>
      <h2 id={headingId} className="m-0">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
          aria-controls={panelId}
          className="group flex w-full items-center gap-2 rounded-lg px-1 py-1 text-left transition-colors hover:bg-white/[0.04] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400/60"
        >
          <span className="flex min-w-0 flex-1 items-center gap-2">
            <span className="min-w-0 break-words text-pretty text-[11px] font-extrabold uppercase leading-tight tracking-[0.12em] text-violet-200 transition-colors group-hover:text-violet-100">
              {title}
            </span>
            {showAttentionDot ? (
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.65)]"
                aria-label="Notifications non lues"
              />
            ) : null}
            <span className="h-px min-w-[0.5rem] flex-1 bg-gradient-to-r from-violet-400/45 via-violet-500/15 to-transparent" aria-hidden />
          </span>
          <span
            className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-white/10 bg-black/25 text-zinc-400 transition-colors group-hover:border-violet-400/35 group-hover:text-violet-200"
            aria-hidden
          >
            <ChevronDown
              size={13}
              className="transition-transform duration-200 ease-out"
              style={{ transform: open ? "rotate(0deg)" : "rotate(-90deg)" }}
            />
          </span>
        </button>
      </h2>
      {open ? (
        <div id={panelId} role="region" aria-labelledby={headingId} className="pl-0.5">
          {children}
        </div>
      ) : null}
    </section>
  );
}

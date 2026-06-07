"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";
import { hubFocusRingClass } from "@/components/admin/members-hub/membersHubStyles";

const SIZE_CLASS = {
  sm: "max-w-lg",
  md: "max-w-2xl",
  lg: "max-w-4xl",
  xl: "max-w-5xl",
  full: "max-w-[min(96vw,72rem)]",
} as const;

type GestionModalShellProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: keyof typeof SIZE_CLASS;
  accentHex?: string;
  disableClose?: boolean;
  ariaLabelledBy?: string;
};

export default function GestionModalShell({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = "md",
  accentHex = "#8b5cf6",
  disableClose = false,
  ariaLabelledBy = "gestion-modal-title",
}: GestionModalShellProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm sm:p-4"
      role="presentation"
      onMouseDown={(e) => {
        if (disableClose) return;
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={ariaLabelledBy}
        className={`flex max-h-[92vh] w-full flex-col overflow-hidden rounded-2xl border border-white/[0.1] bg-[linear-gradient(165deg,rgba(24,24,27,0.98),rgba(9,9,11,0.99))] shadow-[0_28px_80px_rgba(0,0,0,0.55)] ring-1 ring-inset ring-white/[0.05] ${SIZE_CLASS[size]}`}
        style={{
          boxShadow: `0 28px 80px rgba(0,0,0,0.55), inset 0 1px 0 0 rgba(255,255,255,0.06), 0 0 0 1px ${accentHex}22`,
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div
          className="flex shrink-0 items-start justify-between gap-3 border-b border-white/[0.08] px-4 py-4 sm:px-5"
          style={{ background: `linear-gradient(135deg, ${accentHex}14, transparent 55%)` }}
        >
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-violet-200/75">TENF · gestion membres</p>
            <h2 id={ariaLabelledBy} className="mt-1 text-lg font-bold tracking-tight text-white sm:text-xl">
              {title}
            </h2>
            {subtitle ? <p className="mt-1 max-w-[58ch] text-sm leading-relaxed text-zinc-400">{subtitle}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={disableClose}
            className={`shrink-0 rounded-xl border border-white/10 bg-white/[0.04] p-2 text-zinc-400 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white disabled:opacity-40 ${hubFocusRingClass}`}
            aria-label="Fermer"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">{children}</div>

        {footer ? (
          <div className="shrink-0 border-t border-white/[0.08] bg-zinc-950/60 px-4 py-3 sm:px-5">{footer}</div>
        ) : null}
      </div>
    </div>
  );
}

export const gestionModalInputClass =
  "w-full rounded-xl border border-white/10 bg-zinc-900/70 px-3 py-2.5 text-sm text-zinc-100 ring-1 ring-inset ring-white/[0.04] transition placeholder:text-zinc-600 focus:border-violet-400/40 focus:outline-none focus:ring-2 focus:ring-violet-400/25";

export const gestionModalTextareaClass = `${gestionModalInputClass} resize-y min-h-[6rem]`;

export const gestionModalGhostBtnClass =
  "rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-zinc-200 transition hover:bg-white/[0.08] disabled:opacity-50";

export const gestionModalPrimaryBtnClass =
  "rounded-xl border border-violet-400/40 bg-violet-600/25 px-4 py-2 text-sm font-semibold text-violet-50 transition hover:bg-violet-600/35 disabled:opacity-50";

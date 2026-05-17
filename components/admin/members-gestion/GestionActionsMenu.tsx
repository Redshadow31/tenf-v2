"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { ChevronDown, MoreHorizontal } from "lucide-react";

export type GestionActionTone = "neutral" | "primary" | "warning" | "danger" | "success" | "info";

export type GestionActionItem = {
  id: string;
  label: string;
  description?: string;
  icon: LucideIcon;
  tone?: GestionActionTone;
  /** Soit onClick (action JS) soit href (lien interne). */
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
  /** Affichage d'un état de chargement local (ex : sync Discord). */
  loading?: boolean;
};

export type GestionActionGroup = {
  id: string;
  label: string;
  items: GestionActionItem[];
};

type GestionActionsMenuProps = {
  groups: GestionActionGroup[];
  /** Étiquette du bouton (par défaut : "Actions"). */
  label?: string;
};

const toneClasses: Record<GestionActionTone, string> = {
  neutral: "text-slate-200 hover:bg-white/[0.06] focus-visible:ring-indigo-400/40",
  primary: "text-indigo-100 hover:bg-indigo-500/15 focus-visible:ring-indigo-400/45",
  info: "text-sky-100 hover:bg-sky-500/12 focus-visible:ring-sky-400/40",
  success: "text-emerald-100 hover:bg-emerald-500/12 focus-visible:ring-emerald-400/40",
  warning: "text-amber-100 hover:bg-amber-500/12 focus-visible:ring-amber-400/40",
  danger: "text-rose-100 hover:bg-rose-500/14 focus-visible:ring-rose-400/45",
};

const toneIconClasses: Record<GestionActionTone, string> = {
  neutral: "text-slate-400",
  primary: "text-indigo-300",
  info: "text-sky-300",
  success: "text-emerald-300",
  warning: "text-amber-300",
  danger: "text-rose-300",
};

/**
 * Menu compact regroupant les actions secondaires de la page gestion membres.
 * Remplace les 6-9 boutons étalés sur plusieurs lignes par un seul bouton
 * "Actions" qui ouvre un popover groupé.
 *
 * Les groupes vides (ou ne contenant que des items filtrés par permission en
 * amont) ne sont pas rendus, ce qui évite d'afficher des sections vides.
 */
export default function GestionActionsMenu({ groups, label = "Actions" }: GestionActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const visibleGroups = groups.filter((g) => g.items.length > 0);
  const totalActions = visibleGroups.reduce((sum, g) => sum + g.items.length, 0);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [open]);

  if (totalActions === 0) return null;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/45 ${
          open
            ? "border-indigo-300/45 bg-indigo-500/15 text-indigo-100"
            : "border-[#353a50] bg-[#121623]/85 text-slate-200 hover:border-indigo-400/30 hover:bg-[#1a2132] hover:text-white"
        }`}
        title={`${label} (${totalActions})`}
      >
        <MoreHorizontal className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
        {label}
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>
      {open ? (
        <div
          role="menu"
          aria-label={label}
          className="absolute right-0 z-50 mt-2 w-[clamp(260px,90vw,340px)] rounded-2xl border border-[#2f3244] bg-[#0f1118] p-2 shadow-[0_24px_50px_-12px_rgba(0,0,0,0.85)]"
        >
          {visibleGroups.map((group, gi) => (
            <div key={group.id} className={gi === 0 ? "" : "mt-1 border-t border-white/5 pt-1"}>
              <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                {group.label}
              </p>
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const tone: GestionActionTone = item.tone ?? "neutral";
                  const className = `flex w-full items-start gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm transition focus:outline-none focus-visible:ring-2 ${toneClasses[tone]} ${
                    item.disabled || item.loading ? "cursor-not-allowed opacity-50" : ""
                  }`;
                  const inner = (
                    <>
                      <item.icon
                        className={`h-4 w-4 shrink-0 mt-0.5 ${toneIconClasses[tone]} ${item.loading ? "animate-spin" : ""}`}
                        aria-hidden
                      />
                      <span className="flex-1">
                        <span className="block font-medium leading-tight">{item.label}</span>
                        {item.description ? (
                          <span className="mt-0.5 block text-[11px] text-slate-500 leading-snug">{item.description}</span>
                        ) : null}
                      </span>
                    </>
                  );
                  return (
                    <li key={item.id} role="none">
                      {item.href ? (
                        <Link
                          href={item.href}
                          role="menuitem"
                          onClick={() => setOpen(false)}
                          className={className}
                        >
                          {inner}
                        </Link>
                      ) : (
                        <button
                          type="button"
                          role="menuitem"
                          disabled={item.disabled || item.loading}
                          onClick={() => {
                            if (item.disabled || item.loading) return;
                            setOpen(false);
                            item.onClick?.();
                          }}
                          className={className}
                        >
                          {inner}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

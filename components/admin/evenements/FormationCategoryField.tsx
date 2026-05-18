"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown, Info } from "lucide-react";
import {
  FORMATION_CATEGORY_OPTIONS,
  getFormationCategoryByKey,
  isFormationCategoryKey,
  type FormationCategoryKey,
} from "@/lib/events/formationCategories";

const inputClass =
  "w-full rounded-xl border border-[#353a50] bg-[#0f1424] px-3 py-2.5 text-sm text-white outline-none transition focus:border-cyan-300/45 focus:ring-2 focus:ring-cyan-400/20";

type FormationCategoryFieldProps = {
  value: FormationCategoryKey | "";
  onChange: (value: FormationCategoryKey | "") => void;
  className?: string;
};

function CategoryHelpPanel({ categoryKey }: { categoryKey: FormationCategoryKey }) {
  const def = getFormationCategoryByKey(categoryKey);
  if (!def) return null;

  return (
    <div
      className="rounded-xl border border-cyan-400/25 bg-cyan-950/30 p-3 text-xs leading-relaxed text-cyan-50/95"
      role="note"
    >
      <p>{def.description}</p>
      <p className="mt-2 font-semibold text-cyan-200/90">Exemples</p>
      <p className="mt-1 text-cyan-100/80">{def.examples.join(" · ")}</p>
    </div>
  );
}

export default function FormationCategoryField({ value, onChange, className = "" }: FormationCategoryFieldProps) {
  const listId = useId();
  const helpId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [hoveredKey, setHoveredKey] = useState<FormationCategoryKey | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  const selected = getFormationCategoryByKey(value);
  const previewKey = hoveredKey ?? (value || null);
  const preview = previewKey ? getFormationCategoryByKey(previewKey) : null;

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  return (
    <div ref={rootRef} className={className}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <label htmlFor={listId} className="text-sm font-medium text-cyan-100">
          Catégorie de formation *
        </label>
        {value ? (
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-lg border border-cyan-500/30 bg-cyan-950/40 px-2 py-1 text-[10px] font-semibold text-cyan-100 lg:hidden"
            aria-expanded={showHelp}
            aria-controls={helpId}
            onClick={() => setShowHelp((v) => !v)}
          >
            <Info className="h-3.5 w-3.5" aria-hidden />
            {showHelp ? "Masquer l'aide" : "Voir l'aide"}
          </button>
        ) : null}
      </div>

      <div className="relative flex flex-col gap-2 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1">
          <button
            type="button"
            id={listId}
            aria-haspopup="listbox"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className={`${inputClass} flex w-full items-center justify-between gap-2 text-left`}
          >
            <span className={selected ? "text-white" : "text-slate-500"}>
              {selected?.label ?? "Choisir une catégorie…"}
            </span>
            <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition ${open ? "rotate-180" : ""}`} />
          </button>

          {open ? (
            <ul
              role="listbox"
              aria-labelledby={listId}
              className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-[#353a50] bg-[#0a0e18] py-1 shadow-xl shadow-black/50"
            >
              {FORMATION_CATEGORY_OPTIONS.map((option) => {
                const isSelected = value === option.key;
                return (
                  <li key={option.key} role="presentation">
                    <button
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      title={option.description}
                      className={`flex w-full px-3 py-2.5 text-left text-sm transition ${
                        isSelected
                          ? "bg-cyan-500/20 font-semibold text-cyan-50"
                          : hoveredKey === option.key
                            ? "bg-cyan-500/10 text-white"
                            : "text-slate-200 hover:bg-cyan-500/10"
                      }`}
                      onMouseEnter={() => setHoveredKey(option.key)}
                      onMouseLeave={() => setHoveredKey(null)}
                      onFocus={() => setHoveredKey(option.key)}
                      onBlur={() => setHoveredKey(null)}
                      onClick={() => {
                        onChange(option.key);
                        setOpen(false);
                        setHoveredKey(null);
                        setShowHelp(true);
                      }}
                    >
                      {option.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}

          {/* Sélecteur natif de secours (accessibilité clavier / lecteurs d'écran) */}
          <select
            className="sr-only"
            value={value}
            tabIndex={-1}
            aria-hidden
            onChange={(e) => {
              const next = e.target.value;
              onChange(isFormationCategoryKey(next) ? next : "");
            }}
          >
            <option value="">Choisir une catégorie…</option>
            {FORMATION_CATEGORY_OPTIONS.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {preview ? (
          <div
            className="hidden w-full shrink-0 rounded-xl border border-cyan-400/20 bg-[#0a0e18]/90 p-3 text-xs leading-relaxed text-slate-200 lg:block lg:max-w-[min(100%,20rem)]"
            role="tooltip"
          >
            <p className="font-semibold text-cyan-100">{preview.label}</p>
            <p className="mt-1.5 text-slate-300">{preview.description}</p>
            <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-cyan-300/80">Exemples</p>
            <p className="mt-1 text-slate-400">{preview.examples.join(" · ")}</p>
          </div>
        ) : null}
      </div>

      {value && showHelp ? (
        <div id={helpId} className="mt-2 lg:hidden">
          <CategoryHelpPanel categoryKey={value} />
        </div>
      ) : null}

      {value && !showHelp ? (
        <p className="mt-1.5 text-[10px] text-slate-500 lg:hidden">
          Appuyez sur « Voir l&apos;aide » pour lire la description et les exemples.
        </p>
      ) : null}
    </div>
  );
}

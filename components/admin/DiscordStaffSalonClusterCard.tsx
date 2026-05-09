"use client";

import { Layers, Shield } from "lucide-react";

/**
 * Bloc unique pour la masse staff agrégée : même rendu sur la chronologie admin et l’aperçu import.
 */
export default function DiscordStaffSalonClusterCard({
  label,
  valueFormatted,
  compact = false,
}: {
  label: string;
  valueFormatted: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-violet-400/35 bg-gradient-to-br from-violet-950/75 via-[#1a1028]/92 to-[#0c0814] shadow-[0_0_0_1px_rgba(139,92,246,0.12),0_12px_40px_-12px_rgba(76,29,149,0.65),inset_0_1px_0_rgba(255,255,255,0.07)] ${compact ? "px-3 py-3" : "px-5 py-5"}`}
      role="group"
      aria-label="Salons staff regroupés"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_55%_at_50%_-25%,rgba(167,139,250,0.22),transparent_55%)]" />
      <div className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-violet-500/10 blur-2xl" />
      <div className="relative flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border border-violet-400/30 bg-violet-500/[0.14] font-bold uppercase tracking-wider text-violet-100/95 shadow-inner ${compact ? "px-2 py-0.5 text-[9px]" : "px-2.5 py-1 text-[10px]"}`}
          >
            <Shield className={compact ? "h-3 w-3 shrink-0 opacity-90" : "h-3.5 w-3.5 shrink-0 opacity-90"} aria-hidden />
            Travail de l’ombre
          </span>
          <span
            className={`inline-flex items-center gap-1 font-medium text-violet-300/90 ${compact ? "text-[10px]" : "text-xs"}`}
          >
            <Layers className="h-3 w-3 shrink-0 opacity-80" aria-hidden />
            Salons staff regroupés
          </span>
        </div>
        <p
          className={`truncate font-semibold leading-snug text-white ${compact ? "text-sm" : "text-base sm:text-lg"}`}
          title={label}
        >
          {label}
        </p>
        <p
          className={`font-black tabular-nums tracking-tight text-violet-50 ${compact ? "text-lg" : "text-2xl sm:text-3xl"}`}
        >
          {valueFormatted}
        </p>
        <p className={`leading-snug text-violet-300/75 ${compact ? "text-[10px]" : "text-[11px] sm:text-xs"}`}>
          Plusieurs salons internes sont additionnés sous ce libellé ; les noms ne sont pas détaillés ici.
        </p>
      </div>
    </div>
  );
}

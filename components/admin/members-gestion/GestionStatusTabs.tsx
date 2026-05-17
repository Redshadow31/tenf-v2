"use client";

import { UserCheck, HeartHandshake, Sparkles, Archive } from "lucide-react";

export type GestionStatusTab = "actifs" | "inactifs" | "nouveaux" | "archives";

type GestionStatusTabsProps = {
  statusTab: GestionStatusTab;
  onChange: (tab: GestionStatusTab) => void;
  counts: {
    actifs: number;
    inactifs: number;
    nouveaux: number;
    archives: number;
  };
};

/**
 * Bandeau d'onglets "population de base" (actifs / suivi communauté / nouveaux / archivés).
 * Visuel identique à l'ancien inline, juste extrait pour alléger GestionClient.
 *
 * NB : la sémantique de filtrage et les counts restent calculés côté GestionClient,
 * ce composant n'est qu'un affichage et un déclencheur.
 */
export default function GestionStatusTabs({ statusTab, onChange, counts }: GestionStatusTabsProps) {
  return (
    <>
      <p className="mb-2 max-w-4xl text-xs leading-relaxed text-slate-500">
        Les onglets ci-dessous changent la <span className="font-medium text-slate-300">population de base</span> (actifs,
        suivi, nouveaux, archivés). La recherche, le préréglage métier et les filtres avancés affinent ensuite cette liste —
        les compteurs peuvent donc différer selon la couche utilisée.
      </p>
      <div
        className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-[#2a3148] bg-[linear-gradient(145deg,rgba(22,26,40,0.95),rgba(12,14,20,0.98))] p-2 shadow-inner shadow-black/20"
        role="tablist"
        aria-label="Filtrer la liste par population"
      >
        <button
          type="button"
          role="tab"
          aria-selected={statusTab === "actifs"}
          aria-pressed={statusTab === "actifs"}
          onClick={() => onChange("actifs")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50 ${
            statusTab === "actifs"
              ? "scale-[1.02] bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-900/30 ring-1 ring-emerald-400/50"
              : "border border-transparent bg-[#1a1f2e] text-slate-300 hover:border-emerald-500/25 hover:text-white"
          }`}
        >
          <UserCheck className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
          Actifs
          <span className="rounded-full bg-black/20 px-2 py-0.5 text-xs tabular-nums">{counts.actifs}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={statusTab === "inactifs"}
          aria-pressed={statusTab === "inactifs"}
          onClick={() => onChange("inactifs")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/50 ${
            statusTab === "inactifs"
              ? "scale-[1.02] bg-gradient-to-r from-rose-600 to-orange-700 text-white shadow-lg shadow-rose-900/25 ring-1 ring-rose-400/45"
              : "border border-transparent bg-[#1a1f2e] text-slate-300 hover:border-rose-500/25 hover:text-white"
          }`}
        >
          <HeartHandshake className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
          Suivi communauté
          <span className="rounded-full bg-black/20 px-2 py-0.5 text-xs tabular-nums">{counts.inactifs}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={statusTab === "nouveaux"}
          aria-pressed={statusTab === "nouveaux"}
          onClick={() => onChange("nouveaux")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/50 ${
            statusTab === "nouveaux"
              ? "scale-[1.02] bg-gradient-to-r from-violet-600 to-indigo-700 text-white shadow-lg shadow-violet-900/30 ring-1 ring-violet-400/45"
              : "border border-transparent bg-[#1a1f2e] text-slate-300 hover:border-violet-500/25 hover:text-white"
          }`}
        >
          <Sparkles className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
          Nouveaux
          <span className="rounded-full bg-black/20 px-2 py-0.5 text-xs tabular-nums">{counts.nouveaux}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={statusTab === "archives"}
          aria-pressed={statusTab === "archives"}
          onClick={() => onChange("archives")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/50 ${
            statusTab === "archives"
              ? "scale-[1.02] bg-gradient-to-r from-slate-600 to-slate-800 text-white shadow-lg shadow-black/30 ring-1 ring-slate-400/40"
              : "border border-transparent bg-[#1a1f2e] text-slate-300 hover:border-slate-500/35 hover:text-white"
          }`}
        >
          <Archive className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
          Archivés
          <span className="rounded-full bg-black/20 px-2 py-0.5 text-xs tabular-nums">{counts.archives}</span>
        </button>
      </div>
    </>
  );
}

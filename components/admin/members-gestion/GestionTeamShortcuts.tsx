"use client";

import Link from "next/link";
import {
  ArrowRight,
  ChevronDown,
  ClipboardList,
  AlertCircle,
  Star,
  History,
  Calendar,
  Sparkles,
  Users,
} from "lucide-react";

type GestionTeamShortcutsProps = {
  expanded: boolean;
  onToggle: () => void;
};

const SHORTCUTS = [
  {
    href: "/admin/membres/validation-profil",
    title: "Validation profils",
    desc: "Examens & statuts",
    icon: ClipboardList,
    accent: "from-violet-500/25 to-indigo-600/10 border-violet-400/35",
  },
  {
    href: "/admin/membres/incomplets",
    title: "Fiches incomplètes",
    desc: "Qualité données",
    icon: AlertCircle,
    accent: "from-amber-500/25 to-orange-600/10 border-amber-400/35",
  },
  {
    href: "/admin/membres/badges",
    title: "Badges",
    desc: "Distinctions TENF",
    icon: Star,
    accent: "from-yellow-500/20 to-amber-700/10 border-yellow-400/30",
  },
  {
    href: "/admin/membres/historique",
    title: "Historique",
    desc: "Événements membre",
    icon: History,
    accent: "from-sky-500/25 to-blue-700/10 border-sky-400/35",
  },
  {
    href: "/admin/membres/revues",
    title: "Revues staff",
    desc: "Suivi périodique",
    icon: Calendar,
    accent: "from-emerald-500/20 to-teal-700/10 border-emerald-400/35",
  },
  {
    href: "/admin/membres/vip",
    title: "VIP & élites",
    desc: "Membres mis en avant",
    icon: Sparkles,
    accent: "from-fuchsia-500/25 to-purple-800/10 border-fuchsia-400/35",
  },
  {
    href: "/admin/membres/postulations",
    title: "Postulations",
    desc: "Candidatures staff",
    icon: Users,
    accent: "from-indigo-500/25 to-slate-800/10 border-indigo-400/35",
  },
] as const;

/**
 * Bandeau de raccourcis vers les sous-hubs membres. Repliable pour laisser
 * remonter le tableau plus haut sur laptop. Aucune logique métier ici.
 */
export default function GestionTeamShortcuts({ expanded, onToggle }: GestionTeamShortcutsProps) {
  return (
    <section className="mb-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Raccourcis équipe</p>
          <button
            type="button"
            onClick={onToggle}
            className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium text-slate-300 transition hover:border-indigo-400/25 hover:bg-white/[0.07] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/45"
            aria-expanded={expanded}
          >
            {expanded ? "Masquer" : "Afficher"}
            <ChevronDown
              className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform ${expanded ? "rotate-180" : ""}`}
              aria-hidden
            />
          </button>
        </div>
        <Link
          href="/membres"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-indigo-300 hover:text-indigo-200 inline-flex items-center gap-1"
        >
          Voir l&apos;annuaire public
          <ArrowRight className="h-3 w-3" aria-hidden />
        </Link>
      </div>
      {expanded ? (
        <div className="flex gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden snap-x snap-mandatory">
          {SHORTCUTS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`snap-start min-w-[200px] max-w-[220px] flex-shrink-0 rounded-2xl border bg-gradient-to-br p-4 shadow-[0_12px_40px_rgba(0,0,0,0.35)] transition hover:-translate-y-0.5 hover:shadow-indigo-500/10 ${item.accent}`}
            >
              <item.icon className="mb-3 h-7 w-7 text-white/90" aria-hidden />
              <p className="font-semibold text-white">{item.title}</p>
              <p className="mt-1 text-xs text-slate-300/90">{item.desc}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-medium text-indigo-200">
                Ouvrir <ArrowRight className="h-3 w-3" aria-hidden />
              </span>
            </Link>
          ))}
        </div>
      ) : null}
    </section>
  );
}

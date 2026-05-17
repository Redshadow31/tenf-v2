"use client";

import Link from "next/link";
import { BellOff, Calendar, LayoutDashboard, MessageSquare, Radio, type LucideIcon } from "lucide-react";

type EmptyVariant = "no-notifications" | "filter-empty" | "all-read" | "no-staff";

type NotificationsEmptyStateProps = {
  variant: EmptyVariant;
  onResetFilters?: () => void;
};

type EmptyContent = {
  title: string;
  description: string;
  toneClass: string;
};

const COPY: Record<EmptyVariant, EmptyContent> = {
  "no-notifications": {
    title: "Rien pour l’instant",
    description: "Tu retrouveras ici les annonces, rappels et infos importantes liés à ton espace TENF.",
    toneClass: "from-violet-500/12 to-transparent border-violet-400/25",
  },
  "filter-empty": {
    title: "Aucune notification dans cette catégorie",
    description: "Reviens au fil complet ou ajuste les filtres pour élargir la recherche.",
    toneClass: "from-sky-500/12 to-transparent border-sky-400/25",
  },
  "all-read": {
    title: "Tout est à jour",
    description: "Tu peux explorer tes prochains événements TENF ou revenir au tableau de bord.",
    toneClass: "from-emerald-500/12 to-transparent border-emerald-400/25",
  },
  "no-staff": {
    title: "Aucune notification staff",
    description: "Les tâches d’organisation apparaîtront ici quand il y en aura.",
    toneClass: "from-rose-500/12 to-transparent border-rose-400/25",
  },
};

type Shortcut = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
};

const SHORTCUTS: Shortcut[] = [
  { href: "/member/dashboard", label: "Tableau de bord", description: "Ton accueil membre", icon: LayoutDashboard },
  { href: "/member/evenements", label: "Agenda TENF", description: "Les prochains événements", icon: Calendar },
  { href: "/lives", label: "Lives en cours", description: "Voir qui stream", icon: Radio },
  { href: "/contact", label: "Contacter le staff", description: "Poser une question", icon: MessageSquare },
];

export default function NotificationsEmptyState({ variant, onResetFilters }: NotificationsEmptyStateProps) {
  const copy = COPY[variant];
  return (
    <section
      className={"relative overflow-hidden rounded-2xl border bg-gradient-to-br p-[clamp(1rem,1.5vw,1.75rem)] " + copy.toneClass}
    >
      <div className="grid grid-cols-1 items-center gap-[clamp(0.75rem,1vw,1.25rem)] md:grid-cols-[auto_minmax(0,1fr)]">
        <div className="flex items-center gap-3 md:flex-col md:items-start">
          <div
            aria-hidden
            className="flex h-[clamp(2.75rem,3.2vw,3.25rem)] w-[clamp(2.75rem,3.2vw,3.25rem)] items-center justify-center rounded-2xl border border-white/15 bg-white/[0.06] text-white shadow-[0_10px_28px_rgba(0,0,0,0.18)]"
          >
            <BellOff className="h-[55%] w-[55%]" strokeWidth={1.7} />
          </div>
          {onResetFilters ? (
            <button
              type="button"
              onClick={onResetFilters}
              className="hidden min-h-[36px] items-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-3 py-2 text-xs font-bold text-white transition hover:bg-white/[0.12] md:inline-flex"
            >
              Revenir à toutes les notifications
            </button>
          ) : null}
        </div>

        <div className="min-w-0">
          <h2
            className="text-pretty font-bold tracking-tight text-white"
            style={{ fontSize: "clamp(1rem,1.2vw,1.15rem)" }}
          >
            {copy.title}
          </h2>
          <p
            className="mt-1 text-pretty leading-snug text-zinc-300"
            style={{ fontSize: "clamp(0.85rem,0.95vw,0.95rem)" }}
          >
            {copy.description}
          </p>

          {onResetFilters ? (
            <button
              type="button"
              onClick={onResetFilters}
              className="mt-3 inline-flex min-h-[36px] items-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-3 py-2 text-xs font-bold text-white transition hover:bg-white/[0.12] md:hidden"
            >
              Revenir à toutes les notifications
            </button>
          ) : null}

          <div className="mt-[clamp(0.75rem,1vw,1.1rem)] grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {SHORTCUTS.map((shortcut) => (
              <Link
                key={shortcut.href}
                href={shortcut.href}
                className="group flex min-h-[3.5rem] items-center gap-2.5 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-left transition hover:border-violet-400/35 hover:bg-violet-500/10"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-violet-200 group-hover:border-violet-400/30 group-hover:bg-violet-500/15">
                  <shortcut.icon className="h-4 w-4" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12.5px] font-bold text-white">{shortcut.label}</span>
                  <span className="block truncate text-[11px] text-zinc-400">{shortcut.description}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

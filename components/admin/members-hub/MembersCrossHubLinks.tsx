"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  CalendarRange,
  GraduationCap,
  Megaphone,
  ShieldCheck,
  Users2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  hubFocusRingClass,
  hubSectionLabelClass,
  hubSectionTitleClass,
} from "./membersHubStyles";

type CrossLink = {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
  tone: "indigo" | "violet" | "emerald" | "cyan" | "amber";
};

const tones: Record<CrossLink["tone"], string> = {
  indigo: "bg-indigo-500/10 text-indigo-200",
  violet: "bg-violet-500/10 text-violet-200",
  emerald: "bg-emerald-500/10 text-emerald-200",
  cyan: "bg-cyan-500/10 text-cyan-200",
  amber: "bg-amber-500/10 text-amber-200",
};

const LINKS: CrossLink[] = [
  {
    href: "/admin/onboarding",
    title: "Onboarding",
    description: "Sessions d'intégration et parcours nouveaux membres.",
    icon: GraduationCap,
    tone: "indigo",
  },
  {
    href: "/admin/moderation",
    title: "Modération",
    description: "Charte, équipe et outils de modération.",
    icon: ShieldCheck,
    tone: "violet",
  },
  {
    href: "/admin/communaute",
    title: "Communauté",
    description: "Animations, raids, vie communautaire TENF.",
    icon: Users2,
    tone: "emerald",
  },
  {
    href: "/admin/communaute/evenements",
    title: "Événements",
    description: "Programmation des rendez-vous TENF.",
    icon: CalendarRange,
    tone: "cyan",
  },
  {
    href: "/admin/communaute/evenements/spotlight",
    title: "Spotlight (animation)",
    description: "Programmation côté animation communauté.",
    icon: Megaphone,
    tone: "amber",
  },
];

export default function MembersCrossHubLinks() {
  return (
    <section aria-labelledby="members-hub-cross">
      <header className="mb-3">
        <p className={hubSectionLabelClass}>Liens transverses TENF</p>
        <h2
          id="members-hub-cross"
          className={`mt-1.5 ${hubSectionTitleClass}`}
          style={{ fontSize: "clamp(0.95rem, 0.85rem + 0.3vw, 1.1rem)" }}
        >
          La gestion des membres est connectée au reste de TENF
        </h2>
        <p
          className="mt-1 text-slate-400"
          style={{ fontSize: "clamp(0.72rem, 0.7rem + 0.08vw, 0.78rem)", maxWidth: "62ch" }}
        >
          Ces hubs partagent les mêmes créateurs, les mêmes événements, la même équipe. Garde-les
          dans le viseur.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {LINKS.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`group flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.025] p-3 transition hover:border-indigo-300/35 hover:bg-white/[0.045] ${hubFocusRingClass}`}
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tones[link.tone]}`}
                aria-hidden
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className="block font-semibold text-slate-100"
                  style={{ fontSize: "clamp(0.78rem, 0.76rem + 0.1vw, 0.86rem)" }}
                >
                  {link.title}
                </span>
                <span
                  className="block text-slate-400 group-hover:text-slate-300"
                  style={{ fontSize: "clamp(0.66rem, 0.64rem + 0.06vw, 0.72rem)" }}
                >
                  {link.description}
                </span>
              </span>
              <ArrowUpRight
                className="h-3.5 w-3.5 shrink-0 text-slate-500 transition group-hover:text-white"
                aria-hidden
              />
            </Link>
          );
        })}
      </div>
    </section>
  );
}

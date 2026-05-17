"use client";

import Link from "next/link";
import { CalendarDays, ExternalLink, Eye, Globe2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  hubFocusRingClass,
  hubSectionLabelClass,
  hubSectionTitleClass,
} from "./membersHubStyles";

type ExperienceLink = {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
  tone: "violet" | "sky" | "emerald";
};

const tones: Record<ExperienceLink["tone"], { border: string; bg: string; icon: string }> = {
  violet: {
    border: "border-violet-400/25 hover:border-violet-300/45",
    bg: "bg-[linear-gradient(160deg,rgba(139,92,246,0.10),rgba(11,13,20,0.85))]",
    icon: "bg-violet-500/15 text-violet-200",
  },
  sky: {
    border: "border-sky-400/25 hover:border-sky-300/45",
    bg: "bg-[linear-gradient(160deg,rgba(56,189,248,0.10),rgba(11,13,20,0.85))]",
    icon: "bg-sky-500/15 text-sky-200",
  },
  emerald: {
    border: "border-emerald-400/25 hover:border-emerald-300/45",
    bg: "bg-[linear-gradient(160deg,rgba(16,185,129,0.10),rgba(11,13,20,0.85))]",
    icon: "bg-emerald-500/15 text-emerald-200",
  },
};

const LINKS: ExperienceLink[] = [
  {
    href: "/member/dashboard",
    title: "Espace créateur",
    description: "Le tableau de bord tel que le voit un créateur TENF connecté.",
    icon: Eye,
    tone: "violet",
  },
  {
    href: "/rejoindre/guide-public/presentation-rapide",
    title: "Parcours public",
    description: "Ce que voit un visiteur avant d'envisager de rejoindre TENF.",
    icon: Globe2,
    tone: "sky",
  },
  {
    href: "/member/evenements",
    title: "Événements créateurs",
    description: "Inscriptions et rendez-vous côté compte connecté.",
    icon: CalendarDays,
    tone: "emerald",
  },
];

export default function MembersExperienceLinks() {
  return (
    <section aria-labelledby="members-hub-experience">
      <header className="mb-3">
        <p className={hubSectionLabelClass}>Expérience membre & public</p>
        <h2
          id="members-hub-experience"
          className={`mt-1.5 ${hubSectionTitleClass}`}
          style={{ fontSize: "clamp(0.95rem, 0.85rem + 0.3vw, 1.1rem)" }}
        >
          Voir TENF comme un créateur le voit
        </h2>
        <p
          className="mt-1 text-slate-400"
          style={{ fontSize: "clamp(0.72rem, 0.7rem + 0.08vw, 0.78rem)", maxWidth: "62ch" }}
        >
          Avant un message ou une décision côté admin, jette un œil au rendu réel pour ne pas dériver
          de l'expérience terrain. Ces liens s'ouvrent dans un nouvel onglet.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {LINKS.map((link) => {
          const tone = tones[link.tone];
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noreferrer"
              className={`group flex flex-col rounded-xl border p-3.5 transition hover:-translate-y-0.5 ${tone.border} ${tone.bg} ${hubFocusRingClass}`}
            >
              <span
                className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${tone.icon}`}
                aria-hidden
              >
                <Icon className="h-4 w-4" />
              </span>
              <p
                className="mt-2.5 font-semibold text-white"
                style={{ fontSize: "clamp(0.82rem, 0.78rem + 0.15vw, 0.92rem)" }}
              >
                {link.title}
              </p>
              <p
                className="mt-1 flex-1 text-slate-400 group-hover:text-slate-300"
                style={{ fontSize: "clamp(0.7rem, 0.68rem + 0.08vw, 0.78rem)", lineHeight: 1.45 }}
              >
                {link.description}
              </p>
              <span className="mt-2 inline-flex items-center gap-1 text-[0.68rem] font-semibold text-slate-300 group-hover:text-white">
                Ouvrir
                <ExternalLink className="h-3 w-3" aria-hidden />
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

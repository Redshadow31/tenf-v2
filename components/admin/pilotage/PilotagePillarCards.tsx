"use client";

import Link from "next/link";
import { ArrowUpRight, Compass, HeartHandshake, Scale } from "lucide-react";
import type { PilotageCopyModel } from "@/lib/admin/pilotage/pilotageCopyModel";
import { MembersHubPanel, MembersHubPanelHeader } from "@/components/admin/members-hub/MembersHubPanel";
import { hubFocusRingClass } from "@/components/admin/members-hub/membersHubStyles";

const PILLAR_ICONS = {
  members: HeartHandshake,
  moderation: Scale,
  admin: Compass,
} as const;

type Props = {
  copy: PilotageCopyModel;
};

export default function PilotagePillarCards({ copy }: Props) {
  return (
    <MembersHubPanel accentHex={copy.accent} tone="neutral" intensity="medium" className="h-full">
      <MembersHubPanelHeader
        kicker="Trois angles"
        title="Membres · Modération · Administration"
        intro="Chaque pilier sert l'entraide Discord — choisis ton point d'entrée."
        accentHex={copy.accent}
      />
      <div className="grid gap-3 md:grid-cols-3">
        {copy.pillars.map((pillar) => {
          const Icon = PILLAR_ICONS[pillar.id as keyof typeof PILLAR_ICONS] ?? Compass;
          return (
            <Link
              key={pillar.id}
              href={pillar.href}
              className={`group flex flex-col rounded-xl border border-white/10 bg-black/20 p-4 transition hover:-translate-y-0.5 hover:border-violet-400/35 hover:bg-black/30 ${hubFocusRingClass}`}
            >
              <Icon className="h-7 w-7 text-violet-300/90 transition group-hover:text-amber-200/90" aria-hidden />
              <h2 className="mt-2 text-sm font-semibold text-white">{pillar.title}</h2>
              <p className="mt-1.5 flex-1 text-xs leading-relaxed text-slate-400 group-hover:text-slate-300">{pillar.body}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-amber-200/90">
                {pillar.cta}
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
              </span>
            </Link>
          );
        })}
      </div>
    </MembersHubPanel>
  );
}

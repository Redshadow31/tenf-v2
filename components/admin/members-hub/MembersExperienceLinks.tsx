"use client";

import Link from "next/link";
import { CalendarDays, ExternalLink, Eye, Globe2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { MembersHubCopyModel } from "@/lib/admin/members/membersHubCopyModel";
import { MembersHubPanel, MembersHubPanelHeader } from "@/components/admin/members-hub/MembersHubPanel";
import { hubFocusRingClass } from "./membersHubStyles";

const ICONS: LucideIcon[] = [Eye, Globe2, CalendarDays];
const TONES = [
  {
    border: "border-violet-400/25 hover:border-violet-300/45",
    bg: "bg-[linear-gradient(160deg,rgba(139,92,246,0.10),rgba(11,13,20,0.85))]",
    icon: "bg-violet-500/15 text-violet-200",
  },
  {
    border: "border-sky-400/25 hover:border-sky-300/45",
    bg: "bg-[linear-gradient(160deg,rgba(56,189,248,0.10),rgba(11,13,20,0.85))]",
    icon: "bg-sky-500/15 text-sky-200",
  },
  {
    border: "border-emerald-400/25 hover:border-emerald-300/45",
    bg: "bg-[linear-gradient(160deg,rgba(16,185,129,0.10),rgba(11,13,20,0.85))]",
    icon: "bg-emerald-500/15 text-emerald-200",
  },
];

type Props = {
  copy: MembersHubCopyModel;
};

export default function MembersExperienceLinks({ copy }: Props) {
  return (
    <MembersHubPanel accentHex={copy.accent} tone="neutral" className="h-full" ariaLabelledBy="members-hub-experience">
      <MembersHubPanelHeader
        kicker={copy.experience.kicker}
        title={copy.experience.title}
        intro={copy.experience.intro}
        icon={Eye}
        accentHex={copy.accent}
        titleId="members-hub-experience"
      />

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-2">
        {copy.experience.links.map((link, index) => {
          const tone = TONES[index] ?? TONES[0];
          const Icon = ICONS[index] ?? Eye;
          return (
            <Link
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noreferrer"
              className={`group flex h-full flex-col rounded-xl border p-3 transition hover:-translate-y-0.5 ${tone.border} ${tone.bg} ${hubFocusRingClass}`}
            >
              <span className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${tone.icon}`} aria-hidden>
                <Icon className="h-4 w-4" />
              </span>
              <p className="mt-2.5 text-sm font-semibold text-white">{link.title}</p>
              <p className="mt-1 flex-1 text-xs leading-relaxed text-white/45 group-hover:text-white/60">{link.description}</p>
              <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-white/50 group-hover:text-white">
                {copy.experience.openLabel}
                <ExternalLink className="h-3 w-3" aria-hidden />
              </span>
            </Link>
          );
        })}
      </div>
    </MembersHubPanel>
  );
}

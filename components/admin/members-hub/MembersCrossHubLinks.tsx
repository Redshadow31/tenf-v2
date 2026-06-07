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
import type { MembersHubCopyModel } from "@/lib/admin/members/membersHubCopyModel";
import { MembersHubPanel, MembersHubPanelHeader } from "@/components/admin/members-hub/MembersHubPanel";
import { hubFocusRingClass } from "./membersHubStyles";

const ICONS: LucideIcon[] = [GraduationCap, ShieldCheck, Users2, CalendarRange, Megaphone];
const TONES = [
  "bg-indigo-500/10 text-indigo-200",
  "bg-violet-500/10 text-violet-200",
  "bg-emerald-500/10 text-emerald-200",
  "bg-cyan-500/10 text-cyan-200",
  "bg-amber-500/10 text-amber-200",
];

type Props = {
  copy: MembersHubCopyModel;
};

export default function MembersCrossHubLinks({ copy }: Props) {
  return (
    <MembersHubPanel accentHex={copy.accent} tone="neutral" className="h-full" ariaLabelledBy="members-hub-cross">
      <MembersHubPanelHeader
        kicker={copy.cross.kicker}
        title={copy.cross.title}
        intro={copy.cross.intro}
        icon={Users2}
        accentHex={copy.accent}
        titleId="members-hub-cross"
      />

      <div className="grid flex-1 grid-cols-1 content-start gap-2 sm:grid-cols-2">
        {copy.cross.links.map((link, index) => {
          const Icon = ICONS[index] ?? Users2;
          const tone = TONES[index] ?? TONES[0];
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`group flex items-center gap-3 rounded-xl border border-white/[0.07] bg-black/20 p-3 transition hover:border-violet-300/35 hover:bg-black/30 ${hubFocusRingClass}`}
            >
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tone}`} aria-hidden>
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-white">{link.title}</span>
                <span className="block text-[11px] text-white/45 group-hover:text-white/60">{link.description}</span>
              </span>
              <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-white/35 group-hover:text-white" aria-hidden />
            </Link>
          );
        })}
      </div>
    </MembersHubPanel>
  );
}

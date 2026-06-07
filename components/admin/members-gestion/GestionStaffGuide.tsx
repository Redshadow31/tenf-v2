"use client";

import { Compass, HelpCircle, Search, UserCheck } from "lucide-react";
import type { GestionCopyModel } from "@/lib/admin/members-gestion/gestionCopyModel";
import { MembersHubPanel, MembersHubPanelHeader } from "@/components/admin/members-hub/MembersHubPanel";

type Props = {
  copy: GestionCopyModel;
};

const STEP_ICONS = [Search, UserCheck, Compass] as const;

export default function GestionStaffGuide({ copy }: Props) {
  return (
    <MembersHubPanel
      accentHex={copy.accent}
      tone="accent"
      intensity="soft"
      className="h-full"
      ariaLabelledBy="gestion-staff-guide-heading"
    >
      <MembersHubPanelHeader
        kicker={copy.guidanceKicker}
        title={copy.guidanceTitle}
        intro={copy.guidanceIntro}
        icon={HelpCircle}
        accentHex={copy.accent}
        titleId="gestion-staff-guide-heading"
      />
      <ol className="grid min-h-0 flex-1 grid-cols-1 gap-2 md:grid-cols-3">
        {copy.guideSteps.map((step, index) => {
          const Icon = STEP_ICONS[index] ?? HelpCircle;
          return (
            <li key={step.id} className="flex flex-col rounded-xl border border-white/[0.08] bg-black/20 p-3">
              <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-violet-200/85">
                <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                {step.kicker}
              </p>
              <p className="mt-1.5 text-sm font-semibold text-white">{step.title}</p>
              <p className="mt-1 flex-1 text-xs leading-relaxed text-white/55">{step.body}</p>
            </li>
          );
        })}
      </ol>
    </MembersHubPanel>
  );
}

"use client";

import { Compass, HelpCircle, ListChecks, Radio } from "lucide-react";
import type { PilotageCopyModel } from "@/lib/admin/pilotage/pilotageCopyModel";
import { MembersHubPanel, MembersHubPanelHeader } from "@/components/admin/members-hub/MembersHubPanel";

type Props = {
  copy: PilotageCopyModel;
};

const STEP_ICONS = [ListChecks, Radio, Compass] as const;

export default function PilotageStaffGuide({ copy }: Props) {
  return (
    <MembersHubPanel accentHex={copy.accent} tone="accent" intensity="soft" className="h-full" ariaLabelledBy="pilotage-staff-guide-heading">
      <MembersHubPanelHeader
        kicker={copy.guidanceKicker}
        title={copy.guidanceTitle}
        intro={copy.guidanceIntro}
        icon={HelpCircle}
        accentHex={copy.accent}
        titleId="pilotage-staff-guide-heading"
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

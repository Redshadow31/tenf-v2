"use client";

import Link from "next/link";
import { Compass, HelpCircle, ListChecks, Search, UserCheck } from "lucide-react";
import type { MembersHubCopyModel } from "@/lib/admin/members/membersHubCopyModel";
import { MembersHubPanel, MembersHubPanelHeader } from "@/components/admin/members-hub/MembersHubPanel";
import { hubFocusRingClass } from "./membersHubStyles";

type Props = {
  copy: MembersHubCopyModel;
  profileValidationPending: number;
};

const STEP_ICONS = [ListChecks, Search, Compass] as const;

export default function MembersHubStaffGuide({ copy, profileValidationPending }: Props) {
  return (
    <MembersHubPanel accentHex={copy.accent} tone="accent" intensity="soft" className="h-full" ariaLabelledBy="members-staff-guide-heading">
      <MembersHubPanelHeader
        kicker={copy.guidanceKicker}
        title={copy.guidanceTitle}
        intro={copy.guidanceIntro}
        icon={HelpCircle}
        accentHex={copy.accent}
        titleId="members-staff-guide-heading"
      />

      <ol className="grid min-h-0 flex-1 grid-cols-1 gap-2 sm:grid-cols-3">
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
              {step.href && step.hrefLabel ? (
                <Link
                  href={step.href}
                  className={`mt-2 inline-flex text-xs font-medium text-violet-200 underline-offset-2 hover:underline ${hubFocusRingClass} rounded`}
                >
                  {step.hrefLabel}
                </Link>
              ) : null}
              {step.footnote && step.id === "onboarding" && profileValidationPending > 0 ? (
                <Link
                  href="/admin/membres/validation-profil"
                  className={`mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium text-amber-200 hover:underline ${hubFocusRingClass} rounded`}
                >
                  <UserCheck className="h-3 w-3" aria-hidden />
                  {step.footnote}
                </Link>
              ) : step.footnote ? (
                <p className="mt-1.5 text-[11px] text-white/40">{step.footnote}</p>
              ) : null}
            </li>
          );
        })}
      </ol>
    </MembersHubPanel>
  );
}

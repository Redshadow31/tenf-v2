"use client";

import Link from "next/link";
import { ArrowRight, Eye } from "lucide-react";
import type { MembersWeakSignal } from "@/lib/admin/members/membersHubModel";
import type { MembersHubCopyModel } from "@/lib/admin/members/membersHubCopyModel";
import { MembersHubPanel, MembersHubPanelHeader } from "@/components/admin/members-hub/MembersHubPanel";
import { hubFocusRingClass } from "./membersHubStyles";

type Props = {
  copy: MembersHubCopyModel;
  signals: MembersWeakSignal[];
};

export default function MembersWeakSignals({ copy, signals }: Props) {
  const hasSignals = signals.length > 0;

  return (
    <MembersHubPanel accentHex={copy.accent} tone="neutral" className="h-full" ariaLabelledBy="members-hub-weak-signals">
      <div className="flex h-full min-h-0 flex-col">
      <MembersHubPanelHeader
        kicker={copy.weak.kicker}
        title={copy.weak.title}
        intro={copy.weak.intro}
        icon={Eye}
        accentHex={copy.accent}
        titleId="members-hub-weak-signals"
      />

      {!hasSignals ? (
        <p className="flex flex-1 items-center rounded-xl border border-emerald-300/25 bg-emerald-500/[0.08] px-3 py-3 text-sm text-emerald-100">
          {copy.weak.empty}
        </p>
      ) : (
        <ul role="list" className="flex flex-1 flex-col gap-2">
          {signals.map((signal) => (
            <li key={signal.id}>
              <Link
                href={signal.href}
                className={`group flex items-start gap-3 rounded-xl border border-white/[0.06] bg-black/20 p-3 transition hover:-translate-y-0.5 hover:border-violet-300/35 hover:bg-black/30 ${hubFocusRingClass}`}
              >
                <span
                  className="flex h-9 min-w-[2.5rem] shrink-0 items-center justify-center rounded-lg border border-indigo-300/25 bg-indigo-500/[0.08] px-2 text-sm font-bold tabular-nums text-indigo-100"
                  aria-hidden
                >
                  {signal.count}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-white">{signal.label}</span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-white/45 group-hover:text-white/60">
                    {signal.hint}
                  </span>
                </span>
                <ArrowRight className="mt-1 h-3.5 w-3.5 shrink-0 text-white/35 group-hover:translate-x-0.5 group-hover:text-white" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
      </div>
    </MembersHubPanel>
  );
}

"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock3, Flame, ListChecks } from "lucide-react";
import {
  IMPACT_LABELS,
  type MembersOpsItem,
  type MembersOpsImpact,
} from "@/lib/admin/members/membersOpsQueue";
import type { MembersHubCopyModel } from "@/lib/admin/members/membersHubCopyModel";
import { MembersHubPanel, MembersHubPanelHeader } from "@/components/admin/members-hub/MembersHubPanel";
import { hubFocusRingClass } from "./membersHubStyles";

type Props = {
  copy: MembersHubCopyModel;
  urgent: MembersOpsItem[];
  important: MembersOpsItem[];
  totalPending: number;
  ownersStore: Record<string, string>;
  ownersIsLocal: boolean;
  maxItems?: number;
};

const impactDotClass: Record<MembersOpsImpact, string> = {
  onboarding: "bg-fuchsia-300",
  moderation: "bg-orange-300",
  qualite_data: "bg-cyan-300",
  processus_interne: "bg-slate-300",
};

export default function MembersDailyQueue({
  copy,
  urgent,
  important,
  totalPending,
  ownersStore,
  ownersIsLocal,
  maxItems = 5,
}: Props) {
  const visibleUrgent = urgent.slice(0, maxItems);
  const remainingSlots = Math.max(0, maxItems - visibleUrgent.length);
  const visibleImportant = important.slice(0, remainingSlots);
  const hasItems = visibleUrgent.length + visibleImportant.length > 0;

  return (
    <MembersHubPanel accentHex={copy.accent} tone="neutral" className="h-full" ariaLabelledBy="members-hub-daily-queue">
      <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <MembersHubPanelHeader
          kicker={copy.queue.kicker}
          title={copy.queue.title}
          intro={copy.queue.intro}
          icon={ListChecks}
          accentHex={copy.accent}
          titleId="members-hub-daily-queue"
        />
        <Link
          href="/admin/membres/actions"
          className={`mb-3 inline-flex items-center gap-1.5 rounded-xl border border-indigo-300/30 bg-indigo-500/10 px-3 py-1.5 text-xs font-semibold text-indigo-100 transition hover:bg-indigo-500/20 ${hubFocusRingClass}`}
        >
          {copy.queue.cta} ({totalPending})
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>

      <div className="mt-1 space-y-4">
        {!hasItems ? (
          <div className="flex items-center gap-3 rounded-xl border border-emerald-300/30 bg-emerald-500/[0.08] p-4 text-emerald-100">
            <CheckCircle2 className="h-5 w-5 text-emerald-300" aria-hidden />
            <div>
              <p className="text-sm font-semibold">{copy.queue.emptyTitle}</p>
              <p className="text-xs text-emerald-200/80">{copy.queue.emptyMessage}</p>
            </div>
          </div>
        ) : (
          <>
            {visibleUrgent.length > 0 ? (
              <QueueTier
                title={copy.queue.urgentTier}
                tone="urgent"
                items={visibleUrgent}
                ownersStore={ownersStore}
                ownersIsLocal={ownersIsLocal}
                copy={copy}
              />
            ) : null}
            {visibleImportant.length > 0 ? (
              <QueueTier
                title={copy.queue.importantTier}
                tone="important"
                items={visibleImportant}
                ownersStore={ownersStore}
                ownersIsLocal={ownersIsLocal}
                copy={copy}
              />
            ) : null}
          </>
        )}
      </div>
      </div>
    </MembersHubPanel>
  );
}

function QueueTier({
  title,
  tone,
  items,
  ownersStore,
  ownersIsLocal,
  copy,
}: {
  title: string;
  tone: "urgent" | "important";
  items: MembersOpsItem[];
  ownersStore: Record<string, string>;
  ownersIsLocal: boolean;
  copy: MembersHubCopyModel;
}) {
  const tones =
    tone === "urgent"
      ? {
          chip: "border-rose-400/40 bg-rose-500/10 text-rose-200",
          bar: "bg-rose-400",
          countBox: "border-rose-400/45 bg-rose-500/15 text-rose-100",
          icon: Flame,
        }
      : {
          chip: "border-amber-400/35 bg-amber-500/10 text-amber-200",
          bar: "bg-amber-400",
          countBox: "border-amber-400/40 bg-amber-500/10 text-amber-100",
          icon: Clock3,
        };
  const Icon = tones.icon;

  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <span className={`h-3 w-1 rounded-full ${tones.bar}`} aria-hidden />
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] ${tones.chip}`}
        >
          <Icon className="h-3 w-3" aria-hidden />
          {title}
        </span>
      </div>
      <ul role="list" className="grid grid-cols-1 gap-2.5">
        {items.map((item) => {
          const owner = ownersStore[item.id] || item.owner;
          return (
            <li key={item.id}>
              <Link
                href={item.href}
                className={`group flex items-stretch gap-3 rounded-xl border border-white/[0.07] bg-black/20 p-3.5 transition hover:-translate-y-0.5 hover:border-violet-300/35 hover:bg-black/30 ${hubFocusRingClass}`}
              >
                <span
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border text-base font-bold ${tones.countBox}`}
                  aria-hidden
                >
                  {item.count}
                </span>
                <span className="flex min-w-0 flex-1 flex-col justify-between">
                  <span>
                    <span className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white/40">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/30 px-2 py-0.5 text-white/70">
                        <span className={`h-1.5 w-1.5 rounded-full ${impactDotClass[item.impact]}`} aria-hidden />
                        {IMPACT_LABELS[item.impact]}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock3 className="h-3 w-3" aria-hidden />
                        {item.sla}
                      </span>
                    </span>
                    <p className="mt-2 text-sm font-semibold text-white">{item.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-white/50">{item.description}</p>
                  </span>
                  <span className="mt-2.5 flex items-center justify-between gap-2 text-[11px]">
                    <span className="text-white/40">
                      {owner ? (
                        <span>
                          {copy.queue.ownerPrefix}{" "}
                          <span className="font-medium text-white/70">{owner}</span>
                          {ownersIsLocal ? (
                            <span className="ml-1 rounded border border-white/10 px-1 py-0.5 text-[9px] uppercase tracking-wider text-white/35">
                              {copy.queue.localView}
                            </span>
                          ) : null}
                        </span>
                      ) : (
                        copy.queue.unassigned
                      )}
                    </span>
                    <span className="inline-flex items-center gap-1 font-semibold text-violet-200 group-hover:text-violet-100">
                      {copy.queue.openAction} <ArrowRight className="h-3 w-3" aria-hidden />
                    </span>
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

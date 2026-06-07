"use client";

import Link from "next/link";
import { LayoutList, Link2, ListChecks, UserCheck } from "lucide-react";
import type { MembersHubCopyModel } from "@/lib/admin/members/membersHubCopyModel";
import { MembersHubPanel, MembersHubPanelHeader } from "@/components/admin/members-hub/MembersHubPanel";
import { cockpitBtnClass, hubFocusRingClass } from "./membersHubStyles";

type Props = {
  copy: MembersHubCopyModel;
  pendingTotal: number;
  profileValidationPending?: number;
};

const QUICK_LINKS = [
  { href: "/admin/membres/incomplets", label: "Profils incomplets" },
  { href: "/admin/membres/qualite-data", label: "Qualité data" },
  { href: "/admin/onboarding", label: "Intégration" },
  { href: "/admin/pilotage", label: "Pilotage", muted: true },
] as const;

export default function MembersHubCockpitAside({ copy, pendingTotal, profileValidationPending = 0 }: Props) {
  return (
    <MembersHubPanel accentHex={copy.accent} tone="accent" intensity="soft" className="h-full">
      <div className="flex h-full min-h-0 flex-col">
        <MembersHubPanelHeader
          kicker="Raccourcis"
          title={copy.aside.actionsTitle}
          intro={copy.aside.remindersIntro}
          icon={ListChecks}
          accentHex={copy.accent}
        />

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:grid-cols-1">
          <Link
            href="/admin/membres/actions"
            className={`${cockpitBtnClass} ${hubFocusRingClass} justify-center border-rose-400/30 bg-rose-950/25 text-rose-100`}
          >
            <ListChecks className="h-4 w-4 shrink-0" aria-hidden />
            {copy.aside.fullQueue}
            {pendingTotal > 0 ? (
              <span className="rounded-md bg-black/25 px-1.5 py-0.5 text-xs font-bold tabular-nums">{pendingTotal}</span>
            ) : null}
          </Link>
          <Link href="/admin/membres/gestion" className={`${cockpitBtnClass} ${hubFocusRingClass} justify-center`}>
            <LayoutList className="h-4 w-4 shrink-0" aria-hidden />
            {copy.aside.listManage}
          </Link>
          <Link
            href="/admin/membres/validation-profil"
            className={`${cockpitBtnClass} ${hubFocusRingClass} justify-center ${
              profileValidationPending > 0
                ? "border-amber-400/30 bg-amber-950/25 text-amber-100"
                : "border-white/10 bg-white/[0.04] text-zinc-300"
            }`}
          >
            <UserCheck className="h-4 w-4 shrink-0" aria-hidden />
            {copy.aside.validationProfile}
            {profileValidationPending > 0 ? (
              <span className="rounded-md bg-black/25 px-1.5 py-0.5 text-xs font-bold tabular-nums">
                {profileValidationPending}
              </span>
            ) : null}
          </Link>
        </div>

        <div className="mt-auto border-t border-white/[0.06] pt-3">
          <p className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-violet-200/80">
            <Link2 className="h-3 w-3" aria-hidden />
            {copy.aside.linksTitle}
          </p>
          <ul className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-xs">
            {QUICK_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`${hubFocusRingClass} rounded ${"muted" in link && link.muted ? "text-white/40 hover:text-white/70" : "text-violet-200 hover:text-white"}`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </MembersHubPanel>
  );
}

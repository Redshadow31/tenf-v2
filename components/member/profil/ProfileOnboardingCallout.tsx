"use client";

import { ArrowUpRight, Sparkles } from "lucide-react";
import {
  DashboardBadge,
  MEMBER_PANEL_RADIUS,
  MemberPrimaryLink,
} from "@/components/member/dashboard/dashboardUi";

export default function ProfileOnboardingCallout() {
  return (
    <div
      className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${MEMBER_PANEL_RADIUS} border border-amber-500/30 bg-gradient-to-r from-amber-500/12 via-black/20 to-transparent px-4 py-3 backdrop-blur-sm`}
      role="status"
      aria-labelledby="profile-onboarding-title"
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <DashboardBadge tone="amber" accentHex="#f59e0b">
            <Sparkles className="h-3 w-3" aria-hidden />
            Onboarding
          </DashboardBadge>
          <p id="profile-onboarding-title" className="text-sm font-bold text-white">
            Profil à finaliser
          </p>
        </div>
        <p className="mt-1 text-xs leading-relaxed text-white/65">
          Complète ta vitrine pour que le staff valide ta fiche — chaque bloc rempli te rapproche du « tout vert ».
        </p>
      </div>
      <MemberPrimaryLink
        href="/member/profil/completer"
        accentHex="#f59e0b"
        className="shrink-0 min-h-[36px] px-4"
      >
        Compléter
        <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
      </MemberPrimaryLink>
    </div>
  );
}

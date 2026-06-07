"use client";

import { loginWithDiscord } from "@/lib/discord";
import { ArrowRight, Link2, LogIn } from "lucide-react";
import { DashboardPanel, MemberPrimaryLink } from "@/components/member/dashboard/dashboardUi";
import { DISCOVER_ACCENT } from "@/components/member/engagement/discover/discoverUtils";

type DiscoverGatePanelProps =
  | { kind: "discord"; title: string; body: string; actionLabel: string }
  | { kind: "twitch"; connectHref: string; title: string; body: string; actionLabel: string };

export default function DiscoverGatePanel(props: DiscoverGatePanelProps) {
  if (props.kind === "discord") {
    return (
      <DashboardPanel tone="accent" accentHex={DISCOVER_ACCENT} intensity="bold" className="md:p-6">
        <div className="mx-auto max-w-lg space-y-3 text-center">
          <LogIn className="mx-auto h-10 w-10 text-violet-300/80" aria-hidden />
          <h2 className="text-xl font-bold text-white">{props.title}</h2>
          <p className="text-sm leading-relaxed text-white/65">{props.body}</p>
          <button
            type="button"
            onClick={loginWithDiscord}
            className="inline-flex min-h-[40px] items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-[#1f1a12]"
            style={{ backgroundColor: DISCOVER_ACCENT }}
          >
            {props.actionLabel}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </DashboardPanel>
    );
  }

  return (
    <DashboardPanel tone="accent" accentHex={DISCOVER_ACCENT} intensity="bold" className="md:p-6">
      <div className="mx-auto max-w-lg space-y-3 text-center">
        <Link2 className="mx-auto h-10 w-10 text-violet-300/80" aria-hidden />
        <h2 className="text-xl font-bold text-white">{props.title}</h2>
        <p className="text-sm leading-relaxed text-white/65">{props.body}</p>
        <MemberPrimaryLink href={props.connectHref} accentHex={DISCOVER_ACCENT}>
          {props.actionLabel}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </MemberPrimaryLink>
      </div>
    </DashboardPanel>
  );
}

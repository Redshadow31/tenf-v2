"use client";

import Link from "next/link";
import { ArrowRight, Crown } from "lucide-react";

type Props = {
  onNavigate?: () => void;
};

export default function UserSidebarVipButton({ onNavigate }: Props) {
  return (
    <Link
      href="/vip"
      onClick={onNavigate}
      className="mt-2 flex min-h-[40px] w-full items-center justify-center gap-2 rounded-xl border border-amber-400/40 bg-gradient-to-b from-amber-500/20 to-amber-950/25 px-3 py-2 text-sm font-bold text-amber-50 shadow-[0_0_20px_rgba(245,158,11,0.12)] transition hover:border-amber-300/55 hover:from-amber-500/28 hover:to-amber-900/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300/70"
    >
      <Crown className="h-4 w-4 shrink-0 text-amber-300" aria-hidden />
      Mon espace VIP
      <ArrowRight className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
    </Link>
  );
}

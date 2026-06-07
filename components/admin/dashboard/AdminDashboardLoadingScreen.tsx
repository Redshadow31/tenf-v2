"use client";

import { LayoutDashboard } from "lucide-react";
import MemberBentoShell from "@/components/member/layout/MemberBentoShell";

type AdminDashboardLoadingScreenProps = {
  title?: string;
  subtitle?: string;
};

export default function AdminDashboardLoadingScreen({
  title = "Chargement de ton tableau de bord staff",
  subtitle = "Récupération de ton profil, des files modération et des signaux communauté…",
}: AdminDashboardLoadingScreenProps) {
  return (
    <div className="-mx-4 md:-mx-6">
      <MemberBentoShell>
        <div
          className="flex min-h-[50vh] items-center justify-center px-4"
          aria-busy="true"
          aria-live="polite"
          aria-label={title}
        >
          <div className="max-w-md text-center">
            <div className="relative mx-auto mb-6 h-16 w-16">
              <div className="absolute inset-0 animate-ping rounded-full bg-violet-500/20" />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-violet-500/40 bg-gradient-to-br from-violet-500/20 to-indigo-600/10 shadow-[0_0_40px_rgba(124,58,237,0.25)]">
                <LayoutDashboard className="h-8 w-8 text-violet-200" aria-hidden />
              </div>
            </div>
            <p className="text-lg font-semibold text-white">{title}</p>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">{subtitle}</p>
            <div className="mt-6 flex justify-center">
              <div
                className="h-8 w-8 animate-spin rounded-full border-2 border-violet-300/35 border-t-violet-200"
                aria-hidden
              />
            </div>
          </div>
        </div>
      </MemberBentoShell>
    </div>
  );
}

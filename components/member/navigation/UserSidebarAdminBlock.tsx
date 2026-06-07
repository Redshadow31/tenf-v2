"use client";

import Link from "next/link";
import { ExternalLink, Shield } from "lucide-react";

type UserSidebarAdminBlockProps = {
  onNavigate?: () => void;
};

export default function UserSidebarAdminBlock({ onNavigate }: UserSidebarAdminBlockProps) {
  return (
    <div className="rounded-xl border border-amber-500/25 bg-amber-950/15 p-3">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-amber-500/35 bg-amber-500/10 text-amber-200">
          <Shield className="h-3.5 w-3.5" aria-hidden />
        </span>
        <p className="text-[11px] font-bold uppercase tracking-wide text-amber-200/90">Espace staff</p>
      </div>

      <Link
        href="/admin/dashboard"
        onClick={onNavigate}
        className="mt-2.5 flex min-h-[40px] w-full items-center justify-center gap-2 rounded-xl border border-amber-400/40 bg-amber-500/15 px-3 py-2 text-sm font-bold text-amber-50 transition-colors hover:bg-amber-500/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200"
      >
        Administration
        <ExternalLink className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
      </Link>
    </div>
  );
}

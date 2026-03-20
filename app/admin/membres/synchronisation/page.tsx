"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, RefreshCw } from "lucide-react";

export default function SynchronisationMembresPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      router.replace("/admin/membres/gestion");
    }, 300);
    return () => window.clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0e0e10] p-8 text-white">
      <div className="mx-auto max-w-3xl rounded-2xl border border-indigo-300/20 bg-[linear-gradient(150deg,rgba(99,102,241,0.12),rgba(14,15,23,0.85)_45%,rgba(56,189,248,0.08))] p-6 shadow-[0_20px_50px_rgba(2,6,23,0.45)]">
        <p className="text-xs uppercase tracking-[0.12em] text-indigo-200/90">Page déplacée</p>
        <h1 className="mt-2 text-2xl font-semibold">Synchronisation est intégrée à la gestion membres</h1>
        <p className="mt-3 text-sm text-slate-300">
          Cette route reste active pour compatibilité des boutons/liens existants, puis redirige automatiquement vers la gestion des membres.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/admin/membres/gestion"
            className="inline-flex items-center gap-2 rounded-lg border border-indigo-300/35 bg-indigo-500/20 px-3 py-2 text-sm font-semibold text-indigo-100 hover:bg-indigo-500/30"
          >
            Aller vers Gestion membres
            <ArrowRight className="h-4 w-4" />
          </Link>
          <button
            type="button"
            onClick={() => router.replace("/admin/membres/gestion")}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300/30 bg-slate-500/15 px-3 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-500/25"
          >
            <RefreshCw className="h-4 w-4" />
            Relancer la redirection
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Archive,
  ChevronRight,
  Radio,
  ShieldAlert,
  Sparkles,
  Users,
} from "lucide-react";

export type RaidsFiabiliteHubActive = "raids-eventsub" | "signalements" | "historique";

const BASE = "/admin/communaute/engagement";

const NAV: {
  id: RaidsFiabiliteHubActive;
  href: string;
  label: string;
  hint: string;
  icon: typeof Radio;
}[] = [
  {
    id: "raids-eventsub",
    href: `${BASE}/raids-eventsub`,
    label: "Raids — EventSub",
    hint: "Abonnements Twitch, sync live, statuts matched / erreurs.",
    icon: Radio,
  },
  {
    id: "signalements",
    href: `${BASE}/signalements-raids`,
    label: "Signalements & correctifs",
    hint: "Déclarations membres, cibles, validation manuelle sans doublon auto.",
    icon: ShieldAlert,
  },
  {
    id: "historique",
    href: `${BASE}/historique-raids`,
    label: "Historique consolidé",
    hint: "Volumes mensuels, stats streamers, doublons et tendances.",
    icon: Archive,
  },
];

type Props = {
  active: RaidsFiabiliteHubActive;
  children: React.ReactNode;
};

export default function RaidsFiabiliteHubShell({ active, children }: Props) {
  const pathname = usePathname() || "";

  return (
    <div className="min-h-screen bg-[#07080f] text-white">
      <div className="border-b border-white/[0.06] bg-[linear-gradient(180deg,rgba(99,102,241,0.08),transparent)]">
        <div className="mx-auto max-w-6xl px-4 py-4 md:px-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                <Link href={`${BASE}`} className="transition hover:text-white">
                  Engagement
                </Link>
                <ChevronRight className="h-3 w-3 opacity-60" />
                <Link href={`${BASE}/raids-fiabilite`} className="text-indigo-200/90 transition hover:text-white">
                  Accueil catégorie
                </Link>
                <ChevronRight className="h-3 w-3 opacity-60" />
                <span className="text-slate-300">Outil actif</span>
              </div>
              <h1 className="mt-1 flex flex-wrap items-center gap-2 text-lg font-semibold tracking-tight text-white md:text-xl">
                <Activity className="h-5 w-5 text-violet-400" />
                Pilier raids — transparence côté membres TENF
              </h1>
              <p className="mt-1 max-w-3xl text-xs leading-relaxed text-slate-400 md:text-sm">
                Ces écrans servent à <span className="text-slate-200">garder la confiance</span> : chaque raid compté ou corrigé
                alimente la réputation du collectif. Pense « preuve + traçabilité » avant chaque validation.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-100">
                <Users className="h-3 w-3" />
                Impact membres
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-violet-400/30 bg-violet-500/10 px-2.5 py-1 text-[11px] font-medium text-violet-100">
                <Sparkles className="h-3 w-3" />
                Qualité staff
              </span>
            </div>
          </div>

          <nav className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3" aria-label="Navigation Raids & fiabilité">
            {NAV.map((item) => {
              const Icon = item.icon;
              const isActive = active === item.id || pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`group relative overflow-hidden rounded-2xl border px-4 py-3 transition ${
                    isActive
                      ? "border-violet-400/50 bg-[linear-gradient(145deg,rgba(139,92,246,0.22),rgba(15,17,28,0.95))] shadow-[0_12px_40px_rgba(99,102,241,0.2)]"
                      : "border-white/10 bg-white/[0.03] hover:border-violet-400/35 hover:bg-white/[0.06]"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
                        isActive ? "border-violet-400/40 bg-violet-500/20 text-violet-100" : "border-white/10 bg-black/30 text-slate-400"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className={`text-sm font-semibold ${isActive ? "text-white" : "text-slate-200 group-hover:text-white"}`}>
                        {item.label}
                      </p>
                      <p className="mt-0.5 text-[11px] leading-snug text-slate-500 group-hover:text-slate-400">{item.hint}</p>
                    </div>
                    <ChevronRight
                      className={`ml-auto h-4 w-4 shrink-0 transition ${
                        isActive ? "text-violet-200 opacity-100" : "text-slate-600 opacity-0 group-hover:opacity-100"
                      }`}
                    />
                  </div>
                </Link>
              );
            })}
          </nav>

          <div className="mt-4 flex flex-wrap gap-2 border-t border-white/[0.06] pt-4">
            <Link
              href={`${BASE}/points-discord`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/25 bg-cyan-500/10 px-3 py-1.5 text-xs font-medium text-cyan-100 transition hover:bg-cyan-500/20"
            >
              Points Discord
              <ChevronRight className="h-3 w-3" />
            </Link>
            <Link
              href={`${BASE}/follow`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-slate-300 transition hover:bg-white/[0.08] hover:text-white"
            >
              Follow communauté
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-8">{children}</div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Archive, ChevronRight, Radio, ShieldAlert } from "lucide-react";

export type RaidsFiabiliteHubActive = "raids-eventsub" | "signalements" | "historique";

const BASE = "/admin/communaute/engagement";

const NAV: {
  id: RaidsFiabiliteHubActive;
  href: string;
  label: string;
  hint: string;
  badge?: string;
  icon: typeof Radio;
}[] = [
  {
    id: "raids-eventsub",
    href: `${BASE}/raids-eventsub`,
    label: "Raids EventSub",
    hint: "Ce que Twitch détecte automatiquement : sync, volumes et statuts de traitement.",
    badge: "Auto",
    icon: Radio,
  },
  {
    id: "signalements",
    href: `${BASE}/signalements-raids`,
    label: "Signalements raids",
    hint: "Ce que les membres déclarent ou signalent : vérifier avant de valider.",
    badge: "Membres",
    icon: ShieldAlert,
  },
  {
    id: "historique",
    href: `${BASE}/historique-raids`,
    label: "Historique consolidé",
    hint: "Vision mensuelle pour auditer volumes, stats et corrections.",
    badge: "Audit",
    icon: Archive,
  },
];

type Props = {
  active: RaidsFiabiliteHubActive;
  children: React.ReactNode;
};

const navCardBase =
  "group relative flex min-h-[5.5rem] flex-col rounded-xl border px-4 py-3 transition focus-within:outline-none focus-within:ring-2 focus-within:ring-violet-400/45 focus-within:ring-offset-2 focus-within:ring-offset-[#07080f]";
const navCardInactive = "border-white/[0.08] bg-zinc-950/40 hover:border-violet-400/25 hover:bg-zinc-900/50";
const navCardActive =
  "border-violet-400/45 bg-violet-950/35 shadow-[inset_0_1px_0_0_rgba(167,139,250,0.12)] ring-1 ring-violet-500/20";

export default function RaidsFiabiliteHubShell({ active, children }: Props) {
  const pathname = usePathname() || "";

  return (
    <div className="min-h-screen bg-[#07080f] text-white">
      <div className="border-b border-white/[0.06] bg-zinc-950/80">
        <div className="mx-auto max-w-[1480px] px-3 py-4 md:px-6 md:py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
            <div className="min-w-0 flex-1">
              <nav className="flex flex-wrap items-center gap-1.5 text-[11px] font-medium text-zinc-500">
                <Link href={`${BASE}`} className="transition hover:text-zinc-200">
                  Engagement
                </Link>
                <ChevronRight className="h-3 w-3 shrink-0 opacity-50" aria-hidden />
                <Link href={`${BASE}/raids-fiabilite`} className="text-violet-300/90 transition hover:text-white">
                  Fiabilité des raids
                </Link>
                <ChevronRight className="h-3 w-3 shrink-0 opacity-50" aria-hidden />
                <span className="text-zinc-400">Outil</span>
              </nav>
              <p className="mt-2 text-[clamp(1rem,0.95rem+0.35vw,1.125rem)] font-semibold tracking-tight text-zinc-100">
                Pilier raids — suivi et corrections
              </p>
              <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-zinc-500">
                Trois entrées complémentaires pour garder des chiffres fiables côté membres. Passe d’abord par EventSub, puis les
                signalements, puis l’historique pour consolider.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2 lg:pt-1">
              <Link
                href={`${BASE}/points-discord`}
                className="inline-flex items-center gap-1 rounded-lg border border-sky-500/25 bg-sky-950/30 px-3 py-2 text-xs font-medium text-sky-100 transition hover:border-sky-400/40 hover:bg-sky-900/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
              >
                Points Discord
                <ChevronRight className="h-3 w-3 opacity-70" aria-hidden />
              </Link>
              <Link
                href={`${BASE}/follow`}
                className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-zinc-300 transition hover:border-white/15 hover:bg-white/[0.07] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
              >
                Follow communauté
              </Link>
            </div>
          </div>

          <nav className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3" aria-label="Navigation Raids et fiabilité">
            {NAV.map((item) => {
              const Icon = item.icon;
              const isActive = active === item.id || pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`${navCardBase} ${isActive ? navCardActive : navCardInactive}`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${
                        isActive ? "border-violet-400/35 bg-violet-500/15 text-violet-200" : "border-white/10 bg-black/25 text-zinc-500"
                      }`}
                      aria-hidden
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-sm font-semibold ${isActive ? "text-white" : "text-zinc-200 group-hover:text-white"}`}>
                          {item.label}
                        </span>
                        {item.badge ? (
                          <span className="rounded-md border border-white/10 bg-black/30 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-400">
                            {item.badge}
                          </span>
                        ) : null}
                        {isActive ? (
                          <span className="sr-only">(page actuelle)</span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-[11px] leading-snug text-zinc-500 group-hover:text-zinc-400">{item.hint}</p>
                    </div>
                    <ChevronRight
                      className={`mt-0.5 h-4 w-4 shrink-0 text-zinc-600 transition ${isActive ? "text-violet-300/80" : "opacity-0 group-hover:opacity-100"}`}
                      aria-hidden
                    />
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-[1480px] px-3 py-6 md:px-6 md:py-8">{children}</div>
    </div>
  );
}

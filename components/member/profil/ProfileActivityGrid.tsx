"use client";

import Link from "next/link";
import { ArrowUpRight, CalendarDays, Crown, Gamepad2, ShieldCheck, Zap, type LucideIcon } from "lucide-react";

type Tile = {
  href: string;
  icon: LucideIcon;
  label: string;
  value: string | number;
  hint: string;
  tone: "violet" | "fuchsia" | "sky" | "emerald" | "amber";
};

type ProfileActivityGridProps = {
  upcomingEvents: number;
  raidsThisMonth: number;
  presencesThisMonth: number;
  formationsValidated: number;
  vipStatusLabel: string;
};

const TONE_GRADIENTS: Record<Tile["tone"], { from: string; ring: string; iconBg: string; icon: string }> = {
  violet: {
    from: "from-violet-500/15 via-violet-500/[0.04] to-transparent",
    ring: "border-violet-400/25 hover:border-violet-400/45",
    iconBg: "bg-violet-500/18",
    icon: "text-violet-200",
  },
  fuchsia: {
    from: "from-fuchsia-500/15 via-fuchsia-500/[0.04] to-transparent",
    ring: "border-fuchsia-400/25 hover:border-fuchsia-400/45",
    iconBg: "bg-fuchsia-500/18",
    icon: "text-fuchsia-200",
  },
  sky: {
    from: "from-sky-500/15 via-sky-500/[0.04] to-transparent",
    ring: "border-sky-400/25 hover:border-sky-400/45",
    iconBg: "bg-sky-500/18",
    icon: "text-sky-200",
  },
  emerald: {
    from: "from-emerald-500/15 via-emerald-500/[0.04] to-transparent",
    ring: "border-emerald-400/25 hover:border-emerald-400/45",
    iconBg: "bg-emerald-500/18",
    icon: "text-emerald-200",
  },
  amber: {
    from: "from-amber-500/15 via-amber-500/[0.04] to-transparent",
    ring: "border-amber-400/25 hover:border-amber-400/45",
    iconBg: "bg-amber-500/18",
    icon: "text-amber-200",
  },
};

export default function ProfileActivityGrid(props: ProfileActivityGridProps) {
  const tiles: Tile[] = [
    { href: "/member/evenements", icon: CalendarDays, label: "Événements à venir", value: props.upcomingEvents, hint: "Agenda TENF", tone: "violet" },
    { href: "/member/activite", icon: Zap, label: "Raids ce mois-ci", value: props.raidsThisMonth, hint: "Voir mon activité", tone: "fuchsia" },
    { href: "/member/evenements/presences", icon: Gamepad2, label: "Présences événements", value: props.presencesThisMonth, hint: "Ce mois-ci", tone: "sky" },
    { href: "/member/formations/validees", icon: ShieldCheck, label: "Formations validées", value: props.formationsValidated, hint: "Parcours Academy", tone: "emerald" },
    { href: "/member/profil/completer", icon: Crown, label: "VIP TENF", value: props.vipStatusLabel || "—", hint: "Statut du mois", tone: "amber" },
  ];

  return (
    <section
      id="profil-engagement"
      className="scroll-mt-[clamp(4rem,9vw,7.5rem)] rounded-[clamp(0.85rem,1.2vw,1.25rem)] border px-[clamp(0.75rem,1vw,1.2rem)] py-[clamp(0.7rem,0.95vw,1.05rem)]"
      style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
    >
      <header className="mb-[clamp(0.55rem,0.8vw,0.85rem)] flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-violet-300/90">En un coup d’œil</p>
          <h2
            className="text-pretty font-bold tracking-tight text-white"
            style={{ fontSize: "clamp(0.9rem,1.02vw,1.05rem)", lineHeight: 1.2 }}
          >
            Ton activité dans la New Family
          </h2>
        </div>
      </header>

      <div className="grid gap-[clamp(0.4rem,0.65vw,0.7rem)] grid-cols-[repeat(auto-fit,minmax(min(10.5rem,100%),1fr))]">
        {tiles.map((tile) => {
          const tone = TONE_GRADIENTS[tile.tone];
          return (
            <Link
              key={tile.href}
              href={tile.href}
              className={
                "group relative flex flex-col gap-[clamp(0.35rem,0.55vw,0.55rem)] overflow-hidden rounded-xl border bg-gradient-to-br px-[clamp(0.65rem,0.85vw,0.95rem)] py-[clamp(0.55rem,0.8vw,0.9rem)] transition-all hover:-translate-y-[1px] " +
                tone.from +
                " " +
                tone.ring
              }
            >
              <div className="flex items-center justify-between gap-2">
                <span className={"flex h-7 w-7 items-center justify-center rounded-lg " + tone.iconBg + " " + tone.icon}>
                  <tile.icon className="h-3.5 w-3.5" aria-hidden />
                </span>
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-white/10 bg-white/[0.04] text-zinc-400 transition group-hover:border-white/20 group-hover:text-white">
                  <ArrowUpRight className="h-3 w-3" aria-hidden />
                </span>
              </div>
              <p
                className="text-pretty font-black tabular-nums text-white"
                style={{ fontSize: "clamp(1.1rem,1.4vw,1.55rem)", lineHeight: 1.1 }}
              >
                {tile.value}
              </p>
              <div className="min-w-0">
                <p
                  className="font-bold text-zinc-100"
                  style={{ fontSize: "clamp(0.74rem,0.85vw,0.88rem)", lineHeight: 1.2 }}
                >
                  {tile.label}
                </p>
                <p
                  className="mt-0.5 text-zinc-500"
                  style={{ fontSize: "clamp(0.66rem,0.74vw,0.74rem)" }}
                >
                  {tile.hint}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

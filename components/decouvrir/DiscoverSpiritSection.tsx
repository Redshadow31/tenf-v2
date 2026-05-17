"use client";

import { Heart, Scale, Sparkles } from "lucide-react";
import { DISCOVER_COPY } from "@/lib/decouvrir/copy";

const ICONS = [Scale, Sparkles, Heart] as const;

export default function DiscoverSpiritSection() {
  const { title, subtitle, cards } = DISCOVER_COPY.spirit;

  return (
    <section className="rounded-3xl border border-white/10 px-5 py-8 sm:px-8 sm:py-10" style={{ backgroundColor: "var(--color-card)" }} aria-labelledby="discover-spirit-heading">
      <h2 id="discover-spirit-heading" className="text-xl font-black tracking-tight text-white sm:text-2xl">
        {title}
      </h2>
      <p className="mt-2 max-w-2xl text-sm text-zinc-400 sm:text-base">{subtitle}</p>

      <ul className="mt-8 grid list-none gap-4 p-0 lg:grid-cols-3">
        {cards.map((card, i) => {
          const Icon = ICONS[i] ?? Scale;
          return (
            <li key={card.title} className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/12 text-emerald-200 ring-1 ring-white/10">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <h3 className="mt-4 text-base font-bold text-white">{card.title}</h3>
              <p className="mt-2 text-pretty text-sm leading-relaxed text-zinc-400">{card.body}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

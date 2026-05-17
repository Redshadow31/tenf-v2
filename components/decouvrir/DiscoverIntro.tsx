"use client";

import { Compass, HeartHandshake, Sparkles } from "lucide-react";
import { DISCOVER_COPY } from "@/lib/decouvrir/copy";

const ICONS = [Sparkles, Compass, HeartHandshake] as const;

export default function DiscoverIntro() {
  const { title, subtitle, cards } = DISCOVER_COPY.intro;

  return (
    <section className="rounded-3xl border border-white/10 bg-black/15 px-5 py-8 sm:px-8 sm:py-10" aria-labelledby="discover-intro-heading">
      <div className="mx-auto max-w-3xl text-center lg:mx-0 lg:max-w-none lg:text-left">
        <h2 id="discover-intro-heading" className="text-xl font-black tracking-tight text-white sm:text-2xl">
          {title}
        </h2>
        <p className="mt-2 text-sm text-zinc-400 sm:text-base">{subtitle}</p>
      </div>

      <ul className="mt-8 grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card, i) => {
          const Icon = ICONS[i] ?? Sparkles;
          return (
            <li
              key={card.title}
              className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition hover:border-violet-400/30 hover:bg-violet-500/[0.06]"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/15 text-violet-200 ring-1 ring-white/10">
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

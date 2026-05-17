"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, Home, Radio } from "lucide-react";
import { DISCOVER_COPY } from "@/lib/decouvrir/copy";

export default function DiscoverMoreSection() {
  const c = DISCOVER_COPY.more;

  const cards = [
    {
      title: c.annuaireTitle,
      body: c.annuaireBody,
      href: "/membres",
      icon: BookOpen,
    },
    {
      title: c.livesTitle,
      body: c.livesBody,
      href: "/lives",
      icon: Radio,
    },
    {
      title: c.homeTitle,
      body: c.homeBody,
      href: "/",
      icon: Home,
    },
  ] as const;

  return (
    <section className="rounded-3xl border border-white/10 bg-black/20 px-5 py-8 sm:px-8 sm:py-10" aria-labelledby="discover-more-heading">
      <h2 id="discover-more-heading" className="text-xl font-black tracking-tight text-white sm:text-2xl">
        {c.title}
      </h2>
      <p className="mt-3 max-w-3xl text-pretty text-sm leading-relaxed text-zinc-400 sm:text-base">{c.lead}</p>

      <ul className="mt-8 grid list-none gap-4 p-0 md:grid-cols-3">
        {cards.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className="flex h-full min-h-[160px] flex-col rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition hover:border-violet-400/35 hover:bg-violet-500/[0.07] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300"
              >
                <Icon className="h-6 w-6 text-violet-300" aria-hidden />
                <span className="mt-3 text-base font-bold text-white">{item.title}</span>
                <span className="mt-2 flex-1 text-sm leading-relaxed text-zinc-400">{item.body}</span>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-violet-200">
                  Continuer
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

"use client";

import { useState } from "react";
import { CalendarDays, ChevronDown, GraduationCap, type LucideIcon, Rocket } from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  graduation: GraduationCap,
  rocket: Rocket,
  calendar: CalendarDays,
};

export type HomePillarItem = {
  title: string;
  description: string;
  iconKey: keyof typeof ICONS;
  detail?: string;
};

type HomeExpandablePillarsProps = {
  items: HomePillarItem[];
};

export default function HomeExpandablePillars({ items }: HomeExpandablePillarsProps) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {items.map((item, index) => {
        const Icon = ICONS[item.iconKey] ?? GraduationCap;
        const expanded = open === index;
        return (
          <article
            key={item.title}
            className={`about-reveal home-feature-card rounded-2xl border transition-shadow ${
              expanded ? "shadow-[0_16px_48px_color-mix(in_srgb,var(--color-primary)_14%,transparent)] ring-1 ring-[color-mix(in_srgb,var(--color-primary)_35%,transparent)]" : ""
            }`}
          >
            <button
              type="button"
              onClick={() => setOpen(expanded ? null : index)}
              className="flex w-full flex-col items-start gap-3 p-4 text-left sm:p-6"
              aria-expanded={expanded}
            >
              <div className="flex w-full items-start justify-between gap-2">
                <span className="home-icon-bubble inline-flex rounded-xl p-2.5 sm:p-3">
                  <Icon size={22} style={{ color: "var(--color-primary)" }} aria-hidden />
                </span>
                <ChevronDown
                  className={`mt-1 h-5 w-5 shrink-0 text-[var(--color-text-secondary)] transition-transform ${expanded ? "rotate-180" : ""}`}
                  aria-hidden
                />
              </div>
              <h3 className="text-lg font-bold sm:text-xl">{item.title}</h3>
              <p className="home-muted text-sm leading-relaxed">{item.description}</p>
            </button>
            {expanded && item.detail ? (
              <div className="border-t border-[var(--color-border)] px-4 pb-4 pt-0 sm:px-6 sm:pb-6">
                <p className="home-muted text-sm leading-relaxed">{item.detail}</p>
              </div>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}

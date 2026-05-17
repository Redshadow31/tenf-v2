"use client";

import { useCallback, useEffect, useState } from "react";

export type ProfileNavItem = {
  id: string;
  label: string;
};

type ProfileSubNavProps = {
  items: ReadonlyArray<ProfileNavItem>;
};

export default function ProfileSubNav({ items }: ProfileSubNavProps) {
  const [activeId, setActiveId] = useState<string>(items[0]?.id ?? "");

  const scrollToSection = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveId(id);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]?.target?.id) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-30% 0px -55% 0px", threshold: [0, 0.25, 0.5] },
    );
    items.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [items]);

  return (
    <nav
      aria-label="Sections du profil"
      className="sticky top-[clamp(0.4rem,0.8vw,0.85rem)] z-20 rounded-2xl border bg-[var(--color-card)]/85 px-1.5 py-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.22)] backdrop-blur"
      style={{ borderColor: "var(--color-border)" }}
    >
      <div className="flex flex-nowrap items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map(({ id, label }) => {
          const active = id === activeId;
          return (
            <button
              key={id}
              type="button"
              onClick={() => scrollToSection(id)}
              aria-current={active ? "true" : undefined}
              className={
                "inline-flex min-h-[36px] shrink-0 items-center justify-center rounded-xl px-[clamp(0.65rem,0.85vw,1rem)] py-[clamp(0.3rem,0.5vw,0.5rem)] font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400/60 " +
                (active
                  ? "bg-gradient-to-b from-violet-500/30 to-violet-700/15 text-white shadow-[0_4px_18px_rgba(139,92,246,0.18)] ring-1 ring-violet-400/45"
                  : "text-zinc-300 hover:bg-white/[0.04] hover:text-white")
              }
              style={{ fontSize: "clamp(0.74rem,0.85vw,0.85rem)" }}
            >
              {label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

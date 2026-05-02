"use client";

import { useCallback, useEffect, useState } from "react";

const ITEMS = [
  { id: "accueil-parcours-visiteurs", label: "Par où ?" },
  { id: "accueil-lives", label: "Lives" },
  { id: "accueil-nouveaux", label: "Nouveaux" },
  { id: "accueil-vip", label: "VIP" },
  { id: "accueil-valeur", label: "Pourquoi TENF" },
  { id: "accueil-etapes", label: "Parcours" },
  { id: "accueil-avis", label: "Avis" },
  { id: "accueil-histoire", label: "Histoire" },
  { id: "accueil-cta", label: "Rejoindre" },
] as const;

export default function HomeStickyNav() {
  const [active, setActive] = useState<string>(ITEMS[0].id);

  const scrollToId = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  useEffect(() => {
    const sections = ITEMS.map((i) => document.getElementById(i.id)).filter(Boolean) as HTMLElement[];
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target?.id) setActive(visible[0].target.id);
      },
      { rootMargin: "-12% 0px -55% 0px", threshold: [0, 0.12, 0.25] }
    );

    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  return (
    <nav
      className="home-journey-nav sticky top-[51px] z-40 -mx-3 mb-2 border-b border-[color-mix(in_srgb,var(--color-border)_80%,transparent)] bg-[color-mix(in_srgb,var(--color-bg)_88%,transparent)] px-2 py-2 backdrop-blur-md sm:-mx-6 sm:mb-4 sm:px-3 lg:-mx-8"
      aria-label="Sections de la page d’accueil"
    >
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin sm:flex-wrap sm:justify-center sm:overflow-visible sm:pb-0">
        {ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => scrollToId(item.id)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide transition sm:text-xs ${
              active === item.id
                ? "bg-[color-mix(in_srgb,var(--color-primary)_22%,var(--color-card))] text-[var(--color-text)] ring-1 ring-[color-mix(in_srgb,var(--color-primary)_45%,transparent)]"
                : "text-[var(--color-text-secondary)] hover:bg-[color-mix(in_srgb,var(--color-card)_90%,transparent)] hover:text-[var(--color-text)]"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </nav>
  );
}

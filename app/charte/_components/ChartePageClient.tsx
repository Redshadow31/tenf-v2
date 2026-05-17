"use client";

import { useEffect, useState } from "react";
import { ArrowUp, BookOpen } from "lucide-react";
import { tableOfContents } from "../_data";

/**
 * Sommaire latéral sticky avec scroll-spy + bouton "haut de page" mobile.
 * S'utilise en sidebar gauche sur xl, et au-dessus du contenu en mobile/tablette.
 */
export default function ChartePageClient() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Scroll-spy : suit la section visible la plus haute dans le viewport.
  useEffect(() => {
    const ids = tableOfContents.map((item) => item.id);
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .map((entry) => entry.target as HTMLElement);

        if (visible.length === 0) return;
        // Section dont le top est le plus proche de "rootMargin top".
        visible.sort((a, b) => {
          const aRect = a.getBoundingClientRect();
          const bRect = b.getBoundingClientRect();
          return aRect.top - bRect.top;
        });
        setActiveId(visible[0]?.id || null);
      },
      {
        // Active la section dès que son haut atteint ~25% du viewport.
        rootMargin: "-25% 0px -65% 0px",
        threshold: [0, 0.25, 0.5, 1],
      }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Bouton "haut" : visible dès qu'on a scrollé > 800px.
  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 800);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleAnchorClick = (id: string) => (event: React.MouseEvent<HTMLAnchorElement>) => {
    const target = document.getElementById(id);
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    // Met à jour l'URL hash sans saut.
    if (typeof history !== "undefined") {
      history.replaceState(null, "", `#${id}`);
    }
  };

  return (
    <>
      <nav
        aria-label="Sommaire de la charte"
        className="xl:sticky xl:top-24 xl:max-h-[calc(100vh-7rem)] xl:overflow-y-auto"
      >
        <div
          className="rounded-2xl border p-4 sm:p-5"
          style={{
            borderColor: "var(--color-border)",
            backgroundColor: "color-mix(in srgb, var(--color-card) 70%, transparent)",
          }}
        >
          <p className="home-kicker mb-3 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] sm:text-xs">
            <BookOpen className="h-3.5 w-3.5" aria-hidden />
            Sommaire de la charte
          </p>
          <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 xl:grid-cols-1">
            {tableOfContents.map((item) => {
              const isActive = activeId === item.id;
              return (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    onClick={handleAnchorClick(item.id)}
                    aria-current={isActive ? "true" : undefined}
                    className={`group block rounded-lg px-3 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]`}
                    style={{
                      color: isActive ? "var(--color-primary)" : "var(--color-text)",
                      backgroundColor: isActive
                        ? "color-mix(in srgb, var(--color-primary) 12%, transparent)"
                        : "transparent",
                      borderLeft: isActive
                        ? "3px solid var(--color-primary)"
                        : "3px solid transparent",
                      paddingLeft: isActive ? "calc(0.75rem - 3px)" : "0.75rem",
                    }}
                  >
                    <span className="opacity-90 transition group-hover:opacity-100">
                      {item.label}
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {showScrollTop ? (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Remonter en haut de la page"
          className="fixed bottom-6 right-6 z-40 inline-flex h-12 w-12 items-center justify-center rounded-full shadow-xl transition hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white xl:bottom-8 xl:right-8"
          style={{
            backgroundColor: "var(--color-primary)",
            color: "white",
            boxShadow: "0 10px 30px color-mix(in srgb, var(--color-primary) 50%, transparent)",
          }}
        >
          <ArrowUp className="h-5 w-5" aria-hidden />
        </button>
      ) : null}
    </>
  );
}

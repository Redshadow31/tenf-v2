"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { BookOpen, Compass, Map } from "lucide-react";
import {
  GUIDE_TENF_BASE,
  getTenfChapterBySlug,
  guideTenfChapters,
  guideTenfParcoursSteps,
} from "@/lib/guides/tenf/guideTenfSiteData";
import {
  GuideAccentOrb,
  GuideAmbientBackground,
  GuideGlassButton,
  GUIDE_FLUID,
  guideGlassClass,
  guideGlassSurface,
} from "@/components/guides/partie-publique/guidePublicUi";
import { GuideTenfNavAside, GuideTenfRightAside } from "./GuideTenfSidebars";

const TENF_DEFAULT_ACCENT = "#f472b6";
const LAST_UPDATED = "mai 2026";

const navLinks = [
  { href: GUIDE_TENF_BASE, label: "Accueil", accent: TENF_DEFAULT_ACCENT },
  ...guideTenfChapters.map((c) => ({
    href: `${GUIDE_TENF_BASE}/${c.slug}`,
    label: c.menuLabel,
    accent: c.accent,
  })),
  { href: `${GUIDE_TENF_BASE}/parcours`, label: "Parcours", accent: TENF_DEFAULT_ACCENT },
];

function getPageAccent(pathname: string): string {
  const slug = pathname.match(/^\/guides\/tenf\/([^/]+)$/)?.[1];
  if (!slug) return TENF_DEFAULT_ACCENT;
  return getTenfChapterBySlug(slug)?.accent ?? TENF_DEFAULT_ACCENT;
}

export default function GuideTenfShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "";
  const isHub = pathname === GUIDE_TENF_BASE;
  const pageAccent = getPageAccent(pathname);

  return (
    <div
      className={`guide-tenf-root relative min-h-screen ${GUIDE_FLUID.shell} overflow-x-clip`}
      style={{
        backgroundColor: "var(--color-bg)",
        fontSize: "clamp(0.9375rem, 0.82rem + 0.35vw, 1.125rem)",
      }}
    >
      <GuideAmbientBackground />

      <div className={`relative ${GUIDE_FLUID.shell} ${GUIDE_FLUID.px} pt-[clamp(1.25rem,2.5vw,2rem)]`}>
        <header
          className={`relative w-full overflow-hidden rounded-2xl border p-[clamp(1rem,1.5vw,1.35rem)] ${guideGlassClass}`}
          style={guideGlassSurface(pageAccent, "lifted")}
        >
          <GuideAccentOrb accent={pageAccent} className="-right-16 -top-16 h-48 w-48 opacity-60" />
          <div className="relative flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1">
              <p
                className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em]"
                style={{
                  borderColor: `color-mix(in srgb, ${pageAccent} 35%, transparent)`,
                  color: pageAccent,
                  backgroundColor: `color-mix(in srgb, ${pageAccent} 12%, transparent)`,
                }}
              >
                Guide nouveau membre
              </p>
              <h1 className="mt-2 text-[clamp(1.125rem,1rem+0.5vw,1.4rem)] font-bold tracking-tight" style={{ color: "var(--color-text)" }}>
                Culture TENF — carte interactive
              </h1>
              <p className="mt-1.5 max-w-[min(70ch,100%)] text-[clamp(0.8125rem,0.75rem+0.25vw,0.9375rem)] leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                Entraide, Spotlights, points, événements et ton rôle — avec liens vers le fonctionnement officiel.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2 lg:justify-end">
              <GuideGlassButton href="/fonctionnement-tenf/decouvrir" variant="glass" accent={pageAccent} className="!px-3 !py-2 text-xs sm:text-sm">
                <Compass className="h-3.5 w-3.5" aria-hidden />
                Fonctionnement
              </GuideGlassButton>
              <GuideGlassButton href="/member/dashboard" variant="primary" accent={pageAccent} className="!px-3 !py-2 text-xs sm:text-sm">
                Espace membre
              </GuideGlassButton>
            </div>
          </div>
          <p className="relative mt-3 text-xs" style={{ color: "var(--color-text-muted)" }}>
            Mis à jour {LAST_UPDATED} · {guideTenfChapters.length} chapitres · Parcours {guideTenfParcoursSteps.length} étapes
          </p>
        </header>
      </div>

      <nav className={`sticky top-16 z-40 mt-4 w-full xl:hidden ${GUIDE_FLUID.px}`} aria-label="Sections du guide TENF">
        <div className={`overflow-x-auto rounded-2xl border px-2 py-2 ${guideGlassClass}`} style={guideGlassSurface(TENF_DEFAULT_ACCENT, "soft")}>
          <ul className="flex min-w-max gap-1.5">
            {navLinks.map((link) => {
              const active = pathname === link.href;
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={`block rounded-full border px-3 py-1.5 text-xs font-semibold transition duration-300 sm:text-sm ${active ? "backdrop-blur-md" : ""}`}
                    style={{
                      borderColor: active ? `color-mix(in srgb, ${link.accent} 45%, transparent)` : "color-mix(in srgb, white 6%, var(--color-border))",
                      backgroundColor: active ? `color-mix(in srgb, ${link.accent} 18%, transparent)` : "transparent",
                      color: active ? link.accent : "var(--color-text-secondary)",
                    }}
                    aria-current={active ? "page" : undefined}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      <div className={`mt-4 w-full pb-[clamp(2.5rem,4vw,4rem)] xl:mt-6 ${GUIDE_FLUID.px} ${GUIDE_FLUID.grid3}`}>
        <aside className="hidden min-w-0 xl:block" aria-label="Navigation latérale du guide TENF">
          <GuideTenfNavAside pathname={pathname} />
        </aside>

        <main className={`min-w-0 w-full ${isHub ? "pt-2 sm:pt-4 xl:pt-0" : "pt-0"}`}>{children}</main>

        <aside className="hidden min-w-0 xl:block" aria-label="Raccourcis du guide TENF">
          <GuideTenfRightAside pathname={pathname} />
        </aside>
      </div>

      <footer className={`w-full border-t py-8 ${guideGlassClass}`} style={{ borderColor: "color-mix(in srgb, white 6%, var(--color-border))", backgroundColor: "color-mix(in srgb, var(--color-card) 35%, transparent)" }}>
        <div className={`flex w-full flex-wrap items-center justify-center gap-4 text-center text-xs ${GUIDE_FLUID.px}`} style={{ color: "var(--color-text-muted)" }}>
          <Link href="/fonctionnement-tenf/decouvrir" className="inline-flex items-center gap-1 transition hover:opacity-80" style={{ color: TENF_DEFAULT_ACCENT }}>
            <Compass className="h-3.5 w-3.5" aria-hidden />
            Fonctionnement TENF
          </Link>
          <span aria-hidden>·</span>
          <Link href="/guides/espace-membre" className="inline-flex items-center gap-1 transition hover:opacity-80" style={{ color: TENF_DEFAULT_ACCENT }}>
            <Map className="h-3.5 w-3.5" aria-hidden />
            Carte espace membre
          </Link>
          <span aria-hidden>·</span>
          <Link href="/guides/partie-publique" className="inline-flex items-center gap-1 transition hover:opacity-80" style={{ color: TENF_DEFAULT_ACCENT }}>
            <BookOpen className="h-3.5 w-3.5" aria-hidden />
            Guide site public
          </Link>
        </div>
      </footer>
    </div>
  );
}

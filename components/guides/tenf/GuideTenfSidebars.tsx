"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Compass, ListChecks } from "lucide-react";
import {
  GUIDE_TENF_BASE,
  getTenfChapterBySlug,
  getTenfChapterNavIndex,
  guideTenfChapters,
  guideTenfParcoursSteps,
  relatedTenfGuides,
} from "@/lib/guides/tenf/guideTenfSiteData";
import { GuideGlassButton, guideGlassClass, guideGlassSurface } from "@/components/guides/partie-publique/guidePublicUi";

const TENF_DEFAULT = "#f472b6";

function Panel({ title, children, accent, className = "" }: { title: string; children: React.ReactNode; accent?: string; className?: string }) {
  const a = accent ?? TENF_DEFAULT;
  return (
    <section className={`rounded-2xl border p-4 ${guideGlassClass} ${className}`} style={guideGlassSurface(a, "soft")}>
      <h2 className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: `color-mix(in srgb, ${a} 75%, var(--color-text-muted))` }}>
        {title}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export function GuideTenfNavAside({ pathname }: { pathname: string }) {
  return (
    <nav aria-label="Sommaire du guide TENF" className="space-y-1.5">
      <Link
        href={GUIDE_TENF_BASE}
        className={`mb-2 flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold transition duration-300 ${guideGlassClass}`}
        style={{
          ...(pathname === GUIDE_TENF_BASE ? guideGlassSurface(TENF_DEFAULT, "soft") : { borderColor: "transparent", backgroundColor: "transparent" }),
          color: pathname === GUIDE_TENF_BASE ? "var(--color-text)" : "var(--color-text-secondary)",
        }}
        aria-current={pathname === GUIDE_TENF_BASE ? "page" : undefined}
      >
        Accueil du guide
      </Link>
      {guideTenfChapters.map((chapter) => {
        const href = `${GUIDE_TENF_BASE}/${chapter.slug}`;
        const active = pathname === href;
        const Icon = chapter.icon;
        return (
          <Link
            key={chapter.slug}
            href={href}
            className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-sm font-medium transition duration-300 ${active ? guideGlassClass : ""}`}
            style={{
              ...(active ? guideGlassSurface(chapter.accent, "soft") : { borderColor: "transparent", backgroundColor: "transparent" }),
              color: active ? "var(--color-text)" : "var(--color-text-secondary)",
            }}
            aria-current={active ? "page" : undefined}
          >
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white shadow-sm"
              style={{
                background: `linear-gradient(135deg, color-mix(in srgb, ${chapter.accent} 90%, white), color-mix(in srgb, ${chapter.accent} 40%, #0f172a))`,
              }}
            >
              <Icon className="h-4 w-4" aria-hidden />
            </span>
            <span className="min-w-0 leading-snug">
              <span className="block text-[10px] font-bold uppercase tracking-wide opacity-70" style={{ color: chapter.accent }}>
                {chapter.emoji} {chapter.menuLabel}
              </span>
              <span className="block truncate">{chapter.title}</span>
            </span>
          </Link>
        );
      })}
      <Link
        href={`${GUIDE_TENF_BASE}/parcours`}
        className={`mt-1 flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition duration-300 ${pathname === `${GUIDE_TENF_BASE}/parcours` ? guideGlassClass : ""}`}
        style={{
          ...(pathname === `${GUIDE_TENF_BASE}/parcours` ? guideGlassSurface(TENF_DEFAULT, "soft") : { borderColor: "transparent" }),
          color: pathname === `${GUIDE_TENF_BASE}/parcours` ? "var(--color-text)" : "var(--color-text-secondary)",
        }}
        aria-current={pathname === `${GUIDE_TENF_BASE}/parcours` ? "page" : undefined}
      >
        <ListChecks className="h-4 w-4 shrink-0" style={{ color: TENF_DEFAULT }} aria-hidden />
        Parcours découverte
      </Link>
    </nav>
  );
}

export function GuideTenfRightAside({ pathname }: { pathname: string }) {
  const parcoursHref = `${GUIDE_TENF_BASE}/parcours`;
  const slugMatch = pathname.match(/^\/guides\/tenf\/([^/]+)$/);
  const slug = slugMatch?.[1];
  const chapter = slug ? getTenfChapterBySlug(slug) : undefined;
  const chapterIdx = slug ? getTenfChapterNavIndex(slug) : -1;
  const prev = chapterIdx > 0 ? guideTenfChapters[chapterIdx - 1] : null;
  const next = chapterIdx >= 0 && chapterIdx < guideTenfChapters.length - 1 ? guideTenfChapters[chapterIdx + 1] : null;
  const accent = chapter?.accent ?? TENF_DEFAULT;

  return (
    <aside className="space-y-3" aria-label="Raccourcis du guide TENF">
      <Panel title="Prochaine étape" accent={accent}>
        <GuideGlassButton href="/fonctionnement-tenf/decouvrir" variant="primary" accent={accent} className="w-full !py-3">
          Découvrir TENF
          <ArrowRight className="h-4 w-4" aria-hidden />
        </GuideGlassButton>
        <GuideGlassButton href="/member/dashboard" variant="glass" accent={accent} className="mt-2 w-full !py-2 text-xs">
          Tableau de bord
        </GuideGlassButton>
      </Panel>

      {pathname !== parcoursHref ? (
        <Panel title="Parcours express" accent={TENF_DEFAULT}>
          <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
            {guideTenfParcoursSteps.length} étapes guidées (~30 min).
          </p>
          <Link href={parcoursHref} className="mt-3 inline-flex items-center gap-1 text-sm font-semibold transition hover:gap-1.5" style={{ color: TENF_DEFAULT }}>
            Voir le parcours
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </Panel>
      ) : null}

      {(prev || next) && chapter ? (
        <Panel title="Navigation" accent={chapter.accent}>
          <div className="space-y-2">
            {prev ? (
              <Link href={`${GUIDE_TENF_BASE}/${prev.slug}`} className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition ${guideGlassClass}`} style={guideGlassSurface(prev.accent, "soft")}>
                <ArrowLeft className="h-3.5 w-3.5 shrink-0" aria-hidden />
                {prev.menuLabel}
              </Link>
            ) : null}
            {next ? (
              <Link href={`${GUIDE_TENF_BASE}/${next.slug}`} className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition ${guideGlassClass}`} style={guideGlassSurface(next.accent, "soft")}>
                {next.menuLabel}
                <ArrowRight className="h-3.5 w-3.5 shrink-0 ml-auto" aria-hidden />
              </Link>
            ) : null}
          </div>
        </Panel>
      ) : null}

      <Panel title="Autres guides">
        <ul className="space-y-1.5">
          {relatedTenfGuides.map((g) => (
            <li key={g.href}>
              <Link href={g.href} className={`block rounded-xl border px-2.5 py-2 transition duration-300 ${guideGlassClass}`} style={guideGlassSurface(g.color, "soft")}>
                <span className="text-xs font-semibold" style={{ color: g.color }}>
                  {g.label}
                </span>
                <span className="mt-0.5 block text-[10px] leading-snug opacity-80" style={{ color: "var(--color-text-secondary)" }}>
                  {g.description}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel title="Référence officielle" accent="#94a3b8">
        <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
          Pages /fonctionnement-tenf pour le détail pérenne.
        </p>
        <Link href="/fonctionnement-tenf/decouvrir" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold transition hover:opacity-80" style={{ color: TENF_DEFAULT }}>
          <Compass className="h-3.5 w-3.5" aria-hidden />
          Ouvrir →
        </Link>
      </Panel>
    </aside>
  );
}

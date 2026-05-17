"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Clock, Target } from "lucide-react";
import {
  GUIDE_TENF_BASE,
  getTenfChapterBySlug,
  getTenfChapterNavIndex,
  guideTenfChapters,
} from "@/lib/guides/tenf/guideTenfSiteData";
import {
  GuideAccentOrb,
  GuideCallout,
  GuideRichText,
  guideGlassClass,
  guideGlassSurface,
} from "@/components/guides/partie-publique/guidePublicUi";
import GuideTenfBlockContent, { GuideTenfChapterLinks } from "./GuideTenfBlockContent";

export default function GuideTenfChapterView({ slug }: { slug: string }) {
  const chapter = getTenfChapterBySlug(slug);

  if (!chapter) {
    return (
      <p className={`rounded-2xl border p-6 text-center ${guideGlassClass}`} style={guideGlassSurface("#f472b6", "soft")}>
        Chapitre introuvable.
      </p>
    );
  }

  const idx = getTenfChapterNavIndex(slug);
  const prev = idx > 0 ? guideTenfChapters[idx - 1] : null;
  const next = idx < guideTenfChapters.length - 1 ? guideTenfChapters[idx + 1] : null;
  const Icon = chapter.icon;
  const { accent } = chapter;

  return (
    <article className="space-y-2">
      <Link
        href={GUIDE_TENF_BASE}
        className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-sm font-medium transition duration-300 ${guideGlassClass}`}
        style={guideGlassSurface(accent, "soft")}
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Accueil du guide
      </Link>

      <header className={`relative mt-4 overflow-hidden rounded-3xl border ${guideGlassClass}`} style={guideGlassSurface(accent, "lifted")}>
        <GuideAccentOrb accent={accent} className="-right-20 -top-20 h-56 w-56 opacity-50" />
        <div className="relative p-6 sm:p-8">
          <div className="flex flex-wrap items-start gap-4">
            <span
              className="flex h-14 w-14 items-center justify-center rounded-2xl border text-2xl"
              style={{
                borderColor: `color-mix(in srgb, ${accent} 50%, transparent)`,
                background: `linear-gradient(135deg, color-mix(in srgb, ${accent} 90%, white), color-mix(in srgb, ${accent} 40%, #0f172a))`,
              }}
              aria-hidden
            >
              {chapter.emoji}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-[0.12em]" style={{ color: accent }}>
                Guide TENF · {chapter.menuLabel}
              </p>
              <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl" style={{ color: "var(--color-text)" }}>
                {chapter.title}
              </h1>
              <p className="mt-2 text-sm sm:text-base" style={{ color: "var(--color-text-secondary)" }}>
                {chapter.subtitle}
              </p>
              <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color: "var(--color-text-muted)" }}>
                <Clock className="h-3.5 w-3.5" aria-hidden />
                Lecture ~{chapter.readTime}
              </p>
            </div>
            <span
              className="hidden h-12 w-12 items-center justify-center rounded-2xl border sm:flex"
              style={{
                borderColor: `color-mix(in srgb, ${accent} 50%, transparent)`,
                background: `linear-gradient(135deg, color-mix(in srgb, ${accent} 25%, transparent), var(--color-card))`,
              }}
            >
              <Icon className="h-6 w-6" style={{ color: accent }} aria-hidden />
            </span>
          </div>
        </div>
      </header>

      <GuideCallout variant="goal" title="Ce chapitre est pour toi si…" icon={Target} accent={accent} className="mt-6">
        <GuideRichText text={chapter.goal} />
      </GuideCallout>

      <div className="mt-8">
        <GuideTenfBlockContent chapter={chapter} />
      </div>

      <GuideTenfChapterLinks chapter={chapter} />

      <nav className="mt-12 flex flex-col gap-3 border-t pt-8 sm:flex-row sm:justify-between xl:hidden" style={{ borderColor: "color-mix(in srgb, white 8%, var(--color-border))" }} aria-label="Chapitre précédent et suivant">
        {prev ? (
          <Link href={`${GUIDE_TENF_BASE}/${prev.slug}`} className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold ${guideGlassClass}`} style={guideGlassSurface(prev.accent, "soft")}>
            <ArrowLeft className="h-4 w-4" aria-hidden />
            ← {prev.menuLabel}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link href={`${GUIDE_TENF_BASE}/${next.slug}`} className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold sm:ml-auto ${guideGlassClass}`} style={guideGlassSurface(next.accent, "soft")}>
            {next.menuLabel} →
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        ) : null}
      </nav>
    </article>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  Clock,
  ExternalLink,
  Lightbulb,
  ListOrdered,
  Lock,
  Target,
} from "lucide-react";
import {
  GUIDE_PUBLIC_BASE,
  getChapterBySlug,
  getChapterNavIndex,
  guideChapters,
  type GuideChapter,
  type GuidePageEntry,
} from "@/lib/guides/partie-publique/guidePublicSiteData";
import {
  GUIDE_FLUID,
  GuideAccentOrb,
  GuideCallout,
  GuideGlassButton,
  GuideGlassCard,
  GuideRichText,
  GuideSectionHeading,
  guideGlassClass,
  guideGlassSurface,
} from "./guidePublicUi";

function PageCard({ page, index, accent }: { page: GuidePageEntry; index: number; accent: string }) {
  return (
    <li className="list-none">
      <GuideGlassCard accent={accent} className="flex h-full flex-col">
        <div className="flex flex-1 flex-col p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold tabular-nums"
              style={{
                backgroundColor: `color-mix(in srgb, ${accent} 22%, transparent)`,
                color: accent,
                border: `1px solid color-mix(in srgb, ${accent} 35%, transparent)`,
              }}
            >
              {index + 1}
            </span>
            {page.memberAction ? (
              <span
                className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${guideGlassClass}`}
                style={{
                  borderColor: "color-mix(in srgb, #f59e0b 45%, transparent)",
                  color: "#fbbf24",
                  backgroundColor: "color-mix(in srgb, #f59e0b 14%, transparent)",
                }}
              >
                <Lock className="h-3 w-3" aria-hidden />
                Connexion requise
              </span>
            ) : null}
          </div>
          <h3 className="mt-3 text-base font-bold leading-snug sm:text-lg" style={{ color: "var(--color-text)" }}>
            {page.label}
          </h3>
          <p className="mt-2 flex-1 text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
            {page.description}
          </p>
          {page.when ? (
            <p className={`mt-3 flex items-start gap-2 rounded-xl border px-3 py-2 text-xs leading-relaxed ${guideGlassClass}`} style={guideGlassSurface(accent, "soft")}>
              <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: accent }} aria-hidden />
              <span>
                <strong style={{ color: "var(--color-text)" }}>Quand y aller :</strong> {page.when}
              </span>
            </p>
          ) : null}
        </div>
        <div className="border-t px-4 py-3 sm:px-5" style={{ borderColor: `color-mix(in srgb, ${accent} 18%, var(--color-border))` }}>
          <GuideGlassButton href={page.href} variant="primary" accent={accent} className="w-full sm:w-auto">
            Ouvrir la page
            <ExternalLink className="h-4 w-4" aria-hidden />
          </GuideGlassButton>
        </div>
      </GuideGlassCard>
    </li>
  );
}

function PageList({
  title,
  subtitle,
  pages,
  accent,
  startIndex = 0,
}: {
  title: string;
  subtitle?: string;
  pages: GuideChapter["pages"];
  accent: string;
  startIndex?: number;
}) {
  return (
    <section className="mt-12">
      <GuideSectionHeading title={title} subtitle={subtitle} accent={accent} />
      <ul className={`mt-6 ${GUIDE_FLUID.pageCardGrid}`}>
        {pages.map((page, i) => (
          <PageCard key={page.href + page.label} page={page} index={startIndex + i} accent={accent} />
        ))}
      </ul>
    </section>
  );
}

export default function GuideChapterView({ slug }: { slug: string }) {
  const chapter = getChapterBySlug(slug);
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  if (!chapter) {
    return (
      <p className={`rounded-2xl border p-6 text-center ${guideGlassClass}`} style={guideGlassSurface("#a78bfa", "soft")}>
        Chapitre introuvable.
      </p>
    );
  }

  const idx = getChapterNavIndex(slug);
  const prev = idx > 0 ? guideChapters[idx - 1] : null;
  const next = idx < guideChapters.length - 1 ? guideChapters[idx + 1] : null;
  const Icon = chapter.icon;
  const { accent } = chapter;

  return (
    <article className="space-y-2">
      <Link
        href={GUIDE_PUBLIC_BASE}
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
              className="flex h-14 w-14 items-center justify-center rounded-2xl border text-white"
              style={{
                borderColor: `color-mix(in srgb, ${accent} 50%, transparent)`,
                background: `linear-gradient(135deg, color-mix(in srgb, ${accent} 90%, white), color-mix(in srgb, ${accent} 40%, #0f172a))`,
                boxShadow: `0 8px 24px -6px color-mix(in srgb, ${accent} 45%, transparent)`,
              }}
            >
              <Icon className="h-7 w-7" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-[0.12em]" style={{ color: accent }}>
                Menu site · {chapter.menuLabel}
              </p>
              <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl" style={{ color: "var(--color-text)" }}>
                {chapter.title}
              </h1>
              <p className="mt-2 text-sm sm:text-base" style={{ color: "var(--color-text-secondary)" }}>
                {chapter.subtitle}
              </p>
              <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color: "var(--color-text-muted)" }}>
                <Clock className="h-3.5 w-3.5" aria-hidden />
                Lecture ~{chapter.readTime} · {chapter.pages.length} pages du menu
              </p>
            </div>
          </div>
          <p className="relative mt-6 text-sm leading-relaxed sm:text-base" style={{ color: "var(--color-text-secondary)" }}>
            <GuideRichText text={chapter.intro} />
          </p>
        </div>
      </header>

      <GuideCallout variant="goal" title="Ce chapitre est pour toi si…" icon={Target} accent={accent} className="mt-6">
        {chapter.goal}
      </GuideCallout>

      {chapter.recommendedPath.length > 0 ? (
        <GuideCallout variant="info" title="Ordre de lecture conseillé" icon={ListOrdered} accent={accent} className="mt-4">
          <ol className="mt-1 list-decimal space-y-1 pl-5">
            {chapter.recommendedPath.map((label) => (
              <li key={label}>{label}</li>
            ))}
          </ol>
          <p className="mt-3 text-xs" style={{ color: "var(--color-text-muted)" }}>
            Tu peux sauter une étape si tu sais déjà où tu vas.
          </p>
        </GuideCallout>
      ) : null}

      {chapter.tips.length > 0 ? (
        <GuideCallout variant="tip" title="Conseils pratiques" icon={Lightbulb} accent={accent} className="mt-4">
          <ul className="mt-1 list-disc space-y-2 pl-5">
            {chapter.tips.map((tip) => (
              <li key={tip}>
                <GuideRichText text={tip} />
              </li>
            ))}
          </ul>
        </GuideCallout>
      ) : null}

      <PageList
        title="Pages du menu"
        subtitle="Chaque carte correspond à une entrée du bandeau du site. Lis la description, vérifie « Quand y aller », puis ouvre la page quand tu es prêt·e."
        pages={chapter.pages}
        accent={accent}
      />

      {chapter.extraPages && chapter.extraPages.length > 0 ? (
        <PageList
          title="Pages complémentaires"
          subtitle="Même logique : ces liens ne sont pas dans le menu principal mais restent utiles selon ta situation."
          pages={chapter.extraPages}
          accent={accent}
          startIndex={chapter.pages.length}
        />
      ) : null}

      {chapter.faq.length > 0 ? (
        <section className="mt-14">
          <GuideSectionHeading title="Questions sur ce chapitre" subtitle="Avant de cliquer sur le site." accent={accent} />
          <div className="mt-6 space-y-2">
            {chapter.faq.map((item) => {
              const open = openFaq === item.q;
              return (
                <div key={item.q} className={`overflow-hidden rounded-2xl border transition duration-300 ${guideGlassClass}`} style={guideGlassSurface(accent, open ? "base" : "soft")}>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left"
                    onClick={() => setOpenFaq(open ? null : item.q)}
                    aria-expanded={open}
                  >
                    <span className="text-sm font-semibold sm:text-base" style={{ color: "var(--color-text)" }}>
                      {item.q}
                    </span>
                    <ChevronDown className={`h-5 w-5 shrink-0 transition ${open ? "rotate-180" : ""}`} style={{ color: accent }} aria-hidden />
                  </button>
                  {open ? (
                    <p className="border-t px-4 pb-4 pt-2 text-sm leading-relaxed" style={{ borderColor: `color-mix(in srgb, ${accent} 20%, var(--color-border))`, color: "var(--color-text-secondary)" }}>
                      {item.a}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      <nav className="mt-12 flex flex-col gap-3 border-t pt-8 sm:flex-row sm:justify-between xl:hidden" style={{ borderColor: "color-mix(in srgb, white 8%, var(--color-border))" }} aria-label="Chapitre précédent et suivant">
        {prev ? (
          <Link href={`${GUIDE_PUBLIC_BASE}/${prev.slug}`} className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold ${guideGlassClass}`} style={guideGlassSurface(prev.accent, "soft")}>
            <ArrowLeft className="h-4 w-4" aria-hidden />
            ← {prev.menuLabel}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link href={`${GUIDE_PUBLIC_BASE}/${next.slug}`} className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold sm:ml-auto ${guideGlassClass}`} style={guideGlassSurface(next.accent, "soft")}>
            {next.menuLabel} →
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        ) : null}
      </nav>
    </article>
  );
}

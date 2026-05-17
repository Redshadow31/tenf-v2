"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, ListChecks } from "lucide-react";
import { GUIDE_PUBLIC_BASE, guideParcoursSteps } from "@/lib/guides/partie-publique/guidePublicSiteData";
import {
  GuideAccentOrb,
  GuideGlassButton,
  GuideKpiStrip,
  GuideSectionHeading,
  guideGlassClass,
  guideGlassSurface,
} from "./guidePublicUi";

export default function GuideParcoursView() {
  return (
    <article className="space-y-10">
      <Link
        href={GUIDE_PUBLIC_BASE}
        className="inline-flex items-center gap-1.5 text-sm font-medium transition hover:opacity-80"
        style={{ color: "var(--color-text-secondary)" }}
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Retour à l&apos;accueil du guide
      </Link>

      <header className={`relative overflow-hidden rounded-3xl border p-6 sm:p-8 ${guideGlassClass}`} style={guideGlassSurface("#a78bfa", "lifted")}>
        <GuideAccentOrb accent="#a78bfa" className="-right-16 -top-16 h-48 w-48 opacity-45" />
        <div className="relative">
          <span
            className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide"
            style={{ borderColor: "var(--color-border)", color: "var(--color-primary)" }}
          >
            <ListChecks className="h-3.5 w-3.5" aria-hidden />
            Parcours recommandé
          </span>
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight sm:text-3xl" style={{ color: "var(--color-text)" }}>
            Ta première visite sur TENF
          </h1>
          <p className="mt-3 max-w-[min(65ch,100%)] text-sm leading-relaxed sm:text-base" style={{ color: "var(--color-text-secondary)" }}>
            Quatre étapes pour passer de « je ne connais pas » à « je sais comment rejoindre ». Tu peux faire une pause
            entre chaque étape — le guide reste accessible. Temps total estimé :{" "}
            <strong style={{ color: "var(--color-text)" }}>environ 40 minutes</strong> si tu lis les pages suggérées.
          </p>
          <GuideKpiStrip
            items={[
              { label: "Étapes", value: "4" },
              { label: "Sans compte", value: "Oui", hint: "Étapes 1 à 3" },
              { label: "Dernière étape", value: "Rejoindre" },
              { label: "Alternative", value: "Chapitres", hint: "Navigation libre" },
            ]}
          />
        </div>
      </header>

      <GuideSectionHeading
        title="Les 4 étapes"
        subtitle="Suis l'ordre pour une découverte structurée, ou ouvre directement le chapitre qui t'intéresse depuis le menu."
      />

      <ol className="relative mt-6 space-y-8">
        {guideParcoursSteps.map((step, index) => {
          const isLast = index === guideParcoursSteps.length - 1;
          return (
            <li key={step.id} className="relative pl-0 sm:pl-2">
              <div className="flex gap-4 sm:gap-6">
                <div className="flex shrink-0 flex-col items-center">
                  <span
                    className="flex h-11 w-11 items-center justify-center rounded-2xl border text-sm font-bold shadow-md"
                    style={{
                      borderColor: "color-mix(in srgb, var(--color-primary) 50%, transparent)",
                      background: "linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 25%, var(--color-card)), var(--color-card))",
                      color: "var(--color-text)",
                    }}
                  >
                    {index + 1}
                  </span>
                  {!isLast ? (
                    <span
                      className="mt-2 hidden h-full min-h-[4rem] w-0.5 flex-1 sm:block"
                      style={{ backgroundColor: "var(--color-border)" }}
                      aria-hidden
                    />
                  ) : null}
                </div>
                <div className={`min-w-0 flex-1 rounded-2xl border p-5 sm:p-6 ${guideGlassClass}`} style={guideGlassSurface("#a78bfa", "base")}>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                      style={{
                        backgroundColor: "color-mix(in srgb, var(--color-primary) 15%, transparent)",
                        color: "var(--color-primary)",
                      }}
                    >
                      {step.duration}
                    </span>
                    {isLast ? (
                      <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-400">Étape finale</span>
                    ) : null}
                  </div>
                  <h2 className="mt-2 text-lg font-bold sm:text-xl" style={{ color: "var(--color-text)" }}>
                    {step.title}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                    {step.body}
                  </p>
                  <p className="mt-4 text-xs font-bold uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>
                    Pages à ouvrir
                  </p>
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {step.links.map((link) => (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          className="inline-flex items-center gap-1 rounded-xl border px-3 py-2 text-xs font-semibold transition hover:border-violet-400/40 hover:bg-white/5"
                          style={{ borderColor: "var(--color-border)", color: "var(--color-primary)" }}
                        >
                          {link.label}
                          <ArrowRight className="h-3 w-3" aria-hidden />
                        </Link>
                      </li>
                    ))}
                  </ul>
                  {step.chapterSlug ? (
                    <Link
                      href={`${GUIDE_PUBLIC_BASE}/${step.chapterSlug}`}
                      className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold transition hover:gap-2"
                      style={{ color: "var(--color-text)" }}
                    >
                      Voir tout le chapitre du guide
                      <ArrowRight className="h-4 w-4" style={{ color: "var(--color-primary)" }} aria-hidden />
                    </Link>
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      <section
        className="rounded-3xl border p-6 text-center sm:p-10"
        style={{
          borderColor: "color-mix(in srgb, #34d399 35%, transparent)",
          background: "linear-gradient(135deg, color-mix(in srgb, #34d399 12%, var(--color-card)), var(--color-card))",
        }}
      >
        <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-400" aria-hidden />
        <p className="mt-4 text-lg font-bold" style={{ color: "var(--color-text)" }}>
          Tu as fait le tour ? Passe à l&apos;action.
        </p>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
          Le hub Rejoindre centralise la procédure officielle. Pour créer ton compte Discord et lier Twitch, suis ensuite
          le tutoriel pas à pas.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/rejoindre"
            className="inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-bold text-white shadow-lg"
            style={{ background: "linear-gradient(135deg, var(--color-primary), #6366f1)" }}
          >
            Hub Rejoindre TENF
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <Link
            href="/rejoindre/guide-public"
            className="inline-flex items-center gap-2 rounded-2xl border px-6 py-3 text-sm font-semibold"
            style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
          >
            Tutoriel Discord / Twitch
          </Link>
        </div>
      </section>
    </article>
  );
}

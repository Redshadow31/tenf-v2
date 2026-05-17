"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, ListChecks } from "lucide-react";
import { GUIDE_MEMBER_BASE, guideMemberParcoursSteps } from "@/lib/guides/espace-membre/guideMemberSiteData";
import {
  GuideAccentOrb,
  GuideGlassButton,
  GuideKpiStrip,
  GuideSectionHeading,
  guideGlassClass,
  guideGlassSurface,
} from "@/components/guides/partie-publique/guidePublicUi";

export default function GuideMemberParcoursView() {
  return (
    <article className="space-y-10">
      <Link
        href={GUIDE_MEMBER_BASE}
        className="inline-flex items-center gap-1.5 text-sm font-medium transition hover:opacity-80"
        style={{ color: "var(--color-text-secondary)" }}
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Retour à l&apos;accueil du guide
      </Link>

      <header className={`relative overflow-hidden rounded-3xl border p-6 sm:p-8 ${guideGlassClass}`} style={guideGlassSurface("#818cf8", "lifted")}>
        <GuideAccentOrb accent="#818cf8" className="-right-16 -top-16 h-48 w-48 opacity-45" />
        <div className="relative">
          <span
            className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide"
            style={{ borderColor: "var(--color-border)", color: "#818cf8" }}
          >
            <ListChecks className="h-3.5 w-3.5" aria-hidden />
            Parcours recommandé
          </span>
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight sm:text-3xl" style={{ color: "var(--color-text)" }}>
            Ta première connexion à l&apos;espace membre
          </h1>
          <p className="mt-3 max-w-[min(65ch,100%)] text-sm leading-relaxed sm:text-base" style={{ color: "var(--color-text-secondary)" }}>
            Quatre étapes pour passer de « je viens de me connecter » à « je sais où aller ». Tu peux faire une pause entre
            chaque étape. Temps total estimé :{" "}
            <strong style={{ color: "var(--color-text)" }}>environ 20 minutes</strong> si tu ouvres les pages suggérées.
          </p>
          <GuideKpiStrip
            accent="#818cf8"
            items={[
              { label: "Étapes", value: "4" },
              { label: "Connexion", value: "Étape 1", hint: "Discord obligatoire" },
              { label: "Profil", value: "Étape 3", hint: "Fiche + planning" },
              { label: "Alternative", value: "Chapitres", hint: "Navigation libre" },
            ]}
          />
        </div>
      </header>

      <GuideSectionHeading
        title="Les 4 étapes"
        subtitle="Suis l'ordre pour une prise en main structurée, ou ouvre directement le chapitre qui t'intéresse depuis le menu."
      />

      <ol className="relative mt-6 space-y-8">
        {guideMemberParcoursSteps.map((step, index) => {
          const isLast = index === guideMemberParcoursSteps.length - 1;
          return (
            <li key={step.id} className="relative pl-0 sm:pl-2">
              <div className="flex gap-4 sm:gap-6">
                <div className="flex shrink-0 flex-col items-center">
                  <span
                    className="flex h-11 w-11 items-center justify-center rounded-2xl border text-sm font-bold shadow-md"
                    style={{
                      borderColor: "color-mix(in srgb, #818cf8 50%, transparent)",
                      background: "linear-gradient(135deg, color-mix(in srgb, #818cf8 25%, var(--color-card)), var(--color-card))",
                      color: "var(--color-text)",
                    }}
                  >
                    {index + 1}
                  </span>
                  {!isLast ? (
                    <span className="mt-2 hidden h-full min-h-[4rem] w-0.5 flex-1 sm:block" style={{ backgroundColor: "var(--color-border)" }} aria-hidden />
                  ) : null}
                </div>
                <div className={`min-w-0 flex-1 rounded-2xl border p-5 sm:p-6 ${guideGlassClass}`} style={guideGlassSurface("#818cf8", "base")}>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                      style={{
                        backgroundColor: "color-mix(in srgb, #818cf8 15%, transparent)",
                        color: "#818cf8",
                      }}
                    >
                      {step.duration}
                    </span>
                    {isLast ? <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-400">Étape finale</span> : null}
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
                          className="inline-flex items-center gap-1 rounded-xl border px-3 py-2 text-xs font-semibold transition hover:border-indigo-400/40 hover:bg-white/5"
                          style={{ borderColor: "var(--color-border)", color: "#818cf8" }}
                        >
                          {link.label}
                          <ArrowRight className="h-3 w-3" aria-hidden />
                        </Link>
                      </li>
                    ))}
                  </ul>
                  {step.chapterSlug ? (
                    <Link
                      href={`${GUIDE_MEMBER_BASE}/${step.chapterSlug}`}
                      className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold transition hover:gap-2"
                      style={{ color: "var(--color-text)" }}
                    >
                      Voir tout le chapitre du guide
                      <ArrowRight className="h-4 w-4" style={{ color: "#818cf8" }} aria-hidden />
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
          Le guide pas à pas sous Rejoindre détaille chaque écran. Ici, tu as la carte complète du menu latéral pour naviguer
          librement.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <GuideGlassButton href="/member/dashboard" variant="primary" accent="#818cf8" className="!px-6 !py-3">
            Tableau de bord
            <ArrowRight className="h-4 w-4" aria-hidden />
          </GuideGlassButton>
          <GuideGlassButton href="/rejoindre/guide-espace-membre" variant="glass" accent="#818cf8" className="!px-6 !py-3">
            Guide pas à pas
          </GuideGlassButton>
        </div>
      </section>
    </article>
  );
}

"use client";

import Link from "next/link";
import { ArrowRight, LayoutDashboard, ListChecks, LogIn, Sparkles } from "lucide-react";
import {
  GUIDE_MEMBER_BASE,
  getGuideMemberStats,
  guideMemberChapters,
  hubMemberFaq,
  hubMemberPersonas,
  hubQuickStart,
  relatedMemberGuides,
} from "@/lib/guides/espace-membre/guideMemberSiteData";
import {
  GUIDE_FLUID,
  GuideAccentOrb,
  GuideGlassButton,
  GuideKpiStrip,
  GuideSectionHeading,
  guideGlassClass,
  guideGlassSurface,
} from "@/components/guides/partie-publique/guidePublicUi";
import GuideMemberChecklist from "./GuideMemberChecklist";

export default function GuideMemberHubView() {
  const stats = getGuideMemberStats();

  return (
    <div className="space-y-14 sm:space-y-16">
      <section className={`relative overflow-hidden rounded-3xl border ${guideGlassClass}`} style={guideGlassSurface("#818cf8", "lifted")}>
        <GuideAccentOrb accent="#818cf8" className="-left-20 -top-24 h-64 w-64 opacity-50" />
        <GuideAccentOrb accent="#6366f1" className="-right-16 top-0 h-48 w-48 opacity-35" />
        <div className="relative p-6 sm:p-10 lg:p-12">
          <span
            className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] backdrop-blur-sm"
            style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
          >
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" aria-hidden />
            Carte /member · menu latéral réel
          </span>
          <h1
            className="mt-5 max-w-[min(42ch,100%)] text-[clamp(1.75rem,1.5rem+1.5vw,3rem)] font-extrabold leading-[1.1] tracking-tight"
            style={{ color: "var(--color-text)" }}
          >
            Ne te perds plus dans{" "}
            <span className="bg-gradient-to-r from-indigo-300 via-violet-300 to-fuchsia-300 bg-clip-text text-transparent">
              l&apos;espace membre
            </span>
          </h1>
          <p className="mt-4 max-w-[min(65ch,100%)] text-[clamp(0.9375rem,0.875rem+0.35vw,1.125rem)] leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
            Ce guide t&apos;accompagne page par page : <strong style={{ color: "var(--color-text)" }}>où cliquer</strong>,{" "}
            <strong style={{ color: "var(--color-text)" }}>à quoi ça sert</strong> et{" "}
            <strong style={{ color: "var(--color-text)" }}>quand y aller</strong> — aligné sur la sidebar de ton espace membre.
          </p>

          <GuideKpiStrip
            accent="#818cf8"
            items={[
              { label: "Sections", value: String(stats.chapters), hint: "Menu latéral" },
              { label: "Pages", value: String(stats.menuPages), hint: "Liens /member" },
              { label: "Lecture", value: "Sans compte", hint: "Pour ce guide" },
              { label: "Parcours", value: "4 étapes", hint: "~20 min première connexion" },
            ]}
          />

          <div className="mt-8 flex flex-wrap gap-3">
            <GuideGlassButton href={`${GUIDE_MEMBER_BASE}/parcours`} variant="primary" accent="#818cf8">
              <ListChecks className="h-4 w-4" aria-hidden />
              Parcours première connexion
            </GuideGlassButton>
            <GuideGlassButton href={`${GUIDE_MEMBER_BASE}/accueil`} variant="ghost" accent="#6366f1">
              <LayoutDashboard className="h-4 w-4" aria-hidden />
              Commencer par Accueil
            </GuideGlassButton>
            <GuideGlassButton href="/auth/login" variant="glass" accent="#94a3b8">
              <LogIn className="h-4 w-4" aria-hidden />
              Connexion Discord
            </GuideGlassButton>
          </div>
        </div>
      </section>

      <section>
        <GuideSectionHeading
          title="Comment utiliser ce guide"
          subtitle="Trois étapes simples — tu peux revenir ici à tout moment depuis le menu latéral sur ordinateur."
        />
        <ol className={`mt-6 ${GUIDE_FLUID.cardGrid}`}>
          {hubQuickStart.map((item) => (
            <li key={item.step} className={`list-none rounded-2xl border p-5 ${guideGlassClass}`} style={guideGlassSurface("#818cf8", "soft")}>
              <div className="flex gap-3">
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
                  style={{ background: "linear-gradient(135deg, #818cf8, #6366f1)" }}
                  aria-hidden
                >
                  {item.step}
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold leading-snug" style={{ color: "var(--color-text)" }}>
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                    {item.body}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <GuideSectionHeading
          title="Tu es plutôt…"
          subtitle="Choisis la carte qui correspond à ta situation : le guide t'envoie directement au bon chapitre."
        />
        <div className={`mt-6 ${GUIDE_FLUID.cardGrid}`}>
          {hubMemberPersonas.map((persona) => (
            <Link
              key={persona.id}
              href={persona.href}
              className={`group relative block overflow-hidden rounded-2xl border p-5 transition duration-300 ${guideGlassClass} hover:-translate-y-0.5`}
              style={guideGlassSurface(persona.accent, "base")}
            >
              <div
                className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-30 blur-2xl transition group-hover:opacity-50"
                style={{ backgroundColor: persona.accent }}
                aria-hidden
              />
              <span className="relative text-2xl" aria-hidden>
                {persona.emoji}
              </span>
              <h3 className="relative mt-3 text-base font-bold" style={{ color: "var(--color-text)" }}>
                {persona.title}
              </h3>
              <p className="relative mt-2 text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                {persona.description}
              </p>
              <span className="relative mt-4 inline-flex items-center gap-1 text-sm font-semibold" style={{ color: persona.accent }}>
                {persona.cta}
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <GuideSectionHeading
          title="Chapitres du guide"
          subtitle="Même ordre que la barre latérale membre — chaque carte ouvre la liste détaillée des pages avec conseils et FAQ."
        />
        <div className={`mt-6 ${GUIDE_FLUID.cardGrid}`}>
          {guideMemberChapters.map((chapter, index) => {
            const Icon = chapter.icon;
            return (
              <Link
                key={chapter.slug}
                href={`${GUIDE_MEMBER_BASE}/${chapter.slug}`}
                className={`group relative block overflow-hidden rounded-3xl border p-5 transition duration-300 ${guideGlassClass} hover:-translate-y-1`}
                style={guideGlassSurface(chapter.accent, "base")}
              >
                <span className="absolute right-4 top-4 text-4xl font-black tabular-nums opacity-[0.07]" style={{ color: chapter.accent }} aria-hidden>
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div
                  className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full opacity-25 blur-2xl transition group-hover:opacity-50"
                  style={{ backgroundColor: chapter.accent }}
                  aria-hidden
                />
                <span
                  className="relative flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-md"
                  style={{ background: `linear-gradient(135deg, ${chapter.accent}, #0f172a)` }}
                >
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <p className="relative mt-4 text-xs font-bold uppercase tracking-wide" style={{ color: chapter.accent }}>
                  {chapter.menuLabel}
                </p>
                <h3 className="relative mt-1 text-lg font-bold" style={{ color: "var(--color-text)" }}>
                  {chapter.title}
                </h3>
                <p className="relative mt-2 line-clamp-2 text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                  {chapter.goal}
                </p>
                <p className="relative mt-3 text-xs font-semibold" style={{ color: "var(--color-text-muted)" }}>
                  {chapter.pages.length} pages · ~{chapter.readTime}
                </p>
                <span className="relative mt-4 inline-flex items-center gap-1 text-sm font-semibold" style={{ color: "#818cf8" }}>
                  Explorer le chapitre
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
                </span>
              </Link>
            );
          })}
          <Link
            href={`${GUIDE_MEMBER_BASE}/parcours`}
            className={`group relative block overflow-hidden rounded-3xl border border-dashed p-5 transition duration-300 ${guideGlassClass} hover:-translate-y-1`}
            style={guideGlassSurface("#818cf8", "soft")}
          >
            <ListChecks className="h-10 w-10" style={{ color: "#818cf8" }} aria-hidden />
            <h3 className="mt-4 text-lg font-bold" style={{ color: "var(--color-text)" }}>
              Parcours première connexion
            </h3>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
              4 étapes guidées de la connexion Discord à la stabilisation de ton profil — le fil rouge recommandé.
            </p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold" style={{ color: "#818cf8" }}>
              Lancer le parcours
              <ArrowRight className="h-4 w-4" aria-hidden />
            </span>
          </Link>
        </div>
      </section>

      <GuideMemberChecklist />

      <section className={`rounded-3xl border p-6 sm:p-8 ${guideGlassClass}`} style={guideGlassSurface("#818cf8", "soft")}>
        <GuideSectionHeading title="Ce guide ou un autre ?" subtitle="Plusieurs guides coexistent sur TENF — voici comment ne pas les confondre." />
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[32rem] text-left text-sm">
            <thead>
              <tr style={{ color: "var(--color-text-muted)" }}>
                <th className="pb-3 pr-4 font-bold uppercase tracking-wide text-[10px]">Guide</th>
                <th className="pb-3 pr-4 font-bold uppercase tracking-wide text-[10px]">Pour quoi ?</th>
                <th className="pb-3 font-bold uppercase tracking-wide text-[10px]">Lien</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: "var(--color-border)" }}>
              <tr>
                <td className="py-3 pr-4 font-semibold" style={{ color: "var(--color-text)" }}>
                  Ce guide (espace membre)
                </td>
                <td className="py-3 pr-4" style={{ color: "var(--color-text-secondary)" }}>
                  Carte du menu /member : où cliquer, quand
                </td>
                <td className="py-3 font-medium" style={{ color: "#818cf8" }}>
                  Tu es ici
                </td>
              </tr>
              {relatedMemberGuides.map((g) => (
                <tr key={g.href}>
                  <td className="py-3 pr-4 font-semibold" style={{ color: "var(--color-text)" }}>
                    {g.label}
                  </td>
                  <td className="py-3 pr-4" style={{ color: "var(--color-text-secondary)" }}>
                    {g.description}
                  </td>
                  <td className="py-3">
                    <Link href={g.href} className="font-semibold hover:underline" style={{ color: g.color }}>
                      Ouvrir →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="xl:hidden">
        <GuideSectionHeading title="Guides complémentaires" subtitle="À consulter pour la première prise en main ou le site public." />
        <div className={`mt-6 ${GUIDE_FLUID.cardGrid}`}>
          {relatedMemberGuides.map((g) => {
            const Icon = g.icon;
            return (
              <Link
                key={g.href}
                href={g.href}
                className={`flex gap-4 rounded-2xl border p-4 transition duration-300 ${guideGlassClass}`}
                style={guideGlassSurface(g.color, "soft")}
              >
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white"
                  style={{ background: `linear-gradient(135deg, ${g.color}, #0f172a)` }}
                >
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <p className="font-bold" style={{ color: "var(--color-text)" }}>
                    {g.label}
                  </p>
                  <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                    {g.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section>
        <GuideSectionHeading title="Questions fréquentes" subtitle="Les réponses aux doutes les plus courants avant d'ouvrir l'espace membre." />
        <dl className={`mt-6 ${GUIDE_FLUID.cardGrid}`}>
          {hubMemberFaq.map((item) => (
            <div key={item.q} className={`rounded-2xl border p-4 sm:p-5 ${guideGlassClass}`} style={guideGlassSurface("#818cf8", "soft")}>
              <dt className="font-semibold leading-snug" style={{ color: "var(--color-text)" }}>
                {item.q}
              </dt>
              <dd className="mt-2 text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                {item.a}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className={`rounded-3xl border p-6 text-center sm:p-10 ${guideGlassClass}`} style={guideGlassSurface("#818cf8", "lifted")}>
        <LayoutDashboard className="mx-auto h-8 w-8 opacity-80" style={{ color: "#818cf8" }} aria-hidden />
        <p className="mt-4 text-lg font-bold" style={{ color: "var(--color-text)" }}>
          Prêt·e à ouvrir ton espace membre ?
        </p>
        <p className="mx-auto mt-2 max-w-md text-sm" style={{ color: "var(--color-text-secondary)" }}>
          Lance le parcours guidé ou ouvre le chapitre qui correspond à ton objectif — chaque carte a un bouton direct vers la vraie page /member.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href={`${GUIDE_MEMBER_BASE}/parcours`}
            className="inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-bold text-white"
            style={{ background: "linear-gradient(135deg, #818cf8, #6366f1)" }}
          >
            Parcours 4 étapes
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <Link href="/member/dashboard" className="inline-flex items-center gap-2 rounded-2xl border px-6 py-3 text-sm font-semibold" style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}>
            Tableau de bord
          </Link>
        </div>
      </section>
    </div>
  );
}

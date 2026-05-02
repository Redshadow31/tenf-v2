import Link from "next/link";
import { discours2General, discours2Parts } from "../../evaluations/discours2/contentMai2026";

const BASE = "/admin/onboarding/discours-mai-2026";

export default function OnboardingDiscoursMai2026HomePage() {
  const firstPart = discours2Parts[0];

  return (
    <div className="min-h-[calc(100vh-6rem)] scroll-smooth bg-[linear-gradient(165deg,#0a0a0f_0%,#12101c_45%,#0d1118_100%)] text-white selection:bg-violet-500/35">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
        {/* Fil d'Ariane + titre */}
        <header className="mb-8 border-b border-white/10 pb-8">
          <nav aria-label="Fil d'Ariane" className="mb-6 flex flex-wrap items-center gap-2 text-sm text-zinc-400">
            <Link href="/admin/onboarding/contenus" className="rounded-lg px-2 py-1 transition hover:bg-white/10 hover:text-white">
              Contenus onboarding
            </Link>
            <span aria-hidden className="text-zinc-600">
              /
            </span>
            <span className="font-medium text-zinc-300">Discours mai 2026</span>
          </nav>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300/90">Onboarding · lecture staff</p>
              <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-[2.35rem] lg:leading-tight">
                Discours — version mai 2026
              </h1>
              <p className="text-base leading-relaxed text-zinc-400">{discours2General.subtitle}</p>
              <p className="inline-flex items-center gap-2 rounded-full border border-violet-500/40 bg-violet-500/15 px-4 py-1.5 text-sm font-medium text-violet-100">
                <span className="tabular-nums">{discours2Parts.length}</span>
                <span>blocs · objectifs, conseils animateur, texte oral</span>
              </p>
            </div>
            <Link
              href={`${BASE}/${firstPart.slug}`}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3.5 text-center text-sm font-semibold text-white shadow-lg shadow-violet-900/40 transition hover:bg-violet-500 hover:shadow-violet-800/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400 sm:text-base"
            >
              Démarrer le bloc 1
              <span aria-hidden>→</span>
            </Link>
          </div>
        </header>

        {/* Résumé & note */}
        <section className="mb-10 rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-xl backdrop-blur-sm sm:p-8">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/20 text-lg">⭐</span>
            Fil rouge de la réunion
          </h2>
          <blockquote className="mb-5 border-l-[3px] border-amber-400/70 pl-5 text-[17px] leading-relaxed text-zinc-100">
            {discours2General.phraseCentrale}
          </blockquote>
          <p className="rounded-xl bg-black/25 px-4 py-3 text-sm leading-relaxed text-zinc-400">{discours2General.note}</p>
        </section>

        {/* Points & conseils globaux */}
        <div className="mb-10 grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-cyan-500/25 bg-cyan-950/25 p-6 sm:p-7">
            <h2 className="mb-5 flex items-center gap-2 text-base font-semibold uppercase tracking-wide text-cyan-200/95">
              <span aria-hidden>📌</span> Vue d’ensemble (9 blocs)
            </h2>
            <ol className="space-y-3">
              {discours2General.points.map((point, i) => (
                <li
                  key={point}
                  className="flex gap-3 rounded-xl border border-cyan-500/15 bg-black/20 px-3 py-3 text-[15px] leading-snug text-zinc-200 sm:text-[15px] sm:leading-relaxed"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cyan-500/25 text-xs font-bold text-cyan-100">
                    {i + 1}
                  </span>
                  <span className="pt-0.5">{point.replace(/^\d+\)\s*/, "")}</span>
                </li>
              ))}
            </ol>
          </section>

          <section className="rounded-2xl border border-emerald-500/25 bg-emerald-950/20 p-6 sm:p-7">
            <h2 className="mb-5 flex items-center gap-2 text-base font-semibold uppercase tracking-wide text-emerald-200/95">
              <span aria-hidden>💡</span> Conseils pour l’animateur
            </h2>
            <ul className="space-y-3">
              {discours2General.conseils.map((conseil) => (
                <li
                  key={conseil}
                  className="rounded-xl border border-emerald-500/15 bg-black/20 px-4 py-3 text-[15px] leading-relaxed text-zinc-200"
                >
                  <span className="mr-2 inline-block text-emerald-400/90">▸</span>
                  {conseil}
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Liste des blocs — grandes cartes lisibles */}
        <section className="rounded-2xl border border-white/10 bg-[#12141c]/80 p-6 sm:p-8">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="text-xl font-semibold text-white">Plan du discours</h2>
            <p className="text-sm text-zinc-500">Cliquer pour ouvrir le bloc — navigation « Suivant » dans chaque page.</p>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {discours2Parts.map((part, index) => (
              <li key={part.slug}>
                <Link
                  href={`${BASE}/${part.slug}`}
                  className="group flex h-full flex-col gap-3 rounded-2xl border border-zinc-700/80 bg-zinc-900/40 p-5 transition hover:border-violet-400/60 hover:bg-violet-950/20 hover:shadow-lg hover:shadow-violet-950/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-600/25 text-xl ring-1 ring-violet-400/30 transition group-hover:bg-violet-600/40">
                      {part.emoji}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="mb-1 text-xs font-medium uppercase tracking-wider text-zinc-500">Bloc {index + 1}</p>
                      <p className="font-semibold leading-snug text-white transition group-hover:text-violet-100">{part.title}</p>
                    </div>
                  </div>
                  <p className="line-clamp-3 text-sm leading-relaxed text-zinc-400">{part.objectif}</p>
                  <span className="mt-auto pt-1 text-sm font-medium text-violet-300/90 transition group-hover:text-violet-200">
                    Ouvrir le bloc →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <div className="mt-10 flex justify-center border-t border-white/10 pt-8">
          <Link
            href={`${BASE}/${firstPart.slug}`}
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-8 py-3.5 font-semibold text-white transition hover:bg-violet-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400"
          >
            Lancer le bloc 1
            <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

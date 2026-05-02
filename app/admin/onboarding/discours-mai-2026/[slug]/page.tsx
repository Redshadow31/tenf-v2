import Link from "next/link";
import { notFound } from "next/navigation";
import { highlightDiscoursText } from "@/lib/discoursHighlight";
import { discours2Parts } from "../../../evaluations/discours2/contentMai2026";

const BASE = "/admin/onboarding/discours-mai-2026";

type PartPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function OnboardingDiscoursMai2026PartPage({ params }: PartPageProps) {
  const { slug } = await params;
  const partIndex = discours2Parts.findIndex((part) => part.slug === slug);
  if (partIndex === -1) notFound();

  const part = discours2Parts[partIndex];
  const previous = partIndex > 0 ? discours2Parts[partIndex - 1] : null;
  const next = partIndex < discours2Parts.length - 1 ? discours2Parts[partIndex + 1] : null;
  const total = discours2Parts.length;
  const progressPct = Math.round(((partIndex + 1) / total) * 100);
  const isLast = partIndex === total - 1;

  return (
    <div className="min-h-[calc(100vh-6rem)] scroll-smooth bg-[linear-gradient(165deg,#0a0a0f_0%,#12101c_45%,#0d1118_100%)] text-white selection:bg-violet-500/35">
      {/* Barre sticky : progression + accès rapide */}
      <div className="sticky top-0 z-20 border-b border-white/10 bg-[#0c0c12]/95 backdrop-blur-md supports-[backdrop-filter]:bg-[#0c0c12]/88">
        <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6 lg:max-w-[72rem]">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <Link
              href={BASE}
              className="inline-flex items-center gap-2 rounded-lg px-2 py-1 text-sm text-zinc-400 transition hover:bg-white/10 hover:text-white"
            >
              ← Plan du discours
            </Link>
            <span className="text-sm tabular-nums text-zinc-400">
              Bloc <strong className="text-white">{partIndex + 1}</strong> / {total}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-zinc-800/90" role="progressbar" aria-valuenow={partIndex + 1} aria-valuemin={1} aria-valuemax={total}>
            <div className="h-full rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 transition-[width] duration-300" style={{ width: `${progressPct}%` }} />
          </div>
          <nav aria-label="Sections de la page" className="mt-3 flex flex-wrap gap-2">
            <a
              href="#points"
              className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-zinc-300 transition hover:border-violet-400/50 hover:bg-violet-500/15 hover:text-white"
            >
              Points clés
            </a>
            <a
              href="#conseils"
              className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-zinc-300 transition hover:border-emerald-400/50 hover:bg-emerald-500/15 hover:text-white"
            >
              Conseils staff
            </a>
            <a
              href="#discours"
              className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-zinc-300 transition hover:border-amber-400/50 hover:bg-amber-500/15 hover:text-white"
            >
              Discours oral
            </a>
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:max-w-[72rem]">
        {/* En-tête bloc */}
        <header className="mb-10 scroll-mt-28 rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-950/40 via-[#1a1528] to-[#12101c] p-6 shadow-xl sm:p-8">
          <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-zinc-400">
            <span className="rounded-full bg-white/10 px-3 py-1 font-medium text-zinc-200">Bloc {partIndex + 1}</span>
            {previous ? (
              <Link href={`${BASE}/${previous.slug}`} className="hover:text-violet-300">
                ← {previous.emoji} Précédent
              </Link>
            ) : null}
            {next ? (
              <Link href={`${BASE}/${next.slug}`} className="hover:text-violet-300">
                Suivant : {next.emoji} →
              </Link>
            ) : null}
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-violet-600/30 text-3xl ring-2 ring-violet-400/40">{part.emoji}</span>
            <div className="min-w-0 flex-1">
              <h1 className="mb-3 text-2xl font-bold leading-tight tracking-tight text-white sm:text-3xl lg:text-[1.85rem]">{part.title}</h1>
              <p className="text-[17px] leading-relaxed text-zinc-300">{part.objectif}</p>
            </div>
          </div>
        </header>

        <div className="mb-10 grid gap-8 xl:grid-cols-2 xl:gap-10">
          <section id="points" className="scroll-mt-28 rounded-2xl border border-cyan-500/25 bg-cyan-950/20 p-6 sm:p-7">
            <h2 className="mb-5 flex items-center gap-2 border-b border-cyan-500/20 pb-3 text-lg font-semibold text-cyan-100">
              <span aria-hidden>📌</span> Points clés à aborder
            </h2>
            <ul className="space-y-3">
              {part.points.map((point) => (
                <li
                  key={point}
                  className="flex gap-3 rounded-xl border border-cyan-500/10 bg-black/25 px-4 py-3 text-[15px] leading-[1.65] text-zinc-200 sm:text-base sm:leading-[1.62]"
                >
                  <span className="mt-0.5 shrink-0 text-cyan-400" aria-hidden>
                    ✓
                  </span>
                  <span>{highlightDiscoursText(point, part.keywords, part.phrasesCles)}</span>
                </li>
              ))}
            </ul>
          </section>

          <section id="conseils" className="scroll-mt-28 rounded-2xl border border-emerald-500/25 bg-emerald-950/20 p-6 sm:p-7">
            <h2 className="mb-5 flex items-center gap-2 border-b border-emerald-500/20 pb-3 text-lg font-semibold text-emerald-100">
              <span aria-hidden>💡</span> Conseils pour le staff
            </h2>
            <ul className="space-y-3">
              {part.conseils.map((conseil) => (
                <li
                  key={conseil}
                  className="flex gap-3 rounded-xl border border-emerald-500/10 bg-black/25 px-4 py-3 text-[15px] leading-[1.65] text-zinc-200 sm:text-base sm:leading-[1.62]"
                >
                  <span className="mt-0.5 shrink-0 text-emerald-400" aria-hidden>
                    ➜
                  </span>
                  <span>{highlightDiscoursText(conseil, part.keywords, part.phrasesCles)}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Zone lecture : colonne type « manuscrit », peu de cadres pour garder le fil */}
        <section
          id="discours"
          className="scroll-mt-28 rounded-2xl border border-amber-500/25 bg-[linear-gradient(180deg,rgba(120,53,15,0.1)_0%,rgba(15,15,20,0.92)_10rem)] p-6 sm:p-8 lg:p-12"
          aria-labelledby="discours-heading"
        >
          <div className="mx-auto max-w-[40rem]">
            <h2
              id="discours-heading"
              className="mb-3 flex flex-wrap items-center gap-3 border-b border-amber-500/20 pb-4 text-lg font-semibold text-amber-100 sm:text-xl"
            >
              <span aria-hidden>🎤</span> Discours suggéré (oral)
            </h2>
            <p className="mb-10 text-sm leading-relaxed text-zinc-500 sm:text-[15px]">
              À lire à voix haute ou à reformuler : mise en page continue pour suivre le fil sans fatigue.
            </p>
            <article className="flex flex-col gap-y-6 border-l-2 border-amber-500/15 pl-5 sm:pl-6 sm:gap-y-7">
              {part.discours.map((paragraph, index) => (
                <p
                  key={`${part.slug}-speech-${index}`}
                  className="text-pretty text-[1.0625rem] leading-[1.82] tracking-[0.012em] text-zinc-100 antialiased sm:text-[1.125rem] sm:leading-[1.84]"
                >
                  {highlightDiscoursText(paragraph, part.keywords, part.phrasesCles)}
                </p>
              ))}
            </article>
          </div>
        </section>

        {/* Navigation bas de page — bien visible */}
        <footer className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-10 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-3">
            {previous ? (
              <Link
                href={`${BASE}/${previous.slug}`}
                className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-zinc-600 bg-zinc-800/80 px-5 py-3 text-sm font-medium transition hover:border-zinc-500 hover:bg-zinc-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400"
              >
                ← Bloc précédent
              </Link>
            ) : (
              <Link
                href={BASE}
                className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-zinc-600 bg-zinc-800/80 px-5 py-3 text-sm font-medium hover:bg-zinc-700"
              >
                ← Retour au plan
              </Link>
            )}

            {next ? (
              <Link
                href={`${BASE}/${next.slug}`}
                className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold shadow-lg shadow-violet-900/30 transition hover:bg-violet-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400"
              >
                Bloc suivant →
              </Link>
            ) : (
              <Link
                href={BASE}
                className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold shadow-lg shadow-violet-900/30 hover:bg-violet-500"
              >
                Terminer — retour au plan
              </Link>
            )}
          </div>

          {isLast ? (
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-emerald-500/50 bg-emerald-600/90 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
            >
              Ouvrir le site TENF
            </a>
          ) : null}
        </footer>
      </div>
    </div>
  );
}

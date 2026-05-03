"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Discours2Part } from "../../evaluations/discours2/content";
import { highlightDiscoursText } from "@/lib/discoursHighlight";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  ChevronUp,
  ExternalLink,
  Gauge,
  HeartHandshake,
  ListChecks,
  Mic2,
  Sparkles,
  Type,
} from "lucide-react";

const BASE = "/admin/onboarding/discours-mai-2026";

const heroShellClass =
  "rounded-2xl border border-violet-400/25 bg-[linear-gradient(145deg,rgba(91,33,182,0.2),rgba(15,15,22,0.95)_45%,rgba(12,10,18,0.98))] shadow-[0_20px_50px_rgba(0,0,0,0.45)]";
const sectionCardClass =
  "rounded-2xl border border-white/10 bg-[#14161f]/90 shadow-[0_12px_40px_rgba(0,0,0,0.35)]";
const focusRingClass =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0b10]";

type NavPart = { slug: string; emoji: string; title: string };

type Props = {
  partIndex: number;
  total: number;
  part: Discours2Part;
  previous: NavPart | null;
  next: NavPart | null;
};

export function DiscoursMai2026PartClient({ partIndex, total, part, previous, next }: Props) {
  const router = useRouter();
  const [fontScale, setFontScale] = useState<"comfort" | "default" | "large">("default");
  const [tocOpen, setTocOpen] = useState(false);
  const [readProgress, setReadProgress] = useState(0);
  const discourseRef = useRef<HTMLElement>(null);

  const progressPct = Math.round(((partIndex + 1) / total) * 100);
  const isLast = partIndex === total - 1;

  const scrollToId = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setTocOpen(false);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const el = discourseRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      if (rect.bottom < 120 || rect.top > vh - 40) {
        setReadProgress(0);
        return;
      }
      const range = Math.max(rect.height + vh * 0.2, 1);
      const scrolled = Math.min(Math.max(vh - rect.top, 0), range);
      setReadProgress(Math.min(100, Math.max(0, Math.round((scrolled / range) * 100))));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [part.slug]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.altKey && e.key === "ArrowRight" && next) {
        e.preventDefault();
        router.push(`${BASE}/${next.slug}`);
      } else if (e.altKey && e.key === "ArrowLeft" && previous) {
        e.preventDefault();
        router.push(`${BASE}/${previous.slug}`);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, previous, router]);

  const discourseClass = useMemo(() => {
    if (fontScale === "comfort") return "text-[1rem] leading-[1.95] sm:text-[1.05rem]";
    if (fontScale === "large") return "text-[1.2rem] leading-[1.9] sm:text-[1.28rem]";
    return "text-[1.0625rem] leading-[1.82] sm:text-[1.125rem] sm:leading-[1.84]";
  }, [fontScale]);

  return (
    <div className="min-h-[calc(100vh-6rem)] scroll-smooth bg-[linear-gradient(165deg,#0a0a0f_0%,#12101c_45%,#0d1118_100%)] pb-12 text-white selection:bg-violet-500/35">
      <div className="sticky top-0 z-30 border-b border-white/10 bg-[#0c0c12]/92 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6 lg:max-w-[72rem]">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <Link
              href={BASE}
              className={`inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-300 transition hover:border-violet-400/40 hover:bg-violet-500/10 hover:text-white ${focusRingClass}`}
            >
              <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
              Plan du discours
            </Link>
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs font-semibold tabular-nums text-zinc-300">
                Bloc {partIndex + 1} / {total}
              </span>
              <button
                type="button"
                onClick={() => setTocOpen((v) => !v)}
                className={`inline-flex items-center gap-1.5 rounded-xl border border-white/10 px-3 py-2 text-xs font-medium text-zinc-200 transition hover:bg-white/10 lg:hidden ${focusRingClass}`}
                aria-expanded={tocOpen}
              >
                Sections
                <ChevronUp className={`h-3.5 w-3.5 transition ${tocOpen ? "" : "rotate-180"}`} aria-hidden />
              </button>
            </div>
          </div>
          <div
            className="h-1.5 overflow-hidden rounded-full bg-zinc-800/90"
            role="progressbar"
            aria-valuenow={partIndex + 1}
            aria-valuemin={1}
            aria-valuemax={total}
            aria-label="Progression dans les blocs"
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 transition-[width] duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className={`mt-3 flex flex-wrap gap-2 ${tocOpen ? "flex" : "hidden lg:flex"}`}>
            {(
              [
                { id: "points", label: "Points clés", icon: ListChecks, tone: "cyan" },
                { id: "conseils", label: "Conseils staff", icon: Sparkles, tone: "emerald" },
                { id: "discours", label: "Texte oral", icon: Mic2, tone: "amber" },
              ] as const
            ).map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => scrollToId(item.id)}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition ${focusRingClass} ${
                    item.tone === "cyan"
                      ? "border-cyan-400/30 bg-cyan-500/10 text-cyan-100 hover:bg-cyan-500/20"
                      : item.tone === "emerald"
                        ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-100 hover:bg-emerald-500/20"
                        : "border-amber-400/30 bg-amber-500/10 text-amber-100 hover:bg-amber-500/20"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:max-w-[72rem]">
        <section className={`${heroShellClass} mb-8 p-6 sm:p-8`}>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-violet-200/85">Lecture animateur · membres TENF</p>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-zinc-400">
                <span className="rounded-full bg-white/10 px-3 py-1 font-medium text-zinc-200">Bloc {partIndex + 1}</span>
                {previous ? (
                  <Link href={`${BASE}/${previous.slug}`} className={`transition hover:text-violet-300 ${focusRingClass} rounded-lg`}>
                    ← {previous.emoji} {previous.title.slice(0, 32)}
                    {previous.title.length > 32 ? "…" : ""}
                  </Link>
                ) : null}
                {next ? (
                  <Link href={`${BASE}/${next.slug}`} className={`transition hover:text-violet-300 ${focusRingClass} rounded-lg`}>
                    Suivant : {next.emoji} →
                  </Link>
                ) : null}
              </div>
              <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-start">
                <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-violet-600/35 text-4xl ring-2 ring-violet-400/35">
                  {part.emoji}
                </span>
                <div>
                  <h1 className="text-2xl font-bold leading-tight tracking-tight text-white sm:text-3xl lg:text-[1.9rem]">{part.title}</h1>
                  <p className="mt-3 text-base leading-relaxed text-zinc-200 sm:text-[17px]">{part.objectif}</p>
                </div>
              </div>
            </div>
            <div className="w-full shrink-0 space-y-3 rounded-2xl border border-white/10 bg-black/30 p-4 lg:max-w-xs">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                <Gauge className="h-4 w-4 text-violet-300" aria-hidden />
                Confort de lecture
              </div>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    { id: "comfort" as const, label: "Repos" },
                    { id: "default" as const, label: "Standard" },
                    { id: "large" as const, label: "Grand" },
                  ] as const
                ).map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setFontScale(id)}
                    className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${focusRingClass} ${
                      fontScale === id
                        ? "border-violet-400/60 bg-violet-500/25 text-white"
                        : "border-white/10 bg-white/5 text-zinc-400 hover:text-white"
                    }`}
                  >
                    <Type className="mb-0.5 inline h-3.5 w-3.5 align-middle" aria-hidden /> {label}
                  </button>
                ))}
              </div>
              <p className="flex items-start gap-2 text-[11px] leading-relaxed text-zinc-500">
                <HeartHandshake className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400/80" aria-hidden />
                Raccourcis : <kbd className="rounded border border-white/15 bg-white/10 px-1">Alt</kbd> +{" "}
                <kbd className="rounded border border-white/15 bg-white/10 px-1">←</kbd> /{" "}
                <kbd className="rounded border border-white/15 bg-white/10 px-1">→</kbd> pour changer de bloc.
              </p>
            </div>
          </div>
        </section>

        <div className="mb-10 grid gap-8 xl:grid-cols-2 xl:gap-10">
          <section id="points" className={`${sectionCardClass} scroll-mt-36 border-cyan-500/20 p-6 sm:p-7`}>
            <h2 className="mb-5 flex items-center gap-2 border-b border-cyan-500/25 pb-3 text-lg font-semibold text-cyan-100">
              <ListChecks className="h-5 w-5 text-cyan-300" aria-hidden />
              Points clés à aborder
            </h2>
            <ul className="space-y-3">
              {part.points.map((point) => (
                <li
                  key={point}
                  className="flex gap-3 rounded-xl border border-cyan-500/15 bg-black/30 px-4 py-3 text-[15px] leading-relaxed text-zinc-100 sm:text-base"
                >
                  <span className="mt-0.5 shrink-0 text-cyan-400" aria-hidden>
                    ✓
                  </span>
                  <span>{highlightDiscoursText(point, part.keywords, part.phrasesCles)}</span>
                </li>
              ))}
            </ul>
          </section>

          <section id="conseils" className={`${sectionCardClass} scroll-mt-36 border-emerald-500/20 p-6 sm:p-7`}>
            <h2 className="mb-5 flex items-center gap-2 border-b border-emerald-500/25 pb-3 text-lg font-semibold text-emerald-100">
              <Sparkles className="h-5 w-5 text-emerald-300" aria-hidden />
              Conseils pour le staff
            </h2>
            <ul className="space-y-3">
              {part.conseils.map((conseil) => (
                <li
                  key={conseil}
                  className="flex gap-3 rounded-xl border border-emerald-500/15 bg-black/30 px-4 py-3 text-[15px] leading-relaxed text-zinc-100 sm:text-base"
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

        <section
          ref={discourseRef}
          id="discours"
          className="scroll-mt-36 rounded-2xl border border-amber-500/30 bg-[linear-gradient(180deg,rgba(120,53,15,0.12)_0%,rgba(15,15,20,0.94)_12rem)] p-6 sm:p-8 lg:p-12"
          aria-labelledby="discours-heading"
        >
          <div className="mx-auto max-w-[42rem]">
            <div className="mb-6 flex flex-col gap-3 border-b border-amber-500/25 pb-4 sm:flex-row sm:items-end sm:justify-between">
              <h2 id="discours-heading" className="flex items-center gap-2 text-lg font-semibold text-amber-100 sm:text-xl">
                <Mic2 className="h-6 w-6 text-amber-300" aria-hidden />
                Discours suggéré (oral)
              </h2>
              <div className="h-1 w-full max-w-[200px] overflow-hidden rounded-full bg-white/10 sm:mb-1">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-150"
                  style={{ width: `${readProgress}%` }}
                  aria-hidden
                />
              </div>
            </div>
            <p className="mb-8 text-sm leading-relaxed text-zinc-500 sm:text-[15px]">
              Texte à lire ou à adapter avec vos mots : le surlignage met en avant les formulations clés pour les{" "}
              <strong className="text-zinc-300">membres</strong>. Faites défiler pour voir la barre de progression de lecture
              dans cette section.
            </p>
            <article className={`flex flex-col gap-y-6 border-l-2 border-amber-500/25 pl-5 sm:pl-7 sm:gap-y-7 ${discourseClass}`}>
              {part.discours.map((paragraph, index) => (
                <p key={`${part.slug}-speech-${index}`} className="text-pretty text-zinc-100 antialiased">
                  {highlightDiscoursText(paragraph, part.keywords, part.phrasesCles)}
                </p>
              ))}
            </article>
          </div>
        </section>

        <footer className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-10 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-3">
            {previous ? (
              <Link
                href={`${BASE}/${previous.slug}`}
                className={`inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-zinc-600 bg-zinc-800/90 px-5 py-3 text-sm font-medium transition hover:border-zinc-500 hover:bg-zinc-700 ${focusRingClass}`}
              >
                <ArrowLeft className="h-4 w-4" aria-hidden />
                Bloc précédent
              </Link>
            ) : (
              <Link
                href={BASE}
                className={`inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-zinc-600 bg-zinc-800/90 px-5 py-3 text-sm font-medium hover:bg-zinc-700 ${focusRingClass}`}
              >
                <BookOpen className="h-4 w-4" aria-hidden />
                Retour au plan
              </Link>
            )}

            {next ? (
              <Link
                href={`${BASE}/${next.slug}`}
                className={`inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-900/35 transition hover:brightness-110 ${focusRingClass}`}
              >
                Bloc suivant
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            ) : (
              <Link
                href={BASE}
                className={`inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:brightness-110 ${focusRingClass}`}
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
              className={`inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-emerald-400/50 bg-emerald-600/90 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 ${focusRingClass}`}
            >
              <ExternalLink className="h-4 w-4" aria-hidden />
              Ouvrir le site TENF
            </a>
          ) : null}
        </footer>
      </div>
    </div>
  );
}

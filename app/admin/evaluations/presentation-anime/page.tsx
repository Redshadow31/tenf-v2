"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Eye,
  EyeOff,
  HeartHandshake,
  LayoutList,
  Maximize2,
  MonitorPlay,
  Sparkles,
  X,
} from "lucide-react";

const heroShellClass =
  "relative overflow-hidden rounded-3xl border border-indigo-400/25 bg-[linear-gradient(155deg,rgba(99,102,241,0.14),rgba(14,15,23,0.92)_38%,rgba(11,13,20,0.97))] shadow-[0_24px_70px_rgba(2,6,23,0.55)] backdrop-blur-xl";
const sectionCardClass =
  "rounded-2xl border border-[#2f3244] bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.10),_rgba(11,13,20,0.95)_46%)] shadow-[0_16px_40px_rgba(2,6,23,0.45)]";
const subtleButtonClass =
  "inline-flex items-center gap-2 rounded-xl border border-indigo-300/25 bg-[linear-gradient(135deg,rgba(79,70,229,0.24),rgba(30,41,59,0.36))] px-3 py-2 text-sm font-medium text-indigo-100 transition hover:-translate-y-[1px] hover:border-indigo-200/45 hover:bg-[linear-gradient(135deg,rgba(99,102,241,0.34),rgba(30,41,59,0.54))]";
const focusRingClass =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0b10]";

type SlideDef = {
  file: string;
  title: string;
  tagline: string;
  staffNote: string;
  memberFocus: string;
  accent: "violet" | "fuchsia" | "cyan" | "amber" | "emerald" | "rose";
};

const slideDeck: SlideDef[] = [
  {
    file: "Slide1.html",
    title: "Bienvenue New Family",
    tagline: "Accroche d’ouverture et promesse d’entraide.",
    staffNote: "Posez le ton : calme, chaleureux, laissez la slide respirer 10–15 s avant de parler.",
    memberFocus: "Première impression : « je suis au bon endroit ».",
    accent: "violet",
  },
  {
    file: "slide2.html",
    title: "Ici, on ne stream pas seul",
    tagline: "Les trois piliers : entraide, progression, humanité.",
    staffNote: "Reliez chaque pilier à un exemple concret TENF (Discord, vocal, événement).",
    memberFocus: "Comprendre la culture avant les règles techniques.",
    accent: "fuchsia",
  },
  {
    file: "slide3.html",
    title: "Donner → recevoir",
    tagline: "Équilibre entre contribution et ce que la communauté rend.",
    staffNote: "Insistez sur le fait que la valeur se construit dans la durée, pas en une soirée.",
    memberFocus: "Cadre mental équitable pour les nouveaux.",
    accent: "cyan",
  },
  {
    file: "slide4.html",
    title: "Les rôles Discord",
    tagline: "Lecture claire des rôles visibles côté serveur.",
    staffNote: "Anticipez les questions « à quoi sert ce rôle ? » — gardez le rythme lent sur cette slide dense.",
    memberFocus: "Repères pour s’orienter dans le serveur.",
    accent: "amber",
  },
  {
    file: "slide5.html",
    title: "Commencer simplement",
    tagline: "Déblocage des premières actions sans surcharge.",
    staffNote: "Évitez d’empiler les outils : une action utile par phrase.",
    memberFocus: "Réduction de l’anxiété « par où je commence ? ».",
    accent: "emerald",
  },
  {
    file: "slide6.html",
    title: "Bienvenue — suite du parcours",
    tagline: "Transition vers la suite de l’accueil (hors slides si besoin).",
    staffNote: "Annoncez la suite (questions, vocal, lien membre) avant de quitter le plein écran.",
    memberFocus: "Clôture rassurante et prochaine étape claire.",
    accent: "rose",
  },
];

const accentRing: Record<SlideDef["accent"], string> = {
  violet: "ring-violet-400/50 border-violet-400/35",
  fuchsia: "ring-fuchsia-400/50 border-fuchsia-400/35",
  cyan: "ring-cyan-400/50 border-cyan-400/35",
  amber: "ring-amber-400/50 border-amber-400/35",
  emerald: "ring-emerald-400/50 border-emerald-400/35",
  rose: "ring-rose-400/50 border-rose-400/35",
};

const accentDot: Record<SlideDef["accent"], string> = {
  violet: "bg-violet-400",
  fuchsia: "bg-fuchsia-400",
  cyan: "bg-cyan-400",
  amber: "bg-amber-400",
  emerald: "bg-emerald-400",
  rose: "bg-rose-400",
};

export default function PresentationAnimePage() {
  const [previewIndex, setPreviewIndex] = useState(0);
  const [isPresentationMode, setIsPresentationMode] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [previewInteractive, setPreviewInteractive] = useState(false);
  const [revealStaffNotes, setRevealStaffNotes] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const goNext = useCallback(() => {
    setCurrentSlide((i) => Math.min(i + 1, slideDeck.length - 1));
  }, []);

  const goPrev = useCallback(() => {
    setCurrentSlide((i) => Math.max(i - 1, 0));
  }, []);

  const exitPresentation = useCallback(() => {
    setIsPresentationMode(false);
  }, []);

  useEffect(() => {
    if (!isPresentationMode) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      } else if (e.key === "Escape") {
        e.preventDefault();
        exitPresentation();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isPresentationMode, goNext, goPrev, exitPresentation]);

  const startFrom = (index: number) => {
    setCurrentSlide(index);
    setIsPresentationMode(true);
  };

  const activeMeta = slideDeck[currentSlide];
  const isFirst = currentSlide === 0;
  const isLast = currentSlide === slideDeck.length - 1;

  const progressPct = useMemo(
    () => Math.round(((currentSlide + 1) / slideDeck.length) * 100),
    [currentSlide]
  );

  return (
    <div className="min-h-screen space-y-8 p-4 text-white sm:p-6 md:p-8">
      {!isPresentationMode ? (
        <>
          <section className={`${heroShellClass} p-6 md:p-8`}>
            <div className="pointer-events-none absolute -right-24 top-0 h-56 w-56 rounded-full bg-violet-600/18 blur-3xl" aria-hidden />
            <div className="pointer-events-none absolute -left-16 bottom-0 h-48 w-48 rounded-full bg-fuchsia-500/12 blur-3xl" aria-hidden />
            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-2xl space-y-4">
                <Link
                  href="/admin/onboarding/contenus"
                  className={`inline-flex items-center gap-1 text-sm text-indigo-200/90 transition hover:text-white ${focusRingClass} rounded-lg`}
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden />
                  Retour aux supports & discours
                </Link>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-indigo-100/90">
                    Salle & stream
                  </span>
                  <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-100/90">
                    Membres TENF
                  </span>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-indigo-200/85">Onboarding · Présentation</p>
                  <h1 className="mt-2 bg-gradient-to-r from-indigo-100 via-white to-fuchsia-100 bg-clip-text text-3xl font-bold tracking-tight text-transparent md:text-4xl">
                    Slides d’accueil : même histoire, même rythme
                  </h1>
                  <p className="mt-3 text-sm leading-relaxed text-slate-300 md:text-[15px]">
                    Ces pages HTML plein écran sont celles que vous projetez devant les{" "}
                    <strong className="text-slate-100">nouveaux membres</strong> : choisissez la diapositive, vérifiez le
                    rendu, puis lancez le mode présentation. Les raccourcis <kbd className="rounded border border-white/20 bg-white/10 px-1.5 py-0.5 font-mono text-[11px]">←</kbd>{" "}
                    <kbd className="rounded border border-white/20 bg-white/10 px-1.5 py-0.5 font-mono text-[11px]">→</kbd>{" "}
                    <kbd className="rounded border border-white/20 bg-white/10 px-1.5 py-0.5 font-mono text-[11px]">Espace</kbd> et{" "}
                    <kbd className="rounded border border-white/20 bg-white/10 px-1.5 py-0.5 font-mono text-[11px]">Échap</kbd> fonctionnent en plein écran.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => startFrom(previewIndex)}
                    className={`${subtleButtonClass} ${focusRingClass} border-fuchsia-400/30 bg-fuchsia-500/15 text-fuchsia-100 hover:border-fuchsia-300/50`}
                  >
                    <Maximize2 className="h-4 w-4 shrink-0" aria-hidden />
                    Lancer depuis la diapositive sélectionnée
                  </button>
                  <Link
                    href="/integration"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${subtleButtonClass} ${focusRingClass} border-sky-400/25 bg-sky-500/10 text-sky-100 hover:border-sky-300/45`}
                  >
                    <ExternalLink className="h-4 w-4 shrink-0" aria-hidden />
                    Parcours public intégration
                  </Link>
                </div>
              </div>
              <div className="w-full max-w-sm shrink-0 space-y-3 rounded-2xl border border-white/10 bg-black/35 p-5 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">
                  <MonitorPlay className="h-4 w-4 text-violet-300" aria-hidden />
                  Conseil animateur
                </div>
                <p className="flex items-start gap-2 text-xs leading-relaxed text-slate-400">
                  <HeartHandshake className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300/80" aria-hidden />
                  Les animations respectent <strong className="text-slate-200">réduit mouvement</strong> côté navigateur
                  quand c’est activé sur votre machine de projection.
                </p>
                <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={revealStaffNotes}
                    onChange={(e) => setRevealStaffNotes(e.target.checked)}
                    className="rounded border-slate-500 bg-[#0f1321]"
                  />
                  Afficher les notes staff sous la grille
                </label>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-bold text-white">
                  <LayoutList className="mr-2 inline h-5 w-5 text-indigo-300" aria-hidden />
                  Programme ({slideDeck.length} écrans)
                </h2>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {slideDeck.map((slide, index) => (
                  <button
                    key={slide.file}
                    type="button"
                    onClick={() => setPreviewIndex(index)}
                    className={`rounded-2xl border p-4 text-left transition ${focusRingClass} ${
                      previewIndex === index
                        ? `bg-indigo-500/15 ring-2 ${accentRing[slide.accent]}`
                        : "border-[#353a50] bg-[#121623]/80 hover:border-indigo-400/30"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white ${accentDot[slide.accent]}`}
                      >
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold text-white">{slide.title}</p>
                        <p className="mt-1 text-xs text-slate-400">{slide.tagline}</p>
                        <p className="mt-2 text-[11px] text-emerald-200/80">Pour les membres : {slide.memberFocus}</p>
                        {revealStaffNotes ? (
                          <p className="mt-2 border-t border-white/10 pt-2 text-[11px] leading-relaxed text-indigo-100/85">
                            Staff : {slide.staffNote}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className={`${sectionCardClass} flex flex-col overflow-hidden`}>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3 md:px-5">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Aperçu</p>
                  <p className="text-sm font-semibold text-white">
                    {previewIndex + 1}. {slideDeck[previewIndex].title}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewInteractive((v) => !v)}
                    className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition ${focusRingClass} ${
                      previewInteractive
                        ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-100"
                        : "border-[#353a50] bg-[#0f1321] text-slate-300"
                    }`}
                  >
                    {previewInteractive ? (
                      <>
                        <Eye className="h-3.5 w-3.5" aria-hidden />
                        Interaction iframe activée
                      </>
                    ) : (
                      <>
                        <EyeOff className="h-3.5 w-3.5" aria-hidden />
                        Déverrouiller l’aperçu
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => startFrom(previewIndex)}
                    className={`inline-flex items-center gap-2 rounded-xl border border-fuchsia-400/40 bg-fuchsia-500/20 px-3 py-2 text-xs font-semibold text-fuchsia-50 transition hover:bg-fuchsia-500/30 ${focusRingClass}`}
                  >
                    <Sparkles className="h-3.5 w-3.5" aria-hidden />
                    Plein écran
                  </button>
                </div>
              </div>
              <div className="relative bg-black" style={{ paddingBottom: "56.25%", height: 0 }}>
                <iframe
                  key={slideDeck[previewIndex].file + (previewInteractive ? "-i" : "-l")}
                  src={`/slides/tenf/${slideDeck[previewIndex].file}`}
                  className="absolute inset-0 h-full w-full border-0"
                  title={`Aperçu ${slideDeck[previewIndex].title}`}
                  style={{ pointerEvents: previewInteractive ? "auto" : "none" }}
                />
              </div>
              <p className="px-4 py-3 text-xs text-slate-500 md:px-5">
                Fichier : <code className="rounded bg-white/5 px-1.5 py-0.5 text-slate-300">/slides/tenf/{slideDeck[previewIndex].file}</code>
              </p>
            </div>
          </div>
        </>
      ) : (
        <div className="fixed inset-0 z-[100] flex flex-col bg-black">
          <header className="relative z-20 flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-black/80 px-4 py-3 backdrop-blur-md md:px-6">
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium uppercase tracking-wide text-slate-500">
                Diapositive {currentSlide + 1} / {slideDeck.length}
              </p>
              <p className="truncate text-sm font-bold text-white md:text-base">{activeMeta.title}</p>
            </div>
            <div className="hidden w-40 max-w-[40%] md:block">
              <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
            <button
              type="button"
              onClick={exitPresentation}
              className={`inline-flex shrink-0 items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/10 ${focusRingClass}`}
            >
              <X className="h-4 w-4" aria-hidden />
              Quitter
            </button>
          </header>

          <div className="relative min-h-0 flex-1">
            <button
              type="button"
              onClick={goPrev}
              disabled={isFirst}
              className={`absolute left-1 top-1/2 z-20 flex -translate-y-1/2 rounded-full border border-white/15 bg-black/60 p-2.5 text-white shadow-lg backdrop-blur-sm transition sm:left-2 sm:p-3 ${
                isFirst ? "cursor-not-allowed opacity-30" : "hover:bg-white/10"
              } ${focusRingClass}`}
              style={{ transition: prefersReducedMotion ? "none" : undefined }}
              aria-label="Diapositive précédente"
            >
              <ChevronLeft className="h-6 w-6" aria-hidden />
            </button>
            <button
              type="button"
              onClick={goNext}
              disabled={isLast}
              className={`absolute right-1 top-1/2 z-20 flex -translate-y-1/2 rounded-full border border-white/15 bg-black/60 p-2.5 text-white shadow-lg backdrop-blur-sm transition sm:right-2 sm:p-3 ${
                isLast ? "cursor-not-allowed opacity-30" : "hover:bg-white/10"
              } ${focusRingClass}`}
              style={{ transition: prefersReducedMotion ? "none" : undefined }}
              aria-label="Diapositive suivante"
            >
              <ChevronRight className="h-6 w-6" aria-hidden />
            </button>

            <iframe
              src={`/slides/tenf/${slideDeck[currentSlide].file}`}
              className="h-full w-full border-0"
              title={activeMeta.title}
              allowFullScreen
            />
          </div>

          <footer className="relative z-20 shrink-0 border-t border-white/10 bg-black/85 px-3 py-3 backdrop-blur-md">
            <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-2">
              {slideDeck.map((s, i) => (
                <button
                  key={s.file}
                  type="button"
                  onClick={() => setCurrentSlide(i)}
                  className={`flex h-10 w-10 items-center justify-center rounded-xl border text-xs font-bold transition ${focusRingClass} ${
                    i === currentSlide
                      ? `border-white/30 bg-white/15 text-white ring-2 ${accentRing[s.accent]}`
                      : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
                  }`}
                  aria-label={`Aller à la diapositive ${i + 1}`}
                  aria-current={i === currentSlide ? "true" : undefined}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <p className="mt-2 text-center text-[11px] text-slate-500">
              Flèches ou Espace · Échap pour fermer · Réduit mouvement : {prefersReducedMotion ? "oui" : "non"}
            </p>
          </footer>
        </div>
      )}
    </div>
  );
}

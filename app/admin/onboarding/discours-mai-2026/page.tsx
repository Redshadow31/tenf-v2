"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Filter,
  Gauge,
  HeartHandshake,
  LayoutList,
  Mic2,
  Search,
  Sparkles,
} from "lucide-react";
import { discours2General, discours2Parts } from "../../evaluations/discours2/contentMai2026";

const BASE = "/admin/onboarding/discours-mai-2026";

const heroShellClass =
  "relative overflow-hidden rounded-3xl border border-violet-400/25 bg-[linear-gradient(155deg,rgba(109,40,217,0.18),rgba(14,15,23,0.92)_38%,rgba(11,13,20,0.97))] shadow-[0_24px_70px_rgba(2,6,23,0.55)] backdrop-blur-xl";
const sectionCardClass =
  "rounded-2xl border border-[#2f3244] bg-[radial-gradient(circle_at_top,_rgba(109,40,217,0.12),_rgba(11,13,20,0.95)_46%)] shadow-[0_16px_40px_rgba(2,6,23,0.45)]";
const subtleButtonClass =
  "inline-flex items-center gap-2 rounded-xl border border-violet-300/25 bg-[linear-gradient(135deg,rgba(109,40,217,0.22),rgba(30,41,59,0.36))] px-3 py-2 text-sm font-medium text-violet-100 transition hover:-translate-y-[1px] hover:border-violet-200/45";
const focusRingClass =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0b10]";

const CHECKLIST_KEY = "tenf-admin-discours-mai-2026-checklist-v1";
const checklistDefaults = [
  { id: "order", label: "Ordre des blocs respecté (pas de saut sauf urgence)" },
  { id: "demo", label: "Bloc 5 : démo site prête (connexion / parcours)" },
  { id: "pause", label: "Pauses prévues après les phrases marquées 👉" },
  { id: "questions", label: "Créneau questions annoncé en fin de bloc 9" },
];

const journeyPhases = [
  { title: "Avant", body: "Relire ce hub, ouvrir le bloc 1, vérifier micro et partage d’écran." },
  { title: "Pendant", body: "Une voix principale, le même fil que sur l’espace membre et Discord." },
  { title: "Après", body: "Noter les incompréhensions pour enrichir la prochaine session." },
];

export default function OnboardingDiscoursMai2026HomePage() {
  const firstPart = discours2Parts[0];
  const [query, setQuery] = useState("");
  const [filRougeOpen, setFilRougeOpen] = useState(true);
  const [activePhase, setActivePhase] = useState(0);
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null);
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [hydrated, setHydrated] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CHECKLIST_KEY);
      if (raw) setChecklist(JSON.parse(raw) as Record<string, boolean>);
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(CHECKLIST_KEY, JSON.stringify(checklist));
    } catch {
      /* ignore */
    }
  }, [checklist, hydrated]);

  const filteredParts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return discours2Parts;
    return discours2Parts.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.objectif.toLowerCase().includes(q) ||
        p.slug.replace(/-/g, " ").includes(q)
    );
  }, [query]);

  const checklistDone = useMemo(
    () => checklistDefaults.filter((c) => checklist[c.id]).length,
    [checklist]
  );

  const scrollToGrid = useCallback(() => {
    gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const toggleCheck = (id: string) => {
    setChecklist((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="min-h-[calc(100vh-6rem)] scroll-smooth bg-[linear-gradient(165deg,#0a0a0f_0%,#12101c_45%,#0d1118_100%)] text-white selection:bg-violet-500/35">
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-6 sm:px-6 sm:py-10">
        <section className={`${heroShellClass} p-6 md:p-8`}>
          <div className="pointer-events-none absolute -right-24 top-0 h-56 w-56 rounded-full bg-fuchsia-600/15 blur-3xl" aria-hidden />
          <div className="pointer-events-none absolute -left-16 bottom-0 h-48 w-48 rounded-full bg-cyan-500/10 blur-3xl" aria-hidden />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl space-y-4">
              <nav aria-label="Fil d’Ariane" className="flex flex-wrap items-center gap-2 text-sm text-zinc-400">
                <Link
                  href="/admin/onboarding/contenus"
                  className={`rounded-lg px-2 py-1 transition hover:bg-white/10 hover:text-white ${focusRingClass}`}
                >
                  Supports & discours
                </Link>
                <span aria-hidden className="text-zinc-600">
                  /
                </span>
                <span className="font-medium text-zinc-200">Discours mai 2026</span>
              </nav>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-violet-100/90">
                  Salle & nouveaux membres
                </span>
                <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-100/90">
                  Animateurs & staff
                </span>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-violet-200/90">Neuf blocs oraux</p>
                <h1 className="mt-2 bg-gradient-to-r from-violet-100 via-white to-fuchsia-100 bg-clip-text text-3xl font-bold tracking-tight text-transparent md:text-4xl">
                  Discours — version mai 2026
                </h1>
                <p className="mt-3 text-sm leading-relaxed text-zinc-300 md:text-[15px]">{discours2General.subtitle}</p>
                <p className="mt-3 inline-flex flex-wrap items-center gap-2 text-sm text-zinc-400">
                  <Mic2 className="h-4 w-4 shrink-0 text-fuchsia-300" aria-hidden />
                  <span className="rounded-full border border-violet-500/35 bg-violet-500/10 px-3 py-1 font-medium text-violet-100">
                    {discours2Parts.length} blocs
                  </span>
                  <span>objectifs · conseils staff · texte oral surligné dans chaque page</span>
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href={`${BASE}/${firstPart.slug}`}
                  className={`${subtleButtonClass} ${focusRingClass} border-fuchsia-400/30 bg-fuchsia-500/15 text-fuchsia-50 hover:border-fuchsia-300/50`}
                >
                  <Sparkles className="h-4 w-4 shrink-0" aria-hidden />
                  Ouvrir le bloc 1
                </Link>
                <button type="button" onClick={scrollToGrid} className={`${subtleButtonClass} ${focusRingClass}`}>
                  <LayoutList className="h-4 w-4 shrink-0" aria-hidden />
                  Voir le plan des blocs
                </button>
                <Link
                  href="/admin/onboarding/discours2"
                  className={`${subtleButtonClass} ${focusRingClass} border-sky-400/25 bg-sky-500/10 text-sky-100 hover:border-sky-300/45`}
                >
                  <BookOpen className="h-4 w-4 shrink-0" aria-hidden />
                  Autre trame (discours 2)
                </Link>
                <Link
                  href="/integration"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${subtleButtonClass} ${focusRingClass} border-emerald-400/25 bg-emerald-500/10 text-emerald-100 hover:border-emerald-300/45`}
                >
                  <ExternalLink className="h-4 w-4 shrink-0" aria-hidden />
                  Parcours public
                </Link>
              </div>
            </div>
            <div className="w-full max-w-sm shrink-0 space-y-3 rounded-2xl border border-white/10 bg-black/35 p-5 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-zinc-400">
                <Gauge className="h-4 w-4 text-violet-300" aria-hidden />
                Passage équipe
              </div>
              <p className="flex items-start gap-2 text-xs leading-relaxed text-zinc-400">
                <HeartHandshake className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300/80" aria-hidden />
                Les mêmes mots que vous projetez ici doivent coller à ce que les membres lisent sur le site : évitez les
                écarts de vocabulaire entre animateurs.
              </p>
              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-center">
                <p className="text-2xl font-bold tabular-nums text-emerald-200">{checklistDone}</p>
                <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                  / {checklistDefaults.length} points pré-session
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
          <button
            type="button"
            onClick={() => setFilRougeOpen((o) => !o)}
            className={`${sectionCardClass} w-full border-amber-500/20 p-5 text-left transition hover:border-amber-400/35 ${focusRingClass}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-bold text-white">
                  <Sparkles className="h-5 w-5 text-amber-300" aria-hidden />
                  Fil rouge de la réunion
                </h2>
                <p className="mt-1 text-xs text-zinc-500">Cliquez pour {filRougeOpen ? "masquer" : "afficher"} le détail.</p>
              </div>
              <ChevronDown className={`h-5 w-5 shrink-0 text-zinc-400 transition ${filRougeOpen ? "rotate-180" : ""}`} aria-hidden />
            </div>
            {filRougeOpen ? (
              <div className="mt-5 space-y-4 border-t border-white/10 pt-5">
                <blockquote className="border-l-[3px] border-amber-400/80 pl-5 text-[17px] leading-relaxed text-zinc-100">
                  {discours2General.phraseCentrale}
                </blockquote>
                <p className="rounded-xl bg-black/30 px-4 py-3 text-sm leading-relaxed text-zinc-400">{discours2General.note}</p>
              </div>
            ) : null}
          </button>

          <aside className={`${sectionCardClass} h-fit border-emerald-500/20 p-5`}>
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-emerald-200/90">Checklist rapide</h3>
            <ul className="space-y-2">
              {checklistDefaults.map((item) => {
                const done = Boolean(checklist[item.id]);
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => toggleCheck(item.id)}
                      className={`flex w-full items-start gap-2 rounded-xl border px-3 py-2.5 text-left text-xs transition ${focusRingClass} ${
                        done
                          ? "border-emerald-400/40 bg-emerald-500/12 text-emerald-50"
                          : "border-white/10 bg-black/25 text-zinc-300 hover:border-emerald-400/25"
                      }`}
                    >
                      <span
                        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] font-bold ${
                          done ? "border-emerald-400 bg-emerald-500 text-white" : "border-zinc-500"
                        }`}
                        aria-hidden
                      >
                        {done ? "✓" : ""}
                      </span>
                      {item.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </aside>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <section className={`${sectionCardClass} border-cyan-500/20 p-6 sm:p-7`}>
            <h2 className="mb-4 flex items-center gap-2 text-base font-bold uppercase tracking-wide text-cyan-200/95">
              <LayoutList className="h-5 w-5 text-cyan-300" aria-hidden />
              Vue d’ensemble (9 blocs)
            </h2>
            <ol className="space-y-2">
              {discours2General.points.map((point, i) => (
                <li
                  key={point}
                  className="flex gap-3 rounded-xl border border-cyan-500/15 bg-black/25 px-3 py-2.5 text-sm leading-snug text-zinc-200"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cyan-500/25 text-xs font-bold text-cyan-100">
                    {i + 1}
                  </span>
                  <span className="pt-0.5">{point.replace(/^\d+\)\s*/, "")}</span>
                </li>
              ))}
            </ol>
          </section>

          <section className={`${sectionCardClass} border-violet-500/20 p-6 sm:p-7`}>
            <h2 className="mb-4 flex items-center gap-2 text-base font-bold uppercase tracking-wide text-violet-200/95">
              <Mic2 className="h-5 w-5 text-violet-300" aria-hidden />
              Enchaînement conseillé
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {journeyPhases.map((ph, i) => (
                <button
                  key={ph.title}
                  type="button"
                  onClick={() => setActivePhase(i)}
                  className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${focusRingClass} ${
                    activePhase === i
                      ? "border-violet-400/50 bg-violet-500/20 text-white shadow-[0_8px_28px_rgba(109,40,217,0.25)]"
                      : "border-white/10 bg-black/20 text-zinc-300 hover:border-violet-400/30"
                  }`}
                >
                  <p className="text-[11px] font-bold uppercase tracking-wide text-violet-200/90">{ph.title}</p>
                  <p className="mt-2 leading-snug text-zinc-100">{ph.body}</p>
                </button>
              ))}
            </div>
          </section>
        </div>

        <section className={`${sectionCardClass} border-emerald-500/15 p-6 sm:p-7`}>
          <h2 className="mb-4 flex items-center gap-2 text-base font-bold uppercase tracking-wide text-emerald-200/95">
            <HeartHandshake className="h-5 w-5 text-emerald-300" aria-hidden />
            Conseils globaux pour l’animateur
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {discours2General.conseils.map((conseil) => (
              <li
                key={conseil}
                className="flex gap-2 rounded-xl border border-emerald-500/15 bg-black/25 px-4 py-3 text-sm leading-relaxed text-zinc-200"
              >
                <span className="text-emerald-400" aria-hidden>
                  ▸
                </span>
                <span>{conseil}</span>
              </li>
            ))}
          </ul>
        </section>

        <div className={`${sectionCardClass} flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between`}>
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filtrer par titre, objectif ou mot-clé…"
              className={`w-full rounded-xl border border-white/10 bg-black/40 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-zinc-500 ${focusRingClass}`}
              aria-label="Filtrer les blocs"
            />
          </div>
          <p className="flex items-center gap-2 text-xs text-zinc-500">
            <Filter className="h-4 w-4 text-zinc-400" aria-hidden />
            {filteredParts.length} bloc(s) affiché(s)
          </p>
        </div>

        <section ref={gridRef} className={`${sectionCardClass} scroll-mt-24 p-6 sm:p-8`}>
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Plan du discours</h2>
              <p className="mt-1 text-sm text-zinc-500">
                Ouvrez un bloc : navigation « précédent / suivant » et raccourcis clavier dans chaque page.
              </p>
            </div>
            <Link
              href={`${BASE}/${firstPart.slug}`}
              className={`inline-flex items-center gap-2 self-start rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-900/30 transition hover:brightness-110 ${focusRingClass}`}
            >
              Démarrer
              <ChevronRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
          {filteredParts.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-500">Aucun bloc ne correspond à votre recherche.</p>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredParts.map((part) => {
                const globalIndex = discours2Parts.findIndex((p) => p.slug === part.slug);
                const open = expandedSlug === part.slug;
                return (
                  <li key={part.slug} className="flex flex-col">
                    <Link
                      href={`${BASE}/${part.slug}`}
                      className={`group flex flex-1 flex-col gap-3 rounded-2xl border border-zinc-700/80 bg-zinc-900/50 p-5 transition hover:border-violet-400/55 hover:bg-violet-950/25 hover:shadow-lg hover:shadow-violet-950/25 ${focusRingClass}`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-600/30 text-2xl ring-1 ring-violet-400/35 transition group-hover:bg-violet-600/45">
                          {part.emoji}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-zinc-500">
                            Bloc {globalIndex + 1}
                          </p>
                          <p className="font-semibold leading-snug text-white transition group-hover:text-violet-100">
                            {part.title}
                          </p>
                        </div>
                      </div>
                      <p className="line-clamp-3 text-sm leading-relaxed text-zinc-400">{part.objectif}</p>
                      <span className="mt-auto inline-flex items-center gap-1 pt-1 text-sm font-medium text-violet-300/90 transition group-hover:text-violet-200">
                        Ouvrir le bloc
                        <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
                      </span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => setExpandedSlug((s) => (s === part.slug ? null : part.slug))}
                      className={`mt-2 flex w-full items-center justify-between rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-400 transition hover:bg-white/5 ${focusRingClass}`}
                      aria-expanded={open}
                    >
                      Aperçu objectif
                      <ChevronDown className={`h-4 w-4 shrink-0 transition ${open ? "rotate-180" : ""}`} aria-hidden />
                    </button>
                    {open ? (
                      <p className="mt-2 rounded-xl border border-violet-500/20 bg-violet-500/10 p-3 text-xs leading-relaxed text-violet-100/95">
                        {part.objectif}
                      </p>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <div className="flex justify-center border-t border-white/10 pt-8">
          <Link
            href={`${BASE}/${firstPart.slug}`}
            className={`inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-8 py-3.5 font-semibold text-white shadow-lg shadow-violet-900/35 transition hover:brightness-110 ${focusRingClass}`}
          >
            Lancer le bloc 1
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>

        <p className="pb-4 text-center text-xs text-zinc-600">
          <Link href="/admin/onboarding" className={`text-violet-400/90 underline-offset-2 hover:underline ${focusRingClass}`}>
            <ChevronLeft className="mr-1 inline h-3.5 w-3.5 align-middle" aria-hidden />
            Hub accueil & intégration
          </Link>
        </p>
      </div>
    </div>
  );
}

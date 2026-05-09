"use client";

import Link from "next/link";
import {
  ArrowRight,
  CalendarRange,
  GraduationCap,
  HeartHandshake,
  LayoutList,
  Radio,
  Shield,
  Sparkles,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { MONTHLY_CHANGELOG, type MonthTab } from "./monthlyData";
import styles from "./changelog.module.css";

function useScrollProgress() {
  const [p, setP] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement;
      const total = el.scrollHeight - el.clientHeight;
      setP(total > 0 ? Math.min(100, Math.max(0, (el.scrollTop / total) * 100)) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return p;
}

function tabButtonClass(m: MonthTab, selected: boolean): string {
  const base =
    "shrink-0 rounded-full px-4 py-2.5 text-left text-sm font-semibold transition lg:min-w-0 border focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/80";
  if (selected) {
    if (m.kind === "prologue")
      return `${base} border-amber-400/50 bg-gradient-to-r from-amber-600 to-orange-700 text-white shadow-lg shadow-amber-900/30`;
    if (m.kind === "horizon")
      return `${base} border-cyan-400/50 bg-gradient-to-r from-cyan-600 to-indigo-700 text-white shadow-lg shadow-cyan-900/30`;
    return `${base} border-transparent bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-900/35`;
  }
  if (m.kind === "prologue")
    return `${base} border-amber-500/25 bg-amber-950/20 text-amber-100/90 hover:border-amber-400/40`;
  if (m.kind === "horizon")
    return `${base} border-cyan-500/25 bg-cyan-950/15 text-cyan-100/85 hover:border-cyan-400/40`;
  return `${base} border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-text-secondary)] hover:border-violet-500/35 hover:text-[var(--color-text)]`;
}

function panelClass(kind: MonthTab["kind"]): string {
  const base =
    "mt-8 rounded-3xl border p-5 shadow-xl shadow-black/20 backdrop-blur-sm sm:p-8 bg-[var(--color-card)]/40";
  if (kind === "prologue") return `${base} border-amber-500/25 ring-1 ring-amber-500/10`;
  if (kind === "horizon") return `${base} border-cyan-500/25 ring-1 ring-cyan-500/10`;
  return `${base} border-[var(--color-border)]`;
}

function periodEyebrow(kind: MonthTab["kind"]): string {
  if (kind === "prologue") return "En bref";
  if (kind === "horizon") return "À venir";
  return "Ce mois-ci";
}

export default function ChangelogPageClient() {
  const progress = useScrollProgress();
  const defaultId = MONTHLY_CHANGELOG[MONTHLY_CHANGELOG.length - 1]?.id ?? "2026-05";
  const [activeId, setActiveId] = useState(defaultId);

  const active = useMemo(() => MONTHLY_CHANGELOG.find((m) => m.id === activeId) ?? MONTHLY_CHANGELOG[0], [activeId]);

  useEffect(() => {
    const hash = typeof window !== "undefined" ? window.location.hash.replace(/^#/, "") : "";
    if (hash && MONTHLY_CHANGELOG.some((m) => m.id === hash)) {
      setActiveId(hash);
    }
  }, []);

  const selectMonth = useCallback((id: string) => {
    setActiveId(id);
    if (typeof window !== "undefined") {
      const url = `${window.location.pathname}${window.location.search}#${id}`;
      window.history.replaceState(null, "", url);
    }
  }, []);

  return (
    <div className="relative min-w-0">
      <div
        className="pointer-events-none fixed left-0 top-0 z-[60] h-[3px] bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-400 transition-[width] duration-150 ease-out"
        style={{ width: `${progress}%` }}
        aria-hidden
      />

      {/* Hero */}
      <div className="relative -mx-3 overflow-hidden rounded-b-3xl border-b border-[var(--color-border)] sm:-mx-6 lg:-mx-8 lg:rounded-b-[2rem]">
        <div className={`absolute inset-0 ${styles.meshGradient}`} aria-hidden />
        <div className={`absolute inset-0 ${styles.gridPattern} opacity-40`} aria-hidden />
        <div
          className={`pointer-events-none absolute -left-20 top-10 h-72 w-72 rounded-full bg-violet-600/25 blur-3xl ${styles.blobA}`}
          aria-hidden
        />
        <div
          className={`pointer-events-none absolute -right-10 bottom-0 h-64 w-64 rounded-full bg-cyan-500/20 blur-3xl ${styles.blobB}`}
          aria-hidden
        />
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <div className={`absolute -left-1/2 top-0 h-px w-[200%] bg-gradient-to-r from-transparent via-white/20 to-transparent ${styles.heroShimmer}`} />
        </div>

        <div className="relative mx-auto max-w-5xl px-4 pb-14 pt-10 sm:px-6 sm:pb-16 sm:pt-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-medium text-violet-100/90 backdrop-blur-md">
            <CalendarRange className="h-3.5 w-3.5 text-cyan-300" aria-hidden />
            Hiver 2025 → printemps 2026
          </div>
          <h1 className="mt-4 max-w-3xl text-3xl font-extrabold tracking-tight text-white drop-shadow-sm sm:text-5xl lg:text-6xl">
            Quoi de neuf sur TENF&nbsp;?
            <span className="mt-2 block bg-gradient-to-r from-violet-200 via-white to-cyan-200 bg-clip-text text-2xl text-transparent sm:text-3xl lg:text-4xl">
              Un récap mois par mois
            </span>
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-violet-100/88 sm:text-lg">
            Chaque période raconte ce qui change pour <strong className="text-white">vous</strong> sur le site (lives,
            intégration, boutique, profils…) et ce qui aide <strong className="text-white">celles et ceux qui animent</strong>{" "}
            la communauté au quotidien. Pas de vocabulaire technique : uniquement des effets concrets.
          </p>
          <p className="mt-3 max-w-2xl text-xs text-violet-200/75 sm:text-sm">
            TENF, c’est d’abord une communauté Twitch et Discord ; le site sert à la rendre plus lisible. Merci à
            Red_Shadow_31, Nexou31, Clara et à tout le monde qui donne un peu de temps pour faire tourner la New Family.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/fonctionnement-tenf/decouvrir"
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/15"
            >
              <GraduationCap className="h-4 w-4" aria-hidden />
              Comprendre TENF
            </Link>
            <Link
              href="/changelog#2026-05"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-violet-950 shadow-lg shadow-violet-900/30 transition hover:bg-violet-50"
            >
              Mai 2026 (récent)
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link
              href="/changelog#avant-le-site"
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2.5 text-sm font-medium text-amber-100/95 transition hover:bg-white/10"
            >
              TENF, Discord & le site
            </Link>
            <Link
              href="/changelog#horizon-2026-ete"
              className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/30 px-4 py-2.5 text-sm font-medium text-cyan-100 transition hover:bg-cyan-500/10"
            >
              Envies pour l’été
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-3 pb-24 pt-6 sm:px-6 lg:px-8">
        {/* Onglets mois */}
        <div className="sticky top-[52px] z-30 -mx-1 border-b border-[var(--color-border)] bg-[var(--color-bg)]/92 py-3 backdrop-blur-md sm:top-14 lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:py-0 lg:backdrop-blur-none">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-secondary)] lg:hidden">
            Choisir une période
          </p>
          <div
            className="scrollbar-x-none flex gap-2 overflow-x-auto pb-1 lg:flex-wrap lg:overflow-visible"
            role="tablist"
            aria-label="Périodes du journal des nouveautés"
          >
            {MONTHLY_CHANGELOG.map((m) => {
              const selected = m.id === activeId;
              const hintMuted =
                m.kind === "prologue"
                  ? selected
                    ? "text-amber-50/90"
                    : "text-amber-200/70"
                  : m.kind === "horizon"
                    ? selected
                      ? "text-cyan-50/90"
                      : "text-cyan-200/70"
                    : selected
                      ? "text-white/90"
                      : "";
              return (
                <button
                  key={m.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  id={`tab-${m.id}`}
                  aria-controls={`panel-${m.id}`}
                  onClick={() => selectMonth(m.id)}
                  className={tabButtonClass(m, selected)}
                >
                  <span className="block leading-tight">{m.label}</span>
                  <span className={`mt-0.5 block text-[10px] font-normal ${hintMuted}`}>{m.hint}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Panneau */}
        <div
          role="tabpanel"
          id={`panel-${active.id}`}
          aria-labelledby={`tab-${active.id}`}
          className={panelClass(active.kind)}
        >
          <header className="border-b border-[var(--color-border)] pb-6">
            <p
              className={`text-xs font-semibold uppercase tracking-[0.16em] ${
                active.kind === "prologue"
                  ? "text-amber-400/95"
                  : active.kind === "horizon"
                    ? "text-cyan-400/95"
                    : "text-violet-400/95"
              }`}
            >
              {periodEyebrow(active.kind)}
            </p>
            <h2 className="mt-2 text-2xl font-bold text-[var(--color-text)] sm:text-3xl">{active.label}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[var(--color-text-secondary)] sm:text-base">
              {active.intro}
            </p>
          </header>

          <div className="mt-8 grid gap-6 lg:grid-cols-2 lg:gap-8">
            <section
              className="rounded-2xl border border-emerald-500/20 bg-gradient-to-b from-emerald-500/10 to-transparent p-5 sm:p-6"
              aria-labelledby={`${active.id}-bloc-public`}
            >
              <h3 id={`${active.id}-bloc-public`} className="flex items-center gap-2 text-lg font-bold text-[var(--color-text)]">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-200">
                  <Users className="h-5 w-5" aria-hidden />
                </span>
                Pour vous
              </h3>
              <p className="mt-2 text-xs text-[var(--color-text-secondary)] sm:text-sm">
                Membres, futur·e membre, viewer ou curieux·se : ce que vous voyez, ce que vous pouvez faire, ce qui devient
                plus simple sur le site.
              </p>
              <ul className="mt-5 space-y-3 text-sm leading-relaxed text-[var(--color-text-secondary)] sm:text-base">
                {active.pourToutLeMonde.map((line, idx) => (
                  <li key={`${active.id}-p-${idx}`} className="flex gap-3">
                    <HeartHandshake className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400/90" aria-hidden />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section
              className="rounded-2xl border border-violet-500/25 bg-gradient-to-b from-violet-600/12 to-transparent p-5 sm:p-6"
              aria-labelledby={`${active.id}-bloc-staff`}
            >
              <h3 id={`${active.id}-bloc-staff`} className="flex items-center gap-2 text-lg font-bold text-[var(--color-text)]">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600/25 text-violet-100">
                  <Shield className="h-5 w-5" aria-hidden />
                </span>
                Pour l’équipe d’animation
              </h3>
              <p className="mt-2 text-xs text-[var(--color-text-secondary)] sm:text-sm">
                Staff, bénévoles, modération : ce qui vous fait gagner du temps ou de la sérénité pour préparer les
                réunions, les évaluations et les gros moments collectifs.
              </p>
              <ul className="mt-5 space-y-3 text-sm leading-relaxed text-[var(--color-text-secondary)] sm:text-base">
                {active.pourLeStaff.map((line, idx) => (
                  <li key={`${active.id}-s-${idx}`} className="flex gap-3">
                    <LayoutList className="mt-0.5 h-5 w-5 shrink-0 text-violet-300/90" aria-hidden />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <p className="mt-8 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]/60 px-4 py-3 text-center text-xs text-[var(--color-text-secondary)] sm:text-sm">
            {active.kind === "horizon"
              ? "L’été sera raconté au fil des mois : ce cadre sert seulement à partager des envies collectives, pas à promettre une date précise pour chaque idée."
              : active.kind === "prologue"
                ? "Le site a pris son rythme à partir du 9 décembre 2025 ; la communauté, elle, bougeait déjà bien avant sur Discord et Twitch — les deux restent complémentaires."
                : "En coulisses, des ajustements réguliers rendent le site plus stable : souvent vous ne les voyez pas, mais ils évitent des bugs ou des messages d’erreur frustrants."}
          </p>
        </div>

        {/* Liens utiles */}
        <footer className="mt-14 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)]/50 p-6 sm:p-8">
          <h2 className="text-lg font-bold text-[var(--color-text)] sm:text-xl">Poursuivre la visite</h2>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            Quelques pages utiles une fois que vous avez pris le pouls des nouveautés.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/membres"
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-2.5 text-sm font-semibold text-[var(--color-text)] transition hover:border-violet-500/40"
            >
              <Users className="h-4 w-4 text-violet-400" aria-hidden />
              Annuaire
            </Link>
            <Link
              href="/lives"
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-2.5 text-sm font-semibold text-[var(--color-text)] transition hover:border-violet-500/40"
            >
              <Radio className="h-4 w-4 text-cyan-400" aria-hidden />
              Lives
            </Link>
            <Link
              href="/avis-tenf"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-900/25"
            >
              <Sparkles className="h-4 w-4" aria-hidden />
              Témoignages
            </Link>
            <Link
              href="/partenaire-tenf"
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] px-4 py-2.5 text-sm font-medium text-[var(--color-text)] transition hover:border-violet-500/35"
            >
              Partenaire UPA
            </Link>
          </div>
          <p className="mt-6 text-center text-xs text-[var(--color-text-secondary)] sm:text-sm">
            Un avis, une idée, un truc qui coince encore ? Sur Discord, votre retour nourrit directement les prochaines
            améliorations.
          </p>
        </footer>
      </div>
    </div>
  );
}

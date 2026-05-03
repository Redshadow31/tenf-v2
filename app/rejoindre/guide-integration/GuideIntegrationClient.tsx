"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarClock,
  Check,
  ChevronDown,
  Gift,
  Headphones,
  Heart,
  HelpCircle,
  MessageCircle,
  PartyPopper,
  Shield,
  Sparkles,
  Users,
  X,
  ClipboardList,
  ExternalLink,
} from "lucide-react";

const PREP_STORAGE_KEY = "tenf:guide-integration:prep-checklist-v1";

const NAV = [
  { id: "pourquoi", label: "Pourquoi" },
  { id: "deroule", label: "Déroulé" },
  { id: "piliers", label: "Les 3 axes" },
  { id: "apres", label: "Après" },
  { id: "faq", label: "FAQ" },
] as const;

const FAQ_ITEMS = [
  {
    q: "Est-ce un entretien ou un test ?",
    a: "Non. C’est un échange vocal de groupe : présentation du fonctionnement TENF, du cadre d’entraide, et du temps pour tes questions. Personne ne te « note ».",
  },
  {
    q: "Que se passe-t-il si je ne peux pas venir à mon créneau ?",
    a: "Contacte le staff sur Discord dès que possible pour décaler ou annuler ta place, afin de libérer le créneau pour quelqu’un d’autre.",
  },
  {
    q: "Dois-je déjà avoir mon espace membre ?",
    a: "Ce n’est pas obligatoire avant la réunion, mais c’est fortement conseillé : tu gagneras du temps pour les étapes suivantes.",
  },
  {
    q: "Puis-je venir sans micro ?",
    a: "La réunion est orale : un micro correct (casque ou micro PC) permet à tout le monde de s’entendre clairement. Si tu as un souci technique, préviens le staff à l’avance.",
  },
  {
    q: "Combien de temps dure la session ?",
    a: "En général une petite heure selon les questions du groupe. Le staff annonce le cadre en début de réunion.",
  },
] as const;

const DEFAULT_CHECKLIST = [false, false, false, false, false, false] as const;

const TIMELINE_STEPS = [
  {
    title: "Accueil",
    short: "Cadre & tour de table",
    body: "Accueil du groupe, rappel du cadre bienveillant et brève présentation pour mettre tout le monde à l’aise.",
  },
  {
    title: "Fonctionnement",
    short: "Entraide & outils",
    body: "Explication du système d’entraide, des salons utiles, des bons réflexes (raids, présence, communication) et des limites à respecter.",
  },
  {
    title: "Clôture",
    short: "Questions & suite",
    body: "Temps de questions/réponses, rappel des prochaines étapes, puis validation de ton intégration officielle côté TENF.",
  },
] as const;

const CHECKLIST_LABELS = [
  "Mon Discord est prêt (je peux me connecter le jour J).",
  "J’ai testé micro + casque (ou prévenu le staff si souci).",
  "J’ai noté mon pseudo / lien Twitch et mon parrain TENF.",
  "J’ai lu ce guide ou le survolé au moins une fois.",
  "Je sais où se trouve le salon vocal indiqué sur la fiche session.",
  "J’ai réservé (ou je vais réserver) mon créneau sur la page intégration.",
] as const;

function loadChecklist(): boolean[] {
  if (typeof window === "undefined") return [...DEFAULT_CHECKLIST];
  try {
    const raw = window.sessionStorage.getItem(PREP_STORAGE_KEY);
    if (!raw) return [...DEFAULT_CHECKLIST];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed) || parsed.length !== CHECKLIST_LABELS.length) return [...DEFAULT_CHECKLIST];
    return parsed.map((v) => Boolean(v));
  } catch {
    return [...DEFAULT_CHECKLIST];
  }
}

function PrepModal({
  open,
  onClose,
  checklist,
  onToggle,
  progress,
}: {
  open: boolean;
  onClose: () => void;
  checklist: boolean[];
  onToggle: (index: number) => void;
  progress: number;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center overflow-hidden bg-black/75 p-0 backdrop-blur-md sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="prep-modal-title"
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-lg max-h-[85dvh] flex-col overflow-hidden rounded-t-3xl border border-violet-500/30 bg-[#0b0c12] text-white shadow-2xl shadow-violet-950/50 sm:max-h-[min(85dvh,680px)] sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative shrink-0 border-b border-white/10 bg-gradient-to-br from-violet-950/80 via-[#0b0c12] to-fuchsia-950/40 px-5 pb-5 pt-6 sm:px-6">
          <div className="pointer-events-none absolute right-0 top-0 h-32 w-32 rounded-full bg-fuchsia-500/20 blur-3xl" />
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 rounded-xl border border-white/15 bg-black/30 p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-violet-200/90">
            <ClipboardList className="h-4 w-4" />
            Checklist
          </div>
          <h2 id="prep-modal-title" className="mt-2 text-xl font-bold tracking-tight sm:text-2xl">
            Préparer ma réunion d&apos;intégration
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            Coche ce qui est fait : tout reste sur ton appareil (session navigateur). Utilise-la comme aide-mémoire
            avant d&apos;ouvrir ta fiche sur la page des créneaux.
          </p>
          <div className="mt-4">
            <div className="mb-1 flex justify-between text-[11px] font-medium text-slate-500">
              <span>Progression</span>
              <span>{Math.round(progress * 100)} %</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-[width] duration-300"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-5 py-4 sm:px-6">
          <ul className="space-y-3">
            {CHECKLIST_LABELS.map((label, i) => (
              <li key={label}>
                <button
                  type="button"
                  onClick={() => onToggle(i)}
                  className={`flex w-full items-start gap-3 rounded-2xl border px-3 py-3 text-left text-sm transition ${
                    checklist[i]
                      ? "border-emerald-500/40 bg-emerald-950/25 text-emerald-50"
                      : "border-white/10 bg-white/[0.03] text-slate-200 hover:border-violet-400/35"
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border ${
                      checklist[i] ? "border-emerald-400/50 bg-emerald-500/20" : "border-white/20 bg-black/30"
                    }`}
                  >
                    {checklist[i] ? <Check className="h-3.5 w-3.5 text-emerald-300" strokeWidth={3} /> : null}
                  </span>
                  <span className="leading-snug">{label}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex shrink-0 flex-col gap-2 border-t border-white/10 bg-black/25 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <Link
            href="/integration"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2.5 text-center text-sm font-semibold text-white shadow-lg shadow-violet-900/30 transition hover:brightness-110"
            onClick={onClose}
          >
            Voir les créneaux
            <ExternalLink className="h-4 w-4" />
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/15 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/5"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

export default function GuideIntegrationClient() {
  const [prepOpen, setPrepOpen] = useState(false);
  const [checklist, setChecklist] = useState<boolean[]>(() => [...DEFAULT_CHECKLIST]);
  const [faqOpen, setFaqOpen] = useState<number | null>(0);
  const [timelineStep, setTimelineStep] = useState(0);

  useEffect(() => {
    setChecklist(loadChecklist());
  }, []);

  useEffect(() => {
    try {
      window.sessionStorage.setItem(PREP_STORAGE_KEY, JSON.stringify(checklist));
    } catch {
      /* ignore */
    }
  }, [checklist]);

  const progress = useMemo(
    () => checklist.filter(Boolean).length / CHECKLIST_LABELS.length,
    [checklist]
  );

  const toggleCheck = useCallback((i: number) => {
    setChecklist((prev) => {
      const next = [...prev];
      next[i] = !next[i];
      return next;
    });
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <main className="relative min-h-screen overflow-x-hidden" style={{ backgroundColor: "var(--color-bg)" }}>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 left-1/2 h-96 w-[min(100vw,28rem)] -translate-x-1/2 rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(167,139,250,0.28) 0%, transparent 70%)" }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 right-0 h-[28rem] w-[28rem] rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(236,72,153,0.14) 0%, transparent 72%)" }}
      />

      <div className="relative mx-auto max-w-5xl px-4 py-10 sm:py-14">
        {/* Hero */}
        <section
          id="top"
          className="relative overflow-hidden rounded-3xl border p-6 shadow-[0_20px_50px_rgba(0,0,0,0.35)] sm:p-10"
          style={{
            borderColor: "rgba(145, 70, 255, 0.35)",
            background:
              "linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 20%, var(--color-card)) 0%, var(--color-card) 42%, color-mix(in srgb, #ec4899 10%, var(--color-card)) 100%)",
          }}
        >
          <div className="pointer-events-none absolute -right-20 top-0 h-48 w-48 rounded-full bg-fuchsia-500/15 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-0 h-40 w-40 rounded-full bg-violet-500/15 blur-3xl" />

          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 max-w-3xl">
              <div className="flex flex-wrap gap-2">
                <span
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/90"
                >
                  <Sparkles className="h-3.5 w-3.5 text-violet-300" />
                  Parcours public & futurs membres
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/35 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-100">
                  <Heart className="h-3.5 w-3.5" />
                  Bienveillance TENF
                </span>
              </div>
              <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl" style={{ color: "var(--color-text)" }}>
                Guide d&apos;intégration TENF
              </h1>
              <p className="mt-4 text-sm leading-relaxed sm:text-base" style={{ color: "var(--color-text-secondary)" }}>
                La <strong style={{ color: "var(--color-text)" }}>réunion d&apos;intégration</strong> est le moment où tu
                passes du « curieux » au <strong style={{ color: "var(--color-text)" }}>membre aligné</strong> avec le
                fonctionnement de la communauté : entraide, cadre et entraide réelle entre streamers.
              </p>
              <p className="mt-3 text-sm leading-relaxed sm:text-base" style={{ color: "var(--color-text-secondary)" }}>
                Ce n&apos;est <strong style={{ color: "var(--color-text)" }}>ni un examen ni un jugement</strong> : une
                mise en route claire, avec le staff et les autres participants.
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setPrepOpen(true)}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/15"
                >
                  <ClipboardList className="h-4 w-4" />
                  Checklist interactive
                </button>
                <Link
                  href="/integration"
                  className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:brightness-110"
                  style={{ backgroundColor: "var(--color-primary)" }}
                >
                  Choisir un créneau
                  <CalendarClock className="h-4 w-4" />
                </Link>
                <Link
                  href="/rejoindre"
                  className="inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition hover:opacity-90"
                  style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
                >
                  Autres guides
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div
              className="flex w-full shrink-0 flex-col gap-3 rounded-2xl border border-white/15 bg-black/25 p-4 backdrop-blur-sm sm:max-w-xs"
              style={{ boxShadow: "0 12px 40px rgba(0,0,0,0.25)" }}
            >
              <p className="text-[11px] font-semibold uppercase tracking-wide text-violet-200/80">En résumé</p>
              <ul className="space-y-2 text-sm text-slate-200/95">
                <li className="flex gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                  Vocal de groupe, cadre posé
                </li>
                <li className="flex gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                  Questions libres à la fin
                </li>
                <li className="flex gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                  Déblocage du statut membre actif
                </li>
              </ul>
              <div className="mt-1 border-t border-white/10 pt-3">
                <p className="text-xs text-slate-400">
                  Astuce : connecte <strong className="text-slate-200">Discord</strong> avant de réserver — inscription
                  plus rapide sur la fiche session.
                </p>
                <Link
                  href="/api/auth/signin/discord"
                  className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-white/15 py-2 text-xs font-semibold text-white transition hover:bg-white/10"
                >
                  Lier Discord
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Sticky mini-nav */}
        <nav
          className="sticky top-2 z-30 mt-6 flex flex-wrap justify-center gap-1 rounded-2xl border p-1.5 backdrop-blur-md"
          style={{
            borderColor: "rgba(145, 70, 255, 0.25)",
            backgroundColor: "color-mix(in srgb, var(--color-card) 88%, transparent)",
            boxShadow: "0 8px 28px rgba(0,0,0,0.2)",
          }}
          aria-label="Sections du guide"
        >
          {NAV.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => scrollTo(item.id)}
              className="shrink-0 rounded-xl px-3 py-2 text-xs font-semibold transition hover:bg-white/10 sm:text-sm"
              style={{ color: "var(--color-text)" }}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Pourquoi */}
        <section
          id="pourquoi"
          className="mt-10 scroll-mt-24 rounded-3xl border p-6 sm:p-8"
          style={{
            borderColor: "var(--color-border)",
            backgroundColor: "var(--color-card)",
            boxShadow: "0 12px 36px rgba(0,0,0,0.22)",
          }}
        >
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="max-w-2xl">
              <h2 className="text-xl font-bold sm:text-2xl" style={{ color: "var(--color-text)" }}>
                L&apos;état d&apos;esprit TENF
              </h2>
              <p className="mt-3 text-sm leading-relaxed sm:text-base" style={{ color: "var(--color-text-secondary)" }}>
                TENF, ce n&apos;est pas une promesse marketing : c&apos;est une communauté de streamers qui se suit,
                se relaie et partage des repères concrets (lives, raids, entraide). La réunion d&apos;intégration sert à
                <strong style={{ color: "var(--color-text)" }}> aligner les attentes</strong> — les tiennes et celles du
                collectif — avant d&apos;ouvrir tous les salons.
              </p>
            </div>
            <div className="grid shrink-0 grid-cols-2 gap-2 sm:grid-cols-1">
              {[
                { icon: Users, label: "Rencontre", sub: "Voix du staff & du groupe" },
                { icon: Shield, label: "Cadre", sub: "Règles & entraide" },
                { icon: MessageCircle, label: "Questions", sub: "Temps dédié" },
                { icon: PartyPopper, label: "Accueil", sub: "Sans pression" },
              ].map(({ icon: Icon, label, sub }) => (
                <div
                  key={label}
                  className="rounded-2xl border p-3 text-center transition hover:-translate-y-0.5"
                  style={{ borderColor: "var(--color-border)", backgroundColor: "color-mix(in srgb, var(--color-bg) 50%, var(--color-card))" }}
                >
                  <Icon className="mx-auto h-6 w-6" style={{ color: "var(--color-primary)" }} />
                  <p className="mt-2 text-xs font-semibold" style={{ color: "var(--color-text)" }}>
                    {label}
                  </p>
                  <p className="text-[10px] opacity-80" style={{ color: "var(--color-text-secondary)" }}>
                    {sub}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Déroulé — timeline interactive */}
        <section
          id="deroule"
          className="mt-8 scroll-mt-24 rounded-3xl border p-6 sm:p-8"
          style={{
            borderColor: "rgba(145, 70, 255, 0.28)",
            backgroundColor: "var(--color-card)",
            boxShadow: "0 12px 36px rgba(0,0,0,0.22)",
          }}
        >
          <h2 className="text-xl font-bold sm:text-2xl" style={{ color: "var(--color-text)" }}>
            Comment se passe la réunion
          </h2>
          <p className="mt-2 max-w-2xl text-sm sm:text-base" style={{ color: "var(--color-text-secondary)" }}>
            Clique sur une étape pour lire le détail — l&apos;ordre suit le fil conducteur habituel d&apos;une session
            TENF.
          </p>

          <div className="mt-8 grid gap-6 lg:grid-cols-[auto_1fr]">
            <div className="flex flex-row flex-wrap justify-center gap-2 pb-1 lg:flex-col lg:flex-nowrap lg:justify-start">
              {TIMELINE_STEPS.map((step, i) => (
                <button
                  key={step.title}
                  type="button"
                  onClick={() => setTimelineStep(i)}
                  className={`flex min-w-[8.5rem] flex-col rounded-2xl border px-4 py-3 text-left transition lg:min-w-0 ${
                    timelineStep === i ? "ring-2 ring-[var(--color-primary)] ring-offset-2 ring-offset-[var(--color-card)]" : ""
                  }`}
                  style={{
                    borderColor: timelineStep === i ? "var(--color-primary)" : "var(--color-border)",
                    backgroundColor:
                      timelineStep === i
                        ? "color-mix(in srgb, var(--color-primary) 14%, var(--color-card))"
                        : "color-mix(in srgb, var(--color-bg) 40%, var(--color-card))",
                  }}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wide text-violet-300/90">Étape {i + 1}</span>
                  <span className="mt-1 font-semibold" style={{ color: "var(--color-text)" }}>
                    {step.title}
                  </span>
                  <span className="mt-0.5 text-xs opacity-80" style={{ color: "var(--color-text-secondary)" }}>
                    {step.short}
                  </span>
                </button>
              ))}
            </div>

            <div
              className="rounded-2xl border p-5 sm:p-6"
              style={{
                borderColor: "var(--color-border)",
                background: "linear-gradient(160deg, color-mix(in srgb, var(--color-primary) 8%, transparent) 0%, transparent 55%)",
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-2xl text-lg font-bold text-white"
                  style={{ backgroundColor: "var(--color-primary)" }}
                >
                  {timelineStep + 1}
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-primary)" }}>
                    Détail
                  </p>
                  <p className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>
                    {TIMELINE_STEPS[timelineStep].title}
                  </p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-relaxed sm:text-base" style={{ color: "var(--color-text-secondary)" }}>
                {TIMELINE_STEPS[timelineStep].body}
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={timelineStep <= 0}
                  onClick={() => setTimelineStep((s) => Math.max(0, s - 1))}
                  className="rounded-xl border px-4 py-2 text-sm font-medium disabled:opacity-40"
                  style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
                >
                  Étape précédente
                </button>
                <button
                  type="button"
                  disabled={timelineStep >= TIMELINE_STEPS.length - 1}
                  onClick={() => setTimelineStep((s) => Math.min(TIMELINE_STEPS.length - 1, s + 1))}
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
                  style={{ backgroundColor: "var(--color-primary)" }}
                >
                  Étape suivante
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 3 piliers */}
        <section id="piliers" className="mt-8 scroll-mt-24 grid gap-4 md:grid-cols-3">
          {[
            {
              icon: Headphones,
              title: "Comprendre le serveur",
              body: "Entraide, raids, visibilité : on te donne des repères concrets pour t’impliquer sans te perdre dans les salons.",
            },
            {
              icon: Heart,
              title: "Créer un lien humain",
              body: "Mettre une voix sur les pseudos, poser les questions « bêtes » sans jugement, et rencontrer le staff comme des pairs.",
            },
            {
              icon: Shield,
              title: "Garder une communauté saine",
              body: "Alignement sur les règles et les valeurs : moins de malentendus, moins de membres fantômes, plus de confiance réciproque.",
            },
          ].map((card) => (
            <article
              key={card.title}
              className="group rounded-2xl border p-5 transition duration-200 hover:-translate-y-1 hover:shadow-lg"
              style={{
                borderColor: "var(--color-border)",
                backgroundColor: "var(--color-card)",
                boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
              }}
            >
              <div
                className="flex h-11 w-11 items-center justify-center rounded-xl transition group-hover:scale-105"
                style={{
                  backgroundColor: "color-mix(in srgb, var(--color-primary) 18%, transparent)",
                  color: "var(--color-primary)",
                }}
              >
                <card.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-semibold" style={{ color: "var(--color-text)" }}>
                {card.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                {card.body}
              </p>
            </article>
          ))}
        </section>

        {/* Après */}
        <section
          id="apres"
          className="mt-8 scroll-mt-24 rounded-3xl border p-6 sm:p-8"
          style={{
            borderColor: "var(--color-border)",
            backgroundColor: "var(--color-card)",
            boxShadow: "0 12px 36px rgba(0,0,0,0.2)",
          }}
        >
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-bold sm:text-2xl" style={{ color: "var(--color-text)" }}>
                Ce que tu débloques après la réunion
              </h2>
              <p className="mt-2 max-w-xl text-sm" style={{ color: "var(--color-text-secondary)" }}>
                L’objectif : que tu arrives dans les salons actifs avec les mêmes repères que les autres membres.
              </p>
            </div>
            <Link
              href="/integration"
              className="inline-flex shrink-0 items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              <Gift className="h-4 w-4" />
              Réserver
            </Link>
          </div>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {[
              "Intégration officielle au sein de TENF",
              "Accès aux salons de promotion et d’entraide structurée",
              "Participation aux points et récompenses communautaires",
              "Statut de membre actif aligné avec le fonctionnement collectif",
            ].map((line) => (
              <li
                key={line}
                className="flex items-start gap-3 rounded-2xl border p-4 text-sm"
                style={{ borderColor: "var(--color-border)", backgroundColor: "color-mix(in srgb, var(--color-bg) 35%, var(--color-card))" }}
              >
                <ZapMini />
                <span style={{ color: "var(--color-text-secondary)" }}>{line}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* FAQ */}
        <section
          id="faq"
          className="mt-8 scroll-mt-24 rounded-3xl border p-6 sm:p-8"
          style={{
            borderColor: "rgba(145, 70, 255, 0.25)",
            background:
              "linear-gradient(180deg, color-mix(in srgb, var(--color-primary) 10%, var(--color-card)) 0%, var(--color-card) 45%)",
            boxShadow: "0 12px 36px rgba(0,0,0,0.2)",
          }}
        >
          <div className="mb-6 flex items-center gap-2">
            <HelpCircle className="h-6 w-6" style={{ color: "var(--color-primary)" }} />
            <h2 className="text-xl font-bold sm:text-2xl" style={{ color: "var(--color-text)" }}>
              Questions fréquentes
            </h2>
          </div>
          <div className="space-y-2">
            {FAQ_ITEMS.map((item, i) => {
              const open = faqOpen === i;
              return (
                <div
                  key={item.q}
                  className="overflow-hidden rounded-2xl border transition"
                  style={{
                    borderColor: open ? "color-mix(in srgb, var(--color-primary) 45%, var(--color-border))" : "var(--color-border)",
                    backgroundColor: "color-mix(in srgb, var(--color-bg) 40%, var(--color-card))",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setFaqOpen(open ? null : i)}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left sm:px-5"
                    aria-expanded={open}
                  >
                    <span className="font-semibold" style={{ color: "var(--color-text)" }}>
                      {item.q}
                    </span>
                    <ChevronDown
                      className={`h-5 w-5 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
                      style={{ color: "var(--color-primary)" }}
                    />
                  </button>
                  {open ? (
                    <div className="border-t px-4 pb-4 pt-0 sm:px-5" style={{ borderColor: "var(--color-border)" }}>
                      <p className="pt-3 text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                        {item.a}
                      </p>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
          <p className="mt-6 text-center text-sm" style={{ color: "var(--color-text-secondary)" }}>
            D’autres réponses dans la{" "}
            <Link href="/rejoindre/faq" className="font-semibold underline decoration-[var(--color-primary)] underline-offset-2" style={{ color: "var(--color-primary)" }}>
              FAQ rejoindre TENF
            </Link>
            .
          </p>
        </section>

        {/* CTA */}
        <section
          className="mt-10 rounded-3xl border p-8 text-center shadow-[0_16px_48px_rgba(0,0,0,0.35)] sm:p-10"
          style={{
            borderColor: "rgba(145, 70, 255, 0.35)",
            background:
              "linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 22%, var(--color-card)) 0%, var(--color-card) 50%, color-mix(in srgb, #06b6d4 12%, var(--color-card)) 100%)",
          }}
        >
          <h2 className="text-2xl font-bold sm:text-3xl" style={{ color: "var(--color-text)" }}>
            Prêt(e) à rejoindre l&apos;aventure ?
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed sm:text-base" style={{ color: "var(--color-text-secondary)" }}>
            Ouvre le calendrier des sessions, lis la fiche, puis confirme ta place. La checklist du modal t&apos;aide à
            ne rien oublier avant le jour J.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/integration"
              className="inline-flex items-center gap-2 rounded-xl px-8 py-3.5 text-sm font-bold text-white shadow-xl transition hover:brightness-110"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              Je réserve mon créneau
              <ArrowRight className="h-4 w-4" />
            </Link>
            <button
              type="button"
              onClick={() => setPrepOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-black/20 px-5 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-black/30"
            >
              Ouvrir la checklist
            </button>
          </div>
        </section>
      </div>

      <PrepModal open={prepOpen} onClose={() => setPrepOpen(false)} checklist={checklist} onToggle={toggleCheck} progress={progress} />
    </main>
  );
}

function ZapMini() {
  return (
    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: "color-mix(in srgb, var(--color-primary) 25%, transparent)" }}>
      <Sparkles className="h-3.5 w-3.5" style={{ color: "var(--color-primary)" }} />
    </span>
  );
}

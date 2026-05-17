"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Archive,
  ArrowRight,
  CalendarRange,
  Check,
  ChevronDown,
  ClipboardList,
  Filter,
  Mic2,
  MonitorPlay,
  Sparkles,
  Users,
} from "lucide-react";
import { OnboardingContenusHubView } from "@/components/admin/OnboardingContenusHubView";

const hubPanelClass =
  "rounded-2xl border border-white/[0.08] bg-zinc-950/55 shadow-sm shadow-black/20 ring-1 ring-inset ring-white/[0.03]";
const focusRingClass =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950";

type Priority = "Critique" | "Secondaire";

type ContentCard = {
  href: string;
  title: string;
  description: string;
  detail: string;
  priority: Priority;
  owner: string;
  gradient: string;
  icon: LucideIcon;
  audienceLabel: string;
  prepTip: string;
};

const cards: ContentCard[] = [
  {
    href: "/admin/onboarding/presentation",
    title: "Présentation",
    description: "Support visuel principal pendant la session d'accueil.",
    detail:
      "Les nouveaux voient souvent ces slides en même temps que toi : garde un rythme lent, annonce les transitions, et relie chaque section à ce qu'ils vivront sur Discord et Twitch.",
    priority: "Critique",
    owner: "Modération session",
    gradient: "from-cyan-500 to-blue-600",
    icon: MonitorPlay,
    audienceLabel: "Salle + replay mental",
    prepTip: "Tester les liens et le plein écran 24 h avant.",
  },
  {
    href: "/admin/onboarding/discours2",
    title: "Discours & trame",
    description: "Script section par section pour un ton homogène TENF.",
    detail:
      "C'est la colonne vertébrale du message : accueil, valeurs, règles, outils. Les membres s'en souviennent surtout si les exemples sont vrais et locaux — évite le jargon admin.",
    priority: "Critique",
    owner: "Lead onboarding",
    gradient: "from-indigo-500 to-purple-600",
    icon: Mic2,
    audienceLabel: "Staff animateur",
    prepTip: "Repérer 2 anecdotes vivantes à insérer au milieu.",
  },
  {
    href: "/admin/onboarding/discours-mai-2026",
    title: "Discours — mai 2026",
    description: "Neuf blocs oraux : objectifs, conseils staff, suggestions par page.",
    detail:
      "Version plus récente : utile quand tu veux cadrer une session « printemps » ou comparer avec l'ancienne trame. Pense à dire explicitement quelle version tu suis pour ne pas mélanger les équipes.",
    priority: "Critique",
    owner: "Lead onboarding",
    gradient: "from-violet-500 to-fuchsia-600",
    icon: CalendarRange,
    audienceLabel: "Staff + alignement message",
    prepTip: "Choisir une version « canon » pour la soirée et s'y tenir.",
  },
  {
    href: "/admin/integration/discours",
    title: "Discours legacy",
    description: "Historique pour comparaison ou migration progressive.",
    detail:
      "À garder pour la transparence interne, pas comme fil conducteur live. Les membres ne doivent pas tomber dessus par erreur : réservé au staff et à la doc.",
    priority: "Secondaire",
    owner: "Référent contenu",
    gradient: "from-slate-500 to-slate-700",
    icon: Archive,
    audienceLabel: "Référentiel interne",
    prepTip: "Si tu cites le legacy, explique pourquoi en une phrase.",
  },
];

type FilterKey = "all" | "critical" | "secondary";

const CHECKLIST_STORAGE = "tenf-admin-onboarding-contenus-checklist-v1";

type ChecklistItem = { id: string; label: string };

const defaultChecklist: ChecklistItem[] = [
  { id: "links", label: "Liens et pages cibles testés (desktop + mobile)" },
  { id: "tone", label: "Ton aligné avec les règles staff et le vocabulaire TENF" },
  { id: "version", label: "Version du discours annoncée en ouverture de session" },
  { id: "legacy", label: "Legacy clairement identifié si quelqu'un ouvre l'ancienne trame" },
  { id: "debrief", label: "Créneau prévu pour noter les questions récurrentes après le live" },
];

const steps = [
  { title: "Avant", body: "Choisir la trame, relire les slides, valider les liens." },
  { title: "Pendant", body: "Une voix, un rythme : la salle suit le même récit que le chat." },
  { title: "Après", body: "Noter les frictions et mettre à jour les supports dans la foulée." },
];

export default function OnboardingContenusPage() {
  const [filter, setFilter] = useState<FilterKey>("all");
  const [expandedHref, setExpandedHref] = useState<string | null>(null);
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [checklistHydrated, setChecklistHydrated] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const gridRef = useRef<HTMLDivElement>(null);
  const prepRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CHECKLIST_STORAGE);
      if (raw) setChecklist(JSON.parse(raw) as Record<string, boolean>);
    } catch {
      /* ignore */
    }
    setChecklistHydrated(true);
  }, []);

  useEffect(() => {
    if (!checklistHydrated) return;
    try {
      localStorage.setItem(CHECKLIST_STORAGE, JSON.stringify(checklist));
    } catch {
      /* ignore */
    }
  }, [checklist, checklistHydrated]);

  const criticalCount = useMemo(() => cards.filter((c) => c.priority === "Critique").length, []);
  const secondaryCount = useMemo(() => cards.filter((c) => c.priority === "Secondaire").length, []);

  const filteredCards = useMemo(() => {
    if (filter === "critical") return cards.filter((c) => c.priority === "Critique");
    if (filter === "secondary") return cards.filter((c) => c.priority === "Secondaire");
    return cards;
  }, [filter]);

  const checklistDone = useMemo(
    () => defaultChecklist.filter((i) => checklist[i.id]).length,
    [checklist]
  );

  const scrollToGrid = useCallback(() => {
    gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const scrollToPrep = useCallback(() => {
    prepRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const filterCriticalAndScroll = useCallback(() => {
    setFilter("critical");
    scrollToGrid();
  }, [scrollToGrid]);

  const toggleCheck = (id: string) => {
    setChecklist((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleExpand = (href: string) => {
    setExpandedHref((h) => (h === href ? null : href));
  };

  const prepContent = (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.15fr_1fr]">
      <article className={`${hubPanelClass} p-5 md:p-6`}>
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-sky-400/25 bg-sky-500/15">
            <Sparkles className="h-5 w-5 text-sky-200" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold text-zinc-100">Déroulé conseillé</h2>
            <p className="mt-1 text-sm text-zinc-500">Trois temps pour garder le même niveau d&apos;info pour tous les nouveaux.</p>
          </div>
        </div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          {steps.map((s, i) => (
            <button
              key={s.title}
              type="button"
              onClick={() => setActiveStep(i)}
              className={`flex-1 rounded-2xl border px-4 py-4 text-left transition ${focusRingClass} ${
                activeStep === i
                  ? "border-violet-400/50 bg-violet-500/20"
                  : "border-white/[0.08] bg-zinc-900/40 hover:border-violet-400/25"
              }`}
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-violet-200/90">{s.title}</p>
              <p className="mt-2 text-sm leading-snug text-zinc-200">{s.body}</p>
            </button>
          ))}
        </div>
      </article>

      <article className={`${hubPanelClass} p-5 md:p-6`}>
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-400/25 bg-emerald-500/15">
            <ClipboardList className="h-5 w-5 text-emerald-200" aria-hidden />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-zinc-100">Checklist pré-session</h2>
            <p className="mt-1 text-sm text-zinc-500">Cochée localement sur ce navigateur — idéal en répétition staff.</p>
          </div>
        </div>
        <ul className="mt-5 space-y-2">
          {defaultChecklist.map((item) => {
            const done = Boolean(checklist[item.id]);
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => toggleCheck(item.id)}
                  className={`flex w-full items-start gap-3 rounded-xl border px-3 py-3 text-left text-sm transition ${focusRingClass} ${
                    done
                      ? "border-emerald-400/35 bg-emerald-500/10 text-emerald-50"
                      : "border-white/[0.08] bg-zinc-900/50 text-zinc-200 hover:border-violet-400/30"
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                      done ? "border-emerald-400 bg-emerald-500 text-white" : "border-zinc-600 bg-zinc-950"
                    }`}
                    aria-hidden
                  >
                    {done ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : null}
                  </span>
                  <span className={done ? "text-emerald-50/95" : ""}>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </article>
    </div>
  );

  const supportsGrid = (
    <>
      <div className={`${hubPanelClass} flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between`}>
        <div className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
          <Filter className="h-4 w-4 text-violet-300" aria-hidden />
          Filtrer les supports
        </div>
        <div className="flex flex-wrap gap-2">
          {(
            [
              { key: "all" as const, label: "Tous" },
              { key: "critical" as const, label: "Critiques seulement" },
              { key: "secondary" as const, label: "Secondaires" },
            ] as const
          ).map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wide transition ${focusRingClass} ${
                filter === key
                  ? "border-violet-400/60 bg-violet-500/25 text-white"
                  : "border-white/[0.08] bg-zinc-900/50 text-zinc-400 hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {filteredCards.map((card) => {
          const Icon = card.icon;
          const open = expandedHref === card.href;
          return (
            <div key={card.href} className={`${hubPanelClass} overflow-hidden transition hover:border-violet-400/25`}>
              <Link href={card.href} className={`group block p-5 ${focusRingClass} rounded-2xl`}>
                <div className="flex items-start gap-4">
                  <div
                    className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${card.gradient} shadow-lg`}
                  >
                    <Icon className="h-7 w-7 text-white" aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-bold text-white transition group-hover:text-violet-100">{card.title}</h3>
                    <p className="mt-1 text-sm text-zinc-400">{card.description}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span
                        className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                          card.priority === "Critique"
                            ? "border-rose-300/40 bg-rose-500/15 text-rose-100"
                            : "border-zinc-400/35 bg-zinc-500/15 text-zinc-200"
                        }`}
                      >
                        {card.priority}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-2.5 py-1 text-[11px] font-semibold text-cyan-100">
                        <Users className="h-3 w-3" aria-hidden />
                        {card.owner}
                      </span>
                      <span className="rounded-full border border-violet-400/30 bg-violet-500/10 px-2.5 py-1 text-[11px] font-medium text-violet-100">
                        {card.audienceLabel}
                      </span>
                    </div>
                    <p className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-violet-200">
                      Ouvrir le contenu
                      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
                    </p>
                  </div>
                </div>
              </Link>
              <div className="border-t border-white/10 px-5 pb-5">
                <button
                  type="button"
                  onClick={() => toggleExpand(card.href)}
                  className={`mt-3 flex w-full items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-zinc-300 transition hover:bg-white/5 ${focusRingClass}`}
                  aria-expanded={open}
                >
                  <span>Conseil staff &amp; membre</span>
                  <ChevronDown className={`h-4 w-4 shrink-0 transition ${open ? "rotate-180" : ""}`} aria-hidden />
                </button>
                {open ? (
                  <div className="mt-3 space-y-3 rounded-xl border border-violet-400/20 bg-violet-500/[0.07] p-4 text-sm leading-relaxed text-zinc-200">
                    <p>{card.detail}</p>
                    <p className="flex items-start gap-2 rounded-lg border border-amber-400/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
                      <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                      <span>
                        <strong className="font-semibold text-amber-50">Astuce live :</strong> {card.prepTip}
                      </span>
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </section>

      <section className={`${hubPanelClass} overflow-hidden`}>
        <div className="border-b border-white/[0.08] px-5 py-4 md:px-6">
          <h2 className="text-base font-bold text-white md:text-lg">Plan éditorial (vue rapide)</h2>
          <p className="mt-1 text-xs text-zinc-500">Rythme pour ne jamais « improviser » le message TENF.</p>
        </div>
        <div className="grid grid-cols-1 gap-3 p-5 md:grid-cols-2 md:p-6">
          {[
            {
              title: "Avant chaque onboarding",
              body: "Relire présentation + discours actif ; valider le wording avec un second staff si possible.",
            },
            {
              title: "Après chaque onboarding",
              body: "Noter les incompréhensions récurrentes et les intégrer dans la trame ou les slides.",
            },
            {
              title: "Hebdomadaire",
              body: "Point rapide staff : exemples à jour, liens vocaux / Discord, consignes communes.",
            },
            {
              title: "Mensuel",
              body: "Archiver ce qui est obsolète ; une source « canon » par type de session.",
            },
          ].map((b) => (
            <div
              key={b.title}
              className="rounded-2xl border border-white/[0.08] bg-zinc-900/40 px-4 py-4 transition hover:border-violet-400/25"
            >
              <p className="font-semibold text-violet-100">{b.title}</p>
              <p className="mt-2 text-xs leading-relaxed text-zinc-500">{b.body}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );

  return (
    <OnboardingContenusHubView
      supportsCount={cards.length}
      criticalCount={criticalCount}
      secondaryCount={secondaryCount}
      checklistDone={checklistDone}
      checklistTotal={defaultChecklist.length}
      checklistHydrated={checklistHydrated}
      gridRef={gridRef}
      prepRef={prepRef}
      onScrollToGrid={scrollToGrid}
      onScrollToPrep={scrollToPrep}
      onFilterCritical={filterCriticalAndScroll}
      prepContent={prepContent}
    >
      {supportsGrid}
    </OnboardingContenusHubView>
  );
}

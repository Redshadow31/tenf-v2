"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  ArrowRight,
  BellRing,
  CalendarDays,
  Cake,
  ChevronDown,
  ChevronLeft,
  ExternalLink,
  Filter,
  Gauge,
  HeartHandshake,
  LayoutList,
  PartyPopper,
  Radio,
  Shield,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";

const heroShellClass =
  "relative overflow-hidden rounded-3xl border border-indigo-400/25 bg-[linear-gradient(155deg,rgba(99,102,241,0.14),rgba(14,15,23,0.92)_38%,rgba(11,13,20,0.97))] shadow-[0_24px_70px_rgba(2,6,23,0.55)] backdrop-blur-xl";
const sectionCardClass =
  "rounded-2xl border border-[#2f3244] bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.10),_rgba(11,13,20,0.95)_46%)] shadow-[0_16px_40px_rgba(2,6,23,0.45)]";
const subtleButtonClass =
  "inline-flex items-center gap-2 rounded-xl border border-indigo-300/25 bg-[linear-gradient(135deg,rgba(79,70,229,0.24),rgba(30,41,59,0.36))] px-3 py-2 text-sm font-medium text-indigo-100 transition hover:-translate-y-[1px] hover:border-indigo-200/45 hover:bg-[linear-gradient(135deg,rgba(99,102,241,0.34),rgba(30,41,59,0.54))]";
const focusRingClass =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0b10]";

type PillarCategory = "events" | "engagement" | "anniversaires";

type Pillar = {
  href: string;
  label: string;
  description: string;
  staffTip: string;
  memberAngle: string;
  owner: string;
  coverage: number;
  icon: typeof CalendarDays;
  category: PillarCategory;
  gradient: string;
};

const pillars: Pillar[] = [
  {
    href: "/admin/communaute/evenements",
    label: "Événements",
    description:
      "Calendrier, participation, récap et outils autour des temps forts que vivent les membres dans l’espace public et Discord.",
    staffTip:
      "Gardez un fil unique entre annonce, lien vocal et suivi post-événement : les membres s’y repèrent quand c’est prévisible.",
    memberAngle: "Moments partagés, visibilité des prochains lives et réunions.",
    owner: "Équipe événements",
    coverage: 84,
    icon: PartyPopper,
    category: "events",
    gradient: "from-violet-500 to-fuchsia-600",
  },
  {
    href: "/admin/communaute/engagement",
    label: "Engagement",
    description:
      "Follow, raids, points Discord et traitements opérationnels — le lien direct entre animation et équité pour les streamers.",
    staffTip:
      "Priorisez les files avec impact visible côté chaîne (raids, signalements) avant les ajustements de configuration.",
    memberAngle: "Reconnaissance du soutien mutuel (hosts, présence).",
    owner: "Équipe engagement",
    coverage: 76,
    icon: Activity,
    category: "engagement",
    gradient: "from-emerald-500 to-teal-600",
  },
  {
    href: "/admin/communaute/anniversaires",
    label: "Anniversaires",
    description:
      "Repères relationnels sur l’année : les membres s’y sentent vus ; vous sécurisez le rythme et les messages.",
    staffTip:
      "Synchronisez annonces Discord et rappels staff pour éviter les doublons ou les oublis sur les profils sensibles.",
    memberAngle: "Petites attentions qui renforcent l’appartenance à TENF.",
    owner: "Équipe communauté",
    coverage: 92,
    icon: Cake,
    category: "anniversaires",
    gradient: "from-amber-500 to-orange-600",
  },
];

type QuickLink = {
  href: string;
  label: string;
  hint: string;
  tone: string;
  category: PillarCategory;
};

const quickLinks: QuickLink[] = [
  {
    href: "/admin/communaute/evenements/calendrier",
    label: "Calendrier",
    hint: "Vue mensuelle des temps forts",
    tone: "indigo",
    category: "events",
  },
  {
    href: "/admin/communaute/evenements/participation",
    label: "Participation",
    hint: "Qui s’est inscrit, qui était là",
    tone: "cyan",
    category: "events",
  },
  {
    href: "/admin/communaute/evenements/recap",
    label: "Récap & post-événement",
    hint: "Clôturer et capitaliser",
    tone: "sky",
    category: "events",
  },
  {
    href: "/admin/communaute/evenements/spotlight",
    label: "Spotlight",
    hint: "Pilotage opérationnel",
    tone: "fuchsia",
    category: "events",
  },
  {
    href: "/admin/communaute/engagement/follow",
    label: "Follow",
    hint: "Suivi global des feuilles",
    tone: "emerald",
    category: "engagement",
  },
  {
    href: "/admin/communaute/engagement/signalements-raids",
    label: "Signalements raids",
    hint: "File sensible à traiter vite",
    tone: "amber",
    category: "engagement",
  },
  {
    href: "/admin/communaute/engagement/points-discord",
    label: "Points Discord",
    hint: "Lien avec les animations raids",
    tone: "rose",
    category: "engagement",
  },
  {
    href: "/admin/communaute/anniversaires/mois",
    label: "Anniversaires du mois",
    hint: "Vue courte pour la modération",
    tone: "violet",
    category: "anniversaires",
  },
];

const priorityAlerts = [
  {
    href: "/admin/communaute/engagement/signalements-raids",
    label: "Vérifier les raids en traitement manuel (fallback)",
    impact: "Élevé",
    tone: "border-rose-400/35 bg-rose-500/12 text-rose-100 hover:bg-rose-500/18",
  },
  {
    href: "/admin/communaute/evenements/spotlight/presences",
    label: "Contrôler les présences des derniers Spotlight",
    impact: "Moyen",
    tone: "border-amber-300/35 bg-amber-500/12 text-amber-100 hover:bg-amber-500/18",
  },
  {
    href: "/admin/communaute/engagement/follow",
    label: "Relancer les feuilles follow staff en attente",
    impact: "Moyen",
    tone: "border-cyan-300/35 bg-cyan-500/12 text-cyan-100 hover:bg-cyan-500/18",
  },
];

function toneClass(tone: string): string {
  if (tone === "indigo") return "border-indigo-300/40 bg-indigo-500/12 text-indigo-100 hover:bg-indigo-500/20";
  if (tone === "cyan") return "border-cyan-300/40 bg-cyan-500/12 text-cyan-100 hover:bg-cyan-500/20";
  if (tone === "sky") return "border-sky-300/40 bg-sky-500/12 text-sky-100 hover:bg-sky-500/20";
  if (tone === "fuchsia") return "border-fuchsia-300/40 bg-fuchsia-500/12 text-fuchsia-100 hover:bg-fuchsia-500/20";
  if (tone === "emerald") return "border-emerald-300/40 bg-emerald-500/12 text-emerald-100 hover:bg-emerald-500/20";
  if (tone === "amber") return "border-amber-300/40 bg-amber-500/12 text-amber-100 hover:bg-amber-500/20";
  if (tone === "rose") return "border-rose-300/40 bg-rose-500/12 text-rose-100 hover:bg-rose-500/20";
  return "border-violet-300/40 bg-violet-500/12 text-violet-100 hover:bg-violet-500/20";
}

type FilterKey = "all" | PillarCategory;

const journeySteps = [
  {
    title: "1 · Prioriser",
    body: "Traiter d’abord les alertes à fort impact visible pour les membres.",
  },
  {
    title: "2 · Ouvrir",
    body: "Entrer dans le pôle concerné (événements, engagement, anniversaires).",
  },
  {
    title: "3 · Agir",
    body: "Valider, corriger les données et documenter si besoin pour l’équipe.",
  },
  {
    title: "4 · Boucler",
    body: "Partager un court recap staff pour aligner la prochaine vague.",
  },
];

const CHECKLIST_KEY = "tenf-admin-communaute-hub-checklist-v1";
const checklistItems = [
  { id: "alerts", label: "Passage sur les alertes critiques (raids / spotlight)" },
  { id: "calendar", label: "Cohérence calendrier public ↔ annonces Discord" },
  { id: "follow", label: "File follow : rien en retard côté validation staff" },
  { id: "birthdays", label: "Anniversaires du mois relus pour éviter les doublons" },
];

export default function CommunauteDashboardPage() {
  const [filter, setFilter] = useState<FilterKey>("all");
  const [expandedHref, setExpandedHref] = useState<string | null>(null);
  const [activeJourney, setActiveJourney] = useState(0);
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [checklistHydrated, setChecklistHydrated] = useState(false);
  const [kpiPulse, setKpiPulse] = useState(false);
  const polesRef = useRef<HTMLDivElement>(null);
  const quickRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setKpiPulse(true);
    const t = window.setTimeout(() => setKpiPulse(false), 650);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CHECKLIST_KEY);
      if (raw) setChecklist(JSON.parse(raw) as Record<string, boolean>);
    } catch {
      /* ignore */
    }
    setChecklistHydrated(true);
  }, []);

  useEffect(() => {
    if (!checklistHydrated) return;
    try {
      localStorage.setItem(CHECKLIST_KEY, JSON.stringify(checklist));
    } catch {
      /* ignore */
    }
  }, [checklist, checklistHydrated]);

  const avgCoverage = useMemo(
    () => Math.round(pillars.reduce((sum, item) => sum + item.coverage, 0) / pillars.length),
    []
  );
  const totalQuick = quickLinks.length;

  const filteredPillars = useMemo(() => {
    if (filter === "all") return pillars;
    return pillars.filter((p) => p.category === filter);
  }, [filter]);

  const filteredQuick = useMemo(() => {
    if (filter === "all") return quickLinks;
    return quickLinks.filter((q) => q.category === filter);
  }, [filter]);

  const checklistDone = useMemo(
    () => checklistItems.filter((i) => checklist[i.id]).length,
    [checklist]
  );

  const scrollToPoles = useCallback(() => {
    polesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const scrollToQuick = useCallback(() => {
    quickRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const toggleExpand = (href: string) => {
    setExpandedHref((h) => (h === href ? null : href));
  };

  const toggleCheck = (id: string) => {
    setChecklist((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-8 p-4 text-white sm:p-6 md:p-8">
      <section className={`${heroShellClass} p-6 md:p-8`}>
        <div className="pointer-events-none absolute -right-24 top-0 h-56 w-56 rounded-full bg-fuchsia-600/16 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -left-16 bottom-0 h-48 w-48 rounded-full bg-cyan-500/14 blur-3xl" aria-hidden />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl space-y-4">
            <Link
              href="/admin/pilotage"
              className={`inline-flex items-center gap-1 text-sm text-indigo-200/90 transition hover:text-white ${focusRingClass} rounded-lg`}
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
              Retour au pilotage serveur
            </Link>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-indigo-100/90">
                Expérience membres TENF
              </span>
              <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-100/90">
                Modération & administration
              </span>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-indigo-200/85">Animation & engagement</p>
              <h1 className="mt-2 bg-gradient-to-r from-indigo-100 via-white to-cyan-100 bg-clip-text text-3xl font-bold tracking-tight text-transparent md:text-4xl">
                Piloter l’animation sans perdre le fil opérationnel
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-slate-300 md:text-[15px]">
                Ce hub relie ce que <strong className="font-semibold text-slate-100">les membres voient</strong>{" "}
                (agenda, reconnaissance, leviers d’engagement) et ce que{" "}
                <strong className="font-semibold text-slate-100">vous configurez et validez en staff</strong> dans
                l’administration. Servez-vous-en pour prioriser, puis ouvrir l’écran métier adapté à votre rôle
                (modération ou administration).
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={scrollToPoles} className={`${subtleButtonClass} ${focusRingClass}`}>
                <LayoutList className="h-4 w-4 shrink-0" aria-hidden />
                Voir les trois pôles
              </button>
              <button
                type="button"
                onClick={scrollToQuick}
                className={`${subtleButtonClass} ${focusRingClass} border-sky-400/25 bg-sky-500/10 text-sky-100 hover:border-sky-300/45`}
              >
                <Zap className="h-4 w-4 shrink-0" aria-hidden />
                Accès rapides
              </button>
              <Link
                href="/member/evenements"
                target="_blank"
                rel="noopener noreferrer"
                className={`${subtleButtonClass} ${focusRingClass} border-emerald-400/25 bg-emerald-500/10 text-emerald-100 hover:border-emerald-300/45`}
              >
                <ExternalLink className="h-4 w-4 shrink-0" aria-hidden />
                Aperçu côté membre (événements)
              </Link>
            </div>
          </div>
          <div className="w-full max-w-sm shrink-0 space-y-4 rounded-2xl border border-white/10 bg-black/35 p-5 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">
              <Gauge className="h-4 w-4 text-violet-300" aria-hidden />
              Lecture équipe
            </div>
            <p className="flex items-start gap-2 text-xs leading-relaxed text-slate-400">
              <HeartHandshake className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300/80" aria-hidden />
              Quand le message public et les outils staff divergent, les membres le ressentent tout de suite : gardez les
              annonces, les vocaux et les suivis au même tempo.
            </p>
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-center">
              <p className="text-2xl font-bold tabular-nums text-emerald-200">{checklistDone}</p>
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                / {checklistItems.length} points du passage rapide
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <button
          type="button"
          onClick={scrollToPoles}
          className={`${sectionCardClass} w-full p-5 text-left transition hover:-translate-y-0.5 hover:border-indigo-400/35 ${focusRingClass}`}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">Pôles</p>
          <p className={`mt-2 text-3xl font-bold tabular-nums text-white ${kpiPulse ? "scale-[1.02] transition-transform" : ""}`}>
            {pillars.length}
          </p>
          <p className="mt-2 text-xs text-slate-500">Événements, leviers d’engagement, anniversaires</p>
        </button>
        <button
          type="button"
          onClick={scrollToQuick}
          className={`${sectionCardClass} w-full border-sky-500/15 p-5 text-left transition hover:-translate-y-0.5 hover:border-sky-400/35 ${focusRingClass}`}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-sky-200/70">Raccourcis</p>
          <p className={`mt-2 text-3xl font-bold tabular-nums text-sky-300 ${kpiPulse ? "scale-[1.02] transition-transform" : ""}`}>
            {totalQuick}
          </p>
          <p className="mt-2 text-xs text-slate-500">Liens directs vers les écrans les plus utilisés</p>
        </button>
        <button
          type="button"
          onClick={scrollToPoles}
          className={`${sectionCardClass} w-full border-rose-500/15 p-5 text-left transition hover:-translate-y-0.5 hover:border-rose-400/35 ${focusRingClass}`}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-rose-200/70">Alertes suivies</p>
          <p className={`mt-2 text-3xl font-bold tabular-nums text-rose-200 ${kpiPulse ? "scale-[1.02] transition-transform" : ""}`}>
            {priorityAlerts.length}
          </p>
          <p className="mt-2 text-xs text-slate-500">À traiter en priorité dans la colonne de droite</p>
        </button>
        <article className={`${sectionCardClass} border-emerald-500/15 p-5`}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-200/70">Couverture indicative</p>
          <p className={`mt-2 text-3xl font-bold tabular-nums text-emerald-300 ${kpiPulse ? "scale-[1.02] transition-transform" : ""}`}>
            {avgCoverage}%
          </p>
          <p className="mt-2 text-xs text-slate-500">Synthèse visuelle des trois pôles (à titre indicatif)</p>
        </article>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.12fr_1fr]">
        <article className={`${sectionCardClass} p-5 md:p-6`}>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-violet-400/25 bg-violet-500/15">
              <Radio className="h-5 w-5 text-violet-200" aria-hidden />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Passage rapide équipe</h2>
              <p className="mt-1 text-sm text-slate-400">
                Cochez localement sur ce navigateur — utile en brief avant le créneau de modération.
              </p>
            </div>
          </div>
          <ul className="mt-5 space-y-2">
            {checklistItems.map((item) => {
              const done = Boolean(checklist[item.id]);
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => toggleCheck(item.id)}
                    className={`flex w-full items-start gap-3 rounded-xl border px-3 py-3 text-left text-sm transition ${focusRingClass} ${
                      done
                        ? "border-emerald-400/40 bg-emerald-500/12 text-emerald-50"
                        : "border-[#353a50] bg-[#121623]/80 text-slate-200 hover:border-indigo-400/30"
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                        done ? "border-emerald-400 bg-emerald-500 text-white" : "border-slate-500 bg-[#0f1321]"
                      }`}
                      aria-hidden
                    >
                      {done ? (
                        <span className="text-[10px] font-bold leading-none">✓</span>
                      ) : null}
                    </span>
                    {item.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </article>

        <article className={`${sectionCardClass} p-5 md:p-6`}>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-400/25 bg-amber-500/15">
              <BellRing className="h-5 w-5 text-amber-200" aria-hidden />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Alertes à fort impact</h2>
              <p className="mt-1 text-sm text-slate-400">À vérifier à chaque rotation staff si vous avez le droit d’accès.</p>
            </div>
          </div>
          <div className="mt-5 space-y-2">
            {priorityAlerts.map((alert) => (
              <Link
                key={alert.href}
                href={alert.href}
                className={`block rounded-xl border px-4 py-3 text-sm transition ${alert.tone} ${focusRingClass}`}
              >
                <span className="font-semibold leading-snug">{alert.label}</span>
                <span className="mt-1.5 flex items-center gap-2 text-xs opacity-90">
                  <Shield className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  Impact {alert.impact}
                </span>
              </Link>
            ))}
          </div>
          <div className="mt-4 rounded-xl border border-indigo-400/25 bg-indigo-500/10 p-4 text-xs leading-relaxed text-indigo-100">
            <p className="font-semibold text-white">Mode d’emploi</p>
            <p className="mt-1 text-indigo-100/90">
              Commencez par les alertes, ouvrez le pôle concerné, traitez puis indiquez le statut à l’équipe sur votre canal
              staff habituel.
            </p>
          </div>
        </article>
      </section>

      <div className={`${sectionCardClass} flex flex-col gap-4 p-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between`}>
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
          <Filter className="h-4 w-4 text-indigo-300" aria-hidden />
          Filtrer l’affichage
        </div>
        <div className="flex flex-wrap gap-2">
          {(
            [
              { key: "all" as const, label: "Tout" },
              { key: "events" as const, label: "Événements" },
              { key: "engagement" as const, label: "Engagement" },
              { key: "anniversaires" as const, label: "Anniversaires" },
            ] as const
          ).map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wide transition ${focusRingClass} ${
                filter === key
                  ? "border-indigo-400/60 bg-indigo-500/25 text-white"
                  : "border-[#353a50] bg-[#0f1321] text-slate-400 hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <section ref={polesRef} className="scroll-mt-24 space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-indigo-200/80">Pôles</p>
            <h2 className="text-xl font-bold text-white">Où agir en premier</h2>
            <p className="mt-1 text-sm text-slate-400">
              Cartes cliquables — ouvrez le détail conseil sans quitter la vue d’ensemble.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {filteredPillars.map((pillar) => {
            const Icon = pillar.icon;
            const open = expandedHref === pillar.href;
            return (
              <div
                key={pillar.href}
                className={`${sectionCardClass} flex flex-col overflow-hidden transition hover:border-indigo-400/30`}
              >
                <Link href={pillar.href} className={`group block flex-1 p-5 ${focusRingClass}`}>
                  <div
                    className={`inline-flex rounded-2xl bg-gradient-to-br ${pillar.gradient} p-3 text-white shadow-lg`}
                  >
                    <Icon className="h-6 w-6" aria-hidden />
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-white group-hover:text-indigo-100">{pillar.label}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-300">{pillar.description}</p>
                  <p className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-emerald-200/90">
                    <Users className="h-3 w-3" aria-hidden />
                    Côté membre : {pillar.memberAngle}
                  </p>
                  <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Responsable : {pillar.owner}
                  </p>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <span className="text-xs text-slate-500">Couverture indicative</span>
                    <span className="text-sm font-bold tabular-nums text-sky-200">{pillar.coverage}%</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800/90">
                    <div
                      className={`h-2 rounded-full bg-gradient-to-r ${pillar.gradient} opacity-90`}
                      style={{ width: `${pillar.coverage}%` }}
                    />
                  </div>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-indigo-200">
                    Ouvrir le module
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
                  </span>
                </Link>
                <div className="border-t border-white/10 px-5 pb-5">
                  <button
                    type="button"
                    onClick={() => toggleExpand(pillar.href)}
                    className={`mt-3 flex w-full items-center justify-between rounded-xl border border-white/10 bg-black/25 px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-300 transition hover:bg-white/5 ${focusRingClass}`}
                    aria-expanded={open}
                  >
                    <span>Conseil staff</span>
                    <ChevronDown className={`h-4 w-4 shrink-0 transition ${open ? "rotate-180" : ""}`} aria-hidden />
                  </button>
                  {open ? (
                    <p className="mt-3 rounded-xl border border-indigo-400/20 bg-indigo-500/[0.08] p-4 text-sm leading-relaxed text-slate-200">
                      {pillar.staffTip}
                    </p>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
        {filteredPillars.length === 0 ? (
          <p className="text-center text-sm text-slate-400">Aucun pôle pour ce filtre.</p>
        ) : null}
      </section>

      <article className={`${sectionCardClass} p-5 md:p-6`}>
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-sky-400/25 bg-sky-500/15">
            <CalendarDays className="h-5 w-5 text-sky-200" aria-hidden />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Enchaînement conseillé</h2>
            <p className="mt-1 text-sm text-slate-400">Cliquez une étape pour vous l’approprier en briefing.</p>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {journeySteps.map((step, i) => (
            <button
              key={step.title}
              type="button"
              onClick={() => setActiveJourney(i)}
              className={`rounded-2xl border px-4 py-4 text-left text-sm transition ${focusRingClass} ${
                activeJourney === i
                  ? "border-indigo-400/50 bg-indigo-500/20 shadow-[0_12px_32px_rgba(79,70,229,0.2)]"
                  : "border-[#353a50] bg-[#121623]/70 hover:border-indigo-400/25"
              }`}
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-indigo-200/90">{step.title}</p>
              <p className="mt-2 leading-snug text-slate-200">{step.body}</p>
            </button>
          ))}
        </div>
      </article>

      <section ref={quickRef} className={`${sectionCardClass} scroll-mt-24 overflow-hidden`}>
        <div className="border-b border-[#2f3244] bg-gradient-to-r from-[#121623] to-transparent px-5 py-4 md:px-6">
          <h2 className="text-base font-bold text-white md:text-lg">Accès rapides</h2>
          <p className="mt-1 text-xs text-slate-400">
            {filteredQuick.length} lien(s) affiché(s) selon le filtre — les URL ne sont pas affichées ici pour garder la vue
            lisible.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 p-5 md:grid-cols-2 xl:grid-cols-4">
          {filteredQuick.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex flex-col rounded-2xl border px-4 py-4 text-left transition ${toneClass(item.tone)} ${focusRingClass}`}
            >
              <p className="font-bold text-white group-hover:underline">{item.label}</p>
              <p className="mt-2 text-xs leading-relaxed opacity-95">{item.hint}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold opacity-90">
                Ouvrir
                <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" aria-hidden />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-cyan-400/25 bg-[linear-gradient(135deg,rgba(34,211,238,0.08),rgba(15,23,42,0.92))] p-5 text-cyan-50 md:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-500/15">
            <Sparkles className="h-5 w-5 text-cyan-200" aria-hidden />
          </div>
          <div className="text-sm leading-relaxed text-cyan-100/95">
            <p className="font-semibold text-white">Rôle de cette page</p>
            <p className="mt-2">
              Ce tableau de bord ne remplace pas les écrans métier : il vous aide à{" "}
              <strong className="font-semibold text-white">prioriser</strong> et à garder une exécution commune entre
              modération et administration. Quand un membre ouvre l’espace public, il doit retrouver la même histoire que
              celle que vous validez ici.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

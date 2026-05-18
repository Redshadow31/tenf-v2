"use client";

import Link from "next/link";
import {
  BookOpen,
  CheckCircle2,
  Circle,
  Compass,
  HeartHandshake,
  HelpCircle,
  ListChecks,
  PauseCircle,
  Shield,
  Sparkles,
  UserCog,
  Users,
} from "lucide-react";
import { Q_LAYOUT, QUI } from "@/components/admin/moderation/questionnaire/questionnaire-ui";
import { buildModerationHref } from "@/lib/moderation/moderationTree";
import { CHARTE_SECTIONS, type CharteTab } from "./charteModerationContent";
import { CHARTE_STAFF_LINKS } from "./charteStaffLinks";

const READING_STEPS = [
  {
    n: 1,
    title: "Lis chaque article",
    text: "Un onglet à la fois. Coche « J'ai lu » quand c'est clair pour toi.",
  },
  {
    n: 2,
    title: "Prends ton temps",
    text: "Un délai court entre deux validations t'évite de cocher sans lire.",
  },
  {
    n: 3,
    title: "En cas de doute",
    text: "Tu ne tranches pas seul(e) : tu remontes au staff TENF.",
  },
] as const;

const AUDIENCE_PROFILES = [
  {
    icon: Shield,
    color: "text-amber-300",
    title: "Fondateur·rice",
    text: "Même cadre éthique — responsabilité finale, pas de contournement du processus.",
  },
  {
    icon: Shield,
    color: "text-violet-300",
    title: "Modérateur·rice confirmé(e)",
    text: "Charte obligatoire pour intervenir sur le serveur.",
  },
  {
    icon: Sparkles,
    color: "text-amber-300",
    title: "Modération en découverte",
    text: "Tu observes, tu apprends — pas de sanction seul(e).",
  },
  {
    icon: UserCog,
    color: "text-indigo-300",
    title: "Accompagnement ou admin coordinateur",
    text: "Même cadre ; ton mandat et tes validations diffèrent.",
  },
  {
    icon: PauseCircle,
    color: "text-slate-300",
    title: "Pause ou activité réduite",
    text: "Préviens l'équipe — pas d'intervention officielle en pause.",
  },
  {
    icon: HeartHandshake,
    color: "text-emerald-300",
    title: "Soutien TENF",
    text: "Tu aides et tu signales — tu ne sanctions pas seul(e).",
  },
  {
    icon: Users,
    color: "text-zinc-400",
    title: "Ancien staff ou lecture préalable",
    text: "Neutralité et confidentialité, même sans rôle actif.",
  },
] as const;

const CONTACT_ROWS = [
  {
    urgency: "Urgent",
    urgencyClass: "text-rose-300",
    when: "Conflit grave, mineur, menace, fuite d'info",
    who: "Admin coordinateur ou fondateur — salon staff",
  },
  {
    urgency: "Normal",
    urgencyClass: "text-zinc-300",
    when: "Doute sur une règle, cas ambigu",
    who: "Salon staff ou modérateur référent",
  },
  {
    urgency: "Formation",
    urgencyClass: "text-violet-300",
    when: "Question sur la méthode ou la charte",
    who: "Exercices mensuels · annonces staff",
  },
] as const;

const AFTER_SIGN = [
  "Accès aux modules modération staff",
  "Exercices mensuels et annonces",
  "Évaluation continue sur neutralité et méthode",
] as const;

type LeftRailProps = {
  tabs: CharteTab[];
  activeTabIndex: number;
  onSelectTab: (index: number) => void;
  validated: Record<number, boolean>;
  onScrollToArticle?: (sectionId: number) => void;
};

export function CharteLeftRail({
  tabs,
  activeTabIndex,
  onSelectTab,
  validated,
  onScrollToArticle,
}: LeftRailProps) {
  const activeTab = tabs[activeTabIndex];
  const activeArticles = CHARTE_SECTIONS.filter((s) => activeTab?.sectionIds.includes(s.id));

  return (
    <div className="space-y-4 xl:sticky xl:top-4">
      <aside className={`${Q_LAYOUT.panel} p-4`} aria-label="À qui s'adresse cette charte">
        <p className={QUI.sectionLabel}>Pour toi si tu es</p>
        <ul className="mt-3 space-y-2.5 text-sm text-zinc-300">
          {AUDIENCE_PROFILES.map((profile) => {
            const Icon = profile.icon;
            return (
              <li key={profile.title} className="flex gap-2.5">
                <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${profile.color}`} aria-hidden />
                <span>
                  <strong className="text-zinc-100">{profile.title}</strong>
                  <span className="mt-0.5 block text-xs text-zinc-400">{profile.text}</span>
                </span>
              </li>
            );
          })}
        </ul>
      </aside>

      <aside className={`${Q_LAYOUT.panel} border-amber-500/15 p-4`}>
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-amber-200/90">
          <Compass className="h-4 w-4 shrink-0" aria-hidden />
          Règle d'or
        </p>
        <p className="mt-2 text-sm font-semibold leading-snug text-zinc-100">
          Pas sûr(e) ? Tu n'agis pas seul(e).
        </p>
        <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">
          Remonter au staff, c'est une force — pas une faiblesse.
        </p>
      </aside>

      <nav className={`${Q_LAYOUT.panel} p-4`} aria-label="Parcours de lecture">
        <p className={QUI.sectionLabel}>Comment lire</p>
        <ol className="mt-3 space-y-3">
          {READING_STEPS.map((step) => (
            <li key={step.n} className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-violet-400/25 bg-violet-500/10 text-xs font-bold text-violet-200">
                {step.n}
              </span>
              <div>
                <p className="text-sm font-semibold text-zinc-100">{step.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-zinc-400">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </nav>

      <nav className={`${Q_LAYOUT.panel} p-4`} aria-label="Onglets de la charte">
        <p className={QUI.sectionLabel}>Sections</p>
        <ul className="mt-3 space-y-1">
          {tabs.map((tab, index) => {
            const done = tab.sectionIds.every((id) => validated[id]);
            const active = index === activeTabIndex;
            return (
              <li key={tab.key}>
                <button
                  type="button"
                  onClick={() => onSelectTab(index)}
                  className={`flex w-full items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-sm transition ${Q_LAYOUT.focusRing} ${
                    active
                      ? "border-violet-400/40 bg-violet-500/15 text-violet-50"
                      : "border-transparent text-zinc-300 hover:border-white/10 hover:bg-white/[0.04]"
                  }`}
                >
                  {done ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden />
                  ) : (
                    <Circle className="h-4 w-4 shrink-0 text-zinc-500" aria-hidden />
                  )}
                  <span className="min-w-0 flex-1 font-medium">{tab.shortLabel}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {activeArticles.length > 0 ? (
        <nav className={`${Q_LAYOUT.panel} p-4`} aria-label="Articles de l'onglet actif">
          <p className={QUI.sectionLabel}>Articles · {activeTab?.shortLabel}</p>
          <ul className="mt-3 max-h-[min(280px,40vh)] space-y-0.5 overflow-y-auto pr-1">
            {activeArticles.map((section) => {
              const done = Boolean(validated[section.id]);
              return (
                <li key={section.id}>
                  <button
                    type="button"
                    onClick={() => onScrollToArticle?.(section.id)}
                    className={`flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition hover:bg-white/[0.04] ${Q_LAYOUT.focusRing}`}
                  >
                    <span className="mt-0.5 shrink-0 tabular-nums text-zinc-500">{section.id}.</span>
                    <span className={`min-w-0 flex-1 ${done ? "text-emerald-200/90" : "text-zinc-400"}`}>
                      {section.title}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      ) : null}

      <nav className={`${Q_LAYOUT.panel} p-4`} aria-label="Sommaire complet des articles">
        <p className={QUI.sectionLabel}>Tous les articles</p>
        <ul className="mt-3 max-h-[min(320px,45vh)] space-y-0.5 overflow-y-auto pr-1">
          {CHARTE_SECTIONS.map((section) => {
            const done = Boolean(validated[section.id]);
            return (
              <li key={section.id}>
                <button
                  type="button"
                  onClick={() => onScrollToArticle?.(section.id)}
                  className={`flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition hover:bg-white/[0.04] ${Q_LAYOUT.focusRing}`}
                >
                  <span className="mt-0.5 shrink-0 tabular-nums text-zinc-500">{section.id}.</span>
                  <span className={`min-w-0 flex-1 leading-snug ${done ? "text-emerald-200/90" : "text-zinc-400"}`}>
                    {section.title}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <aside className={`${Q_LAYOUT.panel} p-4`} aria-label="Qui contacter">
        <p className={QUI.sectionLabel}>Qui contacter</p>
        <div className="mt-3 space-y-2">
          {CONTACT_ROWS.map((row) => (
            <div
              key={row.urgency}
              className="rounded-lg border border-white/[0.06] bg-zinc-900/40 px-2.5 py-2 text-xs"
            >
              <p className={`font-bold uppercase tracking-wide ${row.urgencyClass}`}>{row.urgency}</p>
              <p className="mt-1 text-zinc-400">{row.when}</p>
              <p className="mt-0.5 font-medium text-zinc-200">{row.who}</p>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}

type RightRailProps = {
  completedCount: number;
  totalSections: number;
  progress: number;
  activeTab: CharteTab;
  activeTabIndex: number;
  tabCount: number;
  allBlocksValidated: boolean;
  submitted: boolean;
  submitInfo: string | null;
  referenceMode: boolean;
  charterVersion: string;
};

export function CharteRightRail({
  completedCount,
  totalSections,
  progress,
  activeTab,
  activeTabIndex,
  tabCount,
  allBlocksValidated,
  submitted,
  submitInfo,
  referenceMode,
  charterVersion,
}: RightRailProps) {
  return (
    <div className="space-y-4 xl:sticky xl:top-4">
      <aside className={`${Q_LAYOUT.glassSection} p-4`} aria-label="Ta progression">
        <p className={QUI.sectionLabel}>Ta progression</p>
        <p className="mt-2 text-3xl font-semibold tabular-nums text-white">{progress}%</p>
        <p className="mt-1 text-sm text-zinc-400">
          {completedCount} / {totalSections} articles validés
        </p>
        <div className={`mt-3 ${QUI.progressTrack}`}>
          <div className={QUI.progressFill} style={{ width: `${progress}%` }} />
        </div>
        <p className="mt-3 text-xs leading-relaxed text-zinc-500">
          Onglet :{" "}
          <span className="font-medium text-zinc-300">
            {activeTab.label} ({activeTabIndex + 1}/{tabCount})
          </span>
        </p>
        <p className="mt-2 text-[10px] uppercase tracking-wide text-zinc-500">{charterVersion}</p>
        {referenceMode ? (
          <p className="mt-2 text-xs text-cyan-200/90">Mode référence — lecture libre.</p>
        ) : allBlocksValidated ? (
          <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-emerald-300">
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
            Tous les articles sont lus — tu peux signer en bas.
          </p>
        ) : (
          <p className="mt-2 text-xs text-amber-200/90">Continue la lecture avant la signature.</p>
        )}
      </aside>

      {submitted && submitInfo ? (
        <aside className="rounded-2xl border border-emerald-400/25 bg-emerald-500/10 p-4 ring-1 ring-inset ring-emerald-400/10">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-emerald-200">
            <CheckCircle2 className="h-4 w-4" aria-hidden />
            Charte signée
          </p>
          <p className="mt-2 text-sm leading-relaxed text-emerald-100/95">{submitInfo}</p>
        </aside>
      ) : null}

      <aside className={`${Q_LAYOUT.panel} p-4`}>
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-violet-200/90">
          <ListChecks className="h-4 w-4 shrink-0" aria-hidden />
          Après signature
        </p>
        <ul className="mt-3 space-y-2 text-sm text-zinc-400">
          {AFTER_SIGN.map((line) => (
            <li key={line} className="flex gap-2">
              <span className="text-violet-400" aria-hidden>
                ·
              </span>
              {line}
            </li>
          ))}
        </ul>
      </aside>

      <aside className={`${Q_LAYOUT.panel} p-4`}>
        <p className={QUI.sectionLabel}>Ressources staff</p>
        <ul className="mt-3 space-y-2.5 text-sm">
          {CHARTE_STAFF_LINKS.map((link) => (
            <li key={link.href + link.label}>
              <Link
                href={link.href}
                target={link.external ? "_blank" : undefined}
                rel={link.external ? "noopener noreferrer" : undefined}
                className="text-violet-300 underline-offset-2 hover:underline"
              >
                {link.label}
              </Link>
              {link.note ? <p className="mt-0.5 text-[10px] leading-snug text-zinc-500">{link.note}</p> : null}
            </li>
          ))}
        </ul>
      </aside>

      <aside className={`${Q_LAYOUT.panel} border-white/[0.06] p-4`}>
        <p className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
          <HelpCircle className="h-4 w-4 text-zinc-500" aria-hidden />
          Besoin d'aide ?
        </p>
        <p className="mt-2 text-xs leading-relaxed text-zinc-500">
          Une situation te dépasse ? Ouvre un fil staff ou parle à un fondateur avant d'agir.
        </p>
        <Link
          href={buildModerationHref("staff", "info", "comptes-rendus-reunions")}
          className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-violet-300 hover:text-violet-200"
        >
          <BookOpen className="h-3.5 w-3.5" aria-hidden />
          Comptes rendus réunions
        </Link>
      </aside>
    </div>
  );
}

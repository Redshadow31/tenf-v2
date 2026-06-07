"use client";



import { ChevronDown, Gift, HelpCircle } from "lucide-react";

import { CalendarDays, HeartHandshake, Mic2, Star, Users } from "lucide-react";

import EvaluationDSectionHeader from "@/components/admin/evaluation-d/EvaluationDSectionHeader";

import { EvaluationDPanel } from "@/components/admin/evaluation-d/EvaluationDPanel";

import { evalDSubPanelClass, evalDZoneClass } from "@/lib/admin/evaluation-d/evaluationDStyles";
import {
  ENGAGEMENT_AVERAGE_BONUS_POINTS,
  ENGAGEMENT_AVERAGE_BONUS_THRESHOLD,
  EVALUATION_BONUS_MAX,
  FINAL_SCORE_MAX,
  formatVipTierRulesSummary,
  SURVEILLER_FINAL_SCORE_THRESHOLD,
  VIP_THRESHOLD_JUNIOR,
  VIP_THRESHOLD_MID,
  VIP_THRESHOLD_SENIOR,
  VIP_TIER_RULES,
  VIP_HISTORY_DAYS_SENIOR,
} from "@/lib/evaluationSynthesisHelpers";
import {
  AUTO_COMMUNAUTE_CONSECUTIVE_MONTHS,
  SURVEILLER_CONSECUTIVE_MONTHS,
} from "@/lib/admin/evaluation-d/evaluationDCommunityPassage";
import { COMMUNITY_EVENT_MAX_POINTS } from "@/lib/evaluationCommunityEvents";
import { FOLLOW_NEUTRAL_POINTS, FOLLOW_POLICY_SUMMARY } from "@/lib/evaluationFollowPolicy";



const SECTIONS = [

  {

    kicker: "Section A",

    title: "Twitch & présence TENF",

    tone: "violet" as const,

    cards: [

      {

        title: "Spotlight — /5",

        icon: Star,

        accent: "#c084fc",

        body: "Présence aux spotlights du mois ; agrégé depuis les événements catégorie Spotlight.",

      },

      {

        title: "Raids — /5",

        icon: HeartHandshake,

        accent: "#818cf8",

        body: "Volume de raids faits sur le mois (grille progressive 0→5).",

      },

    ],

  },

  {

    kicker: "Section B",

    title: "Discord & événements",

    tone: "sky" as const,

    cards: [

      {

        title: "Discord — /5",

        icon: Mic2,

        accent: "#5865F2",

        body: "Synthèse activité serveur (écrit + vocal) depuis la section B Discord.",

      },

      {

        title: "Événements — /6",

        icon: CalendarDays,

        accent: "#34d399",

        body: "Formation, Soirée Film, Apéro, Jeux communautaire. 1 event = 2 pts · 50 % = 4 pts · 80 % = 6 pts.",

      },

    ],

  },

  {

    kicker: "Section C + Bonus",

    title: "Réseau & reconnaissance staff",

    tone: "amber" as const,

    cards: [

      {

        title: "Follow — /5",

        icon: Users,

        accent: "#f472b6",

        body: "Taux de follow des chaînes TENF actives (snapshot engagement).",

      },

      {

        title: "Bonus — /9",

        icon: Gift,

        accent: "#f59e0b",

        body: "+2 décalage horaire, +0 à +5 modération, +2 auto si moyenne (Discord + Spotlight + Events + Follow) > 4.",

      },

    ],

  },

] as const;



export default function EvaluationDBaremePanel() {

  return (

    <EvaluationDPanel

      kicker="Référentiel"

      title="Barème expliqué — staff & communauté"

      intro="Organisé par sections A / B / C comme le dashboard évaluation. Chaque carte renvoie à la même source de données."

      tone="neutral"

      className="mb-10"

      action={

        <span className="inline-flex rounded-xl border border-violet-500/25 bg-violet-500/15 p-2.5 text-violet-200">

          <HelpCircle className="h-6 w-6" aria-hidden />

        </span>

      }

    >

      <div className={`${evalDZoneClass} mb-5 flex flex-wrap items-center gap-4 border-violet-500/15 bg-violet-950/20`}>

        <div className="flex items-center gap-2 text-sm font-bold text-violet-100">

          <span className="rounded-lg bg-violet-500/20 px-2 py-1 text-xs">/25</span>

          Hors bonus

        </div>

        <span className="text-zinc-600">+</span>

        <div className="flex items-center gap-2 text-sm font-bold text-amber-100">

          <span className="rounded-lg bg-amber-500/20 px-2 py-1 text-xs">/{EVALUATION_BONUS_MAX}</span>

          Bonus

        </div>

        <span className="text-zinc-600">=</span>

        <div className="flex items-center gap-2 text-sm font-black text-white">

          <span className="rounded-lg bg-white/10 px-2 py-1 text-xs">/{FINAL_SCORE_MAX}</span>

          Note finale

        </div>

      </div>



      <div className="space-y-6">

        {SECTIONS.map((section) => {
          const SectionIcon = section.cards[0].icon;
          return (
          <div key={section.kicker}>
            <EvaluationDSectionHeader
              kicker={section.kicker}
              title={section.title}
              tone={section.tone}
              icon={<SectionIcon className="h-4 w-4" aria-hidden />}
            />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

              {section.cards.map((card) => {

                const Icon = card.icon;

                return (

                  <div key={card.title} className={`${evalDSubPanelClass} p-4`}>

                    <div className="mb-2 flex items-center gap-2.5">

                      <span

                        className="rounded-xl border border-white/[0.06] p-2.5"

                        style={{ backgroundColor: `${card.accent}18`, color: card.accent }}

                      >

                        <Icon className="h-4 w-4" aria-hidden />

                      </span>

                      <h3 className="text-sm font-bold text-white">{card.title}</h3>

                    </div>

                    <p className="text-xs leading-relaxed text-zinc-500">{card.body}</p>

                  </div>

                );

              })}

            </div>
          </div>
          );
        })}

      </div>



      <details className="group mt-6 overflow-hidden rounded-xl border border-dashed border-white/10 bg-zinc-900/40">

        <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3.5 text-sm font-semibold text-zinc-200 transition hover:bg-white/[0.03] [&::-webkit-details-marker]:hidden">

          <ChevronDown className="h-4 w-4 shrink-0 transition group-open:rotate-180" aria-hidden />

          Règle note finale (/{FINAL_SCORE_MAX}) et statuts auto

        </summary>

        <div className="border-t border-white/[0.06] bg-black/20 px-4 py-4 text-xs leading-relaxed text-zinc-500">

          <div className="grid gap-3 sm:grid-cols-2">

            <p>

              <strong className="text-zinc-300">Note finale</strong> = total hors bonus (/25) + bonus (/{EVALUATION_BONUS_MAX}), plafonnée à /{FINAL_SCORE_MAX}.

            </p>

            <p>

              <strong className="text-sky-300">Follow (section C)</strong> : feuilles staff ou snapshot engagement.{" "}
              {FOLLOW_POLICY_SUMMARY} Neutre = {FOLLOW_NEUTRAL_POINTS}/5.

            </p>

            <p>

              <strong className="text-emerald-400">VIP progressif</strong> : ≥ {VIP_THRESHOLD_JUNIOR} (&lt; 31 j) · ≥ {VIP_THRESHOLD_MID} (31–60 j) · ≥ {VIP_THRESHOLD_SENIOR} (≥ 61 j) ·{" "}
              <strong className="text-amber-400">{SURVEILLER_CONSECUTIVE_MONTHS} mois &lt; {SURVEILLER_FINAL_SCORE_THRESHOLD}</strong> consécutifs → à surveiller (≥ {VIP_HISTORY_DAYS_SENIOR} j) ·{" "}
              <strong className="text-cyan-400">{AUTO_COMMUNAUTE_CONSECUTIVE_MONTHS}e mois</strong> → passage auto Communauté (bouton « Garder actif » pour annuler) · bonus moyenne engagement +{ENGAGEMENT_AVERAGE_BONUS_POINTS} si moy. &gt; {ENGAGEMENT_AVERAGE_BONUS_THRESHOLD}.

            </p>

          </div>

        </div>

      </details>

    </EvaluationDPanel>

  );

}



"use client";



import {

  Award,

  BarChart3,

  CalendarDays,

  Gift,

  HeartHandshake,

  Mic2,

  ShieldAlert,

  Star,

  Users,

  Zap,

} from "lucide-react";

import {

  Bar,

  BarChart,

  CartesianGrid,

  Cell,

  ResponsiveContainer,

  Tooltip,

  XAxis,

  YAxis,

} from "recharts";

import EvaluationDSectionHeader from "@/components/admin/evaluation-d/EvaluationDSectionHeader";

import {

  EvaluationDPanel,

  EvaluationDSignalCard,

  EvaluationDStatTile,

} from "@/components/admin/evaluation-d/EvaluationDPanel";

import { evalDZoneClass } from "@/lib/admin/evaluation-d/evaluationDStyles";
import {
  FINAL_SCORE_MAX,
  SURVEILLER_FINAL_SCORE_THRESHOLD,
  formatVipTierRulesSummary,
  VIP_TIER_RULES,
  VIP_THRESHOLD_JUNIOR,
  VIP_THRESHOLD_MID,
  VIP_THRESHOLD_SENIOR,
  VIP_HISTORY_DAYS_SENIOR,
} from "@/lib/evaluationSynthesisHelpers";
import {
  AUTO_COMMUNAUTE_CONSECUTIVE_MONTHS,
  SURVEILLER_CONSECUTIVE_MONTHS,
} from "@/lib/admin/evaluation-d/evaluationDCommunityPassage";
import { COMMUNITY_EVENT_MAX_POINTS, ENTRAIDE_SCORE_MAX } from "@/lib/evaluationCommunityEvents";
import type { GeneralStats } from "@/lib/admin/evaluation-d/evaluationDTypes";



type PilotageBarRow = {

  key: string;

  label: string;

  moy: number;

  max: number;

  fill: string;

};



type Props = {

  monthLabel: string;

  generalStats: GeneralStats;

  membersCount: number;

  pilotageBarData: PilotageBarRow[];

  entraideAvg: number;

  entraideMax: number;

  pendingTotal: number;

  pendingBreakdown: string;

};



export default function EvaluationDPilotageView({

  monthLabel,

  generalStats,

  membersCount,

  pilotageBarData,

  entraideAvg,

  entraideMax,

  pendingTotal,

  pendingBreakdown,

}: Props) {

  return (

    <div className="mb-8 min-w-0 space-y-[var(--eval-gap,1.5rem)]">

      {/* Zone 1 — Moyennes barème */}

      <EvaluationDPanel tone="accent" kicker={`Mois · ${monthLabel}`} title="Piliers du barème /25" intro="Moyennes communautaires par domaine — base de la note hors bonus.">

        <EvaluationDSectionHeader

          kicker="Bloc A · B · C"

          title="Moyennes mensuelles"

          intro="Chaque tuile indique le remplissage relatif au plafond du pilier."

          tone="violet"

          icon={<Award className="h-4 w-4" aria-hidden />}

        />

        <div className="grid grid-cols-2 gap-[clamp(0.5rem,1.2vw,0.75rem)] sm:grid-cols-3 2xl:grid-cols-6">

          <EvaluationDStatTile label="Spotlight /5" value={generalStats.avgSpotlight.toFixed(2)} accent="#c084fc" icon={<Star className="h-4 w-4" aria-hidden />} progress={{ value: generalStats.avgSpotlight, max: 5 }} />

          <EvaluationDStatTile label="Raids /5" value={generalStats.avgRaids.toFixed(2)} accent="#818cf8" icon={<HeartHandshake className="h-4 w-4" aria-hidden />} progress={{ value: generalStats.avgRaids, max: 5 }} />

          <EvaluationDStatTile label="Discord /5" value={generalStats.avgDiscord.toFixed(2)} accent="#5865F2" icon={<Mic2 className="h-4 w-4" aria-hidden />} progress={{ value: generalStats.avgDiscord, max: 5 }} />

          <EvaluationDStatTile label={`Events /${COMMUNITY_EVENT_MAX_POINTS}`} value={generalStats.avgEvents.toFixed(2)} accent="#34d399" icon={<CalendarDays className="h-4 w-4" aria-hidden />} progress={{ value: generalStats.avgEvents, max: COMMUNITY_EVENT_MAX_POINTS }} />

          <EvaluationDStatTile label="Follow /5" value={generalStats.avgFollow.toFixed(2)} accent="#f472b6" icon={<Users className="h-4 w-4" aria-hidden />} progress={{ value: generalStats.avgFollow, max: 5 }} />

          <EvaluationDStatTile label="Générale /25" value={generalStats.avgGeneral.toFixed(2)} accent="#a78bfa" icon={<Award className="h-4 w-4" aria-hidden />} progress={{ value: generalStats.avgGeneral, max: 25 }} />

        </div>

      </EvaluationDPanel>



      {/* Zone 2 — Analyse visuelle + signaux */}

      <div className="grid min-w-0 gap-[var(--eval-gap,1.5rem)] xl:grid-cols-12">

        {pilotageBarData.length > 0 ? (

          <div className={`${evalDZoneClass} min-w-0 xl:col-span-8`}>

            <EvaluationDSectionHeader

              kicker="Visualisation"

              title="Comparatif des piliers"

              intro="Barres horizontales — échelle normalisée au plafond de chaque domaine."

              tone="sky"

              icon={<BarChart3 className="h-4 w-4" aria-hidden />}

            />

            <div className="h-[clamp(200px,28vh,320px)] w-full min-w-0">

              <ResponsiveContainer width="100%" height="100%">

                <BarChart data={pilotageBarData} layout="vertical" margin={{ left: 4, right: 20, top: 4, bottom: 4 }}>

                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" horizontal={false} />

                  <XAxis type="number" domain={[0, 5]} stroke="#64748b" tick={{ fill: "#94a3b8", fontSize: 11 }} />

                  <YAxis type="category" dataKey="label" width={76} stroke="#64748b" tick={{ fill: "#cbd5e1", fontSize: 12 }} />

                  <Tooltip

                    cursor={{ fill: "rgba(255,255,255,0.03)" }}

                    content={({ active, payload }) => {

                      if (!active || !payload?.[0]) return null;

                      const row = payload[0].payload as PilotageBarRow;

                      const pct = row.max > 0 ? Math.round((row.moy / row.max) * 100) : 0;

                      return (

                        <div className="rounded-xl border border-white/10 bg-zinc-900/95 px-3 py-2 text-xs shadow-xl backdrop-blur-sm">

                          <p className="font-semibold text-white">{row.label}</p>

                          <p className="text-zinc-300">

                            {row.moy.toFixed(2)} / {row.max} · ~{pct}%

                          </p>

                        </div>

                      );

                    }}

                  />

                  <Bar dataKey="moy" radius={[0, 8, 8, 0]} maxBarSize={28}>

                    {pilotageBarData.map((entry) => (

                      <Cell key={entry.key} fill={entry.fill} />

                    ))}

                  </Bar>

                </BarChart>

              </ResponsiveContainer>

            </div>

          </div>

        ) : null}



        <div className={`${evalDZoneClass} min-w-0 xl:col-span-4`}>

          <EvaluationDSectionHeader

            kicker="Automatique"

            title="Signaux VIP & vigilance"

            intro={`VIP progressif : ${formatVipTierRulesSummary()} · à surveiller = ${SURVEILLER_CONSECUTIVE_MONTHS} mois < ${SURVEILLER_FINAL_SCORE_THRESHOLD} (≥ ${VIP_HISTORY_DAYS_SENIOR} j) · ${AUTO_COMMUNAUTE_CONSECUTIVE_MONTHS}e mois → Communauté.`}

            tone="emerald"

            icon={<ShieldAlert className="h-4 w-4" aria-hidden />}

          />

          <div className="grid gap-3">

            <EvaluationDSignalCard

              label={`VIP (${VIP_THRESHOLD_JUNIOR}/${VIP_THRESHOLD_MID}/${VIP_THRESHOLD_SENIOR} /${FINAL_SCORE_MAX})`}

              value={generalStats.vipCount}

              tone="emerald"

              icon={<Star className="h-8 w-8" aria-hidden />}

            />
            <ul className="space-y-1 rounded-lg border border-white/[0.06] bg-black/20 px-3 py-2 text-[10px] text-zinc-400">
              {VIP_TIER_RULES.map((rule) => (
                <li key={rule.label}>
                  <span className="font-semibold text-emerald-200/90">≥ {rule.threshold} pts</span>
                  <span className="text-zinc-500"> — {rule.label}</span>
                  <span className="text-zinc-600"> ({rule.hint})</span>
                </li>
              ))}
            </ul>

            <EvaluationDSignalCard

              label={`À surveiller (${SURVEILLER_CONSECUTIVE_MONTHS}m+ / passage ${AUTO_COMMUNAUTE_CONSECUTIVE_MONTHS}m)`}

              value={generalStats.surveillerCount}

              tone="amber"

              icon={<ShieldAlert className="h-8 w-8" aria-hidden />}

            />

          </div>

        </div>

      </div>



      {/* Zone 3 — Agrégats & présences */}

      <div className={`${evalDZoneClass} min-w-0`}>

        <EvaluationDSectionHeader

          kicker="Communauté"

          title="Scores globaux & taux de présence"

          intro="Sommes cumulées et participation aux events / spotlights du mois."

          tone="pink"

          icon={<Users className="h-4 w-4" aria-hidden />}

        />

        <div className="grid min-w-0 gap-[clamp(0.5rem,1.2vw,0.75rem)] sm:grid-cols-2 2xl:grid-cols-4">

          <EvaluationDStatTile label="Somme hors bonus" value={generalStats.scoreGlobalHorsBonus.toFixed(0)} hint={`Plafond théorique ${membersCount * 25}`} accent="#a78bfa" icon={<BarChart3 className="h-4 w-4" aria-hidden />} />

          <EvaluationDStatTile label="Somme avec bonus" value={generalStats.scoreGlobalAvecBonus.toFixed(0)} hint={`Plafond théorique ${membersCount * FINAL_SCORE_MAX}`} accent="#34d399" icon={<Gift className="h-4 w-4" aria-hidden />} />

          <EvaluationDStatTile label="Présence Events" value={`${generalStats.eventsPresenceRate.toFixed(1)}%`} hint={`${generalStats.eventsParticipants} membres`} accent="#5865F2" icon={<CalendarDays className="h-4 w-4" aria-hidden />} progress={{ value: generalStats.eventsPresenceRate, max: 100 }} />

          <EvaluationDStatTile label="Présence Spotlight" value={`${generalStats.spotlightPresenceRate.toFixed(1)}%`} hint={`${generalStats.spotlightParticipants} membres`} accent="#c084fc" icon={<Star className="h-4 w-4" aria-hidden />} progress={{ value: generalStats.spotlightPresenceRate, max: 100 }} />

        </div>

      </div>



      {/* Zone 4 — Opérationnel */}

      <div className={`${evalDZoneClass} min-w-0`}>

        <EvaluationDSectionHeader

          kicker="Opérationnel"

          title="Entraide & file d'édition"

          intro={`Indicateur entraide (/${ENTRAIDE_SCORE_MAX}) et modifications en attente d'enregistrement.`}

          tone="amber"

          icon={<Zap className="h-4 w-4" aria-hidden />}

        />

        <div className="grid min-w-0 gap-[clamp(0.5rem,1.2vw,0.75rem)] sm:grid-cols-2">

          <EvaluationDStatTile label="Moyenne entraide" value={`${entraideAvg.toFixed(2)} / ${entraideMax}`} hint="Raids + Discord + Events + Follow" accent="#22c55e" icon={<HeartHandshake className="h-4 w-4" aria-hidden />} progress={{ value: entraideAvg, max: entraideMax }} />

          <EvaluationDStatTile label="Modifs non enregistrées" value={pendingTotal} hint={pendingBreakdown} accent={pendingTotal > 0 ? "#f59e0b" : "#71717a"} icon={<Zap className="h-4 w-4" aria-hidden />} />

        </div>

      </div>

    </div>

  );

}



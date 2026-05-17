"use client";

import type { FollowLayoutVariant, FollowSummary } from "./types";

const hubCardClass =
  "rounded-2xl border border-white/10 bg-[linear-gradient(150deg,rgba(30,27,45,0.85),rgba(11,13,20,0.92))] shadow-[0_16px_40px_rgba(2,6,23,0.45)]";

export type FollowStatCardsProps = {
  variant: FollowLayoutVariant;
  summary: FollowSummary;
};

/**
 * 4 cartes purement informatives. Pas de filtre cliquable ici : ce sont les
 * chips de `FollowFilterBar` qui pilotent le filtre (cf. dédup voulue par UX).
 *
 * Aucun changement visuel par rapport à la version intégrée dans la page.
 */
export default function FollowStatCards({ variant, summary }: FollowStatCardsProps) {
  const hubLayout = variant === "hub";
  const cardBase = "w-full rounded-2xl border p-4 text-left";
  const cardStyle = hubLayout ? hubCardClass : "rounded-lg border";
  const cardInline = !hubLayout
    ? { borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }
    : undefined;

  return (
    <div className="mb-4 grid gap-4 md:grid-cols-4">
      <div className={`${cardBase} ${cardStyle}`} style={cardInline}>
        <p className="text-xs text-gray-400">Profils suivis</p>
        <p className="text-2xl font-bold text-white">{summary.totalMembers}</p>
        {hubLayout ? (
          <p className="mt-1 text-[11px] text-slate-500">Membres pris en compte par le snapshot.</p>
        ) : null}
      </div>
      <div className={`${cardBase} ${cardStyle}`} style={cardInline}>
        <p className="text-xs text-gray-400">Sans lien Twitch</p>
        <p className="text-2xl font-bold text-amber-300">{summary.notLinkedCount}</p>
        {hubLayout ? (
          <p className="mt-1 text-[11px] text-slate-500">À rapprocher d&apos;un compte chaîne avant calcul.</p>
        ) : null}
      </div>
      <div className={`${cardBase} ${cardStyle}`} style={cardInline}>
        <p className="text-xs text-gray-400">Calculs valides</p>
        <p className="text-2xl font-bold text-cyan-300">{summary.calculableMembers}</p>
        {hubLayout ? (
          <p className="mt-1 text-[11px] text-slate-500">
            Taux moyen sur ces profils&nbsp;: <span className="text-slate-300">{summary.averageRate}%</span>
          </p>
        ) : null}
      </div>
      <div className={`${cardBase} ${cardStyle}`} style={cardInline}>
        <p className="text-xs text-gray-400">Calculs impossibles</p>
        <p className="text-2xl font-bold text-rose-200">{summary.impossibleCount}</p>
        {hubLayout ? (
          <p className="mt-1 text-[11px] text-slate-500">Comptes à vérifier avant calcul.</p>
        ) : null}
      </div>
    </div>
  );
}

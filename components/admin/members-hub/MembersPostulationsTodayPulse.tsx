"use client";

import { ClipboardList, Flag, MessageCircle } from "lucide-react";
import { hubCardClass, hubSectionLabelClass } from "./membersHubStyles";

type Props = {
  openCount: number;
  toContactCount: number;
  flaggedCount: number;
};

export default function MembersPostulationsTodayPulse({ openCount, toContactCount, flaggedCount }: Props) {
  const headline = (() => {
    if (flaggedCount > 0) {
      return (
        <>
          <span className="text-rose-200">{flaggedCount}</span> signalement{flaggedCount > 1 ? "s" : ""} sensible
          {flaggedCount > 1 ? "s" : ""} à traiter en priorité.
        </>
      );
    }
    if (toContactCount > 0) {
      return (
        <>
          <span className="text-amber-200">{toContactCount}</span> candidat{toContactCount > 1 ? "s" : ""} à contacter
          — premier échange à planifier.
        </>
      );
    }
    if (openCount > 0) {
      return (
        <>
          <span className="text-violet-200">{openCount}</span> dossier{openCount > 1 ? "s" : ""} ouvert
          {openCount > 1 ? "s" : ""} dans le pipeline, sans urgence signalée.
        </>
      );
    }
    return <>Aucun dossier ouvert : la file recrutement est au calme pour l&apos;instant.</>;
  })();

  const Icon = flaggedCount > 0 ? Flag : toContactCount > 0 ? MessageCircle : ClipboardList;
  const iconClass =
    flaggedCount > 0
      ? "border-rose-400/30 bg-rose-500/15 text-rose-200"
      : toContactCount > 0
        ? "border-amber-400/30 bg-amber-500/15 text-amber-200"
        : openCount > 0
          ? "border-violet-400/30 bg-violet-500/15 text-violet-200"
          : "border-emerald-400/30 bg-emerald-500/15 text-emerald-200";

  return (
    <section
      className={hubCardClass}
      style={{ padding: "clamp(0.9rem, 0.8rem + 0.5vw, 1.35rem)" }}
      aria-labelledby="postulations-today-pulse"
    >
      <div className="flex min-w-0 items-start gap-3">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${iconClass}`}
          aria-hidden
        >
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p id="postulations-today-pulse" className={hubSectionLabelClass}>
            Aujourd&apos;hui — recrutement
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-zinc-300">{headline}</p>
        </div>
      </div>
    </section>
  );
}

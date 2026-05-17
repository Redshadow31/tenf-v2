"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock3, Flame } from "lucide-react";
import {
  IMPACT_LABELS,
  type MembersOpsItem,
  type MembersOpsImpact,
} from "@/lib/admin/members/membersOpsQueue";
import {
  hubCardClass,
  hubFocusRingClass,
  hubSectionLabelClass,
  hubSectionTitleClass,
} from "./membersHubStyles";

type Props = {
  urgent: MembersOpsItem[];
  important: MembersOpsItem[];
  totalPending: number;
  ownersStore: Record<string, string>;
  ownersIsLocal: boolean;
  /** Plafonne le nombre d'actions affichées (toutes priorités confondues). */
  maxItems?: number;
};

const impactDotClass: Record<MembersOpsImpact, string> = {
  onboarding: "bg-fuchsia-300",
  moderation: "bg-orange-300",
  qualite_data: "bg-cyan-300",
  processus_interne: "bg-slate-300",
};

/**
 * Bloc "À traiter aujourd'hui".
 *
 * Affiche au maximum `maxItems` actions, regroupées par tier :
 *  - Urgent (P1)  → couleur rose, icône flamme
 *  - Important (P2) → couleur ambre
 *
 * Les P3 sont volontairement déportés vers le bloc "Signaux faibles".
 * Microcopy humaine : explique l'impact sur les créateurs, pas le jargon métier.
 */
export default function MembersDailyQueue({
  urgent,
  important,
  totalPending,
  ownersStore,
  ownersIsLocal,
  maxItems = 5,
}: Props) {
  // Mix urgent puis important, plafonné à maxItems.
  const visibleUrgent = urgent.slice(0, maxItems);
  const remainingSlots = Math.max(0, maxItems - visibleUrgent.length);
  const visibleImportant = important.slice(0, remainingSlots);

  const hasItems = visibleUrgent.length + visibleImportant.length > 0;

  return (
    <section
      className={hubCardClass}
      style={{ padding: "clamp(1rem, 0.85rem + 0.6vw, 1.6rem)" }}
      aria-labelledby="members-hub-daily-queue"
    >
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className={hubSectionLabelClass}>À traiter aujourd'hui</p>
          <h2
            id="members-hub-daily-queue"
            className={`mt-1.5 ${hubSectionTitleClass}`}
            style={{ fontSize: "clamp(1.05rem, 0.9rem + 0.45vw, 1.3rem)" }}
          >
            Ce qui débloque les créateurs maintenant
          </h2>
          <p
            className="mt-1 text-slate-400"
            style={{ fontSize: "clamp(0.74rem, 0.72rem + 0.1vw, 0.82rem)", maxWidth: "62ch" }}
          >
            Les actions à plus fort impact pour ouvrir un profil, accepter un dossier ou clore une
            revue. La file complète reste dans
            <Link href="/admin/membres/actions" className="ml-1 text-indigo-200 underline-offset-4 hover:underline">
              /admin/membres/actions
            </Link>
            .
          </p>
        </div>
        <Link
          href="/admin/membres/actions"
          className={`inline-flex items-center gap-1.5 rounded-lg border border-indigo-300/30 bg-indigo-500/10 px-3 py-1.5 text-[0.72rem] font-semibold text-indigo-100 transition hover:bg-indigo-500/20 ${hubFocusRingClass}`}
        >
          Voir toute la file ({totalPending})
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </header>

      <div className="mt-4 space-y-4">
        {!hasItems ? (
          <div className="flex items-center gap-3 rounded-xl border border-emerald-300/30 bg-emerald-500/[0.08] p-4 text-emerald-100">
            <CheckCircle2 className="h-5 w-5 text-emerald-300" aria-hidden />
            <div>
              <p className="text-sm font-semibold">Rien d'urgent. Bravo.</p>
              <p className="text-xs text-emerald-200/80">
                Aucun créateur n'est bloqué côté validation, postulation ou erreur data. C'est le bon
                moment pour mettre un membre en avant.
              </p>
            </div>
          </div>
        ) : (
          <>
            {visibleUrgent.length > 0 ? (
              <QueueTier
                title="Urgent · à ouvrir d'abord"
                tone="urgent"
                items={visibleUrgent}
                ownersStore={ownersStore}
                ownersIsLocal={ownersIsLocal}
              />
            ) : null}
            {visibleImportant.length > 0 ? (
              <QueueTier
                title="Important · cette semaine"
                tone="important"
                items={visibleImportant}
                ownersStore={ownersStore}
                ownersIsLocal={ownersIsLocal}
              />
            ) : null}
          </>
        )}
      </div>
    </section>
  );
}

function QueueTier({
  title,
  tone,
  items,
  ownersStore,
  ownersIsLocal,
}: {
  title: string;
  tone: "urgent" | "important";
  items: MembersOpsItem[];
  ownersStore: Record<string, string>;
  ownersIsLocal: boolean;
}) {
  const tones =
    tone === "urgent"
      ? {
          chip: "border-rose-400/40 bg-rose-500/10 text-rose-200",
          bar: "bg-rose-400",
          countBox: "border-rose-400/45 bg-rose-500/15 text-rose-100",
          icon: Flame,
        }
      : {
          chip: "border-amber-400/35 bg-amber-500/10 text-amber-200",
          bar: "bg-amber-400",
          countBox: "border-amber-400/40 bg-amber-500/10 text-amber-100",
          icon: Clock3,
        };
  const Icon = tones.icon;

  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <span className={`h-3 w-1 rounded-full ${tones.bar}`} aria-hidden />
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.12em] ${tones.chip}`}
        >
          <Icon className="h-3 w-3" aria-hidden />
          {title}
        </span>
      </div>
      <ul role="list" className="grid grid-cols-1 gap-2.5 xl:grid-cols-2">
        {items.map((item) => {
          const owner = ownersStore[item.id] || item.owner;
          return (
            <li key={item.id}>
              <Link
                href={item.href}
                className={`group flex h-full items-stretch gap-3 rounded-xl border border-white/[0.07] bg-white/[0.025] p-3.5 transition hover:-translate-y-0.5 hover:border-indigo-300/40 hover:bg-white/[0.045] ${hubFocusRingClass}`}
              >
                <span
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border text-base font-bold ${tones.countBox}`}
                  aria-hidden
                >
                  {item.count}
                </span>
                <span className="flex min-w-0 flex-1 flex-col justify-between">
                  <span>
                    <span className="flex flex-wrap items-center gap-1.5 text-[0.65rem] uppercase tracking-[0.12em] text-slate-400">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/30 px-2 py-0.5 text-slate-200">
                        <span className={`h-1.5 w-1.5 rounded-full ${impactDotClass[item.impact]}`} aria-hidden />
                        {IMPACT_LABELS[item.impact]}
                      </span>
                      <span className="inline-flex items-center gap-1 text-slate-400">
                        <Clock3 className="h-3 w-3" aria-hidden />
                        SLA {item.sla}
                      </span>
                    </span>
                    <p
                      className="mt-2 font-semibold text-white"
                      style={{ fontSize: "clamp(0.86rem, 0.82rem + 0.15vw, 0.98rem)", lineHeight: 1.25 }}
                    >
                      {item.title}
                    </p>
                    <p
                      className="mt-1 text-slate-400"
                      style={{ fontSize: "clamp(0.72rem, 0.7rem + 0.1vw, 0.8rem)", lineHeight: 1.45 }}
                    >
                      {item.description}
                    </p>
                  </span>
                  <span className="mt-2.5 flex items-center justify-between gap-2 text-[0.7rem]">
                    <span className="text-slate-500">
                      {owner ? (
                        <span className="text-slate-300">
                          Owner : <span className="font-medium text-slate-200">{owner}</span>
                          {ownersIsLocal ? (
                            <span className="ml-1 rounded border border-white/10 bg-white/[0.04] px-1 py-0.5 text-[0.58rem] uppercase tracking-wider text-slate-500">
                              vue locale
                            </span>
                          ) : null}
                        </span>
                      ) : (
                        <span>Non assigné</span>
                      )}
                    </span>
                    <span className="inline-flex items-center gap-1 font-semibold text-indigo-200 group-hover:text-indigo-100">
                      Ouvrir <ArrowRight className="h-3 w-3" aria-hidden />
                    </span>
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

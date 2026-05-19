"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ListChecks, RefreshCw, ShieldCheck, Sparkles } from "lucide-react";
import { formatModeratorDisplayName } from "@/lib/moderation/hubWelcome";
import {
  hubCardClass,
  hubFocusRingClass,
  hubGhostButtonClass,
  hubMembersLogoClass,
  hubPrimaryButtonClass,
} from "./membersHubStyles";

type Props = {
  username: string;
  roleLabel: string | null;
  generatedAt: string | null;
  pendingTotal: number;
  refreshing: boolean;
  partial: boolean;
  onRefresh: () => void;
};

const bodyStyle = { fontSize: "clamp(0.82rem, 0.78rem + 0.15vw, 0.95rem)" } as const;

export default function MembersHubHeader({
  username,
  roleLabel,
  generatedAt,
  pendingTotal,
  refreshing,
  partial,
  onRefresh,
}: Props) {
  const displayName = formatModeratorDisplayName(username);
  const generatedLabel = generatedAt
    ? new Date(generatedAt).toLocaleString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

  return (
    <header
      className={`relative overflow-hidden ${hubCardClass}`}
      style={{ padding: "clamp(1.15rem, 0.95rem + 0.7vw, 1.9rem)" }}
    >
      <div className="pointer-events-none absolute -right-24 -top-20 h-64 w-64 rounded-full bg-indigo-500/15 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-fuchsia-500/[0.08] blur-3xl" />

      <div className="relative grid min-w-0 grid-cols-1 items-start gap-6 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:gap-8">
        <div className="flex shrink-0 justify-center lg:justify-start">
          <Image
            src="/images/membres/hub-gestion-membres-logo.png"
            alt="Gestion des membres — Hub TENF"
            width={1024}
            height={1024}
            priority
            unoptimized
            className={hubMembersLogoClass}
          />
        </div>

        <div className="min-w-0 max-w-3xl">
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.11em] text-zinc-200/90">
              Membres TENF
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-400/26 bg-violet-500/10 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.11em] text-violet-100/92">
              <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden />
              Cockpit staff
            </span>
          </div>
          <p className="mt-2 text-[length:clamp(0.6875rem,0.625rem+0.25vw,0.8125rem)] uppercase tracking-[0.12em] text-violet-200/95">
            Pilotage communauté
          </p>
          <p className="mt-2 text-pretty leading-snug text-white" style={bodyStyle}>
            <span
              className="font-semibold tracking-tight text-white"
              style={{ fontSize: "clamp(1.15rem,0.95rem+0.55vw,1.65rem)" }}
            >
              Bonjour {displayName},
            </span>
          </p>
          <p className="mt-2 max-w-[62ch] text-pretty leading-[1.55] text-slate-300/90" style={bodyStyle}>
            Tu es sur le hub <strong className="font-medium text-zinc-200">Gestion des membres TENF</strong>
            . Validation, suivi, qualité des profils et reconnaissance des créateurs — ce cockpit répond à trois
            questions : ce qui bloque, l&apos;état de la communauté, où aller pour agir.
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-[0.72rem] text-slate-400">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/30 px-2.5 py-1">
              <ShieldCheck className="h-3.5 w-3.5 text-violet-300" aria-hidden />
              <span className="font-medium text-slate-200">{username}</span>
              {roleLabel ? (
                <>
                  <span className="text-slate-500">·</span>
                  <span>{roleLabel}</span>
                </>
              ) : null}
            </span>
            <span className="text-slate-500">Dernière synchro : {generatedLabel}</span>
            {partial ? (
              <span className="rounded-full border border-amber-400/35 bg-amber-400/10 px-2 py-0.5 text-[0.65rem] font-semibold text-amber-200">
                Données partielles
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex w-full shrink-0 flex-col items-stretch gap-2 sm:w-auto sm:min-w-[12rem] lg:items-end">
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className={`${hubGhostButtonClass} disabled:opacity-60 ${hubFocusRingClass}`}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} aria-hidden />
            {refreshing ? "Actualisation…" : "Actualiser"}
          </button>
          <Link
            href="/admin/membres/actions"
            className={`${hubPrimaryButtonClass} ${hubFocusRingClass} flex-wrap`}
            aria-label={`Voir toute la file (${pendingTotal} actions)`}
          >
            <ListChecks className="h-4 w-4 shrink-0" aria-hidden />
            <span className="whitespace-nowrap">Voir toute la file</span>
            <span className="shrink-0 rounded-full bg-white/15 px-2 py-0.5 text-[0.65rem] font-bold tabular-nums text-white">
              {pendingTotal}
            </span>
            <ArrowRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
          </Link>
        </div>
      </div>
    </header>
  );
}

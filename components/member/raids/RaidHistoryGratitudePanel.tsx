"use client";

import Link from "next/link";
import { ArrowRight, Gift, RefreshCw, Sparkles } from "lucide-react";
import {
  DashboardInnerCard,
  DashboardPanel,
  DashboardPanelHeader,
  MEMBER_SCROLL_MT,
  MemberPrimaryLink,
} from "@/components/member/dashboard/dashboardUi";
import {
  RAID_HISTORY_ACCENT,
  twitchChannelUrl,
  type ReturnPendingMeta,
  type ReturnPendingSuggestion,
} from "@/components/member/raids/raidHistoryUtils";

type RaidHistoryGratitudePanelProps = {
  suggestions: ReturnPendingSuggestion[];
  meta: ReturnPendingMeta | null;
  loading: boolean;
  error: string;
  onRefresh: () => void;
};

export default function RaidHistoryGratitudePanel({
  suggestions,
  meta,
  loading,
  error,
  onRefresh,
}: RaidHistoryGratitudePanelProps) {
  return (
    <DashboardPanel
      id="raid-gratitude"
      tone="cyan"
      accentHex={RAID_HISTORY_ACCENT}
      intensity="soft"
      ariaLabelledBy="raid-gratitude-title"
      className={MEMBER_SCROLL_MT}
    >
      <DashboardPanelHeader
        kicker="Entraide"
        title="Idées de retour"
        icon={Gift}
        tone="cyan"
        accentHex="#38bdf8"
        titleId="raid-gratitude-title"
        badge={
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex items-center gap-1 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold text-cyan-100 transition hover:bg-cyan-500/16 disabled:opacity-50"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} aria-hidden />
            Autres
          </button>
        }
      />

      <p className="-mt-1 mb-2 text-xs leading-relaxed text-white/55">
        Jusqu&apos;à 4 noms tirés au hasard — personnes qui t&apos;ont raidé·e sans raid retour enregistré sur{" "}
        {meta?.monthsScanned ?? "…"} mois. Piste bienveillante, pas une obligation.
      </p>

      {error ? (
        <p className="rounded-xl border border-red-500/35 bg-red-500/10 px-3 py-2 text-sm text-red-100">{error}</p>
      ) : loading ? (
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 w-full animate-pulse rounded-xl bg-white/[0.06]" />
          ))}
        </div>
      ) : suggestions.length === 0 ? (
        <DashboardInnerCard className="py-6 text-center">
          <Sparkles className="mx-auto h-8 w-8 text-cyan-400/50" aria-hidden />
          <p className="mt-2 text-sm font-semibold text-white/85">Rien à suggérer pour l&apos;instant</p>
          <p className="mt-1 text-xs text-white/45">Soit tu as déjà renvoyé l&apos;ascenseur, soit les données ne sont pas encore complètes.</p>
          <MemberPrimaryLink href="/lives" accentHex="#38bdf8" className="mt-3">
            Voir les lives <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </MemberPrimaryLink>
        </DashboardInnerCard>
      ) : (
        <ul className="max-h-[min(36rem,58vh)] space-y-2 overflow-y-auto pr-0.5">
          {suggestions.map((s) => {
            const last = new Date(s.lastReceivedAt);
            const lastLabel = Number.isNaN(last.getTime()) ? "—" : last.toLocaleDateString("fr-FR");
            const tw = twitchChannelUrl(s.login);
            return (
              <li key={s.login}>
                <DashboardInnerCard hover={false} className="!p-2.5">
                  <p className="truncate text-sm font-bold text-white">{s.label}</p>
                  <p className="truncate text-[11px] text-white/45">@{s.login}</p>
                  <p className="mt-1 text-[10px] text-white/50">
                    {s.receivedCount} passage{s.receivedCount > 1 ? "s" : ""} · dernier {lastLabel}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {tw ? (
                      <a
                        href={tw}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-lg bg-cyan-600/80 px-2.5 py-1.5 text-[11px] font-bold text-white transition hover:brightness-110"
                      >
                        Live <ArrowRight className="h-3 w-3" aria-hidden />
                      </a>
                    ) : null}
                    <Link
                      href={`/member/raids/declarer?cible=${encodeURIComponent(s.login)}`}
                      className="inline-flex items-center rounded-lg border border-white/12 px-2.5 py-1.5 text-[11px] font-semibold text-white/55 hover:text-white/85"
                    >
                      Signaler
                    </Link>
                  </div>
                </DashboardInnerCard>
              </li>
            );
          })}
        </ul>
      )}
    </DashboardPanel>
  );
}

"use client";

import type { ComponentType } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Link2,
  Loader2,
  LogIn,
  MessageCircle,
  Radio,
  Twitch,
  Users2,
  Zap,
} from "lucide-react";
import {
  hexToRgba,
  type MemberDashboardModel,
} from "@/components/member/dashboard/memberDashboardModel";
import { useLiveStreamsSnapshot } from "@/components/member/hooks/useLiveStreamsSnapshot";
import { DISCORD_INVITE_URL } from "@/lib/socialLinks";
import {
  DashboardBadge,
  DashboardInnerCard,
  DashboardPanel,
  DashboardPanelHeader,
} from "@/components/member/dashboard/dashboardUi";

type LiveNetworkCardProps = {
  model: MemberDashboardModel;
  variant?: "full" | "compact";
};

export default function LiveNetworkCard({ model, variant = "full" }: LiveNetworkCardProps) {
  const { accent } = model;
  const liveSnapshot = useLiveStreamsSnapshot();
  const compact = variant === "compact";

  return (
    <DashboardPanel tone="violet" accentHex={accent} intensity="medium" ariaLabelledBy="dashboard-network-title">
      <DashboardPanelHeader
        kicker="En direct"
        title="Lives & entraide"
        icon={Zap}
        tone="violet"
        accentHex="#9146ff"
        titleId="dashboard-network-title"
        badge={
          <DashboardBadge tone="violet" accentHex="#9146ff">
            <Twitch className="h-3 w-3" aria-hidden />
            Twitch
          </DashboardBadge>
        }
      />

      {!compact ? (
        <p className="-mt-2 mb-3 text-sm text-white/65">Raids détectés auto via Twitch.</p>
      ) : null}

      <LiveSnapshotPill snapshot={liveSnapshot} />

      {liveSnapshot.state === "ready" && liveSnapshot.streams.length > 0 ? (
        <ul className={`space-y-2 ${compact ? "mt-3" : "mt-4"}`}>
          {liveSnapshot.streams.slice(0, compact ? 2 : 3).map((stream) => (
            <li key={stream.login}>
              <a
                href={`https://twitch.tv/${stream.login}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 rounded-xl border border-red-500/25 bg-gradient-to-r from-red-500/10 to-transparent px-3 py-2.5 transition hover:border-red-400/40 hover:from-red-500/16"
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-red-500/30 to-violet-600/20 text-xs font-black uppercase text-white ring-1 ring-white/10"
                  aria-hidden
                >
                  {stream.login.slice(0, 2)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5 truncate text-sm font-bold text-white">
                    <LiveDot />
                    @{stream.login}
                  </span>
                  {stream.title && !compact ? (
                    <span className="block truncate text-xs text-white/50">{stream.title}</span>
                  ) : null}
                </span>
                {stream.viewers != null ? (
                  <span className="shrink-0 rounded-md bg-black/40 px-2 py-0.5 text-[10px] font-bold text-red-200">
                    {stream.viewers}
                  </span>
                ) : (
                  <span className="shrink-0 text-[10px] font-bold text-red-300">LIVE</span>
                )}
              </a>
            </li>
          ))}
        </ul>
      ) : null}

      <div className={`mt-auto pt-3 ${compact ? "space-y-3" : "grid gap-3 sm:grid-cols-[1.2fr_1fr]"}`}>
        <DashboardInnerCard accentHex="#9146ff" className="!p-3.5">
          <NetworkState model={model} compact={compact} />
          <div className={`mt-3 flex flex-wrap gap-2 ${compact ? "grid grid-cols-2" : ""}`}>
            <CtaButton href="/lives" icon={Twitch} label="Lives" primary />
            <CtaButton href={DISCORD_INVITE_URL} icon={MessageCircle} label="Discord" external discord />
            {!compact ? (
              <CtaButton href="/member/engagement/a-decouvrir" icon={Users2} label="Qui stream ?" />
            ) : null}
          </div>
        </DashboardInnerCard>

        {!compact ? (
          <DashboardInnerCard className="!p-3.5 text-xs text-white/70">
            <p className="font-bold text-white">Comment ça marche</p>
            <ol className="mt-2 list-decimal space-y-1 pl-4">
              <li>Repère un live TENF</li>
              <li>Passe dire bonjour — raid auto</li>
              <li>Entraide sur Discord</li>
            </ol>
            <Link
              href="/member/raids/historique"
              className="mt-2 inline-flex items-center gap-1 font-semibold text-violet-300 hover:text-white"
            >
              Historique raids <ArrowRight className="h-3 w-3" aria-hidden />
            </Link>
          </DashboardInnerCard>
        ) : null}
      </div>
    </DashboardPanel>
  );
}

function LiveDot() {
  return (
    <span className="relative flex h-2 w-2 shrink-0">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-70" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
    </span>
  );
}

function CtaButton({
  href,
  icon: Icon,
  label,
  primary,
  discord,
  external,
}: {
  href: string;
  icon: ComponentType<{ className?: string }>;
  label: string;
  primary?: boolean;
  discord?: boolean;
  external?: boolean;
}) {
  const className = `inline-flex min-h-[36px] flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition hover:brightness-110 ${
    primary
      ? "text-white shadow-md"
      : discord
        ? "border border-[#5865F2]/40 bg-[#5865F2]/12 text-white hover:bg-[#5865F2]/18"
        : "border border-white/12 text-white/90 hover:bg-white/5"
  }`;
  const style = primary ? { backgroundColor: "rgba(145,70,255,0.95)", boxShadow: "0 6px 16px rgba(145,70,255,0.25)" } : undefined;

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className} style={style}>
        <Icon className={`h-3.5 w-3.5 ${discord ? "text-[#5865F2]" : ""}`} aria-hidden />
        {label}
      </a>
    );
  }
  return (
    <Link href={href} className={className} style={style}>
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {label}
    </Link>
  );
}

function NetworkState({ model, compact }: { model: MemberDashboardModel; compact?: boolean }) {
  const { network } = model;

  if (network.state === "loading") {
    return (
      <div className="flex items-center gap-2 text-xs text-white/70">
        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
        Suivi réseau…
      </div>
    );
  }

  if (network.state === "not_authenticated") {
    return (
      <Link href="/auth/login" className="text-xs font-semibold text-violet-300 hover:text-white">
        <LogIn className="mr-1 inline h-3.5 w-3.5" aria-hidden />
        Connecte-toi pour le suivi réseau
      </Link>
    );
  }

  if (network.state === "twitch_unlinked") {
    return (
      <Link href="/member/profil/completer" className="text-xs font-semibold text-violet-300 hover:text-white">
        <Link2 className="mr-1 inline h-3.5 w-3.5" aria-hidden />
        Lie Twitch pour activer le suivi
      </Link>
    );
  }

  return (
    <div className="flex items-baseline justify-between gap-2">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">Follows membres</p>
      <p className={`font-black tabular-nums text-white ${compact ? "text-xl" : "text-2xl"}`}>
        {network.followed}
        <span className="text-sm font-semibold text-white/40">/{network.total}</span>
      </p>
    </div>
  );
}

function LiveSnapshotPill({
  snapshot,
}: {
  snapshot: ReturnType<typeof useLiveStreamsSnapshot>;
}) {
  if (snapshot.state === "loading") {
    return (
      <span className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-[11px] font-semibold text-white/60">
        <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
        Lives…
      </span>
    );
  }

  if (snapshot.state === "unavailable") {
    return (
      <span className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-[11px] text-white/50">
        <Radio className="h-3 w-3" aria-hidden />
        Aperçu indisponible
      </span>
    );
  }

  const { liveCount } = snapshot;
  const active = liveCount > 0;
  return (
    <Link
      href="/lives"
      className="mt-3 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-bold transition hover:-translate-y-0.5"
      style={{
        borderColor: active ? "rgba(239, 68, 68, 0.4)" : "rgba(255,255,255,0.12)",
        backgroundColor: active ? "rgba(239, 68, 68, 0.12)" : "rgba(255,255,255,0.04)",
        color: active ? "#fecaca" : "rgba(236,236,239,0.75)",
        boxShadow: active ? "0 0 20px rgba(239,68,68,0.15)" : undefined,
      }}
    >
      {active ? <LiveDot /> : <span className="h-2 w-2 rounded-full bg-white/30" aria-hidden />}
      {active ? `${liveCount} en direct` : "Aucun live"}
      <ArrowRight className="h-3 w-3" aria-hidden />
    </Link>
  );
}

"use client";

import Link from "next/link";
import { ArrowRight, HeartHandshake, Radio, Sparkles, Users } from "lucide-react";
import styles from "@/components/lives/lives-discovery.module.css";
import theme from "@/components/lives/lives-theme.module.css";

type CommunityStatsSectionProps = {
  filteredLiveCount: number;
  totalLiveCount: number;
  totalMembers: number | null;
  activeMembers: number | null;
  topGameLabel: string | null;
  topGameCount: number;
  onScrollToLives?: () => void;
  embedded?: boolean;
};

type StatTone = "red" | "violet" | "amber" | "emerald";

type StatItem = {
  label: string;
  value: string;
  subValue?: string;
  caption: string;
  icon: typeof Radio;
  tone: StatTone;
  live?: boolean;
  href?: string;
  onClick?: () => void;
  actionLabel?: string;
};

const TONE_CARD: Record<StatTone, string> = {
  red: theme.glassCardRed,
  violet: theme.glassCardViolet,
  amber: theme.glassCardAmber,
  emerald: theme.glassCardEmerald,
};

const TONE_ICON: Record<StatTone, string> = {
  red: theme.iconRed,
  violet: theme.iconViolet,
  amber: theme.iconAmber,
  emerald: theme.iconEmerald,
};

function StatCard({ item }: { item: StatItem }) {
  const interactive = Boolean(item.href || item.onClick);
  const cardClass = [
    theme.glassCard,
    styles.statCardPadding,
    TONE_CARD[item.tone],
    interactive ? `${theme.glassCardInteractive} ${styles.statActionGroup}` : "",
  ]
    .filter(Boolean)
    .join(" ");

  const inner = (
    <>
      <div className={styles.statLabel}>
        <item.icon className={`h-4 w-4 shrink-0 ${TONE_ICON[item.tone]}`} aria-hidden />
        <span>{item.label}</span>
        {item.live ? (
          <span className={styles.liveDot} aria-hidden>
            <span className={styles.liveDotPing} />
            <span className={styles.liveDotCore} />
          </span>
        ) : null}
      </div>
      <p className={styles.statValue}>{item.value}</p>
      {item.subValue ? <p className={styles.statSub}>{item.subValue}</p> : null}
      <p className={styles.statCaption}>{item.caption}</p>
      {item.actionLabel ? (
        <span className={styles.statAction}>
          {item.actionLabel}
          <ArrowRight className="h-3 w-3" aria-hidden />
        </span>
      ) : null}
    </>
  );

  if (item.href) {
    return (
      <Link href={item.href} className={cardClass}>
        {inner}
      </Link>
    );
  }

  if (item.onClick) {
    return (
      <button type="button" onClick={item.onClick} className={cardClass}>
        {inner}
      </button>
    );
  }

  return <div className={cardClass}>{inner}</div>;
}

export default function CommunityStatsSection({
  filteredLiveCount,
  totalLiveCount,
  totalMembers,
  activeMembers,
  topGameLabel,
  topGameCount,
  onScrollToLives,
  embedded = false,
}: CommunityStatsSectionProps) {
  const liveSub =
    filteredLiveCount !== totalLiveCount
      ? `${filteredLiveCount} dans ta sélection · ${totalLiveCount} au total`
      : totalLiveCount > 0
        ? `${totalLiveCount} chaîne${totalLiveCount > 1 ? "s" : ""} Twitch`
        : undefined;

  const stats: StatItem[] = [
    {
      label: "En direct",
      value: String(filteredLiveCount),
      subValue: liveSub,
      caption:
        topGameLabel && topGameCount > 0
          ? `Tendance : ${topGameLabel}`
          : "Synchronisé avec Twitch",
      icon: Radio,
      tone: "red",
      live: totalLiveCount > 0,
      onClick: onScrollToLives,
      actionLabel: onScrollToLives ? "Voir la grille" : undefined,
    },
    {
      label: "Communauté Discord",
      value: totalMembers !== null ? String(totalMembers) : "…",
      caption: "Créateurs et membres TENF",
      icon: Users,
      tone: "violet",
      href: "/membres",
      actionLabel: "Annuaire",
    },
    {
      label: "Actifs de l'entraide",
      value: activeMembers !== null ? String(activeMembers) : "…",
      caption: "présents dans l'entraide sur la période récente",
      icon: Sparkles,
      tone: "amber",
      href: "/membres",
      actionLabel: "Explorer",
    },
    {
      label: "Esprit TENF",
      value: totalLiveCount > 0 ? "Live" : "Entraide",
      caption: "Raids, soutien, visibilité partagée",
      icon: HeartHandshake,
      tone: "emerald",
      href: "/fonctionnement-tenf/comment-ca-marche",
      actionLabel: "Le fonctionnement",
    },
  ];

  const content = (
    <>
      <div className={styles.statsZoneHeader}>
        <div>
          <h2 id="community-stats-title" className={styles.statsZoneTitle}>
            <span className={styles.statsZoneTitleIcon} aria-hidden>
              <HeartHandshake className="h-4 w-4" />
            </span>
            Pulse communautaire
          </h2>
          <p className="mt-1 max-w-xl text-xs text-zinc-400 sm:text-sm">
            Les mêmes chiffres que tes filtres — clique une carte pour agir.
          </p>
        </div>
        <div className={styles.statsZonePills} aria-hidden>
          <span className={styles.statMiniPill}>
            {filteredLiveCount} / {totalLiveCount} lives
          </span>
          {topGameLabel && topGameCount > 0 ? (
            <span className={styles.statMiniPillRed}>
              {topGameLabel} · {topGameCount}
            </span>
          ) : null}
        </div>
      </div>
      <div className={styles.statsGrid}>
        {stats.map((item) => (
          <StatCard key={item.label} item={item} />
        ))}
      </div>
    </>
  );

  if (embedded) {
    return <div aria-labelledby="community-stats-title">{content}</div>;
  }

  return (
    <section className={`space-y-4 ${theme.panel} ${theme.panelPadding}`}>
      {content}
    </section>
  );
}

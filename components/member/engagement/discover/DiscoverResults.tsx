"use client";

import type { MutableRefObject } from "react";
import { ArrowRight, Copy, ExternalLink, Users } from "lucide-react";
import {
  DashboardInnerCard,
  DashboardPanel,
  DashboardPanelHeader,
  MemberPrimaryLink,
} from "@/components/member/dashboard/dashboardUi";
import {
  DISCOVER_ACCENT,
  mapRoleGroup,
  roleBadgeStyles,
  type PublicMember,
  type ViewMode,
} from "@/components/member/engagement/discover/discoverUtils";
import type { DiscoverEmptyModel } from "@/components/member/engagement/discover/discoverModel";

type DiscoverResultsProps = {
  embedded?: boolean;
  members: PublicMember[];
  filteredMembers: PublicMember[];
  viewMode: ViewMode;
  highlightLogin: string | null;
  cardRefs: MutableRefObject<Record<string, HTMLDivElement | null>>;
  onResetFilters: () => void;
  emptyModel: DiscoverEmptyModel;
  hasActiveFilters: boolean;
};

export default function DiscoverResults({
  embedded = false,
  members,
  filteredMembers,
  viewMode,
  highlightLogin,
  cardRefs,
  onResetFilters,
  emptyModel,
  hasActiveFilters,
}: DiscoverResultsProps) {
  if (filteredMembers.length === 0) {
    const empty = (
      <div className={embedded ? "py-6 text-center" : "py-8 text-center"}>
        <Users className="mx-auto h-10 w-10 text-violet-300/60" aria-hidden />
        <p className="mt-3 text-base font-semibold text-white">{emptyModel.title}</p>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-white/50">{emptyModel.body}</p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <MemberPrimaryLink href="/member/engagement/score" accentHex={DISCOVER_ACCENT}>
            Mon score
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </MemberPrimaryLink>
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={onResetFilters}
              className="rounded-xl border border-white/14 px-4 py-2 text-xs font-semibold text-white/70 hover:bg-white/[0.06]"
            >
              Réinitialiser les filtres
            </button>
          ) : null}
        </div>
      </div>
    );

    if (embedded) return empty;

    return (
      <DashboardPanel id="discover-results" tone="neutral" accentHex={DISCOVER_ACCENT} intensity="soft">
        {empty}
      </DashboardPanel>
    );
  }

  const grid =
    viewMode === "cards" ? (
      <div className={`grid gap-2 ${embedded ? "sm:grid-cols-2" : "sm:grid-cols-2 xl:grid-cols-3"}`}>
        {filteredMembers.map((member) => (
          <DiscoverCard
            key={member.twitchLogin}
            member={member}
            highlight={highlightLogin === member.twitchLogin}
            refCallback={(el) => {
              cardRefs.current[member.twitchLogin] = el;
            }}
          />
        ))}
      </div>
    ) : (
      <div className="space-y-1.5">
        {filteredMembers.map((member) => (
          <DiscoverListRow
            key={member.twitchLogin}
            member={member}
            highlight={highlightLogin === member.twitchLogin}
            refCallback={(el) => {
              cardRefs.current[member.twitchLogin] = el;
            }}
          />
        ))}
      </div>
    );

  if (embedded) return grid;

  return (
    <DashboardPanel
      id="discover-results"
      tone="neutral"
      accentHex={DISCOVER_ACCENT}
      intensity="soft"
      ariaLabelledBy="discover-results-title"
    >
      <DashboardPanelHeader
        kicker="Profils"
        title="Chaînes à explorer"
        icon={Users}
        tone="accent"
        accentHex={DISCOVER_ACCENT}
        titleId="discover-results-title"
        badge={
          <span className="text-[11px] font-semibold text-white/50">
            {filteredMembers.length} profil{filteredMembers.length > 1 ? "s" : ""}
          </span>
        }
      />
      {grid}
    </DashboardPanel>
  );
}

function DiscoverCard({
  member,
  highlight,
  refCallback,
}: {
  member: PublicMember;
  highlight: boolean;
  refCallback: (el: HTMLDivElement | null) => void;
}) {
  const group = mapRoleGroup(member.role);
  const badge = roleBadgeStyles(group);
  const twitchHref = member.twitchUrl || `https://www.twitch.tv/${member.twitchLogin}`;

  async function copyLogin() {
    try {
      await navigator.clipboard.writeText(member.twitchLogin);
    } catch {
      // noop
    }
  }

  return (
    <div ref={refCallback}>
      <DashboardInnerCard
        hover
        className={`!p-3 ${highlight ? "ring-2 ring-amber-400/80 ring-offset-1 ring-offset-black/40" : ""}`}
      >
        <div className={`pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full blur-2xl ${badge.glow}`} />
        <div className="relative flex flex-col gap-3">
          <div className="flex items-start gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={
                member.avatar ||
                `https://placehold.co/72x72/1e1b2e/a78bfa?text=${encodeURIComponent(member.displayName.charAt(0).toUpperCase())}`
              }
              alt=""
              className="h-12 w-12 shrink-0 rounded-xl border border-white/10 object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-white">{member.displayName}</p>
              <p className="truncate font-mono text-[11px] text-violet-200/70">@{member.twitchLogin}</p>
              <span
                className={`mt-1.5 inline-block rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase ${badge.chip}`}
              >
                {badge.label}
              </span>
            </div>
          </div>
          {member.role ? (
            <p className="line-clamp-2 text-[10px] leading-relaxed text-white/45">{member.role}</p>
          ) : null}
          <div className="flex flex-wrap gap-1.5">
            <a
              href={twitchHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-violet-600/80 px-3 py-2 text-[11px] font-bold text-white hover:brightness-110 sm:flex-none"
            >
              Voir sur Twitch
              <ExternalLink className="h-3 w-3" aria-hidden />
            </a>
            <button
              type="button"
              onClick={copyLogin}
              className="inline-flex items-center gap-1 rounded-lg border border-white/12 px-2.5 py-2 text-[11px] font-semibold text-white/55 hover:text-white/85"
            >
              <Copy className="h-3 w-3" aria-hidden />
              Copier
            </button>
          </div>
        </div>
      </DashboardInnerCard>
    </div>
  );
}

function DiscoverListRow({
  member,
  highlight,
  refCallback,
}: {
  member: PublicMember;
  highlight: boolean;
  refCallback: (el: HTMLDivElement | null) => void;
}) {
  const group = mapRoleGroup(member.role);
  const badge = roleBadgeStyles(group);
  const twitchHref = member.twitchUrl || `https://www.twitch.tv/${member.twitchLogin}`;

  return (
    <div
      ref={refCallback}
      className={`flex flex-wrap items-center gap-2 rounded-xl border border-white/8 bg-black/20 px-2.5 py-2 transition hover:border-violet-500/25 hover:bg-black/30 ${
        highlight ? "ring-2 ring-amber-400/80" : ""
      }`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={
          member.avatar ||
          `https://placehold.co/48x48/1e1b2e/a78bfa?text=${encodeURIComponent(member.displayName.charAt(0).toUpperCase())}`
        }
        alt=""
        className="h-9 w-9 shrink-0 rounded-lg border border-white/10 object-cover"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-white">{member.displayName}</p>
        <p className="truncate font-mono text-[10px] text-violet-200/60">@{member.twitchLogin}</p>
      </div>
      <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase ${badge.chip}`}>
        {badge.label}
      </span>
      <a
        href={twitchHref}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 rounded-lg border border-violet-400/30 bg-violet-600/20 px-2.5 py-1.5 text-[10px] font-bold text-white hover:bg-violet-600/35"
      >
        Twitch
        <ExternalLink className="h-3 w-3" aria-hidden />
      </a>
    </div>
  );
}

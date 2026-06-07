"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMemberOverview } from "@/components/member/hooks/useMemberOverview";
import MemberBentoShell, { MemberBentoCell, MemberBentoRow } from "@/components/member/layout/MemberBentoShell";
import { MemberAlert } from "@/components/member/dashboard/dashboardUi";
import {
  buildDiscoverHeroModel,
  buildDiscoverGuidanceModel,
  buildDiscoverEmptyModel,
  buildDiscoverGateCopy,
  followDoorSentence,
  resolveDiscoverContext,
} from "@/components/member/engagement/discover/discoverModel";
import DiscoverHero from "@/components/member/engagement/discover/DiscoverHero";
import DiscoverQuickPanel from "@/components/member/engagement/discover/DiscoverQuickPanel";
import DiscoverSubNav from "@/components/member/engagement/discover/DiscoverSubNav";
import DiscoverExplorerPanel from "@/components/member/engagement/discover/DiscoverExplorerPanel";
import DiscoverGuidancePanel from "@/components/member/engagement/discover/DiscoverGuidancePanel";
import DiscoverGatePanel from "@/components/member/engagement/discover/DiscoverGatePanel";
import {
  clearDiscoverCache,
  countByRole,
  DISCOVER_ACCENT,
  filterBySearchAndRole,
  filterDiscoverMembers,
  mapPublicMembers,
  readDiscoverCache,
  tryMigrateV1Cache,
  writeDiscoverCache,
  type FollowStatusesResponse,
  type PublicMember,
  type RoleFilterKey,
  type ViewMode,
} from "@/components/member/engagement/discover/discoverUtils";

export default function MemberEngagementDiscoverPage() {
  const { data: overview } = useMemberOverview();
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [linked, setLinked] = useState(false);
  const [members, setMembers] = useState<PublicMember[]>([]);
  const [notFollowedLogins, setNotFollowedLogins] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilterKey>("all");
  const [openingBatch, setOpeningBatch] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [highlightLogin, setHighlightLogin] = useState<string | null>(null);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    const cached = readDiscoverCache() ?? tryMigrateV1Cache();
    if (cached) {
      setAuthenticated(cached.authenticated);
      setLinked(cached.linked);
      setMembers(cached.members);
      setNotFollowedLogins(new Set(cached.notFollowedLogins));
      setLastUpdatedAt(cached.savedAt);
      setLoading(false);
      return;
    }

    let active = true;
    (async () => {
      try {
        setError(null);
        const followResponse = await fetch("/api/members/follow-status", {
          cache: "no-store",
          credentials: "include",
        });
        const followBody = (await followResponse.json()) as FollowStatusesResponse;
        if (!active) return;

        if (!followResponse.ok || followBody?.authenticated !== true) {
          setAuthenticated(false);
          setLinked(false);
          setMembers([]);
          setNotFollowedLogins(new Set());
          return;
        }

        setAuthenticated(true);
        const isLinked = followBody?.linked === true;
        setLinked(isLinked);
        if (!isLinked) {
          setMembers([]);
          setNotFollowedLogins(new Set());
          return;
        }

        const statuses = followBody?.statuses || {};
        const pending = new Set<string>();
        for (const [login, entry] of Object.entries(statuses)) {
          if ((entry?.state || "unknown") === "not_followed") {
            pending.add(login.toLowerCase());
          }
        }
        setNotFollowedLogins(pending);

        const membersResponse = await fetch("/api/members/public", {
          cache: "no-store",
          credentials: "include",
        });
        const membersBody = await membersResponse.json();
        if (!active) return;
        const rawMembers = Array.isArray(membersBody?.members) ? membersBody.members : [];
        const mapped = mapPublicMembers(rawMembers);
        setMembers(mapped);
        const savedAt = Date.now();
        setLastUpdatedAt(savedAt);
        writeDiscoverCache({
          savedAt,
          authenticated: true,
          linked: true,
          members: mapped,
          notFollowedLogins: Array.from(pending),
        });
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Erreur réseau.");
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const discoverMembers = useMemo(
    () => filterDiscoverMembers(members, notFollowedLogins),
    [members, notFollowedLogins],
  );

  const filteredDiscoverMembers = useMemo(
    () => filterBySearchAndRole(discoverMembers, search, roleFilter),
    [discoverMembers, roleFilter, search],
  );

  const roleCounts = useMemo(() => countByRole(discoverMembers), [discoverMembers]);
  const totalPending = discoverMembers.length;

  const discoverCtx = useMemo(() => resolveDiscoverContext(overview), [overview]);

  const heroModel = useMemo(
    () =>
      buildDiscoverHeroModel({
        ctx: discoverCtx,
        totalPending,
        filteredCount: filteredDiscoverMembers.length,
        membersTotal: members.length,
      }),
    [discoverCtx, totalPending, filteredDiscoverMembers.length, members.length],
  );

  const guidanceModel = useMemo(
    () => buildDiscoverGuidanceModel(discoverCtx, totalPending),
    [discoverCtx, totalPending],
  );

  const emptyModel = useMemo(
    () => buildDiscoverEmptyModel(discoverCtx, search.trim() !== "" || roleFilter !== "all"),
    [discoverCtx, search, roleFilter],
  );

  const discordGateCopy = useMemo(() => buildDiscoverGateCopy("discord", discoverCtx), [discoverCtx]);
  const twitchGateCopy = useMemo(() => buildDiscoverGateCopy("twitch", discoverCtx), [discoverCtx]);

  const pickRandom = useCallback(() => {
    if (filteredDiscoverMembers.length === 0) return;
    const i = Math.floor(Math.random() * filteredDiscoverMembers.length);
    const login = filteredDiscoverMembers[i].twitchLogin;
    setHighlightLogin(login);
    cardRefs.current[login]?.scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(() => setHighlightLogin(null), 2400);
  }, [filteredDiscoverMembers]);

  const openTopRecommendations = useCallback(
    async (n: number) => {
      if (filteredDiscoverMembers.length === 0 || openingBatch) return;
      setOpeningBatch(true);
      try {
        const top = filteredDiscoverMembers.slice(0, n);
        for (const member of top) {
          const url = member.twitchUrl || `https://www.twitch.tv/${member.twitchLogin}`;
          window.open(url, "_blank", "noopener,noreferrer");
          await new Promise((resolve) => setTimeout(resolve, 220));
        }
      } finally {
        setOpeningBatch(false);
      }
    },
    [filteredDiscoverMembers, openingBatch],
  );

  function forceRefresh() {
    clearDiscoverCache();
    window.location.reload();
  }

  const connectTwitchHref = `/api/auth/twitch/link/start?callbackUrl=${encodeURIComponent("/member/engagement/a-decouvrir")}`;

  if (loading) {
    return (
      <MemberBentoShell accentHex={DISCOVER_ACCENT}>
        <DiscoverSkeleton />
      </MemberBentoShell>
    );
  }

  return (
    <MemberBentoShell accentHex={DISCOVER_ACCENT}>
      {error ? <MemberAlert variant="error">{error}</MemberAlert> : null}

      {!authenticated ? (
        <MemberBentoRow>
          <MemberBentoCell span={12}>
            <DiscoverGatePanel kind="discord" {...discordGateCopy} />
          </MemberBentoCell>
        </MemberBentoRow>
      ) : !linked ? (
        <MemberBentoRow>
          <MemberBentoCell span={12}>
            <DiscoverGatePanel kind="twitch" connectHref={connectTwitchHref} {...twitchGateCopy} />
          </MemberBentoCell>
        </MemberBentoRow>
      ) : (
        <>
          <MemberBentoRow>
            <MemberBentoCell span={8}>
              <DiscoverHero model={heroModel} />
            </MemberBentoCell>
            <MemberBentoCell span={4} stretch>
              <DiscoverQuickPanel
                totalPending={totalPending}
                filteredCount={filteredDiscoverMembers.length}
                roleCounts={roleCounts}
                lastUpdatedAt={lastUpdatedAt}
                openingBatch={openingBatch}
                onOpenBatch={(n) => void openTopRecommendations(n)}
                onPickRandom={pickRandom}
                onRefresh={forceRefresh}
                canAct={filteredDiscoverMembers.length > 0}
              />
            </MemberBentoCell>
          </MemberBentoRow>

          <DiscoverSubNav />

          <MemberBentoRow>
            <MemberBentoCell span={8}>
              <DiscoverExplorerPanel
                search={search}
                onSearchChange={setSearch}
                roleFilter={roleFilter}
                onRoleFilterChange={setRoleFilter}
                roleCounts={roleCounts}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                subtitle={followDoorSentence("short")}
                members={discoverMembers}
                filteredMembers={filteredDiscoverMembers}
                highlightLogin={highlightLogin}
                cardRefs={cardRefs}
                onResetFilters={() => {
                  setSearch("");
                  setRoleFilter("all");
                }}
                emptyModel={emptyModel}
                hasActiveFilters={search.trim() !== "" || roleFilter !== "all"}
              />
            </MemberBentoCell>
            <MemberBentoCell span={4}>
              <DiscoverGuidancePanel model={guidanceModel} variant="sidebar" />
            </MemberBentoCell>
          </MemberBentoRow>
        </>
      )}
    </MemberBentoShell>
  );
}

function DiscoverSkeleton() {
  return (
    <div className="flex w-full animate-pulse flex-col gap-[clamp(0.5rem,0.9vw,1rem)]">
      <div className="grid gap-3 lg:grid-cols-12">
        <div className="h-40 rounded-[1.35rem] border border-white/[0.06] bg-white/[0.04] lg:col-span-8" />
        <div className="h-40 rounded-[1.35rem] border border-white/[0.06] bg-white/[0.04] lg:col-span-4" />
      </div>
      <div className="h-11 rounded-[1.35rem] border border-white/[0.06] bg-white/[0.04]" />
      <div className="grid gap-3 lg:grid-cols-12">
        <div className="h-[min(52vh,28rem)] rounded-[1.35rem] border border-white/[0.06] bg-white/[0.04] lg:col-span-8" />
        <div className="h-[min(52vh,28rem)] rounded-[1.35rem] border border-white/[0.06] bg-white/[0.04] lg:col-span-4" />
      </div>
    </div>
  );
}

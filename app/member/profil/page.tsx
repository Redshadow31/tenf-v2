"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import MemberBentoShell, { MemberBentoCell, MemberBentoRow } from "@/components/member/layout/MemberBentoShell";
import EmptyFeatureCard from "@/components/member/ui/EmptyFeatureCard";
import ProfileHero from "@/components/member/profil/ProfileHero";
import ProfileSubNav, { type ProfileNavItem } from "@/components/member/profil/ProfileSubNav";
import ProfileActivityGrid from "@/components/member/profil/ProfileActivityGrid";
import ProfileTwitchPanel from "@/components/member/profil/ProfileTwitchPanel";
import ProfileDetailsPanel from "@/components/member/profil/ProfileDetailsPanel";
import ProfilePlanningSection from "@/components/member/profil/ProfilePlanningSection";
import ProfileOnboardingCallout from "@/components/member/profil/ProfileOnboardingCallout";
import ProfileStatusStack from "@/components/member/profil/ProfileStatusStack";
import ProfileBioCard from "@/components/member/profil/ProfileBioCard";
import { buildMemberProfileModel } from "@/components/member/profil/memberProfileModel";
import type { MemberOverview } from "@/components/member/hooks/useMemberOverview";

type MemberApiResponse = {
  member: {
    displayName: string;
    twitchLogin: string;
    memberId: string;
    avatar: string;
    role: string;
    bio: string;
    profileValidationStatus: "non_soumis" | "en_cours_examen" | "valide" | string;
    socials: {
      twitch: string;
      discord: string;
      instagram: string;
      tiktok: string;
      twitter: string;
    };
    timezone?: string | null;
    tenfSummary: {
      role: string;
      status: string;
      integration: { integrated: boolean; date: string | null };
      parrain: string | null;
    };
    integrationDate?: string | null;
    birthday?: string | null;
    twitchAffiliateDate?: string | null;
  };
  pending: Record<string, never> | null;
};

type StreamPlanningItem = {
  id: string;
  date: string;
  time: string;
  liveType: string;
  title?: string;
};

type TwitchLinkStatus = {
  loading: boolean;
  connected: boolean;
  login: string | null;
  displayName: string | null;
};

const LIVE_PLANNING_ROUTE = "/member/planning";
const TWITCH_LINK_CALLBACK = "/member/profil";

const PROFILE_NAV: ProfileNavItem[] = [
  { id: "profil-resume", label: "Résumé" },
  { id: "profil-engagement", label: "Activité" },
  { id: "twitch-connection", label: "Twitch" },
  { id: "planning", label: "Planning" },
  { id: "profile-details", label: "Infos & bio" },
  { id: "validation", label: "Validation" },
];

export default function MemberProfilePage() {
  const searchParams = useSearchParams();
  const [profileData, setProfileData] = useState<MemberApiResponse | null>(null);
  const [overview, setOverview] = useState<MemberOverview | null>(null);
  const [plannings, setPlannings] = useState<StreamPlanningItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [twitchLinkStatus, setTwitchLinkStatus] = useState<TwitchLinkStatus>({
    loading: true,
    connected: false,
    login: null,
    displayName: null,
  });
  const [disconnectingTwitch, setDisconnectingTwitch] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setError(null);
        const [profileRes, overviewRes, planningRes] = await Promise.all([
          fetch("/api/members/me", { cache: "no-store" }),
          fetch("/api/members/me/overview", { cache: "no-store" }),
          fetch("/api/members/me/stream-plannings", { cache: "no-store" }),
        ]);

        const [profileBody, overviewBody, planningBody] = await Promise.all([
          profileRes.json(),
          overviewRes.json(),
          planningRes.json(),
        ]);

        if (!active) return;
        if (!profileRes.ok) {
          setError(profileBody.error || "Impossible de charger ton profil.");
          return;
        }

        setProfileData(profileBody);
        setOverview(overviewRes.ok ? overviewBody : null);
        setPlannings(planningRes.ok ? planningBody.plannings || [] : []);
      } catch {
        if (active) setError("Erreur de connexion.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const response = await fetch("/api/auth/twitch/link/status", { cache: "no-store" });
        const body = await response.json();
        if (!active) return;
        if (!response.ok || !body?.connected) {
          setTwitchLinkStatus({ loading: false, connected: false, login: null, displayName: null });
          return;
        }
        setTwitchLinkStatus({
          loading: false,
          connected: true,
          login: body?.twitch?.login || null,
          displayName: body?.twitch?.displayName || null,
        });
      } catch {
        if (!active) return;
        setTwitchLinkStatus({ loading: false, connected: false, login: null, displayName: null });
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const handleDisconnectTwitch = useCallback(async () => {
    setDisconnectingTwitch(true);
    try {
      const response = await fetch("/api/auth/twitch/link/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) {
        alert("Impossible de déconnecter le compte Twitch.");
        return;
      }
      setTwitchLinkStatus({ loading: false, connected: false, login: null, displayName: null });
    } catch {
      alert("Erreur réseau pendant la déconnexion Twitch.");
    } finally {
      setDisconnectingTwitch(false);
    }
  }, []);

  const upcomingPlannings = useMemo(
    () =>
      plannings.filter((planning) => {
        const startsAt = new Date(`${planning.date}T${planning.time}:00`).getTime();
        return startsAt >= Date.now();
      }),
    [plannings],
  );

  const nextPlanning = useMemo(
    () =>
      upcomingPlannings
        .slice()
        .sort(
          (a, b) =>
            new Date(`${a.date}T${a.time}:00`).getTime() -
            new Date(`${b.date}T${b.time}:00`).getTime(),
        )[0] || null,
    [upcomingPlannings],
  );

  const model = useMemo(() => {
    if (!profileData) return null;
    const member = profileData.member;
    const hasPublicProfileLink =
      !!member.twitchLogin &&
      !member.twitchLogin.startsWith("nouveau_") &&
      !member.twitchLogin.startsWith("nouveau-");
    const needsOnboarding =
      member.role === "Nouveau" ||
      member.twitchLogin.startsWith("nouveau_") ||
      member.twitchLogin.startsWith("nouveau-") ||
      searchParams?.get("onboarding") === "1";

    return buildMemberProfileModel({
      member,
      overview,
      planningCount: upcomingPlannings.length,
      upcomingLives: upcomingPlannings.length,
      nextPlanning,
      twitchConnected: twitchLinkStatus.connected,
      needsOnboarding,
      hasPublicProfileLink,
      publicProfileHref: `/membres?member=${encodeURIComponent(member.twitchLogin)}`,
      livePlanningHref: LIVE_PLANNING_ROUTE,
    });
  }, [profileData, overview, upcomingPlannings, nextPlanning, twitchLinkStatus.connected, searchParams]);

  if (loading) return <ProfilePageSkeleton />;
  if (error || !profileData || !model) {
    return (
      <MemberBentoShell>
        <EmptyFeatureCard title="Mon profil" description={error || "Impossible de charger le profil."} />
      </MemberBentoShell>
    );
  }

  const member = profileData.member;
  const safeOverview: MemberOverview =
    overview || {
      member: {
        twitchLogin: member.twitchLogin,
        displayName: member.displayName,
        role: member.role,
        profileValidationStatus: member.profileValidationStatus,
        integrationDate: member.integrationDate || null,
        parrain: member.tenfSummary?.parrain || null,
        bio: member.bio || "",
        socials: {
          twitch: member.socials.twitch || "",
          discord: member.socials.discord || "",
          instagram: member.socials.instagram || "",
          tiktok: member.socials.tiktok || "",
          twitter: member.socials.twitter || "",
          youtube: "",
        },
      },
      vip: {
        activeThisMonth: false,
        statusLabel: "Indisponible",
        source: "none",
        startsAt: null,
        endsAt: null,
      },
      monthKey: "",
      stats: {
        raidsThisMonth: 0,
        raidsTotal: 0,
        eventPresencesThisMonth: 0,
        participationThisMonth: 0,
        formationsValidated: 0,
      },
      profile: { completed: false, percent: 0 },
      upcomingEvents: [],
      formationHistory: [],
      eventPresenceHistory: [],
    };

  const twitchLinkedNow = searchParams?.get("twitch_linked") === "1";
  const twitchError = searchParams?.get("twitch_error") || null;
  const twitchStartHref = `/api/auth/twitch/link/start?callbackUrl=${encodeURIComponent(TWITCH_LINK_CALLBACK)}`;

  return (
    <MemberBentoShell accentHex={model.accent}>
      <ProfileSubNav items={PROFILE_NAV} accentHex={model.accent} />

      {model.needsOnboarding ? <ProfileOnboardingCallout /> : null}

      <MemberBentoRow>
        <MemberBentoCell span={7}>
          <ProfileHero model={model} />
        </MemberBentoCell>
        <MemberBentoCell span={5}>
          <ProfileStatusStack model={model} validationStatus={member.profileValidationStatus} />
        </MemberBentoCell>
      </MemberBentoRow>

      <MemberBentoRow>
        <MemberBentoCell span={12}>
          <ProfileActivityGrid
            model={model}
            upcomingEvents={safeOverview.upcomingEvents?.length ?? 0}
            raidsThisMonth={safeOverview.stats.raidsThisMonth}
            presencesThisMonth={safeOverview.stats.eventPresencesThisMonth}
            formationsValidated={safeOverview.stats.formationsValidated}
            vipStatusLabel={safeOverview.vip?.statusLabel || "—"}
          />
        </MemberBentoCell>
      </MemberBentoRow>

      <MemberBentoRow>
        <MemberBentoCell span={7}>
          <ProfileTwitchPanel
            status={twitchLinkStatus}
            startHref={twitchStartHref}
            reconnectHref={twitchStartHref}
            twitchLinkedNow={twitchLinkedNow}
            twitchError={twitchError}
            onDisconnect={handleDisconnectTwitch}
            disconnecting={disconnectingTwitch}
          />
        </MemberBentoCell>
        <MemberBentoCell span={5}>
          <ProfilePlanningSection plannings={plannings} planningHref={LIVE_PLANNING_ROUTE} compact />
        </MemberBentoCell>
      </MemberBentoRow>

      <MemberBentoRow>
        <MemberBentoCell span={8}>
          <ProfileDetailsPanel member={member} />
        </MemberBentoCell>
        <MemberBentoCell span={4}>
          <ProfileBioCard
            model={model}
            member={{
              displayName: member.displayName,
              twitchLogin: member.twitchLogin,
              avatar: member.avatar,
              bio: member.bio,
            }}
          />
        </MemberBentoCell>
      </MemberBentoRow>
    </MemberBentoShell>
  );
}

function ProfilePageSkeleton() {
  return (
    <MemberBentoShell>
      <div className="flex w-full animate-pulse flex-col gap-3">
        <div className="h-11 rounded-[1.35rem] border border-white/[0.06] bg-white/[0.04]" />
        <div className="grid gap-3 lg:grid-cols-12">
          <div className="h-48 rounded-[1.35rem] border border-white/[0.06] bg-white/[0.04] lg:col-span-7" />
          <div className="h-48 rounded-[1.35rem] border border-white/[0.06] bg-white/[0.04] lg:col-span-5" />
        </div>
        <div className="h-28 rounded-[1.35rem] border border-white/[0.06] bg-white/[0.04]" />
        <div className="grid gap-3 lg:grid-cols-12">
          <div className="h-40 rounded-[1.35rem] border border-white/[0.06] bg-white/[0.04] lg:col-span-7" />
          <div className="h-40 rounded-[1.35rem] border border-white/[0.06] bg-white/[0.04] lg:col-span-5" />
        </div>
        <div className="grid gap-3 lg:grid-cols-12">
          <div className="h-44 rounded-[1.35rem] border border-white/[0.06] bg-white/[0.04] lg:col-span-8" />
          <div className="h-44 rounded-[1.35rem] border border-white/[0.06] bg-white/[0.04] lg:col-span-4" />
        </div>
      </div>
    </MemberBentoShell>
  );
}

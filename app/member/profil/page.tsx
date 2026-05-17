"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import MemberSurface from "@/components/member/ui/MemberSurface";
import EmptyFeatureCard from "@/components/member/ui/EmptyFeatureCard";
import ProfileHero from "@/components/member/profil/ProfileHero";
import ProfileSubNav, { type ProfileNavItem } from "@/components/member/profil/ProfileSubNav";
import ProfileActivityGrid from "@/components/member/profil/ProfileActivityGrid";
import ProfileTwitchPanel from "@/components/member/profil/ProfileTwitchPanel";
import ProfileDetailsPanel from "@/components/member/profil/ProfileDetailsPanel";
import ProfilePlanningSection from "@/components/member/profil/ProfilePlanningSection";
import ProfileValidationSection from "@/components/member/profil/ProfileValidationSection";
import ProfileOnboardingCallout from "@/components/member/profil/ProfileOnboardingCallout";
import ProfileAside from "@/components/member/profil/ProfileAside";
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

function formatDateFr(value?: string | null): string {
  if (!value) return "Non renseignée";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Non renseignée";
  return date.toLocaleDateString("fr-FR");
}

function ProfilePageSkeleton() {
  return (
    <MemberSurface layout="fluid" wide>
      <div className="animate-pulse space-y-[clamp(0.75rem,1.2vw,1.5rem)]">
        <div className="h-[clamp(10rem,18vw,16rem)] rounded-[clamp(1rem,1.5vw,1.5rem)] bg-white/[0.06]" />
        <div className="h-[clamp(3rem,5vw,4.5rem)] rounded-2xl bg-white/[0.04]" />
        <div className="grid gap-[clamp(0.75rem,1.2vw,1.5rem)] lg:grid-cols-[minmax(0,1fr)_minmax(15rem,22rem)]">
          <div className="space-y-[clamp(0.75rem,1.2vw,1.5rem)]">
            <div className="h-44 rounded-2xl bg-white/[0.05]" />
            <div className="h-48 rounded-2xl bg-white/[0.05]" />
            <div className="h-60 rounded-2xl bg-white/[0.05]" />
          </div>
          <div className="space-y-[clamp(0.75rem,1.2vw,1.5rem)]">
            <div className="h-72 rounded-2xl bg-white/[0.05]" />
            <div className="h-44 rounded-2xl bg-white/[0.05]" />
            <div className="h-56 rounded-2xl bg-white/[0.05]" />
          </div>
        </div>
      </div>
    </MemberSurface>
  );
}

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

  const completionChecklist = useMemo(() => {
    if (!profileData) return [];
    const m = profileData.member;
    const list: Array<{ label: string; status: "ok" | "warning" | "missing" }> = [
      { label: "Avatar", status: m.avatar ? "ok" : "missing" },
      { label: "Bio", status: m.bio ? "ok" : "warning" },
      { label: "Lien Twitch", status: m.socials.twitch ? "ok" : "missing" },
      {
        label: "Réseaux sociaux",
        status:
          m.socials.instagram || m.socials.tiktok || m.socials.twitter ? "ok" : "warning",
      },
      { label: "Planning live", status: plannings.length > 0 ? "ok" : "warning" },
      { label: "Présentation prête", status: m.bio ? "ok" : "warning" },
      {
        label: "Profil valide",
        status: m.profileValidationStatus === "valide" ? "ok" : "warning",
      },
    ];
    return list;
  }, [profileData, plannings.length]);

  if (loading) return <ProfilePageSkeleton />;
  if (error || !profileData) {
    return (
      <MemberSurface layout="fluid" wide>
        <EmptyFeatureCard title="Mon profil" description={error || "Impossible de charger le profil."} />
      </MemberSurface>
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

  const profilePercent = safeOverview.profile?.percent ?? 0;
  const vip = safeOverview.vip;

  const validationLabel =
    member.profileValidationStatus === "valide"
      ? "Profil valide par le staff"
      : member.profileValidationStatus === "en_cours_examen"
        ? "Modifications en attente de validation"
        : "Informations manquantes";
  const validationTone: "success" | "warning" | "neutral" =
    member.profileValidationStatus === "valide"
      ? "success"
      : member.profileValidationStatus === "en_cours_examen"
        ? "warning"
        : "neutral";

  const hasPublicProfileLink =
    !!member.twitchLogin &&
    !member.twitchLogin.startsWith("nouveau_") &&
    !member.twitchLogin.startsWith("nouveau-");
  const publicProfileHref = `/membres?member=${encodeURIComponent(member.twitchLogin)}`;

  const needsOnboarding =
    member.role === "Nouveau" ||
    member.twitchLogin.startsWith("nouveau_") ||
    member.twitchLogin.startsWith("nouveau-") ||
    searchParams?.get("onboarding") === "1";

  const twitchLinkedNow = searchParams?.get("twitch_linked") === "1";
  const twitchError = searchParams?.get("twitch_error") || null;
  const twitchStartHref = `/api/auth/twitch/link/start?callbackUrl=${encodeURIComponent(TWITCH_LINK_CALLBACK)}`;

  const upcomingPlannings = plannings.filter((planning) => {
    const startsAt = new Date(`${planning.date}T${planning.time}:00`).getTime();
    return startsAt >= Date.now();
  });
  const nextPlanning =
    upcomingPlannings
      .slice()
      .sort(
        (a, b) =>
          new Date(`${a.date}T${a.time}:00`).getTime() -
          new Date(`${b.date}T${b.time}:00`).getTime(),
      )[0] || null;

  const vipLabel = vip?.activeThisMonth
    ? "VIP TENF actif ce mois-ci"
    : vip
      ? "VIP TENF — pas ce mois-ci"
      : "VIP — indisponible";

  const quickActions = [
    { label: "Compléter mon profil", href: "/member/profil/completer" },
    { label: "Modifier mon planning", href: LIVE_PLANNING_ROUTE },
    hasPublicProfileLink
      ? { label: "Voir ma fiche publique", href: publicProfileHref }
      : { label: "Voir ma fiche publique", soon: true },
    { label: "Déclarer un raid", href: "/member/raids/declarer" },
    { label: "Voir mes formations", href: "/member/formations/validees" },
    { label: "Voir mon activité", href: "/member/activite" },
  ];

  return (
    <MemberSurface layout="fluid" wide>
      <ProfileHero
        avatar={member.avatar}
        displayName={member.displayName}
        twitchLogin={member.twitchLogin}
        role={member.role}
        profilePercent={profilePercent}
        vipLabel={vipLabel}
        vipActive={!!vip?.activeThisMonth}
        validationLabel={validationLabel}
        validationTone={validationTone}
        integrationDone={member.tenfSummary.integration.integrated}
        upcomingLives={upcomingPlannings.length}
        hasPublicProfileLink={hasPublicProfileLink}
        publicProfileHref={publicProfileHref}
        livePlanningHref={LIVE_PLANNING_ROUTE}
      />

      <ProfileSubNav items={PROFILE_NAV} />

      <div className="grid grid-cols-1 gap-[clamp(0.6rem,0.95vw,1.1rem)] xl:grid-cols-[minmax(0,1fr)_clamp(16rem,min(26vw,22rem))] xl:items-start">
        <main className="grid min-w-0 grid-cols-12 gap-[clamp(0.6rem,0.95vw,1.1rem)]">
          {needsOnboarding ? (
            <div className="col-span-12">
              <ProfileOnboardingCallout />
            </div>
          ) : null}

          <div className="col-span-12">
            <ProfileActivityGrid
              upcomingEvents={safeOverview.upcomingEvents?.length ?? 0}
              raidsThisMonth={safeOverview.stats.raidsThisMonth}
              presencesThisMonth={safeOverview.stats.eventPresencesThisMonth}
              formationsValidated={safeOverview.stats.formationsValidated}
              vipStatusLabel={vip?.statusLabel || "—"}
            />
          </div>

          <div className="col-span-12 xl:col-span-6">
            <ProfileTwitchPanel
              status={twitchLinkStatus}
              startHref={twitchStartHref}
              reconnectHref={twitchStartHref}
              twitchLinkedNow={twitchLinkedNow}
              twitchError={twitchError}
              onDisconnect={handleDisconnectTwitch}
              disconnecting={disconnectingTwitch}
            />
          </div>

          <div className="col-span-12 xl:col-span-6">
            <ProfilePlanningSection plannings={plannings} planningHref={LIVE_PLANNING_ROUTE} />
          </div>

          <div className="col-span-12 xl:col-span-8">
            <ProfileDetailsPanel member={member} />
          </div>

          <div className="col-span-12 xl:col-span-4">
            <ProfileValidationSection
              status={member.profileValidationStatus}
              label={validationLabel}
              tone={validationTone}
            />
          </div>
        </main>

        <ProfileAside
          percent={profilePercent}
          items={completionChecklist}
          nextPlanning={nextPlanning}
          integrationDate={formatDateFr(member.tenfSummary.integration.date)}
          twitchConnected={twitchLinkStatus.connected}
          livePlanningHref={LIVE_PLANNING_ROUTE}
          member={{
            displayName: member.displayName,
            twitchLogin: member.twitchLogin,
            avatar: member.avatar,
            bio: member.bio,
            socials: member.socials,
          }}
          hasPublicProfileLink={hasPublicProfileLink}
          publicProfileHref={publicProfileHref}
          quickActions={quickActions}
        />
      </div>
    </MemberSurface>
  );
}

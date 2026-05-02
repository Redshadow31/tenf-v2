"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useMemo, useState } from "react";
import {
  ArrowRight,
  Calendar,
  CalendarDays,
  ChevronDown,
  Crown,
  ExternalLink,
  Gamepad2,
  LayoutDashboard,
  Link2,
  Radio,
  ShieldCheck,
  Sparkles,
  UserCircle2,
  Zap,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import MemberSurface from "@/components/member/ui/MemberSurface";
import MemberPageHeader from "@/components/member/ui/MemberPageHeader";
import EmptyFeatureCard from "@/components/member/ui/EmptyFeatureCard";
import StatCard from "@/components/member/ui/StatCard";
import StatusBadge from "@/components/member/ui/StatusBadge";
import MemberInfoCard from "@/components/member/ui/MemberInfoCard";
import PlanningPreviewCard from "@/components/member/ui/PlanningPreviewCard";
import ProfileCompletionCard from "@/components/member/ui/ProfileCompletionCard";
import QuickActionsCard from "@/components/member/ui/QuickActionsCard";
import DiscordMarkdownPreview from "@/components/member/ui/DiscordMarkdownPreview";
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

const LIVE_PLANNING_ROUTE = "/member/planning";
const TWITCH_LINK_CALLBACK = "/member/profil";

type TwitchLinkStatus = {
  loading: boolean;
  connected: boolean;
  login: string | null;
  displayName: string | null;
};

function formatDateFr(value?: string | null): string {
  if (!value) return "Non renseignée";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Non renseignée";
  return date.toLocaleDateString("fr-FR");
}

function CompletionRing({ percent }: { percent: number }) {
  const gid = useId();
  const gradId = `profil-ring-${gid.replace(/:/g, "")}`;
  const p = Math.max(0, Math.min(100, percent));
  const r = 38;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (p / 100) * circumference;
  return (
    <div className="relative flex h-[7.5rem] w-[7.5rem] shrink-0 items-center justify-center">
      <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 88 88" aria-hidden>
        <circle cx="44" cy="44" r={r} stroke="rgba(255,255,255,0.08)" strokeWidth="8" fill="none" />
        <circle
          cx="44"
          cy="44"
          r={r}
          stroke={`url(#${gradId})`}
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a78bfa" />
            <stop offset="100%" stopColor="#f472b6" />
          </linearGradient>
        </defs>
      </svg>
      <div className="relative text-center">
        <p className="text-2xl font-black tabular-nums text-white">{p}</p>
        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">%</p>
      </div>
    </div>
  );
}

function ProfilePageSkeleton() {
  return (
    <MemberSurface>
      <div className="animate-pulse space-y-8">
        <div className="space-y-3">
          <div className="h-8 w-56 rounded-xl bg-white/10" />
          <div className="h-4 max-w-xl rounded-lg bg-white/5" />
        </div>
        <div className="h-52 rounded-3xl bg-white/[0.06] sm:h-56" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1.45fr_1fr]">
          <div className="space-y-4">
            <div className="h-40 rounded-2xl bg-white/[0.06]" />
            <div className="h-48 rounded-2xl bg-white/[0.06]" />
            <div className="h-64 rounded-2xl bg-white/[0.06]" />
          </div>
          <div className="space-y-4">
            <div className="h-72 rounded-2xl bg-white/[0.06]" />
            <div className="h-44 rounded-2xl bg-white/[0.06]" />
          </div>
        </div>
      </div>
    </MemberSurface>
  );
}

const PROFILE_NAV = [
  { id: "profil-resume", label: "Résumé" },
  { id: "twitch-connection", label: "Twitch" },
  { id: "profil-engagement", label: "Activité" },
  { id: "planning", label: "Planning" },
  { id: "profile-details", label: "Infos & bio" },
  { id: "validation", label: "Validation" },
] as const;

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
  const [openDetail, setOpenDetail] = useState<string | null>("identity");

  const scrollToSection = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const toggleDetail = useCallback((key: string) => {
    setOpenDetail((prev) => (prev === key ? null : key));
  }, []);

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
        if (!overviewRes.ok) {
          setOverview(null);
        } else {
          setOverview(overviewBody);
        }
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
          setTwitchLinkStatus({
            loading: false,
            connected: false,
            login: null,
            displayName: null,
          });
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
        setTwitchLinkStatus({
          loading: false,
          connected: false,
          login: null,
          displayName: null,
        });
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  async function handleDisconnectTwitch() {
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

      setTwitchLinkStatus({
        loading: false,
        connected: false,
        login: null,
        displayName: null,
      });
    } catch {
      alert("Erreur réseau pendant la déconnexion Twitch.");
    } finally {
      setDisconnectingTwitch(false);
    }
  }

  const completionChecklist: Array<{ label: string; status: "ok" | "warning" | "missing" }> = useMemo(() => {
    if (!profileData) return [];
    const member = profileData.member;
    return [
      { label: "Avatar", status: member.avatar ? "ok" : "missing" as const },
      { label: "Bio", status: member.bio ? "ok" : "warning" as const },
      { label: "Lien Twitch", status: member.socials.twitch ? "ok" : "missing" as const },
      {
        label: "Réseaux sociaux",
        status: member.socials.instagram || member.socials.tiktok || member.socials.twitter ? "ok" : "warning" as const,
      },
      { label: "Planning live", status: plannings.length > 0 ? "ok" : "warning" as const },
      { label: "Jeux principaux", status: "warning" as const },
      { label: "Présentation prête", status: member.bio ? "ok" : "warning" as const },
      {
        label: "Profil valide",
        status: member.profileValidationStatus === "valide" ? "ok" : "warning" as const,
      },
    ];
  }, [profileData, plannings.length]);

  if (loading) return <ProfilePageSkeleton />;
  if (error || !profileData) return <EmptyFeatureCard title="Mon profil" description={error || "Impossible de charger le profil."} />;

  const member = profileData.member;
  const safeOverview: MemberOverview = overview || {
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
    profile: {
      completed: false,
      percent: 0,
    },
    upcomingEvents: [],
    formationHistory: [],
    eventPresenceHistory: [],
  };
  const vip = safeOverview.vip;
  const profilePercent = safeOverview.profile?.percent ?? 0;
  const validationLabel =
    member.profileValidationStatus === "valide"
      ? "Profil valide par le staff"
      : member.profileValidationStatus === "en_cours_examen"
        ? "Modifications en attente de validation"
        : "Informations manquantes";
  const validationTone =
    member.profileValidationStatus === "valide"
      ? "success"
      : member.profileValidationStatus === "en_cours_examen"
        ? "warning"
        : "neutral";
  const hasPublicProfileLink =
    !!member.twitchLogin &&
    !member.twitchLogin.startsWith("nouveau_") &&
    !member.twitchLogin.startsWith("nouveau-");
  const publicProfileModalHref = `/membres?member=${encodeURIComponent(member.twitchLogin)}`;
  const needsOnboarding =
    member.role === "Nouveau" ||
    member.twitchLogin.startsWith("nouveau_") ||
    member.twitchLogin.startsWith("nouveau-") ||
    searchParams?.get("onboarding") === "1";
  const twitchLinkedNow = searchParams?.get("twitch_linked") === "1";
  const twitchError = searchParams?.get("twitch_error");
  const twitchStartHref = `/api/auth/twitch/link/start?callbackUrl=${encodeURIComponent(
    TWITCH_LINK_CALLBACK
  )}`;
  const twitchReconnectHref = `/api/auth/twitch/link/start?callbackUrl=${encodeURIComponent(
    TWITCH_LINK_CALLBACK
  )}`;
  const upcomingPlannings = plannings.filter((planning) => {
    const startsAt = new Date(`${planning.date}T${planning.time}:00`).getTime();
    return startsAt >= Date.now();
  });
  const nextPlanning = upcomingPlannings
    .slice()
    .sort(
      (a, b) =>
        new Date(`${a.date}T${a.time}:00`).getTime() -
        new Date(`${b.date}T${b.time}:00`).getTime()
    )[0];

  const overviewStats = safeOverview.stats;
  const upcomingEventsCount = safeOverview.upcomingEvents?.length ?? 0;

  return (
    <MemberSurface>
      <MemberPageHeader
        title="Ton espace profil"
        description="Pour toi et pour la communauté : ton identité TENF, ta liaison Twitch, ta bio visible (ou presque), ton planning et ta progression — tout au même endroit, avec des raccourcis vers l’action."
      />

      <nav
        className="-mx-1 mb-6 flex gap-2 overflow-x-auto pb-1 pt-1 sm:flex-wrap"
        aria-label="Sections du profil"
      >
        {PROFILE_NAV.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => scrollToSection(id)}
            className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs font-semibold text-zinc-300 transition hover:border-violet-400/35 hover:bg-violet-500/10 hover:text-white sm:text-sm"
          >
            {label}
          </button>
        ))}
      </nav>

      <section
        id="profil-resume"
        className="relative scroll-mt-24 overflow-hidden rounded-3xl border p-5 shadow-[0_24px_80px_rgba(0,0,0,0.35)] sm:p-8"
        style={{
          borderColor: "rgba(145, 70, 255, 0.35)",
          background:
            "radial-gradient(ellipse 90% 80% at 10% -30%, rgba(145, 70, 255, 0.28), transparent 52%), radial-gradient(ellipse 70% 50% at 95% 10%, rgba(236, 72, 153, 0.12), transparent 45%), linear-gradient(165deg, rgba(24, 26, 38, 0.95), rgba(10, 11, 18, 0.98))",
        }}
      >
        <div
          className="pointer-events-none absolute -right-16 top-8 h-48 w-48 rounded-full opacity-40 blur-3xl"
          style={{ background: "rgba(139, 92, 246, 0.35)" }}
        />
        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 flex-col gap-6 sm:flex-row sm:items-start">
            <div className="relative shrink-0">
              <div
                className="absolute -inset-1 rounded-[1.35rem] opacity-90 blur-sm"
                style={{
                  background: "linear-gradient(135deg, rgba(167,139,250,0.55), rgba(244,114,182,0.35))",
                }}
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={member.avatar}
                alt=""
                className="relative h-24 w-24 rounded-2xl border-2 border-white/20 object-cover shadow-xl sm:h-28 sm:w-28"
              />
            </div>
            <div className="min-w-0 flex flex-col gap-4 sm:flex-row sm:items-center">
              <CompletionRing percent={profilePercent} />
              <div className="min-w-0">
                <p className="inline-flex items-center gap-2 rounded-full border border-violet-400/25 bg-violet-500/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.14em] text-violet-200">
                  <Sparkles className="h-3 w-3" aria-hidden />
                  Membre TENF
                </p>
                <h2 className="mt-2 text-balance text-2xl font-black tracking-tight sm:text-3xl md:text-4xl" style={{ color: "var(--color-text)" }}>
                  {member.displayName}
                </h2>
                <p className="mt-1 text-sm font-medium text-zinc-400">
                  @{member.twitchLogin}
                  <span className="text-zinc-600"> · </span>
                  <span style={{ color: "var(--color-text-secondary)" }}>{member.role}</span>
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <StatusBadge
                    label={vip?.activeThisMonth ? "VIP TENF actif ce mois-ci" : vip ? "VIP TENF — pas ce mois-ci" : "VIP — indisponible"}
                    tone={vip?.activeThisMonth ? "success" : "neutral"}
                  />
                  <StatusBadge label={validationLabel} tone={validationTone} />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-black/25 px-3 py-1.5 text-xs font-medium text-zinc-300"
                  >
                    <LayoutDashboard className="h-3.5 w-3.5 text-violet-400" aria-hidden />
                    Intégration {member.tenfSummary.integration.integrated ? "faite" : "à planifier"}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-black/25 px-3 py-1.5 text-xs font-medium text-zinc-300">
                    <Radio className="h-3.5 w-3.5 text-sky-400" aria-hidden />
                    {upcomingPlannings.length} live{upcomingPlannings.length > 1 ? "s" : ""} à venir
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-black/25 px-3 py-1.5 text-xs font-medium text-zinc-300">
                    <UserCircle2 className="h-3.5 w-3.5 text-emerald-400" aria-hidden />
                    Profil {profilePercent}% complété
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex w-full flex-col gap-2 sm:max-w-md lg:w-auto lg:min-w-[280px]">
            <Link
              href="/member/profil/completer"
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-3 text-center text-sm font-bold text-white shadow-lg shadow-violet-950/40 transition hover:brightness-110"
            >
              Compléter ou modifier <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link
              href={LIVE_PLANNING_ROUTE}
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/[0.06] px-5 py-3 text-sm font-semibold text-zinc-100 transition hover:border-violet-400/35 hover:bg-violet-500/10"
            >
              <CalendarDays className="h-4 w-4 text-violet-300" aria-hidden />
              Planning live
            </Link>
            {hasPublicProfileLink ? (
              <Link
                href={publicProfileModalHref}
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/[0.06] px-5 py-3 text-sm font-semibold text-zinc-100 transition hover:border-emerald-400/35 hover:bg-emerald-500/10"
              >
                <ExternalLink className="h-4 w-4 text-emerald-300" aria-hidden />
                Ma fiche publique
              </Link>
            ) : (
              <div className="rounded-2xl border border-dashed border-white/15 px-4 py-3 text-center text-xs text-zinc-500">
                Fiche publique : complète ton pseudo Twitch pour apparaître dans l’annuaire.
              </div>
            )}
            <Link
              href="/member/dashboard"
              className="text-center text-xs font-medium text-zinc-500 underline-offset-4 hover:text-zinc-300 hover:underline"
            >
              ← Retour dashboard
            </Link>
          </div>
        </div>

        <div className="relative mt-8 grid grid-cols-2 gap-3 md:grid-cols-3">
          <StatCard
            title="Réunion d'intégration"
            value={member.tenfSummary.integration.integrated ? "Faite" : "À faire"}
            subtitle={member.tenfSummary.integration.date ? formatDateFr(member.tenfSummary.integration.date) : "Date à confirmer"}
            icon={Calendar}
          />
          <StatCard title="Rôle TENF" value={member.role} icon={UserCircle2} />
          <StatCard
            title="VIP TENF"
            value={vip?.statusLabel || "Indisponible"}
            subtitle={vip?.startsAt && vip?.endsAt ? `${vip.startsAt} → ${vip.endsAt}` : "Période non affichée"}
            icon={Crown}
          />
        </div>
      </section>

      <section
        id="profil-engagement"
        className="scroll-mt-24 mt-8 rounded-3xl border border-white/[0.08] p-5 sm:p-6"
        style={{ backgroundColor: "var(--color-card)" }}
      >
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-300/90">En un coup d’œil</p>
            <h3 className="mt-1 text-lg font-bold" style={{ color: "var(--color-text)" }}>
              Ton activité dans la New Family
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-zinc-500">
              Des raccourcis vers les pages où ça bouge : événements, raids, présences, formations. Les chiffres viennent de ton espace membre
              (mis à jour au chargement).
            </p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/member/evenements"
            className="group flex flex-col rounded-2xl border border-white/[0.07] bg-gradient-to-br from-violet-950/40 to-transparent p-4 transition hover:border-violet-400/30 hover:shadow-lg hover:shadow-violet-950/20"
          >
            <CalendarDays className="h-8 w-8 text-violet-400 transition group-hover:scale-105" aria-hidden />
            <p className="mt-3 text-2xl font-black tabular-nums text-white">{upcomingEventsCount}</p>
            <p className="text-sm font-semibold text-zinc-200">Événements à venir</p>
            <p className="mt-1 text-xs text-zinc-500">Agenda TENF</p>
          </Link>
          <Link
            href="/member/activite"
            className="group flex flex-col rounded-2xl border border-white/[0.07] bg-gradient-to-br from-fuchsia-950/35 to-transparent p-4 transition hover:border-fuchsia-400/30 hover:shadow-lg"
          >
            <Zap className="h-8 w-8 text-fuchsia-400 transition group-hover:scale-105" aria-hidden />
            <p className="mt-3 text-2xl font-black tabular-nums text-white">{overviewStats.raidsThisMonth}</p>
            <p className="text-sm font-semibold text-zinc-200">Raids (mois en cours)</p>
            <p className="mt-1 text-xs text-zinc-500">Voir mon activité</p>
          </Link>
          <Link
            href="/member/evenements/presences"
            className="group flex flex-col rounded-2xl border border-white/[0.07] bg-gradient-to-br from-sky-950/35 to-transparent p-4 transition hover:border-sky-400/30 hover:shadow-lg"
          >
            <Gamepad2 className="h-8 w-8 text-sky-400 transition group-hover:scale-105" aria-hidden />
            <p className="mt-3 text-2xl font-black tabular-nums text-white">{overviewStats.eventPresencesThisMonth}</p>
            <p className="text-sm font-semibold text-zinc-200">Présences événements</p>
            <p className="mt-1 text-xs text-zinc-500">Ce mois-ci</p>
          </Link>
          <Link
            href="/member/formations/validees"
            className="group flex flex-col rounded-2xl border border-white/[0.07] bg-gradient-to-br from-emerald-950/35 to-transparent p-4 transition hover:border-emerald-400/30 hover:shadow-lg"
          >
            <ShieldCheck className="h-8 w-8 text-emerald-400 transition group-hover:scale-105" aria-hidden />
            <p className="mt-3 text-2xl font-black tabular-nums text-white">{overviewStats.formationsValidated}</p>
            <p className="text-sm font-semibold text-zinc-200">Formations validées</p>
            <p className="mt-1 text-xs text-zinc-500">Parcours Academy</p>
          </Link>
        </div>
      </section>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-[1.45fr_1fr]">
        <div className="space-y-6">
          <div id="twitch-connection" className="scroll-mt-24">
            <MemberInfoCard title="Connexion Twitch">
              <div className="rounded-2xl border border-[#9146FF]/35 bg-gradient-to-br from-[#9146FF]/12 via-transparent to-transparent p-4 sm:p-5">
                <div className="mb-3 flex items-center gap-2">
                  <Link2 className="h-5 w-5 text-[#bf94ff]" aria-hidden />
                  <p className="text-sm font-semibold text-zinc-100">Lien OAuth TENF ↔ Twitch</p>
                </div>
                <p className="text-sm leading-relaxed text-zinc-400">
                  Ce lien sert au site TENF (planning, profil, outils). Il est distinct du fait d’être « streamer » sur le Discord — mais les
                  deux se parlent mieux quand tout est à jour.
                </p>
              </div>
              {twitchLinkedNow ? (
                <p className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
                  Compte Twitch relié avec succès.
                </p>
              ) : null}
              {twitchError ? (
                <p className="mt-4 rounded-xl border border-red-500/35 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                  Liaison Twitch échouée ({twitchError}). Réessaie ou contacte le staff si ça bloque.
                </p>
              ) : null}
              {twitchLinkStatus.loading ? (
                <p className="mt-4 text-sm animate-pulse text-zinc-500">Vérification du lien Twitch…</p>
              ) : twitchLinkStatus.connected ? (
                <div className="mt-4 space-y-4">
                  <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-[#ad92ff]">Connecté</p>
                    <p className="mt-1 text-lg font-bold text-white">{twitchLinkStatus.displayName || twitchLinkStatus.login || "Twitch"}</p>
                    {twitchLinkStatus.login ? (
                      <p className="text-sm text-zinc-400">@{twitchLinkStatus.login}</p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <a
                      href={twitchReconnectHref}
                      className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-[#9146FF]/45 bg-[#9146FF]/15 px-4 py-2 text-sm font-semibold text-[#e9d5ff] transition hover:bg-[#9146FF]/25"
                    >
                      Changer de compte Twitch
                    </a>
                    <button
                      type="button"
                      onClick={handleDisconnectTwitch}
                      disabled={disconnectingTwitch}
                      className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-white/12 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:bg-white/5 disabled:opacity-50"
                    >
                      {disconnectingTwitch ? "Déconnexion…" : "Déconnecter Twitch"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-4 space-y-4">
                  <p className="text-sm leading-relaxed text-zinc-400">
                    Branche ton compte Twitch pour débloquer les fonctionnalités qui en dépendent (affichage, certaines synchros). En deux clics,
                    sans partager ton mot de passe : tout passe par Twitch.
                  </p>
                  <a
                    href={twitchStartHref}
                    className="inline-flex min-h-[48px] items-center justify-center rounded-2xl bg-[#9146FF] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-[#462881]/40 transition hover:brightness-110"
                  >
                    Connecter Twitch
                  </a>
                </div>
              )}
            </MemberInfoCard>
          </div>

          {needsOnboarding ? (
            <div
              className="rounded-3xl border border-amber-500/25 p-5 shadow-lg sm:p-6"
              style={{
                background:
                  "linear-gradient(135deg, rgba(245,158,11,0.12), transparent 55%), var(--color-card)",
              }}
            >
              <div className="flex flex-wrap items-start gap-3">
                <Sparkles className="h-8 w-8 shrink-0 text-amber-300" aria-hidden />
                <div className="min-w-0">
                  <h3 className="text-lg font-bold text-amber-50">Profil à finaliser</h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                    Tu es au bon endroit : complète ton profil pour que le staff puisse valider ta fiche après ton intégration. Chaque bloc rempli
                    rapproche ton espace membre du « tout vert ».
                  </p>
                  <Link
                    href="/member/profil/completer"
                    className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-zinc-950 transition hover:bg-amber-400"
                  >
                    Compléter mon profil <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                </div>
              </div>
            </div>
          ) : null}

          <div id="planning" className="scroll-mt-24">
            <PlanningPreviewCard plannings={plannings} planningHref={LIVE_PLANNING_ROUTE} />
          </div>

          <div id="profile-details" className="scroll-mt-24">
            <MemberInfoCard title="Infos & bio">
              <p className="mb-5 text-sm leading-relaxed text-zinc-500">
                Trois volets interactifs : ouvre celui qui t’intéresse. Pour modifier les champs, passe par{" "}
                <Link href="/member/profil/completer" className="font-semibold text-violet-400 hover:underline">
                  Compléter mon profil
                </Link>
                .
              </p>
              <div className="space-y-2">
                {(
                  [
                    {
                      key: "identity",
                      title: "Identité créateur",
                      subtitle: "Pseudo, rôle TENF, fuseau — ce qui structure ta présence.",
                      body: (
                        <div className="grid gap-3 text-sm sm:grid-cols-2">
                          <div className="rounded-xl border border-white/[0.06] bg-black/20 p-4">
                            <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">Compte</p>
                            <ul className="mt-3 space-y-2 text-zinc-300">
                              <li>
                                <span className="text-zinc-500">Pseudo Twitch · </span>
                                {member.twitchLogin}
                              </li>
                              <li>
                                <span className="text-zinc-500">Nom affiché · </span>
                                {member.displayName}
                              </li>
                              <li>
                                <span className="text-zinc-500">Rôle TENF · </span>
                                {member.role}
                              </li>
                            </ul>
                          </div>
                          <div className="rounded-xl border border-white/[0.06] bg-black/20 p-4">
                            <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">Serveur</p>
                            <ul className="mt-3 space-y-2 text-zinc-300">
                              <li>
                                <span className="text-zinc-500">Statut · </span>
                                {member.tenfSummary.status}
                              </li>
                              <li>
                                <span className="text-zinc-500">Fuseau · </span>
                                {member.timezone || "Non renseigné"}
                              </li>
                            </ul>
                          </div>
                        </div>
                      ),
                    },
                    {
                      key: "socials",
                      title: "Réseaux & liens",
                      subtitle: "Ce que tu affiches sur ta fiche — complète pour être retrouvable.",
                      body: (
                        <ul className="grid gap-2 text-sm sm:grid-cols-2">
                          {(
                            [
                              ["Twitch", member.socials.twitch],
                              ["Discord", member.socials.discord],
                              ["Instagram", member.socials.instagram],
                              ["TikTok", member.socials.tiktok],
                              ["Twitter / X", member.socials.twitter],
                            ] as const
                          ).map(([label, val]) => (
                            <li
                              key={label}
                              className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-black/15 px-3 py-2.5"
                            >
                              <span className="text-zinc-500">{label}</span>
                              <span className={`truncate font-medium ${val ? "text-white" : "text-zinc-600"}`}>
                                {val || "À renseigner"}
                              </span>
                            </li>
                          ))}
                        </ul>
                      ),
                    },
                    {
                      key: "bio",
                      title: "Bio & présentation",
                      subtitle: "Markdown façon Discord — c’est ce qui raconte qui tu es aux autres membres.",
                      body: (
                        <div className="rounded-xl border border-violet-500/20 bg-violet-950/10 p-4">
                          <DiscordMarkdownPreview content={member.bio || ""} emptyFallback="Pas encore de bio — un bon moment pour te présenter en quelques lignes." />
                        </div>
                      ),
                    },
                  ] as const
                ).map((panel) => {
                  const open = openDetail === panel.key;
                  return (
                    <div key={panel.key} className="overflow-hidden rounded-2xl border border-white/[0.08]" style={{ backgroundColor: "rgba(0,0,0,0.15)" }}>
                      <button
                        type="button"
                        onClick={() => toggleDetail(panel.key)}
                        className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left transition hover:bg-white/[0.04]"
                        aria-expanded={open}
                      >
                        <div>
                          <p className="font-bold text-white">{panel.title}</p>
                          <p className="mt-0.5 text-xs text-zinc-500">{panel.subtitle}</p>
                        </div>
                        <ChevronDown className={`h-5 w-5 shrink-0 text-violet-400 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
                      </button>
                      {open ? <div className="border-t border-white/[0.06] px-4 py-4">{panel.body}</div> : null}
                    </div>
                  );
                })}
              </div>
            </MemberInfoCard>
          </div>

          <div id="validation" className="scroll-mt-24">
            <MemberInfoCard title="Validation TENF">
              <div className="mb-4">
                <StatusBadge label={validationLabel} tone={validationTone} />
              </div>
              <p className="text-sm leading-relaxed text-zinc-400">
                État technique de ta fiche : <strong className="text-zinc-200">{member.profileValidationStatus}</strong>. Quand tu envoies des
                changements depuis « Compléter mon profil », le staff peut les relire avant publication. Patience : ce n’est pas automatique,
                et ce n’est pas une critique de ta personne.
              </p>
              <div className="mt-4 rounded-xl border border-white/[0.06] bg-black/20 px-4 py-3 text-xs text-zinc-500">
                Historique détaillé des validations : non affiché sur cette page pour l’instant — demande au staff si tu as besoin d’une date
                précise.
              </div>
              <div className="mt-4 flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-100/95">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" aria-hidden />
                <span>Tes modifications passent déjà par le flux de validation staff — pas besoin de DM séparé sauf urgence.</span>
              </div>
            </MemberInfoCard>
          </div>
        </div>

        <div className="space-y-6">
          <ProfileCompletionCard items={completionChecklist} percent={profilePercent} ctaHref="/member/profil/completer" />

          <MemberInfoCard title="Repères rapides">
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => scrollToSection("planning")}
                className="flex w-full items-center justify-between gap-3 rounded-xl border border-white/[0.07] bg-black/20 px-4 py-3 text-left text-sm transition hover:border-violet-400/25 hover:bg-violet-500/5"
              >
                <span className="text-zinc-500">Prochain live</span>
                <span className="font-semibold text-white">
                  {nextPlanning
                    ? `${new Date(nextPlanning.date).toLocaleDateString("fr-FR")} · ${nextPlanning.time}`
                    : "—"}
                </span>
              </button>
              <div className="rounded-xl border border-white/[0.07] bg-black/15 px-4 py-3 text-sm">
                <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">Intégration</p>
                <p className="mt-1 font-medium text-zinc-200">{formatDateFr(member.tenfSummary.integration.date)}</p>
              </div>
              <div className="rounded-xl border border-white/[0.07] bg-black/15 px-4 py-3 text-sm">
                <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">Twitch (OAuth)</p>
                <p className="mt-1 font-medium text-zinc-200">{twitchLinkStatus.connected ? "Relié" : "Non relié"}</p>
              </div>
            </div>
          </MemberInfoCard>

          <MemberInfoCard title="Aperçu fiche publique">
            <p className="text-sm leading-relaxed text-zinc-500">
              Ce bloc simule ce que les visiteurs peuvent voir quand ta fiche est publique — utile pour vérifier avatar, nom et bio avant de
              partager ton lien.
            </p>
            <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-transparent shadow-inner">
              <div className="border-b border-white/10 bg-black/30 px-4 py-3">
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={member.avatar} alt="" className="h-12 w-12 rounded-xl border border-white/10 object-cover" />
                  <div className="min-w-0">
                    <p className="truncate font-bold text-white">{member.displayName}</p>
                    <p className="truncate text-xs text-zinc-500">
                      {hasPublicProfileLink ? `@${member.twitchLogin}` : "Pseudo Twitch à finaliser"}
                    </p>
                  </div>
                </div>
              </div>
              <div className="max-h-48 overflow-y-auto p-4 text-sm">
                <DiscordMarkdownPreview content={member.bio || ""} emptyFallback="Ajoute une bio courte dans « Compléter mon profil »." />
              </div>
              <div className="border-t border-white/10 px-4 py-2 text-[11px] text-zinc-500">
                Twitch : {member.socials.twitch ? "renseigné" : "à compléter"} · Réseaux :{" "}
                {[member.socials.instagram, member.socials.tiktok, member.socials.twitter].filter(Boolean).length || "aucun"} lien(s)
              </div>
            </div>
            {hasPublicProfileLink ? (
              <Link
                href={publicProfileModalHref}
                className="mt-4 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-emerald-500/35 bg-emerald-500/10 py-2.5 text-sm font-bold text-emerald-100 transition hover:bg-emerald-500/18"
              >
                Ouvrir ma vraie fiche <ExternalLink className="h-4 w-4" aria-hidden />
              </Link>
            ) : (
              <p className="mt-4 text-center text-xs text-zinc-500">L’annuaire public sera dispo quand ton pseudo Twitch sera validé.</p>
            )}
          </MemberInfoCard>

          <QuickActionsCard
            actions={[
              { label: "Compléter mon profil", href: "/member/profil/completer" },
              { label: "Modifier mon planning", href: LIVE_PLANNING_ROUTE },
              hasPublicProfileLink
                ? { label: "Voir ma fiche publique", href: publicProfileModalHref }
                : { label: "Voir ma fiche publique", soon: true },
              { label: "Déclarer un raid", href: "/member/raids/declarer" },
              { label: "Voir mes formations", href: "/member/formations/validees" },
              { label: "Voir mon activité", href: "/member/activite" },
            ]}
          />
        </div>
      </div>
    </MemberSurface>
  );
}

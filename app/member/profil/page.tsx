"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Calendar, Crown, ShieldCheck, UserCircle2 } from "lucide-react";
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
  if (!value) return "Non renseignee";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Non renseignee";
  return date.toLocaleDateString("fr-FR");
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
        alert("Impossible de deconnecter le compte Twitch.");
        return;
      }

      setTwitchLinkStatus({
        loading: false,
        connected: false,
        login: null,
        displayName: null,
      });
    } catch {
      alert("Erreur reseau pendant la deconnexion Twitch.");
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
        label: "Reseaux sociaux",
        status: member.socials.instagram || member.socials.tiktok || member.socials.twitter ? "ok" : "warning" as const,
      },
      { label: "Planning live", status: plannings.length > 0 ? "ok" : "warning" as const },
      { label: "Jeux principaux", status: "warning" as const },
      { label: "Presentation prete", status: member.bio ? "ok" : "warning" as const },
      {
        label: "Profil valide",
        status: member.profileValidationStatus === "valide" ? "ok" : "warning" as const,
      },
    ];
  }, [profileData, plannings.length]);

  if (loading) return <p style={{ color: "var(--color-text-secondary)" }}>Chargement du profil...</p>;
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
    searchParams.get("onboarding") === "1";
  const twitchLinkedNow = searchParams.get("twitch_linked") === "1";
  const twitchError = searchParams.get("twitch_error");
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

  return (
    <MemberSurface>
      <MemberPageHeader
        title="Mon profil"
        description="Un espace clair pour gerer ton identite, ton statut TENF, ta connexion Twitch et ton planning."
      />

      <section
        className="rounded-2xl border p-5 md:p-6"
        style={{
          borderColor: "rgba(145, 70, 255, 0.30)",
          background:
            "radial-gradient(circle at 10% 0%, rgba(145, 70, 255, 0.16), transparent 42%), radial-gradient(circle at 92% 0%, rgba(59, 130, 246, 0.12), transparent 35%), linear-gradient(180deg, rgba(17, 24, 39, 0.40), rgba(17, 24, 39, 0.08))",
        }}
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <img
              src={member.avatar}
              alt={member.displayName}
              className="h-20 w-20 rounded-2xl border object-cover shadow-lg"
              style={{ borderColor: "rgba(145, 70, 255, 0.45)" }}
            />
            <div>
              <h2 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>
                {member.displayName}
              </h2>
              <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                @{member.twitchLogin} - {member.role}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <StatusBadge
                  label={vip?.activeThisMonth ? "VIP TENF actif ce mois" : vip ? "VIP TENF non actif ce mois" : "Statut VIP indisponible"}
                  tone={vip?.activeThisMonth ? "success" : "neutral"}
                />
                <StatusBadge label={validationLabel} tone={validationTone} />
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full border px-2 py-1" style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}>
                  Integr. {member.tenfSummary.integration.integrated ? "faite" : "a planifier"}
                </span>
                <span className="rounded-full border px-2 py-1" style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}>
                  {upcomingPlannings.length} live{upcomingPlannings.length > 1 ? "s" : ""} a venir
                </span>
                <span className="rounded-full border px-2 py-1" style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}>
                  Completion {profilePercent}%
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/member/profil/completer"
              className="rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: "rgba(145, 70, 255, 0.55)", color: "var(--color-text)" }}
            >
              Completer mon profil
            </Link>
            <Link
              href={LIVE_PLANNING_ROUTE}
              className="rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
            >
              Gérer mon planning
            </Link>
            {hasPublicProfileLink ? (
              <Link
                href={publicProfileModalHref}
                className="rounded-lg border px-3 py-2 text-sm"
                style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
              >
                Voir ma fiche publique
              </Link>
            ) : (
              <button
                type="button"
                disabled
                className="rounded-lg border px-3 py-2 text-sm opacity-65"
                style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
              >
                Fiche publique (A venir)
              </button>
            )}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3">
          <StatCard
            title="Reunion integration"
            value={member.tenfSummary.integration.integrated ? "Faite" : "Non faite"}
            subtitle={member.tenfSummary.integration.date || "Date non disponible"}
            icon={Calendar}
          />
          <StatCard title="Role TENF" value={member.role} icon={UserCircle2} />
          <StatCard
            title="VIP TENF"
            value={vip?.statusLabel || "Indisponible"}
            subtitle={vip?.startsAt && vip?.endsAt ? `${vip.startsAt} - ${vip.endsAt}` : "Validite precise indisponible"}
            icon={Crown}
          />
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-[1.45fr_1fr]">
        <div className="space-y-6">
          <div id="twitch-connection">
            <MemberInfoCard title="Connexion Twitch">
              {twitchLinkedNow ? (
                <p className="mb-3 text-sm text-green-500">Compte Twitch lie avec succes.</p>
              ) : null}
              {twitchError ? (
                <p className="mb-3 text-sm text-red-500">Liaison Twitch echouee ({twitchError}).</p>
              ) : null}
              {twitchLinkStatus.loading ? (
                <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                  Verification du lien Twitch...
                </p>
              ) : twitchLinkStatus.connected ? (
                <div className="space-y-3">
                  <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                    <span style={{ color: "var(--color-text)" }}>Compte Twitch connecte</span>
                    {" : "}
                    <span style={{ color: "var(--color-text)" }}>
                      {twitchLinkStatus.displayName || twitchLinkStatus.login || "Twitch"}
                    </span>
                    {twitchLinkStatus.login ? ` (@${twitchLinkStatus.login})` : ""}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <a
                      href={twitchReconnectHref}
                      className="inline-flex rounded-lg border px-3 py-2 text-sm"
                      style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
                    >
                      Reconnecter mon compte Twitch
                    </a>
                    <button
                      type="button"
                      onClick={handleDisconnectTwitch}
                      disabled={disconnectingTwitch}
                      className="rounded-lg border px-3 py-2 text-sm disabled:opacity-60"
                      style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
                    >
                      {disconnectingTwitch ? "Deconnexion..." : "Deconnecter mon compte Twitch"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                    Connecte ton compte Twitch pour activer les fonctionnalites liees au suivi.
                  </p>
                  <a
                    href={twitchStartHref}
                    className="inline-flex rounded-lg border px-3 py-2 text-sm"
                    style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
                  >
                    Connecter mon compte Twitch
                  </a>
                </div>
              )}
            </MemberInfoCard>
          </div>

          {needsOnboarding ? (
            <MemberInfoCard title="Creation / activation du profil">
              <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                Ton profil reste inactif tant qu il n est pas valide par le staff apres la reunion d integration.
              </p>
              <div className="mt-4">
                <Link
                  href="/member/profil/completer"
                  className="inline-flex rounded-lg border px-3 py-2 text-sm"
                  style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
                >
                  Completer mon profil
                </Link>
              </div>
            </MemberInfoCard>
          ) : null}

          <div id="planning">
            <PlanningPreviewCard plannings={plannings} planningHref={LIVE_PLANNING_ROUTE} />
          </div>

          <MemberInfoCard title="Informations du profil">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-2">
              <div className="space-y-2 text-sm">
                <p style={{ color: "var(--color-text)" }}>
                  <strong>Identite createur</strong>
                </p>
                <p style={{ color: "var(--color-text-secondary)" }}>Pseudo Twitch : {member.twitchLogin}</p>
                <p style={{ color: "var(--color-text-secondary)" }}>Nom affiche : {member.displayName}</p>
                <p style={{ color: "var(--color-text-secondary)" }}>Role TENF : {member.role}</p>
                <p style={{ color: "var(--color-text-secondary)" }}>Statut serveur : {member.tenfSummary.status}</p>
                <p style={{ color: "var(--color-text-secondary)" }}>Fuseau horaire : {member.timezone || "Non renseigne"}</p>
              </div>
              <div className="space-y-2 text-sm">
                <p style={{ color: "var(--color-text)" }}>
                  <strong>Liens</strong>
                </p>
                <p style={{ color: "var(--color-text-secondary)" }}>Twitch : {member.socials.twitch || "Non renseigne"}</p>
                <p style={{ color: "var(--color-text-secondary)" }}>Discord : {member.socials.discord || "Non renseigne"}</p>
                <p style={{ color: "var(--color-text-secondary)" }}>Instagram : {member.socials.instagram || "Non renseigne"}</p>
                <p style={{ color: "var(--color-text-secondary)" }}>TikTok : {member.socials.tiktok || "Non renseigne"}</p>
                <p style={{ color: "var(--color-text-secondary)" }}>Twitter : {member.socials.twitter || "Non renseigne"}</p>
              </div>
            </div>
            <div className="mt-4 rounded-lg border p-3" style={{ borderColor: "var(--color-border)" }}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--color-text-secondary)" }}>
                Description (rendu markdown Discord)
              </p>
              <DiscordMarkdownPreview content={member.bio || ""} emptyFallback="Aucune description fournie." />
            </div>
          </MemberInfoCard>

          <div id="validation">
            <MemberInfoCard title="Validation TENF">
              <div className="mb-3">
                <StatusBadge label={validationLabel} tone={validationTone} />
              </div>
              <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                Etat actuel de la fiche : {member.profileValidationStatus}. Derniere date de validation detaillee non disponible.
              </p>
              <div className="mt-2 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                Derniere mise a jour envoyee : indisponible - Derniere validation : indisponible
              </div>
              <div className="mt-3 inline-flex items-center gap-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                <ShieldCheck size={16} />
                <span>Soumission des modifications deja connectee au flux de validation staff.</span>
              </div>
            </MemberInfoCard>
          </div>
        </div>

        <div className="space-y-6">
          <ProfileCompletionCard items={completionChecklist} percent={profilePercent} ctaHref="/member/profil/completer" />

          <MemberInfoCard title="Reperes rapides">
            <div className="space-y-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
              <p>
                <span style={{ color: "var(--color-text)", fontWeight: 600 }}>Prochain live :</span>{" "}
                {nextPlanning
                  ? `${new Date(nextPlanning.date).toLocaleDateString("fr-FR")} a ${nextPlanning.time} (${nextPlanning.liveType})`
                  : "Aucun live planifie"}
              </p>
              <p>
                <span style={{ color: "var(--color-text)", fontWeight: 600 }}>Date integration :</span>{" "}
                {formatDateFr(member.tenfSummary.integration.date)}
              </p>
              <p>
                <span style={{ color: "var(--color-text)", fontWeight: 600 }}>Twitch connecte :</span>{" "}
                {twitchLinkStatus.connected ? "Oui" : "Non"}
              </p>
            </div>
          </MemberInfoCard>

          <MemberInfoCard title="Ma fiche publique">
            <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
              Apercu de ce que les visiteurs voient.
            </p>
            <div className="mt-3 rounded-lg border p-3 text-sm" style={{ borderColor: "var(--color-border)" }}>
              <div className="mb-2 flex items-center gap-3">
                <img
                  src={member.avatar}
                  alt={member.displayName}
                  className="h-10 w-10 rounded-full border object-cover"
                  style={{ borderColor: "var(--color-border)" }}
                />
                <div>
                  <p style={{ color: "var(--color-text)" }}>{member.displayName}</p>
                  <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                    Visibilite: en attente / incomplet
                  </p>
                </div>
              </div>
              <DiscordMarkdownPreview content={member.bio || ""} emptyFallback="Bio non renseignee" />
              <p className="mt-2 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                Liens publics: Twitch {member.socials.twitch ? "OK" : "non renseigne"} - Reseaux: en cours.
              </p>
            </div>
            {hasPublicProfileLink ? (
              <Link
                href={publicProfileModalHref}
                className="mt-3 inline-flex rounded-lg border px-3 py-2 text-sm"
                style={{ borderColor: "var(--color-border)" }}
              >
                Voir ma fiche publique
              </Link>
            ) : (
              <p className="mt-3 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                Fiche publique detaillee : fonctionnalite a venir.
              </p>
            )}
          </MemberInfoCard>

          <QuickActionsCard
            actions={[
              { label: "Completer mon profil", href: "/member/profil/completer" },
              { label: "Modifier mon planning", href: LIVE_PLANNING_ROUTE },
              hasPublicProfileLink
                ? { label: "Voir ma fiche publique", href: publicProfileModalHref }
                : { label: "Voir ma fiche publique", soon: true },
              { label: "Declarer un raid", href: "/member/raids/declarer" },
              { label: "Voir mes formations", href: "/member/formations/validees" },
              { label: "Voir mon activite", href: "/member/activite" },
            ]}
          />
        </div>
      </div>
    </MemberSurface>
  );
}

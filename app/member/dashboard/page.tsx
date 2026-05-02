"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ArrowUpRight,
  Calendar,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Compass,
  Crown,
  Flag,
  LayoutGrid,
  ListTodo,
  RefreshCw,
  Rocket,
  Sparkles,
  Target,
  UserCircle2,
  Zap,
} from "lucide-react";
import MemberSurface from "@/components/member/ui/MemberSurface";
import MemberBreadcrumbs from "@/components/member/ui/MemberBreadcrumbs";
import { useMemberOverview } from "@/components/member/hooks/useMemberOverview";
import { useMemberMonthlyGoals } from "@/components/member/hooks/useMemberMonthlyGoals";

const VIP_GOLD = "#d4af37";

const EMPTY_STATS = {
  raidsThisMonth: 0,
  raidsTotal: 0,
  eventPresencesThisMonth: 0,
  participationThisMonth: 0,
  formationsValidated: 0,
  formationsValidatedThisMonth: 0,
};

const ROLE_ACCENT_BY_KEY: Array<{ key: string; accent: string }> = [
  { key: "communaute", accent: "#06b6d4" },
  { key: "developpement", accent: "#b87333" },
  { key: "affilie", accent: "#9aaedb" },
  { key: "junior", accent: "#ff3da5" },
  { key: "nouveau", accent: "#06b6d4" },
];

const ADMIN_ACCENT_BY_DISCORD_ID: Record<string, string> = {
  "1021398088474169414": "#ef4444",
  "333001130705420299": "#d8b4fe",
  "535244297214361603": "#4f46e5",
};

function normalizeText(value: string | undefined | null): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace("#", "");
  const normalized =
    clean.length === 3
      ? clean
          .split("")
          .map((char) => `${char}${char}`)
          .join("")
      : clean;
  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function resolveAccent(role: string | undefined, vipActive: boolean, discordId?: string | null): string {
  if (discordId && ADMIN_ACCENT_BY_DISCORD_ID[discordId]) {
    return ADMIN_ACCENT_BY_DISCORD_ID[discordId];
  }
  if (vipActive) return VIP_GOLD;
  const normalizedRole = normalizeText(role);
  return ROLE_ACCENT_BY_KEY.find((entry) => normalizedRole.includes(entry.key))?.accent ?? "#06b6d4";
}

function formatDate(value: string | null) {
  if (!value) return "Non planifiée";
  return new Date(value).toLocaleDateString("fr-FR");
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" });
}

function formatMonthShortDash(monthKey: string): string {
  const [, m] = monthKey.split("-");
  const i = Number(m) - 1;
  const short = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
  const [y] = monthKey.split("-");
  return `${short[i] || "?"} ${y}`;
}

function formatMonthDeadline(monthKey: string): string {
  const [yearStr, monthStr] = monthKey.split("-");
  const year = Number(yearStr);
  const monthIndex = Number(monthStr) - 1;
  if (!Number.isFinite(year) || !Number.isFinite(monthIndex)) {
    return "Fin du mois";
  }
  const end = new Date(year, monthIndex + 1, 0);
  return end.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

function profileStatusLabel(status?: string): string {
  if (status === "valide") return "Profil validé";
  if (status === "en_cours_examen") return "Profil en cours";
  return "Profil à compléter";
}

function roleSegment(role: string | undefined, vipActive: boolean): "newbie" | "growth" | "development" | "vip" {
  if (vipActive) return "vip";
  const value = normalizeText(role);
  if (value.includes("junior") || value.includes("nouveau")) return "newbie";
  if (value.includes("developpement")) return "development";
  return "growth";
}

function getProgressPercent(current: number, target: number): number {
  if (target <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((current / target) * 100)));
}

function getEncouragementByProgress(progress: number, segment: "newbie" | "growth" | "development" | "vip"): string {
  if (progress >= 100) {
    if (segment === "vip") return "Objectifs du mois cochés — merci pour l’élan que tu donnes au collectif.";
    if (segment === "newbie") return "Beau démarrage : tu as rempli les repères du mois.";
    if (segment === "development") return "Progression solide ce mois-ci.";
    return "Super régularité — continue à ton rythme.";
  }
  if (progress >= 80) return "Tu es dans la dernière ligne droite, sans obligation de tout faire d’un coup.";
  if (progress >= 50) return "Bon milieu de mois : une action quand tu peux suffit souvent.";
  return "Le mois est encore ouvert — ce tableau sert à t’orienter, pas à te noter.";
}

function getCardFeedback(current: number, target: number, remaining: number): string {
  const progress = getProgressPercent(current, target);
  if (remaining <= 0) return "Objectif atteint sur cette ligne — bravo si tu le visais.";
  if (remaining === 1) return "Plus qu’un petit pas pour ce critère.";
  if (progress >= 75) return "Tu approches du palier, tranquillement.";
  if (progress >= 40) return "La dynamique est là.";
  return "Bon moment pour avancer d’un cran cette semaine.";
}

function getImpactTone(impact: number): { label: string; bg: string; border: string; text: string } {
  if (impact >= 130) {
    return {
      label: "Fort impact",
      bg: "rgba(239, 68, 68, 0.16)",
      border: "rgba(239, 68, 68, 0.4)",
      text: "#fca5a5",
    };
  }
  if (impact >= 100) {
    return {
      label: "Impact élevé",
      bg: "rgba(245, 158, 11, 0.16)",
      border: "rgba(245, 158, 11, 0.4)",
      text: "#fcd34d",
    };
  }
  return {
    label: "Utile",
    bg: "rgba(14, 165, 233, 0.16)",
    border: "rgba(14, 165, 233, 0.4)",
    text: "#7dd3fc",
  };
}

type SuggestedAction = {
  impact: number;
  href: string;
  label: string;
  detail: string;
};

function isSuggestedAction(value: SuggestedAction | null): value is SuggestedAction {
  return value !== null;
}

type FollowState = "followed" | "not_followed" | "unknown";
type FollowStatusesResponse = {
  authenticated?: boolean;
  linked?: boolean;
  reason?: string;
  statuses?: Record<string, { state?: FollowState }>;
};

type DashTab = "overview" | "focus" | "pulse";

export default function MemberDashboardPage() {
  const router = useRouter();
  const ringId = useId();
  const { data, loading, error } = useMemberOverview();
  const { goals: memberGoals } = useMemberMonthlyGoals(data?.monthKey || "");
  const [activeTab, setActiveTab] = useState<DashTab>("overview");
  const [expandedTimelineId, setExpandedTimelineId] = useState<string | null>(null);
  const [expandedPriorityIdx, setExpandedPriorityIdx] = useState<number | null>(0);
  const [raidsForMonth, setRaidsForMonth] = useState(0);
  const [followStats, setFollowStats] = useState<{
    loading: boolean;
    authenticated: boolean;
    linked: boolean;
    total: number;
    followed: number;
    score: number;
  }>({
    loading: true,
    authenticated: false,
    linked: false,
    total: 0,
    followed: 0,
    score: 0,
  });

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const response = await fetch("/api/members/follow-status", { cache: "no-store" });
        const body = (await response.json()) as FollowStatusesResponse;
        if (!active) return;

        const statuses = body?.statuses || {};
        const values = Object.values(statuses).map((entry) => entry?.state || "unknown");
        const total = values.length;
        const followed = values.filter((state) => state === "followed").length;
        const score = total > 0 ? Math.round((followed / total) * 100) : 0;

        setFollowStats({
          loading: false,
          authenticated: body?.authenticated === true,
          linked: body?.linked === true,
          total,
          followed,
          score,
        });
      } catch {
        if (!active) return;
        setFollowStats((prev) => ({ ...prev, loading: false }));
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const monthKey = data?.monthKey;
    const twitch = data?.member?.twitchLogin;
    if (!monthKey || !twitch) return;
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch(`/api/discord/raids/data-v2?month=${monthKey}`, { cache: "no-store" });
        const body = await response.json();
        const mine = (body.raidsFaits || []).filter(
          (raid: { raiderTwitchLogin?: string }) =>
            String(raid.raiderTwitchLogin || "").toLowerCase() === twitch.toLowerCase()
        );
        const total = mine.reduce((sum: number, raid: { count?: number }) => sum + (raid.count || 1), 0);
        if (!cancelled) setRaidsForMonth(total);
      } catch {
        if (!cancelled) setRaidsForMonth(0);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [data?.monthKey, data?.member?.twitchLogin]);

  useEffect(() => {
    if (loading || !data?.member) return;
    const onboardingStatus = String(data.member.onboardingStatus || "").toLowerCase();
    const login = String(data.member.twitchLogin || "").toLowerCase();
    const role = String(data.member.role || "").toLowerCase();
    const profileValidationStatus = String(data.member.profileValidationStatus || "").toLowerCase();
    const isPlaceholder = login.startsWith("nouveau_") || login.startsWith("nouveau-");
    const isNewUnvalidated = role.includes("nouveau") && profileValidationStatus === "non_soumis";
    if (onboardingStatus === "a_faire" || isPlaceholder || isNewUnvalidated) {
      router.replace("/member/profil/completer?onboarding=1");
    }
  }, [data, loading, router]);

  if (loading) {
    return (
      <MemberSurface>
        <DashboardSkeleton />
      </MemberSurface>
    );
  }

  if (error || !data) {
    return (
      <MemberSurface>
        <MemberBreadcrumbs />
        <section className="rounded-2xl border border-red-500/35 bg-red-950/30 p-6 text-center text-sm text-red-100">
          <p className="font-semibold">Impossible de charger ton tableau de bord</p>
          <p className="mt-2 opacity-90">{error || "Données membre indisponibles."}</p>
          <button
            type="button"
            className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-red-950"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="h-4 w-4" aria-hidden />
            Réessayer
          </button>
        </section>
      </MemberSurface>
    );
  }

  const stats = data.stats ?? EMPTY_STATS;
  const profile = data.profile ?? { completed: false, percent: 0 };
  const raidsLive = raidsForMonth > 0 ? raidsForMonth : stats.raidsThisMonth ?? 0;

  const integrationLabel = data.member.integrationDate ? `Effectuée le ${formatDate(data.member.integrationDate)}` : "Non effectuée";
  const displayName = data.member.displayName || data.member.twitchLogin;
  const firstName = displayName.split(" ")[0] || "Membre";
  const vipActive = Boolean(data.vip?.activeThisMonth);
  const onboardingStatus = String(data.member.onboardingStatus || "").toLowerCase();
  const isNewProfile =
    String(data.member.role || "").toLowerCase().includes("nouveau") || onboardingStatus === "a_faire" || onboardingStatus === "en_cours";
  const accent = resolveAccent(data.member.role, vipActive, data.member.discordId);
  const sectionLabel = vipActive ? "Membre VIP ce mois" : "Espace membre TENF";
  const segment = roleSegment(data.member.role, vipActive);
  const monthDeadline = formatMonthDeadline(data.monthKey);
  const profileStatus = profileStatusLabel(data.member.profileValidationStatus);
  const raidsTarget = memberGoals.raids;
  const presencesTarget = memberGoals.events;
  const engagementTarget = 100;
  const engagementCurrent = followStats.score;
  const profileRemaining = Math.max(0, 100 - profile.percent);
  const raidsRemaining = Math.max(0, raidsTarget - raidsLive);
  const presencesRemaining = Math.max(0, presencesTarget - stats.eventPresencesThisMonth);
  const engagementRemaining = Math.max(0, engagementTarget - engagementCurrent);
  const formationsThisMonth =
    stats.formationsValidatedThisMonth ??
    data.formationHistory.filter((item) => (item.date ?? "").slice(0, 7) === data.monthKey).length;

  const remainingCards = [
    {
      label: "Raids",
      current: raidsLive,
      target: raidsTarget,
      remaining: raidsRemaining,
      href: "/member/raids/declarer",
      icon: Rocket,
      hint: "Objectif mensuel",
    },
    {
      label: "Présences",
      current: stats.eventPresencesThisMonth,
      target: presencesTarget,
      remaining: presencesRemaining,
      href: "/member/evenements",
      icon: Calendar,
      hint: "Événements TENF",
    },
    {
      label: "Profil",
      current: profile.percent,
      target: 100,
      remaining: profileRemaining,
      href: "/member/profil/completer",
      icon: UserCircle2,
      hint: "Complétion",
    },
    {
      label: "Follows réseau",
      current: engagementCurrent,
      target: engagementTarget,
      remaining: engagementRemaining,
      href: "/member/engagement/score",
      icon: Flag,
      hint: "Score indicatif",
    },
  ];

  const recommendedEvent =
    data.upcomingEvents.find((event) => String(event.category || "").toLowerCase().includes("formation")) || data.upcomingEvents[0];

  const suggestedActions = [
    raidsRemaining > 0
      ? {
          impact: 140,
          href: "/member/raids/historique",
          label: "Planifier un raid cette semaine",
          detail: `${raidsRemaining} raid(s) avant le ${monthDeadline} selon tes objectifs — historique pour voir où tu en es.`,
        }
      : null,
    vipActive
      ? {
          impact: 130,
          href: "/vip",
          label: "Espace VIP du mois",
          detail: "Statut actif : retrouve les infos et avantages côté page VIP.",
        }
      : null,
    !profile.completed
      ? {
          impact: 100,
          href: "/member/profil/completer",
          label: "Compléter ton profil",
          detail: `Il reste environ ${profileRemaining}% — ça aide l’équipe et le réseau à te connaître.`,
        }
      : null,
    presencesRemaining > 0
      ? {
          impact: 90,
          href: "/member/evenements",
          label: "Réserver une présence",
          detail: `${presencesRemaining} présence(s) possible(s) avant la fin du mois sur ton réglage actuel.`,
        }
      : null,
    segment === "newbie"
      ? {
          impact: 88,
          href: "/member/profil/completer",
          label: "Finaliser l’onboarding",
          detail: "Quelques infos de base pour bien démarrer avec TENF.",
        }
      : null,
    segment === "development"
      ? {
          impact: 87,
          href: "/member/formations",
          label: "Pousser une formation",
          detail: "Un module cette semaine peut débloquer de la clarté sur la suite.",
        }
      : null,
    recommendedEvent
      ? {
          impact: 85,
          href: "/member/evenements",
          label: "S’inscrire à un événement",
          detail: `${recommendedEvent.title} — ${formatDateTime(recommendedEvent.date)}.`,
        }
      : null,
  ] satisfies Array<SuggestedAction | null>;

  const prioritizedActions = suggestedActions.filter(isSuggestedAction).sort((a, b) => b.impact - a.impact).slice(0, 5);

  const mainAction =
    prioritizedActions[0] ||
    ({
      impact: 0,
      href: "/member/evenements",
      label: "Voir le planning",
      detail: "Explore les prochains créneaux communautaires.",
    } as const);

  const quickCtas = [mainAction, ...prioritizedActions.slice(1, 3)];
  const isRaidAdviceMainAction = mainAction.label.includes("raid");

  const recentTimeline = [
    ...data.formationHistory.map((item) => ({
      id: `formation-${item.id}-${item.date}`,
      date: item.date,
      title: item.title,
      type: "Formation validée",
      color: "rgba(34, 197, 94, 0.28)",
    })),
    ...data.eventPresenceHistory.map((item) => ({
      id: `presence-${item.id}-${item.date}`,
      date: item.date,
      title: item.title,
      type: `Présence · ${item.category}`,
      color: "rgba(59, 130, 246, 0.28)",
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 8);

  const raidsProgress = getProgressPercent(raidsLive, raidsTarget);
  const presencesProgress = getProgressPercent(stats.eventPresencesThisMonth, presencesTarget);
  const profileProgress = Math.max(0, Math.min(100, profile.percent));
  const globalProgress = Math.round((raidsProgress + presencesProgress + profileProgress) / 3);
  const encouragement = getEncouragementByProgress(globalProgress, segment);
  const now = Date.now();
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const validatedThisWeek = recentTimeline.filter((entry) => {
    const ts = new Date(entry.date).getTime();
    return Number.isFinite(ts) && now - ts <= weekMs;
  }).length;
  const weekEncouragement =
    validatedThisWeek > 0
      ? `${validatedThisWeek} passage(s) enregistré(s) sur les 7 derniers jours.`
      : "Rien de validé cette semaine pour l’instant — choisis une action légère pour repartir.";

  const upcomingPreview = data.upcomingEvents.slice(0, 4);

  return (
    <MemberSurface>
      <section
        className="relative overflow-hidden rounded-3xl border p-5 md:p-8"
        style={{
          borderColor: hexToRgba(accent, 0.28),
          background: `linear-gradient(145deg, ${hexToRgba(accent, 0.14)} 0%, rgba(18,18,22,0.97) 42%, rgba(12,12,16,0.99) 100%)`,
          boxShadow: `0 24px 60px rgba(0,0,0,0.35), 0 0 80px ${hexToRgba(accent, 0.08)}`,
        }}
      >
        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full blur-3xl" style={{ background: hexToRgba(accent, 0.12) }} aria-hidden />
        <MemberBreadcrumbs />
        <div className="mt-4 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="min-w-0 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wide"
                style={{
                  borderColor: hexToRgba(accent, 0.45),
                  backgroundColor: hexToRgba(accent, 0.12),
                  color: hexToRgba(accent, 0.98),
                }}
              >
                <Compass className="h-3.5 w-3.5" aria-hidden />
                {formatMonthShortDash(data.monthKey)}
              </span>
              <span className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: hexToRgba(accent, 0.88) }}>
                {sectionLabel}
              </span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl" style={{ color: "var(--color-text)" }}>
              Salut {firstName}, bienvenue sur ton tableau de bord
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed md:text-base" style={{ color: "rgba(236, 236, 239, 0.88)" }}>
              Vue synthèse du mois : objectifs, idées d’actions et raccourcis. Rien n’est une obligation immédiate — utilise ce qui t’aide vraiment.
            </p>
            <p className="text-sm" style={{ color: "rgba(236,236,239,0.78)" }}>
              {encouragement} <span className="opacity-90">{weekEncouragement}</span>
            </p>
            <div className="flex flex-wrap gap-2">
              <span
                className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold"
                style={{
                  borderColor: hexToRgba(accent, 0.4),
                  backgroundColor: hexToRgba(accent, 0.1),
                  color: hexToRgba(accent, 0.95),
                }}
              >
                <Crown size={13} aria-hidden />
                {data.vip?.statusLabel || "Membre"}
              </span>
              <span
                className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold"
                style={{ borderColor: "rgba(255,255,255,0.2)", backgroundColor: "rgba(255,255,255,0.06)", color: "rgba(245,245,247,0.92)" }}
              >
                <CheckCircle2 size={13} aria-hidden />
                {profileStatus}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-slate-300">
                <Target className="h-3.5 w-3.5" aria-hidden />
                {raidsTarget} raids · {presencesTarget} présences (objectifs du mois)
              </span>
            </div>

            {isNewProfile ? (
              <div
                className="rounded-2xl border p-4 md:p-5"
                style={{ borderColor: hexToRgba(accent, 0.35), backgroundColor: "rgba(9, 17, 25, 0.55)" }}
              >
                <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                  Bienvenue dans TENF
                </p>
                <p className="mt-1 text-sm" style={{ color: "rgba(236,236,239,0.82)" }}>
                  Pour bien démarrer, inscris-toi à une réunion d’intégration quand tu peux.
                </p>
                <a
                  href="https://tenf-community.com/integration"
                  className="mt-3 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition hover:-translate-y-px"
                  style={{ backgroundColor: hexToRgba(accent, 0.95), color: "#201b12" }}
                >
                  Sessions d’intégration
                  <ArrowUpRight size={14} aria-hidden />
                </a>
              </div>
            ) : null}
          </div>

          <div className="flex flex-col items-center gap-4 lg:items-end">
            <DashboardScoreRing percent={globalProgress} accentHex={accent} gradientId={ringId} />
            <div
              className="w-full max-w-sm rounded-2xl border p-4"
              style={{ borderColor: hexToRgba(accent, 0.28), backgroundColor: "rgba(14,14,18,0.65)", backdropFilter: "blur(8px)" }}
            >
              <p className="text-center text-[11px] font-semibold uppercase tracking-wide text-white/55">Action suggérée</p>
              {isRaidAdviceMainAction ? (
                <div
                  className="mt-2 rounded-xl border px-3 py-2 text-center text-sm font-semibold"
                  style={{ borderColor: hexToRgba(accent, 0.45), backgroundColor: hexToRgba(accent, 0.12), color: hexToRgba(accent, 0.96) }}
                >
                  Pense à un raid cette semaine
                </div>
              ) : (
                <Link
                  href={mainAction.href}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition hover:-translate-y-px"
                  style={{ backgroundColor: hexToRgba(accent, 0.95), color: "#1f1a12" }}
                >
                  {mainAction.label}
                  <ArrowUpRight size={14} aria-hidden />
                </Link>
              )}
              <p className="mt-2 text-center text-xs text-white/55">Avant le {monthDeadline}</p>
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                {isRaidAdviceMainAction ? (
                  <Link
                    href="/member/raids/historique"
                    className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold hover:opacity-90"
                    style={{ borderColor: hexToRgba(accent, 0.38), color: hexToRgba(accent, 0.95) }}
                  >
                    Mes raids
                    <ArrowUpRight size={11} aria-hidden />
                  </Link>
                ) : null}
                {quickCtas.slice(1, 3).map((cta) => (
                  <Link
                    key={`hero-${cta.label}-${cta.href}`}
                    href={cta.href}
                    className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold hover:opacity-90"
                    style={{ borderColor: hexToRgba(accent, 0.35), color: hexToRgba(accent, 0.95) }}
                  >
                    {cta.label}
                    <ArrowUpRight size={11} aria-hidden />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <nav
        className="flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/85 to-slate-950/95 p-3"
        aria-label="Raccourcis tableau de bord"
      >
        {[
          { href: "/member/progression", label: "Progression" },
          { href: "/member/activite", label: "Activité" },
          { href: "/member/objectifs", label: "Objectifs" },
          { href: "/member/evenements", label: "Événements" },
          { href: "/member/formations", label: "Formations" },
          { href: "/member/notifications", label: "Notifications" },
        ].map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-100 transition hover:bg-white/10"
          >
            {l.label}
            <ArrowRight className="h-3 w-3 opacity-70" aria-hidden />
          </Link>
        ))}
      </nav>

      <div
        className="flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-black/20 p-2"
        role="tablist"
        aria-label="Sections du tableau de bord"
      >
        {(
          [
            { id: "overview" as const, label: "Synthèse", Icon: LayoutGrid },
            { id: "focus" as const, label: "À faire", Icon: ListTodo },
            { id: "pulse" as const, label: "Agenda & fil", Icon: CalendarDays },
          ] as const
        ).map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={activeTab === id}
            onClick={() => setActiveTab(id)}
            className={`inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition sm:flex-none sm:px-5 ${
              activeTab === id
                ? "bg-gradient-to-r from-violet-600/95 to-fuchsia-700/85 text-white shadow-lg shadow-violet-950/40"
                : "text-slate-300 hover:bg-white/10"
            }`}
          >
            <Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
            {label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <>
          <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
            {remainingCards.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="group rounded-2xl border p-4 transition hover:-translate-y-0.5 sm:p-5"
                style={{
                  borderColor: hexToRgba(accent, 0.22),
                  background: "linear-gradient(155deg, rgba(34,34,40,0.96), rgba(20,20,24,0.98))",
                  boxShadow: "0 12px 28px rgba(0, 0, 0, 0.28)",
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-white/55">{item.label}</p>
                  <item.icon size={18} style={{ color: hexToRgba(accent, 0.92) }} aria-hidden />
                </div>
                <p className="mt-2 text-[10px] uppercase tracking-wide text-white/40">{item.hint}</p>
                <p className="mt-2 text-3xl font-bold tabular-nums" style={{ color: "var(--color-text)" }}>
                  {item.remaining}
                </p>
                <p className="mt-1 text-xs text-white/50">
                  restant · {item.current}/{item.target}
                </p>
                <div className="mt-3 h-2 rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${getProgressPercent(item.current, item.target)}%`,
                      background: `linear-gradient(90deg, ${hexToRgba(accent, 0.95)}, ${hexToRgba(accent, 0.55)})`,
                    }}
                  />
                </div>
                <p className="mt-2 line-clamp-2 text-[11px] leading-snug text-white/55">
                  {item.label === "Follows réseau"
                    ? followStats.loading
                      ? "Chargement du score…"
                      : !followStats.authenticated
                        ? "Connecte-toi pour le détail du score."
                        : !followStats.linked
                          ? "Lie Twitch pour activer le suivi."
                          : `${followStats.followed}/${followStats.total} membres suivis.`
                    : getCardFeedback(item.current, item.target, item.remaining)}
                </p>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold opacity-0 transition group-hover:opacity-100" style={{ color: hexToRgba(accent, 0.95) }}>
                  Ouvrir <ArrowUpRight size={12} aria-hidden />
                </span>
              </Link>
            ))}
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:p-6">
              <h2 className="text-lg font-bold text-white">Élan du mois</h2>
              <p className="mt-1 text-sm text-slate-400">Participation enregistrée côté TENF (indicateur global).</p>
              <div className="mt-4 flex items-end gap-2">
                <span className="text-4xl font-black tabular-nums text-white">{stats.participationThisMonth}</span>
                <span className="pb-1 text-sm text-slate-400">actions validées</span>
              </div>
              <Link href="/member/engagement/score" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-violet-300 hover:text-white">
                Détail score & follows
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <div className="mt-4 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-300">
                Formations ce mois : <strong className="text-white">{formationsThisMonth}</strong> · Intégration :{" "}
                <strong className="text-white">{integrationLabel}</strong>
              </div>
            </article>
            <article className="rounded-2xl border border-cyan-500/25 bg-gradient-to-br from-cyan-950/35 to-slate-950/90 p-5 md:p-6">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-lg font-bold text-white">Prochains créneaux</h2>
                <Link href="/member/evenements" className="text-xs font-semibold text-cyan-300 hover:text-white">
                  Tout voir
                </Link>
              </div>
              {upcomingPreview.length === 0 ? (
                <p className="mt-4 text-sm text-slate-400">Aucun événement listé pour l’instant.</p>
              ) : (
                <ul className="mt-4 space-y-2">
                  {upcomingPreview.map((ev) => (
                    <li key={ev.id} className="rounded-xl border border-white/10 bg-black/25 px-3 py-2">
                      <p className="font-semibold text-white">{ev.title}</p>
                      <p className="text-xs text-slate-400">
                        {formatDateTime(ev.date)} · {ev.category}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          </section>
        </>
      )}

      {activeTab === "focus" && (
        <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-white">Priorités (ordre indicatif)</h2>
              <span className="inline-flex items-center gap-1 text-xs text-violet-300">
                <Zap className="h-4 w-4" aria-hidden />
                Les plus utiles en premier
              </span>
            </div>
            <div className="mt-4 space-y-2">
              {prioritizedActions.length === 0 ? (
                <p className="text-sm text-slate-400">Rien d’urgent détecté — tu peux naviguer au feeling.</p>
              ) : (
                prioritizedActions.map((action, index) => {
                  const open = expandedPriorityIdx === index;
                  const tone = getImpactTone(action.impact);
                  return (
                    <div key={action.label} className="overflow-hidden rounded-xl border border-white/10 bg-black/20">
                      <button
                        type="button"
                        className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left transition hover:bg-white/5"
                        onClick={() => setExpandedPriorityIdx(open ? null : index)}
                        aria-expanded={open}
                      >
                        <span className="min-w-0">
                          <span className="font-semibold text-white">
                            {index + 1}. {action.label}
                          </span>
                          <span className="mt-1 block text-xs text-slate-400 line-clamp-2">{action.detail}</span>
                        </span>
                        <span className="flex shrink-0 items-center gap-2">
                          <span
                            className="rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase"
                            style={{ backgroundColor: tone.bg, borderColor: tone.border, color: tone.text }}
                          >
                            {tone.label}
                          </span>
                          <ChevronDown className={`h-4 w-4 text-slate-500 transition ${open ? "rotate-180" : ""}`} aria-hidden />
                        </span>
                      </button>
                      {open ? (
                        <div className="border-t border-white/10 px-4 py-3">
                          <Link href={action.href} className="inline-flex items-center gap-2 text-sm font-semibold text-violet-300 hover:text-white">
                            Aller à l’action
                            <ArrowUpRight size={14} aria-hidden />
                          </Link>
                        </div>
                      ) : null}
                    </div>
                  );
                })
              )}
            </div>
          </article>

          <article className="rounded-2xl border border-white/10 p-5 md:p-6" style={{ backgroundColor: "var(--color-card)" }}>
            <h2 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>
              Rappels mois
            </h2>
            <ul className="mt-4 space-y-3 text-sm" style={{ color: "var(--color-text-secondary)" }}>
              <li className="rounded-xl border border-white/10 px-3 py-2">
                Il reste <strong style={{ color: "var(--color-text)" }}>{raidsRemaining}</strong> raid(s) et{" "}
                <strong style={{ color: "var(--color-text)" }}>{presencesRemaining}</strong> présence(s) pour atteindre tes objectifs réglés.
              </li>
              <li className="rounded-xl border border-white/10 px-3 py-2">
                {recommendedEvent ? (
                  <>
                    Prochain focus possible : <strong style={{ color: "var(--color-text)" }}>{recommendedEvent.title}</strong>.
                  </>
                ) : (
                  <>Consulte le planning pour bloquer un créneau.</>
                )}
              </li>
              <li className="rounded-xl border border-white/10 px-3 py-2">
                Progression agrégée affichée dans l’anneau : <strong style={{ color: "var(--color-text)" }}>{globalProgress}%</strong>.
              </li>
            </ul>
            <div className="mt-4 flex flex-wrap gap-2">
              {quickCtas.map((cta) => (
                <Link
                  key={`${cta.label}-${cta.href}-chip`}
                  href={cta.href}
                  className="inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold transition hover:-translate-y-px"
                  style={{
                    borderColor: hexToRgba(accent, 0.38),
                    color: hexToRgba(accent, 0.96),
                    backgroundColor: cta.href === mainAction.href ? hexToRgba(accent, 0.14) : "transparent",
                  }}
                >
                  {cta.label}
                  <ArrowUpRight size={12} aria-hidden />
                </Link>
              ))}
            </div>
          </article>
        </div>
      )}

      {activeTab === "pulse" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-950/30 to-slate-950/95 p-5 md:p-6">
            <h2 className="text-lg font-bold text-white">Événement mis en avant</h2>
            {recommendedEvent ? (
              <div className="mt-4 rounded-2xl border border-white/15 bg-black/30 p-4">
                <p className="text-lg font-bold text-white">{recommendedEvent.title}</p>
                <p className="mt-2 text-sm text-slate-400">
                  {formatDateTime(recommendedEvent.date)} · {recommendedEvent.category}
                </p>
                <p className="mt-3 text-sm text-slate-300">Une présence là peut débloquer à la fois convivialité et objectifs du mois.</p>
                <Link href="/member/evenements" className="mt-4 inline-flex items-center gap-2 font-semibold text-violet-300 hover:text-white">
                  Planning & inscriptions
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-8 text-center text-sm text-slate-400">
                Aucun événement à mettre en avant pour le moment.{" "}
                <Link href="/member/evenements" className="font-semibold text-violet-300 hover:underline">
                  Ouvre le planning
                </Link>
                .
              </div>
            )}
          </article>

          <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:p-6">
            <h2 className="text-lg font-bold text-white">Fil récent</h2>
            <p className="mt-1 text-xs text-slate-400">Formations et présences enregistrées — touche une ligne pour le détail.</p>
            <div className="mt-4 space-y-2">
              {recentTimeline.length === 0 ? (
                <p className="text-sm text-slate-400">Pas encore d’entrées à afficher.</p>
              ) : (
                recentTimeline.map((entry) => {
                  const open = expandedTimelineId === entry.id;
                  return (
                    <div key={entry.id} className="overflow-hidden rounded-xl border bg-black/15" style={{ borderColor: entry.color }}>
                      <button
                        type="button"
                        className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left transition hover:bg-white/5"
                        onClick={() => setExpandedTimelineId(open ? null : entry.id)}
                        aria-expanded={open}
                      >
                        <span className="min-w-0">
                          <span className="block truncate font-semibold text-white">{entry.title}</span>
                          <span className="text-xs text-slate-400">{entry.type}</span>
                        </span>
                        <ChevronDown className={`h-4 w-4 shrink-0 text-slate-500 ${open ? "rotate-180" : ""}`} aria-hidden />
                      </button>
                      {open ? (
                        <div className="border-t border-white/10 px-3 py-2 text-xs text-slate-400">{formatDateTime(entry.date)}</div>
                      ) : null}
                    </div>
                  );
                })
              )}
            </div>
          </article>
        </div>
      )}

      <Link
        href={mainAction.href}
        className="fixed bottom-4 left-4 right-4 z-40 inline-flex items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold shadow-lg md:hidden"
        style={{
          backgroundColor: hexToRgba(accent, 0.96),
          color: "#1f1a12",
          boxShadow: "0 14px 28px rgba(0, 0, 0, 0.35)",
        }}
      >
        <Sparkles size={14} aria-hidden />
        {mainAction.label}
        <ArrowUpRight size={14} aria-hidden />
      </Link>
    </MemberSurface>
  );
}

function DashboardScoreRing({ percent, accentHex, gradientId }: { percent: number; accentHex: string; gradientId: string }) {
  const size = 132;
  const stroke = 11;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = Math.min(100, Math.max(0, percent));
  const offset = c - (p / 100) * c;

  return (
    <div className="relative flex flex-col items-center">
      <div className="relative flex h-[142px] w-[142px] shrink-0 items-center justify-center">
        <svg width={size} height={size} className="-rotate-90 drop-shadow-lg" aria-hidden>
          <defs>
            <linearGradient id={`${gradientId}-dash`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={accentHex} />
              <stop offset="100%" stopColor="#a78bfa" />
            </linearGradient>
          </defs>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={`url(#${gradientId}-dash)`}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
            className="transition-[stroke-dashoffset] duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-black text-white">{p}%</span>
          <span className="text-[10px] font-semibold uppercase tracking-wide text-white/55">mois</span>
        </div>
      </div>
      <p className="mt-2 max-w-[12rem] text-center text-[11px] text-white/45">Moyenne raids / présences / profil</p>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-56 rounded-3xl bg-white/5 md:h-64" />
      <div className="h-16 rounded-2xl bg-white/5" />
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-40 rounded-2xl bg-white/5" />
        ))}
      </div>
    </div>
  );
}

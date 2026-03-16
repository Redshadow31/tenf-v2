"use client";

import Link from "next/link";
import { ArrowUpRight, Calendar, CheckCircle2, Clock3, Crown, Flag, ListTodo, Rocket, Sparkles, UserCircle2 } from "lucide-react";
import MemberSurface from "@/components/member/ui/MemberSurface";
import MemberBreadcrumbs from "@/components/member/ui/MemberBreadcrumbs";
import EmptyFeatureCard from "@/components/member/ui/EmptyFeatureCard";
import { useMemberOverview } from "@/components/member/hooks/useMemberOverview";
import { useMemberMonthlyGoals } from "@/components/member/hooks/useMemberMonthlyGoals";

const VIP_GOLD = "#d4af37";

const ROLE_ACCENT_BY_KEY: Array<{ key: string; accent: string }> = [
  { key: "communaute", accent: "#06b6d4" },
  { key: "developpement", accent: "#b87333" },
  { key: "affilie", accent: "#9aaedb" },
  { key: "junior", accent: "#ff3da5" },
  { key: "nouveau", accent: "#06b6d4" },
];

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

function resolveAccent(role: string | undefined, vipActive: boolean): string {
  if (vipActive) return VIP_GOLD;
  const normalizedRole = normalizeText(role);
  return ROLE_ACCENT_BY_KEY.find((entry) => normalizedRole.includes(entry.key))?.accent ?? "#06b6d4";
}

function formatDate(value: string | null) {
  if (!value) return "Non planifiee";
  return new Date(value).toLocaleDateString("fr-FR");
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" });
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
  if (status === "valide") return "Profil valide";
  if (status === "en_cours_examen") return "Profil en cours";
  return "Profil non soumis";
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
    if (segment === "vip") return "Objectifs atteints. Niveau VIP confirme, bravo.";
    if (segment === "newbie") return "Objectifs valides. Excellent demarrage, bravo.";
    if (segment === "development") return "Objectifs valides. Progression solide ce mois-ci.";
    return "Objectifs valides. Super regularite, bravo.";
  }
  if (progress >= 80) return "Tu es dans la derniere ligne droite. Continue comme ca.";
  if (progress >= 50) return "Tres bon rythme. Encore un effort pour valider le mois.";
  return "Le mois est bien lance. Une action maintenant fera la difference.";
}

function getCardFeedback(current: number, target: number, remaining: number): string {
  const progress = getProgressPercent(current, target);
  if (remaining <= 0) return "Bravo, objectif valide ce mois-ci.";
  if (remaining === 1) return "Felicitations pour ta progression: plus qu une etape.";
  if (progress >= 75) return "Tres bien joue: tu approches du palier final.";
  if (progress >= 40) return "Belle dynamique, continue comme ca.";
  return "C est le bon moment pour lancer cet objectif cette semaine.";
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

export default function MemberDashboardPage() {
  const { data, loading, error } = useMemberOverview();
  const { goals: memberGoals } = useMemberMonthlyGoals(data?.monthKey || "");

  if (loading) {
    return (
      <MemberSurface>
        <section
          className="rounded-2xl border p-6 md:p-8"
          style={{
            borderColor: "rgba(212, 175, 55, 0.25)",
            background: "linear-gradient(145deg, rgba(20,20,24,0.95), rgba(33,33,40,0.95))",
            boxShadow: "0 16px 40px rgba(0, 0, 0, 0.28)",
          }}
        >
          <p className="text-sm uppercase tracking-[0.16em]" style={{ color: "rgba(229, 199, 115, 0.86)" }}>
            Dashboard executive
          </p>
          <p className="mt-4 text-3xl font-semibold" style={{ color: "var(--color-text)" }}>
            Chargement de ton espace premium...
          </p>
        </section>
      </MemberSurface>
    );
  }

  if (error || !data) {
    return (
      <MemberSurface>
        <MemberBreadcrumbs />
        <section className="rounded-2xl border p-6" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Espace membre
          </p>
          <h1 className="mt-2 text-2xl font-semibold" style={{ color: "var(--color-text)" }}>
            Dashboard ultra premium
          </h1>
          <p className="mt-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Synthese de ton activite et de tes prochaines actions.
          </p>
        </section>
        <EmptyFeatureCard title="Dashboard indisponible" description={error || "Impossible de charger les informations membre."} />
      </MemberSurface>
    );
  }

  const integrationLabel = data.member.integrationDate ? `Faite le ${formatDate(data.member.integrationDate)}` : "Non faite";
  const displayName = data.member.displayName || data.member.twitchLogin;
  const firstName = displayName.split(" ")[0] || "Membre";
  const vipActive = Boolean(data.vip?.activeThisMonth);
  const accent = resolveAccent(data.member.role, vipActive);
  const sectionLabel = vipActive ? "Espace membre VIP" : "Espace membre";
  const segment = roleSegment(data.member.role, vipActive);
  const monthDeadline = formatMonthDeadline(data.monthKey);
  const profileStatus = profileStatusLabel(data.member.profileValidationStatus);
  const raidsTarget = memberGoals.raids;
  const presencesTarget = memberGoals.events;
  const profileRemaining = Math.max(0, 100 - data.profile.percent);
  const raidsRemaining = Math.max(0, raidsTarget - data.stats.raidsThisMonth);
  const presencesRemaining = Math.max(0, presencesTarget - data.stats.eventPresencesThisMonth);
  const formationsThisMonth =
    data.stats.formationsValidatedThisMonth ??
    data.formationHistory.filter((item) => item.date.slice(0, 7) === data.monthKey).length;

  const remainingCards = [
    {
      label: "Raids a faire",
      current: data.stats.raidsThisMonth,
      target: raidsTarget,
      remaining: raidsRemaining,
      href: "/member/raids/declarer",
      icon: Rocket,
    },
    {
      label: "Presences a faire",
      current: data.stats.eventPresencesThisMonth,
      target: presencesTarget,
      remaining: presencesRemaining,
      href: "/member/evenements",
      icon: Calendar,
    },
    {
      label: "Profil a completer",
      current: data.profile.percent,
      target: 100,
      remaining: profileRemaining,
      href: "/member/profil/completer",
      icon: UserCircle2,
    },
  ];

  const recommendedEvent =
    data.upcomingEvents.find((event) => String(event.category || "").toLowerCase().includes("formation")) || data.upcomingEvents[0];

  const suggestedActions = [
    raidsRemaining > 0
      ? {
          impact: 140,
          href: "/member/raids/declarer",
          label: "Faire un raid cette semaine",
          detail: `${raidsRemaining} raid(s) restant(s) avant le ${monthDeadline}. Les raids sont suivis automatiquement, et la declaration Discord reste recommandee.`,
        }
      : null,
    vipActive
      ? {
          impact: 130,
          href: "/member/vip",
          label: "Consulter ton acces prioritaire",
          detail: "Ton statut VIP est actif ce mois: profite de ton espace VIP dedie.",
        }
      : null,
    !data.profile.completed
      ? {
          impact: 100,
          href: "/member/profil/completer",
          label: "Completer ton profil",
          detail: `Il te reste ${profileRemaining}% pour finaliser ton profil.`,
        }
      : null,
    presencesRemaining > 0
      ? {
          impact: 90,
          href: "/member/evenements",
          label: "Planifier ta prochaine presence",
          detail: `${presencesRemaining} presence(s) restante(s) avant le ${monthDeadline}.`,
        }
      : null,
    segment === "newbie"
      ? {
          impact: 88,
          href: "/member/profil/completer",
          label: "Finaliser ton onboarding",
          detail: "Active ton profil et tes infos de base pour bien demarrer.",
        }
      : null,
    segment === "development"
      ? {
          impact: 87,
          href: "/member/formations",
          label: "Continuer tes formations",
          detail: "Passe un jalon formation cette semaine pour accelerer ta progression.",
        }
      : null,
    recommendedEvent
      ? {
          impact: 85,
          href: "/member/evenements",
          label: "T inscrire au prochain evenement",
          detail: `${recommendedEvent.title} - ${formatDateTime(recommendedEvent.date)}.`,
        }
      : null,
  ] satisfies Array<SuggestedAction | null>;

  const prioritizedActions = suggestedActions
    .filter(isSuggestedAction)
    .sort((a, b) => b.impact - a.impact)
    .slice(0, 3);

  const mainAction =
    prioritizedActions[0] ||
    ({
      impact: 0,
      href: "/member/evenements",
      label: "Voir le planning TENF",
      detail: "Ajuste ton planning pour garder ton rythme ce mois-ci.",
    } as const);

  const quickCtas = [mainAction, ...prioritizedActions.slice(1, 3)];

  const recentTimeline = [
    ...data.formationHistory.map((item) => ({
      id: `formation-${item.id}-${item.date}`,
      date: item.date,
      title: item.title,
      type: "Formation validee",
      color: "rgba(34, 197, 94, 0.28)",
    })),
    ...data.eventPresenceHistory.map((item) => ({
      id: `presence-${item.id}-${item.date}`,
      date: item.date,
      title: item.title,
      type: `Presence - ${item.category}`,
      color: "rgba(59, 130, 246, 0.28)",
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const raidsProgress = getProgressPercent(data.stats.raidsThisMonth, raidsTarget);
  const presencesProgress = getProgressPercent(data.stats.eventPresencesThisMonth, presencesTarget);
  const profileProgress = Math.max(0, Math.min(100, data.profile.percent));
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
      ? `Bravo: ${validatedThisWeek} action(s) validee(s) sur les 7 derniers jours.`
      : "Aucune action validee cette semaine: choisis une priorite et lance-toi.";

  return (
    <MemberSurface>
      <section
        className="rounded-3xl border p-6 md:p-8"
        style={{
          borderColor: hexToRgba(accent, 0.24),
          background: `radial-gradient(circle at 15% 15%, ${hexToRgba(accent, 0.18)}, rgba(27,27,33,0.96) 42%)`,
          boxShadow: "0 20px 45px rgba(0, 0, 0, 0.28)",
        }}
      >
        <MemberBreadcrumbs />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.18em]" style={{ color: hexToRgba(accent, 0.9) }}>
              {sectionLabel}
            </p>
            <h1 className="mt-3 text-3xl font-semibold md:text-4xl" style={{ color: "var(--color-text)" }}>
              Bonjour {firstName}, bienvenue dans ton espace membre.
            </h1>
            <p className="mt-3 text-sm md:text-base" style={{ color: "rgba(236, 236, 239, 0.84)" }}>
              Etat du mois: {mainAction.detail}
            </p>
            <p className="mt-2 text-sm" style={{ color: "rgba(236,236,239,0.78)" }}>
              {encouragement} {weekEncouragement}
            </p>
            <p className="mt-2 text-xs" style={{ color: "rgba(229,229,235,0.74)" }}>
              Objectifs actifs du mois: {raidsTarget} raids, {presencesTarget} presences.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span
                className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em]"
                style={{
                  borderColor: hexToRgba(accent, 0.42),
                  backgroundColor: hexToRgba(accent, 0.12),
                  color: hexToRgba(accent, 0.95),
                }}
              >
                <Crown size={13} />
                {data.vip?.statusLabel || "Membre standard"}
              </span>
              <span
                className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em]"
                style={{
                  borderColor: "rgba(255,255,255,0.22)",
                  backgroundColor: "rgba(255,255,255,0.07)",
                  color: "rgba(245,245,247,0.9)",
                }}
              >
                <CheckCircle2 size={13} />
                {profileStatus}
              </span>
            </div>
          </div>
          <div className="grid gap-2">
            <Link
              href={mainAction.href}
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition hover:-translate-y-[1px]"
              style={{ backgroundColor: hexToRgba(accent, 0.95), color: "#201b12" }}
            >
              {mainAction.label}
              <ArrowUpRight size={14} />
            </Link>
            <p className="text-xs text-right" style={{ color: "rgba(229, 229, 235, 0.76)" }}>
              Objectifs mensuels a valider avant le {monthDeadline}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {remainingCards.map((item) => (
          <article
            key={item.label}
            className="rounded-2xl border p-5 transition-all hover:-translate-y-[1px]"
            style={{
              borderColor: hexToRgba(accent, 0.2),
              background: "linear-gradient(150deg, rgba(32,32,38,0.95), rgba(22,22,27,0.96))",
            }}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs uppercase tracking-[0.1em]" style={{ color: "rgba(214, 214, 224, 0.75)" }}>
                {item.label}
              </p>
              <item.icon size={16} style={{ color: hexToRgba(accent, 0.95) }} />
            </div>
            <p className="mt-3 text-3xl font-semibold" style={{ color: "var(--color-text)" }}>
              {item.remaining}
            </p>
            <p className="mt-1 text-xs" style={{ color: "rgba(214, 214, 224, 0.72)" }}>
              Restant ({item.current}/{item.target})
            </p>
            <p className="mt-2 text-xs" style={{ color: "rgba(214, 214, 224, 0.72)" }}>
              {getCardFeedback(item.current, item.target, item.remaining)}
            </p>
            <Link href={item.href} className="mt-3 inline-flex items-center gap-1 text-xs hover:opacity-85" style={{ color: hexToRgba(accent, 0.9) }}>
              Passer a l action
              <ArrowUpRight size={12} />
            </Link>
          </article>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <article
          className="rounded-2xl border p-5"
          style={{
            borderColor: hexToRgba(accent, 0.2),
            background: "linear-gradient(165deg, rgba(28,28,34,0.96), rgba(17,17,21,0.98))",
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>
              Priorites de cette semaine
            </h2>
            <span className="inline-flex items-center gap-1 text-xs" style={{ color: hexToRgba(accent, 0.88) }}>
              <ListTodo size={14} />
              Urgent en premier
            </span>
          </div>
          <div className="mt-4 space-y-4">
            {prioritizedActions.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                Tu es a jour cette semaine. Garde le rythme.
              </p>
            ) : (
              prioritizedActions.map((action, index) => (
                <div key={action.label} className="rounded-xl border px-4 py-3" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
                  <div className="mb-1 flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                      {index + 1}. {action.label}
                    </p>
                    <span className="text-xs" style={{ color: "rgba(216,216,224,0.8)" }}>
                      Impact eleve
                    </span>
                  </div>
                  <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                    {action.detail}
                  </p>
                  <Link href={action.href} className="mt-2 inline-flex items-center gap-1 text-xs hover:opacity-85" style={{ color: hexToRgba(accent, 0.92) }}>
                    Ouvrir
                    <ArrowUpRight size={12} />
                  </Link>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="rounded-2xl border p-5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
          <h2 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>
            Suivi du mois
          </h2>
          <div className="mt-4 rounded-lg border px-3 py-2" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
            <p className="inline-flex items-center gap-2 text-sm font-semibold" style={{ color: "var(--color-text)" }}>
              <Flag size={14} style={{ color: hexToRgba(accent, 0.92) }} />
              Score d engagement: {data.stats.participationThisMonth}
            </p>
            <p className="mt-1 text-xs" style={{ color: "var(--color-text-secondary)" }}>
              Actions validees ce mois (raids + presences).
            </p>
            <Link href="/member/engagement/score" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold hover:opacity-85" style={{ color: hexToRgba(accent, 0.92) }}>
              Voir le detail du score
              <ArrowUpRight size={12} />
            </Link>
          </div>
          <div className="mt-4 space-y-2">
            <p className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "rgba(255,255,255,0.08)", color: "var(--color-text-secondary)" }}>
              Il te reste <strong style={{ color: "var(--color-text)" }}>{raidsRemaining} raid(s)</strong> et{" "}
              <strong style={{ color: "var(--color-text)" }}>{presencesRemaining} presence(s)</strong> avant la fin du mois.
            </p>
            <p className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "rgba(255,255,255,0.08)", color: "var(--color-text-secondary)" }}>
              Recommandation: {recommendedEvent ? "inscris-toi au prochain evenement conseille." : "consulte le planning pour bloquer un creneau."}
            </p>
            <p className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "rgba(255,255,255,0.08)", color: "var(--color-text-secondary)" }}>
              Formations validees ce mois: <strong style={{ color: "var(--color-text)" }}>{formationsThisMonth}</strong>.
            </p>
            <p className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "rgba(255,255,255,0.08)", color: "var(--color-text-secondary)" }}>
              Integrations: <strong style={{ color: "var(--color-text)" }}>{integrationLabel}</strong>.
            </p>
            <p className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "rgba(255,255,255,0.08)", color: "var(--color-text-secondary)" }}>
              Progression globale du mois: <strong style={{ color: "var(--color-text)" }}>{globalProgress}%</strong>. {encouragement}
            </p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {quickCtas.map((cta) => (
              <Link
                key={`${cta.label}-${cta.href}`}
                href={cta.href}
                className="inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold hover:opacity-85"
                style={{ borderColor: hexToRgba(accent, 0.35), color: hexToRgba(accent, 0.95) }}
              >
                {cta.label}
                <ArrowUpRight size={12} />
              </Link>
            ))}
          </div>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-2xl border p-5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
          <h2 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>
            Prochain evenement conseille
          </h2>
          {recommendedEvent ? (
            <div className="mt-4 rounded-xl border p-4" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
              <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                {recommendedEvent.title}
              </p>
              <p className="mt-1 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                {formatDateTime(recommendedEvent.date)} - {recommendedEvent.category}
              </p>
              <p className="mt-3 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                Recommandation: reserve ce creneau pour avancer sur tes objectifs du mois.
              </p>
              <Link href="/member/evenements" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold hover:opacity-85" style={{ color: hexToRgba(accent, 0.9) }}>
                Ouvrir le planning et s inscrire
                <ArrowUpRight size={14} />
              </Link>
            </div>
          ) : (
            <EmptyFeatureCard title="Prochain evenement conseille" description="Aucun evenement publie pour le moment." icon={Clock3} />
          )}
        </article>

        <article className="rounded-2xl border p-5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
          <h2 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>
            Historique rapide
          </h2>
          <div className="mt-3 space-y-2">
            {recentTimeline.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                Pas encore d actions validees a afficher.
              </p>
            ) : (
              recentTimeline.map((entry) => (
                <div key={entry.id} className="rounded-xl border px-3 py-2" style={{ borderColor: entry.color }}>
                  <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                    {entry.title}
                  </p>
                  <p className="mt-1 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                    {entry.type} - {formatDateTime(entry.date)}
                  </p>
                </div>
              ))
            )}
          </div>
        </article>
      </section>

      <Link
        href={mainAction.href}
        className="fixed bottom-4 left-4 right-4 z-40 inline-flex items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold shadow-lg md:hidden"
        style={{
          backgroundColor: hexToRgba(accent, 0.95),
          color: "#1f1a12",
          boxShadow: "0 14px 28px rgba(0, 0, 0, 0.28)",
        }}
      >
        <Sparkles size={14} />
        {mainAction.label}
        <ArrowUpRight size={14} />
      </Link>
    </MemberSurface>
  );
}

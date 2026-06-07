// memberDashboardModel.ts
// Transforme les données brutes (`useMemberOverview`, goals, follow-status, raids data-v2)
// en un modèle de vue prêt à consommer par les composants du dashboard.
//
// Objectif : sortir la logique métier de la page principale et la garder testable / lisible.

import type { MemberOverview } from "@/components/member/hooks/useMemberOverview";
import type { MemberMonthlyGoals } from "@/components/member/hooks/useMemberMonthlyGoals";

// ============================================================
// Types publics du modèle de vue
// ============================================================
export type MemberStatus =
  | "newcomer" // nouveau membre / onboarding non terminé
  | "active" // membre régulier
  | "paused" // pas d'activité récente
  | "vip" // VIP du mois en cours
  | "staff"; // rôle d'équipe (admin / mod / etc.)

export type MemberSegment = "newbie" | "growth" | "development" | "vip";

export type FollowState = "followed" | "not_followed" | "unknown";

export type FollowStats = {
  loading: boolean;
  authenticated: boolean;
  linked: boolean;
  total: number;
  followed: number;
  score: number; // 0–100
};

export type DashboardAction = {
  id: string;
  label: string;
  href: string;
  detail: string;
  /** Indication visuelle (icone à la consommation du composant). */
  tone: "primary" | "support" | "soft";
  external?: boolean;
};

export type MonthIndicator = {
  id: "raids" | "presences" | "profile" | "network";
  label: string;
  hint: string;
  current: number;
  target: number;
  /** Reformulation amicale, optionnelle, pour empty state ou statut spécial. */
  microHint: string;
  href: string;
};

export type DashboardEventItem = {
  id: string;
  title: string;
  category: string;
  date: string;
  /** "onboarding" pour réunion d'intégration, "community" pour réunion / event communautaire. */
  bucket: "onboarding" | "community" | "other";
};

export type RecentRaidEntry = {
  targetLogin: string;
  targetDisplayName?: string;
  date: string;
  count: number;
};

export type WelcomeInsight = {
  id: string;
  label: string;
  detail?: string;
  tone: "accent" | "success" | "warning" | "info" | "muted";
};

export type MemberDashboardModel = {
  // Identité & statut
  firstName: string;
  displayName: string;
  monthKey: string;
  monthLabel: string; // ex: "mai 2026"
  monthDeadlineLabel: string; // ex: "31 mai 2026"
  status: MemberStatus;
  segment: MemberSegment;
  accent: string; // couleur d'accent dérivée du statut / rôle
  statusBadge: string; // ex: "Membre VIP", "Nouveau membre", "Membre"
  profileStatusLabel: string;

  // Bienvenue
  welcomeKicker: string;
  welcomeTitle: string;
  welcomeMessage: string;
  welcomeInsights: WelcomeInsight[];
  welcomeBanner: { title: string; description: string; cta: DashboardAction } | null;

  // Action(s) à faire
  primaryAction: DashboardAction;
  secondaryActions: DashboardAction[]; // max 2
  /** True si l'action principale est suffisamment ciblée pour mériter un CTA flottant sur mobile.
   *  False quand on tombe sur un fallback type "explorer le planning". */
  showFloatingCta: boolean;

  // Mois en un coup d'œil
  monthIndicators: MonthIndicator[];
  globalProgress: number;
  monthProgressLabel: string;
  encouragement: string;

  // Lives & réseau
  network: {
    state: "loading" | "twitch_unlinked" | "not_authenticated" | "ready";
    followed: number;
    total: number;
    score: number;
  };

  // Réunions & intégration
  meetings: {
    integrationDateLabel: string;
    isIntegrationDone: boolean;
    onboardingEvent: DashboardEventItem | null;
    nextCommunityEvent: DashboardEventItem | null;
  };

  // Agenda TENF
  upcomingEvents: DashboardEventItem[]; // 3 max

  // Reconnaissance
  recognition: {
    participationThisMonth: number;
    formationsThisMonth: number;
    vipActive: boolean;
    vipLabel: string;
  };

  // Stats reconnaissance (affichage compact)
  showRecognitionStats: boolean;

  // Historique unifié (raids + formations + présences)
  recentTimeline: Array<{
    id: string;
    date: string;
    title: string;
    type: string;
    color: string;
  }>;
};

// ============================================================
// Utilitaires
// ============================================================
const MONTH_SHORT = [
  "janv.",
  "févr.",
  "mars",
  "avr.",
  "mai",
  "juin",
  "juil.",
  "août",
  "sept.",
  "oct.",
  "nov.",
  "déc.",
];
const MONTH_LONG = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
];

function normalizeText(value: string | undefined | null): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function formatMonthLong(monthKey: string): string {
  const [yearStr, monthStr] = monthKey.split("-");
  const idx = Number(monthStr) - 1;
  return `${MONTH_LONG[idx] || "?"} ${yearStr}`;
}

function formatMonthShort(monthKey: string): string {
  const [yearStr, monthStr] = monthKey.split("-");
  const idx = Number(monthStr) - 1;
  return `${MONTH_SHORT[idx] || "?"} ${yearStr}`;
}

function formatMonthDeadline(monthKey: string): string {
  const [yearStr, monthStr] = monthKey.split("-");
  const year = Number(yearStr);
  const monthIndex = Number(monthStr) - 1;
  if (!Number.isFinite(year) || !Number.isFinite(monthIndex)) {
    return "fin du mois";
  }
  const end = new Date(year, monthIndex + 1, 0);
  return end.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

function classifyEventBucket(category: string | undefined): DashboardEventItem["bucket"] {
  const c = normalizeText(category);
  if (c.includes("integration") || c.includes("onboarding") || c.includes("acceuil") || c.includes("accueil")) {
    return "onboarding";
  }
  if (
    c.includes("reunion") ||
    c.includes("communaute") ||
    c.includes("event") ||
    c.includes("conference") ||
    c.includes("live")
  ) {
    return "community";
  }
  return "other";
}

function toDashboardEvent(ev: { id: string; title: string; category: string; date: string }): DashboardEventItem {
  return { ...ev, bucket: classifyEventBucket(ev.category) };
}

function getProgressPercent(current: number, target: number): number {
  if (target <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((current / target) * 100)));
}

// ============================================================
// Statut & couleur d'accent
// ============================================================
const ROLE_ACCENT_MAP: Array<{ key: string; accent: string }> = [
  { key: "admin", accent: "#a78bfa" }, // staff / admin → violet
  { key: "fondateur", accent: "#ef4444" }, // fondateur → rouge doux
  { key: "modera", accent: "#38bdf8" }, // modération → cyan
  { key: "communaute", accent: "#06b6d4" },
  { key: "developpement", accent: "#fb923c" },
  { key: "affilie", accent: "#9aaedb" },
  { key: "junior", accent: "#ec4899" },
  { key: "nouveau", accent: "#22d3ee" },
];

const VIP_GOLD = "#d4af37";

function resolveAccentFromStatus(role: string | undefined, status: MemberStatus): string {
  if (status === "vip") return VIP_GOLD;
  const value = normalizeText(role);
  const match = ROLE_ACCENT_MAP.find((entry) => value.includes(entry.key));
  return match?.accent ?? "#22d3ee";
}

function resolveSegment(role: string | undefined, vipActive: boolean): MemberSegment {
  if (vipActive) return "vip";
  const value = normalizeText(role);
  if (value.includes("junior") || value.includes("nouveau")) return "newbie";
  if (value.includes("developpement")) return "development";
  return "growth";
}

function resolveMemberStatus(input: {
  role: string | undefined;
  vipActive: boolean;
  onboardingStatus: string | undefined;
  participationThisMonth: number;
  raidsThisMonth: number;
  eventPresencesThisMonth: number;
}): MemberStatus {
  const role = normalizeText(input.role);
  const onboarding = normalizeText(input.onboardingStatus);

  if (role.includes("admin") || role.includes("fondateur") || role.includes("modera") || role.includes("staff")) {
    return "staff";
  }
  if (input.vipActive) return "vip";
  if (
    role.includes("nouveau") ||
    onboarding === "a_faire" ||
    onboarding === "en_cours"
  ) {
    return "newcomer";
  }
  if (
    input.participationThisMonth === 0 &&
    input.raidsThisMonth === 0 &&
    input.eventPresencesThisMonth === 0
  ) {
    return "paused";
  }
  return "active";
}

function statusBadgeLabel(status: MemberStatus, vipStatusLabel: string | undefined): string {
  if (status === "vip") return vipStatusLabel || "Membre VIP du mois";
  if (status === "newcomer") return "Nouveau membre";
  if (status === "paused") return "Membre — en pause";
  if (status === "staff") return "Équipe TENF";
  return "Membre TENF";
}

function profileStatusLabelOf(status?: string): string {
  if (status === "valide") return "Profil validé";
  if (status === "en_cours_examen") return "Profil en cours de validation";
  return "Profil à compléter";
}

// ============================================================
// Raids : résolution unifiée (overview vs data-v2)
// ============================================================
/**
 * Le nombre de raids du mois peut venir de deux sources :
 *  - `overview.stats.raidsThisMonth` côté serveur (compte agrégé)
 *  - `raidsFromDataV2` côté client (somme des entrées `raidsFaits` filtrées par twitchLogin)
 *
 * Historiquement, on prend le maximum des deux pour ne jamais sous-évaluer l'activité réelle
 * du membre quand les deux pipelines ne sont pas encore synchrones. À conserver tant qu'on n'a
 * pas unifié les deux sources côté backend.
 */
export function resolveMonthlyRaidCount(
  overviewRaids: number | undefined,
  dataV2Raids: number | undefined
): number {
  const a = Number(overviewRaids ?? 0);
  const b = Number(dataV2Raids ?? 0);
  return Math.max(a, b);
}

// ============================================================
// Actions suggérées
// ============================================================
type RawCandidate = DashboardAction & { priority: number };

function buildActionCandidates(input: {
  status: MemberStatus;
  segment: MemberSegment;
  profileCompleted: boolean;
  profilePercent: number;
  raidsRemaining: number;
  presencesRemaining: number;
  recommendedEvent: DashboardEventItem | null;
  vipActive: boolean;
}): RawCandidate[] {
  const out: RawCandidate[] = [];

  // 1) Onboarding nouveau membre
  if (input.status === "newcomer") {
    out.push({
      id: "complete-profile",
      label: "Compléter ton profil pour démarrer",
      href: "/member/profil/completer",
      detail:
        "Quelques infos suffisent pour que la communauté apprenne à te connaître.",
      tone: "primary",
      priority: 200,
    });
    out.push({
      id: "join-onboarding",
      label: "Rejoindre une réunion d'intégration",
      href: "/member/evenements",
      detail: "Le meilleur moyen de comprendre comment TENF fonctionne, en douceur.",
      tone: "support",
      priority: 160,
    });
  }

  // 2) Pause : on n'insiste pas, message doux
  if (input.status === "paused") {
    out.push({
      id: "soft-return",
      label: "Reviens à ton rythme",
      href: "/member/evenements",
      detail:
        "Un petit événement, un raid, ou juste un coucou sur Discord — fais ce qui te ressemble.",
      tone: "primary",
      priority: 180,
    });
  }

  // 3) VIP
  if (input.vipActive) {
    out.push({
      id: "vip-space",
      label: "Voir ton espace VIP du mois",
      href: "/vip",
      detail: "Statut actif : profite des avantages et de la mise en lumière.",
      tone: "primary",
      priority: 175,
    });
  }

  // 4) Profil incomplet
  if (!input.profileCompleted && input.status !== "newcomer") {
    const remaining = Math.max(0, 100 - input.profilePercent);
    out.push({
      id: "finish-profile",
      label: "Finir de compléter ton profil",
      href: "/member/profil/completer",
      detail: `Il reste environ ${remaining}% — ça aide à matcher avec d'autres streamers.`,
      tone: "support",
      priority: 150,
    });
  }

  // 5) Entraide Twitch — raids détectés automatiquement (EventSub)
  if (input.raidsRemaining > 0 && (input.status === "active" || input.status === "vip")) {
    out.push({
      id: "raid-live-support",
      label: "Soutenir un membre en live",
      href: "/lives",
      detail:
        "Les raids sont comptés automatiquement via Twitch. Passe sur un live TENF pour l'entraide — pas besoin de déclarer.",
      tone: "support",
      priority: 145,
    });
  }

  // 6) Présence
  if (input.presencesRemaining > 0 && input.status === "active") {
    out.push({
      id: "join-event",
      label: "Réserver une présence",
      href: "/member/evenements",
      detail: `${input.presencesRemaining} créneau(x) encore possibles ce mois.`,
      tone: "support",
      priority: 120,
    });
  }

  // 7) Formation (segment développement)
  if (input.segment === "development") {
    out.push({
      id: "push-formation",
      label: "Avancer sur une formation",
      href: "/member/formations",
      detail: "Un module léger peut faire débloquer la suite plus facilement.",
      tone: "support",
      priority: 110,
    });
  }

  // 8) Staff
  if (input.status === "staff") {
    out.push({
      id: "staff-shortcuts",
      label: "Ouvrir le centre staff",
      href: "/admin",
      detail: "Un coup d'œil à la modération ou l'admin quand tu peux — la famille compte sur toi.",
      tone: "primary",
      priority: 195,
    });
  }

  // 9) Fallback événement
  if (input.recommendedEvent) {
    out.push({
      id: "event-recommended",
      label: `S'inscrire à ${input.recommendedEvent.title}`,
      href: "/member/evenements",
      detail: input.recommendedEvent.category,
      tone: "soft",
      priority: 90,
    });
  }

  // 10) Fallback final
  if (out.length === 0) {
    out.push({
      id: "explore",
      label: "Explorer le planning communautaire",
      href: "/member/evenements",
      detail: "De quoi trouver une activité qui te ressemble cette semaine.",
      tone: "primary",
      priority: 60,
    });
  }

  return out;
}

// ============================================================
// Encouragement bienveillant
// ============================================================
function getTimeGreeting(): "Bonjour" | "Bonsoir" {
  const hour = new Date().getHours();
  return hour >= 18 ? "Bonsoir" : "Bonjour";
}

function staffHeartline(role: string): string {
  const r = role.toLowerCase();
  if (r.includes("fondateur")) {
    return "Tu as fait naître cette famille — et tu continues d'y mettre ton énergie, en coulisses comme en live.";
  }
  if (r.includes("admin")) {
    return "Tu fais tourner les coulisses pour que chaque membre puisse briller — merci pour ce que tu portes.";
  }
  if (r.includes("modera")) {
    return "Tu veilles sur l'ambiance pour que tout le monde se sente en sécurité ici — un travail discret, essentiel.";
  }
  return "Tu fais partie de ceux qui font vivre TENF au quotidien — la communauté te doit beaucoup.";
}

function buildActivitySentence(input: {
  participationThisMonth: number;
  presencesThisMonth: number;
  raidsLive: number;
  formationsThisMonth: number;
  latest: { title: string; type: string; date: string } | undefined;
}): string | null {
  const { participationThisMonth, presencesThisMonth, raidsLive, formationsThisMonth, latest } = input;

  if (latest) {
    const isPresence = latest.type.toLowerCase().includes("présence") || latest.type.toLowerCase().includes("presence");
    const isRaid = latest.type.toLowerCase().includes("raid");
    if (isPresence) {
      return `Tu as déjà fait vivre le collectif — ${latest.title}, c'est le genre de moment qui reste.`;
    }
    if (isRaid) {
      return "Ton dernier raid compte pour quelqu'un dans la famille — l'entraide, chez toi, ce n'est pas qu'un mot.";
    }
    return `Ta dernière trace ici, c'est ${latest.title} — et oui, ça compte vraiment.`;
  }

  if (participationThisMonth === 0) return null;

  const bits: string[] = [];
  if (presencesThisMonth > 0) {
    bits.push(
      presencesThisMonth === 1
        ? "une présence qui a réchauffé la salle"
        : `${presencesThisMonth} présences qui ont fait vibrer la communauté`,
    );
  }
  if (raidsLive > 0) {
    bits.push(raidsLive === 1 ? "un raid lancé" : `${raidsLive} raids pour soutenir les autres`);
  }
  if (formationsThisMonth > 0) {
    bits.push(
      formationsThisMonth === 1 ? "une formation validée" : `${formationsThisMonth} formations avancées`,
    );
  }

  if (bits.length === 0) {
    return "Tu as déjà commencé à bouger ce mois-ci — chaque petit geste fait vivre TENF.";
  }
  return `Ce mois, tu as déjà offert ${bits.join(", ")}. Merci pour ça.`;
}

function buildNextStepSentence(primaryAction: DashboardAction, status: MemberStatus): string | null {
  if (primaryAction.id === "explore") return null;

  if (status === "staff" && primaryAction.id === "staff-shortcuts") {
    return "Quand tu auras un créneau, un passage dans le centre staff aide toute l'équipe — et n'oublie pas de prendre soin de toi en tant que membre aussi : un live, un event, un raid, ça te ressource autant que ça nourrit la famille.";
  }
  if (primaryAction.id === "raid-live-support") {
    return "Un live membre t'attend peut-être en ce moment — un coucou suffit, le raid se compte tout seul.";
  }
  if (primaryAction.id === "profile-complete") {
    return "Ton profil, c'est ta vitrine dans la famille : quelques minutes pour le peaufiner, et les autres te trouvent plus facilement.";
  }
  if (primaryAction.id.startsWith("event")) {
    return `${primaryAction.label} — ${primaryAction.detail.charAt(0).toLowerCase()}${primaryAction.detail.slice(1)}`;
  }

  return `${primaryAction.label} : ${primaryAction.detail}`;
}

function buildPersonalizedWelcome(input: {
  firstName: string;
  memberRole: string;
  status: MemberStatus;
  monthLabel: string;
  monthDeadlineLabel: string;
  monthProgressLabel: string;
  raidsLive: number;
  raidsTarget: number;
  raidsRemaining: number;
  presencesThisMonth: number;
  presencesTarget: number;
  presencesRemaining: number;
  profilePercent: number;
  profileRemaining: number;
  participationThisMonth: number;
  formationsThisMonth: number;
  primaryAction: DashboardAction;
  nextCommunityEvent: DashboardEventItem | null;
  recentTimeline: Array<{ title: string; type: string; date: string }>;
  network: { state: "loading" | "twitch_unlinked" | "not_authenticated" | "ready"; followed: number; total: number };
  globalProgress: number;
  vipActive: boolean;
  vipLabel: string;
}): { title: string; message: string; insights: WelcomeInsight[] } {
  const {
    firstName,
    memberRole,
    status,
    monthLabel,
    monthDeadlineLabel,
    monthProgressLabel,
    raidsLive,
    raidsTarget,
    raidsRemaining,
    presencesThisMonth,
    presencesTarget,
    presencesRemaining,
    profilePercent,
    profileRemaining,
    participationThisMonth,
    formationsThisMonth,
    primaryAction,
    nextCommunityEvent,
    recentTimeline,
    network,
    globalProgress,
    vipLabel,
  } = input;

  const greeting = getTimeGreeting();
  const latest = recentTimeline[0];
  const monthShort = monthLabel.split(" ")[0] ?? monthLabel;

  let title: string;
  if (status === "newcomer") {
    title = `Bienvenue ${firstName} — la New Family t'attend`;
  } else if (status === "paused") {
    title = `${greeting} ${firstName}, ta place est toujours là`;
  } else if (status === "vip") {
    title = `${greeting} ${firstName} — tu fais briller ce mois`;
  } else if (status === "staff") {
    title = `${greeting} ${firstName}, cœur d'équipe et membre du mois`;
  } else if (raidsLive >= raidsTarget && raidsTarget > 0) {
    title = `${greeting} ${firstName} — belle énergie d'entraide`;
  } else if (participationThisMonth > 0) {
    title = `${greeting} ${firstName}, tu fais déjà la différence`;
  } else {
    title = `${greeting} ${firstName}, ce mois est à toi`;
  }

  const paragraphs: string[] = [];

  if (status === "newcomer") {
    paragraphs.push(
      `Tu viens d'entrer dans une famille de streamers qui se soutiennent vraiment — pas une course au clic. Prends le temps de regarder, de poser des questions, de participer à ce qui te parle.`,
    );
  } else if (status === "paused") {
    paragraphs.push(
      `Pas de nouvelle trace ce mois-ci, et personne ne t'en voudra. La porte reste ouverte : reviens quand tu en as envie, avant le ${monthDeadlineLabel}.`,
    );
  } else if (status === "staff") {
    paragraphs.push(staffHeartline(memberRole));
    paragraphs.push(
      `Ce tableau de bord, c'est ton espace membre pour ${monthLabel} — pas seulement tes missions d'équipe. Tes outils staff restent dans la sidebar ; ici, on parle de toi comme de quelqu'un de la famille.`,
    );
  } else if (status === "vip") {
    paragraphs.push(
      `Ce mois-ci, tu es ${vipLabel} — et ça se voit. Merci pour l'énergie que tu mets dans le collectif : ta présence donne le ton à toute la communauté.`,
    );
  } else {
    paragraphs.push(
      `On est en ${monthShort}, et chaque passage compte : un live soutenu, une soirée event, un module formation. Les repères à droite sont là pour t'orienter, pas pour te noter.`,
    );
  }

  const activitySentence = buildActivitySentence({
    participationThisMonth,
    presencesThisMonth,
    raidsLive,
    formationsThisMonth,
    latest,
  });
  if (activitySentence) {
    paragraphs.push(activitySentence);
  } else if (status !== "newcomer" && status !== "paused") {
    paragraphs.push(
      `Le mois est encore jeune — un live TENF, un event, ou un petit coucou sur Discord, et tu lances quelque chose de beau.`,
    );
  }

  if (nextCommunityEvent) {
    paragraphs.push(
      `On se retrouve bientôt : ${nextCommunityEvent.title}, ${formatDateTime(nextCommunityEvent.date)}. Ce serait top de t'y voir.`,
    );
  }

  const nextStep = buildNextStepSentence(primaryAction, status);
  if (nextStep) {
    paragraphs.push(nextStep);
  }

  const insights: WelcomeInsight[] = [];

  const reachedMatch = monthProgressLabel.match(/^(\d+)\/(\d+)/);
  const reached = reachedMatch ? Number(reachedMatch[1]) : 0;
  const totalRepères = reachedMatch ? Number(reachedMatch[2]) : 3;

  if (globalProgress >= 100 || reached >= totalRepères) {
    insights.push({
      id: "progress",
      label: "Beau mois — tes repères sont là",
      detail: `Échéance ${monthDeadlineLabel}`,
      tone: "success",
    });
  } else if (reached === 0) {
    insights.push({
      id: "progress",
      label: `Le mois démarre — ${totalRepères} repères t'attendent`,
      detail: `Tu as jusqu'au ${monthDeadlineLabel}`,
      tone: "accent",
    });
  } else {
    insights.push({
      id: "progress",
      label: `${monthProgressLabel} — tu avances`,
      detail: `Encore du temps avant le ${monthDeadlineLabel}`,
      tone: "info",
    });
  }

  if (raidsRemaining > 0) {
    insights.push({
      id: "raids",
      label:
        raidsLive === 0
          ? "Pas encore de raid ? Un live membre suffit"
          : `${raidsLive} raid${raidsLive > 1 ? "s" : ""} — encore ${raidsRemaining} si tu vises ton repère`,
      detail: "Twitch compte tout seul",
      tone: raidsLive === 0 ? "warning" : "info",
    });
  } else if (raidsTarget > 0 && raidsLive >= raidsTarget) {
    insights.push({
      id: "raids-done",
      label: "Tu as tenu ton cap côté raids",
      tone: "success",
    });
  }

  if (presencesRemaining > 0) {
    insights.push({
      id: "presences",
      label:
        presencesThisMonth === 0
          ? "Les events t'attendent — une soirée peut tout changer"
          : presencesThisMonth === 1
            ? "Tu as commencé — une présence, c'est déjà beaucoup"
            : `${presencesThisMonth} présences — la famille te voit`,
      detail:
        presencesRemaining > 0
          ? `${presencesRemaining} event${presencesRemaining > 1 ? "s" : ""} encore possibles`
          : undefined,
      tone: presencesThisMonth === 0 ? "muted" : "info",
    });
  }

  if (profileRemaining > 0 && profilePercent < 100) {
    insights.push({
      id: "profile",
      label:
        profilePercent >= 80
          ? `Ton profil raconte déjà ta chaîne — plus que ${profileRemaining} %`
          : `Complète ton profil (${profilePercent} %) — les autres te trouveront mieux`,
      tone: profilePercent >= 80 ? "info" : "warning",
    });
  }

  if (network.state === "ready" && network.total > 0 && network.followed < network.total * 0.3) {
    insights.push({
      id: "network",
      label: "Découvre d'autres chaînes membres à soutenir",
      detail: `${network.followed}/${network.total} suivies pour l'instant`,
      tone: "muted",
    });
  }

  if (primaryAction.id === "staff-shortcuts") {
    insights.push({
      id: "next",
      label: "→ Un passage au centre staff ?",
      detail: "La modération et l'admin comptent sur toi — quand tu peux",
      tone: "accent",
    });
  } else if (primaryAction.id !== "explore") {
    insights.push({
      id: "next",
      label: `→ ${primaryAction.label}`,
      detail: primaryAction.detail,
      tone: "accent",
    });
  }

  return {
    title,
    message: paragraphs.join(" "),
    insights: insights.slice(0, 4),
  };
}

function getEncouragement(progress: number, status: MemberStatus): string {
  if (status === "newcomer") {
    return "Bienvenue dans la New Family — tu avances à ton rythme, sans pression.";
  }
  if (status === "paused") {
    return "Reviens quand tu veux : ta place est gardée, et la famille est là.";
  }
  if (progress >= 100) {
    if (status === "vip") return "Mois rempli, merci pour l'énergie que tu mets dans le collectif.";
    return "Belle régularité ce mois-ci — continue comme tu l'entends.";
  }
  if (progress >= 70) return "Tu avances bien : une action de temps en temps suffit largement.";
  if (progress >= 40) return "La dynamique est là — la communauté vit aussi grâce à tes passages.";
  return "Le mois est encore ouvert : ces repères sont là pour t'orienter, pas pour te noter.";
}

// ============================================================
// Builder principal
// ============================================================
export function buildMemberDashboardModel(input: {
  data: MemberOverview;
  goals: MemberMonthlyGoals;
  followStats: FollowStats;
  dataV2RaidsThisMonth: number;
  recentRaids?: RecentRaidEntry[];
}): MemberDashboardModel {
  const { data, goals, followStats, dataV2RaidsThisMonth, recentRaids = [] } = input;

  const monthKey = data.monthKey;
  const monthLabel = formatMonthLong(monthKey);
  const monthDeadlineLabel = formatMonthDeadline(monthKey);
  const monthShortLabel = formatMonthShort(monthKey);

  const displayName = data.member.displayName || data.member.twitchLogin;
  const firstName = displayName.split(" ")[0] || "membre";

  const vipActive = Boolean(data.vip?.activeThisMonth);
  const raidsLivePreview = resolveMonthlyRaidCount(data.stats?.raidsThisMonth, dataV2RaidsThisMonth);
  const presencesThisMonthPreview = data.stats?.eventPresencesThisMonth ?? 0;

  const status = resolveMemberStatus({
    role: data.member.role,
    vipActive,
    onboardingStatus: data.member.onboardingStatus,
    participationThisMonth: data.stats?.participationThisMonth ?? 0,
    raidsThisMonth: raidsLivePreview,
    eventPresencesThisMonth: presencesThisMonthPreview,
  });
  const segment = resolveSegment(data.member.role, vipActive);
  const accent = resolveAccentFromStatus(data.member.role, status);

  // Indicateurs du mois
  const raidsLive = resolveMonthlyRaidCount(data.stats?.raidsThisMonth, dataV2RaidsThisMonth);
  const presencesThisMonth = data.stats?.eventPresencesThisMonth ?? 0;
  const profilePercent = data.profile?.percent ?? 0;
  const raidsTarget = goals.raids;
  const presencesTarget = goals.events;

  const raidsRemaining = Math.max(0, raidsTarget - raidsLive);
  const presencesRemaining = Math.max(0, presencesTarget - presencesThisMonth);
  const profileRemaining = Math.max(0, 100 - profilePercent);

  const networkState: MemberDashboardModel["network"]["state"] = followStats.loading
    ? "loading"
    : !followStats.authenticated
    ? "not_authenticated"
    : !followStats.linked
    ? "twitch_unlinked"
    : "ready";

  const allMonthIndicators: MonthIndicator[] = [
    {
      id: "raids",
      label: "Raids lancés",
      hint: "Comptés auto via Twitch",
      current: raidsLive,
      target: raidsTarget,
      microHint:
        raidsRemaining === 0
          ? "Repère atteint — bravo si tu le visais."
          : `${raidsRemaining} raid(s) avant ton repère — passe sur un live TENF.`,
      href: "/member/raids/historique",
    },
    {
      id: "presences",
      label: "Présences events",
      hint: "Événements TENF ce mois",
      current: presencesThisMonth,
      target: presencesTarget,
      microHint:
        presencesRemaining === 0
          ? "Tu es très présent·e ce mois, merci !"
          : `${presencesRemaining} créneau(x) encore possibles.`,
      href: "/member/evenements",
    },
    {
      id: "profile",
      label: "Profil complété",
      hint: "Visible dans l'annuaire",
      current: profilePercent,
      target: 100,
      microHint:
        profileRemaining === 0
          ? "Profil complet — parfait."
          : `Encore ${profileRemaining}% à remplir, à ton rythme.`,
      href: "/member/profil/completer",
    },
  ];

  const monthIndicators = allMonthIndicators.filter(
    (indicator) => indicator.id !== "profile" || profilePercent < 100,
  );

  const raidsProgress = getProgressPercent(raidsLive, raidsTarget);
  const presencesProgress = getProgressPercent(presencesThisMonth, presencesTarget);
  const profileProgress = Math.max(0, Math.min(100, profilePercent));
  const progressParts = [raidsProgress, presencesProgress];
  if (profilePercent < 100) progressParts.push(profileProgress);
  const globalProgress = Math.round(
    progressParts.reduce((sum, value) => sum + value, 0) / Math.max(progressParts.length, 1),
  );
  const reachedCount = progressParts.filter((value) => value >= 100).length;
  const monthProgressLabel = `${reachedCount}/${progressParts.length} repère${progressParts.length > 1 ? "s" : ""} atteint${reachedCount > 1 ? "s" : ""}`;

  const encouragement = getEncouragement(globalProgress, status);

  // Events
  const upcomingEvents = (data.upcomingEvents || []).slice(0, 3).map(toDashboardEvent);
  const onboardingEvent =
    upcomingEvents.find((ev) => ev.bucket === "onboarding") || null;
  const nextCommunityEvent =
    upcomingEvents.find((ev) => ev.bucket === "community") ||
    upcomingEvents.find((ev) => ev.bucket !== "onboarding") ||
    null;

  // Actions
  const candidates = buildActionCandidates({
    status,
    segment,
    profileCompleted: data.profile?.completed ?? false,
    profilePercent,
    raidsRemaining,
    presencesRemaining,
    recommendedEvent:
      onboardingEvent && status === "newcomer" ? onboardingEvent : nextCommunityEvent,
    vipActive,
  }).sort((a, b) => b.priority - a.priority);

  const primaryAction = candidates[0]!;
  const secondaryActions = candidates
    .slice(1)
    .filter((c) => c.id !== primaryAction.id)
    .slice(0, 2)
    .map(({ priority: _priority, ...rest }) => rest);

  // Banner de bienvenue contextuel (newcomer / paused)
  let welcomeBanner: MemberDashboardModel["welcomeBanner"] = null;
  if (status === "newcomer") {
    welcomeBanner = {
      title: "Premier pas dans la New Family",
      description:
        "Tu peux explorer librement. Une réunion d'intégration t'aidera à comprendre comment ça vit ici — pense à t'inscrire quand tu peux.",
      cta: {
        id: "onboarding-link",
        label: "Voir les sessions d'intégration",
        href: "/member/evenements",
        detail: "Réunions d'accueil ouvertes à tou·te·s les nouveaux membres.",
        tone: "primary",
      },
    };
  } else if (status === "paused") {
    welcomeBanner = {
      title: "Content de te revoir",
      description:
        "Rien n'a changé : la famille est toujours là. Reprends quand tu veux, sans pression.",
      cta: {
        id: "soft-return-banner",
        label: "Explorer les prochains rendez-vous",
        href: "/member/evenements",
        detail: "Un événement, un raid, ou juste un coucou.",
        tone: "primary",
      },
    };
  }

  // Historique récent (raids auto + formations + présences)
  const recentTimeline = [
    ...recentRaids.map((raid, index) => ({
      id: `raid-${raid.targetLogin}-${raid.date}-${index}`,
      date: raid.date,
      title: `Raid vers ${raid.targetDisplayName || raid.targetLogin}`,
      type: `Raid · ${raid.count} viewer${raid.count > 1 ? "s" : ""}`,
      color: "rgba(167, 139, 250, 0.28)",
    })),
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

  const formationsThisMonth =
    data.stats?.formationsValidatedThisMonth ??
    data.formationHistory.filter((item) => (item.date ?? "").slice(0, 7) === monthKey).length;

  const participationThisMonth = data.stats?.participationThisMonth ?? 0;
  const showRecognitionStats =
    vipActive || formationsThisMonth > 0 || participationThisMonth > 0;

  const welcomeKicker = `Tableau de bord · ${monthShortLabel}`;

  const personalizedWelcome = buildPersonalizedWelcome({
    firstName,
    memberRole: String(data.member.role || "membre"),
    status,
    monthLabel,
    monthDeadlineLabel,
    monthProgressLabel,
    raidsLive,
    raidsTarget,
    raidsRemaining,
    presencesThisMonth,
    presencesTarget,
    presencesRemaining,
    profilePercent,
    profileRemaining,
    participationThisMonth,
    formationsThisMonth,
    primaryAction,
    nextCommunityEvent,
    recentTimeline,
    network: {
      state: networkState,
      followed: followStats.followed,
      total: followStats.total,
    },
    globalProgress,
    vipActive,
    vipLabel: data.vip?.statusLabel || "Membre VIP",
  });

  const welcomeTitle = personalizedWelcome.title;
  const welcomeMessage = personalizedWelcome.message;
  const welcomeInsights = personalizedWelcome.insights;

  // CTA flottant : on l'active uniquement si l'action principale est "ciblée" (pas un fallback
  // type "explore"), et pas non plus pour staff qui n'en a pas besoin.
  const fallbackActionIds = new Set(["explore", "event-recommended"]);
  const showFloatingCta =
    status !== "staff" && !fallbackActionIds.has(primaryAction.id);

  return {
    firstName,
    displayName,
    monthKey,
    monthLabel,
    monthDeadlineLabel,
    status,
    segment,
    accent,
    statusBadge: statusBadgeLabel(status, data.vip?.statusLabel),
    profileStatusLabel: profileStatusLabelOf(data.member.profileValidationStatus),

    welcomeKicker,
    welcomeTitle,
    welcomeMessage,
    welcomeInsights,
    welcomeBanner,

    primaryAction: { ...primaryAction },
    secondaryActions,
    showFloatingCta,

    monthIndicators,
    globalProgress,
    monthProgressLabel,
    encouragement,

    network: {
      state: networkState,
      followed: followStats.followed,
      total: followStats.total,
      score: followStats.score,
    },

    meetings: {
      integrationDateLabel: data.member.integrationDate
        ? new Date(data.member.integrationDate).toLocaleDateString("fr-FR")
        : "Pas encore planifiée",
      isIntegrationDone: Boolean(data.member.integrationDate),
      onboardingEvent,
      nextCommunityEvent,
    },

    upcomingEvents,

    recognition: {
      participationThisMonth,
      formationsThisMonth,
      vipActive,
      vipLabel: data.vip?.statusLabel || "Membre TENF",
    },

    showRecognitionStats,
    recentTimeline,
  };
}

// ============================================================
// Helpers de couleur — utilisés par les composants visuels
// ============================================================
export function hexToRgba(hex: string, alpha: number): string {
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
  if (![r, g, b].every((n) => Number.isFinite(n))) {
    return `rgba(34, 211, 238, ${alpha})`;
  }
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" });
}

export function formatDate(value: string | null): string {
  if (!value) return "Non planifiée";
  return new Date(value).toLocaleDateString("fr-FR");
}

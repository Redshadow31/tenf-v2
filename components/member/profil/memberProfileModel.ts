import type { MemberOverview } from "@/components/member/hooks/useMemberOverview";
import { hexToRgba, type WelcomeInsight } from "@/components/member/dashboard/memberDashboardModel";

export type ProfileChecklistItem = {
  id: string;
  label: string;
  status: "ok" | "warning" | "missing";
  href?: string;
};

export type ProfilePrimaryAction = {
  id: string;
  label: string;
  href: string;
  detail: string;
};

export type ProfileQuickAction = {
  label: string;
  href?: string;
  soon?: boolean;
};

export type MemberProfileModel = {
  accent: string;
  firstName: string;
  displayName: string;
  twitchLogin: string;
  role: string;
  avatar: string;
  profilePercent: number;
  validationLabel: string;
  validationTone: "success" | "warning" | "neutral";
  validationStatus: string;
  vipLabel: string;
  vipActive: boolean;
  integrationDone: boolean;
  integrationDateLabel: string;
  upcomingLives: number;
  hasPublicProfileLink: boolean;
  publicProfileHref: string;
  livePlanningHref: string;
  needsOnboarding: boolean;
  welcomeKicker: string;
  welcomeTitle: string;
  welcomeMessage: string;
  welcomeInsights: WelcomeInsight[];
  primaryAction: ProfilePrimaryAction;
  checklist: ProfileChecklistItem[];
  checklistSummary: string;
  activityHeadline: string;
  activitySubline: string;
  twitchConnected: boolean;
  nextPlanningLabel: string;
  quickActions: ProfileQuickAction[];
};

type ProfileMember = {
  displayName: string;
  twitchLogin: string;
  avatar: string;
  role: string;
  bio: string;
  profileValidationStatus: string;
  socials: {
    twitch: string;
    discord: string;
    instagram: string;
    tiktok: string;
    twitter: string;
  };
  tenfSummary: {
    integration: { integrated: boolean; date: string | null };
  };
};

function getFirstName(displayName: string, twitchLogin: string): string {
  const raw = displayName?.trim() || twitchLogin?.trim() || "toi";
  const first = raw.split(/\s+/)[0] || raw;
  return first.charAt(0).toUpperCase() + first.slice(1);
}

function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Bonjour";
  if (hour < 18) return "Bon après-midi";
  return "Bonsoir";
}

function formatDateFr(value?: string | null): string {
  if (!value) return "Non renseignée";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Non renseignée";
  return date.toLocaleDateString("fr-FR");
}

function resolveAccent(input: {
  vipActive: boolean;
  needsOnboarding: boolean;
  profilePercent: number;
  validationStatus: string;
}): string {
  if (input.vipActive) return "#facc15";
  if (input.needsOnboarding) return "#f59e0b";
  if (input.validationStatus === "valide") return "#22c55e";
  if (input.profilePercent >= 80) return "#a78bfa";
  return "#9146ff";
}

function buildChecklist(member: ProfileMember, planningCount: number): ProfileChecklistItem[] {
  const m = member;
  return [
    { id: "avatar", label: "Avatar", status: m.avatar ? "ok" : "missing", href: "/member/profil/completer" },
    { id: "bio", label: "Bio", status: m.bio ? "ok" : "warning", href: "/member/profil/completer" },
    { id: "twitch", label: "Lien Twitch", status: m.socials.twitch ? "ok" : "missing", href: "/member/profil/completer" },
    {
      id: "socials",
      label: "Réseaux sociaux",
      status: m.socials.instagram || m.socials.tiktok || m.socials.twitter ? "ok" : "warning",
      href: "/member/profil/completer",
    },
    {
      id: "planning",
      label: "Planning live",
      status: planningCount > 0 ? "ok" : "warning",
      href: "/member/planning",
    },
    {
      id: "validation",
      label: "Profil validé",
      status: m.profileValidationStatus === "valide" ? "ok" : "warning",
      href: "/member/profil/completer",
    },
  ];
}

function resolvePrimaryAction(input: {
  profilePercent: number;
  twitchConnected: boolean;
  planningCount: number;
  validationStatus: string;
  needsOnboarding: boolean;
}): ProfilePrimaryAction {
  if (!input.twitchConnected) {
    return {
      id: "link-twitch",
      label: "Relier ton compte Twitch",
      href: "/member/profil#twitch-connection",
      detail: "C'est la clé pour le planning, les raids auto et ta fiche publique.",
    };
  }
  if (input.needsOnboarding || input.profilePercent < 60) {
    return {
      id: "complete-profile",
      label: "Compléter ton profil",
      href: "/member/profil/completer",
      detail: "Avatar, bio, réseaux — quelques minutes pour que la communauté te reconnaisse.",
    };
  }
  if (input.planningCount === 0) {
    return {
      id: "add-planning",
      label: "Ajouter un créneau live",
      href: "/member/planning",
      detail: "Dis à la famille quand tu stream — même une intention simple aide tout le monde.",
    };
  }
  if (input.validationStatus === "en_cours_examen") {
    return {
      id: "wait-validation",
      label: "Modifs en cours de relecture",
      href: "/member/profil#validation",
      detail: "Le staff relit ta fiche — tu peux continuer à peaufiner si besoin.",
    };
  }
  if (input.profilePercent < 100) {
    return {
      id: "polish-profile",
      label: "Peaufiner ta vitrine",
      href: "/member/profil/completer",
      detail: "Tu y es presque — un dernier coup de polish et ta fiche brille.",
    };
  }
  return {
    id: "public-profile",
    label: "Voir ta fiche publique",
    href: "/membres",
    detail: "Ton profil est prêt — partage-le ou reviens le mettre à jour quand tu veux.",
  };
}

function buildProfileWelcome(input: {
  firstName: string;
  role: string;
  profilePercent: number;
  validationStatus: string;
  validationLabel: string;
  twitchConnected: boolean;
  planningCount: number;
  integrationDone: boolean;
  vipActive: boolean;
  vipLabel: string;
  needsOnboarding: boolean;
  primaryAction: ProfilePrimaryAction;
  raidsThisMonth: number;
  presencesThisMonth: number;
}): { kicker: string; title: string; message: string; insights: WelcomeInsight[] } {
  const greeting = getTimeGreeting();
  const { firstName, profilePercent, primaryAction } = input;

  let title: string;
  if (input.needsOnboarding) {
    title = `Bienvenue ${firstName} — ta vitrine commence ici`;
  } else if (input.vipActive) {
    title = `${greeting} ${firstName} — ta lumière ce mois-ci`;
  } else if (profilePercent >= 100 && input.validationStatus === "valide") {
    title = `${greeting} ${firstName} — profil au top`;
  } else if (profilePercent >= 70) {
    title = `${greeting} ${firstName} — presque parfait`;
  } else if (!input.twitchConnected) {
    title = `${greeting} ${firstName} — une étape pour débloquer tout`;
  } else {
    title = `${greeting} ${firstName} — construis ta présence TENF`;
  }

  const paragraphs: string[] = [];

  if (input.needsOnboarding) {
    paragraphs.push(
      `Ton profil, c'est ta carte de visite dans la New Family. Pas besoin de tout remplir d'un coup — chaque bloc complété rapproche ta fiche du « tout vert » et aide le staff à te valider après l'intégration.`,
    );
  } else if (input.vipActive) {
    paragraphs.push(
      `Tu es ${input.vipLabel} ce mois-ci — et ça se voit aussi sur ta fiche. Garde-la à jour : c'est ce que les autres voient quand ils veulent te découvrir ou te soutenir en live.`,
    );
  } else if (profilePercent >= 100) {
    paragraphs.push(
      `Ta vitrine est solide. Les membres peuvent te retrouver, te suivre, et planifier un raid vers toi. Continue à actualiser ton planning quand tu changes de rythme.`,
    );
  } else {
    paragraphs.push(
      `Ici, tu gères tout ce qui te représente : identité, bio, réseaux, planning. Ce n'est pas une note — c'est pour que la communauté sache qui tu es et quand passer te dire bonjour.`,
    );
  }

  if (!input.twitchConnected) {
    paragraphs.push(
      `Sans lien Twitch, une partie des outils reste en veille — raids auto, planning synchronisé, fiche publique. Une connexion OAuth et c'est réglé.`,
    );
  } else if (input.planningCount === 0) {
    paragraphs.push(
      `Tu n'as pas encore de créneau live renseigné. Même une intention simple aide les autres à te retrouver — et les raids à tomber au bon moment.`,
    );
  } else if (input.validationStatus === "en_cours_examen") {
    paragraphs.push(
      `Tes dernières modifications sont en relecture staff. Pas d'inquiétude : tu peux continuer à ajuster pendant ce temps.`,
    );
  }

  if (input.raidsThisMonth > 0 || input.presencesThisMonth > 0) {
    const bits: string[] = [];
    if (input.raidsThisMonth > 0) bits.push(`${input.raidsThisMonth} raid${input.raidsThisMonth > 1 ? "s" : ""}`);
    if (input.presencesThisMonth > 0) {
      bits.push(`${input.presencesThisMonth} présence${input.presencesThisMonth > 1 ? "s" : ""}`);
    }
    paragraphs.push(`Ce mois, tu as déjà ${bits.join(" et ")} — ta fiche reflète quelqu'un qui bouge.`);
  }

  if (primaryAction.id !== "wait-validation" && primaryAction.id !== "public-profile") {
    paragraphs.push(`${primaryAction.label} : ${primaryAction.detail}`);
  }

  const insights: WelcomeInsight[] = [];

  insights.push({
    id: "completion",
    label:
      profilePercent >= 100
        ? "Profil complet"
        : profilePercent >= 70
          ? `${profilePercent}% — encore un peu`
          : `${profilePercent}% complété`,
    detail: profilePercent >= 100 ? "Tout est en place" : "Checklist à droite",
    tone: profilePercent >= 100 ? "success" : profilePercent >= 50 ? "info" : "warning",
  });

  insights.push({
    id: "validation",
    label: input.validationLabel,
    tone:
      input.validationStatus === "valide"
        ? "success"
        : input.validationStatus === "en_cours_examen"
          ? "warning"
          : "muted",
  });

  if (!input.twitchConnected) {
    insights.push({
      id: "twitch",
      label: "Twitch non relié",
      detail: "OAuth requis",
      tone: "warning",
    });
  } else {
    insights.push({
      id: "twitch",
      label: "Twitch relié",
      tone: "success",
    });
  }

  if (input.planningCount === 0) {
    insights.push({
      id: "planning",
      label: "Aucun live planifié",
      detail: "Ajoute un créneau",
      tone: "warning",
    });
  } else {
    insights.push({
      id: "planning",
      label: `${input.planningCount} live${input.planningCount > 1 ? "s" : ""} à venir`,
      tone: "info",
    });
  }

  if (!input.integrationDone && input.needsOnboarding) {
    insights.push({
      id: "integration",
      label: "Intégration à planifier",
      tone: "accent",
    });
  }

  return {
    kicker: input.needsOnboarding ? "Nouveau membre" : "Mon espace créateur",
    title,
    message: paragraphs.join(" "),
    insights,
  };
}

export function buildMemberProfileModel(input: {
  member: ProfileMember;
  overview: MemberOverview | null;
  planningCount: number;
  upcomingLives: number;
  nextPlanning: { date: string; time: string } | null;
  twitchConnected: boolean;
  needsOnboarding: boolean;
  hasPublicProfileLink: boolean;
  publicProfileHref: string;
  livePlanningHref: string;
}): MemberProfileModel {
  const { member, overview } = input;
  const profilePercent = overview?.profile?.percent ?? 0;
  const vip = overview?.vip;
  const vipActive = !!vip?.activeThisMonth;
  const vipLabel = vipActive
    ? "VIP TENF actif ce mois-ci"
    : vip
      ? "VIP TENF — pas ce mois-ci"
      : "VIP — indisponible";

  const validationStatus = member.profileValidationStatus;
  const validationLabel =
    validationStatus === "valide"
      ? "Profil valide par le staff"
      : validationStatus === "en_cours_examen"
        ? "Modifications en attente"
        : "Informations à compléter";
  const validationTone: "success" | "warning" | "neutral" =
    validationStatus === "valide"
      ? "success"
      : validationStatus === "en_cours_examen"
        ? "warning"
        : "neutral";

  const accent = resolveAccent({
    vipActive,
    needsOnboarding: input.needsOnboarding,
    profilePercent,
    validationStatus,
  });

  const checklist = buildChecklist(member, input.planningCount);
  const checklistDone = checklist.filter((i) => i.status === "ok").length;
  const checklistSummary = `${checklistDone}/${checklist.length} points OK`;

  const primaryAction = resolvePrimaryAction({
    profilePercent,
    twitchConnected: input.twitchConnected,
    planningCount: input.planningCount,
    validationStatus,
    needsOnboarding: input.needsOnboarding,
  });

  const welcome = buildProfileWelcome({
    firstName: getFirstName(member.displayName, member.twitchLogin),
    role: member.role,
    profilePercent,
    validationStatus,
    validationLabel,
    twitchConnected: input.twitchConnected,
    planningCount: input.planningCount,
    integrationDone: member.tenfSummary.integration.integrated,
    vipActive,
    vipLabel,
    needsOnboarding: input.needsOnboarding,
    primaryAction,
    raidsThisMonth: overview?.stats?.raidsThisMonth ?? 0,
    presencesThisMonth: overview?.stats?.eventPresencesThisMonth ?? 0,
  });

  const nextPlanningLabel = input.nextPlanning
    ? `${new Date(input.nextPlanning.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })} · ${input.nextPlanning.time}`
    : "—";

  const quickActions: ProfileQuickAction[] = [
    { label: "Compléter mon profil", href: "/member/profil/completer" },
    { label: "Modifier mon planning", href: input.livePlanningHref },
    input.hasPublicProfileLink
      ? { label: "Voir ma fiche publique", href: input.publicProfileHref }
      : { label: "Voir ma fiche publique", soon: true },
    { label: "Voir les lives TENF", href: "/lives" },
    { label: "Voir mes formations", href: "/member/formations/validees" },
    { label: "Voir mon activité", href: "/member/activite" },
  ];

  let activityHeadline = "Ta présence dans la famille";
  let activitySubline = "Raids, events, formations — ce que tu as déjà donné ce mois.";
  if ((overview?.stats?.raidsThisMonth ?? 0) === 0 && (overview?.stats?.eventPresencesThisMonth ?? 0) === 0) {
    activitySubline = "Pas encore de trace ce mois — un live ou un event et ça démarre.";
  }

  return {
    accent,
    firstName: getFirstName(member.displayName, member.twitchLogin),
    displayName: member.displayName,
    twitchLogin: member.twitchLogin,
    role: member.role,
    avatar: member.avatar,
    profilePercent,
    validationLabel,
    validationTone,
    validationStatus,
    vipLabel,
    vipActive,
    integrationDone: member.tenfSummary.integration.integrated,
    integrationDateLabel: formatDateFr(member.tenfSummary.integration.date),
    upcomingLives: input.upcomingLives,
    hasPublicProfileLink: input.hasPublicProfileLink,
    publicProfileHref: input.publicProfileHref,
    livePlanningHref: input.livePlanningHref,
    needsOnboarding: input.needsOnboarding,
    welcomeKicker: welcome.kicker,
    welcomeTitle: welcome.title,
    welcomeMessage: welcome.message,
    welcomeInsights: welcome.insights,
    primaryAction,
    checklist,
    checklistSummary,
    activityHeadline,
    activitySubline,
    twitchConnected: input.twitchConnected,
    nextPlanningLabel,
    quickActions,
  };
}

export { hexToRgba };

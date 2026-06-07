import type { MemberOverview } from "@/components/member/hooks/useMemberOverview";
import type { WelcomeInsight } from "@/components/member/dashboard/memberDashboardModel";
import { LONG_BACKLOG, VERY_LONG_BACKLOG } from "@/components/member/engagement/discover/discoverUtils";

export type DiscoverMemberStatus = "newcomer" | "active" | "paused" | "staff" | "vip";

export type DiscoverContext = {
  firstName: string;
  displayName: string;
  twitchLogin: string;
  status: DiscoverMemberStatus;
  roleLabel: string;
  isAffiliate: boolean;
  isDevelopment: boolean;
};

export type DiscoverHeroModel = {
  welcomeKicker: string;
  welcomeTitle: string;
  welcomeMessage: string;
  welcomeInsights: WelcomeInsight[];
  countBadge: string;
};

export type DiscoverGuidanceModel = {
  panelTitle: string;
  cardA: { title: string; body: string };
  cardB: { title: string; body: string };
  tips: string[];
  tipsToggleLabel: string;
};

export type DiscoverEmptyModel = {
  title: string;
  body: string;
};

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

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

/** Fil conducteur : follow optionnel, porte vers la découverte mutuelle. */
export function followDoorSentence(variant: "short" | "full" = "full"): string {
  if (variant === "short") {
    return "Le follow n'est pas une obligation — c'est une porte que tu peux ouvrir pour découvrir les autres, ou pour qu'on te découvre quand tu stream.";
  }
  return "Suivre quelqu'un n'est jamais un devoir : c'est une porte que tu choisis d'ouvrir — pour explorer d'autres chaînes à ton rythme, et pour qu'on te repère plus facilement à ton tour quand tu es en live.";
}

export function resolveDiscoverContext(overview: MemberOverview | null | undefined): DiscoverContext {
  const displayName = overview?.member.displayName || overview?.member.twitchLogin || "Membre TENF";
  const twitchLogin = overview?.member.twitchLogin || "";
  const firstName = getFirstName(displayName, twitchLogin);
  const roleRaw = overview?.member.role || "";
  const roleNorm = normalizeText(roleRaw);
  const vipActive = overview?.vip?.activeThisMonth === true;
  const onboarding = normalizeText(overview?.member.onboardingStatus || "");
  const participation = overview?.stats.participationThisMonth ?? 0;
  const raids = overview?.stats.raidsThisMonth ?? 0;
  const presences = overview?.stats.eventPresencesThisMonth ?? 0;

  let status: DiscoverMemberStatus = "active";
  if (roleNorm.includes("admin") || roleNorm.includes("fondateur") || roleNorm.includes("modera") || roleNorm.includes("staff")) {
    status = "staff";
  } else if (vipActive) {
    status = "vip";
  } else if (roleNorm.includes("nouveau") || onboarding === "a_faire" || onboarding === "en_cours") {
    status = "newcomer";
  } else if (participation === 0 && raids === 0 && presences === 0) {
    status = "paused";
  }

  let roleLabel = "Membre TENF";
  if (status === "staff") roleLabel = roleRaw.trim() || "Équipe TENF";
  else if (status === "vip") roleLabel = overview?.vip?.statusLabel || "Membre VIP du mois";
  else if (status === "newcomer") roleLabel = "Nouveau membre";
  else if (status === "paused") roleLabel = "Membre TENF";
  else if (roleNorm.includes("affilie")) roleLabel = "Membre affilié·e";
  else if (roleNorm.includes("developpement")) roleLabel = "Membre développement";
  else if (roleRaw.trim()) roleLabel = roleRaw.trim();

  return {
    firstName,
    displayName,
    twitchLogin,
    status,
    roleLabel,
    isAffiliate: roleNorm.includes("affilie"),
    isDevelopment: roleNorm.includes("developpement"),
  };
}

function buildFollowInsight(): WelcomeInsight {
  return {
    id: "follow-door",
    label: "Follow = porte ouverte",
    detail: "Optionnel · découvrir & te faire découvrir",
    tone: "info",
  };
}

function buildRoleInsight(ctx: DiscoverContext): WelcomeInsight {
  return {
    id: "role",
    label: ctx.roleLabel,
    detail: ctx.status === "staff" ? "Exemple sans pression" : "Ton profil TENF",
    tone: ctx.status === "vip" ? "success" : ctx.status === "staff" ? "accent" : "muted",
  };
}

export function buildDiscoverHeroModel(input: {
  ctx: DiscoverContext;
  totalPending: number;
  filteredCount: number;
  membersTotal: number;
}): DiscoverHeroModel {
  const { ctx, totalPending, filteredCount, membersTotal } = input;
  const { firstName, status } = ctx;
  const greeting = getTimeGreeting();
  const isLongBacklog = totalPending >= LONG_BACKLOG;
  const isVeryLongBacklog = totalPending >= VERY_LONG_BACKLOG;

  let welcomeTitle: string;

  if (totalPending === 0) {
    if (status === "newcomer") {
      welcomeTitle = `${greeting} ${firstName} — ta curiosité est déjà bien lancée`;
    } else if (status === "staff") {
      welcomeTitle = `${greeting} ${firstName}, ton radar est à jour côté follows`;
    } else if (status === "vip") {
      welcomeTitle = `${greeting} ${firstName} — belle visibilité, dans les deux sens`;
    } else if (status === "paused") {
      welcomeTitle = `${greeting} ${firstName}, tu es à jour — sans rien forcer`;
    } else {
      welcomeTitle = `${greeting} ${firstName} — ton radar est à jour`;
    }
  } else if (isVeryLongBacklog) {
    welcomeTitle =
      status === "newcomer"
        ? `${greeting} ${firstName} — beaucoup de portes possibles, une à la fois`
        : `${greeting} ${firstName}, un large catalogue sans corvée`;
  } else if (isLongBacklog) {
    welcomeTitle = `${greeting} ${firstName}, ${totalPending} pistes — à ton rythme`;
  } else if (filteredCount !== totalPending) {
    welcomeTitle = `${greeting} ${firstName}, ${filteredCount} profil${filteredCount > 1 ? "s" : ""} avec tes filtres`;
  } else {
    welcomeTitle = `${greeting} ${firstName}, ${totalPending} chaîne${totalPending > 1 ? "s" : ""} à explorer`;
  }

  const paragraphs: string[] = [];
  const door = followDoorSentence("full");

  if (totalPending === 0) {
    if (status === "newcomer") {
      paragraphs.push(
        `${firstName}, tu sembles déjà suivre tout le monde dans ce radar — c'est un bon départ.`,
        `${door} Repasse ici quand tu veux : de nouveaux membres arrivent, et ton planning / tes lives aident aussi les autres à te trouver.`,
      );
    } else if (status === "staff") {
      paragraphs.push(
        `Côté follows TENF, tu es à jour ${firstName}.`,
        `${door} Même pour l'équipe : montrer l'exemple, c'est ouvrir des portes sans imposer quoi que ce soit — aux autres comme à toi quand tu stream.`,
      );
    } else if (status === "paused") {
      paragraphs.push(
        `Pas de nouvelle piste à suivre pour l'instant — et c'est ok ${firstName}.`,
        `${door} Quand tu reviendras en live ou sur /lives, la communauté pourra te redécouvrir tout aussi naturellement.`,
      );
    } else {
      paragraphs.push(
        `Tu sembles déjà suivre tout le monde dans ce radar ${firstName} — merci pour ta curiosité.`,
        `${door} La famille bouge : repasse de temps en temps, ou laisse les autres te trouver via ton profil et tes créneaux.`,
      );
    }
  } else if (isVeryLongBacklog || isLongBacklog) {
    if (status === "newcomer") {
      paragraphs.push(
        `${firstName}, afficher ${totalPending} chaînes au début, c'est normal — la New Family est grande, pas un retard à rattraper.`,
        `${door} Ouvre une porte quand un contenu te parle ; ignore le reste sans culpabiliser. Les autres peuvent aussi te découvrir quand tu seras en live.`,
      );
    } else if (status === "staff") {
      paragraphs.push(
        `${totalPending} pistes visibles pour toi ${firstName} — pense catalogue, pas quota d'équipe.`,
        `${door} Tu peux montrer l'exemple en suivant avec intention, sans pousser personne à tout cocher. Ta propre visibilité passe aussi par ton live et ton profil.`,
      );
    } else {
      paragraphs.push(
        `${totalPending} pistes, ${firstName} — ce n'est ni un échec ni une course.`,
        `${door} Une chaîne quand tu en as envie suffit. Et de ton côté, streamer ou compléter ton profil, c'est autant de portes ouvertes vers toi.`,
      );
    }
  } else {
    if (status === "newcomer") {
      paragraphs.push(
        `${firstName}, voici des membres TENF que ton Twitch ne suit pas encore — commence par ce qui te ressemble.`,
        `${door} Regarde, lurke, reviens plus tard : le follow n'est qu'une option quand tu sens la connexion. Toi aussi, tu seras visible quand tu prendras la parole en live.`,
      );
    } else if (status === "vip") {
      paragraphs.push(
        `${firstName}, tu fais déjà briller la commu — voici des chaînes que tu ne suis pas encore.`,
        `${door} Choisis avec cœur, pas par obligation. Ton énergie attire des regards ; laisser des portes ouvertes, c'est aussi permettre à d'autres de te découvrir.`,
      );
    } else if (ctx.isAffiliate || ctx.isDevelopment) {
      paragraphs.push(
        `En tant que ${ctx.roleLabel.toLowerCase()}, ${firstName}, tu connais la visibilité — voici des collègues de stream pas encore dans tes follows.`,
        `${door} Soutiens ceux qui te parlent ; le reste peut attendre. Et n'oublie pas : ton live reste la meilleure vitrine pour te faire découvrir.`,
      );
    } else {
      paragraphs.push(
        `${firstName}, voici des membres TENF que ton Twitch ne suit pas encore — affinité de contenu d'abord.`,
        `${door} Tu picores à ton rythme. De l'autre côté, compléter ton profil et annoncer tes lives, c'est ouvrir des portes vers toi.`,
      );
    }
  }

  const insights: WelcomeInsight[] = [buildFollowInsight(), buildRoleInsight(ctx)];

  if (totalPending > 0) {
    insights.push({
      id: "pending",
      label: `${totalPending} piste${totalPending > 1 ? "s" : ""}`,
      detail: "Chaînes TENF non suivies",
      tone: "accent",
    });
  }

  if (filteredCount !== totalPending && totalPending > 0) {
    insights.push({
      id: "filtered",
      label: `${filteredCount} affichée${filteredCount > 1 ? "s" : ""}`,
      detail: "Avec tes filtres actuels",
      tone: "info",
    });
  }

  if (membersTotal > 0 && totalPending === 0) {
    insights.push({
      id: "complete",
      label: "Radar à jour",
      detail: `${membersTotal} profils TENF croisés`,
      tone: "success",
    });
  }

  const countBadge =
    totalPending === 0
      ? "Portes déjà ouvertes"
      : isVeryLongBacklog
        ? `${totalPending}+ pistes`
        : `${totalPending} piste${totalPending > 1 ? "s" : ""}`;

  return {
    welcomeKicker: ctx.status === "staff" ? `${ctx.roleLabel} · À découvrir` : "À découvrir",
    welcomeTitle,
    welcomeMessage: paragraphs.join(" "),
    welcomeInsights: insights.slice(0, 4),
    countBadge,
  };
}

export function buildDiscoverGuidanceModel(ctx: DiscoverContext, totalPending: number): DiscoverGuidanceModel {
  const { firstName, status } = ctx;
  const isLong = totalPending >= LONG_BACKLOG;
  const doorShort = followDoorSentence("short");

  let cardA: DiscoverGuidanceModel["cardA"];
  let cardB: DiscoverGuidanceModel["cardB"];

  if (status === "newcomer" || isLong) {
    cardA = {
      title: status === "newcomer" ? `${firstName}, bienvenue dans le radar` : "Liste longue ? Rien d'anormal",
      body:
        status === "newcomer"
          ? `Tu peux voir beaucoup de noms au début — c'est la taille de la famille, pas une liste de devoirs. ${doorShort}`
          : `Voir ${totalPending}+ chaînes, c'est fréquent : communauté active, pas corvée. ${doorShort}`,
    };
    cardB = {
      title: "Te faire découvrir, c'est l'autre moitié",
      body: `${firstName}, ouvrir des portes vers les autres, c'est une chose ; être visible quand tu stream en est une autre. Profil, planning et /lives t'aident à te faire repérer sans forcer personne à te follow.`,
    };
  } else if (status === "staff") {
    cardA = {
      title: `${firstName}, montrer l'exemple sans pression`,
      body: `En équipe, tu peux inspirer par la curiosité, pas par le quota. ${doorShort}`,
    };
    cardB = {
      title: "Visibilité mutuelle",
      body: `Soutenir des membres, c'est bien ; rappeler que le follow est optionnel, c'est mieux. Et quand tu es en live, tu restes aussi une vitrine TENF pour ceux qui te cherchent.`,
    };
  } else if (status === "vip") {
    cardA = {
      title: `${firstName}, tu fais déjà la différence`,
      body: `Ton énergie compte — continue à choisir tes follows avec cœur, pas par obligation. ${doorShort}`,
    };
    cardB = {
      title: "Donner et recevoir",
      body: `Ouvrir des portes vers d'autres créateurs, c'est entraider ; laisser les tiennes ouvertes via tes lives, c'est permettre à la famille de te retrouver.`,
    };
  } else if (status === "paused") {
    cardA = {
      title: `${firstName}, à ton rythme`,
      body: `Pas de pression si tu ne suis personne ce mois-ci. ${doorShort}`,
    };
    cardB = {
      title: "Quand tu reviendras",
      body: `Un passage ici ou sur /lives suffit pour rouvrir des portes — vers les autres comme vers toi, sans drama.`,
    };
  } else {
    cardA = {
      title: "Découvrir les autres",
      body: `${firstName}, une chaîne qui te parle vaut mieux que dix follows automatiques. ${doorShort}`,
    };
    cardB = {
      title: "Te faire découvrir",
      body: `Les membres te trouvent aussi via ton profil, ton planning et tes annonces. Le follow n'est qu'une porte parmi d'autres — des deux côtés.`,
    };
  }

  const tips: string[] = [
    `« 3 / 5 idées » ouvre des onglets pour regarder — tu fermes ce qui ne te parle pas. Aucun engagement à follow, ${firstName}.`,
    `« Piocher au hasard » casse la routine : curiosité d'abord, score ensuite (ou jamais, c'est ok).`,
    `Rafraîchir après des follows met à jour ton radar. Ton score d'engagement résume où tu en es — sans obsession du 100 %.`,
    `Streamer, compléter ton profil ou passer sur /lives : autant de façons de te faire découvrir, avec ou sans follow mutuel.`,
  ];

  if (status === "staff") {
    tips.push(`En ${ctx.roleLabel.toLowerCase()}, tu peux rappeler autour de toi : le follow ouvre une porte, il ne l'enferme pas.`);
  }

  return {
    panelTitle: status === "newcomer" ? `${firstName}, comment t'en servir` : "Follow : porte ouverte, jamais obligatoire",
    cardA,
    cardB,
    tips,
    tipsToggleLabel: "Conseils pour toi (zéro culpabilité)",
  };
}

export function buildDiscoverEmptyModel(
  ctx: DiscoverContext,
  hasFilters: boolean,
): DiscoverEmptyModel {
  const { firstName, status } = ctx;

  if (hasFilters) {
    return {
      title: `${firstName}, aucun profil avec ces filtres`,
      body: "Élargis la recherche ou repasse sur « Tous ». Le follow reste optionnel — tu choisis quand ouvrir une porte.",
    };
  }

  if (status === "newcomer") {
    return {
      title: `${firstName}, tu as déjà ouvert beaucoup de portes`,
      body: `${followDoorSentence("short")} De nouveaux membres arrivent : repasse ici plus tard. En attendant, /lives et ton profil t'aident aussi à te faire découvrir.`,
    };
  }

  if (status === "staff") {
    return {
      title: "Radar follows à jour",
      body: `${firstName}, tu suis déjà tout le monde dans cette liste. ${followDoorSentence("short")} La famille évolue — un rafraîchissement de temps en temps suffit.`,
    };
  }

  return {
    title: `${firstName}, ton radar est à jour`,
    body: `${followDoorSentence("short")} Repasse quand tu veux : des nouveaux arrivants apparaîtront. Et de ton côté, streamer reste la meilleure façon de te faire repérer.`,
  };
}

export function buildDiscoverGateCopy(
  kind: "discord" | "twitch",
  ctx: DiscoverContext | null,
): { title: string; body: string; actionLabel: string } {
  const name = ctx?.firstName || "toi";

  if (kind === "discord") {
    return {
      title: `${name}, connecte-toi pour personnaliser ta liste`,
      body: `On croise tes follows Twitch avec les membres TENF — sans jugement sur la vitesse ni le nombre. ${followDoorSentence("short")}`,
      actionLabel: "Se connecter avec Discord",
    };
  }

  return {
    title: `${name}, lie Twitch pour voir tes portes possibles`,
    body: `Sans liaison, on ne sait pas quelles chaînes TENF tu suis déjà. Une fois lié, tu verras qui tu peux découvrir — et rappelle-toi : follow = option, pas devoir.`,
    actionLabel: "Lier mon Twitch",
  };
}

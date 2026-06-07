import {
  accentForTier,
  resolveAdminStaffTier,
  type AdminStaffTier,
} from "@/lib/admin/dashboard/adminDashboardModel";
import type {
  AdminAccountPayload,
  AdminAccountQuickLink,
  AdminExperienceLink,
} from "@/lib/admin/account/adminAccountTypes";
import { firstNameFromDisplay, formatDateFr, getTimeGreeting } from "@/lib/admin/account/adminAccountUtils";

export type AdminWelcomeInsight = {
  id: string;
  label: string;
  detail?: string;
  tone: "accent" | "success" | "warning" | "info" | "muted";
};

export type AdminAccountModel = {
  accent: string;
  tier: AdminStaffTier;
  tierLabel: string;
  firstName: string;
  displayName: string;
  roleLabel: string;
  welcomeKicker: string;
  welcomeTitle: string;
  welcomeMessage: string;
  welcomeInsights: AdminWelcomeInsight[];
  encouragement: string;
  guidanceKicker: string;
  guidanceTitle: string;
  guidanceSteps: string[];
  heroRefreshKicker: string;
  heroRefreshLabel: string;
  heroPrimaryKicker: string;
  heroPrimaryHint: string;
  experienceKicker: string;
  experienceTitle: string;
  experienceIntro: string;
  experienceOpenLabel: string;
  experienceLinks: AdminExperienceLink[];
  cockpitKicker: string;
  cockpitTitle: string;
  cockpitIntro: string;
  cockpitAccessAdvanced: string;
  cockpitAccessStandard: string;
  cockpitAlertsOk: string;
  cockpitAlertsWarn: string;
  cockpitAlertsDanger: string;
  charterCockpitAccepted: string;
  charterCockpitPending: string;
  charterCockpitOverdue: string;
  emergencyOpenLabel: string;
  emergencyCloseLabel: string;
  emergencyTitle: string;
  emergencyIntro: string;
  identityKicker: string;
  identityTitle: string;
  identityIntro: string;
  missionsKicker: string;
  missionsTitle: string;
  missionsIntro: string;
  missionsFallbackNote: string;
  defaultMissionLines: string[];
  quickLinksKicker: string;
  quickLinksTitle: string;
  quickLinksIntro: string;
  quickLinks: AdminAccountQuickLink[];
  charterKicker: string;
  charterTitle: string;
  charterIntro: string;
  charterAlertTitle: string;
  charterAlertMessage: string;
  charterAlertCta: string;
  charterProgressLabel: string;
  charterRelireCta: string;
  charterValidatePageCta: string;
  emailKicker: string;
  emailTitle: string;
  emailIntro: string;
  emailAlertTitle: string;
  emailAlertMessage: string;
  emailAlertCta: string;
  emailFieldLabel: string;
  emailFieldPlaceholder: string;
  emailSaveLabel: string;
  emailTestLabel: string;
  activityKicker: string;
  activityTitle: string;
  activityIntro: string;
  activityEmpty: string;
  statsKicker: string;
  statsTitle: string;
  statsIntro: string;
  statsEmailOk: string;
  statsEmailMissing: string;
  announcementsKicker: string;
  announcementsTitle: string;
  announcementsIntro: string;
  pilotageTitle: string;
  pilotageIntro: string;
  pilotageCta: string;
  restrictedAccessTitle: string;
  restrictedAccessMessage: string;
  technicalTitle: string;
  technicalIntro: string;
  aboutTitle: string;
  aboutParagraphs: string[];
  footerNote: string;
  organigrammeCta: string;
  missionsManageCta: string;
  loadingTitle: string;
  loadingSubtitle: string;
  errorTitle: string;
  errorRetry: string;
  primaryStaffHref: string;
  primaryStaffLabel: string;
  showEmergencyMode: boolean;
};

function tierLabel(tier: AdminStaffTier, roleLabel: string): string {
  if (roleLabel.trim()) return roleLabel;
  switch (tier) {
    case "founder":
      return "Fondateur·rice TENF";
    case "coordinator":
      return "Admin coordinateur·rice";
    case "moderator_senior":
      return "Modérateur·rice confirmé(e)";
    case "moderator_accompaniment":
      return "Modérateur·rice en accompagnement";
    case "moderator_discovery":
      return "Modérateur·rice en découverte";
    case "moderator_paused":
      return "Modérateur·rice en pause";
    case "support":
      return "Soutien TENF";
    case "contributor":
      return "Contributeur·rice invité(e)";
    default:
      return "Staff TENF";
  }
}

function buildGuidanceSteps(
  tier: AdminStaffTier,
  firstName: string,
  data: AdminAccountPayload,
  charterUrgent: boolean,
  emailConfigured: boolean,
): string[] {
  const steps: string[] = [];

  if (!data.charter.accepted) {
    steps.push(
      charterUrgent
        ? `${firstName}, la charte attend ta signature — c’est le socle de confiance avec l’équipe et les membres.`
        : "Lis la charte article par article, sans te presser : pose tes questions au staff si un passage te parle mal.",
    );
  }

  switch (tier) {
    case "moderator_discovery":
      if (steps.length < 3) steps.push("Ouvre l’espace membre dans un nouvel onglet : voir ce qu’un créateur voit change tout.");
      if (steps.length < 3) steps.push("Repère ton référent sur l’organigramme — c’est la personne à qui parler en premier.");
      break;
    case "moderator_accompaniment":
      if (steps.length < 3) steps.push("Avant une file modération, demande-toi : « Est-ce que je peux le faire seul·e ? » — sinon, tu remontes.");
      if (steps.length < 3) steps.push("Compare une action admin avec l’espace membre : tu modères mieux quand tu ressens ce qu’ils ressentent.");
      break;
    case "moderator_senior":
      if (steps.length < 3) steps.push("Commence par ce qui bloque un créateur (charte à jour, e-mail staff si besoin).");
      if (steps.length < 3) steps.push("Un mot d’encouragement à un modérateur en découverte vaut parfois plus qu’une file traitée.");
      break;
    case "moderator_paused":
      steps.length = 0;
      steps.push(`${firstName}, aucune marche obligatoire — tu peux simplement rester connecté·e à la communauté si ça te fait du bien.`);
      if (!emailConfigured) steps.push("Si tu reviens bientôt, pense à laisser un e-mail staff pour les rares urgences.");
      break;
    case "support":
      if (steps.length < 3) steps.push("Vérifie ta fiche membre : un pseudo ou un Discord manquant, c’est un créateur qui se sent invisible.");
      if (steps.length < 3) steps.push("Avant de corriger une fiche, passe par l’espace membre : tu verras l’effet côté créateur.");
      break;
    case "coordinator":
    case "founder":
      if (steps.length < 3) steps.push("Regarde les annonces staff et les alertes ci-dessous — c’est le pouls de l’équipe.");
      if (steps.length < 3) steps.push("Garde un œil sur ta charte et ton e-mail : tu es souvent le filet de sécurité des autres.");
      break;
    default:
      if (steps.length < 3) steps.push("Parcours les cartes « membre & public » avant une réponse importante à un créateur.");
  }

  if (!emailConfigured && tier !== "moderator_paused") {
    steps.push("Ajoute ton e-mail staff : en dehors de Discord, c’est parfois le seul moyen de te joindre vite.");
  }

  return steps.slice(0, 3);
}

function buildDefaultMissionLines(tier: AdminStaffTier, firstName: string): string[] {
  switch (tier) {
    case "founder":
      return [
        `${firstName}, tu fais vivre la vision TENF — ton énergie donne le tempo à toute la famille.`,
        "Tu n’as pas à tout porter seul·e : délègue les files du quotidien pour garder de l’espace pour l’essentiel.",
        "Rappelle-toi que tu es aussi membre : cette page te ramène à la communauté, pas seulement aux coulisses.",
      ];
    case "coordinator":
      return [
        `${firstName}, tu es le lien entre la direction et le terrain — ta bienveillance structure l’équipe.`,
        "Relance en douceur quand un suivi staff traîne : ce n’est pas de la pression, c’est de la clarté.",
        "Quand tu doutes, demande-toi : « Est-ce que ça aide un créateur à se sentir accueilli ? »",
      ];
    case "moderator_discovery":
      return [
        `${firstName}, ta mission aujourd’hui : comprendre, pas tout résoudre.`,
        "Observe les files avec ton référent — chaque question est un signe que tu prends le rôle au sérieux.",
        "L’empathie avant la sanction : tu apprends le ton TENF en regardant comment les membres vivent le site.",
      ];
    case "moderator_accompaniment":
      return [
        `${firstName}, tu gagnes en assurance file après file — l’équipe te suit, pas pour te juger, pour te faire monter.`,
        "Bienveillance et fermeté ne s’opposent pas : les deux protègent la communauté.",
        "Après une session modération, note ce qui t’a mis mal à l’aise — c’est de l’or pour progresser.",
      ];
    case "moderator_senior":
      return [
        `${firstName}, tu fais sentir aux créateurs qu’ils ne sont pas seuls quand un raid ou un conflit arrive.`,
        "Un modérateur en découverte a besoin de ton calme plus que de ta vitesse.",
        "Pense à ton espace membre aussi : tu fais partie de la New Family, pas seulement des coulisses.",
      ];
    case "moderator_paused":
      return [
        `${firstName}, la pause est légitime — l’équipe tient le fort sans reproche.`,
        "Si tu reviens un jour, reprends la charte comme on relit une partition avant un concert.",
        "Tu peux suivre les lives et l’espace membre sans obligation staff : reste à ton rythme.",
      ];
    case "support":
      return [
        `${firstName}, derrière chaque fiche, il y a une personne qui veut se sentir reconnue dans la famille.`,
        "Tu orientes, tu corriges, tu signales — tu n’as pas à trancher seul·e une situation lourde.",
        "Un profil validé à temps, c’est un « bienvenue » qui sonne vrai.",
      ];
    case "contributor":
      return [
        `${firstName}, tu prêtes main-forte sans porter toute la charge — merci pour ça.`,
        "Si quelque chose te semble bizarre sur une fiche, dis-le à un coordinateur : tu protèges la communauté en remontant.",
        "L’espace membre reste ta boussole pour rester proche des créateurs.",
      ];
    default:
      return [`${firstName}, chaque passage ici compte pour la confiance de la New Family.`];
  }
}

function buildExperienceLinks(tier: AdminStaffTier, firstName: string): AdminExperienceLink[] {
  const member = {
    href: "/member/dashboard",
    title: "Espace membre",
    description:
      tier === "moderator_discovery"
        ? `${firstName}, mets-toi dans la peau d’un créateur avant de modérer — 5 minutes ici valent une heure de théorie.`
        : "Le même tableau de bord que les membres : idéal avant de répondre à quelqu’un ou de valider une action.",
    tone: "#8b5cf6",
  };
  const publicGuide = {
    href: "/rejoindre/guide-public/presentation-rapide",
    title: "Parcours public",
    description:
      tier === "coordinator" || tier === "founder"
        ? "Ce qu’un visiteur découvre avant d’adhérer — garde le même récit entre Discord, annonces et site."
        : "Ce qu’un futur membre lit avant de nous rejoindre : utile pour répondre avec le bon ton.",
    tone: "#38bdf8",
  };
  const events = {
    href: "/member/evenements",
    title: "Événements côté membre",
    description: "Inscriptions et dates telles qu’elles apparaissent pour les créateurs — sans filtre admin.",
    tone: "#34d399",
  };

  if (tier === "moderator_paused") {
    return [
      member,
      {
        href: "/lives",
        title: "Lives TENF",
        description: "Reste dans l’ambiance de la famille, sans obligation modération — juste pour le plaisir si tu veux.",
        tone: "#ef4444",
      },
      events,
    ];
  }
  return [member, publicGuide, events];
}

function buildQuickLinks(tier: AdminStaffTier, firstName: string): AdminAccountQuickLink[] {
  const charte = {
    href: "/admin/moderation/staff/info/charte",
    title: "Charte & validation",
    desc: `${firstName}, c’est ton cadre de confiance avec l’équipe — prends le temps de la lire.`,
    tone: "#38bdf8",
  };
  const mod = {
    href: "/admin/moderation/staff",
    title: "Modération staff",
    desc: "Là où l’équipe agit au quotidien — files, procédures, entraide.",
    tone: "#f43f5e",
  };
  const orga = {
    href: "/admin/gestion-acces/organigramme-staff",
    title: "Organigramme",
    desc: "Qui fait quoi, qui contacter — tu n’es jamais seul·e.",
    tone: "#a78bfa",
  };
  const membres = {
    href: "/admin/membres",
    title: "Membres",
    desc: "Les visages de la New Family — au-delà des fiches.",
    tone: "#34d399",
  };
  const dashboard = {
    href: "/admin/dashboard",
    title: "Tableau de bord",
    desc: "Ce qui attend l’équipe aujourd’hui — sans tout ouvrir d’un coup.",
    tone: "#818cf8",
  };

  switch (tier) {
    case "moderator_discovery":
      return [
        charte,
        { href: "/admin/moderation/my-questionnaire", title: "Mon questionnaire", desc: "Pose tes questions ouvertes à l’équipe.", tone: "#818cf8" },
        orga,
        membres,
      ];
    case "moderator_accompaniment":
      return [charte, mod, orga, dashboard];
    case "moderator_paused":
      return [orga, { href: "/member/dashboard", title: "Espace membre", desc: "Sans obligation — juste pour rester proche.", tone: "#8b5cf6" }, membres, charte];
    case "founder":
    case "coordinator":
      return [dashboard, mod, orga, { href: "/admin/gestion-acces/comptes", title: "Comptes & rôles", desc: "Qui a accès à quoi — avec responsabilité.", tone: "#fbbf24" }];
    case "support":
      return [membres, { href: "/admin/membres/validation-profil", title: "Validations profil", desc: "Accueillir un nouveau membre, c’est parfois par ici.", tone: "#38bdf8" }, orga, charte];
    default:
      return [mod, charte, orga, membres];
  }
}

function buildWelcome(
  tier: AdminStaffTier,
  firstName: string,
  data: AdminAccountPayload,
  charterUrgent: boolean,
  emailConfigured: boolean,
): Pick<
  AdminAccountModel,
  "welcomeKicker" | "welcomeTitle" | "welcomeMessage" | "welcomeInsights" | "encouragement"
> {
  const greeting = getTimeGreeting();
  const { charter } = data;
  const insights: AdminWelcomeInsight[] = [
    { id: "role", label: "Tu es", detail: data.adminRoleLabel, tone: "accent" },
    {
      id: "member-since",
      label: "Dans la famille depuis",
      detail: formatDateFr(data.memberCreatedAtIso).split(" ")[0] ?? "—",
      tone: "info",
    },
  ];

  if (!charter.accepted) {
    insights.push({
      id: "charte",
      label: "Prochaine étape",
      detail: charterUrgent ? "Charte urgente" : "Lire la charte",
      tone: charterUrgent ? "warning" : "muted",
    });
  } else {
    insights.push({ id: "charte", label: "Charte", detail: "Tu es couvert·e", tone: "success" });
  }

  if (!emailConfigured) {
    insights.push({ id: "email", label: "À compléter", detail: "Ton e-mail staff", tone: "warning" });
  }

  let welcomeMessage: string;
  let encouragement: string;
  let welcomeTitle: string;

  switch (tier) {
    case "moderator_discovery":
      welcomeTitle = `${greeting} ${firstName} — bienvenue dans les coulisses, sans rush`;
      welcomeMessage = `${firstName}, tu fais déjà partie de la New Family en tant que membre. Cette page te montre ton côté staff : qui tu es pour l’équipe, ce qu’on attend de toi (et surtout ce qu’on n’attend pas encore), et comment voir le site comme un créateur.`;
      encouragement = "Personne ne te demande d’être parfait·e. Curiosité, questions, bienveillance — c’est exactement le profil qu’on cherche.";
      break;
    case "moderator_accompaniment":
      welcomeTitle = `${greeting} ${firstName} — tu montes en puissance, pas en solo`;
      welcomeMessage = `${firstName}, tu n’es plus en simple observation : tu commences à toucher au concret, toujours avec quelqu’un derrière toi. Ici, tu retrouves ta fiche, ta charte et les raccourcis pour avancer sans te sentir largué·e.`;
      encouragement = "Chaque hésitation remontée à l’équipe est une preuve de maturité, pas de faiblesse.";
      break;
    case "moderator_senior":
      welcomeTitle = `${greeting} ${firstName} — merci de tenir le fort`;
      welcomeMessage = `${firstName}, les créateurs ne voient pas toujours ce que tu fais, mais ils ressentent quand l’ambiance est saine. Cette page, c’est ton miroir staff : statut, charte, accès — et un rappel de ce que vivent les membres.`;
      encouragement = "Tu fais partie des voix qui rassurent la communauté. Prends soin de toi autant que du Discord.";
      break;
    case "moderator_paused":
      welcomeTitle = `${greeting} ${firstName} — ta place est gardée`;
      welcomeMessage = `${firstName}, tu as posé la modération active et c’est ok. Cette page reste là si tu veux suivre l’actualité staff ou simplement rester membre TENF — sans culpabilité, sans compte à rendre.`;
      encouragement = "Revenir quand tu seras prêt·e, c’est toujours possible. La famille ne t’oublie pas.";
      break;
    case "coordinator":
      welcomeTitle = `${greeting} ${firstName} — tu fais le lien, et ça compte`;
      welcomeMessage = `${firstName}, tu es souvent celui ou celle qu’on regarde quand ça coince. Ici : ton identité staff, ta charte, ton e-mail d’urgence, et les raccourcis pour débloquer les autres sans tout porter seul·e.`;
      encouragement = "Coordonner, ce n’est pas tout faire — c’est aider chacun·e à savoir où mettre son énergie.";
      break;
    case "founder":
      welcomeTitle = `${greeting} ${firstName} — racines et ciel`;
      welcomeMessage = `${firstName}, tu as planté cette famille. Cette page te ramène à toi : staff et membre, pas seulement pilotage. Les vues « membre & public » t’aident à ne pas t’éloigner de ce que ressentent les créateurs.`;
      encouragement = "Déléguer, c’est aussi prendre soin de l’écosystème que tu as fait naître.";
      break;
    case "support":
      welcomeTitle = `${greeting} ${firstName} — la main tendue des coulisses`;
      welcomeMessage = `${firstName}, souvent tu es la première personne « admin » qu’un membre croise, sans le savoir. Ta fiche, les validations, les petites corrections — tout ça construit l’accueil. Cette page centralise ton identité et tes outils.`;
      encouragement = "Un profil accueilli, un pseudo corrigé : parfois c’est ça, la modération invisible qui compte.";
      break;
    default:
      welcomeTitle = `${greeting} ${firstName} — ton coin staff dans la famille`;
      welcomeMessage = `${firstName}, ici tu retrouves qui tu es pour TENF, côté membre et côté équipe. Les cartes ci-dessous te guident pas à pas — sans jargon inutile.`;
      encouragement = "Merci d’être là pour la communauté.";
  }

  if (data.integrationDateIso) {
    welcomeMessage += ` Tu as rejoint l’équipe staff le ${formatDateFr(data.integrationDateIso)} — bienvenue (encore) dans cette aventure.`;
  }

  return {
    welcomeKicker: `${firstName} · staff & membre, une seule personne`,
    welcomeTitle,
    welcomeMessage,
    welcomeInsights: insights,
    encouragement,
  };
}

function buildCharterAlertMessage(
  tier: AdminStaffTier,
  firstName: string,
  data: AdminAccountPayload,
): string {
  const { charter } = data;
  if (charter.graceElapsed) {
    return `${firstName}, le délai de 15 jours est passé sans signature. On veut te garder dans l’équipe — valide la charte dès que tu peux pour retrouver un accès serein.`;
  }
  if (tier === "moderator_discovery") {
    return `Pas de panique : tu as encore environ ${charter.daysRemainingApprox ?? "—"} jour(s). Lis la charte à ton rythme, coche au fur et à mesure, et demande si un article te questionne.`;
  }
  return `Il te reste environ ${charter.daysRemainingApprox ?? "—"} jour(s) pour signer la charte. C’est le contrat de confiance entre toi, l’équipe et les créateurs — on compte sur toi.`;
}

export function buildAdminAccountModel(
  data: AdminAccountPayload,
  options: { charterUrgent: boolean; emailConfigured: boolean },
): AdminAccountModel {
  const tier = resolveAdminStaffTier(data.adminRole);
  const firstName = firstNameFromDisplay(data.displayName);
  const accent = accentForTier(tier);
  const roleLabel = tierLabel(tier, data.adminRoleLabel);
  const welcome = buildWelcome(tier, firstName, data, options.charterUrgent, options.emailConfigured);
  const guidanceSteps = buildGuidanceSteps(tier, firstName, data, options.charterUrgent, options.emailConfigured);

  const primaryStaff =
    tier === "moderator_discovery"
      ? { href: "/admin/moderation/staff/info/charte", label: "Continuer ma charte", hint: "Ta première vraie étape staff" }
      : tier === "support"
        ? { href: "/admin/membres/gestion", label: "Voir les fiches membres", hint: "Là où tu fais la différence" }
        : tier === "moderator_paused"
          ? { href: "/member/dashboard", label: "Espace membre", hint: "Sans obligation modération" }
          : { href: "/admin/dashboard", label: "Mon tableau de bord", hint: "Ce qui attend l’équipe aujourd’hui" };

  const charterIntro = !data.charter.accepted
    ? tier === "moderator_discovery"
      ? `${firstName}, la charte n’est pas un examen : c’est la promesse qu’on se fait mutuellement de protéger la communauté. Prends le temps de la lire.`
      : `${firstName}, signer la charte, c’est dire « je suis prêt·e à veiller sur les créateurs avec l’équipe ».`
    : data.charter.validatedVersion && data.charter.validatedVersion !== data.charter.currentVersion
      ? "Une nouvelle version est disponible — on te demandera bientôt de la relire. Mieux vaut anticiper que subir."
      : `${firstName}, ta charte est signée — garde-la en tête quand l’ambiance chauffe sur Discord.`;

  return {
    accent,
    tier,
    tierLabel: roleLabel,
    firstName,
    displayName: data.displayName || firstName,
    roleLabel,
    ...welcome,
    guidanceKicker: `${firstName} · par où commencer`,
    guidanceTitle: tier === "moderator_paused" ? "À ton rythme" : "Trois repères pour aujourd’hui",
    guidanceSteps,
    heroRefreshKicker: "Mettre à jour",
    heroRefreshLabel: "Rafraîchir ma fiche",
    heroPrimaryKicker: "Ta prochaine marche",
    heroPrimaryHint: primaryStaff.hint,
    experienceKicker: `${firstName} · voir comme eux`,
    experienceTitle: "Remets-toi dans leur peau",
    experienceIntro:
      tier === "moderator_discovery"
        ? `${firstName}, avant de modérer, regarde le site comme un créateur. Ouvre chaque carte dans un nouvel onglet — c’est le meilleur entraînement, sans pression.`
        : "Avant une réponse importante ou une annonce Discord, passe par ici : tu évites le décalage entre ce que tu penses et ce qu’ils voient.",
    experienceOpenLabel: "Ouvrir dans un nouvel onglet",
    experienceLinks: buildExperienceLinks(tier, firstName),
    cockpitKicker: `${firstName} · où j’en suis`,
    cockpitTitle: "Ton statut, en clair",
    cockpitIntro:
      tier === "moderator_paused"
        ? "Tout est informatif — aucune action terrain n’est attendue. Repose-toi."
        : "Quatre repères simples : qui tu es staff, où en est ta charte, tes accès, et s’il y a quelque chose à ne pas oublier.",
    cockpitAccessAdvanced: "Accès complet",
    cockpitAccessStandard: "Accès standard",
    cockpitAlertsOk: "Rien de bloquant",
    cockpitAlertsWarn: "À compléter",
    cockpitAlertsDanger: "Priorité maintenant",
    charterCockpitAccepted: "Signée ✓",
    charterCockpitPending: "À lire",
    charterCockpitOverdue: "À signer vite",
    emergencyOpenLabel: "Mode urgence",
    emergencyCloseLabel: "Fermer l’urgence",
    emergencyTitle: "Quand ça brûle",
    emergencyIntro: `${firstName}, en situation critique uniquement — raccourcis directs. Les procédures Discord et staff restent la référence.`,
    identityKicker: "Qui tu es sur TENF",
    identityTitle: "Identité & chaîne",
    identityIntro:
      tier === "support"
        ? `${firstName}, ces infos, c’est ce que les membres voient ou ce qui leur manque quand quelque chose cloche. Un coup d’œil régulier évite les malentendus.`
        : "Ta fiche membre TENF — le lien entre ton identité créateur et ton rôle staff.",
    missionsKicker: tier === "founder" || tier === "coordinator" ? "Ce que tu portes" : "Pourquoi tu es là",
    missionsTitle: "Responsabilités & missions",
    missionsIntro:
      data.staffMissions.length > 0
        ? `${firstName}, voici ce qui t’est confié nominativement — plus le contexte collectif sur l’organigramme.`
        : `${firstName}, pas de mission nominative en base pour l’instant : voici le sens de ton rôle dans l’équipe.`,
    missionsFallbackNote: "Des missions plus précises peuvent t’être ajoutées par la direction — l’organigramme reste la carte de l’équipe.",
    defaultMissionLines: buildDefaultMissionLines(tier, firstName),
    quickLinksKicker: `${firstName} · aller plus loin`,
    quickLinksTitle: tier === "moderator_discovery" ? "Tes portes d’entrée" : "Raccourcis qui comptent",
    quickLinksIntro:
      tier === "moderator_discovery"
        ? "Commence par la charte, puis l’organigramme pour savoir qui appeler."
        : "Les pages où ton rôle a le plus d’impact — sans naviguer dans tout l’admin.",
    quickLinks: buildQuickLinks(tier, firstName),
    charterKicker: "Notre cadre commun",
    charterTitle: "Charte de modération",
    charterIntro,
    charterAlertTitle: options.charterUrgent ? `${firstName}, la charte t’attend` : "Charte à lire",
    charterAlertMessage: buildCharterAlertMessage(tier, firstName, data),
    charterAlertCta: "Ouvrir la charte et avancer",
    charterProgressLabel: "Temps restant (indicatif)",
    charterRelireCta: "Relire la charte",
    charterValidatePageCta: "Page de validation",
    emailKicker: "Te joindre hors Discord",
    emailTitle: "E-mail staff",
    emailIntro: options.emailConfigured
      ? `${firstName}, ton e-mail est enregistré — on ne l’utilise qu’en cas vraiment important, pas pour du bruit.`
      : `${firstName}, laisse-nous un e-mail : si Discord tombe ou qu’on ne te trouve pas, c’est notre filet de sécurité.`,
    emailAlertTitle: `${firstName}, il manque ton e-mail`,
    emailAlertMessage:
      "Les alertes critiques ne passent pas toujours par Discord. Deux minutes pour le renseigner, et tu es joignable quand ça compte vraiment.",
    emailAlertCta: "Renseigner mon e-mail",
    emailFieldLabel: "Adresse e-mail staff",
    emailFieldPlaceholder: "ton.email@exemple.com",
    emailSaveLabel: "Enregistrer",
    emailTestLabel: "Envoyer un test",
    activityKicker: "Ce qui s’est passé",
    activityTitle: "Dernières actions staff",
    activityIntro:
      tier === "founder" || tier === "coordinator"
        ? "Un fil des mouvements récents sur la plateforme — pour sentir le rythme de l’équipe."
        : `${firstName}, si tu as agi récemment côté staff, tu peux retrouver une trace ici.`,
    activityEmpty:
      tier === "moderator_discovery"
        ? "Rien pour l’instant — normal tant que tu observes. Explore la charte et l’espace membre."
        : "Pas d’action récente visible, ou le fil n’a pas pu charger. Ce n’est pas grave.",
    statsKicker: "La famille en chiffres",
    statsTitle: "Vue d’ensemble",
    statsIntro:
      tier === "founder" || tier === "coordinator"
        ? "Des repères collectifs — pas pour micro-gérer, pour sentir la santé de la communauté."
        : "Des chiffres partagés pour te situer — la communauté est plus grande qu’une seule file modération.",
    statsEmailOk: "E-mail prêt",
    statsEmailMissing: "E-mail à ajouter",
    announcementsKicker: "Mot de l’équipe",
    announcementsTitle: "Annonces staff",
    announcementsIntro:
      "Messages de la direction ou de la coordination — clique pour lire. La cloche membre reprend les mêmes infos.",
    pilotageTitle: "Pilotage staff",
    pilotageIntro: `${firstName}, tu as accès au pilotage avancé : référents, réunions d’intégration, affectations — pour orchestrer sans tout faire seul·e.`,
    pilotageCta: "Ouvrir le pilotage",
    restrictedAccessTitle: "Identifiants masqués — c’est normal",
    restrictedAccessMessage: `${firstName}, sans accès « admin avancé », les IDs techniques restent cachés pour ta sécurité et celle des membres. Un fondateur peut t’ouvrir cet accès si ton rôle le nécessite.`,
    technicalTitle: "Identifiants techniques",
    technicalIntro: "Réservé aux profils avancés — à manipuler avec prudence, jamais en public ou sur Discord.",
    aboutTitle: "Pourquoi cette page existe",
    aboutParagraphs: [
      `${firstName}, tout ce que tu vois ici concerne uniquement toi — pas un autre compte staff.`,
      "Tu es membre ET staff : cette page te rappelle les deux, pour que tu ne perdes pas le fil côté créateur.",
      "Les cartes « membre & public » existent pour ça : rester humain·e dans les coulisses.",
    ],
    footerNote: `${firstName}, un souci sur ta fiche Discord ou Twitch ? Parle-en à un fondateur ou un·e coordinateur·rice — on règle ça ensemble.`,
    organigrammeCta: "Voir l’organigramme",
    missionsManageCta: "Gérer les missions nominatives",
    loadingTitle: "On prépare ton espace…",
    loadingSubtitle: `${firstName}, on récupère ta fiche, ta charte et ce qui compte pour ton rôle — deux secondes.`,
    errorTitle: "Impossible de charger ton espace",
    errorRetry: "Réessayer",
    primaryStaffHref: primaryStaff.href,
    primaryStaffLabel: primaryStaff.label,
    showEmergencyMode: tier !== "moderator_paused" && tier !== "moderator_discovery",
  };
}

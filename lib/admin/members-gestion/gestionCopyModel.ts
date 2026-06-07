import {
  accentForTier,
  resolveAdminStaffTier,
  type AdminStaffTier,
} from "@/lib/admin/dashboard/adminDashboardModel";
import { firstNameFromDisplay, getTimeGreeting } from "@/lib/admin/account/adminAccountUtils";

export type GestionKpiCounts = {
  total: number;
  active: number;
  activeIntegrated: number;
  activeNewRole: number;
  suivi: number;
  nouveaux: number;
  incomplets: number;
  sansTwitchId: number;
};

export type GestionWelcomeInsight = {
  id: string;
  label: string;
  detail: string;
  tone: "accent" | "success" | "warning" | "info" | "muted";
};

export type GestionGuideStep = {
  id: string;
  kicker: string;
  title: string;
  body: string;
};

export type GestionModalCopy = {
  title: string;
  subtitle: string;
  cancel: string;
  confirm?: string;
  confirmLoading?: string;
  placeholder?: string;
};

export type GestionCopyModel = {
  accent: string;
  tier: AdminStaffTier;
  tierLabel: string;
  firstName: string;
  displayName: string;
  welcomeKicker: string;
  welcomeBadge: string;
  welcomeTitle: string;
  welcomeMessage: string;
  welcomeInsights: GestionWelcomeInsight[];
  heroGuideLine: string;
  encouragement: string;
  pageMission: string;
  guidanceKicker: string;
  guidanceTitle: string;
  guidanceIntro: string;
  guideSteps: GestionGuideStep[];
  refreshLabel: string;
  loadingTitle: string;
  loadingSubtitle: string;
  searchPlaceholder: string;
  searchHelp: string;
  toolbarKicker: string;
  toolbarTitle: string;
  toolbarIntro: string;
  kpi: {
    total: { label: string; hint: string };
    actifs: { label: string; hint: (integrated: number, pipeline: number) => string };
    suivi: { label: string; hint: string };
    nouveaux: { label: string; hint: string };
    incomplets: { label: string; hint: string };
    sansTwitchId: { label: string; hint: string };
  };
  aside: {
    backLabel: string;
    backIntro: string;
    filtersTitle: string;
    toolsTitle: string;
  };
  modals: {
    bulkReason: GestionModalCopy;
    addChannel: GestionModalCopy;
    editMember: GestionModalCopy;
    bulkImport: GestionModalCopy;
    verifyList: GestionModalCopy;
    merge: GestionModalCopy;
    history: GestionModalCopy;
    verifyTwitch: GestionModalCopy;
    verifyDiscord: GestionModalCopy & {
      launch: string;
      launchLoading: string;
      batchHint: string;
      statsLoaded: string;
      statsUpdated: string;
      statsOther: string;
      updatedSection: string;
      detailSection: string;
      detailEmpty: string;
    };
  };
};

type BuildGestionCopyInput = {
  displayName: string;
  roleLabel: string;
  rawRole: string | null;
  counts: GestionKpiCounts;
};

function buildGuideSteps(tier: AdminStaffTier, firstName: string, counts: GestionKpiCounts): GestionGuideStep[] {
  const discordHook =
    tier === "founder" || tier === "coordinator"
      ? "Quand un créateur te ping sur le Discord d'entraide, commence ici."
      : "Quelqu'un t'a mentionné sur le Discord d'entraide ? C'est la bonne page.";

  return [
    {
      id: "find",
      kicker: "1 · Retrouver",
      title: "Cherche le pseudo",
      body: `${discordHook} Tape Twitch, Discord ou nom dans la barre — ou clique une pastille KPI (${counts.nouveaux} nouveau(x), ${counts.incomplets} à compléter).`,
    },
    {
      id: "read",
      kicker: "2 · Comprendre",
      title: "Lis l'état de la fiche",
      body:
        tier === "founder"
          ? `${firstName}, rôle, intégration, liens Twitch/Discord : tout est là avant d'agir. Clique une ligne pour l'aperçu rapide.`
          : "Rôle, statut, complétude : la fiche te dit si la personne est nouvelle, active ou a besoin d'un coup de main.",
    },
    {
      id: "act",
      kicker: "3 · Accompagner",
      title: tier === "founder" ? "Corrige ou synchronise" : "Ouvre la fiche ou oriente",
      body:
        tier === "founder"
          ? "Import, sync Discord, fusion : menu Actions. Chaque action sensible laisse une trace d'audit."
          : counts.incomplets > 0
            ? `${counts.incomplets} profil(s) incomplet(s) — un message bienveillant sur Discord suffit souvent avant de toucher à l'admin.`
            : "Tu peux ouvrir la fiche ou renvoyer la personne vers le bon salon d'entraide TENF.",
    },
  ];
}

function buildWelcome(input: BuildGestionCopyInput): Pick<
  GestionCopyModel,
  | "welcomeKicker"
  | "welcomeBadge"
  | "welcomeTitle"
  | "welcomeMessage"
  | "welcomeInsights"
  | "heroGuideLine"
  | "encouragement"
  | "pageMission"
> {
  const tier = resolveAdminStaffTier(input.rawRole);
  const firstName = firstNameFromDisplay(input.displayName);
  const greeting = getTimeGreeting();
  const { counts } = input;

  const insights: GestionWelcomeInsight[] = [
    {
      id: "liste",
      label: "Annuaire",
      detail: String(counts.total),
      tone: "muted",
    },
    {
      id: "nouveaux",
      label: "Nouveaux",
      detail: String(counts.nouveaux),
      tone: counts.nouveaux > 0 ? "accent" : "success",
    },
    {
      id: "incomplets",
      label: "À compléter",
      detail: String(counts.incomplets),
      tone: counts.incomplets > 0 ? "warning" : "muted",
    },
  ];

  switch (tier) {
    case "moderator_discovery":
      return {
        welcomeKicker: `${firstName} · staff entraide · découverte`,
        welcomeBadge: "Tu observes, on t'accompagne",
        welcomeTitle: `${greeting} ${firstName} — bienvenue dans l'annuaire TENF`,
        pageMission: "Le Discord d'entraide accueille — cette page te montre qui est qui derrière chaque pseudo.",
        welcomeMessage: [
          `${firstName}, quand quelqu'un pose une question sur le serveur, les modos retrouvent les fiches ici : pseudo Twitch, Discord, rôle, état.`,
          counts.nouveaux > 0
            ? `${counts.nouveaux} nouveau(x) à repérer — observe comment une fiche est construite, sans pression.`
            : "Explore les pastilles ou la recherche : c'est ton terrain d'apprentissage côté admin.",
        ].join(" "),
        welcomeInsights: insights,
        heroGuideLine:
          counts.incomplets > 0
            ? `Pastille « À compléter » (${counts.incomplets}) : ce sont souvent des créateurs timides — note-le pour ton référent.`
            : "Un pseudo mentionné sur Discord ? Colle-le dans la barre de recherche juste en dessous.",
        encouragement: `${firstName}, personne ne te demande d'être parfait·e : curiosité et bienveillance, c'est ce qu'on cherche sur l'entraide.`,
      };

    case "moderator_accompaniment":
      return {
        welcomeKicker: `${firstName} · staff entraide · accompagnement`,
        welcomeBadge: "Tu peux agir, pas à pas",
        welcomeTitle: `${greeting} ${firstName} — retrouve et accompagne un créateur`,
        pageMission: "Pont entre le Discord d'entraide et les fiches TENF : tu sais qui tu as en face.",
        welcomeMessage: [
          `${firstName}, quelqu'un t'a tagué sur l'entraide ? Cherche son pseudo ici, lis son état, ouvre sa fiche si tu dois ajuster.`,
          counts.incomplets > 0
            ? `${counts.incomplets} fiche(s) incomplète(s) — propose-leur gentiment de compléter, parfois ça débloque tout.`
            : counts.suivi > 0
              ? `${counts.suivi} membre(s) en suivi — vérifie leur état avant une relance sur Discord.`
              : "La liste est calme : bon moment pour consolider une validation ou une revue.",
        ].join(" "),
        welcomeInsights: insights,
        heroGuideLine:
          counts.nouveaux > 0
            ? "Filtre « Nouveaux » : ce sont ceux qui viennent d'arriver — accueille-les aussi côté Discord."
            : "Onglet Rôle & statut dans la fiche pour les ajustements que tu es autorisé·e à faire.",
        encouragement: "Traiter proprement vaut mieux que traiter vite — remonte à l'équipe si tu doutes, c'est signe de maturité.",
      };

    case "moderator_senior":
    case "coordinator":
      return {
        welcomeKicker: `${firstName} · staff entraide · confirmé(e)`,
        welcomeBadge: "La communauté compte sur toi",
        welcomeTitle: `${greeting} ${firstName} — l'annuaire au service de l'entraide`,
        pageMission: "Chaque question sur le Discord d'entraide peut se résoudre ici en deux clics.",
        welcomeMessage: [
          `${firstName}, KPI, filtres et fiches : tu tiens le lien entre ce qu'on vit sur Discord et la réalité des données TENF.`,
          counts.sansTwitchId > 0
            ? `${counts.sansTwitchId} sans Twitch ID — corrige avant que ça ne remonte en ticket entraide.`
            : counts.incomplets > 0
              ? `${counts.incomplets} profil(s) sous 80 % — une fiche claire évite les malentendus sur le serveur.`
              : `${counts.active} actif(s) — l'annuaire reflète la communauté que tu animes au quotidien.`,
        ].join(" "),
        welcomeInsights: insights,
        heroGuideLine:
          counts.sansTwitchId > 0
            ? "Pastille « Sans Twitch ID » en priorité — les syncs Discord en dépendent."
            : "Vues enregistrées + filtres avancés : tu gagnes du temps quand l'entraide s'emballe.",
        encouragement: "Chaque correction ici, c'est une confusion en moins sur le Discord demain.",
      };

    case "founder":
      return {
        welcomeKicker: `${firstName} · staff entraide · fondateur`,
        welcomeBadge: "Référentiel · actions sensibles",
        welcomeTitle: `${greeting} ${firstName} — l'annuaire qui soutient l'entraide`,
        pageMission: "Le Discord d'entraide vit grâce à des fiches justes — tu tiens le référentiel ici.",
        welcomeMessage: [
          `${firstName}, quand l'équipe ou un créateur te ping, c'est ici que tu retrouves la vérité : ${counts.total} fiches, rôles, sync Discord, imports.`,
          counts.sansTwitchId > 0
            ? `${counts.sansTwitchId} sans Twitch ID — à traiter avant que l'entraide ne se heurte à des données fantômes.`
            : counts.nouveaux > 0
              ? `${counts.nouveaux} en pipeline — aligne rôles et intégration pour que l'accueil Discord suive.`
              : "Les signaux critiques sont sous contrôle — tu peux consolider ou auditer sereinement.",
        ].join(" "),
        welcomeInsights: insights,
        heroGuideLine:
          "Recherche ou pastille KPI → fiche → menu Actions si import, sync ou fusion. Motif d'audit obligatoire sur le sensible.",
        encouragement: `${firstName}, l'entraide TENF repose sur des données propres — merci de garder ce référentiel vivant et fiable.`,
      };

    case "moderator_paused":
      return {
        welcomeKicker: `${firstName} · staff · pause`,
        welcomeBadge: "Consultation libre",
        welcomeTitle: `${greeting} ${firstName} — parcours l'annuaire sans obligation`,
        pageMission: "Tu peux consulter les fiches pour rester en phase avec l'entraide, sans action attendue.",
        welcomeMessage:
          "Les fiches expliquent qui est qui dans la famille TENF. Aucune tâche ne t'est demandée — observe si tu en as envie.",
        welcomeInsights: insights,
        heroGuideLine: "Recherche un pseudo ou explore les filtres — c'est un outil de repérage, pas une file de tâches.",
        encouragement: "Prends le temps qu'il te faut — la communauté sait que tu es en pause.",
      };

    case "support":
      return {
        welcomeKicker: `${firstName} · staff entraide · soutien`,
        welcomeBadge: "Repérage & orientation",
        welcomeTitle: `${greeting} ${firstName} — trouve qui a besoin d'un coup de main`,
        pageMission: "Sur l'entraide, tu orientes — ici tu vois si la fiche de la personne est complète ou bloquée.",
        welcomeMessage: [
          `${firstName}, les ${counts.incomplets} profil(s) incomplet(s) sont souvent des créateurs qui ne savent pas quoi remplir.`,
          counts.suivi > 0
            ? `${counts.suivi} en suivi communauté — vérifie l'état avant de proposer une relance sur Discord.`
            : "Quelqu'un te mentionne sur l'entraide ? Cherche son pseudo ici avant de répondre.",
        ].join(" "),
        welcomeInsights: insights,
        heroGuideLine: "Filtre « À compléter » puis ouvre la fiche — parfois un message personnel sur Discord suffit.",
        encouragement: "Ton regard bienveillant sur l'entraide compte autant qu'une correction technique.",
      };

    default:
      return {
        welcomeKicker: `${firstName} · staff entraide · annuaire`,
        welcomeBadge: "Famille TENF",
        welcomeTitle: `${greeting} ${firstName} — trouve un créateur, ouvre sa fiche`,
        pageMission: "Relie le Discord d'entraide aux fiches TENF : qui est cette personne, quel est son statut ?",
        welcomeMessage: [
          `${firstName}, recherche, filtres et fiches individuelles : tout part d'ici quand l'entraide a besoin d'une réponse concrète.`,
          counts.total > 0 ? `${counts.total} entrées dans l'annuaire.` : "",
        ]
          .filter(Boolean)
          .join(" "),
        welcomeInsights: insights,
        heroGuideLine: "Pastille KPI ou barre de recherche — deux clics pour passer d'une question Discord à une fiche.",
        encouragement: "Une fiche à jour, c'est un créateur qui se sent reconnu dans la famille.",
      };
  }
}

function buildGuidance(tier: AdminStaffTier, firstName: string): Pick<
  GestionCopyModel,
  "guidanceKicker" | "guidanceTitle" | "guidanceIntro"
> {
  switch (tier) {
    case "founder":
      return {
        guidanceKicker: "Marche staff · entraide",
        guidanceTitle: `${firstName}, trois gestes sur cette page`,
        guidanceIntro: "Quand l'entraide ou l'équipe te sollicite, enchaîne repérage → lecture → action.",
      };
    case "moderator_discovery":
      return {
        guidanceKicker: "Marche staff · découverte",
        guidanceTitle: "Comment lire cette page sans te presser",
        guidanceIntro: `${firstName}, observe ces trois étapes avec ton référent — pas d'examen, juste de la curiosité.`,
      };
    case "moderator_paused":
      return {
        guidanceKicker: "Repères optionnels",
        guidanceTitle: "Si tu jette un œil",
        guidanceIntro: "Aucune obligation — ces repères suffisent pour comprendre l'annuaire.",
      };
    default:
      return {
        guidanceKicker: "Marche staff · entraide",
        guidanceTitle: "Ta boussole sur l'annuaire",
        guidanceIntro: `${firstName}, du Discord à la fiche TENF : trois étapes simples pour ne jamais être perdu·e.`,
      };
  }
}

const MODAL_COPY_BASE: GestionCopyModel["modals"] = {
  bulkReason: {
    title: "Motif d'audit — action de masse",
    subtitle:
      "Obligatoire pour tracer un changement de rôle ou de statut sur plusieurs membres. Ce texte est enregistré dans l'historique d'audit.",
    placeholder: "Ex. : alignement post-validation staff, correction suite import…",
    cancel: "Annuler",
    confirm: "Confirmer et appliquer",
    confirmLoading: "Application…",
  },
  addChannel: {
    title: "Accueillir un nouveau créateur",
    subtitle:
      "Crée une fiche TENF avec les liens Twitch et Discord. Vérifie les pseudos avant de valider — c'est la base de tout le suivi.",
    cancel: "Annuler",
    confirm: "Créer la fiche",
  },
  editMember: {
    title: "Fiche membre",
    subtitle:
      "Identité, rôle, parcours et notes internes — chaque modification impacte ce que l'équipe voit et ce que le créateur vit.",
    cancel: "Fermer sans enregistrer",
    confirm: "Enregistrer la fiche",
  },
  bulkImport: {
    title: "Import en masse",
    subtitle:
      "Colle une liste Discord → Twitch. Chaque ligne est vérifiée contre l'annuaire existant avant import.",
    cancel: "Annuler",
    confirm: "Importer la sélection",
  },
  verifyList: {
    title: "Vérifier une liste d'entrées",
    subtitle:
      "Parse et contrôle une liste @Discord : twitch.tv/… sans toucher à la base — idéal avant un import.",
    cancel: "Fermer",
  },
  merge: {
    title: "Fusionner des doublons",
    subtitle:
      "Choisis, champ par champ, quelle version garder. Une fusion propre évite deux fiches pour le même créateur.",
    cancel: "Annuler",
    confirm: "Fusionner",
  },
  history: {
    title: "Historique du membre",
    subtitle: "Chronologie des changements enregistrés pour ce créateur dans TENF.",
    cancel: "Fermer",
  },
  verifyTwitch: {
    title: "Vérifier les noms Twitch",
    subtitle:
      "Compare les logins en base avec Twitch API — corrige les incohérences avant qu'elles ne bloquent un sync.",
    cancel: "Fermer",
  },
  verifyDiscord: {
    title: "Synchroniser les pseudos Discord",
    subtitle:
      "Interroge Discord via chaque ID membre, met à jour les pseudos différents, puis affiche le détail ligne par ligne.",
    cancel: "Fermer",
    launch: "Lancer la vérification",
    launchLoading: "Vérification en cours…",
    batchHint: "Traitement par lots de 20 membres, comme la page Données Discord.",
    statsLoaded: "Résultats chargés",
    statsUpdated: "Pseudos mis à jour",
    statsOther: "Identiques / autres",
    updatedSection: "Pseudos Discord mis à jour",
    detailSection: "Détail complet",
    detailEmpty: "Lance la vérification pour voir les résultats membre par membre.",
  },
};

export function buildGestionCopyModel(input: BuildGestionCopyInput): GestionCopyModel {
  const tier = resolveAdminStaffTier(input.rawRole);
  const firstName = firstNameFromDisplay(input.displayName);
  const welcome = buildWelcome(input);
  const guidance = buildGuidance(tier, firstName);
  const guideSteps = buildGuideSteps(tier, firstName, input.counts);

  return {
    accent: accentForTier(tier),
    tier,
    tierLabel: input.roleLabel || "Staff TENF",
    firstName,
    displayName: input.displayName,
    ...welcome,
    ...guidance,
    guideSteps,
    refreshLabel: "Actualiser l'annuaire",
    loadingTitle: `${firstName}, on charge la communauté…`,
    loadingSubtitle: "Récupération des membres, archivés et index d'intégration depuis la base centralisée.",
    searchPlaceholder: "Pseudo Twitch, Discord, nom, ID ou lien…",
    searchHelp:
      "La recherche couvre pseudo Twitch, pseudo Discord, nom affiché, ID Discord, ID Twitch, lien Twitch et identifiant site.",
    toolbarKicker: "Recherche & filtres",
    toolbarTitle: "Affine la liste",
    toolbarIntro: "Combine recherche, preset métier et onglets de population pour cibler exactement qui tu cherches.",
    kpi: {
      total: { label: "Total", hint: "Tous les membres actifs de l'annuaire" },
      actifs: {
        label: "Actifs",
        hint: (integrated, pipeline) =>
          pipeline > 0 ? `${integrated} intégrés · ${pipeline} en pipeline` : "dont staff si actif",
      },
      suivi: { label: "Suivi communauté", hint: "à accompagner hors staff" },
      nouveaux: { label: "Nouveaux", hint: "rôle « Nouveau »" },
      incomplets: { label: "À compléter", hint: "fiche < 80 %" },
      sansTwitchId: { label: "Sans Twitch ID", hint: "à lier avant sync" },
    },
    aside: {
      backLabel: "Hub membres",
      backIntro: "File du jour, santé des fiches et autres outils communauté.",
      filtersTitle: "Filtres rapides",
      toolsTitle: "Outils liés",
    },
    modals: MODAL_COPY_BASE,
  };
}

export const GESTION_MODAL_COPY_DEFAULT = MODAL_COPY_BASE;

export const GESTION_LOADING_COPY = {
  title: "Chargement de l'annuaire TENF",
  subtitle: "Récupération des membres depuis la base centralisée…",
};

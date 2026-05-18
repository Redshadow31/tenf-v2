export const CHARTE_VERSION = "Charte v3";

export type CharteAudience =
  | "tous"
  | "fondateur"
  | "admin"
  | "moderateur"
  | "decouverte"
  | "accompagnement"
  | "pause"
  | "activite_reduite"
  | "soutien"
  | "ancien_staff";

export type CharteTag = "Valeurs" | "Rôle" | "Méthode" | "Conflit" | "Confidentialité" | "MP" | "Urgent";

export type CharteExample = {
  situation: string;
  bad: string;
  good: string;
  remonter?: string;
};

export type CharteCallout = {
  title: string;
  body: string;
};

export type CharteSection = {
  id: number;
  slug: string;
  emoji: string;
  title: string;
  summary: string;
  intro?: string;
  retainBox?: string;
  callout?: CharteCallout;
  bullets?: string[];
  warnings?: string[];
  steps?: string[];
  comparison?: Array<{ bad: string; good: string }>;
  examples?: CharteExample[];
  note?: string;
  tags: CharteTag[];
  audiences: CharteAudience[];
  /** Mots-clés pour la recherche interne */
  keywords?: string[];
};

export type CharteTab = {
  key: string;
  label: string;
  shortLabel: string;
  description: string;
  sectionIds: number[];
};

export const CHARTE_SECTIONS: CharteSection[] = [
  {
    id: 1,
    slug: "pourquoi",
    emoji: "📜",
    title: "Pourquoi cette charte existe",
    summary:
      "Un cadre commun pour protéger la communauté, l'équipe et toi — sans te mettre la pression.",
    intro:
      "TENF, c'est une famille de streamers qui s'entraident. Pour que ça reste sain, chaque personne liée au staff partage les mêmes repères : bienveillance, sérieux et clarté. Cette charte n'est pas un piège : c'est ta boussole quand tu doutes.",
    bullets: [
      "Elle protège les membres, l'équipe et toi en cas de tension ou de recadrage.",
      "Elle donne une base commune pour se former, progresser et se parler sans ambiguïté.",
      "La lire et la valider ne te donne pas automatiquement le droit de modérer : ton mandat dépend du rôle qui t'est attribué sur le serveur.",
    ],
    retainBox: "Tu n'es pas seul(e) dans l'équipe. Cette charte existe pour que tu puisses agir avec confiance, pas avec peur.",
    tags: ["Valeurs"],
    audiences: ["tous"],
    keywords: ["introduction", "pourquoi", "cadre"],
  },
  {
    id: 2,
    slug: "adn-tenf",
    emoji: "❤️",
    title: "L'ADN TENF dans la modération",
    summary: "Communauté humaine et structurée — pas une cour de justice ni un serveur « promo only ».",
    intro:
      "Tu préserve l'entraide et le cadre — sans régner ni faire peur. Ce qui dépasse ton niveau : article 11.",
    bullets: [
      "Tu protèges l'ambiance avant de « gagner » un débat.",
      "Tu remontes au staff ce que tu ne peux pas traiter seul(e) — sans honte.",
      "Tu restes cohérent(e) d'une situation à l'autre : même méthode, même ton, même sérieux.",
    ],
    retainBox: "TENF reste TENF : chaleureux, structuré, protecteur.",
    tags: ["Valeurs"],
    audiences: ["tous"],
    keywords: ["adn", "valeurs", "esprit", "bienveillance"],
  },
  {
    id: 3,
    slug: "qui-concerne",
    emoji: "👥",
    title: "Qui est concerné",
    summary: "Toute personne liée au staff TENF, quel que soit son grade ou son ancienneté.",
    bullets: [
      "Fondateurs et admins coordinateurs — le même esprit éthique s'applique à tous, sans exception.",
      "Modérateurs confirmés, en découverte, en accompagnement, en pause ou en activité réduite.",
      "Soutiens TENF et personnes en lecture avant une prise de rôle officiel.",
      "Futurs candidats à la modération : lis cette charte avant toute prise de rôle — elle t'explique le cadre, pas encore tes pouvoirs.",
      "Anciens membres du staff encore proches de l'équipe : discrétion, neutralité, pas d'autorité résiduelle.",
    ],
    note: "En cas de doute sur ton statut exact, demande à un admin coordinateur ou un fondateur — mieux vaut une question qu'une intervention hors périmètre.",
    tags: ["Rôle"],
    audiences: ["tous"],
    keywords: ["concerné", "staff", "fondateur", "soutien"],
  },
  {
    id: 4,
    slug: "roles-statut",
    emoji: "🎭",
    title: "Ton rôle selon ton statut",
    summary: "Même charte — périmètre différent selon ton statut. Lis ta ligne.",
    intro:
      "Lis la ligne qui te correspond. Si tu hésites entre deux statuts, demande confirmation avant d'intervenir officiellement.",
    bullets: [
      "Fondateur — responsabilité finale, même cadre éthique : confidentialité, cohérence, respect. Pas de contournement du processus.",
      "Admin coordinateur — tu coordonnes et recadres. Cas lourd, sensible ou juridique → fondateurs. Pas de décision grave isolée.",
      "Modérateur confirmé — référence pour les récents. Cas simples et clairs : OK. Membre visible, mineur, conflit d'intérêt ou mesure lourde → remontée.",
      "Modérateur en découverte — tu observes et tu apprends. Tu aides et tu signales. Cas sensible : validation ou remontée, pas de mesure seul(e).",
      "Modérateur en accompagnement — phase de progression avec un référent, pas une punition. Les retours t'aident.",
      "Modérateur en pause — pas d'intervention officielle (sauf demande de l'équipe). Au retour : relire annonces et infos clés.",
      "Activité réduite — tu restes dans l'équipe, implication limitée. Tu préviens si tu ne peux pas suivre. Pas de gros dossier seul(e).",
      "Soutien TENF — tu aides, orientes, signales. Pas de mesure visible ni de parole staff sans validation.",
      "Ancien staff — neutralité, confidentialité, pas d'autorité résiduelle ni d'influence via l'ancien rôle.",
    ],
    retainBox: "Ton statut peut évoluer. Ce qui ne change pas : la méthode, la neutralité et la remontée quand tu doutes.",
    tags: ["Rôle"],
    audiences: ["tous"],
    keywords: ["rôle", "statut", "découverte", "accompagnement", "pause", "fondateur", "admin", "soutien"],
  },
  {
    id: 5,
    slug: "aider-moderer-representer",
    emoji: "🔀",
    title: "Aider, modérer, représenter TENF",
    summary: "Aider, modérer ou représenter — trois niveaux, trois périmètres.",
    intro: "Trois niveaux — ne les mélange pas. Ton statut précis est à l'article 4.",
    bullets: [
      "Aider — rassurer, orienter, répondre simplement, signaler. Sans imposer ni promettre de mesure.",
      "Modérer — rappel au règlement, calmer, demander des preuves. La suite dépend de ton statut (article 4).",
      "Représenter TENF — annonce, MP officiel, position publique. Mandat clair, souvent validation admin ou fondateur.",
    ],
    warnings: [
      "Dire « Le staff a décidé… » sans validation",
      "Promettre une exclusion ou une mesure que tu ne peux pas garantir",
      "Agir comme modo actif alors que tu es en pause, en soutien ou en activité réduite",
    ],
    examples: [
      {
        situation: "Soutien TENF — tension visible",
        bad: "« Si ça continue, tu prends un ban. »",
        good: "« On calme ça. Je signale au staff pour qu'on regarde proprement. »",
      },
      {
        situation: "Modérateur en découverte — cas grave",
        bad: "Mesure visible seul(e) pour « prouver » qu'on est légitime.",
        good: "Remontée avec contexte et preuves. En attendant : calmer le salon.",
      },
    ],
    retainBox: "« En mon avis… » n'est pas « Le staff TENF a décidé… ».",
    tags: ["Rôle"],
    audiences: ["tous", "soutien", "decouverte"],
    keywords: ["aider", "modérer", "représenter", "mandat"],
  },
  {
    id: 6,
    slug: "principe-analyse",
    emoji: "🎯",
    title: "Posture : tu analyses avant d'agir",
    summary: "Ton réflexe n'est pas de réagir : c'est de comprendre, puis d'agir au bon niveau.",
    intro: "La justesse compte plus que la vitesse. Lis, contextualise, choisis le bon niveau (article 5).",
    warnings: [
      "Réagir à chaud",
      "Juger la personne au lieu du comportement",
      "Interpréter sans faits ni preuve",
    ],
    bullets: [
      "Faits observables, règles écrites, contexte du salon.",
      "Fatigue, implication personnelle ou conflit d'intérêt → tu passes le relais (article 12).",
    ],
    examples: [
      {
        situation: "Insultes en vocal",
        bad: "Répondre sur le même ton.",
        good: "Rappel au cadre, demande d'arrêt. Si ça continue → article 11.",
      },
    ],
    tags: ["Méthode"],
    audiences: ["moderateur", "decouverte", "accompagnement"],
    keywords: ["analyse", "posture", "réflexe"],
  },
  {
    id: 7,
    slug: "faits-ressenti",
    emoji: "🧠",
    title: "Faits avant ressenti",
    summary: "Trois questions simples avant chaque action visible.",
    intro: "Avant d'intervenir, pose-toi ces questions — dans l'ordre :",
    steps: [
      "Qu'est-ce qui s'est réellement passé ? (messages, horaires, salon, témoins)",
      "Quelle règle du serveur est concernée ?",
      "Ai-je une preuve claire (message, capture, contexte) — ou est-ce mon ressenti ?",
    ],
    examples: [
      {
        situation: "Accusations croisées sans preuve",
        bad: "Croire celui qu'on préfère.",
        good: "Demander les faits, séparer si besoin. Pas de tranché sans preuve → article 11.",
      },
    ],
    note: "Réponse floue à une des 3 questions ? Tu ne décides pas seul(e).",
    tags: ["Méthode"],
    audiences: ["moderateur", "decouverte"],
    keywords: ["faits", "preuve", "ressenti", "neutre"],
  },
  {
    id: 8,
    slug: "methode",
    emoji: "⚖️",
    title: "Ta méthode en 4 étapes",
    summary: "Observation → identification → vérification → action adaptée.",
    steps: [
      "Observation — lire ou écouter entièrement, vérifier le contexte, ne pas intervenir dans la précipitation.",
      "Identification — isoler le comportement problématique et la règle concernée.",
      "Vérification — séparer fait et interprétation ; confirmer la preuve si nécessaire.",
      "Action adaptée — rien / rappel calme / intervention modérée / remontée staff selon gravité et ton mandat.",
    ],
    examples: [
      {
        situation: "Spam de liens",
        bad: "Menacer sans vérifier (partage autorisé ? erreur ?).",
        good: "Rappel, suppression si besoin, historique. Arnaque ou récidive → article 11.",
      },
      {
        situation: "Remarque limite",
        bad: "Mesure lourde pour « envoyer un message ».",
        good: "Rappel calme. Si répété ou harcèlement → article 11.",
      },
    ],
    tags: ["Méthode"],
    audiences: ["moderateur", "decouverte"],
    keywords: ["méthode", "étapes", "observation"],
  },
  {
    id: 9,
    slug: "comportements-eviter",
    emoji: "🚫",
    title: "Comportements incompatibles avec le rôle",
    summary: "Des lignes rouges pour protéger TENF — pas pour te faire peur.",
    intro: "Ces comportements fragilisent la confiance. Ils peuvent mener à un recadrage ou un retrait de rôle.",
    bullets: [
      "Interpréter sans faits, juger la personnalité, réagir à chaud",
      "Prendre parti entre membres proches",
      "Mesure visible sans base claire (ou sans validation en découverte)",
      "Sur-réagir sur un cas mineur",
      "Harcèlement, intimidation, pression répétée ou acharnement — jamais acceptable",
    ],
    tags: ["Méthode"],
    audiences: ["moderateur", "decouverte", "soutien"],
    keywords: ["comportement", "éviter", "ligne rouge", "harcèlement", "intimidation"],
  },
  {
    id: 10,
    slug: "communication",
    emoji: "💬",
    title: "Communication & formulations",
    summary: "Parler comme TENF : neutre, factuel, calme — en salon comme en MP.",
    intro: "Remettre du cadre sans humilier — pas gagner la dispute.",
    bullets: [
      "Ton neutre — tu décris les faits, pas ta frustration.",
      "Factuel — tu cites ce qui s'est passé et la règle, pas ce que tu « penses » de la personne.",
      "Clair — une consigne simple vaut mieux qu'un pavé agressif.",
      "Calme — même si l'autre monte le ton, tu ne le suis pas.",
    ],
    comparison: [
      { bad: "Tu abuses, tu cherches les problèmes.", good: "On va calmer l'échange ici. Si quelque chose pose souci, passe par le staff avec les éléments nécessaires." },
      { bad: "Je pense qu'il fait exprès.", good: "Ce message pose problème car [fait]. Merci de respecter le règlement." },
      { bad: "T'es toxique, tout le monde le sait.", good: "Ce type de message n'est pas accepté sur TENF. Merci d'arrêter ou on passera par le staff." },
      { bad: "Je vais te ban si tu continues.", good: "Si ça continue, le staff prendra une décision adaptée. Pour l'instant, merci de respecter le cadre du salon." },
    ],
    examples: [
      {
        situation: "Membre énervé en public",
        bad: "« Calme-toi, tu dramatises. »",
        good: "« Je comprends la frustration. Quel est le problème concret ? »",
      },
      {
        situation: "Accusation sans preuve",
        bad: "« Oui, il faut l'exclure. »",
        good: "« Envoie captures et contexte en staff. On ne tranche pas sur une impression. »",
      },
      {
        situation: "Tension en vocal",
        bad: "Moquerie ou couper la parole.",
        good: "Rappel au cadre, pause ou déplacement. Harcèlement ou mineur → article 11.",
      },
      {
        situation: "Tu ne peux pas trancher",
        bad: "Promettre une décision.",
        good: "« Je remonte au staff avec les éléments. On revient vers toi après analyse. »",
      },
    ],
    note: "Même ton en MP de modération (article 14).",
    tags: ["Méthode", "MP"],
    audiences: ["moderateur", "soutien", "decouverte"],
    keywords: ["communication", "formulation", "phrase", "ton", "salon", "mp"],
  },
  {
    id: 11,
    slug: "conflits-remontee",
    emoji: "🚨",
    title: "Conflits & quand remonter",
    summary: "Calmer, analyser, ne pas prendre parti — remonter dès que le cas dépasse ton mandat.",
    intro: "Remonter protège TENF et toi — ce n'est pas échouer. Salon staff ou admin coordinateur.",
    steps: [
      "Calmer sans alimenter",
      "Séparer ou temporiser si besoin",
      "Faits sans parti pris (article 7)",
      "Règles, pas frustration",
      "Remontée si sensible, répété, ambigu, hors mandat ou harcèlement",
    ],
    bullets: [
      "Conflit entre plusieurs streamers",
      "Situation émotionnelle forte",
      "Cas répété sur la même personne",
      "Comportement ambigu ou limite",
      "Lien amical, proche ou conflit d'intérêt de ton côté",
      "Membre très visible dans la communauté",
    ],
    callout: {
      title: "Mineurs et jeunes créateurs",
      body: "Plus de prudence, pas d'infantilisation : pas d'exposition publique, pas de long MP sensible seul(e). Sujet personnel ou conflictuel → fondateurs ou admin coordinateur. Jamais d'info personnelle utilisée contre un jeune membre. Trace staff si sensible.",
    },
    examples: [
      {
        situation: "Jeune membre — difficulté personnelle",
        bad: "Long MP seul(e) ou commentaire public.",
        good: "Prudence, pas d'exposition. Mineur + sujet sensible → remontée immédiate.",
      },
    ],
    note: "La vie du serveur ne repose pas sur une seule personne. Demander de l'aide, c'est mature.",
    tags: ["Conflit", "Urgent"],
    audiences: ["moderateur", "decouverte", "admin", "fondateur"],
    keywords: ["conflit", "remonter", "mineur", "jeune", "urgent"],
  },
  {
    id: 12,
    slug: "emotions",
    emoji: "💛",
    title: "Tes émotions & conflits d'intérêt",
    summary: "Si tu es impliqué(e) ou à bout, tu passes le relais — sans culpabilité.",
    intro:
      "Tu es humain(e). Fatigue, énervement, amitié, rivalité : tout ça peut brouiller le jugement. Dans ces moments, ton meilleur réflexe staff, c'est de ne pas trancher seul(e).",
    bullets: [
      "Passe le relais à un autre modérateur ou à un admin",
      "Préviens dans le salon staff ou le canal prévu par l'équipe",
      "Tu peux demander une seconde lecture — c'est une force, pas une faiblesse",
    ],
    tags: ["Conflit"],
    audiences: ["tous"],
    keywords: ["émotion", "conflit d'intérêt", "relais"],
  },
  {
    id: 13,
    slug: "confidentialite",
    emoji: "🔒",
    title: "Confidentialité & informations sensibles",
    summary: "Ce qui se dit en staff reste en staff — sauf communication officielle validée.",
    bullets: [
      "Salons staff, signalements et CR réunion : confidentiels.",
      "Pas de mesure, vote staff ou détail de dossier en public.",
      "Pas d'exposition d'un membre (santé, famille, vie privée) — remontée, pas de commentaire public.",
      "Captures : canal staff dédié uniquement (détails MP → article 14).",
    ],
    warnings: [
      "Parler d'un membre absent dans un MP informel entre staff",
      "Diffuser une capture hors canal staff dédié",
      "Utiliser une info staff pour régler un conflit personnel",
    ],
    examples: [
      {
        situation: "Capture reçue d'un membre",
        bad: "Groupe perso ou salon public.",
        good: "Canal staff adapté, contexte, infos sensibles masquées si possible.",
      },
    ],
    tags: ["Confidentialité"],
    audiences: ["tous"],
    keywords: ["confidentialité", "capture", "fuite", "staff"],
  },
  {
    id: 14,
    slug: "mp",
    emoji: "📩",
    title: "Messages privés & preuves",
    summary: "En MP de modération, tu représentes TENF — chaque mot compte.",
    intro: "MP de modération = parole TENF. Même sérieux qu'en public (ton : article 10).",
    bullets: [
      "Neutre, factuel, respectueux ; trace si nécessaire.",
      "Preuves : canal staff dédié, pas en public (confidentialité : article 13).",
      "Pas de stockage inutile sur appareil personnel.",
    ],
    warnings: [
      "MP émotionnels, ironiques, accusateurs ou humiliants",
      "Groupe MP pour parler d'un membre absent",
      "Pression ou influence en coulisses via MP",
    ],
    note: "Cas grave (abus, fuite, harcèlement) → article 18–19. Décision des fondateurs, pas d'un modo seul.",
    tags: ["MP", "Confidentialité"],
    audiences: ["moderateur", "admin"],
    keywords: ["mp", "message privé", "preuve"],
  },
  {
    id: 15,
    slug: "parole-officielle",
    emoji: "📢",
    title: "Parole officielle vs avis personnel",
    summary: "Ne promets jamais une décision qui n'est pas validée.",
    bullets: [
      "Avis personnel : « Je pense que… », « À ta place je… » — hors cadre staff validé.",
      "Parole officielle TENF : annonce, MP de modération, position publique sur un conflit.",
      "En doute : « Je remonte la situation au staff » — sans inventer la réponse.",
    ],
    warnings: [
      "Annoncer une mesure non validée",
      "Parler au nom de TENF sans mandat",
      "Confondre ton ressenti et la position du staff",
    ],
    tags: ["Rôle", "MP"],
    audiences: ["tous"],
    keywords: ["parole officielle", "avis", "annonce"],
  },
  {
    id: 16,
    slug: "dramas-anciens",
    emoji: "🌊",
    title: "Dramas, tensions & anciens membres",
    summary: "Tu n'alimentes pas le drama — tu protèges l'ambiance.",
    bullets: [
      "Pas de spec, moqueries publiques ou « tea » sur un membre, même sous couvert d'humour.",
      "Ne pas régler tes comptes personnels avec ton rôle staff.",
      "Avec un ancien membre ou ancien staff : même neutralité, pas d'autorité résiduelle.",
      "Ne pas partager d'informations staff récentes avec des personnes hors cadre officiel.",
    ],
    examples: [
      {
        situation: "Drama externe (Twitter, etc.)",
        bad: "Répondre sur Discord pour « clore » le sujet.",
        good: "Remontée staff, pas d'alimentation du salon public.",
      },
      {
        situation: "Ancien modo critique le staff",
        bad: "Prestige d'ancien rôle ou fuite d'infos internes.",
        good: "Neutralité, remontée, confidentialité (article 13).",
      },
    ],
    tags: ["Conflit"],
    audiences: ["moderateur", "soutien", "admin", "ancien_staff"],
    keywords: ["drama", "ancien", "tension"],
  },
  {
    id: 17,
    slug: "formation-presence",
    emoji: "🛠️",
    title: "Présence, formation & vie d'équipe",
    summary: "On ne demande pas une présence parfaite — mais de la visibilité pour protéger tout le monde.",
    intro:
      "La vie passe avant tout. Ce qu'on attend, c'est de pouvoir compter sur toi quand tu es actif(ve), et de savoir quand tu ne l'es plus — sans jugement.",
    bullets: [
      "Absence, pause ou baisse d'activité : prévenir quand tu peux.",
      "Annonces staff et CR si tu as manqué une réunion.",
      "Suivi en cours : ne pas disparaître — passe le relais.",
      "Dossier sensible : ne pas le prendre si tu ne pourras pas le mener au bout.",
      "Formations et points staff selon ton rôle.",
      "Pause ou activité réduite : pas d'intervention officielle (article 4). Au retour : relire les infos clés.",
      "Retours du staff : ils font partie du rôle.",
    ],
    retainBox: "Une activité réduite peut temporairement limiter ton périmètre d'action : c'est normal, pas une punition.",
    tags: ["Rôle"],
    audiences: ["moderateur", "decouverte", "pause", "activite_reduite"],
    keywords: ["absence", "réunion", "présence", "pause", "annonce"],
  },
  {
    id: 18,
    slug: "abus-pouvoir",
    emoji: "⛔",
    title: "Aucun abus de pouvoir",
    summary: "Pression, favoritisme et intimidation ne sont pas acceptés — sans ambiguïté.",
    warnings: [
      "Mesure injustifiée ou favoritisme",
      "Décision émotionnelle pour « faire exemple »",
      "Intimidation, pression ou règlement de compte via le rôle",
      "Info privée utilisée contre quelqu'un",
      "Harcèlement ou acharnement — article 9",
    ],
    note: "Abus grave → retrait possible (article 19). TENF protège la communauté.",
    tags: ["Urgent"],
    audiences: ["moderateur", "admin", "fondateur"],
    keywords: ["abus", "pouvoir", "favoritisme"],
  },
  {
    id: 19,
    slug: "consequences",
    emoji: "📋",
    title: "Conséquences possibles",
    summary: "Échelle indicative — la décision finale revient aux fondateurs ou admins habilités.",
    intro: "L'article 18 décrit les abus ; ici l'échelle des suites possibles. Objectif : protéger, pas punir pour punir.",
    bullets: [
      "Rappel ou recadrage",
      "Accompagnement renforcé ou retour en découverte",
      "Pause ou retrait temporaire du rôle",
      "Perte du rôle staff",
      "Exclusion du serveur — cas les plus graves uniquement",
    ],
    note: "Liste indicative. Contexte et preuves à chaque fois. Décision : fondateurs ou admins habilités.",
    tags: ["Urgent"],
    audiences: ["admin", "moderateur", "fondateur"],
    keywords: ["conséquence", "mesure", "exclusion", "sanction"],
  },
  {
    id: 20,
    slug: "engagement",
    emoji: "✅",
    title: "Ton engagement",
    summary: "En validant, tu confirmes avoir lu et accepté ce cadre pour le statut qui est le tien.",
    intro: "En validant cette charte, tu t'engages à :",
    bullets: [
      "Agir avec méthode et respecter la confidentialité",
      "Remonter ce qui te dépasse — sans attendre que ça explose",
      "Accepter les retours et continuer à progresser",
      "Respecter les limites liées à ton statut (modo, soutien, découverte, pause, activité réduite)",
    ],
    retainBox: "On t'accueille dans une équipe sérieuse. On te fait confiance, avec un cadre clair pour protéger tout le monde.",
    tags: ["Valeurs"],
    audiences: ["tous"],
    keywords: ["engagement", "signature", "validation"],
  },
];

export const CHARTE_TABS: CharteTab[] = [
  {
    key: "bienvenue",
    label: "Bienvenue & esprit TENF",
    shortLabel: "Bienvenue",
    description: "Pourquoi cette charte et ce que représente TENF.",
    sectionIds: [1, 2, 3],
  },
  {
    key: "roles",
    label: "Rôles & mandats",
    shortLabel: "Rôles",
    description: "Ce que tu peux faire selon ton statut — lis ta ligne.",
    sectionIds: [4, 5],
  },
  {
    key: "methode",
    label: "Méthode de modération",
    shortLabel: "Méthode",
    description: "Analyser, agir, communiquer avec des exemples concrets.",
    sectionIds: [6, 7, 8, 9, 10],
  },
  {
    key: "conflits",
    label: "Conflits & parole publique",
    shortLabel: "Conflits",
    description: "Remontée, émotions, mineurs, dramas.",
    sectionIds: [11, 12, 15, 16],
  },
  {
    key: "confidentialite",
    label: "Confidentialité & MP",
    shortLabel: "Confidentiel",
    description: "Staff, preuves, messages privés.",
    sectionIds: [13, 14],
  },
  {
    key: "vie-staff",
    label: "Vie staff & cadre",
    shortLabel: "Vie staff",
    description: "Présence, abus, conséquences.",
    sectionIds: [17, 18, 19],
  },
  {
    key: "engagement",
    label: "Engagement",
    shortLabel: "Signature",
    description: "Validation finale de ta lecture.",
    sectionIds: [20],
  },
];

export const MIN_SECONDS_BETWEEN_BLOCK_VALIDATIONS = 8;

export const CHARTE_AUDIENCE_LABELS: Record<CharteAudience, string> = {
  tous: "Tous",
  fondateur: "Fondateurs",
  admin: "Admins",
  moderateur: "Modération",
  decouverte: "Découverte",
  accompagnement: "Accompagnement",
  pause: "Pause",
  activite_reduite: "Activité réduite",
  soutien: "Soutien",
  ancien_staff: "Ancien staff",
};

export const CHARTE_AUDIENCE_COLORS: Record<CharteAudience, string> = {
  tous: "border-zinc-400/30 bg-zinc-500/10 text-zinc-200",
  fondateur: "border-amber-400/30 bg-amber-500/10 text-amber-100",
  admin: "border-indigo-400/30 bg-indigo-500/10 text-indigo-200",
  moderateur: "border-violet-400/30 bg-violet-500/10 text-violet-200",
  decouverte: "border-sky-400/30 bg-sky-500/10 text-sky-200",
  accompagnement: "border-teal-400/30 bg-teal-500/10 text-teal-200",
  pause: "border-slate-400/30 bg-slate-500/10 text-slate-200",
  activite_reduite: "border-slate-400/30 bg-slate-600/10 text-slate-200",
  soutien: "border-emerald-400/30 bg-emerald-500/10 text-emerald-200",
  ancien_staff: "border-zinc-500/30 bg-zinc-600/10 text-zinc-300",
};

export const CHARTE_TAG_COLORS: Record<CharteTag, string> = {
  Valeurs: "border-violet-400/30 bg-violet-500/10 text-violet-200",
  Rôle: "border-indigo-400/30 bg-indigo-500/10 text-indigo-200",
  Méthode: "border-cyan-400/30 bg-cyan-500/10 text-cyan-200",
  Conflit: "border-amber-400/30 bg-amber-500/10 text-amber-200",
  Confidentialité: "border-slate-400/30 bg-slate-500/10 text-slate-200",
  MP: "border-fuchsia-400/30 bg-fuchsia-500/10 text-fuchsia-200",
  Urgent: "border-rose-400/30 bg-rose-500/10 text-rose-200",
};

export function getCharteSectionAnchor(id: number): string {
  return `charte-art-${id}`;
}

/** Recherche simple sur titre, résumé, contenu et mots-clés */
export function sectionMatchesSearch(section: CharteSection, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const parts: string[] = [
    section.title,
    section.summary,
    section.intro ?? "",
    section.retainBox ?? "",
    section.note ?? "",
    section.callout?.title ?? "",
    section.callout?.body ?? "",
    ...(section.bullets ?? []),
    ...(section.warnings ?? []),
    ...(section.steps ?? []),
    ...(section.keywords ?? []),
    ...section.tags,
    ...section.audiences.map((a) => CHARTE_AUDIENCE_LABELS[a]),
    ...(section.examples?.flatMap((e) => [e.situation, e.bad, e.good, e.remonter ?? ""]) ?? []),
    ...(section.comparison?.flatMap((c) => [c.bad, c.good]) ?? []),
  ];
  return parts.join(" ").toLowerCase().includes(q);
}

export function findTabIndexForSection(sectionId: number): number {
  return CHARTE_TABS.findIndex((tab) => tab.sectionIds.includes(sectionId));
}

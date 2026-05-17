import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  CalendarDays,
  Compass,
  HeartHandshake,
  LayoutGrid,
  Map,
  UserPlus,
  Users,
} from "lucide-react";

/** Aligné sur `NAV_GROUPS` dans components/Header.tsx (mai 2026). */

export type GuidePageEntry = {
  href: string;
  label: string;
  description: string;
  when?: string;
  memberAction?: boolean;
};

export type GuideChapter = {
  id: string;
  slug: string;
  menuLabel: string;
  title: string;
  subtitle: string;
  readTime: string;
  icon: LucideIcon;
  accent: string;
  goal: string;
  intro: string;
  recommendedPath: string[];
  pages: GuidePageEntry[];
  extraPages?: GuidePageEntry[];
  tips: string[];
  faq: { q: string; a: string }[];
};

export const GUIDE_PUBLIC_BASE = "/guides/partie-publique";

export const guideChapters: GuideChapter[] = [
  {
    id: "decouvrir",
    slug: "decouvrir",
    menuLabel: "Découvrir",
    title: "Découvrir TENF",
    subtitle: "Comprendre qui nous sommes, comment le collectif fonctionne et quelles règles nous partageons — avant de t’engager.",
    readTime: "12 min",
    icon: Compass,
    accent: "#22d3ee",
    goal: "Tu arrives sur TENF sans connaître le projet, ou tu veux vérifier que l’esprit du collectif te correspond avant de candidater.",
    recommendedPath: ["À propos de TENF", "Comment ça marche", "Charte communautaire", "FAQ générale"],
    intro:
      "Ce chapitre répond à **« C’est quoi TENF et est-ce fait pour moi ? »** Lis d’abord l’à-propos et le fonctionnement, puis la charte : c’est le socle de tout le reste. Aucune inscription n’est nécessaire — avance à ton rythme et note les pages qui t’interpellent.",
    pages: [
      {
        href: "/",
        label: "Accueil",
        description:
          "Page d’accueil du site : en quelques scrolls tu vois la promesse TENF, les accès rapides vers les sections importantes et les actualités mises en avant.",
        when: "C’est ta toute première visite, ou tu veux montrer le site à un·e ami·e streamer·euse en un seul lien.",
      },
      {
        href: "/a-propos",
        label: "À propos de TENF",
        description:
          "L’histoire du collectif, ses valeurs (entraide, bienveillance, progression) et la vision long terme. Idéal pour comprendre **pourquoi** TENF existe, pas seulement **comment** il marche.",
        when: "Avant toute décision de rejoindre — pour savoir si tu partages la même vision du streaming communautaire.",
      },
      {
        href: "/fonctionnement-tenf/comment-ca-marche",
        label: "Comment ça marche",
        description:
          "Le mode d’emploi détaillé : Spotlights, raids, événements, points d’engagement, rôles… Tout ce qui structure la vie du collectif une fois membre, expliqué clairement.",
        when: "Tu as lu l’à-propos et tu veux le détail concret : « concrètement, qu’est-ce que je ferai dans TENF ? »",
      },
      {
        href: "/charte",
        label: "Charte communautaire",
        description:
          "Les règles de vie du serveur : respect, entraide, participation, sanctions possibles. Document court mais essentiel — c’est l’accord moral entre tous les membres.",
        when: "Juste avant de postuler ou de participer activement — pour éviter les mauvaises surprises après intégration.",
      },
      {
        href: "/fonctionnement-tenf/faq",
        label: "FAQ générale",
        description:
          "Réponses ciblées aux questions récurrentes (Spotlight, raids, VIP, délais, éligibilité…). Utilise-la comme raccourci plutôt que de tout relire.",
        when: "Tu as un doute précis et tu cherches une réponse rapide sans parcourir tout le site.",
      },
      {
        href: "/changelog",
        label: "Nouveautés du site",
        description:
          "Historique des mises à jour du site et des outils membres. Utile pour voir ce qui a changé depuis ta dernière visite ou comprendre une nouvelle fonctionnalité.",
        when: "Tu es déjà membre ou tu reviens après plusieurs semaines sans te connecter.",
      },
    ],
    extraPages: [
      {
        href: "/fonctionnement-tenf/decouvrir",
        label: "Fonctionnement — porte d’entrée",
        description: "Sommaire du parcours « fonctionnement » : liens vers tous les sous-thèmes (progression, communauté, ressources…).",
        when: "Tu veux explorer le fonctionnement thème par thème plutôt qu’en une seule longue page.",
      },
      {
        href: "/fonctionnement-tenf/progression",
        label: "Progression membre",
        description: "Comment tu évolues dans TENF après l’intégration : paliers, reconnaissance, implication dans le collectif.",
        when: "Tu envisages de rejoindre et tu veux savoir à quoi t’attendre à moyen terme.",
      },
      {
        href: "/fonctionnement-tenf/communaute",
        label: "Communauté & activités",
        description: "Panorama des animations régulières : soirées, formats récurrents, rituels entre membres.",
        when: "Tu veux une vue d’ensemble des activités avant de te lancer dans le Discord.",
      },
      {
        href: "/fonctionnement-tenf/ressources",
        label: "Ressources & aide",
        description: "Liens utiles, guides et contenus pour progresser côté technique ou créatif (hors espace membre privé).",
        when: "Tu cherches de l’aide sur le streaming en complément de la communauté.",
      },
      {
        href: "/fonctionnement-tenf/parcours-complet",
        label: "Parcours complet",
        description: "Synthèse linéaire du parcours membre de l’arrivée à l’implication active — la « grande carte » du fonctionnement.",
        when: "Tu préfères tout lire d’un bloc dans un ordre logique.",
      },
      {
        href: "/contact",
        label: "Contact",
        description: "Formulaire pour joindre l’équipe TENF hors Discord (presse, partenariat léger, question administrative).",
        when: "Tu n’es pas encore sur Discord ou ta demande ne rentre pas dans un ticket classique.",
      },
    ],
    tips: [
      "Parcours minimal avant de rejoindre : **À propos** → **Comment ça marche** → **Charte** (environ 15–20 min).",
      "Si un terme te perd (Spotlight, raid TENF…), ouvre la **FAQ** plutôt que d’abandonner.",
      "Après ce chapitre, enchaîne avec **Communauté** pour voir des créateurs réels — la théorie prend vie.",
    ],
    faq: [
      {
        q: "Dois-je tout lire avant de rejoindre ?",
        a: "Non. À propos + charte + un passage sur « Comment ça marche » suffisent pour te faire une opinion honnête. Le reste sert à approfondir ou à revenir plus tard.",
      },
      {
        q: "« Comment ça marche » ou le guide nouveau membre (/guides/tenf) ?",
        a: "« Comment ça marche » = vitrine publique, lisible sans compte. Le guide /guides/tenf = culture et rituels une fois que tu es membre (ou sur le point de l’être).",
      },
      {
        q: "Je ne stream pas encore, TENF est-il pour moi ?",
        a: "Le collectif s’adresse aux créateurs Twitch (ou en passe de l’être). Lis l’à-propos et la FAQ : tu y verras les critères et l’esprit attendu.",
      },
    ],
  },
  {
    id: "communaute",
    slug: "communaute",
    menuLabel: "Communauté",
    title: "Communauté & créateurs",
    subtitle: "Rencontrer les membres, regarder des lives, des clips et lire des témoignages — la vitrine humaine de TENF.",
    readTime: "15 min",
    icon: Users,
    accent: "#38bdf8",
    goal: "Tu veux constater par toi-même l’ambiance du collectif : qui stream, comment ils s’entraident, ce qu’ils en disent.",
    recommendedPath: ["Membres", "Lives en cours", "Témoignages", "Interviews TENF"],
    intro:
      "Ici, tu passes de la théorie à **des personnes réelles**. L’annuaire te montre qui fait partie du collectif ; les lives et clips te donnent l’ambiance ; les témoignages répondent à « est-ce que ça vaut le coup ? ». Parcours ces pages dans l’ordre conseillé ou saute directement à ce qui t’intéresse.",
    pages: [
      {
        href: "/membres",
        label: "Membres",
        description:
          "Annuaire public de tous les créateurs TENF : pseudo, jeux, langues, lien Twitch, parfois statut en live. Tu peux filtrer et ouvrir une fiche membre détaillée.",
        when: "Tu cherches des chaînes à suivre, un profil précis, ou tu veux voir la diversité du collectif.",
      },
      {
        href: "/vip",
        label: "Membres VIP",
        description:
          "Chaque mois, la communauté met en avant des membres sélectionnés. Tu y découvres des profils recommandés et l’actualité de la mise en avant du moment.",
        when: "Tu veux des suggestions « coups de cœur » sans parcourir tout l’annuaire.",
      },
      {
        href: "/lives",
        label: "Lives en cours",
        description:
          "Liste des membres **en live maintenant** sur Twitch, avec accès direct aux chaînes. Le moyen le plus rapide de rejoindre un stream TENF.",
        when: "Tu as 10 minutes et tu veux voir l’entraide en direct (chat, raid, ambiance).",
      },
      {
        href: "/lives/calendrier",
        label: "Calendrier des lives",
        description:
          "Planning des créneaux annoncés par les membres pour la semaine à venir. Pratique pour organiser tes raids ou ton viewing.",
        when: "Tu veux planifier ta semaine plutôt que du spontané uniquement.",
      },
      {
        href: "/decouvrir-createurs",
        label: "Clips à découvrir",
        description:
          "Sélection de clips courts pour goûter l’humour, le skill ou l’ambiance des chaînes — sans s’engager sur un long live.",
        when: "Tu découvres TENF et tu préfères un format rapide avant de t’abonner à une chaîne.",
      },
      {
        href: "/interviews",
        label: "Interviews TENF",
        description:
          "Portraits et échanges longs avec des membres : parcours, difficultés, ce que TENF leur apporte. Plus narratif que l’annuaire.",
        when: "Tu veux comprendre le vécu derrière les pseudos, pas seulement les stats.",
      },
      {
        href: "/avis-tenf",
        label: "Témoignages",
        description:
          "Retours authentiques de membres sur leur expérience (intégration, entraide, événements). Idéal pour lever les derniers doutes avant de rejoindre.",
        when: "Tu hésites encore et tu as besoin de preuves sociales concrètes.",
      },
    ],
    extraPages: [
      {
        href: "/membres/planning",
        label: "Planning membres",
        description: "Vue planning alternative à l’annuaire, orientée créneaux et disponibilités.",
        when: "Tu organises des sessions communes et tu cherches qui stream quand.",
      },
      {
        href: "/vip/clips",
        label: "Clips VIP",
        description: "Extraits des membres actuellement mis en avant — pour découvrir leurs meilleurs moments.",
        when: "Tu consultes la page VIP et tu veux aller plus loin en format court.",
      },
      {
        href: "/vip/historique",
        label: "Historique VIP",
        description: "Archives des mises en avant des mois passés — utile pour retrouver un ancien VIP.",
        when: "Tu cherches un membre qui a été VIP il y a quelques mois.",
      },
    ],
    tips: [
      "Combo efficace : **Lives en cours** (maintenant) + **Calendrier** (cette semaine) = tu ne rates rien d’important.",
      "Avant de rejoindre, lis **2 ou 3 témoignages** — souvent plus parlants qu’une dizaine de fiches annuaire.",
      "Les fiches membre sont **publiques** : tu peux en envoyer une à quelqu’un sans qu’il ait de compte TENF.",
    ],
    faq: [
      {
        q: "Puis-je participer à un raid depuis ces pages ?",
        a: "Non. Tu peux regarder et découvrir. Pour lancer ou déclarer un raid TENF, connecte-toi avec Discord et utilise l’espace membre (/member).",
      },
      {
        q: "Le VIP, c’est payant ?",
        a: "Non. C’est une mise en avant communautaire gratuite, renouvelée régulièrement — pas un abonnement ou un statut acheté.",
      },
      {
        q: "Je ne trouve pas un membre dans l’annuaire",
        a: "Seuls les membres actifs du collectif y figurent. Si la personne n’est pas membre TENF, elle n’apparaîtra pas.",
      },
    ],
  },
  {
    id: "agenda",
    slug: "agenda",
    menuLabel: "Agenda",
    title: "Agenda & événements",
    subtitle: "Voir ce qui se passe bientôt, comprendre les grands rendez-vous et comment les membres proposent leurs idées.",
    readTime: "10 min",
    icon: CalendarDays,
    accent: "#34d399",
    goal: "Tu veux savoir quels événements arrivent, comment y participer plus tard, ou comprendre le rôle de la communauté dans l’animation.",
    recommendedPath: ["Événements", "New Family Aventura", "Proposer un événement"],
    intro:
      "Les événements TENF rythment la vie du collectif : soirées staff, formats communautaires, grand rendez-vous annuel. **Tu peux tout consulter sans compte** ; pour t’inscrire à un créneau, il faudra en général être membre connecté·e avec Discord.",
    pages: [
      {
        href: "/evenements",
        label: "Événements",
        description:
          "Calendrier officiel des événements TENF (dates, descriptions, parfois inscription). C’est la référence pour « qu’est-ce qui est prévu ? »",
        when: "Tu veux la liste à jour des prochains rendez-vous du collectif.",
        memberAction: true,
      },
      {
        href: "/evenements-communautaires",
        label: "Proposer un événement",
        description:
          "Espace où les membres soumettent des idées, votent et discutent. Même en lecture seule, tu comprends comment naît un event côté communauté.",
        when: "Tu veux voir la démarche participative avant de proposer ta propre idée (une fois membre).",
        memberAction: true,
      },
      {
        href: "/new-family-aventura",
        label: "New Family Aventura",
        description:
          "Page du rendez-vous phare de l’année : concept, édition en cours, liens vers infos pratiques et souvenirs des éditions passées.",
        when: "Tu entends parler d’« Aventura » et tu veux comprendre de quoi il s’agit.",
      },
    ],
    extraPages: [
      {
        href: "/new-family-aventura/infos-pratiques",
        label: "Aventura — infos pratiques",
        description: "Dates, lieux ou modalités, conditions de participation — tout le concret pour s’organiser.",
        when: "Tu as décidé de t’intéresser à l’édition en cours et tu passes à la logistique.",
      },
      {
        href: "/new-family-aventura/faq",
        label: "Aventura — FAQ",
        description: "Réponses aux questions les plus posées sur l’édition actuelle (inscription, déroulé, éligibilité…).",
        when: "Tu as un blocage précis sur Aventura avant de t’engager.",
      },
      {
        href: "/events2",
        label: "Calendrier (alias)",
        description: "Ancienne adresse du calendrier — redirige vers le même contenu que /evenements.",
        when: "Tu as un vieux lien ou un favori qui pointe vers /events2.",
      },
    ],
    tips: [
      "Ordre conseillé : **Événements** (officiel) → **New Family Aventura** (gros rendez-vous) → **Proposer un événement** (côté membres).",
      "Note les dates qui t’intéressent : l’inscription se fera plus tard depuis ton espace membre.",
      "Les pages Aventura ont plusieurs niveaux : commence par la page principale avant les FAQ.",
    ],
    faq: [
      {
        q: "Puis-je m’inscrire sans être membre ?",
        a: "Tu peux lire toutes les infos. L’inscription aux créneaux se fait en général après intégration et connexion Discord, depuis l’espace membre.",
      },
      {
        q: "Où est le menu « Agenda » sur le site ?",
        a: "Les événements sont accessibles via le menu et les liens du site. Ce chapitre du guide regroupe toutes les URLs utiles au même endroit.",
      },
    ],
  },
  {
    id: "rejoindre",
    slug: "rejoindre",
    menuLabel: "Rejoindre",
    title: "Rejoindre & s’intégrer",
    subtitle: "La procédure officielle pour entrer dans le collectif : étapes, réunion d’accueil, compte Discord et guides après connexion.",
    readTime: "18 min",
    icon: UserPlus,
    accent: "#c084fc",
    goal: "Tu as décidé (ou presque) de rejoindre TENF et tu cherches la marche à suivre, dans le bon ordre.",
    recommendedPath: [
      "Vue d’ensemble — Rejoindre TENF",
      "FAQ — comment rejoindre",
      "Réunion d’intégration",
      "Guide d’intégration",
    ],
    intro:
      "Ce chapitre décrit **où cliquer sur le site** pour entrer dans TENF. Pour le tutoriel technique (créer le compte, lier Twitch), utilise le **guide public** `/rejoindre/guide-public` — ce n’est pas la même chose que cette carte. Ordre recommandé : hub Rejoindre → FAQ si blocage → réunion d’intégration.",
    pages: [
      {
        href: "/rejoindre",
        label: "Vue d’ensemble — Rejoindre TENF",
        description:
          "Point de départ officiel : étapes du parcours, avantages du collectif, liens vers l’intégration et réponses aux questions courantes. **Commence toujours ici.**",
        when: "Tu as validé mentalement que TENF te convient et tu veux la feuille de route complète.",
      },
      {
        href: "/integration",
        label: "Réunion d’intégration",
        description:
          "Calendrier des créneaux d’accueil et formulaire de réservation. C’est le rendez-vous humain avec l’équipe pour finaliser ton entrée dans le collectif.",
        when: "Tu es prêt·e à prendre rendez-vous — après avoir lu le hub Rejoindre et la FAQ.",
        memberAction: true,
      },
      {
        href: "/rejoindre/guide-integration",
        label: "Guide d’intégration",
        description:
          "Mode d’emploi linéaire avant et après la réunion : quoi préparer, quoi faire le jour J, premiers pas sur Discord et sur le site membre.",
        when: "Tu as réservé (ou tu vas réserver) ta réunion et tu veux arriver préparé·e.",
      },
      {
        href: "/rejoindre/faq",
        label: "FAQ — comment rejoindre",
        description:
          "Réponses aux peurs fréquentes : délais, prérequis Twitch, Discord obligatoire, que faire si on refuse, etc.",
        when: "Tu es bloqué·e sur une étape précise ou tu as une objection avant de t’engager.",
      },
      {
        href: "/guides/tenf",
        label: "Guide nouveau membre",
        description:
          "Culture TENF après l’intégration : rituels, Spotlights, entraide au quotidien, événements. À lire une fois accueilli·e dans le collectif.",
        when: "Tu viens d’être intégré·e ou tu veux anticiper la vie membre avant la réunion.",
      },
      {
        href: "/guides/espace-membre",
        label: "Guide espace membre",
        description:
          "Carte interactive de tout le menu /member : dashboard, raids, profil, notifications… Pour ne plus te perdre une fois connecté·e.",
        when: "Tu as un compte Discord lié et tu explores ton espace pour la première fois.",
      },
      {
        href: "/postuler",
        label: "Postuler au staff",
        description:
          "Candidature pour rejoindre l’équipe bénévole (modération, animation, technique…). Distinct du parcours « membre streamer ».",
        when: "Tu veux aider à faire tourner TENF, pas seulement streamer en tant que membre.",
      },
    ],
    extraPages: [
      {
        href: "/rejoindre/guide-public",
        label: "Guide public (pas à pas)",
        description:
          "Tutoriel technique : présentation, connexion Discord, création d’espace, liaison Twitch. **À utiliser en parallèle de ce chapitre.**",
        when: "Tu bloques sur la technique (compte, OAuth Twitch) plutôt que sur la procédure globale.",
      },
      {
        href: "/rejoindre/guide-public/presentation-rapide",
        label: "→ Présentation rapide",
        description: "Première étape du tutoriel : vue d’ensemble en 2 minutes avant de créer ton compte.",
        when: "Tu ouvres le guide public et tu suis l’ordre proposé.",
      },
      {
        href: "/rejoindre/guide-public/creer-un-compte",
        label: "→ Créer un compte",
        description: "Connexion Discord et création de ton espace membre sur tenf.fr.",
        when: "Tu as lu la présentation et tu passes à l’action technique.",
      },
      {
        href: "/rejoindre/guide-public/liaison-twitch",
        label: "→ Liaison Twitch",
        description: "Lier ta chaîne Twitch pour activer raids, profil public et fonctionnalités liées au stream.",
        when: "Ton compte existe mais les outils membre te demandent encore Twitch.",
      },
      {
        href: "/rejoindre/guide-espace-membre",
        label: "Guide espace membre (linéaire)",
        description: "Version pas à pas du dashboard (alternative à la carte interactive /guides/espace-membre).",
        when: "Tu préfères un tutoriel séquentiel plutôt qu’une carte cliquable.",
      },
      {
        href: "/auth/login",
        label: "Se connecter avec Discord",
        description: "Bouton officiel de connexion — point d’entrée unique pour accéder à l’espace membre.",
        when: "Tu as déjà un compte et tu veux te connecter directement.",
        memberAction: true,
      },
    ],
    tips: [
      "**Ce guide** = où cliquer sur le site public. **/rejoindre/guide-public** = comment faire techniquement (Discord, Twitch).",
      "Ne saute pas le hub **/rejoindre** : il évite de réserver une intégration sans avoir compris le parcours.",
      "Après la réunion, enchaîne avec **/guides/tenf** puis **/guides/espace-membre** pour les premières semaines.",
    ],
    faq: [
      {
        q: "Quelle différence entre /rejoindre et /integration ?",
        a: "/rejoindre = comprendre et accepter le parcours global. /integration = choisir un créneau et réserver ta réunion d’accueil.",
      },
      {
        q: "Ce chapitre ou le guide public — lequel en premier ?",
        a: "Lis d’abord le hub /rejoindre (vision). Utilise /rejoindre/guide-public quand tu passes à la création de compte et à Twitch.",
      },
      {
        q: "Combien de temps entre candidature et intégration ?",
        a: "Variable selon les créneaux disponibles. La FAQ Rejoindre et le hub donnent les ordres de grandeur actuels.",
      },
    ],
  },
  {
    id: "tenf-plus",
    slug: "tenf-plus",
    menuLabel: "TENF+",
    title: "TENF+, soutien & transparence",
    subtitle: "Formation Academy, équipe staff, partenariats, boutique et autres façons de s’impliquer autour du collectif.",
    readTime: "12 min",
    icon: LayoutGrid,
    accent: "#f472b6",
    goal: "Tu veux aller au-delà du streaming membre : te former, connaître l’équipe, soutenir le projet ou collaborer.",
    recommendedPath: ["Staff & organisation", "Academy", "Soutenir TENF", "Contact"],
    intro:
      "Le menu **TENF+** regroupe tout ce qui entoure le cœur « membre streamer » : qui fait tourner le projet, comment te former, comment soutenir ou proposer un partenariat. La plupart des pages sont lisibles sans compte ; l’Academy peut demander une connexion selon les campagnes.",
    pages: [
      {
        href: "/academy",
        label: "Academy",
        description:
          "Programmes d’accompagnement et promotions pour progresser en tant que streamer TENF. Présentation des vagues, critères et bénéfices.",
        when: "Tu es membre (ou futur membre) et tu cherches une formation structurée.",
        memberAction: true,
      },
      {
        href: "/organisation-staff",
        label: "Staff & organisation",
        description:
          "Qui compose l’équipe bénévole, quels pôles existent (modération, animation, technique…) et quelle est leur mission.",
        when: "Tu veux savoir qui anime TENF avant d’envoyer un message ou une candidature staff.",
      },
      {
        href: "/organisation-staff/organigramme",
        label: "Organigramme interactif",
        description:
          "Schéma cliquable des pôles et contacts. Indispensable pour savoir **qui** contacter selon ton sujet.",
        when: "Tu as une demande précise et tu ne veux pas poster au mauvais endroit sur Discord.",
      },
      {
        href: "/partenariats",
        label: "Partenariats",
        description:
          "Modalités pour proposer une collaboration professionnelle avec TENF (marques, médias, projets externes).",
        when: "Tu représentes une structure hors collectif et tu veux un cadre officiel.",
      },
      {
        href: "/partenaire-tenf",
        label: "UPA × Ligue contre le cancer",
        description:
          "Partenariat caritatif emblématique du collectif : actions passées, impact, comment s’impliquer.",
        when: "Tu découvres la dimension solidaire de TENF au-delà du streaming.",
      },
      {
        href: "/soutenir-tenf",
        label: "Soutenir TENF",
        description:
          "Toutes les façons d’aider le projet (don, visibilité, bénévolat hors staff…) — hors simple adhésion membre.",
        when: "Tu veux contribuer sans forcément streamer au sein du collectif.",
      },
      {
        href: "/boutique",
        label: "Boutique",
        description:
          "Goodies et produits dérivés TENF. Les achats soutiennent le projet ; ce n’est pas la page qui explique les options de don.",
        when: "Tu veux acheter un produit ou offrir un goodie TENF.",
      },
      {
        href: "/contact",
        label: "Contact",
        description:
          "Formulaire pour l’équipe quand Discord n’est pas adapté (presse, demande formelle, partenariat léger).",
        when: "Tu n’as pas encore accès au Discord ou tu as besoin d’un contact « officiel » écrit.",
      },
    ],
    extraPages: [
      {
        href: "/vip",
        label: "Membres VIP",
        description: "Même contenu que via le menu Communauté — mise en avant mensuelle des membres.",
        when: "Tu arrives depuis TENF+ et tu cherches la page VIP sans repasser par Communauté.",
      },
    ],
    tips: [
      "Avant un ticket Discord sensible, consulte l’**organigramme** pour viser le bon pôle.",
      "**Soutenir TENF** explique les options ; la **boutique** vend les produits — deux pages complémentaires, pas interchangeables.",
      "Candidature staff : page **Postuler** (chapitre Rejoindre), pas confondre avec devenir membre streamer.",
    ],
    faq: [
      {
        q: "L’Academy est-elle réservée aux membres ?",
        a: "La présentation est publique. S’inscrire à une promotion demande en général d’être membre connecté·e et de remplir les critères de la campagne en cours.",
      },
      {
        q: "Comment proposer un partenariat ?",
        a: "Commence par /partenariats pour une collaboration classique. Pour le caritatif UPA, vois aussi /partenaire-tenf.",
      },
      {
        q: "Je veux aider sans streamer — par où aller ?",
        a: "Regarde Soutenir TENF et Postuler au staff (chapitre Rejoindre) selon que tu veux donner du temps bénévole ou rejoindre l’équipe.",
      },
    ],
  },
];

export type GuideParcoursStep = {
  id: string;
  title: string;
  duration: string;
  body: string;
  links: { href: string; label: string }[];
  chapterSlug?: string;
};

export const hubQuickStart = [
  {
    step: 1,
    title: "Identifie ton objectif",
    body: "Découvrir, observer la communauté, rejoindre ou gérer ton espace membre : les cartes « Tu es plutôt… » t’envoient au bon chapitre sans tout lire.",
  },
  {
    step: 2,
    title: "Parcours un chapitre",
    body: "Chaque chapitre liste les pages du menu correspondant. Lis la description, regarde « Quand y aller », puis ouvre la page sur le site si tu es prêt·e.",
  },
  {
    step: 3,
    title: "Passe à l’action sur tenf.fr",
    body: "Le bouton « Ouvrir la page » t’emmène sur la vraie page. Garde ce guide ouvert dans un onglet pour revenir au plan d’ensemble.",
  },
] as const;

export type HubPersona = {
  id: string;
  emoji: string;
  title: string;
  description: string;
  href: string;
  cta: string;
  accent: string;
};

export const hubPersonas: HubPersona[] = [
  {
    id: "discover",
    emoji: "🧭",
    title: "Je découvre TENF",
    description:
      "Je viens d’entendre parler du collectif et je veux comprendre le projet, les règles et le fonctionnement avant de me prononcer.",
    href: `${GUIDE_PUBLIC_BASE}/decouvrir`,
    cta: "Chapitre Découvrir",
    accent: "#22d3ee",
  },
  {
    id: "see",
    emoji: "👀",
    title: "Je veux voir la communauté",
    description:
      "Je préfère regarder des streams, des clips ou lire des témoignages pour sentir l’ambiance avant de rejoindre.",
    href: `${GUIDE_PUBLIC_BASE}/communaute`,
    cta: "Chapitre Communauté",
    accent: "#38bdf8",
  },
  {
    id: "join",
    emoji: "🚀",
    title: "Je veux rejoindre",
    description:
      "J’ai fait le tour du site public et je cherche la procédure officielle : étapes, réunion d’intégration, compte Discord.",
    href: `${GUIDE_PUBLIC_BASE}/rejoindre`,
    cta: "Chapitre Rejoindre",
    accent: "#c084fc",
  },
  {
    id: "member",
    emoji: "🔑",
    title: "Je suis déjà membre",
    description:
      "Je suis connecté·e avec Discord et je cherche une page du menu membre (raids, profil, événements, réglages…).",
    href: "/guides/espace-membre",
    cta: "Guide espace membre",
    accent: "#818cf8",
  },
];

export function getGuidePublicStats() {
  const menuPages = guideChapters.reduce((n, c) => n + c.pages.length, 0);
  const extraPages = guideChapters.reduce((n, c) => n + (c.extraPages?.length ?? 0), 0);
  return {
    chapters: guideChapters.length,
    menuPages,
    extraPages,
    totalPages: menuPages + extraPages,
  };
}

export const guideParcoursSteps: GuideParcoursStep[] = [
  {
    id: "1",
    title: "Comprendre TENF (≈ 10 min)",
    duration: "10 min",
    body: "Lis l’à-propos pour le « pourquoi », puis « Comment ça marche » pour le concret, et enfin la charte pour les règles. À la fin tu peux répondre honnêtement : est-ce que cet esprit d’entraide me correspond ?",
    links: [
      { href: "/a-propos", label: "À propos" },
      { href: "/fonctionnement-tenf/comment-ca-marche", label: "Comment ça marche" },
      { href: "/charte", label: "Charte" },
    ],
    chapterSlug: "decouvrir",
  },
  {
    id: "2",
    title: "Voir la communauté en vrai (≈ 15 min)",
    duration: "15 min",
    body: "Ouvre l’annuaire, regarde au moins un live ou un clip, puis lis deux ou trois témoignages. Tu passes d’un projet abstrait à des créateurs avec lesquels tu pourrais partager ta semaine de stream.",
    links: [
      { href: "/membres", label: "Annuaire" },
      { href: "/lives", label: "Lives" },
      { href: "/avis-tenf", label: "Témoignages" },
    ],
    chapterSlug: "communaute",
  },
  {
    id: "3",
    title: "Repérer l’agenda (≈ 5 min)",
    duration: "5 min",
    body: "Consulte le calendrier des événements à venir et jette un œil à New Family Aventura si tu veux voir le grand rendez-vous annuel. Note ce qui t’attire — tu pourras t’inscrire plus tard une fois membre.",
    links: [
      { href: "/evenements", label: "Événements" },
      { href: "/new-family-aventura", label: "New Family Aventura" },
    ],
    chapterSlug: "agenda",
  },
  {
    id: "4",
    title: "Rejoindre le collectif",
    duration: "Variable",
    body: "Ouvre le hub Rejoindre, lis la FAQ si quelque chose te freine, puis réserve ta réunion d’intégration. Après connexion Discord, les guides « espace membre » et « nouveau membre » t’accompagnent au quotidien.",
    links: [
      { href: "/rejoindre", label: "Hub Rejoindre" },
      { href: "/integration", label: "Réserver une intégration" },
      { href: "/rejoindre/guide-public", label: "Tutoriel Discord / Twitch" },
    ],
    chapterSlug: "rejoindre",
  },
];

export const hubFaq = [
  {
    q: "Ce guide remplace-t-il le menu du site ?",
    a: "Non. Le menu te permet de naviguer ; ce guide t’explique à quoi sert chaque page, dans quel ordre la visiter, et quand tu auras besoin d’un compte Discord.",
  },
  {
    q: "Par où commencer si je ne connais pas TENF ?",
    a: "Suis le parcours « première visite » (4 étapes, ~40 min) ou enchaîne les chapitres Découvrir puis Communauté. Tu auras une vision claire sans t’inscrire.",
  },
  {
    q: "Faut-il un compte pour lire ce guide et les pages listées ?",
    a: "Non pour la lecture. Un compte Discord (et souvent Twitch lié) est nécessaire pour agir : s’inscrire à un event, raid, modifier ton profil membre, etc.",
  },
  {
    q: "Différence entre ce guide et /rejoindre/guide-public ?",
    a: "Ce guide = carte du site (où cliquer, pourquoi). Le guide public = tutoriel technique pas à pas (créer le compte, lier Twitch). Utilise les deux au moment de rejoindre.",
  },
  {
    q: "Je suis déjà membre — ce guide m’est utile ?",
    a: "Oui pour retrouver une URL, expliquer le site à un·e collègue, ou découvrir une page que tu n’utilisais pas (événements, VIP, Academy…).",
  },
  {
    q: "Une page du site a changé d’adresse",
    a: "Consulte le changelog (chapitre Découvrir) ou ce guide : certaines anciennes URLs sont listées en « compléments » avec leur équivalent.",
  },
];

export const relatedGuides = [
  {
    href: "/rejoindre/guide-public",
    label: "Guide public (tutoriel)",
    description: "Création de compte, connexion Discord, liaison Twitch — étape par étape.",
    icon: BookOpen,
    color: "#22d3ee",
  },
  {
    href: "/guides/espace-membre",
    label: "Guide espace membre",
    description: "Carte de tout le menu /member une fois connecté·e.",
    icon: Map,
    color: "#818cf8",
  },
  {
    href: "/guides/tenf",
    label: "Guide nouveau membre",
    description: "Culture, rituels et bonnes pratiques après l’intégration.",
    icon: HeartHandshake,
    color: "#fb7185",
  },
  {
    href: "/rejoindre",
    label: "Hub Rejoindre",
    description: "Procédure officielle pour entrer dans le collectif.",
    icon: UserPlus,
    color: "#c084fc",
  },
] as const;

export function getChapterBySlug(slug: string): GuideChapter | undefined {
  return guideChapters.find((c) => c.slug === slug);
}

export function getChapterNavIndex(slug: string): number {
  return guideChapters.findIndex((c) => c.slug === slug);
}

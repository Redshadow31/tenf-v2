import type { LucideIcon } from "lucide-react";
import type { SpotlightTabPanel } from "./spotlightGuidePanels";
import { SPOTLIGHT_TAB_PANELS } from "./spotlightGuidePanels";
import {
  BookOpen,
  CalendarHeart,
  Coins,
  GraduationCap,
  HeartHandshake,
  PartyPopper,
  Sparkles,
  Star,
  Target,
  Users,
} from "lucide-react";

export type ChapterBlock =
  | { kind: "lead"; text: string }
  | { kind: "bullets"; title?: string; items: string[] }
  | { kind: "callout"; variant: "tip" | "important"; text: string };

export type Chapter = {
  id: string;
  navLabel: string;
  emoji: string;
  titre: string;
  soustitre: string;
  accent: string;
  icon: LucideIcon;
  blocks: ChapterBlock[];
  /** Contenu onglets (ex. Spotlight viewer / streamer). */
  spotlightTabs?: SpotlightTabPanel[];
  liens?: { href: string; label: string }[];
};

export const chapters: Chapter[] = [
  {
    id: "bienvenue",
    navLabel: "Bienvenue",
    emoji: "👋",
    titre: "Bienvenue dans TENF",
    soustitre: "Une communauté basée sur l’entraide réelle entre streamers.",
    accent: "#a78bfa",
    icon: HeartHandshake,
    blocks: [
      {
        kind: "lead",
        text: "Ici, tu ne viens pas seulement promouvoir ta chaîne : tu crées des liens, tu progresses et tu évolues avec les autres. Le cadre est volontairement exigeant sur l’authenticité — parce que l’entraide ne fonctionne que si tout le monde joue le jeu.",
      },
      {
        kind: "bullets",
        title: "En deux phrases",
        items: [
          "TENF = Twitch Entraide New Family : un collectif qui organise visibilité, formations, événements et rituels d’entraide.",
          "La contrepartie naturelle : regarder, participer, aider — pas rester en retrait.",
        ],
      },
    ],
    liens: [
      { href: "/a-propos", label: "À propos de TENF" },
      { href: "/fonctionnement-tenf/decouvrir", label: "Fonctionnement — Découvrir" },
    ],
  },
  {
    id: "fonctionnement-global",
    navLabel: "Fonctionnement",
    emoji: "🔁",
    titre: "Le fonctionnement global",
    soustitre: "Regarder, participer, progresser — et être soutenu en retour.",
    accent: "#38bdf8",
    icon: Target,
    blocks: [
      {
        kind: "lead",
        text: "Le principe est volontairement simple : tu regardes les lives des autres, tu participes activement, tu progresses avec eux — et la communauté te soutient aussi lorsque c’est ton tour.",
      },
      {
        kind: "bullets",
        title: "Boucle d’entraide",
        items: [
          "Tu regardes les lives des autres avec une vraie présence (chat, ambiance, régularité).",
          "Tu participes aux raids, aux événements et aux moments de groupe.",
          "Tu progresses grâce aux retours, aux formations et aux mises en avant.",
          "En retour, la communauté mobilise aussi pour toi : visibilité, habitués, confiance.",
        ],
      },
      {
        kind: "callout",
        variant: "tip",
        text: "Plus tu es impliqué de façon sincère, plus tu reçois en retour. L’inverse (lurker passif, autopromo seule) casse l’équilibre pour tout le monde.",
      },
    ],
    liens: [
      { href: "/fonctionnement-tenf/decouvrir", label: "Découvrir TENF (parcours)" },
      { href: "/fonctionnement-tenf/comment-ca-marche", label: "Comment ça marche" },
    ],
  },
  {
    id: "spotlight",
    navLabel: "Spotlight",
    emoji: "⭐",
    titre: "Les Spotlight (mise en avant)",
    soustitre: "Deux vues : viewer dans le chat, ou streamer mis en avant — même moment, pas les mêmes attentes.",
    accent: "#fbbf24",
    icon: Star,
    blocks: [
      {
        kind: "lead",
        text: "Choisis l’onglet qui te correspond. Les règles précises et les créneaux sont annoncés sur Discord et dans l’agenda : ce guide pose le cadre humain.",
      },
      {
        kind: "callout",
        variant: "important",
        text: "Les critères et calendriers évoluent : garde un œil sur l’agenda membre et les annonces officielles.",
      },
    ],
    spotlightTabs: SPOTLIGHT_TAB_PANELS,
    liens: [
      { href: "/member/evenements", label: "Agenda TENF (membre)" },
      { href: "/events2", label: "Calendrier public" },
    ],
  },
  {
    id: "points",
    navLabel: "Points",
    emoji: "⭐",
    titre: "Système de points TENF",
    soustitre: "Encourager l’entraide sincère — pas la compétition ni le « farm » de points.",
    accent: "#34d399",
    icon: Coins,
    blocks: [
      {
        kind: "lead",
        text: "Le système de points TENF récompense l’engagement réel, la présence humaine et l’entraide sincère sur le serveur Discord. Chaque action compte : ce n’est pas une course à la performance, mais à l’implication utile pour les autres.",
      },
      {
        kind: "bullets",
        title: "Comment progresser dans TENF ?",
        items: [
          "Échanger : poser des questions, répondre, aider dans les salons.",
          "Passer sur les lives : être présent·e de façon authentique aux chaînes des membres.",
          "Participer aux raids et aux événements : créer des moments collectifs.",
          "Faire vivre l’entraide : accueillir, relayer, organiser, remercier.",
          "Gagner naturellement des points : la reconnaissance suit une implication honnête.",
        ],
      },
      {
        kind: "callout",
        variant: "tip",
        text: "L’objectif n’est pas de faire du nombre pour soi : c’est de nourrir une communauté où tout le monde peut monter en compétence et en visibilité ensemble.",
      },
      {
        kind: "bullets",
        title: "Activité quotidienne — quête journalière (500 pts)",
        items: [
          "Utilise la commande /journalier une fois par jour dans le salon Discord « bonus journalier » (🗓・bonus-journalier).",
          "C’est un rituel simple pour ancrer une présence régulière, pas une obligation stressante.",
        ],
      },
      {
        kind: "bullets",
        title: "Participation à la vie du serveur (500 pts tous les 3 niveaux)",
        items: [
          "Tes échanges, ton aide aux autres et ta présence régulière sur les salons font progresser ton impact dans TENF.",
          "Le spam ou une activité artificielle ne compte pas : on valorise la qualité des interactions.",
        ],
      },
      {
        kind: "bullets",
        title: "Actions communautaires",
        items: [
          "Organisation de raids (500 pts) : lancer un raid, c’est mettre un membre en lumière et créer un vrai moment collectif entre créateurs.",
          "Participation aux événements communautaires (200 à 500 pts) : jeux, soirées, formats spéciaux — plus tu participes vraiment, plus tu contribues à l’énergie collective et plus ta progression est reconnue.",
        ],
      },
      {
        kind: "bullets",
        title: "Soutien et visibilité",
        items: [
          "Parrainage de nouveaux membres (300 pts) : invite des créateurs qui partagent les valeurs TENF et veulent s’impliquer dans la durée. Le but n’est pas le volume, mais des profils qui feront vivre la communauté.",
          "Suivi des réseaux TENF (500 pts par réseau) : X (Twitter), TikTok, Instagram. Une preuve est à poster dans le salon Discord « preuves-suivi » (📂・preuves-suivi) ; chaque validation aide la visibilité de TENF et des membres actifs.",
        ],
      },
      {
        kind: "callout",
        variant: "tip",
        text: "Exemple : un membre qui participe aux discussions, passe sur les lives, organise un raid et aide un nouveau membre progresse naturellement et gagne des points grâce à son implication réelle — sans forcer le jeu.",
      },
      {
        kind: "bullets",
        title: "Bonus et avantages",
        items: [
          "Pack de démarrage (1000 pts) : attribué aux nouveaux streamers pour démarrer avec un coup de pouce communautaire.",
          "Bonus d’anniversaire (2000 pts) : un boost quand on fête ça ensemble.",
          "Multiplicateur x2 à partir du niveau 21 : 1000 pts tous les 3 niveaux au lieu de 500 — valorise la régularité, la présence utile et l’implication dans la durée.",
        ],
      },
      {
        kind: "bullets",
        title: "Utiliser ses points",
        items: [
          "Tes points débloquent des avantages concrets : défis en live, mises en avant, bonus, coaching ou outils utiles, selon la boutique et les salons dédiés.",
          "Plus ton implication est utile à la communauté, plus tu ouvres des options fun et pertinentes pour ta progression — toujours dans le cadre défini par TENF.",
        ],
      },
      {
        kind: "callout",
        variant: "important",
        text: "Les barèmes, salons Discord et validations peuvent évoluer : les annonces staff et les règles affichées sur le serveur priment. Vérifie aussi ton espace membre pour le suivi chiffré de ton engagement.",
      },
    ],
    liens: [
      { href: "/member/engagement/score", label: "Mon score d’engagement" },
      { href: "/fonctionnement-tenf/progression", label: "Progression (fonctionnement)" },
    ],
  },
  {
    id: "mecaniques",
    navLabel: "Mécaniques",
    emoji: "⚙️",
    titre: "Les mécaniques d’entraide",
    soustitre: "Engagement mutuel, évaluation, Academy.",
    accent: "#818cf8",
    icon: Users,
    blocks: [
      {
        kind: "bullets",
        title: "Engagement mutuel",
        items: [
          "Tu regardes → on te regarde ; tu soutiens → on te soutient.",
          "L’idée n’est pas le quid pro quo minute par minute, mais une culture de réciprocité sur la durée.",
        ],
      },
      {
        kind: "bullets",
        title: "Évaluation mensuelle",
        items: [
          "Ton activité peut être analysée dans le cadre des rituels TENF.",
          "Tu évolues selon ton implication, le respect du cadre et la dynamique collective.",
        ],
      },
      {
        kind: "bullets",
        title: "Mentorat — TENF Academy",
        items: [
          "Parcours structuré (souvent sur deux semaines), feedbacks entre pairs.",
          "Auto-évaluation et analyse des lives pour progresser vite sur des axes concrets.",
        ],
      },
    ],
    liens: [
      { href: "/member/academy", label: "Présentation Academy" },
      { href: "/member/evaluations", label: "Mon évaluation" },
    ],
  },
  {
    id: "evenements",
    navLabel: "Événements",
    emoji: "🎉",
    titre: "Les événements pour créer du lien",
    soustitre: "Au-delà du solo stream : film, jeux, soirées spéciales.",
    accent: "#f472b6",
    icon: PartyPopper,
    blocks: [
      {
        kind: "lead",
        text: "TENF ne se limite pas au stream seul : les events créent des souvenirs et des relations humaines — ce qui fidélise la communauté mieux qu’aucune annonce.",
      },
      {
        kind: "bullets",
        title: "Formats typiques",
        items: [
          "Events « film » : visionnage en groupe, discussions, réactions.",
          "Events jeux : participation ouverte, objectif fun + se découvrir.",
          "Soirées spéciales, concours, multi-jeux : moments forts du calendrier.",
        ],
      },
    ],
    liens: [
      { href: "/events2", label: "Calendrier événements" },
      { href: "/evenements-communautaires", label: "Événements communautaires" },
    ],
  },
  {
    id: "formations",
    navLabel: "Formations",
    emoji: "🎓",
    titre: "Les formations",
    soustitre: "Technique, chaîne, développement personnel.",
    accent: "#2dd4bf",
    icon: GraduationCap,
    blocks: [
      {
        kind: "lead",
        text: "TENF propose plusieurs familles de formations pour te faire progresser en tant que streamer et en tant que personne.",
      },
      {
        kind: "bullets",
        title: "Technique",
        items: ["OBS", "outils de chaîne", "configuration stream", "qualité audio/vidéo…"],
      },
      {
        kind: "bullets",
        title: "Développement de chaîne",
        items: ["Branding", "overlay", "fidélisation", "organisation des lives…"],
      },
      {
        kind: "bullets",
        title: "Développement personnel",
        items: ["Confiance", "gestion du stress", "relation aux viewers", "communication…"],
      },
    ],
    liens: [
      { href: "/member/formations", label: "Catalogue des formations" },
      { href: "/academy", label: "Academy (site)" },
    ],
  },
  {
    id: "role",
    navLabel: "Ton rôle",
    emoji: "🧩",
    titre: "Ton rôle en tant que membre",
    soustitre: "Ce qu’on attend — et ce qui fragilise l’entraide.",
    accent: "#fb923c",
    icon: Sparkles,
    blocks: [
      {
        kind: "bullets",
        title: "Ce qu’on attend",
        items: [
          "Être actif de façon authentique.",
          "Participer aux lives (présence réelle, pas uniquement la promotion de soi).",
          "Respecter les autres et le cadre communautaire.",
          "Jouer le jeu de l’entraide sur la durée.",
        ],
      },
      {
        kind: "bullets",
        title: "Ce qu’on évite",
        items: [
          "« Je viens juste pour ma pub » sans participation.",
          "Le lurk passif systématique sans interaction.",
          "Le désengagement prolongé qui pèse sur les autres.",
        ],
      },
    ],
    liens: [
      { href: "/fonctionnement-tenf/faq", label: "FAQ fonctionnement" },
      { href: "/rejoindre/faq", label: "FAQ rejoindre" },
    ],
  },
  {
    id: "apports",
    navLabel: "Ce que TENF t’apporte",
    emoji: "🚀",
    titre: "Ce que TENF peut t’apporter",
    soustitre: "Si tu joues le jeu.",
    accent: "#c084fc",
    icon: CalendarHeart,
    blocks: [
      {
        kind: "bullets",
        items: [
          "Une vraie communauté et des relations solides.",
          "Une progression plus rapide grâce aux retours et aux formats collectifs.",
          "Des viewers plus réguliers quand la réciprocité est là.",
          "Une meilleure qualité de stream (technique + posture).",
        ],
      },
      {
        kind: "callout",
        variant: "tip",
        text: "Rien n’est magique : les résultats suivent l’investissement et la bienveillance réciproque.",
      },
    ],
    liens: [
      { href: "/guides/espace-membre", label: "Carte espace membre" },
      { href: "/rejoindre/guide-espace-membre", label: "Guide espace membre" },
    ],
  },
  {
    id: "conclusion",
    navLabel: "Conclusion",
    emoji: "❤️",
    titre: "Conclusion",
    soustitre: "Une famille de streamers qui avancent ensemble.",
    accent: "#f43f5e",
    icon: HeartHandshake,
    blocks: [
      {
        kind: "lead",
        text: "TENF, ce n’est pas « juste un serveur » : c’est un cadre pour apprendre, être vu·e, et rendre la pareille. Plus tu t’investis honnêtement, plus tu récoltes — pour toi et pour les autres.",
      },
    ],
    liens: [
      { href: "https://discord.gg/WnpazgcZHk", label: "Discord TENF" },
      { href: "/guides/partie-publique", label: "Carte du site public" },
    ],
  },
];

export type FaqItem = { id: string; q: string; a: string };

export const faqItems: FaqItem[] = [
  {
    id: "vs-fonctionnement",
    q: "Quelle différence avec les pages « Fonctionnement TENF » ?",
    a: "Les pages sous /fonctionnement-tenf sont la référence détaillée et pérenne (parcours, FAQ, ressources). Ce guide est une synthèse « nouveau membre » plus narrative, avec la même philosophie et des liens vers ces pages.",
  },
  {
    id: "points-detail",
    q: "Où voir le détail exact du système de points ?",
    a: "Ce guide résume le barème « culture TENF » (journalier, niveaux, raids, events, parrainage, réseaux, bonus). Les salons Discord (bonus journalier, preuves-suivi), la boutique et les annonces staff font foi pour les preuves et mises à jour.",
  },
  {
    id: "obligations",
    q: "Suis-je obligé·e de participer à tout ?",
    a: "Non : en revanche, l’ADN TENF suppose une participation régulière et sincère. Si tu cherches uniquement de la visibilité sans retour, d’autres communautés seront plus adaptées.",
  },
];

export type ChecklistItem = { id: string; label: string; href: string };

export const checklistItems: ChecklistItem[] = [
  { id: "decouvrir", label: "Lire « Découvrir TENF » dans le fonctionnement", href: "/fonctionnement-tenf/decouvrir" },
  { id: "comment", label: "Parcourir « Comment ça marche »", href: "/fonctionnement-tenf/comment-ca-marche" },
  { id: "dashboard", label: "Ouvrir mon tableau de bord membre", href: "/member/dashboard" },
  { id: "agenda", label: "Noter un événement à venir dans l’agenda", href: "/member/evenements" },
  { id: "engagement", label: "Consulter mon score / engagement", href: "/member/engagement/score" },
  { id: "formations", label: "Repérer une formation utile cette semaine", href: "/member/formations" },
];

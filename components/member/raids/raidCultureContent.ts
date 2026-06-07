import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  Heart,
  MessageCircle,
  Mic,
  Radio,
  Sparkles,
  Target,
  Users,
  Zap,
} from "lucide-react";

export type RaidCultureTip = {
  id: string;
  icon: LucideIcon;
  title: string;
  body: string;
  example?: string;
};

export type RaidCulturePitfall = {
  id: string;
  label: string;
  detail: string;
};

export const RAID_CULTURE_INTRO = {
  kicker: "Culture Twitch",
  title: "Bien raider, c'est un geste — pas un bouton",
  lead: "Sur Twitch, un raid envoie ta communauté en direct vers une autre chaîne. C'est l'un des plus beaux outils d'entraide du live : mal utilisé, il dérange ; bien fait, il crée des liens durables.",
  footnote:
    "Chez TENF, tes raids vers des membres sont comptés automatiquement. Ce guide est là pour t'aider à le faire avec intention, pas juste pour cocher une case.",
};

export const RAID_TWITCH_BASICS = {
  title: "Comment ça marche, concrètement",
  points: [
    {
      text: "Tu termines (ou interromps) ton live et tu choisis une cible ",
      emphasis: "encore en ligne",
      suffix: ".",
    },
    {
      text: "Twitch propose la personne ; tu confirmes — tes viewers arrivent sur son chat.",
    },
    {
      text: "Tout le monde voit d'où ils viennent : ton annonce précède toujours le clic.",
    },
  ],
};

export const OUTGOING_RAID_TIPS: RaidCultureTip[] = [
  {
    id: "pick-live",
    icon: Radio,
    title: "Choisis quelqu'un qui stream vraiment, là, maintenant",
    body: "Un raid ne marche que vers une chaîne en live. Vérifie le hub /lives TENF ou le planning : même jeu, même énergie, ou simplement quelqu'un que tu veux vraiment soutenir. Évite de raider une chaîne hors-sujet ou en pleine session très intense sans prévenir.",
    example: "« Je vais envoyer l'ascenseur vers @Pseudo — elle fait du cozy gaming comme ce soir, ça devrait vous plaire. »",
  },
  {
    id: "announce-early",
    icon: Mic,
    title: "Annonce le raid 30 à 60 secondes avant",
    body: "Ne clique pas dans le vide. Explique qui c'est, pourquoi tu les choisis, ce qu'ils font sur leur chaîne. Tes viewers doivent comprendre le geste — pas subir une téléportation surprise.",
    example: "« Dans une minute je coupe, et on file chez @Pseudo qui découvre ce jeu pour la première fois. Soyez cool dans son chat. »",
  },
  {
    id: "talk-to-your-chat",
    icon: MessageCircle,
    title: "Parle à ta communauté, pas à celle de l'autre",
    body: "Ton rôle : préparer ton chat à être accueillant ailleurs. Rappelle les bases : pas de spam, pas de « invasion TENF », pas de comparaison toxique. Un raid, c'est un cadeau qu'on offre, pas une armée qui débarque.",
    example: "« Vous êtes les bienvenus à dire bonjour, poser une question sur le jeu, ou juste lurker poliment. »",
  },
  {
    id: "balance-targets",
    icon: Users,
    title: "Varie tes cibles — l'équilibre compte autant que la taille",
    body: "Raider toujours les mêmes petites chaînes, par réflexe « sauveur », déséquilibre la famille autant que de ne viser que les gros noms pour la visibilité. Pense affinité de contenu, personnes que tu n'as pas soutenues depuis un moment, créateurs de taille moyenne souvent oubliés. Un raid utile, c'est un choix sincère et un peu diversifié — pas une case « petit streamer » à cocher.",
    example: "« Ce soir on file chez @Pseudo — on l'avait pas raidé depuis un moment, son contenu colle à notre session, et ça fait du bien de varier. »",
  },
  {
    id: "close-clean",
    icon: Sparkles,
    title: "Coupe ton live proprement, puis raid",
    body: "Remercie ta communauté pour la session, résume brièvement ce que vous avez fait ensemble, puis lance le raid. Un au revoir sincère + un raid réfléchi valent mieux qu'un « bon bah ciao » précipité.",
    example: "« Merci pour ce live, on s'est bien marrés. Je vous envoie chez @Pseudo — passez une bonne fin de soirée. »",
  },
  {
    id: "follow-up",
    icon: Target,
    title: "Le raid n'est pas la fin de l'histoire",
    body: "Si tu as passé un bon moment chez la personne raidée, un message Discord, un follow, ou un raid retour plus tard renforce le lien. L'entraide durable, c'est une relation — pas un clic unique.",
    example: "Le lendemain : « Merci encore pour le raid hier, c'était cool de te découvrir. »",
  },
];

export const INCOMING_RAID_TIPS: RaidCultureTip[] = [
  {
    id: "acknowledge-fast",
    icon: Zap,
    title: "Reconnais l'arrivée dans les 30 premières secondes",
    body: "Des viewers débarquent d'un autre live : ils ne connaissent pas encore ton univers. Accueille-les tout de suite — un silence gênant fait fuir tout le monde, y compris tes habitués.",
    example: "« Oh, bienvenue à ceux qui viennent du raid de @Pseudo ! Content·e de vous avoir. »",
  },
  {
    id: "thank-raider",
    icon: Heart,
    title: "Remercie le·a raideur·euse par son pseudo",
    body: "Nomme la personne qui t'a envoyé sa communauté. C'est la moindre des politesses et ça montre que tu as compris le geste. 15–20 secondes suffisent, pas besoin d'un discours.",
    example: "« Merci @Pseudo pour le raid — ça fait plaisir, bonjour à toute ta commu ! »",
  },
  {
    id: "pitch-stream",
    icon: Mic,
    title: "Présente ton stream en deux phrases",
    body: "Dis ce que tu fais ce soir, ton style, ce qu'on peut attendre. Les nouveaux veulent savoir s'ils sont au bon endroit — sans te vendre ni forcer quoi que ce soit.",
    example: "« Ici on fait du chill horror, on avance l'histoire tranquillement et on papote. »",
  },
  {
    id: "no-pressure",
    icon: Users,
    title: "Accueille sans pression follow / sub",
    body: "Un raid n'est pas une conversion forcée. Invite les gens à poser des questions, à participer s'ils en ont envie. Les follows viennent quand on se sent bien, pas quand on se sent ciblé.",
    example: "« Posez vos questions si vous voulez — pas d'obligation de follow, restez si le contenu vous parle. »",
  },
  {
    id: "engage-chat",
    icon: MessageCircle,
    title: "Fais participer les nouvelles têtes",
    body: "Repère les messages des raideurs, réponds-leur par leur pseudo. Un « salut @Viewer, bienvenue » personnalisé vaut dix annonces génériques. Ton chat devient vite un lieu où on a envie de rester.",
    example: "« @Viewer tu viens d'où côté jeux ? On est sur [titre] ce soir si tu veux te joindre à nous. »",
  },
  {
    id: "return-kindness",
    icon: Sparkles,
    title: "Pense au retour d'ascenseur quand tu peux",
    body: "Recevoir un raid ne t'oblige à rien — mais renvoyer l'ascenseur un jour, quand tu coupes ton live, c'est ce qui fait tourner la famille TENF. Les suggestions dans la colonne à côté sont des pistes, pas des devoirs.",
    example: "Quand tu termines un live : « Ce soir j'envoie chez @Pseudo qui m'avait raidé la semaine dernière. »",
  },
];

export const OUTGOING_PITFALLS: RaidCulturePitfall[] = [
  {
    id: "no-context",
    label: "Raider sans rien dire",
    detail: "Tes viewers arrivent perdus chez l'autre — et l'autre streamer n'a aucune chance de bien les accueillir.",
  },
  {
    id: "wrong-target",
    label: "Cible hors live ou hors-sujet",
    detail: "Le raid échoue ou déçoit. Vérifie toujours que la personne stream et que le contenu colle.",
  },
  {
    id: "toxic-chat",
    label: "Laisser partir un chat agressif",
    detail: "Spam, moqueries, « on est les meilleurs » : ça salit l'image de TENF et du raideur.",
  },
  {
    id: "same-small-targets",
    label: "Ne raider que les toutes petites chaînes",
    detail: "Ça concentre l'entraide sur les mêmes profils et laisse de côté le reste de la famille. Varie selon le contenu et les liens, pas seulement le nombre de viewers.",
  },
];

export const INCOMING_PITFALLS: RaidCulturePitfall[] = [
  {
    id: "ignore",
    label: "Ignorer l'arrivée des raideurs",
    detail: "Ils repartent en 30 secondes. Le raideur se sent floué, ta commu aussi.",
  },
  {
    id: "beg-follow",
    label: "Forcer follow / sub dès l'arrivée",
    detail: "Ça tue l'ambiance bienveillante que le raid était censé créer.",
  },
  {
    id: "no-thanks",
    label: "Oublier de remercier le raideur",
    detail: "Un petit merci public suffit — sans lui, pas de communauté nouvelle ce soir.",
  },
];

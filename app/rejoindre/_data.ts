import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  CalendarCheck,
  CalendarDays,
  Compass,
  DoorOpen,
  Eye,
  HeartHandshake,
  Lightbulb,
  Megaphone,
  MessageCircle,
  Radio,
  ShieldCheck,
  Sparkles,
  Trophy,
  UserPlus,
  Users,
  Wand2,
  XCircle,
} from "lucide-react";
import { DISCORD_INVITE_URL } from "@/lib/socialLinks";

export { DISCORD_INVITE_URL };

// ============================================================
// Hero
// ============================================================
export const hero = {
  chip: "Rejoindre TENF · sans pression, sans promesses vides",
  title: "Rejoindre Twitch Entraide New Family",
  lead:
    "Une communauté d'entraide pour streamers Twitch qui veulent avancer — sans streamer seuls.",
  body:
    "Pas d'abos forcés. Pas de followback obligatoire. Juste des gens qui s'entraident vraiment. Tu peux essayer sans engagement, et repartir si ça ne te convient pas.",
  primary: { label: "Rejoindre le Discord", href: DISCORD_INVITE_URL, external: true },
  secondary: { label: "Voir les prochaines réunions d'intégration", href: "/integration", external: false },
} as const;

// ============================================================
// 2. TENF en 30 secondes
// ============================================================
export type QuickPoint = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export const quickPoints: QuickPoint[] = [
  {
    icon: MessageCircle,
    title: "Une communauté Discord",
    description: "Un serveur d'entraide entre streamers Twitch francophones, structuré et vivant.",
  },
  {
    icon: Radio,
    title: "Des lives à découvrir",
    description: "Un flux permanent de membres en direct, avec des univers très variés.",
  },
  {
    icon: CalendarCheck,
    title: "Des événements communautaires",
    description: "Soirées jeux, Spotlights, opérations caritatives, défis collectifs.",
  },
  {
    icon: MessageCircle,
    title: "Des retours constructifs",
    description: "Feedbacks bienveillants sur tes lives, ton overlay, ton format — quand tu en veux.",
  },
  {
    icon: Trophy,
    title: "Une progression collective",
    description: "On avance ensemble : mentorat, partage de bonnes pratiques, vraies évaluations.",
  },
  {
    icon: HeartHandshake,
    title: "Un cadre bienveillant",
    description: "Charte claire, staff présent, espace safe — pour streamer sereinement.",
  },
];

// ============================================================
// 3. Ce que TENF n'EST PAS
// ============================================================
export type AntiPoint = {
  title: string;
  description: string;
};

export const antiPoints: AntiPoint[] = [
  {
    title: "Pas un serveur de pub",
    description: "On ne vient pas déposer son lien Twitch et repartir. L'échange réel passe d'abord.",
  },
  {
    title: "Pas une ferme à follows",
    description: "Aucun followback automatique, aucun followtrain forcé, aucun deal de visibilité.",
  },
  {
    title: "Pas d'abonnements forcés",
    description: "Personne ne te demande de t'abonner aux autres pour rester. Tes Subs t'appartiennent.",
  },
  {
    title: "Pas un mur où poser son lien",
    description: "Si tu viens uniquement pour ta promo, ça se voit, et l'expérience devient vite frustrante.",
  },
  {
    title: "TENF repose sur l'échange réel",
    description: "Discuter, soutenir, raid, donner du feedback : c'est ce qui fait vivre la communauté.",
  },
];

// ============================================================
// 4. Les 3 étapes
// ============================================================
export type Step = {
  number: number;
  icon: LucideIcon;
  title: string;
  description: string;
  cta: { label: string; href: string; external?: boolean };
};

export const steps: Step[] = [
  {
    number: 1,
    icon: MessageCircle,
    title: "Rejoindre le Discord",
    description:
      "Tu arrives sur le serveur, tu lis le règlement, tu te présentes dans le salon d'accueil. On t'accueille rapidement et on t'oriente.",
    cta: { label: "Ouvrir Discord", href: DISCORD_INVITE_URL, external: true },
  },
  {
    number: 2,
    icon: CalendarCheck,
    title: "Participer à une réunion d'intégration",
    description:
      "Un membre du staff t'explique le fonctionnement, répond à tes questions et valide ton entrée dans le cadre TENF. En visio, dans une ambiance détendue.",
    cta: { label: "Voir les prochaines réunions", href: "/integration" },
  },
  {
    number: 3,
    icon: UserPlus,
    title: "Compléter son profil & découvrir les autres",
    description:
      "Tu relies Twitch, tu remplis ton profil, tu passes sur les lives des autres créateurs. C'est en étant là que les liens se créent.",
    cta: { label: "Explorer l'annuaire", href: "/membres" },
  },
];

// ============================================================
// 5. Réunion d'intégration
// ============================================================
export const meetingPoints: Array<{ label: string; value: string; icon: LucideIcon }> = [
  { label: "À quoi elle sert", value: "T'accueillir personnellement, te poser le cadre, et t'aider à démarrer sans te perdre.", icon: Sparkles },
  { label: "Ce qui y est présenté", value: "TENF, ses valeurs, ses salons clés, ses points, ses raids et les premiers réflexes utiles.", icon: BookOpen },
  { label: "L'ambiance", value: "Détendue, sans jugement. Tu peux couper la caméra et le micro à tout moment.", icon: HeartHandshake },
  { label: "Tes questions", value: "Tout le monde peut poser ses questions, même celles qui paraissent évidentes.", icon: MessageCircle },
  { label: "Le vrai point de départ", value: "C'est après cette réunion que tu accèdes pleinement à la communauté et à ses opportunités.", icon: CalendarDays },
];

// ============================================================
// 6. Ce qu'on attend d'un membre
// ============================================================
export type Expectation = { icon: LucideIcon; title: string; description: string };

export const expectations: Expectation[] = [
  {
    icon: ShieldCheck,
    title: "Respecter les autres",
    description: "Bienveillance, respect du staff, respect de la charte. Aucune tolérance pour les comportements toxiques.",
  },
  {
    icon: HeartHandshake,
    title: "Soutenir les lives des autres",
    description: "Passer sur des chaînes, discuter, raider quand c'est possible. L'entraide n'est pas à sens unique.",
  },
  {
    icon: Compass,
    title: "Participer selon tes possibilités",
    description: "Personne n'exige une présence quotidienne. On respecte ton rythme, ton planning et tes contraintes.",
  },
  {
    icon: Megaphone,
    title: "Prévenir en cas de pause",
    description: "Un simple message au staff suffit. On préfère savoir, plutôt que de te perdre en chemin.",
  },
  {
    icon: XCircle,
    title: "Ne pas venir que pour ta visibilité",
    description: "TENF n'est pas un outil de promo express. On reconnaît vite ceux qui ne viennent que pour eux-mêmes.",
  },
];

// ============================================================
// 7. Ce que TENF peut t'apporter
// ============================================================
export type Benefit = { icon: LucideIcon; title: string; description: string };

export const benefits: Benefit[] = [
  {
    icon: Eye,
    title: "Découverte de créateurs",
    description: "Rencontrer des streamers que tu n'aurais jamais croisés ailleurs, dans des univers très variés.",
  },
  {
    icon: MessageCircle,
    title: "Retours & conseils",
    description: "Du regard extérieur honnête : sur ton overlay, ton format, ta présence à l'antenne.",
  },
  {
    icon: CalendarCheck,
    title: "Événements",
    description: "Soirées jeux, Spotlights, opérations caritatives, défis communautaires.",
  },
  {
    icon: BookOpen,
    title: "Formations",
    description: "Académie, ateliers, partage de bonnes pratiques entre créateurs.",
  },
  {
    icon: HeartHandshake,
    title: "Soutien moral",
    description: "Des gens qui te reconnaissent, qui te répondent, qui s'inquiètent quand tu disparais.",
  },
  {
    icon: Radio,
    title: "Visibilité encadrée",
    description: "Raids, mises en avant, présence sur tes lives. Pas magique : réel, et durable.",
  },
  {
    icon: Users,
    title: "Plus jamais streamer seul",
    description: "Un cercle qui suit ta progression, te taquine et te rattrape quand le moral baisse.",
  },
];

// ============================================================
// 8. Bloc rassurant
// ============================================================
export type ReassureItem = { icon: LucideIcon; title: string; description: string };

export const reassuranceItems: ReassureItem[] = [
  {
    icon: Sparkles,
    title: "Les débutants sont acceptés",
    description: "Une grande partie des membres a démarré avec 0 viewer. Tu n'as pas besoin d'un statut pour rentrer.",
  },
  {
    icon: Lightbulb,
    title: "Les petits streamers sont les bienvenus",
    description: "Pas de palier minimum, pas de seuil d'abonnés. La taille de ta chaîne n'est pas un critère d'accueil.",
  },
  {
    icon: HeartHandshake,
    title: "Les personnes timides peuvent avancer à leur rythme",
    description: "Pas obligé·e de parler en vocal au début. Tu observes, tu poses tes mots quand tu te sens prêt·e.",
  },
  {
    icon: CalendarDays,
    title: "Une vie personnelle chargée, c'est OK",
    description: "Boulot, études, enfants, santé… On comprend. Tu participes quand tu peux, comme tu peux.",
  },
  {
    icon: Wand2,
    title: "Tu peux essayer sans pression",
    description: "Tu viens découvrir, tu observes le serveur, tu testes une réunion. Rien n'est gravé dans le marbre.",
  },
  {
    icon: DoorOpen,
    title: "Tu peux faire une pause ou partir, sans conflit",
    description: "Tu peux faire une pause ou quitter TENF sans conflit, tant que les choses sont faites avec respect. On préfère ça à un membre frustré qui reste.",
  },
];

// ============================================================
// 9. FAQ courte
// ============================================================
export type FaqItem = { q: string; a: string };

export const faq: FaqItem[] = [
  {
    q: "Est-ce gratuit ?",
    a: "Oui, 100 % gratuit. Aucune cotisation, aucun paiement obligatoire. Les dons sur la page « Soutenir TENF » sont totalement facultatifs et servent à financer les bots, le site et les événements.",
  },
  {
    q: "Est-ce réservé aux affiliés Twitch ?",
    a: "Non. TENF accueille tous les niveaux : débutants, créateurs en développement, affiliés ou plus expérimentés. Le statut Twitch ne change rien à la qualité de l'accueil.",
  },
  {
    q: "Est-ce obligatoire d'être présent tous les jours ?",
    a: "Pas du tout. Personne ne te demande une présence quotidienne. Tu participes selon tes possibilités. Le vrai engagement, c'est d'être honnête sur ce que tu peux donner et de prévenir si tu fais une pause longue.",
  },
  {
    q: "Dois-je suivre tout le monde ?",
    a: "Non, et c'est même contraire à l'esprit TENF. Pas de followback obligatoire, pas d'abos forcés, pas de raids automatiques. On encourage les vraies interactions, choisies, basées sur l'envie réelle.",
  },
  {
    q: "Puis-je rejoindre si je suis débutant·e ?",
    a: "Oui, et c'est même là que TENF est le plus utile. On t'aide à prendre tes marques, à structurer tes lives et à rencontrer du monde qui te ressemble — même si tu n'as encore aucun viewer.",
  },
  {
    q: "Que se passe-t-il si je fais une pause Twitch ?",
    a: "Tu préviens le staff par un message court, et tout est OK. Tu peux faire une pause, ralentir, ou reprendre plus tard sans recommencer le parcours d'intégration de zéro.",
  },
];

// ============================================================
// CTA final
// ============================================================
export const finalCtas = [
  { label: "Rejoindre le Discord", href: DISCORD_INVITE_URL, primary: true, external: true },
  { label: "Voir les lives en cours", href: "/lives", primary: false, external: false },
  { label: "Découvrir les membres", href: "/membres", primary: false, external: false },
] as const;

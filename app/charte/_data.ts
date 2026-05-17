import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  CalendarCheck,
  ClipboardList,
  Compass,
  DoorOpen,
  Ear,
  Gavel,
  HeartHandshake,
  Lightbulb,
  Lock,
  MessageCircle,
  Pause,
  Scale,
  ShieldCheck,
  Sparkles,
  Trophy,
  UserCheck,
  Users,
} from "lucide-react";
import { DISCORD_INVITE_URL } from "@/lib/socialLinks";

export { DISCORD_INVITE_URL };

// ============================================================
// Sommaire (TOC)
// ============================================================
export const tableOfContents = [
  { id: "introduction", label: "1. Pourquoi cette charte" },
  { id: "valeurs", label: "2. Les valeurs de la New Family" },
  { id: "encourage", label: "3. Ce que TENF encourage" },
  { id: "refuse", label: "4. Ce que TENF refuse" },
  { id: "entraide", label: "5. Entraide, promotion et engagement" },
  { id: "confidentialite", label: "6. Confidentialité et vocaux" },
  { id: "integration", label: "7. Intégration et rôles" },
  { id: "pauses", label: "8. Pauses, absences et rythme" },
  { id: "conflits", label: "9. Gestion des conflits" },
  { id: "sanctions", label: "10. Sanctions possibles" },
  { id: "droits", label: "11. Droits des membres" },
  { id: "conclusion", label: "12. Conclusion" },
] as const;

// ============================================================
// 2. Valeurs (6 piliers)
// ============================================================
export type Value = { icon: LucideIcon; title: string; description: string };

export const values: Value[] = [
  {
    icon: HeartHandshake,
    title: "Entraide sincère",
    description:
      "On vient pour aider et être aidé, pas pour faire du donnant-donnant forcé. L'envie passe avant le calcul.",
  },
  {
    icon: Users,
    title: "Respect des différences",
    description:
      "Rythmes, niveaux, styles, parcours, personnalités : chacun avance comme il peut. Personne n'a à se justifier d'être différent.",
  },
  {
    icon: MessageCircle,
    title: "Communication saine",
    description:
      "On parle, on écoute, on tranche calmement. Pas de passif-agressif, pas d'attaques voilées, pas de sous-entendus toxiques.",
  },
  {
    icon: Lock,
    title: "Confidentialité",
    description:
      "Ce qui se dit sur TENF reste sur TENF. Les échanges internes ne sortent jamais en stream, en clip ou ailleurs sans accord clair.",
  },
  {
    icon: Trophy,
    title: "Progression collective",
    description:
      "On grandit ensemble, pas les uns contre les autres. Tes succès comptent autant que ceux des autres — on en fait des relais, pas des podiums.",
  },
  {
    icon: Scale,
    title: "Responsabilité individuelle",
    description:
      "Chaque membre est responsable de ses mots, de ses actes et de l'image qu'il renvoie de la communauté. Personne n'efface ses traces à ta place.",
  },
];

// ============================================================
// 4. Ce que TENF encourage (7 items)
// ============================================================
export const encouraged: string[] = [
  "Découvrir les lives des autres membres — vraiment, pas en background muet.",
  "Donner des retours constructifs : contenu, technique, ressenti, dans la bienveillance.",
  "Participer aux événements communautaires, selon tes possibilités et ton énergie.",
  "Prévenir le staff en cas de pause, courte ou longue : c'est un signal d'attention, pas un contrôle.",
  "Accueillir les nouveaux et répondre à leurs questions, même celles qui paraissent évidentes.",
  "Aider sans attendre un retour immédiat — l'entraide ne se mesure pas en stats.",
  "Respecter les rythmes de chacun : pauses, baisses de motivation, période chargée. La vie passe d'abord.",
];

// ============================================================
// 5. Ce que TENF refuse (10 items)
// ============================================================
export const refused: string[] = [
  "Promotion sauvage : déposer son lien Twitch en boucle, dans tous les salons, sans rien apporter.",
  "Demandes insistantes de follows, de subs, de vues ou de raids — explicites ou déguisées.",
  "Harcèlement, en MP ou en public, sur Discord, sur Twitch ou ailleurs.",
  "Propos discriminatoires : racisme, sexisme, homophobie, transphobie, validisme, etc. Aucune tolérance.",
  "Pression morale, chantage affectif, culpabilisation pour forcer un soutien ou une présence.",
  "Dramas publics, règlements de compte, provocations dans les salons texte ou vocaux.",
  "Atteintes à la confidentialité : capture, clip, partage hors contexte d'échanges internes.",
  "Comportements manipulateurs, multi-comptes, contournements de règles ou d'outils communautaires.",
  "Utilisation de TENF pour nuire à d'autres communautés, créateurs ou personnes.",
  "Consommer l'entraide en permanence sans jamais participer en retour.",
];

// ============================================================
// 6. Entraide vs Promotion vs Opportunisme
// ============================================================
export type EntraideTone = "positive" | "neutral" | "negative";
export type EntraideCard = { label: string; tone: EntraideTone; description: string };

export const entraideCards: EntraideCard[] = [
  {
    label: "Entraide réelle",
    tone: "positive",
    description:
      "Tu es là, tu écoutes, tu participes. Tu donnes des retours, tu passes sur les lives, tu rends ce que tu reçois — sans tableau Excel.",
  },
  {
    label: "Promotion saine",
    tone: "neutral",
    description:
      "Tu partages ton planning, tes lives, tes nouveautés dans les salons prévus, sans saturer. Tu réponds aussi aux autres quand ils partagent les leurs.",
  },
  {
    label: "Opportunisme",
    tone: "negative",
    description:
      "Tu viens prendre, tu disparais. Tu mesures TENF à tes stats. Ça se voit très vite et c'est incompatible avec le projet.",
  },
];

export const promotionRules: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: HeartHandshake,
    title: "L'entraide est humaine, pas automatique",
    description:
      "Les follows, vues, raids et participations doivent rester sincères. Aucune action ne se déclenche par devoir.",
  },
  {
    icon: Sparkles,
    title: "La visibilité est liée à l'implication réelle",
    description:
      "Plus tu fais vivre la communauté, plus la communauté te fait vivre. Cette logique se construit dans la durée, pas sur un coup d'éclat.",
  },
  {
    icon: AlertTriangle,
    title: "TENF n'est pas un serveur de publicité",
    description:
      "Notre vocation est l'entraide. La promo personnelle existe, mais elle est encadrée. Si tu ne viens que pour ça, ce n'est pas le bon endroit.",
  },
];

// ============================================================
// 7. Confidentialité & vocaux
// ============================================================
export const confidentialityRules: string[] = [
  "Ne partage pas des messages privés sans l'accord de la personne concernée.",
  "Ne sors pas des propos de leur contexte — un extrait isolé peut faire dire l'inverse du message.",
  "N'enregistre pas et ne rediffuse pas un échange vocal sans accord explicite des participants.",
  "N'expose pas publiquement des conversations internes (stream, clip, discussion externe, réseaux).",
  "N'utilise pas le serveur pour nuire à une personne ou à une autre communauté.",
];

export type VocalRule = { icon: LucideIcon; title: string; description: string };

export const vocalRules: VocalRule[] = [
  {
    icon: MessageCircle,
    title: "Saluer en arrivant et en partant",
    description: "Un simple bonjour / au revoir suffit : ça change l'ambiance d'un salon entier.",
  },
  {
    icon: Users,
    title: "Laisser la parole tourner",
    description: "Pas de monologue, pas de cercles fermés, pas d'humour d'initiés excluant.",
  },
  {
    icon: Ear,
    title: "Couper sans humilier",
    description: "Si quelqu'un te coupe, on le signale calmement. Si un sujet dérape, le staff peut clore le débat.",
  },
  {
    icon: ShieldCheck,
    title: "Pas de règlement de compte en public",
    description: "En cas de malaise, on contacte le staff. Le vocal n'est pas un tribunal.",
  },
];

export type VocalImportantRule = {
  title: string;
  description: string;
  explanation: string;
};

export const vocalImportantRules: VocalImportantRule[] = [
  {
    title: "Pas de vocal général pendant un live",
    description:
      "Rejoindre un vocal général du serveur quand tu es en stream n'est autorisé qu'avec l'accord clair des personnes déjà présentes.",
    explanation:
      "Les échanges TENF sont privés. Être en live peut exposer involontairement les autres et briser la confiance du salon.",
  },
  {
    title: "Pas de vocal pendant une session de jeu sans prévenir",
    description:
      "Si tu joues avec d'autres personnes, ne rejoins pas un vocal sans les avertir d'abord, surtout si elles n'ont pas vocation à être enregistrées.",
    explanation:
      "L'objectif est de protéger ceux qui partagent leur voix : ils doivent savoir si l'échange est diffusé.",
  },
  {
    title: "Écoute micro coupé : OK, mais signale-toi",
    description:
      "Écouter sans parler est toléré occasionnellement. Si quelqu'un demande qui est présent, il faut se signaler — même rapidement.",
    explanation:
      "C'est une simple courtoisie : on a tous le droit de savoir qui partage notre salon.",
  },
];

// ============================================================
// 8. Intégration et rôles
// ============================================================
export type IntegrationBlock = { icon: LucideIcon; title: string; description: string };

export const integrationBlocks: IntegrationBlock[] = [
  {
    icon: CalendarCheck,
    title: "La réunion d'intégration",
    description:
      "Ce n'est pas un test, ni un entretien. C'est un moment pour comprendre TENF, poser tes questions et vérifier que la communauté te correspond. Tu ressors avec une idée claire de ce dans quoi tu mets les pieds.",
  },
  {
    icon: Compass,
    title: "Accès limités avant intégration",
    description:
      "Certaines fonctionnalités (entraide, promotion, mises en avant) sont restreintes tant que tu n'as pas suivi la réunion. Ce n'est pas une punition : c'est un cadre qui protège la communauté et t'aide à démarrer sans te perdre.",
  },
  {
    icon: UserCheck,
    title: "Rôles communautaires",
    description:
      "Créateur, Communauté, VIP : les rôles sont attribués selon des critères définis par le staff. Ils décrivent ta place actuelle, pas ta valeur — ils peuvent évoluer dans les deux sens.",
  },
  {
    icon: ClipboardList,
    title: "Évaluations internes",
    description:
      "Les évaluations servent à améliorer l'entraide. Elles sont internes, non publiques, et ne servent jamais à classer ou comparer les membres entre eux.",
  },
  {
    icon: Gavel,
    title: "Décisions du staff",
    description:
      "Le staff tranche quand c'est nécessaire — toujours dans l'intérêt de la communauté. Ses décisions doivent être respectées, même quand on n'est pas d'accord. Le dialogue reste ouvert via le contact.",
  },
];

// ============================================================
// 9. Pauses & rythme personnel
// ============================================================
export type PauseBlock = { icon: LucideIcon; title: string; description: string };

export const pauseBlocks: PauseBlock[] = [
  {
    icon: Pause,
    title: "Pause courte",
    description:
      "Examens, déménagement, boulot, baisse de motivation, fatigue : un simple message au staff suffit. Aucune justification détaillée n'est demandée.",
  },
  {
    icon: Compass,
    title: "Pause longue",
    description:
      "Au-delà d'un mois, on en parle ensemble. On adapte ton rôle et tes accès. Tu reviens quand tu veux, à ton rythme, sans repasser la case intégration.",
  },
  {
    icon: HeartHandshake,
    title: "Vie personnelle compliquée",
    description:
      "Santé, famille, période difficile : TENF n'attend rien de toi en retour. Le seul vrai engagement, c'est d'être honnête sur ce que tu peux ou ne peux pas donner.",
  },
];

// ============================================================
// 10. Gestion des conflits
// ============================================================
export const conflictRules: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: MessageCircle,
    title: "Le dialogue d'abord",
    description:
      "Quand un désaccord monte, on essaie d'abord d'en parler entre concernés, calmement, en privé.",
  },
  {
    icon: AlertTriangle,
    title: "Pas en public",
    description:
      "Les règlements de compte dans les salons généraux ne sont pas tolérés. Ils empoisonnent l'ambiance de tout le monde.",
  },
  {
    icon: ShieldCheck,
    title: "Le staff intervient",
    description:
      "Si ça bloque, le staff joue le rôle de tiers : il écoute les deux côtés sans prendre parti à l'avance.",
  },
  {
    icon: ClipboardList,
    title: "Signaler par les bons canaux",
    description:
      "Le formulaire de contact ou un MP staff : ce sont les canaux officiels. Tout y est traité avec confidentialité.",
  },
  {
    icon: HeartHandshake,
    title: "Objectif : protéger, pas humilier",
    description:
      "Le but n'est jamais de désigner un coupable publiquement, mais de résoudre la situation et de préserver l'ambiance.",
  },
];

// ============================================================
// 11. Sanctions (progression)
// ============================================================
export type Sanction = { level: string; description: string };

export const sanctions: Sanction[] = [
  {
    level: "Rappel simple",
    description: "Un staff te contacte pour clarifier le contexte et rappeler la règle. Sans trace formelle.",
  },
  {
    level: "Avertissement",
    description: "Trace écrite dans le suivi staff. Discussion structurée pour ajuster le comportement.",
  },
  {
    level: "Restriction de salons ou de rôles",
    description: "Suspension temporaire de certains accès (annuaire, événements, mises en avant) le temps de régler la situation.",
  },
  {
    level: "Mute vocal temporaire ou définitif",
    description: "Coupure de l'accès aux salons vocaux, le temps que la situation s'apaise ou en cas de récidive.",
  },
  {
    level: "Changement de rôle",
    description:
      "Passage à un rôle plus restreint (par exemple Créateur → Communauté) en cas de désengagement prolongé ou de comportement nuisible.",
  },
  {
    level: "Exclusion temporaire",
    description: "Bannissement à durée limitée pour permettre une pause et préserver l'ambiance.",
  },
  {
    level: "Bannissement définitif",
    description:
      "Réservé aux fautes graves, aux comportements toxiques répétés ou aux atteintes sérieuses à la confidentialité.",
  },
];

// ============================================================
// 12. Droits des membres
// ============================================================
export type Right = { icon: LucideIcon; title: string };

export const rights: Right[] = [
  { icon: MessageCircle, title: "Poser des questions, à tout moment" },
  { icon: Lightbulb, title: "Ne pas tout comprendre au début, et c'est OK" },
  { icon: Compass, title: "Progresser à ton rythme, sans pression" },
  { icon: Pause, title: "Faire une pause, courte ou longue" },
  { icon: ShieldCheck, title: "Signaler un problème en confiance" },
  { icon: DoorOpen, title: "Quitter TENF sans conflit, dans le respect" },
  { icon: HeartHandshake, title: "Être traité avec respect — toujours" },
];

// ============================================================
// CTA final
// ============================================================
export const finalCtas: Array<{
  label: string;
  href: string;
  primary?: boolean;
  external?: boolean;
}> = [
  { label: "Rejoindre TENF", href: DISCORD_INVITE_URL, primary: true, external: true },
  { label: "Voir comment rejoindre", href: "/rejoindre" },
  { label: "Contacter l'équipe", href: "/contact" },
];


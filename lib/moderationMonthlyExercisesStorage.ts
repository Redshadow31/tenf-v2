import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

export type Difficulty = "facile" | "moyen" | "difficile";
export type CampaignStatus = "draft" | "locked";

export type ExerciseQuestionChoice = {
  id: string;
  label: string;
};

export type ExerciseQuestion = {
  id: string;
  prompt: string;
  choices: ExerciseQuestionChoice[];
  correctOptionIds: string[];
};

export type ExerciseTemplate = {
  id: string;
  title: string;
  theme: string;
  difficulty: Difficulty;
  context: string;
  questions: ExerciseQuestion[];
  objectives?: string[]; // Compat données historiques
  expected: string;
};

export type ExerciseAssignment = {
  assigneeId: string;
  assigneeLabel: string;
  exerciseId: string;
  status: "pending" | "submitted";
  submittedAt?: string;
  submittedBy?: string;
  answers?: Record<string, string[]>;
  notes?: string;
};

export type MonthlyExerciseCampaign = {
  id: string;
  month: string; // YYYY-MM
  status: CampaignStatus;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  lockedAt?: string;
  lockedBy?: string;
  settings: {
    count: number;
    difficulties: Difficulty[];
  };
  exercises: ExerciseTemplate[];
  assignments: ExerciseAssignment[];
};

type StorageShape = {
  campaigns: MonthlyExerciseCampaign[];
};

const DATA_DIR = path.join(process.cwd(), "data");
const STORAGE_FILE = path.join(DATA_DIR, "moderation-monthly-exercises.json");

export const moderationExerciseTemplates: ExerciseTemplate[] = [
  {
    id: "sc-01",
    title: "Message passif-agressif en salon général",
    theme: "Communication",
    difficulty: "facile",
    context: "Un membre répond avec un ton piquant, sans insulte explicite, et d'autres commencent à réagir.",
    questions: [
      {
        id: "q1",
        prompt: "Quelle est la première action la plus conforme à la charte ?",
        choices: [
          { id: "a", label: "Sanction immédiate pour éviter que ça dégénère." },
          { id: "b", label: "Rappel neutre et observation du contexte avant escalade." },
          { id: "c", label: "Répondre sur le même ton pour reprendre le contrôle." },
          { id: "d", label: "Ignorer totalement la situation." },
        ],
        correctOptionIds: ["b"],
      },
    ],
    expected: "Rappel neutre + surveillance sans sur-réaction.",
  },
  {
    id: "sc-02",
    title: "Hors-sujet répété pendant un live communautaire",
    theme: "Cadre",
    difficulty: "facile",
    context: "Le salon dédié au live est saturé de messages hors-sujet malgré 2 rappels précédents.",
    questions: [
      {
        id: "q1",
        prompt: "Quelle décision est la plus proportionnée ?",
        choices: [
          { id: "a", label: "Supprimer tous les messages et bannir les auteurs." },
          { id: "b", label: "Refaire un rappel clair et rediriger vers le bon salon." },
          { id: "c", label: "Fermer le salon pour toute la soirée." },
          { id: "d", label: "Laisser faire car ce n'est pas grave." },
        ],
        correctOptionIds: ["b"],
      },
      {
        id: "q2",
        prompt: "Sur quoi doit se baser la décision ?",
        choices: [
          { id: "a", label: "Le ressenti personnel du modérateur." },
          { id: "b", label: "Les règles écrites et l'historique observable." },
          { id: "c", label: "La popularité des membres concernés." },
          { id: "d", label: "Le nombre de réactions emojis." },
        ],
        correctOptionIds: ["b"],
      },
    ],
    expected: "Rappel clair + redirection vers le bon salon.",
  },
  {
    id: "sc-03",
    title: "Soupçon d'attaque ciblée",
    theme: "Conflit",
    difficulty: "moyen",
    context: "Deux membres s'accusent mutuellement. Les captures sont partielles et le contexte manque.",
    questions: [
      {
        id: "q1",
        prompt: "Si la preuve est partielle, que faire ?",
        choices: [
          { id: "a", label: "Choisir le camp le plus crédible." },
          { id: "b", label: "Demander les éléments manquants et suspendre la décision." },
          { id: "c", label: "Sanctionner les deux par défaut." },
          { id: "d", label: "Publier les captures au staff public." },
        ],
        correctOptionIds: ["b"],
      },
    ],
    expected: "Collecte de preuves + remontée staff, pas de sanction immédiate.",
  },
  {
    id: "sc-04",
    title: "Blague limite envers un nouveau membre",
    theme: "Accueil",
    difficulty: "moyen",
    context: "Un ancien poste une blague mal reçue. Le nouveau membre se dit mal à l'aise.",
    questions: [
      {
        id: "q1",
        prompt: "Quel ton doit adopter le modérateur ?",
        choices: [
          { id: "a", label: "Sarcastique pour faire passer le message." },
          { id: "b", label: "Neutre, factuel et apaisant." },
          { id: "c", label: "Agressif pour montrer l'autorité." },
          { id: "d", label: "Moqueur envers le nouveau membre." },
        ],
        correctOptionIds: ["b"],
      },
    ],
    expected: "Intervention neutre + reformulation attendue du message.",
  },
  {
    id: "sc-05",
    title: "Conflit entre deux streamers actifs",
    theme: "Cas sensible",
    difficulty: "difficile",
    context: "Échange tendu public entre deux streamers connus de la communauté.",
    questions: [
      {
        id: "q1",
        prompt: "Quel principe s'applique en priorité ?",
        choices: [
          { id: "a", label: "Agir vite pour protéger l'image, même sans analyse." },
          { id: "b", label: "Pas sûr = je n'agis pas seul." },
          { id: "c", label: "Prendre parti pour le streamer le plus actif." },
          { id: "d", label: "Laisser le conflit se régler seul." },
        ],
        correctOptionIds: ["b"],
      },
      {
        id: "q2",
        prompt: "Dans ce cas sensible, quelle action est valide ?",
        choices: [
          { id: "a", label: "Signalement staff obligatoire avec faits tracés." },
          { id: "b", label: "Décision solo du modérateur de garde." },
          { id: "c", label: "Publication d'une sanction détaillée en public." },
          { id: "d", label: "Suppression silencieuse sans trace." },
        ],
        correctOptionIds: ["a"],
      },
    ],
    expected: "Séparation des échanges + signalement staff obligatoire.",
  },
  {
    id: "sc-06",
    title: "Signalement de favoritisme modération",
    theme: "Éthique",
    difficulty: "difficile",
    context: "Un membre affirme qu'un modérateur protège son ami et sanctionne plus vite les autres.",
    questions: [
      {
        id: "q1",
        prompt: "Comment traiter l'accusation de favoritisme ?",
        choices: [
          { id: "a", label: "Ignorer pour éviter le conflit." },
          { id: "b", label: "Auditer les décisions passées sur base factuelle." },
          { id: "c", label: "Défendre automatiquement le modérateur impliqué." },
          { id: "d", label: "Exposer le membre accusateur publiquement." },
        ],
        correctOptionIds: ["b"],
      },
    ],
    expected: "Audit factuel + remontée responsable modération.",
  },
  {
    id: "sc-07",
    title: "Spam léger en période de forte activité",
    theme: "Charge",
    difficulty: "facile",
    context: "Un membre enchaîne les emojis et gifs. L'ambiance reste globalement positive.",
    questions: [
      {
        id: "q1",
        prompt: "Quelle action est la plus juste ?",
        choices: [
          { id: "a", label: "Ban direct pour spam." },
          { id: "b", label: "Rappel court et proportionné." },
          { id: "c", label: "Aucune règle, donc aucune action jamais." },
          { id: "d", label: "Humilier le membre en public." },
        ],
        correctOptionIds: ["b"],
      },
    ],
    expected: "Rappel calme et court, sans sanction.",
  },
  {
    id: "sc-08",
    title: "Interprétation d'intention non vérifiable",
    theme: "Méthode",
    difficulty: "moyen",
    context: "Un modérateur dit: 'Il provoque volontairement'. Aucun élément explicite ne le prouve.",
    questions: [
      {
        id: "q1",
        prompt: "Cette phrase est plutôt :",
        choices: [
          { id: "a", label: "Un fait prouvé." },
          { id: "b", label: "Une interprétation à écarter de la décision." },
          { id: "c", label: "Une règle officielle." },
          { id: "d", label: "Une preuve technique." },
        ],
        correctOptionIds: ["b"],
      },
      {
        id: "q2",
        prompt: "La bonne base de décision est :",
        choices: [
          { id: "a", label: "Le caractère supposé du membre." },
          { id: "b", label: "Les messages observables et la règle écrite." },
          { id: "c", label: "Le niveau de fatigue du modérateur." },
          { id: "d", label: "Le vote du salon." },
        ],
        correctOptionIds: ["b"],
      },
    ],
    expected: "Recadrage méthodologique + décision basée sur messages concrets.",
  },
  {
    id: "sc-09",
    title: "Demande publique d'explication de sanction",
    theme: "Confidentialité",
    difficulty: "moyen",
    context: "Un membre exige en salon public de connaître les raisons d'une sanction d'un autre membre.",
    questions: [
      {
        id: "q1",
        prompt: "Que faire face à cette demande publique ?",
        choices: [
          { id: "a", label: "Donner les détails complets de la sanction." },
          { id: "b", label: "Refuser les détails et rediriger vers un canal privé adapté." },
          { id: "c", label: "Publier les logs staff pour être transparent." },
          { id: "d", label: "Ignorer la demande sans réponse." },
        ],
        correctOptionIds: ["b"],
      },
    ],
    expected: "Refus de détail public + redirection privée.",
  },
  {
    id: "sc-10",
    title: "Modérateur fatigué en fin de service",
    theme: "Posture",
    difficulty: "facile",
    context: "Le modérateur reconnaît être irrité et prêt à sanctionner rapidement.",
    questions: [
      {
        id: "q1",
        prompt: "Quelle décision respecte la charte ?",
        choices: [
          { id: "a", label: "Intervenir quand même pour ne pas perdre la main." },
          { id: "b", label: "Passer le relais à un autre modérateur." },
          { id: "c", label: "Sanctionner préventivement." },
          { id: "d", label: "Se déconnecter sans prévenir." },
        ],
        correctOptionIds: ["b"],
      },
    ],
    expected: "Relais immédiat à un autre modérateur.",
  },
  {
    id: "sc-11",
    title: "Récidive avec comportement ambigu",
    theme: "Cas répété",
    difficulty: "difficile",
    context: "Plusieurs incidents mineurs avec le même membre, mais chaque cas isolé reste limite.",
    questions: [
      {
        id: "q1",
        prompt: "Comment qualifier ce cas ?",
        choices: [
          { id: "a", label: "Aucun problème puisque chaque incident est mineur." },
          { id: "b", label: "Cas répété nécessitant analyse de chronologie." },
          { id: "c", label: "Cas à traiter à l'intuition uniquement." },
          { id: "d", label: "Cas à ignorer jusqu'à une crise grave." },
        ],
        correctOptionIds: ["b"],
      },
    ],
    expected: "Synthèse des faits + signalement staff.",
  },
  {
    id: "sc-12",
    title: "Réponse sarcastique d'un modérateur",
    theme: "Qualité de modération",
    difficulty: "moyen",
    context: "Un modérateur répond publiquement avec ironie à un membre insistant.",
    questions: [
      {
        id: "q1",
        prompt: "Quel écart est observé ?",
        choices: [
          { id: "a", label: "Aucun, c'est un ton normal." },
          { id: "b", label: "Écart de posture: sarcasme interdit." },
          { id: "c", label: "Erreur technique Discord." },
          { id: "d", label: "Manque de permissions admin." },
        ],
        correctOptionIds: ["b"],
      },
    ],
    expected: "Feedback interne + reformulation neutre publique.",
  },
  {
    id: "sc-13",
    title: "Flood de mentions @everyone",
    theme: "Charge",
    difficulty: "facile",
    context: "Un membre envoie plusieurs messages avec @everyone pour attirer l'attention.",
    questions: [
      {
        id: "q1",
        prompt: "La réponse adaptée est :",
        choices: [
          { id: "a", label: "Rappel ferme sur la règle de mention + suppression ciblée." },
          { id: "b", label: "Bannissement définitif immédiat." },
          { id: "c", label: "Encourager l'usage des mentions." },
          { id: "d", label: "Ne rien faire." },
        ],
        correctOptionIds: ["a"],
      },
    ],
    expected: "Rappel + action proportionnée sur les messages concernés.",
  },
  {
    id: "sc-14",
    title: "Provocation subtile entre deux groupes",
    theme: "Conflit",
    difficulty: "moyen",
    context: "Des sous-entendus créent une tension entre deux groupes sans insulte directe.",
    questions: [
      {
        id: "q1",
        prompt: "Que doit prioriser le modérateur ?",
        choices: [
          { id: "a", label: "L'intuition sur les intentions cachées." },
          { id: "b", label: "Les faits observables et les impacts concrets." },
          { id: "c", label: "Les affinités personnelles." },
          { id: "d", label: "Le silence total." },
        ],
        correctOptionIds: ["b"],
      },
      {
        id: "q2",
        prompt: "En cas de doute persistant :",
        choices: [
          { id: "a", label: "Décider seul rapidement." },
          { id: "b", label: "Escalader au staff." },
          { id: "c", label: "Rendre le conflit public." },
          { id: "d", label: "Supprimer tout le salon." },
        ],
        correctOptionIds: ["b"],
      },
    ],
    expected: "Désescalade + analyse factuelle + remontée si ambigu.",
  },
  {
    id: "sc-15",
    title: "Signalement reçu en DM sans preuve",
    theme: "Méthode",
    difficulty: "facile",
    context: "Un membre contacte un modérateur en privé avec une accusation sans capture ni lien.",
    questions: [
      {
        id: "q1",
        prompt: "Première étape ?",
        choices: [
          { id: "a", label: "Sanctionner le membre accusé immédiatement." },
          { id: "b", label: "Demander des preuves vérifiables." },
          { id: "c", label: "Publier l'accusation en salon public." },
          { id: "d", label: "Bloquer l'auteur du signalement." },
        ],
        correctOptionIds: ["b"],
      },
    ],
    expected: "Collecte de preuves avant toute décision.",
  },
  {
    id: "sc-16",
    title: "Conflit vocal en direct",
    theme: "Cas sensible",
    difficulty: "difficile",
    context: "En vocal, la tension monte vite entre trois membres actifs, avec interruptions constantes.",
    questions: [
      {
        id: "q1",
        prompt: "Action prioritaire immédiate ?",
        choices: [
          { id: "a", label: "Laisser le conflit se vider seul." },
          { id: "b", label: "Stopper l'escalade et séparer si nécessaire." },
          { id: "c", label: "Prendre parti pour le plus ancien membre." },
          { id: "d", label: "Couper le vocal sans explication." },
        ],
        correctOptionIds: ["b"],
      },
      {
        id: "q2",
        prompt: "Après stabilisation, il faut :",
        choices: [
          { id: "a", label: "Oublier l'incident." },
          { id: "b", label: "Analyser les faits et documenter les éléments clés." },
          { id: "c", label: "Publier un blâme nominatif immédiat." },
          { id: "d", label: "Demander au public de voter la sanction." },
        ],
        correctOptionIds: ["b"],
      },
    ],
    expected: "Désescalade vocale + documentation + traitement staff.",
  },
  {
    id: "sc-17",
    title: "Réponse émotionnelle d'un modérateur junior",
    theme: "Posture",
    difficulty: "moyen",
    context: "Un modérateur junior répond sèchement après plusieurs provocations légères.",
    questions: [
      {
        id: "q1",
        prompt: "Quel feedback interne est le plus adapté ?",
        choices: [
          { id: "a", label: "Valider la réaction émotionnelle." },
          { id: "b", label: "Rappeler la posture neutre et proposer un relais." },
          { id: "c", label: "Exposer publiquement le modérateur." },
          { id: "d", label: "Ignorer pour éviter le malaise." },
        ],
        correctOptionIds: ["b"],
      },
    ],
    expected: "Correction pédagogique + maintien de la neutralité.",
  },
  {
    id: "sc-18",
    title: "Tentative de contournement des règles",
    theme: "Cadre",
    difficulty: "moyen",
    context: "Un membre contourne la règle anti-spam en répartissant ses messages sur plusieurs salons.",
    questions: [
      {
        id: "q1",
        prompt: "Cette situation relève surtout de :",
        choices: [
          { id: "a", label: "Aucun problème, techniquement pas de spam." },
          { id: "b", label: "Un contournement nécessitant application cohérente de la règle." },
          { id: "c", label: "Une intention prouvée automatiquement." },
          { id: "d", label: "Un simple malentendu à ignorer." },
        ],
        correctOptionIds: ["b"],
      },
    ],
    expected: "Application cohérente de la règle avec trace des faits.",
  },
  {
    id: "sc-19",
    title: "Rumeur sur un membre actif",
    theme: "Confidentialité",
    difficulty: "difficile",
    context: "Une rumeur circule sur un membre très impliqué, avec pression pour 'agir vite'.",
    questions: [
      {
        id: "q1",
        prompt: "Face à la pression, le modérateur doit :",
        choices: [
          { id: "a", label: "Sanctionner pour calmer la communauté." },
          { id: "b", label: "Exiger des preuves et éviter les jugements." },
          { id: "c", label: "Répéter la rumeur en annonce." },
          { id: "d", label: "Publier les discussions staff." },
        ],
        correctOptionIds: ["b"],
      },
    ],
    expected: "Aucune sanction sans preuve, confidentialité respectée.",
  },
  {
    id: "sc-20",
    title: "Demande d'exception 'pour service rendu'",
    theme: "Éthique",
    difficulty: "moyen",
    context: "Un membre connu demande à échapper à une règle car il 'a beaucoup aidé le serveur'.",
    questions: [
      {
        id: "q1",
        prompt: "Quelle position est conforme à la charte ?",
        choices: [
          { id: "a", label: "Accorder l'exception par reconnaissance." },
          { id: "b", label: "Appliquer la règle de manière équitable." },
          { id: "c", label: "Reporter la décision indéfiniment." },
          { id: "d", label: "Faire décider ses proches." },
        ],
        correctOptionIds: ["b"],
      },
    ],
    expected: "Pas de favoritisme, même règle pour tous.",
  },
  {
    id: "sc-21",
    title: "Publication involontaire d'un extrait staff",
    theme: "Confidentialité",
    difficulty: "difficile",
    context: "Un modérateur partage par erreur un extrait de discussion interne en salon public.",
    questions: [
      {
        id: "q1",
        prompt: "Action immédiate correcte :",
        choices: [
          { id: "a", label: "Laisser visible pour transparence." },
          { id: "b", label: "Retirer le message et signaler l'incident staff." },
          { id: "c", label: "Blâmer en public le modérateur." },
          { id: "d", label: "Supprimer sans tracer." },
        ],
        correctOptionIds: ["b"],
      },
      {
        id: "q2",
        prompt: "Ensuite il faut :",
        choices: [
          { id: "a", label: "Documenter l'incident et prévenir la récidive." },
          { id: "b", label: "Ignorer totalement." },
          { id: "c", label: "Partager davantage de détails pour compenser." },
          { id: "d", label: "Interdire toute discussion staff." },
        ],
        correctOptionIds: ["a"],
      },
    ],
    expected: "Correction immédiate + traçabilité + prévention.",
  },
  {
    id: "sc-22",
    title: "Provocations répétées en messages privés",
    theme: "Cas répété",
    difficulty: "moyen",
    context: "Plusieurs membres signalent des DM provocateurs venant de la même personne.",
    questions: [
      {
        id: "q1",
        prompt: "Le traitement approprié est :",
        choices: [
          { id: "a", label: "Ignorer car hors salon public." },
          { id: "b", label: "Collecter preuves + analyser répétition + action proportionnée." },
          { id: "c", label: "Sanction maximale sans vérification." },
          { id: "d", label: "Publier les DM dans le salon général." },
        ],
        correctOptionIds: ["b"],
      },
    ],
    expected: "Analyse des preuves + gestion du cas répété.",
  },
  {
    id: "sc-23",
    title: "Membre en détresse émotionnelle",
    theme: "Conflit",
    difficulty: "facile",
    context: "Un membre exprime fortement sa frustration sans attaquer directement quelqu'un.",
    questions: [
      {
        id: "q1",
        prompt: "Quelle posture est recommandée ?",
        choices: [
          { id: "a", label: "Réponse sèche pour couper court." },
          { id: "b", label: "Calme, écoute, recentrage sur règles et sécurité." },
          { id: "c", label: "Ignorer pour ne pas s'impliquer." },
          { id: "d", label: "Lui demander de se justifier publiquement." },
        ],
        correctOptionIds: ["b"],
      },
    ],
    expected: "Apaisement et encadrement sans jugement.",
  },
  {
    id: "sc-24",
    title: "Contestation publique d'une décision modération",
    theme: "Qualité de modération",
    difficulty: "difficile",
    context: "Un membre conteste publiquement une décision et accuse l'équipe de partialité.",
    questions: [
      {
        id: "q1",
        prompt: "Quelle réponse publique est correcte ?",
        choices: [
          { id: "a", label: "Répondre agressivement pour imposer l'autorité." },
          { id: "b", label: "Réponse factuelle, ton neutre, redirection vers canal de recours." },
          { id: "c", label: "Supprimer toute contestation sans message." },
          { id: "d", label: "Débattre longuement en public des détails internes." },
        ],
        correctOptionIds: ["b"],
      },
      {
        id: "q2",
        prompt: "Qu'est-ce qui doit rester systématique ?",
        choices: [
          { id: "a", label: "Traçabilité de la décision." },
          { id: "b", label: "Justification par ressenti." },
          { id: "c", label: "Décision non documentée." },
          { id: "d", label: "Publication des discussions staff." },
        ],
        correctOptionIds: ["a"],
      },
    ],
    expected: "Réponse neutre + canal de recours + traçabilité.",
  },
];

export function getModerationExerciseTemplateCount(): number {
  return moderationExerciseTemplates.length;
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readStorage(): StorageShape {
  try {
    ensureDataDir();
    if (!fs.existsSync(STORAGE_FILE)) {
      return { campaigns: [] };
    }
    const raw = fs.readFileSync(STORAGE_FILE, "utf-8");
    const parsed = JSON.parse(raw) as StorageShape;
    if (!parsed || !Array.isArray(parsed.campaigns)) {
      return { campaigns: [] };
    }
    return parsed;
  } catch (error) {
    console.error("[ModerationMonthlyExercises] readStorage error:", error);
    return { campaigns: [] };
  }
}

function writeStorage(next: StorageShape) {
  ensureDataDir();
  fs.writeFileSync(STORAGE_FILE, JSON.stringify(next, null, 2), "utf-8");
}

function isValidMonth(value: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

function seedFromString(input: string): number {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return hash >>> 0;
}

function mulberry32(seed: number) {
  let value = seed;
  return () => {
    value += 0x6d2b79f5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: T[], seed: number): T[] {
  const random = mulberry32(seed);
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function listMonthlyExerciseCampaigns(): MonthlyExerciseCampaign[] {
  const data = readStorage();
  return [...data.campaigns].sort((a, b) => b.month.localeCompare(a.month));
}

export function getMonthlyExerciseCampaign(month: string): MonthlyExerciseCampaign | null {
  if (!isValidMonth(month)) return null;
  const data = readStorage();
  return data.campaigns.find((campaign) => campaign.month === month) || null;
}

function buildAssignments(
  exercises: ExerciseTemplate[],
  assignees: Array<{ id: string; label: string }>,
): ExerciseAssignment[] {
  if (!assignees.length || !exercises.length) return [];
  const assignments: ExerciseAssignment[] = [];
  for (const assignee of assignees) {
    for (const exercise of exercises) {
      assignments.push({
        assigneeId: assignee.id,
        assigneeLabel: assignee.label,
        exerciseId: exercise.id,
        status: "pending",
      });
    }
  }
  return assignments;
}

export function upsertDraftMonthlyExerciseCampaign(input: {
  month: string;
  count: number;
  difficulties: Difficulty[];
  assignees: Array<{ id: string; label: string }>;
  createdBy: string;
}): MonthlyExerciseCampaign {
  if (!isValidMonth(input.month)) {
    throw new Error("INVALID_MONTH");
  }
  const enforcedDifficulties: Difficulty[] = ["facile", "moyen", "difficile"];
  const baseCount = Number.isFinite(input.count) ? input.count : 5;
  const safeCount = Math.max(5, Math.min(baseCount, moderationExerciseTemplates.length));

  const easyPool = moderationExerciseTemplates.filter((template) => template.difficulty === "facile");
  const mediumPool = moderationExerciseTemplates.filter((template) => template.difficulty === "moyen");
  const hardPool = moderationExerciseTemplates.filter((template) => template.difficulty === "difficile");
  if (!easyPool.length || !mediumPool.length || !hardPool.length) {
    throw new Error("NO_TEMPLATE_MATCH");
  }

  const seed = seedFromString(`${input.month}-forced-mix-${Date.now()}-${Math.random()}`);
  const easy = shuffle(easyPool, seed + 1)[0];
  const medium = shuffle(mediumPool, seed + 2)[0];
  const hard = shuffle(hardPool, seed + 3)[0];

  const mandatory = [easy, medium, hard];
  const selectedIds = new Set(mandatory.map((item) => item.id));
  const remainingPool = moderationExerciseTemplates.filter((template) => !selectedIds.has(template.id));
  const additionalNeeded = Math.max(0, safeCount - mandatory.length);
  const additional = shuffle(remainingPool, seed + 4).slice(0, additionalNeeded);
  const exercises = shuffle([...mandatory, ...additional], seed + 5);

  const now = new Date().toISOString();
  const data = readStorage();
  const existingIndex = data.campaigns.findIndex((campaign) => campaign.month === input.month);
  if (existingIndex >= 0 && data.campaigns[existingIndex].status === "locked") {
    throw new Error("CAMPAIGN_LOCKED");
  }

  const next: MonthlyExerciseCampaign = {
    id: existingIndex >= 0 ? data.campaigns[existingIndex].id : randomUUID(),
    month: input.month,
    status: "draft",
    createdAt: existingIndex >= 0 ? data.campaigns[existingIndex].createdAt : now,
    updatedAt: now,
    createdBy: existingIndex >= 0 ? data.campaigns[existingIndex].createdBy : input.createdBy,
    settings: {
      count: safeCount,
      difficulties: enforcedDifficulties,
    },
    exercises,
    assignments: buildAssignments(exercises, input.assignees),
  };

  if (existingIndex >= 0) {
    data.campaigns[existingIndex] = next;
  } else {
    data.campaigns.push(next);
  }
  writeStorage(data);
  return next;
}

export function lockMonthlyExerciseCampaign(month: string, lockedBy: string): MonthlyExerciseCampaign {
  if (!isValidMonth(month)) {
    throw new Error("INVALID_MONTH");
  }
  const data = readStorage();
  const index = data.campaigns.findIndex((campaign) => campaign.month === month);
  if (index < 0) {
    throw new Error("CAMPAIGN_NOT_FOUND");
  }
  const existing = data.campaigns[index];
  if (existing.status === "locked") {
    return existing;
  }
  const next: MonthlyExerciseCampaign = {
    ...existing,
    status: "locked",
    updatedAt: new Date().toISOString(),
    lockedAt: new Date().toISOString(),
    lockedBy,
  };
  data.campaigns[index] = next;
  writeStorage(data);
  return next;
}

function normalizeAnswers(
  answers: unknown,
): Record<string, string[]> {
  if (!answers || typeof answers !== "object") return {};
  const entries = Object.entries(answers as Record<string, unknown>);
  const normalized: Record<string, string[]> = {};
  for (const [questionId, value] of entries) {
    if (!questionId.trim()) continue;
    if (!Array.isArray(value)) continue;
    const optionIds = value
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter((item) => item.length > 0);
    if (optionIds.length > 0) {
      normalized[questionId] = Array.from(new Set(optionIds));
    }
  }
  return normalized;
}

export function submitMonthlyExerciseAnswers(input: {
  month: string;
  assigneeId: string;
  submittedBy: string;
  exerciseId: string;
  answers: unknown;
  notes?: string;
}): MonthlyExerciseCampaign {
  if (!isValidMonth(input.month)) {
    throw new Error("INVALID_MONTH");
  }
  const data = readStorage();
  const campaignIndex = data.campaigns.findIndex((campaign) => campaign.month === input.month);
  if (campaignIndex < 0) {
    throw new Error("CAMPAIGN_NOT_FOUND");
  }

  const campaign = data.campaigns[campaignIndex];
  const assignmentIndex = campaign.assignments.findIndex(
    (assignment) => assignment.assigneeId === input.assigneeId && assignment.exerciseId === input.exerciseId,
  );
  if (assignmentIndex < 0) {
    throw new Error("ASSIGNMENT_NOT_FOUND");
  }

  const normalizedAnswers = normalizeAnswers(input.answers);
  const trimmedNotes = typeof input.notes === "string" ? input.notes.trim().slice(0, 4000) : undefined;
  const existingAssignment = campaign.assignments[assignmentIndex];
  campaign.assignments[assignmentIndex] = {
    ...existingAssignment,
    status: "submitted",
    submittedAt: new Date().toISOString(),
    submittedBy: input.submittedBy,
    answers: normalizedAnswers,
    notes: trimmedNotes,
  };
  campaign.updatedAt = new Date().toISOString();
  data.campaigns[campaignIndex] = campaign;
  writeStorage(data);
  return campaign;
}

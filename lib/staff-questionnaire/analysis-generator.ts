import type { AdminReviewPayload } from "./types";

type AnswerRow = {
  questionKey: string;
  label: string;
  type: string;
  answerText: string | null;
  answerJson: Record<string, unknown> | null;
};

function collectSelectedValues(answers: AnswerRow[]): string[] {
  const out: string[] = [];
  for (const a of answers) {
    const j = a.answerJson;
    if (!j) continue;
    if (Array.isArray(j.selected)) {
      out.push(...j.selected.map(String));
    }
    if (typeof j.choice === "string") out.push(j.choice);
  }
  return out;
}

function countHints(values: string[], hints: string[]): number {
  const lower = values.map((v) => v.toLowerCase());
  return hints.reduce((acc, h) => {
    const needle = h.toLowerCase();
    return acc + (lower.some((v) => v.includes(needle)) ? 1 : 0);
  }, 0);
}

/**
 * Pré-analyse interne basée sur des règles (sans IA externe).
 */
export function generateInternalAnalysisDraft(answers: AnswerRow[]): AdminReviewPayload {
  const selected = collectSelectedValues(answers);

  const fearMistake = countHints(selected, [
    "peur de mal faire",
    "validation",
    "consignes",
    "demander",
    "confirmation",
  ]);
  const fastAction = countHints(selected, ["trop vite", "régler vite", "agir vite"]);
  const conflictAvoid = countHints(selected, [
    "éviter",
    "me retirer",
    "ne pas savoir",
    "stressé",
  ]);
  const observer = countHints(selected, ["observer", "observation", "prudent", "attendre"]);
  const leader = countHints(selected, [
    "prendre les devants",
    "propose des idées",
    "autonomie",
    "agir puis informer",
  ]);

  const behavioralProfile =
    leader >= 2
      ? "Profil plutôt proactif : tendance à prendre des initiatives et proposer des idées. À cadrer pour garder une posture staff cohérente."
      : observer >= 2
        ? "Profil observateur prudent : besoin de temps pour analyser avant d'agir. Fonctionne bien avec un cadre explicite."
        : "Profil équilibré : alternance entre observation et action selon le contexte.";

  const functioningMode =
    fearMistake >= 3
      ? "Efficacité renforcée avec consignes claires, exemples concrets et points de validation progressifs."
      : "Fonctionne bien avec un mix consigne + autonomie progressive.";

  const supportNeeds =
    fearMistake >= 2
      ? "Cadre clair, validation progressive, renforcement de la confiance sur les situations simples."
      : leader >= 2
        ? "Cadrage des initiatives, retours après action, missions adaptées au niveau d'autonomie."
        : "Accompagnement régulier, feedbacks concrets, binôme possible sur les premières situations.";

  const vigilancePoints =
    fastAction >= 1
      ? "Prendre un temps de recul avant d'intervenir ; vérifier la procédure staff."
      : conflictAvoid >= 2
        ? "Situations tendues : s'appuyer sur le staff, ne pas rester seul face au conflit."
        : "Surveiller la charge émotionnelle et signaler tôt si besoin de pause.";

  const communicationStyle = countHints(selected, ["écrit", "diplomate", "prudent"])
    ? "Communication plutôt réfléchie, parfois prudente — valoriser la clarté et les retours en privé."
    : countHints(selected, ["direct", "factuel"])
      ? "Communication directe — veiller au ton staff et à la bienveillance TENF."
      : "Style de communication variable selon le contexte et l'interlocuteur.";

  const autonomyLevel =
    fearMistake >= 3
      ? "Autonomie en construction : agir d'abord sur les situations simples avec validation possible."
      : leader >= 2
        ? "Bonne base d'autonomie : canaliser les initiatives dans le cadre staff."
        : "Autonomie progressive à renforcer sur des missions ciblées.";

  const conflictRelation =
    conflictAvoid >= 2
      ? "Besoin d'accompagnement sur les tensions : scripts de désescalade, binôme sur les premiers conflits."
      : "Rapport au conflit globalement gérable avec soutien staff si la situation dépasse le cadre.";

  const authorityRelation =
    countHints(selected, ["braquer", "frustré", "injuste"])
      ? "Mieux intégrer les décisions staff quand elles sont expliquées ; privilégier l'échange en privé."
      : "Respect du cadre staff en général ; besoin de compréhension sur les décisions sensibles.";

  const emotionalManagement =
    countHints(selected, ["personnellement", "émotionnel", "dépassé", "fatigué"])
      ? "Gestion émotionnelle à renforcer : pauses, signalement tôt, soutien référent."
      : "Capacité à gérer les émotions variable — prévoir des points de repère avec le référent.";

  const recommendedMissions =
    observer >= 2
      ? "Missions d'observation, accueil encadré, documentation, binôme sur modération légère."
      : leader >= 2
        ? "Missions progressives avec autonomie encadrée : animation, suivi membres, propositions structurées."
        : "Missions courtes et claires : accueil, signalement, support événements.";

  const internalAnalysisText = [
    "## Profil comportemental",
    behavioralProfile,
    "",
    "## Mode de fonctionnement",
    functioningMode,
    "",
    "## Besoins d'accompagnement",
    supportNeeds,
    "",
    "## Points de vigilance",
    vigilancePoints,
    "",
    "## Style de communication",
    communicationStyle,
    "",
    "## Capacité d'autonomie",
    autonomyLevel,
    "",
    "## Rapport au conflit",
    conflictRelation,
    "",
    "## Rapport à l'autorité",
    authorityRelation,
    "",
    "## Gestion émotionnelle",
    emotionalManagement,
    "",
    "## Missions adaptées à court terme",
    recommendedMissions,
  ].join("\n");

  return {
    internalAnalysisText,
    behavioralProfile,
    functioningMode,
    supportNeeds,
    vigilancePoints,
    communicationStyle,
    autonomyLevel,
    conflictRelation,
    authorityRelation,
    emotionalManagement,
    recommendedMissions,
    adminNotes: "Pré-analyse générée automatiquement — à relire et personnaliser avant publication.",
  };
}

export function generateMemberSummaryDraft(review: AdminReviewPayload): string {
  const positive =
    review.behavioralProfile?.includes("proactif") || review.behavioralProfile?.includes("initiatives")
      ? "tu sembles à l'aise pour prendre des initiatives lorsque le cadre est clair"
      : review.behavioralProfile?.includes("observateur")
        ? "tu prends le temps d'observer avant d'agir, ce qui est un atout pour la modération"
        : "tu t'adaptes selon les situations rencontrées";

  const axes = [
    review.autonomyLevel ? "gagner en autonomie progressive" : null,
    review.conflictRelation ? "mieux gérer les situations tendues" : null,
    review.communicationStyle ? "affiner ta communication staff" : null,
  ].filter(Boolean);

  return `Merci pour tes réponses. Elles nous permettent de mieux comprendre ton fonctionnement dans le staff et de t'accompagner plus justement pendant ta progression.

## Ce qui ressort de ton profil
${review.behavioralProfile || "Ton profil montre un fonctionnement réfléchi, en phase avec une progression staff TENF."}

## Tes forces repérées
Tu sembles fonctionner particulièrement bien lorsque ${positive}. ${review.functioningMode ? `En pratique : ${review.functioningMode}` : ""}

## Tes axes de progression
Pour les prochaines semaines, l'objectif sera de t'aider à progresser sur ${axes.join(", ") || "ta posture staff, ta communication et ton autonomie"}, sans te mettre en difficulté inutilement.

## Comment l'équipe va t'accompagner
${review.supportNeeds || "Un référent staff te proposera des missions progressives, des retours réguliers et un cadre clair pour avancer sereinement."}

L'idée est de t'aider à gagner progressivement en autonomie, à mieux identifier les situations où tu peux agir seul, et celles où il vaut mieux demander un appui staff.`;
}

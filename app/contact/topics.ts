export type ContactTopic = {
  id: string;
  label: string;
  hint: string;
};

/** Liste centralisée des motifs de contact (utilisée par la page, le formulaire et l'API). */
export const CONTACT_TOPICS: ContactTopic[] = [
  {
    id: "question_generale",
    label: "Question générale",
    hint: "Tu veux comprendre quelque chose sur TENF avant de t'engager.",
  },
  {
    id: "probleme_serveur",
    label: "Problème sur le serveur Discord",
    hint: "Bug, abus, modération : tout ce qui touche l'expérience Discord.",
  },
  {
    id: "partenariat",
    label: "Partenariat",
    hint: "Association, événement, outil ou serveur qui veut collaborer.",
  },
  {
    id: "presse",
    label: "Presse / média",
    hint: "Interview, article, mise en avant : on partage volontiers nos chiffres et notre histoire.",
  },
  {
    id: "signalement",
    label: "Signalement",
    hint: "Comportement problématique d'un membre, harcèlement, infraction à la charte.",
  },
  {
    id: "soutien",
    label: "Soutien / don",
    hint: "Tu veux soutenir le projet financièrement ou avec du temps bénévole.",
  },
  {
    id: "technique_site",
    label: "Problème technique site",
    hint: "Bug, page cassée, fonctionnalité qui ne marche pas comme attendu.",
  },
];

export const CONTACT_TOPIC_IDS = CONTACT_TOPICS.map((t) => t.id);

const TOPIC_ALIASES: Record<string, string> = {
  general: "question_generale",
  question: "question_generale",
  question_generale: "question_generale",
  probleme: "probleme_serveur",
  probleme_serveur: "probleme_serveur",
  partenariat: "partenariat",
  partenariats: "partenariat",
  presse: "presse",
  media: "presse",
  signalement: "signalement",
  soutien: "soutien",
  don: "soutien",
  technique: "technique_site",
  technique_site: "technique_site",
};

const VALID_TOPIC_IDS = new Set(CONTACT_TOPIC_IDS);

/** Résout un paramètre `?topic=` brut vers un id de motif valide. */
export function resolveContactTopic(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const key = raw.trim().toLowerCase();
  if (VALID_TOPIC_IDS.has(key)) return key;
  const aliased = TOPIC_ALIASES[key];
  if (aliased && VALID_TOPIC_IDS.has(aliased)) return aliased;
  return null;
}

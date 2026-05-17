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

/** Une partie du discours (onglet) : titre d’onglet, texte principal, conseil séparé */
export type StaffMeetingDiscoursSection = {
  id: string;
  /** Libellé de l’onglet (ex. « 1. Introduction ») */
  tabTitle: string;
  /** Corps du discours (Markdown : # titres, > citations, ---, listes *, **gras**, emojis…) */
  corps: string;
  /** Conseil de jeu / ton (Markdown, optionnel) */
  conseil: string;
};

export type StaffMeetingDiscoursItem = {
  id: string;
  /** Nom de la personne qui prend la parole */
  intervenant: string;
  /** Sujet ou titre global du discours */
  titre: string;
  /** Parties découpées en onglets */
  sections: StaffMeetingDiscoursSection[];
};

export type StaffMonthlyMeeting = {
  id: string;
  meetingDate: string;
  title: string;
  discours: StaffMeetingDiscoursItem[];
  createdAt: string;
  updatedAt: string;
  createdBy?: string | null;
  updatedBy?: string | null;
};

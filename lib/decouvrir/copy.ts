/** Textes éditoriaux centralisés pour /decouvrir-createurs (TENF). */
export const DISCOVER_COPY = {
  hero: {
    badge: "Créateurs de la New Family",
    h1: "Découvrir les créateurs TENF",
    lead:
      "Explore une sélection de clips issus des streamers de la communauté. Un extrait suffit parfois pour découvrir une voix, une ambiance ou un univers — puis tu peux aller plus loin sur Twitch, dans l’annuaire ou en live.",
    reassurance:
      "Sélection renouvelée pour laisser de la place à différents membres · profils membres · communauté active",
    ctaExplore: "Explorer la sélection",
    ctaLives: "Voir les lives en cours",
    linkAnnuaire: "Annuaire des membres",
  },
  intro: {
    title: "C’est quoi cette page ?",
    subtitle: "En une minute : TENF, les clips, et la suite.",
    cards: [
      {
        title: "Découvrir un style",
        body: "TENF, c’est Twitch Entraide New Family : une communauté Discord où les créateurs s’entraident. Ici, des clips te donnent un aperçu concret de leurs univers.",
      },
      {
        title: "Rencontrer un créateur",
        body: "Chaque carte renvoie vers un vrai membre : chaîne Twitch et fiche dans l’annuaire pour aller plus loin que le clip.",
      },
      {
        title: "Rejoindre une communauté",
        body: "Les raids, les follows et les événements complètent cette vitrine. Les lives, c’est le moment présent ; l’annuaire, le portrait complet.",
      },
    ],
  },
  liveTeaser: {
    title: "En ce moment sur TENF",
    loading: "Connexion aux infos lives…",
    unavailable: "Les compteurs live ne sont pas disponibles pour l’instant.",
    zero: "Personne n’est signalé en direct côté TENF pour le moment — passe voir la page Lives, ça bouge souvent.",
    some: (n: number) =>
      `${n} live${n > 1 ? "s" : ""} repéré${n > 1 ? "s" : ""} parmi les membres suivis — viens voir qui stream.`,
    cta: "Ouvrir la page Lives",
  },
  clips: {
    sectionTitle: "Sélection de clips",
    sectionSubtitle:
      "Les clips changent quand tu demandes une nouvelle sélection. Tu peux affiner par langue, style ou durée.",
    newSelection: "Nouvelle sélection",
    loadedLabel: "Clips chargés",
    afterFiltersLabel: "Après filtres",
    gridHint: "Lecture sur Twitch · fiche membre pour le profil complet",
  },
  filters: {
    title: "Affiner la sélection",
    presetsHelp: "Suggestions rapides — tu peux combiner avec la langue ou la durée.",
    lang: "Langue",
    langAll: "Toutes",
    style: "Style",
    duration: "Durée",
    results: (n: number) => `${n} résultat${n !== 1 ? "s" : ""}`,
    activeFilters: (n: number) => `${n} filtre${n !== 1 ? "s" : ""} actif${n !== 1 ? "s" : ""}`,
    reset: "Réinitialiser les filtres",
  },
  empty: {
    title: "Aucun clip ne correspond à ces filtres",
    body: "Pour cette sélection, la combinaison est peut-être trop serrée. Élargis les critères, réinitialise les filtres ou explore une nouvelle sélection.",
    reset: "Réinitialiser les filtres",
    newSelection: "Nouvelle sélection",
    annuaire: "Parcourir l’annuaire",
  },
  error: {
    title: "Impossible de charger les clips pour l’instant",
    body: "Un souci réseau ou serveur est possible. Réessaie dans un instant ; si ça persiste, reviens plus tard.",
    retry: "Réessayer",
    detailsLabel: "Détails techniques (debug)",
    selectionRef: "Réf. de sélection",
  },
  more: {
    title: "Aller plus loin",
    lead:
      "Les clips donnent un aperçu ; l’annuaire permet de lire les profils complets. Les lives, c’est rejoindre un créateur au moment où il est là.",
    annuaireTitle: "Annuaire des membres",
    annuaireBody: "Bios, jeux, liens et parcours : tout pour choisir qui suivre avec intention.",
    livesTitle: "Lives en direct",
    livesBody: "Tu préfères découvrir les chaînes en direct ? Passe par la page Lives TENF.",
    homeTitle: "Découvrir TENF",
    homeBody: "Vision d’ensemble de la communauté, actualités et points d’entrée.",
  },
  spirit: {
    title: "L’esprit TENF",
    subtitle: "Ce qui guide cette vitrine — sans compétition, avec de l’humain.",
    cards: [
      {
        title: "Découverte équitable",
        body: "La sélection met en avant des moments variés ; côté serveur, les clips moins vus peuvent être favorisés pour équilibrer la visibilité.",
      },
      {
        title: "Entraide et visibilité",
        body: "On crée des ponts entre créateurs : curiosité, bienveillance, et envie de se soutenir plutôt que de se comparer.",
      },
      {
        title: "Ambiance bienveillante",
        body: "Ici, pas de classement agressif : des extraits pour rire, apprendre ou vibrer ensemble, dans le respect de chacun·e.",
      },
    ],
  },
  finalCta: {
    title: "Envie de découvrir la New Family autrement ?",
    subtitle: "Choisis ton prochain pas — tout aussi valide qu’un clip.",
    annuaire: "Voir l’annuaire",
    lives: "Voir les lives",
    discover: "Découvrir TENF",
  },
  memberHint: {
    text: "Tu es connecté·e en tant que membre TENF — retrouve ton espace et tes outils sur le tableau de bord.",
    cta: "Tableau de bord membre",
  },
} as const;

export type Discours2Part = {
  slug: string;
  title: string;
  emoji: string;
  objectif: string;
  points: string[];
  conseils: string[];
  discours: string[];
  keywords: string[];
};

export const discours2General = {
  title: "Parcours Discours 2",
  subtitle: "Accueil global de la présentation d'intégration",
  points: [
    "Poser un cadre clair: bienveillance, respect et réciprocité.",
    "Rappeler que l'entraide fonctionne dans les deux sens.",
    "Expliquer le fil conducteur de toute la réunion avant d'entrer dans le détail.",
    "Annoncer une progression en étapes pour garder un rythme simple et compréhensible.",
  ],
  conseils: [
    "Donner le ton dès le départ: calme, accueillant et structuré.",
    "Vérifier que tout le monde suit avant de cliquer sur la partie suivante.",
    "Mettre en avant les mots-clés pour renforcer la mémorisation.",
    "Laisser des mini-pauses entre les sections pour les questions rapides.",
  ],
};

export const discours2Parts: Discours2Part[] = [
  {
    slug: "intro",
    title: "Introduction",
    emoji: "👋",
    objectif: "Accueillir et poser le cadre humain de la New Family.",
    points: [
      "Souhaiter la bienvenue et valoriser la présence des participants.",
      "Présenter la New Family comme une communauté structurée et humaine.",
      "Expliquer la réciprocité: on reçoit du soutien et on en donne.",
      "Rassurer: chacun avance à son rythme, sans pression.",
    ],
    conseils: [
      "Parler avec chaleur et sourire dans la voix.",
      "Insister sur les notions de collectif et d'implication.",
      "Reformuler le message central avant la transition.",
    ],
    discours: [
      "Salut tout le monde, et bienvenue officiellement dans la Twitch Entraide New Family.",
      "Le simple fait d'etre ici montre deja une envie de comprendre, de s'integrer et de faire partie d'un collectif.",
      "Ici, l'entraide fonctionne dans les deux sens: la visibilite ne s'achete pas, elle se construit par l'implication, le respect et la participation.",
      "Vous avancez a votre rythme, mais si vous choisissez de vous engager, la communaute s'engagera pour vous.",
    ],
    keywords: ["bienvenue", "collectif", "entraide", "implication", "respect", "rythme"],
  },
  {
    slug: "histoire",
    title: "Histoire et fondations",
    emoji: "📜",
    objectif: "Montrer l'origine du projet et ses valeurs non negociables.",
    points: [
      "Raconter la transition de Twitch Entraide Family vers New Family.",
      "Expliquer la ligne rouge: refus de monnayer l'entraide.",
      "Rappeler la date cle du 2 septembre 2024.",
      "Souligner la croissance et la diversite de la communaute.",
    ],
    conseils: [
      "Raconter cette partie comme une histoire vraie, pas comme une liste.",
      "Mettre fortement en avant les valeurs fondatrices.",
      "Conclure sur \"l'humain avant tout\".",
    ],
    discours: [
      "Pour comprendre la New Family d'aujourd'hui, il faut revenir un peu en arriere.",
      "Le point de rupture a ete clair: ici, l'entraide ne se monetise pas et la visibilite ne s'achete pas.",
      "Le 2 septembre 2024 marque le vrai nouveau depart, avec un cadre plus clair, solide et coherent.",
      "Au-dela des chiffres, notre force reste la diversite et une progression collective basee sur l'humain.",
    ],
    keywords: ["valeurs", "ligne rouge", "2 septembre 2024", "coherent", "humain"],
  },
  {
    slug: "staff",
    title: "Le staff",
    emoji: "🛡️",
    objectif: "Presenter une equipe accessible, organisee et equitable.",
    points: [
      "Expliquer les roles: fondateurs, coordinateurs, moderation.",
      "Montrer que le staff sert, accompagne et structure la communaute.",
      "Rappeler l'accessibilite du staff en salon, vocal et message prive.",
      "Insister sur l'equite: les regles s'appliquent a tous.",
    ],
    conseils: [
      "Presenter les roles avec des exemples concrets de missions.",
      "Eviter le ton \"hierarchique\", privilegier l'idee de service.",
      "Conclure sur la coherence et la justice du cadre.",
    ],
    discours: [
      "Derriere la New Family, il y a d'abord des personnes qui donnent du temps et de l'energie.",
      "Le staff n'est pas la pour dominer: il ecoute, organise, accompagne et maintient un cadre juste.",
      "La moderation protege l'ambiance, aide les membres et gere les situations sensibles quand c'est necessaire.",
      "Le staff est accessible, mais toujours dans un cadre respectueux pour que chacun evolue sainement.",
    ],
    keywords: ["staff", "accompagne", "equite", "accessible", "cadre juste"],
  },
  {
    slug: "roles",
    title: "Roles communautaires",
    emoji: "🏷️",
    objectif: "Faire comprendre les roles comme outil d'organisation, pas de jugement.",
    points: [
      "Les roles structurent la visibilite et le fonctionnement du serveur.",
      "Le role Communaute n'est pas une sanction.",
      "Le retour en role actif est possible par une reprise d'engagement.",
      "Des roles specifiques existent pour proteger les mineurs.",
    ],
    conseils: [
      "Dire explicitement qu'il n'y a pas de hierarchie de valeur humaine.",
      "Expliquer calmement la logique de visibilite.",
      "Rassurer sur la possibilite d'evolution des roles.",
    ],
    discours: [
      "Ici, chacun a sa place: les roles servent a organiser, pas a juger.",
      "Le role Communaute conserve l'acces au serveur, mais la mise en avant automatique est suspendue.",
      "Ce role reflete un niveau d'implication actuel et non une sanction personnelle.",
      "Rien n'est fige: la reprise d'engagement permet de revenir en role actif.",
    ],
    keywords: ["chacun a sa place", "organiser", "pas une sanction", "engagement", "evolution"],
  },
  {
    slug: "spotlight",
    title: "Spotlight New Family",
    emoji: "🎯",
    objectif: "Presenter le systeme phare comme un tremplin collectif.",
    points: [
      "Le Spotlight remplace l'ancien Live Gagnant.",
      "Ce n'est pas un examen: c'est un moment d'authenticite.",
      "Le but est de creer des connexions durables, pas un pic ponctuel.",
      "La reciprocite est essentielle: soutenir aussi les Spotlights des autres.",
    ],
    conseils: [
      "Insister sur la dimension humaine et non performative.",
      "Rappeler que l'acces depend de l'implication et de la reciprocite.",
      "Parler du Spotlight comme d'une opportunite construite ensemble.",
    ],
    discours: [
      "Le Spotlight est le systeme phare: vous mettre en lumiere dans un cadre structure et collectif.",
      "Pendant une heure, la communaute se rassemble pour decouvrir votre univers et creer du lien durable.",
      "Ce n'est pas un examen: on ne cherche pas la perfection, on cherche l'authenticite.",
      "Plus vous soutenez les autres, plus la communaute sera naturellement presente pour vous.",
    ],
    keywords: ["Spotlight", "authenticite", "collectif", "reciprocite", "lien durable"],
  },
  {
    slug: "evenements",
    title: "Evenements et ecosysteme",
    emoji: "🎉",
    objectif: "Montrer que la New Family depasse largement un simple Discord.",
    points: [
      "Evenements reguliers: film, gaming, defis, formations.",
      "Projets collaboratifs pour renforcer les liens.",
      "Ressources pratiques: guides, OBS, communication, organisation.",
      "Regle cle: ce qui se passe sur Discord reste sur Discord.",
    ],
    conseils: [
      "Donner 2-3 exemples d'evenements recents.",
      "Rappeler la confidentialite des vocaux et soirees internes.",
      "Relier chaque activite a l'objectif d'entraide durable.",
    ],
    discours: [
      "La New Family, ce n'est pas seulement un serveur: c'est un ecosysteme d'entraide structure.",
      "Les evenements et projets permettent de creer des liens solides sur la duree.",
      "On propose aussi des ressources concretes pour progresser: technique, organisation et communication.",
      "Un principe non negociable: les moments internes Discord ne doivent jamais etre diffuses en live.",
    ],
    keywords: ["ecosysteme", "entraide", "liens", "ressources", "confidentialite"],
  },
  {
    slug: "vip",
    title: "Force du role VIP",
    emoji: "⭐",
    objectif: "Valoriser l'implication reguliere sans logique de statut social.",
    points: [
      "Le role VIP reconnait la constance et l'etat d'esprit.",
      "Il ne s'achete pas et ne depend pas des stats Twitch.",
      "Le role Contributeur TENF valorise une implication exemplaire du mois.",
      "Ces roles servent la dynamique collective, pas le pouvoir.",
    ],
    conseils: [
      "Bien distinguer reconnaissance et hierarchie.",
      "Insister sur les criteres humains: fiabilite, soutien, regularite.",
      "Rappeler la logique de vote staff pour Contributeur TENF.",
    ],
    discours: [
      "Ce qui fait vivre la communaute, ce sont les gestes simples et reguliers des membres impliques.",
      "Le role VIP met en lumiere cette implication: il ne s'achete pas et ne depend pas des chiffres.",
      "Le role Contributeur TENF valorise chaque mois un membre qui incarne l'esprit de la communaute.",
      "L'objectif n'est pas de donner du pouvoir, mais de reconnaitre un engagement humain concret.",
    ],
    keywords: ["VIP", "ne s'achete pas", "regularite", "Contributeur TENF", "engagement humain"],
  },
  {
    slug: "points",
    title: "Points et recompenses",
    emoji: "🪙",
    objectif: "Presenter un systeme ludique qui valorise les bonnes actions.",
    points: [
      "Les points recompensent l'implication, pas la competition.",
      "Les actions utiles du quotidien permettent de gagner des points.",
      "La boutique Spotlight propose des recompenses utiles et fun.",
      "Le bonus journalier et les declarations de raid sont essentiels.",
    ],
    conseils: [
      "Faire une demo simple de la commande journaliere.",
      "Montrer comment declarer un raid pour valoriser l'entraide.",
      "Rappeler que chacun avance a son rythme.",
    ],
    discours: [
      "Chaque action positive peut rapporter des points, non pas pour classer, mais pour reconnaitre l'engagement.",
      "Les points se gagnent en vivant la communaute: aider, participer, soutenir, parrainer.",
      "Ensuite, ils ouvrent l'acces a la boutique Spotlight: recompenses utiles, analyses, mises en avant.",
      "Ce systeme rend visible l'implication et garde une dynamique ludique, sans pression.",
    ],
    keywords: ["points", "engagement", "boutique Spotlight", "bonus journalier", "sans pression"],
  },
  {
    slug: "engagement",
    title: "Engagement TENF",
    emoji: "🤝",
    objectif: "Expliquer l'equilibre entre soutien interne et ouverture externe.",
    points: [
      "Le follow est un premier pas pour decouvrir les univers.",
      "Raider les membres TENF est important, mais rester ouvert l'est aussi.",
      "La New Family est un point d'ancrage, pas une cage.",
      "Au-dela des actions techniques, le lien se construit par l'attitude.",
    ],
    conseils: [
      "Eviter les injonctions: parler d'ouverture et de progression.",
      "Repetir la phrase cle \"point d'ancrage, pas une cage\".",
      "Mettre l'accent sur l'echange sincere dans les chats.",
    ],
    discours: [
      "S'integrer commence par decouvrir les autres createurs et suivre les chaines actives.",
      "Le follow est un outil de connexion, pas une monnaie d'echange.",
      "Raider la Family est important, mais rester ouvert vers l'exterieur est sain et necessaire.",
      "Le follow est le premier pas: ensuite, le vrai lien se construit dans la qualite des echanges.",
    ],
    keywords: ["follow", "connexion", "raid", "point d'ancrage", "echange"],
  },
  {
    slug: "progression",
    title: "Conseils progression TENF",
    emoji: "📈",
    objectif: "Donner une methode simple pour progresser naturellement.",
    points: [
      "Participer aux discussions ecrites/vocales et aux Spotlights.",
      "Aider les nouveaux et partager son experience.",
      "La difference se fait sur la regularite et la fiabilite.",
      "Pas de course: chacun contribue selon son rythme.",
    ],
    conseils: [
      "Valoriser les petits gestes repetes plutot que les coups d'eclat.",
      "Recadrer gentiment les attentes de resultats immediats.",
      "Conclure sur la constance et la qualite des interactions.",
    ],
    discours: [
      "Progresser ici repose sur des actions simples et concretes: presence, entraide, participation.",
      "Ce qui fait la difference n'est pas spectaculaire: c'est la regularite, la fiabilite et le respect du cadre.",
      "L'implication se mesure dans la constance, pas uniquement dans les statistiques.",
      "Il n'y a pas de course, mais une dynamique collective ou chaque pas compte.",
    ],
    keywords: ["regularite", "fiabilite", "constance", "pas de course", "dynamique collective"],
  },
  {
    slug: "invitation",
    title: "Inviter de nouveaux membres",
    emoji: "📨",
    objectif: "Expliquer une croissance maitrisee basee sur la qualite humaine.",
    points: [
      "La croissance repose sur la recommandation de confiance.",
      "Verifier l'alignement avec l'esprit entraide et respect.",
      "Parcours d'entree: reglement, role, reunion d'integration.",
      "Chaque nouveau membre influence l'equilibre du groupe.",
    ],
    conseils: [
      "Parler de croissance maitrisee plutot que de volume.",
      "Insister sur le role protecteur du processus d'integration.",
      "Faire reformuler les 3 etapes d'entree par les nouveaux.",
    ],
    discours: [
      "La New Family grandit par confiance, pas par publicite massive.",
      "On privilegie la qualite humaine: des personnes qui veulent construire et pas seulement consommer.",
      "Pour inviter quelqu'un, expliquez le parcours: reglement, choix du role, reunion d'integration.",
      "Ce processus protege l'equilibre de la communaute et la fait grandir sainement.",
    ],
    keywords: ["confiance", "qualite humaine", "reglement", "integration", "equilibre"],
  },
  {
    slug: "final",
    title: "Conclusion et prochaines etapes",
    emoji: "🏁",
    objectif: "Cloturer clairement, ouvrir aux questions et lancer les actions post-reunion.",
    points: [
      "Prendre un temps final de questions/reponses.",
      "Annoncer les prochaines etapes d'integration.",
      "Presenter le site officiel teamnewfamily.netlify.app.",
      "Conclure sur l'implication humaine et l'accueil officiel.",
    ],
    conseils: [
      "Ralentir le rythme pour une fin claire et rassurante.",
      "Verifier que chacun sait quoi faire apres la reunion.",
      "Terminer sur une phrase positive et mobilisatrice.",
    ],
    discours: [
      "On arrive a la fin de cette reunion d'integration: merci pour votre presence et vos questions.",
      "Dans les prochaines heures, vous serez integres au systeme actif; la mise a jour du site suit en fin de semaine.",
      "Le site officiel centralise documentation, Spotlights, equipe, createurs actifs et lives en cours.",
      "Bienvenue officiellement dans la New Family: vous n'avez pas a tout faire d'un coup, mais chaque pas compte.",
    ],
    keywords: ["questions", "prochaines etapes", "site officiel", "bienvenue", "chaque pas compte"],
  },
];

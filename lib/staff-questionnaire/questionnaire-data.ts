/**
 * Questionnaire posture staff — 85 questions, 12 parties.
 * Généré par scripts/gen-staff-questionnaire-data.mjs — ne pas éditer à la main.
 */
import type { QuestionnaireQuestionDef } from "./types";

export const STAFF_QUESTIONNAIRE_TITLE =
  "Questionnaire posture staff / Community Management TENF";

export const STAFF_QUESTIONNAIRE_DESCRIPTION =
  "Comprendre ton fonctionnement, ta communication, ton autonomie et ta posture staff pour t'accompagner pendant la formation.";

export const STAFF_QUESTIONNAIRE_QUESTIONS: QuestionnaireQuestionDef[] = [
  {
    "key": "q1",
    "number": 1,
    "sectionKey": "rapport-role",
    "sectionTitle": "Ton rapport au rôle staff",
    "label": "Pourquoi as-tu voulu rejoindre le staff TENF ?",
    "type": "TEXT_LONG",
    "required": true
  },
  {
    "key": "q2",
    "number": 2,
    "sectionKey": "rapport-role",
    "sectionTitle": "Ton rapport au rôle staff",
    "label": "Qu'est-ce que le rôle de modérateur représente pour toi ?",
    "type": "MULTIPLE_CHOICE",
    "required": true,
    "options": [
      "Protéger le serveur",
      "Faire respecter les règles",
      "Aider les membres",
      "Accueillir les nouveaux",
      "Représenter TENF",
      "Être un repère pour la communauté",
      "Gérer les conflits",
      "Participer à l'évolution du projet",
      "Être utile à l'équipe",
      "Avoir plus de responsabilités",
      "Autre"
    ]
  },
  {
    "key": "q3",
    "number": 3,
    "sectionKey": "rapport-role",
    "sectionTitle": "Ton rapport au rôle staff",
    "label": "Selon toi, quelle est la différence entre un modérateur classique et un community manager ?",
    "type": "TEXT_LONG",
    "required": true
  },
  {
    "key": "q4",
    "number": 4,
    "sectionKey": "rapport-role",
    "sectionTitle": "Ton rapport au rôle staff",
    "label": "Dans le staff, tu te sens plutôt :",
    "type": "SINGLE_CHOICE",
    "required": true,
    "options": [
      "Très à l'aise",
      "À l'aise mais encore en apprentissage",
      "Motivé mais parfois perdu",
      "Présent mais pas encore vraiment légitime",
      "En difficulté",
      "En retrait",
      "Je ne sais pas trop"
    ],
    "complementLabel": "Explique pourquoi."
  },
  {
    "key": "q5",
    "number": 5,
    "sectionKey": "rapport-role",
    "sectionTitle": "Ton rapport au rôle staff",
    "label": "Qu'est-ce qui te donne le plus envie de t'impliquer dans TENF ?",
    "type": "TEXT_LONG",
    "required": true
  },
  {
    "key": "q6",
    "number": 6,
    "sectionKey": "rapport-role",
    "sectionTitle": "Ton rapport au rôle staff",
    "label": "Qu'est-ce qui peut te freiner dans ton implication ?",
    "type": "MULTIPLE_CHOICE",
    "required": true,
    "options": [
      "Manque de temps",
      "Manque de confiance",
      "Peur de mal faire",
      "Peur du conflit",
      "Manque de clarté dans les consignes",
      "Difficulté à prendre des initiatives",
      "Trop d'informations à retenir",
      "Difficulté à trouver ma place",
      "Ambiance d'équipe",
      "Problèmes personnels",
      "Autre"
    ],
    "complementLabel": "Développe si tu le souhaites."
  },
  {
    "key": "q7",
    "number": 7,
    "sectionKey": "profil-comportemental",
    "sectionTitle": "Profil comportemental",
    "label": "Quand tu arrives dans un groupe, tu es plutôt :",
    "type": "MULTIPLE_CHOICE",
    "required": true,
    "options": [
      "Observateur avant de parler",
      "À l'aise rapidement",
      "Discret",
      "Très sociable",
      "Méfiant au début",
      "Besoin de temps pour comprendre les dynamiques",
      "À l'aise avec les personnes que je connais déjà",
      "Variable selon mon humeur"
    ],
    "complementLabel": "Explique."
  },
  {
    "key": "q8",
    "number": 8,
    "sectionKey": "profil-comportemental",
    "sectionTitle": "Profil comportemental",
    "label": "En équipe, tu es plutôt quelqu'un qui :",
    "type": "MULTIPLE_CHOICE",
    "required": true,
    "options": [
      "Prend naturellement les devants",
      "Attend qu'on lui donne une mission",
      "Observe puis agit",
      "Aime soutenir les autres",
      "Préfère les tâches claires",
      "Propose des idées",
      "Évite de trop s'imposer",
      "A du mal à savoir quoi faire sans consigne"
    ]
  },
  {
    "key": "q9",
    "number": 9,
    "sectionKey": "profil-comportemental",
    "sectionTitle": "Profil comportemental",
    "label": "Quand une situation devient floue, tu as tendance à :",
    "type": "MULTIPLE_CHOICE",
    "required": true,
    "options": [
      "Demander rapidement de l'aide",
      "Attendre de voir si ça se règle seul",
      "Chercher une solution par moi-même",
      "Me sentir stressé",
      "Me bloquer",
      "Agir vite, parfois trop vite",
      "Remonter l'information à un admin",
      "En parler avec un autre modérateur"
    ]
  },
  {
    "key": "q10",
    "number": 10,
    "sectionKey": "profil-comportemental",
    "sectionTitle": "Profil comportemental",
    "label": "Face à une responsabilité, tu es plutôt :",
    "type": "MULTIPLE_CHOICE",
    "required": true,
    "options": [
      "Motivé",
      "Stressé",
      "Prudent",
      "Confiant",
      "Perfectionniste",
      "Peur de décevoir",
      "À l'aise si le cadre est clair",
      "À l'aise même sans cadre précis"
    ]
  },
  {
    "key": "q11",
    "number": 11,
    "sectionKey": "profil-comportemental",
    "sectionTitle": "Profil comportemental",
    "label": "Quand tu fais une erreur, tu réagis comment ?",
    "type": "MULTIPLE_CHOICE",
    "required": true,
    "options": [
      "Je l'assume facilement",
      "Je culpabilise beaucoup",
      "Je cherche à comprendre",
      "Je me défends d'abord",
      "J'ai peur du regard des autres",
      "Je préfère qu'on me le dise en privé",
      "Je peux me braquer si la remarque est mal formulée",
      "Je transforme ça en apprentissage"
    ],
    "complementLabel": "Explique."
  },
  {
    "key": "q12",
    "number": 12,
    "sectionKey": "profil-comportemental",
    "sectionTitle": "Profil comportemental",
    "label": "Comment réagis-tu quand on te fait une remarque constructive ?",
    "type": "MULTIPLE_CHOICE",
    "required": true,
    "options": [
      "Je l'écoute facilement",
      "Ça dépend de la personne",
      "Ça dépend du ton utilisé",
      "Je peux le prendre personnellement",
      "J'ai besoin de temps pour digérer",
      "Je pose des questions pour comprendre",
      "Je me remets beaucoup en question",
      "Je me sens attaqué même si ce n'est pas le but"
    ]
  },
  {
    "key": "q13",
    "number": 13,
    "sectionKey": "profil-comportemental",
    "sectionTitle": "Profil comportemental",
    "label": "Dans une équipe, tu préfères :",
    "type": "MULTIPLE_CHOICE",
    "required": true,
    "options": [
      "Avoir une mission précise",
      "Avoir de la liberté",
      "Être guidé au début puis autonome",
      "Travailler en binôme",
      "Travailler seul avec validation ensuite",
      "Être dans un pôle bien défini",
      "Pouvoir toucher à plusieurs domaines"
    ]
  },
  {
    "key": "q14",
    "number": 14,
    "sectionKey": "mode-fonctionnement",
    "sectionTitle": "Mode de fonctionnement",
    "label": "Pour être efficace, tu as besoin de :",
    "type": "MULTIPLE_CHOICE",
    "required": true,
    "options": [
      "Consignes écrites",
      "Explications vocales",
      "Exemples concrets",
      "Démonstration en direct",
      "Récap après réunion",
      "Checklist",
      "Autonomie totale",
      "Validation régulière",
      "Feedbacks individuels",
      "Temps d'observation"
    ]
  },
  {
    "key": "q15",
    "number": 15,
    "sectionKey": "mode-fonctionnement",
    "sectionTitle": "Mode de fonctionnement",
    "label": "Quand une mission t'est confiée, tu préfères :",
    "type": "MULTIPLE_CHOICE",
    "required": true,
    "options": [
      "Une consigne très détaillée",
      "Une consigne globale avec liberté",
      "Un objectif clair mais pas trop de détails",
      "Un modèle à suivre",
      "Un délai précis",
      "Un point de suivi à mi-parcours",
      "Pouvoir poser des questions à tout moment"
    ]
  },
  {
    "key": "q16",
    "number": 16,
    "sectionKey": "mode-fonctionnement",
    "sectionTitle": "Mode de fonctionnement",
    "label": "Si tu ne comprends pas une consigne, tu fais quoi ?",
    "type": "MULTIPLE_CHOICE",
    "required": true,
    "options": [
      "Je demande tout de suite",
      "J'essaie de deviner",
      "J'attends que quelqu'un précise",
      "Je cherche dans les documents",
      "Je demande à un autre modo",
      "Je risque de ne rien faire par peur de mal faire"
    ]
  },
  {
    "key": "q17",
    "number": 17,
    "sectionKey": "mode-fonctionnement",
    "sectionTitle": "Mode de fonctionnement",
    "label": "Tu retiens mieux les informations quand elles sont :",
    "type": "MULTIPLE_CHOICE",
    "required": true,
    "options": [
      "Écrites",
      "Expliquées à l'oral",
      "Répétées plusieurs fois",
      "Illustrées par des exemples",
      "Résumées en points clés",
      "Mises en pratique directement",
      "Regroupées dans un document"
    ]
  },
  {
    "key": "q18",
    "number": 18,
    "sectionKey": "mode-fonctionnement",
    "sectionTitle": "Mode de fonctionnement",
    "label": "Ton rythme idéal dans le staff serait :",
    "type": "MULTIPLE_CHOICE",
    "required": true,
    "options": [
      "Quelques petites missions régulières",
      "Une grosse mission ponctuelle",
      "Une présence quotidienne légère",
      "Une présence surtout lors des événements",
      "Une implication selon mes disponibilités",
      "Un rôle fixe dans un pôle précis",
      "Des missions variées pour ne pas me lasser"
    ]
  },
  {
    "key": "q19",
    "number": 19,
    "sectionKey": "mode-fonctionnement",
    "sectionTitle": "Mode de fonctionnement",
    "label": "Qu'est-ce qui te fait perdre en efficacité ?",
    "type": "MULTIPLE_CHOICE",
    "required": true,
    "options": [
      "Trop de messages",
      "Trop de changements",
      "Manque de clarté",
      "Trop de pression",
      "Conflits internes",
      "Fatigue personnelle",
      "Manque de reconnaissance",
      "Peur de mal faire",
      "Trop de responsabilités d'un coup",
      "Autre"
    ]
  },
  {
    "key": "q20",
    "number": 20,
    "sectionKey": "style-communication",
    "sectionTitle": "Style de communication",
    "label": "Tu communiques plus facilement :",
    "type": "MULTIPLE_CHOICE",
    "required": true,
    "options": [
      "À l'écrit",
      "En vocal",
      "En message privé",
      "En groupe staff",
      "En réunion",
      "En binôme",
      "En réaction emoji / petits messages",
      "Ça dépend du sujet"
    ]
  },
  {
    "key": "q21",
    "number": 21,
    "sectionKey": "style-communication",
    "sectionTitle": "Style de communication",
    "label": "Quand tu dois faire passer un message important, tu es plutôt :",
    "type": "MULTIPLE_CHOICE",
    "required": true,
    "options": [
      "Direct",
      "Très diplomate",
      "Hésitant",
      "Long dans mes explications",
      "Court et factuel",
      "Émotionnel",
      "Prudent",
      "J'ai peur d'être mal compris"
    ]
  },
  {
    "key": "q22",
    "number": 22,
    "sectionKey": "style-communication",
    "sectionTitle": "Style de communication",
    "label": "Quand quelqu'un ne comprend pas ce que tu dis, tu as tendance à :",
    "type": "MULTIPLE_CHOICE",
    "required": true,
    "options": [
      "Reformuler calmement",
      "T'énerver intérieurement",
      "Abandonner",
      "Te justifier beaucoup",
      "Demander ce qui n'est pas clair",
      "Passer par quelqu'un d'autre",
      "Faire un vocal pour expliquer"
    ]
  },
  {
    "key": "q23",
    "number": 23,
    "sectionKey": "style-communication",
    "sectionTitle": "Style de communication",
    "label": "Dans un désaccord, tu préfères :",
    "type": "MULTIPLE_CHOICE",
    "required": true,
    "options": [
      "En parler directement",
      "Prendre du recul avant de répondre",
      "Passer par un médiateur",
      "Éviter le sujet",
      "Écrire pour mieux poser mes idées",
      "Faire un vocal pour éviter les malentendus",
      "Attendre que la tension redescende"
    ]
  },
  {
    "key": "q24",
    "number": 24,
    "sectionKey": "style-communication",
    "sectionTitle": "Style de communication",
    "label": "Tu as parfois du mal à :",
    "type": "MULTIPLE_CHOICE",
    "required": true,
    "options": [
      "Dire non",
      "Poser une limite",
      "Être direct",
      "Ne pas trop te justifier",
      "Ne pas prendre les choses personnellement",
      "Exprimer ton désaccord",
      "Garder ton calme à l'écrit",
      "Demander de l'aide",
      "Faire confiance aux autres"
    ]
  },
  {
    "key": "q25",
    "number": 25,
    "sectionKey": "style-communication",
    "sectionTitle": "Style de communication",
    "label": "Comment préfères-tu recevoir un feedback ?",
    "type": "MULTIPLE_CHOICE",
    "required": true,
    "options": [
      "En privé à l'écrit",
      "En privé en vocal",
      "En réunion collective",
      "Avec des exemples précis",
      "Avec des pistes d'amélioration",
      "Avec d'abord du positif puis les points à travailler",
      "De manière directe",
      "De manière très douce"
    ]
  },
  {
    "key": "q26",
    "number": 26,
    "sectionKey": "autonomie",
    "sectionTitle": "Capacité d'autonomie",
    "label": "Quand tu vois un petit problème sur le serveur, tu fais quoi ?",
    "type": "MULTIPLE_CHOICE",
    "required": true,
    "options": [
      "J'interviens si je sais quoi faire",
      "Je demande d'abord à un admin",
      "Je préviens le staff",
      "J'observe avant d'agir",
      "Je laisse quelqu'un de plus expérimenté gérer",
      "J'interviens parfois trop vite",
      "Je ne sais pas toujours si j'ai le droit d'agir"
    ]
  },
  {
    "key": "q27",
    "number": 27,
    "sectionKey": "autonomie",
    "sectionTitle": "Capacité d'autonomie",
    "label": "Sur une échelle de 1 à 5, à quel point te sens-tu autonome dans le staff ?",
    "type": "SCALE_1_5",
    "required": true,
    "complementLabel": "Explique pourquoi.",
    "scaleLabels": {
      "1": "pas autonome du tout",
      "2": "peu autonome",
      "3": "autonome sur les situations simples",
      "4": "plutôt autonome",
      "5": "très autonome"
    }
  },
  {
    "key": "q28",
    "number": 28,
    "sectionKey": "autonomie",
    "sectionTitle": "Capacité d'autonomie",
    "label": "Qu'est-ce qui t'empêche d'être plus autonome ?",
    "type": "MULTIPLE_CHOICE",
    "required": true,
    "options": [
      "Peur de mal faire",
      "Manque d'expérience",
      "Manque d'informations",
      "Manque de confiance",
      "Peur de dépasser mon rôle",
      "Peur de la réaction des admins",
      "Peur de la réaction des membres",
      "Je ne sais pas où sont les ressources",
      "Je préfère avoir validation avant d'agir",
      "Autre"
    ]
  },
  {
    "key": "q29",
    "number": 29,
    "sectionKey": "autonomie",
    "sectionTitle": "Capacité d'autonomie",
    "label": "Dans quelles situations pourrais-tu agir seul aujourd'hui ?",
    "type": "TEXT_LONG",
    "required": true
  },
  {
    "key": "q30",
    "number": 30,
    "sectionKey": "autonomie",
    "sectionTitle": "Capacité d'autonomie",
    "label": "Dans quelles situations as-tu absolument besoin d'un admin ?",
    "type": "TEXT_LONG",
    "required": true
  },
  {
    "key": "q31",
    "number": 31,
    "sectionKey": "autonomie",
    "sectionTitle": "Capacité d'autonomie",
    "label": "Quand tu prends une initiative, tu préfères :",
    "type": "SINGLE_CHOICE",
    "required": true,
    "options": [
      "Agir puis informer",
      "Demander avant d'agir",
      "Proposer au staff puis attendre validation",
      "Agir seulement si une procédure existe",
      "Ne pas prendre d'initiative pour éviter les erreurs"
    ]
  },
  {
    "key": "q32",
    "number": 32,
    "sectionKey": "autonomie",
    "sectionTitle": "Capacité d'autonomie",
    "label": "Selon toi, qu'est-ce qu'une bonne autonomie dans le staff TENF ?",
    "type": "TEXT_LONG",
    "required": true
  },
  {
    "key": "q33",
    "number": 33,
    "sectionKey": "rapport-conflit",
    "sectionTitle": "Rapport au conflit",
    "label": "Face à un conflit entre deux membres, ta première réaction est :",
    "type": "MULTIPLE_CHOICE",
    "required": true,
    "options": [
      "Observer",
      "Intervenir publiquement",
      "Passer en privé",
      "Prévenir le staff",
      "Demander à un admin",
      "Essayer de calmer",
      "Me sentir stressé",
      "Ne pas savoir quoi faire"
    ]
  },
  {
    "key": "q34",
    "number": 34,
    "sectionKey": "rapport-conflit",
    "sectionTitle": "Rapport au conflit",
    "label": "Quand quelqu'un est agressif ou provocateur, tu as tendance à :",
    "type": "MULTIPLE_CHOICE",
    "required": true,
    "options": [
      "Rester calme",
      "Répondre sèchement",
      "Te retirer",
      "Demander de l'aide",
      "Essayer de comprendre pourquoi",
      "Poser une limite",
      "Te sentir personnellement attaqué",
      "Vouloir régler vite"
    ]
  },
  {
    "key": "q35",
    "number": 35,
    "sectionKey": "rapport-conflit",
    "sectionTitle": "Rapport au conflit",
    "label": "Qu'est-ce qui est le plus difficile pour toi dans un conflit ?",
    "type": "MULTIPLE_CHOICE",
    "required": true,
    "options": [
      "Rester neutre",
      "Ne pas prendre parti",
      "Oser intervenir",
      "Trouver les bons mots",
      "Gérer mes émotions",
      "Gérer les émotions des autres",
      "Poser une sanction",
      "Dire non",
      "Ne pas vouloir arranger tout le monde",
      "Faire respecter une décision impopulaire"
    ]
  },
  {
    "key": "q36",
    "number": 36,
    "sectionKey": "rapport-conflit",
    "sectionTitle": "Rapport au conflit",
    "label": "Quand deux personnes que tu apprécies sont en conflit, tu fais quoi ?",
    "type": "TEXT_LONG",
    "required": true
  },
  {
    "key": "q37",
    "number": 37,
    "sectionKey": "rapport-conflit",
    "sectionTitle": "Rapport au conflit",
    "label": "As-tu tendance à éviter les conflits ?",
    "type": "SINGLE_CHOICE",
    "required": true,
    "options": [
      "Oui, souvent",
      "Oui, parfois",
      "Non, je les gère plutôt bien",
      "Non, mais ils me fatiguent",
      "Je peux les affronter si je me sens soutenu",
      "Je peux intervenir, mais après un temps de réflexion"
    ],
    "complementLabel": "Explique."
  },
  {
    "key": "q38",
    "number": 38,
    "sectionKey": "rapport-conflit",
    "sectionTitle": "Rapport au conflit",
    "label": "Selon toi, quelle est la bonne posture staff dans un conflit ?",
    "type": "TEXT_LONG",
    "required": true
  },
  {
    "key": "q39",
    "number": 39,
    "sectionKey": "rapport-conflit",
    "sectionTitle": "Rapport au conflit",
    "label": "Que ne devrait jamais faire un modérateur dans un conflit ?",
    "type": "TEXT_LONG",
    "required": true
  },
  {
    "key": "q40",
    "number": 40,
    "sectionKey": "rapport-conflit",
    "sectionTitle": "Rapport au conflit",
    "label": "Quand un membre critique TENF publiquement, tu réagis comment ?",
    "type": "MULTIPLE_CHOICE",
    "required": true,
    "options": [
      "Je défends TENF directement",
      "Je demande des exemples concrets",
      "Je laisse passer",
      "Je préviens le staff",
      "Je réponds émotionnellement",
      "Je cherche à comprendre",
      "Je redirige vers un échange privé",
      "Je ne sais pas trop"
    ]
  },
  {
    "key": "q41",
    "number": 41,
    "sectionKey": "rapport-autorite",
    "sectionTitle": "Rapport à l'autorité et au cadre",
    "label": "Comment vis-tu les règles dans une communauté ?",
    "type": "MULTIPLE_CHOICE",
    "required": true,
    "options": [
      "Nécessaires",
      "Parfois trop rigides",
      "Rassurantes",
      "Contraignantes",
      "À adapter selon les cas",
      "Importantes si elles sont expliquées",
      "Difficiles à appliquer quand j'aime bien la personne concernée"
    ]
  },
  {
    "key": "q42",
    "number": 42,
    "sectionKey": "rapport-autorite",
    "sectionTitle": "Rapport à l'autorité et au cadre",
    "label": "Quand une décision staff ne va pas dans ton sens, tu as tendance à :",
    "type": "MULTIPLE_CHOICE",
    "required": true,
    "options": [
      "L'accepter même si je ne suis pas d'accord",
      "Demander des explications",
      "Être frustré",
      "En parler en privé",
      "Me braquer",
      "Me remettre en question",
      "Avoir besoin de temps",
      "Suivre la décision par loyauté au cadre"
    ]
  },
  {
    "key": "q43",
    "number": 43,
    "sectionKey": "rapport-autorite",
    "sectionTitle": "Rapport à l'autorité et au cadre",
    "label": "Pour toi, respecter la hiérarchie staff, c'est :",
    "type": "TEXT_LONG",
    "required": true
  },
  {
    "key": "q44",
    "number": 44,
    "sectionKey": "rapport-autorite",
    "sectionTitle": "Rapport à l'autorité et au cadre",
    "label": "Dans quelle situation pourrais-tu avoir du mal à appliquer une décision ?",
    "type": "MULTIPLE_CHOICE",
    "required": true,
    "options": [
      "Si je la trouve injuste",
      "Si elle concerne un ami",
      "Si elle est mal expliquée",
      "Si elle me semble trop dure",
      "Si elle me semble trop douce",
      "Si je n'ai pas été consulté",
      "Si elle arrive trop vite",
      "Autre"
    ]
  },
  {
    "key": "q45",
    "number": 45,
    "sectionKey": "rapport-autorite",
    "sectionTitle": "Rapport à l'autorité et au cadre",
    "label": "Comment réagis-tu face à une consigne urgente ?",
    "type": "MULTIPLE_CHOICE",
    "required": true,
    "options": [
      "J'agis rapidement",
      "Je panique un peu",
      "Je demande confirmation",
      "Je fais au mieux",
      "J'ai besoin de détails",
      "Je préfère qu'on me dise exactement quoi faire",
      "Je peux gérer si le cadre est clair"
    ]
  },
  {
    "key": "q46",
    "number": 46,
    "sectionKey": "rapport-autorite",
    "sectionTitle": "Rapport à l'autorité et au cadre",
    "label": "As-tu parfois du mal avec l'autorité ?",
    "type": "SINGLE_CHOICE",
    "required": true,
    "options": [
      "Oui",
      "Non",
      "Ça dépend de la personne",
      "Ça dépend du ton",
      "Ça dépend si la décision est expliquée",
      "Je respecte l'autorité mais j'ai besoin de comprendre"
    ],
    "complementLabel": "Explique."
  },
  {
    "key": "q47",
    "number": 47,
    "sectionKey": "gestion-emotionnelle",
    "sectionTitle": "Gestion émotionnelle",
    "label": "Quand tu es stressé dans le staff, ça se voit comment ?",
    "type": "MULTIPLE_CHOICE",
    "required": true,
    "options": [
      "Je parle moins",
      "Je parle plus",
      "Je deviens sec",
      "Je me retire",
      "Je demande beaucoup de validations",
      "Je me sens dépassé",
      "Je me mets à douter",
      "Je garde tout pour moi",
      "Je deviens plus émotif"
    ]
  },
  {
    "key": "q48",
    "number": 48,
    "sectionKey": "gestion-emotionnelle",
    "sectionTitle": "Gestion émotionnelle",
    "label": "Quels types de situations te touchent le plus émotionnellement ?",
    "type": "MULTIPLE_CHOICE",
    "required": true,
    "options": [
      "Les conflits",
      "Les injustices",
      "Les critiques",
      "Les membres en détresse",
      "Les tensions entre staff",
      "Le manque de reconnaissance",
      "Le sentiment d'être inutile",
      "Le rejet",
      "L'agressivité",
      "Les malentendus"
    ]
  },
  {
    "key": "q49",
    "number": 49,
    "sectionKey": "gestion-emotionnelle",
    "sectionTitle": "Gestion émotionnelle",
    "label": "Quand tu es émotionnellement touché, tu as besoin de :",
    "type": "MULTIPLE_CHOICE",
    "required": true,
    "options": [
      "Temps seul",
      "En parler en vocal",
      "Écrire ce que je ressens",
      "Recevoir du soutien",
      "Avoir une solution rapide",
      "Qu'on me laisse redescendre",
      "Qu'on me rassure",
      "Qu'on me dise clairement quoi faire"
    ]
  },
  {
    "key": "q50",
    "number": 50,
    "sectionKey": "gestion-emotionnelle",
    "sectionTitle": "Gestion émotionnelle",
    "label": "Sur une échelle de 1 à 5, à quel point arrives-tu à rester calme dans une situation tendue ?",
    "type": "SCALE_1_5",
    "required": true,
    "complementLabel": "Explique.",
    "scaleLabels": {
      "1": "très difficile",
      "2": "difficile",
      "3": "variable selon la situation",
      "4": "plutôt facile",
      "5": "très facile"
    }
  },
  {
    "key": "q51",
    "number": 51,
    "sectionKey": "gestion-emotionnelle",
    "sectionTitle": "Gestion émotionnelle",
    "label": "As-tu tendance à prendre les problèmes du serveur personnellement ?",
    "type": "SINGLE_CHOICE",
    "required": true,
    "options": [
      "Oui, souvent",
      "Oui, parfois",
      "Rarement",
      "Non",
      "Ça dépend des personnes impliquées",
      "Ça dépend de mon état de fatigue"
    ]
  },
  {
    "key": "q52",
    "number": 52,
    "sectionKey": "gestion-emotionnelle",
    "sectionTitle": "Gestion émotionnelle",
    "label": "Quand tu es fatigué ou à bout, est-ce que tu sais le dire ?",
    "type": "SINGLE_CHOICE",
    "required": true,
    "options": [
      "Oui facilement",
      "Oui mais tardivement",
      "Non, j'ai tendance à tenir jusqu'à craquer",
      "Je ne veux pas déranger",
      "Je préfère disparaître un peu",
      "J'ai besoin qu'on me le fasse remarquer"
    ]
  },
  {
    "key": "q53",
    "number": 53,
    "sectionKey": "gestion-emotionnelle",
    "sectionTitle": "Gestion émotionnelle",
    "label": "Quelle limite personnelle dois-tu mieux respecter dans le staff ?",
    "type": "TEXT_LONG",
    "required": true
  },
  {
    "key": "q54",
    "number": 54,
    "sectionKey": "travail-equipe",
    "sectionTitle": "Travail d'équipe",
    "label": "Dans une équipe, tu te sens utile quand :",
    "type": "MULTIPLE_CHOICE",
    "required": true,
    "options": [
      "On me confie une mission claire",
      "On me demande mon avis",
      "Je peux aider quelqu'un",
      "Je peux proposer des idées",
      "Je vois un résultat concret",
      "On reconnaît mon travail",
      "Je peux travailler en binôme",
      "Je comprends l'objectif global"
    ]
  },
  {
    "key": "q55",
    "number": 55,
    "sectionKey": "travail-equipe",
    "sectionTitle": "Travail d'équipe",
    "label": "Qu'est-ce qui peut créer de la frustration chez toi en équipe ?",
    "type": "MULTIPLE_CHOICE",
    "required": true,
    "options": [
      "Manque de communication",
      "Décisions trop rapides",
      "Décisions trop lentes",
      "Manque de reconnaissance",
      "Inégalités d'implication",
      "Flou dans les rôles",
      "Trop de critiques",
      "Trop peu de feedbacks",
      "Trop de changements",
      "Non-dits"
    ]
  },
  {
    "key": "q56",
    "number": 56,
    "sectionKey": "travail-equipe",
    "sectionTitle": "Travail d'équipe",
    "label": "Quand tu n'es pas d'accord avec un autre membre du staff, tu fais quoi ?",
    "type": "TEXT_LONG",
    "required": true
  },
  {
    "key": "q57",
    "number": 57,
    "sectionKey": "travail-equipe",
    "sectionTitle": "Travail d'équipe",
    "label": "Es-tu à l'aise pour demander de l'aide à l'équipe ?",
    "type": "MULTIPLE_CHOICE",
    "required": true,
    "options": [
      "Oui",
      "Non",
      "Ça dépend du sujet",
      "Ça dépend de la personne",
      "J'ai peur de déranger",
      "J'ai peur de paraître incompétent",
      "J'attends souvent trop longtemps"
    ]
  },
  {
    "key": "q58",
    "number": 58,
    "sectionKey": "travail-equipe",
    "sectionTitle": "Travail d'équipe",
    "label": "Es-tu à l'aise pour aider un autre modérateur en difficulté ?",
    "type": "MULTIPLE_CHOICE",
    "required": true,
    "options": [
      "Oui",
      "Oui si je maîtrise le sujet",
      "Pas toujours",
      "J'ai peur d'être maladroit",
      "Je préfère que ce soit un admin qui le fasse",
      "Je peux aider mais pas recadrer"
    ]
  },
  {
    "key": "q59",
    "number": 59,
    "sectionKey": "travail-equipe",
    "sectionTitle": "Travail d'équipe",
    "label": "Pour toi, une bonne équipe staff, c'est quoi ?",
    "type": "TEXT_LONG",
    "required": true
  },
  {
    "key": "q60",
    "number": 60,
    "sectionKey": "travail-equipe",
    "sectionTitle": "Travail d'équipe",
    "label": "Dans quel type de pôle te sentirais-tu le plus utile ?",
    "type": "MULTIPLE_CHOICE",
    "required": true,
    "options": [
      "Accueil des nouveaux",
      "Suivi des membres",
      "Animation communautaire",
      "Événements",
      "Modération / conflits",
      "Formation",
      "Communication",
      "Partenariats",
      "Site / outils",
      "Raids / entraide live",
      "Documentation",
      "Soutien émotionnel léger / écoute",
      "Analyse / observation",
      "Autre"
    ],
    "complementLabel": "Explique."
  },
  {
    "key": "q61",
    "number": 61,
    "sectionKey": "vision-tenf",
    "sectionTitle": "Vision de TENF",
    "label": "Comment expliquerais-tu TENF à quelqu'un qui ne connaît pas le projet ?",
    "type": "TEXT_LONG",
    "required": true
  },
  {
    "key": "q62",
    "number": 62,
    "sectionKey": "vision-tenf",
    "sectionTitle": "Vision de TENF",
    "label": "Selon toi, qu'est-ce qui différencie TENF d'un simple serveur de promotion ?",
    "type": "TEXT_LONG",
    "required": true
  },
  {
    "key": "q63",
    "number": 63,
    "sectionKey": "vision-tenf",
    "sectionTitle": "Vision de TENF",
    "label": "Quelles valeurs TENF doit absolument préserver ?",
    "type": "MULTIPLE_CHOICE",
    "required": true,
    "options": [
      "Entraide",
      "Bienveillance",
      "Cadre",
      "Respect",
      "Progression",
      "Transparence",
      "Humilité",
      "Professionnalisation",
      "Accessibilité",
      "Protection des membres",
      "Qualité plutôt que quantité",
      "Autre"
    ]
  },
  {
    "key": "q64",
    "number": 64,
    "sectionKey": "vision-tenf",
    "sectionTitle": "Vision de TENF",
    "label": "Selon toi, quel est le plus grand risque pour TENF à long terme ?",
    "type": "MULTIPLE_CHOICE",
    "required": true,
    "options": [
      "Épuisement des fondateurs",
      "Manque d'autonomie du staff",
      "Trop forte croissance",
      "Perte des valeurs",
      "Conflits internes",
      "Manque de clarté",
      "Mauvaise image externe",
      "Trop de dépendance à Discord",
      "Trop d'ambition trop vite",
      "Manque de reconnaissance",
      "Autre"
    ]
  },
  {
    "key": "q65",
    "number": 65,
    "sectionKey": "vision-tenf",
    "sectionTitle": "Vision de TENF",
    "label": "Quelle place aimerais-tu prendre dans l'évolution de TENF ?",
    "type": "TEXT_LONG",
    "required": true
  },
  {
    "key": "q66",
    "number": 66,
    "sectionKey": "vision-tenf",
    "sectionTitle": "Vision de TENF",
    "label": "Qu'est-ce que tu dois encore apprendre pour mieux représenter TENF ?",
    "type": "TEXT_LONG",
    "required": true
  },
  {
    "key": "q67",
    "number": 67,
    "sectionKey": "situations-pratiques",
    "sectionTitle": "Situations pratiques",
    "label": "Un membre poste son live au mauvais endroit plusieurs fois. Que fais-tu ?",
    "type": "TEXT_LONG",
    "required": true
  },
  {
    "key": "q68",
    "number": 68,
    "sectionKey": "situations-pratiques",
    "sectionTitle": "Situations pratiques",
    "label": "Deux membres se répondent sèchement dans un salon public. Que fais-tu ?",
    "type": "TEXT_LONG",
    "required": true
  },
  {
    "key": "q69",
    "number": 69,
    "sectionKey": "situations-pratiques",
    "sectionTitle": "Situations pratiques",
    "label": "Un membre vient en privé te dire qu'il se sent ignoré dans TENF. Que fais-tu ?",
    "type": "TEXT_LONG",
    "required": true
  },
  {
    "key": "q70",
    "number": 70,
    "sectionKey": "situations-pratiques",
    "sectionTitle": "Situations pratiques",
    "label": "Un membre critique violemment une décision staff en public. Que fais-tu ?",
    "type": "TEXT_LONG",
    "required": true
  },
  {
    "key": "q71",
    "number": 71,
    "sectionKey": "situations-pratiques",
    "sectionTitle": "Situations pratiques",
    "label": "Un ami proche ne respecte pas une règle du serveur. Que fais-tu ?",
    "type": "TEXT_LONG",
    "required": true
  },
  {
    "key": "q72",
    "number": 72,
    "sectionKey": "situations-pratiques",
    "sectionTitle": "Situations pratiques",
    "label": "Tu remarques qu'un modérateur semble démotivé ou absent. Que fais-tu ?",
    "type": "TEXT_LONG",
    "required": true
  },
  {
    "key": "q73",
    "number": 73,
    "sectionKey": "situations-pratiques",
    "sectionTitle": "Situations pratiques",
    "label": "Un nouveau membre est perdu après son arrivée. Que fais-tu ?",
    "type": "TEXT_LONG",
    "required": true
  },
  {
    "key": "q74",
    "number": 74,
    "sectionKey": "situations-pratiques",
    "sectionTitle": "Situations pratiques",
    "label": "Un membre très actif commence à prendre trop de place et à écraser les autres. Que fais-tu ?",
    "type": "TEXT_LONG",
    "required": true
  },
  {
    "key": "q75",
    "number": 75,
    "sectionKey": "situations-pratiques",
    "sectionTitle": "Situations pratiques",
    "label": "Un conflit commence en vocal et tu n'as pas tout entendu. Que fais-tu ?",
    "type": "TEXT_LONG",
    "required": true
  },
  {
    "key": "q76",
    "number": 76,
    "sectionKey": "situations-pratiques",
    "sectionTitle": "Situations pratiques",
    "label": "Tu reçois une critique sur TENF venant de l'extérieur. Que fais-tu ?",
    "type": "TEXT_LONG",
    "required": true
  },
  {
    "key": "q77",
    "number": 77,
    "sectionKey": "auto-evaluation",
    "sectionTitle": "Auto-évaluation finale",
    "label": "Aujourd'hui, tes trois forces principales dans le staff sont :",
    "type": "THREE_FIELDS",
    "required": true,
    "threeFieldLabels": [
      "Force 1",
      "Force 2",
      "Force 3"
    ]
  },
  {
    "key": "q78",
    "number": 78,
    "sectionKey": "auto-evaluation",
    "sectionTitle": "Auto-évaluation finale",
    "label": "Tes trois points à travailler sont :",
    "type": "THREE_FIELDS",
    "required": true,
    "threeFieldLabels": [
      "Point à travailler 1",
      "Point à travailler 2",
      "Point à travailler 3"
    ]
  },
  {
    "key": "q79",
    "number": 79,
    "sectionKey": "auto-evaluation",
    "sectionTitle": "Auto-évaluation finale",
    "label": "Sur quoi aimerais-tu être accompagné en priorité ?",
    "type": "MULTIPLE_CHOICE",
    "required": true,
    "options": [
      "Posture staff",
      "Communication",
      "Conflits",
      "Autonomie",
      "Technique Discord",
      "Compréhension des outils TENF",
      "Travail d'équipe",
      "Gestion émotionnelle",
      "Accueil des membres",
      "Animation communautaire",
      "Suivi des membres",
      "Autre"
    ]
  },
  {
    "key": "q80",
    "number": 80,
    "sectionKey": "auto-evaluation",
    "sectionTitle": "Auto-évaluation finale",
    "label": "Quelle forme d'accompagnement te conviendrait le mieux ?",
    "type": "MULTIPLE_CHOICE",
    "required": true,
    "options": [
      "Entretien individuel régulier",
      "Binôme avec un modérateur plus expérimenté",
      "Fiches pratiques",
      "Exercices de mise en situation",
      "Formation en vocal",
      "Formation écrite",
      "Observation avant action",
      "Missions progressives",
      "Feedback après situation réelle",
      "Petit groupe de travail"
    ]
  },
  {
    "key": "q81",
    "number": 81,
    "sectionKey": "auto-evaluation",
    "sectionTitle": "Auto-évaluation finale",
    "label": "Quelle phrase résume le mieux ton objectif personnel dans le staff ?",
    "type": "TEXT_LONG",
    "required": true
  },
  {
    "key": "q82",
    "number": 82,
    "sectionKey": "auto-evaluation",
    "sectionTitle": "Auto-évaluation finale",
    "label": "Qu'aimerais-tu que l'équipe comprenne mieux sur ton fonctionnement ?",
    "type": "TEXT_LONG",
    "required": true
  },
  {
    "key": "q83",
    "number": 83,
    "sectionKey": "auto-evaluation",
    "sectionTitle": "Auto-évaluation finale",
    "label": "Y a-t-il quelque chose que tu n'oses pas dire dans le staff mais qui pourrait t'aider à progresser ?",
    "type": "TEXT_LONG",
    "required": true
  },
  {
    "key": "q84",
    "number": 84,
    "sectionKey": "auto-evaluation",
    "sectionTitle": "Auto-évaluation finale",
    "label": "De quoi as-tu besoin pour te sentir plus légitime dans ton rôle ?",
    "type": "TEXT_LONG",
    "required": true
  },
  {
    "key": "q85",
    "number": 85,
    "sectionKey": "auto-evaluation",
    "sectionTitle": "Auto-évaluation finale",
    "label": "À la fin des 3 mois de formation, qu'aimerais-tu avoir réussi à améliorer ?",
    "type": "TEXT_LONG",
    "required": true
  }
];

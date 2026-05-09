/**
 * Changelog mensuel — textes orientés membres, viewers et équipe d’animation.
 * Colonne « communauté » : ce que vous voyez ou gagnez au quotidien.
 * Colonne « animation » : ce qui simplifie la vie de celles et ceux qui portent TENF au-delà de leur stream.
 */

export type MonthTabKind = "standard" | "prologue" | "horizon";

export type MonthTab = {
  id: string;
  label: string;
  hint: string;
  intro: string;
  pourToutLeMonde: string[];
  pourLeStaff: string[];
  kind?: MonthTabKind;
};

export const MONTHLY_CHANGELOG: MonthTab[] = [
  {
    id: "avant-le-site",
    label: "TENF, avant tout",
    hint: "Discord, Twitch, puis le site",
    kind: "prologue",
    intro:
      "La New Family vit surtout sur Discord et Twitch : entraide, vocaux, événements, raids. Le site rassemble l’essentiel pour présenter la communauté, s’inscrire aux réunions et suivre son activité — un prolongement pratique, pas un remplacement du serveur.",
    pourToutLeMonde: [
      "Vous pouvez déjà beaucoup découvrir TENF sans tout lire : l’accueil, les témoignages, le fonctionnement, l’annuaire et les lives donnent le ton.",
      "Red_Shadow_31, Nexou31 et Clara portent la vision, avec le staff et les bénévoles qui donnent du temps chaque semaine.",
    ],
    pourLeStaff: [
      "Les décisions rapides et l’ambiance du quotidien restent sur Discord ; le site aide surtout pour l’accueil des nouveaux, la transparence et les bilans.",
      "Quand une info n’est pas encore sur le site, le canal ou la réunion habituelle reste la bonne adresse — le site rattrape petit à petit.",
    ],
  },
  {
    id: "2025-12-a",
    label: "9–15 décembre 2025",
    hint: "Premiers pas sur le site",
    intro:
      "Les premières versions des pages que vous utilisez aujourd’hui : se connecter avec Discord, voir qui est en live, parcourir les membres, et lire une présentation de TENF plus soignée.",
    pourToutLeMonde: [
      "Connexion avec Discord : un compte, un même endroit pour retrouver l’espace membre.",
      "Page d’accueil et « À propos » plus claires : comprendre TENF en quelques minutes.",
      "Lives et membres branchés sur les vraies chaînes et les bonnes photos de profil.",
      "Ambiance visuelle sombre travaillée ; le logo TENF apparaît aussi dans l’onglet du navigateur.",
    ],
    pourLeStaff: [
      "Espace réservé à l’équipe mieux protégé : qui entre, quelles actions sont enregistrées, garde-fous sur les opérations sensibles.",
      "Import des membres depuis le salon Discord des chaînes Twitch : moins de ressaisie à la main au démarrage.",
      "Les corrections sur une fiche membre restent enregistrées : fini la peur de tout perdre en rafraîchissant la page.",
      "Aide pour fusionner deux fiches d’une même personne si Discord et Twitch ne correspondaient pas pareil.",
      "Suivi des raids Twitch relié aux outils officiels : moins de surprises quand il faut compter les envois.",
      "Indicateurs d’activité Discord visibles côté pilotage pour illustrer l’engagement du mois.",
    ],
  },
  {
    id: "2025-12-b",
    label: "16–31 décembre 2025",
    hint: "Soirées phares & suivi des chaînes",
    intro:
      "On consolide ce qui fait la vie de la communauté au quotidien : soirées « mise en avant », suivi de qui suit qui, et traitement des raids plus réaliste quand le chat est brouillon.",
    pourToutLeMonde: [
      "Moins de plantages sur les pages les plus visitées pendant que l’équipe finalise les outils d’animation.",
      "Affichages plus stables quand beaucoup de monde consulte le site en même temps.",
    ],
    pourLeStaff: [
      "Soirées Spotlight : feuille de route complète (temps, présences, bilan), possibilité d’annuler proprement une soirée qui ne doit pas compter.",
      "Lancement manuel d’une soirée spéciale quand le déroulé sort du calendrier habituel.",
      "Suivi des follows : même idée qu’une fiche par membre, avec une navigation qui tient la route pour les validations.",
      "Raids : saisie manuelle quand l’outil automatique ne suffit pas, graphiques plus lisibles, possibilité d’écarter un cas douteux sans bloquer tout le reste.",
      "Guides internes nettoyés pour éviter qu’un mot de passe ou une clé sensible ne traîne dans une doc oubliée.",
    ],
  },
  {
    id: "2026-01",
    label: "Janvier 2026",
    hint: "Intégration, événements, jour & nuit",
    intro:
      "Un mois où le site se rapproche de votre vraie vie de membre : réserver une intégration, s’inscrire à un événement, choisir un thème clair ou sombre, et voir les lives dans un ordre qui laisse une chance à tout le monde.",
    pourToutLeMonde: [
      "Thème clair ou sombre : choisissez ce qui fatigue le moins vos yeux.",
      "Fonctionnement TENF découpé en rubriques lisibles : intégration, règlement, points, boutique des points, Spotlight, conseils.",
      "Page Intégration avec calendrier : dates visibles, inscription, parfois un formulaire même si vous n’êtes pas encore partout connecté.",
      "Page Événements : voir ce qui arrive, s’inscrire, repérer chaque format grâce aux couleurs et aux images.",
      "Page Lives : d’abord les VIP du moment, puis l’équipe, puis tout le monde — et l’ordre change à chaque visite pour varier la mise en avant.",
      "Fiche membre sur le site plus aérée : chaîne, texte, infos TENF sur des blocs distincts.",
    ],
    pourLeStaff: [
      "Bureau Intégration : poser les dates, lire les inscriptions, valider les présences, préparer les retours après réunion.",
      "Bilans du mois : raids, Spotlights, activité Discord, suivi des follows, puis une synthèse avec bonus et signaux d’alerte.",
      "Gestion des accès réservée aux fondateurs : ouvrir ou retirer l’accès au tableau de bord aux bonnes personnes.",
      "Badges et statut VIP du mois avec historique pour ne pas se tromper sur qui est mis en avant.",
      "Formation Twitch pour l’équipe : diapositives plein écran directement sur le site.",
      "Boutique gérée depuis l’admin : catégories, produits, promos.",
      "Données regroupées sur une base plus fiable : moins de risque de perdre une info entre deux outils.",
    ],
  },
  {
    id: "2026-02",
    label: "Février 2026",
    hint: "Avis, UPA, profils",
    intro:
      "Le site ouvre davantage la porte aux curieux·ses : avis réels, soutien, et page partenaire UPA — tout en resserrant les fiches membres.",
    pourToutLeMonde: [
      "Page Avis TENF : lire ce que vivent les membres avant de vous engager.",
      "Page Soutien Nexou : un parcours dédié pour soutenir un pilier du collectif.",
      "Page UPA × TENF : même histoire caritative, mais présentation officielle et boutons qui mènent aux bons formulaires.",
      "Sur les lives, le pseudo Twitch affiché est celui qu’on utilise vraiment — moins de clics dans le vide.",
      "Profils plus lisibles, réseaux sociaux visibles, et validation par l’équipe avant publication publique.",
    ],
    pourLeStaff: [
      "Rôle « Communauté » mieux pris en charge dans les formulaires et la synchro des membres.",
      "Nettoyage des doublons Discord quand deux comptes pointent vers la même personne.",
      "Tableaux d’évaluation et de raids plus complets, courbes par jour, détection des doublons de raids.",
      "Récap des événements : tout voir d’un coup ou filtrer par mois.",
    ],
  },
  {
    id: "2026-03",
    label: "Mars 2026",
    hint: "Guides, mobile, tableau de bord",
    intro:
      "Le site devient plus pédagogique pour les nouveaux, plus confortable sur téléphone, et votre tableau de bord membre vous dit plus clairement quoi faire ensuite.",
    pourToutLeMonde: [
      "Parcours « Rejoindre TENF » découpé en petites pages : présentation, FAQ, création de compte, lien Twitch… sans se sentir perdu·e.",
      "Carte de l’espace membre : savoir où cliquer une fois connecté·e.",
      "Connexion Discord guidée étape par étape pour créer ou retrouver son espace TENF.",
      "Sur mobile : textes plus lisibles, mises en page en deux colonnes quand ça aide, bouton Compte plus visible sur les pages publiques.",
      "Calendrier des lives et fenêtres d’événements plus soignés visuellement.",
      "Tableau de bord membre : en haut l’essentiel du mois, en dessous la progression et des pistes pour s’impliquer.",
      "Parcours « découvrir des chaînes » plus agréable pour celles et ceux qui participent aux défis de follow.",
    ],
    pourLeStaff: [
      "Admin repensé : fiches membres, points Discord, vues raids unifiées, Spotlight avec une présentation plus premium.",
      "Synchronisation Discord découpée en petits lots : moins de timeouts quand la liste est longue.",
      "Onboarding : présences dans la fenêtre de réunion, rôles Affilié / Développement par personne, accueil des nouveaux plus guidé.",
      "Points liés aux événements : suivi par mois, aperçu côté membre, présences reliées.",
      "UPA Event relié proprement aux présences et aux données Spotlight.",
      "Calendrier : bon responsable affiché ; Spotlights mieux mis en avant sur la page Lives.",
    ],
  },
  {
    id: "2026-04",
    label: "Avril 2026",
    hint: "Lives solidaires & clarté générale",
    intro:
      "Avril met en lumière les grandes soirées solidaires, clarifie « comment TENF marche » sur le site, et peaufine l’accueil des nouveaux.",
    pourToutLeMonde: [
      "Pages « fonctionnement » et parcours publics réécrites pour rassurer et guider sans jargon.",
      "Lives caritatifs : barre de progression de la cagnotte, messages d’accueil chaleureux, liens explicites vers la campagne ; montants affichés correctement.",
      "Connexion depuis le téléphone après Discord : moins de cas où vous restez bloqué·e hors du site.",
      "Avis publics : vous pouvez écrire un peu plus long, avec une mise en forme proche de Discord.",
      "Réunions d’intégration : visuel de bannière plus net, dates alignées sur les vraies sessions, et vous voyez qui du staff vient avec vous.",
    ],
    pourLeStaff: [
      "Réunions mensuelles : notes de travail structurées, suivi des événements par type, envoi des comptes rendus par mail aux bonnes personnes.",
      "Espace « mon compte » côté animation : vue d’ensemble type cockpit, discours de réunion en plein écran pour la lecture.",
      "Gestion des accès : e-mails visibles sur la liste, charte, envoi ciblé des comptes rendus.",
      "Raids et évaluations : une seule source de vérité entre l’historique et le bilan du mois ; calendrier des raids à l’heure de Paris.",
      "Lien entre les streamers UPA et les fiches membres TENF.",
      "Exports des bilans caritatifs pour archiver ou partager avec les partenaires.",
    ],
  },
  {
    id: "2026-05",
    label: "Mai 2026",
    hint: "Notifications, boutique, guides",
    intro:
      "Mai rend le quotidien plus doux : messages plus visibles, boutique plus agréable à parcourir, guides plus naturels, et quelques réglages pour retrouver ses repères vite.",
    pourToutLeMonde: [
      "Notifications : image en grand si besoin, petit bandeau, pastilles dans le menu — l’important sans le bruit.",
      "Rappels automatiques la veille et le jour J pour certains événements auxquels vous êtes inscrit·e.",
      "Annonces importantes du serveur : texte mis en forme et grande bannière, lisible comme sur Discord.",
      "Boutique : parcourir les collections plus facilement ; possibilité de faire un don au pot communautaire (Lydia) en plus des achats.",
      "Guides publics interactifs : moins de pages à deviner pour découvrir TENF.",
      "Raids : vue d’ensemble et historique plus confortables dans l’espace membre ; parcours d’intégration du staff plus pratique sur téléphone.",
    ],
    pourLeStaff: [
      "Guides et formations : un même endroit pour préparer le contenu ; changement de rôle depuis la gestion des accès sans casser les noms d’affichage.",
      "Boutique, organigramme, pages UPA : mises en page harmonisées.",
      "Sessions d’intégration : listes plus rapides à charger, aperçu des bannières sans image étirée.",
      "Outils avancés : renouvellement des accès, suivi des performances, petits écrans d’aide pour diagnostiquer un souci.",
    ],
  },
  {
    id: "horizon-2026-ete",
    label: "Été 2026",
    hint: "Envies, pas un calendrier figé",
    kind: "horizon",
    intro:
      "Voici ce qu’on aimerait améliorer ensemble avec vos retours (Discord, réunions, sondages). Rien ici n’est une date butoir : ça sert surtout à dire où on veut investir l’énergie collective.",
    pourToutLeMonde: [
      "Des guides encore plus courts et plus visuels pour rejoindre TENF sans lire tout l’historique du serveur.",
      "Une expérience téléphone encore plus fluide pour les inscriptions, les notifications et le parcours membre.",
      "Les gros projets collectifs (Aventura, solidarité) reliés aux pages que vous connaissez déjà, pour ne pas perdre le fil entre deux liens.",
    ],
    pourLeStaff: [
      "Moins de tâches manuelles répétitives (listes, exports, rappels) pour garder du temps pour l’humain.",
      "Des chiffres affichés aux membres (points, présences, raids) toujours plus fiables, pour éviter les explications de dernière minute.",
      "Après chaque grosse animation, une trace simple de ce qui a bien fonctionné — pour s’améliorer au fil des mois.",
    ],
  },
];

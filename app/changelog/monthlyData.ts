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
      "Espace réservé à l’équipe mieux protégé, avec quelques garde-fous discrets sur les opérations sensibles.",
      "Préparation plus rapide des fiches membres au démarrage : moins de ressaisie à la main.",
      "Les corrections sur une fiche membre restent enregistrées : fini la peur de tout perdre en rafraîchissant la page.",
      "Coup de pouce pour réunir deux fiches d’une même personne quand Discord et Twitch ne correspondaient pas pareil.",
      "Suivi des raids Twitch un peu plus fiable : moins de surprises quand il faut faire les comptes.",
      "Quelques repères côté pilotage pour illustrer l’engagement du mois.",
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
      "Soirées Spotlight : suivi plus posé du déroulé, avec la possibilité d’écarter proprement une soirée qui ne doit pas compter.",
      "Petit dépannage pour lancer une soirée spéciale quand le déroulé sort du calendrier habituel.",
      "Suivi des follows plus confortable côté équipe pour les validations.",
      "Raids : graphiques plus lisibles, ajustements possibles quand l’outil automatique ne reflète pas la réalité, sans bloquer le reste.",
      "Petit nettoyage des documents internes pour éviter qu’une info sensible ne traîne dans une doc oubliée.",
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
      "Côté intégration : préparation des dates, suivi des inscriptions et des retours dans un même endroit.",
      "Bilans du mois rassemblés au calme : raids, Spotlights, activité globale, follows — pour parler de la même chose en réunion.",
      "Gestion des accès au tableau de bord réservée aux profils habilités.",
      "Suivi des mises en avant du mois pour ne pas perdre le fil sur qui est valorisé.",
      "Formations internes : supports plein écran directement sur le site.",
      "Boutique pilotée depuis l’espace équipe : catégories, produits, promos.",
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
      "Rôle « Communauté » mieux pris en charge dans les formulaires et la synchronisation des membres.",
      "Nettoyage des doublons Discord quand deux comptes pointent vers la même personne.",
      "Vues internes plus complètes côté raids et bilans : courbes plus claires, repérage des cas qui se ressemblent.",
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
      "Espace équipe repensé : fiches membres, points Discord, vues raids et Spotlight harmonisés.",
      "Synchronisation Discord plus douce quand la liste est longue : moins d’interruptions.",
      "Onboarding : suivi des présences dans la fenêtre de réunion et accompagnement des nouveaux plus guidé.",
      "Points liés aux événements : suivi par mois, aperçu côté membre, présences reliées.",
      "UPA Event relié proprement aux présences et aux données associées.",
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
      "Réunions mensuelles : notes de travail mieux structurées et comptes rendus partagés plus simplement.",
      "Espace côté animation : vue d’ensemble plus claire, supports de réunion lisibles en plein écran.",
      "Gestion des accès facilitée pour transmettre les bonnes infos aux bonnes personnes.",
      "Raids et évaluations : une seule source de vérité entre l’historique et le bilan du mois ; calendrier à l’heure de Paris.",
      "Lien entre les streamers UPA et les fiches membres TENF.",
      "Exports des bilans caritatifs pour archiver ou partager avec les partenaires.",
    ],
  },
  {
    id: "2026-05",
    label: "Mai 2026",
    hint: "Partenariats, à propos, charte, agenda",
    intro:
      "Un gros mois côté pages publiques : la nouvelle page Partenariats avec son formulaire dédié, la Charte officielle, une page « À propos » repensée avec la vraie histoire de TENF, un agenda d'événements unifié, et beaucoup d'amélioration de confort sur mobile et au zoom.",
    pourToutLeMonde: [
      "Notifications : image en grand si besoin, petit bandeau, pastilles dans le menu — l'important sans le bruit.",
      "Rappels automatiques la veille et le jour J pour certains événements auxquels vous êtes inscrit·e.",
      "Annonces importantes du serveur : texte mis en forme et grande bannière, lisible comme sur Discord.",
      "Boutique : parcourir les collections plus facilement ; possibilité de faire un don au pot communautaire (Lydia) en plus des achats.",
      "Guides publics interactifs : moins de pages à deviner pour découvrir TENF.",
      "Raids : vue d'ensemble et historique plus confortables dans l'espace membre ; parcours d'intégration du staff plus pratique sur téléphone.",
      "Nouvelle page Partenariats : un formulaire dédié en 3 étapes (règles claires, infos projet, confirmation) pour proposer un projet à TENF — vous savez exactement ce qui est attendu avant d'envoyer.",
      "Nouvelle page Charte : nos règles communautaires en accès public, à lire avant même de rejoindre Discord.",
      "Page « À propos » refondue : la vraie chronologie expliquée (idée née sur Facebook → TEF avant août 2024 → naissance de TENF en septembre 2024), des sections plus chaleureuses, et un format qui s'adapte au zoom navigateur.",
      "Nouvel agenda officiel sur /evenements : un seul endroit pour les inscriptions et le calendrier, avec redirection douce depuis les anciennes URLs (les liens partagés ailleurs continuent de fonctionner).",
      "Page d'accueil rafraîchie : comparaison TENF / autres serveurs, FAQ rapide, mise en page plus moderne et plus accueillante.",
      "Page « Comment ça marche » repensée avec trois étapes interactives (Rejoindre · Participer · Progresser), des explications plus courtes et un ton plus humain.",
      "Formulaire Contact : un lien du type `/contact?topic=partenariat` (ou autre) sélectionne automatiquement le bon motif — moins de clics pour démarrer.",
    ],
    pourLeStaff: [
      "Guides et formations : un même endroit pour préparer le contenu ; changements de rôle plus sûrs sans casser les noms d'affichage.",
      "Boutique, organigramme, pages UPA : mises en page harmonisées.",
      "Sessions d'intégration : listes plus rapides à charger, aperçu des bannières sans image étirée.",
      "Outils avancés : renouvellement des accès, suivi des performances, petits écrans d'aide pour diagnostiquer un souci.",
      "Réception des demandes envoyées depuis le site centralisée dans l'espace équipe : on retrouve chaque demande au calme, sans dépendre des canaux Discord.",
      "Un parcours de traitement plus posé pour étudier une demande à plusieurs avant de répondre, sans rien laisser filer.",
      "Cadre commun pour partager un avis interne sur une demande : on s'aligne plus vite en réunion, sans rejouer la discussion à chaque fois.",
      "Rappel à fixer dès qu'un projet démarre, pour penser à faire un bilan plus tard.",
      "Petit raccourci pour préparer la synthèse d'une demande avant d'en parler en équipe — un copier-coller suffit.",
      "Tout ce qui relève des échanges internes reste réservé à l'équipe : rien de tout cela n'est visible côté visiteur ou côté membre.",
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

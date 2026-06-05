/**
 * Coordonnées et textes légaux officiels TENF (à valider par les fondateurs avant publication).
 */

export const TENF_OFFICIAL_NAME = "Twitch Entraide New Family / TENF";

export const TENF_FOUNDERS = "Clara, NeXou31 et Red_Shadow_31";

export const TENF_OFFICIAL_EMAIL = "Twitchentraidenewfamily@gmail.com";

export const TENF_RGPD_EMAIL = TENF_OFFICIAL_EMAIL;

export const TENF_HOST = "Netlify";

export const TENF_HOST_ADDRESS_LINES = [
  "Netlify, Inc.",
  "101 2nd Street",
  "San Francisco, CA 94105",
  "États-Unis",
] as const;

export const TENF_LEGAL_VALIDATION_NOTICE =
  "Ces mentions légales doivent être relues et validées par Clara, NeXou31 et Red_Shadow_31 avant publication officielle.";

export const TENF_PRIVACY_VALIDATION_NOTICE =
  "Cette politique de confidentialité doit être relue et validée par Clara, NeXou31 et Red_Shadow_31 avant publication officielle.";

/** Adresse postale de l'éditeur — volontairement non publiée (sécurité personnelle). */
export const TENF_EDITOR_ADDRESS_NOTICE =
  "Non publiée pour des raisons de sécurité personnelle.";

export const TENF_EDITOR_ADDRESS_LEGAL_NOTE =
  "Cette information devra être complétée ou adaptée après validation juridique, notamment si TENF évolue vers une association, une structure déclarée ou une domiciliation officielle.";

/**
 * Rappel pour les agents / contributeurs : ne jamais afficher d'adresse personnelle des fondateurs.
 * Ne pas inventer d'adresse. Contact et RGPD : TENF_OFFICIAL_EMAIL.
 */
export const TENF_LEGAL_ADDRESS_POLICY =
  "Adresse de l'éditeur : information non publiée pour des raisons de sécurité personnelle, à compléter après validation juridique.";

export const TENF_SITE_PURPOSE =
  "Le site TENF a pour objet de présenter la communauté Twitch Entraide New Family, son fonctionnement, ses membres, ses événements, ses systèmes d'entraide, ses outils de progression, ses partenariats et ses actualités communautaires.";

export const TENF_INTELLECTUAL_PROPERTY_INTRO =
  "L'ensemble des textes, visuels, logos, éléments graphiques, contenus communautaires, noms, systèmes, structures de pages, éléments d'interface, présentations, formulations, documents, guides, concepts propres à TENF et éléments liés à l'identité de Twitch Entraide New Family sont protégés.";

export const TENF_INTELLECTUAL_PROPERTY_PROHIBITION =
  "Toute reproduction, copie, adaptation, modification, diffusion, extraction, réutilisation ou exploitation totale ou partielle de ces éléments, sans autorisation écrite préalable de l'équipe TENF, est interdite.";

export const TENF_INTELLECTUAL_PROPERTY_ITEMS = [
  "les textes du site",
  "les visuels et éléments graphiques",
  "la structure des pages",
  "les noms et systèmes propres à TENF",
  "les contenus communautaires",
  "les présentations de rôles, événements, récompenses et mises en avant",
  "les éléments liés à l'identité TENF, à la New Family, au Spotlight TENF, à la TENF Academy et aux systèmes communautaires du projet",
] as const;

export const TENF_INTELLECTUAL_PROPERTY_THIRD_PARTIES =
  "Les marques, logos et contenus appartenant à des tiers, notamment Twitch, Discord, partenaires ou créateurs, restent la propriété de leurs titulaires respectifs.";

export const TENF_IP_PAGE_INTRO =
  "Twitch Entraide New Family / TENF protège son identité, ses contenus, ses textes, ses visuels, ses systèmes communautaires, sa structure de pages, ses guides, ses présentations, ses noms internes, ses éléments graphiques et son organisation originale.";

export const TENF_IP_PAGE_SCOPE =
  "La présente page précise le périmètre de protection du projet TENF sur le site tenf-community.com, dans ses interfaces membres, ses documents publics, ses présentations communautaires et l'ensemble des contenus produits ou orchestrés par l'équipe TENF dans le cadre de la communauté.";

export const TENF_IP_PAGE_PROTECTED_NAMES = [
  { name: "Twitch Entraide New Family", detail: "Dénomination complète de la communauté et de son identité publique." },
  { name: "TENF", detail: "Sigle, abréviation et usage graphique associés au projet." },
  { name: "New Family", detail: "Nom de la famille communautaire, de ses rendez-vous et de son imaginaire collectif." },
  { name: "Spotlight TENF", detail: "Système de mise en avant, d'évaluation et de progression des créateurs." },
  { name: "TENF Academy", detail: "Programme d'accompagnement, parcours et contenus pédagogiques TENF." },
  { name: "Press Start to Stream", detail: "Identité, format ou présentation liés aux rendez-vous et contenus TENF." },
  { name: "New Family Aventura", detail: "Événement annuel et contenus associés à la communauté." },
  { name: "Contributeur TENF du Mois", detail: "Système de reconnaissance et de mise en avant communautaire." },
] as const;

export const TENF_IP_PAGE_SYSTEMS = [
  "l'organisation des rôles, paliers staff et présentations associées sur le site",
  "les systèmes de raids, suivi d'engagement et outils d'entraide entre créateurs",
  "les mécaniques de points, récompenses, VIP, évaluations et progressions communautaires",
  "les agendas, calendriers, inscriptions et mises en forme des événements TENF",
  "les guides publics, guides membre, FAQ, chartes et documents d'intégration",
  "les parcours d'onboarding, formulaires, questionnaires et contenus staff",
  "les présentations de partenariats, campagnes caritatives et pages dédiées (UPA, etc.)",
] as const;

export const TENF_IP_PAGE_PROTECTED_ELEMENTS = [
  "les textes rédigés pour le site (pages, modales, aides, notifications, libellés)",
  "les visuels, logos, icônes, bannières, vignettes et éléments graphiques TENF",
  "la structure des pages, la hiérarchie de l'information et l'architecture de navigation",
  "les composants d'interface, thèmes visuels, cartes, badges et habillages propres au site",
  "les guides communautaires, tutoriels, présentations et contenus pédagogiques TENF",
  "les systèmes de récompenses, titres, badges de rôle et mises en avant",
  "les contenus liés aux profils membres, témoignages, interviews et sélections publiques",
  "les contenus événementiels, annonces, descriptions et supports de communication TENF",
  "les documents internes rendus publics, chartes, règlements et textes d'organisation",
  "la structure originale du site, de ses sections et de l'expérience proposée aux visiteurs",
] as const;

export const TENF_IP_ALLOWED_USES = [
  "consulter le site et ses pages publiques à titre personnel ou informatif",
  "partager un lien vers une page officielle TENF (sans en modifier le contenu)",
  "citer brièvement TENF en mentionnant clairement la source et sans détourner l'identité du projet",
  "utiliser les contenus dont vous êtes l'auteur ou le titulaire des droits (ex. votre propre profil, vos propres streams)",
] as const;

export const TENF_IP_FORBIDDEN_USES = [
  "copier, scraper ou réextraire massivement les textes, visuels ou structures du site",
  "reproduire les logos, chartes graphiques ou habillages TENF sur un autre site, serveur ou projet",
  "réutiliser les noms, systèmes ou présentations TENF pour un projet concurrent ou non affilié",
  "modifier, détourner ou faire passer pour TENF un contenu issu du site ou de la communauté",
  "exploiter commercialement les contenus TENF sans autorisation écrite préalable",
  "créer une fausse version du site, un clone, un miroir ou une reprise non autorisée de l'organisation TENF",
] as const;

export const TENF_IP_MEMBER_CONTENT_NOTE =
  "Les créateurs membres conservent leurs droits sur leurs propres contenus (streams, clips, visuels personnels, textes de bio qu'ils rédigent). En revanche, leur présentation sur le site TENF — mise en page, formulation staff, badges, classements, sélections éditoriales et intégration dans les systèmes communautaires — relève de l'identité et de l'organisation du projet TENF.";

export const TENF_IP_AUTHORIZATION_PROCESS =
  "Toute demande de réutilisation (partenariat média, citation étendue, reproduction visuelle, adaptation, événement externe, communication institutionnelle, etc.) doit être adressée par écrit à l'équipe TENF avant toute exploitation. Une autorisation peut être accordée, refusée ou encadrée selon le contexte, le support et l'usage envisagé.";

export const TENF_IP_PAGE_GENERAL_IDEAS_NOTE =
  "Les idées générales d'entraide entre streamers, de communauté Twitch ou de progression collective ne sont pas revendiquées comme exclusives. En revanche, les formulations, visuels, noms, systèmes, documents, structures, parcours, interfaces et contenus propres à TENF — ainsi que leur combinaison originale — ne peuvent pas être repris, imités ou réexploités sans autorisation.";

export const TENF_IP_VALIDATION_NOTICE =
  "Ce document de propriété intellectuelle doit être relu et validé par Clara, NeXou31 et Red_Shadow_31 avant publication officielle.";

export const TENF_LEGAL_CAUTION_NOTICE =
  "Ces informations sont fournies à titre informatif et pourront être complétées selon l'évolution juridique, administrative ou associative de TENF.";

export const TENF_PRIVACY_CAUTION_NOTICE =
  "Document informatif — ne remplace pas un avis juridique professionnel.";

export const TENF_PRIVACY_SCOPE =
  "La présente politique s'applique au site tenf-community.com, à l'espace membre connecté, aux formulaires publics, aux inscriptions événementielles et, plus largement, aux traitements réalisés par l'équipe TENF dans le cadre de la gestion de la communauté lorsque ces traitements sont liés au site ou à une demande que vous nous adressez.";

export const TENF_PRIVACY_NO_SALE =
  "TENF ne vend pas vos données personnelles. Nous ne les échangeons pas à des fins publicitaires tierces.";

export const TENF_PRIVACY_DATA_CATEGORIES = [
  {
    title: "Identité & comptes",
    items: [
      "pseudo ou nom affiché Discord",
      "identifiant Discord (connexion OAuth)",
      "pseudo Twitch et identifiant Twitch si lié",
      "adresse e-mail si vous la communiquez volontairement",
    ],
  },
  {
    title: "Profil membre",
    items: [
      "description, bio, liens sociaux renseignés",
      "avatar, statut membre, rôle et badges affichés",
      "planning, préférences de profil et informations d'intégration",
      "historique de rôle ou données de parcours communautaire si actifs",
    ],
  },
  {
    title: "Activité & communauté",
    items: [
      "inscriptions à des événements ou activités TENF",
      "déclarations de raids, présences ou engagements si vous les utilisez",
      "points, récompenses, évaluations ou progressions communautaires si activés",
      "messages ou contenus envoyés via formulaires (contact, avis, candidatures, etc.)",
    ],
  },
  {
    title: "Technique & sécurité",
    items: [
      "logs de connexion, sessions et authentification",
      "données de navigation agrégées (pages consultées, durée de session)",
      "adresse IP traitée de façon limitée pour la sécurité et la limitation d'abus",
      "cookies ou stockage local (session, thème, préférences techniques)",
    ],
  },
] as const;

export const TENF_PRIVACY_DATA_SOURCES = [
  "informations que vous saisissez volontairement dans un formulaire ou votre espace membre",
  "données fournies lors d'une connexion Discord via OAuth (selon les autorisations accordées)",
  "données publiques ou techniques liées à Twitch lorsque vous reliez ou utilisez votre chaîne",
  "données générées par votre usage du site (logs, inscriptions, interactions)",
  "informations communiquées au staff dans le cadre d'une demande, d'une modération ou d'un suivi communautaire",
] as const;

export const TENF_PRIVACY_PURPOSES_DETAILED = [
  {
    title: "Vie de la communauté",
    detail: "Organiser l'entraide, les rôles, les parcours membres, les mises en avant et le fonctionnement collectif de TENF.",
  },
  {
    title: "Gestion des demandes",
    detail: "Répondre aux messages de contact, candidatures, demandes staff, réclamations ou sollicitations RGPD.",
  },
  {
    title: "Profils & annuaire",
    detail: "Afficher les profils validés, les lives, les événements et les contenus publics liés aux membres.",
  },
  {
    title: "Événements",
    detail: "Gérer les inscriptions, présences, rappels et organisation des activités communautaires.",
  },
  {
    title: "Sécurité & modération",
    detail: "Prévenir les abus, sécuriser les accès, limiter les usages frauduleux et assurer la modération nécessaire.",
  },
  {
    title: "Amélioration du site",
    detail: "Comprendre l'usage des pages, corriger les dysfonctionnements et faire évoluer l'expérience membre.",
  },
] as const;

export const TENF_PRIVACY_LEGAL_BASES = [
  {
    title: "Consentement",
    detail:
      "Lorsque vous cochez une case dédiée, vous inscrivez volontairement un formulaire, ou vous nous transmettez une demande en connaissance de cause.",
  },
  {
    title: "Intérêt légitime",
    detail:
      "Pour sécuriser le site, prévenir les abus, assurer la modération, maintenir le bon fonctionnement technique et protéger la communauté.",
  },
  {
    title: "Exécution de votre demande",
    detail:
      "Pour traiter un contact, une inscription à un événement, une candidature, une demande membre ou toute sollicitation que vous formulez.",
  },
] as const;

export const TENF_PRIVACY_PROCESSORS = [
  {
    name: "Netlify",
    role: "Hébergement et diffusion du site.",
    note: "Données techniques et contenus du site peuvent transiter ou être stockés via l'infrastructure d'hébergement.",
  },
  {
    name: "Prestataire base de données / backend",
    role: "Stockage sécurisé des profils, inscriptions et données applicatives.",
    note: "Accès limité aux besoins techniques du site et de l'espace membre.",
  },
  {
    name: "Discord & Twitch",
    role: "Authentification, identité publique et données liées aux comptes que vous choisissez de connecter.",
    note: "Ces services appliquent leurs propres politiques de confidentialité.",
  },
] as const;

export const TENF_PRIVACY_RETENTION_RULES = [
  "Données de contact et demandes : conservées le temps du traitement, puis archivées ou supprimées selon le besoin légitime de suivi.",
  "Profil membre actif : conservé tant que le compte reste dans la communauté ou selon les règles de sortie applicables.",
  "Inscriptions événementielles : conservées pour l'organisation de l'événement et la traçabilité communautaire raisonnable.",
  "Logs techniques et sécurité : conservés pour une durée limitée, proportionnée aux besoins de sécurité et de diagnostic.",
  "Données dont la suppression est demandée : traitées dans un délai raisonnable, sous réserve d'obligations légales ou de sécurité.",
] as const;

export const TENF_PRIVACY_PUBLIC_PROFILE_NOTE =
  "Certaines informations de profil peuvent être visibles publiquement sur le site TENF (par exemple pseudo, avatar, bio, rôle, liens, présence en live ou participation à des contenus communautaires affichés). Ne publiez que des informations que vous acceptez de voir diffusées dans ce cadre.";

export const TENF_PRIVACY_USER_RIGHTS = [
  { right: "Accès", detail: "Obtenir confirmation qu'une donnée vous concernant est traitée et en recevoir une copie lorsque applicable." },
  { right: "Rectification", detail: "Faire corriger des données inexactes ou compléter des informations incomplètes." },
  { right: "Suppression", detail: "Demander l'effacement de données lorsque les conditions légales le permettent." },
  { right: "Opposition", detail: "Vous opposer à un traitement fondé sur l'intérêt légitime dans les cas prévus par la loi." },
  { right: "Limitation", detail: "Demander la suspension temporaire d'un traitement dans certaines situations." },
  { right: "Retrait du consentement", detail: "Retirer votre consentement lorsque le traitement en dépend, sans remettre en cause les traitements déjà réalisés légalement." },
] as const;

export const TENF_PRIVACY_SECURITY_MEASURES = [
  "accès restreints au staff et aux administrateurs autorisés",
  "authentification via Discord pour l'espace membre",
  "hébergement chez des prestataires reconnus et séparation des environnements sensibles",
  "journalisation technique limitée pour la sécurité et la détection d'abus",
  "principe de minimisation : ne collecter que ce qui est utile au service rendu",
] as const;

export const TENF_PRIVACY_COOKIES_ITEMS = [
  {
    title: "Session & connexion",
    detail: "Maintien de votre session membre et sécurisation de l'accès à l'espace connecté.",
  },
  {
    title: "Thème & préférences",
    detail: "Mémorisation du thème clair/sombre ou de préférences d'affichage locales.",
  },
  {
    title: "Sécurité",
    detail: "Protection contre les usages abusifs, la fraude ou les requêtes anormales.",
  },
  {
    title: "Mesure d'usage interne",
    detail: "Compréhension agrégée de la navigation sur le site pour améliorer les pages et détecter les anomalies.",
  },
] as const;

export const TENF_PRIVACY_THIRD_SERVICES_NOTE =
  "Lorsque vous cliquez vers Twitch, Discord, un réseau social, un partenaire ou un outil externe, vous sortez du périmètre direct du site TENF. Ces services traitent vos données selon leurs propres règles. Nous vous invitons à consulter leurs politiques de confidentialité respectives.";

export const TENF_PRIVACY_MINORS_NOTE =
  "TENF s'adresse principalement à une communauté de créateurs et de personnes majeures ou accompagnées dans le cadre d'une participation Twitch responsable. Si vous pensez qu'un mineur nous a transmis des données sans autorisation parentale appropriée, contactez-nous pour que nous examinions la situation.";

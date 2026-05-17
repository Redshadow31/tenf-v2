import {
  CalendarHeart,
  Coins,
  GraduationCap,
  HeartHandshake,
  PartyPopper,
  Sparkles,
  Star,
  Target,
  Users,
} from "lucide-react";
import { DISCORD_INVITE_URL } from "@/lib/socialLinks";
import { SPOTLIGHT_TAB_PANELS } from "@/lib/guides/tenf/spotlightGuidePanels";
import type { Chapter } from "@/lib/guides/tenf/guideTenfSiteData";

export const CHAPTER_GOALS: Record<string, string> = {
  bienvenue:
    "Tu viens d’arriver (ou tu hésites encore) et tu veux comprendre **ce qu’est TENF**, sans jargon — avant de t’engager sur Discord ou sur le site.",
  "fonctionnement-global":
    "Tu as compris le « pourquoi » et tu veux voir **comment l’entraide tourne** au quotidien : ce que tu donnes, ce que tu reçois, et sur quelle durée.",
  spotlight:
    "Un Spotlight est annoncé et tu te demandes **quoi faire** selon que tu regardes ou que tu es mis·e en avant.",
  points:
    "Tu vois des points, des niveaux ou des salons Discord et tu veux **comprendre la logique** sans te sentir obligé·e de « farmer ».",
  mecaniques:
    "Tu veux savoir comment TENF **te suit dans le temps** : évaluations, Academy, engagement mutuel.",
  evenements:
    "Tu veux participer à la vie du collectif **en dehors de ton live solo** et savoir où trouver les dates.",
  formations:
    "Tu cherches une **formation concrète** (technique, chaîne, posture) adaptée à ton niveau.",
  role:
    "Tu veux être sûr·e de **ce qui est attendu** de toi — et ce qui fragilise l’équilibre du groupe.",
  apports:
    "Tu te demandes **ce que TENF peut vraiment t’apporter** si tu joues le jeu de l’entraide.",
  conclusion:
    "Tu as parcouru le guide et tu veux un **récap + les prochaines actions** pour t’installer sereinement.",
};

export const tenfChapters: Chapter[] = [
  {
    id: "bienvenue",
    navLabel: "Bienvenue",
    emoji: "👋",
    titre: "Bienvenue dans TENF",
    soustitre: "Comprendre l’ADN du collectif avant de t’engager.",
    accent: "#a78bfa",
    icon: HeartHandshake,
    blocks: [
      {
        kind: "lead",
        text: "TENF (Twitch Entraide New Family) n’est pas une liste de chaînes à spammer : c’est un **cadre d’entraide** entre streamers. Tu y viens pour progresser **avec** les autres — visibilité, formations, événements, Spotlights — à condition de participer de façon **sincère** et régulière.",
      },
      {
        kind: "diagram",
        title: "En une image : ce que TENF organise pour toi",
        variant: "flow",
        steps: [
          { label: "Découvrir", hint: "Comprendre les valeurs et le fonctionnement" },
          { label: "Participer", hint: "Lives, raids, Discord, événements" },
          { label: "Progresser", hint: "Formations, retours, Academy" },
          { label: "Être soutenu·e", hint: "Visibilité quand c’est ton tour" },
        ],
      },
      {
        kind: "table",
        title: "TENF, ce n’est pas…",
        columns: ["Ce que tu pourrais croire", "La réalité TENF"],
        rows: [
          ["Un serveur pour poster sa chaîne", "Un collectif où l’on **regarde** et **soutient** les autres"],
          ["Des points = compétition", "Des points = **reconnaissance** de l’implication utile"],
          ["Être partout tout le temps", "Une **présence régulière** et honnête suffit"],
          ["Des règles figées à vie", "Un cadre vivant : vérifie Discord + fonctionnement officiel"],
        ],
      },
      {
        kind: "steps",
        title: "Par où commencer ?",
        steps: [
          {
            title: "Lire ce guide ou le parcours",
            body: "Tu es au bon endroit : 10 chapitres + un parcours en 4 étapes (~30 min).",
          },
          {
            title: "Parcourir « Découvrir TENF »",
            body: "Pages **Fonctionnement** = référence détaillée et à jour.",
          },
          {
            title: "Te connecter et ouvrir l’espace membre",
            body: "Dashboard, agenda, score : tout est regroupé sous **/member**.",
          },
        ],
      },
      {
        kind: "callout",
        variant: "tip",
        text: "Tu n’as pas besoin de tout lire d’un coup. Utilise le menu à gauche (ou les cartes « Tu es plutôt… » sur l’accueil) pour aller directement au sujet qui te bloque.",
      },
    ],
    liens: [
      { href: "/a-propos", label: "À propos de TENF" },
      { href: "/fonctionnement-tenf/decouvrir", label: "Fonctionnement — Découvrir" },
    ],
  },
  {
    id: "fonctionnement-global",
    navLabel: "Fonctionnement",
    emoji: "🔁",
    titre: "Le fonctionnement global",
    soustitre: "La boucle d’entraide : donner, recevoir, sur la durée.",
    accent: "#38bdf8",
    icon: Target,
    blocks: [
      {
        kind: "lead",
        text: "Le moteur de TENF tient en une idée : **tu investis dans les autres**, et le collectif **investit en retour** quand tu en as besoin. Ce n’est pas un échange minute par minute, mais une **culture de réciprocité** sur des semaines et des mois.",
      },
      {
        kind: "diagram",
        title: "La boucle d’entraide TENF",
        variant: "flow",
        steps: [
          { label: "Regarder", hint: "Présence réelle sur les lives membres (chat, ambiance)" },
          { label: "Participer", hint: "Raids, événements, entraide Discord" },
          { label: "Progresser", hint: "Formations, feedbacks, Spotlights" },
          { label: "Être soutenu·e", hint: "Visibilité, habitués, confiance" },
        ],
      },
      {
        kind: "table",
        title: "Concrètement, que faire au quotidien ?",
        columns: ["Action", "Pourquoi c’est utile", "Fréquence indicative"],
        rows: [
          ["Passer sur 1–2 lives membres", "Tu crées du lien et tu comprends les autres chaînes", "Quand tu peux (même 15 min)"],
          ["Répondre ou aider sur Discord", "Tu fais vivre le serveur et tu es visible", "Régulièrement, sans spam"],
          ["Déclarer / participer à un raid", "Tu officialises l’entraide et tu nourris les stats", "Après chaque raid pertinent"],
          ["Consulter l’agenda", "Tu ne rates pas events et Spotlights", "1× par semaine"],
        ],
      },
      {
        kind: "callout",
        variant: "important",
        text: "L’autopromo sans présence, ou le lurk passif prolongé, **déséquilibre** le collectif : les autres portent ton manque d’implication. Si tu cherches uniquement de la visibilité sans retour, d’autres communautés seront plus adaptées.",
      },
      {
        kind: "callout",
        variant: "tip",
        text: "**Astuce** : note 2–3 créateurs dont les horaires collent aux tiens. Une routine « je passe sur X et Y cette semaine » vaut mieux qu’un gros rush une fois par mois.",
      },
    ],
    liens: [
      { href: "/fonctionnement-tenf/decouvrir", label: "Découvrir TENF (parcours)" },
      { href: "/fonctionnement-tenf/comment-ca-marche", label: "Comment ça marche" },
    ],
  },
  {
    id: "spotlight",
    navLabel: "Spotlight",
    emoji: "⭐",
    titre: "Les Spotlight (mise en avant)",
    soustitre: "Un moment collectif — deux rôles possibles : viewer ou streamer.",
    accent: "#fbbf24",
    icon: Star,
    blocks: [
      {
        kind: "lead",
        text: "Un **Spotlight**, c’est un créneau où la communauté se mobilise autour **d’un·e streamer** pour créer de la visibilité et de la chaleur humaine. Ce n’est pas un examen : c’est un **passage à plusieurs**. Selon ta situation, tu es **viewer** (tu regardes) ou **streamer** (tu es mis·e en avant).",
      },
      {
        kind: "table",
        title: "Viewer ou streamer : que faire ?",
        columns: ["Tu es…", "Ton objectif", "Ce guide détaille"],
        rows: [
          ["Viewer", "Soutenir sans te mettre la pression", "Onglet « Je suis viewer » ci-dessous"],
          ["Streamer mis·e en avant", "Accueillir, remercier, garder le cap", "Onglet « Je suis streamer »"],
          ["Les deux à la vie", "Comprendre les attentes selon le jour", "Les deux onglets + agenda"],
        ],
      },
      {
        kind: "callout",
        variant: "important",
        text: "Horaires, critères d’éligibilité et consignes précises sont annoncés sur **Discord** et dans l’**agenda membre**. Ce chapitre pose le cadre humain ; les annonces staff font foi pour les détails.",
      },
    ],
    spotlightTabs: SPOTLIGHT_TAB_PANELS,
    liens: [
      { href: "/member/evenements", label: "Agenda TENF (membre)" },
      { href: "/evenements", label: "Calendrier public" },
    ],
  },
  {
    id: "points",
    navLabel: "Points",
    emoji: "💎",
    titre: "Système de points TENF",
    soustitre: "Comprendre la logique — pas « farmer » le classement.",
    accent: "#34d399",
    icon: Coins,
    blocks: [
      {
        kind: "lead",
        text: "Les points TENF **ne mesurent pas ta valeur** en tant que créateur·rice : ils **reconnaissent** une implication utile au collectif (Discord, lives, raids, events…). Pense-y comme un **journal de bord communautaire**, pas comme une course au chiffre.",
      },
      {
        kind: "table",
        title: "Synthèse des principales sources de points",
        caption: "Barème indicatif « culture TENF » — les montants et salons peuvent évoluer ; annonces staff et règles Discord priment.",
        columns: ["Source", "Points (indicatif)", "Où / comment"],
        rows: [
          ["Quête journalière", "500 / jour", "Commande /journalier — salon 🗓・bonus-journalier"],
          ["Niveau Discord (tous les 3 niveaux)", "500", "Activité régulière et utile sur les salons"],
          ["Raid organisé", "500", "Après un raid vers un membre TENF"],
          ["Événement communautaire", "200 à 500", "Participation réelle aux formats TENF"],
          ["Parrainage membre", "300", "Inviter un·e créateur·rice aligné·e TENF"],
          ["Suivi réseau TENF", "500 / réseau", "Preuve dans 📂・preuves-suivi (X, TikTok, Insta…)"],
          ["Pack démarrage", "1000", "Nouveaux streamers (attribution staff)"],
          ["Bonus anniversaire", "2000", "Célébration communautaire"],
          ["Niveau 21+", "×2 sur paliers", "1000 pts / 3 niveaux au lieu de 500"],
        ],
      },
      {
        kind: "diagram",
        title: "Comment lire tes points (sans stress)",
        variant: "flow",
        steps: [
          { label: "Agir naturellement", hint: "Aider, regarder, participer" },
          { label: "Respecter les salons", hint: "Preuves, journalier, règles" },
          { label: "Consulter ton score", hint: "Espace membre / engagement" },
          { label: "Utiliser la boutique", hint: "Avantages selon le cadre TENF" },
        ],
      },
      {
        kind: "callout",
        variant: "tip",
        text: "**Exemple** : discussions utiles + 2 lives suivis + 1 raid déclaré + aide à un nouveau membre = progression **naturelle**, sans « forcer » le jeu.",
      },
      {
        kind: "callout",
        variant: "important",
        text: "Spam, faux suivis ou activité artificielle **ne comptent pas** et peuvent aller à l’encontre du cadre TENF. En cas de doute, demande en modération plutôt que d’improviser.",
      },
    ],
    liens: [
      { href: "/member/engagement/score", label: "Mon score d’engagement" },
      { href: "/fonctionnement-tenf/progression", label: "Progression (fonctionnement)" },
    ],
  },
  {
    id: "mecaniques",
    navLabel: "Mécaniques",
    emoji: "⚙️",
    titre: "Les mécaniques d’entraide",
    soustitre: "Comment TENF t’accompagne sur la durée.",
    accent: "#818cf8",
    icon: Users,
    blocks: [
      {
        kind: "lead",
        text: "Au-delà du quotidien (lives, Discord, points), TENF propose des **mécaniques structurantes** : engagement mutuel, évaluations, Academy. Elles servent à **progresser** et à garder un cadre sain pour tout le monde.",
      },
      {
        kind: "table",
        title: "Les trois piliers",
        columns: ["Mécanique", "À quoi ça sert", "Où aller"],
        rows: [
          ["Engagement mutuel", "Culture « je regarde → on me regarde » sur la durée", "Pratique sur lives + raids"],
          ["Évaluation mensuelle", "Bilan d’implication et d’évolution dans le cadre TENF", "/member/evaluations"],
          ["TENF Academy", "Parcours structuré, feedbacks, analyse de lives", "/member/academy"],
        ],
      },
      {
        kind: "bullets",
        title: "Engagement mutuel — en pratique",
        items: [
          "Tu n’es pas noté·e live par live : c’est la **régularité** et la **qualité** des interactions qui comptent.",
          "Quand tu organises ou reçois de l’entraide, tu renforces la confiance du groupe.",
        ],
      },
      {
        kind: "callout",
        variant: "tip",
        text: "L’Academy est idéale si tu veux des **retours concrets** sur ta chaîne (souvent sur ~2 semaines). Renseigne-toi sur les sessions ouvertes sur le site ou Discord.",
      },
    ],
    liens: [
      { href: "/member/academy", label: "Présentation Academy" },
      { href: "/member/evaluations", label: "Mon évaluation" },
    ],
  },
  {
    id: "evenements",
    navLabel: "Événements",
    emoji: "🎉",
    titre: "Les événements pour créer du lien",
    soustitre: "Sortir du solo stream pour vivre le collectif.",
    accent: "#f472b6",
    icon: PartyPopper,
    blocks: [
      {
        kind: "lead",
        text: "Streamer seul·e, c’est une partie de l’aventure ; **les events TENF** créent des souvenirs communs (films, jeux, soirées spéciales). C’est souvent là que naissent les **vraies affinités** — et que tu comprends qui est actif·ve dans le collectif.",
      },
      {
        kind: "table",
        title: "Formats que tu vas croiser",
        columns: ["Format", "Ambiance", "Ton rôle possible"],
        rows: [
          ["Soirée film", "Détendue, discussions", "Viewer, réactions, présence"],
          ["Event jeux", "Participative, fun", "Joueur·se ou spectateur·rice"],
          ["Soirées spéciales / concours", "Énergie haute", "Participer, relayer, encourager"],
          ["Multi-jeux / formats staff", "Calendrier annoncé", "S’inscrire via agenda / consignes Discord"],
        ],
      },
      {
        kind: "steps",
        title: "Ne rien rater",
        steps: [
          { title: "Ouvre l’agenda membre", body: "Dates, descriptions, liens d’inscription si besoin." },
          { title: "Active les rappels Discord", body: "Annonces officielles = source fiable." },
          { title: "Note 1 event « à tester »", body: "Même un format qui n’est pas ta spécialité — c’est fait pour se découvrir." },
        ],
      },
    ],
    liens: [
      { href: "/evenements", label: "Calendrier événements" },
      { href: "/evenements-communautaires", label: "Événements communautaires" },
    ],
  },
  {
    id: "formations",
    navLabel: "Formations",
    emoji: "🎓",
    titre: "Les formations",
    soustitre: "Progresser sur la technique, la chaîne et toi-même.",
    accent: "#2dd4bf",
    icon: GraduationCap,
    blocks: [
      {
        kind: "lead",
        text: "TENF ne se limite pas à « plus de viewers » : le catalogue de **formations** couvre la **technique** (OBS, audio…), le **développement de chaîne** (branding, organisation…) et le **développement personnel** (stress, communication…). Choisis ce qui te bloque **aujourd’hui**, pas tout à la fois.",
      },
      {
        kind: "table",
        title: "Les trois familles",
        columns: ["Famille", "Exemples de sujets", "Tu y vas si…"],
        rows: [
          ["Technique", "OBS, overlays, qualité A/V", "Ton setup ou ton son te freinent"],
          ["Développement de chaîne", "Branding, fidélisation, planning", "Tu veux structurer ta présence"],
          ["Développement personnel", "Confiance, stress, relation viewers", "Tu te sens bloqué·e « face cam »"],
        ],
      },
      {
        kind: "callout",
        variant: "tip",
        text: "Combine **une formation** + **de la pratique sur les lives membres** : le feedback des pairs complète souvent mieux qu’un tuto seul.",
      },
    ],
    liens: [
      { href: "/member/formations", label: "Catalogue des formations" },
      { href: "/academy", label: "Academy (site)" },
    ],
  },
  {
    id: "role",
    navLabel: "Ton rôle",
    emoji: "🧩",
    titre: "Ton rôle en tant que membre",
    soustitre: "Ce qui fait avancer le groupe — et ce qui le fragilise.",
    accent: "#fb923c",
    icon: Sparkles,
    blocks: [
      {
        kind: "lead",
        text: "Être membre TENF, ce n’est pas un badge décoratif : c’est un **engagement réciproque**. Ce chapitre t’aide à te situer — sans culpabiliser, mais avec clarté.",
      },
      {
        kind: "diagram",
        variant: "compare",
        title: "Attitudes qui renforcent vs fragilisent l’entraide",
        left: {
          title: "On encourage",
          items: [
            "Présence authentique sur les lives (même courte)",
            "Participation aux raids et events quand c’est possible",
            "Respect du cadre et des autres membres",
            "Entraide sur la durée (pas un coup d’essai)",
          ],
        },
        right: {
          title: "On évite",
          items: [
            "« Je viens juste pour ma pub » sans regarder les autres",
            "Lurk passif prolongé sans aucune interaction",
            "Désengagement long sans nouvelles",
            "Spam ou faux engagement pour les points",
          ],
        },
      },
      {
        kind: "callout",
        variant: "important",
        text: "Tu n’es pas obligé·e de tout faire — mais **l’ADN TENF** suppose une participation **régulière et sincère**. Si ton objectif est uniquement de la visibilité sans retour, d’autres espaces seront plus adaptés.",
      },
    ],
    liens: [
      { href: "/fonctionnement-tenf/faq", label: "FAQ fonctionnement" },
      { href: "/rejoindre/faq", label: "FAQ rejoindre" },
    ],
  },
  {
    id: "apports",
    navLabel: "Ce que TENF t’apporte",
    emoji: "🚀",
    titre: "Ce que TENF peut t’apporter",
    soustitre: "Si tu joues le jeu de l’entraide.",
    accent: "#c084fc",
    icon: CalendarHeart,
    blocks: [
      {
        kind: "lead",
        text: "Les bénéfices ne tombent pas du ciel : ils suivent une **implication honnête**. Voici ce que beaucoup de membres gagnent **sur la durée** — sans promesse magique.",
      },
      {
        kind: "table",
        title: "Ce que tu peux raisonnablement attendre",
        columns: ["Bénéfice", "Comment ça se construit"],
        rows: [
          ["Réseau de confiance", "Lives croisés, Discord, events"],
          ["Progression plus rapide", "Formations, Academy, retours"],
          ["Viewers plus réguliers", "Réciprocité quand tu es actif·ve"],
          ["Meilleure qualité de stream", "Technique + posture travaillées"],
        ],
      },
      {
        kind: "callout",
        variant: "tip",
        text: "Donne-toi **quelques semaines** avant de juger : l’entraide TENF se construit comme une habitude, pas comme un coup de boost unique.",
      },
    ],
    liens: [
      { href: "/guides/espace-membre", label: "Carte espace membre" },
      { href: "/rejoindre/guide-espace-membre", label: "Guide espace membre" },
    ],
  },
  {
    id: "conclusion",
    navLabel: "Conclusion",
    emoji: "❤️",
    titre: "Conclusion",
    soustitre: "Une famille de streamers qui avancent ensemble.",
    accent: "#f43f5e",
    icon: HeartHandshake,
    blocks: [
      {
        kind: "lead",
        text: "TENF, ce n’est pas « juste un serveur Discord » : c’est un **cadre** pour apprendre, être vu·e et **rendre la pareille**. Plus tu t’investis honnêtement, plus tu récoltes — pour toi et pour les autres.",
      },
      {
        kind: "steps",
        title: "Tes 3 prochaines actions",
        steps: [
          { title: "Coche la checklist sur l’accueil du guide", body: "6 actions concrètes, sauvegardées dans ton navigateur." },
          { title: "Ouvre ton tableau de bord membre", body: "Repère alertes, agenda et score d’engagement." },
          { title: "Rejoins ou surveille Discord", body: "Annonces Spotlights, events et mises à jour du barème." },
        ],
      },
      {
        kind: "callout",
        variant: "tip",
        text: "Tu peux revenir à ce guide à tout moment depuis le menu **Guides** du site. Pour le détail officiel, les pages **/fonctionnement-tenf** restent la référence.",
      },
    ],
    liens: [
      { href: DISCORD_INVITE_URL, label: "Discord TENF" },
      { href: "/guides/partie-publique", label: "Carte du site public" },
    ],
  },
];

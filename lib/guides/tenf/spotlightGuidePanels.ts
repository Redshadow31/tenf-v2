/**
 * Contenu des onglets Spotlight (viewer / streamer) — guide TENF.
 * Les règles détaillées peuvent évoluer : vérifier les annonces staff et l’agenda.
 */

export type SlPiece =
  | { t: "intro"; title?: string; p: string; list?: string[] }
  | { t: "h2"; emoji: string; title: string }
  | { t: "grid"; cells: { title: string; body: string }[] }
  | { t: "callout"; mode: "purple" | "amber" | "red" | "violet"; title: string; emoji?: string; lines: string[] }
  | { t: "lurker"; title: string; emoji: string; p: string; perks: { k: string; d: string }[] }
  | { t: "micro"; items: { emoji: string; title: string; hint: string }[] }
  | { t: "anti"; title: string; emoji: string; rows: { title: string; desc: string }[] }
  | { t: "timeline"; title: string; emoji: string; steps: { range: string; title: string; emoji: string }[] }
  | { t: "rules"; title: string; emoji: string; items: { title: string; desc?: string; highlight?: boolean }[] };

export type SpotlightTabPanel = {
  id: "viewer" | "streamer";
  label: string;
  tabIcon: "user" | "wand";
  pieces: SlPiece[];
};

export const SPOTLIGHT_TAB_PANELS: SpotlightTabPanel[] = [
  {
    id: "viewer",
    label: "Je suis viewer sur un Spotlight",
    tabIcon: "user",
    pieces: [
      {
        t: "intro",
        title: "C’est quoi pour toi ?",
        p: "Un Spotlight, c’est un moment où la communauté se retrouve autour d’un live pour créer de la visibilité et de la chaleur humaine — sans te demander une « performance ».",
      },
      {
        t: "h2",
        emoji: "💜",
        title: "Pourquoi ta présence compte",
      },
      {
        t: "grid",
        cells: [
          {
            title: "Visibilité réelle",
            body: "Chaque personne dans le chat ou en spectateur renforce le signal : l’algorithme et les habitudes voient un vrai moment collectif.",
          },
          {
            title: "Soutien moral",
            body: "Ta présence rassure le streamer : ce n’est pas un examen, c’est un passage à plusieurs.",
          },
          {
            title: "Énergie dans le chat",
            body: "Les échanges positifs attirent d’autres curieux·ses et gardent une ambiance saine.",
          },
          {
            title: "Culture d’entraide",
            body: "Tu montres l’exemple : aujourd’hui pour quelqu’un, demain la communauté pour toi.",
          },
        ],
      },
      {
        t: "callout",
        mode: "purple",
        emoji: "⭐",
        title: "Prioriser quand tu es disponible",
        lines: [
          "✅ Aucune obligation d’être présent·e du début à la fin : passe quand tu peux, même quelques minutes.",
          "💜 Mieux vaut une présence honnête 15 minutes qu’un onglet ouvert sans attention.",
          "Tu fais déjà partie du mouvement dès que tu choisis d’être là consciemment.",
        ],
      },
      {
        t: "lurker",
        emoji: "👁️",
        title: "Lurker = déjà aider",
        p: "Regarder sans parler reste utile : tu comptes dans les stats, tu stabilises la viewerlist et tu envoies un signal de confiance au streamer.",
        perks: [
          { k: "Stats", d: "Tu participes à la visibilité de la chaîne." },
          { k: "Soutien discret", d: "Ta présence compte autant qu’un message forcé." },
          { k: "Respect du rythme", d: "Tu peux passer en mode chat plus tard si tu en as envie." },
        ],
      },
      {
        t: "h2",
        emoji: "💬",
        title: "Être actif sans se forcer",
      },
      {
        t: "micro",
        items: [
          { emoji: "👋", title: "Saluer", hint: "Un message simple suffit à créer le lien." },
          { emoji: "❓", title: "Poser une question", hint: "Sur le jeu, le setup, la journée — naturel." },
          { emoji: "🔥", title: "Réagir au live", hint: "Hype sincère, pas de spam." },
          { emoji: "🙌", title: "Remercier / encourager", hint: "Renforce le climat de confiance." },
        ],
      },
      {
        t: "anti",
        emoji: "🌱",
        title: "Ce qu’on évite",
        rows: [
          { title: "Comparaisons", desc: "« Moi j’aurais fait… » — le Spotlight n’est pas un concours." },
          { title: "Ambiance négative", desc: "Critiques gratuites, moqueries, pression sur les chiffres." },
          { title: "Jugement hâtif", desc: "Chaque streamer a son style ; on respecte le cadre." },
          { title: "Sortie « stats only »", desc: "Partir uniquement parce que les chiffres bougent — préfère un au revoir ou un petit mot." },
        ],
      },
    ],
  },
  {
    id: "streamer",
    label: "Je suis le streamer mis en avant",
    tabIcon: "wand",
    pieces: [
      {
        t: "intro",
        title: "Ce qu’est vraiment un Spotlight",
        p: "Ce n’est ni un examen ni une course aux stats : c’est une opportunité humaine et durable pour te présenter, rencontrer du monde et créer des liens.",
        list: [
          "Te présenter avec authenticité.",
          "Accueillir des viewers qui découvrent TENF.",
          "Créer un moment mémorable — pas un monologue stressant.",
        ],
      },
      {
        t: "timeline",
        emoji: "🎯",
        title: "Une heure guidée (structure rassurante)",
        steps: [
          { range: "0–5 min", title: "Accueil & présentation", emoji: "👋" },
          { range: "5–15 min", title: "Échange", emoji: "💬" },
          { range: "15–30 min", title: "Ton univers", emoji: "🎮" },
          { range: "30–45 min", title: "Moment sincère", emoji: "💜" },
          { range: "45–60 min", title: "Remerciements & clôture", emoji: "🙏" },
        ],
      },
      {
        t: "rules",
        emoji: "🔒",
        title: "Règles simples et protectrices",
        items: [
          { title: "Pas de multistream", desc: "Un seul live focalisé pour la clarté et la qualité du moment.", highlight: false },
          { title: "Réservation minimum 7 jours avant", desc: "Le temps de préparer l’annonce et la mobilisation.", highlight: false },
          { title: "Format 1 heure", desc: "Créneau lisible pour les viewers et le staff.", highlight: false },
          { title: "Raid TENF en fin de Spotlight", desc: "Prolonger l’entraide vers un autre membre.", highlight: false },
          { title: "Duo / co-live", desc: "Possible selon cadre annoncé — cohérence avec la communauté.", highlight: true },
          { title: "Réciprocité bienveillante", desc: "Tu bénéficies du soutien : pense à le rendre sur la durée.", highlight: true },
        ],
      },
      {
        t: "anti",
        emoji: "❤️",
        title: "Ce qu’on souhaite éviter",
        rows: [
          { title: "Live sans présentation", desc: "Les nouveaux viewers doivent comprendre qui tu es rapidement." },
          { title: "Silence prolongé", desc: "Prévois des prompts (chat, jeu, anecdotes) pour garder le lien." },
          { title: "Attente uniquement des stats", desc: "Le Spotlight est relationnel avant d’être analytique." },
        ],
      },
      {
        t: "callout",
        mode: "violet",
        emoji: "🤝",
        title: "Accompagnement bienveillant",
        lines: [
          "L’équipe peut t’envoyer des rappels privés, des explications et de l’aide pour le format — l’objectif est la bienveillance, pas la sanction.",
          "En cas de doute, demande dans les salons prévus ou contacte le staff : mieux vaut poser une question que stresser seul·e.",
        ],
      },
    ],
  },
];

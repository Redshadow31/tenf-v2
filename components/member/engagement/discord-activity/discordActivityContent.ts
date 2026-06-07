export const DISCORD_WHY_INTRO = {
  kicker: "Cœur de la commu",
  title: "Pourquoi le Discord TENF est important",
  lead:
    "Twitch, c'est le live. Discord, c'est le fil invisible qui relie tout le monde entre deux streams : annonces, entraide, accueil, coups de main rapides. Sans ce salon, les raids restent des chiffres ; avec lui, ils deviennent des liens.",
  footnote:
    "Cette page ne te juge pas : elle te montre ta trace, pour te rappeler que ta présence compte — même modeste.",
};

export const DISCORD_GENTLE_TRUTHS = [
  {
    id: "not-a-race",
    title: "Ce n'est pas une course",
    body: "Les chiffres servent à te situer, pas à te classer. Personne ne te demande d'être partout tout le temps.",
  },
  {
    id: "small-counts",
    title: "Un message peut suffire",
    body: "Un « bon live », un conseil, un mot à un·e nouveau·elle : parfois c'est plus utile qu'une semaine de silence.",
  },
  {
    id: "vocal-too",
    title: "Le vocal compte aussi",
    body: "Passer en vocal, même brièvement, c'est créer du lien direct — entraide, debrief, accueil chaleureux.",
  },
] as const;

export const DISCORD_PRACTICAL_TIPS = [
  "Surveille les salons annonces : lives TENF, raids, événements — c'est là que l'entraide se coordonne.",
  "Quand tu peux, réponds aux questions des nouveaux·elles : tu as peut-être vécu la même hésitation.",
  "Si tu es en vocal, pense à laisser de la place aux timides : un accueil doux vaut mieux qu'un rush.",
  "Ton pseudo Twitch sur ta fiche membre doit coller aux exports Discord — sinon tes stats peuvent rester vides ici.",
] as const;

export const DISCORD_DATA_FAQ = [
  {
    id: "source",
    q: "D'où viennent ces chiffres ?",
    a: "Des imports mensuels préparés par l'équipe TENF — la même source que les bilans staff. Ce n'est pas une capture en direct de l'appli Discord.",
  },
  {
    id: "zero",
    q: "Pourquoi un mois est à zéro ?",
    a: "Soit tu étais absent·e ce mois-là, soit ton profil n'était pas encore rattaché correctement aux exports (pseudo Twitch / Discord).",
  },
  {
    id: "vocal",
    q: "Comment lire le temps vocal ?",
    a: "Durée cumulée sur le mois, affichée en heures et minutes (ex. 2 h 15 min).",
  },
] as const;

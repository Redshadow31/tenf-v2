export const RAID_DECLARE_QUICK_NOTES = [
  "Raid après live Fortnite",
  "Soutien membre nouveau",
  "Fin de stream communautaire",
] as const;

export const RAID_DECLARE_WHY = {
  kicker: "Secours entraide",
  title: "Quand utiliser ce formulaire",
  lead:
    "Twitch détecte normalement les raids entre membres TENF. Ce formulaire est là uniquement si un passage n'apparaît pas dans ton historique après quelques heures — pas pour remplacer un raid oublié volontairement.",
  footnote: "Chaque dossier est relu avec bienveillance : une note claire et une cible membre TENF accélèrent la validation.",
};

export const RAID_DECLARE_STEPS = [
  { id: "check", title: "Vérifier l'historique", body: "Ouvre Mes raids : si le raid y est déjà, inutile de redéclarer." },
  { id: "wait", title: "Laisser le temps à Twitch", body: "Attends quelques heures après ton live avant d'ouvrir un dossier secours." },
  { id: "precise", title: "Être précis·e", body: "Cible membre TENF, date proche du live, note contextuelle si tu peux." },
] as const;

export const RAID_DECLARE_GENTLE_RULES = [
  "Privilégie les membres TENF — un raid hors collectif sera en général refusé.",
  "Une heure approximative vaut mieux qu'un mensonge : coche la case si tu doutes.",
  "Les fausses déclarations ralentissent la modération pour toute la commu.",
] as const;

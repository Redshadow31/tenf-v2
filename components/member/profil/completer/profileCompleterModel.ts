export type IdentityCheck = {
  label: string;
  done: boolean;
  fieldId: string;
};

export type ProfileCompleterViewModel = {
  accent: string;
  welcomeKicker: string;
  welcomeTitle: string;
  welcomeMessage: string;
  completionPercent: number;
  identityDoneCount: number;
  identityTotal: number;
  hasPublicDescription: boolean;
  requiredIdentityReady: boolean;
  isNewMember: boolean;
};

export function buildProfileCompleterModel(input: {
  completionPercent: number;
  identityDoneCount: number;
  identityTotal: number;
  hasPublicDescription: boolean;
  requiredIdentityReady: boolean;
  isNewMember: boolean;
  creatorName: string;
}): ProfileCompleterViewModel {
  const firstName = (input.creatorName || "toi").trim().split(/\s+/)[0] || "toi";
  const name = firstName.charAt(0).toUpperCase() + firstName.slice(1);

  let welcomeTitle: string;
  if (input.isNewMember) {
    welcomeTitle = `Bienvenue ${name} — on pose les bases ensemble`;
  } else if (input.completionPercent >= 100) {
    welcomeTitle = `${name}, ta vitrine est prête à envoyer`;
  } else if (input.requiredIdentityReady) {
    welcomeTitle = `${name}, l'essentiel est là — peaufine si tu veux`;
  } else {
    welcomeTitle = `${name}, quelques infos pour te retrouver dans la famille`;
  }

  const paragraphs: string[] = [];

  if (input.isNewMember) {
    paragraphs.push(
      "Tu entres dans la New Family : ce formulaire sert à te reconnaître côté staff et à préparer ta fiche publique. Pas de stress — tu peux envoyer sans bio et compléter plus tard.",
    );
  } else {
    paragraphs.push(
      "Que tu sois nouveau ou déjà membre, cette page met à jour ton identité TENF et ta vitrine streamer. Les changements peuvent passer en relecture staff — c'est normal, pas une sanction.",
    );
  }

  if (!input.requiredIdentityReady) {
    paragraphs.push(
      `Encore ${input.identityTotal - input.identityDoneCount} info${input.identityTotal - input.identityDoneCount > 1 ? "s" : ""} obligatoire${input.identityTotal - input.identityDoneCount > 1 ? "s" : ""} pour activer l'envoi. La checklist à droite te guide champ par champ.`,
    );
  } else if (!input.hasPublicDescription) {
    paragraphs.push(
      "Ton identité est complète. La bio et les réseaux restent optionnels — une phrase sincère suffit souvent pour une première version.",
    );
  } else {
    paragraphs.push(
      "Identité et bio sont renseignées. Un clic sur « Envoyer » et le staff prend le relais si une validation est nécessaire.",
    );
  }

  paragraphs.push(
    "Pense aussi à relier Twitch juste en dessous : sans OAuth, planning, raids auto et suivi réseau restent en veille.",
  );

  const accent =
    input.completionPercent >= 100
      ? "#22c55e"
      : input.requiredIdentityReady
        ? "#a78bfa"
        : input.isNewMember
          ? "#f59e0b"
          : "#9146ff";

  return {
    accent,
    welcomeKicker: input.isNewMember ? "Premiers pas" : "Compléter ma vitrine",
    welcomeTitle,
    welcomeMessage: paragraphs.join(" "),
    completionPercent: input.completionPercent,
    identityDoneCount: input.identityDoneCount,
    identityTotal: input.identityTotal,
    hasPublicDescription: input.hasPublicDescription,
    requiredIdentityReady: input.requiredIdentityReady,
    isNewMember: input.isNewMember,
  };
}

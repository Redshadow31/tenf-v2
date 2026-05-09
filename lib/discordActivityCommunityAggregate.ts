/** Clé technique stable (aucun login Twitch réel ne doit utiliser cette valeur). */
export const DISCORD_ACTIVITY_COMMUNITY_LOGIN = "__tenf_communaute__";

/** Libellé affiché pour l’agrégat des pseudos Discord non rattachés à un membre du site. */
export const DISCORD_ACTIVITY_COMMUNITY_LABEL = "Membres de la communauté";

export function formatDiscordActivityMemberLabel(login: string): string {
  return login === DISCORD_ACTIVITY_COMMUNITY_LOGIN ? DISCORD_ACTIVITY_COMMUNITY_LABEL : login;
}

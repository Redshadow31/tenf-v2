/**
 * Configuration des liens des réseaux sociaux TENF
 * Source unique de vérité — toute URL Discord, X, TikTok, Instagram
 * affichée sur le site doit être importée d'ici.
 */

export type SocialIconId = "discord" | "twitter" | "tiktok" | "instagram";

export interface SocialLink {
  name: string;
  url: string;
  icon: SocialIconId;
}

export const socialLinks: SocialLink[] = [
  {
    name: "Discord",
    url: "https://discord.com/invite/ypn6s9XK8t",
    icon: "discord",
  },
  {
    name: "X (Twitter)",
    url: "https://x.com/Team_New_Family",
    icon: "twitter",
  },
  {
    name: "TikTok",
    url: "https://www.tiktok.com/@twitchentraidenewfamily",
    icon: "tiktok",
  },
  {
    name: "Instagram",
    url: "https://www.instagram.com/twitchentraidenewfamily",
    icon: "instagram",
  },
];

/**
 * URL d'invitation Discord canonique du serveur TENF.
 * À utiliser partout au lieu d'une URL en dur.
 */
export const DISCORD_INVITE_URL: string =
  socialLinks.find((s) => s.icon === "discord")?.url ?? "https://discord.com/invite/ypn6s9XK8t";

/**
 * Salon tickets du serveur TENF (🎟️・tickets) — lien officiel du pied de page.
 * Si ce canal change, mettre à jour cette constante (source unique pour le footer).
 */
export const DISCORD_TICKETS_CHANNEL_URL =
  "https://discord.com/channels/535244857891880970/1440543884500533248";

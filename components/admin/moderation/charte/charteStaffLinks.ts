import { buildModerationHref } from "@/lib/moderation/moderationTree";

export type CharteStaffLink = {
  label: string;
  href: string;
  external?: boolean;
  note?: string;
};

/**
 * URL du salon règlement Discord TENF.
 * TODO équipe TENF : remplacer par l’URL directe du salon (ex. https://discord.com/channels/GUILD_ID/CHANNEL_ID).
 * Tant que l’URL n’est pas définie, le lien ouvre Discord sans cibler un salon précis.
 */
export const DISCORD_REGLEMENT_URL =
  process.env.NEXT_PUBLIC_DISCORD_REGLEMENT_URL?.trim() || "https://discord.com/channels";

export const CHARTE_STAFF_LINKS: CharteStaffLink[] = [
  { label: "Hub modération staff", href: "/admin/moderation/staff" },
  {
    label: "Exercices mensuels",
    href: buildModerationHref("staff", "petits-travaux", "exercices-mensuels"),
  },
  {
    label: "Annonces staff",
    href: buildModerationHref("staff", "info", "annonces-staff"),
  },
  {
    label: "Comptes rendus réunions",
    href: buildModerationHref("staff", "info", "comptes-rendus-reunions"),
  },
  {
    label: "Validations charte (admin)",
    href: buildModerationHref("staff", "info", "charte-validations"),
  },
  {
    label: "Règlement Discord",
    href: DISCORD_REGLEMENT_URL,
    external: true,
    note:
      DISCORD_REGLEMENT_URL === "https://discord.com/channels"
        ? "À configurer : définir NEXT_PUBLIC_DISCORD_REGLEMENT_URL ou mettre à jour charteStaffLinks.ts"
        : "Règlement du serveur TENF sur Discord",
  },
  { label: "Contacter TENF", href: "/contact" },
];

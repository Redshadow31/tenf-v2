import NextAuth from "next-auth";
import { AdminRole } from "@/lib/adminRoles";

declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      // Champs personnalisés Discord
      discordId: string;
      username: string;
      avatar: string | null;
      role: AdminRole | null;
      /** Nom d'affichage Discord (global_name), si présent */
      discordGlobalName?: string | null;
      /** Identifiant Discord (handle sans @) */
      discordHandle?: string | null;
      /** True si l'accès admin général est bloqué (charte modération non validée après le délai) */
      moderationCharterBlocked?: boolean;
    };
  }

  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    discordId?: string;
    username?: string;
    avatar?: string | null;
    role?: AdminRole | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    discordId?: string;
    username?: string;
    avatar?: string | null;
    role?: AdminRole | null;
    discordGlobalName?: string | null;
    discordHandle?: string | null;
    discordAccessToken?: string;
    discordRefreshToken?: string;
    discordAccessTokenExpiresAt?: number;
    discordProfileFetchedAt?: number;
    moderationCharterBlocked?: boolean;
    charterGateEvaluatedAt?: number;
  }
}

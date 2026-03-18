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
  }
}

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export interface AuthenticatedUser {
  discordId: string;
  username: string;
  avatar: string | null;
}

/**
 * Auth utilisateur fiable côté serveur (NextAuth uniquement).
 * Aucun fallback cookie legacy n'est autorisé.
 */
export async function requireUser(): Promise<AuthenticatedUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.discordId) {
    return null;
  }

  return {
    discordId: session.user.discordId,
    username: session.user.username || "Unknown",
    avatar: session.user.avatar || null,
  };
}


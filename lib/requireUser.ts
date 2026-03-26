import { getToken } from "next-auth/jwt";
import { getServerSession } from "next-auth/next";
import { headers } from "next/headers";
import { authOptions } from "@/lib/auth";

export interface AuthenticatedUser {
  discordId: string;
  username: string;
  avatar: string | null;
}

function mapToken(token: Record<string, unknown>): AuthenticatedUser | null {
  const discordId = token.discordId as string | undefined;
  if (!discordId) return null;
  return {
    discordId,
    username: (token.username as string) || "Unknown",
    avatar: (token.avatar as string) || null,
  };
}

/**
 * Auth utilisateur (NextAuth JWT) : cookie session **ou** en-tête `Authorization: Bearer <jwt>`.
 * Le Bearer permet aux clients mobiles d'appeler les mêmes routes que le site.
 */
export async function requireUser(): Promise<AuthenticatedUser | null> {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) return null;

  const headersList = headers();
  const reqLike = {
    headers: Object.fromEntries(headersList.entries()),
  };

  const token = await getToken({ req: reqLike as any, secret });
  if (token) {
    const user = mapToken(token as Record<string, unknown>);
    if (user) return user;
  }

  const session = await getServerSession(authOptions);
  if (session?.user?.discordId) {
    return {
      discordId: session.user.discordId,
      username: session.user.username || "Unknown",
      avatar: session.user.avatar || null,
    };
  }

  return null;
}

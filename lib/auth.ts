import NextAuth, { NextAuthOptions } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import { getAdminRole, AdminRole } from "./adminRoles";
import { loadAdminAccessCache, getAdminRoleFromCache } from "./adminAccessCache";

export const authOptions: NextAuthOptions = {
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "identify guilds guilds.members.read",
          redirect_uri: process.env.DISCORD_REDIRECT_URI,
        },
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 7, // 7 jours
  },
  callbacks: {
    async jwt({ token, account, profile, user }) {
      // Lors de la connexion initiale, account et profile sont disponibles
      if (account && profile) {
        // Le profil Discord a un champ 'id' mais TypeScript ne le reconnaît pas par défaut
        const discordProfile = profile as any;
        const discordId = discordProfile.id as string;
        const username = (discordProfile.username || discordProfile.global_name || "Unknown") as string;
        const avatar = discordProfile.image as string | undefined;

        // Ajouter les informations Discord au token
        token.discordId = discordId;
        token.username = username;
        token.avatar = avatar;

        // Récupérer le rôle admin (hardcodé d'abord, puis cache Blobs)
        let role = getAdminRole(discordId);
        
        // Si pas trouvé dans les hardcodés, vérifier le cache Blobs
        if (!role) {
          try {
            await loadAdminAccessCache();
            role = getAdminRoleFromCache(discordId);
          } catch (error) {
            // Si Blobs n'est pas disponible, ignorer (rôle reste null)
            console.warn('[NextAuth] Cannot load admin access cache:', error);
          }
        }

        token.role = role || null;
      }

      // À chaque requête, on peut mettre à jour le rôle depuis le cache si nécessaire
      // (optionnel, pour éviter de refaire la vérification à chaque fois)
      // Pour l'instant, on garde le rôle tel qu'il était au moment du login

      return token;
    },
    async session({ session, token }) {
      // Exposer les informations Discord dans la session
      if (token.discordId) {
        session.user.discordId = token.discordId as string;
        session.user.username = (token.username || "Unknown") as string;
        session.user.avatar = (token.avatar || null) as string | null;
        session.user.role = (token.role || null) as AdminRole | null;
      }

      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },
};



















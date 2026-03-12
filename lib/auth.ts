import NextAuth, { NextAuthOptions } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import { getAdminRole, normalizeAdminRole, AdminRole } from "./adminRoles";
import { loadAdminAccessCache, getAdminRoleFromCache } from "./adminAccessCache";
import { memberRepository } from "./repositories";

export const authOptions: NextAuthOptions = {
  // Active les logs détaillés si NEXTAUTH_DEBUG=true (utile pour diagnostiquer OAuthCallback).
  debug: process.env.NEXTAUTH_DEBUG === "true",
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "identify guilds guilds.members.read",
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
    async signIn({ profile }) {
      const discordProfile = profile as any;
      const discordId = discordProfile?.id as string | undefined;
      const username = (discordProfile?.username || discordProfile?.global_name || "Unknown") as string;

      if (!discordId) return true;

      let existing = null;
      try {
        existing = await memberRepository.findByDiscordId(discordId);
      } catch (error) {
        // Ne pas bloquer l'auth Discord si la DB est temporairement indisponible.
        console.warn("[NextAuth signIn] findByDiscordId failed, allow sign-in:", error);
        return true;
      }
      if (existing) return true;

      const placeholderLogin = `nouveau_${discordId}`;
      const displayName = username.trim() || `Discord ${discordId}`;

      try {
        await memberRepository.create({
          twitchLogin: placeholderLogin,
          twitchUrl: `https://www.twitch.tv/${placeholderLogin}`,
          displayName,
          discordId,
          discordUsername: username,
          role: "Nouveau",
          isVip: false,
          isActive: false,
          badges: [],
          profileValidationStatus: "non_soumis",
          onboardingStatus: "a_faire",
          createdAt: new Date(),
          updatedAt: new Date(),
          updatedBy: discordId,
        });
      } catch (error) {
        // Tolérance aux courses: si la fiche a été créée en parallèle, on continue.
        const lateExisting = await memberRepository.findByDiscordId(discordId);
        if (!lateExisting) {
          // Fail-open: la connexion Discord ne doit pas échouer à cause de la création auto.
          // La fiche membre pourra être créée/synchronisée plus tard par les flux admin.
          console.warn("[NextAuth signIn] auto-create member failed, allow sign-in:", error);
          return true;
        }
      }

      return "/membres/me?onboarding=1";
    },
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

        token.role = normalizeAdminRole(role) || null;
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
        session.user.role = normalizeAdminRole((token.role as string | null | undefined) || null);
      }

      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },
};



















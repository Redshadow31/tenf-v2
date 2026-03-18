import NextAuth, { NextAuthOptions } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import CredentialsProvider from "next-auth/providers/credentials";
import { getAdminRole, normalizeAdminRole, AdminRole } from "./adminRoles";
import { loadAdminAccessCache, getAdminRoleFromCache } from "./adminAccessCache";
import { memberRepository } from "./repositories";

const discordClientId = process.env.DISCORD_CLIENT_ID;
const discordClientSecret = process.env.DISCORD_CLIENT_SECRET;
const hasDiscordOAuthConfig = Boolean(discordClientId && discordClientSecret);
const devAuthEnabled =
  process.env.NODE_ENV !== "production" &&
  (process.env.ENABLE_DEV_AUTH !== "false");

export const authOptions: NextAuthOptions = {
  // Active les logs détaillés si NEXTAUTH_DEBUG=true (utile pour diagnostiquer OAuthCallback).
  debug: process.env.NEXTAUTH_DEBUG === "true",
  providers: [
    ...(hasDiscordOAuthConfig
      ? [
          DiscordProvider({
            clientId: discordClientId!,
            clientSecret: discordClientSecret!,
            authorization: {
              params: {
                scope: "identify guilds guilds.members.read",
              },
            },
          }),
        ]
      : []),
    ...(devAuthEnabled
      ? [
          CredentialsProvider({
            id: "dev-bypass",
            name: "Dev Bypass",
            credentials: {
              discordId: { label: "Discord ID", type: "text" },
              username: { label: "Pseudo", type: "text" },
              role: { label: "Role", type: "text" },
            },
            async authorize(credentials) {
              if (!devAuthEnabled) return null;
              const discordId = String(credentials?.discordId || "").trim();
              const username = String(credentials?.username || "Dev Local").trim();
              const requestedRole = normalizeAdminRole(String(credentials?.role || "").trim());
              if (!discordId) return null;
              const role = requestedRole || "ADMIN_COORDINATEUR";
              return {
                id: discordId,
                name: username,
                discordId,
                username,
                avatar: null,
                role,
              } as any;
            },
          }),
        ]
      : []),
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

      try {
        let existing = null;
        try {
          existing = await memberRepository.findByDiscordId(discordId);
        } catch (error) {
          // Ne pas bloquer l'auth Discord si la DB est temporairement indisponible.
          console.warn("[NextAuth signIn] findByDiscordId failed, allow sign-in:", error);
          return true;
        }
        if (existing) {
          const login = String(existing.twitchLogin || "").toLowerCase();
          const isPlaceholder = login.startsWith("nouveau_") || login.startsWith("nouveau-");
          const onboardingStatus = String(existing.onboardingStatus || "").toLowerCase();
          const needsOnboarding = isPlaceholder || onboardingStatus === "a_faire";
          // Important: ne pas rediriger depuis signIn callback (sinon session annulée -> boucle OAuth).
          // Le modal onboarding est piloté ensuite côté page via onboardingStatus.
          if (needsOnboarding) return true;
          return true;
        }

        const placeholderLogin = `nouveau_${discordId.toLowerCase()}`;
        const displayName = username.trim() || `Discord ${discordId}`;

        try {
          await memberRepository.create({
            twitchLogin: placeholderLogin,
            twitchUrl: `https://www.twitch.tv/${placeholderLogin}`,
            displayName,
            siteUsername: displayName,
            discordId,
            discordUsername: username,
            role: "Nouveau",
            isVip: false,
            isActive: false,
            badges: [],
            profileValidationStatus: "non_soumis",
            onboardingStatus: "a_faire",
            timezone: "Europe/Paris",
            countryCode: "FR",
            primaryLanguage: "fr",
            createdAt: new Date(),
            updatedAt: new Date(),
            updatedBy: discordId,
          });
        } catch (error) {
          // Tolérance aux courses: si la fiche est créée en parallèle, on continue.
          try {
            const lateExisting = await memberRepository.findByDiscordId(discordId);
            if (!lateExisting) {
              console.warn("[NextAuth signIn] auto-create draft failed, allow sign-in:", error);
            }
          } catch (lookupError) {
            console.warn("[NextAuth signIn] late lookup failed, allow sign-in:", lookupError);
          }
        }

        // Nouveau membre: la session doit d'abord être créée.
        // Le modal sera affiché ensuite via onboardingStatus=a_faire.
        return true;
      } catch (unexpectedError) {
        // Filet de sécurité global: aucune erreur de ce callback ne doit bloquer OAuth.
        console.warn("[NextAuth signIn] unexpected error, allow sign-in:", unexpectedError);
        return true;
      }
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

      // Connexion locale de développement via provider credentials "dev-bypass".
      if (account?.provider === "dev-bypass" && user) {
        const devUser = user as any;
        const discordId = String(devUser.discordId || devUser.id || "").trim();
        if (discordId) {
          token.discordId = discordId;
          token.username = String(devUser.username || devUser.name || "Dev Local");
          token.avatar = (devUser.avatar || null) as string | null;
          token.role = normalizeAdminRole(devUser.role) || "ADMIN_COORDINATEUR";
        }
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
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }
      try {
        const parsed = new URL(url);
        if (parsed.origin === baseUrl) {
          return url;
        }
      } catch {
        // Ignore malformed URLs and use the dashboard fallback below.
      }
      return `${baseUrl}/member/dashboard`;
    },
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },
};



















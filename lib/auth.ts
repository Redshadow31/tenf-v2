import type { NextAuthOptions } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import CredentialsProvider from "next-auth/providers/credentials";
import { getAdminRole, normalizeAdminRole, AdminRole } from "./adminRoles";
import { loadAdminAccessCache, getAdminRoleFromCache } from "./adminAccessCache";
import { memberRepository } from "./repositories";
import { adminModerationCharterAccessBlocked } from "./adminModerationCharterGate";

const discordClientId = process.env.DISCORD_CLIENT_ID;
const discordClientSecret = process.env.DISCORD_CLIENT_SECRET;
const hasDiscordOAuthConfig = Boolean(discordClientId && discordClientSecret);
const devAuthEnabled =
  process.env.NODE_ENV !== "production" &&
  (process.env.ENABLE_DEV_AUTH !== "false");

const DISCORD_PROFILE_REFRESH_MS = 10 * 60 * 1000;
const CHARTER_JWT_EVAL_MS = 5 * 60 * 1000;

/** Aligné sur le middleware : en dev auth souple, ne pas figer charte / appels Discord dans le JWT */
function skipDiscordRefreshAndCharterJwtCoercion(): boolean {
  return process.env.NODE_ENV !== "production" && process.env.ENABLE_DEV_AUTH !== "false";
}

async function ensureDiscordAccessToken(token: Record<string, unknown>): Promise<string | null> {
  let accessToken = typeof token.discordAccessToken === "string" ? token.discordAccessToken : null;
  const expMs = typeof token.discordAccessTokenExpiresAt === "number" ? token.discordAccessTokenExpiresAt : 0;
  const now = Date.now();
  const refresh = typeof token.discordRefreshToken === "string" ? token.discordRefreshToken : null;

  const tokenLikelyExpired = !accessToken || (expMs > 0 && now >= expMs - 120_000);
  if (!tokenLikelyExpired) {
    return accessToken;
  }

  if (!refresh || !discordClientId || !discordClientSecret) {
    return accessToken;
  }

  const body = new URLSearchParams({
    client_id: discordClientId,
    client_secret: discordClientSecret,
    grant_type: "refresh_token",
    refresh_token: refresh,
  });
  try {
    const res = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    if (!res.ok) {
      return accessToken;
    }
    const data = (await res.json()) as {
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
    };
    if (data.access_token) {
      token.discordAccessToken = data.access_token;
    }
    if (data.refresh_token) {
      token.discordRefreshToken = data.refresh_token;
    }
    if (typeof data.expires_in === "number") {
      token.discordAccessTokenExpiresAt = Date.now() + data.expires_in * 1000;
    }
    return typeof token.discordAccessToken === "string" ? token.discordAccessToken : null;
  } catch {
    return accessToken;
  }
}

async function refreshDiscordProfileIfStale(token: Record<string, unknown>) {
  if (skipDiscordRefreshAndCharterJwtCoercion()) {
    return;
  }
  if ((token as { devBypass?: boolean }).devBypass) {
    return;
  }
  if (!token.discordId) {
    return;
  }
  const last = typeof token.discordProfileFetchedAt === "number" ? token.discordProfileFetchedAt : 0;
  if (Date.now() - last < DISCORD_PROFILE_REFRESH_MS) {
    return;
  }

  const accessToken = await ensureDiscordAccessToken(token);
  if (!accessToken) {
    return;
  }

  try {
    const res = await fetch("https://discord.com/api/v10/users/@me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
      return;
    }
    const u = (await res.json()) as {
      global_name?: string | null;
      username?: string;
      avatar?: string | null;
    };
    token.discordGlobalName =
      typeof u.global_name === "string" && u.global_name.trim().length > 0 ? u.global_name.trim() : null;
    token.discordHandle =
      typeof u.username === "string" && u.username.trim().length > 0 ? u.username.trim() : null;
    token.username = (token.discordGlobalName || token.discordHandle || token.username || "Unknown") as string;
    if (u.avatar && token.discordId) {
      token.avatar = `https://cdn.discordapp.com/avatars/${String(token.discordId)}/${u.avatar}.png`;
    }
    token.discordProfileFetchedAt = Date.now();
  } catch {
    // ignore
  }
}

async function refreshModerationCharterFlagOnToken(
  token: Record<string, unknown>,
  forceReevaluate = false
) {
  if (skipDiscordRefreshAndCharterJwtCoercion()) {
    token.moderationCharterBlocked = false;
    return;
  }
  if ((token as { devBypass?: boolean }).devBypass) {
    token.moderationCharterBlocked = false;
    return;
  }
  const discordId = typeof token.discordId === "string" ? token.discordId.trim() : "";
  if (!discordId) {
    return;
  }
  const lastEval = typeof token.charterGateEvaluatedAt === "number" ? token.charterGateEvaluatedAt : 0;
  if (
    !forceReevaluate &&
    Date.now() - lastEval < CHARTER_JWT_EVAL_MS &&
    typeof token.moderationCharterBlocked === "boolean"
  ) {
    return;
  }

  try {
    token.moderationCharterBlocked = await adminModerationCharterAccessBlocked(discordId);
  } catch {
    token.moderationCharterBlocked = false;
  }
  token.charterGateEvaluatedAt = Date.now();
}

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
    async jwt({ token, account, profile, user, trigger }) {
      // Lors de la connexion initiale, account et profile sont disponibles
      if (account && profile) {
        // Le profil Discord a un champ 'id' mais TypeScript ne le reconnaît pas par défaut
        const discordProfile = profile as any;
        const discordId = discordProfile.id as string;
        const username = (discordProfile.username || discordProfile.global_name || "Unknown") as string;
        const avatar = discordProfile.image as string | undefined;
        const globalName =
          typeof discordProfile.global_name === "string" && discordProfile.global_name.trim().length > 0
            ? discordProfile.global_name.trim()
            : null;
        const handle =
          typeof discordProfile.username === "string" && discordProfile.username.trim().length > 0
            ? discordProfile.username.trim()
            : null;

        // Ajouter les informations Discord au token
        token.discordId = discordId;
        token.username = username;
        token.avatar = avatar;
        token.discordGlobalName = globalName;
        token.discordHandle = handle;
        token.discordProfileFetchedAt = Date.now();

        if (account?.provider === "discord") {
          if (typeof account.access_token === "string") {
            token.discordAccessToken = account.access_token;
          }
          if (typeof account.refresh_token === "string") {
            token.discordRefreshToken = account.refresh_token;
          }
          if (typeof account.expires_at === "number") {
            token.discordAccessTokenExpiresAt = account.expires_at * 1000;
          }
        }

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
          token.discordGlobalName = null;
          token.discordHandle = null;
          (token as any).devBypass = true;
        }
      }

      await refreshDiscordProfileIfStale(token);
      await refreshModerationCharterFlagOnToken(token, trigger === "update");

      return token;
    },
    async session({ session, token }) {
      // Exposer les informations Discord dans la session
      if (token.discordId) {
        session.user.discordId = token.discordId as string;
        session.user.username = (token.username || "Unknown") as string;
        session.user.avatar = (token.avatar || null) as string | null;
        session.user.role = normalizeAdminRole((token.role as string | null | undefined) || null);
        session.user.discordGlobalName = (token.discordGlobalName as string | null | undefined) ?? null;
        session.user.discordHandle = (token.discordHandle as string | null | undefined) ?? null;
        session.user.moderationCharterBlocked = token.moderationCharterBlocked === true;
        (session.user as any).devBypass = (token as any).devBypass === true;
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
    // Flux mobile : cookie tenf_mo_handoff → deep link avec error=... (voir /auth/oauth-error-bridge)
    error: "/auth/oauth-error-bridge",
  },
};



















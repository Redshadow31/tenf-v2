"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const error = searchParams.get("error");
  const callbackUrlParam = searchParams.get("callbackUrl");
  const callbackUrl =
    callbackUrlParam && callbackUrlParam.startsWith("/") && !callbackUrlParam.startsWith("//")
      ? callbackUrlParam
      : "/member/dashboard";
  const shouldAutoStart = searchParams.get("autostart") === "1";
  const [isLoading, setIsLoading] = useState(false);
  const [devDiscordId, setDevDiscordId] = useState("333001130705420299");
  const [devUsername, setDevUsername] = useState("Dev Local");
  const [devRole, setDevRole] = useState("FONDATEUR");
  const devAuthEnabled =
    process.env.NODE_ENV !== "production" &&
    process.env.NEXT_PUBLIC_ENABLE_DEV_AUTH !== "false";
  const devFounderPreset = {
    discordId: "333001130705420299",
    username: "Dev Fondateur",
    role: "FONDATEUR",
  };

  useEffect(() => {
    // Si déjà authentifié via NextAuth, rediriger
    if (status === "authenticated" && session) {
      router.push(callbackUrl);
    }
  }, [status, session, callbackUrl, router]);

  useEffect(() => {
    if (status !== "unauthenticated") return;
    if (!shouldAutoStart) return;
    if (error) return;
    setIsLoading(true);
    signIn("discord", { callbackUrl });
  }, [status, shouldAutoStart, error, callbackUrl]);

  // Afficher un loader pendant la vérification de la session
  if (status === "loading") {
    return (
      <main className="min-h-screen bg-[#0e0e10] flex items-center justify-center p-6">
        <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-8 max-w-md w-full">
          <div className="text-center">
            <div className="text-white text-lg mb-4">Vérification...</div>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#9146ff] mx-auto"></div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0e0e10] flex items-center justify-center p-6">
      <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-white mb-6">Connexion</h1>

        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
            <p className="text-red-400 text-sm font-semibold mb-2">
              {error === "missing_code_or_state" && "Code ou state manquant"}
              {error === "invalid_state" && "État invalide - veuillez réessayer"}
              {error === "server_config_error" && "Erreur de configuration serveur"}
              {error === "token_exchange_failed" && "Échec de l'échange de token"}
              {error === "user_fetch_failed" && "Impossible de récupérer les informations utilisateur"}
              {error === "oauth_error" && "Erreur lors de la connexion Discord"}
              {error === "discord" && "Erreur lors de la connexion Discord"}
              {!["missing_code_or_state", "invalid_state", "server_config_error", "token_exchange_failed", "user_fetch_failed", "oauth_error", "discord"].includes(error) && `Erreur: ${error}`}
            </p>
            {searchParams.get("details") && (
              <p className="text-red-300 text-xs mt-2 font-mono break-all">
                Détails: {searchParams.get("details")}
              </p>
            )}
            {error === "token_exchange_failed" && (
              <div className="mt-3 text-xs text-gray-300 space-y-1">
                <p>Vérifications à faire :</p>
                <ul className="list-disc list-inside ml-2 space-y-1">
                  <li>Le redirect_uri dans Discord Developer Portal correspond exactement à l'URL Netlify</li>
                  <li>Les variables DISCORD_CLIENT_ID et DISCORD_CLIENT_SECRET sont correctes</li>
                  <li>Le redirect_uri utilisé est : https://tenf-community.com/api/auth/callback/discord</li>
                </ul>
              </div>
            )}
            {error === "invalid_state" && (
              <div className="mt-3 text-xs text-gray-300 space-y-1">
                <p className="font-semibold mb-2">Action requise :</p>
                <ol className="list-decimal list-inside ml-2 space-y-1">
                  <li>Allez sur Discord Developer Portal → OAuth2 → General</li>
                  <li>Dans la section <strong>Redirects</strong>, ajoutez EXACTEMENT :</li>
                  <li className="ml-4 font-mono bg-gray-800 p-1 rounded">https://tenf-community.com/api/auth/callback/discord</li>
                  <li>Supprimez l'ancien redirect si présent</li>
                  <li>Cliquez sur <strong>Save Changes</strong></li>
                  <li>Nettoyez les cookies du navigateur et réessayez</li>
                </ol>
              </div>
            )}
          </div>
        )}

        <div className="space-y-4">
          <button
            onClick={() => {
              setIsLoading(true);
              signIn("discord", { callbackUrl });
            }}
            disabled={isLoading}
            className="w-full bg-[#5865F2] hover:bg-[#4752C4] disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Connexion en cours...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.24-.455.5-.705.748a19.717 19.717 0 0 0-5.617 0 12.936 12.936 0 0 0-.705-.748.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
                Se connecter avec Discord
              </>
            )}
          </button>

          <button
            onClick={() => router.push("/")}
            className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Retour à l'accueil
          </button>

          {devAuthEnabled && (
            <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-amber-300">
                Mode développement local
              </p>
              <button
                onClick={() => {
                  setIsLoading(true);
                  setDevDiscordId(devFounderPreset.discordId);
                  setDevUsername(devFounderPreset.username);
                  setDevRole(devFounderPreset.role);
                  void signIn("dev-bypass", {
                    callbackUrl,
                    discordId: devFounderPreset.discordId,
                    username: devFounderPreset.username,
                    role: devFounderPreset.role,
                  });
                }}
                disabled={isLoading}
                className="mb-3 w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-gray-600"
              >
                Accès total local (1 clic)
              </button>
              <div className="space-y-2">
                <input
                  value={devDiscordId}
                  onChange={(e) => setDevDiscordId(e.target.value)}
                  placeholder="Discord ID"
                  className="w-full rounded-lg border border-gray-700 bg-[#0e0e10] px-3 py-2 text-sm text-white"
                />
                <input
                  value={devUsername}
                  onChange={(e) => setDevUsername(e.target.value)}
                  placeholder="Pseudo"
                  className="w-full rounded-lg border border-gray-700 bg-[#0e0e10] px-3 py-2 text-sm text-white"
                />
                <select
                  value={devRole}
                  onChange={(e) => setDevRole(e.target.value)}
                  className="w-full rounded-lg border border-gray-700 bg-[#0e0e10] px-3 py-2 text-sm text-white"
                >
                  <option value="FONDATEUR">Fondateur</option>
                  <option value="ADMIN_COORDINATEUR">Admin Coordinateur</option>
                  <option value="MODERATEUR">Modérateur</option>
                  <option value="MODERATEUR_EN_FORMATION">Modérateur en formation</option>
                  <option value="MODERATEUR_EN_PAUSE">Modérateur en pause</option>
                  <option value="SOUTIEN_TENF">Soutien TENF</option>
                </select>
                <button
                  onClick={() => {
                    setIsLoading(true);
                    void signIn("dev-bypass", {
                      callbackUrl,
                      discordId: devDiscordId,
                      username: devUsername,
                      role: devRole,
                    });
                  }}
                  disabled={isLoading || !devDiscordId.trim()}
                  className="w-full rounded-lg bg-amber-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-amber-700 disabled:cursor-not-allowed disabled:bg-gray-600"
                >
                  Connexion locale (bypass)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { loginWithDiscord, getDiscordUser } from "@/lib/discord";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const error = searchParams.get("error");
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      // Vérifier si l'utilisateur est déjà authentifié
      const user = await getDiscordUser();
      if (user) {
        // Si déjà connecté, rediriger vers l'accueil
        router.push("/");
        return;
      }
      setIsCheckingAuth(false);
    }
    checkAuth();
  }, [router]);

  if (isCheckingAuth) {
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
              {!["missing_code_or_state", "invalid_state", "server_config_error", "token_exchange_failed", "user_fetch_failed", "oauth_error"].includes(error) && `Erreur: ${error}`}
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
                  <li>Le redirect_uri utilisé est : https://teamnewfamily.netlify.app/api/auth/discord/callback</li>
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="space-y-4">
          <button
            onClick={() => loginWithDiscord()}
            className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.24-.455.5-.705.748a19.717 19.717 0 0 0-5.617 0 12.936 12.936 0 0 0-.705-.748.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
            </svg>
            Se connecter avec Discord
          </button>

          <button
            onClick={() => router.push("/")}
            className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    </main>
  );
}

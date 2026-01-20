"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getDiscordUser } from "@/lib/discord";
import { loginWithDiscord } from "@/lib/discord";

export default function AcademyAccessPage() {
  const [user, setUser] = useState<any>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function checkUser() {
      const discordUser = await getDiscordUser();
      setUser(discordUser);
      
      if (discordUser) {
        // Vérifier si l'utilisateur a déjà accès
        try {
          const response = await fetch("/api/academy/check-access", {
            cache: 'no-store',
          });
          if (response.ok) {
            const data = await response.json();
            if (data.hasAccess) {
              setHasAccess(true);
              // Rediriger vers la promo active
              if (data.activePromoId) {
                router.push(`/academy/promo/${data.activePromoId}`);
              } else {
                router.push("/academy/dashboard");
              }
            }
          }
        } catch (error) {
          console.error("Erreur vérification accès:", error);
        }
      }
    }
    checkUser();
  }, [router]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/academy/validate-password", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Accès accordé, rediriger vers la promo
        if (data.promoId) {
          router.push(`/academy/promo/${data.promoId}`);
        } else {
          router.push("/academy/dashboard");
        }
      } else {
        setError(data.error || "Mot de passe incorrect");
      }
    } catch (error) {
      setError("Erreur lors de la validation");
    } finally {
      setLoading(false);
    }
  };

  const handleDiscordAccess = () => {
    // L'utilisateur doit être connecté avec Discord pour cette méthode
    if (!user) {
      loginWithDiscord();
    } else {
      // Vérifier les rôles Discord
      fetch("/api/academy/validate-discord", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }).then(async (response) => {
        const data = await response.json();
        if (response.ok && data.success) {
          if (data.promoId) {
            router.push(`/academy/promo/${data.promoId}`);
          } else {
            router.push("/academy/dashboard");
          }
        } else {
          setError(data.error || "Vous n'avez pas les rôles Discord nécessaires");
        }
      }).catch(() => {
        setError("Erreur lors de la vérification Discord");
      });
    }
  };

  if (hasAccess) {
    return null; // Redirection en cours
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold" style={{ color: 'var(--color-text)' }}>
          Accès à TENF Academy
        </h1>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          Deux méthodes d'accès sont disponibles
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Porte 1 : Mot de passe */}
        <div className="rounded-lg border p-6" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
          <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
            🔑 Mot de passe promo
          </h2>
          <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
            Si vous avez reçu un mot de passe pour votre promo, entrez-le ci-dessous.
          </p>
          
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mot de passe"
              className="w-full rounded-lg px-4 py-2 border"
              style={{ 
                backgroundColor: 'var(--color-surface)', 
                borderColor: 'var(--color-border)',
                color: 'var(--color-text)'
              }}
              required
            />
            {error && (
              <p className="text-sm text-red-400">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#9146ff] hover:bg-[#7c3aed] px-4 py-2 text-white font-medium transition-colors disabled:opacity-50"
            >
              {loading ? "Vérification..." : "Valider"}
            </button>
          </form>
        </div>

        {/* Porte 2 : Discord OAuth */}
        <div className="rounded-lg border p-6" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
          <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
            🎓 Accès Discord
          </h2>
          <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
            Staff, mentors et membres avec rôles Discord autorisés peuvent accéder directement.
          </p>
          
          {!user ? (
            <button
              onClick={handleDiscordAccess}
              className="w-full rounded-lg bg-[#5865F2] hover:bg-[#4752C4] px-4 py-2 text-white font-medium transition-colors"
            >
              Se connecter avec Discord
            </button>
          ) : (
            <button
              onClick={handleDiscordAccess}
              disabled={loading}
              className="w-full rounded-lg bg-[#5865F2] hover:bg-[#4752C4] px-4 py-2 text-white font-medium transition-colors disabled:opacity-50"
            >
              {loading ? "Vérification..." : "Vérifier mes accès Discord"}
            </button>
          )}
        </div>
      </div>

      {user && !hasAccess && (
        <div className="rounded-lg border p-4 bg-blue-500/10 border-blue-500/30">
          <p className="text-sm text-blue-300">
            Connecté en tant que <strong>{user.username}</strong>. Si vous n'avez pas les rôles Discord nécessaires, 
            utilisez le mot de passe promo fourni par votre mentor.
          </p>
        </div>
      )}
    </div>
  );
}

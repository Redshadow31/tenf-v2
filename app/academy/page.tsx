"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { getDiscordUser } from "@/lib/discord";

export default function AcademyPage() {
  const [user, setUser] = useState<any>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAccess() {
      try {
        const discordUser = await getDiscordUser();
        setUser(discordUser);
        
        if (discordUser) {
          const response = await fetch("/api/academy/check-access", {
            cache: 'no-store',
          });
          if (response.ok) {
            const data = await response.json();
            setHasAccess(data.hasAccess || false);
          }
        }
      } catch (error) {
        console.error("Erreur vérification accès:", error);
      } finally {
        setLoading(false);
      }
    }
    checkAccess();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#9146ff]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-bold" style={{ color: 'var(--color-text)' }}>
          🎓 TENF Academy
        </h1>
        <p className="text-xl" style={{ color: 'var(--color-text-secondary)' }}>
          Programme de mentorat et d'accompagnement pour les créateurs TENF
        </p>
      </div>

      <div className="max-w-3xl mx-auto space-y-6">
        {/* Section d'accès */}
        {!user ? (
          <div className="rounded-lg border p-8 text-center" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
            <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
              Accès à TENF Academy
            </h2>
            <p className="mb-6" style={{ color: 'var(--color-text-secondary)' }}>
              Pour accéder à TENF Academy, vous devez être connecté avec Discord.
            </p>
            <Link
              href="/academy/access"
              className="inline-block rounded-lg bg-[#5865F2] hover:bg-[#4752C4] px-6 py-3 text-white font-medium transition-colors"
            >
              Se connecter avec Discord
            </Link>
          </div>
        ) : !hasAccess ? (
          <div className="rounded-lg border p-8 text-center" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
            <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
              Accès requis
            </h2>
            <p className="mb-6" style={{ color: 'var(--color-text-secondary)' }}>
              Vous devez obtenir un accès à TENF Academy pour voir le contenu.
            </p>
            <Link
              href="/academy/access"
              className="inline-block rounded-lg bg-[#9146ff] hover:bg-[#7c3aed] px-6 py-3 text-white font-medium transition-colors"
            >
              Demander l'accès
            </Link>
          </div>
        ) : (
          <div className="rounded-lg border p-8" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
            <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
              Bienvenue dans TENF Academy
            </h2>
            <p className="mb-6" style={{ color: 'var(--color-text-secondary)' }}>
              Vous avez accès à TENF Academy. Accédez à votre dashboard pour commencer votre parcours.
            </p>
            <Link
              href="/academy/dashboard"
              className="inline-block rounded-lg bg-[#9146ff] hover:bg-[#7c3aed] px-6 py-3 text-white font-medium transition-colors"
            >
              Accéder à mon dashboard
            </Link>
          </div>
        )}

        {/* Informations générales */}
        <div className="rounded-lg border p-6" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
            À propos de TENF Academy
          </h3>
          <p className="mb-4" style={{ color: 'var(--color-text-secondary)' }}>
            TENF Academy est un programme structuré d'accompagnement et de mentorat pour les créateurs de contenu. 
            Le programme propose un parcours de 15 jours avec des ressources, des sessions de groupe et un suivi personnalisé.
          </p>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Pour accéder au programme, vous devez soit obtenir un mot de passe de promo, soit avoir un rôle Discord autorisé.
          </p>
        </div>
      </div>
    </div>
  );
}

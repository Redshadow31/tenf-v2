"use client";

import { useState, useEffect } from "react";
import { getDiscordUser } from "@/lib/discord";
import { hasAdminDashboardAccess } from "@/lib/admin";

export default function FollowHubPage() {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAccess();
  }, []);

  async function checkAccess() {
    try {
      const user = await getDiscordUser();
      if (user) {
        const access = hasAdminDashboardAccess(user.id);
        setHasAccess(access);
      } else {
        setHasAccess(false);
      }
    } catch (error) {
      console.error("Erreur vérification accès:", error);
      setHasAccess(false);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="text-white">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#9146ff]"></div>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="text-white">
        <div className="bg-[#1a1a1d] border border-red-500 rounded-lg p-8">
          <h1 className="text-2xl font-bold text-red-400 mb-4">Accès refusé</h1>
          <p className="text-gray-400">
            Vous n'avez pas les permissions nécessaires pour accéder à cette section.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="text-white">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Suivi des Follow</h1>
        <p className="text-gray-400">
          Gestion et suivi des follows par membre du staff
        </p>
      </div>

      {/* Message fonctionnalité à venir */}
      <div className="bg-[#1a1a1d] border border-yellow-500/30 rounded-lg p-8">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">🚧</span>
          <h2 className="text-2xl font-semibold text-yellow-400">Fonctionnalité à venir</h2>
        </div>
        <p className="text-gray-400 mb-4">
          Cette section est en cours de développement. L'architecture est en place et prête pour l'implémentation future du suivi automatique des follows.
        </p>
        <p className="text-gray-500 text-sm">
          Utilisez le menu de navigation à gauche pour accéder aux pages individuelles de suivi des follows par membre du staff.
        </p>
      </div>
    </div>
  );
}
